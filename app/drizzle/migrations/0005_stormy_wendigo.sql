CREATE TABLE "tubegai"."studio_coloring_preset" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"filter_parameters" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tubegai"."studio_coloring_setting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"preset_id" text,
	"custom_parameters" jsonb,
	CONSTRAINT "studio_coloring_setting_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."studio_thumbnail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	CONSTRAINT "studio_thumbnail_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."studio_subtitle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"start_time" double precision NOT NULL,
	"end_time" double precision NOT NULL,
	"text" text NOT NULL,
	"style_json" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tubegai"."coloring_presets" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."project_coloring_settings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."project_thumbnails" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."subtitles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tubegai"."coloring_presets" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."project_coloring_settings" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."project_thumbnails" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."subtitles" CASCADE;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_coloring_setting" ADD CONSTRAINT "studio_coloring_setting_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_coloring_setting" ADD CONSTRAINT "studio_coloring_setting_preset_id_studio_coloring_preset_id_fk" FOREIGN KEY ("preset_id") REFERENCES "tubegai"."studio_coloring_preset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_thumbnail" ADD CONSTRAINT "studio_thumbnail_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_subtitle" ADD CONSTRAINT "studio_subtitle_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."thumbnail_candidates" ADD CONSTRAINT "thumbnail_candidates_project_thumbnail_id_studio_thumbnail_id_fk" FOREIGN KEY ("project_thumbnail_id") REFERENCES "tubegai"."studio_thumbnail"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."thumbnail_overlays" ADD CONSTRAINT "thumbnail_overlays_project_thumbnail_id_studio_thumbnail_id_fk" FOREIGN KEY ("project_thumbnail_id") REFERENCES "tubegai"."studio_thumbnail"("id") ON DELETE cascade ON UPDATE no action;