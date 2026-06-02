const svg = document.querySelector("#graph-canvas");
const seedInput = document.querySelector("#seed-input");
const launchButton = document.querySelector("#launch-btn");
const seedDetection = document.querySelector("#seed-detection");
const layoutSelect = document.querySelector("#layout-mode");
const gravitySlider = document.querySelector("#gravity");
const repulsionSlider = document.querySelector("#repulsion");
const linkLengthSlider = document.querySelector("#link-length");
const confidenceSlider = document.querySelector("#confidence");
const timelineSlider = document.querySelector("#timeline");
const timelineValue = document.querySelector("#timeline-value");
const hideCertsToggle = document.querySelector("#hide-certs");
const hideSocialToggle = document.querySelector("#hide-social");
const focusModeToggle = document.querySelector("#focus-mode");
const mapModeToggle = document.querySelector("#map-mode");
const pruneButton = document.querySelector("#prune-btn");
const resetButton = document.querySelector("#reset-btn");
const inspectorEmpty = document.querySelector("#inspector-empty");
const inspectorContent = document.querySelector("#inspector-content");
const inspectorTitle = document.querySelector("#inspector-title");
const inspectorSummary = document.querySelector("#inspector-summary");
const metaType = document.querySelector("#meta-type");
const metaConfidence = document.querySelector("#meta-confidence");
const metaYear = document.querySelector("#meta-year");
const metaSource = document.querySelector("#meta-source");
const rawJson = document.querySelector("#raw-json");
const pinButton = document.querySelector("#pin-btn");
const expandButton = document.querySelector("#expand-btn");
const pathButton = document.querySelector("#path-btn");

if (
  !svg || !seedInput || !launchButton || !seedDetection || !layoutSelect || !gravitySlider ||
  !repulsionSlider || !linkLengthSlider || !confidenceSlider || !timelineSlider || !timelineValue ||
  !hideCertsToggle || !hideSocialToggle || !focusModeToggle || !mapModeToggle || !pruneButton ||
  !resetButton || !inspectorEmpty || !inspectorContent || !inspectorTitle || !inspectorSummary ||
  !metaType || !metaConfidence || !metaYear || !metaSource || !rawJson || !pinButton ||
  !expandButton || !pathButton
) {
  throw new Error("Glean UI failed to initialize.");
}

const WIDTH = 1200;
const HEIGHT = 700;
const NS = "http://www.w3.org/2000/svg";
const seedId = "seed-root";

const typeColor = {
  seed: "#f7c979",
  domain: "#8fb4ff",
  ip: "#8ee6be",
  email: "#d6b4ff",
  certificate: "#ffb98d",
  social: "#c2d0ff",
  cluster: "#f1b7ff",
  phone: "#80dfd5",
  location: "#ffd6aa"
};

const typeBadge = {
  seed: "SEED",
  domain: "DOM",
  ip: "IP",
  email: "MAIL",
  certificate: "CERT",
  social: "SOC",
  cluster: "GROUP",
  phone: "PHONE",
  location: "GEO"
};

const graphCatalog = new Map();
const edgeCatalog = new Map();
const visibleNodes = new Map();
const visibleEdges = new Map();
const pinnedNodes = new Set();
const positions = new Map();

let selectedNodeId = null;

const inferSeedType = (value) => {
  const text = value.trim();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(text)) return { type: "ip", playbook: "Network Infrastructure Scan" };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return { type: "email", playbook: "Identity and Account Trace" };
  if (/^\+?[0-9][0-9\s().-]{7,}$/.test(text)) return { type: "phone", playbook: "Phone-Centric Public Records Trace" };
  if (/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(text)) return { type: "domain", playbook: "Corporate Infrastructure Scan" };
  if (/(map|trace|find|investigate)/i.test(text)) return { type: "intent", playbook: "Natural-Language Investigation Plan" };
  return { type: "unknown", playbook: "General Recursive Enrichment" };
};

