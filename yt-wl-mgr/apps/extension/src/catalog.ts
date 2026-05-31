import {
  applyEnrichedMetadata,
  createCatalogItemSearchIndex,
  createEmptyCatalogStore,
  deriveCatalogItemInsights,
  getDurationBucket,
  getCatalogItemTags,
  matchesImportRecency,
  mergeSnapshotIntoCatalog,
  parseWatchLaterSnapshot,
  removeCatalogItem,
  type CatalogItemInsights,
  type CatalogDurationBucket,
  type CatalogImportRecency,
  type CatalogItem,
  type CatalogSuggestedCategory,
  type CatalogSuggestedPriority,
  type CatalogStore,
  type CatalogWatchFit,
  type EnrichedVideoMetadata,
  type SnapshotImportRecord
} from "../../../packages/core/src/index.js";
import { loadCatalogStore, saveCatalogStore } from "./catalogStorage.js";
import { fetchVideoEnrichment } from "./videoEnrichment.js";

type DurationFilter = CatalogDurationBucket | "all";
type RecencyFilter = CatalogImportRecency;
type PlaylistFilter = "all" | string;
type TagFilter = "all" | string;
type CategoryFilter = CatalogSuggestedCategory | "all";
type PriorityFilter = CatalogSuggestedPriority | "all";
type SortOrder = "recent" | "oldest" | "title" | "channel" | "import-count" | "priority";
type MessageKind = "success" | "error" | "info";

type UiMessage = {
  kind: MessageKind;
  text: string;
};

type CatalogItemViewModel = {
  item: CatalogItem;
  insights: CatalogItemInsights;
  searchIndex: string;
  normalizedTags: string[];
  displayTags: string[];
  previewText: string;
  durationBucket: CatalogDurationBucket;
  lastImportedLabel: string;
  secondaryMetaText: string;
};

type TagOption = {
  value: string;
  label: string;
  count: number;
};

type EnrichProgress = {
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  startedAt: string;
};

type CatalogPageState = {
  catalog: CatalogStore;
  searchQuery: string;
  durationFilter: DurationFilter;
  recencyFilter: RecencyFilter;
  playlistFilter: PlaylistFilter;
  tagFilter: TagFilter;
  categoryFilter: CategoryFilter;
  priorityFilter: PriorityFilter;
  sortOrder: SortOrder;
  selectedVideoId: string | undefined;
  isBusy: boolean;
  messages: UiMessage[];
  fatalError: string | undefined;
  itemViewModels: CatalogItemViewModel[];
  playlistOptions: string[];
  tagOptions: TagOption[];
  enrichProgress: EnrichProgress | null;
  enrichingVideoId: string | undefined;
  searchDebounceHandle: number | undefined;
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
const tagFilterSelect = requireElement<HTMLSelectElement>("[data-role='tag-filter']");
const categoryFilterSelect = requireElement<HTMLSelectElement>("[data-role='category-filter']");
const priorityFilterSelect = requireElement<HTMLSelectElement>("[data-role='priority-filter']");
const sortOrderSelect = requireElement<HTMLSelectElement>("[data-role='sort-order']");
const clearFiltersButton = requireElement<HTMLButtonElement>("[data-role='clear-filters']");
const statusPanel = requireElement<HTMLElement>("[data-role='status-panel']");
const totalItemsValue = requireElement<HTMLElement>("[data-role='total-items']");
const totalImportsValue = requireElement<HTMLElement>("[data-role='total-imports']");
const updatedAtValue = requireElement<HTMLElement>("[data-role='updated-at']");
const listSummary = requireElement<HTMLElement>("[data-role='list-summary']");
const emptyState = requireElement<HTMLElement>("[data-role='empty-state']");
const noResultsState = requireElement<HTMLElement>("[data-role='no-results-state']");
const activeFilters = requireElement<HTMLElement>("[data-role='active-filters']");
const itemList = requireElement<HTMLUListElement>("[data-role='item-list']");
const detailPanel = requireElement<HTMLElement>("[data-role='detail-panel']");

const enrichFreshnessMs = 24 * 60 * 60 * 1000;
const bulkEnrichConcurrency = 4;
const bulkEnrichSaveEvery = 10;

const categoryLabels: Record<CatalogSuggestedCategory, string> = {
  educational: "Educational",
  practical: "Practical / how-to",
  "news-analysis": "News & analysis",
  "podcast-talk": "Podcast / talk",
  "music-performance": "Music / performance",
  entertainment: "Entertainment",
  uncategorized: "Uncategorized"
};

const priorityLabels: Record<CatalogSuggestedPriority, string> = {
  do: "Do",
  decide: "Decide",
  delete: "Delete"
};

const watchFitLabels: Record<CatalogWatchFit, string> = {
  "quick-hit": "Quick hit",
  "meal-friendly": "Meal-friendly",
  "deep-focus": "Deep focus"
};

const durationFilterLabels: Record<Exclude<DurationFilter, "all">, string> = {
  short: "Short",
  medium: "Medium",
  long: "Long",
  unknown: "Unknown duration"
};

const recencyFilterLabels: Record<Exclude<RecencyFilter, "all">, string> = {
  "7d": "Imported in 7 days",
  "30d": "Imported in 30 days",
  older: "Imported over 30 days ago"
};

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short"
});

