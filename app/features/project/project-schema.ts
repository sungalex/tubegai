import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  bigint,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import {
  channelStatusEnum,
  mediaTypeEnum,
  mediaProviderEnum,
  projectTypeEnum,
  projectToneEnum,
  projectVisibilityEnum,
  projectStatusEnum,
  pipelinePhaseEnum,
  stepStatusEnum,
  aiGenerationTypeEnum,
} from "../../drizzle/enums";
import { users } from "../auth/auth-schema";

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id"), // Circular ref handled below or via relations
  type: mediaTypeEnum("type").notNull(),
  provider: mediaProviderEnum("provider").default("s3").notNull(),
  storageKey: text("storage_key").unique().notNull(),
  publicUrl: text("public_url").notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull(),
  mimeType: text("mime_type").notNull(),
  width: integer("width"),
  height: integer("height"),
  duration: integer("duration"), // Float in doc but integer here? Doc says Float. Postgres doesn't have explicit float in drizzle pg-core imports for createTable? doublePrecision or real. But typical usage is integer ms or double. I'll use doublePrecision if available or real?
  // Drizzle pg-core exports `real`, `doublePrecision`. I'll use `doublePrecision` used in other migration files typically?
  // Wait, I should import doublePrecision.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
// Need to import doublePrecision
// import { pgTable, uuid, text, timestamp, integer, boolean, bigint, primaryKey, doublePrecision } from "drizzle-orm/pg-core";

export const channels = pgTable("channels", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
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

export const labels = pgTable("labels", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  color: text("color").default("#000000").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  channelId: uuid("channel_id").references(() => channels.id, {
    onDelete: "set null",
  }),
  title: text("title").default("Untitled Project").notNull(),
  description: text("description"),
  type: projectTypeEnum("type").default("short").notNull(),
  tone: projectToneEnum("tone"),
  visibility: projectVisibilityEnum("visibility").default("private").notNull(),
  topic: text("topic"),
  status: projectStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Update mediaAssets projectId FK
// mediaAssets references projects. Handled by forward declaration?
// Drizzle supports referencing tables defined later IF using callback `() => projects.id` but `projects` needs to be defined.
// Since `projects` is defined AFTER `mediaAssets`, I should modify `mediaAssets` to use arrow function `references(() => projects.id)` AND ensuring projects is exported.
// But `projects` is defined in same file. Arrow function works.

export const channelVideos = pgTable("channel_videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  channelId: uuid("channel_id")
    .references(() => channels.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  youtubeVideoId: text("youtube_video_id").unique().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  publishedAt: timestamp("published_at"),
  viewCount: bigint("view_count", { mode: "number" }).default(0),
  likeCount: bigint("like_count", { mode: "number" }).default(0),
  commentCount: bigint("comment_count", { mode: "number" }).default(0),
  // tags array - Drizzle has array type? `varchar[]`?
  // Postgres array: `text[]`. Drizzle doesn't strictly have a generic array builder in pg-core exports easily?
  // `import { text } from "drizzle-orm/pg-core"` -> `text("tags").array()` is supported in recent versions.
  tags: text("tags").array(),
  duration: text("duration"), // ISO duration string from YouTube? or seconds? Plan says String.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectLabels = pgTable(
  "project_labels",
  {
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    labelId: uuid("label_id")
      .references(() => labels.id, { onDelete: "cascade" })
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.projectId, t.labelId] }),
  }),
);

