/**
 * ============================================
 * Studio Schema - MVP Version (Phase 1 Enabled)
 * ============================================
 *
 * MVP Tables:
 * - studio_script: Script records
 * - studio_script_segment: Script segments (hook, intro, body, cta, outro)
 * - studio_storyboard: Visual scene descriptions
 * - studio_video: Generated scene videos
 * - studio_video_part: Video parts for auto-split scenes (ENABLED in Phase 1)
 * - studio_export_history: Export records
 * - studio_subtitle: Subtitle segments
 * - studio_seo: SEO metadata
 *
 * DISABLED (Phase 2+):
 * - studio_b_roll, studio_rough_cut_*
 * - studio_coloring_*, studio_thumbnail_*
 */

import {
  uuid,
  text,
  timestamp,
  integer,
  doublePrecision,
  unique,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  scriptSegmentTypeEnum,
  sceneVideoStatusEnum,
  exportFormatEnum,
  exportResolutionEnum,
  exportStatusEnum,
  uploadStatusEnum,
} from "../../drizzle/enums";
import { projects, mediaAssets } from "../project/project-schema";
import { tubegaiSchema } from "../../drizzle/schema-def";

// ============================================
// MVP Tables: Pre-Production
// ============================================

export const scripts = tubegaiSchema.table("studio_script", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  prompt: text("prompt"),
  targetDuration: integer("target_duration"),
  savedAt: timestamp("saved_at").defaultNow(),
});

export const scriptSegments = tubegaiSchema.table("studio_script_segment", {
  id: uuid("id").defaultRandom().primaryKey(),
  scriptId: uuid("script_id")
    .references(() => scripts.id, { onDelete: "cascade" })
    .notNull(),
  orderIndex: integer("order_index").notNull(),
  type: scriptSegmentTypeEnum("type").notNull(),
  content: text("content").notNull(),
  estimatedDuration: integer("estimated_duration"),
});

export const storyboards = tubegaiSchema.table("studio_storyboard", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  scriptSegmentId: uuid("script_segment_id")
    .references(() => scriptSegments.id, { onDelete: "set null" })
    .notNull(), // Phase 2: Made required for proper grouping
  sceneNumber: integer("scene_number").notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
  description: text("description"),
  visualPrompt: text("visual_prompt"),
  duration: integer("duration"), // Phase 2: Added duration field
  imageAssetId: uuid("image_asset_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// MVP Tables: Production (Scene Videos)
// ============================================

export const sceneVideos = tubegaiSchema.table("studio_video", {
  id: uuid("id").defaultRandom().primaryKey(),
  storyboardId: uuid("storyboard_id")
    .references(() => storyboards.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  videoAssetId: uuid("video_asset_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  duration: doublePrecision("duration"),
  status: sceneVideoStatusEnum("status").default("generating"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// Phase 1: Video Parts (for auto-split scenes)
// ============================================

export const videoParts = tubegaiSchema.table(
  "studio_video_part",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    videoId: uuid("video_id")
      .references(() => sceneVideos.id, { onDelete: "cascade" })
      .notNull(),
    partNumber: integer("part_number").notNull(),
    startTime: doublePrecision("start_time").notNull(),
    endTime: doublePrecision("end_time").notNull(),
    duration: doublePrecision("duration").notNull(),
    status: sceneVideoStatusEnum("status").default("pending").notNull(),
    videoAssetId: uuid("video_asset_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueVideoPart: unique().on(table.videoId, table.partNumber),
  })
);

// ============================================
// MVP Tables: Delivery (Export)
// ============================================

export const exportHistorys = tubegaiSchema.table("studio_export_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  format: exportFormatEnum("format").default("mp4").notNull(),
  resolution: exportResolutionEnum("resolution").default("1080p").notNull(),
  status: exportStatusEnum("status").default("pending"),
  videoAssetId: uuid("video_asset_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  uploadStatus: uploadStatusEnum("upload_status").default("not_uploaded"),
  completedAt: timestamp("completed_at"),

  // Phase 2: Additional export settings
  frameRate: integer("frame_rate").default(30),
  quality: text("quality").default("high"),
  hardwareAcceleration: boolean("hardware_acceleration").default(true),
  privacy: text("privacy"), // YouTube privacy: public, unlisted, private
  scheduledAt: timestamp("scheduled_at"), // Scheduled publish time
});

// ============================================
// MVP Relations
// ============================================

export const scriptsRelations = relations(scripts, ({ one, many }) => ({
  project: one(projects, {
    fields: [scripts.projectId],
    references: [projects.id],
  }),
  segments: many(scriptSegments),
}));

export const scriptSegmentsRelations = relations(scriptSegments, ({ one }) => ({
  script: one(scripts, {
    fields: [scriptSegments.scriptId],
    references: [scripts.id],
  }),
  storyboard: one(storyboards),
}));

export const storyboardsRelations = relations(storyboards, ({ one }) => ({
  project: one(projects, {
    fields: [storyboards.projectId],
    references: [projects.id],
  }),
  scriptSegment: one(scriptSegments, {
    fields: [storyboards.scriptSegmentId],
    references: [scriptSegments.id],
  }),
  imageAsset: one(mediaAssets, {
    fields: [storyboards.imageAssetId],
    references: [mediaAssets.id],
  }),
  sceneVideo: one(sceneVideos),
}));

export const sceneVideosRelations = relations(sceneVideos, ({ one, many }) => ({
  storyboard: one(storyboards, {
    fields: [sceneVideos.storyboardId],
    references: [storyboards.id],
  }),
  project: one(projects, {
    fields: [sceneVideos.projectId],
    references: [projects.id],
  }),
  videoAsset: one(mediaAssets, {
    fields: [sceneVideos.videoAssetId],
    references: [mediaAssets.id],
  }),
  parts: many(videoParts),
}));

export const videoPartsRelations = relations(videoParts, ({ one }) => ({
  video: one(sceneVideos, {
    fields: [videoParts.videoId],
    references: [sceneVideos.id],
  }),
  videoAsset: one(mediaAssets, {
    fields: [videoParts.videoAssetId],
    references: [mediaAssets.id],
  }),
}));

export const exportHistorysRelations = relations(exportHistorys, ({ one }) => ({
  project: one(projects, {
    fields: [exportHistorys.projectId],
    references: [projects.id],
  }),
  videoAsset: one(mediaAssets, {
    fields: [exportHistorys.videoAssetId],
    references: [mediaAssets.id],
  }),
}));

// ============================================
// MVP Tables: Post-Production
// ============================================

export const subtitles = tubegaiSchema.table("studio_subtitle", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  startTime: doublePrecision("start_time").notNull(),
  endTime: doublePrecision("end_time").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const seos = tubegaiSchema.table("studio_seo", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  title: text("title"),
  description: text("description"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// Post-Production Relations
// ============================================

export const subtitlesRelations = relations(subtitles, ({ one }) => ({
  project: one(projects, {
    fields: [subtitles.projectId],
    references: [projects.id],
  }),
}));

export const seosRelations = relations(seos, ({ one }) => ({
  project: one(projects, {
    fields: [seos.projectId],
    references: [projects.id],
  }),
}));
