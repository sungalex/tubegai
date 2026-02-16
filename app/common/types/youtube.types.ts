// =============================================================================
// YouTube Data API v3 Types
// =============================================================================

export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeThumbnails {
  default: YouTubeThumbnail;
  medium: YouTubeThumbnail;
  high: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
}

export interface YouTubeVideoSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  channelTitle: string;
  tags?: string[];
  categoryId: string;
  liveBroadcastContent: string;
  defaultLanguage?: string;
  localized: {
    title: string;
    description: string;
  };
  defaultAudioLanguage?: string;
}

export interface YouTubeVideoStatistics {
  viewCount: string;
  likeCount?: string;
  favoriteCount: string;
  commentCount?: string;
}

export interface YouTubeVideoContentDetails {
  duration: string; // ISO 8601 (e.g., "PT15M33S")
}

export interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: YouTubeVideoSnippet;
  statistics: YouTubeVideoStatistics;
  contentDetails?: YouTubeVideoContentDetails;
}

export interface YouTubePageInfo {
  totalResults: number;
  resultsPerPage: number;
}

export interface YouTubeVideosListResponse {
  kind: string;
  etag: string;
  items: YouTubeVideoItem[];
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: YouTubePageInfo;
}
