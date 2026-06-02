# Automated Reconnaissance Pipelines

The collection engine should behave like an **asynchronous enrichment fabric**: start from a seed, discover adjacent entities, normalize them, persist provenance, and schedule additional work without blocking the investigation UI.

---

## Pipeline Model

### 1. Seed Intake
- Accept seeds such as email addresses, domains, IPs, names, phone numbers, usernames, wallet addresses, URLs, and uploaded evidence files
- Normalize seeds into canonical entity IDs before scheduling work

### 2. Recursive Enrichment
- Each completed module can emit:
  - new observations
  - new entities
  - new edges
  - follow-on tasks
- Follow-on task creation should be policy-driven so investigations can be broad, conservative, or source-limited

### 3. Background Execution
- Run all enrichments asynchronously
- Stream partial results to the UI as soon as individual tasks complete
- Preserve a task DAG so the operator can see which module discovered which branch

---

## Declarative Playbooks

Playbooks define **what to do with a seed**, **which modules may run**, **how far recursion may go**, and **which policy guardrails apply**.

### Example Playbook Shape

```yaml
name: corporate-infrastructure-scan
description: Public-data workflow for mapping domains, hosting, and corporate identifiers

seeds:
  allowed_types: [domain, email]

policy:
  public_data_only: true
  max_depth: 3
  max_parallel_tasks: 24
  respect_source_terms: true

modules:
  - id: whois
    on: [domain]
    emits: [organization, phone, email, address]

  - id: passive_dns
    on: [domain, ip]
    emits: [domain, ip, first_seen, last_seen]

  - id: certificate_inventory
    on: [domain]
    emits: [domain, subdomain, organization]

  - id: public_records_phone_lookup
    on: [phone]
    emits: [address, person, organization]

  - id: geocoding
    on: [address]
    emits: [location]

watches:
  - on: domain
    detect: [new_subdomain, registration_change, expiry_window]
```

This keeps workflows reproducible, reviewable, and version-controlled.

---

## Watchdogs and Continuous Monitoring

Each watch should be defined as:

- a target entity or subgraph
- a refresh schedule
- a set of change detectors
- an alert routing rule
- a retention window for prior state

### Typical Watch Conditions
- new subdomain observed
- registrar or nameserver change
- hosting region shift
- certificate issuance event
- social profile rename or bio change
- wallet activity threshold crossed

### Watch Output
- alert event
- before / after snapshot
- provenance delta
- impacted nodes and edges

---

## Queueing and Orchestration Requirements

| Concern | Requirement |
|---|---|
| Work scheduling | Priority queue with per-source concurrency caps |
| Retries | Jittered backoff and explicit terminal failure states |
| Recursion safety | Depth, fan-out, and cost budgets |
| Idempotency | Stable task keys for duplicate suppression |
| Auditability | DAG and event log for every run |
| Operator control | Pause, resume, cancel, and replay individual branches |

---

## Analyst-Facing Value

The operator should be able to answer:

- What discovered this node?
- Which playbook caused this task fan-out?
- What changed since yesterday?
- Which source branches are low confidence and safe to prune?
- Which enrichments are still running or waiting on quota?