const createCatalog = () => {
  const seedLabel = seedInput.value.trim() || "acme-ops.example";
  const nodes = [
    { id: seedId, label: seedLabel, type: "seed", confidence: 1, year: 2026, source: "manual seed", summary: "Case seed entered through omnibox launchpad." },
    { id: "domain-main", label: "acme-cdn.net", type: "domain", confidence: 0.92, year: 2026, source: "passive DNS", summary: "Primary adjacent domain discovered from passive DNS expansion." },
    { id: "ip-main", label: "203.0.113.17", type: "ip", confidence: 0.95, year: 2026, source: "dns resolution", summary: "Observed as active resolution target for primary domain." },
    { id: "email-admin", label: "admin@acme-ops.example", type: "email", confidence: 0.84, year: 2025, source: "whois", summary: "Administrative email from registration and archival records." },
    { id: "cluster-parked", label: "Domains (24)", type: "cluster", confidence: 0.36, year: 2026, source: "passive DNS", summary: "Low-confidence parked domains clustered by semantic collapse." },
    { id: "cluster-social", label: "Mentions (12)", type: "cluster", confidence: 0.44, year: 2025, source: "social scrapers", summary: "High-volume mention cluster. Expand only if needed." },
    { id: "cert-a", label: "TLS cert chain", type: "certificate", confidence: 0.81, year: 2026, source: "certificate inventory", summary: "Certificate subject and SAN records tied to domain-main." },
    { id: "phone-reg", label: "+1 312 555 0148", type: "phone", confidence: 0.73, year: 2024, source: "whois", summary: "Registrant phone observed in historical records." },
    { id: "loc-ams", label: "Amsterdam NL", type: "location", confidence: 0.7, year: 2024, source: "geocoding", summary: "Geocoded hosting and record-linked infrastructure location.", lat: 52.3676, lon: 4.9041 },
    { id: "parked-1", label: "cdn-cache-a.net", type: "domain", confidence: 0.34, year: 2026, source: "passive DNS", summary: "Low-confidence parked domain from bulk resolution set." },
    { id: "parked-2", label: "cdn-cache-b.net", type: "domain", confidence: 0.32, year: 2026, source: "passive DNS", summary: "Low-confidence parked domain from bulk resolution set." },
    { id: "parked-3", label: "edge-host-17.info", type: "domain", confidence: 0.31, year: 2025, source: "passive DNS", summary: "Low-confidence parked domain from bulk resolution set." },
    { id: "parked-4", label: "edge-host-22.info", type: "domain", confidence: 0.29, year: 2025, source: "passive DNS", summary: "Low-confidence parked domain from bulk resolution set." },
    { id: "parked-5", label: "cdn-link-archive.org", type: "domain", confidence: 0.28, year: 2024, source: "passive DNS", summary: "Low-confidence parked domain from bulk resolution set." },
    { id: "parked-6", label: "legacy-node-cache.org", type: "domain", confidence: 0.27, year: 2024, source: "passive DNS", summary: "Low-confidence parked domain from bulk resolution set." },
    { id: "soc-1", label: "@opswatcher", type: "social", confidence: 0.39, year: 2025, source: "public profile scrape", summary: "Mention cluster item discovered through public social indexing." },
    { id: "soc-2", label: "@mailmirror", type: "social", confidence: 0.41, year: 2025, source: "public profile scrape", summary: "Mention cluster item discovered through public social indexing." },
    { id: "soc-3", label: "@infra-journal", type: "social", confidence: 0.47, year: 2024, source: "public profile scrape", summary: "Mention cluster item discovered through public social indexing." },
    { id: "soc-4", label: "@dns-notes", type: "social", confidence: 0.46, year: 2023, source: "public profile scrape", summary: "Mention cluster item discovered through public social indexing." }
  ];

  const edges = [
    { id: "e1", from: seedId, to: "domain-main", kind: "related domain", confidence: 0.92, year: 2026 },
    { id: "e2", from: seedId, to: "email-admin", kind: "registration contact", confidence: 0.84, year: 2025 },
    { id: "e3", from: "domain-main", to: "ip-main", kind: "resolves_to", confidence: 0.95, year: 2026 },
    { id: "e4", from: "ip-main", to: "cluster-parked", kind: "resolves_to_many", confidence: 0.36, year: 2026, inferred: true },
    { id: "e5", from: "domain-main", to: "cert-a", kind: "certificate", confidence: 0.81, year: 2026 },
    { id: "e6", from: "email-admin", to: "phone-reg", kind: "contact chain", confidence: 0.73, year: 2024 },
    { id: "e7", from: "phone-reg", to: "loc-ams", kind: "reverse lookup", confidence: 0.7, year: 2024 },
    { id: "e8", from: "domain-main", to: "cluster-social", kind: "mentions", confidence: 0.44, year: 2025, inferred: true },
    { id: "e9", from: "cluster-parked", to: "parked-1", kind: "cluster item", confidence: 0.34, year: 2026, inferred: true },
    { id: "e10", from: "cluster-parked", to: "parked-2", kind: "cluster item", confidence: 0.32, year: 2026, inferred: true },
    { id: "e11", from: "cluster-parked", to: "parked-3", kind: "cluster item", confidence: 0.31, year: 2025, inferred: true },
    { id: "e12", from: "cluster-parked", to: "parked-4", kind: "cluster item", confidence: 0.29, year: 2025, inferred: true },
    { id: "e13", from: "cluster-parked", to: "parked-5", kind: "cluster item", confidence: 0.28, year: 2024, inferred: true },
    { id: "e14", from: "cluster-parked", to: "parked-6", kind: "cluster item", confidence: 0.27, year: 2024, inferred: true },
    { id: "e15", from: "cluster-social", to: "soc-1", kind: "cluster item", confidence: 0.39, year: 2025, inferred: true },
    { id: "e16", from: "cluster-social", to: "soc-2", kind: "cluster item", confidence: 0.41, year: 2025, inferred: true },
    { id: "e17", from: "cluster-social", to: "soc-3", kind: "cluster item", confidence: 0.47, year: 2024, inferred: true },
    { id: "e18", from: "cluster-social", to: "soc-4", kind: "cluster item", confidence: 0.46, year: 2023, inferred: true }
  ];

  graphCatalog.clear();
  edgeCatalog.clear();
  for (const n of nodes) graphCatalog.set(n.id, n);
  for (const e of edges) edgeCatalog.set(e.id, e);
};

