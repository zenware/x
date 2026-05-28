# E-Commerce Platform (Amazon / Shopify Model)

An e-commerce platform allows sellers to list products and buyers to discover, purchase, and receive them. This spans two major archetypes:

- **First-party retail** (Amazon retail): the platform buys and sells inventory directly
- **Marketplace** (Amazon Marketplace, Shopify): the platform enables third-party sellers

Both share most infrastructure; the marketplace adds seller-facing tooling and requires careful trust, payout, and dispute mechanics.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Auth | Buyer accounts, seller accounts, admin roles |
| Relational DB | Orders, inventory, users, sellers, payments, addresses |
| NoSQL / Document Store | Product catalog (flexible attributes per category), seller configs |
| Caching | Product pages, category listings, pricing, session carts |
| CDN | Product images, static assets |
| Object Storage | Product images, seller documents, invoices |
| Message Queue | Order events, inventory update triggers, notification delivery |
| Search | Product discovery — the most traffic-intensive read path |
| Payments | Buyer checkout, seller payouts, refunds |
| Notifications | Order confirmations, shipping updates, delivery confirmation |
| Analytics / Data Platform | Sales analytics, seller dashboards, ad performance, A/B test analysis |
| Feature Flags | A/B testing checkout flows, product page experiments |
| Observability | Cart abandonment alerts, payment failure rate monitoring, inventory sync lag |

**Foundational components: ~50% of total system components**

---

## Bespoke / Domain-Specific Components

### 1. Product Catalog & Taxonomy

The data model for products is the most domain-specific schema in e-commerce. Products vary enormously in their attributes (a t-shirt has sizes and colors; a laptop has CPU, RAM, storage).

- Product entity: title, description, images, brand, category, attributes
- Variant model: each SKU is a combination of attribute values (size: M, color: blue)
- Category taxonomy (hierarchical: Electronics > Computers > Laptops)
- Custom attribute schemas per category ("fit type" for apparel; "wattage" for electronics)
- Bulk catalog import/export (CSV, Shopify product CSV, XLSX)
- Multi-language and multi-currency product data

### 2. Inventory Management

Tracks stock levels across locations to prevent overselling and optimize fulfillment.

- SKU-level stock quantity tracking
- Multi-warehouse / multi-location inventory allocation
- Stock reservation at checkout (hold for N minutes while payment processes)
- Low-stock threshold alerts
- Restock and purchase order management
- Backorder and pre-order handling
- Integration with physical WMS (warehouse management systems: SAP, Manhattan)

### 3. Shopping Cart & Checkout

The checkout funnel is the highest-value user flow. Conversion rate is directly tied to revenue.

- Persistent cart (survive session, sync across devices)
- Guest checkout (no account required)
- Address book and shipping address entry
- Shipping method selection (speeds, carriers, prices)
- Promo code / discount application
- Order summary with tax and shipping preview
- Payment step (card, PayPal, Apple Pay, buy-now-pay-later)
- Order confirmation and receipt

### 4. Order Management System (OMS)

Manages the lifecycle of an order from placement to delivery (or return).

```
PLACED → PAYMENT_CONFIRMED → ALLOCATED_TO_WAREHOUSE
    → PICKING → PACKED → SHIPPED → DELIVERED
    ↕
CANCELLED / RETURNED / REFUNDED
```

- Order splitting across multiple sellers or warehouses
- Backorder handling when stock is insufficient
- Order editing window (cancel/modify before shipment)
- Seller notification of new orders
- Customer service order lookup and action tools

### 5. Tax Calculation Engine

Tax rules vary by jurisdiction (US state, EU VAT, Canadian GST/HST). Correct tax calculation is a legal compliance requirement.

- Product taxability classification (some goods are exempt)
- Jurisdiction detection by shipping address
- Rate lookup at checkout (real-time API call)
- Tax-inclusive vs. tax-exclusive pricing by region
- Tax filing report exports

**Typically bought:** Avalara TaxJar, Vertex. These are complex regulatory systems.

### 6. Shipping & Carrier Integration

Connects to shipping carriers to calculate rates, purchase labels, and track packages.

