import {
  createEmptyCatalogStore,
  getDurationBucket,
  matchesImportRecency,
  mergeSnapshotIntoCatalog,
  parseWatchLaterSnapshot,
  applyEnrichedMetadata,
  type CatalogDurationBucket,
  type CatalogImportRecency,
  type CatalogItem,
  type CatalogStore,
  type EnrichedVideoMetadata,
  type SnapshotImportRecord
} from "../../../packages/core/src/index.js";
import { loadCatalogStore, saveCatalogStore } from "./catalogStorage.js";
import { fetchVideoEnrichment } from "./videoEnrichment.js";

type DurationFilter = CatalogDurationBucket | "all";
type RecencyFilter = CatalogImportRecency;
type PlaylistFilter = "all" | string;
type SortOrder = "recent" | "oldest" | "title" | "channel" | "import-count";
type MessageKind = "success" | "error" | "info";

type UiMessage = {
  kind: MessageKind;
  text: string;
};

type EnrichProgress = {
  total: number;
  completed: number;
  failed: number;
};

type CatalogPageState = {
  catalog: CatalogStore;
  searchQuery: string;
  durationFilter: DurationFilter;
  recencyFilter: RecencyFilter;
  playlistFilter: PlaylistFilter;
  sortOrder: SortOrder;
  selectedVideoId: string | undefined;
  isBusy: boolean;
  messages: UiMessage[];
  fatalError: string | undefined;
  enrichProgress: EnrichProgress | null;
  enrichingVideoId: string | undefined;
};

const fileInput = requireElement<HTMLInputElement>("[data-role='file-input']");
const importButton = requireElement<HTMLLabelElement>("[data-role='import-button']");
const exportSnapshotsButton = requireElement<HTMLButtonElement>("[data-role='export-snapshots-button']");
const enrichAllButton = requireElement<HTMLButtonElement>("[data-role='enrich-all-button']");
const reloadButton = requireElement<HTMLButtonElement>("[data-role='reload-button']");
const searchInput = requireElement<HTMLInputElement>("[data-role='search-input']");
const durationFilterSelect = requireElement<HTMLSelectElement>("[data-role='duration-filter']");
const recencyFilterSelect = requireElement<HTMLSelectElement>("[data-role='recency-filter']");
const playlistFilterSelect = requireElement<HTMLSelectElement>("[data-role='playlist-filter']");
const sortOrderSelect = requireElement<HTMLSelectElement>("[data-role='sort-order']");
const clearFiltersButton = requireElement<HTMLButtonElement>("[data-role='clear-filters']");
const statusPanel = requireElement<HTMLElement>("[data-role='status-panel']");
const totalItemsValue = requireElement<HTMLElement>("[data-role='total-items']");
const totalImportsValue = requireElement<HTMLElement>("[data-role='total-imports']");
const updatedAtValue = requireElement<HTMLElement>("[data-role='updated-at']");
const listSummary = requireElement<HTMLElement>("[data-role='list-summary']");
const emptyState = requireElement<HTMLElement>("[data-role='empty-state']");
const noResultsState = requireElement<HTMLElement>("[data-role='no-results-state']");
const itemList = requireElement<HTMLUListElement>("[data-role='item-list']");
const detailPanel = requireElement<HTMLElement>("[data-role='detail-panel']");

const initialState: CatalogPageState = {
  catalog: createEmptyCatalogStore(),
  searchQuery: "",
  durationFilter: "all",
  recencyFilter: "all",
  playlistFilter: "all",
  sortOrder: "recent",
  selectedVideoId: undefined,
  isBusy: false,
  messages: [],
  fatalError: undefined,
  enrichProgress: null,
  enrichingVideoId: undefined
};

const state: CatalogPageState = { ...initialState };

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

