# TubeGAI 데이터베이스 스키마 재구축 전략서

> **관련 문서**: [Studio + TrendTube 통합 고도화 계획서](studio-enhancement-plan.md) | [Project-Studio AI 중복 최소화 전략](project-studio-ai-optimization-plan.md)

---

## 개요

### 목적

고도화 구현 이전에 개발 과정에서 누적된 모든 데이터를 삭제하고, 고도화 기능에 최적화된 스키마로 **Clean Rebuild**한다. 현재 28개 마이그레이션의 누적 변경 대신, 단일 마이그레이션으로 정제된 목표 스키마를 생성한다.

### 범위

- 모든 테이블(28개), 필드, Enum(25개) 현황 분석
- 테이블별 처리 결정 (유지/수정/제거/신규)
- 목표 스키마 상세 명세
- Clean Rebuild 실행 절차
- 코드 영향 범위 분석

### 전제 조건

1. **개발 데이터 전체 삭제**: 모든 테이블의 데이터를 삭제하고 스키마를 재구축
2. **마이그레이션 히스토리 초기화**: `__drizzle_migrations` 테이블 초기화 후 단일 Clean 마이그레이션 생성
3. **Supabase Storage 초기화**: `media` 버킷 내 기존 파일 삭제 (이미 삭제 완료)
4. **RLS 정책 재설정**: `enable-rls.ts` 업데이트 후 재적용

---

## 1. 현황 분석

### 1.1 현재 테이블 전체 목록 (28개)

| 도메인              | 테이블 수 | 테이블 목록                                                                                                                                                                                                                                      |
| ------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Auth**            | 2         | `auth.users` (Supabase 관리), `profiles`                                                                                                                                                                                                         |
| **Project**         | 7         | `project`, `media_asset`, `channel`, `label`, `project_label`, `idea`, `idea_trend`                                                                                                                                                              |
| **Trend**           | 1         | `trend`                                                                                                                                                                                                                                          |
| **Studio MVP**      | 8         | `studio_script`, `studio_script_segment`, `studio_storyboard`, `studio_video`, `studio_video_part`, `studio_export_history`, `studio_subtitle`, `studio_seo`                                                                                     |
| **Studio Phase 2+** | 9         | `studio_b_roll`, `studio_coloring_preset`, `studio_coloring_setting`, `studio_thumbnail`, `studio_thumbnail_candidate`, `studio_thumbnail_overlay`, `studio_rough_cut_timeline`, `studio_rough_cut_timeline_segment`, `studio_rough_cut_version` |
| **TrendTube**       | 3         | `trendtube_session`, `trendtube_result`, `trendtube_media`                                                                                                                                                                                       |
| **Audit**           | 1         | `audit_log`                                                                                                                                                                                                                                      |

### 1.2 현재 Enum 목록 (25개)

| 분류          | Enum 이름                   | 값                                                                                      | 사용 테이블                                       |
| ------------- | --------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Media**     | `media_type`                | image, video, audio                                                                     | `media_asset.type`                                |
|               | `media_provider`            | s3, r2, local                                                                           | `media_asset.provider`                            |
| **Project**   | `project_type`              | short, long                                                                             | `project.type`                                    |
|               | `project_tone`              | informative, funny, cinematic, vlog                                                     | `project.tone` **(제거 대상)**                    |
|               | `project_visibility`        | public, private                                                                         | `project.visibility`                              |
|               | `project_status`            | draft, in_progress, completed, archived                                                 | `project.status`                                  |
|               | `content_tone`              | informative, funny, dramatic, casual, professional                                      | `project.content_tone`                            |
|               | `video_length`              | short, medium, long                                                                     | `project.video_length`                            |
|               | `idea_difficulty`           | easy, medium, hard                                                                      | `idea.difficulty`, `project.difficulty`           |
|               | `idea_source`               | ai_generated, user_created                                                              | `idea.source`                                     |
| **Channel**   | `channel_status`            | active, error, syncing                                                                  | `channel.status`                                  |
| **Trend**     | `trend_source`              | youtube_api, ai_generated, manual                                                       | `trend.source`                                    |
| **Studio**    | `script_segment_type`       | hook, intro, body, cta, outro                                                           | `studio_script_segment.type`                      |
|               | `scene_video_status`        | pending, generating, completed, failed                                                  | `studio_video.status`, `studio_video_part.status` |
| **Export**    | `export_format`             | mp4, mov, webm                                                                          | `studio_export_history.format`                    |
|               | `export_resolution`         | 720p, 1080p, 4k                                                                         | `studio_export_history.resolution`                |
|               | `export_status`             | pending, completed, failed                                                              | `studio_export_history.status`                    |
|               | `upload_status`             | not_uploaded, uploaded                                                                  | `studio_export_history.upload_status`             |
| **B-Roll**    | `b_roll_provider`           | pexels, pixabay, unsplash, custom                                                       | `studio_b_roll.source_provider`                   |
| **AI Cache**  | `ai_generation_type`        | image, video, script, seo                                                               | (미사용 — 미래 예약)                              |
| **TrendTube** | `trendtube_pipeline_status` | pending, extracting, generating_ideas, generating_media, compositing, completed, failed | `trendtube_session.status`                        |
|               | `trendtube_media_type`      | video_image, background_music, voiceover, generated_video, composited_video             | `trendtube_media.media_type`                      |
| **Thumbnail** | `thumbnail_overlay_type`    | text, image                                                                             | `studio_thumbnail_overlay.type`                   |
| **Timeline**  | `timeline_track_type`       | video, audio                                                                            | `studio_rough_cut_timeline_segment.type`          |
|               | `timeline_resource_type`    | scene, b_roll, upload, audio                                                            | `studio_rough_cut_timeline_segment.resource_type` |

### 1.3 도메인별 테이블 상세 분석

#### 1.3.1 Auth 도메인

##### `auth.users` (Supabase 관리 — Drizzle 미생성)

| 컬럼         | 타입      | 제약 조건 | 용도                    | 데이터 소스   |
| ------------ | --------- | --------- | ----------------------- | ------------- |
| `id`         | UUID      | PK        | Supabase 인증 사용자 ID | Supabase Auth |
| `email`      | TEXT      |           | 이메일                  | 사용자 입력   |
| `created_at` | TIMESTAMP |           | 가입 시각               | 시스템        |

##### `profiles`

| 컬럼             | 타입      | 제약 조건                             | 용도                 | 데이터 소스         |
| ---------------- | --------- | ------------------------------------- | -------------------- | ------------------- |
| `id`             | UUID      | PK, FK → auth.users ON DELETE CASCADE | auth.users와 동일 ID | 시스템              |
| `username`       | TEXT      | UNIQUE, NOT NULL                      | 사용자명             | 사용자 입력         |
| `display_name`   | TEXT      |                                       | 표시 이름            | 사용자 입력         |
| `avatar_url`     | TEXT      |                                       | 프로필 이미지 URL    | 사용자 업로드/OAuth |
| `bio`            | TEXT      |                                       | 자기소개             | 사용자 입력         |
| `website_url`    | TEXT      |                                       | 웹사이트             | 사용자 입력         |
| `twitter_handle` | TEXT      |                                       | Twitter/X 핸들       | 사용자 입력         |
| `created_at`     | TIMESTAMP | NOT NULL, DEFAULT NOW()               | 생성 시각            | 시스템              |
| `updated_at`     | TIMESTAMP | NOT NULL, DEFAULT NOW()               | 수정 시각            | 시스템              |

**관계**: auth.users(1:1), 모든 도메인에서 사용자 프로필 조회 시 참조

#### 1.3.2 Project 도메인

##### `media_asset` — 통합 미디어 자산 저장소

| 컬럼          | 타입           | 제약 조건                                   | 용도                           | 데이터 소스             |
| ------------- | -------------- | ------------------------------------------- | ------------------------------ | ----------------------- |
| `id`          | UUID           | PK                                          | 미디어 자산 ID                 | 시스템                  |
| `user_id`     | UUID           | FK → auth.users ON DELETE CASCADE, NOT NULL | 소유자                         | Auth                    |
| `project_id`  | UUID           | nullable                                    | 연결된 프로젝트 (없을 수 있음) | 시스템                  |
| `type`        | media_type     | NOT NULL                                    | image/video/audio              | 시스템                  |
| `provider`    | media_provider | NOT NULL, DEFAULT 's3'                      | 저장소 제공자                  | 시스템                  |
| `storage_key` | TEXT           | UNIQUE, NOT NULL                            | Storage 경로 키                | 시스템 (업로드 시 생성) |
| `public_url`  | TEXT           | NOT NULL                                    | 공개 URL                       | 시스템 (Storage URL)    |
| `file_size`   | BIGINT         | NOT NULL                                    | 파일 크기 (bytes)              | 시스템                  |
| `mime_type`   | TEXT           | NOT NULL                                    | MIME 타입                      | 시스템                  |
| `width`       | INTEGER        | nullable                                    | 이미지/비디오 너비             | 시스템                  |
| `height`      | INTEGER        | nullable                                    | 이미지/비디오 높이             | 시스템                  |
| `duration`    | INTEGER        | nullable                                    | 비디오/오디오 길이 (초)        | 시스템                  |
| `created_at`  | TIMESTAMP      | NOT NULL, DEFAULT NOW()                     | 생성 시각                      | 시스템                  |

**생성**: Studio 이미지 생성(`generate-scene-image.ts`), TrendTube 미디어 업로드(현재 미사용)
**참조**: `studio_storyboard.image_asset_id`, `studio_video.video_asset_id`, `studio_video_part.video_asset_id`, `trendtube_media.media_asset_id` 등

##### `project` — 프로젝트 레코드

