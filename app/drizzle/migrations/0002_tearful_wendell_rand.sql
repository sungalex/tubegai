CREATE TABLE "tubegai"."settings_mcp_servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"endpoint_url" text NOT NULL,
	"access_token" text,
	"status" "tubegai"."mcp_status" DEFAULT 'disconnected',
	"last_connected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tubegai"."settings_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan" "tubegai"."subscription_plan" DEFAULT 'free' NOT NULL,
	"status" "tubegai"."subscription_status" DEFAULT 'active' NOT NULL,
	"price" numeric,
	"billing_cycle" "tubegai"."billing_cycle",
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DROP TABLE "tubegai"."mcp_servers" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."subscriptions" CASCADE;--> statement-breakpoint
ALTER TABLE "tubegai"."settings_mcp_servers" ADD CONSTRAINT "settings_mcp_servers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."settings_subscriptions" ADD CONSTRAINT "settings_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;