# Modular Architecture

To scale from a laptop to a distributed deployment, the platform needs a **small, stable core** with **loosely coupled adapters and analyzers** around it.

---

## Core Services

| Service | Responsibility |
|---|---|
| API / Gateway | Authentication, investigations, query API, streaming updates |
| Orchestrator | Playbook execution, task DAG, retries, quotas, policy enforcement |
| Graph Store | Canonical entities, edges, observations, provenance branches |
| Search Index | Fast text and faceted search across evidence and entities |
| Browser Pool | Managed headless sessions for JS-heavy public sources |
| Plugin Runtime | Sandboxed execution for connectors and analyzers |
| Watch Service | Periodic refresh, diffing, and alert generation |
| Evidence Store | Raw payloads, screenshots, captures, and source artifacts |
| Notification Service | Webhooks, email, chat, and in-product alerts |

---

## Polyglot Plugin Model

The plugin surface should let teams add new collectors or analyzers without recompiling the core application.

### Design Rules
- Define a language-neutral plugin contract over gRPC, WASI, or another stable RPC boundary
- Pass canonical entity types and typed observations across that boundary
- Require plugins to declare:
  - accepted inputs
  - emitted entity and edge types
  - rate / cost profile
  - required secrets
  - legal / policy tags

### Good Plugin Categories
- API connectors
- browser-driven collectors
- parsers / extractors
- entity resolvers
- change detectors
- scoring / triage modules

---

## Graph Backend Choice

The primary persistence layer should be a **graph database or embedded graph engine**, not only relational tables.

Why:

- investigations pivot through relationships constantly
- recursive traversals are a first-class workload
- provenance branches map naturally onto graph structures
- neighborhood queries must stay fast as the graph grows

### Practical Storage Split

| Data Type | Recommended Store |
|---|---|
| Canonical nodes and edges | Graph database |
| Large raw evidence blobs | Object store / filesystem |
| Full-text evidence search | Search index |
| Job state and quotas | Relational / key-value store |
| Cached source responses | TTL cache |

---

## Provenance-Aware Branching

Every relationship should be attributable to:

- source module
- source instance / account
- collection time
- raw evidence artifact
- normalization version
- confidence score

This makes branch-level pruning possible. If a source is later deemed unreliable, the system can:

1. identify the affected observations
2. remove or suppress their derived edges
3. recompute impacted aggregate scores
4. preserve the audit trail of what changed

---

## Distributed Deployment Shape

### Laptop / Single Node
- one local graph store
- one local worker pool
- embedded cache
- optional local browser sessions

### Team / Shared Deployment
- central API and graph store
- multiple worker queues by source class
- shared browser pool
- secrets manager
- alerting and role-based access controls

### Large Deployment
- regional workers
- egress policy by source jurisdiction
- cost-aware scheduling
- source health and quota forecasting

---

## Failure Isolation

- browser crashes should not poison orchestration
- one noisy source should not starve the queue
- plugin failures should produce explicit error artifacts
- partial graph updates should remain replayable and auditable
