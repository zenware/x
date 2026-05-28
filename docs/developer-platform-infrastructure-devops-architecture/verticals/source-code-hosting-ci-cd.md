# Source Code Hosting & CI/CD (GitHub / GitLab Model)

These platforms combine **source hosting**, **collaboration**, and **workflow execution**. The control plane is SaaS-like, but the real differentiation sits in code review semantics, CI workflow orchestration, and enterprise governance.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Multi-Tenant Control Plane | Orgs, repos, teams, permissions |
| Identity / Teams / Access | SSO, tokens, org roles, API auth |
| API / CLI / SDK Surface | Automation and integration |
| Agent / Runner Runtime | Build and workflow execution |
| Execution Isolation | Run untrusted build code safely |
| Workflow Orchestration | CI pipelines and retries |
| Artifact / Repo Storage | Git objects, releases, logs, artifacts |
| Caching / Acceleration | Dependency and build caches |
| Event Bus / Webhooks | Automation triggers and integrations |
| Secrets / Config | CI secrets and environment management |
| Platform Observability | Queue depth, runner health, failures |
| Billing / Quotas | Seats, minutes, storage, advanced features |
| Audit / Policy | Compliance and enterprise governance |
| Release Engineering | Safe rollout for control-plane changes |
| Support / Diagnostics | Failed build and repo issue debugging |
| Docs / DX | Templates, starter workflows, onboarding |

---

## Bespoke / Domain-Specific Components

### 1. Git / VCS Hosting Semantics
- Repository model
- Permissions on refs and history
- Clone/fetch/push scalability

### 2. Pull Request / Review Model
- Diffs, comments, approvals
- Review threads and merge controls
- Checks integration

### 3. CI Workflow Engine
- DAG execution
- Triggers and conditionals
- Workflow reuse and caching

### 4. Runner Fleet Scheduling
- Job placement
- Hosted/self-hosted runner models
- Scaling and queue fairness

### 5. Build Cache / Artifact Reuse
- Cache keys
- Artifact retention
- Reproducibility tradeoffs

### 6. Branch Protection & Policy
- Required checks
- Merge rules
- Admin exemptions

### 7. Marketplace / Extensions
- Actions/apps ecosystem
- Permission scopes
- Versioning and trust

### 8. Build Secrets & Ephemeral Credentials
- Secret injection
- OIDC / workload identity
- Least-privilege execution

### 9. Package / Artifact Publishing Hooks
- Release workflows
- Package registry links
- Provenance metadata

### 10. Developer Notifications / Status Surfaces
- Checks, inbox, web/mobile notifications
- Status APIs
- Workflow visibility

### 11. Enterprise Source Governance
- Policy packs
- Data residency and audit
- Large-enterprise repo management

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| VCS Hosting | Build |
| PR / Review Model | Build |
| CI Workflow Engine | Build |
| Runner Scheduling | Build |
| Cache / Artifacts | Build |
| Branch Protection | Build |
| Marketplace / Extensions | Build |
| Secrets / Ephemeral Credentials | Hybrid |
| Artifact Publishing Hooks | Build |
| Notifications / Status | Build |
| Enterprise Governance | Build |
