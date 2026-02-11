# Data Model Planning

tubegai 프로젝트의 데이터 모델 설계 문서입니다.
이 문서를 기반으로 Drizzle ORM 구현을 수행할 예정 입니다.

## 0. Media Storage & Management Strategy

이미지와 비디오 등 대용량 미디어 파일의 효율적인 관리를 위한 전략은 다음과 같습니다.

1.  **Storage Provider**: AWS S3, Cloudflare R2, or Supabase Storage와 같은 Object Storage 사용.
2.  **Central Asset Management**: `media_asset` 테이블 사용.
3.  **Naming Convention**: `/projects/{projectId}/{feature}/{timestamp}_{filename}`

---

## 1. Foundation & Identity

### `users` (Supabase auth.users 참조용)

Supabase에서 관리하는 인증 테이블입니다. Drizzle ORM에서는 관계 정의를 위한 참조용으로만 사용합니다.

> [!NOTE]
> 이 테이블은 Supabase에서 자동 생성되므로 직접 생성하지 않습니다.
> Drizzle에서는 `profiles` 등 다른 테이블과의 FK 관계 정의에만 사용합니다.

- **id**: UUID (PK)
- **email**: String
- **created_at**: Timestamp

### `channel`

YouTube 채널 연동 정보.

- **id**: UUID (PK, Default: gen_random_uuid())
- **user_id**: UUID (FK -> users.id, On Delete: Cascade, Not Null)
- **youtube_channel_id**: String (Unique, Not Null)
- **name**: String (Not Null)
- **handle**: String
- **avatar_url**: String
- **access_token**: String (Encrypted)
- **refresh_token**: String (Encrypted)
- **status**: Enum (`active`, `disconnected`, `error`) (Default: 'active', Not Null)
- **last_synced_at**: Timestamp
- **created_at**: Timestamp (Default: now(), Not Null)
- **updated_at**: Timestamp (Default: now(), Not Null)

### `channel_video`

YouTube 채널 영상 정보.

- **id**: UUID (PK, Default: gen_random_uuid())
- **channel_id**: UUID (FK -> channel.id, On Delete: Cascade, Not Null)
- **project_id**: UUID (FK -> project.id, On Delete: Set Null, Nullable)
- **youtube_video_id**: String (Unique, Not Null)
- **title**: String (Not Null)
- **description**: Text
- **thumbnail_url**: String
- **published_at**: Timestamp
- **view_count**: BigInt (Default: 0)
- **like_count**: BigInt (Default: 0)
- **comment_count**: BigInt (Default: 0)
- **tags**: Array<String>
- **duration**: String
- **created_at**: Timestamp (Default: now(), Not Null)
- **updated_at**: Timestamp (Default: now(), Not Null)

### `label`

- **id**: UUID (PK, Default: gen_random_uuid())
- **name**: String (Not Null)
- **color**: String (Not Null, Default: '#000000')
- **user_id**: UUID (FK -> users.id, On Delete: Cascade, Nullable - System labels if null)
- **created_at**: Timestamp (Default: now(), Not Null)

### `media_asset`

- **id**: UUID (PK, Default: gen_random_uuid())
- **user_id**: UUID (FK -> users.id, On Delete: Cascade, Not Null)
- **project_id**: UUID (FK -> project.id, On Delete: Set Null, Nullable)
- **type**: Enum (`image`, `video`, `audio`) (Not Null)
- **provider**: Enum (`s3`, `r2`, `local`) (Not Null, Default: 's3')
- **storage_key**: String (Unique, Not Null)
- **public_url**: String (Not Null)
- **file_size**: BigInt (Not Null)
- **mime_type**: String (Not Null)
- **width**: Integer
- **height**: Integer
- **duration**: Float
- **created_at**: Timestamp (Default: now(), Not Null)

---

## 2. Project Core & Pipeline

### `project`

