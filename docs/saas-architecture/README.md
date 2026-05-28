# SaaS Architecture Reference

This documentation covers the components required to build SaaS products across several common business verticals. It is organized around a key distinction:

- **Foundational Infrastructure** — components that nearly every SaaS product needs, regardless of domain. These are typically built once, bought off-the-shelf, or adopted as managed cloud services.
- **Bespoke / Domain-Specific** — components that encode the core business logic of the specific product. These are where the competitive differentiation lives and are typically custom-built.

Understanding this split helps engineering organizations prioritize build vs. buy decisions, estimate complexity, and identify which investments are reusable across multiple products.

---

## Contents

| Document | Description |
|---|---|
| [Foundational Infrastructure](./foundational-infrastructure.md) | Deep-dive on the shared layer every SaaS product needs |
| [Video Streaming (YouTube)](./verticals/video-streaming.md) | Architecture for user-generated video platforms |
| [Food Delivery (UberEats)](./verticals/food-delivery.md) | Architecture for marketplace + on-demand logistics |
| [Social Media / Microblogging (Twitter/X)](./verticals/social-media.md) | Architecture for public real-time social networks |
| [Ride-Sharing (Uber)](./verticals/ride-sharing.md) | Architecture for two-sided mobility marketplaces |
| [E-Commerce (Amazon/Shopify)](./verticals/ecommerce.md) | Architecture for product commerce at scale |
| [B2B SaaS / CRM (Salesforce)](./verticals/b2b-saas-crm.md) | Architecture for multi-tenant enterprise tooling |
| [Component Matrix](./component-matrix.md) | Cross-reference of every component across all verticals |

---

## The Build vs. Buy Rule of Thumb

A component is a good **buy/adopt** candidate when:
- It is not core to the product's competitive differentiation
- Mature open-source or managed-cloud solutions exist (e.g., Postgres, Redis, Stripe, Auth0)
- Operating it in-house has high undifferentiated toil (e.g., email deliverability, TLS certificate management)

A component is a good **build** candidate when:
- It directly encodes the unique business logic or user experience
- No off-the-shelf solution matches the scale or domain requirements
- The algorithm or model is itself a competitive moat (e.g., recommendation engines, matching algorithms)

In practice, early-stage products buy nearly everything. At scale, companies often rebuild key bought components to reduce cost, improve performance, or achieve tighter integration.

---

## Approximate Split by Vertical

| Vertical | Foundational (%) | Bespoke (%) |
|---|---|---|
| Video Streaming | ~45% | ~55% |
| Food Delivery | ~50% | ~50% |
| Social Media | ~40% | ~60% |
| Ride-Sharing | ~45% | ~55% |
| E-Commerce | ~50% | ~50% |
| B2B SaaS / CRM | ~55% | ~45% |

_Percentages are rough estimates by component count. Bespoke components typically represent a disproportionately large share of engineering effort even when fewer in number._
