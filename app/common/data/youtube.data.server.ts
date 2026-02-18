// =============================================================================
// YouTube Data API v3 Integration with Supabase Cache
// =============================================================================

import { desc, gte, sql, eq, and, ilike, or, inArray } from "drizzle-orm";
import { db, schema } from "~/lib/db.server";
import type { TrendItem } from "../types/project.types";
import type {
  YouTubeVideosListResponse,
  YouTubeVideoItem,
} from "../types/youtube.types";
import type { TrendFilterOptions } from "../types/trend.types";
import {
  YOUTUBE_CATEGORIES_KO,
  YOUTUBE_CATEGORIES_INACTIVE_KO,
  normalizeYouTubeCategory,
  getYouTubeCategoryId,
} from "../types/trend.types";

// =============================================================================
// Configuration
// =============================================================================

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Active + inactive categories combined (for YouTube API response mapping)
const ALL_CATEGORIES_KO: Record<string, string> = {
  ...YOUTUBE_CATEGORIES_KO,
  ...YOUTUBE_CATEGORIES_INACTIVE_KO,
};

// =============================================================================
// Supabase Cache Functions
// =============================================================================

/**
 * Get cached trends from Supabase if they're still fresh (within 15 minutes)
 * Now region-aware to return correct data per region
 */
async function getCachedTrends(
  regionCode: string = "KR",
): Promise<TrendItem[] | null> {
  const cacheThreshold = new Date(Date.now() - CACHE_DURATION_MS);

  const cachedTrends = await db.query.trends.findMany({
    where: and(
      gte(schema.trends.fetchedAt, cacheThreshold),
      eq(schema.trends.regionCode, regionCode),
    ),
    orderBy: [desc(schema.trends.fetchedAt)],
    limit: 20,
  });

  if (cachedTrends.length === 0) {
    return null;
  }

  // Map database records to TrendItem format
  return cachedTrends.map((trend, index) => ({
    id: index + 1,
    trendUuid: trend.id,
    title: trend.title,
    category: normalizeYouTubeCategory(trend.category),
    views: trend.viewsCount ?? "0",
    growth: trend.growthRate ?? "+NEW",
    thumbnail: trend.thumbnailUrl ?? "",
    tags: trend.tags ?? [],
    videoUrl: trend.externalUrl ?? undefined,
    isSaved: trend.isSaved ?? false,
  }));
}

/**
 * Save trends to Supabase using upsert (insert or update on conflict)
 * This allows saving both full trends and category-filtered trends without duplicates
 */
