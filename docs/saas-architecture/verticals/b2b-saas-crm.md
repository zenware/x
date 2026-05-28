# B2B SaaS / CRM Platform (Salesforce / HubSpot Model)

A B2B SaaS platform sells software to businesses (as tenants) rather than to individual consumers. The defining engineering challenge is **multi-tenancy**: serving many customers from shared infrastructure while ensuring strict data isolation, compliance, and customizability.

A CRM (Customer Relationship Management) is a canonical example: it manages contacts, accounts, deals, and activities for a company's sales and marketing teams.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Auth | SSO (SAML 2.0 / OIDC) per tenant, role-based permissions, API keys |
| Relational DB | Core CRM data (contacts, accounts, opportunities, activities) |
| NoSQL / Document Store | Flexible custom field values, user-defined configuration, audit logs |
| Caching | List views, dashboard aggregates, permission lookups |
| Message Queue | Workflow automation triggers, email send queues, data sync events |
| Payments & Billing | Subscription management (per-seat pricing, plan tiers, annual contracts) |
| Notifications | Workflow alerts, deal stage change emails, task reminders |
| Search | CRM record search (contact lookup by name, email, company) |
| CDN | Static web app assets |
| Observability | Tenant-level error rates, workflow failure monitoring, API latency by tenant |
| Analytics / Data Platform | Tenant usage metrics for product analytics, churn prediction |
| Feature Flags | Feature gating by plan tier and gradual tenant rollout |
| Audit Logging | Compliance requirement — every record change must be logged (who, what, when) |

**Foundational components: ~55% of total system components**

---

## Bespoke / Domain-Specific Components

### 1. Multi-Tenancy Architecture

The entire application must be built to serve multiple isolated tenants from shared infrastructure. Every query, every API call, and every background job must be scoped to a single tenant.

**Isolation models:**

| Model | Description | Trade-offs |
|---|---|---|
| **Silo** | Separate DB per tenant | Strong isolation; high ops overhead at scale |
| **Pool** | All tenants in shared DB with `tenant_id` column on every table | Efficient; requires strict row-level security |
| **Bridge / Hybrid** | Shared DB for most tenants; dedicated DB for large enterprise tenants | Balance of efficiency and compliance |

- Row-level security (RLS) in PostgreSQL or application-layer tenant scoping
- Tenant context propagation through every request (middleware injection)
- Cross-tenant data leakage prevention (critical security requirement)
- Tenant provisioning automation (new sign-up → schema migration or tenant record creation)

### 2. CRM Data Model

The canonical objects of a CRM. This model is deeply understood by users and must be correct.

- **Contact**: a person (name, email, phone, title, linked to an Account)
- **Account**: a company (name, industry, size, ARR, website)
- **Lead**: an unqualified prospect before conversion to Contact + Account
- **Opportunity / Deal**: a potential sale (amount, stage, close date, owner, linked Account + Contacts)
- **Activity**: any interaction — email, call, meeting, note — linked to any record
- **Task**: a to-do assigned to a user with due date and status

Relationships: Contacts belong to Accounts; Opportunities are linked to Accounts and Contacts; Activities are polymorphically linked.

### 3. Custom Fields & Custom Objects

Enterprise tenants need to extend the data model beyond what the platform provides natively.

- Tenant admins can add custom fields to any standard object (text, number, date, picklist, lookup)
- Custom picklist values per tenant
- Custom objects: entirely new record types defined by the tenant (e.g., "Support Ticket," "Partner")
- Field-level permissions (some fields visible only to certain roles)
- Storage: Entity-Attribute-Value (EAV) table, JSON column, or per-tenant schema extension

### 4. Pipeline & Deal Stage Management

The visual pipeline view is the core sales UX. Deals move through user-defined stages toward close.

- Stage configuration per pipeline (names, probability %, won/lost terminal states)
- Multiple pipelines per tenant (different products, different sales motions)
- Drag-and-drop board view (Kanban) + list view
- Stale deal alerting (deal has not moved in N days)
- Pipeline velocity metrics (average time per stage)
- Forecast rollup (sum of weighted deal values by stage)

### 5. Workflow Automation Engine

Automates repetitive CRM actions based on triggers and conditions. Equivalent to Salesforce Flow or HubSpot Workflows.

