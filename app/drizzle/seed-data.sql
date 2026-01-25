-- =============================================
-- TubeGAI Seed Data for Supabase SQL Editor
-- 1명의 사용자, 1개의 채널로 통일
-- =============================================

DO $$
DECLARE
  -- 실제 auth.users ID
  user_id uuid := '452b8da3-656d-4ee7-8e63-42ae9fb37505';
  
  -- 채널 UUID (youtube_channel_id는 실제 값 사용)
  channel_id uuid := 'b1111111-1111-1111-1111-111111111111';
  youtube_channel text := 'UCDjNOVeTvVa7yBYIGSCMdMg';
  
  -- 프로젝트 IDs
  project1_id uuid := 'c1111111-1111-1111-1111-111111111111';
  project2_id uuid := 'c2222222-2222-2222-2222-222222222222';
  project3_id uuid := 'c3333333-3333-3333-3333-333333333333';
  project4_id uuid := 'c4444444-4444-4444-4444-444444444444';
  project5_id uuid := 'c5555555-5555-5555-5555-555555555555';
  
  -- 라벨 IDs
  label1_id uuid := 'd1111111-1111-1111-1111-111111111111';
  label2_id uuid := 'd2222222-2222-2222-2222-222222222222';
  label3_id uuid := 'd3333333-3333-3333-3333-333333333333';
  label4_id uuid := 'd4444444-4444-4444-4444-444444444444';
  label5_id uuid := 'd5555555-5555-5555-5555-555555555555';
  
  -- 미디어 IDs
  media1_id uuid := 'e1111111-1111-1111-1111-111111111111';
  media2_id uuid := 'e2222222-2222-2222-2222-222222222222';
  media3_id uuid := 'e3333333-3333-3333-3333-333333333333';
  media4_id uuid := 'e4444444-4444-4444-4444-444444444444';
  media5_id uuid := 'e5555555-5555-5555-5555-555555555555';
  
  -- 스크립트 IDs
  script1_id uuid := 'f1111111-1111-1111-1111-111111111111';
  script2_id uuid := 'f2222222-2222-2222-2222-222222222222';
  script3_id uuid := 'f3333333-3333-3333-3333-333333333333';
  script4_id uuid := 'f4444444-4444-4444-4444-444444444444';
  script5_id uuid := 'f5555555-5555-5555-5555-555555555555';
  
  -- 세그먼트 IDs
  segment1_id uuid := 'f1111111-1111-1111-1111-111111111112';
  segment2_id uuid := 'f2222222-2222-2222-2222-222222222223';
  segment3_id uuid := 'f3333333-3333-3333-3333-333333333334';
  segment4_id uuid := 'f4444444-4444-4444-4444-444444444445';
  segment5_id uuid := 'f5555555-5555-5555-5555-555555555556';
  
  -- 스토리보드 IDs
  storyboard1_id uuid := 'f6666666-6666-6666-6666-666666666666';
  storyboard2_id uuid := 'f7777777-7777-7777-7777-777777777777';
  storyboard3_id uuid := 'f8888888-8888-8888-8888-888888888888';
  storyboard4_id uuid := 'f9999999-9999-9999-9999-999999999999';
  storyboard5_id uuid := 'faaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  
  -- 썸네일 IDs
  thumbnail1_id uuid := 'fabbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  thumbnail2_id uuid := 'fabbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  thumbnail3_id uuid := 'fabbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  thumbnail4_id uuid := 'fabbbbb4-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  thumbnail5_id uuid := 'fabbbbb5-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  
  -- 타임라인 IDs
  timeline1_id uuid := 'facccc01-cccc-cccc-cccc-cccccccccccc';
  timeline2_id uuid := 'facccc02-cccc-cccc-cccc-cccccccccccc';
  timeline3_id uuid := 'facccc03-cccc-cccc-cccc-cccccccccccc';
  timeline4_id uuid := 'facccc04-cccc-cccc-cccc-cccccccccccc';
  timeline5_id uuid := 'facccc05-cccc-cccc-cccc-cccccccccccc';

