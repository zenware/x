# Component Matrix

Legend: ✅ Required - ⚡ Critical / unusually deep - 🔄 Optional / category-dependent

---

## Part 1: Foundational Infrastructure

| Component | Source Code Hosting & CI/CD | Cloud Deployment & Serverless | Observability & Monitoring |
|---|:---:|:---:|:---:|
| Multi-Tenant Control Plane | ✅ | ✅ | ✅ |
| Identity / Teams / Access | ✅ | ✅ | ✅ |
| API / CLI / SDK Surface | ✅ | ✅ | ✅ |
| Agent / Runner / Data Plane | ⚡ | ⚡ | ⚡ |
| Execution Isolation | ⚡ | ⚡ | ✅ |
| Workflow Orchestration | ⚡ | ⚡ | ✅ |
| Artifact / Repo Storage | ⚡ | ✅ | ✅ |
| Caching / Acceleration | ✅ | ✅ | ✅ |
| Event Bus / Webhooks / Integrations | ✅ | ✅ | ✅ |
| Secrets / Config | ✅ | ⚡ | ✅ |
| Platform Observability | ✅ | ✅ | ⚡ |
| Billing / Quotas / Entitlements | ✅ | ✅ | ✅ |
| Audit / Compliance / Policy | ✅ | ✅ | ✅ |
| Release Engineering | ✅ | ✅ | ✅ |
| Support / Diagnostics | ✅ | ✅ | ✅ |
| Docs / Templates / DX | ✅ | ✅ | ✅ |

---

## Part 2: Bespoke / Domain-Specific Components

### Source Code Hosting & CI/CD

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Git / VCS Hosting Semantics | High | No |
| Pull Request / Review Model | High | No |
| CI Workflow Engine | Very High | Partially (deployment workflows) |
| Runner Fleet Scheduling | High | Partially |
| Build Cache / Artifact Reuse | High | Partially |
| Branch Protection / Policy Enforcement | Medium | Partially |
| Actions / Marketplace / Extensions | Medium | Partially |
| Secrets & Ephemeral Credentials for Builds | High | Partially |
| Package Registry / Artifact Publishing Hooks | Medium | Partially |
| Developer Notifications / Checks / Status Surfaces | Medium | Partially |
| Enterprise Source Governance | Medium | No |

**11 bespoke components**

---

### Cloud Deployment & Serverless Platforms

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Build / Deploy Pipeline | Very High | Partially (CI/CD) |
| Runtime Provisioning & Scheduling | Very High | No |
| Routing, Edge & Domain Management | High | No |
| Secrets / Env Injection at Deploy Time | High | Partially |
| Rollback / Canary / Preview Environments | High | Partially |
| Logs, Metrics & Runtime Debugging | High | Partially (observability) |
| Autoscaling & Capacity Policy | High | No |
| Framework / Buildpack / Runtime Detection | Medium | No |
| Database / Add-on / Service Binding | Medium | No |
| Deployment Policy & Compliance Controls | Medium | Partially |
| Multi-Region / Edge Placement Decisions | High | No |

**11 bespoke components**

---

### Observability & Monitoring Platforms

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Metrics / Logs / Traces Ingestion | Very High | No |
| High-Cardinality Storage & Query | Very High | No |
| Alerting & Incident Workflows | High | Partially |
| Dashboards & Visualization | High | No |
| Agent / Collector Ecosystem | High | Partially |
| Correlation Across Signals | High | No |
| SLO / Reliability Workflows | Medium | No |
| APM / Profiling / RUM Features | High | No |
| Cost Controls / Retention Tiers | Medium | Partially |
| Integrations with DevOps Toolchain | Medium | Partially |

**10 bespoke components**

---

## Summary

| Vertical | Foundational | Bespoke | Total | % Foundational |
|---|:---:|:---:|:---:|:---:|
| Source Code Hosting & CI/CD | 16 | 11 | 27 | 59% |
| Cloud Deployment & Serverless Platforms | 16 | 11 | 27 | 59% |
| Observability & Monitoring Platforms | 16 | 10 | 26 | 62% |
