export type WatchLaterVideo = {
  videoId: string;
  title: string;
  channelName: string;
  url: string;
  thumbnailUrl?: string | undefined;
  durationText?: string | undefined;
  dateAddedText?: string | undefined;
};

export type WatchLaterSnapshotInput = {
  pageUrl: string;
  pageTitle: string;
  playlistId: string;
  playlistTitle: string;
  capturedAt?: string | undefined;
  items: WatchLaterVideo[];
};

export type WatchLaterSnapshot = {
  schemaVersion: 1;
  pageUrl: string;
  pageTitle: string;
  playlistId: string;
  playlistTitle: string;
  capturedAt: string;
  itemCount: number;
  duplicateCount: number;
  items: WatchLaterVideo[];
};

export type SnapshotImportRecord = {
  importId: string;
  fingerprint: string;
  importedAt: string;
  sourceFileName: string;
  addedItemCount: number;
  duplicateItemCount: number;
  snapshot: WatchLaterSnapshot;
};

export type CatalogItem = {
  videoId: string;
  video: WatchLaterVideo;
  firstImportedAt: string;
  lastImportedAt: string;
  importCount: number;
  sourceSnapshotFingerprints: string[];
  sourcePlaylistTitles: string[];
  enrichedMetadata?: EnrichedVideoMetadata;
};

export type CatalogStore = {
  schemaVersion: 1;
  updatedAt: string;
  imports: SnapshotImportRecord[];
  items: CatalogItem[];
};

export type MergeSnapshotIntoCatalogOptions = {
  sourceFileName: string;
  importedAt?: string;
};

export type MergeSnapshotIntoCatalogResult = {
  catalog: CatalogStore;
  importRecord?: SnapshotImportRecord | undefined;
  addedItemCount: number;
  duplicateItemCount: number;
  alreadyImported: boolean;
};

export type CatalogDurationBucket = "short" | "medium" | "long" | "unknown";

export type CatalogImportRecency = "all" | "7d" | "30d" | "older";

export type CatalogSuggestedCategory =
  | "educational"
  | "practical"
  | "news-analysis"
  | "podcast-talk"
  | "music-performance"
  | "entertainment"
  | "uncategorized";

export type CatalogSuggestedPriority = "do" | "decide" | "delete";

export type CatalogWatchFit = "quick-hit" | "meal-friendly" | "deep-focus";

export type CatalogItemInsights = {
  category: CatalogSuggestedCategory;
  priority: CatalogSuggestedPriority;
  watchFit: CatalogWatchFit;
  priorityScore: number;
  reasons: string[];
};

export type EnrichedVideoMetadata = {
  videoId: string;
  enrichedAt: string;
  publishedAt?: string;
  description?: string;
  tags?: string[];
  privacyStatus?: "public" | "private" | "unlisted" | "unknown";
  availabilityStatus?: "available" | "deleted" | "unavailable" | "unknown";
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
};