function formatDateTime(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

function readSelectedVideoIdFromHash(): string | undefined {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(hash);
  const selectedVideoId = params.get("video")?.trim();
  return selectedVideoId || undefined;
}

function updateSelectedVideoId(videoId: string | undefined): void {
  state.selectedVideoId = videoId;

  const url = new URL(window.location.href);
  url.hash = videoId ? `video=${encodeURIComponent(videoId)}` : "";
  window.history.replaceState(null, "", url);
}

function setBusy(isBusy: boolean): void {
  state.isBusy = isBusy;
  fileInput.disabled = isBusy || Boolean(state.fatalError);
  exportSnapshotsButton.disabled = isBusy || Boolean(state.fatalError);
  enrichAllButton.disabled = isBusy || Boolean(state.fatalError) || Boolean(state.enrichProgress);
  reloadButton.disabled = isBusy;
  importButton.dataset.disabled = String(fileInput.disabled);
}

function setMessages(messages: UiMessage[]): void {
  state.messages = messages;
  renderMessages();
}

function appendMessages(messages: UiMessage[]): void {
  setMessages([...messages, ...state.messages].slice(0, 6));
}

function renderMessages(): void {
  statusPanel.replaceChildren();

  const activeMessages = state.fatalError
    ? [{ kind: "error", text: state.fatalError } satisfies UiMessage]
    : state.messages;

  if (activeMessages.length === 0) {
    statusPanel.hidden = true;
    return;
  }

  statusPanel.hidden = false;

  for (const message of activeMessages) {
    const messageElement = document.createElement("p");
    messageElement.className = "status-panel__message";
    messageElement.dataset.kind = message.kind;
    messageElement.textContent = message.text;
    statusPanel.append(messageElement);
  }
}

function resetFilters(): void {
  state.searchQuery = "";
  state.durationFilter = "all";
  state.recencyFilter = "all";
  state.playlistFilter = "all";
  state.sortOrder = "recent";
  searchInput.value = "";
  durationFilterSelect.value = "all";
  recencyFilterSelect.value = "all";
  playlistFilterSelect.value = "all";
  sortOrderSelect.value = "recent";
  render();
}

function sortCatalogItems(items: CatalogItem[]): CatalogItem[] {
  const nextItems = [...items];

  if (state.sortOrder === "recent") {
    return nextItems.sort((left, right) => right.lastImportedAt.localeCompare(left.lastImportedAt));
  }

  if (state.sortOrder === "oldest") {
    return nextItems.sort((left, right) => left.lastImportedAt.localeCompare(right.lastImportedAt));
  }

  if (state.sortOrder === "title") {
    return nextItems.sort((left, right) => left.video.title.localeCompare(right.video.title));
  }

  if (state.sortOrder === "channel") {
    return nextItems.sort((left, right) => left.video.channelName.localeCompare(right.video.channelName));
  }

  return nextItems.sort((left, right) => right.importCount - left.importCount);
}

function getFilteredItems(): CatalogItem[] {
  const normalizedQuery = state.searchQuery.trim().toLocaleLowerCase();
  const filteredItems = state.catalog.items.filter((item) => {
    const matchesQuery = normalizedQuery.length === 0
      || item.video.title.toLocaleLowerCase().includes(normalizedQuery)
      || item.video.channelName.toLocaleLowerCase().includes(normalizedQuery);
    const matchesDuration = state.durationFilter === "all"
      || getDurationBucket(item.video.durationText) === state.durationFilter;
    const matchesRecency = matchesImportRecency(item.lastImportedAt, state.recencyFilter);
    const matchesPlaylist = state.playlistFilter === "all"
      || item.sourcePlaylistTitles.includes(state.playlistFilter);

    return matchesQuery && matchesDuration && matchesRecency && matchesPlaylist;
  });

  return sortCatalogItems(filteredItems);
}

function renderPlaylistFilterOptions(): void {
  const playlistTitles = Array.from(
    new Set(state.catalog.items.flatMap((item) => item.sourcePlaylistTitles))
  ).sort((left, right) => left.localeCompare(right));

  playlistFilterSelect.replaceChildren();

  const anyPlaylistOption = document.createElement("option");
  anyPlaylistOption.value = "all";
  anyPlaylistOption.textContent = "Any playlist";
  playlistFilterSelect.append(anyPlaylistOption);

  for (const playlistTitle of playlistTitles) {
    const option = document.createElement("option");
    option.value = playlistTitle;
    option.textContent = playlistTitle;
    playlistFilterSelect.append(option);
  }

  if (state.playlistFilter !== "all" && !playlistTitles.includes(state.playlistFilter)) {
    state.playlistFilter = "all";
  }

  playlistFilterSelect.value = state.playlistFilter;
}

function ensureSelectedItem(filteredItems: CatalogItem[]): CatalogItem | undefined {
  const existingSelection = filteredItems.find((item) => item.videoId === state.selectedVideoId);
  if (existingSelection) {
    return existingSelection;
  }

  const hashSelection = readSelectedVideoIdFromHash();
  const selectedFromHash = filteredItems.find((item) => item.videoId === hashSelection);
  if (selectedFromHash) {
    updateSelectedVideoId(selectedFromHash.videoId);
    return selectedFromHash;
  }

  const fallbackSelection = filteredItems[0];
  updateSelectedVideoId(fallbackSelection?.videoId);
  return fallbackSelection;
}

function renderSummary(): void {
  totalItemsValue.textContent = String(state.catalog.items.length);
  totalImportsValue.textContent = String(state.catalog.imports.length);
  updatedAtValue.textContent = state.catalog.imports.length > 0 ? formatDateTime(state.catalog.updatedAt) : "Not yet imported";
}

function renderEnrichAllButton(): void {
  if (state.enrichProgress) {
    const { completed, failed, total } = state.enrichProgress;
    const done = completed + failed;
    enrichAllButton.textContent = `Enriching… ${done}/${total}`;
    enrichAllButton.disabled = true;
  } else {
    const unenrichedCount = state.catalog.items.filter((item) => !item.enrichedMetadata).length;
    enrichAllButton.textContent = unenrichedCount > 0
      ? `Fetch metadata (${unenrichedCount})`
      : "Re-fetch metadata";
    enrichAllButton.disabled = state.isBusy || Boolean(state.fatalError);
  }
}

function renderItemList(filteredItems: CatalogItem[]): void {
  itemList.replaceChildren();

  for (const item of filteredItems) {
    const row = document.createElement("li");
    row.className = "item-list__row";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "item-card";
    button.dataset.selected = String(item.videoId === state.selectedVideoId);
    button.addEventListener("click", () => {
      updateSelectedVideoId(item.videoId);
      render();
    });

    const title = document.createElement("span");
    title.className = "item-card__title";
    title.textContent = item.video.title;

    const channel = document.createElement("span");
    channel.className = "item-card__meta";
    channel.textContent = item.video.channelName;

    const metadata = document.createElement("span");
    metadata.className = "item-card__meta item-card__meta--inline";
    metadata.textContent = [
      item.video.durationText ?? "Duration unknown",
      `Imported ${formatDateTime(item.lastImportedAt)}`
    ].join(" • ");

    button.append(title, channel, metadata);
    row.append(button);
    itemList.append(row);
  }
}

function renderListStates(filteredItems: CatalogItem[]): void {
  const hasItems = state.catalog.items.length > 0;
  const hasFilteredItems = filteredItems.length > 0;

  emptyState.hidden = hasItems;
  itemList.hidden = !hasFilteredItems;
  noResultsState.hidden = !hasItems || hasFilteredItems;
  clearFiltersButton.hidden = !hasItems;

  if (!hasItems) {
    listSummary.textContent = "Use the popup to save a Watch Later snapshot, or import an existing snapshot file.";
    return;
  }

  listSummary.textContent = hasFilteredItems
    ? `Showing ${filteredItems.length} of ${state.catalog.items.length} items.`
    : "No items match the current search and filters.";
}

function createDetailField(label: string, value: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "detail-field";

  const labelElement = document.createElement("dt");
  labelElement.textContent = label;

  const valueElement = document.createElement("dd");
  valueElement.textContent = value;

  wrapper.append(labelElement, valueElement);
  return wrapper;
}

function getItemImportHistory(item: CatalogItem): SnapshotImportRecord[] {
  const fingerprints = new Set(item.sourceSnapshotFingerprints);
  return state.catalog.imports.filter((entry) => fingerprints.has(entry.fingerprint));
}

function renderDetailPanel(selectedItem: CatalogItem | undefined): void {
  detailPanel.replaceChildren();

  if (!selectedItem) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "detail-empty";
    emptyMessage.textContent = state.catalog.items.length === 0
      ? "Import a snapshot to inspect titles, channels, and import history here."
      : "Select a catalog item to inspect the saved details.";
    detailPanel.append(emptyMessage);
    return;
  }

  const header = document.createElement("div");
  header.className = "detail-header";

  if (selectedItem.video.thumbnailUrl) {
    const image = document.createElement("img");
    image.className = "detail-header__thumbnail";
    image.alt = "Video thumbnail";
    image.src = selectedItem.video.thumbnailUrl;
    header.append(image);
  }

  const heading = document.createElement("div");
  heading.className = "detail-header__copy";

  const title = document.createElement("h2");
  title.textContent = selectedItem.video.title;

  const channel = document.createElement("p");
  channel.className = "detail-header__channel";
  channel.textContent = selectedItem.video.channelName;

  const actions = document.createElement("div");
  actions.className = "detail-header__actions";

  const youtubeLink = document.createElement("a");
  youtubeLink.className = "button button--primary button--link";
  youtubeLink.href = selectedItem.video.url;
  youtubeLink.rel = "noreferrer";
  youtubeLink.target = "_blank";
  youtubeLink.textContent = "Open on YouTube";

  const isEnrichingThis = state.enrichingVideoId === selectedItem.videoId;
  const enrichButton = document.createElement("button");
  enrichButton.type = "button";
  enrichButton.className = "button button--secondary";
  enrichButton.disabled = isEnrichingThis || Boolean(state.enrichProgress) || state.isBusy;
  enrichButton.textContent = isEnrichingThis
    ? "Fetching…"
    : selectedItem.enrichedMetadata
      ? "Re-fetch metadata"
      : "Fetch metadata";
  enrichButton.addEventListener("click", () => {
    void handleEnrichSingle(selectedItem).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Enrichment failed.";
      appendMessages([{ kind: "error", text: message }]);
      state.enrichingVideoId = undefined;
      render();
    });
  });

  actions.append(youtubeLink, enrichButton);
  heading.append(title, channel, actions);
  header.append(heading);

  const metadata = document.createElement("dl");
  metadata.className = "detail-fields";
  metadata.append(
    createDetailField("Duration", selectedItem.video.durationText ?? "Unknown"),
    createDetailField("Added on YouTube", selectedItem.video.dateAddedText ?? "Unknown"),
    createDetailField("First imported", formatDateTime(selectedItem.firstImportedAt)),
    createDetailField("Last imported", formatDateTime(selectedItem.lastImportedAt)),
    createDetailField("Snapshots", String(selectedItem.importCount)),
    createDetailField("Source playlists", selectedItem.sourcePlaylistTitles.join(", "))
  );

  if (selectedItem.enrichedMetadata) {
    const em = selectedItem.enrichedMetadata;
    const enrichedSection = document.createElement("section");
    enrichedSection.className = "detail-enriched";

    const enrichedTitle = document.createElement("h3");
    enrichedTitle.textContent = "Enriched metadata";

    const enrichedFields = document.createElement("dl");
    enrichedFields.className = "detail-fields";

    if (em.publishedAt) {
      enrichedFields.append(createDetailField("Published", em.publishedAt));
    }

    if (em.viewCount !== undefined) {
      enrichedFields.append(createDetailField("Views", em.viewCount.toLocaleString()));
    }

    if (em.availabilityStatus) {
      enrichedFields.append(createDetailField("Availability", em.availabilityStatus));
    }

    if (em.privacyStatus) {
      enrichedFields.append(createDetailField("Privacy", em.privacyStatus));
    }

    if (em.tags && em.tags.length > 0) {
      enrichedFields.append(createDetailField("Tags", em.tags.slice(0, 10).join(", ")));
    }

    enrichedFields.append(createDetailField("Fetched", formatDateTime(em.enrichedAt)));

    if (em.description) {
      const descWrapper = document.createElement("div");
      descWrapper.className = "detail-field detail-field--full";

      const descLabel = document.createElement("dt");
      descLabel.textContent = "Description";

      const descValue = document.createElement("dd");
      descValue.className = "detail-description";
      descValue.textContent = em.description.length > 500
        ? em.description.slice(0, 500) + "…"
        : em.description;

      descWrapper.append(descLabel, descValue);
      enrichedFields.append(descWrapper);
    }

    enrichedSection.append(enrichedTitle, enrichedFields);
    detailPanel.append(header, metadata, enrichedSection);
  } else {
    detailPanel.append(header, metadata);
  }

  const historySection = document.createElement("section");
  historySection.className = "detail-history";

  const historyTitle = document.createElement("h3");
  historyTitle.textContent = "Import history";

  const historyList = document.createElement("ul");
  historyList.className = "history-list";

  for (const importRecord of getItemImportHistory(selectedItem)) {
    const historyItem = document.createElement("li");
    historyItem.className = "history-list__item";

    const snapshotTitle = document.createElement("strong");
    snapshotTitle.textContent = importRecord.snapshot.playlistTitle;

    const historyMeta = document.createElement("span");
    historyMeta.className = "history-list__meta";
    historyMeta.textContent = [
      `Imported ${formatDateTime(importRecord.importedAt)}`,
      `Captured ${formatDateTime(importRecord.snapshot.capturedAt)}`,
      importRecord.sourceFileName
    ].join(" • ");

    historyItem.append(snapshotTitle, historyMeta);
    historyList.append(historyItem);
  }

  historySection.append(historyTitle, historyList);
  detailPanel.append(historySection);
}