| 컬럼                  | 타입               | 제약 조건                                   | 용도                                         | 데이터 소스           |
| --------------------- | ------------------ | ------------------------------------------- | -------------------------------------------- | --------------------- |
| `id`                  | UUID               | PK                                          | 프로젝트 ID                                  | 시스템                |
| `user_id`             | UUID               | FK → auth.users ON DELETE CASCADE, NOT NULL | 소유자                                       | Auth                  |
| `channel_id`          | UUID               | FK → channel ON DELETE SET NULL             | 연결된 YouTube 채널                          | 사용자 선택           |
| `title`               | TEXT               | NOT NULL, DEFAULT 'Untitled Project'        | 프로젝트 제목                                | AI 생성 + 사용자 편집 |
| `description`         | TEXT               |                                             | 프로젝트 설명                                | AI 생성 + 사용자 편집 |
| `type`                | project_type       | NOT NULL, DEFAULT 'short'                   | 영상 형식 (short/long)                       | 사용자 선택           |
| `tone`                | project_tone       | nullable                                    | **레거시**: contentTone으로 대체됨           | AI 생성               |
| `visibility`          | project_visibility | NOT NULL, DEFAULT 'private'                 | 공개/비공개                                  | 사용자 선택           |
| `topic`               | TEXT               |                                             | 주제                                         | AI 생성 + 사용자 편집 |
| `status`              | project_status     | NOT NULL, DEFAULT 'draft'                   | 작업 상태                                    | 시스템                |
| `progress`            | INTEGER            | NOT NULL, DEFAULT 0                         | 진행률 (0-100)                               | 시스템                |
| `current_step`        | TEXT               | nullable                                    | 현재 작업 단계 라벨                          | 시스템                |
| `thumbnail_url`       | TEXT               |                                             | 썸네일 URL                                   | 시스템                |
| `hooks`               | TEXT[]             | nullable                                    | 오프닝 훅 배열                               | AI 생성 + 사용자 편집 |
| `target_audience`     | TEXT               |                                             | 타겟 시청자                                  | AI 생성 + 사용자 편집 |
| `estimated_views`     | TEXT               |                                             | 예상 조회수                                  | AI 생성               |
| `difficulty`          | idea_difficulty    | nullable                                    | 제작 난이도                                  | AI 생성 + 사용자 편집 |
| `content_tone`        | content_tone       | nullable                                    | 콘텐츠 톤                                    | AI 생성 + 사용자 편집 |
| `video_length`        | video_length       | nullable                                    | 영상 길이 유형                               | 사용자 선택           |
| `based_on_trend`      | TEXT               |                                             | 기반 트렌드 제목                             | 시스템 복사           |
| `based_on_trend_id`   | INTEGER            |                                             | **레거시**: basedOnTrendUuid로 대체됨        | 시스템                |
| `based_on_trend_uuid` | UUID               |                                             | 기반 트렌드 UUID                             | 시스템                |
| `source_idea_id`      | UUID               | FK → idea ON DELETE SET NULL                | 원본 아이디어 ID                             | 시스템                |
| `ai_context`          | JSONB              |                                             | AI 컨텍스트 데이터 (keywords, styleNotes 등) | AI 생성 + 시스템      |
| `trend_snapshot`      | JSONB              |                                             | 프로젝트 생성 시 트렌드 스냅샷               | 시스템                |
| `script_guidelines`   | JSONB              |                                             | AI 대본 구조 가이드                          | AI 생성               |
| `reference_url`       | TEXT               |                                             | YouTube 참고 영상 URL                        | 시스템                |
| `created_at`          | TIMESTAMP          | NOT NULL, DEFAULT NOW()                     | 생성 시각                                    | 시스템                |
| `updated_at`          | TIMESTAMP          | NOT NULL, DEFAULT NOW()                     | 수정 시각                                    | 시스템                |

**JSONB 구조 — `ai_context`**:

```typescript
{ keywords?: string[]; competitors?: string[]; references?: string[];
  styleNotes?: string; targetLength?: string; callToAction?: string;
  additionalNotes?: string; scriptGuidelinesText?: string; }
```

**JSONB 구조 — `trend_snapshot`** (TrendSnapshot 타입):

```typescript
{ capturedAt: string; title: string; description?: string; category: string;
  tags: string[]; viewsCount: string; growthRate: string; externalId?: string;
  externalUrl?: string; thumbnailUrl?: string;
  metrics?: { viewCount: number; likeCount: number; commentCount: number; }; }
```

**JSONB 구조 — `script_guidelines`** (ScriptGuidelines 타입):

```typescript
{ openingStrategy: string; mainPoints: string[]; ctaStrategy: string;
  closingStrategy: string; targetLength?: string; keyMessages?: string[];
  avoidTopics?: string[]; }
```

**생성**: `createProject()` (project.data.server.ts), `ai-project-generator.server.ts`에서 AI 생성
**업데이트**: `updateProject()` — 사용자 편집, 시스템 진행 상태 업데이트

##### `channel` — YouTube 채널 정보

| 컬럼                 | 타입           | 제약 조건                                   | 용도               | 데이터 소스 |
| -------------------- | -------------- | ------------------------------------------- | ------------------ | ----------- |
| `id`                 | UUID           | PK                                          | 채널 ID            | 시스템      |
| `user_id`            | UUID           | FK → auth.users ON DELETE CASCADE, NOT NULL | 소유자             | Auth        |
| `youtube_channel_id` | TEXT           | UNIQUE, NOT NULL                            | YouTube 채널 ID    | YouTube API |
| `name`               | TEXT           | NOT NULL                                    | 채널명             | YouTube API |
| `handle`             | TEXT           |                                             | @핸들              | YouTube API |
| `description`        | TEXT           |                                             | 채널 설명          | YouTube API |
| `avatar_url`         | TEXT           |                                             | 프로필 이미지      | YouTube API |
| `banner_url`         | TEXT           |                                             | 배너 이미지        | YouTube API |
| `subscriber_count`   | INTEGER        |                                             | 구독자 수          | YouTube API |
| `video_count`        | INTEGER        |                                             | 동영상 수          | YouTube API |
| `view_count`         | BIGINT         |                                             | 총 조회수          | YouTube API |
| `access_token`       | TEXT           |                                             | OAuth 액세스 토큰  | OAuth 흐름  |
| `refresh_token`      | TEXT           |                                             | OAuth 갱신 토큰    | OAuth 흐름  |
| `token_expires_at`   | TIMESTAMP      |                                             | 토큰 만료 시각     | OAuth 흐름  |
| `status`             | channel_status | NOT NULL, DEFAULT 'active'                  | 채널 상태          | 시스템      |
| `last_synced_at`     | TIMESTAMP      |                                             | 마지막 동기화 시각 | 시스템      |
| `created_at`         | TIMESTAMP      | NOT NULL, DEFAULT NOW()                     | 생성 시각          | 시스템      |
| `updated_at`         | TIMESTAMP      | NOT NULL, DEFAULT NOW()                     | 수정 시각          | 시스템      |

**생성**: `upsertChannel()` — YouTube OAuth 연동 시
**업데이트**: `syncChannelStats()`, `updateChannelTokens()`

##### `label` — 프로젝트 라벨

| 컬럼          | 타입      | 제약 조건                         | 용도                 | 데이터 소스 |
| ------------- | --------- | --------------------------------- | -------------------- | ----------- |
| `id`          | UUID      | PK                                | 라벨 ID              | 시스템      |
| `name`        | TEXT      | NOT NULL                          | 라벨 이름            | 사용자 입력 |
| `color`       | TEXT      | NOT NULL, DEFAULT 'bg-slate-500'  | Tailwind 색상 클래스 | 사용자 선택 |
| `description` | TEXT      |                                   | 라벨 설명            | 사용자 입력 |
| `user_id`     | UUID      | FK → auth.users ON DELETE CASCADE | 소유자               | Auth        |
| `created_at`  | TIMESTAMP | NOT NULL, DEFAULT NOW()           | 생성 시각            | 시스템      |

##### `project_label` — 프로젝트-라벨 연결 (N:M)

| 컬럼         | 타입 | 제약 조건                                | 용도     |
| ------------ | ---- | ---------------------------------------- | -------- |
| `project_id` | UUID | FK → project ON DELETE CASCADE, NOT NULL | 프로젝트 |
| `label_id`   | UUID | FK → label ON DELETE CASCADE, NOT NULL   | 라벨     |

**PK**: Composite (`project_id`, `label_id`)

##### `idea` — 아이디어 (AI 추천 + 사용자 생성 통합)

| 컬럼                  | 타입            | 제약 조건                                   | 용도                        | 데이터 소스 |
| --------------------- | --------------- | ------------------------------------------- | --------------------------- | ----------- |
| `id`                  | UUID            | PK                                          | 아이디어 ID                 | 시스템      |
| `user_id`             | UUID            | FK → auth.users ON DELETE CASCADE, NOT NULL | 소유자                      | Auth        |
| `title`               | TEXT            | NOT NULL                                    | 아이디어 제목               | AI/사용자   |
| `description`         | TEXT            |                                             | 설명                        | AI/사용자   |
| `hooks`               | TEXT[]          | DEFAULT []                                  | 오프닝 훅                   | AI          |
| `target_audience`     | TEXT            |                                             | 타겟 시청자                 | AI          |
| `estimated_views`     | TEXT            |                                             | 예상 조회수                 | AI          |
| `difficulty`          | idea_difficulty | DEFAULT 'medium'                            | 난이도                      | AI          |
| `source`              | idea_source     | NOT NULL                                    | ai_generated/user_created   | 시스템      |
| `reason`              | TEXT            |                                             | AI 추천 근거                | AI          |
| `growth_rate`         | TEXT            |                                             | 성장률                      | AI          |
| `score`               | INTEGER         |                                             | AI 점수                     | AI          |
| `content_tones`       | TEXT[]          | DEFAULT []                                  | 콘텐츠 톤 (복수)            | AI          |
| `video_types`         | TEXT[]          | DEFAULT []                                  | 영상 유형 (복수)            | AI          |
| `category`            | TEXT            |                                             | 카테고리                    | AI          |
| `is_saved`            | BOOLEAN         | NOT NULL, DEFAULT false                     | 북마크 여부                 | 사용자      |
| `is_used`             | BOOLEAN         | NOT NULL, DEFAULT false                     | 프로젝트 생성 여부          | 시스템      |
| `used_for_project_id` | UUID            | FK → project ON DELETE SET NULL             | 사용된 프로젝트             | 시스템      |
| `reference_url`       | TEXT            |                                             | YouTube 참고 URL            | 시스템      |
| `expires_at`          | TIMESTAMP       |                                             | AI 아이디어 만료 시각 (24h) | 시스템      |
| `created_at`          | TIMESTAMP       | NOT NULL, DEFAULT NOW()                     | 생성 시각                   | 시스템      |
| `updated_at`          | TIMESTAMP       | NOT NULL, DEFAULT NOW()                     | 수정 시각                   | 시스템      |

