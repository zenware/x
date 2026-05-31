package artifacts

import (
	"io"

	"github.com/zenware/forge/internal/domain"
)

type Store interface {
	Put(runID, jobID int64, name string, r io.Reader) (*domain.Artifact, error)
	Get(storageKey string) (io.ReadCloser, error)
	List(runID int64) ([]domain.Artifact, error)
	Delete(storageKey string) error
}
