/**
 * ============================================
 * Studio Schema - Full Version (Phase 1 + Phase 2+)
 * ============================================
 *
 * MVP Tables:
 * - studio_script: Script records
 * - studio_script_segment: Script segments (hook, intro, body, cta, outro)
 * - studio_storyboard: Visual scene descriptions
 * - studio_video: Generated scene videos
 * - studio_video_part: Video parts for auto-split scenes
 * - studio_export_history: Export records
 * - studio_subtitle: Subtitle segments
 * - studio_seo: SEO metadata
 *
 * Phase 2+ Tables:
 * - studio_b_roll: B-Roll assignments
 * - studio_coloring_preset: Color grading presets
 * - studio_coloring_setting: Per-project color settings
 * - studio_thumbnail: Thumbnail container
 * - studio_thumbnail_candidate: Thumbnail AI candidates
 * - studio_thumbnail_overlay: Thumbnail text/image overlays
 * - studio_rough_cut_timeline: Timeline state
 * - studio_rough_cut_timeline_segment: Timeline segments
 * - studio_rough_cut_version: Version history
 */

import {
  uuid,
  text,
  timestamp,
  integer,
  doublePrecision,
  unique,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  scriptSegmentTypeEnum,
  sceneVideoStatusEnum,
  exportFormatEnum,
  exportResolutionEnum,
  exportStatusEnum,
  uploadStatusEnum,
  bRollProviderEnum,
  thumbnailOverlayTypeEnum,
  timelineTrackTypeEnum,
  timelineResourceTypeEnum,
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

// ============================================
// Phase 2+ Tables: B-Roll
// ============================================

export const bRolls = tubegaiSchema.table("studio_b_roll", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  storyboardId: uuid("storyboard_id").references(() => storyboards.id, {
    onDelete: "set null",
  }),
  assetId: uuid("asset_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  sourceProvider: bRollProviderEnum("source_provider").notNull(),
  sourceUrl: text("source_url"),
  startTime: doublePrecision("start_time").default(0),
  endTime: doublePrecision("end_time"),
});

// ============================================
// Phase 2+ Tables: Coloring
// ============================================

export const coloringPresets = tubegaiSchema.table("studio_coloring_preset", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  filterParameters: jsonb("filter_parameters").notNull(),
});

export const coloringSettings = tubegaiSchema.table("studio_coloring_setting", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  presetId: text("preset_id").references(() => coloringPresets.id, {
    onDelete: "set null",
  }),
  customParameters: jsonb("custom_parameters"),
});

// ============================================
// Phase 2+ Tables: Thumbnail
// ============================================

export const thumbnails = tubegaiSchema.table("studio_thumbnail", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
});

export const thumbnailCandidates = tubegaiSchema.table("studio_thumbnail_candidate", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectThumbnailId: uuid("project_thumbnail_id")
    .references(() => thumbnails.id, { onDelete: "cascade" })
    .notNull(),
  imageAssetId: uuid("image_asset_id")
    .references(() => mediaAssets.id, { onDelete: "cascade" })
    .notNull(),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const thumbnailOverlays = tubegaiSchema.table("studio_thumbnail_overlay", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectThumbnailId: uuid("project_thumbnail_id")
    .references(() => thumbnails.id, { onDelete: "cascade" })
    .notNull(),
  type: thumbnailOverlayTypeEnum("type").notNull(),
  properties: jsonb("properties").notNull(),
});

// ============================================
// Phase 2+ Tables: Rough Cut
// ============================================

export const roughCutTimelines = tubegaiSchema.table("studio_rough_cut_timeline", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  zoomScale: doublePrecision("zoom_scale").default(30),
  playheadPosition: doublePrecision("playhead_position").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roughCutTimelineSegments = tubegaiSchema.table("studio_rough_cut_timeline_segment", {
  id: uuid("id").defaultRandom().primaryKey(),
  timelineId: uuid("timeline_id")
    .references(() => roughCutTimelines.id, { onDelete: "cascade" })
    .notNull(),
  trackId: text("track_id").default("V1").notNull(),
  type: timelineTrackTypeEnum("type").notNull(),
  resourceType: timelineResourceTypeEnum("resource_type").notNull(),
  resourceId: uuid("resource_id").notNull(),
  startTime: doublePrecision("start_time").notNull(),
  duration: doublePrecision("duration").notNull(),
  trimStart: doublePrecision("trim_start").default(0),
  trimEnd: doublePrecision("trim_end"),
  playbackSpeed: doublePrecision("playback_speed").default(1),
  volume: doublePrecision("volume").default(1),
  zIndex: integer("z_index").default(0),
});

export const roughCutVersions = tubegaiSchema.table("studio_rough_cut_version", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  versionNumber: integer("version_number").notNull(),
  videoAssetId: uuid("video_asset_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  duration: doublePrecision("duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// Phase 2+ Relations
// ============================================

export const bRollsRelations = relations(bRolls, ({ one }) => ({
  project: one(projects, {
    fields: [bRolls.projectId],
    references: [projects.id],
  }),
  storyboard: one(storyboards, {
    fields: [bRolls.storyboardId],
    references: [storyboards.id],
  }),
  asset: one(mediaAssets, {
    fields: [bRolls.assetId],
    references: [mediaAssets.id],
  }),
}));

export const coloringPresetsRelations = relations(coloringPresets, ({ many }) => ({
  settings: many(coloringSettings),
}));

export const coloringSettingsRelations = relations(coloringSettings, ({ one }) => ({
  project: one(projects, {
    fields: [coloringSettings.projectId],
    references: [projects.id],
  }),
  preset: one(coloringPresets, {
    fields: [coloringSettings.presetId],
    references: [coloringPresets.id],
  }),
}));

export const thumbnailsRelations = relations(thumbnails, ({ one, many }) => ({
  project: one(projects, {
    fields: [thumbnails.projectId],
    references: [projects.id],
  }),
  candidates: many(thumbnailCandidates),
  overlays: many(thumbnailOverlays),
}));

export const thumbnailCandidatesRelations = relations(thumbnailCandidates, ({ one }) => ({
  thumbnail: one(thumbnails, {
    fields: [thumbnailCandidates.projectThumbnailId],
    references: [thumbnails.id],
  }),
  imageAsset: one(mediaAssets, {
    fields: [thumbnailCandidates.imageAssetId],
    references: [mediaAssets.id],
  }),
}));

export const thumbnailOverlaysRelations = relations(thumbnailOverlays, ({ one }) => ({
  thumbnail: one(thumbnails, {
    fields: [thumbnailOverlays.projectThumbnailId],
    references: [thumbnails.id],
  }),
}));

export const roughCutTimelinesRelations = relations(roughCutTimelines, ({ one, many }) => ({
  project: one(projects, {
    fields: [roughCutTimelines.projectId],
    references: [projects.id],
  }),
  segments: many(roughCutTimelineSegments),
}));

export const roughCutTimelineSegmentsRelations = relations(roughCutTimelineSegments, ({ one }) => ({
  timeline: one(roughCutTimelines, {
    fields: [roughCutTimelineSegments.timelineId],
    references: [roughCutTimelines.id],
  }),
}));

export const roughCutVersionsRelations = relations(roughCutVersions, ({ one }) => ({
  project: one(projects, {
    fields: [roughCutVersions.projectId],
    references: [projects.id],
  }),
  videoAsset: one(mediaAssets, {
    fields: [roughCutVersions.videoAssetId],
    references: [mediaAssets.id],
  }),
}));
