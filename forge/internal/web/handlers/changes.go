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
	ChangeRequests []ChangeListItem
	Status         string
}

type ChangeListItem struct {
	Change            domain.ChangeRequest
	LatestReviewState string
	OpenThreads       int
	RoundCount        int
}

type ChangeNewPage struct {
	LayoutData
	Repository domain.Repository
	Bookmarks  []string
}

type ChangeDetailPage struct {
	LayoutData
	Repository     domain.Repository
	Change         domain.ChangeRequest
	Round          *domain.ReviewRound
	Rounds         []domain.ReviewRound
	RoundAdvanced  bool
	Comments       []ChangeCommentThread
	Reviews        []ChangeReviewEntry
	DiffFiles      []ChangeDiffFile
	CurrentState   string
	SourceRevision *domain.Revision
	TargetRevision *domain.Revision
}

type ChangeReviewEntry struct {
	Review   domain.Review
	RoundNum int
}

type ChangeCommentThread struct {
	Root     domain.ReviewComment
	Replies  []domain.ReviewComment
	RoundNum int
}

type ChangeDiffFile struct {
	Path  string
	Lines []ChangeDiffLine
}

type ChangeDiffLine struct {
	OldNumber   int
	NewNumber   int
	Prefix      string
	Content     string
	Side        string
	Commentable bool
	Threads     []ChangeCommentThread
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

	changes := make([]ChangeListItem, 0)
	for rows.Next() {
		var cr domain.ChangeRequest
		var createdAt, updatedAt string
		if err := rows.Scan(&cr.ID, &cr.RepoID, &cr.Number, &cr.Title, &cr.Description, &cr.SourceBookmark, &cr.TargetBookmark, &cr.Status, &createdAt, &updatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		cr.CreatedAt = parseTimeString(createdAt)
		cr.UpdatedAt = parseTimeString(updatedAt)

		item := ChangeListItem{Change: cr, LatestReviewState: "awaiting_review"}
		if err := a.db.QueryRow(`SELECT COUNT(*) FROM review_rounds WHERE cr_id = ?`, cr.ID).Scan(&item.RoundCount); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if err := a.db.QueryRow(`SELECT COUNT(*) FROM review_comments WHERE cr_id = ? AND resolved = 0`, cr.ID).Scan(&item.OpenThreads); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		var latestState string
		err := a.db.QueryRow(`SELECT state FROM reviews WHERE cr_id = ? ORDER BY created_at DESC, id DESC LIMIT 1`, cr.ID).Scan(&latestState)
		if err == nil {
			item.LatestReviewState = latestState
		} else if !errors.Is(err, sql.ErrNoRows) {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		changes = append(changes, item)
	}
	if err := rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	a.render(w, "changes/list.html", ChangeListPage{
		LayoutData:     LayoutData{Title: repo.Name + " changes", ContentTemplate: "changes/list.content"},
		Repository:     repo,
		ChangeRequests: changes,
		Status:         statusFilter,
	})
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
	if source == target {
		http.Error(w, "source and target bookmarks must be different", http.StatusBadRequest)
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
		tip = revisionTip(*revision, source)
	}
	if _, err := a.db.Exec(`INSERT INTO review_rounds (cr_id, round_num, tip_commit) VALUES (?, ?, ?)`, crID, 1, tip); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
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

	latestRound, roundAdvanced, err := a.ensureLatestReviewRound(repo, cr, provider)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	rounds, err := a.reviewRounds(cr.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	selectedRound := latestRound
	if rawRound := strings.TrimSpace(r.URL.Query().Get("round")); rawRound != "" {
		roundNum, err := strconv.Atoi(rawRound)
		if err != nil {
			http.Error(w, "invalid round", http.StatusBadRequest)
			return
		}
		selectedRound = roundByNumber(rounds, roundNum)
		if selectedRound == nil {
			http.Error(w, "review round not found", http.StatusNotFound)
			return
		}
	}

	diff, err := provider.Diff(repo.Path, cr.TargetBookmark, cr.SourceBookmark)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	threads, err := a.commentThreads(cr.ID, selectedRound)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	reviews, currentState, err := a.reviewEntries(cr.ID, selectedRound)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	diffFiles := parseUnifiedDiff(diff, threadIndex(threads))

	sourceRevision, _ := provider.RevisionDetail(repo.Path, cr.SourceBookmark)
	targetRevision, _ := provider.RevisionDetail(repo.Path, cr.TargetBookmark)

	a.render(w, "changes/detail.html", ChangeDetailPage{
		LayoutData:     LayoutData{Title: fmt.Sprintf("%s #%d", repo.Name, cr.Number), ContentTemplate: "changes/detail.content"},
		Repository:     repo,
		Change:         cr,
		Round:          selectedRound,
		Rounds:         rounds,
		RoundAdvanced:  roundAdvanced,
		Comments:       threads,
		Reviews:        reviews,
		DiffFiles:      diffFiles,
		CurrentState:   currentState,
		SourceRevision: sourceRevision,
		TargetRevision: targetRevision,
	})
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
	if state != string(domain.ReviewStateApproved) && state != string(domain.ReviewStateChangesRequested) && state != string(domain.ReviewStateCommented) {
		http.Error(w, "invalid review state", http.StatusBadRequest)
		return
	}
	provider, err := a.providerForRepo(repo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	round, _, err := a.ensureLatestReviewRound(repo, cr, provider)
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
	if err != nil || lineNumber < 1 {
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
	var parentID *int64
	if rawParent := strings.TrimSpace(r.FormValue("parent_id")); rawParent != "" {
		parsed, err := strconv.ParseInt(rawParent, 10, 64)
		if err != nil {
			http.Error(w, "invalid parent comment id", http.StatusBadRequest)
			return
		}
		parentID = &parsed
	}
	provider, err := a.providerForRepo(repo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	round, _, err := a.ensureLatestReviewRound(repo, cr, provider)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if round == nil {
		http.Error(w, "review round missing", http.StatusBadRequest)
		return
	}
	if parentID != nil {
		if _, err := a.db.Exec(`INSERT INTO review_comments (round_id, cr_id, parent_id, file_path, line_number, side, body, author) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, round.ID, cr.ID, *parentID, filePath, lineNumber, side, body, "admin"); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		if _, err := a.db.Exec(`INSERT INTO review_comments (round_id, cr_id, file_path, line_number, side, body, author) VALUES (?, ?, ?, ?, ?, ?, ?)`, round.ID, cr.ID, filePath, lineNumber, side, body, "admin"); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
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
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}
	resolved := 1
	if r.FormValue("resolved") == "0" {
		resolved = 0
	}
	if _, err := a.db.Exec(`UPDATE review_comments SET resolved = ? WHERE id = ? AND cr_id = ?`, resolved, commentID, cr.ID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, fmt.Sprintf("/repos/%s/changes/%d", repo.Name, cr.Number), http.StatusFound)
}

func (a *App) CloseChange(w http.ResponseWriter, r *http.Request) {
	repo, cr, ok := a.changeFromRequest(w, r)
	if !ok {
		return
	}
	if _, err := a.db.Exec(`UPDATE change_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, domain.CRStatusClosed, cr.ID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, fmt.Sprintf("/repos/%s/changes/%d", repo.Name, cr.Number), http.StatusFound)
}

func (a *App) ReopenChange(w http.ResponseWriter, r *http.Request) {
	repo, cr, ok := a.changeFromRequest(w, r)
	if !ok {
		return
	}
	if _, err := a.db.Exec(`UPDATE change_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, domain.CRStatusOpen, cr.ID); err != nil {
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

func (a *App) ensureLatestReviewRound(repo domain.Repository, cr domain.ChangeRequest, provider interface {
	RevisionDetail(repoPath, ref string) (*domain.Revision, error)
}) (*domain.ReviewRound, bool, error) {
	latestRound, err := a.latestReviewRound(cr.ID)
	if err != nil {
		return nil, false, err
	}
	revision, err := provider.RevisionDetail(repo.Path, cr.SourceBookmark)
	if err != nil {
		if latestRound == nil {
			return nil, false, err
		}
		return latestRound, false, nil
	}
	tip := revisionTip(*revision, cr.SourceBookmark)
	if latestRound == nil {
		result, err := a.db.Exec(`INSERT INTO review_rounds (cr_id, round_num, tip_commit) VALUES (?, ?, ?)`, cr.ID, 1, tip)
		if err != nil {
			return nil, false, err
		}
		roundID, _ := result.LastInsertId()
		return &domain.ReviewRound{ID: roundID, CRID: cr.ID, RoundNum: 1, TipCommit: tip}, true, nil
	}
	if latestRound.TipCommit == tip {
		return latestRound, false, nil
	}
	result, err := a.db.Exec(`INSERT INTO review_rounds (cr_id, round_num, tip_commit) VALUES (?, ?, ?)`, cr.ID, latestRound.RoundNum+1, tip)
	if err != nil {
		return nil, false, err
	}
	newRoundID, _ := result.LastInsertId()
	if _, err := a.db.Exec(`UPDATE review_comments SET outdated = 1 WHERE cr_id = ? AND resolved = 0 AND round_id != ?`, cr.ID, newRoundID); err != nil {
		return nil, false, err
	}
	return &domain.ReviewRound{ID: newRoundID, CRID: cr.ID, RoundNum: latestRound.RoundNum + 1, TipCommit: tip}, true, nil
}

func (a *App) reviewRounds(crID int64) ([]domain.ReviewRound, error) {
	rows, err := a.db.Query(`SELECT id, cr_id, round_num, tip_commit, created_at FROM review_rounds WHERE cr_id = ? ORDER BY round_num DESC`, crID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	rounds := make([]domain.ReviewRound, 0)
	for rows.Next() {
		var round domain.ReviewRound
		var createdAt string
		if err := rows.Scan(&round.ID, &round.CRID, &round.RoundNum, &round.TipCommit, &createdAt); err != nil {
			return nil, err
		}
		round.CreatedAt = parseTimeString(createdAt)
		rounds = append(rounds, round)
	}
	return rounds, rows.Err()
}

func roundByNumber(rounds []domain.ReviewRound, number int) *domain.ReviewRound {
	for i := range rounds {
		if rounds[i].RoundNum == number {
			return &rounds[i]
		}
	}
	return nil
}

func (a *App) commentThreads(crID int64, round *domain.ReviewRound) ([]ChangeCommentThread, error) {
	if round == nil {
		return nil, nil
	}
	rows, err := a.db.Query(`
		SELECT rc.id, rc.round_id, rr.round_num, rc.cr_id, rc.parent_id, rc.file_path, rc.line_number, rc.side, rc.body, rc.author, rc.resolved, rc.outdated, rc.created_at
		FROM review_comments rc
		JOIN review_rounds rr ON rr.id = rc.round_id
		WHERE rc.cr_id = ? AND rr.round_num <= ?
		ORDER BY rc.created_at ASC, rc.id ASC`, crID, round.RoundNum)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	rootMap := map[int64]*ChangeCommentThread{}
	order := make([]int64, 0)
	for rows.Next() {
		var comment domain.ReviewComment
		var parentID sql.NullInt64
		var resolved, outdated int
		var createdAt string
		var roundNum int
		if err := rows.Scan(&comment.ID, &comment.RoundID, &roundNum, &comment.CRID, &parentID, &comment.FilePath, &comment.LineNumber, &comment.Side, &comment.Body, &comment.Author, &resolved, &outdated, &createdAt); err != nil {
			return nil, err
		}
		if parentID.Valid {
			value := parentID.Int64
			comment.ParentID = &value
		}
		comment.Resolved = resolved == 1
		comment.Outdated = outdated == 1 || roundNum != round.RoundNum
		comment.CreatedAt = parseTimeString(createdAt)

		rootID := comment.ID
		if comment.ParentID != nil {
			rootID = *comment.ParentID
		}
		thread, ok := rootMap[rootID]
		if !ok {
			thread = &ChangeCommentThread{RoundNum: roundNum}
			rootMap[rootID] = thread
			order = append(order, rootID)
		}
		if comment.ParentID == nil {
			thread.Root = comment
			thread.RoundNum = roundNum
			continue
		}
		thread.Replies = append(thread.Replies, comment)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	threads := make([]ChangeCommentThread, 0, len(order))
	for _, id := range order {
		thread := rootMap[id]
		if thread.Root.ID == 0 {
			continue
		}
		threads = append(threads, *thread)
	}
	return threads, nil
}

func (a *App) reviewEntries(crID int64, round *domain.ReviewRound) ([]ChangeReviewEntry, string, error) {
	if round == nil {
		return nil, "awaiting_review", nil
	}
	rows, err := a.db.Query(`
		SELECT r.id, r.cr_id, r.round_id, rr.round_num, r.author, r.state, r.body, r.created_at
		FROM reviews r
		JOIN review_rounds rr ON rr.id = r.round_id
		WHERE r.cr_id = ? AND rr.round_num <= ?
		ORDER BY r.created_at DESC, r.id DESC`, crID, round.RoundNum)
	if err != nil {
		return nil, "", err
	}
	defer rows.Close()

	reviews := make([]ChangeReviewEntry, 0)
	currentState := "awaiting_review"
	for rows.Next() {
		var entry ChangeReviewEntry
		var state, createdAt string
		if err := rows.Scan(&entry.Review.ID, &entry.Review.CRID, &entry.Review.RoundID, &entry.RoundNum, &entry.Review.Author, &state, &entry.Review.Body, &createdAt); err != nil {
			return nil, "", err
		}
		entry.Review.State = domain.ReviewState(state)
		entry.Review.CreatedAt = parseTimeString(createdAt)
		if currentState == "awaiting_review" && entry.RoundNum == round.RoundNum {
			currentState = state
		}
		reviews = append(reviews, entry)
	}
	return reviews, currentState, rows.Err()
}

func revisionTip(revision domain.Revision, fallback string) string {
	if strings.TrimSpace(revision.CommitHash) != "" {
		return revision.CommitHash
	}
	if strings.TrimSpace(revision.ChangeID) != "" {
		return revision.ChangeID
	}
	return fallback
}

func threadIndex(threads []ChangeCommentThread) map[string][]ChangeCommentThread {
	index := make(map[string][]ChangeCommentThread)
	for _, thread := range threads {
		key := diffThreadKey(thread.Root.FilePath, thread.Root.Side, thread.Root.LineNumber)
		index[key] = append(index[key], thread)
	}
	return index
}

func diffThreadKey(filePath, side string, lineNumber int) string {
	return fmt.Sprintf("%s|%s|%d", filePath, side, lineNumber)
}

func parseUnifiedDiff(diff string, threadMap map[string][]ChangeCommentThread) []ChangeDiffFile {
	lines := strings.Split(diff, "\n")
	files := make([]ChangeDiffFile, 0)
	var current *ChangeDiffFile
	var oldLine, newLine int

	for _, raw := range lines {
		switch {
		case strings.HasPrefix(raw, "diff --git "):
			path := parseGitDiffPath(raw)
			files = append(files, ChangeDiffFile{Path: path})
			current = &files[len(files)-1]
			oldLine, newLine = 0, 0
		case strings.HasPrefix(raw, "Modified regular file "):
			path := strings.TrimSuffix(strings.TrimPrefix(raw, "Modified regular file "), ":")
			files = append(files, ChangeDiffFile{Path: path})
			current = &files[len(files)-1]
			oldLine, newLine = 0, 0
		case strings.HasPrefix(raw, "Added regular file "):
			path := strings.TrimSuffix(strings.TrimPrefix(raw, "Added regular file "), ":")
			files = append(files, ChangeDiffFile{Path: path})
			current = &files[len(files)-1]
			oldLine, newLine = 0, 0
		case strings.HasPrefix(raw, "Removed regular file "):
			path := strings.TrimSuffix(strings.TrimPrefix(raw, "Removed regular file "), ":")
			files = append(files, ChangeDiffFile{Path: path})
			current = &files[len(files)-1]
			oldLine, newLine = 0, 0
		case strings.HasPrefix(raw, "@@"):
			oldLine, newLine = parseHunkHeader(raw)
			if current == nil {
				files = append(files, ChangeDiffFile{Path: "diff"})
				current = &files[len(files)-1]
			}
			current.Lines = append(current.Lines, ChangeDiffLine{Prefix: "@", Content: raw})
		case strings.HasPrefix(raw, "--- ") || strings.HasPrefix(raw, "+++ ") || strings.HasPrefix(raw, "index "):
			if current == nil {
				files = append(files, ChangeDiffFile{Path: "diff"})
				current = &files[len(files)-1]
			}
			current.Lines = append(current.Lines, ChangeDiffLine{Prefix: " ", Content: raw})
		default:
			if current == nil {
				files = append(files, ChangeDiffFile{Path: "diff"})
				current = &files[len(files)-1]
			}
			line := ChangeDiffLine{Content: raw}
			if raw == "" {
				current.Lines = append(current.Lines, line)
				continue
			}
			switch raw[0] {
			case '+':
				line.Prefix = "+"
				line.Side = "new"
				line.NewNumber = newLine
				line.Commentable = newLine > 0
				line.Threads = threadMap[diffThreadKey(current.Path, line.Side, line.NewNumber)]
				newLine++
			case '-':
				line.Prefix = "-"
				line.Side = "old"
				line.OldNumber = oldLine
				line.Commentable = oldLine > 0
				line.Threads = threadMap[diffThreadKey(current.Path, line.Side, line.OldNumber)]
				oldLine++
			case ' ':
				line.Prefix = " "
				line.OldNumber = oldLine
				line.NewNumber = newLine
				oldLine++
				newLine++
			default:
				line.Prefix = " "
			}
			current.Lines = append(current.Lines, line)
		}
	}

	return files
}

func parseGitDiffPath(raw string) string {
	parts := strings.Split(raw, " ")
	if len(parts) >= 4 {
		return strings.TrimPrefix(parts[3], "b/")
	}
	return "diff"
}

func parseHunkHeader(raw string) (int, int) {
	startOld, startNew := 0, 0
	fields := strings.Fields(raw)
	if len(fields) < 3 {
		return startOld, startNew
	}
	startOld = parseHunkStart(fields[1])
	startNew = parseHunkStart(fields[2])
	return startOld, startNew
}

func parseHunkStart(field string) int {
	field = strings.TrimPrefix(field, "-")
	field = strings.TrimPrefix(field, "+")
	parts := strings.Split(field, ",")
	value, _ := strconv.Atoi(parts[0])
	return value
}