- Rate shopping across carriers (UPS, FedEx, USPS, DHL, regional carriers)
- Label generation and purchase
- Tracking number issuance and status polling
- Carrier webhook or polling for delivery status updates
- Return label generation
- Fulfillment center integration for merchant-fulfilled orders

### 7. Product Search & Discovery

Search is the primary product discovery mechanism. E-commerce search is distinct from general full-text search due to faceted filtering and ranking by commercial signals.

- Full-text search with typo tolerance
- Faceted filtering: price range, brand, rating, category, attributes (color, size)
- Relevance ranking: title match + popularity + margin + sponsored boost
- Auto-complete and search suggestions
- "Did you mean?" spell correction
- Zero-results handling (suggest similar categories)
- Personalized re-ranking by past purchase history

### 8. Recommendation Engine

"Customers also bought" and "You may also like" modules drive a significant share of revenue.

- Item-to-item collaborative filtering (frequently bought together)
- User-to-item personalization (based on browse and purchase history)
- Browsing history-based recommendations
- Cross-sell and upsell modules (product page, cart, post-purchase)
- "Buy the look" / bundle recommendations

### 9. Pricing & Promotions Engine

Prices change frequently, and promotions must be applied correctly without abuse.

- Base price per SKU per currency
- Tiered pricing (volume discounts for business buyers)
- Sale price with display of original (strikethrough pricing)
- Promo codes: percentage off, fixed amount off, free shipping, BOGO
- Automatic promotions (no code needed — e.g., "spend $50 get 10% off")
- Coupon stacking rules and exclusions
- Flash sales and limited-time offers with countdowns
- Dynamic repricing (for competitive price matching)

### 10. Seller / Merchant Onboarding (Marketplace)

For marketplace models, sellers need a self-service portal to list products, manage inventory, and receive payments.

- Seller identity verification (KYC — bank account, tax ID, business registration)
- Product listing creation and bulk upload
- Seller shipping configuration (handling time, supported regions)
- Seller performance metrics (defect rate, late shipment rate)
- Seller suspension and appeal workflow
- Seller fee structure and payout schedule

### 11. Returns & Refunds Workflow

Returns are a major operational and customer satisfaction concern.

- Return merchandise authorization (RMA) request
- Return eligibility rules (window, condition, reason codes)
- Return label generation (prepaid or buyer-paid)
- Warehouse return receipt and inspection
- Refund calculation (full, partial, restocking fee)
- Seller chargeback for marketplace returns

### 12. Product Reviews & Ratings

Reviews drive purchase decisions and feed into search ranking.

- Verified purchase enforcement (only buyers who received the product can review)
- Star rating aggregation
- Review moderation (spam, fake reviews, prohibited content)
- Seller response to reviews
- Helpfulness voting ("Was this review helpful?")
- Incentivized review detection and suppression

### 13. Fulfillment-as-a-Service (FBA Model)

For platforms that offer warehouse and fulfillment services to sellers (Amazon FBA, Shopify Fulfillment Network).

- Inbound shipment creation (seller sends bulk inventory to platform warehouse)
- Warehouse location assignment and slotting
- Pick/pack/ship orchestration
- Multi-warehouse routing to minimize delivery time
- Inventory forecasting and restock alerts to sellers
- Returns handling and re-shelving

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Product Catalog & Taxonomy | Build |
| Inventory Management | Build; integrate with WMS (SAP, Manhattan) |
| Shopping Cart & Checkout | Build (high business-logic surface area) |
| Order Management System | Build (or buy OMS: Salesforce Commerce Cloud, Fabric) |
| Tax Calculation | Buy (Avalara, TaxJar) |
| Shipping & Carrier Integration | Buy (EasyPost, ShipStation, Shippo) |
| Product Search & Discovery | Build on Elasticsearch; or buy (Algolia, Constructor.io) |
| Recommendation Engine | Build (ML model) |
| Pricing & Promotions | Build |
| Seller Onboarding (KYC) | Hybrid — build workflow, buy identity verification (Stripe Identity, Persona) |
| Returns & Refunds | Build |
| Product Reviews | Build |
| Fulfillment-as-a-Service | Build (capital-intensive; FBA is Amazon's strategic infrastructure) |
