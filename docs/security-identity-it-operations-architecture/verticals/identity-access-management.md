# Identity & Access Management (Okta / Auth0 / Entra ID Model)

IAM products sit at the trust boundary for enterprise systems. Their job is to make **authentication**, **federation**, **access policy**, and **account lifecycle** reliable, secure, and manageable at organizational scale.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Identity / Principal Model | Users, groups, apps, tenants, devices |
| Auth / Trust Protocol Support | SAML, OIDC, OAuth, SCIM, certificates |
| Policy Engine | Conditional access and role evaluation |
| Telemetry Ingestion | Sign-in events and anomaly signals |
| Storage / Search / Retention | User directory, sessions, audit |
| Inventory | Applications, directories, policies |
| Detection / Alert Lifecycle | Suspicious sign-in and policy findings |
| Automation / Response | Provisioning and access lifecycle actions |
| Case Management / Audit | Access reviews and audit history |
| Integrations / APIs | App integrations and admin APIs |
| Multi-Tenant Admin | Enterprise org models and delegated admin |
| Compliance / Reporting | Audit exports and compliance support |
| Secrets / Sensitive Data Handling | Credentials, keys, tokens |
| Reliability / Abuse Protection | Brute-force and fraud resistance |
| Support / Rollout Tooling | Safe auth changes and break-glass workflows |

---

## Bespoke / Domain-Specific Components

### 1. Directory / User Store
- User/group schema
- Sync from external directories
- Lifecycle state handling

### 2. SSO / Federation
- IdP/SP semantics
- Metadata and certificate rotation
- Tenant-specific configuration

### 3. MFA / Passwordless / Device Trust
- Factor enrollment
- Device posture checks
- Recovery and fallback

### 4. Provisioning / Lifecycle Automation
- App provisioning
- Joiner/mover/leaver workflows
- Role/group sync

### 5. Access Policies
- Context-aware rules
- Risk-based policies
- Session / step-up requirements

### 6. Session / Token Lifecycle
- Refresh / revocation
- Session expiry
- Cross-app trust model

### 7. Admin Console & Tenant Configuration
- Tenant-specific auth settings
- Branding and user experience
- Delegation and controls

### 8. Integration Catalog
- App templates
- Protocol adapters
- Managed lifecycle for integrations

### 9. Identity Threat Detection
- Impossible travel, credential abuse, anomalous sign-in
- Correlation across users/devices
- Alert surfaces

### 10. Delegated Administration / B2B Org Model
- Multi-org administration
- Enterprise hierarchy support
- Delegated access boundaries

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Directory / User Store | Build |
| SSO / Federation | Build |
| MFA / Passwordless | Build |
| Provisioning / Lifecycle | Build |
| Access Policies | Build |
| Session / Token Lifecycle | Build |
| Admin Console | Build |
| Integration Catalog | Build |
| Threat Detection | Build |
| Delegated Administration | Build |
