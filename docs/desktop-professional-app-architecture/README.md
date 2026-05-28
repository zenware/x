# Desktop / Professional App Architecture Reference

This documentation covers the components required to build **professional desktop applications** across several common software categories. It uses the same split that matters most during planning:

- **Foundational infrastructure** — reusable platform capabilities that most serious desktop/pro apps need regardless of domain
- **Bespoke / domain-specific components** — the editing engines, data models, workflows, and algorithms that make a Photoshop, AutoCAD, Office, Premiere, or ArcGIS-class product meaningfully different

For desktop software, the foundational layer is larger than many teams expect. You still need rendering, file handling, plugins, automation, packaging, crash reporting, entitlements, and OS integration before the product-specific engine can shine.

---

## Contents

| Document | Description |
|---|---|
| [Foundational Infrastructure](./foundational-infrastructure.md) | Shared platform components most desktop/pro apps need |
| [Digital Art / Photo Editing](./verticals/digital-art-photo-editing.md) | Architecture for Photoshop / Procreate / Affinity-class apps |
| [CAD / CAE / 3D Design](./verticals/cad-cae-3d-design.md) | Architecture for AutoCAD / SolidWorks / Fusion-class apps |
| [Office / Productivity Suite](./verticals/office-productivity-suite.md) | Architecture for Word / Excel / PowerPoint-class products |
| [Video Post / Motion Graphics / VFX](./verticals/video-post-vfx.md) | Architecture for Premiere / After Effects / Resolve-class apps |
| [Audio Production / DAW](./verticals/audio-production-daw.md) | Architecture for Pro Tools / Logic / Ableton-class apps |
| [GIS / Geospatial Analysis](./verticals/gis-geospatial.md) | Architecture for ArcGIS / QGIS / Civil planning tools |
| [Component Matrix](./component-matrix.md) | Cross-reference of shared and bespoke components across all verticals |

---

## The Build vs. Buy Rule of Thumb

A component is usually a good **buy / adopt** candidate when:

- It is undifferentiated plumbing (auto-update, crash reporting, licensing, telemetry)
- The operating systems already provide a strong primitive (windowing, accessibility, file dialogs, code signing)
- Mature SDKs exist and the team's advantage does not come from owning the full stack

A component is usually a good **build** candidate when:

- It defines the editing model, document semantics, or user workflow
- Performance, latency, or fidelity are central to the product value
- Interoperability with industry formats is not enough; the app needs its own domain engine

In practice, teams often **adopt the commodity shell and build the core engine**.

---

## Approximate Split by Vertical

| Vertical | Foundational | Bespoke | Total | % Foundational |
|---|:---:|:---:|:---:|:---:|
| Digital Art / Photo Editing | 18 | 12 | 30 | 60% |
| CAD / CAE / 3D Design | 18 | 13 | 31 | 58% |
| Office / Productivity Suite | 18 | 12 | 30 | 60% |
| Video Post / VFX | 18 | 13 | 31 | 58% |
| Audio Production / DAW | 18 | 12 | 30 | 60% |
| GIS / Geospatial Analysis | 18 | 12 | 30 | 60% |

_These percentages are by component count, not engineering effort. In nearly every category, the bespoke engine consumes a disproportionately larger share of implementation complexity than the foundational layer._