const initialState: CatalogPageState = {
  catalog: createEmptyCatalogStore(),
  searchQuery: "",
  durationFilter: "all",
  recencyFilter: "all",
  playlistFilter: "all",
  tagFilter: "all",
  categoryFilter: "all",
  priorityFilter: "all",
  sortOrder: "recent",
  selectedVideoId: undefined,
  isBusy: false,
  messages: [],
  fatalError: undefined,
  itemViewModels: [],
  playlistOptions: [],
  tagOptions: [],
  enrichProgress: null,
  enrichingVideoId: undefined,
  searchDebounceHandle: undefined
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

  return dateTimeFormatter.format(new Date(timestamp));
}

function isRecentlyEnriched(item: CatalogItem, now = Date.now()): boolean {
  const enrichedAt = item.enrichedMetadata?.enrichedAt;
  if (!enrichedAt) {
    return false;
  }

  const enrichedTime = Date.parse(enrichedAt);
  if (Number.isNaN(enrichedTime)) {
    return false;
  }

  return (now - enrichedTime) < enrichFreshnessMs;
}

function getBulkEnrichmentCandidates(now = Date.now()): CatalogItem[] {
  return state.catalog.items.filter((item) => !isRecentlyEnriched(item, now));
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
  enrichAllButton.disabled = isBusy || Boolean(state.fatalError);
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

function normalizeSearchQuery(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function rebuildDerivedCatalogData(): void {
  const playlistOptions = new Set<string>();
  const tagCounts = new Map<string, TagOption>();

  state.itemViewModels = state.catalog.items.map((item) => {
    for (const playlistTitle of item.sourcePlaylistTitles) {
      playlistOptions.add(playlistTitle);
    }

    const displayTags = getCatalogItemTags(item);
    const normalizedTags = displayTags.map((tag) => tag.toLocaleLowerCase());
    for (let index = 0; index < displayTags.length; index += 1) {
      const label = displayTags[index];
      const value = normalizedTags[index];
      if (!label || !value) {
        continue;
      }

      const existing = tagCounts.get(value);
      if (existing) {
        existing.count += 1;
      } else {
        tagCounts.set(value, { value, label, count: 1 });
      }
    }

    return {
      item,
      insights: deriveCatalogItemInsights(item),
      searchIndex: createCatalogItemSearchIndex(item),
      normalizedTags,
      displayTags,
      previewText: getItemPreviewText(item),
      durationBucket: getDurationBucket(item.video.durationText),
      lastImportedLabel: `Imported ${formatDateTime(item.lastImportedAt)}`,
      secondaryMetaText: [
        item.sourcePlaylistTitles[0] ?? "Watch Later",
        item.importCount === 1 ? "1 snapshot" : `${item.importCount} snapshots`
      ].join(" • ")
    };
  });

  state.playlistOptions = Array.from(playlistOptions).sort((left, right) => left.localeCompare(right));
  state.tagOptions = Array.from(tagCounts.values()).sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.label.localeCompare(right.label);
  });

  if (state.playlistFilter !== "all" && !state.playlistOptions.includes(state.playlistFilter)) {
    state.playlistFilter = "all";
  }

  if (state.tagFilter !== "all" && !state.tagOptions.some((option) => option.value === state.tagFilter)) {
    state.tagFilter = "all";
  }

  renderPlaylistFilterOptions();
  renderTagFilterOptions();
}