function render(): void {
  renderSummary();
  renderMessages();
  setBusy(state.isBusy);
  renderEnrichAllButton();
  renderPlaylistFilterOptions();

  const filteredItems = getFilteredItems();
  const selectedItem = ensureSelectedItem(filteredItems);

  renderListStates(filteredItems);
  renderItemList(filteredItems);
  renderDetailPanel(selectedItem);
}

async function refreshCatalog(options?: { preserveMessages?: boolean }): Promise<void> {
  try {
    state.catalog = await loadCatalogStore();
    state.fatalError = undefined;
    if (!options?.preserveMessages) {
      setMessages([]);
    }
    render();
  } catch (error: unknown) {
    state.fatalError = error instanceof Error ? error.message : "Unable to load catalog storage.";
    render();
  }
}

async function handleImport(files: FileList): Promise<void> {
  const selectedFiles = Array.from(files);
  if (selectedFiles.length === 0 || state.fatalError) {
    return;
  }

  setBusy(true);
  const nextMessages: UiMessage[] = [];
  let nextCatalog = state.catalog;
  let didChangeCatalog = false;

  for (const file of selectedFiles) {
    let fileContents: string;

    try {
      fileContents = await file.text();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to read file.";
      nextMessages.push({ kind: "error", text: `${file.name}: ${message}` });
      continue;
    }

    let jsonValue: unknown;
    try {
      jsonValue = JSON.parse(fileContents) as unknown;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid JSON.";
      nextMessages.push({ kind: "error", text: `${file.name}: ${message}` });
      continue;
    }

    let snapshot: ReturnType<typeof parseWatchLaterSnapshot>;
    try {
      snapshot = parseWatchLaterSnapshot(jsonValue);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Snapshot validation failed.";
      nextMessages.push({ kind: "error", text: `${file.name}: ${message}` });
      continue;
    }

    const importResult = mergeSnapshotIntoCatalog(nextCatalog, snapshot, { sourceFileName: file.name });

    if (importResult.alreadyImported) {
      nextMessages.push({
        kind: "info",
        text: `${file.name}: snapshot already imported; existing catalog kept.`
      });
      continue;
    }

    nextCatalog = importResult.catalog;
    didChangeCatalog = true;
    nextMessages.push({
      kind: "success",
      text: `${file.name}: added ${importResult.addedItemCount} new items and matched ${importResult.duplicateItemCount} existing items.`
    });
  }

  if (didChangeCatalog) {
    try {
      await saveCatalogStore(nextCatalog);
      state.catalog = nextCatalog;
      state.fatalError = undefined;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to save catalog storage.";
      nextMessages.unshift({ kind: "error", text: message });
    }
  }

  fileInput.value = "";
  appendMessages(nextMessages);
  setBusy(false);
  render();
}

