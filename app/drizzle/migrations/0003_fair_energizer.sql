CREATE TABLE "tubegai"."studio_scene" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storyboard_scene_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"video_asset_id" uuid,
	"duration" double precision,
	"status" "tubegai"."scene_video_status" DEFAULT 'generating',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tubegai"."studio_script_segment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"script_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"type" "tubegai"."script_segment_type" NOT NULL,
	"content" text NOT NULL,
	"estimated_duration" integer
);
--> statement-breakpoint
CREATE TABLE "tubegai"."studio_script" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"prompt" text,
	"target_duration" integer,
	"saved_at" timestamp DEFAULT now(),
	CONSTRAINT "studio_script_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."studio_user_storyboard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	CONSTRAINT "studio_user_storyboard_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
ALTER TABLE "tubegai"."scene_videos" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."script_segments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."scripts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."storyboards" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tubegai"."scene_videos" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."script_segments" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."scripts" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."storyboards" CASCADE;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_scene" ADD CONSTRAINT "studio_scene_storyboard_scene_id_storyboard_scenes_id_fk" FOREIGN KEY ("storyboard_scene_id") REFERENCES "tubegai"."storyboard_scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_scene" ADD CONSTRAINT "studio_scene_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_scene" ADD CONSTRAINT "studio_scene_video_asset_id_media_assets_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "tubegai"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_script_segment" ADD CONSTRAINT "studio_script_segment_script_id_studio_script_id_fk" FOREIGN KEY ("script_id") REFERENCES "tubegai"."studio_script"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_script" ADD CONSTRAINT "studio_script_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_user_storyboard" ADD CONSTRAINT "studio_user_storyboard_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."storyboard_scenes" ADD CONSTRAINT "storyboard_scenes_storyboard_id_studio_user_storyboard_id_fk" FOREIGN KEY ("storyboard_id") REFERENCES "tubegai"."studio_user_storyboard"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."storyboard_scenes" ADD CONSTRAINT "storyboard_scenes_script_segment_id_studio_script_segment_id_fk" FOREIGN KEY ("script_segment_id") REFERENCES "tubegai"."studio_script_segment"("id") ON DELETE set null ON UPDATE no action;