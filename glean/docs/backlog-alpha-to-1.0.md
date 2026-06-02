# Glean Alpha to 1.0 Backlog (Chronologically Sequenced)

#### [GLN-A1-001] Title: [Backend/API] - Bootstrap Service Topology and Local Dev Harness
**Milestone:** Phase 1: Alpha Core & Local Sandbox (The Skeleton)
**Description:** Establish the initial runtime topology for API, worker, graph persistence, and cache/state services so engineers can run the whole suite locally with one command. This creates a deterministic base for all subsequent features and prevents architecture drift during alpha. It also defines the folder contract between backend engine, frontend app, and shared models.
**Technical Requirements:**
* Create `/Glean/core/api`, `/Glean/core/worker`, `/Glean/core/plugins`, `/Glean/core/models`, `/Glean/app`, and `/Glean/deploy` with module-level READMEs and ownership metadata.
* Add local orchestration via `/Glean/deploy/docker-compose.alpha.yml` (API, worker, Neo4j or embedded graph service, Redis/KeyDB cache) plus `.env.example` and startup scripts.
**Acceptance Criteria (Definition of Done):**
* [ ] `docker compose -f deploy/docker-compose.alpha.yml up` brings all core services to healthy state locally.
* [ ] Cold-start to usable API health endpoint is under 60 seconds on a standard laptop.
* [ ] CI verifies compose config syntax and blocks invalid service wiring changes.

---

#### [GLN-A1-002] Title: [Data Model] - Define Canonical Graph Schema and Versioned Contracts
**Milestone:** Phase 1: Alpha Core & Local Sandbox (The Skeleton)
**Description:** Define first-class entity, observation, and relationship schemas so every enrichment output can be persisted consistently. This enables deterministic graph traversal and prevents ad-hoc payload shape growth in early development. Versioned contracts are required so plugin and UI teams can evolve in parallel without breaking each other.
**Technical Requirements:**
* Implement versioned schemas in `/Glean/core/models/schema/v1` for `Entity`, `Edge`, `Observation`, and `EvidenceArtifact` including `confidence`, `sourceModule`, `collectedAt`, and `caseId`.
* Add migration runner and schema compatibility checks in `/Glean/core/models/migrations` and expose schema version in `/api/v1/meta`.
**Acceptance Criteria (Definition of Done):**
* [ ] All write paths reject invalid payloads with explicit validation errors.
* [ ] Graph queries can traverse `seed -> first hop -> second hop` with typed edges and no null-key failures.
* [ ] Contract tests enforce backward compatibility between schema `v1.x` revisions.

---

#### [GLN-A1-003] Title: [Backend/API] - Seed Ingestion Endpoint and Case Initialization
**Milestone:** Phase 1: Alpha Core & Local Sandbox (The Skeleton)
**Description:** Implement the first operational endpoint to ingest a seed indicator and initialize a case workspace. This is the main entry point for investigators and must normalize input consistently (domain/IP/email) before queuing enrichment. Case initialization should generate the seed node, root timeline event, and audit metadata.
**Technical Requirements:**
* Add `POST /api/v1/cases` and `POST /api/v1/cases/{caseId}/seeds` in `/Glean/core/api` with normalization helpers in `/Glean/core/models/normalization`.
* Persist seed node and case metadata atomically; enqueue `initial_enrichment` task into Redis/KeyDB queue with idempotency key.
**Acceptance Criteria (Definition of Done):**
* [ ] Domain, IP, and email seeds normalize to canonical forms and persist to graph + case store.
* [ ] API p95 latency for seed ingestion is below 250 ms without enrichment execution time.
* [ ] Integration tests cover duplicate seed submission idempotency and malformed indicator rejection.

---

#### [GLN-A1-004] Title: [Worker] - Implement First Mock Enrichment Module (DNS/WHOIS)
**Milestone:** Phase 1: Alpha Core & Local Sandbox (The Skeleton)
**Description:** Build the first enrichment worker path using deterministic mock providers for DNS and WHOIS-like output to validate end-to-end flow without external dependencies. This confirms task ingestion, graph writes, and UI-readability contracts before real connectors are integrated. The worker must emit provenance metadata for every discovered node/edge.
**Technical Requirements:**
* Add `initial_enrichment` worker handler in `/Glean/core/worker/jobs/initial_enrichment` producing child nodes and edges from mock fixtures in `/Glean/core/worker/fixtures`.
* Emit `Observation` records with `sourceModule`, `sourceRunId`, and `collectedAt`; link each edge to observation IDs.
**Acceptance Criteria (Definition of Done):**
* [ ] Enrichment task creates at least one child domain/IP edge from a valid seed using fixtures.
* [ ] Worker throughput is at least 50 mock tasks/minute on local machine with no data races.
* [ ] Unit tests validate provenance fields are present and non-empty for all emitted observations.

