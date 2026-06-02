# ADR-0001: Godmode UI Interaction Model

- **Status:** Accepted
- **Date:** 2026-06-01

## Context

Traditional OSINT graph UIs often collapse into unreadable hairballs when enrichment returns high-volume relationship sets. The product target for Glean is an Apple-like experience with sane defaults, fluid interactions, and story-first investigation flow.

## Decision

Glean UI adopts these default interaction constraints:

1. **Progressive disclosure by default**: render only the seed first, then expand on explicit user intent.
2. **Semantic clustering**: high fan-out and repetitive/low-confidence branches collapse into super-nodes.
3. **Sidebar inspector model**: rich details live in a right-side inspector, not in-canvas labels/modals.
4. **Layout switchability**: force layout by default with one-click hierarchical mode and timeline filtering.
5. **Noise-control primitives**: global type toggles, confidence threshold, orphan pruning, and focus mode.

## Consequences

### Positive

- Reduces cognitive overload for both expert and non-expert investigators.
- Keeps provenance and evidence accessible without cluttering the canvas.
- Improves user trust through stable, explainable interactions.

### Trade-offs

- Some relationships are hidden initially and require active expansion.
- Clustering can mask specific items until intentionally opened.
- Additional UI state management complexity in frontend implementation.

## Related Artifacts

- [`../../ui-experience.md`](../ui-experience.md)
- [`../../../app/index.html`](../../../app/index.html)
- [`../../../app/glean-ui.js`](../../../app/glean-ui.js)