- **id**: UUID (PK, Default: gen_random_uuid())
- **owner_id**: UUID (FK -> users.id, On Delete: Cascade, Not Null)
- **channel_id**: UUID (FK -> channel.id, On Delete: Set Null, Nullable)
- **title**: String (Not Null, Default: 'Untitled Project')
- **description**: Text
- **type**: Enum (`short`, `long`) (Not Null, Default: 'short')
- **tone**: Enum (`informative`, `funny`, `cinematic`, `vlog`)
- **visibility**: Enum (`public`, `private`) (Not Null, Default: 'private')
- **topic**: String
- **status**: Enum (`draft`, `in_progress`, `completed`, `archived`) (Default: 'draft', Not Null)
- **created_at**: Timestamp (Default: now(), Not Null)
- **updated_at**: Timestamp (Default: now(), Not Null)

### `project_label` (Junction)

- **project_id**: UUID (FK -> project.id, On Delete: Cascade, Not Null)
- **label_id**: UUID (FK -> label.id, On Delete: Cascade, Not Null)
- **pk**: (project_id, label_id)

### `project_pipeline`

- **id**: UUID (PK, Default: gen_random_uuid())
- **project_id**: UUID (FK -> project.id, On Delete: Cascade, Unique, Not Null)
- **current_phase**: Enum (`planning`, `production`, `post_production`, `review`, `completed`) (Default: 'planning', Not Null)
- **step_script_status**: Enum (`pending`, `in_progress`, `completed`) (Default: 'pending')
- **step_storyboard_status**: Enum (Default: 'pending')
- **step_scene_status**: Enum (Default: 'pending')
- **step_b_roll_status**: Enum (Default: 'pending')
- **step_rough_cut_status**: Enum (Default: 'pending')
- **step_subtitles_status**: Enum (Default: 'pending')
- **step_coloring_status**: Enum (Default: 'pending')
- **step_thumbnail_status**: Enum (Default: 'pending')
- **step_seo_status**: Enum (Default: 'pending')
- **step_export_status**: Enum (Default: 'pending')
- **overall_progress**: Integer (Default: 0)
- **last_accessed_step**: String
- **updated_at**: Timestamp (Default: now(), Not Null)

### `project_seo`

- **id**: UUID (PK, Default: gen_random_uuid())
- **project_id**: UUID (FK -> project.id, On Delete: Cascade, Unique, Not Null)
- **target_keyword**: String (Not Null)
- **youtube_title**: String
- **youtube_description**: Text
- **youtube_tags**: Array<String>
- **seo_score**: Integer (Default: 0)
- **last_analyzed_at**: Timestamp
- **updated_at**: Timestamp (Default: now(), Not Null)

---

## 3. Studio: Pre-Production (Plan)

### `studio_script`

- **id**: UUID (PK, Default: gen_random_uuid())
- **project_id**: UUID (FK -> project.id, On Delete: Cascade, Unique, Not Null)
- **prompt**: Text
- **target_duration**: Integer (Seconds)
- **saved_at**: Timestamp (Default: now())

### `studio_script_segment`

- **id**: UUID (PK, Default: gen_random_uuid())
- **script_id**: UUID (FK -> studio_script.id, On Delete: Cascade, Not Null)
- **order_index**: Integer (Not Null)
- **type**: Enum (`hook`, `intro`, `body`, `cta`, `outro`) (Not Null)
- **content**: Text (Not Null)
- **estimated_duration**: Integer

### `studio_storyboard`

프로젝트의 스토리보드 장면들을 관리합니다. 각 장면은 스크립트 세그먼트와 연결될 수 있습니다.

- **id**: UUID (PK, Default: gen_random_uuid())
- **project_id**: UUID (FK -> project.id, On Delete: Cascade, Not Null)
- **script_segment_id**: UUID (FK -> studio_script_segment.id, On Delete: Set Null, Nullable)
- **scene_number**: Integer (Not Null)
- **order_index**: Integer (Not Null, Default: 0)
- **description**: Text
- **visual_prompt**: Text
- **image_asset_id**: UUID (FK -> media_asset.id, On Delete: Set Null, Nullable)
- **created_at**: Timestamp (Default: now(), Not Null)

