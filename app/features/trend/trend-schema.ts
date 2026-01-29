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
 */

import { uuid, text, timestamp, bigint } from "drizzle-orm/pg-core";
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

export const trendsRelations = relations(trends, ({ one }) => ({
  user: one(users, {
    fields: [trends.userId],
    references: [users.id],
  }),
  usedForProject: one(projects, {
    fields: [trends.usedForProjectId],
    references: [projects.id],
  }),
}));
