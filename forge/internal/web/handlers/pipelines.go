package handlers

import (
	"database/sql"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/zenware/forge/internal/domain"
)

type PipelineListPage struct {
	LayoutData
	Repository domain.Repository
	Pipelines  []domain.Pipeline
}

type PipelineRunsPage struct {
	LayoutData
	Repository domain.Repository
	Pipeline   domain.Pipeline
	Runs       []domain.PipelineRun
}

type PipelineRunDetailPage struct {
	LayoutData
	Repository domain.Repository
	Pipeline   domain.Pipeline
	Run        domain.PipelineRun
	Jobs       []domain.Job
	Artifacts  []domain.Artifact
}

func (a *App) ListPipelines(w http.ResponseWriter, r *http.Request) {
	repo, err := a.repositoryByName(chi.URLParam(r, "name"))
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, sql.ErrNoRows) {
			status = http.StatusNotFound
		}
		http.Error(w, err.Error(), status)
		return
	}
	rows, err := a.db.Query(`SELECT id, repo_id, name, definition, created_at, updated_at FROM pipelines WHERE repo_id = ? ORDER BY name ASC`, repo.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	pipelines := make([]domain.Pipeline, 0)
	for rows.Next() {
		var pipeline domain.Pipeline
		var createdAt, updatedAt, definition string
		if err := rows.Scan(&pipeline.ID, &pipeline.RepoID, &pipeline.Name, &definition, &createdAt, &updatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		pipeline.CreatedAt = parseTimeString(createdAt)
		pipeline.UpdatedAt = parseTimeString(updatedAt)
		pipeline.Steps, _ = a.loadPipelineSteps(pipeline.ID)
		pipelines = append(pipelines, pipeline)
	}
	a.render(w, "pipelines/list.html", PipelineListPage{LayoutData: LayoutData{Title: repo.Name + " pipelines", ContentTemplate: "pipelines/list.content"}, Repository: repo, Pipelines: pipelines})
}

func (a *App) ListRuns(w http.ResponseWriter, r *http.Request) {
	repo, pipeline, ok := a.pipelineFromRequest(w, r)
	if !ok {
		return
	}
	rows, err := a.db.Query(`SELECT id, pipeline_id, repo_id, status, trigger_type, commit_hash, started_at, finished_at, created_at FROM pipeline_runs WHERE pipeline_id = ? ORDER BY created_at DESC`, pipeline.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	runs := make([]domain.PipelineRun, 0)
	for rows.Next() {
		run, err := scanPipelineRun(rows)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		runs = append(runs, run)
	}
	a.render(w, "pipelines/runs.html", PipelineRunsPage{LayoutData: LayoutData{Title: pipeline.Name + " runs", ContentTemplate: "pipelines/runs.content"}, Repository: repo, Pipeline: pipeline, Runs: runs})
}

func (a *App) RunDetail(w http.ResponseWriter, r *http.Request) {
	repo, pipeline, ok := a.pipelineFromRequest(w, r)
	if !ok {
		return
	}
	runID, err := strconv.ParseInt(chi.URLParam(r, "rid"), 10, 64)
	if err != nil {
		http.Error(w, "invalid run id", http.StatusBadRequest)
		return
	}
	run, err := a.runByID(pipeline.ID, runID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, sql.ErrNoRows) {
			status = http.StatusNotFound
		}
		http.Error(w, err.Error(), status)
		return
	}
	jobs, err := a.jobsForRun(run.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	artifacts, err := a.artifactStore.List(run.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	a.render(w, "pipelines/run_detail.html", PipelineRunDetailPage{LayoutData: LayoutData{Title: fmt.Sprintf("%s run #%d", pipeline.Name, run.ID), ContentTemplate: "pipelines/run_detail.content"}, Repository: repo, Pipeline: pipeline, Run: run, Jobs: jobs, Artifacts: artifacts})
}

func (a *App) TriggerPipeline(w http.ResponseWriter, r *http.Request) {
	repo, pipeline, ok := a.pipelineFromRequest(w, r)
	if !ok {
		return
	}
	commitHash := ""
	if provider, err := a.providerForRepo(repo); err == nil {
		if revisions, err := provider.Log(repo.Path, 1); err == nil && len(revisions) > 0 {
			commitHash = revisions[0].CommitHash
			if commitHash == "" {
				commitHash = revisions[0].ChangeID
			}
		}
	}
	result, err := a.db.Exec(`INSERT INTO pipeline_runs (pipeline_id, repo_id, status, trigger_type, commit_hash) VALUES (?, ?, ?, ?, ?)`, pipeline.ID, repo.ID, domain.RunStatusPending, "manual", commitHash)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	runID, _ := result.LastInsertId()
	run := &domain.PipelineRun{ID: runID, PipelineID: pipeline.ID, RepoID: repo.ID, Status: domain.RunStatusPending, TriggerType: "manual", CommitHash: commitHash}
	if err := a.executor.Submit(run, &pipeline, repo.Path); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, fmt.Sprintf("/repos/%s/pipelines/%d/runs/%d", repo.Name, pipeline.ID, runID), http.StatusFound)
}

func (a *App) DownloadArtifact(w http.ResponseWriter, r *http.Request) {
	_, _, ok := a.pipelineFromRequest(w, r)
	if !ok {
		return
	}
	runID, err := strconv.ParseInt(chi.URLParam(r, "rid"), 10, 64)
	if err != nil {
		http.Error(w, "invalid run id", http.StatusBadRequest)
		return
	}
	artifactID, err := strconv.ParseInt(chi.URLParam(r, "aid"), 10, 64)
	if err != nil {
		http.Error(w, "invalid artifact id", http.StatusBadRequest)
		return
	}
	var artifact domain.Artifact
	var createdAt string
	row := a.db.QueryRow(`SELECT id, job_id, run_id, name, storage_key, size_bytes, created_at FROM artifacts WHERE id = ? AND run_id = ?`, artifactID, runID)
	if err := row.Scan(&artifact.ID, &artifact.JobID, &artifact.RunID, &artifact.Name, &artifact.StorageKey, &artifact.SizeBytes, &createdAt); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, sql.ErrNoRows) {
			status = http.StatusNotFound
		}
		http.Error(w, err.Error(), status)
		return
	}
	reader, err := a.artifactStore.Get(artifact.StorageKey)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer reader.Close()
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, artifact.Name))
	w.Header().Set("Content-Type", "application/octet-stream")
	_, _ = io.Copy(w, reader)
}

