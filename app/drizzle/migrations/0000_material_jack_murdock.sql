CREATE TYPE "public"."ai_generation_type" AS ENUM('image', 'video', 'script', 'seo');--> statement-breakpoint
CREATE TYPE "public"."b_roll_provider" AS ENUM('pexels', 'pixabay', 'unsplash', 'custom');--> statement-breakpoint
CREATE TYPE "public"."billing_cycle" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."channel_status" AS ENUM('active', 'disconnected', 'error');--> statement-breakpoint
CREATE TYPE "public"."export_format" AS ENUM('mp4', 'mov');--> statement-breakpoint
CREATE TYPE "public"."export_resolution" AS ENUM('1080p', '4k');--> statement-breakpoint
CREATE TYPE "public"."export_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('youtube', 'gemini', 'pexels', 'openai', 'elevenlabs');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('active', 'inactive', 'error');--> statement-breakpoint
CREATE TYPE "public"."mcp_status" AS ENUM('connected', 'disconnected', 'error');--> statement-breakpoint
CREATE TYPE "public"."media_provider" AS ENUM('s3', 'r2', 'local');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video', 'audio');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('paid', 'pending', 'failed');--> statement-breakpoint
CREATE TYPE "public"."pipeline_phase" AS ENUM('planning', 'production', 'post_production', 'review', 'completed');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'in_progress', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."project_tone" AS ENUM('informative', 'funny', 'cinematic', 'vlog');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('short', 'long');--> statement-breakpoint
CREATE TYPE "public"."project_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."scene_video_status" AS ENUM('generating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."script_segment_type" AS ENUM('hook', 'intro', 'body', 'cta', 'outro');--> statement-breakpoint
CREATE TYPE "public"."step_status" AS ENUM('pending', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due');--> statement-breakpoint
CREATE TYPE "public"."thumbnail_overlay_type" AS ENUM('text', 'image');--> statement-breakpoint
CREATE TYPE "public"."timeline_resource_type" AS ENUM('scene', 'b_roll', 'upload', 'audio');--> statement-breakpoint
CREATE TYPE "public"."timeline_track_type" AS ENUM('video', 'audio');--> statement-breakpoint
CREATE TYPE "public"."upload_status" AS ENUM('not_uploaded', 'uploaded');--> statement-breakpoint
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

CREATE TABLE "ai_generation_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"generation_type" "ai_generation_type" NOT NULL,
	"prompt_hash" text NOT NULL,
	"input_parameters_hash" text,
	"media_asset_id" uuid,
	"text_output" text,
	"model_version" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "channel_video" (
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
	CONSTRAINT "channel_video_youtube_video_id_unique" UNIQUE("youtube_video_id")
);
--> statement-breakpoint
CREATE TABLE "channel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"youtube_channel_id" text NOT NULL,
	"name" text NOT NULL,
	"handle" text,
	"avatar_url" text,
	"access_token" text,
	"refresh_token" text,
	"status" "channel_status" DEFAULT 'active' NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "channel_youtube_channel_id_unique" UNIQUE("youtube_channel_id")
);
--> statement-breakpoint
CREATE TABLE "label" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#000000' NOT NULL,
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
CREATE TABLE "project_pipeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"current_phase" "pipeline_phase" DEFAULT 'planning' NOT NULL,
	"step_script_status" "step_status" DEFAULT 'pending',
	"step_storyboard_status" "step_status" DEFAULT 'pending',
	"step_scene_status" "step_status" DEFAULT 'pending',
	"step_b_roll_status" "step_status" DEFAULT 'pending',
	"step_rough_cut_status" "step_status" DEFAULT 'pending',
	"step_subtitles_status" "step_status" DEFAULT 'pending',
	"step_coloring_status" "step_status" DEFAULT 'pending',
	"step_thumbnail_status" "step_status" DEFAULT 'pending',
	"step_seo_status" "step_status" DEFAULT 'pending',
	"step_export_status" "step_status" DEFAULT 'pending',
	"overall_progress" integer DEFAULT 0,
	"last_accessed_step" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_pipeline_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "project_seo" (
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
CREATE TABLE "project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel_id" uuid,
	"title" text DEFAULT 'Untitled Project' NOT NULL,
	"description" text,
	"type" "project_type" DEFAULT 'short' NOT NULL,
	"tone" "project_tone",
	"visibility" "project_visibility" DEFAULT 'private' NOT NULL,
	"topic" text,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"invoice_id" text NOT NULL,
	"amount" numeric NOT NULL,
	"currency" text DEFAULT 'USD',
	"status" "payment_status" DEFAULT 'pending',
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_history_invoice_id_unique" UNIQUE("invoice_id")
);
--> statement-breakpoint
CREATE TABLE "settings_integration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"status" "integration_status" DEFAULT 'inactive',
	"access_token" text,
	"refresh_token" text,
	"account_name" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings_mcp_server" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"endpoint_url" text NOT NULL,
	"access_token" text,
	"status" "mcp_status" DEFAULT 'disconnected',
	"last_connected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings_notification" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email_marketing" boolean DEFAULT false,
	"email_project_updates" boolean DEFAULT true,
	"email_security" boolean DEFAULT true,
	"push_everything" boolean DEFAULT false,
	"push_comments" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan" "subscription_plan" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"price" numeric,
	"billing_cycle" "billing_cycle",
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_subscription_user_id_unique" UNIQUE("user_id")
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
CREATE TABLE "studio_coloring_preset" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"filter_parameters" jsonb NOT NULL
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
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "studio_coloring_setting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"preset_id" text,
	"custom_parameters" jsonb,
	CONSTRAINT "studio_coloring_setting_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "studio_thumbnail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	CONSTRAINT "studio_thumbnail_project_id_unique" UNIQUE("project_id")
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
	"estimated_duration" integer
);
--> statement-breakpoint
CREATE TABLE "studio_script" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"prompt" text,
	"target_duration" integer,
	"saved_at" timestamp DEFAULT now(),
	CONSTRAINT "studio_script_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "studio_storyboard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"script_segment_id" uuid,
	"scene_number" integer NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"description" text,
	"visual_prompt" text,
	"image_asset_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_subtitle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"start_time" double precision NOT NULL,
	"end_time" double precision NOT NULL,
	"text" text NOT NULL,
	"style_json" jsonb,
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
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation_cache" ADD CONSTRAINT "ai_generation_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation_cache" ADD CONSTRAINT "ai_generation_cache_media_asset_id_media_asset_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_video" ADD CONSTRAINT "channel_video_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_video" ADD CONSTRAINT "channel_video_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel" ADD CONSTRAINT "channel_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label" ADD CONSTRAINT "label_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_label" ADD CONSTRAINT "project_label_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_label" ADD CONSTRAINT "project_label_label_id_label_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."label"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_pipeline" ADD CONSTRAINT "project_pipeline_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_seo" ADD CONSTRAINT "project_seo_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings_integration" ADD CONSTRAINT "settings_integration_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings_mcp_server" ADD CONSTRAINT "settings_mcp_server_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings_notification" ADD CONSTRAINT "settings_notification_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings_subscription" ADD CONSTRAINT "settings_subscription_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_b_roll" ADD CONSTRAINT "studio_b_roll_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_b_roll" ADD CONSTRAINT "studio_b_roll_storyboard_id_studio_storyboard_id_fk" FOREIGN KEY ("storyboard_id") REFERENCES "public"."studio_storyboard"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_b_roll" ADD CONSTRAINT "studio_b_roll_asset_id_media_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_export_history" ADD CONSTRAINT "studio_export_history_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_export_history" ADD CONSTRAINT "studio_export_history_video_asset_id_media_asset_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_coloring_setting" ADD CONSTRAINT "studio_coloring_setting_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_coloring_setting" ADD CONSTRAINT "studio_coloring_setting_preset_id_studio_coloring_preset_id_fk" FOREIGN KEY ("preset_id") REFERENCES "public"."studio_coloring_preset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_thumbnail" ADD CONSTRAINT "studio_thumbnail_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_rough_cut_timeline" ADD CONSTRAINT "studio_rough_cut_timeline_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_rough_cut_version" ADD CONSTRAINT "studio_rough_cut_version_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_rough_cut_version" ADD CONSTRAINT "studio_rough_cut_version_video_asset_id_media_asset_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_video" ADD CONSTRAINT "studio_video_storyboard_id_studio_storyboard_id_fk" FOREIGN KEY ("storyboard_id") REFERENCES "public"."studio_storyboard"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_video" ADD CONSTRAINT "studio_video_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_video" ADD CONSTRAINT "studio_video_video_asset_id_media_asset_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_script_segment" ADD CONSTRAINT "studio_script_segment_script_id_studio_script_id_fk" FOREIGN KEY ("script_id") REFERENCES "public"."studio_script"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_script" ADD CONSTRAINT "studio_script_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_storyboard" ADD CONSTRAINT "studio_storyboard_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_storyboard" ADD CONSTRAINT "studio_storyboard_script_segment_id_studio_script_segment_id_fk" FOREIGN KEY ("script_segment_id") REFERENCES "public"."studio_script_segment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_storyboard" ADD CONSTRAINT "studio_storyboard_image_asset_id_media_asset_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_subtitle" ADD CONSTRAINT "studio_subtitle_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_thumbnail_candidate" ADD CONSTRAINT "studio_thumbnail_candidate_project_thumbnail_id_studio_thumbnail_id_fk" FOREIGN KEY ("project_thumbnail_id") REFERENCES "public"."studio_thumbnail"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_thumbnail_candidate" ADD CONSTRAINT "studio_thumbnail_candidate_image_asset_id_media_asset_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_thumbnail_overlay" ADD CONSTRAINT "studio_thumbnail_overlay_project_thumbnail_id_studio_thumbnail_id_fk" FOREIGN KEY ("project_thumbnail_id") REFERENCES "public"."studio_thumbnail"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_rough_cut_timeline_segment" ADD CONSTRAINT "studio_rough_cut_timeline_segment_timeline_id_studio_rough_cut_timeline_id_fk" FOREIGN KEY ("timeline_id") REFERENCES "public"."studio_rough_cut_timeline"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prompt_hash_idx" ON "ai_generation_cache" USING btree ("prompt_hash");