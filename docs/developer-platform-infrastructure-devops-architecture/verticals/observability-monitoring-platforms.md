# Observability & Monitoring Platforms (Datadog / Grafana Cloud / New Relic Model)

Observability platforms ingest huge volumes of telemetry and make them useful under time pressure. Their value comes from **fast ingestion**, **correlation**, **queryability**, and **incident response ergonomics**.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Multi-Tenant Control Plane | Accounts, orgs, projects, policy |
| Identity / Teams / Access | SSO, service accounts, alert permissions |
| API / CLI / SDK Surface | Telemetry APIs and automation |
| Agent / Data Plane | Agents, collectors, exporters |
| Execution Isolation | Tenant separation and workload safety |
| Workflow Orchestration | Ingest pipelines and alert workflows |
| Artifact / Object Storage | Telemetry retention and snapshots |
| Caching / Acceleration | Query acceleration and hot data paths |
| Event Bus / Integrations | Alerts to chat, paging, ticketing, deploy systems |
| Secrets / Config | Agent configuration and integration credentials |
| Platform Observability | Operate the observability platform itself |
| Billing / Quotas | Data volume and retention pricing |
| Audit / Policy | Enterprise access and data governance |
| Release Engineering | Safe rollout of pipeline changes |
| Support / Diagnostics | Query debugging and ingest troubleshooting |
| Docs / DX | Agent setup and dashboard templates |

---

## Bespoke / Domain-Specific Components

### 1. Metrics / Logs / Traces Ingestion
- High-volume ingestion endpoints
- Parsing and normalization
- Backpressure handling

### 2. Storage & Query
- Tiered retention
- Indexing strategies
- Fast and expressive query execution

### 3. Alerting & Incident Workflow
- Alert conditions
- Routing and deduplication
- Incident lifecycle

### 4. Dashboards & Visualization
- Charts, layouts, drill-down
- Reusable templates
- Comparative views

### 5. Agent / Collector Ecosystem
- Integrations
- Config models
- Platform-specific collectors

### 6. Signal Correlation
- Connect logs, metrics, traces, deploys, incidents
- Service topology awareness
- Contextual jumping between signals

### 7. SLO / Reliability Workflows
- SLI/SLO definitions
- Error budgets
- Reliability review workflows

### 8. APM / Profiling / RUM
- App performance traces
- Profiling
- Browser/mobile user monitoring

### 9. Cost Controls / Retention Tiers
- Usage governance
- Sampling and downsampling
- Tiered retention control

### 10. DevOps Toolchain Integrations
- CI/CD correlation
- Cloud/provider integration
- Incident toolchain hooks

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Ingestion | Build |
| Storage / Query | Build |
| Alerting / Incidents | Build |
| Dashboards | Build |
| Agent Ecosystem | Build |
| Signal Correlation | Build |
| SLO Workflows | Build |
| APM / Profiling / RUM | Build |
| Cost / Retention Controls | Build |
| DevOps Integrations | Build |