function resetFilters(): void {
  if (state.searchDebounceHandle !== undefined) {
    window.clearTimeout(state.searchDebounceHandle);
    state.searchDebounceHandle = undefined;
  }

  state.searchQuery = "";
  state.durationFilter = "all";
  state.recencyFilter = "all";
  state.playlistFilter = "all";
  state.tagFilter = "all";
  state.categoryFilter = "all";
  state.priorityFilter = "all";
  state.sortOrder = "recent";
  searchInput.value = "";
  durationFilterSelect.value = "all";
  recencyFilterSelect.value = "all";
  playlistFilterSelect.value = "all";
  tagFilterSelect.value = "all";
  categoryFilterSelect.value = "all";
  priorityFilterSelect.value = "all";
  sortOrderSelect.value = "recent";
  render();
}

function scheduleSearchRender(): void {
  if (state.searchDebounceHandle !== undefined) {
    window.clearTimeout(state.searchDebounceHandle);
  }

  state.searchDebounceHandle = window.setTimeout(() => {
    state.searchDebounceHandle = undefined;
    render();
  }, 120);
}

function sortCatalogItems(items: CatalogItemViewModel[]): CatalogItemViewModel[] {
  const nextItems = [...items];

  if (state.sortOrder === "recent") {
    return nextItems.sort((left, right) => right.item.lastImportedAt.localeCompare(left.item.lastImportedAt));
  }

  if (state.sortOrder === "oldest") {
    return nextItems.sort((left, right) => left.item.lastImportedAt.localeCompare(right.item.lastImportedAt));
  }

  if (state.sortOrder === "title") {
    return nextItems.sort((left, right) => left.item.video.title.localeCompare(right.item.video.title));
  }

  if (state.sortOrder === "channel") {
    return nextItems.sort((left, right) => left.item.video.channelName.localeCompare(right.item.video.channelName));
  }

  if (state.sortOrder === "priority") {
    return nextItems.sort((left, right) => {
      if (right.insights.priorityScore !== left.insights.priorityScore) {
        return right.insights.priorityScore - left.insights.priorityScore;
      }

      return right.item.lastImportedAt.localeCompare(left.item.lastImportedAt);
    });
  }

  return nextItems.sort((left, right) => right.item.importCount - left.item.importCount);
}

function getFilteredItems(): CatalogItemViewModel[] {
  const searchTokens = normalizeSearchQuery(state.searchQuery);

  const filteredItems = state.itemViewModels.filter((viewModel) => {
    const { item, insights, normalizedTags, durationBucket, searchIndex } = viewModel;
    const matchesQuery = searchTokens.length === 0
      || searchTokens.every((token) => searchIndex.includes(token));
    const matchesDuration = state.durationFilter === "all"
      || durationBucket === state.durationFilter;
    const matchesRecency = matchesImportRecency(item.lastImportedAt, state.recencyFilter);
    const matchesPlaylist = state.playlistFilter === "all"
      || item.sourcePlaylistTitles.includes(state.playlistFilter);
    const matchesTag = state.tagFilter === "all"
      || normalizedTags.includes(state.tagFilter);
    const matchesCategory = state.categoryFilter === "all"
      || insights.category === state.categoryFilter;
    const matchesPriority = state.priorityFilter === "all"
      || insights.priority === state.priorityFilter;

    return matchesQuery && matchesDuration && matchesRecency && matchesPlaylist && matchesTag && matchesCategory && matchesPriority;
  });

  return sortCatalogItems(filteredItems);
}

