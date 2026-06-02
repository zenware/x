# Ingestion & Traffic Control

Collection reliability depends on **quiet, predictable traffic behavior** and **source-aware scheduling**, not brute force.

---

## Source Access Layers

| Layer | Typical Use |
|---|---|
| Direct API connectors | Structured public or licensed datasets |
| Headless browser jobs | JavaScript-rendered sites and evidence capture |
| File / batch importers | CSVs, exports, analyst-provided datasets |
| Passive feed subscribers | Domain, certificate, DNS, and change feeds |

---

## Rate-Limit and Token Management

### Requirements
- Per-source quotas and concurrency limits
- Token pools with usage accounting
- Automatic backoff on `429` or equivalent quota signals
- Queue deferral instead of playbook failure when a source temporarily pauses work
- Source health metrics visible to the operator

### Scheduler Policy Inputs
- token availability
- source reliability
- cost per request
- freshness need
- investigation priority

This lets the platform degrade gracefully under quota pressure instead of collapsing an entire run.

---

## Headless Browser Integration

The browser layer exists for sources that do not provide stable APIs or that require rendering to expose public data.

### Browser Pool Capabilities
- isolated sessions
- cookie / storage partitioning
- screenshot and HTML capture
- scriptable extraction modules
- job timeouts and crash recovery

### Product Rules
- keep browser jobs policy-tagged and auditable
- store captures as evidence artifacts
- surface rendered-page provenance to the operator
- apply conservative concurrency because browser work is expensive

---

## Traffic Routing Model

Routing should be configured **per module or source class**, not as a single global switch.

### Egress Policy Controls
- direct egress
- named proxy pools
- source-specific egress rules
- jurisdiction or geography tags
- optional Tor routing where lawful and operationally appropriate

### Why This Matters
- source access characteristics differ
- some feeds are account-bound while others are browser-bound
- teams may need strict separation between investigative contexts
- routing decisions should be explainable in audit logs

---

## Reliability Patterns

| Concern | Pattern |
|---|---|
| Burst control | Token bucket or lease-based quota scheduler |
| Retry storms | Jittered backoff with retry caps |
| Duplicate work | Request fingerprinting and result cache |
| Source outages | Circuit breaker and deferred replay |
| Cost spikes | Budget-aware queue admission |
| Long browser jobs | Heartbeats and lease renewal |

---

## Operator Visibility

The UI should make traffic state visible:

- queued because of quota
- waiting on token pool
- browser pool saturated
- routed through a specific egress policy
- source disabled by policy or health state

Without this, operators cannot distinguish "no data exists" from "the engine is still waiting to ask."
