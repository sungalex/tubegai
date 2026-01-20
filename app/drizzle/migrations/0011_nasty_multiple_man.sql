CREATE TABLE "tubegai"."settings_integration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "tubegai"."integration_provider" NOT NULL,
	"status" "tubegai"."integration_status" DEFAULT 'inactive',
	"access_token" text,
	"refresh_token" text,
	"account_name" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tubegai"."settings_mcp_server" (
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
CREATE TABLE "tubegai"."settings_subscription" (
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
	CONSTRAINT "settings_subscription_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DROP TABLE "tubegai"."settings_integrations" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."settings_mcp_servers" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."settings_subscriptions" CASCADE;--> statement-breakpoint
ALTER TABLE "tubegai"."settings_integration" ADD CONSTRAINT "settings_integration_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."settings_mcp_server" ADD CONSTRAINT "settings_mcp_server_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."settings_subscription" ADD CONSTRAINT "settings_subscription_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;