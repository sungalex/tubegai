CREATE TABLE "tubegai"."studio_rough_cut_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"zoom_scale" double precision DEFAULT 30,
	"current_time" double precision DEFAULT 0,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "studio_rough_cut_timeline_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."studio_rough_cut_version" (
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
CREATE TABLE "tubegai"."studio_timeline_segment" (
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
ALTER TABLE "tubegai"."rough_cut_timelines" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."rough_cut_versions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."timeline_segments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tubegai"."rough_cut_timelines" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."rough_cut_versions" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."timeline_segments" CASCADE;--> statement-breakpoint
ALTER TABLE "tubegai"."b_rolls" RENAME TO "studio_b_roll";--> statement-breakpoint
ALTER TABLE "tubegai"."studio_b_roll" DROP CONSTRAINT "b_rolls_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "tubegai"."studio_b_roll" DROP CONSTRAINT "b_rolls_storyboard_scene_id_storyboard_scenes_id_fk";
--> statement-breakpoint
ALTER TABLE "tubegai"."studio_b_roll" DROP CONSTRAINT "b_rolls_asset_id_media_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "tubegai"."studio_rough_cut_timeline" ADD CONSTRAINT "studio_rough_cut_timeline_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_rough_cut_version" ADD CONSTRAINT "studio_rough_cut_version_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_rough_cut_version" ADD CONSTRAINT "studio_rough_cut_version_video_asset_id_media_assets_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "tubegai"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_timeline_segment" ADD CONSTRAINT "studio_timeline_segment_timeline_id_studio_rough_cut_timeline_id_fk" FOREIGN KEY ("timeline_id") REFERENCES "tubegai"."studio_rough_cut_timeline"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_b_roll" ADD CONSTRAINT "studio_b_roll_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_b_roll" ADD CONSTRAINT "studio_b_roll_storyboard_scene_id_storyboard_scenes_id_fk" FOREIGN KEY ("storyboard_scene_id") REFERENCES "tubegai"."storyboard_scenes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_b_roll" ADD CONSTRAINT "studio_b_roll_asset_id_media_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "tubegai"."media_assets"("id") ON DELETE set null ON UPDATE no action;