import assert from "node:assert/strict"
import test from "node:test"

import {
  createEmptyCatalogStore,
  deriveCatalogItemInsights,
  matchesCatalogItemQuery,
  removeCatalogItem
} from "../packages/core/src/index.ts"

function createCatalogItem(overrides = {}) {
  const { video: videoOverrides = {}, ...restOverrides } = overrides
  return {
    videoId: "video-1",
    video: {
      id: "video-1",
      title: "Untitled video",
      channelName: "Example Channel",
      url: "https://www.youtube.com/watch?v=video-1",
      durationText: undefined,
      dateAddedText: undefined,
      thumbnailUrl: undefined,
      ...videoOverrides
    },
    sourceSnapshotFingerprints: ["snapshot-1"],
    sourcePlaylistTitles: ["Watch Later"],
    firstImportedAt: "2026-01-01T00:00:00.000Z",
    lastImportedAt: "2026-01-01T00:00:00.000Z",
    importCount: 1,
    enrichedMetadata: undefined,
    ...restOverrides
  }
}

test("matchesCatalogItemQuery includes tags and description", () => {
  const item = createCatalogItem({
    video: {
      id: "video-2",
      title: "Practical TypeScript tips",
      channelName: "Zenware",
      url: "https://www.youtube.com/watch?v=video-2",
      durationText: "18:12",
      dateAddedText: "2 days ago",
      thumbnailUrl: undefined
    },
    enrichedMetadata: {
      videoId: "video-2",
      enrichedAt: "2026-01-02T00:00:00.000Z",
      description: "A walkthrough for tightening your tsconfig and refactoring helper modules.",
      tags: ["TypeScript", "Refactoring"]
    }
  })

  assert.equal(matchesCatalogItemQuery(item, "typescript refactoring"), true)
  assert.equal(matchesCatalogItemQuery(item, "meal piano"), false)
})

test("deriveCatalogItemInsights promotes meal-friendly learning videos", () => {
  const item = createCatalogItem({
    video: {
      id: "video-3",
      title: "Calculus explained for busy adults",
      channelName: "Math Desk",
      url: "https://www.youtube.com/watch?v=video-3",
      durationText: "24:12",
      dateAddedText: "3 weeks ago",
      thumbnailUrl: undefined
    },
    enrichedMetadata: {
      videoId: "video-3",
      enrichedAt: "2026-01-03T00:00:00.000Z",
      description: "A lesson on derivatives and limits for self-study.",
      tags: ["Math", "Education", "Explainer"]
    }
  })

  const insights = deriveCatalogItemInsights(item)
  assert.equal(insights.category, "educational")
  assert.equal(insights.priority, "do")
  assert.equal(insights.watchFit, "meal-friendly")
})

test("deriveCatalogItemInsights demotes disposable long-form entertainment", () => {
  const item = createCatalogItem({
    video: {
      id: "video-4",
      title: "Funny reaction clips compilation",
      channelName: "Laugh Feed",
      url: "https://www.youtube.com/watch?v=video-4",
      durationText: "48:00",
      dateAddedText: "1 month ago",
      thumbnailUrl: undefined
    },
    enrichedMetadata: {
      videoId: "video-4",
      enrichedAt: "2026-01-04T00:00:00.000Z",
      description: "A compilation of the funniest streamer reactions and highlights.",
      tags: ["Comedy", "Reaction", "Highlights"]
    }
  })

  const insights = deriveCatalogItemInsights(item)
  assert.equal(insights.category, "entertainment")
  assert.equal(insights.priority, "delete")
  assert.equal(insights.watchFit, "deep-focus")
})

test("deriveCatalogItemInsights keeps long podcast material in decide", () => {
  const item = createCatalogItem({
    video: {
      id: "video-5",
      title: "Product strategy podcast episode 92",
      channelName: "Operator Notes",
      url: "https://www.youtube.com/watch?v=video-5",
      durationText: "1:15:00",
      dateAddedText: "2 months ago",
      thumbnailUrl: undefined
    },
    enrichedMetadata: {
      videoId: "video-5",
      enrichedAt: "2026-01-05T00:00:00.000Z",
      description: "A conversation about product bets, roadmaps, and hiring.",
      tags: ["Podcast", "Strategy", "Conversation"]
    }
  })

  const insights = deriveCatalogItemInsights(item)
  assert.equal(insights.category, "podcast-talk")
  assert.equal(insights.priority, "decide")
  assert.equal(insights.watchFit, "deep-focus")
})

test("removeCatalogItem drops a saved video from the local catalog", () => {
  const catalog = {
    ...createEmptyCatalogStore(),
    items: [
      createCatalogItem({ videoId: "video-1", video: { id: "video-1", title: "One", channelName: "Alpha", url: "https://www.youtube.com/watch?v=video-1" } }),
      createCatalogItem({ videoId: "video-2", video: { id: "video-2", title: "Two", channelName: "Beta", url: "https://www.youtube.com/watch?v=video-2" } })
    ]
  }

  const nextCatalog = removeCatalogItem(catalog, "video-1")
  assert.equal(nextCatalog.items.length, 1)
  assert.equal(nextCatalog.items[0]?.videoId, "video-2")
})
