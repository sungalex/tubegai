CREATE TYPE "public"."ai_generation_type" AS ENUM('image', 'video', 'script', 'seo');--> statement-breakpoint
CREATE TYPE "public"."b_roll_provider" AS ENUM('pexels', 'pixabay', 'unsplash', 'custom');--> statement-breakpoint
CREATE TYPE "public"."channel_status" AS ENUM('active', 'error', 'syncing');--> statement-breakpoint
CREATE TYPE "public"."content_tone" AS ENUM('informative', 'funny', 'dramatic', 'casual', 'professional');--> statement-breakpoint
CREATE TYPE "public"."export_format" AS ENUM('mp4', 'mov', 'webm');--> statement-breakpoint
CREATE TYPE "public"."export_resolution" AS ENUM('720p', '1080p', '4k');--> statement-breakpoint
CREATE TYPE "public"."export_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."idea_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."idea_source" AS ENUM('ai_generated', 'user_created');--> statement-breakpoint
CREATE TYPE "public"."media_provider" AS ENUM('s3', 'r2', 'local');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video', 'audio');--> statement-breakpoint
CREATE TYPE "public"."pre_production_status" AS ENUM('pending', 'generating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'in_progress', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('short', 'long');--> statement-breakpoint
CREATE TYPE "public"."project_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."scene_video_status" AS ENUM('pending', 'generating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."script_segment_type" AS ENUM('hook', 'intro', 'body', 'cta', 'outro');--> statement-breakpoint
CREATE TYPE "public"."studio_session_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."thumbnail_overlay_type" AS ENUM('text', 'image');--> statement-breakpoint
CREATE TYPE "public"."timeline_resource_type" AS ENUM('scene', 'b_roll', 'upload', 'audio');--> statement-breakpoint
CREATE TYPE "public"."timeline_track_type" AS ENUM('video', 'audio');--> statement-breakpoint
CREATE TYPE "public"."trend_source" AS ENUM('youtube_api', 'ai_generated', 'manual');--> statement-breakpoint
CREATE TYPE "public"."trendtube_media_type" AS ENUM('video_image', 'background_music', 'voiceover', 'generated_video', 'composited_video');--> statement-breakpoint
CREATE TYPE "public"."trendtube_pipeline_status" AS ENUM('pending', 'extracting', 'generating_ideas', 'generating_media', 'compositing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."upload_status" AS ENUM('not_uploaded', 'uploaded');--> statement-breakpoint
CREATE TYPE "public"."video_length" AS ENUM('short', 'medium', 'long');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"changes" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"bio" text,
	"website_url" text,
	"twitter_handle" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "channel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"youtube_channel_id" text NOT NULL,
	"name" text NOT NULL,
	"handle" text,
	"description" text,
	"avatar_url" text,
	"banner_url" text,
	"subscriber_count" integer,
	"video_count" integer,
	"view_count" bigint,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"status" "channel_status" DEFAULT 'active' NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "channel_youtube_channel_id_unique" UNIQUE("youtube_channel_id")
);
--> statement-breakpoint
CREATE TABLE "idea_trend" (
	"idea_id" uuid NOT NULL,
	"trend_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "idea_trend_idea_id_trend_id_pk" PRIMARY KEY("idea_id","trend_id")
);
--> statement-breakpoint
CREATE TABLE "idea" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"hooks" text[] DEFAULT '{}',
	"target_audience" text,
	"estimated_views" text,
	"difficulty" "idea_difficulty" DEFAULT 'medium',
	"source" "idea_source" NOT NULL,
	"reason" text,
	"growth_rate" text,
	"score" integer,
	"content_tones" text[] DEFAULT '{}',
	"video_types" text[] DEFAULT '{}',
	"category" text,
	"is_saved" boolean DEFAULT false NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"used_for_project_id" uuid,
	"reference_url" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "label" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT 'bg-slate-500' NOT NULL,
	"description" text,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid,
	"type" "media_type" NOT NULL,
	"provider" "media_provider" DEFAULT 's3' NOT NULL,
	"storage_key" text NOT NULL,
	"public_url" text NOT NULL,
	"file_size" bigint NOT NULL,
	"mime_type" text NOT NULL,
	"width" integer,
	"height" integer,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "media_asset_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "project_label" (
	"project_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	CONSTRAINT "project_label_project_id_label_id_pk" PRIMARY KEY("project_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel_id" uuid,
	"title" text DEFAULT 'Untitled Project' NOT NULL,
	"description" text,
	"type" "project_type" DEFAULT 'short' NOT NULL,
	"visibility" "project_visibility" DEFAULT 'private' NOT NULL,
	"topic" text,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"current_step" text,
	"thumbnail_url" text,
	"hooks" text[],
	"target_audience" text,
	"estimated_views" text,
	"difficulty" "idea_difficulty",
	"content_tone" "content_tone",
	"video_length" "video_length",
	"based_on_trend" text,
	"based_on_trend_uuid" uuid,
	"source_idea_id" uuid,
	"ai_context" jsonb,
	"trend_snapshot" jsonb,
	"script_guidelines" jsonb,
	"reference_url" text
);
--> statement-breakpoint
CREATE TABLE "studio_b_roll" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"storyboard_id" uuid,
	"asset_id" uuid,
	"source_provider" "b_roll_provider" NOT NULL,
	"source_url" text,
	"start_time" double precision DEFAULT 0,
	"end_time" double precision
);
--> statement-breakpoint
CREATE TABLE "studio_export_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"format" "export_format" DEFAULT 'mp4' NOT NULL,
	"resolution" "export_resolution" DEFAULT '1080p' NOT NULL,
	"status" "export_status" DEFAULT 'pending',
	"video_asset_id" uuid,
	"upload_status" "upload_status" DEFAULT 'not_uploaded',
	"completed_at" timestamp,
	"frame_rate" integer DEFAULT 30,
	"quality" text DEFAULT 'high',
	"hardware_acceleration" boolean DEFAULT true,
	"privacy" text,
	"scheduled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "studio_rough_cut_timeline_segment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timeline_id" uuid NOT NULL,
	"track_id" text DEFAULT 'V1' NOT NULL,
	"type" timeline_track_type NOT NULL,
	"resource_type" timeline_resource_type NOT NULL,
	"resource_id" uuid NOT NULL,
	"start_time" double precision NOT NULL,
	"duration" double precision NOT NULL,
	"trim_start" double precision DEFAULT 0,
	"trim_end" double precision,
	"playback_speed" double precision DEFAULT 1,
	"volume" double precision DEFAULT 1,
	"z_index" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "studio_rough_cut_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"zoom_scale" double precision DEFAULT 30,
	"playhead_position" double precision DEFAULT 0,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "studio_rough_cut_timeline_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "studio_rough_cut_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"version_number" integer NOT NULL,
	"video_asset_id" uuid,
	"duration" double precision,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "studio_video" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storyboard_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"session_id" uuid,
	"video_asset_id" uuid,
	"duration" double precision,
	"status" "scene_video_status" DEFAULT 'generating',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "studio_script_segment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"script_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"type" "script_segment_type" NOT NULL,
	"content" text NOT NULL,
	"estimated_duration" integer,
	"visual_notes" text,
	"emotional_tone" text,
	"keywords" text[],
	"scene_hints" jsonb
);
--> statement-breakpoint
CREATE TABLE "studio_script" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"session_id" uuid,
	"prompt" text,
	"target_duration" integer,
	"saved_at" timestamp DEFAULT now(),
	"hooks" text[],
	"script_guidelines" jsonb,
	"seo_keywords" text[],
	"pre_production_status" "pre_production_status",
	"source_trendtube_session_id" uuid
);
--> statement-breakpoint
CREATE TABLE "studio_seo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text,
	"description" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "studio_seo_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "studio_storyboard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"session_id" uuid,
	"script_segment_id" uuid NOT NULL,
	"scene_number" integer NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"description" text,
	"visual_prompt" text,
	"duration" integer,
	"emotional_tone" text,
	"camera_angle" text,
	"image_asset_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "studio_session_status" DEFAULT 'active' NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "studio_subtitle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"start_time" double precision NOT NULL,
	"end_time" double precision NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "studio_thumbnail_candidate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_thumbnail_id" uuid NOT NULL,
	"image_asset_id" uuid NOT NULL,
	"is_favorite" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "studio_thumbnail_overlay" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_thumbnail_id" uuid NOT NULL,
	"type" "thumbnail_overlay_type" NOT NULL,
	"properties" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_thumbnail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	CONSTRAINT "studio_thumbnail_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "studio_video_part" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"part_number" integer NOT NULL,
	"start_time" double precision NOT NULL,
	"end_time" double precision NOT NULL,
	"duration" double precision NOT NULL,
	"status" "scene_video_status" DEFAULT 'pending' NOT NULL,
	"video_asset_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "studio_video_part_video_id_part_number_unique" UNIQUE("video_id","part_number")
);
--> statement-breakpoint
CREATE TABLE "trendtube_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"media_type" "trendtube_media_type" NOT NULL,
	"media_asset_id" uuid,
	"public_url" text,
	"metadata" jsonb,
	"prompt" text,
	"clip_number" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trendtube_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"extracted_trends" text,
	"video_ideas" text,
	"narration_script" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trendtube_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"trends_url" text NOT NULL,
	"user_idea" text NOT NULL,
	"reference_image_url" text,
	"voice_option" text DEFAULT 'female_ko',
	"status" "trendtube_pipeline_status" DEFAULT 'pending' NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "trend" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"views_count" text,
	"growth_rate" text,
	"thumbnail_url" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"source" "trend_source" DEFAULT 'ai_generated' NOT NULL,
	"external_id" text,
	"external_url" text,
	"used_for_project_id" uuid,
	"view_count" bigint,
	"like_count" bigint,
	"comment_count" bigint,
	"published_at" timestamp,
	"fetched_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"region_code" text DEFAULT 'KR',
	"language_code" text DEFAULT 'ko',
	"video_duration" text,
	"usage_count" integer DEFAULT 0,
	"last_used_at" timestamp,
	"is_saved" boolean DEFAULT false,
	"saved_by_user_id" uuid,
	"saved_at" timestamp,
	CONSTRAINT "trend_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel" ADD CONSTRAINT "channel_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_trend" ADD CONSTRAINT "idea_trend_idea_id_idea_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea" ADD CONSTRAINT "idea_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea" ADD CONSTRAINT "idea_used_for_project_id_project_id_fk" FOREIGN KEY ("used_for_project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label" ADD CONSTRAINT "label_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_label" ADD CONSTRAINT "project_label_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_label" ADD CONSTRAINT "project_label_label_id_label_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."label"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_b_roll" ADD CONSTRAINT "studio_b_roll_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_b_roll" ADD CONSTRAINT "studio_b_roll_storyboard_id_studio_storyboard_id_fk" FOREIGN KEY ("storyboard_id") REFERENCES "public"."studio_storyboard"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_b_roll" ADD CONSTRAINT "studio_b_roll_asset_id_media_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_export_history" ADD CONSTRAINT "studio_export_history_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_export_history" ADD CONSTRAINT "studio_export_history_video_asset_id_media_asset_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_rough_cut_timeline_segment" ADD CONSTRAINT "studio_rough_cut_timeline_segment_timeline_id_studio_rough_cut_timeline_id_fk" FOREIGN KEY ("timeline_id") REFERENCES "public"."studio_rough_cut_timeline"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_rough_cut_timeline" ADD CONSTRAINT "studio_rough_cut_timeline_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_rough_cut_version" ADD CONSTRAINT "studio_rough_cut_version_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_rough_cut_version" ADD CONSTRAINT "studio_rough_cut_version_video_asset_id_media_asset_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_video" ADD CONSTRAINT "studio_video_storyboard_id_studio_storyboard_id_fk" FOREIGN KEY ("storyboard_id") REFERENCES "public"."studio_storyboard"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_video" ADD CONSTRAINT "studio_video_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_video" ADD CONSTRAINT "studio_video_session_id_studio_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."studio_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_video" ADD CONSTRAINT "studio_video_video_asset_id_media_asset_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_script_segment" ADD CONSTRAINT "studio_script_segment_script_id_studio_script_id_fk" FOREIGN KEY ("script_id") REFERENCES "public"."studio_script"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_script" ADD CONSTRAINT "studio_script_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_script" ADD CONSTRAINT "studio_script_session_id_studio_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."studio_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_script" ADD CONSTRAINT "studio_script_source_trendtube_session_id_trendtube_session_id_fk" FOREIGN KEY ("source_trendtube_session_id") REFERENCES "public"."trendtube_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_seo" ADD CONSTRAINT "studio_seo_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_storyboard" ADD CONSTRAINT "studio_storyboard_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_storyboard" ADD CONSTRAINT "studio_storyboard_session_id_studio_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."studio_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_storyboard" ADD CONSTRAINT "studio_storyboard_script_segment_id_studio_script_segment_id_fk" FOREIGN KEY ("script_segment_id") REFERENCES "public"."studio_script_segment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_storyboard" ADD CONSTRAINT "studio_storyboard_image_asset_id_media_asset_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_session" ADD CONSTRAINT "studio_session_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_session" ADD CONSTRAINT "studio_session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_subtitle" ADD CONSTRAINT "studio_subtitle_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_thumbnail_candidate" ADD CONSTRAINT "studio_thumbnail_candidate_project_thumbnail_id_studio_thumbnail_id_fk" FOREIGN KEY ("project_thumbnail_id") REFERENCES "public"."studio_thumbnail"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_thumbnail_candidate" ADD CONSTRAINT "studio_thumbnail_candidate_image_asset_id_media_asset_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_thumbnail_overlay" ADD CONSTRAINT "studio_thumbnail_overlay_project_thumbnail_id_studio_thumbnail_id_fk" FOREIGN KEY ("project_thumbnail_id") REFERENCES "public"."studio_thumbnail"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_thumbnail" ADD CONSTRAINT "studio_thumbnail_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_video_part" ADD CONSTRAINT "studio_video_part_video_id_studio_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."studio_video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_video_part" ADD CONSTRAINT "studio_video_part_video_asset_id_media_asset_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trendtube_media" ADD CONSTRAINT "trendtube_media_session_id_trendtube_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."trendtube_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trendtube_media" ADD CONSTRAINT "trendtube_media_media_asset_id_media_asset_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trendtube_result" ADD CONSTRAINT "trendtube_result_session_id_trendtube_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."trendtube_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trendtube_session" ADD CONSTRAINT "trendtube_session_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trendtube_session" ADD CONSTRAINT "trendtube_session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend" ADD CONSTRAINT "trend_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend" ADD CONSTRAINT "trend_saved_by_user_id_users_id_fk" FOREIGN KEY ("saved_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_entity" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_created" ON "audit_log" USING btree ("created_at" DESC NULLS LAST);