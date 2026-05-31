package git

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/zenware/forge/internal/domain"
)

type Adapter struct{}

func New() *Adapter {
	return &Adapter{}
}

func (a *Adapter) Detect(path string) bool {
	info, err := os.Stat(filepath.Join(path, ".git"))
	return err == nil && info.IsDir()
}

func (a *Adapter) Log(repoPath string, limit int) ([]domain.Revision, error) {
	args := []string{"log", `--format=%H%x09%P%x09%an%x09%ai%x09%s`}
	if limit > 0 {
		args = append(args, "-n", strconv.Itoa(limit))
	}
	out, err := run(repoPath, "git", args...)
	if err != nil {
		if strings.Contains(err.Error(), "does not have any commits yet") {
			return []domain.Revision{}, nil
		}
		return nil, err
	}
	revisions := make([]domain.Revision, 0)
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		if strings.TrimSpace(line) == "" {
			continue
		}
		parts := strings.SplitN(line, "\t", 5)
		if len(parts) < 5 {
			continue
		}
		parents := []string{}
		if strings.TrimSpace(parts[1]) != "" {
			parents = strings.Fields(parts[1])
		}
		revisions = append(revisions, domain.Revision{
			CommitHash:  parts[0],
			Parents:     parents,
			Author:      parts[2],
			Timestamp:   parseTime(parts[3]),
			Description: parts[4],
		})
	}
	return revisions, nil
}

func (a *Adapter) RevisionDetail(repoPath, ref string) (*domain.Revision, error) {
	out, err := run(repoPath, "git", "log", "-1", `--format=%H%x09%P%x09%an%x09%ai%x09%s`, ref)
	if err != nil {
		return nil, err
	}
	items := strings.SplitN(strings.TrimSpace(out), "\t", 5)
	if len(items) < 5 {
		return nil, nil
	}
	branches, _ := run(repoPath, "git", "branch", "--contains", ref, "--format=%(refname:short)")
	rev := &domain.Revision{
		CommitHash:  items[0],
		Parents:     strings.Fields(items[1]),
		Author:      items[2],
		Timestamp:   parseTime(items[3]),
		Description: items[4],
		Bookmarks:   filterLines(branches),
	}
	return rev, nil
}

func (a *Adapter) FileTree(repoPath, ref, dirPath string) ([]domain.FileEntry, error) {
	treeish := ref
	if strings.TrimSpace(dirPath) != "" {
		treeish = fmt.Sprintf("%s:%s", ref, dirPath)
	}
	out, err := run(repoPath, "git", "ls-tree", "-l", treeish)
	if err != nil {
		if strings.Contains(err.Error(), "Not a valid object name") {
			return []domain.FileEntry{}, nil
		}
		return nil, err
	}
	entries := make([]domain.FileEntry, 0)
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		if strings.TrimSpace(line) == "" {
			continue
		}
		metaAndName := strings.SplitN(line, "\t", 2)
		if len(metaAndName) != 2 {
			continue
		}
		meta := strings.Fields(metaAndName[0])
		if len(meta) < 4 {
			continue
		}
		size, _ := strconv.ParseInt(meta[3], 10, 64)
		name := metaAndName[1]
		path := name
		if dirPath != "" {
			path = filepath.ToSlash(filepath.Join(dirPath, name))
		}
		entries = append(entries, domain.FileEntry{
			Name:  name,
			Path:  path,
			IsDir: meta[1] == "tree",
			Size:  size,
		})
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
	return runBytes(repoPath, "git", "show", fmt.Sprintf("%s:%s", ref, filePath))
}

func (a *Adapter) Diff(repoPath, baseRef, headRef string) (string, error) {
	if strings.TrimSpace(baseRef) == "" {
		return run(repoPath, "git", "show", "--format=", headRef)
	}
	return run(repoPath, "git", "diff", fmt.Sprintf("%s..%s", baseRef, headRef))
}

func (a *Adapter) Bookmarks(repoPath string) ([]string, error) {
	out, err := run(repoPath, "git", "branch", "-a", "--format=%(refname:short)")
	if err != nil {
		return nil, err
	}
	bookmarks := filterLines(out)
	sort.Strings(bookmarks)
	return bookmarks, nil
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

func filterLines(out string) []string {
	lines := make([]string, 0)
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		line = strings.TrimSpace(strings.TrimPrefix(line, "*"))
		if line != "" {
			lines = append(lines, line)
		}
	}
	return lines
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
