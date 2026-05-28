# Component Matrix

Cross-reference of architectural components across all documented desktop/professional application verticals. Use this to:

- Identify which platform investments are reusable across multiple product lines
- Estimate how much of the stack is foundational infrastructure versus bespoke domain logic
- Separate commodity product plumbing from the parts that actually define the application category

Legend: ✅ Required — ⚡ Critical / unusually deep — 🔄 Optional / category-dependent

---

## Part 1: Foundational Infrastructure (Platform Layer)

| Component | Digital Art / Photo | CAD / CAE / 3D | Office Suite | Video Post / VFX | Audio / DAW | GIS / Geospatial |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Application Shell & Windowing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Document Model & File I/O | ⚡ | ⚡ | ⚡ | ⚡ | ⚡ | ⚡ |
| Rendering & Compositing Pipeline | ⚡ | ⚡ | ✅ | ⚡ | 🔄 | ⚡ |
| Input & Device Abstraction | ⚡ | ⚡ | ✅ | ✅ | ⚡ | ⚡ |
| Command System / Menus / Shortcuts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Undo / Redo / History | ⚡ | ⚡ | ⚡ | ⚡ | ⚡ | ⚡ |
| Asset / Resource Management | ✅ | ✅ | ✅ | ⚡ | ⚡ | ✅ |
| Background Jobs / Concurrency | ✅ | ⚡ | ✅ | ⚡ | ⚡ | ⚡ |
| Preferences / Workspaces / User State | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Plugin / Extension Host | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Scripting / Automation | ✅ | ✅ | ⚡ | ✅ | ✅ | ✅ |
| Import / Export / Interop | ⚡ | ⚡ | ⚡ | ⚡ | ⚡ | ⚡ |
| Sync / Collaboration / Cloud Services | 🔄 | ✅ | ⚡ | ✅ | ✅ | ✅ |
| Licensing / Identity / Entitlements | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Installer / Updater / Release Channels | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Diagnostics / Telemetry / Crash Reporting | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Accessibility / Localization / Compliance | ✅ | ✅ | ⚡ | ✅ | ✅ | ✅ |
| Security / Signing / Sandboxing | ✅ | ✅ | ⚡ | ✅ | ✅ | ✅ |

**18 foundational components — nearly every serious desktop/pro app needs all or most of them.**

---

## Part 2: Bespoke / Domain-Specific Components (Product Engine)

### Digital Art / Photo Editing

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Raster Pixel Engine | Very High | No |
| Layer Stack, Masks & Blend Modes | Very High | Partially (Video/VFX) |
| Brush & Stroke Engine | Very High | No |
| Selections / Paths / Marquee Modeling | High | No |
| Non-Destructive Adjustments & Smart Objects | High | Partially (Video/VFX) |
| Color Management & Proofing | High | Partially (Video/VFX, Office print) |
| Retouch / Clone / Heal Tools | High | No |
| Filter Graph / Effect Pipeline | High | Partially (Video/VFX, GIS raster) |
| RAW / Camera Pipeline | Medium | No |
| Typography & Layout Tools | Medium | Partially (Office) |
| Asset Libraries / Brushes / Patterns | Medium | Partially (Video/VFX) |
| Export Fidelity for Print / Web / PSD-like Interop | High | Partially (Office) |

**12 bespoke components**

---

### CAD / CAE / 3D Design

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Geometry Kernel (B-Rep / NURBS / Solids) | Very High | No |
| Parametric Sketch & Constraint Solver | Very High | No |
| Feature Tree / Design History | High | No |
| Snaps, Dimensions & Drafting Annotations | High | Partially (GIS) |
| Assemblies, Parts & BOM Modeling | High | No |
| Large Model / Viewport Management | High | Partially (GIS, Video) |
| File Interop (DWG/DXF/STEP/IGES) | High | No |
| 2D Drafting & Sheet Layout | Medium | Partially (Office print) |
| Simulation / Analysis Hooks | High | Partially (GIS analysis) |
| CAM / Toolpath / Manufacturing Workflows | High | No |
| Collaboration / Markup / Review Workflows | Medium | Partially (Office, GIS) |
| Material / Surface / Visualization Stack | Medium | Partially (Video/VFX) |
| Domain Libraries (parts, standards, symbols) | Medium | No |

**13 bespoke components**

---

### Office / Productivity Suite

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Rich Text Layout & Pagination Engine | Very High | No |
| Spreadsheet Calculation Engine | Very High | No |
| Formula Language & Dependency Graph | Very High | No |
| Presentation Canvas / Slide Model | High | Partially (Digital Art) |
| Charts, Tables & Embedded Objects | High | Partially (GIS, CAD) |
| Comments, Track Changes & Review Flow | High | Partially (CAD, GIS) |
| Templates, Styles & Themes | Medium | Partially (Digital Art) |
| Mail Merge / Data Binding | Medium | No |
| Macro Runtime & Office Automation | High | Partially (all via scripting) |
| Enterprise Policy / DLP / Document Security | High | No |
| Real-Time Coauthoring & Conflict Resolution | Very High | Partially (CAD, GIS, Video) |
| Print / Publish / PDF Fidelity | High | Partially (Digital Art) |

