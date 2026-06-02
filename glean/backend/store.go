package main

import (
	"errors"
	"fmt"
	"net"
	"net/mail"
	"sort"
	"strings"
	"sync"
	"time"
)

type NodeType string

const (
	NodeTypeDomain NodeType = "domain"
	NodeTypeEmail  NodeType = "email"
	NodeTypeIP     NodeType = "ip"
)

type TaskState string

const (
	TaskStateQueued     TaskState = "queued"
	TaskStateRunning    TaskState = "running"
	TaskStateRetrying   TaskState = "retrying"
	TaskStateFailed     TaskState = "failed"
	TaskStateCompleted  TaskState = "completed"
	TaskStateDeadletter TaskState = "deadletter"
)

type Case struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
}

type Seed struct {
	ID        string    `json:"id"`
	CaseID    string    `json:"caseId"`
	Type      NodeType  `json:"type"`
	Value     string    `json:"value"`
	CreatedAt time.Time `json:"createdAt"`
}

type Node struct {
	ID        string    `json:"id"`
	CaseID    string    `json:"caseId"`
	Type      NodeType  `json:"type"`
	Value     string    `json:"value"`
	IsSeed    bool      `json:"isSeed"`
	Source    string    `json:"source"`
	CreatedAt time.Time `json:"createdAt"`
}

type Edge struct {
	ID        string    `json:"id"`
	CaseID    string    `json:"caseId"`
	From      string    `json:"from"`
	To        string    `json:"to"`
	Relation  string    `json:"relation"`
	CreatedAt time.Time `json:"createdAt"`
}

type Graph struct {
	CaseID string `json:"caseId"`
	Nodes  []Node `json:"nodes"`
	Edges  []Edge `json:"edges"`
}

type IngestResult struct {
	SeedID        string `json:"seedId"`
	RunID         string `json:"runId"`
	SeedNodeID    string `json:"seedNodeId"`
	RelatedNodeID string `json:"relatedNodeId"`
}

type IngestSeedOptions struct {
	RunID          string
	CreateTask     bool
	ParentTaskID   string
	IdempotencyKey string
}

type TaskTransition struct {
	State   TaskState `json:"state"`
	At      time.Time `json:"at"`
	Attempt int       `json:"attempt"`
	Message string    `json:"message,omitempty"`
}

type Task struct {
	ID               string           `json:"id"`
	CaseID           string           `json:"caseId"`
	RunID            string           `json:"runId"`
	Module           string           `json:"module"`
	ParentTaskID     string           `json:"parentTaskId,omitempty"`
	DependsOnTaskIDs []string         `json:"dependsOnTaskIds,omitempty"`
	State            TaskState        `json:"state"`
	Attempts         int              `json:"attempts"`
	MaxRetries       int              `json:"maxRetries"`
	SimulateFailures int              `json:"simulateFailures"`
	IdempotencyKey   string           `json:"idempotencyKey,omitempty"`
	NextAttemptAt    *time.Time       `json:"nextAttemptAt,omitempty"`
	LastError        string           `json:"lastError,omitempty"`
	CreatedAt        time.Time        `json:"createdAt"`
	UpdatedAt        time.Time        `json:"updatedAt"`
	Transitions      []TaskTransition `json:"transitions"`
}

type EnqueueTaskInput struct {
	CaseID           string
	RunID            string
	Module           string
	ParentTaskID     string
	DependsOnTaskIDs []string
	MaxRetries       int
	SimulateFailures int
	IdempotencyKey   string
}

