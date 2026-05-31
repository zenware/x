package local

import (
	"database/sql"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/zenware/forge/internal/domain"
)

type Store struct {
	baseDir string
	db      *sql.DB
}

func New(baseDir string, db *sql.DB) *Store {
	return &Store{baseDir: baseDir, db: db}
}

func (s *Store) Put(runID, jobID int64, name string, r io.Reader) (*domain.Artifact, error) {
	safeName := sanitizeName(name)
	relPath := filepath.ToSlash(filepath.Join("artifacts", fmt.Sprintf("%d", runID), fmt.Sprintf("%d", jobID), safeName))
	fullPath := filepath.Join(s.baseDir, filepath.FromSlash(relPath))
	if err := os.MkdirAll(filepath.Dir(fullPath), 0o755); err != nil {
		return nil, fmt.Errorf("create artifact dir: %w", err)
	}

	file, err := os.Create(fullPath)
	if err != nil {
		return nil, fmt.Errorf("create artifact file: %w", err)
	}
	defer file.Close()

	size, err := io.Copy(file, r)
	if err != nil {
		return nil, fmt.Errorf("write artifact: %w", err)
	}

	result, err := s.db.Exec(`INSERT INTO artifacts (job_id, run_id, name, storage_key, size_bytes) VALUES (?, ?, ?, ?, ?)`, jobID, runID, safeName, relPath, size)
	if err != nil {
		return nil, fmt.Errorf("insert artifact metadata: %w", err)
	}
	id, _ := result.LastInsertId()

	artifact := &domain.Artifact{ID: id, JobID: jobID, RunID: runID, Name: safeName, StorageKey: relPath, SizeBytes: size}
	return artifact, nil
}

func (s *Store) Get(storageKey string) (io.ReadCloser, error) {
	return os.Open(filepath.Join(s.baseDir, filepath.FromSlash(storageKey)))
}

func (s *Store) List(runID int64) ([]domain.Artifact, error) {
	rows, err := s.db.Query(`SELECT id, job_id, run_id, name, storage_key, size_bytes, created_at FROM artifacts WHERE run_id = ? ORDER BY created_at DESC`, runID)
	if err != nil {
		return nil, fmt.Errorf("query artifacts: %w", err)
	}
	defer rows.Close()

	artifacts := make([]domain.Artifact, 0)
	for rows.Next() {
		var artifact domain.Artifact
		var createdAt string
		if err := rows.Scan(&artifact.ID, &artifact.JobID, &artifact.RunID, &artifact.Name, &artifact.StorageKey, &artifact.SizeBytes, &createdAt); err != nil {
			return nil, fmt.Errorf("scan artifact: %w", err)
		}
		artifact.CreatedAt = parseDBTime(createdAt)
		artifacts = append(artifacts, artifact)
	}
	return artifacts, rows.Err()
}

func (s *Store) Delete(storageKey string) error {
	if _, err := s.db.Exec(`DELETE FROM artifacts WHERE storage_key = ?`, storageKey); err != nil {
		return fmt.Errorf("delete artifact metadata: %w", err)
	}
	if err := os.Remove(filepath.Join(s.baseDir, filepath.FromSlash(storageKey))); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("delete artifact file: %w", err)
	}
	return nil
}

func sanitizeName(name string) string {
	clean := filepath.ToSlash(filepath.Clean("/" + name))
	clean = strings.TrimPrefix(clean, "/")
	if clean == "." || clean == "" {
		return "artifact"
	}
	return clean
}

func parseDBTime(value string) time.Time {
	layouts := []string{"2006-01-02 15:04:05", time.RFC3339Nano, time.RFC3339, "2006-01-02 15:04:05 -0700", "2006-01-02 15:04:05 -07:00"}
	for _, layout := range layouts {
		parsed, err := time.Parse(layout, value)
		if err == nil {
			return parsed
		}
	}
	return time.Time{}
}
