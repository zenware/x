# Short-Form Social & Creator Platforms (TikTok / Reels / Snapchat Model)

Short-form social products combine **media-heavy creation**, **high-throughput discovery**, and **recommendation-driven retention**. The core loop is usually capture -> publish -> distribution -> engagement -> creator feedback.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| App Shell & Navigation | Feed, inbox, profile, creation, notifications, shop/revenue tabs |
| State Management & Data Layer | Feed caching, optimistic engagement, session continuity |
| Local Storage & Cache | Video prefetch, drafts, offline profile/media cache |
| Networking & Retry | Feed requests, media upload, interaction events |
| Identity & Auth | Account creation, creator identity, session management |
| Push Notifications | Engagement and creator return loops |
| Media Capture / Upload / Playback | Camera, filters, player, compression, upload |
| Analytics & Experimentation | Retention, watch time, creator conversion |
| Remote Config & Flags | Experiment with ranking and creation tools |
| Crash / Perf Diagnostics | Video startup, buffering, camera stability |
| Payments / Subscriptions | Gifts, creator revenue, subscriptions where applicable |
| Deep Linking / Share | Shared video entry, creator profile growth loops |
| Accessibility / Localization | Captions, localized UI, audio/text accessibility |
| Security / Privacy | Account trust, content safety, privacy settings |
| Release / Store Ops / Support | App-store policy, creator support, abuse appeals |

**Foundational components support the client shell, but the recommendation and media systems dominate the product value.**

---

## Bespoke / Domain-Specific Components

### 1. Feed Ranking & Recommendation
- Candidate generation
- Ranking by watch time, engagement, freshness, creator signals
- Feedback loops for cold start and exploration

### 2. Video Ingest / Transcode / Delivery
- Upload processing
- Multi-bitrate packaging
- Thumbnail, caption, and metadata generation

### 3. Creator Graph & Engagement Model
- Following relationships
- Creator reputation and quality signals
- Audience segmentation

### 4. Creation Tools
- Recording flows
- Filters, effects, stickers, text overlays
- Draft save and edit workflows

### 5. Moderation & Trust / Safety
- Content policy enforcement
- Detection queues and appeal flows
- Age and region restrictions

### 6. Ads & Monetization Surfaces
- Sponsored placement logic
- Creator revenue sharing
- Commerce or affiliate hooks

### 7. Social Mechanics
- Comments, likes, shares, saves
- Duets/remix/repost behaviors
- Social graph and viral loops

### 8. Notification Ranking
- High-value engagement prioritization
- Creator-specific notifications
- Frequency control

### 9. Discovery & Trend Detection
- Hashtags, topics, sounds, trends
- Search/discovery pages
- Local versus global trend handling

### 10. Creator Analytics
- Watch-through, follower conversion, revenue metrics
- Content performance dashboards
- Audience insights

### 11. Live / Real-Time Extensions
- Live rooms
- Live moderation
- Gifts or real-time audience interaction

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Feed Ranking | Build |
| Video Ingest / Delivery Hooks | Build on commodity media infrastructure |
| Creator Graph | Build |
| Creation Tools | Build |
| Moderation / Safety | Hybrid |
| Ads / Monetization | Hybrid |
| Social Mechanics | Build |
| Notification Ranking | Build |
| Discovery / Trends | Build |
| Creator Analytics | Build on analytics platform primitives |
| Live Extensions | Hybrid |
