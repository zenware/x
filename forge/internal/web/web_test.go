package web

import (
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	artifactslocal "github.com/zenware/forge/internal/artifacts/local"
	cilocal "github.com/zenware/forge/internal/ci/local"
	"github.com/zenware/forge/internal/config"
	"github.com/zenware/forge/internal/db"
	"github.com/zenware/forge/internal/domain"
	gitvcs "github.com/zenware/forge/internal/vcs/git"
	jjvcs "github.com/zenware/forge/internal/vcs/jj"
)

func TestEndToEndRegisterBrowseRunAndDownloadArtifact(t *testing.T) {
	restoreWD := chdirToProjectRoot(t)
	defer restoreWD()

	dataDir := t.TempDir()
	database, err := db.Open(dataDir)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer database.Close()

	repoDir := createGitRepo(t)
	cfg := &config.Config{Host: "127.0.0.1", Port: 3000, DataDir: dataDir, AdminPassword: "admin", PollInterval: 0}
	providers := map[domain.VCSType]VCSProvider{
		domain.VCSTypeJJ:  jjvcs.New(),
		domain.VCSTypeGit: gitvcs.New(),
	}
	store := artifactslocal.New(dataDir, database)
	executor := cilocal.New(database, store)
	handler, err := New(cfg, database, providers, executor, store)
	if err != nil {
		t.Fatalf("build handler: %v", err)
	}

	server := httptest.NewServer(handler)
	defer server.Close()

	jar, _ := cookiejar.New(nil)
	client := &http.Client{Jar: jar}

	loginResp, err := client.PostForm(server.URL+"/login", url.Values{
		"password": {"admin"},
	})
	if err != nil {
		t.Fatalf("login: %v", err)
	}
	loginResp.Body.Close()

	registerResp, err := client.PostForm(server.URL+"/settings/repos", url.Values{
		"name":        {"demo"},
		"description": {"demo repo"},
		"path":        {repoDir},
	})
	if err != nil {
		t.Fatalf("register repo: %v", err)
	}
	registerResp.Body.Close()

	body := getBody(t, client, server.URL+"/repos/demo")
	if !strings.Contains(body, "demo") || !strings.Contains(body, "Pipelines") {
		t.Fatalf("repo detail did not render expected content: %s", body)
	}

	pipelineBody := getBody(t, client, server.URL+"/repos/demo/pipelines")
	if !strings.Contains(pipelineBody, "default") {
		t.Fatalf("pipeline list missing imported pipeline: %s", pipelineBody)
	}

	var pipelineID int64
	if err := database.QueryRow(`SELECT id FROM pipelines WHERE repo_id = (SELECT id FROM repositories WHERE name = 'demo') LIMIT 1`).Scan(&pipelineID); err != nil {
		t.Fatalf("load pipeline id: %v", err)
	}

	triggerResp, err := client.PostForm(server.URL+fmt.Sprintf("/repos/demo/pipelines/%d/trigger", pipelineID), url.Values{})
	if err != nil {
		t.Fatalf("trigger pipeline: %v", err)
	}
	triggerResp.Body.Close()

	var runID int64
	deadline := time.Now().Add(10 * time.Second)
	for {
		err := database.QueryRow(`SELECT id FROM pipeline_runs WHERE pipeline_id = ? ORDER BY id DESC LIMIT 1`, pipelineID).Scan(&runID)
		if err == nil && runID > 0 {
			var status string
			if err := database.QueryRow(`SELECT status FROM pipeline_runs WHERE id = ?`, runID).Scan(&status); err != nil {
				t.Fatalf("load run status: %v", err)
			}
			if status == string(domain.RunStatusPassed) {
				break
			}
		}
		if time.Now().After(deadline) {
			t.Fatalf("timed out waiting for pipeline run")
		}
		time.Sleep(100 * time.Millisecond)
	}

	runBody := getBody(t, client, server.URL+fmt.Sprintf("/repos/demo/pipelines/%d/runs/%d", pipelineID, runID))
	if !strings.Contains(runBody, "run #") || !strings.Contains(runBody, "artifact.txt") {
		t.Fatalf("run detail missing run data or artifact link: %s", runBody)
	}

	var artifactID int64
	if err := database.QueryRow(`SELECT id FROM artifacts WHERE run_id = ? LIMIT 1`, runID).Scan(&artifactID); err != nil {
		t.Fatalf("load artifact id: %v", err)
	}
	artifactResp, err := client.Get(server.URL + fmt.Sprintf("/repos/demo/pipelines/%d/runs/%d/artifacts/%d", pipelineID, runID, artifactID))
	if err != nil {
		t.Fatalf("download artifact: %v", err)
	}
	defer artifactResp.Body.Close()
	content, _ := io.ReadAll(artifactResp.Body)
	if strings.TrimSpace(string(content)) != "alpha-artifact" {
		t.Fatalf("unexpected artifact content: %q", string(content))
	}
}

func createGitRepo(t *testing.T) string {
	t.Helper()
	repoDir := t.TempDir()
	if err := os.MkdirAll(filepath.Join(repoDir, ".forge"), 0o755); err != nil {
		t.Fatalf("mkdir forge dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(repoDir, ".forge", "pipeline.yml"), []byte(`name: default
steps:
  - name: build
    command: printf alpha-artifact > artifact.txt
    artifacts:
      - artifact.txt
`), 0o644); err != nil {
		t.Fatalf("write pipeline config: %v", err)
	}
	if err := os.WriteFile(filepath.Join(repoDir, "README.md"), []byte("# demo\n"), 0o644); err != nil {
		t.Fatalf("write repo file: %v", err)
	}

	runCmd(t, repoDir, "git", "init")
	runCmd(t, repoDir, "git", "config", "user.email", "forge@example.com")
	runCmd(t, repoDir, "git", "config", "user.name", "Forge Test")
	runCmd(t, repoDir, "git", "add", ".")
	runCmd(t, repoDir, "git", "commit", "-m", "initial commit")
	return repoDir
}

func runCmd(t *testing.T, dir string, bin string, args ...string) {
	t.Helper()
	cmd := exec.Command(bin, args...)
	cmd.Dir = dir
	if output, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("%s %s failed: %v\n%s", bin, strings.Join(args, " "), err, string(output))
	}
}

func getBody(t *testing.T, client *http.Client, rawURL string) string {
	t.Helper()
	resp, err := client.Get(rawURL)
	if err != nil {
		t.Fatalf("GET %s: %v", rawURL, err)
	}
	defer resp.Body.Close()
	content, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read %s: %v", rawURL, err)
	}
	return string(content)
}

func chdirToProjectRoot(t *testing.T) func() {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatalf("locate current file")
	}
	root := filepath.Join(filepath.Dir(file), "..", "..")
	previous, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}
	if err := os.Chdir(root); err != nil {
		t.Fatalf("chdir to project root: %v", err)
	}
	return func() {
		_ = os.Chdir(previous)
	}
}