- Trigger types: record created, field value changed, time-based (X days after close date), webhook inbound
- Condition logic: if/else branching with field value comparisons
- Actions: send email, create task, update field, notify user, call webhook, create record, enroll in sequence
- Execution: async, tenant-isolated job queue
- Error handling and workflow execution logs per tenant

### 6. Email Integration & Activity Capture

Sales reps live in their email clients. CRM value is contingent on capturing email activity automatically.

- OAuth-based connection to Gmail / Outlook (Microsoft 365)
- BCC / forwarding-based email logging (every sent email logged to CRM)
- Email open and click tracking pixels
- Calendar sync: meetings logged as CRM activities
- Inbox sidebar browser extension (show CRM data alongside emails)
- Bi-directional sync of contacts and calendar events

### 7. Sequences & Sales Engagement

Automates multi-touch outreach cadences for sales reps.

- A sequence is a series of steps: email (day 1), call reminder (day 3), LinkedIn message (day 5)
- Enrollment of contacts into sequences (manual or automated)
- Email send personalization tokens ({{first_name}}, {{company}})
- Delivery time optimization (send at recipient's local 9am)
- Reply detection: automatically unenroll contact if they reply
- Step-level performance metrics (open rate, reply rate per email template)

### 8. Reporting & Dashboards

Self-serve analytics for sales and marketing teams within their tenant.

- Pre-built standard reports: deals won/lost, pipeline by stage, activity volume, quota attainment
- Custom report builder: choose object, dimensions, metrics, filters
- Scheduled report email delivery
- Real-time dashboard with configurable widgets
- Data export (CSV, Excel) for ad-hoc analysis

### 9. Lead Scoring

Automatically ranks leads by their likelihood to convert based on demographic and behavioral signals.

- Demographic scoring: company size, industry, title match ideal customer profile (ICP)
- Behavioral scoring: email opens, page visits, form submissions, demo requests
- Score decay (reduce score for inactive leads)
- Threshold-based routing (score > 80 → assign to AE; score 40–80 → nurture sequence)
- Admins configure score weights per tenant

### 10. Territory Management & Assignment Rules

For larger sales orgs, deals and leads must be automatically routed to the right rep.

- Territory definitions (by region, industry, account size, named accounts)
- Round-robin assignment within a territory
- Ownership change workflows (rep leaves → reassign their book)
- Conflict resolution (two reps claiming the same account)

### 11. Quote-to-Cash / CPQ (Configure Price Quote)

For companies selling complex products, CPQ generates customer-facing quotes from a product catalog.

- Product catalog with pricing rules
- Quote creation linked to an Opportunity
- Discount approval workflows (rep requests discount → manager approves)
- Quote PDF generation and e-signature integration (DocuSign, HelloSign)
- Quote-to-order conversion (triggers downstream billing system)

### 12. Marketplace / App Ecosystem

Enterprise buyers expect integrations with their existing tools.

- OAuth app registration for third-party integrations
- Webhook outbound events (record created/updated/deleted)
- Developer API (REST and/or GraphQL) with per-tenant scoping
- In-app marketplace listing for community integrations
- Native integrations: Slack, Zapier, Zoom, LinkedIn Sales Navigator

### 13. Sandbox & Testing Environments

Enterprise customers need a safe environment to test configurations before applying to production.

- Full tenant data copy to sandbox (scrubbed of PII)
- Configuration changes tested in sandbox before pushing to production
- Sandbox refresh on a schedule or on-demand

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Multi-Tenancy Architecture | Build (foundational architectural decision) |
| CRM Data Model | Build |
| Custom Fields / Objects | Build (EAV or JSON storage extension) |
| Pipeline Management | Build |
| Workflow Automation Engine | Build (or buy low-code engine: Temporal, AWS Step Functions as substrate) |
| Email Integration | Build OAuth sync; buy email infrastructure (SendGrid) |
| Sequences / Sales Engagement | Build |
| Reporting & Dashboards | Build; or embed BI tool (Metabase, Looker) |
| Lead Scoring | Build ML model |
| Territory Management | Build |
| CPQ | Build; or buy (Salesforce CPQ, DealHub, Conga) |
| Marketplace / App Ecosystem | Build developer portal and webhook infra; buy OAuth tooling |
| Sandbox Environments | Build on top of existing DB/IaC tooling |
