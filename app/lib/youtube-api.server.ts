// =============================================================================
// YouTube API Server Functions
// =============================================================================
// Server-side YouTube API operations using OAuth tokens from Supabase Auth
// Handles channel data fetching and video uploads

import { createServerClient } from "@supabase/ssr";
import type { Database } from "database.types";

// =============================================================================
// Types
// =============================================================================

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface UploadVideoInput {
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus?: "public" | "private" | "unlisted";
  videoFile: File | Buffer;
}

// =============================================================================
// Supabase Server Client
// =============================================================================

function createSupabaseServerClient(request: Request) {
  const cookies = Object.fromEntries(
    request.headers.get("cookie")?.split("; ").map((c) => c.split("=")) ?? []
  );

  return createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookies[name],
        set: () => {},
        remove: () => {},
      },
    }
  );
}

// =============================================================================
// Token Management
// =============================================================================

/**
 * Get the Google OAuth provider token from Supabase Auth
 * This token is needed for YouTube API calls
 */
export async function getGoogleProviderToken(
  request: Request
): Promise<string | null> {
  const supabase = createSupabaseServerClient(request);

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    console.error("[YouTube API] No session found:", error);
    return null;
  }

  // The provider_token is the Google access token
  return session.provider_token ?? null;
}

/**
 * Refresh the Google provider token if needed
 * Note: Supabase handles token refresh automatically when using the session
 */
export async function refreshProviderToken(
  request: Request
): Promise<string | null> {
  const supabase = createSupabaseServerClient(request);

  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data.session) {
    console.error("[YouTube API] Failed to refresh session:", error);
    return null;
  }

  return data.session.provider_token ?? null;
}

// =============================================================================
// YouTube API Functions
// =============================================================================

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Fetch the authenticated user's YouTube channel information
 */
export async function getMyYouTubeChannel(
  accessToken: string
): Promise<YouTubeChannel | null> {
  try {
    const url = new URL(`${YOUTUBE_API_BASE}/channels`);
    url.searchParams.set("part", "snippet,statistics");
    url.searchParams.set("mine", "true");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[YouTube API] Failed to fetch channel:", error);
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.warn("[YouTube API] No channel found for user");
      return null;
    }

    const channel = data.items[0];

    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      customUrl: channel.snippet.customUrl,
      thumbnailUrl:
        channel.snippet.thumbnails?.high?.url ??
        channel.snippet.thumbnails?.default?.url,
      subscriberCount: parseInt(channel.statistics.subscriberCount ?? "0", 10),
      videoCount: parseInt(channel.statistics.videoCount ?? "0", 10),
      viewCount: parseInt(channel.statistics.viewCount ?? "0", 10),
    };
  } catch (error) {
    console.error("[YouTube API] Error fetching channel:", error);
    return null;
  }
}

/**
 * Fetch a specific YouTube channel by ID
 */
export async function getYouTubeChannelById(
  accessToken: string,
  channelId: string
): Promise<YouTubeChannel | null> {
  try {
    const url = new URL(`${YOUTUBE_API_BASE}/channels`);
    url.searchParams.set("part", "snippet,statistics");
    url.searchParams.set("id", channelId);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[YouTube API] Failed to fetch channel:", error);
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const channel = data.items[0];

    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      customUrl: channel.snippet.customUrl,
      thumbnailUrl:
        channel.snippet.thumbnails?.high?.url ??
        channel.snippet.thumbnails?.default?.url,
      subscriberCount: parseInt(channel.statistics.subscriberCount ?? "0", 10),
      videoCount: parseInt(channel.statistics.videoCount ?? "0", 10),
      viewCount: parseInt(channel.statistics.viewCount ?? "0", 10),
    };
  } catch (error) {
    console.error("[YouTube API] Error fetching channel:", error);
    return null;
  }
}

/**
 * Fetch recent videos from a channel
 */
export async function getChannelVideos(
  accessToken: string,
  channelId: string,
  maxResults: number = 10
): Promise<YouTubeVideo[]> {
  try {
    // First, get the uploads playlist ID
    const channelUrl = new URL(`${YOUTUBE_API_BASE}/channels`);
    channelUrl.searchParams.set("part", "contentDetails");
    channelUrl.searchParams.set("id", channelId);

    const channelResponse = await fetch(channelUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!channelResponse.ok) {
      console.error("[YouTube API] Failed to fetch channel details");
      return [];
    }

    const channelData = await channelResponse.json();
    const uploadsPlaylistId =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return [];
    }

    // Fetch videos from uploads playlist
    const playlistUrl = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
    playlistUrl.searchParams.set("part", "snippet");
    playlistUrl.searchParams.set("playlistId", uploadsPlaylistId);
    playlistUrl.searchParams.set("maxResults", maxResults.toString());

    const playlistResponse = await fetch(playlistUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!playlistResponse.ok) {
      return [];
    }

    const playlistData = await playlistResponse.json();
    const videoIds = playlistData.items
      ?.map((item: any) => item.snippet.resourceId.videoId)
      .join(",");

    if (!videoIds) {
      return [];
    }

    // Fetch video statistics
    const videosUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
    videosUrl.searchParams.set("part", "snippet,statistics");
    videosUrl.searchParams.set("id", videoIds);

    const videosResponse = await fetch(videosUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!videosResponse.ok) {
      return [];
    }

    const videosData = await videosResponse.json();

    return videosData.items?.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnailUrl:
        video.snippet.thumbnails?.high?.url ??
        video.snippet.thumbnails?.default?.url,
      publishedAt: new Date(video.snippet.publishedAt),
      viewCount: parseInt(video.statistics.viewCount ?? "0", 10),
      likeCount: parseInt(video.statistics.likeCount ?? "0", 10),
      commentCount: parseInt(video.statistics.commentCount ?? "0", 10),
    })) ?? [];
  } catch (error) {
    console.error("[YouTube API] Error fetching videos:", error);
    return [];
  }
}

/**
 * Sync channel statistics from YouTube
 * Returns updated channel data
 */
export async function syncChannelStats(
  accessToken: string,
  youtubeChannelId: string
): Promise<{
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
} | null> {
  const channel = await getYouTubeChannelById(accessToken, youtubeChannelId);

  if (!channel) {
    return null;
  }

  return {
    subscriberCount: channel.subscriberCount,
    videoCount: channel.videoCount,
    viewCount: channel.viewCount,
  };
}

// =============================================================================
// Video Upload (Phase 2)
// =============================================================================

/**
 * Upload a video to YouTube
 * Note: This requires the youtube.upload scope
 *
 * This is a simplified version - for production, you'd want to:
 * 1. Use resumable uploads for large files
 * 2. Handle upload progress
 * 3. Implement retry logic
 */
export async function uploadVideo(
  accessToken: string,
  input: UploadVideoInput
): Promise<{ videoId: string; videoUrl: string } | null> {
  // TODO: Implement video upload using YouTube Resumable Upload API
  // https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol
  console.log("[YouTube API] Video upload not yet implemented");
  return null;
}
