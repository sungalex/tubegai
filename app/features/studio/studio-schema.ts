/**
 * ============================================
 * Studio Schema - MVP Version
 * ============================================
 *
 * MVP Tables:
 * - studio_script: Script records
 * - studio_script_segment: Script segments (hook, intro, body, cta, outro)
 * - studio_storyboard: Visual scene descriptions
 * - studio_video: Generated scene videos
 * - studio_export_history: Export records
 *
 * DISABLED (Phase 2+):
 * - studio_b_roll, studio_rough_cut_*, studio_subtitle
 * - studio_coloring_*, studio_thumbnail_*
 */

import {
  uuid,
  text,
  timestamp,
  integer,
  doublePrecision,
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
  scriptSegmentId: uuid("script_segment_id").references(
    () => scriptSegments.id,
    { onDelete: "set null" }
  ),
  sceneNumber: integer("scene_number").notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
  description: text("description"),
  visualPrompt: text("visual_prompt"),
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

export const sceneVideosRelations = relations(sceneVideos, ({ one }) => ({
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
// DISABLED: Phase 2+ Tables
// ============================================

/*
import { boolean, jsonb, primaryKey } from "drizzle-orm/pg-core";
import {
  bRollProviderEnum,
  timelineTrackTypeEnum,
  timelineResourceTypeEnum,
  thumbnailOverlayTypeEnum,
} from "../../drizzle/enums";

// B-Roll
export const bRolls = tubegaiSchema.table("studio_b_roll", { ... });

// Rough Cut
export const roughCutTimelines = tubegaiSchema.table("studio_rough_cut_timeline", { ... });
export const timelineSegments = tubegaiSchema.table("studio_rough_cut_timeline_segment", { ... });
export const roughCutVersions = tubegaiSchema.table("studio_rough_cut_version", { ... });

// Subtitles
export const subtitles = tubegaiSchema.table("studio_subtitle", { ... });

// Coloring
export const coloringPresets = tubegaiSchema.table("studio_coloring_preset", { ... });
export const projectColoringSettings = tubegaiSchema.table("studio_coloring_setting", { ... });

// Thumbnails
export const projectThumbnails = tubegaiSchema.table("studio_thumbnail", { ... });
export const thumbnailCandidates = tubegaiSchema.table("studio_thumbnail_candidate", { ... });
export const thumbnailOverlays = tubegaiSchema.table("studio_thumbnail_overlay", { ... });
*/
