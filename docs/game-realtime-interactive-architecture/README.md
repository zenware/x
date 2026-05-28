# Game / Real-Time Interactive Architecture Reference

This documentation covers the components required to build **real-time interactive products**, especially games and live interactive worlds. It separates:

- **Foundational infrastructure** - reusable engine, runtime, live-ops, and backend systems shared across many game types
- **Bespoke / domain-specific components** - the simulation, economy, progression, networking model, and content rules that define a specific game category

Games differ sharply from SaaS because frame time, simulation determinism, content production, player fairness, and live-service operations all become first-class architecture concerns.

---

## Contents

| Document | Description |
|---|---|
| [Foundational Infrastructure](./foundational-infrastructure.md) | Shared platform components common across games and real-time interactive products |
| [Competitive Multiplayer Live Service](./verticals/competitive-multiplayer-live-service.md) | Architecture for Valorant / League / Apex-like products |
| [Sandbox, UGC & Shared Worlds](./verticals/sandbox-ugc-shared-worlds.md) | Architecture for Roblox / Minecraft / Fortnite Creative-like platforms |
| [Mobile F2P Strategy / Puzzle](./verticals/mobile-f2p-strategy-puzzle.md) | Architecture for Clash of Clans / Candy Crush / merge-style games |
| [Component Matrix](./component-matrix.md) | Cross-reference of shared and bespoke systems across covered game verticals |

---

## The Build vs. Buy Rule of Thumb

A component is usually a good **buy / adopt** candidate when:

- It is undifferentiated engine/runtime plumbing
- Middleware already solves it at the right fidelity
- Owning it would slow content iteration more than it would improve the core game

A component is usually a good **build** candidate when:

- It defines player feel, fairness, or the progression economy
- The simulation or netcode is part of the moat
- Content creation, moderation, or monetization rules are core to the live service

In practice, teams often **adopt an engine, build the game loop, and heavily customize the live-service stack**.

---

## Approximate Split by Vertical

| Vertical | Foundational | Bespoke | Total | % Foundational |
|---|:---:|:---:|:---:|:---:|
| Competitive Multiplayer Live Service | 16 | 11 | 27 | 59% |
| Sandbox / UGC / Shared Worlds | 16 | 12 | 28 | 57% |
| Mobile F2P Strategy / Puzzle | 16 | 10 | 26 | 62% |