---

#### [GLN-A1-005] Title: [Frontend] - Render Seed-Centric Graph Canvas with Sliding Raw Inspector
**Milestone:** Phase 1: Alpha Core & Local Sandbox (The Skeleton)
**Description:** Deliver the first graph UI showing the seed and immediate children with click-selection and a right-side raw data inspector. This creates the baseline investigator loop: ingest seed, view linked nodes, inspect payload details. The visual implementation should already enforce simple progressive disclosure and avoid full data dumping.
**Technical Requirements:**
* Build `/Glean/app/src/features/graph` with force layout rendering and typed node/edge view models fed from `GET /api/v1/cases/{caseId}/graph?depth=1`.
* Implement inspector sheet in `/Glean/app/src/features/inspector` that displays summary + raw JSON + provenance fields for selected node.
**Acceptance Criteria (Definition of Done):**
* [ ] UI renders seed plus first-hop neighbors and updates inspector on node click without full page reload.
* [ ] Frame rate remains above 45 FPS on a graph of 150 nodes in local test dataset.
* [ ] Frontend tests verify selection state, inspector rendering, and API error fallback behavior.

---

#### [GLN-A2-001] Title: [Orchestration] - Build Asynchronous Task Queue Runtime and Retry Semantics
**Milestone:** Phase 2: Alpha Expansion & Async Pipelines (The Nervous System)
**Description:** Implement production-like queue semantics for enrichment tasks so scans can run concurrently without blocking API workflows. This milestone introduces retries, dead-letter behavior, and per-task lifecycle state transitions. It is foundational for scaling beyond single-seed demos.
**Technical Requirements:**
* Add queue abstraction in `/Glean/core/worker/queue` with `queued|running|retrying|failed|deadletter|completed` states persisted in `/Glean/core/state`.
* Implement exponential backoff + jitter, max retry policy, and dead-letter storage endpoint `GET /api/v1/tasks/deadletter`.
**Acceptance Criteria (Definition of Done):**
* [ ] Failed tasks retry according to policy and move to dead-letter after max attempts.
* [ ] Queue sustains 500 queued tasks with stable processing and no duplicate execution under worker restart.
* [ ] Concurrency tests validate at-least-once processing with idempotent graph writes.

---

#### [GLN-A2-002] Title: [Plugins] - Implement Polyglot Plugin Bridge (Go/Rust Core <-> Python/Binary Modules)
**Milestone:** Phase 2: Alpha Expansion & Async Pipelines (The Nervous System)
**Description:** Introduce a language-neutral plugin contract so enrichment modules can be authored in Python, Go, Rust, or native binaries without coupling to core runtime internals. This expands connector velocity while preserving strict IO contracts and sandbox constraints. Plugin bridge must support typed input/output and standardized error envelopes.
**Technical Requirements:**
* Define plugin RPC contract (`Execute`, `Capabilities`, `Health`) under `/Glean/core/plugins/proto` (gRPC or equivalent), with adapters in `/Glean/core/plugins/runtime`.
* Add plugin registry manifest format in `/Glean/core/plugins/manifests` including version, required secrets, accepted indicator types, and risk tags.
**Acceptance Criteria (Definition of Done):**
* [ ] A Python plugin and a native binary plugin both execute through the same runtime contract.
* [ ] Plugin timeouts and non-zero exits return structured failures without crashing worker process.
* [ ] Contract compatibility tests enforce strict schema validation for plugin IO payloads.

---

