import {
  createEmptyCatalogStore,
  getDurationBucket,
  matchesImportRecency,
  mergeSnapshotIntoCatalog,
  parseWatchLaterSnapshot,
  type CatalogDurationBucket,
  type CatalogImportRecency,
  type CatalogItem,
  type CatalogStore,
  type SnapshotImportRecord
} from "../../../packages/core/src/index.js";
import { loadCatalogStore, saveCatalogStore } from "./catalogStorage.js";

type DurationFilter = CatalogDurationBucket | "all";
type RecencyFilter = CatalogImportRecency;
type MessageKind = "success" | "error" | "info";

type UiMessage = {
  kind: MessageKind;
  text: string;
};

type CatalogPageState = {
  catalog: CatalogStore;
  searchQuery: string;
  durationFilter: DurationFilter;
  recencyFilter: RecencyFilter;
  selectedVideoId: string | undefined;
  isBusy: boolean;
  messages: UiMessage[];
  fatalError: string | undefined;
};

const fileInput = requireElement<HTMLInputElement>("[data-role='file-input']");
const importButton = requireElement<HTMLLabelElement>("[data-role='import-button']");
const reloadButton = requireElement<HTMLButtonElement>("[data-role='reload-button']");
const searchInput = requireElement<HTMLInputElement>("[data-role='search-input']");
const durationFilterSelect = requireElement<HTMLSelectElement>("[data-role='duration-filter']");
const recencyFilterSelect = requireElement<HTMLSelectElement>("[data-role='recency-filter']");
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
  selectedVideoId: undefined,
  isBusy: false,
  messages: [],
  fatalError: undefined
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
  searchInput.value = "";
  durationFilterSelect.value = "all";
  recencyFilterSelect.value = "all";
  render();
}

function getFilteredItems(): CatalogItem[] {
  const normalizedQuery = state.searchQuery.trim().toLocaleLowerCase();

  return state.catalog.items.filter((item) => {
    const matchesQuery = normalizedQuery.length === 0
      || item.video.title.toLocaleLowerCase().includes(normalizedQuery)
      || item.video.channelName.toLocaleLowerCase().includes(normalizedQuery);
    const matchesDuration = state.durationFilter === "all"
      || getDurationBucket(item.video.durationText) === state.durationFilter;
    const matchesRecency = matchesImportRecency(item.lastImportedAt, state.recencyFilter);

    return matchesQuery && matchesDuration && matchesRecency;
  });
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

  actions.append(youtubeLink);
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
  detailPanel.append(header, metadata, historySection);
}

function render(): void {
  renderSummary();
  renderMessages();
  setBusy(state.isBusy);

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
