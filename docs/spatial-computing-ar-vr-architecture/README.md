# Spatial Computing / AR / VR Architecture Reference

This documentation covers the components required to build **spatial computing products**, including VR applications, AR work-assist tools, and mixed-reality training or digital twin systems.

It separates:

- **Foundational infrastructure** - reusable rendering, tracking, interaction, and device-platform components
- **Bespoke / domain-specific components** - the scene semantics, collaboration, simulation, training, and content workflows that define each spatial product category

Spatial products differ from both mobile and desktop software because low-latency rendering, tracking accuracy, physical safety, embodied interaction, and 3D spatial UX become central architecture concerns.

---

## Contents

| Document | Description |
|---|---|
| [Foundational Infrastructure](./foundational-infrastructure.md) | Shared platform components across AR, VR, and mixed-reality products |
| [Standalone VR Experiences & Games](./verticals/standalone-vr-experiences-games.md) | Architecture for Meta Quest-style standalone VR products |
| [Enterprise AR Remote Assist & Work Instructions](./verticals/enterprise-ar-remote-assist-work-instructions.md) | Architecture for HoloLens / Vision Pro industrial workflows |
| [Digital Twins, Simulation & XR Training](./verticals/digital-twins-simulation-xr-training.md) | Architecture for spatial training, review, and simulation systems |
| [Component Matrix](./component-matrix.md) | Cross-reference of shared and bespoke systems across covered spatial categories |

---

## Approximate Split by Vertical

| Vertical | Foundational | Bespoke | Total | % Foundational |
|---|:---:|:---:|:---:|:---:|
| Standalone VR Experiences & Games | 16 | 10 | 26 | 62% |
| Enterprise AR Remote Assist & Work Instructions | 16 | 10 | 26 | 62% |
| Digital Twins, Simulation & XR Training | 16 | 11 | 27 | 59% |
