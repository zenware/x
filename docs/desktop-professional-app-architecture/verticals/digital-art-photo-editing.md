# Digital Art / Photo Editing (Photoshop / Procreate Model)

Digital art and photo editing apps center on **interactive raster editing**, **high-fidelity color**, and **tool feel**. The user's perception of quality comes from brush latency, layer behavior, selection precision, and export fidelity.

This category includes apps like Photoshop, Procreate, Affinity Photo, Krita, and portions of Illustrator-like workflows when the raster path dominates.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Application Shell & Windowing | Canvas views, inspectors, tool panels, floating palettes |
| Document Model & File I/O | Layered project files, autosave, recovery, linked assets |
| Rendering & Compositing | Zoomable canvas, layer previews, GPU effects, HiDPI rendering |
| Input & Device Abstraction | Pen pressure, tilt, gestures, keyboard-driven editing |
| Command System / Shortcuts | Tool switching, menu actions, contextual commands |
| Undo / Redo & History | Deep edit history across destructive and non-destructive actions |
| Asset / Resource Management | Brushes, textures, fonts, color palettes, linked smart assets |
| Background Jobs / Concurrency | Export, filter previews, asset indexing, large image operations |
| Preferences / Workspaces | Custom toolbars, panel layouts, brush presets |
| Plugin / Extension Host | Filters, importers, automation add-ons |
| Scripting / Automation | Batch processing, actions, studio workflows |
| Import / Export / Interop | PSD-like interchange, PNG/JPEG/TIFF/WebP/PDF export |
| Sync / Collaboration | Optional cloud docs, shared libraries, review workflows |
| Licensing / Entitlements | Subscription features, brush pack entitlements, sign-in |
| Installer / Updater | Consumer and enterprise delivery |
| Diagnostics / Telemetry | Crash capture and brush/render performance analysis |
| Accessibility / Localization | Keyboard navigation, localized UI, text input support |
| Security / Signing | Signed binaries, trusted plugins, document safety |

**Foundational components: ~60% of the total component count**

---

## Bespoke / Domain-Specific Components

### 1. Raster Pixel Engine

The core image representation must support very large canvases, multiple bit depths, alpha handling, tiling, and efficient partial updates.

- Tiled image storage for huge documents
- 8/16/32-bit workflows
- Fast read/modify/write operations for local regions
- Memory-aware caching and scratch usage

### 2. Layer Stack, Masks & Blend Modes

The layer model is one of the defining UX primitives in this category.

- Ordered layers and groups
- Opacity and visibility
- Blend modes
- Layer masks and clipping masks
- Adjustment layers and smart objects

### 3. Brush & Stroke Engine

This is the equivalent of "feel" in a musical instrument.

- Pressure, tilt, velocity, and smoothing
- Brush stamps, spacing, jitter, scatter
- Wet paint / smudge / blend behavior
- Low-latency stroke preview and commit

### 4. Selections, Paths & Marquee Modeling

Selections determine how precisely users can isolate and manipulate content.

- Rectangle / lasso / polygon / magic-wand selections
- Feathering and anti-aliasing
- Vector paths and bezier editing
- Save/load selection channels

### 5. Non-Destructive Adjustments

Professional users expect reversible workflows.

- Curves, levels, hue/saturation, exposure
- Live adjustment layers
- Smart filters and re-editable parameters
- Embedded or linked smart objects

### 6. Color Management & Proofing

Color correctness matters for print, photography, and cross-device consistency.

- ICC profile handling
- Wide-gamut workflows
- Soft proofing
- Color picker behavior in different spaces

### 7. Retouch, Clone & Heal Tooling

These tools require specialized sampling and reconstruction logic.

- Clone stamp
- Healing brush / patch tools
- Content-aware fill style workflows
- Blemish removal and edge-aware repair

### 8. Filter / Effect Pipeline

Filters must chain well, preview quickly, and preserve fidelity.

- Blur, sharpen, distort, noise, stylize filters
- GPU-accelerated kernels
- Live previews and parameter panels
- Batch or action-friendly application

### 9. RAW / Camera Pipeline

Photo-centric tools often need first-class camera workflows.

- RAW decoding
- Exposure / white balance interpretation
- Lens correction and demosaic
- Metadata preservation

### 10. Typography & Layout Tools

Even pure image tools usually need strong text handling.

- Text layers and editable type
- Kerning, tracking, paragraph styles
- Text-on-path and warping
- Font fallback and shaping

### 11. Asset Libraries & Reusable Presets

Studios and teams rely on reusable creative assets.

- Brush libraries
- Swatches and gradients
- Pattern and texture catalogs
- Shared templates and linked libraries

### 12. Output Fidelity

Users judge the app by whether exported files match what they saw while editing.

- PSD/PDF/PNG/TIFF export fidelity
- Print output correctness
- Web-ready asset slicing
- Color-space-aware export presets

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Raster Pixel Engine | Build |
| Layer Stack / Masks / Blend Modes | Build |
| Brush & Stroke Engine | Build |
| Selections / Paths | Build |
| Non-Destructive Adjustments | Build |
| Color Management | Hybrid — build workflows, rely on OS/ICC primitives |
| Retouch / Heal Tools | Build |
| Filter Pipeline | Build; optionally use third-party kernels/codecs |
| RAW / Camera Pipeline | Hybrid — third-party decoders are common |
| Typography | Hybrid — build editor UX on top of platform text shaping |
| Asset Libraries | Build |
| Output Fidelity | Build |