type WritableStreamLike = {
  write(data: string): Promise<void>;
  close(): Promise<void>;
};

type SaveFileHandleLike = {
  createWritable(): Promise<WritableStreamLike>;
};

type WindowWithSaveFilePicker = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<SaveFileHandleLike>;
};

function createExportFileName(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `watch-later-catalog-${timestamp}.json`;
}

async function trySaveWithFilePicker(fileName: string, contents: string): Promise<boolean> {
  const windowWithSavePicker = window as WindowWithSaveFilePicker;
  if (!windowWithSavePicker.showSaveFilePicker) {
    return false;
  }

  try {
    const fileHandle = await windowWithSavePicker.showSaveFilePicker({
      suggestedName: fileName,
      types: [{
        description: "JSON",
        accept: {
          "application/json": [".json"]
        }
      }]
    });
    const writable = await fileHandle.createWritable();
    await writable.write(contents);
    await writable.close();
    return true;
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return false;
    }

    throw error;
  }
}

async function tryCopyExportToClipboard(contents: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) {
    return false;
  }

  await navigator.clipboard.writeText(contents);
  return true;
}

async function handleExportSnapshots(): Promise<void> {
  if (state.catalog.items.length === 0) {
    appendMessages([{ kind: "info", text: "No catalog data available to export yet." }]);
    render();
    return;
  }

  setBusy(true);

  try {
    const fileName = createExportFileName();
    const contents = JSON.stringify(state.catalog, null, 2);
    const savedToFile = await trySaveWithFilePicker(fileName, contents);

    if (savedToFile) {
      appendMessages([{ kind: "success", text: `${fileName}: export saved.` }]);
      render();
      return;
    }

    const copiedToClipboard = await tryCopyExportToClipboard(contents);
    if (copiedToClipboard) {
      appendMessages([{
        kind: "info",
        text: `${fileName}: copied export JSON to clipboard. Paste into a local .json file to back it up.`
      }]);
      render();
      return;
    }

    appendMessages([{
      kind: "error",
      text: "Unable to export automatically in this browser. Clipboard access is unavailable."
    }]);
    render();
  } finally {
    setBusy(false);
    render();
  }
}

