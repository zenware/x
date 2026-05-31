# yt-wl-mgr

Local-first browser-extension workspace for organizing a large YouTube Watch Later backlog.

## Direction

- **Extension-first**: ingestion should happen from the browser on YouTube pages.
- **Local-first**: prefer browser-managed storage and extension pages before introducing any server.
- **TypeScript-first**: shared types and logic should work across extension code, optional local UI, and any future companion tooling.
- **API-assisted, not API-dependent**: Watch Later ingestion is browser-driven; YouTube Data API is primarily for enrichment and syncing user-created playlists.

## Workspace layout

- `apps/extension` - Manifest V3 extension sources, popup, and local catalog/options page
- `packages/core` - shared domain models and utilities
- `backlog/issues.json` - structured implementation backlog
- `docs/` - app-specific architecture and backlog slicing documentation

## App docs

- `docs/README.md` - documentation index for the app
- `docs/architecture.md` - current and planned architecture, with Mermaid diagrams
- `docs/backlog-slices.md` - vertical slice roadmap and validation criteria

## Cross-browser extension guidance

- Follow MDN's cross-browser WebExtensions guide: <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension>
- Prefer the portable `browser.*` WebExtensions surface in extension code and keep browser-specific differences isolated behind small adapters.
- Keep asynchronous extension flows Promise-first where browser support is aligned, and use callback-based listeners only where that remains the most compatible option.
- Minimize permissions and avoid browser-specific APIs unless the feature truly requires them.

## Build

Runtime tooling is pinned at the repo root through `devenv.nix`.

```sh
devenv shell
cd yt-wl-mgr
npm install
npm run build
```

## Test

```sh
npm test
```

The fixture-backed test reads `tests/data/playlist.html`, extracts the embedded `ytInitialData`, and turns it into the same snapshot shape the extension uses for Watch Later imports.

## Test in Safari

1. Build the workspace with `npm run build`.
2. In Safari, enable developer tools:
   - `Safari > Settings > Advanced > Show Develop menu in menu bar` (or `Show features for web developers` on Safari 17+)
   - `Safari > Settings > Developer > Allow unsigned extensions`
3. In the same Developer settings tab, click `Add Temporary Extension…` and select `apps/extension`.
4. Enable the extension in `Safari > Settings > Extensions` if Safari does not enable it immediately.
5. After code changes, run `npm run build` again and reload the temporary extension from Safari's Extensions settings.

Safari removes temporary extensions when Safari quits or after roughly 24 hours, and the unsigned-extension setting resets when Safari quits.

## Current extension workflow

### Export from the popup

1. Open `https://www.youtube.com/playlist?list=WL` in Safari.
2. Scroll the playlist until the items you want are loaded.
3. Open the extension popup and click `Export JSON snapshot`.
4. Save the downloaded JSON file.

Exports reflect the videos currently loaded on the Watch Later page DOM, not your entire backlog unless you have scrolled enough to load it.

### Browse the local catalog

1. From the popup, click `Open catalog` to open the extension's catalog/options page.
2. Click `Import snapshots` and choose one or more exported JSON files.
3. Browse the saved catalog locally with:
   - search by title, channel, tags, or enriched description text
   - tag filters
   - deterministic category suggestions (`educational`, `practical`, `news & analysis`, `podcast / talk`, `music / performance`, `entertainment`)
   - deterministic priority suggestions (`do`, `decide`, `delete`) distilled from title, tags, description, and runtime
   - duration filters
   - import recency filters
4. Select an item to view saved details, import history, and the link back to YouTube.
5. Remove watched items from the local catalog without changing the actual YouTube Watch Later list.

Imported snapshots are persisted in the extension's local storage, so the catalog stays available when you reopen it later.
