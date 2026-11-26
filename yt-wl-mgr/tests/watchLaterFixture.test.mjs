import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { normalizeWatchLaterSnapshot } from "../packages/core/src/index.ts";
import { loadWatchLaterFixtureFromHtmlFile } from "./helpers/watchLaterFixture.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(here, "data", "playlist.html");

test("playlist html fixture produces a representative watch-later snapshot", () => {
  const scan = loadWatchLaterFixtureFromHtmlFile(fixturePath);
  const snapshot = normalizeWatchLaterSnapshot(scan);

  assert.equal(scan.pageUrl, "https://www.youtube.com/playlist?list=WL");
  assert.equal(scan.pageTitle, "Watch later - YouTube");
  assert.equal(scan.playlistId, "WL");
  assert.equal(scan.playlistTitle, "Watch later");
  assert.equal(scan.items.length, 3);

  assert.deepEqual(scan.items[0], {
    videoId: "dQw4w9WgXcQ",
    title: "Intro to Bloom Filters",
    channelName: "Example CS Channel",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=WL&index=1",
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    durationText: "12:34",
    dateAddedText: "2 years ago"
  });

  assert.deepEqual(scan.items[1], {
    videoId: "9bZkp7q19f0",
    title: "Systems Programming in 30 Minutes",
    channelName: "Systems Lab",
    url: "https://www.youtube.com/watch?v=9bZkp7q19f0&list=WL&index=2",
    thumbnailUrl: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    durationText: "30:15",
    dateAddedText: "1 year ago"
  });

  assert.equal(snapshot.itemCount, 3);
  assert.equal(snapshot.duplicateCount, 0);
});
