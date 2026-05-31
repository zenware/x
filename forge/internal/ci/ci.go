package ci

import "github.com/zenware/forge/internal/domain"

type Executor interface {
	Submit(run *domain.PipelineRun, pipeline *domain.Pipeline, workDir string) error
	Cancel(runID int64) error
	Logs(jobID int64) (string, error)
}
