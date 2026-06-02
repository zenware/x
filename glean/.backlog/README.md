# Glean Backlog Tasks

This directory contains one markdown file per backlog task, generated from:

- `glean/docs/backlog-issues.md`
- `glean/docs/backlog-alpha-to-1.0.md`

Conventions:

- One file per task ID (`<id>.md`, lowercase filename).
- Shared template sections for problem, acceptance criteria, constraints, plan, and notes.
- Pending tasks are framed as **vertical slices** (end-to-end, investigator-visible outcomes) rather than domain-only internal layering.
- Each pending task includes a **Slice Test Scenario** and requires at least one integration/e2e verification path.
- `status` defaults to `pending`.
