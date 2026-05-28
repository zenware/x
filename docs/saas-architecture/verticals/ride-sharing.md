# Ride-Sharing Platform (Uber / Lyft Model)

A two-sided mobility marketplace matches riders requesting trips with nearby driver-partners. The system has strict real-time constraints and operates in physical space — maps, routing, and GPS tracking are first-class concerns.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Auth | Rider accounts, driver accounts, admin accounts |
| Relational DB | Trips, pricing, driver/rider profiles, payments, ratings |
| NoSQL / Document Store | Driver documents, vehicle records, configuration |
| Caching | Active driver supply map, pricing cache, frequently queried configs |
| Message Queue | Trip event pipeline, notification triggers, earnings events |
| Payments | Rider charge (credit card, wallet), driver payout (weekly ACH or Instant Pay) |
| Notifications | Trip status updates, driver arrival alerts, receipt delivery (push + SMS) |
| Object Storage | Driver document uploads (license, insurance), profile photos |
| Observability | Real-time alerting on dispatch failures, payment errors, GPS data gaps |
| Analytics / Data Platform | Driver earnings reports, city-level supply/demand analytics, fraud patterns |

**Foundational components: ~45% of total system components**

---

## Bespoke / Domain-Specific Components

### 1. Geospatial Supply Tracking

Every active driver's location is continuously ingested and indexed so the platform can answer "which drivers are nearest to this rider?" with sub-second latency at global scale.

- Driver mobile app emits GPS coordinates at ~4-second intervals via WebSocket
- Server-side geospatial index (e.g., Redis `GEOADD` + `GEORADIUS`, PostGIS, or H3 hexagonal indexing)
- Stale location detection (mark driver offline if no ping for N seconds)
- City/region partitioning so geospatial queries are bounded in scope

### 2. Rider-Driver Matching Algorithm

Given a rider's pickup location and preferences, select the best available driver.

- Candidate pool: drivers within configurable radius, idle or completing a dropoff soon
- Scoring: ETA to pickup (not just distance — accounts for traffic), driver rating, acceptance rate, product type (economy, XL, premium)
- Offer dispatch: sequential offers sent to top-ranked drivers with a countdown timer
- Re-dispatch: if a driver declines or times out, offer to the next candidate
- Batching: for shared-ride products, find matches for multiple riders simultaneously

### 3. ETA & Routing Engine

Accurate ETAs are shown to riders at request time (how long until pickup) and throughout the trip (time to destination). They also drive pricing and courier dispatch.

- Road network graph (turn restrictions, speed limits, one-ways)
- Real-time traffic integration (Google Maps, HERE, TomTom traffic layer)
- Turn-by-turn navigation for driver app
- Historical travel time models (Monday 8am vs. Sunday 2pm behave differently)
- ETA confidence intervals shown in UI ("3–6 min")

### 4. Dynamic Pricing (Surge)

When demand exceeds supply in an area, prices increase to attract more drivers and ration demand.

- Supply/demand imbalance detection per geofenced zone (hexagonal cells)
- Surge multiplier tiers (1.2×, 1.5×, 2.0×, etc.)
- Fare preview and explicit user consent before booking during surge
- Price caps (regulatory compliance in some jurisdictions)
- Surge decay: prices normalize as supply responds
- Airport/event zone pricing rules

### 5. Trip State Machine

Every trip moves through a defined lifecycle. Each state transition triggers payments, notifications, and driver-side actions.

```
RIDER_REQUESTS → DRIVER_ASSIGNED → DRIVER_EN_ROUTE_TO_PICKUP
    → DRIVER_ARRIVED → TRIP_IN_PROGRESS → TRIP_COMPLETED
    ↕
CANCELLED (by rider or driver, with cancellation fee rules per state)
```

- Atomic state transitions with event emission
- Timeout-based automatic transitions (e.g., driver marked arrived → auto-start trip if no action after 5 min)
- Fare calculation triggered on TRIP_COMPLETED
- Receipt generation and charge on COMPLETED