export type PlaylistSyncSuggestion = {
  videoId: string;
  targetPlaylistName: string;
  reason: string;
  approved: boolean;
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeText(value: string | undefined, fallback?: string): string | undefined {
  const normalized = value?.trim();
  if (normalized) {
    return normalized;
  }

  return fallback;
}

function normalizeUrl(value: string): string {
  return value.trim();
}

function normalizeForMatching(value: string | undefined): string {
  return (value ?? "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function matchesNormalizedTerm(value: string, term: string): boolean {
  const normalizedTerm = normalizeForMatching(term);
  if (!normalizedTerm) {
    return false;
  }

  return (` ${value} `).includes(` ${normalizedTerm} `);
}

function normalizeStringList(values: string[]): string[] {
  const uniqueValues = new Set<string>();

  for (const value of values) {
    const normalized = value.trim();
    if (normalized) {
      uniqueValues.add(normalized);
    }
  }

  return Array.from(uniqueValues);
}

function readRequiredString(record: JsonRecord, key: string, label: string): string {
  const value = record[key];

  if (typeof value !== "string") {
    throw new Error(`${label} must be a string.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function readOptionalString(record: JsonRecord, key: string, label: string): string | undefined {
  const value = record[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`${label} must be a string when provided.`);
  }

  return normalizeText(value);
}

function readStringArray(record: JsonRecord, key: string, label: string): string[] {
  const value = record[key];

  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  const strings = value.map((entry, index) => {
    if (typeof entry !== "string") {
      throw new Error(`${label}[${index}] must be a string.`);
    }

    return entry;
  });

  return normalizeStringList(strings);
}

function readRequiredNumber(record: JsonRecord, key: string, label: string): number {
  const value = record[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }

  return value;
}

function mergeWatchLaterVideo(current: WatchLaterVideo | undefined, candidate: WatchLaterVideo): WatchLaterVideo {
  if (!current) {
    return {
      videoId: candidate.videoId.trim(),
      title: normalizeText(candidate.title, "Unknown title") ?? "Unknown title",
      channelName: normalizeText(candidate.channelName, "Unknown channel") ?? "Unknown channel",
      url: normalizeUrl(candidate.url),
      thumbnailUrl: normalizeText(candidate.thumbnailUrl),
      durationText: normalizeText(candidate.durationText),
      dateAddedText: normalizeText(candidate.dateAddedText)
    };
  }

  return {
    videoId: current.videoId,
    title: current.title === "Unknown title"
      ? normalizeText(candidate.title, current.title) ?? current.title
      : current.title,
    channelName: current.channelName === "Unknown channel"
      ? normalizeText(candidate.channelName, current.channelName) ?? current.channelName
      : current.channelName,
    url: current.url || normalizeUrl(candidate.url),
    thumbnailUrl: current.thumbnailUrl ?? normalizeText(candidate.thumbnailUrl),
    durationText: current.durationText ?? normalizeText(candidate.durationText),
    dateAddedText: current.dateAddedText ?? normalizeText(candidate.dateAddedText)
  };
}

function parseWatchLaterVideo(value: unknown, index: number): WatchLaterVideo {
  if (!isRecord(value)) {
    throw new Error(`items[${index}] must be an object.`);
  }

  return mergeWatchLaterVideo(undefined, {
    videoId: readRequiredString(value, "videoId", `items[${index}].videoId`),
    title: readRequiredString(value, "title", `items[${index}].title`),
    channelName: readRequiredString(value, "channelName", `items[${index}].channelName`),
    url: readRequiredString(value, "url", `items[${index}].url`),
    thumbnailUrl: readOptionalString(value, "thumbnailUrl", `items[${index}].thumbnailUrl`),
    durationText: readOptionalString(value, "durationText", `items[${index}].durationText`),
    dateAddedText: readOptionalString(value, "dateAddedText", `items[${index}].dateAddedText`)
  });
}

function parseEnrichedVideoMetadata(value: unknown): EnrichedVideoMetadata | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const videoId = typeof value.videoId === "string" ? value.videoId.trim() : undefined;
  const enrichedAt = typeof value.enrichedAt === "string" ? value.enrichedAt.trim() : undefined;

  if (!videoId || !enrichedAt) {
    return undefined;
  }

  const privacyStatusOptions = ["public", "private", "unlisted", "unknown"] as const;
  const availabilityStatusOptions = ["available", "deleted", "unavailable", "unknown"] as const;

  const publishedAt = typeof value.publishedAt === "string" ? value.publishedAt.trim() || undefined : undefined;
  const description = typeof value.description === "string" ? value.description.trim() || undefined : undefined;
  const tags = Array.isArray(value.tags)
    ? (value.tags as unknown[]).filter((t): t is string => typeof t === "string")
    : undefined;
  const privacyStatus = privacyStatusOptions.includes(value.privacyStatus as never)
    ? (value.privacyStatus as EnrichedVideoMetadata["privacyStatus"])
    : undefined;
  const availabilityStatus = availabilityStatusOptions.includes(value.availabilityStatus as never)
    ? (value.availabilityStatus as EnrichedVideoMetadata["availabilityStatus"])
    : undefined;
  const viewCount = typeof value.viewCount === "number" ? value.viewCount : undefined;
  const likeCount = typeof value.likeCount === "number" ? value.likeCount : undefined;
  const commentCount = typeof value.commentCount === "number" ? value.commentCount : undefined;

  return {
    videoId,
    enrichedAt,
    ...(publishedAt !== undefined ? { publishedAt } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(tags !== undefined ? { tags } : {}),
    ...(privacyStatus !== undefined ? { privacyStatus } : {}),
    ...(availabilityStatus !== undefined ? { availabilityStatus } : {}),
    ...(viewCount !== undefined ? { viewCount } : {}),
    ...(likeCount !== undefined ? { likeCount } : {}),
    ...(commentCount !== undefined ? { commentCount } : {})
  };
}

function parseCatalogItem(value: unknown, index: number): CatalogItem {
  if (!isRecord(value)) {
    throw new Error(`catalog.items[${index}] must be an object.`);
  }

  const enrichedMetadata = parseEnrichedVideoMetadata(value.enrichedMetadata);

  return {
    videoId: readRequiredString(value, "videoId", `catalog.items[${index}].videoId`),
    video: parseWatchLaterVideo(value.video, index),
    firstImportedAt: readRequiredString(value, "firstImportedAt", `catalog.items[${index}].firstImportedAt`),
    lastImportedAt: readRequiredString(value, "lastImportedAt", `catalog.items[${index}].lastImportedAt`),
    importCount: readRequiredNumber(value, "importCount", `catalog.items[${index}].importCount`),
    sourceSnapshotFingerprints: readStringArray(value, "sourceSnapshotFingerprints", `catalog.items[${index}].sourceSnapshotFingerprints`),
    sourcePlaylistTitles: readStringArray(value, "sourcePlaylistTitles", `catalog.items[${index}].sourcePlaylistTitles`),
    ...(enrichedMetadata !== undefined ? { enrichedMetadata } : {})
  };
}

function parseSnapshotImportRecord(value: unknown, index: number): SnapshotImportRecord {
  if (!isRecord(value)) {
    throw new Error(`catalog.imports[${index}] must be an object.`);
  }

  return {
    importId: readRequiredString(value, "importId", `catalog.imports[${index}].importId`),
    fingerprint: readRequiredString(value, "fingerprint", `catalog.imports[${index}].fingerprint`),
    importedAt: readRequiredString(value, "importedAt", `catalog.imports[${index}].importedAt`),
    sourceFileName: readRequiredString(value, "sourceFileName", `catalog.imports[${index}].sourceFileName`),
    addedItemCount: readRequiredNumber(value, "addedItemCount", `catalog.imports[${index}].addedItemCount`),
    duplicateItemCount: readRequiredNumber(value, "duplicateItemCount", `catalog.imports[${index}].duplicateItemCount`),
    snapshot: parseWatchLaterSnapshot(value.snapshot)
  };
}

function sortCatalogItems(items: CatalogItem[]): CatalogItem[] {
  return [...items].sort((left, right) => {
    if (left.lastImportedAt !== right.lastImportedAt) {
      return right.lastImportedAt.localeCompare(left.lastImportedAt);
    }

    return left.video.title.localeCompare(right.video.title);
  });
}

function sortImportRecords(imports: SnapshotImportRecord[]): SnapshotImportRecord[] {
  return [...imports].sort((left, right) => right.importedAt.localeCompare(left.importedAt));
}

function mergeCatalogItem(
  current: CatalogItem | undefined,
  candidate: WatchLaterVideo,
  snapshot: WatchLaterSnapshot,
  importedAt: string,
  fingerprint: string
): CatalogItem {
  if (!current) {
    return {
      videoId: candidate.videoId,
      video: mergeWatchLaterVideo(undefined, candidate),
      firstImportedAt: importedAt,
      lastImportedAt: importedAt,
      importCount: 1,
      sourceSnapshotFingerprints: [fingerprint],
      sourcePlaylistTitles: normalizeStringList([snapshot.playlistTitle])
    };
  }

  return {
    videoId: current.videoId,
    video: mergeWatchLaterVideo(current.video, candidate),
    firstImportedAt: current.firstImportedAt,
    lastImportedAt: importedAt > current.lastImportedAt ? importedAt : current.lastImportedAt,
    importCount: current.importCount + 1,
    sourceSnapshotFingerprints: normalizeStringList([...current.sourceSnapshotFingerprints, fingerprint]),
    sourcePlaylistTitles: normalizeStringList([...current.sourcePlaylistTitles, snapshot.playlistTitle]),
    ...(current.enrichedMetadata !== undefined ? { enrichedMetadata: current.enrichedMetadata } : {})
  };
}

function hashString(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function normalizeWatchLaterSnapshot(input: WatchLaterSnapshotInput): WatchLaterSnapshot {
  const uniqueItems = new Map<string, WatchLaterVideo>();

  for (const item of input.items) {
    const videoId = item.videoId.trim();

    if (!videoId) {
      continue;
    }

    uniqueItems.set(videoId, mergeWatchLaterVideo(uniqueItems.get(videoId), {
      ...item,
      videoId
    }));
  }

  return {
    schemaVersion: 1,
    pageUrl: normalizeUrl(input.pageUrl),
    pageTitle: normalizeText(input.pageTitle, "YouTube") ?? "YouTube",
    playlistId: normalizeText(input.playlistId, "WL") ?? "WL",
    playlistTitle: normalizeText(input.playlistTitle, "Watch Later") ?? "Watch Later",
    capturedAt: input.capturedAt ?? new Date().toISOString(),
    itemCount: uniqueItems.size,
    duplicateCount: Math.max(0, input.items.length - uniqueItems.size),
    items: Array.from(uniqueItems.values())
  };
}

export function parseWatchLaterSnapshot(value: unknown): WatchLaterSnapshot {
  if (!isRecord(value)) {
    throw new Error("Snapshot must be a JSON object.");
  }

  const schemaVersion = value.schemaVersion;
  if (schemaVersion !== undefined && schemaVersion !== 1) {
    throw new Error(`Unsupported snapshot schema version: ${String(schemaVersion)}.`);
  }

  const items = value.items;
  if (!Array.isArray(items)) {
    throw new Error("Snapshot items must be an array.");
  }

  return normalizeWatchLaterSnapshot({
    pageUrl: readRequiredString(value, "pageUrl", "Snapshot pageUrl"),
    pageTitle: readRequiredString(value, "pageTitle", "Snapshot pageTitle"),
    playlistId: readRequiredString(value, "playlistId", "Snapshot playlistId"),
    playlistTitle: readRequiredString(value, "playlistTitle", "Snapshot playlistTitle"),
    capturedAt: readOptionalString(value, "capturedAt", "Snapshot capturedAt"),
    items: items.map((item, index) => parseWatchLaterVideo(item, index))
  });
}

export function createEmptyCatalogStore(): CatalogStore {
  return {
    schemaVersion: 1,
    updatedAt: new Date(0).toISOString(),
    imports: [],
    items: []
  };
}

export function parseCatalogStore(value: unknown): CatalogStore {
  if (!isRecord(value)) {
    throw new Error("Catalog storage is not an object.");
  }

  const schemaVersion = value.schemaVersion;
  if (schemaVersion !== 1) {
    throw new Error(`Unsupported catalog schema version: ${String(schemaVersion)}.`);
  }

  const imports = value.imports;
  if (!Array.isArray(imports)) {
    throw new Error("Catalog imports must be an array.");
  }

  const items = value.items;
  if (!Array.isArray(items)) {
    throw new Error("Catalog items must be an array.");
  }

  return {
    schemaVersion: 1,
    updatedAt: readRequiredString(value, "updatedAt", "Catalog updatedAt"),
    imports: sortImportRecords(imports.map((entry, index) => parseSnapshotImportRecord(entry, index))),
    items: sortCatalogItems(items.map((entry, index) => parseCatalogItem(entry, index)))
  };
}

export function createSnapshotFingerprint(snapshot: WatchLaterSnapshot): string {
  const source = JSON.stringify({
    playlistId: snapshot.playlistId,
    playlistTitle: snapshot.playlistTitle,
    capturedAt: snapshot.capturedAt,
    itemIds: snapshot.items.map((item) => item.videoId)
  });

  return `snapshot-${hashString(source)}`;
}

export function mergeSnapshotIntoCatalog(
  currentCatalog: CatalogStore,
  snapshot: WatchLaterSnapshot,
  options: MergeSnapshotIntoCatalogOptions
): MergeSnapshotIntoCatalogResult {
  const importedAt = options.importedAt ?? new Date().toISOString();
  const fingerprint = createSnapshotFingerprint(snapshot);
  const existingImport = currentCatalog.imports.find((entry) => entry.fingerprint === fingerprint);

  if (existingImport) {
    return {
      catalog: currentCatalog,
      importRecord: existingImport,
      addedItemCount: 0,
      duplicateItemCount: snapshot.itemCount,
      alreadyImported: true
    };
  }

  const nextItems = new Map(currentCatalog.items.map((item) => [item.videoId, item]));
  let addedItemCount = 0;
  let duplicateItemCount = 0;

  for (const item of snapshot.items) {
    const currentItem = nextItems.get(item.videoId);

    if (currentItem) {
      duplicateItemCount += 1;
    } else {
      addedItemCount += 1;
    }

    nextItems.set(item.videoId, mergeCatalogItem(currentItem, item, snapshot, importedAt, fingerprint));
  }

  const importRecord: SnapshotImportRecord = {
    importId: `${fingerprint}-${hashString(`${options.sourceFileName}:${importedAt}`)}`,
    fingerprint,
    importedAt,
    sourceFileName: options.sourceFileName,
    addedItemCount,
    duplicateItemCount,
    snapshot
  };

  return {
    catalog: {
      schemaVersion: 1,
      updatedAt: importedAt,
      imports: sortImportRecords([...currentCatalog.imports, importRecord]),
      items: sortCatalogItems(Array.from(nextItems.values()))
    },
    importRecord,
    addedItemCount,
    duplicateItemCount,
    alreadyImported: false
  };
}

export function parseDurationTextToSeconds(durationText: string | undefined): number | undefined {
  const normalized = normalizeText(durationText);
  if (!normalized) {
    return undefined;
  }

  const segments = normalized.split(":").map((segment) => Number.parseInt(segment, 10));
  if (segments.length < 2 || segments.length > 3 || segments.some((segment) => Number.isNaN(segment))) {
    return undefined;
  }

  if (segments.length === 2) {
    const minutes = segments[0]!;
    const seconds = segments[1]!;
    return minutes * 60 + seconds;
  }

  const hours = segments[0]!;
  const minutes = segments[1]!;
  const seconds = segments[2]!;
  return (hours * 3600) + (minutes * 60) + seconds;
}

export function getDurationBucket(durationText: string | undefined): CatalogDurationBucket {
  const durationSeconds = parseDurationTextToSeconds(durationText);
  if (durationSeconds === undefined) {
    return "unknown";
  }

  if (durationSeconds < 10 * 60) {
    return "short";
  }

  if (durationSeconds <= 30 * 60) {
    return "medium";
  }

  return "long";
}

export function matchesImportRecency(
  importedAt: string,
  filter: CatalogImportRecency,
  now = new Date()
): boolean {
  if (filter === "all") {
    return true;
  }

  const importedTime = new Date(importedAt).getTime();
  if (Number.isNaN(importedTime)) {
    return filter === "older";
  }

  const ageMs = now.getTime() - importedTime;
  const dayMs = 24 * 60 * 60 * 1000;

  if (filter === "7d") {
    return ageMs <= 7 * dayMs;
  }

  if (filter === "30d") {
    return ageMs <= 30 * dayMs;
  }

  return ageMs > 30 * dayMs;
}

export function applyEnrichedMetadata(
  catalog: CatalogStore,
  videoId: string,
  metadata: EnrichedVideoMetadata
): CatalogStore {
  const items = catalog.items.map((item) =>
    item.videoId === videoId ? { ...item, enrichedMetadata: metadata } : item
  );

  return {
    ...catalog,
    items,
    updatedAt: new Date().toISOString()
  };
}

export function removeCatalogItem(catalog: CatalogStore, videoId: string): CatalogStore {
  const items = catalog.items.filter((item) => item.videoId !== videoId);
  if (items.length === catalog.items.length) {
    return catalog;
  }

  return {
    ...catalog,
    items,
    updatedAt: new Date().toISOString()
  };
}

export function getCatalogItemTags(item: CatalogItem): string[] {
  return normalizeStringList(item.enrichedMetadata?.tags ?? []);
}

export function createCatalogItemSearchIndex(item: CatalogItem): string {
  return [
    item.video.title,
    item.video.channelName,
    item.enrichedMetadata?.description,
    ...getCatalogItemTags(item)
  ]
    .map((segment) => normalizeForMatching(segment))
    .filter((segment) => segment.length > 0)
    .join(" ");
}

export function matchesCatalogItemQuery(item: CatalogItem, query: string): boolean {
  const normalizedQuery = normalizeForMatching(query);
  if (!normalizedQuery) {
    return true;
  }

  const searchIndex = createCatalogItemSearchIndex(item);

  if (!searchIndex) {
    return false;
  }

  const tokens = normalizedQuery.split(" ");
  return tokens.every((token) => matchesNormalizedTerm(searchIndex, token));
}

type CatalogSignalFields = {
  title: string;
  channel: string;
  description: string;
  tags: string[];
  durationSeconds: number | undefined;
};

type CategoryRule = {
  category: Exclude<CatalogSuggestedCategory, "uncategorized">;
  terms: string[];
};

const categoryRules: CategoryRule[] = [
  {
    category: "educational",
    terms: [
      "learn",
      "lesson",
      "lecture",
      "course",
      "class",
      "explained",
      "explainer",
      "education",
      "theory",
      "history",
      "science",
      "math",
      "physics",
      "chemistry",
      "programming"
    ]
  },
  {
    category: "practical",
    terms: [
      "how to",
      "tutorial",
      "guide",
      "walkthrough",
      "demo",
      "build",
      "setup",
      "install",
      "fix",
      "recipe",
      "tips",
      "workflow",
      "review"
    ]
  },
  {
    category: "news-analysis",
    terms: [
      "news",
      "analysis",
      "update",
      "breakdown",
      "report",
      "recap",
      "commentary",
      "interview",
      "debate",
      "documentary"
    ]
  },
  {
    category: "podcast-talk",
    terms: [
      "podcast",
      "conversation",
      "discussion",
      "talk",
      "episode",
      "livestream",
      "stream",
      "q a",
      "qa",
      "interview"
    ]
  },
  {
    category: "music-performance",
    terms: [
      "music",
      "song",
      "album",
      "performance",
      "concert",
      "live",
      "cover",
      "remix",
      "piano",
      "guitar"
    ]
  },
  {
    category: "entertainment",
    terms: [
      "funny",
      "comedy",
      "reaction",
      "meme",
      "prank",
      "vlog",
      "trailer",
      "highlights",
      "clip",
      "gameplay",
      "challenge"
    ]
  }
];

const positivePriorityTerms = [
  "learn",
  "tutorial",
  "how to",
  "guide",
  "lesson",
  "course",
  "lecture",
  "explained",
  "analysis",
  "documentary",
  "breakdown",
  "deep dive"
];

const negativePriorityTerms = [
  "reaction",
  "clip",
  "shorts",
  "highlights",
  "trailer",
  "teaser",
  "compilation",
  "meme",
  "prank"
];

function collectCatalogSignalFields(item: CatalogItem): CatalogSignalFields {
  return {
    title: normalizeForMatching(item.video.title),
    channel: normalizeForMatching(item.video.channelName),
    description: normalizeForMatching(item.enrichedMetadata?.description),
    tags: getCatalogItemTags(item).map((tag) => normalizeForMatching(tag)),
    durationSeconds: parseDurationTextToSeconds(item.video.durationText)
  };
}

function scoreCategoryMatch(
  fields: CatalogSignalFields,
  rule: CategoryRule
): { score: number; matches: string[] } {
  let score = 0;
  const matches = new Set<string>();

  for (const term of rule.terms) {
    if (matchesNormalizedTerm(fields.title, term)) {
      score += 4;
      matches.add(term);
      continue;
    }

    if (fields.tags.some((tag) => matchesNormalizedTerm(tag, term))) {
      score += 3;
      matches.add(term);
      continue;
    }

    if (matchesNormalizedTerm(fields.description, term)) {
      score += 2;
      matches.add(term);
      continue;
    }

    if (matchesNormalizedTerm(fields.channel, term)) {
      score += 1;
      matches.add(term);
    }
  }

  return { score, matches: Array.from(matches) };
}

function getWatchFit(
  durationSeconds: number | undefined,
  category: CatalogSuggestedCategory
): CatalogWatchFit {
  if (durationSeconds === undefined) {
    return category === "educational" || category === "podcast-talk" ? "deep-focus" : "meal-friendly";
  }

  if (durationSeconds < 12 * 60) {
    return "quick-hit";
  }

  if (durationSeconds <= 35 * 60) {
    return "meal-friendly";
  }

  return "deep-focus";
}

function pushReason(reasons: string[], reason: string): void {
  if (!reasons.includes(reason)) {
    reasons.push(reason);
  }
}

export function deriveCatalogItemInsights(item: CatalogItem): CatalogItemInsights {
  const fields = collectCatalogSignalFields(item);
  const categoryScores = categoryRules.map((rule) => ({
    category: rule.category,
    ...scoreCategoryMatch(fields, rule)
  }));
  categoryScores.sort((left, right) => right.score - left.score);

  const topCategory = categoryScores[0];
  const category = topCategory && topCategory.score >= 3 ? topCategory.category : "uncategorized";
  const watchFit = getWatchFit(fields.durationSeconds, category);
  const reasons: string[] = [];

  if (topCategory && topCategory.score >= 3 && topCategory.matches.length > 0) {
    pushReason(reasons, `Matched ${topCategory.matches.slice(0, 3).join(", ")}.`);
  }

  let priorityScore = 0;
  const basePriorityScores: Record<CatalogSuggestedCategory, number> = {
    educational: 4,
    practical: 3,
    "news-analysis": 1,
    "podcast-talk": 1,
    "music-performance": -1,
    entertainment: -1,
    uncategorized: 0
  };
  priorityScore += basePriorityScores[category];

  if (category === "educational" || category === "practical") {
    pushReason(reasons, "Leans toward learning value.");
  }

  if (watchFit === "meal-friendly") {
    priorityScore += category === "educational" || category === "practical" ? 2 : 1;
    pushReason(reasons, "Fits a typical meal-length watch.");
  } else if (watchFit === "quick-hit") {
    priorityScore += 1;
    pushReason(reasons, "Short enough to clear quickly.");
  } else if (category === "educational" || category === "practical" || category === "news-analysis") {
    priorityScore += 1;
    pushReason(reasons, "Looks like deeper material worth scheduling.");
  } else {
    priorityScore -= 1;
    pushReason(reasons, "Longer runtime makes it easier to defer.");
  }

  if (
    matchesNormalizedTerm(fields.title, "private")
    || item.enrichedMetadata?.availabilityStatus === "deleted"
    || item.enrichedMetadata?.availabilityStatus === "unavailable"
    || item.enrichedMetadata?.privacyStatus === "private"
  ) {
    priorityScore -= 6;
    pushReason(reasons, "Not currently watchable.");
  }

  if (
    positivePriorityTerms.some((term) =>
      matchesNormalizedTerm(fields.title, term)
      || matchesNormalizedTerm(fields.description, term)
      || fields.tags.some((tag) => matchesNormalizedTerm(tag, term))
    )
  ) {
    priorityScore += 2;
    pushReason(reasons, "Strong instructional or analysis cues.");
  }

  if (
    negativePriorityTerms.some((term) =>
      matchesNormalizedTerm(fields.title, term)
      || matchesNormalizedTerm(fields.description, term)
      || fields.tags.some((tag) => matchesNormalizedTerm(tag, term))
    )
  ) {
    priorityScore -= 2;
    pushReason(reasons, "Looks more disposable than evergreen.");
  }

  if (category === "uncategorized" && !item.enrichedMetadata?.description && getCatalogItemTags(item).length === 0) {
    priorityScore -= 1;
    pushReason(reasons, "Metadata is too thin to justify urgency yet.");
  }

  const priority: CatalogSuggestedPriority = priorityScore >= 4
    ? "do"
    : priorityScore <= -3
      ? "delete"
      : "decide";

  return {
    category,
    priority,
    watchFit,
    priorityScore,
    reasons: reasons.slice(0, 4)
  };
}
