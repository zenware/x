# ADR 0001: Initial stack for forge alpha

## Context

Forge is a single-user, self-hosted personal forge with a web UI for browsing repositories, reviewing changes, and running local CI pipelines. The alpha needs a low-operations stack that can run on one machine, integrate with both `jj` and `git`, and ship quickly without frontend build tooling or CGO dependencies.

## Decision

We will build forge as a Go application with the following stack:

- Go backend with `chi` for routing and `html/template` for server-side rendering
- `htmx` and Tailwind CSS loaded from CDNs for incremental UI updates and simple styling
- SQLite via `modernc.org/sqlite` for zero-CGO persistence
- `goose` SQL migrations embedded in the binary
- VCS integration through subprocess adapters for `jj` first, with `git` fallback
- Local CI execution through subprocesses in the same application process
- Local filesystem artifact storage rooted in the forge data directory

## Consequences

### Positive

- The entire alpha can run as one binary plus a writable data directory.
- The stack stays operationally simple and portable across development machines.
- Pure-Go SQLite avoids CGO complexity and keeps builds straightforward.
- Server-rendered HTML keeps the frontend surface area small while still allowing dynamic updates through htmx.
- Explicit provider interfaces let us grow toward remote CI or artifact backends later.

### Negative

- Subprocess integration with `jj` and `git` is less efficient than using native libraries and requires careful output parsing.
- Tailwind via CDN and no asset pipeline limit UI customization and production hardening.
- SQLite and local execution are appropriate for a single-user alpha, not multi-node deployments.
- In-process CI execution means long-running jobs share resources with the web server.

## Alternatives Considered

### SPA frontend with API backend

Rejected for the alpha because it adds a frontend toolchain, more moving parts, and more application surface area before the domain is proven.

### PostgreSQL instead of SQLite

Rejected for the alpha because it adds operational overhead without enough immediate benefit for a single-user installation.

### Native git libraries instead of CLI adapters

Rejected initially because `jj` remains the primary integration target and subprocess execution keeps both backends behind one simple abstraction.

### External CI runner and artifact service from day one

Deferred because pluggable interfaces are enough for the alpha; local implementations prove the workflow with less setup burden.