const expansionMap = {
  [seedId]: ["domain-main", "email-admin"],
  "domain-main": ["ip-main", "cert-a", "cluster-social"],
  "ip-main": ["cluster-parked"],
  "email-admin": ["phone-reg"],
  "phone-reg": ["loc-ams"],
  "cluster-parked": ["parked-1", "parked-2", "parked-3", "parked-4", "parked-5", "parked-6"],
  "cluster-social": ["soc-1", "soc-2", "soc-3", "soc-4"]
};

const findEdgesForNode = (nodeId) => {
  const result = [];
  for (const edge of edgeCatalog.values()) {
    if (edge.from === nodeId || edge.to === nodeId) result.push(edge);
  }
  return result;
};

const setDetectionText = () => {
  const detection = inferSeedType(seedInput.value);
  seedDetection.textContent = `Detected ${detection.type}. Suggested playbook: ${detection.playbook}.`;
};

const resetCase = () => {
  visibleNodes.clear();
  visibleEdges.clear();
  pinnedNodes.clear();
  positions.clear();
  selectedNodeId = null;
  const seed = graphCatalog.get(seedId);
  seed.label = seedInput.value.trim() || "acme-ops.example";
  visibleNodes.set(seedId, seed);
  positions.set(seedId, { x: WIDTH / 2, y: HEIGHT / 2, vx: 0, vy: 0 });
  renderInspector(null);
  renderGraph();
};

const addNodeVisible = (nodeId) => {
  const node = graphCatalog.get(nodeId);
  if (!node) return;
  visibleNodes.set(nodeId, node);
  if (positions.has(nodeId)) return;
  const base = positions.get(seedId) || { x: WIDTH / 2, y: HEIGHT / 2 };
  positions.set(nodeId, {
    x: Math.max(60, Math.min(WIDTH - 60, base.x + (Math.random() - 0.5) * 240)),
    y: Math.max(60, Math.min(HEIGHT - 60, base.y + (Math.random() - 0.5) * 180)),
    vx: 0,
    vy: 0
  });
};

