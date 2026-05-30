import type { BackgroundResponse, ExportSnapshotResponse, PopupStateResponse } from "./messages.js";
import { browser } from "./browserApi.js";

const statusBadge = document.querySelector<HTMLElement>("[data-role='status-badge']");
const statusText = document.querySelector<HTMLElement>("[data-role='status-text']");
const hintText = document.querySelector<HTMLElement>("[data-role='hint-text']");
const exportButton = document.querySelector<HTMLButtonElement>("[data-role='export-button']");
const refreshButton = document.querySelector<HTMLButtonElement>("[data-role='refresh-button']");
const openCatalogButton = document.querySelector<HTMLButtonElement>("[data-role='open-catalog-button']");
const resultText = document.querySelector<HTMLElement>("[data-role='result-text']");

function setBusy(isBusy: boolean): void {
  if (exportButton) {
    exportButton.disabled = isBusy;
    exportButton.textContent = isBusy ? "Saving…" : "Save snapshot to catalog";
  }

  if (refreshButton) {
    refreshButton.disabled = isBusy;
  }

  if (openCatalogButton) {
    openCatalogButton.disabled = isBusy;
  }
}

function setStatus(state: PopupStateResponse): void {
  if (statusBadge) {
    statusBadge.textContent = state.isWatchLaterPage ? "Ready" : "Wrong page";
    statusBadge.dataset.state = state.isWatchLaterPage ? "ready" : "warning";
  }

  if (statusText) {
    statusText.textContent = state.message;
  }

  if (hintText) {
    hintText.textContent = state.isWatchLaterPage
      ? "Saves the videos currently loaded on the page to your local catalog. Scroll first if you want more items included."
      : "Switch the active tab to your Watch Later playlist, then refresh this popup.";
  }

  if (exportButton) {
    exportButton.disabled = !state.canExport;
  }
}

function setResult(message: string, isError = false): void {
  if (!resultText) {
    return;
  }

  resultText.textContent = message;
  resultText.dataset.state = isError ? "error" : "success";
}

function sendMessage<T extends BackgroundResponse>(message: { type: string }): Promise<T> {
  return browser.runtime.sendMessage<T>(message)
    .then((response) => {
      if (!response) {
        throw new Error("No response received from the extension.");
      }

      return response;
    });
}

async function refreshState(): Promise<void> {
  const state = await sendMessage<PopupStateResponse>({ type: "popup/get-state" });
  setStatus(state);
}

async function handleExport(): Promise<void> {
  setBusy(true);
  setResult("Scanning and saving to your local catalog…");

  try {
    const result = await sendMessage<ExportSnapshotResponse>({ type: "popup/export-snapshot" });
    setResult(result.message, !result.ok);
    await refreshState();
  } finally {
    setBusy(false);
  }
}

async function openCatalogPage(): Promise<void> {
  await browser.tabs.create({
    active: true,
    url: browser.runtime.getURL("catalog.html")
  });
  setResult("Opened the local catalog manager.");
}

refreshButton?.addEventListener("click", () => {
  void refreshState().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unable to refresh extension state.";
    setResult(message, true);
  });
});

exportButton?.addEventListener("click", () => {
  void handleExport().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Export failed.";
    setResult(message, true);
    setBusy(false);
  });
});

openCatalogButton?.addEventListener("click", () => {
  void openCatalogPage().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unable to open the catalog manager.";
    setResult(message, true);
  });
});

void refreshState().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unable to load extension state.";
  setResult(message, true);
});