**생성**: `createIdea()`, `generateIdeasFromTrend()` — AI 아이디어 생성
**업데이트**: `saveIdea()` (북마크), `markIdeaAsUsed()` (프로젝트 생성 시)

##### `idea_trend` — 아이디어-트렌드 연결 (N:M)

| 컬럼         | 타입      | 제약 조건                                                   | 용도             |
| ------------ | --------- | ----------------------------------------------------------- | ---------------- |
| `idea_id`    | UUID      | FK → idea ON DELETE CASCADE, NOT NULL                       | 아이디어         |
| `trend_id`   | UUID      | FK → trend ON DELETE CASCADE (migration에서 정의), NOT NULL | 트렌드           |
| `is_primary` | BOOLEAN   | NOT NULL, DEFAULT false                                     | 주요 트렌드 여부 |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW()                                     | 생성 시각        |

**PK**: Composite (`idea_id`, `trend_id`)

#### 1.3.3 Trend 도메인

##### `trend` — YouTube/AI 트렌드 토픽

| 컬럼                  | 타입         | 제약 조건                                   | 용도                           | 데이터 소스 |
| --------------------- | ------------ | ------------------------------------------- | ------------------------------ | ----------- |
| `id`                  | UUID         | PK                                          | 트렌드 ID                      | 시스템      |
| `user_id`             | UUID         | FK → auth.users ON DELETE CASCADE, nullable | 소유자 (NULL = 공용)           | 시스템      |
| `title`               | TEXT         | NOT NULL                                    | 트렌드 제목                    | YouTube API |
| `description`         | TEXT         |                                             | 설명                           | YouTube API |
| `category`            | TEXT         | NOT NULL                                    | 카테고리명                     | YouTube API |
| `views_count`         | TEXT         |                                             | 포맷된 조회수 ("1.2M")         | YouTube API |
| `growth_rate`         | TEXT         |                                             | 성장률 ("+145%")               | AI 분석     |
| `thumbnail_url`       | TEXT         |                                             | 썸네일 URL                     | YouTube API |
| `tags`                | TEXT[]       | NOT NULL, DEFAULT []                        | 태그 배열                      | YouTube API |
| `source`              | trend_source | NOT NULL, DEFAULT 'ai_generated'            | 소스 구분                      | 시스템      |
| `external_id`         | TEXT         | UNIQUE                                      | YouTube 비디오 ID              | YouTube API |
| `external_url`        | TEXT         |                                             | 원본 URL                       | YouTube API |
| `used_for_project_id` | UUID         |                                             | 사용된 프로젝트 (FK migration) | 시스템      |
| `view_count`          | BIGINT       |                                             | 실제 조회수 (숫자)             | YouTube API |
| `like_count`          | BIGINT       |                                             | 좋아요 수                      | YouTube API |
| `comment_count`       | BIGINT       |                                             | 댓글 수                        | YouTube API |
| `published_at`        | TIMESTAMP    |                                             | 게시 시각                      | YouTube API |
| `fetched_at`          | TIMESTAMP    | DEFAULT NOW()                               | 수집 시각                      | 시스템      |
| `region_code`         | TEXT         | DEFAULT 'KR'                                | 지역 코드                      | YouTube API |
| `language_code`       | TEXT         | DEFAULT 'ko'                                | 언어 코드                      | YouTube API |
| `video_duration`      | TEXT         |                                             | 영상 길이 분류                 | YouTube API |
| `usage_count`         | INTEGER      | DEFAULT 0                                   | 사용 횟수                      | 시스템      |
| `last_used_at`        | TIMESTAMP    |                                             | 마지막 사용 시각               | 시스템      |
| `is_saved`            | BOOLEAN      | DEFAULT false                               | 북마크 여부                    | 사용자      |
| `saved_by_user_id`    | UUID         | FK → auth.users ON DELETE SET NULL          | 북마크한 사용자                | 사용자      |
| `saved_at`            | TIMESTAMP    |                                             | 북마크 시각                    | 시스템      |
| `created_at`          | TIMESTAMP    | NOT NULL, DEFAULT NOW()                     | 생성 시각                      | 시스템      |
| `updated_at`          | TIMESTAMP    | NOT NULL, DEFAULT NOW()                     | 수정 시각                      | 시스템      |

**생성**: YouTube API 트렌드 수집 시 upsert (`external_id` 기준), 15분 TTL 캐싱
**업데이트**: `saveTrend()`, `unsaveTrend()`, 사용 횟수 증가

#### 1.3.4 Studio MVP 도메인

##### `studio_script` — 프로젝트 대본

| 컬럼              | 타입      | 제약 조건                                            | 용도             | 데이터 소스 |
| ----------------- | --------- | ---------------------------------------------------- | ---------------- | ----------- |
| `id`              | UUID      | PK                                                   | 대본 ID          | 시스템      |
| `project_id`      | UUID      | FK → project ON DELETE CASCADE, **UNIQUE**, NOT NULL | 프로젝트 (1:1)   | 시스템      |
| `prompt`          | TEXT      |                                                      | AI 생성 프롬프트 | 사용자 입력 |
| `target_duration` | INTEGER   |                                                      | 목표 길이 (초)   | 사용자 입력 |
| `saved_at`        | TIMESTAMP | DEFAULT NOW()                                        | 저장 시각        | 시스템      |

**문제**: `project_id UNIQUE` 제약으로 프로젝트당 1개 대본만 가능 → 재생성 시 덮어쓰기

##### `studio_script_segment` — 대본 세그먼트

| 컬럼                 | 타입                | 제약 조건                                      | 용도                      | 데이터 소스           |
| -------------------- | ------------------- | ---------------------------------------------- | ------------------------- | --------------------- |
| `id`                 | UUID                | PK                                             | 세그먼트 ID               | 시스템                |
| `script_id`          | UUID                | FK → studio_script ON DELETE CASCADE, NOT NULL | 부모 대본                 | 시스템                |
| `order_index`        | INTEGER             | NOT NULL                                       | 정렬 순서                 | 시스템                |
| `type`               | script_segment_type | NOT NULL                                       | hook/intro/body/cta/outro | AI 생성               |
| `content`            | TEXT                | NOT NULL                                       | 대본 텍스트               | AI 생성 + 사용자 편집 |
| `estimated_duration` | INTEGER             | nullable                                       | 예상 길이 (초)            | AI 생성               |

**문제**: AI가 생성하는 `visualNotes`, `emotionalTone`, `keywords`, `sceneHints` 4개 필드 미저장

##### `studio_storyboard` — 시각적 씬 구성

| 컬럼                | 타입      | 제약 조건                                               | 용도                             | 데이터 소스 |
| ------------------- | --------- | ------------------------------------------------------- | -------------------------------- | ----------- |
| `id`                | UUID      | PK                                                      | 스토리보드 씬 ID                 | 시스템      |
| `project_id`        | UUID      | FK → project ON DELETE CASCADE, NOT NULL                | 프로젝트                         | 시스템      |
| `script_segment_id` | UUID      | FK → studio_script_segment ON DELETE SET NULL, NOT NULL | 대본 세그먼트                    | 시스템      |
| `scene_number`      | INTEGER   | NOT NULL                                                | 전체 씬 번호                     | 시스템      |
| `order_index`       | INTEGER   | NOT NULL, DEFAULT 0                                     | 세그먼트 내 정렬                 | 시스템      |
| `description`       | TEXT      |                                                         | 한국어 씬 설명                   | AI 생성     |
| `visual_prompt`     | TEXT      |                                                         | 영문 이미지/비디오 생성 프롬프트 | AI 생성     |
| `duration`          | INTEGER   |                                                         | 씬 길이 (초)                     | AI 생성     |
| `image_asset_id`    | UUID      | FK → media_asset ON DELETE SET NULL                     | 생성된 씬 이미지                 | 시스템      |
| `created_at`        | TIMESTAMP | NOT NULL, DEFAULT NOW()                                 | 생성 시각                        | 시스템      |

##### `studio_video` — Scene 비디오

| 컬럼             | 타입               | 제약 조건                                          | 용도                 | 데이터 소스 |
| ---------------- | ------------------ | -------------------------------------------------- | -------------------- | ----------- |
| `id`             | UUID               | PK                                                 | 비디오 ID            | 시스템      |
| `storyboard_id`  | UUID               | FK → studio_storyboard ON DELETE CASCADE, NOT NULL | 부모 스토리보드      | 시스템      |
| `project_id`     | UUID               | FK → project ON DELETE CASCADE, NOT NULL           | 프로젝트             | 시스템      |
| `video_asset_id` | UUID               | FK → media_asset ON DELETE SET NULL                | 비디오 파일          | 시스템      |
| `duration`       | DOUBLE PRECISION   |                                                    | 전체 Scene 합산 길이 | 시스템      |
| `status`         | scene_video_status | DEFAULT 'generating'                               | 생성 상태            | 시스템      |
| `created_at`     | TIMESTAMP          | DEFAULT NOW()                                      | 생성 시각            | 시스템      |

