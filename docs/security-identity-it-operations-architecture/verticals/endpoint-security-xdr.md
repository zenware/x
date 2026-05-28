# Endpoint Security & XDR (CrowdStrike / SentinelOne Model)

Endpoint security products combine **host-level visibility**, **real-time detection**, and **controlled response actions**. The architecture must balance strong telemetry and enforcement with low overhead and broad OS compatibility.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Identity / Principal Model | Devices, users, orgs, agents |
| Policy Engine | Detection and enforcement policy |
| Agent / Sensor Layer | Host-level collection and enforcement |
| Telemetry Ingestion | Process, file, network, registry, auth events |
| Storage / Search / Retention | Investigation and detection data |
| Inventory | Device inventory and health state |
| Detection / Alert Lifecycle | Alerts and findings |
| Automation / Response | Device isolation and remediation actions |
| Case Management / Audit | Investigation tracking |
| Integrations / APIs | Ticketing, SOAR, SIEM, identity tooling |
| Multi-Tenant Admin | Enterprise fleet administration |
| Compliance / Reporting | Endpoint posture and audit reporting |
| Secrets / Sensitive Data Handling | Agent credentials and secure comms |
| Reliability / Abuse Protection | High-availability detection pipelines |
| Support / Forensics / Rollout | Agent rollout and deep forensic support |

---

## Bespoke / Domain-Specific Components

### 1. Endpoint Agent Runtime
- Install/update lifecycle
- Resource management
- Resilient local operation

### 2. Kernel / OS Telemetry Hooks
- OS-specific data capture
- Privileged event collection
- Compatibility management

### 3. Detection Rules & Behavioral Models
- Signatures, heuristics, models
- Tuning and false-positive control
- Rule versioning

### 4. Response Actions
- Kill process
- Quarantine file
- Isolate device

### 5. Device Inventory & Health
- Fleet posture
- Sensor health
- Coverage gaps

### 6. Threat Hunting & Investigation
- Timeline views
- Pivot/search
- Entity correlation

### 7. Policy Distribution & Enforcement
- Policy rollout
- Per-group config
- Safe fallback paths

### 8. Performance / Compatibility Management
- OS-version testing
- Driver conflicts
- Customer impact minimization

### 9. Tamper Resistance
- Protect agent components
- Resist disable/remove attempts
- Integrity verification

### 10. Cloud Correlation
- Cross-endpoint patterns
- Org-wide detections
- Outbreak visibility

### 11. Incident Triage Workflow
- Deduplication
- Severity and prioritization
- Escalation

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Agent Runtime | Build |
| Kernel / OS Hooks | Build |
| Detection Models | Build |
| Response Actions | Build |
| Device Inventory | Build |
| Threat Hunting | Build |
| Policy Enforcement | Build |
| Compatibility Mgmt | Build |
| Tamper Resistance | Build |
| Cloud Correlation | Build |
| Incident Triage | Build |
