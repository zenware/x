# Mobile F2P Strategy / Puzzle (Clash of Clans / Candy Crush Model)

Mobile F2P games optimize for **retention**, **economy balance**, **live events**, and **friction-managed monetization**. They often have less demanding real-time networking than multiplayer action games but much deeper segmentation and progression tuning.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Client Runtime & Main Loop | Core gameplay, UI, and transitions |
| Rendering Pipeline | Mobile-friendly visuals and performance |
| Input Abstraction | Touch-first controls |
| Asset Pipeline | Frequent live content drops |
| Scene / Level Loading | Level and event progression |
| Save / Profile Persistence | Progression, purchases, settings |
| Live Ops Control Plane | Offers, events, timers, segmentation |
| Analytics / Balancing | Retention, monetization, difficulty curves |
| Anti-Cheat / Trust | Purchase integrity and exploit prevention |
| Monetization / Entitlements | IAP, rewarded ads, subscriptions |
| Patch / Release | Mobile update cadence |
| Diagnostics | Device-specific crash/performance issues |
| Moderation / Support | Payment and account issue handling |
| Platform Integration | Store policies and entitlements |

---

## Bespoke / Domain-Specific Components

### 1. Core Puzzle / Strategy Rules Engine
- Turn or level rules
- Deterministic scoring
- Content extensibility

### 2. Meta-Progression
- Unlock trees
- World/chapter progression
- Returning-player loops

### 3. Energy / Lives / Timers
- Session pacing
- Gating and refill mechanics
- Monetization interplay

### 4. Economy Balancing & Offers
- Hard/soft currency
- Store bundles
- Personalized offers

### 5. Segmented Live Events
- Limited-time modes
- Cohort-specific content
- Seasonal cadence

### 6. Personalization & Difficulty
- Difficulty curves
- Win/loss recovery
- Content pacing by player segment

### 7. Ad Mediation / Rewarded Ads
- Reward placement
- Ad quality and fill management
- Revenue versus retention tradeoffs

### 8. Social Competition
- Leaderboards
- Guild/clan-lite features
- Invite and referral loops

### 9. Content / Level Authoring
- Internal content tools
- A/B variants
- Live tuning hooks

### 10. Fraud / Exploit Prevention
- Save tamper detection
- Economy abuse handling
- Incentive abuse controls

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Core Rules Engine | Build |
| Meta-Progression | Build |
| Energy / Timers | Build |
| Economy / Offers | Build |
| Live Events | Build |
| Personalization / Difficulty | Build |
| Ad Mediation | Hybrid |
| Social Competition | Build |
| Content / Level Authoring | Build |
| Fraud / Exploit Prevention | Hybrid |
