package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"net/http"
	"path/filepath"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/zenware/forge/internal/artifacts"
	"github.com/zenware/forge/internal/ci"
	"github.com/zenware/forge/internal/config"
	"github.com/zenware/forge/internal/domain"
	"github.com/zenware/forge/internal/vcs"
)

type App struct {
	db            *sql.DB
	templates     *template.Template
	cfg           *config.Config
	providers     map[domain.VCSType]vcs.Provider
	executor      ci.Executor
	artifactStore artifacts.Store
}

type LayoutData struct {
	Title           string
	ContentTemplate string
}

func New(db *sql.DB, templates *template.Template, cfg *config.Config, providers map[domain.VCSType]vcs.Provider, executor ci.Executor, store artifacts.Store) *App {
	return &App{db: db, templates: templates, cfg: cfg, providers: providers, executor: executor, artifactStore: store}
}

func (a *App) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("forge_session")
		if err != nil || cookie.Value != "authenticated" {
			http.Redirect(w, r, "/login", http.StatusFound)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (a *App) LoginPage(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie("forge_session"); err == nil && cookie.Value == "authenticated" {
		http.Redirect(w, r, "/repos", http.StatusFound)
		return
	}
	message := ""
	if r.URL.Query().Get("error") != "" {
		message = `<p class="mb-4 rounded bg-rose-100 px-3 py-2 text-sm text-rose-700">Invalid password</p>`
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = fmt.Fprintf(w, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Forge Login</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100">
  <div class="mx-auto flex min-h-screen max-w-md items-center px-6">
    <form method="post" action="/login" class="w-full rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
      <h1 class="text-2xl font-semibold">Forge</h1>
      <p class="mt-2 text-sm text-slate-400">Sign in with the admin password to manage repositories, changes, and pipelines.</p>
      %s
      <label class="mt-6 block text-sm font-medium text-slate-300">Admin password</label>
      <input type="password" name="password" class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none" autofocus>
      <button type="submit" class="mt-6 w-full rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-400">Sign in</button>
    </form>
  </div>
</body>
</html>`, message)
}

func (a *App) Login(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}
	if r.FormValue("password") != a.cfg.AdminPassword {
		http.Redirect(w, r, "/login?error=1", http.StatusFound)
		return
	}
	http.SetCookie(w, &http.Cookie{Name: "forge_session", Value: "authenticated", Path: "/", HttpOnly: true, SameSite: http.SameSiteLaxMode})
	http.Redirect(w, r, "/repos", http.StatusFound)
}

func (a *App) render(w http.ResponseWriter, name string, data any) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	tmpl := a.templates
	if contentName := contentTemplateName(data); contentName != "" {
		clone, err := a.templates.Clone()
		if err != nil {
			http.Error(w, fmt.Sprintf("clone templates: %v", err), http.StatusInternalServerError)
			return
		}
		if _, err := clone.Parse(`{{define "content"}}{{template "` + contentName + `" .}}{{end}}`); err != nil {
			http.Error(w, fmt.Sprintf("prepare content template: %v", err), http.StatusInternalServerError)
			return
		}
		tmpl = clone
	}
	if err := tmpl.ExecuteTemplate(w, name, data); err != nil {
		http.Error(w, fmt.Sprintf("render template: %v", err), http.StatusInternalServerError)
	}
}

func contentTemplateName(data any) string {
	value := reflect.Indirect(reflect.ValueOf(data))
	if !value.IsValid() {
		return ""
	}
	field := value.FieldByName("ContentTemplate")
	if field.IsValid() && field.Kind() == reflect.String {
		return field.String()
	}
	return ""
}

func (a *App) repositories() ([]domain.Repository, error) {
	rows, err := a.db.Query(`SELECT id, name, description, path, vcs_type, created_at, updated_at FROM repositories ORDER BY name ASC`)
	if err != nil {
		return nil, fmt.Errorf("query repositories: %w", err)
	}
	defer rows.Close()

	repos := make([]domain.Repository, 0)
	for rows.Next() {
		repo, err := scanRepository(rows)
		if err != nil {
			return nil, err
		}
		repos = append(repos, repo)
	}
	return repos, rows.Err()
}

func (a *App) repositoryByName(name string) (domain.Repository, error) {
	row := a.db.QueryRow(`SELECT id, name, description, path, vcs_type, created_at, updated_at FROM repositories WHERE name = ?`, name)
	return scanRepository(row)
}

func (a *App) providerForRepo(repo domain.Repository) (vcs.Provider, error) {
	if provider, ok := a.providers[repo.VCSType]; ok {
		return provider, nil
	}
	return nil, fmt.Errorf("no provider for vcs type %q", repo.VCSType)
}

func (a *App) detectProvider(repoPath string) (domain.VCSType, error) {
	absPath, err := filepath.Abs(repoPath)
	if err != nil {
		return "", err
	}
	if provider, ok := a.providers[domain.VCSTypeJJ]; ok && provider.Detect(absPath) {
		return domain.VCSTypeJJ, nil
	}
	if provider, ok := a.providers[domain.VCSTypeGit]; ok && provider.Detect(absPath) {
		return domain.VCSTypeGit, nil
	}
	return "", fmt.Errorf("no VCS provider detected for %s", absPath)
}

func (a *App) pipelineByID(repoID, pipelineID int64) (domain.Pipeline, error) {
	var pipeline domain.Pipeline
	var createdAt, updatedAt, definition string
	row := a.db.QueryRow(`SELECT id, repo_id, name, definition, created_at, updated_at FROM pipelines WHERE repo_id = ? AND id = ?`, repoID, pipelineID)
	if err := row.Scan(&pipeline.ID, &pipeline.RepoID, &pipeline.Name, &definition, &createdAt, &updatedAt); err != nil {
		return pipeline, err
	}
	pipeline.CreatedAt = parseTimeString(createdAt)
	pipeline.UpdatedAt = parseTimeString(updatedAt)
	steps, err := a.loadPipelineSteps(pipeline.ID)
	if err != nil {
		return pipeline, err
	}
	if len(steps) == 0 && strings.TrimSpace(definition) != "" && definition != "{}" {
		var payload struct {
			Steps []domain.PipelineStep `json:"steps"`
		}
		_ = json.Unmarshal([]byte(definition), &payload)
		steps = payload.Steps
	}
	pipeline.Steps = steps
	return pipeline, nil
}

func (a *App) loadPipelineSteps(pipelineID int64) ([]domain.PipelineStep, error) {
	rows, err := a.db.Query(`SELECT name, command, artifacts FROM pipeline_steps WHERE pipeline_id = ? ORDER BY position ASC, id ASC`, pipelineID)
	if err != nil {
		return nil, fmt.Errorf("query pipeline steps: %w", err)
	}
	defer rows.Close()

	steps := make([]domain.PipelineStep, 0)
	for rows.Next() {
		var step domain.PipelineStep
		var artifactsJSON string
		if err := rows.Scan(&step.Name, &step.Command, &artifactsJSON); err != nil {
			return nil, fmt.Errorf("scan pipeline step: %w", err)
		}
		if strings.TrimSpace(artifactsJSON) != "" {
			_ = json.Unmarshal([]byte(artifactsJSON), &step.Artifacts)
		}
		steps = append(steps, step)
	}
	return steps, rows.Err()
}

func (a *App) changeRequestByNumber(repoID, number int64) (domain.ChangeRequest, error) {
	var cr domain.ChangeRequest
	var createdAt, updatedAt string
	row := a.db.QueryRow(`SELECT id, repo_id, number, title, description, source_bookmark, target_bookmark, status, created_at, updated_at FROM change_requests WHERE repo_id = ? AND number = ?`, repoID, number)
	if err := row.Scan(&cr.ID, &cr.RepoID, &cr.Number, &cr.Title, &cr.Description, &cr.SourceBookmark, &cr.TargetBookmark, &cr.Status, &createdAt, &updatedAt); err != nil {
		return cr, err
	}
	cr.CreatedAt = parseTimeString(createdAt)
	cr.UpdatedAt = parseTimeString(updatedAt)
	return cr, nil
}

func (a *App) latestReviewRound(crID int64) (*domain.ReviewRound, error) {
	var round domain.ReviewRound
	var createdAt string
	row := a.db.QueryRow(`SELECT id, cr_id, round_num, tip_commit, created_at FROM review_rounds WHERE cr_id = ? ORDER BY round_num DESC LIMIT 1`, crID)
	if err := row.Scan(&round.ID, &round.CRID, &round.RoundNum, &round.TipCommit, &createdAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	round.CreatedAt = parseTimeString(createdAt)
	return &round, nil
}

func scanRepository(scanner interface{ Scan(dest ...any) error }) (domain.Repository, error) {
	var repo domain.Repository
	var createdAt, updatedAt, vcsType string
	if err := scanner.Scan(&repo.ID, &repo.Name, &repo.Description, &repo.Path, &vcsType, &createdAt, &updatedAt); err != nil {
		return repo, err
	}
	repo.VCSType = domain.VCSType(vcsType)
	repo.CreatedAt = parseTimeString(createdAt)
	repo.UpdatedAt = parseTimeString(updatedAt)
	return repo, nil
}

func parsePage(raw string) int {
	page, err := strconv.Atoi(raw)
	if err != nil || page < 1 {
		return 1
	}
	return page
}

func parseTimeString(value string) time.Time {
	layouts := []string{time.RFC3339Nano, time.RFC3339, "2006-01-02 15:04:05", "2006-01-02 15:04:05 -0700", "2006-01-02 15:04:05 -07:00"}
	for _, layout := range layouts {
		if ts, err := time.Parse(layout, value); err == nil {
			return ts
		}
	}
	return time.Time{}
}

func parseNullableTime(value sql.NullString) *time.Time {
	if !value.Valid || strings.TrimSpace(value.String) == "" {
		return nil
	}
	ts := parseTimeString(value.String)
	if ts.IsZero() {
		return nil
	}
	return &ts
}
