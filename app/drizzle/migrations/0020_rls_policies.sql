-- ============================================
-- Row Level Security (RLS) Policies for TubeGAI
-- ============================================
-- This migration enables RLS on all tables and creates policies
-- to ensure users can only access their own data.
--
-- Supabase auth.uid() returns the current authenticated user's UUID
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles (for display purposes)
CREATE POLICY "profiles_select_all" ON "public"."profiles"
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON "public"."profiles"
  FOR UPDATE USING (id = auth.uid());

-- Users can only insert their own profile
CREATE POLICY "profiles_insert_own" ON "public"."profiles"
  FOR INSERT WITH CHECK (id = auth.uid());

-- Users can only delete their own profile
CREATE POLICY "profiles_delete_own" ON "public"."profiles"
  FOR DELETE USING (id = auth.uid());

-- ============================================
-- 2. MEDIA_ASSET TABLE
-- ============================================
ALTER TABLE "public"."media_asset" ENABLE ROW LEVEL SECURITY;

-- Users can only see their own media assets
CREATE POLICY "media_asset_select_own" ON "public"."media_asset"
  FOR SELECT USING (user_id = auth.uid());

-- Users can only insert their own media assets
CREATE POLICY "media_asset_insert_own" ON "public"."media_asset"
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can only update their own media assets
CREATE POLICY "media_asset_update_own" ON "public"."media_asset"
  FOR UPDATE USING (user_id = auth.uid());

-- Users can only delete their own media assets
CREATE POLICY "media_asset_delete_own" ON "public"."media_asset"
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 3. PROJECT TABLE
-- ============================================
ALTER TABLE "public"."project" ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projects
CREATE POLICY "project_select_own" ON "public"."project"
  FOR SELECT USING (user_id = auth.uid());

-- Users can only insert their own projects
CREATE POLICY "project_insert_own" ON "public"."project"
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can only update their own projects
CREATE POLICY "project_update_own" ON "public"."project"
  FOR UPDATE USING (user_id = auth.uid());

-- Users can only delete their own projects
CREATE POLICY "project_delete_own" ON "public"."project"
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 4. CHANNEL TABLE
-- ============================================
ALTER TABLE "public"."channel" ENABLE ROW LEVEL SECURITY;

-- Users can only see their own channels
CREATE POLICY "channel_select_own" ON "public"."channel"
  FOR SELECT USING (user_id = auth.uid());

-- Users can only insert their own channels
CREATE POLICY "channel_insert_own" ON "public"."channel"
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can only update their own channels
CREATE POLICY "channel_update_own" ON "public"."channel"
  FOR UPDATE USING (user_id = auth.uid());

-- Users can only delete their own channels
CREATE POLICY "channel_delete_own" ON "public"."channel"
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 5. LABEL TABLE
-- ============================================
ALTER TABLE "public"."label" ENABLE ROW LEVEL SECURITY;

-- Users can see their own labels and global labels (user_id is null)
CREATE POLICY "label_select_own_or_global" ON "public"."label"
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Users can only insert their own labels
CREATE POLICY "label_insert_own" ON "public"."label"
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can only update their own labels
CREATE POLICY "label_update_own" ON "public"."label"
  FOR UPDATE USING (user_id = auth.uid());

-- Users can only delete their own labels
CREATE POLICY "label_delete_own" ON "public"."label"
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 6. PROJECT_LABEL TABLE (Junction)
-- ============================================
ALTER TABLE "public"."project_label" ENABLE ROW LEVEL SECURITY;

-- Users can see project_labels for their own projects
CREATE POLICY "project_label_select_own" ON "public"."project_label"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can insert project_labels for their own projects
CREATE POLICY "project_label_insert_own" ON "public"."project_label"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can delete project_labels for their own projects
CREATE POLICY "project_label_delete_own" ON "public"."project_label"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. SAVED_IDEA TABLE
-- ============================================
ALTER TABLE "public"."saved_idea" ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved ideas
CREATE POLICY "saved_idea_select_own" ON "public"."saved_idea"
  FOR SELECT USING (user_id = auth.uid());

-- Users can only insert their own saved ideas
CREATE POLICY "saved_idea_insert_own" ON "public"."saved_idea"
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can only update their own saved ideas
CREATE POLICY "saved_idea_update_own" ON "public"."saved_idea"
  FOR UPDATE USING (user_id = auth.uid());

