# Glean Backlog: Prototype to Complete Application

This backlog is written as GitHub-ready issue candidates with priorities, dependencies, and acceptance criteria.

---

## Labels

- `area:ui`
- `area:graph`
- `area:orchestration`
- `area:ingestion`
- `area:plugins`
- `area:data-model`
- `area:security`
- `area:ops`
- `area:qa`
- `priority:p0|p1|p2`
- `type:feature|bug|tech-debt|chore`

---

## Epic A — Product Foundations (P0)

| ID | Issue | Type | Priority | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|
| GLN-001 | Bootstrap monorepo structure for `app/`, `api/`, `worker/`, `plugins/`, `docs/` | chore | P0 | None | Standard project layout committed; local dev start command works |
| GLN-002 | Introduce typed domain model (Entity, Observation, Edge, Evidence, Watch) | feature | P0 | GLN-001 | Shared schemas and validation pass for all write paths |
| GLN-003 | Create investigation/case model with workspace isolation | feature | P0 | GLN-001 | Cases can be created, listed, and scoped to organization/workspace |
| GLN-004 | Implement auth baseline (RBAC, session handling, API auth) | feature | P0 | GLN-001 | Role-scoped API access enforced; unauthorized requests rejected |
| GLN-005 | Add audit logging for mutation actions | feature | P0 | GLN-003, GLN-004 | Every create/update/delete stores actor, timestamp, object, diff summary |
| GLN-006 | Add secrets management interface for API tokens | feature | P0 | GLN-004 | Tokens encrypted at rest; rotation and revocation supported |

---

## Epic B — Graph and Provenance Core (P0)

| ID | Issue | Type | Priority | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|
| GLN-010 | Select and integrate graph database backend | feature | P0 | GLN-002 | Node/edge CRUD and multi-hop traversal perform within target latency |
| GLN-011 | Implement provenance chain for all observations and edges | feature | P0 | GLN-002, GLN-010 | Every relationship resolves to source module, artifact, and timestamp |
| GLN-012 | Build evidence artifact store and retrieval API | feature | P0 | GLN-002 | Raw payloads retrievable by artifact ID with metadata |
| GLN-013 | Add confidence/reliability/freshness scoring dimensions | feature | P0 | GLN-002, GLN-011 | Scores computed independently and displayed in API responses |
| GLN-014 | Implement entity merge/unmerge workflow with reversibility | feature | P0 | GLN-010, GLN-011 | Merges are auditable and reversible without data loss |
| GLN-015 | Add branch pruning by source/module reliability | feature | P0 | GLN-011, GLN-013 | Operator can suppress unreliable source branch and recompute graph state |

---

## Epic C — UI: Godmode Experience (P0)

| ID | Issue | Type | Priority | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|
| GLN-020 | Replace static prototype with app shell + state store | feature | P0 | GLN-001 | UI renders from API data; no hardcoded graph catalog |
| GLN-021 | Implement omnibox seed detection and playbook suggestions | feature | P0 | GLN-020 | Domain/email/IP/phone/handle detection with suggested workflow |
| GLN-022 | Progressive disclosure API + UI contract | feature | P0 | GLN-020, GLN-010 | Canvas starts with seed only; one-hop expand only on user action |
| GLN-023 | Semantic clustering with super-node expand/collapse | feature | P0 | GLN-020, GLN-022 | High fan-out branches auto-cluster and expand on demand |
| GLN-024 | Build inspector side sheet with summary + evidence + raw JSON | feature | P0 | GLN-020, GLN-012 | Node click opens non-modal inspector with provenance-linked evidence |
| GLN-025 | Add focus mode path highlighting and graph dimming | feature | P0 | GLN-022 | Selected path to seed is emphasized; non-path nodes dimmed |
| GLN-026 | Add graph filters (type toggles, confidence, timeline) | feature | P0 | GLN-020 | Filters update graph without full reload and preserve selection |
| GLN-027 | Implement pinning and stable node anchors across relayout | feature | P0 | GLN-020 | Pinned nodes retain position when graph updates |
| GLN-028 | Add force/hierarchical layout switch with smooth transitions | feature | P0 | GLN-020 | User can switch layout modes without context loss |

---

## Epic D — Orchestration and Playbooks (P0)

| ID | Issue | Type | Priority | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|
| GLN-030 | Implement async task queue with retries and backoff | feature | P0 | GLN-001 | Tasks process asynchronously with retry metadata and terminal states |
| GLN-031 | Build playbook parser/executor (YAML schema + validation) | feature | P0 | GLN-030, GLN-002 | Invalid playbooks fail validation; valid playbooks execute deterministically |
| GLN-032 | Add recursive enrichment policy controls (depth/fanout/budget) | feature | P0 | GLN-031 | Hard caps prevent runaway recursion and noisy branch explosion |
| GLN-033 | Add run DAG visualization and task lineage API | feature | P0 | GLN-030 | UI can show module chain from seed to current node |
| GLN-034 | Add pause/resume/cancel/replay for playbook runs | feature | P0 | GLN-030 | Operator controls work on live and queued jobs |

---

## Epic E — Ingestion and Traffic Control (P1)

