ALTER TYPE "public"."trendtube_media_type" ADD VALUE 'generated_video';--> statement-breakpoint
ALTER TYPE "public"."trendtube_media_type" ADD VALUE 'composited_video';--> statement-breakpoint
ALTER TYPE "public"."trendtube_pipeline_status" ADD VALUE 'compositing' BEFORE 'completed';