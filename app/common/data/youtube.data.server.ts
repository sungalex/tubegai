// =============================================================================
// YouTube Data API v3 Integration with Supabase Cache
// =============================================================================

import { desc, gte, sql } from "drizzle-orm";
import { db, schema } from "~/lib/db.server";
import type { TrendItem } from "../types/project.types";
import type { YouTubeVideosListResponse, YouTubeVideoItem } from "../types/youtube.types";
import { TRENDS_DATA } from "../mocks/project-mock";

// =============================================================================
// Configuration
// =============================================================================

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// YouTube category ID to display name mapping
const CATEGORY_MAP: Record<string, string> = {
  "1": "Film & Animation",
  "2": "Autos & Vehicles",
  "10": "Music",
  "15": "Pets & Animals",
  "17": "Sports",
  "18": "Short Movies",
  "19": "Travel & Events",
  "20": "Gaming",
  "21": "Videoblogging",
  "22": "People & Blogs",
  "23": "Comedy",
  "24": "Entertainment",
  "25": "News & Politics",
  "26": "Howto & Style",
  "27": "Education",
  "28": "Science & Technology",
  "29": "Nonprofits & Activism",
  "30": "Movies",
  "31": "Anime/Animation",
  "32": "Action/Adventure",
  "33": "Classics",
  "34": "Comedy",
  "35": "Documentary",
  "36": "Drama",
  "37": "Family",
  "38": "Foreign",
  "39": "Horror",
  "40": "Sci-Fi/Fantasy",
  "41": "Thriller",
  "42": "Shorts",
  "43": "Shows",
  "44": "Trailers",
};

// =============================================================================
// Supabase Cache Functions
// =============================================================================

/**
 * Get cached trends from Supabase if they're still fresh (within 15 minutes)
 */
async function getCachedTrends(): Promise<TrendItem[] | null> {
  const cacheThreshold = new Date(Date.now() - CACHE_DURATION_MS);

  const cachedTrends = await db.query.trends.findMany({
    where: gte(schema.trends.fetchedAt, cacheThreshold),
    orderBy: [desc(schema.trends.fetchedAt)],
    limit: 20,
  });

  if (cachedTrends.length === 0) {
    return null;
  }

  // Map database records to TrendItem format
  return cachedTrends.map((trend, index) => ({
    id: index + 1,
    title: trend.title,
    category: trend.category,
    views: trend.viewsCount ?? "0",
    growth: trend.growthRate ?? "+NEW",
    thumbnail: trend.thumbnailUrl ?? "",
    tags: trend.tags ?? [],
  }));
}

/**
 * Save trends to Supabase, replacing old YouTube trends
 */
async function saveTrendsToCache(
  videos: YouTubeVideoItem[]
): Promise<void> {
  // Delete old YouTube trends (source = 'youtube_api')
  await db.delete(schema.trends).where(
    sql`${schema.trends.source} = 'youtube_api'`
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

  console.log(`[YouTube API] Saved ${trendsToInsert.length} trends to Supabase`);
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
  };
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch trending videos from YouTube Data API v3
 * Uses Supabase cache (15 min) to manage API quota
 * Falls back to mock data on error or missing API key
 */
export async function getYouTubeTrends(regionCode: string = "KR"): Promise<TrendItem[]> {
  // Check Supabase cache first
  try {
    const cachedData = await getCachedTrends();
    if (cachedData && cachedData.length > 0) {
      console.log("[YouTube API] Returning cached data from Supabase");
      return cachedData;
    }
  } catch (error) {
    console.error("[YouTube API] Failed to check Supabase cache:", error);
    // Continue to fetch from API
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

    console.log("[YouTube API] Fetching trending videos...");

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
      await saveTrendsToCache(data.items);
    } catch (error) {
      console.error("[YouTube API] Failed to save to Supabase cache:", error);
      // Continue even if caching fails
    }

    const trends = data.items.map(mapVideoToTrendItem);

    console.log(`[YouTube API] Successfully fetched ${trends.length} trending videos`);
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