#### [GLN-A2-003] Title: [Data Provenance] - Persist Discovery Lineage and Source Reliability State
**Milestone:** Phase 2: Alpha Expansion & Async Pipelines (The Nervous System)
**Description:** Implement full lineage tracking to show exactly which module, API account, and run produced each observation and derived edge. This enables investigator trust, reproducibility, and branch-level pruning when a source is later deemed unreliable. Reliability scoring must be stored separately from confidence and freshness.
**Technical Requirements:**
* Extend graph write pipeline to persist `provenancePath`, `sourceRunId`, `sourceAccountId`, `transformVersion`, and `artifactId` in `/Glean/core/models`.
* Add source reliability table/store in `/Glean/core/state/source_reliability` with APIs for adjustments and suppression operations.
**Acceptance Criteria (Definition of Done):**
* [ ] Inspector/API can trace any edge back to module run + raw evidence artifact in one query flow.
* [ ] Source suppression hides affected derived edges without deleting immutable raw artifacts.
* [ ] Tests verify confidence, reliability, and freshness are independently computed and surfaced.

---

#### [GLN-A2-004] Title: [Backend/API] - Declarative Playbook Engine (YAML) with Guardrails
**Milestone:** Phase 2: Alpha Expansion & Async Pipelines (The Nervous System)
**Description:** Build a playbook system allowing investigators to execute reusable, version-controlled workflows from one seed type to many enrichment branches. Guardrails must cap recursion depth, fanout, and cost to prevent queue explosions and noisy graph sprawl. The engine should expose execution plans before run start for operator review.
**Technical Requirements:**
* Implement parser and validator in `/Glean/core/worker/playbooks` with schema supporting `modules`, `on`, `policy`, `watches`, and `maxDepth`.
* Add APIs `POST /api/v1/playbooks/validate` and `POST /api/v1/cases/{caseId}/runs` with dry-run mode returning predicted task DAG.
**Acceptance Criteria (Definition of Done):**
* [ ] Valid playbooks execute deterministically and invalid playbooks fail with actionable validation errors.
* [ ] Guardrail thresholds prevent unbounded recursion even for pathological indicators.
* [ ] Integration tests verify dry-run DAG equals run DAG structure for identical inputs.

---

#### [GLN-A2-005] Title: [Frontend UX] - Omnibox Launcher with Input Recognition and Playbook Suggestions
**Milestone:** Phase 2: Alpha Expansion & Async Pipelines (The Nervous System)
**Description:** Replace static seed entry with a central omnibox that detects indicator format and suggests safe default playbooks. This eliminates early UI friction and aligns with “sane defaults, hidden machinery.” Suggestions should include confidence of parsing and allow one-click run launch.
**Technical Requirements:**
* Build `/Glean/app/src/features/omnibox` with format recognizers (IP, domain, email, URL, phone, handle) and intent parser hooks.
* Integrate suggestion endpoint `POST /api/v1/playbooks/suggest` returning playbook options, required secrets, and estimated task volume.
**Acceptance Criteria (Definition of Done):**
* [ ] Omnibox auto-detects at least 6 indicator classes and suggests at least one valid playbook for each.
* [ ] Median time from paste-to-run initiation is below 2 seconds in local benchmark.
* [ ] E2E tests cover mis-detected input override and empty/ambiguous input handling.

---

#### [GLN-B1-001] Title: [Frontend Graph UX] - Tune Viscous Spring Physics for Stable, Fluid Expansion
**Milestone:** Phase 3: Beta Refinement & "Apple-Like" Polish (The Flesh & Motion)
**Description:** Refine graph motion to feel smooth and legible during expansions, filtering, and layout transitions. Node movement should preserve spatial memory and avoid jumpy repositioning that increases cognitive load. Physics settings need dynamic damping based on graph density.
**Technical Requirements:**
* Implement adaptive physics profiles in `/Glean/app/src/features/graph/physics.ts` with controls for gravity, repulsion, damping, and link length tied to node count.
* Add persisted per-user visual preferences in `/Glean/app/src/features/preferences` and apply defaults from UX configuration service.
**Acceptance Criteria (Definition of Done):**
* [ ] Node expansion transitions are visibly smooth with no teleporting under density changes.
* [ ] Graph interactions maintain >55 FPS on 500-node benchmark on target hardware profile.
* [ ] Visual regression tests validate stable placement variance boundaries for repeated runs.

---

