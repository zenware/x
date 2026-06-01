package automation

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/zenware/forge/internal/ci"
	"github.com/zenware/forge/internal/domain"
	"github.com/zenware/forge/internal/vcs"
)

type Poller struct {
	db        *sql.DB
	providers map[domain.VCSType]vcs.Provider
	executor  ci.Executor
	logger    *log.Logger
	interval  time.Duration
}

func NewPoller(db *sql.DB, providers map[domain.VCSType]vcs.Provider, executor ci.Executor, logger *log.Logger, interval time.Duration) *Poller {
	return &Poller{
		db:        db,
		providers: providers,
		executor:  executor,
		logger:    logger,
		interval:  interval,
	}
}

func (p *Poller) Start(ctx context.Context) {
	if p.interval <= 0 {
		return
	}
	go func() {
		p.runOnce()
		ticker := time.NewTicker(p.interval)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				p.runOnce()
			}
		}
	}()
}

func (p *Poller) runOnce() {
	repos, err := p.repositories()
	if err != nil {
		p.logger.Printf("poll repositories: %v", err)
		return
	}

	for _, repo := range repos {
		provider, ok := p.providers[repo.VCSType]
		if !ok {
			continue
		}

		revisions, err := provider.Log(repo.Path, 1)
		if err != nil {
			p.logger.Printf("poll repo %s revisions: %v", repo.Name, err)
			continue
		}
		if len(revisions) == 0 {
			continue
		}

		head := revisions[0].CommitHash
		if head == "" {
			head = revisions[0].ChangeID
		}
		if strings.TrimSpace(head) == "" {
			continue
		}

		pipelines, err := p.pipelines(repo.ID)
		if err != nil {
			p.logger.Printf("poll repo %s pipelines: %v", repo.Name, err)
			continue
		}
		for _, pipeline := range pipelines {
			lastCommit, err := p.latestRunCommit(pipeline.ID)
			if err != nil {
				p.logger.Printf("poll pipeline %d latest run: %v", pipeline.ID, err)
				continue
			}
			if lastCommit == head {
				continue
			}

			result, err := p.db.Exec(`INSERT INTO pipeline_runs (pipeline_id, repo_id, status, trigger_type, commit_hash) VALUES (?, ?, ?, ?, ?)`, pipeline.ID, repo.ID, domain.RunStatusPending, "auto", head)
			if err != nil {
				p.logger.Printf("insert auto run for repo %s pipeline %s: %v", repo.Name, pipeline.Name, err)
				continue
			}
			runID, err := result.LastInsertId()
			if err != nil {
				p.logger.Printf("load auto run id for repo %s pipeline %s: %v", repo.Name, pipeline.Name, err)
				continue
			}
			run := &domain.PipelineRun{
				ID:          runID,
				PipelineID:  pipeline.ID,
				RepoID:      repo.ID,
				Status:      domain.RunStatusPending,
				TriggerType: "auto",
				CommitHash:  head,
			}
			if err := p.executor.Submit(run, &pipeline, repo.Path); err != nil {
				p.logger.Printf("submit auto run for repo %s pipeline %s: %v", repo.Name, pipeline.Name, err)
			}
		}
	}
}

func (p *Poller) repositories() ([]domain.Repository, error) {
	rows, err := p.db.Query(`SELECT id, name, description, path, vcs_type, created_at, updated_at FROM repositories ORDER BY name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	repos := make([]domain.Repository, 0)
	for rows.Next() {
		var repo domain.Repository
		var createdAt, updatedAt string
		if err := rows.Scan(&repo.ID, &repo.Name, &repo.Description, &repo.Path, &repo.VCSType, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		repos = append(repos, repo)
	}
	return repos, rows.Err()
}

func (p *Poller) pipelines(repoID int64) ([]domain.Pipeline, error) {
	rows, err := p.db.Query(`SELECT id, repo_id, name, definition, created_at, updated_at FROM pipelines WHERE repo_id = ? ORDER BY name ASC`, repoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	pipelines := make([]domain.Pipeline, 0)
	for rows.Next() {
		var pipeline domain.Pipeline
		var definition string
		var createdAt, updatedAt string
		if err := rows.Scan(&pipeline.ID, &pipeline.RepoID, &pipeline.Name, &definition, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		steps, err := p.pipelineSteps(pipeline.ID)
		if err != nil {
			return nil, err
		}
		if len(steps) == 0 && strings.TrimSpace(definition) != "" && definition != "{}" {
			var payload struct {
				Steps []domain.PipelineStep `json:"steps"`
			}
			if err := json.Unmarshal([]byte(definition), &payload); err == nil {
				steps = payload.Steps
			}
		}
		pipeline.Steps = steps
		if len(pipeline.Steps) > 0 {
			pipelines = append(pipelines, pipeline)
		}
	}
	return pipelines, rows.Err()
}

func (p *Poller) pipelineSteps(pipelineID int64) ([]domain.PipelineStep, error) {
	rows, err := p.db.Query(`SELECT name, command, artifacts FROM pipeline_steps WHERE pipeline_id = ? ORDER BY position ASC, id ASC`, pipelineID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	steps := make([]domain.PipelineStep, 0)
	for rows.Next() {
		var step domain.PipelineStep
		var artifactsJSON string
		if err := rows.Scan(&step.Name, &step.Command, &artifactsJSON); err != nil {
			return nil, err
		}
		if strings.TrimSpace(artifactsJSON) != "" {
			_ = json.Unmarshal([]byte(artifactsJSON), &step.Artifacts)
		}
		steps = append(steps, step)
	}
	return steps, rows.Err()
}

func (p *Poller) latestRunCommit(pipelineID int64) (string, error) {
	var commitHash string
	err := p.db.QueryRow(`SELECT commit_hash FROM pipeline_runs WHERE pipeline_id = ? ORDER BY id DESC LIMIT 1`, pipelineID).Scan(&commitHash)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return commitHash, err
}
