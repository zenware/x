# Component Matrix

Legend: ✅ Required - ⚡ Critical / unusually deep - 🔄 Optional / category-dependent

---

## Part 1: Foundational Infrastructure

| Component | Identity & Access Management | Endpoint Security & XDR | SIEM / Cloud Security / Detection |
|---|:---:|:---:|:---:|
| Identity / Principal Model | ⚡ | ✅ | ✅ |
| Auth / Trust Protocol Support | ⚡ | 🔄 | ✅ |
| Policy Engine | ⚡ | ✅ | ✅ |
| Agent / Connector / Sensor Layer | 🔄 | ⚡ | ⚡ |
| Telemetry Ingestion | ✅ | ⚡ | ⚡ |
| Storage / Search / Retention | ✅ | ✅ | ⚡ |
| Inventory | ✅ | ⚡ | ⚡ |
| Detection / Alert Lifecycle | ✅ | ⚡ | ⚡ |
| Automation / Response | ✅ | ✅ | ✅ |
| Case Management / Audit | ✅ | ✅ | ✅ |
| Integrations / Ecosystem APIs | ✅ | ✅ | ✅ |
| Multi-Tenant Admin | ✅ | ✅ | ✅ |
| Compliance / Reporting | ✅ | ✅ | ✅ |
| Secrets / Sensitive Data Handling | ✅ | ✅ | ✅ |
| Reliability / Abuse Protection | ✅ | ✅ | ✅ |
| Support / Forensics / Rollout | ✅ | ✅ | ✅ |

---

## Part 2: Bespoke / Domain-Specific Components

### Identity & Access Management

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Directory / User Store | High | No |
| SSO / Federation Workflows | Very High | No |
| MFA / Passwordless / Device Trust | High | Partially |
| Provisioning / Lifecycle Automation | High | Partially |
| Fine-Grained Access Policies | High | Partially |
| Session / Token Lifecycle | High | No |
| Admin Console & Tenant Configuration | Medium | Partially |
| App / Integration Catalog | Medium | Partially |
| Identity Threat Detection | Medium | Partially |
| Delegated Administration / B2B Org Model | Medium | No |

**10 bespoke components**

---

### Endpoint Security & XDR

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Endpoint Agent Runtime | Very High | No |
| Kernel / OS Telemetry Hooks | Very High | No |
| Detection Rules & Behavioral Models | High | Partially |
| Response Actions / Isolation / Kill | High | Partially |
| Device Inventory & Health State | High | Partially |
| Threat Hunting & Investigation Surface | High | Partially |
| Policy Distribution & Enforcement | High | Partially |
| Performance / Compatibility Management | High | No |
| Tamper Resistance & Agent Self-Protection | Very High | No |
| Cloud Correlation Across Endpoints | High | Partially |
| Incident Triage Workflow | Medium | Partially |

**11 bespoke components**

---

### SIEM, Cloud Security & Detection Platforms

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| High-Volume Log / Event Ingestion | Very High | Partially |
| Detection Rules / Correlation Engine | Very High | Partially |
| Cloud Asset / Posture Graph | High | No |
| Search / Investigation Experience | High | Partially |
| Alert Tuning / Dedup / Prioritization | High | Partially |
| Threat Intelligence & Enrichment | Medium | Partially |
| Case / Incident Workflow | Medium | Partially |
| Compliance Mapping & Reporting | Medium | Partially |
| Response Automation / Playbooks | High | Partially |
| Multi-Cloud / SaaS Connector Ecosystem | High | Partially |
| Risk Scoring & Exposure Modeling | High | No |

**11 bespoke components**

---

## Summary

| Vertical | Foundational | Bespoke | Total | % Foundational |
|---|:---:|:---:|:---:|:---:|
| Identity & Access Management | 16 | 10 | 26 | 62% |
| Endpoint Security & XDR | 16 | 11 | 27 | 59% |
| SIEM / Cloud Security / Detection | 16 | 11 | 27 | 59% |