async function saveTrendsToCache(
  videos: YouTubeVideoItem[],
  regionCode: string = "KR",
  replaceAll: boolean = false,
): Promise<void> {
  // If replaceAll is true, delete old YouTube trends for this region first
  if (replaceAll) {
    await db
      .delete(schema.trends)
      .where(
        and(
          sql`${schema.trends.source} = 'youtube_api'`,
          eq(schema.trends.regionCode, regionCode),
        ),
      );
  }

  // Prepare trends data
  const trendsToInsert = videos.map((video) => {
    const categoryName = ALL_CATEGORIES_KO[video.snippet.categoryId] ?? "Other";
    const tags = video.snippet.tags?.slice(0, 5) ?? [categoryName];

    // Parse video duration from contentDetails (e.g., "PT15M33S" → "15:33")
    let videoDuration: string | null = null;
    if (video.contentDetails?.duration) {
      const seconds = parseISO8601Duration(video.contentDetails.duration);
      videoDuration = formatDuration(seconds);
    }

    return {
      title: video.snippet.title,
      description: video.snippet.description?.slice(0, 500),
      category: categoryName,
      viewsCount: formatViewCount(video.statistics.viewCount),
      growthRate: "+NEW",
      thumbnailUrl:
        video.snippet.thumbnails.high?.url ??
        video.snippet.thumbnails.medium?.url ??
        video.snippet.thumbnails.default.url,
      tags,
      source: "youtube_api" as const,
      regionCode,
      externalId: video.id,
      externalUrl: `https://www.youtube.com/watch?v=${video.id}`,
      viewCount: parseInt(video.statistics.viewCount, 10) || 0,
      likeCount: video.statistics.likeCount
        ? parseInt(video.statistics.likeCount, 10)
        : null,
      commentCount: video.statistics.commentCount
        ? parseInt(video.statistics.commentCount, 10)
        : null,
      videoDuration,
      publishedAt: new Date(video.snippet.publishedAt),
      fetchedAt: new Date(),
    };
  });

  if (trendsToInsert.length > 0) {
    // Use upsert: insert new trends or update existing ones based on externalId
    for (const trend of trendsToInsert) {
      await db
        .insert(schema.trends)
        .values(trend)
        .onConflictDoUpdate({
          target: schema.trends.externalId,
          set: {
            title: trend.title,
            description: trend.description,
            category: trend.category,
            viewsCount: trend.viewsCount,
            viewCount: trend.viewCount,
            likeCount: trend.likeCount,
            commentCount: trend.commentCount,
            thumbnailUrl: trend.thumbnailUrl,
            tags: trend.tags,
            videoDuration: trend.videoDuration,
            fetchedAt: trend.fetchedAt,
            updatedAt: new Date(),
          },
        });
    }
  }

  console.log(
    `[YouTube API] Saved ${trendsToInsert.length} trends to Supabase for region ${regionCode}`,
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Parse ISO 8601 duration (e.g., "PT15M33S") to seconds
 */
function parseISO8601Duration(duration: string): number {
  const match = duration.match(
    /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/,
  );
  if (!match) return 0;

  const days = parseInt(match[1] || "0", 10);
  const hours = parseInt(match[2] || "0", 10);
  const minutes = parseInt(match[3] || "0", 10);
  const seconds = parseFloat(match[4] || "0");

  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format seconds to "H:MM:SS" or "M:SS" display string
 */
function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Format view count to human-readable string (e.g., 1234567 -> "1.2M")
 */
function formatViewCount(viewCount: string): string {
  const count = parseInt(viewCount, 10);

  if (isNaN(count)) return "0";

  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toFixed(1)}B`;
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }

  return count.toString();
}

/**
 * Map YouTube video item to TrendItem
 */
function mapVideoToTrendItem(
  video: YouTubeVideoItem,
  index: number,
): TrendItem {
  const categoryName = ALL_CATEGORIES_KO[video.snippet.categoryId] ?? "Other";
  const tags = video.snippet.tags?.slice(0, 5) ?? [];

  return {
    id: index + 1,
    title: video.snippet.title,
    category: categoryName,
    views: formatViewCount(video.statistics.viewCount),
    growth: "+NEW",
    thumbnail:
      video.snippet.thumbnails.high?.url ??
      video.snippet.thumbnails.medium?.url ??
      video.snippet.thumbnails.default.url,
    tags: tags.length > 0 ? tags : [categoryName],
    videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
  };
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Options for fetching YouTube trends
 */
interface YouTubeTrendsOptions {
  regionCode?: string;
  videoCategoryId?: string;
  maxResults?: number;
  forceRefresh?: boolean;
}

/**
 * Fetch trending videos from YouTube Data API v3
 * Uses Supabase cache (15 min) to manage API quota
 * Falls back to mock data on error or missing API key
 *
 * @param options - Options including regionCode, videoCategoryId, maxResults, forceRefresh
 */
export async function getYouTubeTrends(
  options: YouTubeTrendsOptions | string = "KR",
  forceRefreshLegacy: boolean = false,
): Promise<TrendItem[]> {
  // Support legacy signature: getYouTubeTrends(regionCode, forceRefresh)
  const opts: YouTubeTrendsOptions =
    typeof options === "string"
      ? { regionCode: options, forceRefresh: forceRefreshLegacy }
      : options;

  const regionCode = opts.regionCode ?? "KR";
  const videoCategoryId = opts.videoCategoryId;
  const maxResults = opts.maxResults ?? 20;
  const forceRefresh = opts.forceRefresh ?? false;

  // Check Supabase cache first (unless force refresh or category filter)
  // Note: Skip cache when filtering by category since cache stores all categories mixed
  if (!forceRefresh && !videoCategoryId) {
    try {
      const cachedData = await getCachedTrends(regionCode);
      if (cachedData && cachedData.length > 0) {
        console.log(
          `[YouTube API] Returning cached data from Supabase for region ${regionCode}`,
        );
        return cachedData;
      }
    } catch (error) {
      console.error("[YouTube API] Failed to check Supabase cache:", error);
      // Continue to fetch from API
    }
  } else if (videoCategoryId) {
    console.log(
      `[YouTube API] Category filter requested (${videoCategoryId}), skipping cache`,
    );
  } else {
    console.log(
      `[YouTube API] Force refresh requested for region ${regionCode}`,
    );
  }

  // Check for API key
  const apiKey = process.env.GEMINI_API_KEY; // Using GEMINI_API_KEY for both Gemini and YouTube API

  if (!apiKey) {
    console.warn(
      "[YouTube API] GEMINI_API_KEY not configured, returning empty",
    );
    return [];
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE_URL}/videos`);
    url.searchParams.set("part", "snippet,statistics,contentDetails");
    url.searchParams.set("chart", "mostPopular");
    url.searchParams.set("regionCode", regionCode);
    url.searchParams.set("maxResults", maxResults.toString());
    url.searchParams.set("key", apiKey);

    // Add category filter if specified
    if (videoCategoryId) {
      url.searchParams.set("videoCategoryId", videoCategoryId);
    }

    console.log(
      `[YouTube API] Fetching trending videos for region ${regionCode}${videoCategoryId ? `, category ${videoCategoryId}` : ""}...`,
    );

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[YouTube API] Error ${response.status}: ${errorText}`);
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data: YouTubeVideosListResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      console.warn("[YouTube API] No videos returned for this filter");
      return [];
    }

    // Save to Supabase cache (upsert mode handles duplicates)
    try {
      await saveTrendsToCache(data.items, regionCode);
    } catch (error) {
      console.error("[YouTube API] Failed to save to Supabase cache:", error);
      // Continue even if caching fails
    }

    const trends = data.items.map(mapVideoToTrendItem);

    console.log(
      `[YouTube API] Successfully fetched ${trends.length} trending videos for region ${regionCode}${videoCategoryId ? `, category ${videoCategoryId}` : ""}`,
    );
    return trends;
  } catch (error) {
    console.error("[YouTube API] Failed to fetch trends:", error);
    return [];
  }
}

/**
 * Clear the YouTube trends cache in Supabase
 * Useful for forcing a refresh
 */
export async function clearYouTubeCache(): Promise<void> {
  await db
    .delete(schema.trends)
    .where(sql`${schema.trends.source} = 'youtube_api'`);
  console.log("[YouTube API] Supabase cache cleared");
}

// =============================================================================
// Phase 2: Enhanced Filtering Functions
// =============================================================================

/**
 * Parse view count string to number (e.g., "1.2M" -> 1200000)
 */
function parseViewCount(views: string): number {
  const normalized = views.toUpperCase().trim();
  const match = normalized.match(/^([\d.]+)\s*([KMB])?$/);

  if (!match) return 0;

  const num = parseFloat(match[1]);
  const suffix = match[2];

  switch (suffix) {
    case "K":
      return num * 1_000;
    case "M":
      return num * 1_000_000;
    case "B":
      return num * 1_000_000_000;
    default:
      return num;
  }
}

/**
 * Apply filters to trends array (client-side filtering)
 */
function applyFilters(
  trends: TrendItem[],
  filters: TrendFilterOptions,
): TrendItem[] {
  return trends.filter((trend) => {
    // Category filter
    if (
      filters.category &&
      trend.category.toLowerCase() !== filters.category.toLowerCase()
    ) {
      return false;
    }

    // Minimum views filter
    if (filters.minViews) {
      const viewCount = parseViewCount(trend.views);
      if (viewCount < filters.minViews) {
        return false;
      }
    }

    // Keywords filter (include)
    if (filters.keywords && filters.keywords.length > 0) {
      const hasKeyword = filters.keywords.some(
        (kw) =>
          trend.title.toLowerCase().includes(kw.toLowerCase()) ||
          trend.tags?.some((tag) =>
            tag.toLowerCase().includes(kw.toLowerCase()),
          ),
      );
      if (!hasKeyword) {
        return false;
      }
    }

    // Keywords filter (exclude)
    if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
      const hasExcluded = filters.excludeKeywords.some(
        (kw) =>
          trend.title.toLowerCase().includes(kw.toLowerCase()) ||
          trend.tags?.some((tag) =>
            tag.toLowerCase().includes(kw.toLowerCase()),
          ),
      );
      if (hasExcluded) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Fetch trending videos with filters
 * Category filter is applied at the API level for better results
 * Other filters (minViews, keywords) are applied client-side
 *
 * @param filters - Filter options including regionCode, category, minViews, keywords
 * @param forceRefresh - Skip cache and fetch fresh data from YouTube API
 */
export async function getYouTubeTrendsWithFilters(
  filters: TrendFilterOptions = {},
  forceRefresh: boolean = false,
): Promise<TrendItem[]> {
  const regionCode = filters.regionCode ?? "KR";

  // Convert category name to YouTube category ID for API-level filtering
  let videoCategoryId: string | undefined;
  if (filters.category) {
    const categoryId = getYouTubeCategoryId(filters.category);
    if (categoryId) {
      videoCategoryId = categoryId;
      console.log(
        `[YouTube API] Category "${filters.category}" mapped to ID ${categoryId}`,
      );
    } else {
      console.warn(
        `[YouTube API] Unknown category: "${filters.category}", will filter client-side`,
      );
    }
  }

  // Fetch trends from API with category filter if available
  const trends = await getYouTubeTrends({
    regionCode,
    videoCategoryId,
    maxResults: 50, // Fetch more results when filtering
    forceRefresh,
  });

  // Apply remaining client-side filters (minViews, keywords, excludeKeywords)
  // Skip category filter if already applied at API level
  const clientSideFilters: TrendFilterOptions = {
    ...filters,
    category: videoCategoryId ? undefined : filters.category, // Skip if already filtered by API
  };

  const filteredTrends = applyFilters(trends, clientSideFilters);

  return filteredTrends;
}

/**
 * Get stored trends from Supabase (previously fetched from YouTube)
 * Unlike getCachedTrends, this ignores the 15-minute cache duration
 * and returns all stored YouTube trends for a region
 */
export async function getStoredTrends(
  regionCode: string = "KR",
): Promise<TrendItem[]> {
  const storedTrends = await db.query.trends.findMany({
    where: and(
      eq(schema.trends.source, "youtube_api"),
      eq(schema.trends.regionCode, regionCode),
    ),
    orderBy: [desc(schema.trends.fetchedAt)],
    limit: 50,
  });

  if (storedTrends.length === 0) {
    console.log(
      `[YouTube API] No stored trends found for region ${regionCode}`,
    );
    return [];
  }

  console.log(
    `[YouTube API] Returning ${storedTrends.length} stored trends from Supabase for region ${regionCode}`,
  );

  return storedTrends.map((trend, index) => ({
    id: index + 1,
    trendUuid: trend.id,
    title: trend.title,
    category: normalizeYouTubeCategory(trend.category),
    views: trend.viewsCount ?? "0",
    growth: trend.growthRate ?? "+NEW",
    thumbnail: trend.thumbnailUrl ?? "",
    tags: trend.tags ?? [],
    videoUrl: trend.externalUrl ?? undefined,
    isSaved: trend.isSaved ?? false,
  }));
}

/**
 * Get stored trends from Supabase with filters applied
 * Filters are applied at the database level for category, and client-side for others
 *
 * @param filters - Filter options including regionCode, category, minViews, keywords
 */
export async function getStoredTrendsWithFilters(
  filters: TrendFilterOptions = {},
): Promise<TrendItem[]> {
  const regionCode = filters.regionCode ?? "KR";

  // Build where conditions
  const conditions = [
    eq(schema.trends.source, "youtube_api"),
    eq(schema.trends.regionCode, regionCode),
  ];

  // Add category filter at database level if specified
  if (filters.category) {
    conditions.push(eq(schema.trends.category, filters.category));
  }

  const storedTrends = await db.query.trends.findMany({
    where: and(...conditions),
    orderBy: [desc(schema.trends.fetchedAt)],
    limit: 100, // Fetch more to allow for client-side filtering
  });

  if (storedTrends.length === 0) {
    console.log(
      `[YouTube API] No stored trends found for region ${regionCode} with filters`,
    );
    return [];
  }

  // Map to TrendItem format
  let trends: TrendItem[] = storedTrends.map((trend, index) => ({
    id: index + 1,
    trendUuid: trend.id,
    title: trend.title,
    category: normalizeYouTubeCategory(trend.category),
    views: trend.viewsCount ?? "0",
    growth: trend.growthRate ?? "+NEW",
    thumbnail: trend.thumbnailUrl ?? "",
    tags: trend.tags ?? [],
    videoUrl: trend.externalUrl ?? undefined,
    isSaved: trend.isSaved ?? false,
  }));

  // Apply remaining client-side filters (minViews, keywords, excludeKeywords)
  const clientSideFilters: TrendFilterOptions = {
    ...filters,
    category: undefined, // Already filtered at DB level
  };

  trends = applyFilters(trends, clientSideFilters);

  console.log(
    `[YouTube API] Returning ${trends.length} stored trends from Supabase for region ${regionCode} with filters`,
  );

  return trends;
}

/**
 * Get saved (bookmarked) trends for a user
 */
export async function getSavedTrends(userId: string): Promise<TrendItem[]> {
  const savedTrends = await db.query.trends.findMany({
    where: and(
      eq(schema.trends.isSaved, true),
      eq(schema.trends.savedByUserId, userId),
    ),
    orderBy: [desc(schema.trends.savedAt)],
  });

  return savedTrends.map((trend, index) => ({
    id: index + 1,
    trendUuid: trend.id,
    title: trend.title,
    category: normalizeYouTubeCategory(trend.category),
    views: trend.viewsCount ?? "0",
    growth: trend.growthRate ?? "+NEW",
    thumbnail: trend.thumbnailUrl ?? "",
    tags: trend.tags ?? [],
    videoUrl: trend.externalUrl ?? undefined,
    isSaved: true,
  }));
}

/**
 * Save (bookmark) a trend for a user
 */
export async function saveTrend(
  trendId: string,
  userId: string,
): Promise<{ success: boolean }> {
  await db
    .update(schema.trends)
    .set({
      isSaved: true,
      savedByUserId: userId,
      savedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.trends.id, trendId));

  return { success: true };
}

/**
 * Remove saved (bookmark) status from a trend
 */
export async function unsaveTrend(
  trendId: string,
  userId: string,
): Promise<{ success: boolean }> {
  await db
    .update(schema.trends)
    .set({
      isSaved: false,
      savedByUserId: null,
      savedAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.trends.id, trendId),
        eq(schema.trends.savedByUserId, userId),
      ),
    );

  return { success: true };
}

/**
 * Get trend by external ID (YouTube video ID)
 */
export async function getTrendByExternalId(externalId: string): Promise<{
  id: string;
  title: string;
  category: string;
  tags: string[];
  viewsCount: string | null;
  growthRate: string | null;
  externalUrl: string | null;
  thumbnailUrl: string | null;
} | null> {
  const trend = await db.query.trends.findFirst({
    where: eq(schema.trends.externalId, externalId),
  });

  if (!trend) return null;

  return {
    id: trend.id,
    title: trend.title,
    category: normalizeYouTubeCategory(trend.category),
    tags: trend.tags ?? [],
    viewsCount: trend.viewsCount,
    growthRate: trend.growthRate,
    externalUrl: trend.externalUrl,
    thumbnailUrl: trend.thumbnailUrl,
  };
}

/**
 * Get all unique categories from cached trends
 * Normalizes category names to standard format before deduplication
 */
export async function getTrendCategories(): Promise<string[]> {
  const trends = await db.query.trends.findMany({
    columns: { category: true },
  });

  // Normalize and deduplicate categories
  const normalizedCategories = trends.map((t) => normalizeYouTubeCategory(t.category));
  const categories = [...new Set(normalizedCategories)];
  return categories.sort();
}

/**
 * Get trends by their UUIDs (batch query)
 * Used for AI recommendations to fetch trend details from Supabase
 */
export async function getTrendsByIds(trendIds: string[]): Promise<TrendItem[]> {
  if (trendIds.length === 0) return [];

  const trends = await db.query.trends.findMany({
    where: inArray(schema.trends.id, trendIds),
  });

  if (trends.length === 0) {
    return [];
  }

  return trends.map((trend, index) => ({
    id: index + 1,
    trendUuid: trend.id,
    title: trend.title,
    description: trend.description ?? undefined,
    category: normalizeYouTubeCategory(trend.category),
    views: trend.viewsCount ?? "0",
    growth: trend.growthRate ?? "+NEW",
    thumbnail: trend.thumbnailUrl ?? "",
    tags: trend.tags ?? [],
    videoUrl: trend.externalUrl ?? undefined,
  }));
}
