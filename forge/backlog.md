# forge — v0.01dev-alpha backlog

## What this is

A personal forge: self-hosted, single-user, `jj`-first version control with pluggable CI/CD and artifact storage.

This document is the working backlog for the **v0.01dev-alpha** release — a deliberately narrow vertical slice that proves the core concept. The goal is a real, runnable system, not a complete GitHub replacement.

---

## Alpha definition of done

The alpha is complete when a developer can perform the following end-to-end flow on a single machine:

1. Register a local repository (or clone one) through the forge web UI.
2. Browse the repository — file tree, file contents, and revision/change log using `jj` concepts.
3. Define a simple CI pipeline in the repository and trigger it from the UI.
4. Watch the pipeline run, view step-level logs, and see pass/fail status.
5. Download a build artifact produced by a successful pipeline run.

---

## Out of scope for v0.01dev-alpha

These are explicitly deferred to keep the alpha achievable:

- Multi-user accounts, teams, and organisations
- Fine-grained access control or permission models
- Multi-round review workflows with external CI gating
- Notifications (email, webhooks, etc.)
- Distributed or remote CI runners
- Package or container registries
- Federation, mirroring, or repo importing from GitHub/GitLab
- Public-facing or internet-hosted deployment hardening
- Polished UI / design system

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `jj` CLI integration is harder to model in a web context than expected | High | High | Tackle it in Phase 1 before building any dependent UI; keep a thin adapter with clear boundaries |
| Choosing the wrong stack early slows everything down | Medium | High | Make an explicit architecture decision record (ADR) before writing feature code |
| "Pluggable backends" complexity leaks into the alpha | Medium | Medium | Define interfaces early, but only implement local backends; resist premature abstraction |
| No existing data model to learn from means design churn | Medium | Medium | Sketch the domain model as a standalone doc; get it wrong cheaply before wiring it to a DB |

---

## Phase 0 — Foundations

These items must be done before any feature work begins. They are short but high-leverage.

---

### F-01 Write the alpha acceptance test script

Define the literal steps of the demo flow above as a written test script (not automated yet). This forces concrete decisions about UI routes, commands, and data formats before any code is written.

**Done when:** A human can follow the script and know clearly whether the alpha works.

---

### F-02 Decide and record the initial stack

Choose one option for each of: backend language/framework, frontend (SSR page-based vs. SPA), database (SQLite for alpha is a reasonable default), local job executor, and local artifact storage (filesystem). Write a short ADR in `docs/adr/`.

**Done when:** `docs/adr/0001-initial-stack.md` exists and is committed.

**Considerations:**
- SQLite is a strong alpha default — zero ops, single file, easy to reset.
- A server-rendered UI (e.g. Go+templ, Python+htmx, Ruby+Phlex) keeps the frontend surface small for alpha.
- A local job executor can be as simple as fork/exec with stdout capture.

---

### F-03 Scaffold the project structure

Create the directory layout, dev environment (`devenv.nix` or equivalent), config loading, structured logging, and database migration runner.

**Done when:** `make dev` (or equivalent) starts the server locally with no errors; a health-check endpoint returns 200.

---

### F-04 Design and document the domain model

Before writing any persistence code, sketch out the core entities and their relationships in a doc:

- `Repository` — name, path on disk, VCS type (git / jj-on-git / jj-native)
- `Revision` — change ID, description, parents, author, timestamp, bookmarks
- `Workspace` — jj workspace name and its current revision
- `Pipeline` — definition tied to a repository (name, steps)
- `PipelineRun` — triggered instance (status, trigger, revision)
- `Job` — individual step in a run (status, log output)
- `Artifact` — file produced by a job (name, size, storage key, download URL)

**Done when:** A domain model doc exists in `docs/` and has been reviewed against the demo flow in F-01.

---

### F-05 Define the VCS, CI, and artifact provider interfaces

Write the interfaces (traits/protocols/interfaces depending on the stack chosen in F-02) for the three pluggable seams:

- **VCS provider** — `list_repos`, `repo_metadata`, `list_revisions`, `revision_detail`, `file_tree`, `file_content`
- **CI executor** — `submit_run`, `cancel_run`, `stream_logs`, `get_run_status`
- **Artifact store** — `put_artifact`, `get_artifact`, `list_artifacts`, `delete_artifact`

**Done when:** Interfaces are defined in code (even if no implementation exists yet); local implementations are stubbed.

**Depends on:** F-02, F-04

---

## Phase 1 — Core features

These items can be worked in parallel once Phase 0 is done, but the `jj` adapter (P1-JJ) should be started first because it blocks the most UI work.

