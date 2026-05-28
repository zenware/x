# Messaging & Social Communication (WhatsApp / iMessage / Telegram Model)

Messaging apps center on **fast delivery**, **contact trust**, **notification correctness**, and often **privacy guarantees**. The user experience is defined by whether messages feel instant, dependable, and safe.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| App Shell & Navigation | Conversation list, thread view, media picker, settings |
| State Management & Data Layer | Message lists, optimistic sends, cache coherence |
| Local Storage & Cache | Recent history, offline drafts, media cache |
| Networking & Retry | Message send/ack flows, reconnect logic |
| Identity & Auth | Phone/email login, device linking, recovery |
| Push Notifications | New message alerts and deep links to threads |
| Background Execution & Offline Sync | Send retries, history sync, notification actions |
| Media Capture & Playback | Camera, voice notes, image/video sharing |
| Analytics & Experimentation | Retention, invite funnel, notification tuning |
| Remote Config & Flags | Roll out reply, group, or call features safely |
| Crash / Perf Diagnostics | Startup, scroll, attach/send diagnostics |
| Deep Linking / Share | Invite links, shared thread entry points |
| Accessibility / Localization | VoiceOver/TalkBack, RTL messaging, dynamic type |
| Security / Privacy | Key storage, privacy controls, device trust |
| Release / Store Ops / Support | Rollouts, policy compliance, account support |

**Foundational components: the majority of the surface area**

---

## Bespoke / Domain-Specific Components

### 1. Conversation Model & Threading
- One-to-one and group thread semantics
- Message ordering and deduplication
- Thread metadata and unread state

### 2. Real-Time Delivery, Presence & Read State
- Delivery acknowledgements
- Read receipts
- Typing indicators and presence
- Multi-device sync semantics

### 3. Contact Graph & Identity Linking
- Address-book import and reconciliation
- Username / phone / handle mapping
- Block / allow lists

### 4. Media Messaging Semantics
- Attachment upload lifecycle
- Voice notes and media previews
- Compression choices tuned for mobile

### 5. Group Messaging & Admin Controls
- Roles and permissions
- Invite links and approval flows
- Member history / moderation behavior

### 6. Spam, Abuse & Trust Controls
- Spam detection
- Abuse reporting
- Rate limits and suspicious account heuristics

### 7. Privacy / Encryption Model
- End-to-end encryption where applicable
- Key exchange and rotation
- Backup and device migration trust rules

### 8. Search & History Retention
- Local or remote search
- Retention / deletion policies
- Archive and export flows

### 9. Calls, Voice & Real-Time Communication Extensions
- Voice/video call signaling
- Network quality adaptation
- Call history and notification integration

### 10. Notification Correctness
- Collapse and priority rules
- Quiet hours and mention overrides
- Multi-device deduplication

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Conversation Model | Build |
| Delivery / Presence / Read State | Build |
| Contact Graph | Build |
| Media Messaging | Build |
| Group Controls | Build |
| Spam / Abuse | Build on commodity moderation services where useful |
| Privacy / Encryption | Build carefully; adopt proven crypto primitives |
| Search / Retention | Build |
| Calls / RTC | Hybrid - use RTC infrastructure, build product semantics |
| Notification Correctness | Build |
