CREATE TYPE "public"."trend_source" AS ENUM('youtube_api', 'ai_generated', 'manual');--> statement-breakpoint
CREATE TABLE "trend" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"views_count" text,
	"growth_rate" text,
	"thumbnail_url" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"source" "trend_source" DEFAULT 'ai_generated' NOT NULL,
	"external_id" text,
	"external_url" text,
	"used_for_project_id" uuid,
	"view_count" bigint,
	"like_count" bigint,
	"comment_count" bigint,
	"published_at" timestamp,
	"fetched_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trend" ADD CONSTRAINT "trend_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend" ADD CONSTRAINT "trend_used_for_project_id_project_id_fk" FOREIGN KEY ("used_for_project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;