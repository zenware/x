# Video Post / Motion Graphics / VFX (Premiere / After Effects / Resolve Model)

Video post-production software combines **time-based editing**, **media pipeline engineering**, **real-time playback**, and often **high-end GPU processing**. Correctness is not enough; interactive scrubbing and predictable render output are table stakes.

This category covers non-linear editors, motion graphics tools, compositors, and finishing systems.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Application Shell & Windowing | Timelines, bins, inspectors, scopes, preview monitors |
| Document Model & File I/O | Project files, media references, autosave, relink, proxies |
| Rendering & Compositing | Preview playback, effects processing, scopes, GPU surfaces |
| Input & Device Abstraction | Keyboard-heavy editing, jog/shuttle, tablets, control panels |
| Command System / Shortcuts | Fast editorial operations and customizable layouts |
| Undo / Redo & History | Safe editing across timeline, effects, and project organization |
| Asset / Resource Management | Media bins, proxies, LUTs, templates, caches |
| Background Jobs / Concurrency | Transcodes, proxy generation, renders, conform, analysis |
| Preferences / Workspaces | Editorial and color workspace presets |
| Plugin / Extension Host | Effects, transitions, panels, I/O integrations |
| Scripting / Automation | Batch renders, conform, pipeline integration |
| Import / Export / Interop | Camera codecs, EDL/XML/AAF, captions, delivery formats |
| Sync / Collaboration | Shared projects, review links, team storage, locking |
| Licensing / Entitlements | Subscription tiers, codec packs, studio licensing |
| Installer / Updater | Large media-capable distributions |
| Diagnostics / Telemetry | Playback/render stability and GPU crash diagnostics |
| Accessibility / Localization | Global usage with keyboard accessibility expectations |
| Security / Signing | Signed plugins, secure cloud review workflows |

**Foundational components: ~58% of the total component count**

---

## Bespoke / Domain-Specific Components

### 1. Timeline / Sequence Engine

The timeline is the primary mental model for editorial work.

- Tracks, clips, trims, ripple/roll/slip/slide
- Nested sequences
- Markers and ranges
- Frame-accurate editing semantics

### 2. Media Ingest, Proxy & Relink Pipeline

Real-world video workflows begin with messy media.

- Ingest from cameras/cards/storage
- Proxy generation
- Relink to source media
- Metadata capture and organization

### 3. Codec Decode / Encode Pipeline

Format support is essential and performance-sensitive.

- Hardware decode/encode paths
- Container handling
- Color subsampling and bit depth awareness
- Delivery preset management

### 4. Real-Time Playback Engine

Editors judge usability by whether playback stays smooth.

- Frame scheduling
- Buffering and prefetch
- Adaptive quality under load
- Audio/video sync

### 5. Keyframing / Animation System

Motion work requires a reusable animation language.

- Parameter animation
- Easing/interpolation
- Graph editors
- Parenting and transform hierarchies

### 6. Node Graph / Layered Compositing

Advanced workflows need a strong compositing model.

- Layer-based or node-based composition
- Mattes and blend modes
- Precompositions / nested comps
- Multi-pass effect ordering

### 7. Color Grading & LUT Pipeline

Color fidelity is a core feature, not a finish.

- LUT support
- Primary and secondary corrections
- Scopes integration
- Managed color workflows

### 8. Effects Stack / GPU Processing

Effects drive both creative flexibility and rendering complexity.

- GPU kernels
- Effect parameters and presets
- Caching and invalidation
- Effect ordering and dependency handling

### 9. Titling / Motion Graphics Tooling

Most editors need built-in motion typography and reusable graphics.

- Title templates
- Lower thirds and captions styling
- Reusable branded graphics
- Data-driven graphics hooks

### 10. Audio Sync & Basic Mixing

Even video-first applications need solid audio fundamentals.

- Waveform display
- Loudness tools
- Audio effect chains
- Sync correction and multicam alignment

### 11. Review, Markers & Shared Project Workflows

Media production is team-based and iterative.

- Review comments at timecodes
- Approval states
- Shared bins/projects
- Editorial notes and annotations

### 12. Render Queue & Deliverables

Finishing requires repeatable export workflows.

- Batch render queue
- Multiple output presets
- Watch folders / background encoders
- Quality-control friendly metadata

### 13. Subtitle / Caption / Compliance Tooling

Professional delivery often includes regulatory or broadcast requirements.

- Subtitle tracks
- Closed caption export
- Timing validation
- Broadcast-safe output checks

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Timeline / Sequence Engine | Build |
| Ingest / Proxy / Relink | Build |
| Codec Pipeline | Hybrid — use platform and licensed codec stacks |
| Real-Time Playback | Build |
| Keyframing / Animation | Build |
| Node Graph / Compositing | Build |
| Color Pipeline | Build |
| Effects Stack | Build; optionally support third-party effects SDKs |
| Titling / Motion Graphics | Build |
| Audio Sync / Mixing | Hybrid |
| Review / Shared Project Workflows | Build on shared collaboration services |
| Render Queue / Deliverables | Build |
| Subtitle / Compliance Tooling | Build |
