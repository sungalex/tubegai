CREATE TYPE "public"."ai_generation_type" AS ENUM('image', 'video', 'script', 'seo');--> statement-breakpoint
CREATE TYPE "public"."b_roll_provider" AS ENUM('pexels', 'pixabay', 'unsplash', 'custom');--> statement-breakpoint
CREATE TABLE "studio_seo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text,
	"description" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "studio_seo_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "studio_subtitle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"start_time" double precision NOT NULL,
	"end_time" double precision NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "studio_seo" ADD CONSTRAINT "studio_seo_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_subtitle" ADD CONSTRAINT "studio_subtitle_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;