#### [GLN-B1-002] Title: [Frontend Graph UX] - Semantic Clustering and “+N More” Stack Cards
**Milestone:** Phase 3: Beta Refinement & "Apple-Like" Polish (The Flesh & Motion)
**Description:** Implement automatic clustering for high-fanout branches to prevent hairball rendering and preserve analyst focus. Cluster nodes should summarize type/count/source quality and expand only on demand. Low-confidence repetitive branches should auto-collapse by default with override controls.
**Technical Requirements:**
* Add clustering engine in `/Glean/app/src/features/graph/clustering.ts` using edge-type + confidence + source-family heuristics.
* Extend graph API to return pre-cluster candidates and cluster metadata `GET /api/v1/cases/{caseId}/graph?cluster=true`.
**Acceptance Criteria (Definition of Done):**
* [ ] Branches above threshold collapse into stack cards with accurate counts and types.
* [ ] Expanding a cluster preserves context and does not trigger full-canvas relayout reset.
* [ ] Tests cover cluster determinism and correct auto-collapse for noisy low-confidence data.

---

#### [GLN-B1-003] Title: [Frontend Mapping] - Morphing Transition Between Link Graph and Mapbox View
**Milestone:** Phase 3: Beta Refinement & "Apple-Like" Polish (The Flesh & Motion)
**Description:** Implement smooth spatial morph transitions from abstract graph layout to geographic overlay to avoid context loss during view switches. Investigators should understand that they are looking at the same entities in different projections. Geographic uncertainty must be represented with confidence-aware markers.
**Technical Requirements:**
* Integrate Mapbox GL in `/Glean/app/src/features/map` and build transition orchestrator in `/Glean/app/src/features/transitions`.
* Add geo projection endpoint `GET /api/v1/cases/{caseId}/graph/geo` returning coordinates, precision metadata, and source provenance.
**Acceptance Criteria (Definition of Done):**
* [ ] Switching graph/map view preserves selection and inspector context for active node.
* [ ] Morph animation completes within 450 ms median without dropped frames.
* [ ] QA tests verify handling of coarse/unknown geolocation without false precision rendering.

---

#### [GLN-B1-004] Title: [Frontend Timeline] - Chronological Scrubber with Live Graph Filtering
**Milestone:** Phase 3: Beta Refinement & "Apple-Like" Polish (The Flesh & Motion)
**Description:** Add a timeline scrubber that filters visible observations and derived edges by date range in real time. This enables investigators to watch infrastructure and identity relationships evolve without reading raw timestamps. Filter updates should be incremental and non-destructive.
**Technical Requirements:**
* Build timeline component in `/Glean/app/src/features/timeline` supporting year/month/day ranges and playback mode.
* Add API `GET /api/v1/cases/{caseId}/graph/events?from=&to=` optimized for incremental temporal slices.
**Acceptance Criteria (Definition of Done):**
* [ ] Scrubbing updates graph and inspector state in real time with preserved pin/focus settings.
* [ ] Temporal filtering latency is below 200 ms for 10k event dataset.
* [ ] Tests verify inclusive/exclusive boundary correctness and timezone handling.

---

#### [GLN-B1-005] Title: [Frontend Inspector UX] - Sliding Context Cards with Narrative Summaries
**Milestone:** Phase 3: Beta Refinement & "Apple-Like" Polish (The Flesh & Motion)
**Description:** Upgrade the inspector into a narrative-first sliding card that summarizes what a node means before exposing raw payloads. The card should present recommended next actions and evidence sections in collapsible blocks. This supports non-expert workflows while keeping expert depth one click away.
**Technical Requirements:**
* Implement inspector card system in `/Glean/app/src/features/inspector/cards` with summary, provenance, artifacts, and action CTA modules.
* Add server-side summary endpoint `POST /api/v1/analysis/summarize-node` with deterministic fallback templates if summarization is unavailable.
**Acceptance Criteria (Definition of Done):**
* [ ] Inspector opens as non-blocking sliding sheet and never interrupts canvas interaction.
* [ ] At least one actionable next-step CTA appears for supported node types.
* [ ] Accessibility tests pass keyboard navigation and screen-reader labeling for inspector controls.

---

#### [GLN-P1-001] Title: [Security/OPSEC] - API Token Pool, Rotation, and Rate-Limit Recovery
**Milestone:** Phase 4: Hardening, OPSEC & Production Scale (The Armor)
**Description:** Implement secure token pooling and rotation to keep collection reliable under source quotas and avoid operator-facing scan failures. The system must detect rate-limit responses and defer jobs gracefully instead of collapsing entire runs. Rotation and quota telemetry should be visible in run diagnostics.
**Technical Requirements:**
* Build token manager in `/Glean/core/security/tokens` with encrypted storage, lease tracking, and source-specific quota accounting.
* Add queue middleware for 429/backoff handling and deferred task rescheduling with reason codes in `/Glean/core/worker/middleware/rate_limit`.
**Acceptance Criteria (Definition of Done):**
* [ ] 429 responses trigger deferral/backoff without run termination for recoverable conditions.
* [ ] Token rotation supports scheduled and emergency revoke/replace flows without downtime.
* [ ] Security tests confirm tokens are encrypted at rest and never logged in plaintext.

