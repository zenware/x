# Component Matrix

Cross-reference of all architectural components across all documented SaaS verticals. Use this to:
- Identify which foundational investments benefit the most verticals
- Assess the bespoke effort required before entering a specific vertical
- Evaluate build vs. buy decisions at a glance

Legend: ✅ Required — ⚡ Critical / high-complexity — 🔄 Optional / nice-to-have

---

## Part 1: Foundational Infrastructure (Buy / Adopt)

| Component | Video Streaming | Food Delivery | Social Media | Ride-Sharing | E-Commerce | B2B SaaS / CRM |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Identity & Auth (AuthN/AuthZ) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚡ SSO/SAML |
| API Gateway & Load Balancing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Service Mesh | 🔄 | 🔄 | ✅ | ✅ | 🔄 | 🔄 |
| Relational Database | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| NoSQL / Document Store | ✅ | ✅ | ⚡ (posts at scale) | ✅ | ⚡ (catalog) | ✅ |
| Caching Layer | ✅ | ✅ | ⚡ (timelines) | ⚡ (supply map) | ⚡ (pages, search) | ✅ |
| Message Queue / Event Streaming | ⚡ (transcoding) | ⚡ (order events) | ⚡ (fan-out) | ✅ | ✅ | ✅ |
| Object / Blob Storage | ⚡ (video) | ✅ | ✅ | ✅ | ✅ | ✅ |
| CDN | ⚡ (video delivery) | ✅ | ✅ | 🔄 | ✅ | ✅ |
| Search | ✅ | ✅ | ⚡ (real-time) | 🔄 | ⚡ (product discovery) | ✅ |
| Notification Infrastructure | ✅ | ⚡ (real-time order) | ✅ | ⚡ (real-time trip) | ✅ | ✅ |
| Payments & Billing | ✅ | ⚡ (3-party payouts) | 🔄 | ⚡ (driver payouts) | ⚡ (seller payouts) | ⚡ (subscriptions) |
| Observability Stack | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CI/CD & Developer Platform | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| IaC & Secret Management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Feature Flags | ✅ | ✅ | ✅ | ✅ | ⚡ (A/B checkout) | ✅ |
| Analytics / Data Platform | ⚡ (creator analytics) | ✅ | ✅ | ✅ | ✅ | ⚡ (usage telemetry) |
| Audit Logging & Compliance | ✅ | ✅ | ✅ | ✅ | ✅ | ⚡ (SOC 2 required) |

**18 foundational components — all required or applicable across all verticals.**

---

## Part 2: Bespoke / Domain-Specific Components (Build)

### Video Streaming

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Video Ingestion Pipeline | High | No |
| Video Transcoding Pipeline | Very High | No |
| Adaptive Bitrate Packaging (HLS/DASH) | High | No |
| Live Streaming Ingest & Delivery | Very High | No |
| DRM & Content Protection | High | No |
| Copyright / Content ID System | Very High | No |
| Video Recommendation Engine | Very High | Partially (general RecSys) |
| Creator Studio & Analytics | Medium | No |
| Ad Serving & Targeting | High | Partially (ad stack) |
| Automated Caption / ASR | Medium | No |
| Content Moderation | High | Partially (Social Media) |
| Video Player (Web + Mobile SDK) | High | No |

**12 bespoke components**

---

### Food Delivery

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Restaurant Onboarding & Menu Management | Medium | No |
| Real-Time Order State Machine | High | Partially (Ride-Sharing) |
| Geospatial Indexing & Delivery Zones | High | Partially (Ride-Sharing) |
| Courier Matching & Dispatch Algorithm | Very High | Partially (Ride-Sharing) |
| ETA Prediction | High | Partially (Ride-Sharing) |
| Dynamic Pricing (Surge) | Medium | Partially (Ride-Sharing) |
| Real-Time GPS Tracking UI | Medium | Partially (Ride-Sharing) |
| KDS / Restaurant Tablet Integration | Medium | No |
| Fraud & Abuse Detection | High | Partially (E-Commerce) |
| Loyalty & Promotions Engine | Medium | Partially (E-Commerce) |
| Courier Onboarding & Earnings | Medium | Partially (Ride-Sharing) |
| Consumer Ratings & Reviews | Low | Partially (E-Commerce) |

**12 bespoke components**

---

### Social Media / Microblogging

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Fan-Out Service (Timeline Delivery) | Very High | No |
| Social Graph Service | High | No |
| Post / Tweet Storage & Retrieval | High | No |
| Timeline & Feed Ranking | Very High | Partially (general RecSys) |
| Hashtag & Trend Detection | High | No |
| Real-Time Streaming API (Firehose) | High | No |
| @Mention, Reply & Thread Modeling | Medium | No |
| Repost / Retweet Mechanics | Low | No |
| Direct Messages (DMs) | Medium | No |
| Recommendation Engine | Very High | Partially (general RecSys) |
| Real-Time Post Search & Indexing | High | No |
| Content Moderation | Very High | Partially (Video Streaming) |
| Ad System | High | Partially (Video Streaming) |
| Developer API Platform | Medium | Partially (B2B SaaS) |

