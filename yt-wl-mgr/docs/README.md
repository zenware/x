# yt-wl-mgr docs

This directory documents the `yt-wl-mgr` app itself rather than the broader architecture reference material in the repository root.

## Docs map

- [`architecture.md`](./architecture.md) - current code layout, runtime boundaries, data flow, and near-term target architecture
- [`backlog-slices.md`](./backlog-slices.md) - how the backlog is now organized into end-to-end vertical slices and how to validate each slice

## Current app shape

`yt-wl-mgr` is a local-first TypeScript workspace with two packages today:

- `apps/extension` - the Manifest V3 browser extension
- `packages/core` - shared domain model types used by the extension and future app surfaces

The current extension ships two user-facing flows:

- a popup that exports a normalized Watch Later JSON snapshot from the items currently loaded on the YouTube page
- a catalog/options page that imports snapshots into extension-local storage, supports search and filters, and shows a detail view for a selected item

## Guiding constraints

- **Extension-first**: ingest on the real Watch Later page before adding any companion runtime.
- **Local-first**: prefer browser-managed storage and extension pages over servers.
- **Shared domain model**: keep snapshot, enrichment, and playlist planning types reusable across surfaces.
- **API-assisted**: use YouTube APIs for enrichment and sync, not as the source of truth for initial ingestion.
