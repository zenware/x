package vcs

import "github.com/zenware/forge/internal/domain"

// Provider is the interface every VCS backend must implement.
type Provider interface {
	// Detect returns true if the directory at path is managed by this provider.
	Detect(path string) bool
	// Log returns the revision history for the repository.
	Log(repoPath string, limit int) ([]domain.Revision, error)
	// RevisionDetail returns detail for one revision (by change ID or commit hash).
	RevisionDetail(repoPath, ref string) (*domain.Revision, error)
	// FileTree returns the list of files at a revision under a directory path.
	FileTree(repoPath, ref, dirPath string) ([]domain.FileEntry, error)
	// FileContent returns the raw content of a file at a revision.
	FileContent(repoPath, ref, filePath string) ([]byte, error)
	// Diff returns a unified diff between two refs (empty base = root).
	Diff(repoPath, baseRef, headRef string) (string, error)
	// Bookmarks returns the list of bookmarks/branches.
	Bookmarks(repoPath string) ([]string, error)
}
