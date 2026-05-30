import type { WatchLaterSnapshot, WatchLaterVideo } from "../../../packages/core/src/index.js";

export type PopupStateRequest = {
  type: "popup/get-state";
};

export type ExportSnapshotRequest = {
  type: "popup/export-snapshot";
};

export type BackgroundRequest = PopupStateRequest | ExportSnapshotRequest;

export type PopupStateResponse = {
  type: "popup/state";
  canExport: boolean;
  isWatchLaterPage: boolean;
  message: string;
  pageUrl?: string | undefined;
};

export type ExportSnapshotResponse = {
  type: "popup/export-result";
  ok: boolean;
  message: string;
  fileName?: string | undefined;
  itemCount?: number | undefined;
  duplicateCount?: number | undefined;
};

export type BackgroundResponse = PopupStateResponse | ExportSnapshotResponse;

export type WatchLaterPageScan = {
  capturedAt: string;
  pageUrl: string;
  pageTitle: string;
  playlistId: string;
  playlistTitle: string;
  items: WatchLaterVideo[];
};

export type PageScanRequest = {
  type: "watch-later/scan-page";
};

export type PageScanResponse = {
  type: "watch-later/scan-result";
  ok: boolean;
  message: string;
  scan?: WatchLaterPageScan;
};

export function isBackgroundRequest(value: unknown): value is BackgroundRequest {
  return Boolean(
    value
      && typeof value === "object"
      && "type" in value
      && (value.type === "popup/get-state" || value.type === "popup/export-snapshot")
  );
}

export function isPageScanRequest(value: unknown): value is PageScanRequest {
  return Boolean(value && typeof value === "object" && "type" in value && value.type === "watch-later/scan-page");
}

export function formatExportSummary(snapshot: WatchLaterSnapshot): string {
  if (snapshot.duplicateCount > 0) {
    return `Exported ${snapshot.itemCount} videos (${snapshot.duplicateCount} duplicates removed).`;
  }

  return `Exported ${snapshot.itemCount} videos.`;
}
