type PageScanResponse = import("../messages.js").PageScanResponse;
type WatchLaterPageScan = import("../messages.js").WatchLaterPageScan;
import type { WatchLaterVideo } from "../../../../packages/core/src/index.js";

const itemSelector = "ytd-playlist-video-renderer";

function toAbsoluteYoutubeUrl(pathname: string, origin: string): string {
  return new URL(pathname, origin).toString();
}

function readText(element: Element | null): string | undefined {
  const value = element?.textContent?.trim();
  return value ? value : undefined;
}

function extractVideoId(url: string, origin: string): string | undefined {
  const parsed = new URL(url, origin);
  const videoId = parsed.searchParams.get("v");
  return videoId ?? undefined;
}

export function isWatchLaterPage(url: URL): boolean {
  return url.hostname === "www.youtube.com"
    && url.pathname === "/playlist"
    && url.searchParams.get("list") === "WL";
}

export function readPlaylistTitle(document: Document): string {
  return readText(document.querySelector("#header-description h1"))
    ?? readText(document.querySelector("yt-formatted-string#title"))
    ?? "Watch Later";
}

export function createWatchLaterPageScan(
  pageUrl: URL,
  pageTitle: string,
  playlistTitle: string,
  items: WatchLaterVideo[],
  capturedAt = new Date().toISOString()
): WatchLaterPageScan {
  return {
    capturedAt,
    pageUrl: pageUrl.toString(),
    pageTitle,
    playlistId: pageUrl.searchParams.get("list") ?? "WL",
    playlistTitle,
    items
  };
}

export function extractWatchLaterVideosFromDocument(document: Document, pageUrl: URL): WatchLaterVideo[] {
  const items = Array.from(document.querySelectorAll(itemSelector));

  return items.flatMap((item) => {
    const titleLink = item.querySelector<HTMLAnchorElement>("#video-title");
    const thumbnail = item.querySelector<HTMLImageElement>("img");
    const channelLink = item.querySelector<HTMLAnchorElement>("a.yt-simple-endpoint.yt-formatted-string");
    const rawHref = titleLink?.getAttribute("href");

    if (!titleLink || !rawHref) {
      return [];
    }

    const url = toAbsoluteYoutubeUrl(rawHref, pageUrl.origin);
    const videoId = extractVideoId(url, pageUrl.origin);

    if (!videoId) {
      return [];
    }

    return [{
      videoId,
      title: readText(titleLink) ?? "Unknown title",
      channelName: readText(channelLink) ?? "Unknown channel",
      url,
      thumbnailUrl: thumbnail?.src,
      durationText: readText(item.querySelector("#text.ytd-thumbnail-overlay-time-status-renderer")),
      dateAddedText: readText(item.querySelector("#metadata-line span.inline-metadata-item:last-child"))
    }];
  });
}

export function snapshotWatchLaterPage(
  document: Document,
  locationHref: string,
  capturedAt = new Date().toISOString()
): WatchLaterPageScan {
  const pageUrl = new URL(locationHref);

  return createWatchLaterPageScan(
    pageUrl,
    document.title,
    readPlaylistTitle(document),
    extractWatchLaterVideosFromDocument(document, pageUrl),
    capturedAt
  );
}

export function buildWatchLaterPageScanResponse(document: Document, locationHref: string): PageScanResponse {
  const pageUrl = new URL(locationHref);

  if (!isWatchLaterPage(pageUrl)) {
    return {
      type: "watch-later/scan-result",
      ok: false,
      message: "Open your YouTube Watch Later playlist, then try exporting again."
    };
  }

  const scan = snapshotWatchLaterPage(document, locationHref);

  return {
    type: "watch-later/scan-result",
    ok: true,
    message: scan.items.length > 0
      ? `Found ${scan.items.length} videos on the current page.`
      : "No videos were detected on the current page yet. Scroll the playlist, then try again.",
    scan
  };
}
