/**
 * ============================================
 * Trend Schema - MVP Version (Phase 3.1 Enhanced)
 * ============================================
 *
 * Tables:
 * - trend: YouTube/AI-generated trending video topics
 * - ai_recommendation: AI-generated project recommendations (Phase 3.1)
 *
 * Purpose:
 * - Store trending topics from YouTube API or AI generation
 * - Allow users to select trends for project creation
 * - Track which trends were used for projects
 * - Store AI recommendations for better user experience (Phase 3.1)
 */

import { uuid, text, timestamp, bigint, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { trendSourceEnum } from "../../drizzle/enums";
import { users } from "../auth/auth-schema";
import { projects } from "../project/project-schema";
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
  externalId: text("external_id"), // YouTube video ID, etc.
  externalUrl: text("external_url"), // Original URL

  // Project tracking
  usedForProjectId: uuid("used_for_project_id").references(() => projects.id, {
    onDelete: "set null",
  }),

  // Analytics
  viewCount: bigint("view_count", { mode: "number" }), // Actual numeric view count
  likeCount: bigint("like_count", { mode: "number" }),
  commentCount: bigint("comment_count", { mode: "number" }),

  // Timestamps
  publishedAt: timestamp("published_at"), // When the trend was published
  fetchedAt: timestamp("fetched_at").defaultNow(), // When we fetched this trend
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// Relations
// ============================================

export const trendsRelations = relations(trends, ({ one, many }) => ({
  user: one(users, {
    fields: [trends.userId],
    references: [users.id],
  }),
  usedForProject: one(projects, {
    fields: [trends.usedForProjectId],
    references: [projects.id],
  }),
  // Phase 3.1: AI Recommendations that reference this trend
  recommendations: many(aiRecommendations),
}));

// ============================================
// Phase 3.1: AI Recommendation Table
// ============================================

export const aiRecommendations = tubegaiSchema.table("ai_recommendation", {
  id: uuid("id").defaultRandom().primaryKey(),

  // User association
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),

  // Recommendation content
  title: text("title").notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  category: text("category"),
  growthRate: text("growth_rate"),

  // YouTube content parameters
  hooks: text("hooks").array().default([]),
  targetAudience: text("target_audience"),
  estimatedViews: text("estimated_views"),
  difficulty: text("difficulty"), // easy, medium, hard
  videoType: text("video_type"), // short, medium, long
  contentTone: text("content_tone"), // informative, funny, dramatic, casual, professional

  // Scoring
  score: integer("score"), // Relevance score 0-100

  // References
  trendId: uuid("trend_id").references(() => trends.id, { onDelete: "set null" }),
  basedOnTrends: text("based_on_trends").array().default([]), // Trend titles used for generation
  usedForProjectId: uuid("used_for_project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  isUsed: integer("is_used").default(0), // 0 = not used, 1 = used

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Auto-expire old recommendations
});

// ============================================
// Phase 3.1: AI Recommendation Relations
// ============================================

export const aiRecommendationsRelations = relations(aiRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [aiRecommendations.userId],
    references: [users.id],
  }),
  trend: one(trends, {
    fields: [aiRecommendations.trendId],
    references: [trends.id],
  }),
  usedForProject: one(projects, {
    fields: [aiRecommendations.usedForProjectId],
    references: [projects.id],
  }),
}));
