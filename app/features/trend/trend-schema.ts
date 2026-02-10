/**
 * ============================================
 * Trend Schema - MVP Version
 * ============================================
 *
 * Tables:
 * - trend: YouTube/AI-generated trending video topics
 *
 * Purpose:
 * - Store trending topics from YouTube API or AI generation
 * - Allow users to select trends for project creation
 * - Track which trends were used for projects
 *
 * NOTE: AI recommendations are now unified into the 'idea' table
 * in project-schema.ts (see ideaSourceEnum for source distinction)
 */

import { uuid, text, timestamp, bigint, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
// Note: Some imports kept for legacy compatibility even if not directly used
import { trendSourceEnum } from "../../drizzle/enums";
import { users } from "../auth/auth-schema";
import { tubegaiSchema } from "../../drizzle/schema-def";

// ============================================
// Trend Table
// ============================================

export const trends = tubegaiSchema.table("trend", {
  id: uuid("id").defaultRandom().primaryKey(),

  // User association (null = global/public trend)
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),

  // Trend content
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),

  // Metrics
  viewsCount: text("views_count"), // e.g., "1.2M", "850K"
  growthRate: text("growth_rate"), // e.g., "+145%", "+89%"

  // Media
  thumbnailUrl: text("thumbnail_url"),

  // Tags (array of strings)
  tags: text("tags").array().default([]).notNull(),

  // Source tracking
  source: trendSourceEnum("source").default("ai_generated").notNull(),
  externalId: text("external_id").unique(), // YouTube video ID, etc.
  externalUrl: text("external_url"), // Original URL

  // Project tracking (FK constraint defined in migration)
  usedForProjectId: uuid("used_for_project_id"),

  // Analytics
  viewCount: bigint("view_count", { mode: "number" }), // Actual numeric view count
  likeCount: bigint("like_count", { mode: "number" }),
  commentCount: bigint("comment_count", { mode: "number" }),

  // Timestamps
  publishedAt: timestamp("published_at"), // When the trend was published
  fetchedAt: timestamp("fetched_at").defaultNow(), // When we fetched this trend
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // ============================================
  // Filtering Fields (Phase 1 Enhancement)
  // ============================================
  regionCode: text("region_code").default("KR"),
  languageCode: text("language_code").default("ko"),
  videoDuration: text("video_duration"), // 'short' | 'medium' | 'long'

  // ============================================
  // Usage Tracking (Phase 1 Enhancement)
  // ============================================
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),

  // ============================================
  // User Saved Trends (Bookmark)
  // ============================================
  isSaved: boolean("is_saved").default(false),
  savedByUserId: uuid("saved_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  savedAt: timestamp("saved_at"),
});

// ============================================
// Relations
// ============================================

import { ideas, ideaTrends } from "../project/project-schema";

export const trendsRelations = relations(trends, ({ one, many }) => ({
  user: one(users, {
    fields: [trends.userId],
    references: [users.id],
  }),
  ideaTrends: many(ideaTrends),
  // Note: usedForProject relation removed to avoid circular import
  // FK constraint is defined in migration
}));

/**
 * Extended ideaTrends relation to include trend reference
 * This completes the bidirectional relationship for Drizzle ORM
 */
export const ideaTrendsTrendRelation = relations(ideaTrends, ({ one }) => ({
  trend: one(trends, {
    fields: [ideaTrends.trendId],
    references: [trends.id],
  }),
}));

// ============================================
// Legacy: AI Recommendation (DEPRECATED)
// ============================================
// AI recommendations are now unified into the 'idea' table in project-schema.ts
// Use ideas table with source='ai_generated' instead.
// This export is kept for backward compatibility during migration.
export const aiRecommendations = ideas;
export const aiRecommendationsRelations = {};