func (a *App) pipelineFromRequest(w http.ResponseWriter, r *http.Request) (domain.Repository, domain.Pipeline, bool) {
	repo, err := a.repositoryByName(chi.URLParam(r, "name"))
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, sql.ErrNoRows) {
			status = http.StatusNotFound
		}
		http.Error(w, err.Error(), status)
		return domain.Repository{}, domain.Pipeline{}, false
	}
	pipelineID, err := strconv.ParseInt(chi.URLParam(r, "pid"), 10, 64)
	if err != nil {
		http.Error(w, "invalid pipeline id", http.StatusBadRequest)
		return domain.Repository{}, domain.Pipeline{}, false
	}
	pipeline, err := a.pipelineByID(repo.ID, pipelineID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, sql.ErrNoRows) {
			status = http.StatusNotFound
		}
		http.Error(w, err.Error(), status)
		return domain.Repository{}, domain.Pipeline{}, false
	}
	return repo, pipeline, true
}

func (a *App) runByID(pipelineID, runID int64) (domain.PipelineRun, error) {
	row := a.db.QueryRow(`SELECT id, pipeline_id, repo_id, status, trigger_type, commit_hash, started_at, finished_at, created_at FROM pipeline_runs WHERE id = ? AND pipeline_id = ?`, runID, pipelineID)
	return scanPipelineRun(row)
}

func (a *App) jobsForRun(runID int64) ([]domain.Job, error) {
	rows, err := a.db.Query(`SELECT id, run_id, step_name, status, log_output, started_at, finished_at FROM jobs WHERE run_id = ? ORDER BY id ASC`, runID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	jobs := make([]domain.Job, 0)
	for rows.Next() {
		var job domain.Job
		var startedAt, finishedAt sql.NullString
		if err := rows.Scan(&job.ID, &job.RunID, &job.StepName, &job.Status, &job.LogOutput, &startedAt, &finishedAt); err != nil {
			return nil, err
		}
		job.StartedAt = parseNullableTime(startedAt)
		job.FinishedAt = parseNullableTime(finishedAt)
		jobs = append(jobs, job)
	}
	return jobs, rows.Err()
}

func scanPipelineRun(scanner interface{ Scan(dest ...any) error }) (domain.PipelineRun, error) {
	var run domain.PipelineRun
	var startedAt, finishedAt sql.NullString
	var createdAt string
	if err := scanner.Scan(&run.ID, &run.PipelineID, &run.RepoID, &run.Status, &run.TriggerType, &run.CommitHash, &startedAt, &finishedAt, &createdAt); err != nil {
		return run, err
	}
	run.StartedAt = parseNullableTime(startedAt)
	run.FinishedAt = parseNullableTime(finishedAt)
	run.CreatedAt = parseTimeString(createdAt)
	return run, nil
}