**현재**: 완전 모킹 (Veo 3 미연결)

##### `studio_video_part` — 8초 클립 단위

| 컬럼             | 타입               | 제약 조건                                     | 용도        | 데이터 소스 |
| ---------------- | ------------------ | --------------------------------------------- | ----------- | ----------- |
| `id`             | UUID               | PK                                            | 파트 ID     | 시스템      |
| `video_id`       | UUID               | FK → studio_video ON DELETE CASCADE, NOT NULL | 부모 비디오 | 시스템      |
| `part_number`    | INTEGER            | NOT NULL                                      | 클립 순서   | 시스템      |
| `start_time`     | DOUBLE PRECISION   | NOT NULL                                      | 시작 시각   | 시스템      |
| `end_time`       | DOUBLE PRECISION   | NOT NULL                                      | 종료 시각   | 시스템      |
| `duration`       | DOUBLE PRECISION   | NOT NULL                                      | 클립 길이   | 시스템      |
| `status`         | scene_video_status | NOT NULL, DEFAULT 'pending'                   | 생성 상태   | 시스템      |
| `video_asset_id` | UUID               | FK → media_asset ON DELETE SET NULL           | 비디오 파일 | 시스템      |
| `created_at`     | TIMESTAMP          | NOT NULL, DEFAULT NOW()                       | 생성 시각   | 시스템      |

**UNIQUE**: (`video_id`, `part_number`)

##### `studio_subtitle`, `studio_seo`, `studio_export_history`

스키마 정의만 존재, 코드에서 조회 함수만 구현 (데이터 쓰기 미구현). 상세 필드는 현재 스키마 파일 그대로 유지.

#### 1.3.5 Studio Phase 2+ 도메인

##### 제거 대상 (2개)

| 테이블                    | PK 타입          | 이유                                          |
| ------------------------- | ---------------- | --------------------------------------------- |
| `studio_coloring_preset`  | TEXT (string ID) | FFmpeg 기반 컬러 그레이딩 비현실적, Dead Code |
| `studio_coloring_setting` | UUID             | coloring_preset 종속, Dead Code               |

##### 유지 대상 (7개)

| 테이블                              | 상태                       | 구현 예정 |
| ----------------------------------- | -------------------------- | --------- |
| `studio_b_roll`                     | 스키마만 존재, 코드 미구현 | Phase 1.5 |
| `studio_thumbnail`                  | 스키마만 존재              | Phase 2   |
| `studio_thumbnail_candidate`        | 스키마만 존재              | Phase 2   |
| `studio_thumbnail_overlay`          | 스키마만 존재              | Phase 2   |
| `studio_rough_cut_timeline`         | 스키마만 존재              | Phase 2   |
| `studio_rough_cut_timeline_segment` | 스키마만 존재              | Phase 2   |
| `studio_rough_cut_version`          | 스키마만 존재              | Phase 2   |

#### 1.3.6 TrendTube 도메인

##### `trendtube_session` — 파이프라인 세션

| 컬럼                  | 타입                      | 제약 조건                                   | 용도                 | 데이터 소스 |
| --------------------- | ------------------------- | ------------------------------------------- | -------------------- | ----------- |
| `id`                  | UUID                      | PK                                          | 세션 ID              | 시스템      |
| `project_id`          | UUID                      | FK → project ON DELETE CASCADE, NOT NULL    | 프로젝트             | 시스템      |
| `user_id`             | UUID                      | FK → auth.users ON DELETE CASCADE, NOT NULL | 사용자               | Auth        |
| `trends_url`          | TEXT                      | NOT NULL                                    | YouTube 트렌드 URL   | 사용자 입력 |
| `user_idea`           | TEXT                      | NOT NULL                                    | 사용자 영상 아이디어 | 사용자 입력 |
| `reference_image_url` | TEXT                      |                                             | 참조 이미지 URL      | 사용자 입력 |
| `voice_option`        | TEXT                      | DEFAULT 'female_ko'                         | TTS 음성 옵션        | 사용자 선택 |
| `status`              | trendtube_pipeline_status | NOT NULL, DEFAULT 'pending'                 | 파이프라인 상태      | 시스템      |
| `current_step`        | INTEGER                   | NOT NULL, DEFAULT 0                         | 현재 단계            | 시스템      |
| `error_message`       | TEXT                      |                                             | 오류 메시지          | 시스템      |
| `created_at`          | TIMESTAMP                 | NOT NULL, DEFAULT NOW()                     | 생성 시각            | 시스템      |
| `completed_at`        | TIMESTAMP                 |                                             | 완료 시각            | 시스템      |

**생성**: 매 TrendTube 실행마다 새 세션 생성 (이력 보존 패턴)

##### `trendtube_result` — 텍스트 생성 결과

| 컬럼               | 타입      | 제약 조건                                          | 용도                 | 데이터 소스 |
| ------------------ | --------- | -------------------------------------------------- | -------------------- | ----------- |
| `id`               | UUID      | PK                                                 | 결과 ID              | 시스템      |
| `session_id`       | UUID      | FK → trendtube_session ON DELETE CASCADE, NOT NULL | 부모 세션            | 시스템      |
| `extracted_trends` | TEXT      |                                                    | 추출된 트렌드 텍스트 | AI (Gemini) |
| `video_ideas`      | TEXT      |                                                    | 생성된 영상 아이디어 | AI (Gemini) |
| `narration_script` | TEXT      |                                                    | 내레이션 대본        | AI (Gemini) |
| `created_at`       | TIMESTAMP | NOT NULL, DEFAULT NOW()                            | 생성 시각            | 시스템      |

##### `trendtube_media` — 생성된 미디어

| 컬럼             | 타입                 | 제약 조건                                          | 용도                         | 데이터 소스 |
| ---------------- | -------------------- | -------------------------------------------------- | ---------------------------- | ----------- |
| `id`             | UUID                 | PK                                                 | 미디어 ID                    | 시스템      |
| `session_id`     | UUID                 | FK → trendtube_session ON DELETE CASCADE, NOT NULL | 부모 세션                    | 시스템      |
| `media_type`     | trendtube_media_type | NOT NULL                                           | 미디어 유형                  | 시스템      |
| `media_asset_id` | UUID                 | FK → media_asset ON DELETE SET NULL                | 미디어 에셋 (현재 항상 NULL) | 시스템      |
| `public_url`     | TEXT                 |                                                    | **base64 data URL** (문제)   | AI 서비스   |
| `metadata`       | JSONB                |                                                    | 비정형 메타데이터            | 시스템      |
| `created_at`     | TIMESTAMP            | NOT NULL, DEFAULT NOW()                            | 생성 시각                    | 시스템      |

**문제**: `media_asset_id`가 항상 NULL, `public_url`에 base64 data URL 저장 (건당 ~6.5-26MB)

#### 1.3.7 Audit 도메인

##### `audit_log` — 감사 로그

| 컬럼          | 타입      | 제약 조건                          | 용도                 | 데이터 소스 |
| ------------- | --------- | ---------------------------------- | -------------------- | ----------- |
| `id`          | UUID      | PK                                 | 로그 ID              | 시스템      |
| `user_id`     | UUID      | FK → auth.users ON DELETE SET NULL | 행위자               | Auth        |
| `action`      | TEXT      | NOT NULL                           | create/update/delete | 시스템      |
| `entity_type` | TEXT      | NOT NULL                           | 엔티티 종류          | 시스템      |
| `entity_id`   | UUID      | NOT NULL                           | 엔티티 ID            | 시스템      |
| `changes`     | TEXT      |                                    | 변경 내용 JSON       | 시스템      |
| `ip_address`  | TEXT      |                                    | IP 주소              | 요청 메타   |
| `user_agent`  | TEXT      |                                    | User-Agent           | 요청 메타   |
| `created_at`  | TIMESTAMP | NOT NULL, DEFAULT NOW()            | 발생 시각            | 시스템      |

**인덱스**: `idx_audit_user`(user_id), `idx_audit_entity`(entity_type, entity_id), `idx_audit_created`(created_at DESC)

### 1.4 핵심 문제점 요약

| #   | 문제                                                                                              | 심각도 | 영향 범위              |
| --- | ------------------------------------------------------------------------------------------------- | ------ | ---------------------- |
| 1   | Studio 1:1 덮어쓰기 패턴 — Script 재생성 시 이전 결과 완전 소실, Storyboard FK 고아화             | 높음   | Studio 전체            |
| 2   | Script 메타데이터 4개 필드(`visualNotes`, `emotionalTone`, `keywords`, `sceneHints`) DB 미저장    | 높음   | Storyboard/B-Roll 품질 |
| 3   | `project.tone` vs `project.contentTone` Enum 중복                                                 | 중간   | Project 스키마         |
| 4   | TrendTube 미디어 base64 DB 저장 (건당 ~6.5-26MB)                                                  | 높음   | DB 성능/비용           |
| 5   | Project AI Generator가 프로덕션 필드(hooks, scriptGuidelines, keywords)까지 생성 — 역할 경계 모호 | 중간   | Project-Studio 연계    |
| 6   | Coloring 테이블 2개 Dead Code                                                                     | 낮음   | 스키마 정리            |
| 7   | Studio-TrendTube 자산 연결 부재 — narrationScript, 미디어 재활용 불가                             | 높음   | 워크플로우             |
| 8   | 미디어 에셋 테이블 패턴 불일치 — Studio(정형 컬럼) vs TrendTube(JSONB + base64)                   | 중간   | 데이터 일관성          |
| 9   | `enable-rls.ts`에 구형 테이블명 참조 (`saved_idea`, `ai_recommendation`)                          | 중간   | 보안                   |

### 1.5 현재 데이터 관계도