function renderPlaylistFilterOptions(): void {
  playlistFilterSelect.replaceChildren();

  const anyPlaylistOption = document.createElement("option");
  anyPlaylistOption.value = "all";
  anyPlaylistOption.textContent = "Any playlist";
  playlistFilterSelect.append(anyPlaylistOption);

  for (const playlistTitle of state.playlistOptions) {
    const option = document.createElement("option");
    option.value = playlistTitle;
    option.textContent = playlistTitle;
    playlistFilterSelect.append(option);
  }

  playlistFilterSelect.value = state.playlistFilter;
}

function renderTagFilterOptions(): void {
  tagFilterSelect.replaceChildren();

  const anyTagOption = document.createElement("option");
  anyTagOption.value = "all";
  anyTagOption.textContent = "Any tag";
  tagFilterSelect.append(anyTagOption);

  for (const value of state.tagOptions) {
    const option = document.createElement("option");
    option.value = value.value;
    option.textContent = `${value.label} (${value.count})`;
    tagFilterSelect.append(option);
  }

  tagFilterSelect.value = state.tagFilter;
}

function getActiveFilterLabels(): string[] {
  const labels: string[] = [];
  const trimmedSearch = state.searchQuery.trim();
  if (trimmedSearch) {
    labels.push(`Search: "${trimmedSearch}"`);
  }

  if (state.durationFilter !== "all") {
    labels.push(durationFilterLabels[state.durationFilter]);
  }

  if (state.recencyFilter !== "all") {
    labels.push(recencyFilterLabels[state.recencyFilter]);
  }

  if (state.playlistFilter !== "all") {
    labels.push(`Playlist: ${state.playlistFilter}`);
  }

  if (state.tagFilter !== "all") {
    const tagLabel = state.tagOptions.find((option) => option.value === state.tagFilter)?.label ?? state.tagFilter;
    labels.push(`Tag: ${tagLabel}`);
  }

  if (state.categoryFilter !== "all") {
    labels.push(`Category: ${categoryLabels[state.categoryFilter]}`);
  }

  if (state.priorityFilter !== "all") {
    labels.push(`Priority: ${priorityLabels[state.priorityFilter]}`);
  }

  return labels;
}

function renderActiveFilters(): void {
  const labels = getActiveFilterLabels();
  activeFilters.replaceChildren();
  activeFilters.hidden = labels.length === 0;

  for (const label of labels) {
    const pill = document.createElement("span");
    pill.className = "active-filters__pill";
    pill.textContent = label;
    activeFilters.append(pill);
  }
}

function ensureSelectedItem(filteredItems: CatalogItemViewModel[]): CatalogItemViewModel | undefined {
  const existingSelection = filteredItems.find((item) => item.item.videoId === state.selectedVideoId);
  if (existingSelection) {
    return existingSelection;
  }

  const hashSelection = readSelectedVideoIdFromHash();
  const selectedFromHash = filteredItems.find((item) => item.item.videoId === hashSelection);
  if (selectedFromHash) {
    updateSelectedVideoId(selectedFromHash.item.videoId);
    return selectedFromHash;
  }

  const fallbackSelection = filteredItems[0];
  updateSelectedVideoId(fallbackSelection?.item.videoId);
  return fallbackSelection;
}

function renderSummary(): void {
  totalItemsValue.textContent = String(state.catalog.items.length);
  totalImportsValue.textContent = String(state.catalog.imports.length);
  updatedAtValue.textContent = state.catalog.imports.length > 0 ? formatDateTime(state.catalog.updatedAt) : "Not yet imported";
}

