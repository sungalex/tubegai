// =============================================================================
// YouTube Data API v3 Integration with Supabase Cache
// =============================================================================

import { desc, gte, sql, eq, and, ilike, or } from "drizzle-orm";
import { db, schema } from "~/lib/db.server";
import type { TrendItem } from "../types/project.types";
import type { YouTubeVideosListResponse, YouTubeVideoItem } from "../types/youtube.types";
import type { TrendFilterOptions } from "../types/trend.types";
import { TRENDS_DATA } from "../mocks/project-mock";

// =============================================================================
// Configuration
// =============================================================================

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// YouTube category ID to display name mapping (Korean for consistency with UI)
const CATEGORY_MAP: Record<string, string> = {
  "1": "영화 & 애니메이션",
  "2": "자동차",
  "10": "음악",
  "15": "동물",
  "17": "스포츠",
  "18": "단편 영화",
  "19": "여행 & 이벤트",
  "20": "게임",
  "21": "비디오블로그",
  "22": "인물 & 블로그",
  "23": "코미디",
  "24": "엔터테인먼트",
  "25": "뉴스 & 정치",
  "26": "노하우 & 스타일",
  "27": "교육",
  "28": "과학 & 기술",
  "29": "비영리 & 사회운동",
  "30": "영화",
  "31": "애니메이션",
  "32": "액션/어드벤처",
  "33": "클래식",
  "34": "코미디",
  "35": "다큐멘터리",
  "36": "드라마",
  "37": "가족",
  "38": "외국",
  "39": "공포",
  "40": "SF/판타지",
  "41": "스릴러",
  "42": "쇼츠",
  "43": "쇼",
  "44": "예고편",
};

// =============================================================================
// Supabase Cache Functions
// =============================================================================

/**
 * Get cached trends from Supabase if they're still fresh (within 15 minutes)
 * Now region-aware to return correct data per region
 */
async function getCachedTrends(regionCode: string = "KR"): Promise<TrendItem[] | null> {
  const cacheThreshold = new Date(Date.now() - CACHE_DURATION_MS);

  const cachedTrends = await db.query.trends.findMany({
    where: and(
      gte(schema.trends.fetchedAt, cacheThreshold),
      eq(schema.trends.regionCode, regionCode)
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
    category: trend.category,
    views: trend.viewsCount ?? "0",
    growth: trend.growthRate ?? "+NEW",
    thumbnail: trend.thumbnailUrl ?? "",
    tags: trend.tags ?? [],
    videoUrl: trend.externalUrl ?? undefined,
  }));
}

/**
 * Save trends to Supabase, replacing old YouTube trends for specific region
 */
async function saveTrendsToCache(
  videos: YouTubeVideoItem[],
  regionCode: string = "KR"
): Promise<void> {
  // Delete old YouTube trends for this region (source = 'youtube_api')
  await db.delete(schema.trends).where(
    and(
      sql`${schema.trends.source} = 'youtube_api'`,
      eq(schema.trends.regionCode, regionCode)
    )
  );

  // Insert new trends
  const trendsToInsert = videos.map((video) => {
    const categoryName = CATEGORY_MAP[video.snippet.categoryId] ?? "Other";
    const tags = video.snippet.tags?.slice(0, 5) ?? [categoryName];

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
      publishedAt: new Date(video.snippet.publishedAt),
      fetchedAt: new Date(),
    };
  });

  if (trendsToInsert.length > 0) {
    await db.insert(schema.trends).values(trendsToInsert);
  }

  console.log(`[YouTube API] Saved ${trendsToInsert.length} trends to Supabase for region ${regionCode}`);
}

// =============================================================================
// Utility Functions
// =============================================================================

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
function mapVideoToTrendItem(video: YouTubeVideoItem, index: number): TrendItem {
  const categoryName = CATEGORY_MAP[video.snippet.categoryId] ?? "Other";
  const tags = video.snippet.tags?.slice(0, 5) ?? [];

  return {
    id: index + 1,
    title: video.snippet.title,
    category: categoryName,
    views: formatViewCount(video.statistics.viewCount),
    growth: "+NEW",
    thumbnail: video.snippet.thumbnails.high?.url ?? video.snippet.thumbnails.medium?.url ?? video.snippet.thumbnails.default.url,
    tags: tags.length > 0 ? tags : [categoryName],
    videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
  };
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch trending videos from YouTube Data API v3
 * Uses Supabase cache (15 min) to manage API quota
 * Falls back to mock data on error or missing API key
 *
 * @param regionCode - Region code for YouTube trends (default: "KR")
 * @param forceRefresh - Skip cache and fetch fresh data from YouTube API
 */
export async function getYouTubeTrends(
  regionCode: string = "KR",
  forceRefresh: boolean = false
): Promise<TrendItem[]> {
  // Check Supabase cache first (unless force refresh)
  if (!forceRefresh) {
    try {
      const cachedData = await getCachedTrends(regionCode);
      if (cachedData && cachedData.length > 0) {
        console.log(`[YouTube API] Returning cached data from Supabase for region ${regionCode}`);
        return cachedData;
      }
    } catch (error) {
      console.error("[YouTube API] Failed to check Supabase cache:", error);
      // Continue to fetch from API
    }
  } else {
    console.log(`[YouTube API] Force refresh requested for region ${regionCode}`);
  }

  // Check for API key
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey || apiKey === "your_youtube_api_key_here") {
    console.warn("[YouTube API] API key not configured, using mock data");
    return TRENDS_DATA;
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE_URL}/videos`);
    url.searchParams.set("part", "snippet,statistics");
    url.searchParams.set("chart", "mostPopular");
    url.searchParams.set("regionCode", regionCode);
    url.searchParams.set("maxResults", "20");
    url.searchParams.set("key", apiKey);

    console.log(`[YouTube API] Fetching trending videos for region ${regionCode}...`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[YouTube API] Error ${response.status}: ${errorText}`);
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data: YouTubeVideosListResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      console.warn("[YouTube API] No videos returned, using mock data");
      return TRENDS_DATA;
    }

    // Save to Supabase cache
    try {
      await saveTrendsToCache(data.items, regionCode);
    } catch (error) {
      console.error("[YouTube API] Failed to save to Supabase cache:", error);
      // Continue even if caching fails
    }

    const trends = data.items.map(mapVideoToTrendItem);

    console.log(`[YouTube API] Successfully fetched ${trends.length} trending videos for region ${regionCode}`);
    return trends;

  } catch (error) {
    console.error("[YouTube API] Failed to fetch trends:", error);
    return TRENDS_DATA;
  }
}