---

## 4. Studio: Production (Assets)

### `studio_video`

- **id**: UUID (PK, Default: gen_random_uuid())
- **storyboard_id**: UUID (FK -> studio_storyboard.id, On Delete: Cascade, Not Null)
- **project_id**: UUID (FK -> project.id, On Delete: Cascade, Not Null)
- **video_asset_id**: UUID (FK -> media_asset.id, On Delete: Set Null, Nullable)
- **duration**: Float
- **status**: Enum (`generating`, `completed`, `failed`) (Default: 'generating')
- **created_at**: Timestamp (Default: now())

### `studio_b_roll`

- **id**: UUID (PK, Default: gen_random_uuid())
- **project_id**: UUID (FK -> project.id, On Delete: Cascade, Not Null)
- **storyboard_id**: UUID (FK -> studio_storyboard.id, On Delete: Set Null, Nullable)
- **asset_id**: UUID (FK -> media_asset.id, On Delete: Set Null, Nullable)
- **source_provider**: Enum (`pexels`, `pixabay`, `unsplash`, `custom`) (Not Null)
- **source_url**: String
- **start_time**: Float (Default: 0)
- **end_time**: Float

---

## 5. Studio: Production (Rough Cut)

### `studio_rough_cut_timeline`

- **id**: UUID (PK, Default: gen_random_uuid())
- **project_id**: UUID (FK -> project.id, On Delete: Cascade, Unique, Not Null)
- **zoom_scale**: Float (Default: 30)
- **current_time**: Float (Default: 0)
- **updated_at**: Timestamp (Default: now())

### `studio_rough_cut_timeline_segment`

- **id**: UUID (PK, Default: gen_random_uuid())
- **timeline_id**: UUID (FK -> studio_rough_cut_timeline.id, On Delete: Cascade, Not Null)
- **track_id**: String (Not Null, Default: 'V1')
- **type**: Enum (`video`, `audio`) (Not Null)
- **resource_type**: Enum (`scene`, `b_roll`, `upload`, `audio`) (Not Null)
- **resource_id**: UUID (Polymorphic FK, Not Null)
- **start_time**: Float (Not Null)
- **duration**: Float (Not Null)
- **trim_start**: Float (Default: 0)
- **trim_end**: Float
- **playback_speed**: Float (Default: 1.0)
- **volume**: Float (Default: 1.0)
- **z_index**: Integer (Default: 0)

### `studio_rough_cut_version`

- **id**: UUID (PK, Default: gen_random_uuid())
- **project_id**: UUID (FK -> project.id, On Delete: Cascade, Not Null)
- **name**: String (Not Null)
- **description**: Text
- **version_number**: Integer (Not Null)
- **video_asset_id**: UUID (FK -> media_asset.id, On Delete: Set Null, Nullable)
- **duration**: Float
- **created_at**: Timestamp (Default: now())

---

## 6. Studio: Post-Production (Edit)

### `studio_subtitle`

- **id**: UUID (PK, Default: gen_random_uuid())
- **project_id**: UUID (FK -> project.id, On Delete: Cascade, Not Null)
- **start_time**: Float (Not Null)
- **end_time**: Float (Not Null)
- **text**: Text (Not Null)
- **style_json**: JSONB
- **created_at**: Timestamp (Default: now())

### `studio_coloring_preset`

- **id**: String (PK, Not Null)
- **name**: String (Not Null)
- **filter_parameters**: JSONB (Not Null)

### `studio_coloring_setting`

- **id**: UUID (PK, Default: gen_random_uuid())
- **project_id**: UUID (FK -> project.id, On Delete: Cascade, Unique, Not Null)
- **preset_id**: String (FK -> studio_coloring_preset.id, On Delete: Set Null, Nullable)
- **custom_parameters**: JSONB