### 6. Fare Calculation Engine

Computes the final fare based on the trip's actual route, time, and applicable pricing rules.

- Base fare + per-mile rate + per-minute rate (weighted by speed)
- Minimum fare floor
- Product-type pricing (economy, XL, premium)
- Tolls and surcharges pass-through
- Promotions and promo code application
- Upfront pricing (fare estimated before trip starts, capped on overruns)
- Receipt itemization

### 7. Real-Time Driver & Trip Map

The rider-facing map shows the driver's live location before and during the trip.

- Server-side fan-out: driver GPS updates → pushed to rider's connected client via WebSocket or SSE
- Map polyline rendering of trip route and driver path
- Smooth marker interpolation between GPS pings
- "Your driver is X minutes away" countdown

### 8. Driver App & Navigation

The driver-facing mobile application for receiving trip offers, navigating to pickup/dropoff, and managing earnings.

- Trip offer card with pickup location, estimated earnings, timer to accept/decline
- Turn-by-turn navigation (in-app or handoff to Google Maps/Waze)
- Online/offline toggle with supply-side status updates
- Earnings summary in-app

### 9. Driver Onboarding & Compliance

Driver-partners are independent contractors. Regulatory compliance varies by jurisdiction.

- Document upload and verification (driver's license, vehicle registration, insurance)
- Background check integration (Checkr, Sterling)
- Vehicle inspection photo submission
- City-specific regulatory requirements (e.g., TLC licensing in NYC)
- Document expiry monitoring and renewal reminders
- Deactivation workflow for compliance failures

### 10. Driver Earnings & Payouts

- Per-trip earnings breakdown (fare, tip, bonuses)
- Weekly automatic ACH payout
- Instant Pay / Rapid Pay (debit card push payment, small fee)
- Earnings goals and boost programs ("earn $200 this weekend")
- Tax document generation (1099-NEC for US contractors)
- Earnings forecasting ("you're on track to hit your goal")

### 11. Rider & Driver Ratings

Mutual ratings after each trip create accountability and feed into matching priority.

- Post-trip rating prompt for both parties (1–5 stars)
- Driver rating feeds into dispatch scoring (lower-rated drivers receive fewer offers)
- Rider rating visible to drivers (drivers can decline low-rated riders)
- Rating fraud detection (coordinated high/low-rating campaigns)
- Aggregate rating displayed on profiles

### 12. Safety Features

Safety is a regulatory and brand concern. Dedicated features exist to protect both riders and drivers.

- Share trip status with trusted contact (live location link)
- Emergency SOS button (connects to 911 with trip location context)
- Trip recording / audio capture option (jurisdiction-dependent)
- Incident reporting workflow post-trip
- Trip anomaly detection (unexpected route deviation, trip lasting far longer than ETA)

### 13. Anti-Fraud & Fake GPS Detection

Drivers may attempt to game the system with fake GPS locations ("GPS spoofing") to appear in high-demand areas without actually being there.

- GPS signal consistency checks (speed impossible given road network)
- Device integrity attestation (Android SafetyNet / Play Integrity, iOS DeviceCheck)
- Coordinate jump detection
- Pattern analysis (always appearing in airport zone without actual airport trips)

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Geospatial Supply Tracking | Build (Redis Geo + H3 custom indexing) |
| Matching Algorithm | Build (core IP) |
| ETA & Routing | Build model; buy road network data (Google Maps, HERE) |
| Dynamic Pricing | Build |
| Trip State Machine | Build (core domain logic) |
| Fare Calculation | Build |
| Real-Time Map | Build (WebSocket fan-out) |
| Driver App / Navigation | Build app; integrate navigation (Google Maps SDK) |
| Driver Onboarding / Compliance | Hybrid — build workflow, buy background checks (Checkr) |
| Driver Earnings / Payouts | Build on top of Stripe Connect or Marqeta |
| Ratings | Build |
| Safety Features | Build; buy 911 integration (RapidSOS) |
| Anti-Fraud / GPS Spoof Detection | Build |
