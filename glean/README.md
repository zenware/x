# Glean: Full-Gamut OSINT Suite Architecture Reference

This directory documents a **public-data-first OSINT platform** built to combine aggressive enrichment breadth with a user-friendly **"godmode" investigation surface**.

The design goal is not just collection. It is to make relationships, provenance, change-over-time, and operator decisions **visible, queryable, and reproducible**.

This reference assumes:

- **Lawful, authorized use only**
- **Public or properly licensed data sources**
- **Explicit provenance for every fact**
- **Operator-visible controls for privacy, routing, and source reliability**

It deliberately excludes intrusion, credential abuse, malware, or collection from systems the operator is not permitted to access.

---

## Contents

| Document | Description |
|---|---|
| [Godmode Visual Analysis](./docs/godmode-visual-analysis.md) | Graph-first investigation UX with force-directed links, geospatial overlays, and timeline scrubbing |
| [UI Experience & Interaction Design](./docs/ui-experience.md) | Anti-hairball graph UX, Apple-like interaction model, and investigator-first curation patterns |
| [Automated Reconnaissance Pipelines](./docs/automated-reconnaissance-pipelines.md) | Recursive enrichment engine, declarative playbooks, and continuous monitoring |
| [Modular Architecture](./docs/modular-architecture.md) | Core services, polyglot plugin model, graph backend, and distributed execution |
| [Data Model](./docs/data-model.md) | Canonical node, edge, observation, provenance, and watch state design |
| [Ingestion & Traffic Control](./docs/ingestion-traffic-control.md) | Rate-limit aware collection, browser automation, queueing, and per-module egress policy |
| [Component Matrix](./docs/component-matrix.md) | Cross-reference of the major subsystems required for a production-grade suite |
| [Backlog: Issues to Production](./docs/backlog-issues.md) | Prioritized issue backlog to evolve Glean from prototype to complete application |
| [Backlog: Alpha to 1.0 (Milestone Sequenced)](./docs/backlog-alpha-to-1.0.md) | Chronologically sequenced issue backlog from Alpha skeleton to production 1.0 |
| [ADR-0001: Godmode UI Interaction Model](./docs/adr/0001-godmode-ui-interaction-model.md) | UI architecture decisions for anti-hairball graph analysis |

---

## Functionality

| Path | Description |
|---|---|
| [`./app/index.html`](./app/index.html) | First-draft Glean UI prototype (omnibox launchpad, progressive graph expansion, clustering, inspector, filtering, timeline, focus mode) |
| [`./app/glean-ui.css`](./app/glean-ui.css) | Visual system for glass panels, graph canvas, controls, and inspector |
| [`./app/glean-ui.js`](./app/glean-ui.js) | Interactive graph behaviors and first-pass layout/interaction logic |
| [`./backend`](./backend) | Alpha backend service (Go) with case creation, seed ingestion, depth-1 graph API, and mock enrichment |
| [`./frontend`](./frontend) | Alpha frontend app (React + TypeScript) consuming live API graph data with inspector UI |

---

## Product Shape

At a high level, a complete build has five layers:

1. **Collection** - API connectors, headless browser jobs, file imports, passive feeds
2. **Normalization** - entity resolution, canonical identifiers, confidence scoring, provenance capture
3. **Graph / Search / State** - relationship storage, timeline events, watch rules, cached enrichments
4. **Orchestration** - playbooks, async work queues, retries, token pools, policy enforcement
5. **Investigation UX** - progressive graph expansion, map/timeline overlays, source evidence panels, alerting

---

## Capability Coverage

| Capability | Primary Design Surface |
|---|---|
| Force-directed graphing | [Godmode Visual Analysis](./docs/godmode-visual-analysis.md) |
| Geospatial and temporal overlays | [Godmode Visual Analysis](./docs/godmode-visual-analysis.md) + [Data Model](./docs/data-model.md) |
| Progressive disclosure | [Godmode Visual Analysis](./docs/godmode-visual-analysis.md) |
| Hairball prevention and cognitive load controls | [UI Experience & Interaction Design](./docs/ui-experience.md) |
| Omnibox launchpad and natural-language intent | [UI Experience & Interaction Design](./docs/ui-experience.md) |
| Recursive enrichment | [Automated Reconnaissance Pipelines](./docs/automated-reconnaissance-pipelines.md) |
| Declarative playbooks | [Automated Reconnaissance Pipelines](./docs/automated-reconnaissance-pipelines.md) |
| Continuous monitoring / watchdogs | [Automated Reconnaissance Pipelines](./docs/automated-reconnaissance-pipelines.md) + [Data Model](./docs/data-model.md) |
| Polyglot plugin system | [Modular Architecture](./docs/modular-architecture.md) |
| Data provenance and branch pruning | [Data Model](./docs/data-model.md) + [Modular Architecture](./docs/modular-architecture.md) |
| Local graph database backend | [Modular Architecture](./docs/modular-architecture.md) |
| Smart rate-limit and token management | [Ingestion & Traffic Control](./docs/ingestion-traffic-control.md) |
| Headless browser integration | [Ingestion & Traffic Control](./docs/ingestion-traffic-control.md) |
| Traffic routing controls | [Ingestion & Traffic Control](./docs/ingestion-traffic-control.md) |

---

## Suggested Build Sequence

| Phase | Outcome |
|---|---|
| Phase 1 | Canonical entity graph, provenance model, manual search + graph UX |
| Phase 2 | Async enrichment pipelines, playbook runner, source adapters, evidence panels |
| Phase 3 | Timeline/map overlays, watch rules, browser pool, token/routing policies |
| Phase 4 | Polyglot plugins, distributed execution, reliability tuning, analyst collaboration features |
