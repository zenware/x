# Standalone VR Experiences & Games

Standalone VR products are defined by **embodied interaction**, **strict frame-time requirements**, and **comfort management**. Small UX mistakes can become nausea, disorientation, or rapid device overheating.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| XR App Shell & Scene Lifecycle | Move between menus, experiences, and system states |
| Rendering & Frame Budget Mgmt | Stable stereo rendering and responsiveness |
| Tracking / Pose / Anchoring | Head, hand, and controller tracking |
| Input & Interaction | Controllers, hand tracking, gaze where supported |
| Spatial UI Framework | Menus, HUDs, overlays, diegetic UI |
| Asset Pipeline & Packaging | Shipping optimized 3D assets |
| Physics / Interaction | Object grabs, collisions, spatial interactions |
| Audio / Spatial Sound | Environmental cues and immersion |
| Networking / Presence | Multiplayer or social presence where applicable |
| Capability / Performance Adaptation | Thermal and battery-aware rendering choices |
| Safety / Comfort Controls | Comfort turning, guardian, vignette, seated modes |
| Identity / Permissions | Profiles, entitlements, cloud save |
| Telemetry / Replay | Session debugging and UX issue analysis |
| Distribution / Updates | Headset store distribution and rollouts |
| Accessibility / Localization | Comfort options and language support |
| Tooling / Simulation / Capture | QA, capture, and iteration workflows |

---

## Bespoke / Domain-Specific Components

### 1. Embodied Interaction Mechanics
- Hands/controllers interacting with objects
- Physical affordances
- Object manipulation semantics

### 2. Locomotion & Comfort
- Teleport, smooth locomotion, snap turn
- Motion comfort tuning
- User-configurable comfort options

### 3. World / Level Design Semantics
- Scale and traversal design
- Spatial puzzle/combat interactions
- Streaming and scene transitions

### 4. Haptics & Feedback
- Controller vibration
- Audio/visual confirmation loops
- Interaction feel

### 5. Multiplayer Presence / Voice / Avatars
- Avatar state sync
- Voice chat in 3D space
- Social presence cues

### 6. In-World Onboarding
- Comfort-safe tutorials
- Device-specific training
- Early retention flow

### 7. Performance-Tuned Scene Streaming
- Asset LOD
- Late loading / streaming
- Quality fallbacks

### 8. Progression / Save Model
- Unlocks and saves
- Per-user progression
- Cloud save semantics

### 9. Social Safety & Moderation
- Personal boundaries
- Mute/block/report in immersive space
- Safety defaults for younger users

### 10. Capture / Sharing / Spectator
- Recording and streaming
- External spectator views
- Shareable clips

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Embodied Interaction | Build |
| Locomotion / Comfort | Build |
| World / Level Semantics | Build |
| Haptics | Build |
| Presence / Voice / Avatars | Hybrid |
| Onboarding | Build |
| Scene Streaming | Build |
| Progression / Save | Build |
| Safety / Moderation | Build |
| Capture / Spectator | Hybrid |
