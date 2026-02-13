CREATE TYPE "public"."thumbnail_overlay_type" AS ENUM('text', 'image');--> statement-breakpoint
CREATE TYPE "public"."timeline_resource_type" AS ENUM('scene', 'b_roll', 'upload', 'audio');--> statement-breakpoint
CREATE TYPE "public"."timeline_track_type" AS ENUM('video', 'audio');--> statement-breakpoint
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
CREATE TABLE "studio_coloring_setting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"preset_id" text,
	"custom_parameters" jsonb,
	CONSTRAINT "studio_coloring_setting_project_id_unique" UNIQUE("project_id")
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
ALTER TABLE "idea" ADD COLUMN IF NOT EXISTS "reference_url" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "reference_url" text;--> statement-breakpoint
ALTER TABLE "studio_b_roll" ADD CONSTRAINT "studio_b_roll_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_b_roll" ADD CONSTRAINT "studio_b_roll_storyboard_id_studio_storyboard_id_fk" FOREIGN KEY ("storyboard_id") REFERENCES "public"."studio_storyboard"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_b_roll" ADD CONSTRAINT "studio_b_roll_asset_id_media_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_coloring_setting" ADD CONSTRAINT "studio_coloring_setting_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_coloring_setting" ADD CONSTRAINT "studio_coloring_setting_preset_id_studio_coloring_preset_id_fk" FOREIGN KEY ("preset_id") REFERENCES "public"."studio_coloring_preset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_rough_cut_timeline_segment" ADD CONSTRAINT "studio_rough_cut_timeline_segment_timeline_id_studio_rough_cut_timeline_id_fk" FOREIGN KEY ("timeline_id") REFERENCES "public"."studio_rough_cut_timeline"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_rough_cut_timeline" ADD CONSTRAINT "studio_rough_cut_timeline_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_rough_cut_version" ADD CONSTRAINT "studio_rough_cut_version_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_rough_cut_version" ADD CONSTRAINT "studio_rough_cut_version_video_asset_id_media_asset_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_thumbnail_candidate" ADD CONSTRAINT "studio_thumbnail_candidate_project_thumbnail_id_studio_thumbnail_id_fk" FOREIGN KEY ("project_thumbnail_id") REFERENCES "public"."studio_thumbnail"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_thumbnail_candidate" ADD CONSTRAINT "studio_thumbnail_candidate_image_asset_id_media_asset_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_thumbnail_overlay" ADD CONSTRAINT "studio_thumbnail_overlay_project_thumbnail_id_studio_thumbnail_id_fk" FOREIGN KEY ("project_thumbnail_id") REFERENCES "public"."studio_thumbnail"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_thumbnail" ADD CONSTRAINT "studio_thumbnail_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;