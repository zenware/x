# Social Media / Microblogging Platform (Twitter/X Model)

A public real-time social network where users post short-form content, follow each other, and participate in public conversations. Think Twitter/X, Mastodon, Bluesky, or Threads.

The defining engineering challenges are: **fan-out at scale** (one celebrity post reaching millions of feeds), **real-time delivery**, and **content moderation** at volume.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Auth | User accounts, OAuth for third-party apps, API keys for developers |
| Relational DB | Users, follows, posts (tweets), likes, DMs (small installations) |
| NoSQL / Document Store | Large-scale post storage (wide-column: Cassandra/HBase), DM threads |
| Caching | Timeline caches (pre-computed feeds), trending topics |
| CDN | Media attachments (images, GIFs, short videos), static assets |
| Object Storage | Images, video, and audio uploaded by users |
| Message Queue | Fan-out pipeline, notification delivery, analytics event ingestion |
| Search | Full-text search over posts, hashtags, users |
| Notifications | Mention alerts, like/retweet notifications, follower notifications |
| Rate Limiting | Per-user and per-IP API rate limits — critical for abuse prevention |
| Analytics / Data Platform | Trending analytics, ad targeting, engagement metrics |
| Payments & Billing | Subscriptions (Twitter Blue / X Premium), Super Follows |

**Foundational components: ~40% of total system components**

---

## Bespoke / Domain-Specific Components

### 1. Fan-Out Service (Timeline Delivery)

This is the hardest infrastructure problem unique to social networks. When a user posts, their followers' home timelines must be updated. At celebrity scale (millions of followers), this is a distributed systems challenge.

**Two strategies (often combined):**

- **Fan-out on write (push model):** When a post is created, immediately write it to each follower's timeline cache. Fast reads, but celebrities posting to millions of followers create massive write amplification.
- **Fan-out on read (pull model):** Each user's timeline is computed at read time by merging the post feeds of everyone they follow. Cheaper for infrequent posters, expensive at read time for users following many accounts.

**Hybrid approach:** High-follower accounts use pull; normal accounts use push. The timeline service merges both at read time.

### 2. Social Graph Service

Manages the directed follow graph: who follows whom, blocking, muting.

- Follow/unfollow operations (writes to graph store)
- Follower/following list retrieval with pagination
- Block and mute lists (filter applied at timeline read time)
- Mutual follow detection (for DMs, promoted features)
- Graph traversal for "people you may know" recommendations
- Storage: typically a graph DB (Neo4j) or denormalized in wide-column store

### 3. Post / Tweet Storage & Retrieval

Posts are the core data object. At scale, storing and retrieving billions of posts requires careful design.

- Post schema: text content, author, timestamp, media attachments, reply-to reference, repost reference
- Snowflake-style sortable unique IDs (time-ordered, globally unique, no DB round-trip for ID generation)
- Wide-column storage for efficient time-range scans per author (Cassandra, HBase)
- Soft-delete (tombstoning) rather than hard delete — important for reply thread integrity
- Edit history tracking (if edits are supported)

### 4. Timeline & Feed Ranking

Raw chronological timelines work at small scale. At scale, a ranked feed improves engagement but adds algorithmic complexity.

- Reverse-chronological as baseline
- Engagement score weighting (likes, reposts, replies, time-decay)
- Personalized re-ranking using user interest signals
- "In case you missed it" injection (popular posts from follows during absence)
- Separate ranked and chronological feed options

### 5. Hashtag & Trend Detection

Identifying what topics are surging in near real-time.

