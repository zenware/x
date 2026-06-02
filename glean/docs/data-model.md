# Data Model

The platform should separate **facts**, **inferences**, **raw evidence**, and **operator annotations** so the investigation graph remains explainable.

---

## Primary Objects

| Object | Purpose |
|---|---|
| Entity | Canonical thing: domain, IP, email, person, org, wallet, location, account |
| Observation | Time-bound fact reported by a source |
| Edge | Relationship between two entities |
| Evidence Artifact | Raw payload, screenshot, document, capture, or transformed extract |
| Assertion | Analyst-added note, tag, or merge/suppress action |
| Watch | Continuous monitoring rule tied to an entity or subgraph |

---

## Entity Shape

```yaml
entity:
  id: ent_01J...
  type: domain
  canonical_value: example.org
  aliases:
    - www.example.org
  status:
    active: true
    disputed: false
  confidence:
    score: 0.92
    rationale: matched across whois and certificate observations
  first_seen_at: 2024-02-01T00:00:00Z
  last_seen_at: 2026-05-31T23:59:00Z
```

---

## Observation Shape

```yaml
observation:
  id: obs_01J...
  entity_id: ent_01J...
  source_module: passive_dns
  collected_at: 2026-06-01T10:00:00Z
  observed_at: 2026-05-27T18:42:00Z
  claim:
    field: resolved_to_ip
    value: 203.0.113.10
  confidence:
    score: 0.88
  evidence_artifact_id: art_01J...
  normalization_version: 4
```

---

## Edge Shape

```yaml
edge:
  id: edge_01J...
  type: resolves_to
  from_entity_id: ent_domain
  to_entity_id: ent_ip
  derived_from_observations:
    - obs_01J...
  validity:
    first_seen_at: 2025-03-10T00:00:00Z
    last_seen_at: 2026-05-27T18:42:00Z
  confidence:
    score: 0.88
  inference: false
```

---

## Provenance Rules

Every entity, observation, and edge should answer:

- Which module created it?
- Which artifact supports it?
- When was it collected?
- Which version of the normalizer or matcher touched it?
- Was it directly observed or inferred?

### Trust Model

Maintain at least three separate dimensions:

| Dimension | Meaning |
|---|---|
| Confidence | How likely the specific claim is correct |
| Reliability | Historical trustworthiness of the source |
| Freshness | How current the claim is |

Do not collapse them into one opaque score.

---

## Watch State Model

```yaml
watch:
  id: watch_01J...
  scope:
    entity_id: ent_domain
    include_neighbors_depth: 1
  schedule:
    cron: "0 */6 * * *"
  detectors:
    - new_subdomain
    - registrar_change
    - certificate_change
  last_run_at: 2026-06-01T06:00:00Z
  last_change_at: 2026-05-29T14:21:00Z
```

---

## Analyst Actions That Must Be Modeled Explicitly

- merge / unmerge entities
- suppress noisy edges
- mark a source branch unreliable
- pin nodes in an investigation workspace
- attach notes, tags, and case references

These are not raw facts. They are operator actions and should remain distinguishable from collected evidence.