type Run struct {
	ID        string    `json:"id"`
	CaseID    string    `json:"caseId"`
	Seed      string    `json:"seed"`
	Playbook  Playbook  `json:"playbook"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type RunDetails struct {
	Run   Run    `json:"run"`
	Tasks []Task `json:"tasks"`
}

type TaskEdge struct {
	FromTaskID string `json:"fromTaskId"`
	ToTaskID   string `json:"toTaskId"`
	Relation   string `json:"relation"`
}

type RunDAG struct {
	RunID string     `json:"runId"`
	Tasks []Task     `json:"tasks"`
	Edges []TaskEdge `json:"edges"`
}

type Store struct {
	mu         sync.RWMutex
	seq        int
	cases      map[string]Case
	seeds      map[string]Seed
	nodes      map[string]Node
	edges      map[string]Edge
	runs       map[string]Run
	runTaskIDs map[string][]string
	tasks      map[string]*Task
	taskByKey  map[string]string
	workerWake chan struct{}
}

func NewStore() *Store {
	s := &Store{
		cases:      make(map[string]Case),
		seeds:      make(map[string]Seed),
		nodes:      make(map[string]Node),
		edges:      make(map[string]Edge),
		runs:       make(map[string]Run),
		runTaskIDs: make(map[string][]string),
		tasks:      make(map[string]*Task),
		taskByKey:  make(map[string]string),
		workerWake: make(chan struct{}, 1),
	}
	go s.workerLoop()
	return s
}

func (s *Store) nextID(prefix string) string {
	s.seq++
	return fmt.Sprintf("%s-%d", prefix, s.seq)
}

func NormalizeSeed(raw string) (NodeType, string, error) {
	value := strings.ToLower(strings.TrimSpace(raw))
	if value == "" {
		return "", "", errors.New("seed value is required")
	}
	if ip := net.ParseIP(value); ip != nil {
		return NodeTypeIP, ip.String(), nil
	}
	if addr, err := mail.ParseAddress(value); err == nil {
		email := strings.ToLower(strings.TrimSpace(addr.Address))
		parts := strings.Split(email, "@")
		if len(parts) == 2 && isLikelyDomain(parts[1]) {
			return NodeTypeEmail, email, nil
		}
	}
	if isLikelyDomain(value) {
		return NodeTypeDomain, value, nil
	}
	return "", "", errors.New("unsupported seed format")
}

func isLikelyDomain(v string) bool {
	if strings.Count(v, ".") < 1 || strings.ContainsAny(v, " /:@") {
		return false
	}
	parts := strings.Split(v, ".")
	for _, p := range parts {
		if p == "" {
			return false
		}
	}
	return true
}

func (s *Store) CreateCase(name string) Case {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now().UTC()
	c := Case{ID: s.nextID("case"), Name: strings.TrimSpace(name), CreatedAt: now}
	s.cases[c.ID] = c
	return c
}

func (s *Store) CreateRun(caseID, seed string, playbook Playbook) (Run, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.cases[caseID]; !ok {
		return Run{}, errors.New("case not found")
	}
	now := time.Now().UTC()
	r := Run{ID: s.nextID("run"), CaseID: caseID, Seed: seed, Playbook: playbook, Status: string(TaskStateQueued), CreatedAt: now, UpdatedAt: now}
	s.runs[r.ID] = r
	return r, nil
}

func (s *Store) IngestSeed(caseID, raw string) (IngestResult, error) {
	return s.IngestSeedWithOptions(caseID, raw, IngestSeedOptions{})
}

func (s *Store) IngestSeedWithOptions(caseID, raw string, opts IngestSeedOptions) (IngestResult, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.cases[caseID]; !ok {
		return IngestResult{}, errors.New("case not found")
	}
	seedType, seedValue, err := NormalizeSeed(raw)
	if err != nil {
		return IngestResult{}, err
	}

	now := time.Now().UTC()
	seedID := s.nextID("seed")
	s.seeds[seedID] = Seed{ID: seedID, CaseID: caseID, Type: seedType, Value: seedValue, CreatedAt: now}

	runID := opts.RunID
	if runID == "" {
		runID = s.nextID("run")
	}

	seedNodeID := s.nextID("node")
	s.nodes[seedNodeID] = Node{ID: seedNodeID, CaseID: caseID, Type: seedType, Value: seedValue, IsSeed: true, Source: "seed", CreatedAt: now}

	relatedNodeID := s.nextID("node")
	relatedType, relatedValue := mockRelatedNode(seedType, seedValue)
	s.nodes[relatedNodeID] = Node{ID: relatedNodeID, CaseID: caseID, Type: relatedType, Value: relatedValue, Source: "mock_enrichment", CreatedAt: now}
	relatedNodeID2 := s.nextID("node")
	s.nodes[relatedNodeID2] = Node{ID: relatedNodeID2, CaseID: caseID, Type: NodeTypeIP, Value: "203.0.113.7", Source: "mock_enrichment", CreatedAt: now}

	edgeID := s.nextID("edge")
	s.edges[edgeID] = Edge{ID: edgeID, CaseID: caseID, From: seedNodeID, To: relatedNodeID, Relation: "enriched_to", CreatedAt: now}
	edgeID2 := s.nextID("edge")
	s.edges[edgeID2] = Edge{ID: edgeID2, CaseID: caseID, From: seedNodeID, To: relatedNodeID2, Relation: "enriched_to", CreatedAt: now}

	if opts.CreateTask && opts.RunID != "" {
		s.createCompletedTaskLocked(EnqueueTaskInput{
			CaseID:         caseID,
			RunID:          opts.RunID,
			Module:         "seed_ingest",
			ParentTaskID:   opts.ParentTaskID,
			IdempotencyKey: opts.IdempotencyKey,
		})
	}

	return IngestResult{SeedID: seedID, RunID: runID, SeedNodeID: seedNodeID, RelatedNodeID: relatedNodeID}, nil
}

func mockRelatedNode(seedType NodeType, seedValue string) (NodeType, string) {
	if seedType == NodeTypeEmail {
		parts := strings.Split(seedValue, "@")
		if len(parts) == 2 {
			return NodeTypeDomain, parts[1]
		}
		return NodeTypeDomain, "example.com"
	}
	if seedType == NodeTypeDomain {
		return NodeTypeEmail, "investigate@" + seedValue
	}
	return NodeTypeDomain, "example.org"
}

func (s *Store) GetCaseGraph(caseID string, depth int) (Graph, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if _, ok := s.cases[caseID]; !ok {
		return Graph{}, errors.New("case not found")
	}
	if depth < 0 {
		return Graph{}, errors.New("depth must be non-negative")
	}
	nodes := make([]Node, 0)
	for _, n := range s.nodes {
		if n.CaseID != caseID {
			continue
		}
		if depth == 0 && !n.IsSeed {
			continue
		}
		nodes = append(nodes, n)
	}
	edges := make([]Edge, 0)
	if depth > 0 {
		for _, e := range s.edges {
			if e.CaseID == caseID {
				edges = append(edges, e)
			}
		}
	}
	sort.Slice(nodes, func(i, j int) bool { return nodes[i].CreatedAt.Before(nodes[j].CreatedAt) })
	sort.Slice(edges, func(i, j int) bool { return edges[i].CreatedAt.Before(edges[j].CreatedAt) })
	return Graph{CaseID: caseID, Nodes: nodes, Edges: edges}, nil
}

func (s *Store) EnqueuePlaybookTasks(caseID, runID string, pb Playbook, seedTaskID, idempotencyPrefix string) []Task {
	moduleTaskIDs := make(map[string]string, len(pb.Modules))
	out := make([]Task, 0, len(pb.Modules))
	for _, mod := range pb.Modules {
		deps := make([]string, 0, len(mod.DependsOn)+1)
		if len(mod.DependsOn) == 0 && seedTaskID != "" {
			deps = append(deps, seedTaskID)
		}
		for _, dep := range mod.DependsOn {
			deps = append(deps, moduleTaskIDs[dep])
		}
		key := ""
		if idempotencyPrefix != "" {
			key = idempotencyPrefix + "|" + mod.Name
		}
		retries := mod.MaxRetries
		if retries == 0 {
			retries = 2
		}
		t := s.EnqueueTask(EnqueueTaskInput{
			CaseID:           caseID,
			RunID:            runID,
			Module:           mod.Name,
			ParentTaskID:     seedTaskID,
			DependsOnTaskIDs: deps,
			MaxRetries:       retries,
			SimulateFailures: mod.SimulateFailures,
			IdempotencyKey:   key,
		})
		moduleTaskIDs[mod.Name] = t.ID
		out = append(out, t)
	}
	return out
}

func (s *Store) EnqueueTask(in EnqueueTaskInput) Task {
	s.mu.Lock()
	defer s.mu.Unlock()
	if in.IdempotencyKey != "" {
		if existing, ok := s.taskByKey[in.IdempotencyKey]; ok {
			return s.copyTaskLocked(existing)
		}
	}
	now := time.Now().UTC()
	t := &Task{
		ID:               s.nextID("task"),
		CaseID:           in.CaseID,
		RunID:            in.RunID,
		Module:           strings.TrimSpace(in.Module),
		ParentTaskID:     in.ParentTaskID,
		DependsOnTaskIDs: append([]string(nil), in.DependsOnTaskIDs...),
		State:            TaskStateQueued,
		MaxRetries:       in.MaxRetries,
		SimulateFailures: in.SimulateFailures,
		IdempotencyKey:   in.IdempotencyKey,
		CreatedAt:        now,
		UpdatedAt:        now,
	}
	s.addTransitionLocked(t, TaskStateQueued, "queued", 0)
	s.tasks[t.ID] = t
	s.runTaskIDs[in.RunID] = append(s.runTaskIDs[in.RunID], t.ID)
	if in.IdempotencyKey != "" {
		s.taskByKey[in.IdempotencyKey] = t.ID
	}
	s.signalWorkerLocked()
	return s.copyTask(t)
}

func (s *Store) createCompletedTaskLocked(in EnqueueTaskInput) Task {
	if in.IdempotencyKey != "" {
		if existing, ok := s.taskByKey[in.IdempotencyKey]; ok {
			return s.copyTaskLocked(existing)
		}
	}
	now := time.Now().UTC()
	t := &Task{
		ID:             s.nextID("task"),
		CaseID:         in.CaseID,
		RunID:          in.RunID,
		Module:         strings.TrimSpace(in.Module),
		ParentTaskID:   in.ParentTaskID,
		IdempotencyKey: in.IdempotencyKey,
		State:          TaskStateCompleted,
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	s.addTransitionLocked(t, TaskStateQueued, "queued", 0)
	s.addTransitionLocked(t, TaskStateRunning, "running inline", 1)
	s.addTransitionLocked(t, TaskStateCompleted, "completed inline", 1)
	s.tasks[t.ID] = t
	s.runTaskIDs[in.RunID] = append(s.runTaskIDs[in.RunID], t.ID)
	if in.IdempotencyKey != "" {
		s.taskByKey[in.IdempotencyKey] = t.ID
	}
	return s.copyTask(t)
}

func (s *Store) workerLoop() {
	ticker := time.NewTicker(20 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			s.processOneTask()
		case <-s.workerWake:
			s.processOneTask()
		}
	}
}

func (s *Store) processOneTask() {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now().UTC()

	for _, t := range s.tasks {
		if (t.State == TaskStateQueued || t.State == TaskStateRetrying) && s.depHasDeadletterLocked(t) {
			t.LastError = "dependency deadlettered"
			s.addTransitionLocked(t, TaskStateDeadletter, t.LastError, t.Attempts)
		}
	}

	var next *Task
	for _, t := range s.tasks {
		if !s.isRunnableLocked(t, now) || !s.depsCompletedLocked(t) {
			continue
		}
		if next == nil || t.CreatedAt.Before(next.CreatedAt) {
			next = t
		}
	}
	if next == nil {
		return
	}

	next.Attempts++
	s.addTransitionLocked(next, TaskStateRunning, "task started", next.Attempts)
	if next.Attempts <= next.SimulateFailures {
		next.LastError = fmt.Sprintf("simulated failure on attempt %d", next.Attempts)
		s.addTransitionLocked(next, TaskStateFailed, next.LastError, next.Attempts)
		if next.Attempts <= next.MaxRetries {
			nextAt := now.Add(time.Duration(next.Attempts*25) * time.Millisecond)
			next.NextAttemptAt = &nextAt
			s.addTransitionLocked(next, TaskStateRetrying, "retry scheduled", next.Attempts)
			s.signalWorkerLocked()
			return
		}
		s.addTransitionLocked(next, TaskStateDeadletter, "max retries exceeded", next.Attempts)
		return
	}
	next.NextAttemptAt = nil
	next.LastError = ""
	s.addTransitionLocked(next, TaskStateCompleted, "task completed", next.Attempts)
}

func (s *Store) GetTask(taskID string) (Task, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	t, ok := s.tasks[taskID]
	if !ok {
		return Task{}, false
	}
	return s.copyTask(t), true
}

func (s *Store) GetRun(caseID, runID string) (RunDetails, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	r, ok := s.runs[runID]
	if !ok || r.CaseID != caseID {
		return RunDetails{}, errors.New("run not found")
	}
	tasks := s.copyRunTasksLocked(runID)
	r.Status = deriveRunStatus(tasks)
	r.UpdatedAt = latestTaskTime(r.UpdatedAt, tasks)
	return RunDetails{Run: r, Tasks: tasks}, nil
}

func (s *Store) GetRunTasks(runID string) []Task {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.copyRunTasksLocked(runID)
}

func (s *Store) GetRunDAG(runID string) (RunDAG, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if _, ok := s.runs[runID]; !ok {
		return RunDAG{}, errors.New("run not found")
	}
	tasks := s.copyRunTasksLocked(runID)
	edges := make([]TaskEdge, 0)
	for _, t := range tasks {
		for _, dep := range t.DependsOnTaskIDs {
			if dep == "" {
				continue
			}
			edges = append(edges, TaskEdge{FromTaskID: dep, ToTaskID: t.ID, Relation: "depends_on"})
		}
		if t.ParentTaskID != "" {
			edges = append(edges, TaskEdge{FromTaskID: t.ParentTaskID, ToTaskID: t.ID, Relation: "spawned"})
		}
	}
	return RunDAG{RunID: runID, Tasks: tasks, Edges: edges}, nil
}

func (s *Store) copyRunTasksLocked(runID string) []Task {
	ids := s.runTaskIDs[runID]
	out := make([]Task, 0, len(ids))
	for _, id := range ids {
		if t, ok := s.tasks[id]; ok {
			out = append(out, s.copyTask(t))
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].CreatedAt.Before(out[j].CreatedAt) })
	return out
}

func deriveRunStatus(tasks []Task) string {
	if len(tasks) == 0 {
		return string(TaskStateQueued)
	}
	completed := 0
	for _, t := range tasks {
		switch t.State {
		case TaskStateDeadletter:
			return "failed"
		case TaskStateCompleted:
			completed++
		case TaskStateQueued, TaskStateRunning, TaskStateRetrying, TaskStateFailed:
			return "running"
		}
	}
	if completed == len(tasks) {
		return "completed"
	}
	return "running"
}

func latestTaskTime(base time.Time, tasks []Task) time.Time {
	latest := base
	for _, t := range tasks {
		if t.UpdatedAt.After(latest) {
			latest = t.UpdatedAt
		}
	}
	return latest
}

func (s *Store) signalWorkerLocked() {
	select {
	case s.workerWake <- struct{}{}:
	default:
	}
}

func (s *Store) isRunnableLocked(t *Task, now time.Time) bool {
	if t.State == TaskStateQueued {
		return true
	}
	if t.State != TaskStateRetrying {
		return false
	}
	if t.NextAttemptAt == nil {
		return true
	}
	return !t.NextAttemptAt.After(now)
}

func (s *Store) depsCompletedLocked(t *Task) bool {
	for _, depID := range t.DependsOnTaskIDs {
		dep, ok := s.tasks[depID]
		if !ok || dep.State != TaskStateCompleted {
			return false
		}
	}
	return true
}

func (s *Store) depHasDeadletterLocked(t *Task) bool {
	for _, depID := range t.DependsOnTaskIDs {
		dep, ok := s.tasks[depID]
		if ok && dep.State == TaskStateDeadletter {
			return true
		}
	}
	return false
}

func (s *Store) addTransitionLocked(t *Task, state TaskState, msg string, attempt int) {
	now := time.Now().UTC()
	t.State = state
	t.UpdatedAt = now
	t.Transitions = append(t.Transitions, TaskTransition{State: state, At: now, Attempt: attempt, Message: msg})
}

func (s *Store) copyTaskLocked(id string) Task {
	return s.copyTask(s.tasks[id])
}

func (s *Store) copyTask(in *Task) Task {
	out := *in
	out.DependsOnTaskIDs = append([]string(nil), in.DependsOnTaskIDs...)
	out.Transitions = append([]TaskTransition(nil), in.Transitions...)
	if in.NextAttemptAt != nil {
		t := *in.NextAttemptAt
		out.NextAttemptAt = &t
	}
	return out
}
