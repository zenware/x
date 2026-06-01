package handlers

import (
	"bytes"
	"database/sql"
	"errors"
	"net/http"
	pathpkg "path"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/zenware/forge/internal/domain"
)

type RepoListPage struct {
	LayoutData
	Repositories []domain.Repository
}

type RepoDetailPage struct {
	LayoutData
	Repository domain.Repository
	Revisions  []domain.Revision
	Bookmarks  []string
	Revision   *domain.Revision
	Diff       string
}

type RepoLogPage struct {
	LayoutData
	Repository  domain.Repository
	Revisions   []domain.Revision
	Page        int
	HasPrevious bool
	HasNext     bool
}

type RepoTreePage struct {
	LayoutData
	Repository  domain.Repository
	Ref         string
	CurrentPath string
	ParentPath  string
	Entries     []domain.FileEntry
}

type RepoBlobPage struct {
	LayoutData
	Repository domain.Repository
	Ref        string
	FilePath   string
	Content    string
}

func (a *App) Home(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/pipelines", http.StatusFound)
}

func (a *App) ListRepos(w http.ResponseWriter, r *http.Request) {
	repos, err := a.repositories()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	a.render(w, "repos/list.html", RepoListPage{LayoutData: LayoutData{Title: "Repositories", ContentTemplate: "repos/list.content"}, Repositories: repos})
}

func (a *App) RepoDetail(w http.ResponseWriter, r *http.Request) {
	repo, err := a.repositoryByName(chi.URLParam(r, "name"))
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, sql.ErrNoRows) {
			status = http.StatusNotFound
		}
		http.Error(w, err.Error(), status)
		return
	}
	provider, err := a.providerForRepo(repo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	revisions, err := provider.Log(repo.Path, 10)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	bookmarks, err := provider.Bookmarks(repo.Path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	a.render(w, "repos/detail.html", RepoDetailPage{LayoutData: LayoutData{Title: repo.Name, ContentTemplate: "repos/detail.content"}, Repository: repo, Revisions: revisions, Bookmarks: bookmarks})
}

func (a *App) RepoLog(w http.ResponseWriter, r *http.Request) {
	repo, err := a.repositoryByName(chi.URLParam(r, "name"))
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, sql.ErrNoRows) {
			status = http.StatusNotFound
		}
		http.Error(w, err.Error(), status)
		return
	}
	provider, err := a.providerForRepo(repo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	page := parsePage(r.URL.Query().Get("page"))
	limit := 25
	items, err := provider.Log(repo.Path, page*limit+1)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	start := (page - 1) * limit
	if start > len(items) {
		start = len(items)
	}
	end := start + limit
	if end > len(items) {
		end = len(items)
	}
	hasNext := len(items) > page*limit
	a.render(w, "repos/log.html", RepoLogPage{LayoutData: LayoutData{Title: repo.Name + " history", ContentTemplate: "repos/log.content"}, Repository: repo, Revisions: items[start:end], Page: page, HasPrevious: page > 1, HasNext: hasNext})
}

func (a *App) RevisionDetail(w http.ResponseWriter, r *http.Request) {
	repo, err := a.repositoryByName(chi.URLParam(r, "name"))
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, sql.ErrNoRows) {
			status = http.StatusNotFound
		}
		http.Error(w, err.Error(), status)
		return
	}
	provider, err := a.providerForRepo(repo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	ref := chi.URLParam(r, "ref")
	revision, err := provider.RevisionDetail(repo.Path, ref)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if revision == nil {
		http.Error(w, "revision not found", http.StatusNotFound)
		return
	}
	baseRef := ""
	if len(revision.Parents) > 0 {
		baseRef = revision.Parents[0]
	}
	diff, err := provider.Diff(repo.Path, baseRef, ref)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	a.render(w, "repos/detail.html", RepoDetailPage{LayoutData: LayoutData{Title: repo.Name + " revision", ContentTemplate: "repos/detail.content"}, Repository: repo, Revision: revision, Diff: diff})
}

func (a *App) RepoTree(w http.ResponseWriter, r *http.Request) {
	repo, err := a.repositoryByName(chi.URLParam(r, "name"))
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, sql.ErrNoRows) {
			status = http.StatusNotFound
		}
		http.Error(w, err.Error(), status)
		return
	}
	provider, err := a.providerForRepo(repo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	ref := chi.URLParam(r, "ref")
	currentPath := strings.Trim(chi.URLParam(r, "path"), "/")
	entries, err := provider.FileTree(repo.Path, ref, currentPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	parentPath := ""
	if currentPath != "" {
		parentPath = pathpkg.Dir(currentPath)
		if parentPath == "." {
			parentPath = ""
		}
	}
	a.render(w, "repos/tree.html", RepoTreePage{LayoutData: LayoutData{Title: repo.Name + " tree", ContentTemplate: "repos/tree.content"}, Repository: repo, Ref: ref, CurrentPath: currentPath, ParentPath: parentPath, Entries: entries})
}

func (a *App) RepoBlob(w http.ResponseWriter, r *http.Request) {
	repo, err := a.repositoryByName(chi.URLParam(r, "name"))
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, sql.ErrNoRows) {
			status = http.StatusNotFound
		}
		http.Error(w, err.Error(), status)
		return
	}
	provider, err := a.providerForRepo(repo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	ref := chi.URLParam(r, "ref")
	filePath := strings.Trim(chi.URLParam(r, "path"), "/")
	if filePath == "" {
		http.Error(w, "file path required", http.StatusBadRequest)
		return
	}
	content, err := provider.FileContent(repo.Path, ref, filePath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	a.render(w, "repos/blob.html", RepoBlobPage{LayoutData: LayoutData{Title: repo.Name + " file", ContentTemplate: "repos/blob.content"}, Repository: repo, Ref: ref, FilePath: filePath, Content: string(bytes.ToValidUTF8(content, []byte("�")))})
}