| ID | Issue | Type | Priority | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|
| GLN-040 | Build source connector SDK and baseline adapters | feature | P1 | GLN-001, GLN-031 | New connector can be scaffolded with typed input/output contract |
| GLN-041 | Add per-source quota tracking and token pool manager | feature | P1 | GLN-030, GLN-006 | 429 events queue/defer work instead of failing runs |
| GLN-042 | Add source health monitoring and circuit breaker behavior | feature | P1 | GLN-041 | Unhealthy source auto-pauses with clear operator status |
| GLN-043 | Implement browser worker pool for JS-rendered sources | feature | P1 | GLN-030 | Browser jobs isolated, recoverable, and evidence-capturing |
| GLN-044 | Implement egress routing policy (direct/proxy/pool) | feature | P1 | GLN-041 | Module-level routing policy enforced and visible in job metadata |
| GLN-045 | Build ingestion dedupe and response caching layer | feature | P1 | GLN-040 | Duplicate requests collapse by fingerprint; cache TTL honored |

---

## Epic F — Watchdogs and Change Detection (P1)

| ID | Issue | Type | Priority | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|
| GLN-050 | Create watch rule model and scheduler | feature | P1 | GLN-002, GLN-030 | Watches execute on schedule with scoped entity/subgraph targets |
| GLN-051 | Implement change detectors (new subdomain, cert change, registrar change) | feature | P1 | GLN-050, GLN-010 | Detector outputs include before/after snapshots and confidence |
| GLN-052 | Add alert routing (in-app, webhook, email/chat) | feature | P1 | GLN-050 | Alerts delivered with retry and delivery status visibility |
| GLN-053 | Add watch timeline and historical diff viewer in UI | feature | P1 | GLN-051, GLN-024 | Operator can review change history per watched target |

---

## Epic G — Plugin Runtime and Extensibility (P1)

| ID | Issue | Type | Priority | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|
| GLN-060 | Define language-neutral plugin contract (RPC schema) | feature | P1 | GLN-002 | Contract covers inputs, outputs, metadata, and errors |
| GLN-061 | Implement plugin lifecycle manager (register, version, disable) | feature | P1 | GLN-060 | Plugins are discoverable, versioned, and safely disable-able |
| GLN-062 | Sandbox plugin execution with resource limits | feature | P1 | GLN-061 | Plugin crash/timeout isolated from orchestrator process |
| GLN-063 | Add plugin compliance metadata (terms, legal tags, risk level) | feature | P1 | GLN-061 | Playbooks can restrict modules by compliance tags |

---

## Epic H — Search, Analytics, and Collaboration (P2)

| ID | Issue | Type | Priority | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|
| GLN-070 | Add full-text and faceted search over entities/evidence | feature | P2 | GLN-010, GLN-012 | Investigators can search by indicator, source, date, confidence |
| GLN-071 | Implement saved views, pinned subgraphs, and share links | feature | P2 | GLN-020, GLN-003 | Analysts can persist and reopen scoped investigation state |
| GLN-072 | Add annotations, tagging, and investigation notes | feature | P2 | GLN-003, GLN-024 | Notes are case-scoped, auditable, and searchable |
| GLN-073 | Add map view morph and geospatial overlays | feature | P2 | GLN-020, GLN-010 | Graph-to-map transitions preserve selection and context |
| GLN-074 | Add investigation exports (PDF/JSON evidence bundles) | feature | P2 | GLN-024, GLN-012 | Export includes provenance chain and selected graph snapshot |

---

## Epic I — Quality, Security, and Operations (P0/P1)

| ID | Issue | Type | Priority | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|
| GLN-080 | Establish test pyramid (unit/integration/e2e) for core flows | chore | P0 | GLN-001 | CI enforces baseline coverage and blocks regressions on core flows |
| GLN-081 | Add synthetic graph datasets for hairball and scale testing | chore | P0 | GLN-080 | Repeatable benchmarks for readability and performance |
| GLN-082 | Set SLOs and observability (latency, queue lag, error budgets) | chore | P1 | GLN-030 | Dashboards + alerts for key service health metrics |
| GLN-083 | Security review: authz boundaries, token handling, audit integrity | chore | P0 | GLN-004, GLN-006, GLN-005 | Threat model and remediation checklist completed |
| GLN-084 | Data retention and deletion workflows per workspace policy | feature | P1 | GLN-003, GLN-012 | Policy-driven retention/deletion jobs with audit trail |
| GLN-085 | Migration and backup strategy for graph/evidence stores | chore | P1 | GLN-010, GLN-012 | Verified restore runbook and migration rollback path |

---

## Suggested First 3 Sprints

| Sprint | Target Issues |
|---|---|
| Sprint 1 (stabilize core) | GLN-001, 002, 003, 010, 011, 020, 022, 024, 080 |
| Sprint 2 (usable investigation loop) | GLN-021, 023, 025, 026, 027, 030, 031, 032, 033 |
| Sprint 3 (source reliability + controls) | GLN-034, 040, 041, 042, 043, 044, 050, 051 |

---

## Definition of “Complete Application”

Glean exits prototype status when all of the following are true:

1. End-to-end investigation flow runs on real connectors using playbooks and async orchestration.
2. Graph UI remains readable under high-fanout datasets via clustering + filtering + focus workflows.
3. Every relationship is provenance-backed, evidence-linked, and auditable.
4. Watch rules and change alerts work reliably in production.
5. Security, retention, and operational controls meet documented SLO and audit requirements.
