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
  assert.equal(scan.items.length, 100);

  assert.deepEqual(scan.items[0], {
    videoId: "TzDhdvVg9_c",
    title: "Calculus at a Fifth Grade Level",
    channelName: "Lukey B. The Physics G",
    url: "https://www.youtube.com/watch?v=TzDhdvVg9_c&list=WL&index=1&pp=iAQBsAgC",
    thumbnailUrl: "https://i.ytimg.com/vi/TzDhdvVg9_c/hqdefault.jpg?sqp=-oaymwEjCNACELwBSFryq4qpAxUIARUAAAAAGAElAADIQj0AgKJDeAE=&rs=AOn4CLDIHjc0QNLs0EJXq1nQrpo_jFsY3w",
    durationText: "19:53",
    dateAddedText: "9 years ago"
  });

  assert.deepEqual(scan.items[1], {
    videoId: "rgaTLrZGlk0",
    title: "Learn music theory in half an hour.",
    channelName: "ANDREW HUANG",
    url: "https://www.youtube.com/watch?v=rgaTLrZGlk0&list=WL&index=2&pp=iAQBsAgC",
    thumbnailUrl: "https://i.ytimg.com/vi/rgaTLrZGlk0/hqdefault.jpg?sqp=-oaymwEjCNACELwBSFryq4qpAxUIARUAAAAAGAElAADIQj0AgKJDeAE=&rs=AOn4CLA79MBvFDwCEwuGmvYYBwGnNcvUSg",
    durationText: "31:36",
    dateAddedText: "6 years ago"
  });

  assert.equal(snapshot.itemCount, 100);
  assert.equal(snapshot.duplicateCount, 0);
});