function renderEnrichAllButton(): void {
  if (state.enrichProgress) {
    const { completed, failed, skipped, total } = state.enrichProgress;
    const done = completed + failed;
    enrichAllButton.textContent = `Cancel enrichment (${done}/${total}, ${skipped} skipped)`;
    enrichAllButton.disabled = false;
  } else {
    const staleCount = getBulkEnrichmentCandidates().length;
    enrichAllButton.textContent = staleCount > 0
      ? `Fetch stale metadata (${staleCount})`
      : "All metadata fresh";
    enrichAllButton.disabled = state.isBusy || Boolean(state.fatalError);
  }
}

function renderItemList(filteredItems: CatalogItemViewModel[]): void {
  itemList.replaceChildren();
  const fragment = document.createDocumentFragment();

  for (const viewModel of filteredItems) {
    const { item, insights } = viewModel;
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

    const layout = document.createElement("div");
    layout.className = "item-card__layout";

    let thumbnailElement: HTMLElement;
    if (item.video.thumbnailUrl) {
      const thumbnail = document.createElement("img");
      thumbnail.className = "item-card__thumbnail";
      thumbnail.src = item.video.thumbnailUrl;
      thumbnail.alt = "";
      thumbnailElement = thumbnail;
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "item-card__thumbnail item-card__thumbnail--placeholder";
      placeholder.textContent = "YT";
      thumbnailElement = placeholder;
    }

    const content = document.createElement("div");
    content.className = "item-card__content";

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
      viewModel.lastImportedLabel
    ].join(" • ");

    const secondaryMeta = document.createElement("span");
    secondaryMeta.className = "item-card__meta item-card__meta--inline";
    secondaryMeta.textContent = viewModel.secondaryMetaText;

    const snippet = document.createElement("span");
    snippet.className = "item-card__snippet";
    snippet.textContent = viewModel.previewText;

    const badges = document.createElement("div");
    badges.className = "item-card__badges";
    badges.append(
      createBadge("priority", priorityLabels[insights.priority], insights.priority),
      createBadge("category", categoryLabels[insights.category]),
      createBadge("watch-fit", watchFitLabels[insights.watchFit])
    );

    content.append(title, channel, badges, snippet);

    const tags = viewModel.displayTags.slice(0, 3);
    if (tags.length > 0) {
      const tagList = document.createElement("div");
      tagList.className = "item-card__tags";
      for (const tag of tags) {
        tagList.append(createTagPill(tag));
      }
      content.append(tagList);
    }

    content.append(metadata, secondaryMeta);
    layout.append(thumbnailElement, content);
    button.append(layout);
    row.append(button);
    fragment.append(row);
  }

  itemList.append(fragment);
}

