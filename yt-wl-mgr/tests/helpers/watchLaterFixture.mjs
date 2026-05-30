import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

import { createWatchLaterPageScan } from "../../apps/extension/src/content/watchLaterPage.ts";

const youtubeOrigin = "https://www.youtube.com";
const ytInitialDataMarker = "var ytInitialData = ";

function extractObjectLiteral(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Could not find ${marker}.`);
  }

  const objectStart = source.indexOf("{", markerIndex + marker.length);
  if (objectStart === -1) {
    throw new Error(`Could not find the ${marker} object literal start.`);
  }

  let depth = 0;
  let quote = undefined;
  let isEscaped = false;

  for (let index = objectStart; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (character === "\\") {
        isEscaped = true;
        continue;
      }

      if (character === quote) {
        quote = undefined;
      }

      continue;
    }

    if (character === "\"" || character === "'" || character === "`") {
      quote = character;
      continue;
    }

    if (character === "{") {
      depth += 1;
      continue;
    }

    if (character !== "}") {
      continue;
    }

    depth -= 1;
    if (depth === 0) {
      return source.slice(objectStart, index + 1);
    }
  }

  throw new Error(`Could not find the end of the ${marker} object literal.`);
}

function evaluateObjectLiteral(source) {
  // This only runs against a committed fixture checked into the repo.
  return runInNewContext(`(${source})`, Object.create(null), { timeout: 1000 });
}

function collectObjects(value, predicate, matches = []) {
  if (!value || typeof value !== "object") {
    return matches;
  }

  if (predicate(value)) {
    matches.push(value);
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      collectObjects(entry, predicate, matches);
    }

    return matches;
  }

  for (const nestedValue of Object.values(value)) {
    collectObjects(nestedValue, predicate, matches);
  }

  return matches;
}

function joinRunsText(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.runs)) {
    return undefined;
  }

  const text = value.runs
    .map((entry) => (entry && typeof entry === "object" && typeof entry.text === "string" ? entry.text : ""))
    .join("")
    .trim();

  return text || undefined;
}

function readLastRunText(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.runs)) {
    return undefined;
  }

  for (let index = value.runs.length - 1; index >= 0; index -= 1) {
    const entry = value.runs[index];
    if (entry && typeof entry === "object" && typeof entry.text === "string") {
      const text = entry.text.trim();
      if (text && text !== "•") {
        return text;
      }
    }
  }

  return undefined;
}

function readThumbnailUrl(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.thumbnails)) {
    return undefined;
  }

  for (let index = value.thumbnails.length - 1; index >= 0; index -= 1) {
    const thumbnail = value.thumbnails[index];
    if (thumbnail && typeof thumbnail === "object" && typeof thumbnail.url === "string") {
      return thumbnail.url;
    }
  }

  return undefined;
}

function toWatchLaterVideo(renderer) {
  const videoId = typeof renderer.videoId === "string" ? renderer.videoId : undefined;
  if (!videoId) {
    return undefined;
  }

  const relativeUrl = renderer.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url;
  const url = typeof relativeUrl === "string"
    ? new URL(relativeUrl, youtubeOrigin).toString()
    : new URL(`/watch?v=${videoId}`, youtubeOrigin).toString();

  return {
    videoId,
    title: joinRunsText(renderer.title) ?? "Unknown title",
    channelName: joinRunsText(renderer.shortBylineText) ?? "Unknown channel",
    url,
    thumbnailUrl: readThumbnailUrl(renderer.thumbnail),
    durationText: renderer.lengthText?.simpleText,
    dateAddedText: readLastRunText(renderer.videoInfo)
  };
}

function extractPlaylistRenderers(initialData) {
  return collectObjects(initialData, (value) => Object.hasOwn(value, "playlistVideoRenderer"))
    .map((value) => value.playlistVideoRenderer)
    .filter((value) => value && typeof value === "object");
}

function readPlaylistTitle(initialData) {
  const title = initialData?.metadata?.playlistMetadataRenderer?.title;
  return typeof title === "string" && title.trim() ? title.trim() : "Watch Later";
}

function readPageTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match?.[1]?.trim() || "YouTube";
}

export function loadWatchLaterFixtureFromHtmlFile(filePath) {
  const html = readFileSync(filePath, "utf8");
  const initialDataLiteral = extractObjectLiteral(html, ytInitialDataMarker);
  const initialData = evaluateObjectLiteral(initialDataLiteral);
  const playlistTitle = readPlaylistTitle(initialData);
  const playlistRenderers = extractPlaylistRenderers(initialData);
  const items = playlistRenderers.flatMap((renderer) => {
    const video = toWatchLaterVideo(renderer);
    return video ? [video] : [];
  });

  return createWatchLaterPageScan(
    new URL("/playlist?list=WL", youtubeOrigin),
    readPageTitle(html),
    playlistTitle,
    items,
    "2026-05-30T00:00:00.000Z"
  );
}
