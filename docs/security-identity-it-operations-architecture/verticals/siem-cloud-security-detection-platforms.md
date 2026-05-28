# SIEM, Cloud Security & Detection Platforms

These products aggregate and interpret security telemetry at scale. Their value comes from turning noisy signals into **searchable evidence**, **actionable detections**, and **response-ready investigation workflows**.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Identity / Principal Model | Users, workloads, cloud accounts, assets |
| Auth / Trust Protocol Support | Cloud and enterprise integration trust |
| Policy Engine | Detection and risk rules |
| Agent / Connector Layer | Cloud, SaaS, and infra connectors |
| Telemetry Ingestion | Logs, findings, alerts, config snapshots |
| Storage / Search / Retention | Searchable security data lake |
| Inventory | Assets, cloud accounts, identities, configs |
| Detection / Alert Lifecycle | Findings and case creation |
| Automation / Response | Playbooks and remediation |
| Case Management / Audit | Investigation history and audit trail |
| Integrations / APIs | SIEM, SOAR, ticketing, IAM, cloud APIs |
| Multi-Tenant Admin | Enterprise and MSSP-style tenancy |
| Compliance / Reporting | Controls and evidence reporting |
| Secrets / Sensitive Data Handling | Cloud creds and sensitive log data |
| Reliability / Abuse Protection | High-ingest reliability |
| Support / Rollout Tooling | Safe rule rollout and support diagnostics |

---

## Bespoke / Domain-Specific Components

### 1. High-Volume Event Ingestion
- Parsers and normalizers
- Connector scheduling
- Backpressure and cost control

### 2. Detection / Correlation Engine
- Rules and sequence detection
- Cross-source correlation
- Tuning and versioning

### 3. Cloud Asset / Posture Graph
- Resource relationships
- Misconfiguration model
- Reachability / exposure context

### 4. Search / Investigation Experience
- Fast exploratory search
- Pivot and faceting
- Evidence collection

### 5. Alert Tuning / Dedup / Prioritization
- Noise reduction
- Priority scoring
- Analyst-focused triage surfaces

### 6. Threat Intelligence & Enrichment
- IOC enrichment
- External intel feeds
- Context joining

### 7. Case / Incident Workflow
- Investigation state
- Collaborators and notes
- Escalation/export

### 8. Compliance Mapping
- Control frameworks
- Evidence mapping
- Audit and remediation tracking

### 9. Response Automation
- Playbooks
- Cloud remediation actions
- Safe execution and rollback

### 10. Multi-Cloud / SaaS Connectors
- AWS/Azure/GCP/SaaS integration breadth
- Credential lifecycle
- Data-shape normalization

### 11. Risk Scoring & Exposure Modeling
- Aggregate risk views
- Blast radius / path analysis
- Prioritized remediation

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Ingestion | Build |
| Correlation Engine | Build |
| Cloud Posture Graph | Build |
| Search / Investigation | Build |
| Alert Prioritization | Build |
| Threat Intel / Enrichment | Hybrid |
| Case Workflow | Build |
| Compliance Mapping | Build |
| Response Automation | Build |
| Multi-Cloud Connectors | Build |
| Risk / Exposure Modeling | Build |
