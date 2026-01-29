/**
 * ============================================
 * Project Schema - MVP Version
 * ============================================
 *
 * MVP Tables:
 * - media_asset: Media file storage
 * - project: Project records
 *
 * DISABLED (Phase 2+):
 * - channel, channel_video, label, project_label
 * - project_pipeline, project_seo, ai_generation_cache
 */

import { uuid, text, timestamp, integer, bigint } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  mediaTypeEnum,
  mediaProviderEnum,
  projectTypeEnum,
  projectToneEnum,
  projectVisibilityEnum,
  projectStatusEnum,
} from "../../drizzle/enums";
import { users } from "../auth/auth-schema";
import { tubegaiSchema } from "../../drizzle/schema-def";

// ============================================
// MVP Tables
// ============================================

export const mediaAssets = tubegaiSchema.table("media_asset", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id"),
  type: mediaTypeEnum("type").notNull(),
  provider: mediaProviderEnum("provider").default("s3").notNull(),
  storageKey: text("storage_key").unique().notNull(),
  publicUrl: text("public_url").notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull(),
  mimeType: text("mime_type").notNull(),
  width: integer("width"),
  height: integer("height"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = tubegaiSchema.table("project", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  // DISABLED: channelId reference (Phase 2+)
  // channelId: uuid("channel_id").references(() => channels.id, { onDelete: "set null" }),
  title: text("title").default("Untitled Project").notNull(),
  description: text("description"),
  type: projectTypeEnum("type").default("short").notNull(),
  tone: projectToneEnum("tone"),
  visibility: projectVisibilityEnum("visibility").default("private").notNull(),
  topic: text("topic"),
  status: projectStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // MVP UI Support Fields
  progress: integer("progress").default(0).notNull(),
  currentStep: text("current_step"),
  thumbnailUrl: text("thumbnail_url"),
});

// ============================================
// MVP Relations
// ============================================

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  project: one(projects, {
    fields: [mediaAssets.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [mediaAssets.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  mediaAssets: many(mediaAssets),
  // DISABLED: Phase 2+ relations
  // channel: one(channels),
  // labels: many(projectLabels),
  // pipeline: one(projectPipelines),
  // seo: one(projectSeo),
  // Note: trend relation is defined in trend-schema.ts
}));

// ============================================
// DISABLED: Phase 2+ Tables
// ============================================

/*
import { primaryKey, index } from "drizzle-orm/pg-core";
import {
  channelStatusEnum,
  pipelinePhaseEnum,
  stepStatusEnum,
  aiGenerationTypeEnum,
} from "../../drizzle/enums";

export const channels = tubegaiSchema.table("channel", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  youtubeChannelId: text("youtube_channel_id").unique().notNull(),
  name: text("name").notNull(),
  handle: text("handle"),
  avatarUrl: text("avatar_url"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  status: channelStatusEnum("status").default("active").notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const labels = tubegaiSchema.table("label", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  color: text("color").default("#000000").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const channelVideos = tubegaiSchema.table("channel_video", { ... });
export const projectLabels = tubegaiSchema.table("project_label", { ... });
export const projectPipelines = tubegaiSchema.table("project_pipeline", { ... });
export const projectSeo = tubegaiSchema.table("project_seo", { ... });
export const aiGenerationCache = tubegaiSchema.table("ai_generation_cache", { ... });
*/