```
project
 ├── studio_script (1:1, UNIQUE) ← 재생성 시 덮어쓰기
 │    └── studio_script_segment (1:N) ← 전체 DELETE 후 재INSERT
 │         └── studio_storyboard (1:N) ← segment 삭제 시 FK SET NULL (고아화)
 │              ├── media_asset (이미지) ← imageAssetId
 │              └── studio_video (1:1) [MOCKED]
 │                   └── studio_video_part (1:N) [MOCKED]
 │
 ├── trendtube_session (1:N) ← 세션별 이력 보존
 │    ├── trendtube_result (1:1)
 │    └── trendtube_media (1:N) [base64 in DB, mediaAssetId 항상 NULL]
 │
 ├── studio_subtitle (1:N) [미구현]
 ├── studio_seo (1:1) [미구현]
 ├── studio_export_history (1:N) [미구현]
 ├── studio_b_roll (1:N) [미구현]
 ├── studio_coloring_preset/setting [제거 대상]
 ├── studio_thumbnail/candidate/overlay [미구현]
 ├── studio_rough_cut_timeline/segment/version [미구현]
 │
 ├── media_asset (1:N) ← 통합 저장소
 ├── project_label (N:M) → label
 └── idea (sourceIdeaId) → idea_trend (N:M) → trend
```

---

## 2. 목표 스키마 설계

### 2.1 테이블 처리 결정 요약

| 처리          | 테이블                                                                                                                           | 비고                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **제거 (2)**  | `studio_coloring_preset`, `studio_coloring_setting`                                                                              | Dead Code — FFmpeg 컬러 그레이딩 비현실적 |
| **신규 (1)**  | `studio_session`                                                                                                                 | TrendTube 패턴과 동일한 세션 기반 관리    |
| **수정 (7)**  | `project`, `studio_script`, `studio_script_segment`, `studio_storyboard`, `studio_video`, `trendtube_media`, `trendtube_session` | 컬럼 추가/제거/변경                       |
| **유지 (18)** | 나머지 전체                                                                                                                      | 변경 없음                                 |

**최종 테이블 수**: 28 - 2(제거) + 1(신규) = **27개**

### 2.2 Enum 변경 사항

| 처리          | Enum           | 이유                                                              |
| ------------- | -------------- | ----------------------------------------------------------------- |
| **제거 (1)**  | `project_tone` | `content_tone`으로 통합됨. `project.tone` 컬럼 제거에 따라 불필요 |
| **유지 (24)** | 나머지 전체    | Phase 2+ Enum 포함, 테이블 스키마에 정의되어 있으므로 유지        |

### 2.3 테이블별 변경 상세

#### `project` — 수정

| 변경 유형       | 컬럼                          | 이유                                                                      |
| --------------- | ----------------------------- | ------------------------------------------------------------------------- |
| **제거**        | `tone` (project_tone)         | `content_tone`으로 대체됨                                                 |
| **제거**        | `based_on_trend_id` (INTEGER) | 레거시. `based_on_trend_uuid` (UUID)로 대체됨                             |
| **@deprecated** | `hooks` (TEXT[])              | Studio Pre-Production으로 이동 예정 (Phase C). 기존 코드 호환을 위해 유지 |
| **@deprecated** | `script_guidelines` (JSONB)   | 동일                                                                      |
| **@deprecated** | `ai_context.keywords`         | 동일 (JSONB 내부 필드이므로 구조적 제거 불가, 코드에서 deprecated 처리)   |

#### `studio_session` — 신규

세션 기반 Studio 관리 도입. TrendTube의 `trendtube_session` 패턴과 동일.

| 컬럼         | 타입        | 제약 조건                                   |
| ------------ | ----------- | ------------------------------------------- |
| `id`         | UUID        | PK                                          |
| `project_id` | UUID        | FK → project ON DELETE CASCADE, NOT NULL    |
| `user_id`    | UUID        | FK → auth.users ON DELETE CASCADE, NOT NULL |
| `version`    | INTEGER     | NOT NULL, DEFAULT 1                         |
| `status`     | TEXT        | NOT NULL, DEFAULT 'active'                  |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                     |

**Partial Unique Index**: `(project_id) WHERE status = 'active'` — 프로젝트당 active 세션 1개

#### `studio_script` — 수정

| 변경 유형 | 컬럼                                                                            | 이유                                          |
| --------- | ------------------------------------------------------------------------------- | --------------------------------------------- |
| **제거**  | `project_id UNIQUE` 제약                                                        | 세션 기반으로 전환, 프로젝트당 다수 대본 가능 |
| **추가**  | `session_id` (UUID, FK → studio_session)                                        | 세션 연결                                     |
| **추가**  | `hooks` (TEXT[])                                                                | Project에서 이동 — Pre-Production 단계        |
| **추가**  | `script_guidelines` (JSONB)                                                     | Project에서 이동                              |
| **추가**  | `seo_keywords` (TEXT[])                                                         | Project.aiContext.keywords에서 이동           |
| **추가**  | `pre_production_status` (TEXT, DEFAULT 'pending')                               | Pre-Production 완료 상태                      |
| **추가**  | `source_trendtube_session_id` (UUID, FK → trendtube_session ON DELETE SET NULL) | TrendTube → Studio 연결                       |

#### `studio_script_segment` — 수정

| 변경 유형 | 컬럼                    | 이유                                                 |
| --------- | ----------------------- | ---------------------------------------------------- |
| **추가**  | `visual_notes` (TEXT)   | AI 생성 시각적 방향 메모 — Storyboard AI 입력        |
| **추가**  | `emotional_tone` (TEXT) | 감정적 톤 — Storyboard/Scene 분위기 제어             |
| **추가**  | `keywords` (TEXT[])     | B-Roll 검색 키워드 — Step 4에서 직접 사용            |
| **추가**  | `scene_hints` (JSONB)   | 씬 분할 힌트 (SceneHint[]) — Storyboard 씬 구성 참조 |

`scene_hints` JSONB 구조:

```typescript
type SceneHint = {
  description: string;
  visualPrompt: string;
  duration: number;
  cameraAngle?: string;
};
```

#### `studio_storyboard` — 수정

| 변경 유형 | 컬럼                                                       | 이유                                |
| --------- | ---------------------------------------------------------- | ----------------------------------- |
| **추가**  | `session_id` (UUID, FK → studio_session ON DELETE CASCADE) | 세션 연결                           |
| **추가**  | `emotional_tone` (TEXT)                                    | Script segment에서 전달된 감정적 톤 |
| **추가**  | `camera_angle` (TEXT)                                      | 카메라 앵글 힌트                    |

#### `studio_video` — 수정

| 변경 유형 | 컬럼                                                       | 이유      |
| --------- | ---------------------------------------------------------- | --------- |
| **추가**  | `session_id` (UUID, FK → studio_session ON DELETE CASCADE) | 세션 연결 |

#### `trendtube_media` — 수정

| 변경 유형 | 컬럼                               | 이유                                                  |
| --------- | ---------------------------------- | ----------------------------------------------------- |
| **추가**  | `prompt` (TEXT)                    | 생성 프롬프트 (metadata JSONB에서 정형 컬럼으로 승격) |
| **추가**  | `clip_number` (INTEGER, DEFAULT 1) | 멀티 클립 순서 (8초 단위 생성)                        |

`metadata` JSONB는 유지 (비정형 확장 데이터용). Storage 전환 완료 후 `public_url` 컬럼은 제거 예정, `media_asset_id` NOT NULL 강제화 예정.

#### `trendtube_session` — 수정 (인덱스만)

| 변경 유형 | 내용                          | 이유                         |
| --------- | ----------------------------- | ---------------------------- |
| **추가**  | `(project_id, status)` 인덱스 | "최신 완료 세션" 쿼리 최적화 |

### 2.4 목표 데이터 관계도

```
project
 ├── studio_session (1:N) ← [신규] 세션 기반 관리
 │    ├── studio_script (1:1)
 │    │    ├── [기존] prompt, targetDuration, savedAt
 │    │    ├── [신규] hooks[], scriptGuidelines, seoKeywords, preProductionStatus
 │    │    ├── [신규] sourceTrendtubeSessionId → trendtube_session
 │    │    └── studio_script_segment (1:N)
 │    │         ├── [기존] type, content, estimatedDuration
 │    │         └── [신규] visualNotes, emotionalTone, keywords[], sceneHints
 │    │
 │    ├── studio_storyboard (1:N)
 │    │    ├── [기존] description, visualPrompt, duration, imageAssetId → media_asset
 │    │    ├── [신규] emotionalTone, cameraAngle
 │    │    └── studio_video (1:1)
 │    │         ├── duration (전체 Scene 합산)
 │    │         └── studio_video_part (1:N) ← 8초 클립 단위
 │    │              └── videoAssetId → media_asset
 │    │
 │    └── (Phase 2+)
 │         ├── studio_b_roll (1:N) → media_asset
 │         └── studio_rough_cut_timeline (1:1)
 │              └── studio_rough_cut_timeline_segment (1:N)
 │
 ├── trendtube_session (1:N) ← 기존 패턴 유지
 │    ├── trendtube_result (1:1)
 │    └── trendtube_media (1:N)
 │         ├── mediaAssetId → media_asset (Storage 전환 후 NOT NULL)
 │         ├── [신규] prompt, clipNumber
 │         └── publicUrl (과도기 유지 → 제거 예정)
 │
 ├── studio_subtitle (1:N) [Phase 1.5]
 ├── studio_seo (1:1) [Phase 1.5]
 ├── studio_export_history (1:N) [Phase 2]
 ├── studio_thumbnail (1:1) [Phase 2]
 │    ├── studio_thumbnail_candidate (1:N) → media_asset
 │    └── studio_thumbnail_overlay (1:N)
 ├── studio_rough_cut_version (1:N) → media_asset [Phase 2]
 │
 ├── media_asset (1:N) ← 통합 미디어 자산 저장소
 ├── project_label (N:M) → label
 └── idea (sourceIdeaId) → idea_trend (N:M) → trend
```

---

## 3. 테이블 상세 명세 (목표 스키마)

