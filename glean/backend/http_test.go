package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestHandlersEndToEnd(t *testing.T) {
	srv := NewServer(NewStore())
	h := srv.Routes()

	createRes := httptest.NewRecorder()
	h.ServeHTTP(createRes, httptest.NewRequest(http.MethodPost, "/api/v1/cases", bytes.NewBufferString(`{"name":"case-a"}`)))
	if createRes.Code != http.StatusCreated {
		t.Fatalf("create case status: %d", createRes.Code)
	}

	var created Case
	if err := json.Unmarshal(createRes.Body.Bytes(), &created); err != nil {
		t.Fatalf("unmarshal case: %v", err)
	}
	if created.ID == "" {
		t.Fatalf("missing case id")
	}

	ingestRes := httptest.NewRecorder()
	ingestPath := "/api/v1/cases/" + created.ID + "/seeds"
	h.ServeHTTP(ingestRes, httptest.NewRequest(http.MethodPost, ingestPath, bytes.NewBufferString(`{"value":"User@Example.com"}`)))
	if ingestRes.Code != http.StatusCreated {
		t.Fatalf("ingest status: %d body=%s", ingestRes.Code, ingestRes.Body.String())
	}

	graphRes := httptest.NewRecorder()
	graphPath := "/api/v1/cases/" + created.ID + "/graph?depth=1"
	h.ServeHTTP(graphRes, httptest.NewRequest(http.MethodGet, graphPath, nil))
	if graphRes.Code != http.StatusOK {
		t.Fatalf("graph status: %d", graphRes.Code)
	}

	var graph Graph
	if err := json.Unmarshal(graphRes.Body.Bytes(), &graph); err != nil {
		t.Fatalf("unmarshal graph: %v", err)
	}
	if graph.CaseID != created.ID {
		t.Fatalf("graph case mismatch")
	}
	if len(graph.Nodes) < 3 || len(graph.Edges) < 2 {
		t.Fatalf("expected seed + children in graph")
	}
}

func TestHealth(t *testing.T) {
	srv := NewServer(NewStore())
	res := httptest.NewRecorder()
	srv.Routes().ServeHTTP(res, httptest.NewRequest(http.MethodGet, "/health", nil))
	if res.Code != http.StatusOK {
		t.Fatalf("health status: %d", res.Code)
	}
}

func TestPreflightAndCORS(t *testing.T) {
	srv := NewServer(NewStore())
	req := httptest.NewRequest(http.MethodOptions, "/api/v1/cases", nil)
	req.Header.Set("Origin", "http://localhost:3001")
	req.Header.Set("Access-Control-Request-Method", http.MethodPost)
	req.Header.Set("Access-Control-Request-Headers", "Content-Type")

	res := httptest.NewRecorder()
	srv.Routes().ServeHTTP(res, req)

	if res.Code != http.StatusNoContent {
		t.Fatalf("preflight status: %d", res.Code)
	}
	if got := res.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:3001" {
		t.Fatalf("allow origin mismatch: %q", got)
	}
	if got := res.Header().Get("Access-Control-Allow-Headers"); got != "Content-Type" {
		t.Fatalf("allow headers mismatch: %q", got)
	}
}

func TestDocsAndOpenAPI(t *testing.T) {
	srv := NewServer(NewStore())
	h := srv.Routes()

	docsRes := httptest.NewRecorder()
	h.ServeHTTP(docsRes, httptest.NewRequest(http.MethodGet, "/docs", nil))
	if docsRes.Code != http.StatusOK {
		t.Fatalf("docs status: %d", docsRes.Code)
	}
	if got := docsRes.Header().Get("Content-Type"); !strings.Contains(got, "text/html") {
		t.Fatalf("docs content type: %q", got)
	}
	if body := docsRes.Body.String(); !strings.Contains(body, "/openapi.json") {
		t.Fatalf("docs body missing openapi link")
	}

	specRes := httptest.NewRecorder()
	h.ServeHTTP(specRes, httptest.NewRequest(http.MethodGet, "/openapi.json", nil))
	if specRes.Code != http.StatusOK {
		t.Fatalf("openapi status: %d", specRes.Code)
	}

	var spec struct {
		OpenAPI string                    `json:"openapi"`
		Paths   map[string]map[string]any `json:"paths"`
	}
	if err := json.Unmarshal(specRes.Body.Bytes(), &spec); err != nil {
		t.Fatalf("unmarshal openapi: %v", err)
	}
	if spec.OpenAPI == "" {
		t.Fatalf("missing openapi version")
	}
	if _, ok := spec.Paths["/api/v1/cases"]; !ok {
		t.Fatalf("missing cases path in spec")
	}
}

