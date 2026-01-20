CREATE TABLE "tubegai"."studio_video" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storyboard_scene_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"video_asset_id" uuid,
	"duration" double precision,
	"status" "tubegai"."scene_video_status" DEFAULT 'generating',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tubegai"."studio_rough_cut_timeline_segment" (
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
DROP TABLE "tubegai"."studio_scene" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."studio_timeline_segment" CASCADE;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_video" ADD CONSTRAINT "studio_video_storyboard_scene_id_studio_storyboard_scene_id_fk" FOREIGN KEY ("storyboard_scene_id") REFERENCES "tubegai"."studio_storyboard_scene"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_video" ADD CONSTRAINT "studio_video_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_video" ADD CONSTRAINT "studio_video_video_asset_id_media_assets_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "tubegai"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_rough_cut_timeline_segment" ADD CONSTRAINT "studio_rough_cut_timeline_segment_timeline_id_studio_rough_cut_timeline_id_fk" FOREIGN KEY ("timeline_id") REFERENCES "tubegai"."studio_rough_cut_timeline"("id") ON DELETE cascade ON UPDATE no action;