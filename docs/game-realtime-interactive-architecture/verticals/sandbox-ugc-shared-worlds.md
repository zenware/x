# Sandbox, UGC & Shared Worlds (Roblox / Minecraft / Fortnite Creative Model)

Sandbox and UGC platforms are part game, part creator platform, and part social network. They combine **persistent or semi-persistent worlds**, **user-generated content**, and **trust boundaries around user code and assets**.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Client Runtime & Main Loop | Interactive runtime across many device classes |
| Rendering Pipeline | User-generated worlds and diverse content |
| Input Abstraction | PC, console, mobile, and sometimes VR control schemes |
| Asset Pipeline & Packaging | Fast publishing of worlds and assets |
| Scene / World Loading | Streaming worlds or joining experiences |
| Save / Profile Persistence | Account data, inventory, creator profile |
| Networking & Session Transport | Shared-world state and social presence |
| Matchmaking / Social | Friends, party joins, world discovery |
| Live Ops Control Plane | Events, moderation, featured experiences |
| Analytics / Balancing | Creator analytics and platform health |
| Anti-Cheat / Trust | Safe execution of user content and economies |
| Monetization / Entitlements | Creator purchases, subscriptions, platform cuts |
| Patch / Release | Runtime and creator-tool updates |
| Diagnostics | Runtime failures in creator-built content |
| Moderation / Support | Safety workflows and creator/user support |
| Platform Integration | Cross-device compatibility and certification |

---

## Bespoke / Domain-Specific Components

### 1. World Persistence & Shared State
- World saves
- Inventory or object persistence
- Large-session consistency

### 2. Creator Tools / Scripting Runtime
- Level editors
- Scripting APIs
- Safe execution boundaries

### 3. UGC Moderation & Safety
- Asset scanning
- Experience review
- Age safety and communication controls

### 4. Creator Economy & Revenue Share
- Creator payouts
- Item/experience monetization
- Fraud prevention

### 5. Session Hosting / Sharding
- Instance creation
- Join routing
- Scale across popular worlds

### 6. Asset / Experience Marketplace
- Discovery and ranking
- Licensing / ownership rules
- Moderation hooks

### 7. Shared Presence & Social Layer
- Presence across worlds
- Group/friend systems
- Session transitions

### 8. Discovery & Recommendation
- Featured experiences
- Personalization
- Search and category browse

### 9. Cross-Device UX Adaptation
- Control remapping
- UI simplification for mobile/console
- Performance tiers

### 10. Trust Boundaries for User Code
- Sandboxing
- Capability limits
- Runtime abuse prevention

### 11. Live Social Events
- Concerts, live activations, communal events
- Crowd scaling
- Safety controls during large events

### 12. Creator Analytics
- DAU/retention per world
- Revenue / conversion
- Content quality and moderation signals

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| World Persistence | Build |
| Creator Tools / Runtime | Build |
| UGC Moderation | Hybrid |
| Creator Economy | Build |
| Session Hosting / Sharding | Build |
| Marketplace | Build |
| Shared Presence | Build |
| Discovery / Recommendation | Build |
| Cross-Device UX Adaptation | Build |
| User-Code Trust Boundaries | Build |
| Live Events | Build |
| Creator Analytics | Build on analytics primitives |
