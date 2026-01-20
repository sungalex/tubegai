CREATE SCHEMA IF NOT EXISTS "tubegai";
--> statement-breakpoint
CREATE TYPE "tubegai"."ai_generation_type" AS ENUM('image', 'video', 'script', 'seo');--> statement-breakpoint
CREATE TYPE "tubegai"."b_roll_provider" AS ENUM('pexels', 'pixabay', 'unsplash', 'custom');--> statement-breakpoint
CREATE TYPE "tubegai"."billing_cycle" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "tubegai"."channel_status" AS ENUM('active', 'disconnected', 'error');--> statement-breakpoint
CREATE TYPE "tubegai"."export_format" AS ENUM('mp4', 'mov');--> statement-breakpoint
CREATE TYPE "tubegai"."export_resolution" AS ENUM('1080p', '4k');--> statement-breakpoint
CREATE TYPE "tubegai"."export_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "tubegai"."integration_provider" AS ENUM('youtube', 'gemini', 'pexels', 'openai', 'elevenlabs');--> statement-breakpoint
CREATE TYPE "tubegai"."integration_status" AS ENUM('active', 'inactive', 'error');--> statement-breakpoint
CREATE TYPE "tubegai"."mcp_status" AS ENUM('connected', 'disconnected', 'error');--> statement-breakpoint
CREATE TYPE "tubegai"."media_provider" AS ENUM('s3', 'r2', 'local');--> statement-breakpoint
CREATE TYPE "tubegai"."media_type" AS ENUM('image', 'video', 'audio');--> statement-breakpoint
CREATE TYPE "tubegai"."payment_status" AS ENUM('paid', 'pending', 'failed');--> statement-breakpoint
CREATE TYPE "tubegai"."pipeline_phase" AS ENUM('planning', 'production', 'post_production', 'review', 'completed');--> statement-breakpoint
CREATE TYPE "tubegai"."project_status" AS ENUM('draft', 'in_progress', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "tubegai"."project_tone" AS ENUM('informative', 'funny', 'cinematic', 'vlog');--> statement-breakpoint
CREATE TYPE "tubegai"."project_type" AS ENUM('short', 'long');--> statement-breakpoint
CREATE TYPE "tubegai"."project_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "tubegai"."scene_video_status" AS ENUM('generating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "tubegai"."script_segment_type" AS ENUM('hook', 'intro', 'body', 'cta', 'outro');--> statement-breakpoint
CREATE TYPE "tubegai"."step_status" AS ENUM('pending', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "tubegai"."subscription_plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "tubegai"."subscription_status" AS ENUM('active', 'canceled', 'past_due');--> statement-breakpoint
CREATE TYPE "tubegai"."thumbnail_overlay_type" AS ENUM('text', 'image');--> statement-breakpoint
CREATE TYPE "tubegai"."timeline_resource_type" AS ENUM('scene', 'b_roll', 'upload', 'audio');--> statement-breakpoint
CREATE TYPE "tubegai"."timeline_track_type" AS ENUM('video', 'audio');--> statement-breakpoint
CREATE TYPE "tubegai"."upload_status" AS ENUM('not_uploaded', 'uploaded');--> statement-breakpoint
CREATE TABLE "tubegai"."profiles" (
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
CREATE TABLE "tubegai"."ai_generation_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"generation_type" "tubegai"."ai_generation_type" NOT NULL,
	"prompt_hash" text NOT NULL,
	"input_parameters_hash" text,
	"media_asset_id" uuid,
	"text_output" text,
	"model_version" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tubegai"."channel_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"project_id" uuid,
	"youtube_video_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"published_at" timestamp,
	"view_count" bigint DEFAULT 0,
	"like_count" bigint DEFAULT 0,
	"comment_count" bigint DEFAULT 0,
	"tags" text[],
	"duration" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "channel_videos_youtube_video_id_unique" UNIQUE("youtube_video_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"youtube_channel_id" text NOT NULL,
	"name" text NOT NULL,
	"handle" text,
	"avatar_url" text,
	"access_token" text,
	"refresh_token" text,
	"status" "tubegai"."channel_status" DEFAULT 'active' NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "channels_youtube_channel_id_unique" UNIQUE("youtube_channel_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#000000' NOT NULL,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tubegai"."media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid,
	"type" "tubegai"."media_type" NOT NULL,
	"provider" "tubegai"."media_provider" DEFAULT 's3' NOT NULL,
	"storage_key" text NOT NULL,
	"public_url" text NOT NULL,
	"file_size" bigint NOT NULL,
	"mime_type" text NOT NULL,
	"width" integer,
	"height" integer,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."project_labels" (
	"project_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	CONSTRAINT "project_labels_project_id_label_id_pk" PRIMARY KEY("project_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."project_pipelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"current_phase" "tubegai"."pipeline_phase" DEFAULT 'planning' NOT NULL,
	"step_script_status" "tubegai"."step_status" DEFAULT 'pending',
	"step_storyboard_status" "tubegai"."step_status" DEFAULT 'pending',
	"step_scene_status" "tubegai"."step_status" DEFAULT 'pending',
	"step_b_roll_status" "tubegai"."step_status" DEFAULT 'pending',
	"step_rough_cut_status" "tubegai"."step_status" DEFAULT 'pending',
	"step_subtitles_status" "tubegai"."step_status" DEFAULT 'pending',
	"step_coloring_status" "tubegai"."step_status" DEFAULT 'pending',
	"step_thumbnail_status" "tubegai"."step_status" DEFAULT 'pending',
	"step_seo_status" "tubegai"."step_status" DEFAULT 'pending',
	"step_export_status" "tubegai"."step_status" DEFAULT 'pending',
	"overall_progress" integer DEFAULT 0,
	"last_accessed_step" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_pipelines_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."project_seo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"target_keyword" text NOT NULL,
	"youtube_title" text,
	"youtube_description" text,
	"youtube_tags" text[],
	"seo_score" integer DEFAULT 0,
	"last_analyzed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_seo_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel_id" uuid,
	"title" text DEFAULT 'Untitled Project' NOT NULL,
	"description" text,
	"type" "tubegai"."project_type" DEFAULT 'short' NOT NULL,
	"tone" "tubegai"."project_tone",
	"visibility" "tubegai"."project_visibility" DEFAULT 'private' NOT NULL,
	"topic" text,
	"status" "tubegai"."project_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tubegai"."billing_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"invoice_id" text NOT NULL,
	"amount" numeric NOT NULL,
	"currency" text DEFAULT 'USD',
	"status" "tubegai"."payment_status" DEFAULT 'pending',
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_history_invoice_id_unique" UNIQUE("invoice_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "tubegai"."integration_provider" NOT NULL,
	"status" "tubegai"."integration_status" DEFAULT 'inactive',
	"access_token" text,
	"refresh_token" text,
	"account_name" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tubegai"."mcp_servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"endpoint_url" text NOT NULL,
	"access_token" text,
	"status" "tubegai"."mcp_status" DEFAULT 'disconnected',
	"last_connected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tubegai"."notification_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email_marketing" boolean DEFAULT false,
	"email_project_updates" boolean DEFAULT true,
	"email_security" boolean DEFAULT true,
	"push_everything" boolean DEFAULT false,
	"push_comments" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tubegai"."subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan" "tubegai"."subscription_plan" DEFAULT 'free' NOT NULL,
	"status" "tubegai"."subscription_status" DEFAULT 'active' NOT NULL,
	"price" numeric,
	"billing_cycle" "tubegai"."billing_cycle",
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."b_rolls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"storyboard_scene_id" uuid,
	"asset_id" uuid,
	"source_provider" "tubegai"."b_roll_provider" NOT NULL,
	"source_url" text,
	"start_time" double precision DEFAULT 0,
	"end_time" double precision
);
--> statement-breakpoint
CREATE TABLE "tubegai"."coloring_presets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"filter_parameters" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tubegai"."export_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"format" "tubegai"."export_format" DEFAULT 'mp4' NOT NULL,
	"resolution" "tubegai"."export_resolution" DEFAULT '1080p' NOT NULL,
	"status" "tubegai"."export_status" DEFAULT 'pending',
	"video_asset_id" uuid,
	"upload_status" "tubegai"."upload_status" DEFAULT 'not_uploaded',
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tubegai"."project_coloring_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"preset_id" text,
	"custom_parameters" jsonb,
	CONSTRAINT "project_coloring_settings_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."project_thumbnails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	CONSTRAINT "project_thumbnails_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."rough_cut_timelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"zoom_scale" double precision DEFAULT 30,
	"current_time" double precision DEFAULT 0,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "rough_cut_timelines_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."rough_cut_versions" (
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
CREATE TABLE "tubegai"."scene_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storyboard_scene_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"video_asset_id" uuid,
	"duration" double precision,
	"status" "tubegai"."scene_video_status" DEFAULT 'generating',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tubegai"."script_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"script_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"type" "tubegai"."script_segment_type" NOT NULL,
	"content" text NOT NULL,
	"estimated_duration" integer
);
--> statement-breakpoint
CREATE TABLE "tubegai"."scripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"prompt" text,
	"target_duration" integer,
	"saved_at" timestamp DEFAULT now(),
	CONSTRAINT "scripts_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."storyboard_scenes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storyboard_id" uuid NOT NULL,
	"script_segment_id" uuid,
	"scene_number" integer NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"description" text,
	"visual_prompt" text,
	"image_asset_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tubegai"."storyboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	CONSTRAINT "storyboards_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."subtitles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"start_time" double precision NOT NULL,
	"end_time" double precision NOT NULL,
	"text" text NOT NULL,
	"style_json" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tubegai"."thumbnail_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_thumbnail_id" uuid NOT NULL,
	"image_asset_id" uuid NOT NULL,
	"is_favorite" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tubegai"."thumbnail_overlays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_thumbnail_id" uuid NOT NULL,
	"type" "tubegai"."thumbnail_overlay_type" NOT NULL,
	"properties" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tubegai"."timeline_segments" (
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
ALTER TABLE "tubegai"."profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."ai_generation_cache" ADD CONSTRAINT "ai_generation_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."ai_generation_cache" ADD CONSTRAINT "ai_generation_cache_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "tubegai"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."channel_videos" ADD CONSTRAINT "channel_videos_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "tubegai"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."channel_videos" ADD CONSTRAINT "channel_videos_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."channels" ADD CONSTRAINT "channels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."labels" ADD CONSTRAINT "labels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."media_assets" ADD CONSTRAINT "media_assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."project_labels" ADD CONSTRAINT "project_labels_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."project_labels" ADD CONSTRAINT "project_labels_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "tubegai"."labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."project_pipelines" ADD CONSTRAINT "project_pipelines_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."project_seo" ADD CONSTRAINT "project_seo_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."projects" ADD CONSTRAINT "projects_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "tubegai"."channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."billing_history" ADD CONSTRAINT "billing_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."integrations" ADD CONSTRAINT "integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."mcp_servers" ADD CONSTRAINT "mcp_servers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."notification_settings" ADD CONSTRAINT "notification_settings_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."b_rolls" ADD CONSTRAINT "b_rolls_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."b_rolls" ADD CONSTRAINT "b_rolls_storyboard_scene_id_storyboard_scenes_id_fk" FOREIGN KEY ("storyboard_scene_id") REFERENCES "tubegai"."storyboard_scenes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."b_rolls" ADD CONSTRAINT "b_rolls_asset_id_media_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "tubegai"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."export_history" ADD CONSTRAINT "export_history_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."export_history" ADD CONSTRAINT "export_history_video_asset_id_media_assets_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "tubegai"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."project_coloring_settings" ADD CONSTRAINT "project_coloring_settings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."project_coloring_settings" ADD CONSTRAINT "project_coloring_settings_preset_id_coloring_presets_id_fk" FOREIGN KEY ("preset_id") REFERENCES "tubegai"."coloring_presets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."project_thumbnails" ADD CONSTRAINT "project_thumbnails_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."rough_cut_timelines" ADD CONSTRAINT "rough_cut_timelines_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."rough_cut_versions" ADD CONSTRAINT "rough_cut_versions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."rough_cut_versions" ADD CONSTRAINT "rough_cut_versions_video_asset_id_media_assets_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "tubegai"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."scene_videos" ADD CONSTRAINT "scene_videos_storyboard_scene_id_storyboard_scenes_id_fk" FOREIGN KEY ("storyboard_scene_id") REFERENCES "tubegai"."storyboard_scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."scene_videos" ADD CONSTRAINT "scene_videos_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."scene_videos" ADD CONSTRAINT "scene_videos_video_asset_id_media_assets_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "tubegai"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."script_segments" ADD CONSTRAINT "script_segments_script_id_scripts_id_fk" FOREIGN KEY ("script_id") REFERENCES "tubegai"."scripts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."scripts" ADD CONSTRAINT "scripts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."storyboard_scenes" ADD CONSTRAINT "storyboard_scenes_storyboard_id_storyboards_id_fk" FOREIGN KEY ("storyboard_id") REFERENCES "tubegai"."storyboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."storyboard_scenes" ADD CONSTRAINT "storyboard_scenes_script_segment_id_script_segments_id_fk" FOREIGN KEY ("script_segment_id") REFERENCES "tubegai"."script_segments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."storyboard_scenes" ADD CONSTRAINT "storyboard_scenes_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "tubegai"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."storyboards" ADD CONSTRAINT "storyboards_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."subtitles" ADD CONSTRAINT "subtitles_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."thumbnail_candidates" ADD CONSTRAINT "thumbnail_candidates_project_thumbnail_id_project_thumbnails_id_fk" FOREIGN KEY ("project_thumbnail_id") REFERENCES "tubegai"."project_thumbnails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."thumbnail_candidates" ADD CONSTRAINT "thumbnail_candidates_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "tubegai"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."thumbnail_overlays" ADD CONSTRAINT "thumbnail_overlays_project_thumbnail_id_project_thumbnails_id_fk" FOREIGN KEY ("project_thumbnail_id") REFERENCES "tubegai"."project_thumbnails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."timeline_segments" ADD CONSTRAINT "timeline_segments_timeline_id_rough_cut_timelines_id_fk" FOREIGN KEY ("timeline_id") REFERENCES "tubegai"."rough_cut_timelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prompt_hash_idx" ON "tubegai"."ai_generation_cache" USING btree ("prompt_hash");