---

### P1-JJ Implement the `jj` VCS adapter

Build the local `jj` VCS provider implementation. Call the `jj` CLI (via subprocess) rather than linking against any library — this keeps the adapter simple and forward-compatible with `jj` CLI changes.

**Capabilities needed for alpha:**
- Detect whether a repository is managed by `jj`
- `jj log` → parse into `Revision` objects (change ID, description, author, bookmarks, parents)
- `jj show <rev>` → revision detail
- `jj file list <rev>` / `jj file show <rev> <path>` → file tree and file content
- `jj workspace list` → list workspaces

**Done when:** A test repository shows a correct revision log and file browser in isolation (without the web UI).

**Depends on:** F-04, F-05

---

### P1-GIT Implement a basic Git fallback adapter

For repositories not managed by `jj`, provide a minimal Git VCS provider so the forge can handle plain Git repos. Can use `git log`, `git show`, `git ls-tree` via subprocess or a library.

**Done when:** A plain Git repository shows a revision log and file browser. Parity with P1-JJ is not required — `jj` is the first-class path.

**Depends on:** F-04, F-05

---

### P1-REPO Implement repository registration and browsing

- Register a repository by providing a local path (alpha does not need to clone remote repos).
- Index and store repository metadata in the database.
- Expose the repository list and repository detail pages (file tree, file viewer, revision log, revision detail) in the web UI.

**Done when:** The repo list page shows registered repos; clicking through reaches a working file browser and revision log for both `jj` and Git repos.

**Depends on:** F-03, P1-JJ, P1-GIT

---

### P1-CI Implement local CI execution

- Define a simple pipeline format (YAML or TOML in `.forge/pipeline.yml`). For alpha, a pipeline is an ordered list of named shell steps with optional artifact upload declarations.
- Store pipeline definitions in the database keyed to a repository.
- Execute a pipeline run by spawning steps sequentially as local subprocesses, capturing stdout+stderr per step.
- Persist run status (pending → running → passed/failed) and per-step log output.
- Trigger runs: manually from the UI; automatically when the indexed revision changes (polling is fine for alpha).

**Done when:** A test repository with a `.forge/pipeline.yml` can be triggered from the UI; logs appear in real time or near-real time; pass/fail is visible.

**Depends on:** F-03, F-05, P1-REPO

---

### P1-ARTIFACT Implement local artifact storage

- After a job step succeeds, collect declared artifact paths and store them on local disk under a content-addressed or run-keyed layout.
- Associate artifact records with the pipeline run in the database.
- Expose artifact download via a signed or direct URL from the web UI.

**Done when:** A pipeline run that produces a file shows a download link on the run page; the file can be downloaded.

**Depends on:** F-05, P1-CI

---

## Change Requests (CR) — the `jj`-oriented PR/MR equivalent

One of the alpha's most interesting design challenges: what does code review look like for git-backed, `jj`-managed repos?

In `jj`, there are no branches in the git sense — there are *changes* (with stable change IDs) and *bookmarks* (which map to git refs). History rewriting (amend, rebase, squash) is normal. This has implications for review:

- A CR targets a **source bookmark → target bookmark** (e.g. `feature/foo` → `main`), not a commit hash.
- The diff is computed from the tip of the source bookmark vs. the merge-base with the target.
- Because `jj` encourages amending history, a CR tracks **review rounds**: each time the source bookmark is force-pushed (i.e. the change is amended/rebased), a new round is created. Previous review comments are carried forward but marked as potentially outdated if the underlying lines changed.
- Merge strategy for alpha: fast-forward only, or squash-merge (keeps `jj` history clean).

### CR backlog items

---

### P1-CR-DOMAIN Design the Change Request domain model

Add to the existing domain model:

- `ChangeRequest` — repo ID, sequential number, title, description, source bookmark, target bookmark, status (open / merged / closed), created/updated timestamps
- `ReviewRound` — CR ID, round number, tip commit SHA at time of round creation
- `ReviewComment` — round ID, file path, line number, side (old/new), body, author, resolved flag
- `Review` — CR ID, round ID, author, state (approved / changes\_requested / commented), body

**Done when:** Entities exist in code and DB migration; can be created/queried from tests.

**Depends on:** F-04, F-05

---

### P2-CR-UI Build Change Request list and detail UI

- `/repos/:name/changes` — list of CRs (open/merged/closed tabs, title, source→target, review status)
- `/repos/:name/changes/new` — open a new CR (pick source bookmark, target bookmark, title, description)
- `/repos/:name/changes/:number` — CR detail: description, diff (unified), per-file, per-line comments, review round selector, status badge
- Close and reopen CR actions

