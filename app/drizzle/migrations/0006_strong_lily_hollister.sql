CREATE TABLE "tubegai"."studio_export_history" (
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
CREATE TABLE "tubegai"."studio_storyboard" (
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
CREATE TABLE "tubegai"."studio_thumbnail_candidate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_thumbnail_id" uuid NOT NULL,
	"image_asset_id" uuid NOT NULL,
	"is_favorite" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tubegai"."studio_thumbnail_overlay" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_thumbnail_id" uuid NOT NULL,
	"type" "tubegai"."thumbnail_overlay_type" NOT NULL,
	"properties" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tubegai"."export_history" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."storyboard_scenes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."thumbnail_candidates" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."thumbnail_overlays" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tubegai"."export_history" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."storyboard_scenes" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."thumbnail_candidates" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."thumbnail_overlays" CASCADE;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_export_history" ADD CONSTRAINT "studio_export_history_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_export_history" ADD CONSTRAINT "studio_export_history_video_asset_id_media_assets_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "tubegai"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_storyboard" ADD CONSTRAINT "studio_storyboard_storyboard_id_studio_user_storyboard_id_fk" FOREIGN KEY ("storyboard_id") REFERENCES "tubegai"."studio_user_storyboard"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_storyboard" ADD CONSTRAINT "studio_storyboard_script_segment_id_studio_script_segment_id_fk" FOREIGN KEY ("script_segment_id") REFERENCES "tubegai"."studio_script_segment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_storyboard" ADD CONSTRAINT "studio_storyboard_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "tubegai"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_thumbnail_candidate" ADD CONSTRAINT "studio_thumbnail_candidate_project_thumbnail_id_studio_thumbnail_id_fk" FOREIGN KEY ("project_thumbnail_id") REFERENCES "tubegai"."studio_thumbnail"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_thumbnail_candidate" ADD CONSTRAINT "studio_thumbnail_candidate_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "tubegai"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_thumbnail_overlay" ADD CONSTRAINT "studio_thumbnail_overlay_project_thumbnail_id_studio_thumbnail_id_fk" FOREIGN KEY ("project_thumbnail_id") REFERENCES "tubegai"."studio_thumbnail"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_b_roll" ADD CONSTRAINT "studio_b_roll_storyboard_scene_id_studio_storyboard_id_fk" FOREIGN KEY ("storyboard_scene_id") REFERENCES "tubegai"."studio_storyboard"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_scene" ADD CONSTRAINT "studio_scene_storyboard_scene_id_studio_storyboard_id_fk" FOREIGN KEY ("storyboard_scene_id") REFERENCES "tubegai"."studio_storyboard"("id") ON DELETE cascade ON UPDATE no action;