**12 bespoke components**

---

### Video Post / Motion Graphics / VFX

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Timeline / Sequence Engine | Very High | Partially (Audio / DAW) |
| Media Ingest, Proxy & Relink Pipeline | High | Partially (Audio) |
| Codec Decode / Encode Pipeline | Very High | No |
| Real-Time Playback Engine | Very High | Partially (Audio) |
| Keyframing / Animation System | High | Partially (Digital Art) |
| Node Graph / Layered Compositing | Very High | Partially (Digital Art) |
| Color Grading & LUT Pipeline | High | Partially (Digital Art) |
| Effects Stack / GPU Processing | High | Partially (Digital Art) |
| Titling / Motion Graphics Tooling | Medium | Partially (Office, Digital Art) |
| Audio Sync, Waveform & Basic Mixing | Medium | Partially (Audio / DAW) |
| Review, Markers & Shared Project Workflows | High | Partially (Office, CAD) |
| Render Queue / Deliverables Presets | High | Partially (Audio) |
| Subtitle / Caption / Broadcast Compliance | Medium | No |

**13 bespoke components**

---

### Audio Production / DAW

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Low-Latency Audio Engine | Very High | No |
| Timeline / Arrangement View | High | Partially (Video/VFX) |
| Mixer, Bus Routing & Sends | Very High | No |
| MIDI Engine & Editing | High | No |
| Plugin Hosting (VST/AU/AAX) | High | Partially (Plugin host foundations) |
| Automation Curves & Envelopes | High | Partially (Video/VFX) |
| Time-Stretch / Pitch / Warp Algorithms | High | No |
| Recording, Comping & Take Management | High | No |
| Virtual Instruments / Sample Libraries | High | No |
| Offline Bounce / Stem Export | Medium | Partially (Video/VFX) |
| Sync / Tempo / Scoring Workflows | Medium | Partially (Video) |
| Control Surface / Hardware Integration | Medium | No |

**12 bespoke components**

---

### GIS / Geospatial Analysis

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Map Rendering & Layer Composition | Very High | Partially (CAD) |
| Coordinate Reference Systems & Projections | Very High | No |
| Vector / Raster Geodata Model | High | Partially (Digital Art raster) |
| Spatial Indexing & Query Engine | High | No |
| Editing, Snapping & Topology Rules | High | Partially (CAD) |
| Symbology / Styling / Label Placement | High | Partially (Office charts) |
| Geoprocessing Pipeline | High | Partially (CAD analysis) |
| Offline Tiles / Cache / Sync | Medium | Partially (field collaboration) |
| GPS / Survey / Sensor Device Integration | Medium | No |
| Attribute Tables, Forms & Joins | Medium | Partially (Office spreadsheets) |
| Publishing to Map Services / Packages | Medium | No |
| Review, Markup & Scenario Analysis | Medium | Partially (CAD, Office) |

**12 bespoke components**

---

## Summary: Component Count by Vertical

| Vertical | Foundational | Bespoke | Total | % Foundational |
|---|:---:|:---:|:---:|:---:|
| Digital Art / Photo Editing | 18 | 12 | 30 | 60% |
| CAD / CAE / 3D Design | 18 | 13 | 31 | 58% |
| Office / Productivity Suite | 18 | 12 | 30 | 60% |
| Video Post / VFX | 18 | 13 | 31 | 58% |
| Audio Production / DAW | 18 | 12 | 30 | 60% |
| GIS / Geospatial Analysis | 18 | 12 | 30 | 60% |

> By count, more than half the stack looks foundational. By effort, the bespoke engine usually dominates because correctness, fidelity, and performance expectations are much higher than in typical line-of-business software.

---

## Cross-Vertical Reuse Opportunities

If a company is building more than one professional desktop product, these are the highest-leverage platform investments:

| Component | Applicable Verticals |
|---|---|
| Document model, autosave, recovery, and version migration | All |
| Rendering/compositing and viewport infrastructure | Digital Art, CAD, Video/VFX, GIS |
| Command system, history stack, and shortcuts | All |
| Plugin host and extension compatibility model | All |
| Scripting / headless automation platform | All |
| Asset management, relinking, and packaging | Digital Art, CAD, Video/VFX, Audio, GIS |
| Review comments, annotations, and collaboration services | Office, CAD, Video/VFX, GIS |
| Timeline + keyframe infrastructure | Video/VFX, Audio; partially Digital Art |
| Color management and output fidelity | Digital Art, Video/VFX, Office |
| Enterprise identity, entitlements, policy, and update channels | All commercial desktop products |