-- Users can only delete their own saved ideas
CREATE POLICY "saved_idea_delete_own" ON "public"."saved_idea"
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 8. TREND TABLE
-- ============================================
ALTER TABLE "public"."trend" ENABLE ROW LEVEL SECURITY;

-- Public trends (from YouTube API) are readable by all authenticated users
-- User-specific trends (saved/bookmarked) are only visible to the owner
CREATE POLICY "trend_select_public_or_own" ON "public"."trend"
  FOR SELECT USING (
    source = 'youtube_api'
    OR user_id = auth.uid()
    OR user_id IS NULL
    OR saved_by_user_id = auth.uid()
  );

-- Only authenticated users can insert trends (for caching)
CREATE POLICY "trend_insert_authenticated" ON "public"."trend"
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update trends they own or have saved
CREATE POLICY "trend_update_own_or_saved" ON "public"."trend"
  FOR UPDATE USING (
    user_id = auth.uid()
    OR saved_by_user_id = auth.uid()
    OR (user_id IS NULL AND source = 'youtube_api')
  );

-- Users can only delete trends they own
CREATE POLICY "trend_delete_own" ON "public"."trend"
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 9. AI_RECOMMENDATION TABLE
-- ============================================
ALTER TABLE "public"."ai_recommendation" ENABLE ROW LEVEL SECURITY;

-- Users can see their own recommendations or public ones
CREATE POLICY "ai_recommendation_select_own_or_public" ON "public"."ai_recommendation"
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Users can insert their own recommendations
CREATE POLICY "ai_recommendation_insert_own" ON "public"."ai_recommendation"
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Users can update their own recommendations
CREATE POLICY "ai_recommendation_update_own" ON "public"."ai_recommendation"
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own recommendations
CREATE POLICY "ai_recommendation_delete_own" ON "public"."ai_recommendation"
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 10. STUDIO_SCRIPT TABLE
-- ============================================
ALTER TABLE "public"."studio_script" ENABLE ROW LEVEL SECURITY;

-- Users can see scripts for their own projects
CREATE POLICY "studio_script_select_own" ON "public"."studio_script"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can insert scripts for their own projects
CREATE POLICY "studio_script_insert_own" ON "public"."studio_script"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can update scripts for their own projects
CREATE POLICY "studio_script_update_own" ON "public"."studio_script"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can delete scripts for their own projects
CREATE POLICY "studio_script_delete_own" ON "public"."studio_script"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- ============================================
-- 11. STUDIO_SCRIPT_SEGMENT TABLE
-- ============================================
ALTER TABLE "public"."studio_script_segment" ENABLE ROW LEVEL SECURITY;

-- Users can see script segments for their own projects
CREATE POLICY "studio_script_segment_select_own" ON "public"."studio_script_segment"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."studio_script" s
      JOIN "public"."project" p ON p.id = s.project_id
      WHERE s.id = script_id AND p.user_id = auth.uid()
    )
  );

-- Users can insert script segments for their own projects
CREATE POLICY "studio_script_segment_insert_own" ON "public"."studio_script_segment"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."studio_script" s
      JOIN "public"."project" p ON p.id = s.project_id
      WHERE s.id = script_id AND p.user_id = auth.uid()
    )
  );

-- Users can update script segments for their own projects
CREATE POLICY "studio_script_segment_update_own" ON "public"."studio_script_segment"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "public"."studio_script" s
      JOIN "public"."project" p ON p.id = s.project_id
      WHERE s.id = script_id AND p.user_id = auth.uid()
    )
  );

-- Users can delete script segments for their own projects
CREATE POLICY "studio_script_segment_delete_own" ON "public"."studio_script_segment"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "public"."studio_script" s
      JOIN "public"."project" p ON p.id = s.project_id
      WHERE s.id = script_id AND p.user_id = auth.uid()
    )
  );

-- ============================================
-- 12. STUDIO_STORYBOARD TABLE
-- ============================================
ALTER TABLE "public"."studio_storyboard" ENABLE ROW LEVEL SECURITY;

-- Users can see storyboards for their own projects
CREATE POLICY "studio_storyboard_select_own" ON "public"."studio_storyboard"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can insert storyboards for their own projects
CREATE POLICY "studio_storyboard_insert_own" ON "public"."studio_storyboard"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can update storyboards for their own projects
CREATE POLICY "studio_storyboard_update_own" ON "public"."studio_storyboard"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can delete storyboards for their own projects
CREATE POLICY "studio_storyboard_delete_own" ON "public"."studio_storyboard"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- ============================================
-- 13. STUDIO_VIDEO TABLE
-- ============================================
ALTER TABLE "public"."studio_video" ENABLE ROW LEVEL SECURITY;

