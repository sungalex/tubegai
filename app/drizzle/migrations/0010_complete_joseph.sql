CREATE TABLE "tubegai"."project_label" (
	"project_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	CONSTRAINT "project_label_project_id_label_id_pk" PRIMARY KEY("project_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."project_pipeline" (
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
	CONSTRAINT "project_pipeline_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."project" (
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
ALTER TABLE "tubegai"."project_labels" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."project_pipelines" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."projects" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tubegai"."project_labels" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."project_pipelines" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."projects" CASCADE;--> statement-breakpoint
ALTER TABLE "tubegai"."project_label" ADD CONSTRAINT "project_label_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."project_label" ADD CONSTRAINT "project_label_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "tubegai"."labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."project_pipeline" ADD CONSTRAINT "project_pipeline_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."project" ADD CONSTRAINT "project_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."project" ADD CONSTRAINT "project_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "tubegai"."channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."channel_videos" ADD CONSTRAINT "channel_videos_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."project_seo" ADD CONSTRAINT "project_seo_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_b_roll" ADD CONSTRAINT "studio_b_roll_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_export_history" ADD CONSTRAINT "studio_export_history_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_coloring_setting" ADD CONSTRAINT "studio_coloring_setting_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_thumbnail" ADD CONSTRAINT "studio_thumbnail_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_rough_cut_timeline" ADD CONSTRAINT "studio_rough_cut_timeline_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_rough_cut_version" ADD CONSTRAINT "studio_rough_cut_version_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_video" ADD CONSTRAINT "studio_video_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_script" ADD CONSTRAINT "studio_script_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_storyboard" ADD CONSTRAINT "studio_storyboard_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_subtitle" ADD CONSTRAINT "studio_subtitle_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."project"("id") ON DELETE cascade ON UPDATE no action;