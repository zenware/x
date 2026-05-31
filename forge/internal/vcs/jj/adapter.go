package jj

import (
	"bytes"
	"fmt"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/zenware/forge/internal/domain"
)

type Adapter struct{}

func New() *Adapter {
	return &Adapter{}
}

func (a *Adapter) Detect(path string) bool {
	cmd := exec.Command("jj", "root")
	cmd.Dir = path
	return cmd.Run() == nil
}

func (a *Adapter) Log(repoPath string, limit int) ([]domain.Revision, error) {
	return a.log(repoPath, "all()", limit)
}

func (a *Adapter) RevisionDetail(repoPath, ref string) (*domain.Revision, error) {
	revs, err := a.log(repoPath, ref, 1)
	if err != nil {
		return nil, err
	}
	if len(revs) == 0 {
		return nil, nil
	}
	diff, err := a.Diff(repoPath, ref+"-", ref)
	if err == nil {
		revs[0].Description = strings.TrimSpace(revs[0].Description + "\n\n" + diff)
	}
	return &revs[0], nil
}

func (a *Adapter) FileTree(repoPath, ref, dirPath string) ([]domain.FileEntry, error) {
	args := []string{"file", "list", "--revision", ref}
	out, err := run(repoPath, "jj", args...)
	if err != nil {
		if strings.Contains(err.Error(), "No such path") {
			return []domain.FileEntry{}, nil
		}
		return nil, err
	}

	dirPath = strings.Trim(strings.TrimSpace(dirPath), "/")
	entriesByPath := map[string]domain.FileEntry{}
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		if strings.TrimSpace(line) == "" {
			continue
		}
		full := filepath.ToSlash(strings.TrimSpace(line))
		if dirPath != "" {
			prefix := dirPath + "/"
			if full == dirPath || !strings.HasPrefix(full, prefix) {
				continue
			}
			full = strings.TrimPrefix(full, prefix)
		}
		parts := strings.Split(full, "/")
		name := parts[0]
		entryPath := name
		if dirPath != "" {
			entryPath = filepath.ToSlash(filepath.Join(dirPath, name))
		}
		entry := domain.FileEntry{Name: name, Path: entryPath, IsDir: len(parts) > 1}
		entriesByPath[entry.Path] = entry
	}

	entries := make([]domain.FileEntry, 0, len(entriesByPath))
	for _, entry := range entriesByPath {
		entries = append(entries, entry)
	}
	sort.Slice(entries, func(i, j int) bool {
		if entries[i].IsDir != entries[j].IsDir {
			return entries[i].IsDir
		}
		return entries[i].Name < entries[j].Name
	})
	return entries, nil
}

func (a *Adapter) FileContent(repoPath, ref, filePath string) ([]byte, error) {
	return runBytes(repoPath, "jj", "file", "show", "--revision", ref, filePath)
}

func (a *Adapter) Diff(repoPath, baseRef, headRef string) (string, error) {
	args := []string{"diff", "--to", headRef}
	if strings.TrimSpace(baseRef) != "" {
		args = append(args, "--from", baseRef)
	}
	out, err := run(repoPath, "jj", args...)
	if err != nil {
		return "", err
	}
	return out, nil
}

func (a *Adapter) Bookmarks(repoPath string) ([]string, error) {
	out, err := run(repoPath, "jj", "bookmark", "list")
	if err != nil {
		return nil, err
	}
	bookmarks := make([]string, 0)
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		name := strings.Fields(strings.SplitN(line, ":", 2)[0])
		if len(name) == 0 {
			continue
		}
		bookmarks = append(bookmarks, name[0])
	}
	sort.Strings(bookmarks)
	return bookmarks, nil
}

func (a *Adapter) log(repoPath, revset string, limit int) ([]domain.Revision, error) {
	args := []string{"log", "--no-graph", "-T", `change_id ++ "\t" ++ commit_id ++ "\t" ++ author.name() ++ "\t" ++ author.timestamp() ++ "\t" ++ description.first_line() ++ "\n"`, "-r", revset}
	if limit > 0 {
		args = append(args, "--limit", fmt.Sprintf("%d", limit))
	}
	out, err := run(repoPath, "jj", args...)
	if err != nil {
		if strings.Contains(err.Error(), "No revisions") || strings.Contains(err.Error(), "Revision set is empty") {
			return []domain.Revision{}, nil
		}
		return nil, err
	}
	return parseLog(out), nil
}

func parseLog(out string) []domain.Revision {
	revisions := make([]domain.Revision, 0)
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		if strings.TrimSpace(line) == "" {
			continue
		}
		parts := strings.SplitN(line, "\t", 5)
		if len(parts) < 5 {
			continue
		}
		revisions = append(revisions, domain.Revision{
			ChangeID:    strings.TrimSpace(parts[0]),
			CommitHash:  strings.TrimSpace(parts[1]),
			Author:      strings.TrimSpace(parts[2]),
			Timestamp:   parseTime(strings.TrimSpace(parts[3])),
			Description: strings.TrimSpace(parts[4]),
		})
	}
	return revisions
}

func run(dir, bin string, args ...string) (string, error) {
	buf, err := runBytes(dir, bin, args...)
	return string(buf), err
}

func runBytes(dir, bin string, args ...string) ([]byte, error) {
	cmd := exec.Command(bin, args...)
	cmd.Dir = dir
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(stderr.String())
		if msg == "" {
			msg = err.Error()
		}
		return nil, fmt.Errorf("%s %s: %s", bin, strings.Join(args, " "), msg)
	}
	return stdout.Bytes(), nil
}

func parseTime(value string) time.Time {
	layouts := []string{time.RFC3339Nano, time.RFC3339, "2006-01-02 15:04:05 -0700", "2006-01-02 15:04:05 -07:00", "2006-01-02 15:04:05"}
	for _, layout := range layouts {
		if ts, err := time.Parse(layout, value); err == nil {
			return ts
		}
	}
	return time.Time{}
}