> 유지 테이블(변경 없음)은 §1.3의 현황 분석 참조. 여기서는 **신규/수정 테이블만** 상세 기술.

### 3.1 `studio_session` (신규)

| 컬럼         | 타입        | 제약 조건                                   | 용도                   | 데이터 소스 | 생성/업데이트 시점                |
| ------------ | ----------- | ------------------------------------------- | ---------------------- | ----------- | --------------------------------- |
| `id`         | UUID        | PK, DEFAULT gen_random_uuid()               | 세션 ID                | 시스템      | Studio 진입 시 생성               |
| `project_id` | UUID        | FK → project ON DELETE CASCADE, NOT NULL    | 부모 프로젝트          | 시스템      | 생성 시 설정                      |
| `user_id`    | UUID        | FK → auth.users ON DELETE CASCADE, NOT NULL | 세션 소유자            | Auth        | 생성 시 설정                      |
| `version`    | INTEGER     | NOT NULL, DEFAULT 1                         | 프로젝트 내 세션 버전  | 시스템      | 생성 시 자동 증가                 |
| `status`     | TEXT        | NOT NULL, DEFAULT 'active'                  | 'active' \| 'archived' | 시스템      | 새 세션 생성 시 기존 → 'archived' |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                     | 생성 시각              | 시스템      | 생성 시                           |

**인덱스**: `CREATE UNIQUE INDEX idx_studio_session_active ON studio_session (project_id) WHERE status = 'active';`

**생성 흐름**: Studio 진입 시 active 세션 없으면 자동 생성. Script 재생성 시 기존 세션 archived → 새 세션 생성 (version+1).

### 3.2 `project` (수정)

**제거 컬럼**:

| 컬럼                          | 이유                                                           |
| ----------------------------- | -------------------------------------------------------------- |
| `tone` (project_tone Enum)    | `content_tone`으로 통합. 매핑: cinematic→dramatic, vlog→casual |
| `based_on_trend_id` (INTEGER) | 레거시. `based_on_trend_uuid` (UUID)로 대체 완료               |

**@deprecated 컬럼** (코드 호환을 위해 유지, Phase C에서 제거):

| 컬럼                        | 이유                              | 이동 대상                         |
| --------------------------- | --------------------------------- | --------------------------------- |
| `hooks` (TEXT[])            | Studio Pre-Production 단계로 이동 | `studio_script.hooks`             |
| `script_guidelines` (JSONB) | 동일                              | `studio_script.script_guidelines` |

`ai_context` JSONB 내부의 `keywords`도 `studio_script.seo_keywords`로 이동 예정이나, JSONB 내부 필드이므로 스키마 레벨에서 제거 불가. 코드에서 deprecated 처리.

**나머지 컬럼**: §1.3.2 project 테이블 참조 (변경 없음)

### 3.3 `studio_script` (수정)

| 컬럼                          | 타입      | 제약 조건                                 | 용도                                        | 데이터 소스         | 생성/업데이트 시점                   |
| ----------------------------- | --------- | ----------------------------------------- | ------------------------------------------- | ------------------- | ------------------------------------ |
| `id`                          | UUID      | PK                                        | 대본 ID                                     | 시스템              | 대본 생성 시                         |
| `session_id`                  | UUID      | FK → studio_session ON DELETE CASCADE     | **(신규)** 세션 연결                        | 시스템              | 생성 시                              |
| `project_id`                  | UUID      | FK → project ON DELETE CASCADE, NOT NULL  | 프로젝트 (직접 조회용 비정규화)             | 시스템              | 생성 시                              |
| `prompt`                      | TEXT      |                                           | 사용자 프롬프트                             | 사용자 입력         | 생성 시                              |
| `target_duration`             | INTEGER   |                                           | 목표 길이 (초)                              | 사용자 입력         | 생성 시                              |
| `hooks`                       | TEXT[]    |                                           | **(신규)** 오프닝 훅 배열                   | AI (Pre-Production) | Pre-Production 완료 시               |
| `script_guidelines`           | JSONB     |                                           | **(신규)** 대본 구조 가이드                 | AI (Pre-Production) | Pre-Production 완료 시               |
| `seo_keywords`                | TEXT[]    |                                           | **(신규)** SEO 키워드                       | AI (Pre-Production) | Pre-Production 완료 시               |
| `pre_production_status`       | TEXT      | DEFAULT 'pending'                         | **(신규)** 'pending' \| 'completed'         | 시스템              | Pre-Production 완료 시 → 'completed' |
| `source_trendtube_session_id` | UUID      | FK → trendtube_session ON DELETE SET NULL | **(신규)** TrendTube 스크립트 가져오기 원본 | 시스템              | Import 시                            |
| `saved_at`                    | TIMESTAMP | DEFAULT NOW()                             | 저장 시각                                   | 시스템              | 저장 시                              |

**핵심 변경**: `project_id UNIQUE` 제약 제거. 세션을 통해 프로젝트당 다수 대본 보유 가능.

### 3.4 `studio_script_segment` (수정)

| 컬럼                 | 타입                | 제약 조건                                      | 용도                          | 데이터 소스      | 소비 단계                                     |
| -------------------- | ------------------- | ---------------------------------------------- | ----------------------------- | ---------------- | --------------------------------------------- |
| `id`                 | UUID                | PK                                             | 세그먼트 ID                   | 시스템           |                                               |
| `script_id`          | UUID                | FK → studio_script ON DELETE CASCADE, NOT NULL | 부모 대본                     | 시스템           |                                               |
| `order_index`        | INTEGER             | NOT NULL                                       | 정렬 순서                     | 시스템           |                                               |
| `type`               | script_segment_type | NOT NULL                                       | hook/intro/body/cta/outro     | AI 생성          | Step 2 (세그먼트별 시각 스타일)               |
| `content`            | TEXT                | NOT NULL                                       | 대본 텍스트                   | AI + 사용자 편집 | Step 2 (300자 프리뷰 → 씬 생성)               |
| `estimated_duration` | INTEGER             |                                                | 예상 길이 (초)                | AI 생성          | Step 2 (씬 duration 합산 기준)                |
| `visual_notes`       | TEXT                |                                                | **(신규)** 시각적 방향 메모   | AI 생성          | Step 2 (조명, 분위기, 배경 제시)              |
| `emotional_tone`     | TEXT                |                                                | **(신규)** 감정적 톤          | AI 생성          | Step 2→3 (이미지/비디오 분위기)               |
| `keywords`           | TEXT[]              |                                                | **(신규)** B-Roll 검색 키워드 | AI 생성          | Step 4 (스톡 영상 검색 — AI 추가 호출 불필요) |
| `scene_hints`        | JSONB               |                                                | **(신규)** 씬 분할 힌트       | AI 생성          | Step 2 (씬 수/방향, visualPrompt 참조)        |

### 3.5 `studio_storyboard` (수정)

| 컬럼                | 타입      | 제약 조건                                               | 용도                                   | 데이터 소스     | 생성/업데이트 시점             |
| ------------------- | --------- | ------------------------------------------------------- | -------------------------------------- | --------------- | ------------------------------ |
| `id`                | UUID      | PK                                                      | 스토리보드 씬 ID                       | 시스템          | Step 2 완료 시                 |
| `project_id`        | UUID      | FK → project ON DELETE CASCADE, NOT NULL                | 프로젝트                               | 시스템          | 생성 시                        |
| `session_id`        | UUID      | FK → studio_session ON DELETE CASCADE                   | **(신규)** 세션 연결                   | 시스템          | 생성 시                        |
| `script_segment_id` | UUID      | FK → studio_script_segment ON DELETE SET NULL, NOT NULL | 대본 세그먼트                          | 시스템          | 생성 시                        |
| `scene_number`      | INTEGER   | NOT NULL                                                | 전체 씬 번호                           | 시스템          | 생성 시                        |
| `order_index`       | INTEGER   | NOT NULL, DEFAULT 0                                     | 세그먼트 내 정렬                       | 시스템          | 생성 시                        |
| `description`       | TEXT      |                                                         | 한국어 씬 설명 (UI 표시)               | AI 생성         | Step 2                         |
| `visual_prompt`     | TEXT      |                                                         | 영문 이미지/비디오 프롬프트            | AI 생성         | Step 2 → Step 3 입력           |
| `duration`          | INTEGER   |                                                         | 씬 길이 (초)                           | AI 생성         | Step 2 → Step 3 클립 분할 기준 |
| `emotional_tone`    | TEXT      |                                                         | **(신규)** 감정적 톤 (Script에서 전달) | AI (Script)     | Step 2 → Step 3 분위기 제어    |
| `camera_angle`      | TEXT      |                                                         | **(신규)** 카메라 앵글 힌트            | AI (Storyboard) | Step 2 → Step 3 참조           |
| `image_asset_id`    | UUID      | FK → media_asset ON DELETE SET NULL                     | 생성된 씬 이미지                       | 시스템          | Step 2 이미지 생성 시          |
| `created_at`        | TIMESTAMP | NOT NULL, DEFAULT NOW()                                 | 생성 시각                              | 시스템          | 생성 시                        |

### 3.6 `studio_video` (수정)

| 컬럼             | 타입               | 제약 조건                                          | 용도                 | 데이터 소스 |
| ---------------- | ------------------ | -------------------------------------------------- | -------------------- | ----------- |
| `id`             | UUID               | PK                                                 | 비디오 ID            | 시스템      |
| `storyboard_id`  | UUID               | FK → studio_storyboard ON DELETE CASCADE, NOT NULL | 부모 스토리보드      | 시스템      |
| `project_id`     | UUID               | FK → project ON DELETE CASCADE, NOT NULL           | 프로젝트             | 시스템      |
| `session_id`     | UUID               | FK → studio_session ON DELETE CASCADE              | **(신규)** 세션 연결 | 시스템      |
| `video_asset_id` | UUID               | FK → media_asset ON DELETE SET NULL                | 비디오 파일          | 시스템      |
| `duration`       | DOUBLE PRECISION   |                                                    | 전체 Scene 합산 길이 | 시스템      |
| `status`         | scene_video_status | DEFAULT 'generating'                               | 생성 상태            | 시스템      |
| `created_at`     | TIMESTAMP          | DEFAULT NOW()                                      | 생성 시각            | 시스템      |

