package handlers

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/zenware/forge/internal/domain"
)

type ChangeListPage struct {
	LayoutData
	Repository     domain.Repository
	ChangeRequests []domain.ChangeRequest
	Status         string
}

type ChangeNewPage struct {
	LayoutData
	Repository domain.Repository
	Bookmarks  []string
}

type ChangeDetailPage struct {
	LayoutData
	Repository domain.Repository
	Change     domain.ChangeRequest
	Round      *domain.ReviewRound
	Comments   []domain.ReviewComment
	Reviews    []domain.Review
	Diff       string
}

func (a *App) ListChanges(w http.ResponseWriter, r *http.Request) {
	repo, err := a.repositoryByName(chi.URLParam(r, "name"))
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, sql.ErrNoRows) {
			status = http.StatusNotFound
		}
		http.Error(w, err.Error(), status)
		return
	}
	statusFilter := r.URL.Query().Get("status")
	if statusFilter == "" {
		statusFilter = string(domain.CRStatusOpen)
	}
	query := `SELECT id, repo_id, number, title, description, source_bookmark, target_bookmark, status, created_at, updated_at FROM change_requests WHERE repo_id = ?`
	args := []any{repo.ID}
	if statusFilter != "all" {
		query += ` AND status = ?`
		args = append(args, statusFilter)
	}
	query += ` ORDER BY number DESC`
	rows, err := a.db.Query(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	changes := make([]domain.ChangeRequest, 0)
	for rows.Next() {
		var cr domain.ChangeRequest
		var createdAt, updatedAt string
		if err := rows.Scan(&cr.ID, &cr.RepoID, &cr.Number, &cr.Title, &cr.Description, &cr.SourceBookmark, &cr.TargetBookmark, &cr.Status, &createdAt, &updatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		cr.CreatedAt = parseTimeString(createdAt)
		cr.UpdatedAt = parseTimeString(updatedAt)
		changes = append(changes, cr)
	}
	a.render(w, "changes/list.html", ChangeListPage{LayoutData: LayoutData{Title: repo.Name + " changes", ContentTemplate: "changes/list.content"}, Repository: repo, ChangeRequests: changes, Status: statusFilter})
}

func (a *App) NewChange(w http.ResponseWriter, r *http.Request) {
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
	bookmarks, err := provider.Bookmarks(repo.Path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	a.render(w, "changes/new.html", ChangeNewPage{LayoutData: LayoutData{Title: "New change request", ContentTemplate: "changes/new.content"}, Repository: repo, Bookmarks: bookmarks})
}

func (a *App) CreateChange(w http.ResponseWriter, r *http.Request) {
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
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}
	title := strings.TrimSpace(r.FormValue("title"))
	description := strings.TrimSpace(r.FormValue("description"))
	source := strings.TrimSpace(r.FormValue("source_bookmark"))
	target := strings.TrimSpace(r.FormValue("target_bookmark"))
	if title == "" || source == "" || target == "" {
		http.Error(w, "title, source bookmark, and target bookmark are required", http.StatusBadRequest)
		return
	}
	var nextNumber int64
	if err := a.db.QueryRow(`SELECT COALESCE(MAX(number), 0) + 1 FROM change_requests WHERE repo_id = ?`, repo.ID).Scan(&nextNumber); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	result, err := a.db.Exec(`INSERT INTO change_requests (repo_id, number, title, description, source_bookmark, target_bookmark, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, repo.ID, nextNumber, title, description, source, target, domain.CRStatusOpen)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	crID, _ := result.LastInsertId()
	tip := source
	if revision, err := provider.RevisionDetail(repo.Path, source); err == nil && revision != nil {
		if revision.CommitHash != "" {
			tip = revision.CommitHash
		} else if revision.ChangeID != "" {
			tip = revision.ChangeID
		}
	}
	_, _ = a.db.Exec(`INSERT INTO review_rounds (cr_id, round_num, tip_commit) VALUES (?, ?, ?)`, crID, 1, tip)
	http.Redirect(w, r, fmt.Sprintf("/repos/%s/changes/%d", repo.Name, nextNumber), http.StatusFound)
}

func (a *App) ChangeDetail(w http.ResponseWriter, r *http.Request) {
	repo, err := a.repositoryByName(chi.URLParam(r, "name"))
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, sql.ErrNoRows) {
			status = http.StatusNotFound
		}
		http.Error(w, err.Error(), status)
		return
	}
	number, err := strconv.ParseInt(chi.URLParam(r, "number"), 10, 64)
	if err != nil {
		http.Error(w, "invalid change request number", http.StatusBadRequest)
		return
	}
	cr, err := a.changeRequestByNumber(repo.ID, number)
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
	diff, err := provider.Diff(repo.Path, cr.TargetBookmark, cr.SourceBookmark)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	round, err := a.latestReviewRound(cr.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	comments, err := a.loadComments(cr.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	reviews, err := a.loadReviews(cr.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	a.render(w, "changes/detail.html", ChangeDetailPage{LayoutData: LayoutData{Title: fmt.Sprintf("%s #%d", repo.Name, cr.Number), ContentTemplate: "changes/detail.content"}, Repository: repo, Change: cr, Round: round, Comments: comments, Reviews: reviews, Diff: diff})
}

func (a *App) SubmitReview(w http.ResponseWriter, r *http.Request) {
	repo, cr, ok := a.changeFromRequest(w, r)
	if !ok {
		return
	}
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}
	state := strings.TrimSpace(r.FormValue("state"))
	body := strings.TrimSpace(r.FormValue("body"))
	if state == "" {
		http.Error(w, "state is required", http.StatusBadRequest)
		return
	}
	round, err := a.latestReviewRound(cr.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if round == nil {
		http.Error(w, "review round missing", http.StatusBadRequest)
		return
	}
	if _, err := a.db.Exec(`INSERT INTO reviews (cr_id, round_id, author, state, body) VALUES (?, ?, ?, ?, ?)`, cr.ID, round.ID, "admin", state, body); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, fmt.Sprintf("/repos/%s/changes/%d", repo.Name, cr.Number), http.StatusFound)
}

func (a *App) AddComment(w http.ResponseWriter, r *http.Request) {
	repo, cr, ok := a.changeFromRequest(w, r)
	if !ok {
		return
	}
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}
	lineNumber, err := strconv.Atoi(r.FormValue("line_number"))
	if err != nil {
		http.Error(w, "invalid line number", http.StatusBadRequest)
		return
	}
	body := strings.TrimSpace(r.FormValue("body"))
	filePath := strings.TrimSpace(r.FormValue("file_path"))
	side := strings.TrimSpace(r.FormValue("side"))
	if body == "" || filePath == "" || (side != "old" && side != "new") {
		http.Error(w, "file path, side, and body are required", http.StatusBadRequest)
		return
	}
	round, err := a.latestReviewRound(cr.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if round == nil {
		http.Error(w, "review round missing", http.StatusBadRequest)
		return
	}
	if _, err := a.db.Exec(`INSERT INTO review_comments (round_id, cr_id, file_path, line_number, side, body, author) VALUES (?, ?, ?, ?, ?, ?, ?)`, round.ID, cr.ID, filePath, lineNumber, side, body, "admin"); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, fmt.Sprintf("/repos/%s/changes/%d", repo.Name, cr.Number), http.StatusFound)
}

func (a *App) ResolveComment(w http.ResponseWriter, r *http.Request) {
	repo, cr, ok := a.changeFromRequest(w, r)
	if !ok {
		return
	}
	commentID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid comment id", http.StatusBadRequest)
		return
	}
	if _, err := a.db.Exec(`UPDATE review_comments SET resolved = 1 WHERE id = ? AND cr_id = ?`, commentID, cr.ID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, fmt.Sprintf("/repos/%s/changes/%d", repo.Name, cr.Number), http.StatusFound)
}

func (a *App) changeFromRequest(w http.ResponseWriter, r *http.Request) (domain.Repository, domain.ChangeRequest, bool) {
	repo, err := a.repositoryByName(chi.URLParam(r, "name"))
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, sql.ErrNoRows) {
			status = http.StatusNotFound
		}
		http.Error(w, err.Error(), status)
		return domain.Repository{}, domain.ChangeRequest{}, false
	}
	number, err := strconv.ParseInt(chi.URLParam(r, "number"), 10, 64)
	if err != nil {
		http.Error(w, "invalid change request number", http.StatusBadRequest)
		return domain.Repository{}, domain.ChangeRequest{}, false
	}
	cr, err := a.changeRequestByNumber(repo.ID, number)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, sql.ErrNoRows) {
			status = http.StatusNotFound
		}
		http.Error(w, err.Error(), status)
		return domain.Repository{}, domain.ChangeRequest{}, false
	}
	return repo, cr, true
}

func (a *App) loadComments(crID int64) ([]domain.ReviewComment, error) {
	rows, err := a.db.Query(`SELECT id, round_id, cr_id, file_path, line_number, side, body, author, resolved, created_at FROM review_comments WHERE cr_id = ? ORDER BY created_at ASC`, crID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	comments := make([]domain.ReviewComment, 0)
	for rows.Next() {
		var comment domain.ReviewComment
		var resolved int
		var createdAt string
		if err := rows.Scan(&comment.ID, &comment.RoundID, &comment.CRID, &comment.FilePath, &comment.LineNumber, &comment.Side, &comment.Body, &comment.Author, &resolved, &createdAt); err != nil {
			return nil, err
		}
		comment.Resolved = resolved == 1
		comment.CreatedAt = parseTimeString(createdAt)
		comments = append(comments, comment)
	}
	return comments, rows.Err()
}

func (a *App) loadReviews(crID int64) ([]domain.Review, error) {
	rows, err := a.db.Query(`SELECT id, cr_id, round_id, author, state, body, created_at FROM reviews WHERE cr_id = ? ORDER BY created_at DESC`, crID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	reviews := make([]domain.Review, 0)
	for rows.Next() {
		var review domain.Review
		var state, createdAt string
		if err := rows.Scan(&review.ID, &review.CRID, &review.RoundID, &review.Author, &state, &review.Body, &createdAt); err != nil {
			return nil, err
		}
		review.State = domain.ReviewState(state)
		review.CreatedAt = parseTimeString(createdAt)
		reviews = append(reviews, review)
	}
	return reviews, rows.Err()
}