let enrichQueue: string[] = [];

async function saveEnrichedMetadata(metadata: EnrichedVideoMetadata): Promise<void> {
  state.catalog = applyEnrichedMetadata(state.catalog, metadata.videoId, metadata);
  await saveCatalogStore(state.catalog);
}

async function handleEnrichSingle(item: CatalogItem): Promise<void> {
  state.enrichingVideoId = item.videoId;
  render();

  const result = await fetchVideoEnrichment(item.videoId);

  if (result.ok) {
    await saveEnrichedMetadata(result.metadata);
    appendMessages([{
      kind: "success",
      text: `${item.video.title}: metadata fetched.`
    }]);
  } else {
    appendMessages([{
      kind: "error",
      text: `${item.video.title}: ${result.message}`
    }]);
  }

  state.enrichingVideoId = undefined;
  render();
}

function cancelEnrichAll(): void {
  enrichQueue = [];
  const { completed, failed } = state.enrichProgress ?? { completed: 0, failed: 0 };
  state.enrichProgress = null;
  appendMessages([{
    kind: "info",
    text: `Enrichment cancelled. Fetched ${completed} items, ${failed} failed.`
  }]);
  render();
}

function scheduleNextEnrich(): void {
  setTimeout(() => {
    void processEnrichQueue();
  }, 1000);
}