### `studio_thumbnail`

- **id**: UUID (PK, Default: gen_random_uuid())
- **project_id**: UUID (FK -> project.id, On Delete: Cascade, Unique, Not Null)
- **selected_candidate_id**: UUID (FK -> studio_thumbnail_candidate.id, On Delete: Set Null, Nullable)

### `studio_thumbnail_candidate`

- **id**: UUID (PK, Default: gen_random_uuid())
- **project_thumbnail_id**: UUID (FK -> studio_thumbnail.id, On Delete: Cascade, Not Null)
- **image_asset_id**: UUID (FK -> media_asset.id, On Delete: Cascade, Not Null)
- **is_favorite**: Boolean (Default: false)
- **created_at**: Timestamp (Default: now())

### `studio_thumbnail_overlay`

- **id**: UUID (PK, Default: gen_random_uuid())
- **project_thumbnail_id**: UUID (FK -> studio_thumbnail.id, On Delete: Cascade, Not Null)
- **type**: Enum (`text`, `image`) (Not Null)
- **properties**: JSONB (Not Null)

---

## 7. AI Resource Optimization

### `ai_generation_cache`

동일 프롬프트 재사용을 위한 AI 생성 결과 캐시.

- **id**: UUID (PK, Default: gen_random_uuid())
- **user_id**: UUID (FK -> users.id, On Delete: Cascade, Not Null)
- **generation_type**: Enum (`image`, `video`, `script`, `seo`) (Not Null)
- **prompt_hash**: String (SHA256, Indexed, Not Null)
- **input_parameters_hash**: String (SHA256)
- **media_asset_id**: UUID (FK -> media_asset.id, On Delete: Cascade, Nullable)
- **text_output**: Text (Nullable)
- **model_version**: String (Not Null)
- **created_at**: Timestamp (Default: now(), Not Null)
- **expires_at**: Timestamp (Nullable)

---

## 8. Delivery

### `studio_export_history`

- **id**: UUID (PK, Default: gen_random_uuid())
- **project_id**: UUID (FK -> project.id, On Delete: Cascade, Not Null)
- **format**: Enum (`mp4`, `mov`) (Not Null, Default: 'mp4')
- **resolution**: Enum (`1080p`, `4k`) (Not Null, Default: '1080p')
- **status**: Enum (`pending`, `completed`, `failed`) (Default: 'pending')
- **video_asset_id**: UUID (FK -> media_asset.id, On Delete: Set Null, Nullable)
- **upload_status**: Enum (`not_uploaded`, `uploaded`) (Default: 'not_uploaded')
- **completed_at**: Timestamp

---

## 9. Settings

### `profiles`

사용자 확장 프로필 정보 (Supabase auth.users 외 추가 데이터).

- **id**: UUID (PK, FK -> users.id, On Delete: Cascade)
- **username**: String (Unique, Not Null)
- **display_name**: String
- **avatar_url**: String
- **bio**: Text
- **website_url**: String
- **twitter_handle**: String
- **created_at**: Timestamp (Default: now(), Not Null)
- **updated_at**: Timestamp (Default: now(), Not Null)

### `settings_subscription`

사용자 구독 정보.

- **id**: UUID (PK, Default: gen_random_uuid())
- **user_id**: UUID (FK -> users.id, On Delete: Cascade, Unique, Not Null)
- **plan**: Enum (`free`, `pro`, `enterprise`) (Default: 'free', Not Null)
- **status**: Enum (`active`, `canceled`, `past_due`) (Default: 'active', Not Null)
- **price**: Decimal
- **billing_cycle**: Enum (`monthly`, `yearly`)
- **current_period_start**: Timestamp
- **current_period_end**: Timestamp
- **stripe_customer_id**: String
- **stripe_subscription_id**: String
- **created_at**: Timestamp (Default: now(), Not Null)
- **updated_at**: Timestamp (Default: now(), Not Null)

### `billing_history`

