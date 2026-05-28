# Video Streaming Platform (YouTube Model)

A user-generated video platform allows creators to upload, transcode, and publish video content at scale while serving that content to a global audience of viewers. Think YouTube, Vimeo, Twitch VOD, or TikTok.

---

## Foundational Infrastructure Used

All 18 components from [Foundational Infrastructure](../foundational-infrastructure.md) apply. Key callouts:

| Component | Usage |
|---|---|
| Object Storage | Raw uploaded video and all transcoded renditions |
| CDN | Serving video segments to viewers globally — the single highest-traffic component |
| Message Queue | Triggering transcoding jobs after upload, async pipeline stages |
| Relational DB | User accounts, channel metadata, video metadata, subscriptions |
| NoSQL / Document Store | Comments, video tags, creator configuration |
| Caching | Video metadata, view counts, homepage recommendations |
| Search | Video search by title, tags, transcript, channel name |
| Payments & Billing | Creator monetization payouts, channel memberships, Super Chats |
| Notifications | New video alerts, comment replies, live stream starts |
| Analytics / Data Platform | View counts, watch time, creator analytics dashboard |

**Foundational components: ~45% of total system components**

---

## Bespoke / Domain-Specific Components

These are unique to the video streaming vertical and must be custom-built or heavily customized.

### 1. Video Ingestion Pipeline

Accepts raw uploads from creators across formats (MP4, MOV, AVI, WebM, etc.). Handles large multipart uploads, resumable upload sessions, and upload progress tracking. Validates container/codec before queuing for transcoding.

- Resumable upload protocol (e.g., Google's TUS or custom chunked upload)
- Format validation and malware scanning
- Raw video quarantine storage before processing

### 2. Video Transcoding Pipeline

Converts raw video into multiple resolutions and formats for adaptive bitrate delivery. This is computationally intensive and requires a distributed fleet of workers.

- Multiple output renditions: 144p, 240p, 360p, 480p, 720p, 1080p, 4K
- Codec encoding: H.264, H.265/HEVC, AV1 for bandwidth efficiency
- Audio normalization and multi-track handling
- Thumbnail extraction at multiple timestamps
- Waveform generation for audio content
- Distributed job queue (workers scale horizontally per-job)

**Tooling:** FFmpeg is the universal engine; orchestration is custom. AWS Elemental MediaConvert or GCP Transcoder API for managed options.

### 3. Adaptive Bitrate Streaming (ABR)

Packages transcoded video into streaming formats that allow clients to dynamically switch quality based on available bandwidth.

- HLS (HTTP Live Streaming) packaging — `.m3u8` manifests + `.ts` segments
- MPEG-DASH packaging — `.mpd` manifests + `.mp4` segments
- Segment duration optimization (2–6 second chunks)
- Low-latency HLS for near-real-time content

### 4. Live Streaming Ingest & Delivery

Separate pipeline for live broadcasts. Creators push via RTMP; the platform packages and re-delivers at scale.

- RTMP/SRT ingest servers
- Real-time transcoding to multiple bitrates
- Low-latency HLS/DASH packaging for live
- DVR buffer (rewind during live stream)
- Stream key management and creator authentication
- Automatic recording and VOD archival after stream ends

### 5. Digital Rights Management (DRM) & Content Protection

Encrypts content so only authorized clients can play it. Required for premium or licensed content.

- Widevine (Android, Chrome, smart TVs)
- FairPlay (Apple devices)
- PlayReady (Windows, Xbox)
- Key Management System (KMS) integration
- Token-based URL signing to prevent hotlinking

### 6. Copyright & Content ID System

Detects when uploaded content contains copyrighted material (music, video clips).

- Audio fingerprinting (e.g., Chromaprint, AcoustID)
- Video fingerprinting (perceptual hash comparison against reference DB)
- Reference content ingestion API for rights holders
- Match claim workflow (block, monetize, or track)
- Creator dispute and appeal workflow

### 7. Video Recommendation Engine

Drives the "up next" queue, homepage feed, and "suggested videos" sidebar. This is often cited as the product's primary engagement driver.

- Watch history embeddings
- Collaborative filtering (users who watched X also watched Y)
- Content-based features (topic, duration, channel, language)
- Session-aware ranking (don't repeat recently watched)
- Diversity injection (avoid rabbit-hole filter bubbles)
- A/B testing integration for model evaluation

### 8. Creator Studio & Analytics

Dashboard for creators to manage their channel, view performance, and understand audience behavior.

- Video manager (upload, edit metadata, schedule publish)
- Per-video analytics: views, watch time, average view duration, audience retention curve
- Revenue reports (ad revenue, memberships, Super Chats)
- Audience demographics and traffic sources
- Comment moderation tools

### 9. Ad Serving & Targeting

Video advertising is the primary revenue model. Requires a full ad stack or integration with a DSP/SSP.

- Pre-roll, mid-roll, post-roll ad insertion (server-side or client-side)
- Ad targeting by content category, viewer demographics, watch history
- VAST/VPAID standard compliance
- Frequency capping per viewer
- Brand safety controls (demonetization flagging)
- Revenue share calculation for creators

### 10. Automated Caption & Subtitle Generation

Generates captions for accessibility and improves search indexability.

- Automatic speech recognition (ASR) — typically an ML model (Whisper, Google STT)
- VTT/SRT subtitle file generation and storage
- Multi-language machine translation of captions
- Manual caption upload and timing editor for creators

### 11. Content Moderation

Enforces community guidelines at upload time and post-publication.

- Automated scanning for known CSAM (PhotoDNA hash matching — mandatory)
- NSFW classifier (adult content, violence, graphic imagery)
- Hate speech and spam text classifier on titles/descriptions/comments
- Human review queue for borderline cases
- Creator strike system and account suspension workflow
- Appeals process

### 12. Video Player (Web & Mobile SDKs)

The client-side component that handles HLS/DASH playback, quality selection, and buffering UX.

- Adaptive quality switching logic (bandwidth estimation)
- Offline download support (mobile apps)
- Picture-in-picture and background audio
- Chapters, timestamps, and interactive cards
- Accessibility controls (captions, audio description)
- Web: custom HTML5 player or hls.js/Shaka Player; Mobile: AVPlayer (iOS), ExoPlayer (Android)

---

## Architecture Summary

```
Creator Upload
    │
    ▼
[Ingestion API] ──► [Object Storage: raw]
    │
    ▼
[Job Queue] ──► [Transcoding Workers (FFmpeg)]
                    │
                    ▼
              [Object Storage: renditions]
                    │
                    ▼
              [ABR Packager (HLS/DASH)]
                    │
                    ▼
              [CDN Edge Nodes] ──► Viewer Player
```

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Video Ingestion | Build (custom resumable upload logic) |
| Transcoding Pipeline | Hybrid — FFmpeg workers (build) or Elemental MediaConvert (buy) |
| ABR Packaging | Buy (Shaka Packager, Bento4) |
| Live Streaming | Build ingest layer; buy packaging (Wowza, AWS MediaLive) |
| DRM | Buy (Widevine/FairPlay licenses + buy key server) |
| Copyright Detection | Build fingerprinting DB; buy matching engine (Audible Magic) |
| Recommendation Engine | Build (core IP) |
| Creator Analytics | Build on top of data warehouse |
| Ad Serving | Buy DSP integration (Google Ad Manager) or build for scale |
| Captions / ASR | Buy API (Google STT, AWS Transcribe, OpenAI Whisper) |
| Content Moderation | Hybrid — buy classifiers, build workflow/queue |
| Video Player | Buy/adapt OSS (hls.js, ExoPlayer, AVPlayer) |
