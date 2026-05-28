# GIS / Geospatial Analysis (ArcGIS / QGIS Model)

GIS software combines **map rendering**, **spatial data modeling**, **coordinate-system correctness**, and **analysis workflows**. Unlike generic visualization tools, GIS products must preserve geographic meaning and support editing, querying, and publication of spatial datasets.

This category covers desktop GIS, planning tools, field analysis workstations, and adjacent geospatial authoring applications.

---

## Foundational Infrastructure Used

| Component | Usage |
|---|---|
| Application Shell & Windowing | Layer panels, map views, attribute tables, analysis toolboxes |
| Document Model & File I/O | Projects, map packages, geodatabases, layer references, recovery |
| Rendering & Compositing | Map tiles, vector overlays, labels, symbol previews |
| Input & Device Abstraction | Pan/zoom/rotate, snapping, selection, GPS and survey devices |
| Command System / Shortcuts | Tool modes, analysis commands, layer operations |
| Undo / Redo & History | Safe editing of features, styles, and analysis results |
| Asset / Resource Management | Symbology libraries, basemaps, offline tiles, templates |
| Background Jobs / Concurrency | Tile generation, indexing, geoprocessing, large dataset loads |
| Preferences / Workspaces | CRS defaults, styling presets, custom layouts |
| Plugin / Extension Host | Analysis extensions, data connectors, organization tooling |
| Scripting / Automation | Geoprocessing scripts, batch conversion, field workflows |
| Import / Export / Interop | Shapefile, GeoJSON, GeoTIFF, GeoPackage, map services |
| Sync / Collaboration | Shared projects, offline field sync, review comments |
| Licensing / Entitlements | Desktop seats plus premium analysis/tool licenses |
| Installer / Updater | Large data-aware enterprise installs |
| Diagnostics / Telemetry | Performance on huge layers and driver issues |
| Accessibility / Localization | International map labeling and public-sector deployment needs |
| Security / Signing | Secure plugin distribution and enterprise data access |

**Foundational components: ~60% of the total component count**

---

## Bespoke / Domain-Specific Components

### 1. Map Rendering & Layer Composition

GIS rendering is not just drawing shapes; it must respect spatial meaning and scale.

- Layer ordering
- Scale-dependent rendering
- Raster/vector composition
- Label collision handling

### 2. Coordinate Reference Systems & Projections

Geospatial correctness depends on CRS handling.

- CRS metadata
- Reprojection
- Datum transformations
- Unit and extent correctness

### 3. Vector / Raster Geodata Model

GIS apps need first-class support for multiple geodata forms.

- Points, lines, polygons
- Raster grids
- Feature attributes
- Multi-layer project composition

### 4. Spatial Indexing & Query Engine

Large datasets are unusable without strong indexing.

- Spatial joins
- Bounding-box and proximity queries
- Region selection
- Efficient filtering on attributes + geometry

### 5. Editing, Snapping & Topology Rules

Professional GIS editing has strict data-integrity requirements.

- Vertex editing
- Topological constraints
- Snapping and trace tools
- Error validation workflows

### 6. Symbology / Styling / Label Placement

Presentation quality matters for analysis and publication.

- Rule-based styling
- Graduated / categorized symbology
- Label placement rules
- Thematic mapping presets

### 7. Geoprocessing Pipeline

Analysis is a core product surface.

- Buffer, clip, intersect, union
- Raster calculations
- Batch processing
- Reproducible parameterized jobs

### 8. Offline Tiles / Cache / Sync

Field and disconnected workflows are common.

- Tile packaging
- Local cache management
- Sync when connectivity returns
- Conflict handling for edits

### 9. GPS / Survey / Sensor Integration

Many workflows involve live or recorded field data.

- GPS device input
- Survey-grade device support
- Coordinate capture
- Sensor metadata attachment

### 10. Attribute Tables, Forms & Joins

Spatial features are deeply linked to tabular data.

- Attribute editing tables
- Relational joins
- Forms for data entry
- Validation rules

### 11. Publishing to Map Services / Packages

GIS projects often feed downstream portals or field tools.

- Map packages
- Tile packages
- Service publication
- Metadata and sharing controls

### 12. Review, Markup & Scenario Analysis

Planning workflows require collaboration beyond pure analysis.

- Scenario layers
- Review comments
- Markup/annotation overlays
- Comparison workflows across alternatives

---

## Build vs. Buy Summary

| Component | Build / Buy |
|---|---|
| Map Rendering / Layer Composition | Build |
| CRS / Projection Handling | Hybrid — adopt projection libraries, build workflow semantics |
| Geodata Model | Build |
| Spatial Indexing / Query | Build or adopt specialized spatial libraries |
| Editing / Snapping / Topology | Build |
| Symbology / Labeling | Build |
| Geoprocessing | Build on reusable processing framework |
| Offline Tiles / Sync | Build |
| GPS / Survey Integration | Hybrid |
| Attribute Tables / Joins | Build |
| Publishing / Packaging | Build |
| Review / Scenario Analysis | Build |
