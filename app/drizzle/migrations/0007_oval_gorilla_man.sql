CREATE TABLE "tubegai"."studio_storyboard_scene" (
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
ALTER TABLE "tubegai"."studio_storyboard" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tubegai"."studio_storyboard" CASCADE;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_storyboard_scene" ADD CONSTRAINT "studio_storyboard_scene_storyboard_id_studio_user_storyboard_id_fk" FOREIGN KEY ("storyboard_id") REFERENCES "tubegai"."studio_user_storyboard"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_storyboard_scene" ADD CONSTRAINT "studio_storyboard_scene_script_segment_id_studio_script_segment_id_fk" FOREIGN KEY ("script_segment_id") REFERENCES "tubegai"."studio_script_segment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_storyboard_scene" ADD CONSTRAINT "studio_storyboard_scene_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "tubegai"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_b_roll" ADD CONSTRAINT "studio_b_roll_storyboard_scene_id_studio_storyboard_scene_id_fk" FOREIGN KEY ("storyboard_scene_id") REFERENCES "tubegai"."studio_storyboard_scene"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_scene" ADD CONSTRAINT "studio_scene_storyboard_scene_id_studio_storyboard_scene_id_fk" FOREIGN KEY ("storyboard_scene_id") REFERENCES "tubegai"."studio_storyboard_scene"("id") ON DELETE cascade ON UPDATE no action;