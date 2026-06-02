package main

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
)

type Server struct {
	store *Store
}

func NewServer(store *Store) *Server {
	return &Server{store: store}
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/api/v1/cases", s.handleCases)
	mux.HandleFunc("/api/v1/cases/", s.handleCaseRoutes)
	mux.HandleFunc("/api/v1/playbooks/validate", s.handlePlaybookValidate)
	mux.HandleFunc("/api/v1/runs/", s.handleRunRoutes)
	return mux
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

type createCaseRequest struct {
	Name string `json:"name"`
}

func (s *Server) handleCases(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	var req createCaseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && !errors.Is(err, io.EOF) {
		writeJSONError(w, http.StatusBadRequest, "invalid json")
		return
	}
	c := s.store.CreateCase(req.Name)
	writeJSON(w, http.StatusCreated, c)
}

func (s *Server) handleCaseRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/cases/")
	parts := strings.Split(path, "/")
	if len(parts) < 2 {
		writeJSONError(w, http.StatusNotFound, "not found")
		return
	}
	caseID := strings.TrimSpace(parts[0])
	action := parts[1]

	switch {
	case r.Method == http.MethodPost && action == "seeds":
		s.handleIngestSeed(w, r, caseID)
	case r.Method == http.MethodGet && action == "graph":
		s.handleGetGraph(w, r, caseID)
	case r.Method == http.MethodPost && action == "runs" && len(parts) == 2:
		s.handleCreateRun(w, r, caseID)
	case r.Method == http.MethodGet && action == "runs" && len(parts) == 3:
		s.handleGetRun(w, caseID, parts[2])
	default:
		writeJSONError(w, http.StatusNotFound, "not found")
	}
}

type ingestSeedRequest struct {
	Value          string `json:"value"`
	RunID          string `json:"runId,omitempty"`
	CreateTask     bool   `json:"createTask,omitempty"`
	ParentTaskID   string `json:"parentTaskId,omitempty"`
	IdempotencyKey string `json:"idempotencyKey,omitempty"`
}

func (s *Server) handleIngestSeed(w http.ResponseWriter, r *http.Request, caseID string) {
	var req ingestSeedRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json")
		return
	}

	res, err := s.store.IngestSeedWithOptions(caseID, req.Value, IngestSeedOptions{
		RunID:          strings.TrimSpace(req.RunID),
		CreateTask:     req.CreateTask,
		ParentTaskID:   strings.TrimSpace(req.ParentTaskID),
		IdempotencyKey: strings.TrimSpace(req.IdempotencyKey),
	})
	if err != nil {
		if err.Error() == "case not found" {
			writeJSONError(w, http.StatusNotFound, err.Error())
			return
		}
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, res)
}

func (s *Server) handleGetGraph(w http.ResponseWriter, r *http.Request, caseID string) {
	depth := 1
	if qDepth := r.URL.Query().Get("depth"); qDepth != "" {
		v, err := strconv.Atoi(qDepth)
		if err != nil || v < 0 {
			writeJSONError(w, http.StatusBadRequest, "depth must be a non-negative integer")
			return
		}
		depth = v
	}

	graph, err := s.store.GetCaseGraph(caseID, depth)
	if err != nil {
		writeJSONError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, graph)
}

func (s *Server) handlePlaybookValidate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	payload, err := io.ReadAll(r.Body)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid payload")
		return
	}
	pb, err := ParsePlaybookYAML(payload)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"valid": true, "playbook": pb})
}

type createRunRequest struct {
	Seed           string `json:"seed"`
	Playbook       string `json:"playbook"`
	IdempotencyKey string `json:"idempotencyKey,omitempty"`
}

func (s *Server) handleCreateRun(w http.ResponseWriter, r *http.Request, caseID string) {
	var req createRunRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json")
		return
	}
	seed := strings.TrimSpace(req.Seed)
	if seed == "" {
		writeJSONError(w, http.StatusBadRequest, "seed is required")
		return
	}
	pb, err := ParsePlaybookYAML([]byte(req.Playbook))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	run, err := s.store.CreateRun(caseID, seed, pb)
	if err != nil {
		if err.Error() == "case not found" {
			writeJSONError(w, http.StatusNotFound, err.Error())
			return
		}
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	seedTaskKey := strings.TrimSpace(req.IdempotencyKey)
	if seedTaskKey != "" {
		seedTaskKey += "|seed"
	}
	_, err = s.store.IngestSeedWithOptions(caseID, seed, IngestSeedOptions{RunID: run.ID, CreateTask: true, IdempotencyKey: seedTaskKey})
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}
	tasks := s.store.GetRunTasks(run.ID)
	seedTaskID := ""
	for _, t := range tasks {
		if t.Module == "seed_ingest" {
			seedTaskID = t.ID
			break
		}
	}
	s.store.EnqueuePlaybookTasks(caseID, run.ID, pb, seedTaskID, strings.TrimSpace(req.IdempotencyKey))

	details, err := s.store.GetRun(caseID, run.ID)
	if err != nil {
		writeJSONError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusAccepted, details)
}

func (s *Server) handleGetRun(w http.ResponseWriter, caseID, runID string) {
	details, err := s.store.GetRun(caseID, strings.TrimSpace(runID))
	if err != nil {
		writeJSONError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, details)
}

func (s *Server) handleRunRoutes(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/runs/")
	parts := strings.Split(path, "/")
	if len(parts) != 2 || strings.TrimSpace(parts[1]) != "dag" {
		writeJSONError(w, http.StatusNotFound, "not found")
		return
	}
	dag, err := s.store.GetRunDAG(strings.TrimSpace(parts[0]))
	if err != nil {
		writeJSONError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, dag)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeJSONError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
