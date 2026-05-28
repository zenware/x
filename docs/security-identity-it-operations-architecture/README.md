# Security / Identity / IT Operations Architecture Reference

This documentation covers the components required to build **identity systems, security platforms, endpoint protection products, SIEM tooling, and adjacent IT operations platforms**.

It separates:

- **Foundational infrastructure** - reusable policy, telemetry, identity, integration, and response components
- **Bespoke / domain-specific components** - the specific auth, detection, enforcement, and investigation workflows that make different security categories distinct

These products differ from general SaaS because policy evaluation, high-volume telemetry, trust boundaries, endpoint behavior, and incident response are often the product itself.

---

## Contents

| Document | Description |
|---|---|
| [Foundational Infrastructure](./foundational-infrastructure.md) | Shared platform components across security, identity, and IT operations products |
| [Identity & Access Management](./verticals/identity-access-management.md) | Architecture for Okta / Auth0 / Entra ID-like systems |
| [Endpoint Security & XDR](./verticals/endpoint-security-xdr.md) | Architecture for CrowdStrike / SentinelOne-like products |
| [SIEM, Cloud Security & Detection Platforms](./verticals/siem-cloud-security-detection-platforms.md) | Architecture for Splunk / Chronicle / Wiz / Elastic Security-like products |
| [Component Matrix](./component-matrix.md) | Cross-reference of shared and bespoke systems across covered security categories |

---

## Approximate Split by Vertical

| Vertical | Foundational | Bespoke | Total | % Foundational |
|---|:---:|:---:|:---:|:---:|
| Identity & Access Management | 16 | 10 | 26 | 62% |
| Endpoint Security & XDR | 16 | 11 | 27 | 59% |
| SIEM / Cloud Security / Detection | 16 | 11 | 27 | 59% |
