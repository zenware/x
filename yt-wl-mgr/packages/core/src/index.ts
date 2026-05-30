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
