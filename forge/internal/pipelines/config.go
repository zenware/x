package pipelines

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/zenware/forge/internal/domain"
	"gopkg.in/yaml.v3"
)

const defaultConfigPath = ".forge/pipeline.yml"

type fileDefinition struct {
	Name      string                `yaml:"name"`
	Steps     []domain.PipelineStep `yaml:"steps"`
	Pipelines []namedPipeline       `yaml:"pipelines"`
}

type namedPipeline struct {
	Name  string                `yaml:"name"`
	Steps []domain.PipelineStep `yaml:"steps"`
}

// Load reads pipeline definitions from a repository.
func Load(repoPath string) ([]domain.Pipeline, error) {
	configPath := filepath.Join(repoPath, defaultConfigPath)
	content, err := os.ReadFile(configPath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, nil
		}
		return nil, fmt.Errorf("read %s: %w", configPath, err)
	}

	var definition fileDefinition
	if err := yaml.Unmarshal(content, &definition); err != nil {
		return nil, fmt.Errorf("parse %s: %w", configPath, err)
	}

	pipelines := make([]domain.Pipeline, 0, len(definition.Pipelines)+1)
	if len(definition.Pipelines) > 0 {
		for _, item := range definition.Pipelines {
			if strings.TrimSpace(item.Name) == "" {
				return nil, fmt.Errorf("%s contains a pipeline with no name", defaultConfigPath)
			}
			if len(item.Steps) == 0 {
				return nil, fmt.Errorf("%s pipeline %q has no steps", defaultConfigPath, item.Name)
			}
			if err := validateSteps(item.Steps, item.Name); err != nil {
				return nil, err
			}
			pipelines = append(pipelines, domain.Pipeline{Name: strings.TrimSpace(item.Name), Steps: item.Steps})
		}
	}

	if strings.TrimSpace(definition.Name) != "" || len(definition.Steps) > 0 {
		name := strings.TrimSpace(definition.Name)
		if name == "" {
			name = "default"
		}
		if len(definition.Steps) == 0 {
			return nil, fmt.Errorf("%s pipeline %q has no steps", defaultConfigPath, name)
		}
		if err := validateSteps(definition.Steps, name); err != nil {
			return nil, err
		}
		pipelines = append(pipelines, domain.Pipeline{Name: name, Steps: definition.Steps})
	}

	return pipelines, nil
}

func validateSteps(steps []domain.PipelineStep, pipelineName string) error {
	for i, step := range steps {
		if strings.TrimSpace(step.Name) == "" {
			return fmt.Errorf("pipeline %q step %d is missing a name", pipelineName, i+1)
		}
		if strings.TrimSpace(step.Command) == "" {
			return fmt.Errorf("pipeline %q step %q is missing a command", pipelineName, step.Name)
		}
	}
	return nil
}

// Sync replaces DB pipeline definitions for a repository with definitions from disk.
func Sync(db *sql.DB, repoID int64, definitions []domain.Pipeline) error {
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("begin pipeline sync: %w", err)
	}
	defer tx.Rollback()

	rows, err := tx.Query(`SELECT id FROM pipelines WHERE repo_id = ?`, repoID)
	if err != nil {
		return fmt.Errorf("query existing pipelines: %w", err)
	}
	existingIDs := make([]int64, 0)
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return fmt.Errorf("scan existing pipeline: %w", err)
		}
		existingIDs = append(existingIDs, id)
	}
	if err := rows.Close(); err != nil {
		return fmt.Errorf("close pipeline rows: %w", err)
	}

	for _, id := range existingIDs {
		if _, err := tx.Exec(`DELETE FROM pipeline_steps WHERE pipeline_id = ?`, id); err != nil {
			return fmt.Errorf("delete pipeline steps: %w", err)
		}
	}
	if _, err := tx.Exec(`DELETE FROM pipelines WHERE repo_id = ?`, repoID); err != nil {
		return fmt.Errorf("delete pipelines: %w", err)
	}

	for _, pipeline := range definitions {
		definitionJSON, err := json.Marshal(struct {
			Steps []domain.PipelineStep `json:"steps"`
		}{Steps: pipeline.Steps})
		if err != nil {
			return fmt.Errorf("marshal pipeline %q: %w", pipeline.Name, err)
		}
		result, err := tx.Exec(`INSERT INTO pipelines (repo_id, name, definition) VALUES (?, ?, ?)`, repoID, pipeline.Name, string(definitionJSON))
		if err != nil {
			return fmt.Errorf("insert pipeline %q: %w", pipeline.Name, err)
		}
		pipelineID, err := result.LastInsertId()
		if err != nil {
			return fmt.Errorf("load pipeline id for %q: %w", pipeline.Name, err)
		}
		for index, step := range pipeline.Steps {
			artifactsJSON, err := json.Marshal(step.Artifacts)
			if err != nil {
				return fmt.Errorf("marshal artifacts for pipeline %q step %q: %w", pipeline.Name, step.Name, err)
			}
			if _, err := tx.Exec(`INSERT INTO pipeline_steps (pipeline_id, name, command, artifacts, position) VALUES (?, ?, ?, ?, ?)`, pipelineID, step.Name, step.Command, string(artifactsJSON), index); err != nil {
				return fmt.Errorf("insert pipeline step %q: %w", step.Name, err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit pipeline sync: %w", err)
	}
	return nil
}
