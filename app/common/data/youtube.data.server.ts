// =============================================================================
// YouTube Data API v3 Integration
// =============================================================================

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
// Cache Implementation
// =============================================================================

interface CacheEntry {
  data: TrendItem[];
  timestamp: number;
}

let cache: CacheEntry | null = null;

function isCacheValid(): boolean {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_DURATION_MS;
}

function setCache(data: TrendItem[]): void {
  cache = {
    data,
    timestamp: Date.now(),
  };
}

function getCache(): TrendItem[] | null {
  if (isCacheValid()) {
    return cache!.data;
  }
  return null;
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
 * Uses in-memory cache (15 min) to manage API quota
 * Falls back to mock data on error or missing API key
 */
export async function getYouTubeTrends(regionCode: string = "KR"): Promise<TrendItem[]> {
  // Check cache first
  const cachedData = getCache();
  if (cachedData) {
    console.log("[YouTube API] Returning cached data");
    return cachedData;
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

    const trends = data.items.map(mapVideoToTrendItem);

    // Update cache
    setCache(trends);

    console.log(`[YouTube API] Successfully fetched ${trends.length} trending videos`);
    return trends;

  } catch (error) {
    console.error("[YouTube API] Failed to fetch trends:", error);
    return TRENDS_DATA;
  }
}

/**
 * Clear the YouTube trends cache
 * Useful for forcing a refresh
 */
export function clearYouTubeCache(): void {
  cache = null;
  console.log("[YouTube API] Cache cleared");
}
