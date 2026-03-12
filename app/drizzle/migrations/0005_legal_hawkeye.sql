ALTER TABLE "studio_subtitle" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "studio_subtitle" ADD COLUMN "script_segment_id" uuid;--> statement-breakpoint
ALTER TABLE "studio_subtitle" ADD COLUMN "order_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_subtitle" ADD CONSTRAINT "studio_subtitle_session_id_studio_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."studio_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_subtitle" ADD CONSTRAINT "studio_subtitle_script_segment_id_studio_script_segment_id_fk" FOREIGN KEY ("script_segment_id") REFERENCES "public"."studio_script_segment"("id") ON DELETE set null ON UPDATE no action;