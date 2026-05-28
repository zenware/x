# Developer Platform / Infrastructure / DevOps Architecture Reference

This documentation covers the components required to build **developer-facing infrastructure products** such as code hosting, CI/CD, deployment platforms, artifact systems, and observability/control-plane heavy tooling.

It separates:

- **Foundational infrastructure** - reusable multi-tenant control-plane components common to many developer platforms
- **Bespoke / domain-specific components** - the workflow engine, execution model, deployment semantics, or debugging surface that makes one platform category different from another

These products often look like SaaS on the surface, but their core value frequently lives in runtimes, agents, execution isolation, APIs, and platform workflows rather than traditional business CRUD.

---

## Contents

| Document | Description |
|---|---|
| [Foundational Infrastructure](./foundational-infrastructure.md) | Shared platform components across developer infrastructure products |
| [Source Code Hosting & CI/CD](./verticals/source-code-hosting-ci-cd.md) | Architecture for GitHub / GitLab / Bitbucket + CI products |
| [Cloud Deployment & Serverless Platforms](./verticals/cloud-deployment-serverless-platforms.md) | Architecture for Vercel / Netlify / Heroku / render-style platforms |
| [Observability & Monitoring Platforms](./verticals/observability-monitoring-platforms.md) | Architecture for Datadog / Grafana Cloud / New Relic-like products |
| [Component Matrix](./component-matrix.md) | Cross-reference of shared and bespoke systems across covered platform categories |

---

## Approximate Split by Vertical

| Vertical | Foundational | Bespoke | Total | % Foundational |
|---|:---:|:---:|:---:|:---:|
| Source Code Hosting & CI/CD | 16 | 11 | 27 | 59% |
| Cloud Deployment & Serverless Platforms | 16 | 11 | 27 | 59% |
| Observability & Monitoring Platforms | 16 | 10 | 26 | 62% |
