CREATE TABLE "tubegai"."channel_video" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"project_id" uuid,
	"youtube_video_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"published_at" timestamp,
	"view_count" bigint DEFAULT 0,
	"like_count" bigint DEFAULT 0,
	"comment_count" bigint DEFAULT 0,
	"tags" text[],
	"duration" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "channel_video_youtube_video_id_unique" UNIQUE("youtube_video_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."channel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"youtube_channel_id" text NOT NULL,
	"name" text NOT NULL,
	"handle" text,
	"avatar_url" text,
	"access_token" text,
	"refresh_token" text,
	"status" "tubegai"."channel_status" DEFAULT 'active' NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "channel_youtube_channel_id_unique" UNIQUE("youtube_channel_id")
);
--> statement-breakpoint
CREATE TABLE "tubegai"."label" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#000000' NOT NULL,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tubegai"."media_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid,
	"type" "tubegai"."media_type" NOT NULL,
	"provider" "tubegai"."media_provider" DEFAULT 's3' NOT NULL,
	"storage_key" text NOT NULL,
	"public_url" text NOT NULL,
	"file_size" bigint NOT NULL,
	"mime_type" text NOT NULL,
	"width" integer,
	"height" integer,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "media_asset_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
ALTER TABLE "tubegai"."channel_videos" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."channels" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."labels" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tubegai"."media_assets" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tubegai"."channel_videos" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."channels" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."labels" CASCADE;--> statement-breakpoint
DROP TABLE "tubegai"."media_assets" CASCADE;--> statement-breakpoint
ALTER TABLE "tubegai"."channel_video" ADD CONSTRAINT "channel_video_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "tubegai"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."channel_video" ADD CONSTRAINT "channel_video_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "tubegai"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."channel" ADD CONSTRAINT "channel_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."label" ADD CONSTRAINT "label_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."media_asset" ADD CONSTRAINT "media_asset_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."ai_generation_cache" ADD CONSTRAINT "ai_generation_cache_media_asset_id_media_asset_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "tubegai"."media_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."project_label" ADD CONSTRAINT "project_label_label_id_label_id_fk" FOREIGN KEY ("label_id") REFERENCES "tubegai"."label"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."project" ADD CONSTRAINT "project_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "tubegai"."channel"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_b_roll" ADD CONSTRAINT "studio_b_roll_asset_id_media_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "tubegai"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_export_history" ADD CONSTRAINT "studio_export_history_video_asset_id_media_asset_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "tubegai"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_rough_cut_version" ADD CONSTRAINT "studio_rough_cut_version_video_asset_id_media_asset_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "tubegai"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_video" ADD CONSTRAINT "studio_video_video_asset_id_media_asset_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "tubegai"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_storyboard" ADD CONSTRAINT "studio_storyboard_image_asset_id_media_asset_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "tubegai"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tubegai"."studio_thumbnail_candidate" ADD CONSTRAINT "studio_thumbnail_candidate_image_asset_id_media_asset_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "tubegai"."media_asset"("id") ON DELETE cascade ON UPDATE no action;