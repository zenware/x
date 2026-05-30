import { isBackgroundRequest, type BackgroundResponse, type PageScanResponse, type PopupStateResponse } from "./messages.js";
import { mergeSnapshotIntoCatalog, normalizeWatchLaterSnapshot } from "../../../packages/core/src/index.js";
import { browser, type ExtensionTab } from "./browserApi.js";
import { loadCatalogStore, saveCatalogStore } from "./catalogStorage.js";

function isWatchLaterUrl(rawUrl: string | undefined): boolean {
  if (!rawUrl) {
    return false;
  }

  const url = new URL(rawUrl);
  return url.hostname === "www.youtube.com"
    && url.pathname === "/playlist"
    && url.searchParams.get("list") === "WL";
}

async function getActiveTab(): Promise<ExtensionTab | undefined> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function getPopupState(): Promise<PopupStateResponse> {
  const tab = await getActiveTab();
  const isWatchLaterPage = isWatchLaterUrl(tab?.url);

  if (!tab?.id || !isWatchLaterPage) {
    return {
      type: "popup/state",
      canExport: false,
      isWatchLaterPage: false,
      pageUrl: tab?.url,
      message: "Open youtube.com/playlist?list=WL in the current tab to export a snapshot."
    };
  }

  return {
    type: "popup/state",
    canExport: true,
    isWatchLaterPage: true,
    pageUrl: tab.url,
    message: "Ready to scan the current Watch Later page and save it to your local catalog."
  };
}

function stripThumbnailUrls(snapshot: ReturnType<typeof normalizeWatchLaterSnapshot>): ReturnType<typeof normalizeWatchLaterSnapshot> {
  return {
    ...snapshot,
    items: snapshot.items.map(({ thumbnailUrl: _thumbnailUrl, ...video }) => video)
  };
}

function buildPageScanFailure(message: string): PageScanResponse {
  return {
   type: "watch-later/scan-result",
   ok: false,
   message
  };
}

function sendPageScanRequest(tabId: number): Promise<PageScanResponse> {
  return browser.tabs.sendMessage<PageScanResponse>(tabId, {
   type: "watch-later/scan-page"
  })
   .then((response) => {
     if (!response) {
       return buildPageScanFailure("The Watch Later page did not return any scan data. Reload the tab, then try exporting again.");
     }

     return response;
   })
   .catch((error: unknown) => {
     const detail = error instanceof Error && error.message
       ? ` ${error.message}`
       : "";

     return buildPageScanFailure(`The Watch Later page script is unavailable. Reload the tab, then try exporting again.${detail}`);
   });
}

async function scanActiveWatchLaterPage(): Promise<PageScanResponse> {
  const tab = await getActiveTab();

  if (!tab?.id || !isWatchLaterUrl(tab.url)) {
   return buildPageScanFailure("Open your YouTube Watch Later playlist, then try exporting again.");
  }

  return sendPageScanRequest(tab.id);
}

async function exportSnapshot(): Promise<BackgroundResponse> {
  const scanResult = await scanActiveWatchLaterPage();

  if (!scanResult.ok || !scanResult.scan) {
    return {
      type: "popup/export-result",
      ok: false,
      message: scanResult.message
    };
  }

  const snapshot = stripThumbnailUrls(normalizeWatchLaterSnapshot(scanResult.scan));
  const timestamp = snapshot.capturedAt.replace(/[:.]/g, "-");
  const sourceFileName = `watch-later-${timestamp}.json`;

  try {
    const catalog = await loadCatalogStore();
    const mergeResult = mergeSnapshotIntoCatalog(catalog, snapshot, { sourceFileName });

    if (!mergeResult.alreadyImported) {
      await saveCatalogStore(mergeResult.catalog);
    }

    if (mergeResult.alreadyImported) {
      return {
        type: "popup/export-result",
        ok: true,
        message: "This snapshot is already in your local catalog."
      };
    }

    return {
      type: "popup/export-result",
      ok: true,
      message: `Saved to local catalog: ${mergeResult.addedItemCount} new videos, ${mergeResult.duplicateItemCount} already known.`,
      itemCount: snapshot.itemCount,
      duplicateCount: snapshot.duplicateCount
    };
  } catch (error: unknown) {
    const message = error instanceof Error
      ? error.message
      : "Saving to local catalog failed.";

    return {
      type: "popup/export-result",
      ok: false,
      message
    };
  }
}

browser.runtime.onInstalled.addListener(() => {
  console.info("yt-wl-mgr extension installed");
});

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isBackgroundRequest(message)) {
    return false;
  }

  const response = (async (): Promise<BackgroundResponse> => {
    if (message.type === "popup/get-state") {
      return getPopupState();
    }

    return exportSnapshot();
  })();

  response
    .then((result) => sendResponse(result))
    .catch((error: unknown) => {
      const fallbackMessage = error instanceof Error ? error.message : "Export failed.";
      sendResponse({
        type: "popup/export-result",
        ok: false,
        message: fallbackMessage
      });
    });

  return true;
});
