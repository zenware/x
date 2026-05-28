# CAD / CAE / 3D Design (AutoCAD / SolidWorks / Fusion Model)

CAD-class applications revolve around **precise geometry**, **constraints**, **measurements**, and **editability of design intent**. Users are not just drawing pictures; they are authoring manufacturable or buildable models where dimensional correctness matters.

This category includes 2D drafting, mechanical CAD, architectural modeling, and adjacent engineering design tools.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Application Shell & Windowing | Multi-viewport workspaces, inspectors, assembly browsers, tool ribbons |
| Document Model & File I/O | Parts, assemblies, drawings, references, autosave, model recovery |
| Rendering & Compositing | Large model viewports, selection overlays, shaded/wireframe modes |
| Input & Device Abstraction | Mouse, pen, 3D mouse, modifier-heavy shortcuts, snaps |
| Command System / Shortcuts | Tool modes, contextual modeling commands, dimension actions |
| Undo / Redo & History | Feature history and reversible geometric operations |
| Asset / Resource Management | Symbol libraries, materials, part libraries, blocks, references |
| Background Jobs / Concurrency | Rebuilds, exports, meshing, analysis, indexing |
| Preferences / Workspaces | Drafting presets, unit systems, workspace layouts |
| Plugin / Extension Host | Add-ins for simulation, manufacturing, PDM/PLM integration |
| Scripting / Automation | Macros, CAD automation, batch conversion, enterprise workflows |
| Import / Export / Interop | DWG, DXF, STEP, IGES, STL, IFC, PDF |
| Sync / Collaboration | Shared project spaces, markup, review, model locks |
| Licensing / Entitlements | Expensive seat licensing, offline activation, enterprise license servers |
| Installer / Updater | Large packaged installs, managed deployment |
| Diagnostics / Telemetry | Crash reports, performance on large assemblies |
| Accessibility / Localization | Localized dimensions, unit systems, enterprise readiness |
| Security / Signing | Trusted extensions, secure collaboration, signed builds |

**Foundational components: ~58% of the total component count**

---

## Bespoke / Domain-Specific Components

### 1. Geometry Kernel

The geometry kernel is the heart of the product.

- Boundary representation (B-Rep)
- Curves, surfaces, solids
- Booleans, offsets, fillets, chamfers
- NURBS and precise tolerances

### 2. Parametric Sketch & Constraint Solver

CAD tools encode design intent through constraints, not just coordinates.

- Horizontal/vertical/parallel/perpendicular constraints
- Dimensional constraints
- Sketch relations
- Solve/update behavior under edits

### 3. Feature Tree / Design History

Users need to edit how the model was constructed, not only its final state.

- Ordered features
- Regeneration / rebuild
- Suppression and rollback
- Dependency tracking between features

### 4. Snaps, Dimensions & Drafting Annotations

Precision authoring depends on robust drafting aids.

- Endpoint/midpoint/intersection snaps
- Measurement tools
- Dimension placement and associativity
- Tolerances and annotation standards

### 5. Assemblies, Parts & BOM Modeling

Complex products are collections of many interrelated parts.

- Assembly hierarchies
- Mates / joints / constraints
- Part reuse
- Bill of materials generation

### 6. Large Model / Viewport Management

Pro users routinely work with files too large for naive approaches.

- Level of detail
- Frustum culling
- Lightweight proxy representations
- Selective loading of subassemblies

### 7. File Interoperability

Interchange is mandatory in engineering workflows.

- DWG/DXF for drafting
- STEP/IGES/Parasolid-like exchanges
- STL/OBJ for downstream fabrication or visualization
- Metadata and unit fidelity preservation

### 8. 2D Drafting & Sheet Layout

Even 3D-centric systems usually need drafting output.

- Drawing sheets and title blocks
- Multi-view generation
- Hidden-line handling
- Print-scale correctness

### 9. Simulation / Analysis Hooks

Engineering value often extends beyond geometry authoring.

- Meshing handoff
- FEA/CFD integration points
- Material assignment
- Result overlays

### 10. CAM / Manufacturing Workflows

Some products extend from design into manufacturing.

- Toolpath generation
- Machine setup metadata
- Stock simulation
- G-code or other manufacturing output

### 11. Collaboration / Review / Markup

Design review is a first-class workflow in most organizations.

- Review comments
- Markup layers
- Redlines
- Approval workflow hooks

### 12. Material / Surface / Visualization Stack

Users often need more than pure technical geometry.

- Surface appearance
- Materials and textures
- Section views
- Exploded or presentation views

### 13. Domain Libraries

Vertical-specific productivity often comes from reusable standards.

- Fastener libraries
- Architectural symbols
- Electrical or piping standards
- Company-specific templates

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Geometry Kernel | Build or deeply license/adopt a kernel |
| Constraint Solver | Build |
| Feature Tree / Design History | Build |
| Drafting / Dimensions / Snaps | Build |
| Assemblies & BOM | Build |
| Large Model Management | Build |
| File Interop | Hybrid — third-party translators are common |
| 2D Drafting & Sheets | Build |
| Simulation Hooks | Hybrid — integrate external solvers |
| CAM / Manufacturing | Build or modular add-on |
| Review / Markup | Build |
| Visualization Stack | Hybrid |
| Domain Libraries | Build and curate |
