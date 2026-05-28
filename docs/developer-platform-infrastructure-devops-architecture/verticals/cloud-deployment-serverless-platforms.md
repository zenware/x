# Cloud Deployment & Serverless Platforms (Vercel / Netlify / Heroku Model)

Deployment platforms turn source artifacts into **running services** with strong developer ergonomics. The hard parts are runtime isolation, build/deploy workflows, debugging, and making production operations feel simple.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Multi-Tenant Control Plane | Apps, projects, orgs, regions |
| Identity / Teams / Access | Teams, API tokens, RBAC |
| API / CLI / SDK Surface | Deploy APIs and local workflows |
| Agent / Runner Runtime | Builds, deployments, runtime execution |
| Execution Isolation | Secure build and runtime tenancy |
| Workflow Orchestration | Deploy pipelines and retries |
| Artifact / Repo Storage | Build outputs, layers, logs |
| Caching / Acceleration | Dependency, build, and image caches |
| Event Bus / Integrations | Git triggers, notifications, add-ons |
| Secrets / Config | Env vars and secret injection |
| Platform Observability | Deploy health, runtime health, saturation |
| Billing / Quotas | Usage, seats, bandwidth, invocations |
| Audit / Policy | Deployment approvals, audit logs, compliance |
| Release Engineering | Progressive platform rollouts |
| Support / Diagnostics | Deploy failure and runtime debugging |
| Docs / DX | Templates, examples, migration docs |

---

## Bespoke / Domain-Specific Components

### 1. Build / Deploy Pipeline
- Source detection
- Build steps and caching
- Artifact promotion

### 2. Runtime Provisioning & Scheduling
- Container / function lifecycle
- Placement decisions
- Cold-start and reuse behavior

### 3. Routing, Edge & Domains
- Domains, SSL, edge routing
- Preview URLs
- Cache policy hooks

### 4. Secrets / Env Injection
- Per-environment config
- Secret versioning
- Safe exposure to workloads

### 5. Rollback / Canary / Preview Environments
- Preview deployments
- Rollbacks
- Traffic shifting

### 6. Logs, Metrics & Runtime Debugging
- Runtime logs
- Request tracing
- Developer-friendly failure surfaces

### 7. Autoscaling & Capacity Policy
- Horizontal scaling
- Queue and burst handling
- Resource caps

### 8. Framework / Runtime Detection
- Runtime auto-detection
- Buildpacks or adapters
- Framework-specific optimizations

### 9. Database / Add-On / Service Binding
- Managed add-ons
- Connection injection
- Lifecycle coordination

### 10. Deployment Policy & Compliance
- Approvals
- Region restrictions
- Change controls

### 11. Multi-Region / Edge Placement
- Geographic placement
- Data locality
- Latency and cost tradeoffs

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Build / Deploy Pipeline | Build |
| Runtime Scheduling | Build |
| Routing / Edge / Domains | Build |
| Secrets / Env Injection | Hybrid |
| Rollback / Preview / Canary | Build |
| Runtime Debugging | Build |
| Autoscaling | Build |
| Framework Detection | Build |
| Service Binding | Build |
| Policy / Compliance Controls | Build |
| Multi-Region Placement | Build |
