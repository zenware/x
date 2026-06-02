# Glean Component Matrix

This matrix summarizes the major systems required for a production-grade OSINT suite centered on graph-native investigations and evidence provenance.

---

## Shared Platform Components

| Component | Usage |
|---|---|
| Investigation Workspace | Cases, saved queries, pinned subgraphs, analyst notes |
| Graph Store | Canonical entities, typed edges, traversal queries |
| Evidence Store | Raw payloads, screenshots, files, captures |
| Search / Index | Full-text and faceted evidence lookup |
| Orchestrator | Playbooks, recursion, retries, quotas, policies |
| Queue / Scheduler | Async work, backpressure, prioritization |
| Plugin Runtime | Extensible connectors and analyzers |
| Browser Pool | Public web rendering and capture |
| Secrets / Token Manager | API keys, token rotation, lease accounting |
| Routing Policy Engine | Proxy / egress controls per source class |
| Watch Service | Continuous monitoring and diff generation |
| Notification Layer | Alerts, digests, webhooks, chat/email delivery |
| Identity / Access Control | Workspace isolation, roles, auditability |
| Audit / Provenance Layer | Source lineage, suppression, replay, branch pruning |

---

## Domain-Specific Components

### 1. Entity Resolution
- canonicalization
- alias tracking
- reversible merges

### 2. Relationship Extraction
- cross-source edge generation
- observation-to-edge materialization
- evidence linking

### 3. Godmode Graph UX
- force-directed rendering
- progressive disclosure
- subgraph focus tools

### 4. Geospatial / Timeline Overlay
- map plotting
- temporal replay
- infrastructure movement analysis

### 5. Playbook System
- declarative workflows
- version control
- policy guardrails

### 6. Watchdogs
- scheduled refresh
- state diffing
- alert production

### 7. Source Governance
- quota handling
- licensing / terms tagging
- source reliability scoring

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Investigation Workspace | Build |
| Graph Store | Buy / Adopt |
| Search / Index | Buy / Adopt |
| Evidence Store | Buy / Adopt |
| Orchestrator | Build |
| Queue / Scheduler | Buy / Adopt |
| Plugin Runtime | Build |
| Browser Pool | Build |
| Token / Secret Management | Hybrid |
| Routing Policy Engine | Build |
| Watch Service | Build |
| Notification Layer | Hybrid |
| Identity / Access Control | Hybrid |
| Provenance / Branch Pruning | Build |
