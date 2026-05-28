# Foundational Infrastructure

These are the building blocks that virtually every SaaS product needs. They are domain-agnostic — the same components appear whether you are building a social network, a food delivery app, or a B2B CRM.

Most of these should be **bought or adopted** before building bespoke features. Reinventing them early is one of the most common ways early-stage engineering organizations waste capacity.

---

## 1. Identity & Access Management

**What it does:** Handles who users are (authentication) and what they are allowed to do (authorization).

**Components:**
- User registration, login, and session management
- Password hashing (bcrypt / Argon2) and reset flows
- OAuth 2.0 / OpenID Connect (social login, third-party integrations)
- Multi-factor authentication (TOTP, SMS, passkeys)
- Role-based access control (RBAC) or attribute-based access control (ABAC)
- Single Sign-On (SSO) — especially for B2B products (SAML 2.0, OIDC)
- API key management for machine-to-machine auth
- Session storage and token lifecycle (JWTs, refresh tokens, revocation)

**Common solutions:** Auth0, Clerk, AWS Cognito, Keycloak (self-hosted), custom implementation on top of Postgres

---

## 2. API Gateway & Load Balancing

**What it does:** Routes external traffic to the right internal services, enforces edge policies, and distributes load.

**Components:**
- Reverse proxy / load balancer (round-robin, least-connections, sticky sessions)
- TLS termination and certificate management
- Request routing (path-based, header-based, canary routing)
- Rate limiting and throttling at the edge
- Request/response transformation
- API versioning enforcement
- DDoS mitigation

**Common solutions:** AWS API Gateway, Kong, Nginx, Envoy, Cloudflare Workers, Traefik

---

## 3. Service Mesh & Internal Networking

**What it does:** Manages service-to-service communication in microservice architectures.

**Components:**
- Service discovery and registry
- Internal load balancing
- Mutual TLS (mTLS) between services
- Circuit breakers and retries
- Distributed tracing propagation (trace ID injection)

**Common solutions:** Istio, Linkerd, AWS App Mesh, Consul

---

## 4. Relational Database

**What it does:** The source of truth for structured, transactional data — user accounts, orders, billing records, etc.

**Components:**
- Primary/replica replication
- Connection pooling (PgBouncer, RDS Proxy)
- Automated backups and point-in-time recovery
- Schema migration tooling (Flyway, Liquibase, Alembic)
- Read replicas for analytics offload

**Common solutions:** PostgreSQL, MySQL, AWS Aurora, Cloud Spanner (global), CockroachDB (distributed)

---

## 5. NoSQL / Document Store

**What it does:** Flexible schema storage for data that doesn't fit neatly into relational tables — user preferences, activity feeds, product catalogs, configuration documents.

**Components:**
- Document store (JSON/BSON documents)
- Wide-column store (for time-series or sparse data)
- TTL / automatic expiry

**Common solutions:** MongoDB, DynamoDB, Cassandra, Firestore

---

## 6. Caching Layer

**What it does:** Reduces database load and latency by serving frequently accessed data from memory.

**Components:**
- Key-value cache (objects, sessions, API responses)
- Cache invalidation strategies (TTL, event-driven purge)
- Distributed cache for multi-instance deployments
- Rate limiting counters
- Pub/sub messaging (lightweight)

**Common solutions:** Redis, Memcached, AWS ElastiCache, Dragonfly

---

## 7. Message Queue & Event Streaming

**What it does:** Decouples producers and consumers, enables async processing, and provides a backbone for event-driven architectures.

**Components:**
- Point-to-point task queues (email sends, image resizing, webhook delivery)
- Pub/sub topics for fan-out events
- Dead letter queues for failed message handling
- Consumer group / competing consumer patterns
- Event log / stream replay for reprocessing

**Common solutions:** Apache Kafka, AWS SQS/SNS, RabbitMQ, Google Pub/Sub, NATS

---

## 8. Object / Blob Storage

**What it does:** Stores unstructured binary data — images, videos, documents, backups.

**Components:**
- Durable, scalable file storage
- Presigned URLs for secure direct uploads/downloads
- Lifecycle policies (automatic archival to cold storage)
- Versioning and object locking

**Common solutions:** AWS S3, Google Cloud Storage, Azure Blob, Cloudflare R2, MinIO (self-hosted)

---

## 9. Content Delivery Network (CDN)

**What it does:** Caches static and media assets at edge nodes close to end users, reducing latency and origin load.

**Components:**
- Static asset delivery (JS, CSS, images)
- Media streaming edge caching
- Edge SSL termination
- Cache purge APIs
- Image optimization and resizing at the edge

**Common solutions:** Cloudflare, AWS CloudFront, Fastly, Akamai

---

## 10. Search

**What it does:** Powers full-text and faceted search across large datasets.

**Components:**
- Inverted index for full-text search
- Faceted filtering (by category, price range, date, etc.)
- Typo tolerance and fuzzy matching
- Auto-complete / search-as-you-type
- Relevance tuning and boosting

**Common solutions:** Elasticsearch, OpenSearch, Typesense, Meilisearch, Algolia (managed)

---