/**
 * Clear the YouTube trends cache in Supabase
 * Useful for forcing a refresh
 */
export async function clearYouTubeCache(): Promise<void> {
  await db.delete(schema.trends).where(
    sql`${schema.trends.source} = 'youtube_api'`
  );
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
function applyFilters(trends: TrendItem[], filters: TrendFilterOptions): TrendItem[] {
  return trends.filter((trend) => {
    // Category filter
    if (filters.category && trend.category.toLowerCase() !== filters.category.toLowerCase()) {
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
          trend.tags?.some((tag) => tag.toLowerCase().includes(kw.toLowerCase()))
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
          trend.tags?.some((tag) => tag.toLowerCase().includes(kw.toLowerCase()))
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
 * Uses Supabase cache (15 min) and applies filters
 *
 * @param filters - Filter options including regionCode
 * @param forceRefresh - Skip cache and fetch fresh data from YouTube API
 */
export async function getYouTubeTrendsWithFilters(
  filters: TrendFilterOptions = {},
  forceRefresh: boolean = false
): Promise<TrendItem[]> {
  const regionCode = filters.regionCode ?? "KR";

  // Get base trends (with optional force refresh)
  const trends = await getYouTubeTrends(regionCode, forceRefresh);

  // Apply client-side filters
  const filteredTrends = applyFilters(trends, filters);

  return filteredTrends;
}

/**
 * Get stored trends from Supabase (previously fetched from YouTube)
 * Unlike getCachedTrends, this ignores the 15-minute cache duration
 * and returns all stored YouTube trends for a region
 */
export async function getStoredTrends(regionCode: string = "KR"): Promise<TrendItem[]> {
  const storedTrends = await db.query.trends.findMany({
    where: and(
      eq(schema.trends.source, "youtube_api"),
      eq(schema.trends.regionCode, regionCode)
    ),
    orderBy: [desc(schema.trends.fetchedAt)],
    limit: 50,
  });

  if (storedTrends.length === 0) {
    console.log(`[YouTube API] No stored trends found for region ${regionCode}`);
    return [];
  }

  console.log(`[YouTube API] Returning ${storedTrends.length} stored trends from Supabase for region ${regionCode}`);

  return storedTrends.map((trend, index) => ({
    id: index + 1,
    trendUuid: trend.id,
    title: trend.title,
    category: trend.category,
    views: trend.viewsCount ?? "0",
    growth: trend.growthRate ?? "+NEW",
    thumbnail: trend.thumbnailUrl ?? "",
    tags: trend.tags ?? [],
    videoUrl: trend.externalUrl ?? undefined,
  }));
}

/**
 * Get saved (bookmarked) trends for a user
 */
export async function getSavedTrends(userId: string): Promise<TrendItem[]> {
  const savedTrends = await db.query.trends.findMany({
    where: and(
      eq(schema.trends.isSaved, true),
      eq(schema.trends.savedByUserId, userId)
    ),
    orderBy: [desc(schema.trends.savedAt)],
  });

  return savedTrends.map((trend, index) => ({
    id: index + 1,
    trendUuid: trend.id,
    title: trend.title,
    category: trend.category,
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
  userId: string
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
  userId: string
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
        eq(schema.trends.savedByUserId, userId)
      )
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
    category: trend.category,
    tags: trend.tags ?? [],
    viewsCount: trend.viewsCount,
    growthRate: trend.growthRate,
    externalUrl: trend.externalUrl,
    thumbnailUrl: trend.thumbnailUrl,
  };
}

/**
 * Get all unique categories from cached trends
 */
export async function getTrendCategories(): Promise<string[]> {
  const trends = await db.query.trends.findMany({
    columns: { category: true },
  });

  const categories = [...new Set(trends.map((t) => t.category))];
  return categories.sort();
}