const expandNode = (nodeId) => {
  const neighbors = expansionMap[nodeId];
  if (!neighbors) return;
  for (const neighbor of neighbors) addNodeVisible(neighbor);
  for (const edge of findEdgesForNode(nodeId)) {
    if (visibleNodes.has(edge.from) && visibleNodes.has(edge.to)) visibleEdges.set(edge.id, edge);
  }
  renderGraph();
};

const nodePassesFilters = (node) => {
  const min = Number.parseInt(confidenceSlider.value, 10) / 100;
  const maxYear = Number.parseInt(timelineSlider.value, 10);
  if (node.confidence < min) return false;
  if (node.year > maxYear) return false;
  if (hideCertsToggle.checked && node.type === "certificate") return false;
  if (hideSocialToggle.checked && (node.type === "social" || node.id === "cluster-social")) return false;
  return true;
};

const edgePassesFilters = (edge) => edge.confidence >= Number.parseInt(confidenceSlider.value, 10) / 100 && edge.year <= Number.parseInt(timelineSlider.value, 10);

const buildFilteredView = () => {
  const nodes = [...visibleNodes.values()].filter(nodePassesFilters);
  const allowed = new Set(nodes.map((n) => n.id));
  const edges = [...visibleEdges.values()].filter((e) => allowed.has(e.from) && allowed.has(e.to) && edgePassesFilters(e));
  return { nodes, edges };
};

const adjacencyFromEdges = (edges) => {
  const adjacency = new Map();
  for (const edge of edges) {
    const from = adjacency.get(edge.from) || [];
    const to = adjacency.get(edge.to) || [];
    from.push(edge.to);
    to.push(edge.from);
    adjacency.set(edge.from, from);
    adjacency.set(edge.to, to);
  }
  return adjacency;
};

const shortestPathToSeed = (target, edges) => {
  const adjacency = adjacencyFromEdges(edges);
  const queue = [target];
  const prev = new Map([[target, null]]);
  while (queue.length) {
    const current = queue.shift();
    if (current === seedId) break;
    for (const neighbor of adjacency.get(current) || []) {
      if (prev.has(neighbor)) continue;
      prev.set(neighbor, current);
      queue.push(neighbor);
    }
  }
  if (!prev.has(seedId)) return new Set([target]);
  const path = new Set();
  let cursor = seedId;
  while (cursor) {
    path.add(cursor);
    cursor = prev.get(cursor);
  }
  return path;
};

const runForceLayout = (nodes, edges) => {
  const gravity = Number.parseInt(gravitySlider.value, 10) / 100;
  const repulsion = Number.parseInt(repulsionSlider.value, 10);
  const linkDist = Number.parseInt(linkLengthSlider.value, 10);

  for (const node of nodes) {
    if (!positions.has(node.id)) positions.set(node.id, { x: WIDTH / 2, y: HEIGHT / 2, vx: 0, vy: 0 });
  }

  for (let i = 0; i < 20; i += 1) {
    for (let aIndex = 0; aIndex < nodes.length; aIndex += 1) {
      for (let bIndex = aIndex + 1; bIndex < nodes.length; bIndex += 1) {
        const a = nodes[aIndex];
        const b = nodes[bIndex];
        const pa = positions.get(a.id);
        const pb = positions.get(b.id);
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const d2 = Math.max(dx * dx + dy * dy, 0.001);
        const force = repulsion / d2;
        const fx = force * dx;
        const fy = force * dy;
        if (!pinnedNodes.has(a.id)) { pa.vx -= fx; pa.vy -= fy; }
        if (!pinnedNodes.has(b.id)) { pb.vx += fx; pb.vy += fy; }
      }
    }

    for (const edge of edges) {
      const a = positions.get(edge.from);
      const b = positions.get(edge.to);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const stretch = (dist - linkDist) * 0.004;
      const fx = (dx / dist) * stretch;
      const fy = (dy / dist) * stretch;
      if (!pinnedNodes.has(edge.from)) { a.vx += fx; a.vy += fy; }
      if (!pinnedNodes.has(edge.to)) { b.vx -= fx; b.vy -= fy; }
    }

    for (const node of nodes) {
      const p = positions.get(node.id);
      if (pinnedNodes.has(node.id)) continue;
      p.vx += (WIDTH / 2 - p.x) * gravity * 0.0022;
      p.vy += (HEIGHT / 2 - p.y) * gravity * 0.0022;
      p.vx *= 0.82;
      p.vy *= 0.82;
      p.x = Math.max(30, Math.min(WIDTH - 30, p.x + p.vx));
      p.y = Math.max(30, Math.min(HEIGHT - 30, p.y + p.vy));
    }
  }
};