---

#### [GLN-P1-002] Title: [Security/OPSEC] - Module-Level Proxy/Tor Routing Policy Engine
**Milestone:** Phase 4: Hardening, OPSEC & Production Scale (The Armor)
**Description:** Build routing controls so each connector/module can use direct egress, specific proxy pools, or Tor based on policy. This supports passive recon OPSEC and source-specific access behavior. Routing decisions must be auditable and enforceable at execution time.
**Technical Requirements:**
* Implement routing policy model in `/Glean/core/security/routing` with per-module, per-source, and per-case overrides.
* Add worker egress adapter enforcing policy at request layer; record route metadata in task provenance.
**Acceptance Criteria (Definition of Done):**
* [ ] Modules execute through configured route type with deterministic fallback policy.
* [ ] Route choice is visible in task/run diagnostics and audit logs.
* [ ] Network tests verify no bypass of route policy under retry or failover paths.

---

#### [GLN-P1-003] Title: [Security/Data] - Local Database Encryption and Key Lifecycle
**Milestone:** Phase 4: Hardening, OPSEC & Production Scale (The Armor)
**Description:** Encrypt local persistence layers for graph, evidence artifacts, and state stores to protect sensitive investigation data at rest. Introduce key lifecycle management including rotation, backup handling, and recovery procedures. This is mandatory for production-grade local deployments and regulated environments.
**Technical Requirements:**
* Enable encryption at rest for graph + relational/key-value stores, with key provider abstraction in `/Glean/core/security/keys`.
* Implement key rotation CLI/tooling in `/Glean/tools/key-ops` and document disaster recovery in `/Glean/docs/security`.
**Acceptance Criteria (Definition of Done):**
* [ ] Datastores are unreadable without active key material and startup fails safely on key mismatch.
* [ ] Key rotation executes with no data corruption and validated rollback path.
* [ ] Security audit tests validate encryption coverage for all persisted investigation artifacts.

---

#### [GLN-P1-004] Title: [Reliability/QA] - End-to-End Integration Harness for API + Scraping Pipelines
**Milestone:** Phase 4: Hardening, OPSEC & Production Scale (The Armor)
**Description:** Create a full integration test harness that executes representative playbooks across API connectors and browser-based scraping modules. This catches regression risks in orchestration, parsing, and graph write contracts before release. The harness must run deterministically with fixture-backed and live-smoke modes.
**Technical Requirements:**
* Build test framework in `/Glean/tests/integration` with synthetic datasets, mock providers, and optional guarded live source mode.
* Add release gate CI pipeline requiring pass of critical path scenarios (seed ingest -> enrichment -> graph render -> export).
**Acceptance Criteria (Definition of Done):**
* [ ] Critical playbook scenarios run in CI with reproducible pass/fail outcomes.
* [ ] Integration suite completes under defined time budget while covering priority connector paths.
* [ ] Failing runs produce artifact bundles (logs, task traces, graph snapshots) for debugging.

---

#### [GLN-P1-005] Title: [Operations] - Backup/Export, Restore, and Production Deployment Artifacts
**Milestone:** Phase 4: Hardening, OPSEC & Production Scale (The Armor)
**Description:** Deliver operational tooling for backup/export of complete case files plus repeatable deployment manifests for local/prod environments. This enables reliable upgrades, migration, and forensic portability of investigations. Deployment artifacts should support Docker Compose and Nix-based reproducibility.
**Technical Requirements:**
* Implement case export/import in `/Glean/core/api/export` (graph snapshot, evidence artifacts, provenance metadata, checksums).
* Create deployment manifests in `/Glean/deploy` for Docker Compose and Nix flake, including health checks, resource limits, and upgrade notes.
**Acceptance Criteria (Definition of Done):**
* [ ] Full case export/import roundtrip preserves graph integrity and evidence linkage.
* [ ] Deployment scripts can provision a clean environment and pass smoke tests without manual patching.
* [ ] Backup/restore drills are documented and validated with automated integrity checks.

---