결제 내역.

- **id**: UUID (PK, Default: gen_random_uuid())
- **user_id**: UUID (FK -> users.id, On Delete: Cascade, Not Null)
- **invoice_id**: String (Unique, Not Null)
- **amount**: Decimal (Not Null)
- **currency**: String (Default: 'USD')
- **status**: Enum (`paid`, `pending`, `failed`) (Default: 'pending')
- **paid_at**: Timestamp
- **created_at**: Timestamp (Default: now(), Not Null)

### `notification_settings`

사용자 알림 설정.

- **id**: UUID (PK, FK -> users.id, On Delete: Cascade)
- **email_marketing**: Boolean (Default: false)
- **email_project_updates**: Boolean (Default: true)
- **email_security**: Boolean (Default: true)
- **push_everything**: Boolean (Default: false)
- **push_comments**: Boolean (Default: true)
- **updated_at**: Timestamp (Default: now(), Not Null)

### `settings_integration`

외부 서비스 연동 정보.

- **id**: UUID (PK, Default: gen_random_uuid())
- **user_id**: UUID (FK -> users.id, On Delete: Cascade, Not Null)
- **provider**: Enum (`youtube`, `gemini`, `pexels`, `openai`, `elevenlabs`) (Not Null)
- **status**: Enum (`active`, `inactive`, `error`) (Default: 'inactive')
- **access_token**: String (Encrypted)
- **refresh_token**: String (Encrypted)
- **account_name**: String
- **expires_at**: Timestamp
- **created_at**: Timestamp (Default: now(), Not Null)
- **updated_at**: Timestamp (Default: now(), Not Null)

### `settings_mcp_server`

MCP (Model Context Protocol) 서버 연결.

- **id**: UUID (PK, Default: gen_random_uuid())
- **user_id**: UUID (FK -> users.id, On Delete: Cascade, Not Null)
- **name**: String (Not Null)
- **endpoint_url**: String (Not Null)
- **access_token**: String (Encrypted)
- **status**: Enum (`connected`, `disconnected`, `error`) (Default: 'disconnected')
- **last_connected_at**: Timestamp
- **created_at**: Timestamp (Default: now(), Not Null)

---

## 10. Entity Relationships Diagram

