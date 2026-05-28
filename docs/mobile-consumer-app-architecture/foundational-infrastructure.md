# Foundational Infrastructure

These are the shared building blocks that appear across mobile-first consumer applications, whether the product is a messaging app, short-form video network, banking app, or on-demand marketplace.

Most teams should standardize these capabilities before investing in category-specific engagement loops.

---

## 1. App Shell, Navigation & Screen Architecture

**What it does:** Owns tabs, navigation stacks, modal flows, lifecycle handling, and screen composition across iOS and Android.

**Components:**
- Navigation hierarchy and route model
- Deep link entry points
- Modal sheets, overlays, and in-app flows
- App lifecycle handling across foreground/background states

---

## 2. State Management & Data Layer

**What it does:** Keeps local UI state, server-backed entities, and optimistic updates coherent.

**Components:**
- Client state containers
- Cache normalization
- Request deduplication
- Optimistic mutations and rollback

---

## 3. Local Storage, Cache & Session Persistence

**What it does:** Persists user data and cached content for fast startup and offline resilience.

**Components:**
- Encrypted local storage
- Image/video/document caches
- Session persistence
- Data eviction policies

---

## 4. Networking, API Client & Retry Policy

**What it does:** Handles unreliable mobile connectivity cleanly.

**Components:**
- HTTP/gRPC/WebSocket clients
- Retry and backoff policies
- Offline queueing
- Connectivity awareness

---

## 5. Identity, Auth & Account Lifecycle

**What it does:** Manages sign-in, signup, session refresh, verification, and recovery.

**Components:**
- Passwordless, social, or phone auth
- Session/token refresh
- Device binding
- Account recovery and verification

---

## 6. Push Notifications & Re-Engagement

**What it does:** Brings users back to the app and routes them into the right flow.

**Components:**
- APNs / FCM integration
- Notification payload routing
- Notification preferences
- Quiet hours and delivery rules

---

## 7. Background Execution & Offline Sync

**What it does:** Performs limited work while the app is backgrounded or offline.

**Components:**
- Background fetch / task scheduling
- Sync queues
- Conflict handling
- Deferred upload/download

---

## 8. Media Capture, Upload & Playback Plumbing

**What it does:** Supports camera, microphone, gallery import, compression, and playback where needed.

**Components:**
- Camera and mic access
- Image/video compression
- Upload pipelines
- Player surfaces and buffering

---

## 9. Analytics, Attribution & Experimentation

**What it does:** Measures acquisition, activation, retention, and feature impact.

**Components:**
- Product event tracking
- Attribution hooks
- Funnel analysis
- A/B testing support

---

## 10. Remote Config & Feature Flags

**What it does:** Decouples release from app-store submission.

**Components:**
- Feature toggles
- Remote copy/config
- Kill switches
- Version-aware targeting

---

## 11. Crash Reporting, Performance & Diagnostics

**What it does:** Makes mobile failures visible despite device diversity.

**Components:**
- Crash capture
- Startup/performance timing
- ANR or hang detection
- Device/environment metadata

---

## 12. Payments, Subscriptions & App Store Commerce

**What it does:** Handles in-app purchases, subscriptions, and external checkout handoff where applicable.

**Components:**
- StoreKit / Play Billing
- Receipt validation
- Subscription state sync
- Entitlement caching

---

## 13. Deep Linking, Share Sheets & Growth Loops

**What it does:** Connects acquisition channels to in-app conversion paths.

**Components:**
- Universal links / app links
- Invite/referral flows
- Content sharing
- Deferred deep linking

---

## 14. Accessibility, Localization & Device Adaptation

**What it does:** Makes the app usable across locales, device classes, and assistive technologies.

**Components:**
- Screen reader and dynamic type support
- RTL/localization handling
- Phone/tablet layout adaptation
- Haptics and platform conventions

---

## 15. Security, Privacy & Mobile Trust

**What it does:** Protects sensitive user data on potentially compromised consumer devices.

**Components:**
- Secure token/key storage
- Jailbreak/root detection as needed
- PII minimization and privacy controls
- Device integrity signals

---

## 16. Release, Store Operations & Support Tooling

**What it does:** Ships app versions, manages phased rollouts, and supports users in production.

**Components:**
- CI/CD for mobile binaries
- TestFlight / internal / staged rollout channels
- App-store metadata workflows
- In-app support entry points

---

## Summary

| # | Component | Typical Approach |
|---|---|---|
| 1 | App Shell & Navigation | Build on native or cross-platform framework |
| 2 | State Management & Data Layer | Build |
| 3 | Local Storage & Cache | Hybrid |
| 4 | Networking & Retry | Build on mature client libraries |
| 5 | Identity & Auth | Buy or hybrid |
| 6 | Push & Re-Engagement | Adopt OS push + custom rules |
| 7 | Background Execution & Offline Sync | Build |
| 8 | Media Capture & Playback | Hybrid |
| 9 | Analytics & Experimentation | Buy or hybrid |
| 10 | Remote Config & Flags | Buy or hybrid |
| 11 | Crash / Perf Diagnostics | Buy or hybrid |
| 12 | Payments & Subscriptions | Adopt store infrastructure |
| 13 | Deep Linking & Growth Loops | Build |
| 14 | Accessibility & Localization | Adopt platform primitives, add app semantics |
| 15 | Security & Privacy | Adopt platform primitives, add policy |
| 16 | Release & Support Tooling | Buy / adopt |
