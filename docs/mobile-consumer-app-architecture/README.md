# Mobile / Consumer App Architecture Reference

This documentation covers the components required to build **mobile-first consumer applications** across several common product categories. It uses the same split as the other architecture references:

- **Foundational infrastructure** - reusable platform capabilities that most serious mobile products need
- **Bespoke / domain-specific components** - the feed systems, chat semantics, trust models, ranking, and mobile workflows that make one app category different from another

Mobile apps often share backend infrastructure with SaaS products, but the client architecture is materially different because of offline behavior, battery/network constraints, app-store distribution, push, device APIs, and growth loops tied to the handset.

---

## Contents

| Document | Description |
|---|---|
| [Foundational Infrastructure](./foundational-infrastructure.md) | Shared platform components most mobile/consumer apps need |
| [Messaging & Social Communication](./verticals/messaging-social-communication.md) | Architecture for WhatsApp / iMessage / Telegram-like apps |
| [Short-Form Social & Creator Platforms](./verticals/short-form-social-creator.md) | Architecture for TikTok / Instagram Reels / Snapchat-like products |
| [Mobile Commerce, Mobility & On-Demand](./verticals/mobile-commerce-mobility-ondemand.md) | Architecture for Uber / DoorDash / Instacart-style consumer apps |
| [Component Matrix](./component-matrix.md) | Cross-reference of shared and bespoke components across all covered mobile verticals |

---

## The Build vs. Buy Rule of Thumb

A component is usually a good **buy / adopt** candidate when:

- The mobile OS or a mature SDK already solves it well enough
- It is operational plumbing rather than product differentiation
- Owning it adds more reliability burden than product leverage

A component is usually a good **build** candidate when:

- It defines the core user loop, ranking model, or trust semantics
- Performance or offline behavior is central to retention
- The feature directly shapes how users create, communicate, transact, or return

In practice, strong mobile products often **adopt commodity mobile infrastructure and custom-build the engagement engine**.

---

## Approximate Split by Vertical

| Vertical | Foundational | Bespoke | Total | % Foundational |
|---|:---:|:---:|:---:|:---:|
| Messaging & Social Communication | 16 | 10 | 26 | 62% |
| Short-Form Social & Creator | 16 | 11 | 27 | 59% |
| Mobile Commerce / Mobility / On-Demand | 16 | 11 | 27 | 59% |

_These percentages are by component count, not engineering effort. Retention-driving bespoke loops such as feeds, messaging semantics, dispatch, and trust/safety usually dominate implementation complexity._