-- Users can see scene videos for their own projects
CREATE POLICY "studio_video_select_own" ON "public"."studio_video"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can insert scene videos for their own projects
CREATE POLICY "studio_video_insert_own" ON "public"."studio_video"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can update scene videos for their own projects
CREATE POLICY "studio_video_update_own" ON "public"."studio_video"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can delete scene videos for their own projects
CREATE POLICY "studio_video_delete_own" ON "public"."studio_video"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- ============================================
-- 14. STUDIO_VIDEO_PART TABLE
-- ============================================
ALTER TABLE "public"."studio_video_part" ENABLE ROW LEVEL SECURITY;

-- Users can see video parts for their own projects
CREATE POLICY "studio_video_part_select_own" ON "public"."studio_video_part"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."studio_video" v
      JOIN "public"."project" p ON p.id = v.project_id
      WHERE v.id = video_id AND p.user_id = auth.uid()
    )
  );

-- Users can insert video parts for their own projects
CREATE POLICY "studio_video_part_insert_own" ON "public"."studio_video_part"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."studio_video" v
      JOIN "public"."project" p ON p.id = v.project_id
      WHERE v.id = video_id AND p.user_id = auth.uid()
    )
  );

-- Users can update video parts for their own projects
CREATE POLICY "studio_video_part_update_own" ON "public"."studio_video_part"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "public"."studio_video" v
      JOIN "public"."project" p ON p.id = v.project_id
      WHERE v.id = video_id AND p.user_id = auth.uid()
    )
  );

-- Users can delete video parts for their own projects
CREATE POLICY "studio_video_part_delete_own" ON "public"."studio_video_part"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "public"."studio_video" v
      JOIN "public"."project" p ON p.id = v.project_id
      WHERE v.id = video_id AND p.user_id = auth.uid()
    )
  );

-- ============================================
-- 15. STUDIO_EXPORT_HISTORY TABLE
-- ============================================
ALTER TABLE "public"."studio_export_history" ENABLE ROW LEVEL SECURITY;

-- Users can see export history for their own projects
CREATE POLICY "studio_export_history_select_own" ON "public"."studio_export_history"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can insert export history for their own projects
CREATE POLICY "studio_export_history_insert_own" ON "public"."studio_export_history"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can update export history for their own projects
CREATE POLICY "studio_export_history_update_own" ON "public"."studio_export_history"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can delete export history for their own projects
CREATE POLICY "studio_export_history_delete_own" ON "public"."studio_export_history"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- ============================================
-- 16. STUDIO_SUBTITLE TABLE
-- ============================================
ALTER TABLE "public"."studio_subtitle" ENABLE ROW LEVEL SECURITY;

-- Users can see subtitles for their own projects
CREATE POLICY "studio_subtitle_select_own" ON "public"."studio_subtitle"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can insert subtitles for their own projects
CREATE POLICY "studio_subtitle_insert_own" ON "public"."studio_subtitle"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can update subtitles for their own projects
CREATE POLICY "studio_subtitle_update_own" ON "public"."studio_subtitle"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can delete subtitles for their own projects
CREATE POLICY "studio_subtitle_delete_own" ON "public"."studio_subtitle"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- ============================================
-- 17. STUDIO_SEO TABLE
-- ============================================
ALTER TABLE "public"."studio_seo" ENABLE ROW LEVEL SECURITY;

-- Users can see SEO settings for their own projects
CREATE POLICY "studio_seo_select_own" ON "public"."studio_seo"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can insert SEO settings for their own projects
CREATE POLICY "studio_seo_insert_own" ON "public"."studio_seo"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can update SEO settings for their own projects
CREATE POLICY "studio_seo_update_own" ON "public"."studio_seo"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- Users can delete SEO settings for their own projects
CREATE POLICY "studio_seo_delete_own" ON "public"."studio_seo"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "public"."project" p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- ============================================
-- 18. AUDIT_LOG TABLE
-- ============================================
ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audit logs
CREATE POLICY "audit_log_select_own" ON "public"."audit_log"
  FOR SELECT USING (user_id = auth.uid());

-- System can insert audit logs (no user restriction for INSERT)
-- This allows server-side code to insert logs with service_role key
CREATE POLICY "audit_log_insert_system" ON "public"."audit_log"
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- No UPDATE or DELETE allowed on audit logs (immutable)
-- Audit logs should never be modified or deleted
