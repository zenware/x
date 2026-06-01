package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/zenware/forge/internal/domain"
)

type SettingsPage struct {
	LayoutData
	Repositories []domain.Repository
	Host         string
	Port         int
	DataDir      string
	PollInterval string
}

func (a *App) Settings(w http.ResponseWriter, r *http.Request) {
	repos, err := a.repositories()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	a.render(w, "settings/index.html", SettingsPage{LayoutData: LayoutData{Title: "Settings", ContentTemplate: "settings/index.content"}, Repositories: repos, Host: a.cfg.Host, Port: a.cfg.Port, DataDir: a.cfg.DataDir, PollInterval: a.cfg.PollInterval.String()})
}

func (a *App) RegisterRepo(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}
	name := strings.TrimSpace(r.FormValue("name"))
	repoPath := strings.TrimSpace(r.FormValue("path"))
	description := strings.TrimSpace(r.FormValue("description"))
	vcsType := strings.TrimSpace(r.FormValue("vcs_type"))
	if name == "" || repoPath == "" {
		http.Error(w, "name and path are required", http.StatusBadRequest)
		return
	}
	absPath, err := filepath.Abs(repoPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("resolve path: %v", err), http.StatusBadRequest)
		return
	}
	if info, err := os.Stat(absPath); err != nil || !info.IsDir() {
		http.Error(w, "repository path must be an existing directory", http.StatusBadRequest)
		return
	}
	if vcsType == "" || vcsType == "auto" {
		detected, err := a.detectProvider(absPath)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		vcsType = string(detected)
	}
	if vcsType != string(domain.VCSTypeGit) && vcsType != string(domain.VCSTypeJJ) {
		http.Error(w, "unsupported vcs type", http.StatusBadRequest)
		return
	}
	if _, err := a.db.Exec(`INSERT INTO repositories (name, description, path, vcs_type) VALUES (?, ?, ?, ?)`, name, description, absPath, vcsType); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	repo, err := a.repositoryByName(name)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := a.syncRepoPipelines(repo); err != nil {
		_, _ = a.db.Exec(`DELETE FROM repositories WHERE id = ?`, repo.ID)
		http.Error(w, fmt.Sprintf("repository registered but pipeline sync failed: %v", err), http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, "/settings", http.StatusFound)
}

func (a *App) SyncRepo(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid repository id", http.StatusBadRequest)
		return
	}
	repo, err := a.repositoryByID(id)
	if err != nil {
		status := http.StatusInternalServerError
		if err == sql.ErrNoRows {
			status = http.StatusNotFound
		}
		http.Error(w, err.Error(), status)
		return
	}
	if err := a.syncRepoPipelines(repo); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, "/settings", http.StatusFound)
}

func (a *App) DeleteRepo(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid repository id", http.StatusBadRequest)
		return
	}
	result, err := a.db.Exec(`DELETE FROM repositories WHERE id = ?`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		http.Error(w, "repository not found", http.StatusNotFound)
		return
	}
	if strings.EqualFold(r.Header.Get("HX-Request"), "true") {
		w.WriteHeader(http.StatusOK)
		return
	}
	http.Redirect(w, r, "/settings", http.StatusFound)
}
