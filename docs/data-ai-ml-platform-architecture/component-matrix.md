# Component Matrix

Legend: ✅ Required - ⚡ Critical / unusually deep - 🔄 Optional / category-dependent

---

## Part 1: Foundational Infrastructure

| Component | Foundation Model Apps | Lakehouse & Analytics | MLOps / Training / Evaluation |
|---|:---:|:---:|:---:|
| Data Ingestion & Connectors | ✅ | ⚡ | ✅ |
| Storage / Lakehouse / Warehouse | ✅ | ⚡ | ✅ |
| Metadata / Lineage | ✅ | ⚡ | ✅ |
| Orchestration / Scheduling | ✅ | ⚡ | ⚡ |
| Compute Execution Layer | ⚡ | ⚡ | ⚡ |
| Feature / Embedding / Artifact Storage | ⚡ | ✅ | ⚡ |
| Model Registry | ✅ | 🔄 | ⚡ |
| Inference Serving | ⚡ | 🔄 | ✅ |
| Evaluation / Experimentation | ⚡ | ✅ | ⚡ |
| Monitoring / Cost Tracking | ✅ | ✅ | ✅ |
| Security / Governance | ✅ | ✅ | ✅ |
| Human Feedback / Labeling | ✅ | 🔄 | ✅ |
| APIs / SDKs | ✅ | ✅ | ✅ |
| Billing / Quotas | ✅ | ✅ | ✅ |
| Release / Safety Controls | ✅ | ✅ | ✅ |
| Debugging / Reproducibility | ✅ | ✅ | ⚡ |

---

## Part 2: Bespoke / Domain-Specific Components

### Foundation Model Application Platforms

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Prompt / Tool / Agent Orchestration | Very High | Partially (MLOps eval) |
| Retrieval Augmentation / Knowledge Layer | High | Partially |
| Conversation State & Memory Semantics | High | No |
| Safety / Policy / Guardrail Layer | Very High | Partially |
| Multi-Model Routing & Fallbacks | High | No |
| Human Feedback Capture | Medium | Partially |
| Latency / Cost Optimization | High | Partially |
| Workspace / Thread / Collaboration UX | Medium | No |
| Connectors to Enterprise or Product Data | High | Partially |
| Evaluation for Product Quality | High | Partially |
| Trust, Citation & Explainability Surfaces | Medium | No |

**11 bespoke components**

---

### Lakehouse & Analytics Platforms

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Query Engine / Optimizer | Very High | No |
| Storage Format / Table Semantics | High | No |
| Batch + Streaming Transformation Workflows | High | Partially |
| Notebook / SQL / Workspace UX | Medium | No |
| Governance & Data Sharing | High | Partially |
| BI / Dashboard / Semantic Modeling Hooks | Medium | No |
| Data Quality & Contract Workflows | High | Partially |
| Cost / Performance Optimization | High | Partially |
| External Connector Ecosystem | Medium | Partially |
| Multi-Tenant Data Isolation | High | No |

**10 bespoke components**

---

### MLOps, Training & Evaluation Platforms

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Experiment Tracking | High | No |
| Training Job Orchestration | Very High | Partially |
| Dataset / Artifact Versioning | High | Partially |
| Model Registry Workflows | High | Partially |
| Evaluation Benchmarks & Regression Gates | High | Partially |
| Feature / Embedding Management | High | Partially |
| Serving Promotion / Rollback Workflow | High | Partially |
| Human Review & Annotation Loops | Medium | Partially |
| GPU Scheduling / Resource Management | High | No |
| Collaboration / Notebook / Team Workflow | Medium | Partially |
| Compliance / Reproducibility Surface | Medium | Partially |

**11 bespoke components**

---

## Summary

| Vertical | Foundational | Bespoke | Total | % Foundational |
|---|:---:|:---:|:---:|:---:|
| Foundation Model Application Platforms | 16 | 11 | 27 | 59% |
| Lakehouse & Analytics Platforms | 16 | 10 | 26 | 62% |
| MLOps, Training & Evaluation Platforms | 16 | 11 | 27 | 59% |
