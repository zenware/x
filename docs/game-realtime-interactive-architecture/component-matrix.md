# Component Matrix

Legend: ✅ Required - ⚡ Critical / unusually deep - 🔄 Optional / category-dependent

---

## Part 1: Foundational Infrastructure

| Component | Competitive Multiplayer Live Service | Sandbox / UGC / Shared Worlds | Mobile F2P Strategy / Puzzle |
|---|:---:|:---:|:---:|
| Client Runtime & Main Loop | ✅ | ✅ | ✅ |
| Rendering Pipeline | ⚡ | ⚡ | ✅ |
| Input & Controller Abstraction | ⚡ | ✅ | ✅ |
| Asset Pipeline & Packaging | ✅ | ⚡ | ✅ |
| Scene / World / Level Loading | ✅ | ⚡ | ✅ |
| Save / Profile Persistence | ✅ | ✅ | ✅ |
| Networking & Session Transport | ⚡ | ⚡ | 🔄 |
| Matchmaking / Parties / Social | ⚡ | ✅ | 🔄 |
| Live Ops Control Plane | ✅ | ✅ | ⚡ |
| Analytics / Balancing | ✅ | ✅ | ⚡ |
| Anti-Cheat / Trust | ⚡ | ✅ | ✅ |
| Monetization / Entitlements | ✅ | ✅ | ⚡ |
| Patch / Build / Release | ✅ | ✅ | ✅ |
| Diagnostics | ✅ | ✅ | ✅ |
| Moderation / Support | ✅ | ✅ | ✅ |
| Platform Integration / Certification | ✅ | ✅ | ✅ |

---

## Part 2: Bespoke / Domain-Specific Components

### Competitive Multiplayer Live Service

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Authoritative Simulation / Server Model | Very High | No |
| Matchmaking Quality & Ranked Systems | Very High | Partially (sandbox sessions) |
| Netcode / Prediction / Reconciliation | Very High | No |
| Character / Weapon / Ability Systems | High | No |
| Anti-Cheat & Competitive Integrity Extensions | Very High | Partially |
| Progression, Seasons & Battle Passes | High | Partially (mobile F2P) |
| Spectator / Replay / Esports Features | High | No |
| Social / Party / Voice Coordination | Medium | Partially |
| Live Balance & Event Operations | High | Partially |
| Cosmetic Economy & Inventory | Medium | Partially |
| Ranked Moderation / Penalty Systems | High | No |

**11 bespoke components**

---

### Sandbox / UGC / Shared Worlds

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| World Persistence & Shared State | Very High | No |
| Creator Tools / Scripting / Sandbox Runtime | Very High | No |
| UGC Moderation & Safety | Very High | No |
| Creator Economy / Revenue Share | High | Partially (mobile creator apps) |
| Session Hosting / Sharding | High | Partially (competitive multiplayer) |
| Marketplace for Assets / Experiences | High | No |
| Identity, Friends & Presence in Shared Worlds | High | Partially |
| Discovery / Recommendation for Experiences | High | Partially (social feeds) |
| Cross-Device Input / UX Adaptation | Medium | No |
| Trust Boundaries for User Code / Content | Very High | No |
| Events / Live Social Experiences | Medium | Partially |
| Analytics for Creators & Worlds | Medium | Partially |

**12 bespoke components**

---

### Mobile F2P Strategy / Puzzle

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Core Puzzle / Strategy Rules Engine | High | No |
| Meta-Progression & Retention Loops | Very High | Partially (live service) |
| Energy / Lives / Timers | Medium | No |
| Economy Balancing & Offer Systems | High | Partially |
| Segmented Live Events | High | Partially |
| Personalization & Difficulty Tuning | High | No |
| Ad Mediation / Rewarded Ads | Medium | No |
| Social Competition / Leaderboards | Medium | Partially |
| Content / Level Authoring Pipeline | High | No |
| Fraud / Exploit Prevention | Medium | Partially |

**10 bespoke components**

---

## Summary

| Vertical | Foundational | Bespoke | Total | % Foundational |
|---|:---:|:---:|:---:|:---:|
| Competitive Multiplayer Live Service | 16 | 11 | 27 | 59% |
| Sandbox / UGC / Shared Worlds | 16 | 12 | 28 | 57% |
| Mobile F2P Strategy / Puzzle | 16 | 10 | 26 | 62% |
