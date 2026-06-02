# Godmode Visual Analysis

The differentiator is not raw collection volume. It is the ability to turn a single seed into a **navigable relationship picture** without overwhelming the operator.

---

## Core UX Principles

### 1. Graph-First Investigation
- Represent emails, domains, IPs, phone numbers, social handles, ASNs, wallets, persons, orgs, files, and locations as first-class nodes
- Represent resolutions, ownership, mentions, registrations, sightings, co-occurrence, and operator assertions as typed edges
- Default to a force-directed layout with stable clustering so the scene remains readable as new data arrives

### 2. Progressive Disclosure
- Do not explode the entire graph at once
- Expand a node only when the user requests adjacent relationships or a specific playbook
- Group high-cardinality relationships into collapsible bundles such as `132 passive DNS records` or `48 social mentions`
- Let users pin a subgraph into focus while background enrichment continues elsewhere

### 3. Evidence-Forward Rendering
- Every node and edge should expose:
  - source module
  - collection timestamp
  - confidence / reliability
  - raw evidence links
  - normalization notes
- The graph should never show a fact without an evidence drawer explaining why it exists

### 4. Time and Place as First-Class Filters
- Any observation with a timestamp belongs on the timeline
- Any observation with coordinates, region, or physical infrastructure metadata belongs on the map layer
- The operator should be able to scrub a time window and watch the graph restabilize around that slice

---

## Recommended UI Surfaces

| Surface | Purpose |
|---|---|
| Global search / seed bar | Start from one or more indicators and open an investigation workspace |
| Force-directed graph canvas | Main relationship navigation surface |
| Side evidence panel | Raw observations, provenance chain, screenshots, API responses, and notes |
| Timeline slider | Time slicing, replay, and change-point detection |
| Map overlay | Geospatial plotting for infrastructure, sightings, travel, and address-linked records |
| Investigation queue | Background jobs, pending enrichments, retries, and watch status |
| Diff panel | Compare graph state across two dates or two source sets |

---

## Layout and Interaction Model

### Node Behavior
- Size by analyst-selected metric: degree, confidence, recency, or watch priority
- Color by type or trust tier
- Show badges for `watched`, `new`, `stale`, `disputed`, or `high fan-out`

### Edge Behavior
- Edge labels stay hidden until hovered or filtered
- Multiple identical relationships collapse into one edge with evidence count
- Time-bounded edges should fade when the timeline excludes them

### Graph Hygiene
- Apply automatic de-duplication and canonicalization before render
- Collapse noisy satellite nodes by default
- Separate hard facts from inferred links visually

---

## Temporal and Geospatial Overlay Model

### Temporal
- Store every observation as evented data rather than only current state
- Support:
  - first seen / last seen
  - change events
  - source refresh history
  - snapshot comparisons

### Geospatial
- Keep a location abstraction that can represent:
  - exact coordinates
  - coarse administrative regions
  - geocoded addresses
  - infrastructure geography such as hosting region or ASN footprint
- Draw confidence rings for imprecise locations instead of pretending to have exact coordinates

---

## Analyst Workflow Example

1. Start with an email address
2. View adjacent domains, usernames, breach mentions, and historical sightings
3. Expand one domain to reveal registrant details, passive DNS, hosting changes, and certificate relationships
4. Toggle map view to inspect hosting geography and physical records
5. Scrub the timeline to isolate when infrastructure moved
6. Open evidence on one suspicious edge and decide whether to keep, suppress, or watch it

---

## Non-Negotiable Product Rules

- Do not auto-expand high-volume relationships without operator intent
- Do not hide provenance behind a separate admin-only workflow
- Do not merge entities unless the merge reason is inspectable and reversible
- Do not render low-confidence inferred links the same way as observed facts
