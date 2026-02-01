// =============================================================================
// Channel Data Access Layer
// =============================================================================
// Manages YouTube channel CRUD operations

import { eq, and, desc } from "drizzle-orm";
import { db, schema } from "~/lib/db.server";
import type {
  Channel,
  CreateChannelInput,
  UpdateChannelInput,
} from "~/common/types/channel.types";

// Re-export types for convenience
export type { Channel, CreateChannelInput, UpdateChannelInput };

// =============================================================================
// Helper Functions
// =============================================================================

function mapChannelToType(
  channel: typeof schema.channels.$inferSelect & { projects: { id: string }[] }
): Channel {
  return {
    id: channel.id,
    userId: channel.userId,
    youtubeChannelId: channel.youtubeChannelId,
    name: channel.name,
    handle: channel.handle,
    description: channel.description,
    avatarUrl: channel.avatarUrl,
    bannerUrl: channel.bannerUrl,
    subscriberCount: channel.subscriberCount,
    videoCount: channel.videoCount,
    viewCount: channel.viewCount,
    status: channel.status,
    lastSyncedAt: channel.lastSyncedAt,
    createdAt: channel.createdAt,
    updatedAt: channel.updatedAt,
    projectCount: channel.projects.length,
    hasOAuthTokens: !!channel.accessToken && !!channel.refreshToken,
  };
}

// =============================================================================
// Channel CRUD Operations
// =============================================================================

/**
 * Get all channels for a user
 */
export async function getChannels(userId: string): Promise<Channel[]> {
  const channels = await db.query.channels.findMany({
    where: eq(schema.channels.userId, userId),
    orderBy: [desc(schema.channels.createdAt)],
    with: {
      projects: {
        columns: { id: true },
      },
    },
  });

  return channels.map(mapChannelToType);
}

/**
 * Get a single channel by ID
 */
export async function getChannelById(
  channelId: string,
  userId: string
): Promise<Channel | null> {
  const channel = await db.query.channels.findFirst({
    where: and(
      eq(schema.channels.id, channelId),
      eq(schema.channels.userId, userId)
    ),
    with: {
      projects: {
        columns: { id: true },
      },
    },
  });

  if (!channel) return null;
  return mapChannelToType(channel);
}

/**
 * Get channel by YouTube channel ID
 */
export async function getChannelByYouTubeId(
  youtubeChannelId: string,
  userId: string
): Promise<Channel | null> {
  const channel = await db.query.channels.findFirst({
    where: and(
      eq(schema.channels.youtubeChannelId, youtubeChannelId),
      eq(schema.channels.userId, userId)
    ),
    with: {
      projects: {
        columns: { id: true },
      },
    },
  });

  if (!channel) return null;
  return mapChannelToType(channel);
}

/**
 * Upsert channel - create if not exists, update if exists
 * Uses atomic ON CONFLICT DO UPDATE to prevent race conditions
 */
export async function upsertChannel(
  userId: string,
  input: CreateChannelInput
): Promise<{ id: string; isNew: boolean }> {
  // Check if channel already exists for this user
  const existing = await db.query.channels.findFirst({
    where: and(
      eq(schema.channels.youtubeChannelId, input.youtubeChannelId),
      eq(schema.channels.userId, userId)
    ),
    columns: { id: true },
  });

  if (existing) {
    // Update existing channel
    await db
      .update(schema.channels)
      .set({
        name: input.name,
        handle: input.handle,
        description: input.description,
        avatarUrl: input.avatarUrl,
        bannerUrl: input.bannerUrl,
        subscriberCount: input.subscriberCount,
        videoCount: input.videoCount,
        viewCount: input.viewCount,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        tokenExpiresAt: input.tokenExpiresAt,
        status: "active",
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.channels.id, existing.id));

    return { id: existing.id, isNew: false };
  }

  // Create new channel
  const [channel] = await db
    .insert(schema.channels)
    .values({
      userId,
      youtubeChannelId: input.youtubeChannelId,
      name: input.name,
      handle: input.handle,
      description: input.description,
      avatarUrl: input.avatarUrl,
      bannerUrl: input.bannerUrl,
      subscriberCount: input.subscriberCount,
      videoCount: input.videoCount,
      viewCount: input.viewCount,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenExpiresAt: input.tokenExpiresAt,
      status: "active",
      lastSyncedAt: new Date(),
    })
    .returning({ id: schema.channels.id });

  return { id: channel.id, isNew: true };
}

/**
 * Update an existing channel
 */
export async function updateChannel(
  channelId: string,
  userId: string,
  input: UpdateChannelInput
): Promise<void> {
  await db
    .update(schema.channels)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.channels.id, channelId),
        eq(schema.channels.userId, userId)
      )
    );
}

/**
 * Delete a channel
 */
export async function deleteChannel(
  channelId: string,
  userId: string
): Promise<void> {
  await db
    .delete(schema.channels)
    .where(
      and(
        eq(schema.channels.id, channelId),
        eq(schema.channels.userId, userId)
      )
    );
}

/**
 * Update channel OAuth tokens
 */
export async function updateChannelTokens(
  channelId: string,
  userId: string,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
  }
): Promise<void> {
  await db
    .update(schema.channels)
    .set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.tokenExpiresAt,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.channels.id, channelId),
        eq(schema.channels.userId, userId)
      )
    );
}

/**
 * Clear channel OAuth tokens (on session end)
 */
export async function clearChannelTokens(
  channelId: string,
  userId: string
): Promise<void> {
  await db
    .update(schema.channels)
    .set({
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.channels.id, channelId),
        eq(schema.channels.userId, userId)
      )
    );
}

/**
 * Sync channel data from YouTube API
 * Updates channel statistics and lastSyncedAt
 */
export async function syncChannelStats(
  channelId: string,
  userId: string,
  stats: {
    name?: string;
    handle?: string;
    description?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    subscriberCount?: number;
    videoCount?: number;
    viewCount?: number;
  }
): Promise<void> {
  await db
    .update(schema.channels)
    .set({
      ...stats,
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.channels.id, channelId),
        eq(schema.channels.userId, userId)
      )
    );
}

/**
 * Get channel with OAuth tokens (for API calls)
 */
export async function getChannelWithTokens(
  channelId: string,
  userId: string
): Promise<{
  id: string;
  youtubeChannelId: string;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
} | null> {
  const channel = await db.query.channels.findFirst({
    where: and(
      eq(schema.channels.id, channelId),
      eq(schema.channels.userId, userId)
    ),
    columns: {
      id: true,
      youtubeChannelId: true,
      accessToken: true,
      refreshToken: true,
      tokenExpiresAt: true,
    },
  });

  return channel ?? null;
}
