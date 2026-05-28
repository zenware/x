# Lakehouse & Analytics Platforms (Databricks / Snowflake / BigQuery Model)

Analytics platforms center on **data ingestion**, **query performance**, **governance**, and **multi-user analytical workflows**. Their architecture is defined by storage/compute separation, metadata, and strong control over cost and data-sharing boundaries.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Data Ingestion & Connectors | ETL/ELT and source connectivity |
| Storage / Lakehouse / Warehouse | Primary data storage |
| Metadata / Lineage | Catalog and governance |
| Orchestration / Scheduling | Pipelines and refresh jobs |
| Compute Execution | SQL engines, notebooks, transforms |
| Feature / Artifact Storage | Derived datasets and materializations |
| Evaluation / Experimentation | Query testing and pipeline validation |
| Monitoring / Cost Tracking | Query cost and storage visibility |
| Security / Governance | Row/column access, sharing, compliance |
| APIs / SDKs | SQL, connectors, admin APIs |
| Billing / Quotas | Usage-based pricing and chargeback |
| Release / Safety Controls | Engine/version rollout and schema changes |
| Debugging / Reproducibility | Query history and pipeline replay |

---

## Bespoke / Domain-Specific Components

### 1. Query Engine / Optimizer
- Planning and execution
- Cost-based optimization
- Caching and pruning behavior

### 2. Storage Format / Table Semantics
- Table metadata
- ACID / merge semantics
- Data layout choices

### 3. Batch + Streaming Transformation
- Unified pipelines
- Incremental semantics
- Failure recovery

### 4. Notebook / SQL / Workspace UX
- Collaborative authoring
- Result exploration
- Shareable workspace objects

### 5. Governance & Data Sharing
- Managed sharing
- Catalog controls
- Cross-org or external access

### 6. BI / Dashboard / Semantic Hooks
- Semantic layers
- Dashboard integration
- Metric definitions

### 7. Data Quality & Contracts
- Expectations and checks
- Schema enforcement
- Lineage-aware change impact

### 8. Cost / Performance Optimization
- Warehouses/cluster tuning
- Storage lifecycle
- Workload shaping

### 9. Connector Ecosystem
- Databases, files, streams, SaaS tools
- Pushdown capability
- Managed integration lifecycles

### 10. Multi-Tenant Isolation
- Tenant data separation
- Compute isolation
- Governance boundaries

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Query Engine | Build |
| Storage / Table Semantics | Build |
| Batch + Streaming Workflows | Build |
| Workspace UX | Build |
| Governance / Sharing | Build |
| BI / Semantic Hooks | Hybrid |
| Data Quality / Contracts | Build |
| Cost / Perf Optimization | Build |
| Connector Ecosystem | Build |
| Tenant Isolation | Build |