### 3.7 `trendtube_media` (수정)

| 컬럼             | 타입                 | 제약 조건                                          | 용도                       | 데이터 소스 |
| ---------------- | -------------------- | -------------------------------------------------- | -------------------------- | ----------- |
| `id`             | UUID                 | PK                                                 | 미디어 ID                  | 시스템      |
| `session_id`     | UUID                 | FK → trendtube_session ON DELETE CASCADE, NOT NULL | 부모 세션                  | 시스템      |
| `media_type`     | trendtube_media_type | NOT NULL                                           | 미디어 유형                | 시스템      |
| `media_asset_id` | UUID                 | FK → media_asset ON DELETE SET NULL                | 미디어 에셋                | 시스템      |
| `public_url`     | TEXT                 |                                                    | 공개 URL (과도기 유지)     | 시스템      |
| `prompt`         | TEXT                 |                                                    | **(신규)** 생성 프롬프트   | AI          |
| `clip_number`    | INTEGER              | DEFAULT 1                                          | **(신규)** 멀티 클립 순서  | 시스템      |
| `metadata`       | JSONB                |                                                    | 비정형 메타데이터 (확장용) | 시스템      |
| `created_at`     | TIMESTAMP            | NOT NULL, DEFAULT NOW()                            | 생성 시각                  | 시스템      |

---

## 4. 재구축 실행 전략

### 4.1 방식: Clean Rebuild

개발 데이터 전체 삭제 전제이므로, 28개 마이그레이션 히스토리를 초기화하고 목표 스키마로 단일 마이그레이션을 생성한다.

### 4.2 단계별 실행 계획

#### Step 1: 스키마 정의 파일 수정

| 파일                                             | 변경 내용                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/drizzle/enums.ts`                           | `projectToneEnum` 제거. 주석의 enum 목록 업데이트                                                                                                                                                                                                                                                                                                                                                                                                                |
| `app/features/project/project-schema.ts`         | `tone` 컬럼 제거, `basedOnTrendId` 컬럼 제거. `projectToneEnum` import 제거. `hooks`, `scriptGuidelines`에 `@deprecated` 주석 추가                                                                                                                                                                                                                                                                                                                               |
| `app/features/studio/studio-schema.ts`           | `coloringPresets`, `coloringSettings` 테이블 + relations 완전 제거. `studioSessions` 테이블 추가. `scripts`에 `sessionId`, `hooks`, `scriptGuidelines`, `seoKeywords`, `preProductionStatus`, `sourceTrendtubeSessionId` 추가, `projectId` UNIQUE 제거. `scriptSegments`에 `visualNotes`, `emotionalTone`, `keywords`, `sceneHints` 추가. `storyboards`에 `sessionId`, `emotionalTone`, `cameraAngle` 추가. `sceneVideos`에 `sessionId` 추가. Relations 업데이트 |
| `app/features/studio/studio-trendtube-schema.ts` | `trendtubeMedia`에 `prompt`, `clipNumber` 추가                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `app/drizzle/index.ts`                           | coloring export 제거, studioSessions export 추가                                                                                                                                                                                                                                                                                                                                                                                                                 |

#### Step 2: 기존 테이블 전체 DROP

Supabase SQL Editor에서 실행:

```sql
-- FK 의존성 역순으로 DROP
-- Phase 2+ (하위 먼저)
DROP TABLE IF EXISTS public.studio_rough_cut_timeline_segment CASCADE;
DROP TABLE IF EXISTS public.studio_rough_cut_timeline CASCADE;
DROP TABLE IF EXISTS public.studio_rough_cut_version CASCADE;
DROP TABLE IF EXISTS public.studio_thumbnail_overlay CASCADE;
DROP TABLE IF EXISTS public.studio_thumbnail_candidate CASCADE;
DROP TABLE IF EXISTS public.studio_thumbnail CASCADE;
DROP TABLE IF EXISTS public.studio_coloring_setting CASCADE;
DROP TABLE IF EXISTS public.studio_coloring_preset CASCADE;
DROP TABLE IF EXISTS public.studio_b_roll CASCADE;

-- TrendTube
DROP TABLE IF EXISTS public.trendtube_media CASCADE;
DROP TABLE IF EXISTS public.trendtube_result CASCADE;
DROP TABLE IF EXISTS public.trendtube_session CASCADE;

-- Studio MVP (하위 먼저)
DROP TABLE IF EXISTS public.studio_video_part CASCADE;
DROP TABLE IF EXISTS public.studio_video CASCADE;
DROP TABLE IF EXISTS public.studio_storyboard CASCADE;
DROP TABLE IF EXISTS public.studio_script_segment CASCADE;
DROP TABLE IF EXISTS public.studio_script CASCADE;
DROP TABLE IF EXISTS public.studio_export_history CASCADE;
DROP TABLE IF EXISTS public.studio_subtitle CASCADE;
DROP TABLE IF EXISTS public.studio_seo CASCADE;

-- Audit
DROP TABLE IF EXISTS public.audit_log CASCADE;

-- Project 도메인 (junction 먼저)
DROP TABLE IF EXISTS public.idea_trend CASCADE;
DROP TABLE IF EXISTS public.idea CASCADE;
DROP TABLE IF EXISTS public.project_label CASCADE;
DROP TABLE IF EXISTS public.label CASCADE;
DROP TABLE IF EXISTS public.media_asset CASCADE;
DROP TABLE IF EXISTS public.project CASCADE;
DROP TABLE IF EXISTS public.channel CASCADE;

-- Trend
DROP TABLE IF EXISTS public.trend CASCADE;

-- Auth (profiles만 — auth.users는 Supabase 관리)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drizzle 마이그레이션 히스토리
DROP TABLE IF EXISTS public.__drizzle_migrations CASCADE;
-- 또는 drizzle 스키마 사용 시:
DROP TABLE IF EXISTS drizzle.__drizzle_migrations CASCADE;
DROP SCHEMA IF EXISTS drizzle CASCADE;