const runHierarchyLayout = (nodes, edges) => {
  const adjacency = adjacencyFromEdges(edges);
  const levels = new Map([[seedId, 0]]);
  const queue = [seedId];
  while (queue.length) {
    const current = queue.shift();
    const level = levels.get(current) || 0;
    for (const next of adjacency.get(current) || []) {
      if (levels.has(next)) continue;
      levels.set(next, level + 1);
      queue.push(next);
    }
  }

  const byLevel = new Map();
  for (const node of nodes) {
    const level = levels.get(node.id) ?? 3;
    const list = byLevel.get(level) || [];
    list.push(node);
    byLevel.set(level, list);
  }

  for (const [level, list] of byLevel.entries()) {
    list.sort((a, b) => a.label.localeCompare(b.label));
    const x = 110 + level * 220;
    const spacing = HEIGHT / (list.length + 1);
    list.forEach((node, index) => {
      if (pinnedNodes.has(node.id)) return;
      positions.set(node.id, { x, y: spacing * (index + 1), vx: 0, vy: 0 });
    });
  }
};

const createSvg = (name) => document.createElementNS(NS, name);

const renderInspector = (node) => {
  if (!node) {
    inspectorEmpty.classList.remove("hidden");
    inspectorContent.classList.add("hidden");
    return;
  }
  inspectorEmpty.classList.add("hidden");
  inspectorContent.classList.remove("hidden");
  inspectorTitle.textContent = node.label;
  inspectorSummary.textContent = node.summary;
  metaType.textContent = node.type;
  metaConfidence.textContent = `${Math.round(node.confidence * 100)}%`;
  metaYear.textContent = `${node.year}`;
  metaSource.textContent = node.source;
  rawJson.textContent = JSON.stringify(node, null, 2);
  pinButton.textContent = pinnedNodes.has(node.id) ? "Unpin" : "Pin";
};

