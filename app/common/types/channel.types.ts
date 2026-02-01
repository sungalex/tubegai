// =============================================================================
// Channel Types
// =============================================================================
// Shared types for channel data across client and server

/**
 * Channel with computed stats (project count)
 */
export interface Channel {
  id: string;
  userId: string;
  youtubeChannelId: string;
  name: string;
  handle: string | null;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  subscriberCount: number | null;
  videoCount: number | null;
  viewCount: number | null;
  status: "active" | "error" | "syncing";
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Computed
  projectCount: number;
  // OAuth status (has valid tokens)
  hasOAuthTokens: boolean;
}

/**
 * Input for creating a new channel
 */
export interface CreateChannelInput {
  youtubeChannelId: string;
  name: string;
  handle?: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
  viewCount?: number;
  // OAuth tokens (optional, for sync/upload)
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

/**
 * Input for updating an existing channel
 */
export interface UpdateChannelInput {
  name?: string;
  handle?: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
  viewCount?: number;
  status?: "active" | "error" | "syncing";
  lastSyncedAt?: Date;
  // OAuth tokens
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
}
