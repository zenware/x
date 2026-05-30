# Agent instructions for `yt-wl-mgr`

These instructions apply to GitHub Copilot, Copilot coding agents, and other automated coding assistants working anywhere under `yt-wl-mgr/`.

## Project identity

`yt-wl-mgr` is a **local-first browser extension workspace** for managing a large YouTube Watch Later backlog.

Primary constraints:

- Build the **browser extension first**, not a server-first or cloud-first app.
- Keep the product **local-first** by preferring extension pages, browser-managed storage, and browser-native workflows.
- Keep the codebase **TypeScript-first** with shared domain types in `packages/core`.
- Treat the YouTube Data API as **optional enrichment/sync infrastructure**, not the primary ingestion path.

Before changing architecture or adding new runtime surfaces, align with:

- `README.md`
- `docs/README.md`
- `docs/architecture.md`
- `docs/backlog-slices.md`

## Workspace guidance

- `apps/extension`: browser-extension runtime, manifest, popup, content scripts, background worker, and extension pages.
- `packages/core`: shared domain models, validation, normalization, and reusable logic that should stay browser-runtime agnostic.

Prefer putting reusable logic and types in `packages/core`, and keep browser API calls and DOM access inside `apps/extension`.

## Cross-browser extension expectations

Assume all meaningful changes should preserve a path to support:

- **Chrome** via Manifest V3
- **Safari** Web Extensions
- **Firefox** WebExtensions, including cases where support may lag or differ

Use MDN's cross-browser WebExtensions guide as the default compatibility reference:

- <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension>

When making changes:

- Prefer the standard `browser.*` namespace in extension code, and isolate compatibility fallbacks behind a focused adapter instead of sprinkling browser conditionals throughout the runtime.
- Prefer the **portable WebExtensions subset** of APIs and behaviors.
- Avoid introducing Chrome-only APIs unless there is no reasonable alternative.
- If a browser-specific API is necessary, isolate it behind a small adapter and document the compatibility impact in code comments or nearby docs.
- Keep permissions and host permissions **minimal** and update them deliberately.
- Treat background logic as **ephemeral** and service-worker friendly: avoid depending on in-memory state surviving restarts.
- Keep content scripts resilient to DOM drift on YouTube pages and fail in explicit, user-visible ways.

## TypeScript best practices for this project

- Preserve strict typing; do not weaken compiler settings or add `any` without a strong reason.
- Model cross-context messaging with explicit request/response types and type guards.
- Centralize browser API wrappers and compatibility shims instead of scattering raw API differences across the codebase.
- Use shared domain types from `packages/core` as the contract between content scripts, background logic, popup flows, and catalog pages.
- Keep browser-runtime boundaries clear:
  - DOM scraping and page interaction in content scripts
  - orchestration, downloads, and future API calls in the background worker
  - import/search/filter/detail UI logic in extension pages
- Prefer small pure functions for parsing, normalization, filtering, and derivation so logic can be reused across browsers and surfaces.
- Use runtime validation when reading storage, parsing imported files, or accepting cross-context messages.
- Prefer explicit null/undefined handling and defensive checks for optional browser fields such as tab IDs, URLs, and storage payloads.
- Keep module boundaries ESM-friendly and consistent with the existing TypeScript configuration.

## Implementation preferences

- Favor simple extension pages and browser-native capabilities over adding heavy frameworks unless the existing codebase has already moved that way.
- Reuse existing patterns before creating new abstractions.
- Update manifest entries, TypeScript types, and user-facing docs together when extension behavior changes.
- If a feature behaves differently across Safari, Firefox, and Chrome, choose the most portable design first and document any unavoidable gaps.

## Non-goals unless explicitly requested

- Do not introduce a backend, database server, or cloud sync dependency for core flows.
- Do not replace browser-managed local storage with remote persistence by default.
- Do not treat the YouTube API as required for exporting or importing Watch Later data.
