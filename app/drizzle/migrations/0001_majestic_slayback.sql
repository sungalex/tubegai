CREATE TABLE "tubegai"."settings_notification" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email_marketing" boolean DEFAULT false,
	"email_project_updates" boolean DEFAULT true,
	"email_security" boolean DEFAULT true,
	"push_everything" boolean DEFAULT false,
	"push_comments" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tubegai"."notification_settings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tubegai"."notification_settings" CASCADE;--> statement-breakpoint
ALTER TABLE "tubegai"."integrations" RENAME TO "settings_integrations";--> statement-breakpoint
ALTER TABLE "tubegai"."settings_integrations" DROP CONSTRAINT "integrations_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "tubegai"."settings_notification" ADD CONSTRAINT "settings_notification_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."settings_integrations" ADD CONSTRAINT "settings_integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;