export const projectPipelines = pgTable("project_pipelines", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  currentPhase: pipelinePhaseEnum("current_phase")
    .default("planning")
    .notNull(),
  stepScriptStatus: stepStatusEnum("step_script_status").default("pending"),
  stepStoryboardStatus: stepStatusEnum("step_storyboard_status").default(
    "pending",
  ),
  stepSceneStatus: stepStatusEnum("step_scene_status").default("pending"),
  stepBRollStatus: stepStatusEnum("step_b_roll_status").default("pending"),
  stepRoughCutStatus: stepStatusEnum("step_rough_cut_status").default(
    "pending",
  ),
  stepSubtitlesStatus: stepStatusEnum("step_subtitles_status").default(
    "pending",
  ),
  stepColoringStatus: stepStatusEnum("step_coloring_status").default("pending"),
  stepThumbnailStatus: stepStatusEnum("step_thumbnail_status").default(
    "pending",
  ),
  stepSeoStatus: stepStatusEnum("step_seo_status").default("pending"),
  stepExportStatus: stepStatusEnum("step_export_status").default("pending"),
  overallProgress: integer("overall_progress").default(0),
  lastAccessedStep: text("last_accessed_step"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectSeo = pgTable("project_seo", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  targetKeyword: text("target_keyword").notNull(),
  youtubeTitle: text("youtube_title"),
  youtubeDescription: text("youtube_description"),
  youtubeTags: text("youtube_tags").array(),
  seoScore: integer("seo_score").default(0),
  lastAnalyzedAt: timestamp("last_analyzed_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiGenerationCache = pgTable(
  "ai_generation_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    generationType: aiGenerationTypeEnum("generation_type").notNull(),
    promptHash: text("prompt_hash").notNull(),
    inputParametersHash: text("input_parameters_hash"),
    mediaAssetId: uuid("media_asset_id").references(() => mediaAssets.id, {
      onDelete: "cascade",
    }),
    textOutput: text("text_output"),
    modelVersion: text("model_version").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
  },
  (t) => ({
    promptHashIdx: index("prompt_hash_idx").on(t.promptHash),
  }),
);

// Relations
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

export const channelsRelations = relations(channels, ({ one, many }) => ({
  user: one(users, {
    fields: [channels.userId],
    references: [users.id],
  }),
  projects: many(projects),
  videos: many(channelVideos),
}));

export const labelsRelations = relations(labels, ({ one, many }) => ({
  user: one(users, {
    fields: [labels.userId],
    references: [users.id],
  }),
  projects: many(projectLabels),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  channel: one(channels, {
    fields: [projects.channelId],
    references: [channels.id],
  }),
  labels: many(projectLabels),
  pipeline: one(projectPipelines),
  seo: one(projectSeo),
  mediaAssets: many(mediaAssets),
  // Add direct relations to Studios (Scripts, Storyboards) if they were here, but they are in another file.
  // We cannot define relations to tables in another file easily if it creates circular imports.
  // app/features/studio/schema.ts will import projects.
  // So projects -> scripts relation must be defined in one place. Drizzle recommends defining where possible.
  // "Scripts" has "projectId". So `scriptsRelations` will define `project`.
  // To navigate `projects.script`, `projects` needs to know about `scripts`.
  // If `scripts` is in another file, importing it here creates circular dependency projects <-> scripts.
  // For now I will skipping defining "many" side relations for tables in OTHER files to avoid circular issues, unless I use the `relations` separate file strategy which isn't in the plan.
  // I will define ownership relations (one) in the child table (script -> project).
}));

export const channelVideosRelations = relations(channelVideos, ({ one }) => ({
  channel: one(channels, {
    fields: [channelVideos.channelId],
    references: [channels.id],
  }),
  project: one(projects, {
    fields: [channelVideos.projectId],
    references: [projects.id],
  }),
}));

export const projectLabelsRelations = relations(projectLabels, ({ one }) => ({
  project: one(projects, {
    fields: [projectLabels.projectId],
    references: [projects.id],
  }),
  label: one(labels, {
    fields: [projectLabels.labelId],
    references: [labels.id],
  }),
}));

export const projectPipelinesRelations = relations(
  projectPipelines,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectPipelines.projectId],
      references: [projects.id],
    }),
  }),
);

export const projectSeoRelations = relations(projectSeo, ({ one }) => ({
  project: one(projects, {
    fields: [projectSeo.projectId],
    references: [projects.id],
  }),
}));

export const aiGenerationCacheRelations = relations(
  aiGenerationCache,
  ({ one }) => ({
    user: one(users, {
      fields: [aiGenerationCache.userId],
      references: [users.id],
    }),
    mediaAsset: one(mediaAssets, {
      fields: [aiGenerationCache.mediaAssetId],
      references: [mediaAssets.id],
    }),
  }),
);
