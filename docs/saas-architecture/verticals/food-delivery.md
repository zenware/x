# Food Delivery Platform (UberEats / DoorDash Model)

A food delivery marketplace connects consumers, restaurants, and delivery couriers. It's a three-sided marketplace with hard real-time constraints: orders must be routed, accepted, and delivered within a tight time window.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Auth | Consumer, restaurant operator, and courier accounts (separate roles) |
| Relational DB | Orders, restaurants, menus, users, payments, courier profiles |
| NoSQL / Document Store | Menu item configurations, restaurant hours/settings, delivery zones |
| Caching | Menu data, restaurant listings, active order state |
| Message Queue | Order lifecycle events, notification triggers, analytics events |
| Payments | Consumer checkout, refunds, restaurant payouts, courier earnings |
| Notifications | Order status pushes to consumer and courier (SMS + push) |
| Object Storage | Restaurant photos, menu item images |
| CDN | Delivering restaurant and food images |
| Search | Restaurant and menu item discovery |
| Analytics / Data Platform | Order analytics, restaurant performance dashboards, fraud patterns |
| Observability | Alerting on order pipeline stalls, courier assignment failures |

**Foundational components: ~50% of total system components**

---

## Bespoke / Domain-Specific Components

### 1. Restaurant Onboarding & Menu Management

A CMS-like system that restaurant operators use to configure their storefront.

- Restaurant profile (hours, location, cuisine tags, photos)
- Menu builder: categories, items, modifiers (e.g., "add avocado +$1.50")
- Item availability toggling (86'd items during service)
- Scheduled hours and special closures
- Multi-location support for chains
- POS system integration (Square, Toast, Olo) to sync menus and orders directly

### 2. Real-Time Order State Machine

The backbone of every order. An order transitions through a defined set of states, and transitions trigger downstream actions (notifications, courier assignment, payout calculation).

```
PLACED → ACCEPTED (by restaurant) → BEING_PREPARED → READY_FOR_PICKUP
    → COURIER_ASSIGNED → COURIER_AT_RESTAURANT → PICKED_UP
    → EN_ROUTE → DELIVERED
    ↕
CANCELLED (allowed from several states, with different refund rules)
```

- State transitions are atomic and persisted
- Each transition emits an event to the message queue
- Timeouts trigger automatic escalation (e.g., restaurant hasn't accepted in 5 min → alert ops)

### 3. Geospatial Indexing & Delivery Zone Management

Determines which restaurants are available to a given consumer and which couriers are nearby.

- Polygon-based delivery zone definitions per restaurant
- Point-in-polygon checks at order time (is consumer in delivery zone?)
- Geohash or H3-based spatial indexing for courier proximity queries
- Real-time courier location ingestion (high-frequency GPS updates)

### 4. Courier Matching & Dispatch Algorithm

Assigns the best available courier to an order. This is a constrained optimization problem with real-time inputs.

- Courier availability pool (online, idle vs. already on a delivery)
- Distance/ETA scoring (proximity to restaurant + consumer)
- Stacking logic: can a courier pick up a second order en route?
- Re-assignment when a courier declines or goes offline
- Zone-level supply/demand balancing

### 5. ETA Prediction

Users see estimated delivery times at browse time (pre-order) and updated ETAs during delivery. Accuracy is a major product quality signal.

- Restaurant prep time estimation (per restaurant, per time-of-day)
- Courier travel time (routing API + traffic data)
- Queue time at restaurant (number of active orders ahead)
- ML model combining historical and real-time signals
- Integration with Google Maps Directions API or similar for routing

### 6. Dynamic Pricing (Surge)

Adjusts delivery fees or shows "busy" messaging when courier supply is low relative to demand.

- Supply/demand ratio calculation per geofenced zone
- Surge multiplier tiers
- Consumer-facing price transparency ("delivery fee is higher than usual")
- Surge decay logic (how quickly pricing normalizes as couriers arrive)

### 7. Real-Time GPS Tracking UI

Shows consumers and operations staff the courier's live location on a map.

- Courier mobile app emits location via WebSocket or long-poll at ~5-second intervals
- Server-side fan-out to connected consumer browser/app
- Smooth interpolation between GPS pings on the client map
- ETA countdown updating in real time

### 8. Restaurant Tablet / Kitchen Display System (KDS) Integration

Restaurants need to receive and manage incoming orders in their kitchen.

- Dedicated tablet app or KDS integration push
- New order audio alert and print-to-receipt
- Order acknowledgment and ready-for-pickup confirmation
- Prep time feedback loop (actual vs. estimated)

### 9. Fraud & Abuse Detection

Food delivery fraud is significant: fake accounts claiming refunds, couriers marking deliveries complete without delivering, stolen payment methods.

- Rule-based flags: high refund rate per account, suspicious order patterns
- ML anomaly detection on order and account behavior
- Device fingerprinting to link multiple fake accounts
- Order photo capture (courier photographs delivery)
- Chargeback management workflow

### 10. Loyalty & Promotions Engine

Drives consumer retention and restaurant marketing.

- Consumer loyalty points / cashback programs
- Restaurant-sponsored discounts and featured placement
- First-order / re-engagement discount campaigns
- Promo code validation (single-use, user-targeted, restaurant-funded)
- A/B testing for promotional mechanics

### 11. Courier Onboarding & Earnings

Couriers are independent contractors. The platform manages their application, compliance, and pay.

- Background check integration (Checkr, Sterling)
- Vehicle type and insurance document upload
- Earnings dashboard (per-delivery breakdown, tips, bonuses)
- Weekly payout via ACH or Instant Pay (debit card push)
- Tax document generation (1099 in the US)
- Challenge/bonus programs (complete N deliveries, earn $X bonus)

### 12. Consumer Ratings & Restaurant Reviews

Feedback loops that surface quality signals and drive restaurant ranking.

- Post-delivery rating prompt (consumer rates courier + order quality)
- Courier rates consumer (affects future assignment priority)
- Restaurant review with photos
- Review moderation
- Aggregate rating used in search ranking

---

## Architecture Summary

```
Consumer App          Restaurant Tablet       Courier App
     │                      │                     │
     ▼                      ▼                     ▼
[Order API] ──────► [Order State Machine]◄── [Courier Location API]
     │                      │                     │
     ▼                      ▼                     ▼
[Payment Service]   [Dispatch Algorithm]    [GPS Tracking Fan-out]
                           │
                           ▼
                   [ETA Prediction Model]
```

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Restaurant Menu Management | Build |
| Order State Machine | Build (core domain logic) |
| Geospatial Indexing | Build on H3/PostGIS; buy routing API (Google Maps) |
| Courier Dispatch Algorithm | Build (core IP) |
| ETA Prediction | Build ML model; buy routing data (Google Maps, HERE) |
| Dynamic Pricing | Build |
| Real-Time GPS Tracking | Build (WebSocket fan-out) |
| KDS Integration | Build tablet app; buy POS integrations (Olo, Toast) |
| Fraud Detection | Hybrid — build rules, buy ML signals (Sift, Stripe Radar) |
| Loyalty / Promotions | Build |
| Courier Onboarding / Earnings | Hybrid — build earnings, buy background checks (Checkr) |
| Ratings & Reviews | Build |
