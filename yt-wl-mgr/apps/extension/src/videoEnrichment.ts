import type { EnrichedVideoMetadata } from "../../../packages/core/src/index.js";

export type VideoEnrichmentResult =
  | { ok: true; metadata: EnrichedVideoMetadata }
  | { ok: false; message: string };

export type FetchVideoEnrichmentOptions = {
  signal?: AbortSignal;
};

function extractPublishedAt(html: string): string | undefined {
  // ytInitialPlayerResponse > microformat > playerMicroformatRenderer
  const patterns = [
    /"publishDate":"(\d{4}-\d{2}-\d{2})"/,
    /"uploadDate":"(\d{4}-\d{2}-\d{2})"/
  ];

  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m?.[1]) {
      return m[1];
    }
  }

  return undefined;
}

function extractViewCount(html: string): number | undefined {
  const m = html.match(/"viewCount":"(\d+)"/);
  if (!m?.[1]) {
    return undefined;
  }

  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : undefined;
}

function extractShortDescription(html: string): string | undefined {
  // Match JSON-encoded string value for shortDescription
  const m = html.match(/"shortDescription":"((?:[^"\\]|\\[\s\S])*?)"/);
  if (!m?.[1]) {
    return undefined;
  }

  try {
    const decoded = JSON.parse('"' + m[1] + '"') as string;
    return decoded.trim() || undefined;
  } catch {
    return m[1].trim() || undefined;
  }
}

function extractKeywords(html: string): string[] | undefined {
  const m = html.match(/"keywords":\[((?:"(?:[^"\\]|\\[\s\S])*?"(?:,)?)*)\]/);
  if (!m?.[1]) {
    return undefined;
  }

  try {
    const parsed = JSON.parse("[" + m[1] + "]") as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((t): t is string => typeof t === "string");
    }
  } catch {
    // ignored
  }

  return undefined;
}

type PrivacyStatusValue = "public" | "private" | "unlisted" | "unknown";
type AvailabilityStatusValue = "available" | "deleted" | "unavailable" | "unknown";

function inferAvailabilityStatus(html: string, httpStatus: number): AvailabilityStatusValue {
  if (httpStatus === 404) {
    return "deleted";
  }

  if (
    html.includes('"reason":"Video unavailable"') ||
    html.includes("VIDEO_ID_ERROR") ||
    html.includes("videoId\":\"ERROR\"") ||
    html.includes("\"ERROR\"")
  ) {
    if (html.includes('"isPrivate":true')) {
      return "unavailable";
    }

    // Check for age-restricted or geo-blocked messages
    if (
      html.includes("This video is unavailable") ||
      html.includes("This video has been removed") ||
      html.includes("This video is private")
    ) {
      return "unavailable";
    }
  }

  return "available";
}

function inferPrivacyStatus(html: string): PrivacyStatusValue {
  if (html.includes('"isPrivate":true')) {
    return "private";
  }

  if (html.includes('"isUnlisted":true')) {
    return "unlisted";
  }

  return "public";
}

export async function fetchVideoEnrichment(
  videoId: string,
  options?: FetchVideoEnrichmentOptions
): Promise<VideoEnrichmentResult> {
  let html: string;
  let httpStatus: number;

  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`, {
      headers: {
        "Accept-Language": "en-US,en;q=0.9"
      },
      ...(options?.signal ? { signal: options.signal } : {})
    });

    httpStatus = response.status;
    html = await response.text();
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Network request failed";
    return { ok: false, message };
  }

  const enrichedAt = new Date().toISOString();

  if (httpStatus === 404) {
    return {
      ok: true,
      metadata: {
        videoId,
        enrichedAt,
        availabilityStatus: "deleted" as const
      }
    };
  }

  const availabilityStatus = inferAvailabilityStatus(html, httpStatus);
  const privacyStatus = inferPrivacyStatus(html);
  const publishedAt = extractPublishedAt(html);
  const viewCount = extractViewCount(html);
  const description = extractShortDescription(html);
  const tags = extractKeywords(html);

  return {
    ok: true,
    metadata: {
      videoId,
      enrichedAt,
      ...(publishedAt !== undefined ? { publishedAt } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(viewCount !== undefined ? { viewCount } : {}),
      privacyStatus,
      availabilityStatus
    }
  };
}
