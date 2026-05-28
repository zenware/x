# Mobile Commerce, Mobility & On-Demand (Uber / DoorDash / Instacart Model)

These apps combine **consumer search and checkout**, **real-world fulfillment**, and often **real-time location updates**. The mobile client is the primary operational surface for ordering, booking, and tracking.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| App Shell & Navigation | Browse, checkout, tracking, account, support |
| State Management & Data Layer | Cart, booking flow, real-time status, cached history |
| Local Storage & Cache | Preferences, addresses, payment state, recent items |
| Networking & Retry | Search, checkout, tracking, support interactions |
| Identity & Auth | Account login, loyalty, verification |
| Push Notifications | Order/trip status and driver/courier arrival |
| Background Execution & Offline Sync | Tracking refresh and post-purchase sync |
| Media Capture / Upload | ID/photo upload, issue reporting, support evidence |
| Analytics & Experimentation | Funnel optimization, promo and conversion analysis |
| Remote Config & Flags | Pricing, checkout, merchandising experiments |
| Crash / Perf Diagnostics | Checkout and maps reliability |
| Payments / Subscriptions | Stored payment methods, memberships, credits |
| Deep Linking / Share | Referral links, reorder links, tracking shares |
| Accessibility / Localization | Currency, locale, map accessibility, translations |
| Security / Privacy | Payment data, fraud signals, account/device trust |
| Release / Support | Fast response to operational issues |

**Foundational components are broad, but the operational engine is what differentiates the product.**

---

## Bespoke / Domain-Specific Components

### 1. Marketplace / Catalog or Service Discovery
- Merchandising and search
- Inventory or availability awareness
- Personalization and repeat behavior

### 2. Cart / Checkout or Booking Flow
- Basket or trip configuration
- Pricing, tax, fees, and promos
- Confirmation and post-purchase transitions

### 3. Real-Time Order / Trip State Machine
- Order/trip lifecycle
- Failures, substitutions, cancellations
- Customer-visible milestones

### 4. Geolocation, Maps & ETA
- Map rendering
- Driver/courier/vehicle tracking
- Address accuracy and ETA prediction

### 5. Dispatch / Matching
- Match supply with demand
- Reassignment and fallback
- Throughput and fairness behavior

### 6. Promotions, Credits & Loyalty
- Promo rules
- Membership perks
- Re-engagement offers

### 7. Payments, Refunds & Risk
- Payment authorization/capture
- Refund logic
- Chargebacks and payment failures

### 8. Customer / Courier / Driver Messaging
- Status-aware chat
- Canned responses and attachments
- Notification escalation

### 9. Trust, Fraud & Verification
- Device/account risk signals
- Identity verification
- Abuse controls around refunds and incentives

### 10. Ratings / Reviews
- Consumer and provider ratings
- Review moderation
- Trust effects on marketplace quality

### 11. Support & Resolution Flows
- Self-serve issue resolution
- Credits/refunds
- Escalation to human support

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Discovery / Marketplace Surface | Build |
| Cart / Checkout / Booking | Build |
| Order / Trip State Machine | Build |
| Maps / ETA | Hybrid |
| Dispatch / Matching | Build |
| Promotions / Loyalty | Build |
| Payments / Refunds | Hybrid |
| Messaging | Build on reusable messaging primitives |
| Trust / Fraud / Verification | Hybrid |
| Ratings / Reviews | Build |
| Support / Resolution | Build on support tooling primitives |