Use `jj diff` output (or `git diff`) to generate the unified diff; display `jj` change ID alongside git commit SHA on the detail page.

**Done when:** A CR can be opened, viewed with a readable diff, and closed from the browser.

**Depends on:** P2-SHELL, P1-CR-DOMAIN, P1-REPO, P1-JJ

---

### P2-CR-REVIEW Build review comment and approval UI

- Inline comment form on diff lines (click the `+` next to a line number)
- Thread view: reply, resolve/unresolve a thread
- Overall review submission: choose approved / changes\_requested / comment, write summary body
- Show per-round review state; mark comments as outdated when the source bookmark is force-pushed to a new round

**Done when:** A reviewer can leave line comments and submit an overall review; the CR page reflects the current approval state.

**Depends on:** P2-CR-UI

---


Build the complete navigable web UI on top of the Phase 1 backends.

---

### P2-SHELL Build the app shell and navigation

- Global layout: sidebar or top nav with links to repositories, pipelines, and settings.
- Repository list page.
- Auth/access: for alpha, a single hardcoded local admin credential loaded from config is sufficient. No registration flow needed.

**Done when:** All pages are reachable via navigation; no broken links.

**Depends on:** F-03

---

### P2-REPO-UI Build repository and revision UI screens

- `/repos` — list of registered repositories
- `/repos/:name` — repo overview (description, default revision, bookmarks)
- `/repos/:name/log` — paginated revision/change log
- `/repos/:name/rev/:id` — revision detail (description, diff, changed files)
- `/repos/:name/tree/:rev/*path` — file tree
- `/repos/:name/blob/:rev/*path` — file viewer with syntax highlight

Use `jj` terminology (changes, revisions, bookmarks, workspaces) rather than Git terminology where the underlying VCS is `jj`.

**Done when:** All routes render correct data for a `jj`-managed test repository.

**Depends on:** P2-SHELL, P1-REPO

---

### P2-CI-UI Build pipeline and run UI screens

- `/repos/:name/pipelines` — list of pipeline definitions
- `/repos/:name/pipelines/:pipeline/runs` — run history
- `/repos/:name/pipelines/:pipeline/runs/:run` — run detail with per-step log output and artifact links
- Manual trigger button on the pipeline page

**Done when:** The full demo flow (trigger run → watch logs → see result → download artifact) works in the browser.

**Depends on:** P2-SHELL, P1-CI, P1-ARTIFACT

---

### P2-SETTINGS Build minimal settings/admin screen

- `/settings` — registered repositories (add/remove), server info, version.

**Done when:** A new repository can be registered without touching the database directly.

**Depends on:** P2-SHELL, P1-REPO

---

## Phase 3 — Alpha hardening

---

### P3-TESTS Add targeted tests

- Unit tests for the `jj` adapter (parse log output, handle edge cases).
- Integration tests for the pipeline executor (step success, step failure, artifact upload).
- At minimum one end-to-end test that walks the acceptance script from F-01 against a real test repository.

**Done when:** `make test` passes; CI (if self-hosted on forge itself) goes green.

---

### P3-DOCS Write install and configuration docs

- `docs/install.md` — system requirements, installation steps, first-run setup.
- `docs/pipeline-syntax.md` — pipeline definition format reference.
- `docs/known-limitations.md` — explicit list of alpha limitations.
- Update `readme.md` with a quick-start section.

**Done when:** A person unfamiliar with the codebase can install and run forge using only the docs.

---

### P3-RELEASE Alpha release checklist

- Tag `v0.01dev-alpha` in the repository.
- Confirm the demo flow from F-01 works end to end.
- Record a short demo (screen capture or asciinema) showing the full flow.
- Post release notes linking to known-limitations doc.

**Done when:** Tag exists; demo is recorded; release notes are published.

---

## Dependency summary

```
F-01
F-02 → F-03, F-05
F-03 → P1-CI, P1-REPO, P2-SHELL
F-04 → F-05, P1-JJ, P1-GIT
F-05 → P1-JJ, P1-GIT, P1-CI, P1-ARTIFACT
P1-JJ  ─┐
P1-GIT ─┤→ P1-REPO → P2-REPO-UI
P1-CI  ─┤→ P2-CI-UI
P1-ARTIFACT → P2-CI-UI
P2-SHELL → P2-REPO-UI, P2-CI-UI, P2-SETTINGS
P2-CI-UI, P2-REPO-UI, P2-SETTINGS → P3-TESTS → P3-RELEASE
                                               → P3-DOCS → P3-RELEASE
```