async function processEnrichQueue(): Promise<void> {
  if (enrichQueue.length === 0) {
    const { completed, failed } = state.enrichProgress ?? { completed: 0, failed: 0 };
    state.enrichProgress = null;
    appendMessages([{
      kind: "success",
      text: `Enrichment complete: ${completed} fetched, ${failed} failed.`
    }]);
    render();
    return;
  }

  const videoId = enrichQueue.shift()!;
  const item = state.catalog.items.find((i) => i.videoId === videoId);
  if (!item) {
    scheduleNextEnrich();
    return;
  }

  const result = await fetchVideoEnrichment(videoId);

  if (result.ok) {
    await saveEnrichedMetadata(result.metadata);
    state.enrichProgress = {
      ...(state.enrichProgress ?? { total: 0, completed: 0, failed: 0 }),
      completed: (state.enrichProgress?.completed ?? 0) + 1
    };
  } else {
    state.enrichProgress = {
      ...(state.enrichProgress ?? { total: 0, completed: 0, failed: 0 }),
      failed: (state.enrichProgress?.failed ?? 0) + 1
    };
  }

  render();
  scheduleNextEnrich();
}

async function handleEnrichAll(): Promise<void> {
  if (state.catalog.items.length === 0) {
    appendMessages([{ kind: "info", text: "No catalog items to enrich." }]);
    render();
    return;
  }

  const unenriched = state.catalog.items.filter((item) => !item.enrichedMetadata);
  const toEnrich = unenriched.length > 0 ? unenriched : state.catalog.items;

  enrichQueue = toEnrich.map((item) => item.videoId);
  state.enrichProgress = { total: enrichQueue.length, completed: 0, failed: 0 };

  appendMessages([{
    kind: "info",
    text: `Starting metadata enrichment for ${enrichQueue.length} videos (about ${Math.ceil(enrichQueue.length / 60)} min).`
  }]);

  render();
  void processEnrichQueue();
}

