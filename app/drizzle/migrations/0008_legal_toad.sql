CREATE TABLE "ai_recommendation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"reason" text NOT NULL,
	"category" text,
	"growth_rate" text,
	"score" integer,
	"trend_id" uuid,
	"used_for_project_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "ai_recommendation" ADD CONSTRAINT "ai_recommendation_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_recommendation" ADD CONSTRAINT "ai_recommendation_trend_id_trend_id_fk" FOREIGN KEY ("trend_id") REFERENCES "public"."trend"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_recommendation" ADD CONSTRAINT "ai_recommendation_used_for_project_id_project_id_fk" FOREIGN KEY ("used_for_project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;