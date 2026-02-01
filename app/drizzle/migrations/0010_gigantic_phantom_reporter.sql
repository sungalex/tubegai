CREATE TYPE "public"."idea_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TABLE "saved_idea" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"hooks" text[] NOT NULL,
	"target_audience" text NOT NULL,
	"estimated_views" text NOT NULL,
	"difficulty" "idea_difficulty" DEFAULT 'medium' NOT NULL,
	"based_on_trend" text NOT NULL,
	"trend_id" integer,
	"used_for_project_id" uuid,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_idea" ADD CONSTRAINT "saved_idea_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_idea" ADD CONSTRAINT "saved_idea_used_for_project_id_project_id_fk" FOREIGN KEY ("used_for_project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;