const renderGraph = () => {
  timelineValue.textContent = timelineSlider.value;
  const { nodes, edges } = buildFilteredView();

  if (layoutSelect.value === "hierarchy") runHierarchyLayout(nodes, edges);
  else runForceLayout(nodes, edges);

  if (mapModeToggle.checked) {
    for (const node of nodes) {
      if (node.lat === undefined || node.lon === undefined || pinnedNodes.has(node.id)) continue;
      positions.set(node.id, {
        x: ((node.lon + 180) / 360) * WIDTH,
        y: ((90 - node.lat) / 180) * HEIGHT,
        vx: 0,
        vy: 0
      });
    }
  }

  const focusPath = focusModeToggle.checked && selectedNodeId ? shortestPathToSeed(selectedNodeId, edges) : null;
  svg.replaceChildren();

  for (const edge of edges) {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) continue;
    const line = createSvg("line");
    line.setAttribute("x1", `${from.x}`);
    line.setAttribute("y1", `${from.y}`);
    line.setAttribute("x2", `${to.x}`);
    line.setAttribute("y2", `${to.y}`);
    line.setAttribute("stroke", edge.inferred ? "rgba(196,170,255,0.74)" : "rgba(130,205,255,0.78)");
    line.setAttribute("stroke-width", `${1.2 + edge.confidence * 2.3}`);
    line.classList.add("edge");
    if (edge.inferred) line.classList.add("inferred");
    if (focusPath && !(focusPath.has(edge.from) && focusPath.has(edge.to))) line.classList.add("dimmed");
    const title = createSvg("title");
    title.textContent = `${edge.kind} (${Math.round(edge.confidence * 100)}%)`;
    line.append(title);
    svg.append(line);
  }

  for (const node of nodes) {
    const p = positions.get(node.id);
    if (!p) continue;
    const g = createSvg("g");
    g.setAttribute("transform", `translate(${p.x},${p.y})`);
    g.classList.add("node");
    if (selectedNodeId === node.id) g.classList.add("focused");
    if (pinnedNodes.has(node.id)) g.classList.add("pinned");
    if (focusPath && !focusPath.has(node.id)) g.classList.add("dimmed");

    const circle = createSvg("circle");
    const radius = node.type === "seed" ? 17 : node.type === "cluster" ? 15 : 13;
    circle.setAttribute("r", `${radius}`);
    circle.setAttribute("fill", typeColor[node.type]);
    circle.setAttribute("stroke", "rgba(8,12,20,0.84)");
    circle.setAttribute("stroke-width", "1.5");

    const badge = createSvg("text");
    badge.classList.add("node-badge");
    badge.setAttribute("text-anchor", "middle");
    badge.setAttribute("dy", "3");
    badge.textContent = typeBadge[node.type];

    const label = createSvg("text");
    label.classList.add("node-label");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dy", `${radius + 15}`);
    label.textContent = node.label.length > 22 ? `${node.label.slice(0, 19)}...` : node.label;

    const title = createSvg("title");
    title.textContent = `${node.label}\n${Math.round(node.confidence * 100)}% confidence`;
    g.append(circle, badge, label, title);

    g.addEventListener("click", () => {
      selectedNodeId = node.id;
      renderInspector(node);
      renderGraph();
    });
    g.addEventListener("dblclick", () => {
      expandNode(node.id);
      selectedNodeId = node.id;
      renderInspector(node);
    });
    svg.append(g);
  }
};

const pruneOrphans = () => {
  const { edges } = buildFilteredView();
  const adjacency = adjacencyFromEdges(edges);
  const visited = new Set([seedId]);
  const queue = [seedId];
  while (queue.length) {
    const current = queue.shift();
    for (const next of adjacency.get(current) || []) {
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }
  for (const id of [...visibleNodes.keys()]) {
    if (id !== seedId && !visited.has(id)) {
      visibleNodes.delete(id);
      visibleEdges.forEach((edge, edgeId) => {
        if (edge.from === id || edge.to === id) visibleEdges.delete(edgeId);
      });
      positions.delete(id);
      pinnedNodes.delete(id);
    }
  }
  if (selectedNodeId && !visibleNodes.has(selectedNodeId)) {
    selectedNodeId = null;
    renderInspector(null);
  }
  renderGraph();
};

launchButton.addEventListener("click", () => {
  createCatalog();
  setDetectionText();
  resetCase();
});

seedInput.addEventListener("input", setDetectionText);

[layoutSelect, gravitySlider, repulsionSlider, linkLengthSlider, confidenceSlider, timelineSlider, hideCertsToggle, hideSocialToggle, focusModeToggle, mapModeToggle]
  .forEach((control) => control.addEventListener("input", renderGraph));

pruneButton.addEventListener("click", pruneOrphans);

resetButton.addEventListener("click", () => {
  resetCase();
  expandNode(seedId);
});

pinButton.addEventListener("click", () => {
  if (!selectedNodeId) return;
  if (pinnedNodes.has(selectedNodeId)) pinnedNodes.delete(selectedNodeId);
  else pinnedNodes.add(selectedNodeId);
  renderInspector(visibleNodes.get(selectedNodeId) || null);
  renderGraph();
});

expandButton.addEventListener("click", () => {
  if (!selectedNodeId) return;
  expandNode(selectedNodeId);
});

pathButton.addEventListener("click", () => {
  if (!selectedNodeId) return;
  focusModeToggle.checked = true;
  renderGraph();
});

createCatalog();
setDetectionText();
resetCase();
expandNode(seedId);
