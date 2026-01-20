CREATE TABLE "tubegai"."studio_storyboard" (
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
ALTER TABLE "tubegai"."studio_storyboard_scene" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_user_storyboard" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tubegai"."studio_storyboard_scene" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."studio_user_storyboard" CASCADE;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_b_roll" ADD COLUMN "storyboard_id" uuid;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_video" ADD COLUMN "storyboard_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_storyboard" ADD CONSTRAINT "studio_storyboard_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_storyboard" ADD CONSTRAINT "studio_storyboard_script_segment_id_studio_script_segment_id_fk" FOREIGN KEY ("script_segment_id") REFERENCES "tubegai"."studio_script_segment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_storyboard" ADD CONSTRAINT "studio_storyboard_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "tubegai"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_b_roll" ADD CONSTRAINT "studio_b_roll_storyboard_id_studio_storyboard_id_fk" FOREIGN KEY ("storyboard_id") REFERENCES "tubegai"."studio_storyboard"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_video" ADD CONSTRAINT "studio_video_storyboard_id_studio_storyboard_id_fk" FOREIGN KEY ("storyboard_id") REFERENCES "tubegai"."studio_storyboard"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_b_roll" DROP COLUMN "storyboard_scene_id";--> statement-breakpoint
ALTER TABLE "tubegai"."studio_video" DROP COLUMN "storyboard_scene_id";