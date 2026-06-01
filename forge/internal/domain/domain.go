package domain

import "time"

// VCS type for a repository
type VCSType string

const (
	VCSTypeJJ  VCSType = "jj"
	VCSTypeGit VCSType = "git"
)

// Repository is a tracked code repository on disk.
type Repository struct {
	ID          int64
	Name        string
	Description string
	Path        string // absolute path on disk
	VCSType     VCSType
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// Revision represents a commit/change in a repository.
type Revision struct {
	ChangeID    string // jj change ID (empty for pure git repos)
	CommitHash  string // git commit SHA
	Description string
	Author      string
	Timestamp   time.Time
	Bookmarks   []string // git branches / jj bookmarks at this revision
	Parents     []string // parent commit hashes
}

// FileEntry is a file or directory in a revision's tree.
type FileEntry struct {
	Name  string
	Path  string
	IsDir bool
	Size  int64
}

// Pipeline is a CI pipeline definition.
type Pipeline struct {
	ID        int64
	RepoID    int64
	Name      string
	Steps     []PipelineStep
	CreatedAt time.Time
	UpdatedAt time.Time
}

// PipelineStep is one step in a pipeline.
type PipelineStep struct {
	Name      string
	Command   string
	Artifacts []string // glob patterns for artifact paths
}

// RunStatus for a pipeline run or job.
type RunStatus string

const (
	RunStatusPending RunStatus = "pending"
	RunStatusRunning RunStatus = "running"
	RunStatusPassed  RunStatus = "passed"
	RunStatusFailed  RunStatus = "failed"
)

// PipelineRun is a triggered execution of a Pipeline.
type PipelineRun struct {
	ID          int64
	PipelineID  int64
	RepoID      int64
	Status      RunStatus
	TriggerType string // "manual" or "auto"
	CommitHash  string
	StartedAt   *time.Time
	FinishedAt  *time.Time
	CreatedAt   time.Time
}

// Job is one step execution within a PipelineRun.
type Job struct {
	ID         int64
	RunID      int64
	StepName   string
	Status     RunStatus
	LogOutput  string
	StartedAt  *time.Time
	FinishedAt *time.Time
}

// Artifact is a file produced by a Job.
type Artifact struct {
	ID         int64
	JobID      int64
	RunID      int64
	Name       string
	StorageKey string
	SizeBytes  int64
	CreatedAt  time.Time
}

// CRStatus for a change request.
type CRStatus string

const (
	CRStatusOpen   CRStatus = "open"
	CRStatusMerged CRStatus = "merged"
	CRStatusClosed CRStatus = "closed"
)

// ReviewState for a submitted review.
type ReviewState string

const (
	ReviewStateApproved         ReviewState = "approved"
	ReviewStateChangesRequested ReviewState = "changes_requested"
	ReviewStateCommented        ReviewState = "commented"
)

// ChangeRequest is a request to merge one bookmark into another (like a PR/MR).
// For jj-backed repos, source/target are jj bookmarks (= git branches).
type ChangeRequest struct {
	ID             int64
	RepoID         int64
	Number         int64 // sequential per-repo number
	Title          string
	Description    string
	SourceBookmark string
	TargetBookmark string
	Status         CRStatus
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// ReviewRound captures the state of a CR at a point in time (e.g. after amend/rebase).
type ReviewRound struct {
	ID        int64
	CRID      int64
	RoundNum  int
	TipCommit string // git commit SHA at the tip of source bookmark for this round
	CreatedAt time.Time
}

// ReviewComment is a line-level comment on a diff within a ReviewRound.
type ReviewComment struct {
	ID         int64
	RoundID    int64
	CRID       int64
	ParentID   *int64
	FilePath   string
	LineNumber int
	Side       string // "old" or "new"
	Body       string
	Author     string
	Resolved   bool
	Outdated   bool
	CreatedAt  time.Time
}

// Review is an overall review submission on a ChangeRequest.
type Review struct {
	ID        int64
	CRID      int64
	RoundID   int64
	Author    string
	State     ReviewState
	Body      string
	CreatedAt time.Time
}
