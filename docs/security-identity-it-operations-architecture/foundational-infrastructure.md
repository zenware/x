# Foundational Infrastructure

These are the shared platform primitives behind identity, security, and IT operations products.

---

## 1. Identity & Principal Model
Represents users, devices, workloads, orgs, and service accounts.

## 2. Authentication & Trust Protocol Support
Implements SAML, OIDC, OAuth, SCIM, certificates, or device trust signals as needed.

## 3. Policy Engine & Rules Evaluation
Evaluates access, security, and response rules consistently.

## 4. Agent, Connector or Sensor Layer
Collects data or enforces policy on endpoints, cloud systems, or apps.

## 5. Telemetry Ingestion Pipeline
Handles high-volume event collection, parsing, and routing.

## 6. Data Storage, Search & Retention
Stores events, identities, findings, and audit records.

## 7. Asset / Identity / Configuration Inventory
Maintains normalized inventory of what exists and what it should look like.

## 8. Detection / Alert / Finding Lifecycle
Turns raw signals into actionable findings.

## 9. Workflow Automation & Response Orchestration
Executes remediation and response actions safely.

## 10. Case Management, Investigation & Audit
Supports analysts and admins working incidents or investigations.

## 11. Integrations & Ecosystem APIs
Connects to cloud providers, directories, ticketing, chat, and endpoint tools.

## 12. Multi-Tenant Access Control & Enterprise Admin
Supports enterprise tenants, delegated admin, and organizational boundaries.

## 13. Compliance, Reporting & Evidence Export
Produces reports, audit logs, and regulator/customer evidence.

## 14. Secrets, Keys & Sensitive Data Handling
Protects credentials, tokens, keys, and sensitive event content.

## 15. Platform Observability, Reliability & Abuse Protection
Protects the product itself from overload, abuse, and outages.

## 16. Support, Forensics & Safe Rollout Tooling
Enables controlled releases and deep debugging in sensitive environments.

---

## Summary

| # | Component | Typical Approach |
|---|---|---|
| 1 | Identity / Principal Model | Build |
| 2 | Auth / Trust Protocol Support | Hybrid |
| 3 | Policy Engine | Build |
| 4 | Agent / Connector / Sensor | Build |
| 5 | Telemetry Ingestion | Build |
| 6 | Storage / Search / Retention | Build or hybrid |
| 7 | Inventory | Build |
| 8 | Detection / Alert Lifecycle | Build |
| 9 | Automation / Response | Build |
| 10 | Case Management / Audit | Build |
| 11 | Integrations / APIs | Build |
| 12 | Multi-Tenant Admin | Build |
| 13 | Compliance / Reporting | Build |
| 14 | Secrets / Sensitive Data Handling | Hybrid |
| 15 | Reliability / Abuse Protection | Build |
| 16 | Support / Forensics / Rollout | Build |
