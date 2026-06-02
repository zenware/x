# UI Experience & Interaction Design

This specification defines how the graph stays readable under high-volume enrichment and how the product feels polished enough for non-specialist investigators.

---

## Core Principle: Prevent the Hairball

A graph UI fails when it treats rendering as a dump of backend output. The interface should be designed around cognitive load, guided exploration, and traceable evidence.

---

## 1. Progressive Disclosure (Golden Rule)

- Start every case with only the seed node visible
- Expand neighbors only on direct user intent (double-click, context action, or inspector CTA)
- Keep high fan-out branches collapsed by default
- Let users pin important nodes so layout changes do not move their anchor points

### Interaction Contract

1. Seed appears centered with a short summary
2. Expand action fetches one-hop neighbors
3. Additional hops require explicit user confirmation
4. Background jobs can enrich provenance, but they must not flood the canvas without operator intent

---

## 2. Semantic Clustering

When one entity has dozens or hundreds of similar edges, represent them as grouped objects.

- Use super-nodes (`Domains (300)`, `Certificates (82)`, `Mentions (498)`)
- Expand a super-node into a ring or list only when requested
- Auto-cluster low-confidence or repetitive branches to protect legibility

### Clustering Heuristics

| Signal | Default Handling |
|---|---|
| Same edge type + same source family + high count | Collapse to a super-node |
| Low confidence + high redundancy | Auto-cluster and dim |
| High confidence + strategic relevance | Keep expanded when possible |

---

## 3. Canvas vs. Context Sidebar

The canvas should show relationship structure. Details belong in the inspector.

- Prefer icons and short labels on nodes
- Avoid full raw payload text in graph space
- Clicking a node opens a right-side inspector with:
  - human-readable summary
  - evidence list
  - timestamps
  - source and API metadata
  - raw JSON in collapsible sections
  - next recommended action

---

## 4. Multi-Layout + Motion System

Force layout is default, not mandatory.

- Provide controls for gravity, repulsion, and link distance
- Support one-click transition to hierarchical layout for ownership or infrastructure chains
- Include timeline scrubbing that filters visible evidence by discovery/observation time
- Transitions should animate smoothly to preserve spatial memory

---

## 5. Smart Pruning and Filtering

Investigators need fast noise-removal controls.

- Global type toggles (`Hide Certificates`, `Hide Mentions`, etc.)
- Confidence threshold slider
- Orphan prune action to hide disconnected dead ends
- Focus mode: selecting a node dims everything except its path back to the seed

---

## 6. Apple-like Product Experience

The interface should feel curated and calm while the backend remains powerful.

### Key Product Behaviors

- **Omnibox Launchpad**: centered start state, auto-detect seed type, suggest playbook
- **Natural-Language Intent**: user writes “Map infrastructure for this domain”; UI selects workflow silently
- **Fluid Spring Motion**: damped transitions when nodes expand, collapse, or change layout
- **Glass Panels**: translucent controls and inspector overlays that preserve graph context
- **Card-based Inspector**: no blocking modals; a sliding sheet with summary-first content
- **Map Morphing**: graph transitions into geospatial projection instead of page-switching
- **Editorial Curation**: stack cards and “+N more” summaries instead of raw bursts of nodes

### Frontend Philosophy

Hide machinery, reveal story. The user should feel guided through an investigation narrative, not trapped in a control panel.

---

## UI States for First Iteration

| State | Description |
|---|---|
| Empty launch state | Omnibox + suggested playbooks only |
| Seed loaded | Single central node + suggested next actions |
| Expanded investigation | Progressive graph with clustering and inspector |
| Focus mode | Dimmed graph except selected path to seed |
| Time-sliced view | Timeline-filtered graph with optional map overlay |
| Alert review | Watch delta panel with before/after evidence |

---

## Guardrails

- Never auto-expand large branches on first render
- Never hide provenance location in the UI hierarchy
- Never block the graph with modal dialogs for normal workflows
- Never style inferred links as equivalent to direct observations