func TestRunPipelineRetryAndDAG(t *testing.T) {
	srv := NewServer(NewStore())
	h := srv.Routes()

	createRes := httptest.NewRecorder()
	h.ServeHTTP(createRes, httptest.NewRequest(http.MethodPost, "/api/v1/cases", bytes.NewBufferString(`{"name":"case-pipeline"}`)))
	if createRes.Code != http.StatusCreated {
		t.Fatalf("create case status: %d", createRes.Code)
	}
	var created Case
	if err := json.Unmarshal(createRes.Body.Bytes(), &created); err != nil {
		t.Fatalf("unmarshal case: %v", err)
	}

	playbook := `name: "Infrastructure scan"
policy:
  maxDepth: 2
  maxParallelTasks: 2
modules:
  - name: dns_lookup
    maxRetries: 2
    simulateFailures: 1
  - name: whois_lookup
    dependsOn: [dns_lookup]
`
	runReq := map[string]string{
		"seed":           "acme.test",
		"idempotencyKey": "slice-queue-dag",
		"playbook":       playbook,
	}
	body, err := json.Marshal(runReq)
	if err != nil {
		t.Fatalf("marshal run request: %v", err)
	}

	runRes := httptest.NewRecorder()
	h.ServeHTTP(runRes, httptest.NewRequest(http.MethodPost, "/api/v1/cases/"+created.ID+"/runs", bytes.NewBuffer(body)))
	if runRes.Code != http.StatusAccepted {
		t.Fatalf("create run status: %d body=%s", runRes.Code, runRes.Body.String())
	}

	var details RunDetails
	if err := json.Unmarshal(runRes.Body.Bytes(), &details); err != nil {
		t.Fatalf("unmarshal run details: %v", err)
	}
	if details.Run.ID == "" {
		t.Fatalf("missing run id")
	}

	// Worker loop is async; poll until run reaches terminal state.
	deadline := time.Now().Add(1200 * time.Millisecond)
	for time.Now().Before(deadline) {
		getRunRes := httptest.NewRecorder()
		h.ServeHTTP(getRunRes, httptest.NewRequest(http.MethodGet, "/api/v1/cases/"+created.ID+"/runs/"+details.Run.ID, nil))
		if getRunRes.Code != http.StatusOK {
			t.Fatalf("get run status: %d body=%s", getRunRes.Code, getRunRes.Body.String())
		}
		if err := json.Unmarshal(getRunRes.Body.Bytes(), &details); err != nil {
			t.Fatalf("unmarshal run details: %v", err)
		}
		if details.Run.Status == "completed" {
			break
		}
		time.Sleep(25 * time.Millisecond)
	}
	if details.Run.Status != "completed" {
		t.Fatalf("expected run completed, got %s", details.Run.Status)
	}

	foundRetry := false
	for _, task := range details.Tasks {
		if task.Module == "dns_lookup" {
			for _, tr := range task.Transitions {
				if tr.State == TaskStateRetrying {
					foundRetry = true
					break
				}
			}
		}
	}
	if !foundRetry {
		t.Fatalf("expected retry transition for dns_lookup")
	}

	dagRes := httptest.NewRecorder()
	h.ServeHTTP(dagRes, httptest.NewRequest(http.MethodGet, "/api/v1/runs/"+details.Run.ID+"/dag", nil))
	if dagRes.Code != http.StatusOK {
		t.Fatalf("dag status: %d body=%s", dagRes.Code, dagRes.Body.String())
	}
	var dag RunDAG
	if err := json.Unmarshal(dagRes.Body.Bytes(), &dag); err != nil {
		t.Fatalf("unmarshal dag: %v", err)
	}
	if len(dag.Tasks) < 3 {
		t.Fatalf("expected seed + playbook tasks in dag, got %d", len(dag.Tasks))
	}
	if len(dag.Edges) == 0 {
		t.Fatalf("expected dag edges")
	}
}