**14 bespoke components**

---

### Ride-Sharing

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Geospatial Supply Tracking | High | Partially (Food Delivery) |
| Rider-Driver Matching Algorithm | Very High | Partially (Food Delivery) |
| ETA & Routing Engine | High | Partially (Food Delivery) |
| Dynamic Pricing (Surge) | Medium | Partially (Food Delivery) |
| Trip State Machine | High | Partially (Food Delivery) |
| Fare Calculation Engine | Medium | No |
| Real-Time Driver Map | Medium | Partially (Food Delivery) |
| Driver App & Navigation | High | No |
| Driver Onboarding & Compliance | Medium | Partially (Food Delivery) |
| Driver Earnings & Payouts | Medium | Partially (Food Delivery) |
| Rider & Driver Ratings | Low | Partially (Food Delivery) |
| Safety Features | Medium | No |
| Anti-Fraud / GPS Spoof Detection | High | No |

**13 bespoke components**

---

### E-Commerce

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Product Catalog & Taxonomy | High | No |
| Inventory Management | High | No |
| Shopping Cart & Checkout | High | No |
| Order Management System (OMS) | High | Partially (Food Delivery) |
| Tax Calculation Engine | Medium | No (buy Avalara) |
| Shipping & Carrier Integration | Medium | No (buy EasyPost) |
| Product Search & Discovery | Very High | No |
| Recommendation Engine | Very High | Partially (Video Streaming, Social Media) |
| Pricing & Promotions Engine | High | No |
| Seller / Merchant Onboarding | Medium | No |
| Returns & Refunds Workflow | Medium | No |
| Product Reviews & Ratings | Low | Partially (Food Delivery, Ride-Sharing) |
| Fulfillment-as-a-Service | Very High | No |

**13 bespoke components**

---

### B2B SaaS / CRM

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Multi-Tenancy Architecture | Very High | No (cross-cutting concern) |
| CRM Data Model | Medium | No |
| Custom Fields & Custom Objects | High | No |
| Pipeline & Deal Stage Management | Medium | No |
| Workflow Automation Engine | Very High | No |
| Email Integration & Activity Capture | High | No |
| Sequences & Sales Engagement | Medium | No |
| Reporting & Dashboards | High | No |
| Lead Scoring | Medium | No |
| Territory Management & Assignment | Medium | No |
| CPQ (Configure Price Quote) | High | No |
| Marketplace / App Ecosystem | Medium | Partially (Video Streaming, Social Media) |
| Sandbox & Testing Environments | Medium | No |

**13 bespoke components**

---

## Summary: Component Count by Vertical

| Vertical | Foundational | Bespoke | Total | % Foundational |
|---|:---:|:---:|:---:|:---:|
| Video Streaming | 18 | 12 | 30 | 60% |
| Food Delivery | 18 | 12 | 30 | 60% |
| Social Media | 18 | 14 | 32 | 56% |
| Ride-Sharing | 18 | 13 | 31 | 58% |
| E-Commerce | 18 | 13 | 31 | 58% |
| B2B SaaS / CRM | 18 | 13 | 31 | 58% |

> Note: Component count undercounts complexity. Bespoke components like "Video Transcoding Pipeline," "Fan-Out Service," or "Multi-Tenancy Architecture" can individually represent more engineering effort than all 18 foundational components combined.

---

## Cross-Vertical Reuse Opportunities

If a company is building multiple products, these bespoke components are candidates for shared platform investment:

| Component | Applicable Verticals |
|---|---|
| Recommendation Engine | Video Streaming, Social Media, E-Commerce |
| Content Moderation | Video Streaming, Social Media |
| Geospatial Matching (dispatch) | Food Delivery, Ride-Sharing |
| Order / Trip State Machine | Food Delivery, Ride-Sharing |
| ETA Prediction | Food Delivery, Ride-Sharing |
| Real-Time GPS Tracking | Food Delivery, Ride-Sharing |
| Dynamic Pricing (Surge) | Food Delivery, Ride-Sharing |
| Ad Serving & Targeting | Video Streaming, Social Media |
| Ratings & Reviews | Food Delivery, Ride-Sharing, E-Commerce |
| Developer API Platform | Social Media, B2B SaaS |
| Fraud Detection | Food Delivery, E-Commerce, Ride-Sharing |
| Loyalty / Promotions | Food Delivery, E-Commerce |