- Streaming count aggregation over sliding time windows (e.g., last 5 minutes vs. last 24h)
- Trend velocity calculation (not just total count, but rate of growth)
- Geo-scoped trending (what's trending in Tokyo vs. globally)
- Spam/manipulation filtering (bots inflating a hashtag)
- Trending display pipeline (server-side refresh every ~30 seconds)

### 6. Real-Time Streaming API (Firehose)

Developers and data partners consume a stream of public posts in real time.

- Filtered stream: subscribe to posts matching keywords, hashtags, languages, or user IDs
- Full firehose: 100% of public posts (licensed, high-volume)
- Backfill and replay for short windows
- WebSocket or Server-Sent Events delivery
- Per-connection rate limiting and rule management API

### 7. @Mention, Reply, and Thread Modeling

Conversations on microblogging platforms form trees of replies.

- Reply-to reference stored on every post
- Thread stitching: reconstruct the full conversation tree from reply chain
- `@mention` extraction: parse usernames from text, link to user profiles, trigger notifications
- Quote-post (embed another post in a new one) as distinct type from reply
- Thread visibility rules (who can reply? — author-controlled filtering)

### 8. Repost / Retweet Mechanics

Redistribution of another user's content with optional commentary.

- Simple repost: surface original post in reposter's followers' timelines
- Quote-post: new post embedding the original
- Undo repost
- Repost count tracking (aggregated, not per-user for performance)
- Downstream fan-out re-triggering for reposted content

### 9. Direct Messages (DMs)

Private 1:1 and group messaging.

- Inbox and thread storage (separate from public posts)
- End-to-end encryption option (Signal Protocol or similar)
- Read receipts
- Media sharing in DMs
- Request inbox for DMs from non-followers
- Spam filtering on incoming DM requests

### 10. Recommendation Engine

Surfaces new accounts to follow and posts to engage with.

- "Who to Follow" — graph-proximity (friends of friends), topical similarity
- "Explore / Discover" tab — trending posts outside your follow graph
- Interest modeling from engagement history
- Collaborative filtering (similar users follow similar accounts)
- Diversity injection to avoid narrow filter bubbles

### 11. Search & Hashtag Indexing

Full-text search over a live stream of posts is a hard real-time indexing problem.

- Near-real-time indexing (posts searchable within seconds of posting)
- Operator search: `from:username`, `since:date`, `filter:media`, `lang:en`
- Relevance ranking: engagement signals + recency
- Autocomplete for hashtags and usernames
- Historical search depth (full archive vs. recent-only)

### 12. Content Moderation & Trust and Safety

At microblogging scale, volume of harmful content is enormous. A layered approach is required.

- Automated classifiers: spam, hate speech, CSAM, coordinated inauthentic behavior
- Known-bad hash matching (PhotoDNA for CSAM — mandatory)
- Sensitive content labeling (NSFW, violence — shown behind interstitial)
- Verified account and impersonation detection
- Human review queue for appeals and complex cases
- Account suspension, shadowban, and visibility restriction tiers
- Coordinated manipulation detection (bot networks, astroturfing)

### 13. Ad System

The primary revenue source for ad-supported social platforms.

- Promoted posts injected into timelines based on targeting rules
- Audience targeting: interests, demographics, lookalike audiences, retargeting
- Auction-based ad serving (second-price auction)
- Frequency capping and brand safety filters
- Advertiser campaign management UI
- Conversion tracking and reporting

### 14. Developer API Platform

Third-party apps and researchers access the platform via API.

- Public API with OAuth app registration
- Rate limiting tiers (free, basic, premium developer plans)
- Webhook support for real-time events (new post, new follower)
- API changelog and versioning
- Developer portal documentation

---

## Architecture Summary

```
Post Write Path:
[Client] → [Write API] → [Post Store (Cassandra)]
                              │
                              ▼
                        [Fan-Out Service]
                         /            \
              [Timeline Cache]    [Notification Service]
              (Redis per-user)

Post Read Path (Timeline):
[Client] → [Timeline API] → [Timeline Cache (Redis)]
                              │ (miss or partial)
                              ▼
                       [Social Graph Service]
                              │
                              ▼
                [Pull from Post Store + Merge + Rank]
```

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Fan-Out Service | Build (core infrastructure challenge) |
| Social Graph Service | Build (graph DB + custom traversal) |
| Post Storage | Build (custom wide-column schema) |
| Timeline Ranking | Build (ML model) |
| Trend Detection | Build (stream processing on Flink/Spark Streaming) |
| Real-Time Streaming API | Build |
| Thread Modeling | Build |
| Repost Mechanics | Build |
| DMs | Build; optionally buy E2E encryption library (Signal Protocol) |
| Recommendation Engine | Build (core IP) |
| Search / Hashtag Index | Build on Elasticsearch / Lucene |
| Content Moderation | Hybrid — buy classifiers, build workflow |
| Ad System | Build or buy DSP integration (Google Ad Manager) |
| Developer API Platform | Build; buy API gateway and dev portal tooling |