-- Enum 타입 제거 (모든 테이블 DROP 후)
DROP TYPE IF EXISTS public.project_tone CASCADE;
DROP TYPE IF EXISTS public.media_type CASCADE;
DROP TYPE IF EXISTS public.media_provider CASCADE;
DROP TYPE IF EXISTS public.project_type CASCADE;
DROP TYPE IF EXISTS public.project_visibility CASCADE;
DROP TYPE IF EXISTS public.project_status CASCADE;
DROP TYPE IF EXISTS public.script_segment_type CASCADE;
DROP TYPE IF EXISTS public.scene_video_status CASCADE;
DROP TYPE IF EXISTS public.export_format CASCADE;
DROP TYPE IF EXISTS public.export_resolution CASCADE;
DROP TYPE IF EXISTS public.export_status CASCADE;
DROP TYPE IF EXISTS public.upload_status CASCADE;
DROP TYPE IF EXISTS public.channel_status CASCADE;
DROP TYPE IF EXISTS public.trend_source CASCADE;
DROP TYPE IF EXISTS public.b_roll_provider CASCADE;
DROP TYPE IF EXISTS public.ai_generation_type CASCADE;
DROP TYPE IF EXISTS public.idea_difficulty CASCADE;
DROP TYPE IF EXISTS public.idea_source CASCADE;
DROP TYPE IF EXISTS public.trendtube_pipeline_status CASCADE;
DROP TYPE IF EXISTS public.trendtube_media_type CASCADE;
DROP TYPE IF EXISTS public.content_tone CASCADE;
DROP TYPE IF EXISTS public.video_length CASCADE;
DROP TYPE IF EXISTS public.thumbnail_overlay_type CASCADE;
DROP TYPE IF EXISTS public.timeline_track_type CASCADE;
DROP TYPE IF EXISTS public.timeline_resource_type CASCADE;
```

#### Step 3: 마이그레이션 히스토리 초기화

```bash
# 기존 마이그레이션 파일 삭제
rm -rf app/drizzle/migrations/*

# 새 Clean 마이그레이션 생성
npm run db:generate
```

#### Step 4: 마이그레이션 적용

```bash
npm run db:migrate
```

실패 시 Supabase SQL Editor에서 생성된 `app/drizzle/migrations/0000_*.sql` 내용을 직접 실행 후 `npm run db:migrate` 재실행.

#### Step 5: RLS 정책 재설정

`app/drizzle/enable-rls.ts` 업데이트 후 재실행:

**TABLES 배열 업데이트**:

```typescript
const TABLES = [
  "profiles",
  "media_asset",
  "project",
  "channel",
  "label",
  "project_label",
  "idea", // saved_idea → idea (변경)
  "idea_trend", // 신규 추가
  "trend",
  // ai_recommendation → 제거 (idea로 통합)
  "studio_session", // 신규 추가
  "studio_script",
  "studio_script_segment",
  "studio_storyboard",
  "studio_video",
  "studio_video_part",
  "studio_export_history",
  "studio_subtitle",
  "studio_seo",
  "studio_b_roll", // 신규 추가
  "studio_thumbnail", // 신규 추가
  "studio_thumbnail_candidate", // 신규 추가
  "studio_thumbnail_overlay", // 신규 추가
  "studio_rough_cut_timeline", // 신규 추가
  "studio_rough_cut_timeline_segment", // 신규 추가
  "studio_rough_cut_version", // 신규 추가
  "trendtube_session", // 신규 추가
  "trendtube_result", // 신규 추가
  "trendtube_media", // 신규 추가
  "audit_log",
];
```

**POLICIES 배열 업데이트**:

- `saved_idea` → `idea` (테이블명 변경)
- `ai_recommendation` → 제거
- `idea_trend`, `studio_session`, `trendtube_session`, `trendtube_result`, `trendtube_media`, Phase 2+ 테이블에 대한 정책 추가

```bash
npx tsx app/drizzle/enable-rls.ts
```

#### Step 6: 데이터 레이어 코드 업데이트

| 파일                                                         | 변경 내용                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/common/data/studio.data.server.ts`                      | `SaveScriptInput` 타입에 `sessionId`, `visualNotes`, `emotionalTone`, `keywords`, `sceneHints` 추가. 세션 CRUD 함수 추가 (`createStudioSession`, `archiveStudioSession`, `getActiveStudioSession`). `saveScript()` 세션 기반으로 변경. `saveStoryboard()`에 `sessionId` 전달. `getColorPresets()` 제거 |
| `app/common/data/project.data.server.ts`                     | `tone` 참조 코드 제거 또는 `contentTone`으로 대체. `basedOnTrendId` 관련 코드 정리                                                                                                                                                                                                                     |
| `app/common/types/studio.types.ts`                           | `ColorPreset` 타입 제거. 세션 관련 타입 추가. `ScriptSegment` 타입에 신규 필드 추가                                                                                                                                                                                                                    |
| `app/features/studio/api/generate-script-stream.ts`          | `saveScript()` 호출 시 전체 메타데이터(7개 필드) 전달                                                                                                                                                                                                                                                  |
| `app/features/studio/pages/studio-coloring-page.tsx`         | 파일 삭제                                                                                                                                                                                                                                                                                              |
| `app/features/studio/components/studio-project-selector.tsx` | Coloring Quick Access 항목 제거                                                                                                                                                                                                                                                                        |
| `app/routes.ts`                                              | Coloring 라우트 제거                                                                                                                                                                                                                                                                                   |
| `app/features/project/pages/new-project-page.tsx`            | `tone` 관련 폼 필드를 `contentTone`으로 대체                                                                                                                                                                                                                                                           |

#### Step 7: 검증

```bash
# 타입 체크
npm run typecheck

# 린트 체크
npm run lint

# 변경된 함수/타입명 전체 검색
# (tone, projectToneEnum, coloringPresets, coloringSettings, savedIdea 등)
```

---

## 5. 코드 영향 범위 상세

### 5.1 스키마/Enum 파일

| 파일                                             | 변경 유형 | 상세                                                                             |
| ------------------------------------------------ | --------- | -------------------------------------------------------------------------------- |
| `app/drizzle/enums.ts`                           | 수정      | `projectToneEnum` 제거, 주석 업데이트                                            |
| `app/features/project/project-schema.ts`         | 수정      | `tone`, `basedOnTrendId` 제거, `projectToneEnum` import 제거, `@deprecated` 주석 |
| `app/features/studio/studio-schema.ts`           | 수정      | coloring 제거, session 추가, 컬럼 추가, relations 업데이트                       |
| `app/features/studio/studio-trendtube-schema.ts` | 수정      | `prompt`, `clipNumber` 추가                                                      |
| `app/features/trend/trend-schema.ts`             | 수정      | `aiRecommendations` 레거시 export 정리                                           |
| `app/drizzle/index.ts`                           | 수정      | coloring export 제거, session export 추가                                        |

### 5.2 데이터 레이어

| 파일                                       | 변경 유형 | 상세                                                                                       |
| ------------------------------------------ | --------- | ------------------------------------------------------------------------------------------ |
| `app/common/data/studio.data.server.ts`    | 수정      | 세션 CRUD 추가, SaveScriptInput 확장, saveScript/saveStoryboard 수정, getColorPresets 제거 |
| `app/common/data/project.data.server.ts`   | 수정      | tone 관련 코드 정리                                                                        |
| `app/common/data/trendtube.data.server.ts` | 수정      | saveTrendTubeMedia에 prompt, clipNumber 지원                                               |

### 5.3 타입 파일

| 파일                               | 변경 유형 | 상세                                                                    |
| ---------------------------------- | --------- | ----------------------------------------------------------------------- |
| `app/common/types/studio.types.ts` | 수정      | ColorPreset 제거, ScriptSegment 신규 필드 추가, StudioSession 타입 추가 |

### 5.4 API/라우트

| 파일                                                | 변경 유형 | 상세                                  |
| --------------------------------------------------- | --------- | ------------------------------------- |
| `app/features/studio/api/generate-script-stream.ts` | 수정      | saveScript 호출 시 7개 필드 모두 전달 |
| `app/routes.ts`                                     | 수정      | Coloring 라우트 제거                  |

### 5.5 페이지/컴포넌트

| 파일                                                         | 변경 유형 | 상세                              |
| ------------------------------------------------------------ | --------- | --------------------------------- |
| `app/features/studio/pages/studio-coloring-page.tsx`         | 삭제      | 파일 삭제                         |
| `app/features/studio/components/studio-project-selector.tsx` | 수정      | Coloring Quick Access 제거        |
| `app/features/project/pages/new-project-page.tsx`            | 수정      | tone → contentTone 전환 (해당 시) |

### 5.6 인프라

| 파일                        | 변경 유형 | 상세                                                            |
| --------------------------- | --------- | --------------------------------------------------------------- |
| `app/drizzle/enable-rls.ts` | 수정      | 테이블 목록 업데이트, 구형 테이블명 제거, 신규 테이블 정책 추가 |
| `app/drizzle/migrations/*`  | 재생성    | 기존 28개 파일 삭제 → 단일 0000 마이그레이션 생성               |

---

## 6. 구현 순서

### 6.1 Phase 0: Clean Rebuild (스키마 + 코드)

> **목표**: 목표 스키마 적용, 코드 동기화, 검증

1. 스키마 정의 파일 수정 (Step 1)
2. Supabase SQL Editor에서 테이블 전체 DROP (Step 2)
3. 마이그레이션 히스토리 초기화 + 새 마이그레이션 생성 (Step 3)
4. 마이그레이션 적용 (Step 4)
5. RLS 정책 재설정 (Step 5)
6. 데이터 레이어/타입/API 코드 업데이트 (Step 6)
7. typecheck + lint 검증 (Step 7)

### 6.2 후속 Phase 연결

Clean Rebuild 완료 후, 고도화 계획의 Phase들이 순차적으로 진행된다:

```
Clean Rebuild (본 문서)
    │
    ├── Studio 고도화
    │    ├── Phase 1A: Script 메타데이터 전체 저장 (generate-script-stream.ts 수정)
    │    ├── Phase 1B: Storyboard AI 최적화 (모델 교체, 메타데이터 활용)
    │    ├── Phase 1D: project.tone 제거 코드 반영 (Clean Rebuild에서 스키마 완료)
    │    └── Phase 1E-H: TrendTube 연계, Storage 전환, AI 서비스 통합
    │
    └── AI 최적화
         ├── Phase A: 공유 컨텍스트 빌더
         ├── Phase B: TrendTube 컨텍스트 연계 (AI 호출 절감)
         ├── Phase C: Pre-Production + Project 경량화 (hooks/scriptGuidelines 이동)
         └── Phase D: 데이터 마이그레이션 + @deprecated 컬럼 최종 제거
```

---

## 부록

### A. 목표 스키마 Drizzle 정의 참조 — `studio_session`

```typescript
// app/features/studio/studio-schema.ts에 추가
export const studioSessions = tubegaiSchema.table("studio_session", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  version: integer("version").default(1).notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### B. 목표 스키마 Drizzle 정의 참조 — `studio_script_segment` 신규 컬럼

```typescript
// studio_script_segment에 추가할 컬럼
visualNotes: text("visual_notes"),
emotionalTone: text("emotional_tone"),
keywords: text("keywords").array(),
sceneHints: jsonb("scene_hints").$type<SceneHint[]>(),
```

### C. 목표 스키마 Drizzle 정의 참조 — `studio_script` 신규 컬럼

```typescript
// studio_script에 추가할 컬럼
sessionId: uuid("session_id").references(() => studioSessions.id, { onDelete: "cascade" }),
hooks: text("hooks").array(),
scriptGuidelines: jsonb("script_guidelines").$type<ScriptGuidelines>(),
seoKeywords: text("seo_keywords").array(),
preProductionStatus: text("pre_production_status").default("pending"),
sourceTrendtubeSessionId: uuid("source_trendtube_session_id")
  .references(() => trendtubeSessions.id, { onDelete: "set null" }),
```

### D. enable-rls.ts 신규 정책 예시

```typescript
// studio_session 정책
{
  name: "studio_session_select_own",
  table: "studio_session",
  operation: "SELECT",
  using: "user_id = auth.uid()",
},
{
  name: "studio_session_insert_own",
  table: "studio_session",
  operation: "INSERT",
  withCheck: "user_id = auth.uid()",
},
{
  name: "studio_session_update_own",
  table: "studio_session",
  operation: "UPDATE",
  using: "user_id = auth.uid()",
},

// trendtube_session 정책
{
  name: "trendtube_session_select_own",
  table: "trendtube_session",
  operation: "SELECT",
  using: "user_id = auth.uid()",
},
{
  name: "trendtube_session_insert_own",
  table: "trendtube_session",
  operation: "INSERT",
  withCheck: "user_id = auth.uid()",
},

// idea 정책 (saved_idea에서 변경)
{
  name: "idea_select_own",
  table: "idea",
  operation: "SELECT",
  using: "user_id = auth.uid()",
},
{
  name: "idea_insert_own",
  table: "idea",
  operation: "INSERT",
  withCheck: "user_id = auth.uid()",
},
{
  name: "idea_update_own",
  table: "idea",
  operation: "UPDATE",
  using: "user_id = auth.uid()",
},
{
  name: "idea_delete_own",
  table: "idea",
  operation: "DELETE",
  using: "user_id = auth.uid()",
},
```
