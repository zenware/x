# Component Matrix

Cross-reference of architectural components across the covered mobile/consumer app verticals.

Legend: ✅ Required - ⚡ Critical / unusually deep - 🔄 Optional / category-dependent

---

## Part 1: Foundational Infrastructure

| Component | Messaging / Social Communication | Short-Form Social / Creator | Mobile Commerce / Mobility / On-Demand |
|---|:---:|:---:|:---:|
| App Shell & Navigation | ✅ | ✅ | ✅ |
| State Management & Data Layer | ⚡ | ⚡ | ⚡ |
| Local Storage & Cache | ✅ | ⚡ | ✅ |
| Networking & Retry | ⚡ | ⚡ | ⚡ |
| Identity & Auth | ✅ | ✅ | ✅ |
| Push Notifications | ⚡ | ✅ | ⚡ |
| Background Execution & Offline Sync | ⚡ | 🔄 | ✅ |
| Media Capture / Upload / Playback | ✅ | ⚡ | ✅ |
| Analytics / Attribution / Experiments | ✅ | ⚡ | ✅ |
| Remote Config & Feature Flags | ✅ | ✅ | ✅ |
| Crash / Perf Diagnostics | ✅ | ✅ | ✅ |
| Payments / Subscriptions | 🔄 | ✅ | ⚡ |
| Deep Linking / Share / Growth | ✅ | ⚡ | ✅ |
| Accessibility / Localization | ✅ | ✅ | ✅ |
| Security / Privacy | ⚡ | ✅ | ⚡ |
| Release / Store Ops / Support | ✅ | ✅ | ✅ |

**16 foundational components - common to nearly all serious mobile apps.**

---

## Part 2: Bespoke / Domain-Specific Components

### Messaging & Social Communication

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Conversation Model & Threading | High | No |
| Real-Time Delivery, Presence & Read State | Very High | Partially (on-demand) |
| Contact Graph & Address Book Linking | Medium | No |
| Media Messaging & Compression Semantics | High | Partially (short-form social) |
| Notification Prioritization | Medium | Partially (on-demand) |
| Group Messaging & Admin Controls | High | No |
| Spam, Abuse & Trust Controls | High | Partially (short-form social) |
| End-to-End Encryption or Message Privacy Model | Very High | No |
| Message Search / History Retention | Medium | No |
| Call / Voice Note / RTC Extensions | High | No |

**10 bespoke components**

---

### Short-Form Social & Creator

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Feed Ranking & Recommendation Engine | Very High | No |
| Video Ingest / Transcode / Delivery Hooks | Very High | Partially (messaging media) |
| Creator Graph & Engagement Model | High | No |
| Creation Tools (camera, filters, effects) | High | No |
| Moderation & Trust / Safety | Very High | Partially (messaging) |
| Ads / Monetization Surfaces | High | Partially (mobile commerce) |
| Comment, Like, Share & Remix Mechanics | Medium | No |
| Notification Ranking | Medium | Partially (messaging) |
| Creator Analytics & Revenue Workflows | Medium | No |
| Trend Detection & Discovery | High | No |
| Live Streaming / Live Rooms Extensions | High | No |

**11 bespoke components**

---

### Mobile Commerce / Mobility / On-Demand

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Marketplace / Catalog or Service Discovery | High | Partially (social discovery) |
| Cart / Checkout or Booking Flow | High | No |
| Real-Time Order / Trip State Machine | Very High | Partially (messaging delivery state) |
| Geolocation, Maps & ETA | High | No |
| Dispatch / Matching | Very High | No |
| Promotions, Credits & Loyalty | Medium | Partially (creator offers) |
| Payments, Refunds & Chargeback Handling | High | No |
| Customer / Courier / Driver Messaging | Medium | Partially (messaging) |
| Trust, Fraud & Identity Verification | High | No |
| Ratings / Reviews | Low | Partially (social engagement) |
| Customer Support & Issue Resolution Flows | Medium | No |

**11 bespoke components**

---

## Summary

| Vertical | Foundational | Bespoke | Total | % Foundational |
|---|:---:|:---:|:---:|:---:|
| Messaging & Social Communication | 16 | 10 | 26 | 62% |
| Short-Form Social / Creator | 16 | 11 | 27 | 59% |
| Mobile Commerce / Mobility / On-Demand | 16 | 11 | 27 | 59% |
