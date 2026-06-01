package local

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	artifactslocal "github.com/zenware/forge/internal/artifacts/local"
	"github.com/zenware/forge/internal/db"
	"github.com/zenware/forge/internal/domain"
)

func TestExecutorSubmitStoresArtifacts(t *testing.T) {
	dataDir := t.TempDir()
	database, err := db.Open(dataDir)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer database.Close()

	store := artifactslocal.New(dataDir, database)
	executor := New(database, store)

	repoDir := t.TempDir()
	repoResult, err := database.Exec(`INSERT INTO repositories (name, path, vcs_type) VALUES ('repo-success', ?, 'git')`, repoDir)
	if err != nil {
		t.Fatalf("insert repo: %v", err)
	}
	repoID, _ := repoResult.LastInsertId()
	pipelineResult, err := database.Exec(`INSERT INTO pipelines (repo_id, name, definition) VALUES (?, 'test', '{}')`, repoID)
	if err != nil {
		t.Fatalf("insert pipeline: %v", err)
	}
	pipelineID, _ := pipelineResult.LastInsertId()
	runResult, err := database.Exec(`INSERT INTO pipeline_runs (pipeline_id, repo_id, status, trigger_type, commit_hash) VALUES (?, ?, ?, 'manual', 'abc123')`, pipelineID, repoID, domain.RunStatusPending)
	if err != nil {
		t.Fatalf("insert run: %v", err)
	}
	runID, _ := runResult.LastInsertId()

	run := &domain.PipelineRun{ID: runID, PipelineID: pipelineID, RepoID: repoID, Status: domain.RunStatusPending}
	pipeline := &domain.Pipeline{
		ID:   1,
		Name: "test",
		Steps: []domain.PipelineStep{
			{Name: "build", Command: "printf hello > build.txt", Artifacts: []string{"build.txt"}},
		},
	}

	if err := executor.Submit(run, pipeline, repoDir); err != nil {
		t.Fatalf("submit run: %v", err)
	}

	deadline := time.Now().Add(5 * time.Second)
	for {
		var status string
		if err := database.QueryRow(`SELECT status FROM pipeline_runs WHERE id = ?`, runID).Scan(&status); err != nil {
			t.Fatalf("load run status: %v", err)
		}
		if status == string(domain.RunStatusPassed) {
			break
		}
		if time.Now().After(deadline) {
			t.Fatalf("timed out waiting for run completion; last status %q", status)
		}
		time.Sleep(50 * time.Millisecond)
	}

	var artifactCount int
	if err := database.QueryRow(`SELECT COUNT(*) FROM artifacts WHERE run_id = ?`, runID).Scan(&artifactCount); err != nil {
		t.Fatalf("count artifacts: %v", err)
	}
	if artifactCount != 1 {
		t.Fatalf("expected 1 artifact, got %d", artifactCount)
	}

	var storageKey string
	if err := database.QueryRow(`SELECT storage_key FROM artifacts WHERE run_id = ? LIMIT 1`, runID).Scan(&storageKey); err != nil {
		t.Fatalf("load artifact storage key: %v", err)
	}
	if _, err := filepath.Abs(filepath.Join(dataDir, storageKey)); err != nil {
		t.Fatalf("artifact path is invalid: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dataDir, storageKey)); err != nil {
		t.Fatalf("artifact was not written: %v", err)
	}
}

func TestExecutorLogsFailure(t *testing.T) {
	dataDir := t.TempDir()
	database, err := db.Open(dataDir)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer database.Close()

	store := artifactslocal.New(dataDir, database)
	executor := New(database, store)

	repoDir := t.TempDir()
	repoResult, err := database.Exec(`INSERT INTO repositories (name, path, vcs_type) VALUES ('repo-failure', ?, 'git')`, repoDir)
	if err != nil {
		t.Fatalf("insert repo: %v", err)
	}
	repoID, _ := repoResult.LastInsertId()
	pipelineResult, err := database.Exec(`INSERT INTO pipelines (repo_id, name, definition) VALUES (?, 'broken', '{}')`, repoID)
	if err != nil {
		t.Fatalf("insert pipeline: %v", err)
	}
	pipelineID, _ := pipelineResult.LastInsertId()
	runResult, err := database.Exec(`INSERT INTO pipeline_runs (pipeline_id, repo_id, status, trigger_type, commit_hash) VALUES (?, ?, ?, 'manual', 'abc123')`, pipelineID, repoID, domain.RunStatusPending)
	if err != nil {
		t.Fatalf("insert run: %v", err)
	}
	runID, _ := runResult.LastInsertId()

	run := &domain.PipelineRun{ID: runID, PipelineID: pipelineID, RepoID: repoID, Status: domain.RunStatusPending}
	pipeline := &domain.Pipeline{
		ID:   1,
		Name: "broken",
		Steps: []domain.PipelineStep{
			{Name: "fail", Command: "echo nope >&2; exit 2"},
		},
	}

	if err := executor.Submit(run, pipeline, t.TempDir()); err != nil {
		t.Fatalf("submit run: %v", err)
	}

	deadline := time.Now().Add(5 * time.Second)
	for {
		var status string
		if err := database.QueryRow(`SELECT status FROM pipeline_runs WHERE id = ?`, runID).Scan(&status); err != nil {
			t.Fatalf("load run status: %v", err)
		}
		if status == string(domain.RunStatusFailed) {
			break
		}
		if time.Now().After(deadline) {
			t.Fatalf("timed out waiting for failed run")
		}
		time.Sleep(50 * time.Millisecond)
	}

	var logs string
	if err := database.QueryRow(`SELECT log_output FROM jobs WHERE run_id = ? ORDER BY id ASC LIMIT 1`, runID).Scan(&logs); err != nil {
		t.Fatalf("load logs: %v", err)
	}
	if logs == "" || !strings.Contains(logs, "command failed") {
		t.Fatalf("expected failure logs to mention command failure, got %q", logs)
	}
}