| Primary Entity                        | Relationship | Related Entity                        | Type         | Key Constraint                                    | Notes                        |
| :------------------------------------ | :----------: | :------------------------------------ | :----------- | :------------------------------------------------ | :--------------------------- |
| **users**                             |    1 : 1     | **profiles**                          | One-to-One   | `profiles.id`                                     | Extended user data           |
| **users**                             |    1 : 1     | **settings_subscription**             | One-to-One   | `settings_subscription.user_id`                   | Billing plan                 |
| **users**                             |    1 : N     | **billing_history**                   | One-to-Many  | `billing_history.user_id`                         | Payment records              |
| **users**                             |    1 : 1     | **settings_notification**             | One-to-One   | `settings_notification.id`                        | Alert preferences            |
| **users**                             |    1 : N     | **settings_integration**              | One-to-Many  | `settings_integration.user_id`                    | External service connections |
| **users**                             |    1 : N     | **settings_mcp_server**               | One-to-Many  | `settings_mcp_server.user_id`                     | MCP server connections       |
| **users**                             |    1 : N     | **project**                           | One-to-Many  | `project.owner_id`                                | User owns projects           |
| **users**                             |    1 : N     | **channel**                           | One-to-Many  | `channel.user_id`                                 | User manages channels        |
| **channel**                           |    1 : N     | **project**                           | One-to-Many  | `project.channel_id`                              | Project belongs to channel   |
| **channel**                           |    1 : N     | **channel_video**                     | One-to-Many  | `channel_video.channel_id`                        | YouTube videos import        |
| **project**                           |    N : M     | **label**                             | Many-to-Many | `project_label`                                   | Project tagging              |
| **project**                           |    1 : 1     | **project_pipeline**                  | One-to-One   | `project_pipeline.project_id`                     | Dashboard / Status tracking  |
| **project**                           |    1 : 1     | **project_seo**                       | One-to-One   | `project_seo.project_id`                          | SEO Metadata                 |
| **project**                           |    1 : 1     | **studio_script**                     | One-to-One   | `studio_script.project_id`                        | Scripting phase              |
| **studio_script**                     |    1 : N     | **studio_script_segment**             | One-to-Many  | `studio_script_segment.script_id`                 | Script blocks                |
| **project**                           |    1 : N     | **studio_storyboard**                 | One-to-Many  | `studio_storyboard.project_id`                    | Visual scenes                |
| **studio_script_segment**             |    1 : 1     | **studio_storyboard**                 | One-to-One   | `studio_storyboard.script_segment_id`             | Text to Visual mapping       |
| **studio_storyboard**                 |    1 : 1     | **studio_video**                      | One-to-One   | `studio_video.storyboard_id`                      | AI Video Generation          |
| **project**                           |    1 : N     | **studio_b_roll**                     | One-to-Many  | `studio_b_roll.project_id`                        | Asset collection             |
| **project**                           |    1 : 1     | **studio_rough_cut_timeline**         | One-to-One   | `studio_rough_cut_timeline.project_id`            | Video Editing Timeline       |
| **studio_rough_cut_timeline**         |    1 : N     | **studio_rough_cut_timeline_segment** | One-to-Many  | `studio_rough_cut_timeline_segment.timeline_id`   | Clips on timeline            |
| **studio_rough_cut_timeline_segment** |    N : 1     | **media_asset**                       | Many-to-One  | `resource_id` (Polymorphic)                       | Link to source media         |
| **project**                           |    1 : N     | **studio_rough_cut_version**          | One-to-Many  | `studio_rough_cut_version.project_id`             | Render history               |
| **project**                           |    1 : N     | **studio_subtitle**                   | One-to-Many  | `studio_subtitle.project_id`                      | Captioning                   |
| **project**                           |    1 : 1     | **studio_coloring_setting**           | One-to-One   | `studio_coloring_setting.project_id`              | Color grading                |
| **project**                           |    1 : 1     | **studio_thumbnail**                  | One-to-One   | `studio_thumbnail.project_id`                     | Thumbnail workspace          |
| **studio_thumbnail**                  |    1 : N     | **studio_thumbnail_candidate**        | One-to-Many  | `studio_thumbnail_candidate.project_thumbnail_id` | AI Generated options         |
| **studio_thumbnail**                  |    1 : N     | **studio_thumbnail_overlay**          | One-to-Many  | `studio_thumbnail_overlay.project_thumbnail_id`   | Text/Image layers            |
| **project**                           |    1 : N     | **studio_export_history**             | One-to-Many  | `studio_export_history.project_id`                | Final output logs            |
| **studio_storyboard**                 |    N : 1     | **media_asset**                       | Many-to-One  | `image_asset_id`                                  | Visual Prompt Image          |
| **studio_video**                      |    N : 1     | **media_asset**                       | Many-to-One  | `video_asset_id`                                  | Generated Video              |
| **studio_b_roll**                     |    N : 1     | **media_asset**                       | Many-to-One  | `asset_id`                                        | Uploaded Source              |
| **studio_thumbnail_candidate**        |    N : 1     | **media_asset**                       | Many-to-One  | `image_asset_id`                                  | Generated Thumbnail          |
| **studio_export_history**             |    N : 1     | **media_asset**                       | Many-to-One  | `video_asset_id`                                  | Final Rendered File          |
| **users**                             |    1 : N     | **ai_generation_cache**               | One-to-Many  | `ai_generation_cache.user_id`                     | AI Cost Optimization         |
| **ai_generation_cache**               |    N : 1     | **media_asset**                       | Many-to-One  | `media_asset_id`                                  | Cached Generated Asset       |

---
