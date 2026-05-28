# MLOps, Training & Evaluation Platforms

MLOps platforms help teams turn experiments into reliable production systems. The product value comes from **repeatability**, **visibility into model changes**, **resource scheduling**, and **safe promotion into serving environments**.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Data Ingestion & Connectors | Datasets, logs, labels, evaluation data |
| Storage / Warehouse | Dataset and metric storage |
| Metadata / Lineage | Lineage across code, data, and models |
| Orchestration / Scheduling | Training, retraining, and eval jobs |
| Compute Execution | CPU/GPU jobs and notebooks |
| Feature / Artifact Storage | Features, checkpoints, artifacts |
| Model Registry | Versioned model lifecycle |
| Inference Serving | Staging and production deployment hooks |
| Evaluation / Experimentation | Benchmarks, regression tests, comparisons |
| Monitoring / Cost Tracking | Training efficiency and serving performance |
| Security / Governance | Access control and regulated workflows |
| Human Feedback / Labeling | Labeling and review loops |
| APIs / SDKs | Pipeline integration and automation |
| Billing / Quotas | Resource governance |
| Release / Safety Controls | Promotion, rollback, gating |
| Debugging / Reproducibility | Run replay, environment capture |

---

## Bespoke / Domain-Specific Components

### 1. Experiment Tracking
- Parameters, metrics, artifacts
- Comparison views
- Team workflows around experiments

### 2. Training Job Orchestration
- Queueing and retries
- Dependency-aware scheduling
- Cluster and GPU placement

### 3. Dataset / Artifact Versioning
- Versioned datasets
- Artifact lineage
- Reproducible snapshots

### 4. Model Registry Workflows
- Stage transitions
- Approval processes
- Metadata and provenance

### 5. Evaluation Benchmarks
- Golden sets
- Regression tracking
- Cross-model comparisons

### 6. Feature / Embedding Management
- Offline/online definitions
- Reuse across models
- Consistency guarantees

### 7. Serving Promotion / Rollback
- Canary or shadow rollout
- Approval gates
- Fast rollback

### 8. Human Review & Annotation
- Labeling queues
- Adjudication
- Sampling strategies

### 9. GPU Scheduling / Resource Management
- Fairness and quotas
- Priority classes
- Utilization tracking

### 10. Collaboration / Notebook / Team Workflow
- Team-owned projects
- Review and approval surfaces
- Shareable run context

### 11. Compliance / Reproducibility
- Audit trails
- Environment capture
- Rebuildability of a past run

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Experiment Tracking | Build |
| Training Orchestration | Build |
| Dataset / Artifact Versioning | Build |
| Model Registry Workflows | Build |
| Evaluation Benchmarks | Build |
| Feature / Embedding Management | Build |
| Serving Promotion / Rollback | Build |
| Human Review / Annotation | Hybrid |
| GPU Scheduling | Build |
| Collaboration Workflow | Build |
| Compliance / Reproducibility | Build |