BEGIN
  -- =============================================
  -- 1. profiles
  -- =============================================
  INSERT INTO profiles (id, username, display_name, avatar_url, bio) VALUES
    (user_id, 'creator', 'AI Creator', 'https://i.pravatar.cc/150?u=creator', 'AI 콘텐츠 크리에이터');

  -- =============================================
  -- 2. channel
  -- =============================================
  INSERT INTO channel (id, user_id, youtube_channel_id, name, handle, avatar_url, status) VALUES
    (channel_id, user_id, youtube_channel, 'My YouTube Channel', '@mychannel', 'https://i.pravatar.cc/150?u=channel', 'active');

  -- =============================================
  -- 3. label
  -- =============================================
  INSERT INTO label (id, name, color, user_id) VALUES
    (label1_id, '긴급', '#FF0000', user_id),
    (label2_id, '진행중', '#FFA500', user_id),
    (label3_id, '완료', '#00FF00', user_id),
    (label4_id, '리뷰 필요', '#0000FF', user_id),
    (label5_id, '보류', '#808080', user_id);

  -- =============================================
  -- 4. project
  -- =============================================
  INSERT INTO project (id, user_id, channel_id, title, description, type, tone, visibility, topic, status) VALUES
    (project1_id, user_id, channel_id, 'AI 기술 트렌드 2024', 'AI 기술의 최신 트렌드를 분석합니다', 'long', 'informative', 'public', 'AI Technology', 'in_progress'),
    (project2_id, user_id, channel_id, '쇼츠: 빠른 팁 #1', '1분 안에 배우는 생산성 팁', 'short', 'funny', 'public', 'Productivity', 'completed'),
    (project3_id, user_id, channel_id, '홈카페 레시피', '집에서 만드는 카페 음료', 'long', 'vlog', 'public', 'Lifestyle', 'draft'),
    (project4_id, user_id, channel_id, '맥북 프로 리뷰', 'M3 맥북 프로 심층 리뷰', 'long', 'informative', 'private', 'Tech Review', 'in_progress'),
    (project5_id, user_id, channel_id, '데일리 메이크업', '출근 전 5분 메이크업', 'short', 'cinematic', 'public', 'Beauty', 'draft');

  -- =============================================
  -- 5. media_asset
  -- =============================================
  INSERT INTO media_asset (id, user_id, project_id, type, provider, storage_key, public_url, file_size, mime_type, width, height) VALUES
    (media1_id, user_id, project1_id, 'image', 's3', 'uploads/img001.jpg', 'https://example.com/img001.jpg', 1024000, 'image/jpeg', 1920, 1080),
    (media2_id, user_id, project1_id, 'video', 's3', 'uploads/vid001.mp4', 'https://example.com/vid001.mp4', 50000000, 'video/mp4', 1920, 1080),
    (media3_id, user_id, project3_id, 'image', 'r2', 'uploads/img002.png', 'https://example.com/img002.png', 2048000, 'image/png', 1280, 720),
    (media4_id, user_id, project4_id, 'audio', 's3', 'uploads/aud001.mp3', 'https://example.com/aud001.mp3', 5000000, 'audio/mpeg', NULL, NULL),
    (media5_id, user_id, project5_id, 'video', 'local', 'uploads/vid002.mov', 'https://example.com/vid002.mov', 100000000, 'video/quicktime', 3840, 2160);

  -- =============================================
  -- 6. channel_video
  -- =============================================
  INSERT INTO channel_video (channel_id, project_id, youtube_video_id, title, description, thumbnail_url, published_at, view_count, like_count) VALUES
    (channel_id, project2_id, 'yt_vid_001', '완료된 영상 #1', '첫 번째 업로드 영상', 'https://img.youtube.com/vi/yt_vid_001/0.jpg', NOW() - INTERVAL '30 days', 15000, 500),
    (channel_id, NULL, 'yt_vid_002', '기존 영상 #2', '채널의 기존 콘텐츠', 'https://img.youtube.com/vi/yt_vid_002/0.jpg', NOW() - INTERVAL '60 days', 25000, 1200),
    (channel_id, NULL, 'yt_vid_003', '라이프스타일 브이로그', '일상 브이로그', 'https://img.youtube.com/vi/yt_vid_003/0.jpg', NOW() - INTERVAL '15 days', 8000, 350),
    (channel_id, NULL, 'yt_vid_004', '갤럭시 리뷰', '삼성 갤럭시 리뷰', 'https://img.youtube.com/vi/yt_vid_004/0.jpg', NOW() - INTERVAL '45 days', 45000, 2100),
    (channel_id, NULL, 'yt_vid_005', '게임 플레이 #1', '인기 게임 플레이', 'https://img.youtube.com/vi/yt_vid_005/0.jpg', NOW() - INTERVAL '7 days', 12000, 800);

  -- =============================================
  -- 7. project_label
  -- =============================================
  INSERT INTO project_label (project_id, label_id) VALUES
    (project1_id, label1_id),
    (project1_id, label2_id),
    (project2_id, label3_id),
    (project3_id, label2_id),
    (project4_id, label4_id);

  -- =============================================
  -- 8. project_pipeline
  -- =============================================
  INSERT INTO project_pipeline (project_id, current_phase, step_script_status, step_storyboard_status, overall_progress) VALUES
    (project1_id, 'production', 'completed', 'in_progress', 35),
    (project2_id, 'completed', 'completed', 'completed', 100),
    (project3_id, 'planning', 'pending', 'pending', 5),
    (project4_id, 'post_production', 'completed', 'completed', 70),
    (project5_id, 'planning', 'in_progress', 'pending', 15);

  -- =============================================
  -- 9. project_seo
  -- =============================================
  INSERT INTO project_seo (project_id, target_keyword, youtube_title, youtube_description, youtube_tags, seo_score) VALUES
    (project1_id, 'AI 트렌드 2024', 'AI 기술 트렌드 2024 | 완벽 가이드', 'AI 기술의 최신 동향을 알아봅니다...', ARRAY['AI', '인공지능', '2024', '트렌드'], 85),
    (project2_id, '생산성 팁', '1분 생산성 팁 #Shorts', '빠르게 배우는 생산성 향상 방법', ARRAY['생산성', '팁', '쇼츠'], 92),
    (project3_id, '홈카페', '집에서 만드는 카페 음료', '홈카페 레시피 모음', ARRAY['홈카페', '레시피', '커피'], 78),
    (project4_id, '맥북 리뷰', 'M3 맥북 프로 완벽 리뷰', '애플 M3 칩 맥북 프로 상세 리뷰', ARRAY['맥북', '애플', 'M3', '리뷰'], 88),
    (project5_id, '데일리 메이크업', '출근 전 5분 메이크업 튜토리얼', '바쁜 아침을 위한 빠른 메이크업', ARRAY['메이크업', '뷰티', '튜토리얼'], 75);

  -- =============================================
  -- 10. billing_history
  -- =============================================
  -- INSERT INTO billing_history (user_id, invoice_id, amount, currency, status, paid_at) VALUES
  --   (user_id, 'INV-2024-001', 9.99, 'USD', 'paid', NOW() - INTERVAL '30 days'),
  --   (user_id, 'INV-2024-002', 9.99, 'USD', 'paid', NOW()),
  --   (user_id, 'INV-2024-003', 29.99, 'USD', 'paid', NOW() - INTERVAL '15 days'),
  --   (user_id, 'INV-2024-004', 9.99, 'USD', 'pending', NULL),
  --   (user_id, 'INV-2024-005', 99.99, 'USD', 'failed', NULL);

  -- =============================================
  -- 11. settings_integration
  -- =============================================
  -- INSERT INTO settings_integration (user_id, provider, status, account_name) VALUES
  --   (user_id, 'youtube', 'active', 'my_youtube_account'),
  --   (user_id, 'gemini', 'active', NULL),
  --   (user_id, 'pexels', 'active', 'my_pexels'),
  --   (user_id, 'openai', 'active', NULL),
  --   (user_id, 'elevenlabs', 'inactive', NULL);

  -- =============================================
  -- 12. settings_mcp_server
  -- =============================================
  -- INSERT INTO settings_mcp_server (user_id, name, endpoint_url, status) VALUES
  --   (user_id, 'Local MCP Server', 'http://localhost:3001/mcp', 'connected'),
  --   (user_id, 'Cloud MCP', 'https://mcp.example.com/api', 'disconnected'),
  --   (user_id, 'Dev Server', 'http://192.168.1.100:3001', 'error'),
  --   (user_id, 'Production MCP', 'https://prod-mcp.example.com', 'connected'),
  --   (user_id, 'Test MCP', 'http://localhost:8080/mcp', 'disconnected');

  -- =============================================
  -- 13. settings_notification
  -- =============================================
  INSERT INTO settings_notification (id, email_marketing, email_project_updates, email_security, push_everything, push_comments) VALUES
    (user_id, true, true, true, false, true);

  -- =============================================
  -- 14. settings_subscription
  -- =============================================
  INSERT INTO settings_subscription (user_id, plan, status, price, billing_cycle, current_period_start, current_period_end) VALUES
    (user_id, 'pro', 'active', 9.99, 'monthly', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days');

  -- =============================================
  -- 15. studio_coloring_preset
  -- =============================================
  INSERT INTO studio_coloring_preset (id, name, filter_parameters) VALUES
    ('preset_natural', 'Natural', '{"brightness": 0, "contrast": 0, "saturation": 0}'),
    ('preset_warm', 'Warm', '{"brightness": 5, "contrast": 10, "saturation": 15, "temperature": 20}'),
    ('preset_cool', 'Cool', '{"brightness": 0, "contrast": 5, "saturation": -5, "temperature": -15}'),
    ('preset_cinematic', 'Cinematic', '{"brightness": -5, "contrast": 20, "saturation": -10, "vignette": 30}'),
    ('preset_vintage', 'Vintage', '{"brightness": 10, "contrast": -5, "saturation": -20, "sepia": 40}');

  -- =============================================
  -- 16. studio_script
  -- =============================================
  INSERT INTO studio_script (id, project_id, prompt, target_duration) VALUES
    (script1_id, project1_id, 'AI 기술 트렌드에 대한 10분짜리 영상 스크립트를 작성해줘', 600),
    (script2_id, project2_id, '1분 쇼츠용 생산성 팁 스크립트', 60),
    (script3_id, project3_id, '홈카페 레시피 소개 영상 스크립트', 480),
    (script4_id, project4_id, '맥북 프로 리뷰 상세 스크립트', 900),
    (script5_id, project5_id, '5분 메이크업 튜토리얼 스크립트', 300);

  -- =============================================
  -- 17. studio_script_segment
  -- =============================================
  INSERT INTO studio_script_segment (id, script_id, order_index, type, content, estimated_duration) VALUES
    (segment1_id, script1_id, 0, 'hook', '2024년, AI가 세상을 어떻게 바꾸고 있을까요?', 10),
    (segment2_id, script1_id, 1, 'intro', '안녕하세요, 오늘은 AI 트렌드에 대해 이야기해보겠습니다.', 20),
    (segment3_id, script1_id, 2, 'body', 'AI의 첫 번째 트렌드는 생성형 AI의 발전입니다...', 300),
    (segment4_id, script2_id, 0, 'hook', '이것 하나로 생산성 2배!', 5),
    (segment5_id, script2_id, 1, 'body', '바로 포모도로 기법입니다. 25분 집중, 5분 휴식!', 40);

  -- =============================================
  -- 18. studio_storyboard
  -- =============================================
  INSERT INTO studio_storyboard (id, project_id, script_segment_id, scene_number, order_index, description, visual_prompt, image_asset_id) VALUES
    (storyboard1_id, project1_id, segment1_id, 1, 0, '오프닝 장면 - AI 그래픽', 'Futuristic AI interface with glowing neural network', media1_id),
    (storyboard2_id, project1_id, segment2_id, 2, 1, '호스트 등장', 'Host speaking to camera in modern studio', NULL),
    (storyboard3_id, project1_id, segment3_id, 3, 2, 'AI 데모 화면', 'Screen recording of AI tool demonstration', NULL),
    (storyboard4_id, project2_id, segment4_id, 1, 0, '임팩트 있는 텍스트', 'Bold text animation: 생산성 2배!', NULL),
    (storyboard5_id, project2_id, segment5_id, 2, 1, '타이머 그래픽', 'Pomodoro timer graphic 25:00', NULL);

  -- =============================================
  -- 19. studio_video
  -- =============================================
  INSERT INTO studio_video (storyboard_id, project_id, video_asset_id, duration, status) VALUES
    (storyboard1_id, project1_id, media2_id, 10.5, 'completed'),
    (storyboard2_id, project1_id, NULL, 20.0, 'generating'),
    (storyboard3_id, project1_id, NULL, NULL, 'generating'),
    (storyboard4_id, project2_id, NULL, 5.0, 'completed'),
    (storyboard5_id, project2_id, NULL, 40.0, 'completed');

  -- =============================================
  -- 20. studio_b_roll
  -- =============================================
  INSERT INTO studio_b_roll (project_id, storyboard_id, asset_id, source_provider, source_url, start_time, end_time) VALUES
    (project1_id, storyboard1_id, media1_id, 'pexels', 'https://www.pexels.com/video/123', 0, 5),
    (project1_id, storyboard3_id, NULL, 'pixabay', 'https://pixabay.com/videos/456', 0, 10),
    (project2_id, storyboard4_id, NULL, 'unsplash', 'https://unsplash.com/photos/789', 0, 3),
    (project3_id, NULL, media3_id, 'custom', NULL, 0, 8),
    (project4_id, NULL, NULL, 'pexels', 'https://www.pexels.com/video/tech-001', 2, 12);

  -- =============================================
  -- 21. studio_subtitle
  -- =============================================
  INSERT INTO studio_subtitle (project_id, start_time, end_time, text, style_json) VALUES
    (project1_id, 0.0, 3.5, '2024년, AI가 세상을 어떻게 바꾸고 있을까요?', '{"fontSize": 24, "color": "#FFFFFF", "position": "bottom"}'),
    (project1_id, 3.5, 8.0, '안녕하세요, 오늘은 AI 트렌드에 대해', '{"fontSize": 24, "color": "#FFFFFF", "position": "bottom"}'),
    (project1_id, 8.0, 12.0, '이야기해보겠습니다.', '{"fontSize": 24, "color": "#FFFFFF", "position": "bottom"}'),
    (project2_id, 0.0, 2.5, '이것 하나로 생산성 2배!', '{"fontSize": 32, "color": "#FFFF00", "position": "center"}'),
    (project2_id, 2.5, 8.0, '바로 포모도로 기법입니다!', '{"fontSize": 28, "color": "#FFFFFF", "position": "bottom"}');

  -- =============================================
  -- 22. studio_coloring_setting
  -- =============================================
  INSERT INTO studio_coloring_setting (project_id, preset_id, custom_parameters) VALUES
    (project1_id, 'preset_cinematic', '{"brightness": -3, "contrast": 25}'),
    (project2_id, 'preset_warm', NULL),
    (project3_id, 'preset_natural', NULL),
    (project4_id, 'preset_cool', '{"saturation": -10}'),
    (project5_id, 'preset_warm', '{"temperature": 25}');

  -- =============================================
  -- 23. studio_thumbnail
  -- =============================================
  INSERT INTO studio_thumbnail (id, project_id) VALUES
    (thumbnail1_id, project1_id),
    (thumbnail2_id, project2_id),
    (thumbnail3_id, project3_id),
    (thumbnail4_id, project4_id),
    (thumbnail5_id, project5_id);

  -- =============================================
  -- 24. studio_thumbnail_candidate
  -- =============================================
  INSERT INTO studio_thumbnail_candidate (project_thumbnail_id, image_asset_id, is_favorite) VALUES
    (thumbnail1_id, media1_id, true),
    (thumbnail1_id, media3_id, false),
    (thumbnail2_id, media1_id, true),
    (thumbnail3_id, media3_id, false),
    (thumbnail4_id, media1_id, true);

  -- =============================================
  -- 25. studio_thumbnail_overlay
  -- =============================================
  INSERT INTO studio_thumbnail_overlay (project_thumbnail_id, type, properties) VALUES
    (thumbnail1_id, 'text', '{"text": "AI 트렌드 2024", "fontSize": 48, "color": "#FFFFFF", "x": 50, "y": 80}'),
    (thumbnail1_id, 'image', '{"imageUrl": "https://example.com/logo.png", "x": 10, "y": 10, "width": 100}'),
    (thumbnail2_id, 'text', '{"text": "생산성 2배!", "fontSize": 64, "color": "#FFFF00", "x": 50, "y": 50}'),
    (thumbnail3_id, 'text', '{"text": "홈카페", "fontSize": 56, "color": "#8B4513", "x": 50, "y": 70}'),
    (thumbnail4_id, 'text', '{"text": "완벽 리뷰", "fontSize": 48, "color": "#FFFFFF", "x": 50, "y": 80}');

  -- =============================================
  -- 26. studio_rough_cut_timeline
  -- =============================================
  INSERT INTO studio_rough_cut_timeline (id, project_id, zoom_scale, playhead_position) VALUES
    (timeline1_id, project1_id, 30, 0),
    (timeline2_id, project2_id, 50, 15.5),
    (timeline3_id, project3_id, 25, 0),
    (timeline4_id, project4_id, 40, 120.0),
    (timeline5_id, project5_id, 35, 0);

  -- =============================================
  -- 27. studio_rough_cut_version
  -- =============================================
  INSERT INTO studio_rough_cut_version (project_id, name, description, version_number, video_asset_id, duration) VALUES
    (project1_id, 'Draft v1', '초안 버전', 1, NULL, 580.5),
    (project1_id, 'Draft v2', '피드백 반영', 2, media2_id, 595.0),
    (project2_id, 'Final', '최종 버전', 1, NULL, 58.0),
    (project4_id, 'Review Cut', '리뷰용 컷', 1, NULL, 850.0),
    (project4_id, 'Final Cut', '최종 컷', 2, NULL, 870.0);

  -- =============================================
  -- 28. studio_rough_cut_timeline_segment
  -- =============================================
  INSERT INTO studio_rough_cut_timeline_segment (timeline_id, track_id, type, resource_type, resource_id, start_time, duration, trim_start, volume) VALUES
    (timeline1_id, 'V1', 'video', 'scene', storyboard1_id, 0, 10.5, 0, 1.0),
    (timeline1_id, 'V1', 'video', 'scene', storyboard2_id, 10.5, 20.0, 0, 1.0),
    (timeline1_id, 'V1', 'video', 'b_roll', media1_id, 30.5, 5.0, 1.0, 0.8),
    (timeline2_id, 'V1', 'video', 'scene', storyboard4_id, 0, 5.0, 0, 1.0),
    (timeline2_id, 'A1', 'audio', 'upload', media4_id, 0, 60.0, 0, 0.5);

  -- =============================================
  -- 29. studio_export_history
  -- =============================================
  INSERT INTO studio_export_history (project_id, format, resolution, status, video_asset_id, upload_status, completed_at) VALUES
    (project1_id, 'mp4', '1080p', 'completed', media2_id, 'uploaded', NOW() - INTERVAL '2 days'),
    (project2_id, 'mp4', '1080p', 'completed', NULL, 'uploaded', NOW() - INTERVAL '5 days'),
    (project3_id, 'mov', '4k', 'pending', NULL, 'not_uploaded', NULL),
    (project4_id, 'mp4', '4k', 'failed', NULL, 'not_uploaded', NULL),
    (project5_id, 'mp4', '1080p', 'pending', NULL, 'not_uploaded', NULL);

  -- =============================================
  -- 30. ai_generation_cache
  -- =============================================
  -- INSERT INTO ai_generation_cache (user_id, generation_type, prompt_hash, input_parameters_hash, media_asset_id, text_output, model_version, expires_at) VALUES
  --   (user_id, 'script', 'hash_script_001', 'params_001', NULL, 'AI 기술 트렌드에 대한 스크립트...', 'gpt-4-turbo', NOW() + INTERVAL '30 days'),
  --   (user_id, 'image', 'hash_image_001', 'params_002', media1_id, NULL, 'dall-e-3', NOW() + INTERVAL '7 days'),
  --   (user_id, 'seo', 'hash_seo_001', 'params_003', NULL, '{"title": "...", "tags": [...]}', 'gpt-4', NOW() + INTERVAL '14 days'),
  --   (user_id, 'video', 'hash_video_001', 'params_004', media2_id, NULL, 'sora-v1', NOW() + INTERVAL '3 days'),
  --   (user_id, 'script', 'hash_script_002', 'params_005', NULL, '메이크업 튜토리얼 스크립트...', 'claude-3', NOW() + INTERVAL '30 days');

  RAISE NOTICE '✅ Seed data inserted successfully!';
END $$;
