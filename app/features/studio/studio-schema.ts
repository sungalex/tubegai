import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  doublePrecision,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  scriptSegmentTypeEnum,
  sceneVideoStatusEnum,
  bRollProviderEnum,
  timelineTrackTypeEnum,
  timelineResourceTypeEnum,
  thumbnailOverlayTypeEnum,
  exportFormatEnum,
  exportResolutionEnum,
  exportStatusEnum,
  uploadStatusEnum,
} from "../../drizzle/enums";
import { projects, mediaAssets } from "../project/project-schema";

// Pre-Production
export const scripts = pgTable("scripts", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  prompt: text("prompt"),
  targetDuration: integer("target_duration"),
  savedAt: timestamp("saved_at").defaultNow(),
});

export const scriptSegments = pgTable("script_segments", {
  id: uuid("id").defaultRandom().primaryKey(),
  scriptId: uuid("script_id")
    .references(() => scripts.id, { onDelete: "cascade" })
    .notNull(),
  orderIndex: integer("order_index").notNull(),
  type: scriptSegmentTypeEnum("type").notNull(),
  content: text("content").notNull(),
  estimatedDuration: integer("estimated_duration"),
});

export const storyboards = pgTable("storyboards", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
});

export const storyboardScenes = pgTable("storyboard_scenes", {
  id: uuid("id").defaultRandom().primaryKey(),
  storyboardId: uuid("storyboard_id")
    .references(() => storyboards.id, { onDelete: "cascade" })
    .notNull(),
  scriptSegmentId: uuid("script_segment_id").references(
    () => scriptSegments.id,
    { onDelete: "set null" },
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

// Production (Assets)
export const sceneVideos = pgTable("scene_videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  storyboardSceneId: uuid("storyboard_scene_id")
    .references(() => storyboardScenes.id, { onDelete: "cascade" })
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

export const bRolls = pgTable("b_rolls", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  storyboardSceneId: uuid("storyboard_scene_id").references(
    () => storyboardScenes.id,
    { onDelete: "set null" },
  ),
  assetId: uuid("asset_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  sourceProvider: bRollProviderEnum("source_provider").notNull(),
  sourceUrl: text("source_url"),
  startTime: doublePrecision("start_time").default(0),
  endTime: doublePrecision("end_time"),
});

// Production (Rough Cut)
export const roughCutTimelines = pgTable("rough_cut_timelines", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  zoomScale: doublePrecision("zoom_scale").default(30),
  currentTime: doublePrecision("current_time").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const timelineSegments = pgTable("timeline_segments", {
  id: uuid("id").defaultRandom().primaryKey(),
  timelineId: uuid("timeline_id")
    .references(() => roughCutTimelines.id, { onDelete: "cascade" })
    .notNull(),
  trackId: text("track_id").default("V1").notNull(),
  type: timelineTrackTypeEnum("type").notNull(), // video / audio
  resourceType: timelineResourceTypeEnum("resource_type").notNull(),
  resourceId: uuid("resource_id").notNull(), // Polymorphic ID
  startTime: doublePrecision("start_time").notNull(),
  duration: doublePrecision("duration").notNull(),
  trimStart: doublePrecision("trim_start").default(0),
  trimEnd: doublePrecision("trim_end"),
  playbackSpeed: doublePrecision("playback_speed").default(1.0),
  volume: doublePrecision("volume").default(1.0),
  zIndex: integer("z_index").default(0),
});

export const roughCutVersions = pgTable("rough_cut_versions", {
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

// Post-Production
export const subtitles = pgTable("subtitles", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  startTime: doublePrecision("start_time").notNull(),
  endTime: doublePrecision("end_time").notNull(),
  text: text("text").notNull(),
  styleJson: jsonb("style_json"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const coloringPresets = pgTable("coloring_presets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  filterParameters: jsonb("filter_parameters").notNull(),
});

export const projectColoringSettings = pgTable("project_coloring_settings", {
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

export const projectThumbnails = pgTable("project_thumbnails", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  // selectedCandidateId circular ref handled below
});

export const thumbnailCandidates = pgTable("thumbnail_candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectThumbnailId: uuid("project_thumbnail_id")
    .references(() => projectThumbnails.id, { onDelete: "cascade" })
    .notNull(),
  imageAssetId: uuid("image_asset_id")
    .references(() => mediaAssets.id, { onDelete: "cascade" })
    .notNull(),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const thumbnailOverlays = pgTable("thumbnail_overlays", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectThumbnailId: uuid("project_thumbnail_id")
    .references(() => projectThumbnails.id, { onDelete: "cascade" })
    .notNull(),
  type: thumbnailOverlayTypeEnum("type").notNull(),
  properties: jsonb("properties").notNull(),
});

// Add cyclic reference column to projectThumbnails
// We can't easily add a column to an existing table var in Drizzle like this without redefining or some tricks.
// But Drizzle's `pgTable` returns an object. We can't mutate it.
// We must define columns in `pgTable`.
// `selectedCandidateId: uuid("selected_candidate_id").references(() => thumbnailCandidates.id)`
// Since `thumbnailCandidates` is defined AFTER `projectThumbnails`, we use arrow function.
// Redefining `projectThumbnails` to include the column.

// Delivery
export const exportHistory = pgTable("export_history", {
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

// Relations
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
  storyboardScene: one(storyboardScenes), // mapped from storyboard_scenes.script_segment_id
}));

export const storyboardsRelations = relations(storyboards, ({ one, many }) => ({
  project: one(projects, {
    fields: [storyboards.projectId],
    references: [projects.id],
  }),
  scenes: many(storyboardScenes),
}));

export const storyboardScenesRelations = relations(
  storyboardScenes,
  ({ one }) => ({
    storyboard: one(storyboards, {
      fields: [storyboardScenes.storyboardId],
      references: [storyboards.id],
    }),
    scriptSegment: one(scriptSegments, {
      fields: [storyboardScenes.scriptSegmentId],
      references: [scriptSegments.id],
    }),
    imageAsset: one(mediaAssets, {
      fields: [storyboardScenes.imageAssetId],
      references: [mediaAssets.id],
    }),
    sceneVideo: one(sceneVideos),
  }),
);

export const sceneVideosRelations = relations(sceneVideos, ({ one }) => ({
  storyboardScene: one(storyboardScenes, {
    fields: [sceneVideos.storyboardSceneId],
    references: [storyboardScenes.id],
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

export const bRollsRelations = relations(bRolls, ({ one }) => ({
  project: one(projects, {
    fields: [bRolls.projectId],
    references: [projects.id],
  }),
  storyboardScene: one(storyboardScenes, {
    fields: [bRolls.storyboardSceneId],
    references: [storyboardScenes.id],
  }),
  asset: one(mediaAssets, {
    fields: [bRolls.assetId],
    references: [mediaAssets.id],
  }),
}));

export const roughCutTimelinesRelations = relations(
  roughCutTimelines,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [roughCutTimelines.projectId],
      references: [projects.id],
    }),
    segments: many(timelineSegments),
  }),
);

export const timelineSegmentsRelations = relations(
  timelineSegments,
  ({ one }) => ({
    timeline: one(roughCutTimelines, {
      fields: [timelineSegments.timelineId],
      references: [roughCutTimelines.id],
    }),
    // Polymorphic relation to resourceId is not directly supported in Drizzle relations for auto-fetching.
  }),
);

export const roughCutVersionsRelations = relations(
  roughCutVersions,
  ({ one }) => ({
    project: one(projects, {
      fields: [roughCutVersions.projectId],
      references: [projects.id],
    }),
    videoAsset: one(mediaAssets, {
      fields: [roughCutVersions.videoAssetId],
      references: [mediaAssets.id],
    }),
  }),
);

export const subtitlesRelations = relations(subtitles, ({ one }) => ({
  project: one(projects, {
    fields: [subtitles.projectId],
    references: [projects.id],
  }),
}));

export const projectColoringSettingsRelations = relations(
  projectColoringSettings,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectColoringSettings.projectId],
      references: [projects.id],
    }),
    preset: one(coloringPresets, {
      fields: [projectColoringSettings.presetId],
      references: [coloringPresets.id],
    }),
  }),
);

export const projectThumbnailsRelations = relations(
  projectThumbnails,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectThumbnails.projectId],
      references: [projects.id],
    }),
    candidates: many(thumbnailCandidates),
    overlays: many(thumbnailOverlays),
    // selectedCandidate: ... defined below if column exists
  }),
);

export const thumbnailCandidatesRelations = relations(
  thumbnailCandidates,
  ({ one }) => ({
    projectThumbnail: one(projectThumbnails, {
      fields: [thumbnailCandidates.projectThumbnailId],
      references: [projectThumbnails.id],
    }),
    imageAsset: one(mediaAssets, {
      fields: [thumbnailCandidates.imageAssetId],
      references: [mediaAssets.id],
    }),
  }),
);

export const thumbnailOverlaysRelations = relations(
  thumbnailOverlays,
  ({ one }) => ({
    projectThumbnail: one(projectThumbnails, {
      fields: [thumbnailOverlays.projectThumbnailId],
      references: [projectThumbnails.id],
    }),
  }),
);

export const exportHistoryRelations = relations(exportHistory, ({ one }) => ({
  project: one(projects, {
    fields: [exportHistory.projectId],
    references: [projects.id],
  }),
  videoAsset: one(mediaAssets, {
    fields: [exportHistory.videoAssetId],
    references: [mediaAssets.id],
  }),
}));