## 11. Notification & Messaging Infrastructure

**What it does:** Delivers notifications to users via multiple channels.

**Components:**
- Transactional email (account verification, receipts, alerts)
- Push notifications (iOS APNs, Android FCM)
- SMS delivery
- In-app / real-time notifications (WebSocket or SSE)
- Notification preference management (opt-out, channels)
- Delivery tracking and bounce handling

**Common solutions:** SendGrid / Postmark (email), Twilio (SMS), Firebase (push), AWS SNS

---

## 12. Payments & Billing

**What it does:** Handles money movement, subscription lifecycle, and revenue operations.

**Components:**
- Payment method collection (card, bank, wallets)
- Subscription management (plans, upgrades, downgrades, cancellations)
- Invoicing and receipts
- Tax calculation and remittance
- Refunds and disputes
- Payout to third parties (marketplaces)
- Revenue reporting and reconciliation

**Common solutions:** Stripe, Braintree, Recurly (subscriptions), Avalara (tax)

---

## 13. Observability Stack

**What it does:** Gives engineers visibility into system health, performance, and errors.

**Components:**
- Structured logging with centralized aggregation
- Metrics collection and time-series storage
- Distributed tracing (trace → span → service map)
- Alerting and on-call routing
- Uptime / synthetic monitoring
- Error tracking with stack traces and context

**Common solutions:** Datadog, Grafana + Prometheus, OpenTelemetry, Sentry (errors), PagerDuty (alerting)

---

## 14. CI/CD & Developer Platform

**What it does:** Automates the path from code commit to production deployment.

**Components:**
- Source control and code review (PR workflow)
- Automated test runners (unit, integration, e2e)
- Build pipelines (Docker image build, artifact registry)
- Deployment orchestration (rolling, blue/green, canary)
- Environment management (dev, staging, production)
- Rollback capability

**Common solutions:** GitHub Actions, GitLab CI, ArgoCD, Spinnaker, Buildkite

---

## 15. Infrastructure as Code & Secret Management

**What it does:** Manages cloud resources declaratively and keeps credentials out of source code.

**Components:**
- IaC definitions for all cloud resources
- Drift detection and state management
- Secret storage with rotation
- Environment variable injection at runtime
- Least-privilege IAM policy management

**Common solutions:** Terraform, Pulumi, AWS CDK; HashiCorp Vault, AWS Secrets Manager, 1Password Secrets

---

## 16. Feature Flags

**What it does:** Decouples code deployment from feature releases; enables A/B testing and gradual rollouts.

**Components:**
- Boolean and multi-variant flags
- Targeting rules (by user, segment, percentage)
- Kill switches for instant rollback
- Experimentation metrics integration

**Common solutions:** LaunchDarkly, Unleash (self-hosted), Statsig, PostHog

---

## 17. Analytics & Data Platform

**What it does:** Captures user behavior and business events for product analytics, reporting, and data science.

**Components:**
- Event ingestion pipeline (clickstream, server-side events)
- Data warehouse for historical querying
- ETL/ELT pipelines
- BI dashboards and self-serve reporting
- Data quality and schema governance

**Common solutions:** Segment (ingestion), Snowflake / BigQuery / Redshift (warehouse), dbt (transforms), Looker / Metabase (BI)

---

## 18. Audit Logging & Compliance

**What it does:** Produces tamper-evident records of who did what and when, required for SOC 2, HIPAA, GDPR, and similar.

**Components:**
- Immutable event log of user and admin actions
- Data retention and deletion (right-to-erasure workflows)
- PII handling and data classification
- Access review and export tooling

---

## Summary

| # | Component | Typical Approach |
|---|---|---|
| 1 | Identity & Access Management | Buy (Auth0, Clerk, Cognito) or custom |
| 2 | API Gateway & Load Balancing | Buy (AWS, Cloudflare, Kong) |
| 3 | Service Mesh | Buy (Istio, Linkerd) — skip until microservices scale |
| 4 | Relational Database | Buy managed (RDS, Aurora, Neon) |
| 5 | NoSQL / Document Store | Buy managed (DynamoDB, Mongo Atlas) |
| 6 | Caching Layer | Buy managed (ElastiCache, Upstash) |
| 7 | Message Queue / Event Streaming | Buy managed (SQS, Kafka on Confluent) |
| 8 | Object Storage | Buy (S3, R2) |
| 9 | CDN | Buy (Cloudflare, CloudFront) |
| 10 | Search | Buy managed (Algolia, Typesense Cloud) |
| 11 | Notifications | Buy (SendGrid, Twilio, FCM) |
| 12 | Payments & Billing | Buy (Stripe) |
| 13 | Observability | Buy (Datadog) or assemble OSS stack |
| 14 | CI/CD | Buy (GitHub Actions) |
| 15 | IaC & Secret Management | Buy (Terraform + Vault/Secrets Manager) |
| 16 | Feature Flags | Buy (LaunchDarkly, Unleash) |
| 17 | Analytics / Data Platform | Buy or assemble (Segment + BigQuery + dbt) |
| 18 | Audit Logging & Compliance | Build on top of existing logging infra |
