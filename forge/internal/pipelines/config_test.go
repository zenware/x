package pipelines

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadTopLevelPipeline(t *testing.T) {
	repoDir := t.TempDir()
	configDir := filepath.Join(repoDir, ".forge")
	if err := os.MkdirAll(configDir, 0o755); err != nil {
		t.Fatalf("mkdir config dir: %v", err)
	}
	content := []byte(`name: default
steps:
  - name: test
    command: go test ./...
    artifacts:
      - coverage.out
`)
	if err := os.WriteFile(filepath.Join(configDir, "pipeline.yml"), content, 0o644); err != nil {
		t.Fatalf("write config: %v", err)
	}

	definitions, err := Load(repoDir)
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if len(definitions) != 1 {
		t.Fatalf("expected 1 pipeline, got %d", len(definitions))
	}
	if definitions[0].Name != "default" {
		t.Fatalf("expected pipeline name default, got %q", definitions[0].Name)
	}
	if len(definitions[0].Steps) != 1 || definitions[0].Steps[0].Command != "go test ./..." {
		t.Fatalf("unexpected steps: %#v", definitions[0].Steps)
	}
}

func TestLoadPipelineList(t *testing.T) {
	repoDir := t.TempDir()
	configDir := filepath.Join(repoDir, ".forge")
	if err := os.MkdirAll(configDir, 0o755); err != nil {
		t.Fatalf("mkdir config dir: %v", err)
	}
	content := []byte(`pipelines:
  - name: lint
    steps:
      - name: lint
        command: golangci-lint run
  - name: test
    steps:
      - name: test
        command: go test ./...
`)
	if err := os.WriteFile(filepath.Join(configDir, "pipeline.yml"), content, 0o644); err != nil {
		t.Fatalf("write config: %v", err)
	}

	definitions, err := Load(repoDir)
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if len(definitions) != 2 {
		t.Fatalf("expected 2 pipelines, got %d", len(definitions))
	}
	if definitions[0].Name != "lint" || definitions[1].Name != "test" {
		t.Fatalf("unexpected pipeline names: %#v", definitions)
	}
}