function renderListStates(filteredItems: CatalogItemViewModel[]): void {
  const hasItems = state.catalog.items.length > 0;
  const hasFilteredItems = filteredItems.length > 0;
  const activeFilterCount = getActiveFilterLabels().length;

  emptyState.hidden = hasItems;
  itemList.hidden = !hasFilteredItems;
  noResultsState.hidden = !hasItems || hasFilteredItems;
  clearFiltersButton.hidden = !hasItems || activeFilterCount === 0;

  if (!hasItems) {
    listSummary.textContent = "Use the popup to save a Watch Later snapshot, or import an existing snapshot file.";
    return;
  }

  listSummary.textContent = hasFilteredItems
    ? activeFilterCount > 0
      ? `Showing ${filteredItems.length} of ${state.catalog.items.length} items with ${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}.`
      : `Showing ${filteredItems.length} items.`
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

function createBadge(kind: "priority" | "category" | "watch-fit", text: string, tone?: string): HTMLElement {
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.dataset.kind = kind;
  if (tone) {
    badge.dataset.tone = tone;
  }
  badge.textContent = text;
  return badge;
}

function createTagPill(text: string): HTMLElement {
  const pill = document.createElement("span");
  pill.className = "item-card__tag";
  pill.textContent = text;
  return pill;
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function getItemPreviewText(item: CatalogItem): string {
  const description = item.enrichedMetadata?.description
    ?.replace(/\s+/g, " ")
    .trim();
  if (description) {
    return truncateText(description, 150);
  }

  const tags = getCatalogItemTags(item);
  if (tags.length > 0) {
    return `Tags: ${tags.slice(0, 4).join(" • ")}`;
  }

  return item.importCount > 1
    ? `Seen in ${item.importCount} imported snapshots from ${item.sourcePlaylistTitles[0] ?? "Watch Later"}.`
    : `Saved from ${item.sourcePlaylistTitles[0] ?? "Watch Later"}.`;
}

function getItemImportHistory(item: CatalogItem): SnapshotImportRecord[] {
  const fingerprints = new Set(item.sourceSnapshotFingerprints);
  return state.catalog.imports.filter((entry) => fingerprints.has(entry.fingerprint));
}

function renderDetailPanel(selectedItem: CatalogItemViewModel | undefined): void {
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

  const item = selectedItem.item;
  const insights = selectedItem.insights;

  const header = document.createElement("div");
  header.className = "detail-header";

  if (item.video.thumbnailUrl) {
    const image = document.createElement("img");
    image.className = "detail-header__thumbnail";
    image.alt = "Video thumbnail";
    image.src = item.video.thumbnailUrl;
    header.append(image);
  }

  const heading = document.createElement("div");
  heading.className = "detail-header__copy";

  const title = document.createElement("h2");
  title.textContent = item.video.title;

  const channel = document.createElement("p");
  channel.className = "detail-header__channel";
  channel.textContent = item.video.channelName;

  const actions = document.createElement("div");
  actions.className = "detail-header__actions";

  const youtubeLink = document.createElement("a");
  youtubeLink.className = "button button--primary button--link";
  youtubeLink.href = item.video.url;
  youtubeLink.rel = "noreferrer";
  youtubeLink.target = "_blank";
  youtubeLink.textContent = "Open on YouTube";

  const isEnrichingThis = state.enrichingVideoId === item.videoId;
  const enrichButton = document.createElement("button");
  enrichButton.type = "button";
  enrichButton.className = "button button--secondary";
  enrichButton.disabled = isEnrichingThis || Boolean(state.enrichProgress) || state.isBusy;
  enrichButton.textContent = isEnrichingThis
    ? "Fetching…"
    : item.enrichedMetadata
      ? "Re-fetch metadata"
      : "Fetch metadata";
  enrichButton.addEventListener("click", () => {
    void handleEnrichSingle(item).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Enrichment failed.";
      appendMessages([{ kind: "error", text: message }]);
      state.enrichingVideoId = undefined;
      render();
    });
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "button button--danger";
  deleteButton.disabled = isEnrichingThis || Boolean(state.enrichProgress) || state.isBusy;
  deleteButton.textContent = "Remove from catalog";
  deleteButton.addEventListener("click", () => {
    void handleDeleteItem(item);
  });

  actions.append(youtubeLink, enrichButton, deleteButton);
  heading.append(title, channel, actions);
  header.append(heading);
  const metadata = document.createElement("dl");
  metadata.className = "detail-fields";
  metadata.className = "detail-fields";
  metadata.append(
    createDetailField("Duration", item.video.durationText ?? "Unknown"),
    createDetailField("Added on YouTube", item.video.dateAddedText ?? "Unknown"),
    createDetailField("First imported", formatDateTime(item.firstImportedAt)),
    createDetailField("Last imported", formatDateTime(item.lastImportedAt)),
    createDetailField("Snapshots", String(item.importCount)),
    createDetailField("Source playlists", item.sourcePlaylistTitles.join(", ")),
    createDetailField("Suggested category", categoryLabels[insights.category]),
    createDetailField("Suggested priority", priorityLabels[insights.priority]),
    createDetailField("Watch fit", watchFitLabels[insights.watchFit]),
    createDetailField("Why", insights.reasons.join(" ") || "No strong metadata signals yet.")
  );

  if (item.enrichedMetadata) {
    const em = item.enrichedMetadata;
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

  for (const importRecord of getItemImportHistory(item)) {
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
  renderActiveFilters();

  const filteredItems = getFilteredItems();
  const selectedItem = ensureSelectedItem(filteredItems);

  renderListStates(filteredItems);
  renderItemList(filteredItems);
  renderDetailPanel(selectedItem);
}

async function handleDeleteItem(item: CatalogItem): Promise<void> {
  if (state.isBusy) {
    return;
  }

  const confirmed = window.confirm(`Remove "${item.video.title}" from the local yt-wl-mgr catalog?`);
  if (!confirmed) {
    return;
  }

  setBusy(true);

  try {
    const nextCatalog = removeCatalogItem(state.catalog, item.videoId);
    if (nextCatalog === state.catalog) {
      appendMessages([{ kind: "info", text: "That video is no longer present in the catalog." }]);
      render();
      return;
    }

    await saveCatalogStore(nextCatalog);
    state.catalog = nextCatalog;
    rebuildDerivedCatalogData();
    if (state.selectedVideoId === item.videoId) {
      updateSelectedVideoId(undefined);
    }
    state.fatalError = undefined;
    appendMessages([{ kind: "success", text: `Removed "${item.video.title}" from the local catalog.` }]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to remove the video from the catalog.";
    appendMessages([{ kind: "error", text: message }]);
  } finally {
    setBusy(false);
    render();
  }
}

async function refreshCatalog(options?: { preserveMessages?: boolean }): Promise<void> {
  try {
    state.catalog = await loadCatalogStore();
    rebuildDerivedCatalogData();
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
      rebuildDerivedCatalogData();
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

let activeEnrichRunId = 0;
let cancellingEnrichRunId: number | undefined;
const activeEnrichControllers = new Set<AbortController>();
let pendingEnrichmentSaveCount = 0;
let pendingCatalogSave = Promise.resolve();

function queueCatalogSave(force = false): Promise<void> {
  if (!force && pendingEnrichmentSaveCount < bulkEnrichSaveEvery) {
    return Promise.resolve();
  }

  const catalogSnapshot = state.catalog;
  pendingEnrichmentSaveCount = 0;
  pendingCatalogSave = pendingCatalogSave.then(() => saveCatalogStore(catalogSnapshot));
  return pendingCatalogSave;
}

async function saveEnrichedMetadata(metadata: EnrichedVideoMetadata, options?: { immediate?: boolean }): Promise<void> {
  state.catalog = applyEnrichedMetadata(state.catalog, metadata.videoId, metadata);
  rebuildDerivedCatalogData();
  pendingEnrichmentSaveCount += 1;
  await queueCatalogSave(options?.immediate ?? false);
}

async function flushCatalogSaves(): Promise<void> {
  await queueCatalogSave(true);
  await pendingCatalogSave;
}

function updateEnrichProgress(update: Partial<EnrichProgress>): void {
  if (!state.enrichProgress) {
    return;
  }

  state.enrichProgress = {
    ...state.enrichProgress,
    ...update
  };
}

async function handleEnrichSingle(item: CatalogItem): Promise<void> {
  state.enrichingVideoId = item.videoId;
  render();

  const result = await fetchVideoEnrichment(item.videoId);

  if (result.ok) {
    await saveEnrichedMetadata(result.metadata, { immediate: true });
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
  if (!state.enrichProgress) {
    return;
  }

  cancellingEnrichRunId = activeEnrichRunId;
  activeEnrichRunId += 1;

  for (const controller of activeEnrichControllers) {
    controller.abort();
  }

  activeEnrichControllers.clear();
  appendMessages([{ kind: "info", text: "Cancelling enrichment after the current batch finishes…" }]);
  render();
}

async function runEnrichWorker(runId: number, items: CatalogItem[], nextIndexRef: { value: number }): Promise<void> {
  while (activeEnrichRunId === runId) {
    const currentIndex = nextIndexRef.value;
    nextIndexRef.value += 1;

    const item = items[currentIndex];
    if (!item) {
      return;
    }

    const controller = new AbortController();
    activeEnrichControllers.add(controller);

    try {
      const result = await fetchVideoEnrichment(item.videoId, { signal: controller.signal });
      if (activeEnrichRunId !== runId) {
        return;
      }

      if (result.ok) {
        await saveEnrichedMetadata(result.metadata);
        updateEnrichProgress({
          completed: (state.enrichProgress?.completed ?? 0) + 1
        });
      } else {
        updateEnrichProgress({
          failed: (state.enrichProgress?.failed ?? 0) + 1
        });
      }
    } catch (error: unknown) {
      if (activeEnrichRunId !== runId) {
        return;
      }

      if (!(error instanceof DOMException && error.name === "AbortError")) {
        updateEnrichProgress({
          failed: (state.enrichProgress?.failed ?? 0) + 1
        });
      }
    } finally {
      activeEnrichControllers.delete(controller);
      render();
    }
  }
}

async function handleEnrichAll(): Promise<void> {
  if (state.catalog.items.length === 0) {
    appendMessages([{ kind: "info", text: "No catalog items to enrich." }]);
    render();
    return;
  }

  const now = Date.now();
  const toEnrich = getBulkEnrichmentCandidates(now);
  const skipped = state.catalog.items.length - toEnrich.length;

  if (toEnrich.length === 0) {
    appendMessages([{
      kind: "info",
      text: "All catalog items were enriched within the last 24 hours."
    }]);
    render();
    return;
  }

  const runId = activeEnrichRunId + 1;
  activeEnrichRunId = runId;
  cancellingEnrichRunId = undefined;
  state.enrichProgress = {
    total: toEnrich.length,
    completed: 0,
    failed: 0,
    skipped,
    startedAt: new Date().toISOString()
  };

  const workerCount = Math.min(bulkEnrichConcurrency, toEnrich.length);
  const nextIndexRef = { value: 0 };

  appendMessages([{
    kind: "info",
    text: `Starting metadata enrichment for ${toEnrich.length} stale videos with ${workerCount} parallel requests. Skipping ${skipped} fetched in the last 24 hours.`
  }]);
  render();

  await Promise.all(
    Array.from({ length: workerCount }, () => runEnrichWorker(runId, toEnrich, nextIndexRef))
  );
  await flushCatalogSaves();

  const progress = state.enrichProgress;
  const wasCancelled = cancellingEnrichRunId === runId;

  if (!progress) {
    return;
  }

  state.enrichProgress = null;
  cancellingEnrichRunId = undefined;

  appendMessages([{
    kind: wasCancelled ? "info" : "success",
    text: wasCancelled
      ? `Enrichment cancelled. Fetched ${progress.completed}, ${progress.failed} failed, ${progress.skipped} skipped as fresh.`
      : `Enrichment complete: ${progress.completed} fetched, ${progress.failed} failed, ${progress.skipped} skipped as fresh.`
  }]);
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
    activeEnrichRunId += 1;
    cancellingEnrichRunId = undefined;
    for (const controller of activeEnrichControllers) {
      controller.abort();
    }
    activeEnrichControllers.clear();
    state.enrichProgress = null;
    render();
  });
});

searchInput.addEventListener("input", () => {
  state.searchQuery = searchInput.value;
  scheduleSearchRender();
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

tagFilterSelect.addEventListener("change", () => {
  state.tagFilter = tagFilterSelect.value;
  render();
});

categoryFilterSelect.addEventListener("change", () => {
  state.categoryFilter = categoryFilterSelect.value as CategoryFilter;
  render();
});

priorityFilterSelect.addEventListener("change", () => {
  state.priorityFilter = priorityFilterSelect.value as PriorityFilter;
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
