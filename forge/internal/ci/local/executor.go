package local

import (
	"bytes"
	"database/sql"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/zenware/forge/internal/artifacts"
	"github.com/zenware/forge/internal/domain"
)

type Executor struct {
	db    *sql.DB
	store artifacts.Store
}

func New(db *sql.DB, store artifacts.Store) *Executor {
	return &Executor{db: db, store: store}
}

func (e *Executor) Submit(run *domain.PipelineRun, pipeline *domain.Pipeline, workDir string) error {
	if run == nil || pipeline == nil {
		return fmt.Errorf("run and pipeline are required")
	}
	go e.execute(run, pipeline, workDir)
	return nil
}

func (e *Executor) Cancel(runID int64) error {
	_, err := e.db.Exec(`UPDATE pipeline_runs SET status = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ? AND status IN (?, ?)`, domain.RunStatusFailed, runID, domain.RunStatusPending, domain.RunStatusRunning)
	if err != nil {
		return fmt.Errorf("cancel run %d: %w", runID, err)
	}
	return nil
}

func (e *Executor) Logs(jobID int64) (string, error) {
	var logs string
	if err := e.db.QueryRow(`SELECT log_output FROM jobs WHERE id = ?`, jobID).Scan(&logs); err != nil {
		return "", fmt.Errorf("load job logs: %w", err)
	}
	return logs, nil
}

func (e *Executor) execute(run *domain.PipelineRun, pipeline *domain.Pipeline, workDir string) {
	startedAt := time.Now().UTC()
	_, _ = e.db.Exec(`UPDATE pipeline_runs SET status = ?, started_at = ? WHERE id = ?`, domain.RunStatusRunning, startedAt.Format(time.RFC3339Nano), run.ID)

	for _, step := range pipeline.Steps {
		jobStarted := time.Now().UTC()
		result, err := e.db.Exec(`INSERT INTO jobs (run_id, step_name, status, started_at) VALUES (?, ?, ?, ?)`, run.ID, step.Name, domain.RunStatusRunning, jobStarted.Format(time.RFC3339Nano))
		if err != nil {
			_ = e.failRun(run.ID, fmt.Sprintf("failed to insert job %q: %v", step.Name, err))
			return
		}
		jobID, _ := result.LastInsertId()

		cmd := exec.Command("/bin/sh", "-c", step.Command)
		cmd.Dir = workDir
		var output bytes.Buffer
		cmd.Stdout = &output
		cmd.Stderr = &output
		runErr := cmd.Run()
		logOutput := output.String()
		jobFinished := time.Now().UTC().Format(time.RFC3339Nano)

		status := domain.RunStatusPassed
		if runErr != nil {
			status = domain.RunStatusFailed
			logOutput = logOutput + fmt.Sprintf("\ncommand failed: %v\n", runErr)
		}

		_, _ = e.db.Exec(`UPDATE jobs SET status = ?, log_output = ?, finished_at = ? WHERE id = ?`, status, logOutput, jobFinished, jobID)

		if runErr != nil {
			_ = e.failRun(run.ID, logOutput)
			return
		}

		for _, pattern := range step.Artifacts {
			matches, err := filepath.Glob(filepath.Join(workDir, pattern))
			if err != nil {
				continue
			}
			for _, match := range matches {
				info, err := os.Stat(match)
				if err != nil || info.IsDir() {
					continue
				}
				relName, err := filepath.Rel(workDir, match)
				if err != nil {
					relName = filepath.Base(match)
				}
				file, err := os.Open(match)
				if err != nil {
					continue
				}
				_, _ = e.store.Put(run.ID, jobID, relName, file)
				file.Close()
			}
		}
	}

	finishedAt := time.Now().UTC().Format(time.RFC3339Nano)
	_, _ = e.db.Exec(`UPDATE pipeline_runs SET status = ?, finished_at = ? WHERE id = ?`, domain.RunStatusPassed, finishedAt, run.ID)
}

func (e *Executor) failRun(runID int64, message string) error {
	finishedAt := time.Now().UTC().Format(time.RFC3339Nano)
	if _, err := e.db.Exec(`UPDATE pipeline_runs SET status = ?, finished_at = ? WHERE id = ?`, domain.RunStatusFailed, finishedAt, runID); err != nil {
		return err
	}
	_, _ = e.db.Exec(`INSERT INTO jobs (run_id, step_name, status, log_output, started_at, finished_at) VALUES (?, ?, ?, ?, ?, ?)`, runID, "runner", domain.RunStatusFailed, message, finishedAt, finishedAt)
	return nil
}