fileInput.addEventListener("change", () => {
  const files = fileInput.files;
  if (!files) {
    return;
  }

  void handleImport(files).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Import failed.";
    appendMessages([{ kind: "error", text: message }]);
    setBusy(false);
    render();
  });
});

reloadButton.addEventListener("click", () => {
  void refreshCatalog({ preserveMessages: true }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unable to reload the catalog.";
    appendMessages([{ kind: "error", text: message }]);
  });
});

exportSnapshotsButton.addEventListener("click", () => {
  void handleExportSnapshots().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Export failed.";
    appendMessages([{ kind: "error", text: message }]);
    setBusy(false);
    render();
  });
});

enrichAllButton.addEventListener("click", () => {
  if (state.enrichProgress) {
    cancelEnrichAll();
    return;
  }

  void handleEnrichAll().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Enrichment failed.";
    appendMessages([{ kind: "error", text: message }]);
    state.enrichProgress = null;
    render();
  });
});

searchInput.addEventListener("input", () => {
  state.searchQuery = searchInput.value;
  render();
});

durationFilterSelect.addEventListener("change", () => {
  state.durationFilter = durationFilterSelect.value as DurationFilter;
  render();
});

recencyFilterSelect.addEventListener("change", () => {
  state.recencyFilter = recencyFilterSelect.value as RecencyFilter;
  render();
});

playlistFilterSelect.addEventListener("change", () => {
  state.playlistFilter = playlistFilterSelect.value;
  render();
});

sortOrderSelect.addEventListener("change", () => {
  state.sortOrder = sortOrderSelect.value as SortOrder;
  render();
});

clearFiltersButton.addEventListener("click", () => {
  resetFilters();
});

window.addEventListener("hashchange", () => {
  state.selectedVideoId = readSelectedVideoIdFromHash();
  render();
});

void (async () => {
  state.selectedVideoId = readSelectedVideoIdFromHash();
  await refreshCatalog();
})();
