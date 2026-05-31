package web

import (
	"database/sql"
	"fmt"
	"html/template"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/zenware/forge/internal/artifacts"
	"github.com/zenware/forge/internal/ci"
	"github.com/zenware/forge/internal/config"
	"github.com/zenware/forge/internal/domain"
	"github.com/zenware/forge/internal/vcs"
	"github.com/zenware/forge/internal/web/handlers"
)

type VCSProvider = vcs.Provider

func New(cfg *config.Config, db *sql.DB, providers map[domain.VCSType]VCSProvider, executor ci.Executor, store artifacts.Store) (http.Handler, error) {
	templates, err := loadTemplates()
	if err != nil {
		return nil, err
	}

	app := handlers.New(db, templates, cfg, providers, executor, store)
	r := chi.NewRouter()
	r.Handle("/static/*", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	r.Get("/login", app.LoginPage)
	r.Post("/login", app.Login)
	protected := chi.NewRouter()
	protected.Use(app.AuthMiddleware)
	protected.Get("/", app.Home)
	protected.Get("/settings", app.Settings)
	protected.Post("/settings/repos", app.RegisterRepo)
	protected.Delete("/settings/repos/{id}", app.DeleteRepo)
	protected.Route("/repos", func(r chi.Router) {
		r.Get("/", app.ListRepos)
		r.Route("/{name}", func(r chi.Router) {
			r.Get("/", app.RepoDetail)
			r.Get("/log", app.RepoLog)
			r.Get("/rev/{ref}", app.RevisionDetail)
			r.Get("/tree/{ref}", app.RepoTree)
			r.Get("/tree/{ref}/{path:.*}", app.RepoTree)
			r.Get("/blob/{ref}/{path:.*}", app.RepoBlob)
			r.Get("/changes", app.ListChanges)
			r.Get("/changes/new", app.NewChange)
			r.Post("/changes", app.CreateChange)
			r.Get("/changes/{number}", app.ChangeDetail)
			r.Post("/changes/{number}/reviews", app.SubmitReview)
			r.Post("/changes/{number}/comments", app.AddComment)
			r.Post("/changes/{number}/comments/{id}/resolve", app.ResolveComment)
			r.Get("/pipelines", app.ListPipelines)
			r.Get("/pipelines/{pid}/runs", app.ListRuns)
			r.Get("/pipelines/{pid}/runs/{rid}", app.RunDetail)
			r.Post("/pipelines/{pid}/trigger", app.TriggerPipeline)
			r.Get("/pipelines/{pid}/runs/{rid}/artifacts/{aid}", app.DownloadArtifact)
		})
	})
	r.Mount("/", protected)
	return r, nil
}

func loadTemplates() (*template.Template, error) {
	patterns := []string{
		"internal/web/templates/*.html",
		"internal/web/templates/*/*.html",
	}
	files := make([]string, 0)
	for _, pattern := range patterns {
		matches, err := filepath.Glob(pattern)
		if err != nil {
			return nil, fmt.Errorf("glob templates: %w", err)
		}
		files = append(files, matches...)
	}
	funcs := template.FuncMap{
		"formatTime": func(t time.Time) string {
			if t.IsZero() {
				return "—"
			}
			return t.Local().Format("2006-01-02 15:04")
		},
		"formatTimePtr": func(t *time.Time) string {
			if t == nil || t.IsZero() {
				return "—"
			}
			return t.Local().Format("2006-01-02 15:04")
		},
		"join":      strings.Join,
		"add":       func(a, b int) int { return a + b },
		"sub":       func(a, b int) int { return a - b },
		"shortHash": shortHash,
		"statusClass": func(status string) string {
			switch status {
			case "passed", "approved", "open":
				return "bg-emerald-100 text-emerald-700"
			case "running", "pending", "commented":
				return "bg-amber-100 text-amber-700"
			case "failed", "changes_requested", "closed":
				return "bg-rose-100 text-rose-700"
			default:
				return "bg-slate-100 text-slate-700"
			}
		},
	}
	return template.New("all").Funcs(funcs).ParseFiles(files...)
}

func shortHash(value string) string {
	if len(value) > 12 {
		return value[:12]
	}
	if strings.TrimSpace(value) == "" {
		return "—"
	}
	return value
}
