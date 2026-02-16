/**
 * ============================================
 * TrendTube Schema - Studio Dashboard Pipeline
 * ============================================
 *
 * Tables:
 * - trendtube_session: 파이프라인 세션
 * - trendtube_result: 생성 결과 (텍스트)
 * - trendtube_media: 생성된 미디어 에셋
 */

import { uuid, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  trendtubePipelineStatusEnum,
  trendtubeMediaTypeEnum,
} from "../../drizzle/enums";
import { projects, mediaAssets } from "../project/project-schema";
import { users } from "../auth/auth-schema";
import { tubegaiSchema } from "../../drizzle/schema-def";

// ============================================
// TrendTube Session
// ============================================

export const trendtubeSessions = tubegaiSchema.table("trendtube_session", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  trendsUrl: text("trends_url").notNull(),
  userIdea: text("user_idea").notNull(),
  referenceImageUrl: text("reference_image_url"),
  voiceOption: text("voice_option").default("female_ko"),
  status: trendtubePipelineStatusEnum("status").default("pending").notNull(),
  currentStep: integer("current_step").default(0).notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// ============================================
// TrendTube Result (text outputs)
// ============================================

export const trendtubeResults = tubegaiSchema.table("trendtube_result", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => trendtubeSessions.id, { onDelete: "cascade" })
    .notNull(),
  extractedTrends: text("extracted_trends"),
  videoIdeas: text("video_ideas"),
  narrationScript: text("narration_script"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// TrendTube Media (generated assets)
// ============================================

export const trendtubeMedia = tubegaiSchema.table("trendtube_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => trendtubeSessions.id, { onDelete: "cascade" })
    .notNull(),
  mediaType: trendtubeMediaTypeEnum("media_type").notNull(),
  mediaAssetId: uuid("media_asset_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  publicUrl: text("public_url"),
  metadata: jsonb("metadata"),
  prompt: text("prompt"),
  clipNumber: integer("clip_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// Relations
// ============================================

export const trendtubeSessionsRelations = relations(
  trendtubeSessions,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [trendtubeSessions.projectId],
      references: [projects.id],
    }),
    user: one(users, {
      fields: [trendtubeSessions.userId],
      references: [users.id],
    }),
    result: one(trendtubeResults),
    media: many(trendtubeMedia),
  })
);

export const trendtubeResultsRelations = relations(
  trendtubeResults,
  ({ one }) => ({
    session: one(trendtubeSessions, {
      fields: [trendtubeResults.sessionId],
      references: [trendtubeSessions.id],
    }),
  })
);

export const trendtubeMediaRelations = relations(
  trendtubeMedia,
  ({ one }) => ({
    session: one(trendtubeSessions, {
      fields: [trendtubeMedia.sessionId],
      references: [trendtubeSessions.id],
    }),
    mediaAsset: one(mediaAssets, {
      fields: [trendtubeMedia.mediaAssetId],
      references: [mediaAssets.id],
    }),
  })
);
