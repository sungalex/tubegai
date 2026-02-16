# TubeGAI 프로젝트 구조 분석 및 리팩토링 계획

> **관련 문서**:
>
> - [Studio + TrendTube 통합 고도화 계획서](studio-enhancement-plan.md)
> - [Project-Studio AI 중복 최소화 전략](project-studio-ai-optimization-plan.md)

---

## 1. 현재 프로젝트 구조

### 1.1 최상위 디렉토리

```
tubegai/
├── app/                    # 메인 애플리케이션 소스코드
│   ├── features/           # 기능별 모듈 (6개)
│   ├── common/             # 공유 리소스 (components, data, types, constants)
│   ├── drizzle/            # DB 스키마 집계, enum, 마이그레이션
│   ├── hooks/              # 공용 커스텀 훅
│   ├── lib/                # 유틸리티, AI 서비스, 인증, DB 클라이언트
│   ├── root.tsx            # 루트 레이아웃
│   ├── routes.ts           # 라우트 설정
│   └── supa-client.ts      # Supabase 클라이언트 (레거시)
├── docs/                   # 프로젝트 문서
├── public/                 # 정적 에셋
├── scripts/                # 유틸리티 스크립트
├── .react-router/          # React Router 자동생성 타입
├── database.types.ts       # Supabase 자동생성 타입
├── drizzle.config.ts       # Drizzle ORM 설정
└── package.json
```

### 1.2 app/ 내부 구조

```
app/
├── features/
│   ├── auth/               # 인증 (5 pages, 1 schema)
│   ├── project/            # 프로젝트 관리 (10 pages, 8 components, 5 api, 1 schema, 1 queries)
│   ├── studio/             # 영상 제작 (11 pages, 10 components, 11 api, 2 hooks, 2 schemas)
│   ├── trend/              # 트렌드 (1 schema)
│   ├── product/            # 상품 페이지 (3 pages)
│   ├── settings/           # 설정 (비활성, 5 pages, 1 component, 1 schema)
│   └── audit/              # 감사 로그 (1 schema)
│
├── common/
│   ├── components/
│   │   ├── ui/             # Shadcn UI (40개+)
│   │   └── magicui/        # 확장 UI (3개)
│   ├── data/               # 데이터 레이어 (7개 *.data.server.ts)
│   ├── types/              # 도메인 타입 (8개 *.types.ts)
│   ├── constants/          # 상수 (colors, images)
│   └── pages/              # 공유 페이지 (home)
│
├── drizzle/
│   ├── index.ts            # 전체 스키마 집계 (re-export)
│   ├── enums.ts            # 모든 enum 중앙 정의
│   ├── schema-def.ts       # pgTable/pgEnum 래퍼
│   ├── enable-rls.ts/sql   # RLS 정책
│   ├── migrations/         # 마이그레이션 SQL (27개)
│   └── triggers/           # 빈 디렉토리
│
└── lib/                    # 20개 파일 (flat 구조)
    ├── ai.server.ts / ai-script.server.ts / ai-storyboard.server.ts  ... (AI 11개)
    ├── auth.server.ts / auth.client.ts                                 (Auth 2개)
    ├── youtube-api.server.ts / youtube-oauth.server.ts / youtube-oauth.client.ts (YouTube 3개)
    ├── db.server.ts / supabase-storage.server.ts / video-composer.server.ts    (Infra 3개)
    ├── utils.ts                                                        (Utils 1개)
    └── __mocks__/ai-fixtures.ts                                        (Mock 1개)
```

---

## 2. 폴더별 분석 및 리팩토링 방안

### 2.1 scripts/ 폴더

#### 현황

| 파일 | 크기 | 용도 | package.json 등록 |
|------|------|------|:-:|
| `verify-ai-models.ts` (147줄) | 4.7KB | Gemini 모델 목록 검증, CLAUDE.md 모델명 확인 | X |

**Export 함수**:
- `listAvailableModels()` — Gemini REST API로 사용 가능한 모델 목록 조회
- 모델을 text/image/embedding 카테고리로 분류
- CLAUDE.md 및 코드베이스에서 사용 중인 모델명 존재 여부 검증
- 유사 모델명 제안 기능

**참조**: `docs/gemini-api-optimization-strategy.md`에서만 언급. 코드에서 import 없음. `package.json` 미등록 — 수동 실행만 가능 (`tsx scripts/verify-ai-models.ts`)

#### 제안

| 항목 | 액션 | 우선순위 |
|------|------|:---:|
| package.json 등록 | `"verify-models": "tsx scripts/verify-ai-models.ts"` 추가 | 낮음 |
| 폴더 유지 | AI 모델 교체 시 활용 가치 있으므로 유지 | - |

---

### 2.2 app/lib/ 폴더

#### 현황 — 20개 파일, flat 구조

##### AI 서비스 (11개, ~3,450줄)

| 파일 | 줄 수 | Export 함수 | AI 모델 | SDK | retry | 사용처 |
|------|:---:|---------|---------|-----|:---:|--------|
| `gemini-client.server.ts` | 37 | `getGeminiClient()`, `getTextModel()` | — | `@google/generative-ai` | — | 모든 AI 서비스 내부 |
| `gemini-retry.server.ts` | 67 | `withRetry()` | — | — | — | 모든 AI 서비스 내부 |
| `ai.server.ts` | 281 | `generateAIRecommendations()` | `gemini-2.5-flash` | `@google/generative-ai` | O | `idea.data.server.ts` |
| `ai-script.server.ts` | 1,209 | `generateScript()`, `generateScriptStream()`, `refineScriptSegment()` | `gemini-2.5-flash`, `-lite` | `@google/generative-ai` | O | `generate-script-stream.ts`, `studio-script-page.tsx` |
| `ai-storyboard.server.ts` | 530 | `generateStoryboard()`, `generateStoryboardStream()` | `nano-banana-pro-preview` | `@google/generative-ai` | O | `generate-storyboard-stream.ts` |
| `ai-image.server.ts` | 254 | `generateImage()`, `generatePlaceholderImage()` | `gemini-3-pro-image-preview` | `@google/generative-ai` | O | `generate-scene-image.ts` |
| `ai-video.server.ts` | 181 | `generateVideo()` | `veo-3.1-generate-preview` | **`@google/genai`** | **X** | `trendtube-step-media.ts` |
| `ai-music.server.ts` | 333 | `generateMusic()` | `lyria-realtime-exp` | **`@google/genai`** | **X** | `trendtube-step-media.ts` |
| `ai-trendtube.server.ts` | 159 | `extractYouTubeTrends()`, `generateVideoIdeas()`, `generateNarrationScript()` | `gemini-2.5-flash`, `-lite` | `@google/generative-ai` | O | `trendtube-step-*.ts` (3곳) |
| `ai-project-generator.server.ts` | 292 | `generateProjectContext()`, `buildProjectGenerationPrompt()`, `createTrendSnapshot()` | `gemini-2.5-flash-lite` | `@google/generative-ai` | O | `generate-project-context.ts` |
| `tts.server.ts` | 123 | `generateVoiceover()` | Google Cloud TTS | HTTP REST | **X** | `trendtube-step-media.ts` |

> **`__mocks__/ai-fixtures.ts`** (363줄): 모든 AI 서비스가 `GEMINI_MOCK=true` 시 사용하는 mock 데이터. 개발 시 API 비용 절감 패턴 — 정상 사용 중.

##### 인증 (2개)

| 파일 | 줄 수 | Export 함수 | 사용처 |
|------|:---:|---------|--------|
| `auth.server.ts` | 92 | `createSupabaseServerClient()`, `getCurrentUserId()`, `requireAuth()` | **28개 파일** (모든 라우트) |
| `auth.client.ts` | 279 | `signInWithEmail()`, `signUpWithEmail()`, `signInWithGitHub()`, `signInWithGoogle()`, `signOut()`, `getCurrentUser()`, `isAuthenticated()`, `onAuthStateChange()`, `sendPasswordResetEmail()` | 5개 파일 (auth 페이지, navigation) |

##### YouTube (3개)

| 파일 | 줄 수 | Export 함수 | 사용처 |
|------|:---:|---------|--------|
| `youtube-api.server.ts` | 358 | `getGoogleProviderToken()`, `refreshProviderToken()`, `getMyYouTubeChannel()`, `getChannelVideos()`, `syncChannelStats()`, `uploadVideo()` (미구현) | `youtube.data.server.ts` |
| `youtube-oauth.server.ts` | 199 | `generateYouTubeOAuthUrl()`, `exchangeCodeForTokens()`, `refreshAccessToken()`, `revokeToken()` | `project/api/youtube-oauth.ts` |
| `youtube-oauth.client.ts` | 202 | `initiateYouTubeOAuth()`, `linkYouTubeAccount()`, `getProviderTokens()`, `isYouTubeConnected()` | **import 없음 (미사용 가능성)** |

##### 인프라 (3개)

| 파일 | 줄 수 | Export 함수 | 사용처 |
|------|:---:|---------|--------|
| `db.server.ts` | 26 | `db`, `schema` | **10개 파일** (모든 data layer) |
| `supabase-storage.server.ts` | 88 | `uploadStoryboardImage()`, `deleteStorageFile()`, `getPublicUrl()` | `generate-scene-image.ts` |
| `video-composer.server.ts` | 145 | `composeVideo()` — FFmpeg로 video+music+voiceover 합성, base64 반환 | `trendtube-step-compose.ts` |

##### 유틸리티 (1개)

| 파일 | 줄 수 | Export 함수 | 사용처 |
|------|:---:|---------|--------|
| `utils.ts` | 6 | `cn()` — Tailwind 클래스 병합 | **57개 파일** (거의 모든 UI) |

#### 주요 문제

- AI 서비스가 전체의 55% (11/20) 차지 — IDE에서 파일 탐색 시 AI 파일이 목록을 지배
- **SDK 2개 혼용**: 텍스트/이미지 → `@google/generative-ai`, 비디오/음악 → `@google/genai`
- **모델명 하드코딩**: 각 파일에서 문자열 직접 사용 — 모델 변경 시 전체 파일 수정 필요
- **retry 미적용 3곳**: `ai-video`, `ai-music`, `tts` — 일시적 API 오류 시 즉시 실패
- **`youtube-oauth.client.ts` 미사용 가능성** — import하는 파일 없음
- 상세 분석은 [AI 중복 최소화 전략 §2.13](project-studio-ai-optimization-plan.md) 참조

#### 제안: AI 서비스 서브디렉토리 분리

```
app/lib/
├── ai/                              # AI 서비스 (신규 서브디렉토리)
│   ├── client.server.ts             # ← gemini-client.server.ts
│   ├── retry.server.ts              # ← gemini-retry.server.ts
│   ├── models.server.ts             # ← 신규 (AI_MODELS 상수 레지스트리)
│   ├── context-builder.server.ts    # ← 신규 (공유 컨텍스트 빌더)
│   ├── recommendations.server.ts    # ← ai.server.ts
│   ├── script.server.ts             # ← ai-script.server.ts
│   ├── storyboard.server.ts         # ← ai-storyboard.server.ts
│   ├── image.server.ts              # ← ai-image.server.ts
│   ├── video.server.ts              # ← ai-video.server.ts
│   ├── music.server.ts              # ← ai-music.server.ts
│   ├── trendtube.server.ts          # ← ai-trendtube.server.ts
│   ├── project-generator.server.ts  # ← ai-project-generator.server.ts
│   ├── tts.server.ts                # ← tts.server.ts
│   └── __mocks__/
│       └── fixtures.ts              # ← __mocks__/ai-fixtures.ts
│
├── auth.server.ts                   # 유지
├── auth.client.ts                   # 유지
├── youtube-api.server.ts            # 유지
├── youtube-oauth.server.ts          # 유지
├── youtube-oauth.client.ts          # 유지
├── db.server.ts                     # 유지
├── supabase-storage.server.ts       # 유지
├── video-composer.server.ts         # 유지
└── utils.ts                         # 유지
```

| 항목                             | 액션                  | 우선순위 | 영향 범위                                                             |
| -------------------------------- | --------------------- | :------: | --------------------------------------------------------------------- |
| `lib/ai/` 디렉토리 생성          | AI 11파일 + mock 이동 |   중간   | import 경로 ~50개 파일 변경                                           |
| `models.server.ts` 추가          | AI 모델명 상수 중앙화 |   중간   | [AI 중복 최소화 전략 §3.6](project-studio-ai-optimization.md) 연동    |
| `context-builder.server.ts` 추가 | 공유 컨텍스트 빌더    |   중간   | [AI 중복 최소화 전략 §3.6](project-studio-ai-optimization.md) Phase A |

> **참고**: 이 리팩토링은 [Studio 고도화 Phase 1H (AI 서비스 통합)](studio-enhancement-plan.md)과 동시에 진행하면 import 변경을 한 번만 수행할 수 있음.

---

### 2.3 app/features/\*\*/api/ 폴더

#### 현황 — project/api/ (5개)

| 파일 | 라우트 | HTTP | Auth | AI 호출 | 응답 | 주요 동작 |
|------|--------|------|:---:|:---:|------|---------|
| `ideas.ts` | `/api/ideas` | GET, POST, PATCH, DELETE | O | 간접 | JSON | Idea CRUD + AI 추천 생성/갱신/검색/저장/사용 (POST intent 분기) |
| `generate-ideas.ts` | `/api/generate-ideas` | POST | **X** | 간접 | JSON | 트렌드 기반 AI 아이디어 생성 |
| `trend-bookmark.ts` | `/api/trend-bookmark` | GET, POST, DELETE | O | 없음 | JSON | 트렌드 북마크 조회/저장/해제 |
| `generate-project-context.ts` | `/api/generate-project-context` | GET (preview), POST (실행) | O | 직접 | JSON | GET: AI 프롬프트 미리보기, POST: 프로젝트 컨텍스트 AI 생성 |
| `youtube-oauth.ts` | `/api/youtube-oauth` | GET (callback), POST (시작) | O | YouTube API | Redirect/JSON | POST: OAuth URL 생성→리다이렉트, GET: 토큰 교환→채널 저장 |

#### 현황 — studio/api/ (11개)

| 파일 | 라우트 | HTTP | Auth | AI 호출 | 응답 | 주요 동작 |
|------|--------|------|:---:|:---:|------|---------|
| `studio-projects.ts` | `/api/studio/projects` | GET | O | 없음 | JSON | StudioProjectSelector용 프로젝트 목록 |
| `generate-script-stream.ts` | `/api/studio/generate-script-stream` | POST | O | 직접 (Gemini) | **SSE** | 스크립트 세그먼트 스트리밍 생성 → DB 저장 |
| `generate-storyboard-stream.ts` | `/api/studio/generate-storyboard-stream` | POST | O | 직접 (Gemini) | **SSE** | 스토리보드 씬 스트리밍 생성 → DB 저장 |
| `generate-scene-image.ts` | `/api/studio/generate-scene-image` | POST | O | 직접 (Imagen) | JSON | 씬 이미지 AI 생성 → Storage 업로드 → media_asset 연결 |
| `trendtube-generate-stream.ts` | `/api/studio/trendtube-generate-stream` | POST | O | 직접 (다중) | **SSE** | **@deprecated** — 7단계 파이프라인 일괄 실행 |
| `trendtube-step-trends.ts` | `/api/studio/trendtube-step-trends` | POST | O | 직접 (Gemini) | JSON | Step 1: 세션 생성 + YouTube 트렌드 추출 |
| `trendtube-step-ideas.ts` | `/api/studio/trendtube-step-ideas` | POST | O | 직접 (Gemini) | JSON | Step 2: 추출된 트렌드에서 영상 아이디어 생성 |
| `trendtube-step-media.ts` | `/api/studio/trendtube-step-media` | POST | O | 직접 (Veo3+Lyria+TTS) | **SSE** | Step 3: 비디오/음악/내레이션 병렬 생성 |
| `trendtube-step-compose.ts` | `/api/studio/trendtube-step-compose` | POST | O | FFmpeg | JSON | Step 4: 미디어 합성 → 최종 비디오 |
| `trendtube-session-status.ts` | `/api/studio/trendtube-session-status` | POST | O | 없음 | JSON | 세션 진행 상태 조회 (resume/retry용) |

#### 일관성 평가: 9/10

| 패턴 | 일관성 | 설명 |
|------|:---:|------|
| 파일 명명 | O | kebab-case, 동사-목적어 형식 |
| 인증 패턴 | **△** | 15개 중 14개 `requireAuth()` — `generate-ideas.ts`에 **인증 누락** |
| 응답 형식 | O | plain object 반환 (`json()` 미사용) |
| 스트리밍 규칙 | O | SSE 파일은 `-stream.ts` 접미사 |
| HTTP 메서드 | O | `loader` = GET, `action` = POST/PATCH/DELETE |
| routes.ts 등록 | O | `prefix("api", [...])` 하위에 일관 등록 |
| Data layer 사용 | **△** | `generate-scene-image.ts`에서 DB 직접 쿼리 (`db`, `schema` import) |

#### 발견된 이슈

| # | 이슈 | 위치 | 심각도 |
|---|------|------|:---:|
| 1 | **인증 누락** — `requireAuth()` 없음, 비인증 사용자 호출 가능 | `generate-ideas.ts` | 높음 |
| 2 | **Data layer 우회** — `db`, `schema`, `eq` 직접 import로 storyboard 조회 | `generate-scene-image.ts` | 중간 |
| 3 | **deprecated API 유지** — 단계별 API로 완전 대체됨 | `trendtube-generate-stream.ts` | 낮음 |

#### 제안

| 항목 | 액션 | 우선순위 |
|------|------|:---:|
| 인증 추가 | `generate-ideas.ts` action에 `requireAuth(request)` 1줄 추가 | **높음** |
| Data layer 이동 | `generate-scene-image.ts`의 storyboard 직접 쿼리 → `studio.data.server.ts`에 `getStoryboardScene()` 함수 추가 | 중간 |
| deprecated API 제거 | `trendtube-generate-stream.ts` + routes.ts 라우트 삭제 | 낮음 |
| 현재 구조 유지 | 폴더 구조 자체는 추가 리팩토링 불필요 | - |

---

### 2.4 hooks 통합 → `features/studio/hooks/`

#### 변경 사항

`app/hooks/use-media-query.ts`를 `features/studio/hooks/`로 이동하고 `app/hooks/` 디렉토리를 제거한다.

**근거**: 프로젝트 전체에 훅 2개만 존재하며, 둘 다 studio feature에서만 사용됨. Feature-based architecture 원칙에 따라 studio 내부로 통합.

```
# 변경 전
app/hooks/use-media-query.ts                         → studio-layout.tsx (1곳)
app/features/studio/hooks/use-trendtube-pipeline.ts  → studio-dashboard-page.tsx (1곳)

# 변경 후
app/features/studio/hooks/use-media-query.ts         ← 이동 (import 경로 1개 변경)
app/features/studio/hooks/use-trendtube-pipeline.ts  ← 유지
(app/hooks/ 디렉토리 제거)
```

#### 통합 후 구조

| 파일 | 크기 | 사용처 |
|------|------|--------|
| `features/studio/hooks/use-media-query.ts` | 481B | `studio/layouts/studio-layout.tsx` |
| `features/studio/hooks/use-trendtube-pipeline.ts` | 11.9KB | `studio/pages/studio-dashboard-page.tsx` |

> **원칙**: 향후 여러 feature에서 공유하는 훅이 생기면 그때 `common/hooks/` 디렉토리 생성

---

### 2.5 app/drizzle, app/common/data, app/supa-client.ts

#### 2.5.1 app/drizzle/ — 스키마 관리 구조

**현재 아키텍처**:

```
features/**/schema.ts (스키마 정의) ──┐
                                      ├──→ drizzle/index.ts (집계 re-export)
drizzle/enums.ts (enum 중앙 정의) ────┘          │
                                                  ▼
                                         lib/db.server.ts (Drizzle client)
                                                  │
                                                  ▼
                                         common/data/*.data.server.ts (CRUD)
```

| 파일                        | 역할                                                 |   상태    |
| --------------------------- | ---------------------------------------------------- | :-------: |
| `drizzle/index.ts`          | feature 스키마 집계 + enum re-export                 |   양호    |
| `drizzle/enums.ts`          | 모든 PostgreSQL enum 중앙 정의 (203줄)               |   양호    |
| `drizzle/schema-def.ts`     | `tubegaiSchema` 래퍼 (`pgTable`, `pgEnum` re-export) | 검토 필요 |
| `drizzle/enable-rls.ts/sql` | RLS 정책 스크립트                                    |   양호    |
| `drizzle/triggers/`         | 빈 디렉토리                                          | 삭제 대상 |

**`schema-def.ts` 분석**:

```typescript
// 124 bytes — pgTable/pgEnum를 tubegaiSchema 객체로 래핑
export const tubegaiSchema = { table: pgTable, enum: pgEnum };
```

- 모든 feature schema에서 `tubegaiSchema.table()` 대신 `pgTable`을 직접 import 가능
- 단, 이 래퍼가 향후 schema prefix 변경 등 확장 포인트로 사용될 가능성 있어 유지 권장

**enum 중앙화 평가**:

- feature별로 분산하면 cross-feature 참조 시 순환 import 위험
- 현재 중앙 관리가 적절한 선택

#### 2.5.2 app/common/data/ — 데이터 레이어

| 파일                       |   줄 수   | 담당 영역                              |
| -------------------------- | :-------: | -------------------------------------- |
| `project.data.server.ts`   |    672    | Project CRUD, 페이지네이션, 검색, 통계 |
| `idea.data.server.ts`      |    754    | Idea CRUD, AI 추천, 만료 정리          |
| `youtube.data.server.ts`   |    811    | YouTube API, 트렌드 캐싱(15분), 북마크 |
| `studio.data.server.ts`    |    662    | Script/Storyboard/Video CRUD           |
| `channel.data.server.ts`   |    330    | YouTube 채널 CRUD, OAuth 토큰          |
| `trendtube.data.server.ts` |    292    | TrendTube 세션/결과/미디어             |
| `media.data.server.ts`     |    134    | 미디어 에셋 CRUD                       |
| **합계**                   | **3,655** |                                        |

**패턴 일관성**:

- 모든 파일이 `{ db, schema }` from `~/lib/db.server` import
- 타입은 `~/common/types/*.types` import
- CRUD 함수 명명: `getX()`, `createX()`, `updateX()`, `deleteX()`

**Feature 분산 vs 중앙 집중 비교**:

| 기준                 | 중앙 (`common/data/`) | Feature 분산 (`features/*/data/`) |
| -------------------- | :-------------------: | :-------------------------------: |
| Cross-feature 쿼리   |         쉬움          |         순환 import 위험          |
| 파일 위치 파악       |     항상 같은 곳      |         feature별로 분산          |
| Feature 독립성       |         낮음          |               높음                |
| 현재 코드와의 정합성 |         일치          |         대규모 이동 필요          |

**결론**: 현재 프로젝트 규모(7개 파일, 3,655줄)에서는 중앙 집중이 적절. Feature 분산은 데이터 레이어가 10개+로 증가하거나, feature 간 경계가 명확해질 때 재검토.

#### 2.5.3 app/supa-client.ts — 레거시 파일

**`supa-client.ts`** (10줄):

```typescript
import { createClient } from "@supabase/supabase-js";
const client = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);
export default client;
```

**사용처**: `features/project/queries.ts` 에서만 import

**`queries.ts`** (24줄):

```typescript
import client from "~/supa-client";
export const getChannels = async () => { ... };  // 미사용
export const getProjects = async () => { ... };  // 미사용
```

**전체 코드베이스에서 `queries.ts` import 없음** — 두 파일 모두 dead code.

**현재 Supabase 클라이언트 체계**:

| 파일                          | 용도                                          |        사용 여부         |
| ----------------------------- | --------------------------------------------- | :----------------------: |
| `lib/db.server.ts`            | Drizzle ORM (주 데이터 접근)                  | 모든 data layer에서 사용 |
| `lib/auth.server.ts`          | Supabase SSR 서버 클라이언트 (쿠키 기반 인증) |     모든 인증 라우트     |
| `lib/auth.client.ts`          | Supabase 브라우저 클라이언트 (OAuth, 세션)    |     클라이언트 인증      |
| `lib/youtube-oauth.client.ts` | YouTube OAuth 브라우저 클라이언트             |       YouTube 연동       |
| **`supa-client.ts`**          | **기본 Supabase 클라이언트 (쿠키 미지원)**    |   **미사용 (레거시)**    |

#### 제안

| 항목                               | 액션                                   | 우선순위 |
| ---------------------------------- | -------------------------------------- | :------: |
| `supa-client.ts` 삭제              | dead code 제거                         |   높음   |
| `features/project/queries.ts` 삭제 | dead code 제거                         |   높음   |
| `drizzle/triggers/` 삭제           | 빈 디렉토리 제거                       |   낮음   |
| `common/data/` 구조 유지           | 현재 규모에서 적절                     |    -     |
| `drizzle/` 구조 유지               | enum 중앙화 + feature schema 패턴 유지 |    -     |

---

### 2.6 .react-router/types vs common/types

#### .react-router/types/ — 프레임워크 자동생성 타입

React Router v7이 빌드 시 자동 생성. 각 라우트 파일에 대응하는 타입 파일 생성:

```
.react-router/types/app/features/studio/pages/+types/studio-script-page.ts
```

각 파일이 제공하는 타입:

```typescript
export namespace Route {
  export type LoaderArgs = { request: Request; params: { projectId: string }; };
  export type ActionArgs = { ... };
  export type ComponentProps = { loaderData: { ... }; };  // loader 반환 타입 자동 추론
}
```

**용도**: 라우트 모듈의 `loader`, `action`, 컴포넌트 props 타입만 제공. 라우트 파일에서만 사용.

#### common/types/ — 비즈니스 도메인 타입

| 파일                 | 줄 수 | 타입 카테고리                                       | 사용처                      |
| -------------------- | :---: | --------------------------------------------------- | --------------------------- |
| `project.types.ts`   |  113  | 도메인 모델 (Project, Channel, Label, TrendItem)    | data layer, API, components |
| `ideation.types.ts`  | ~280  | Idea, IdeaTrend, IdeaFilter, IdeationOptions        | data layer, API, hooks      |
| `studio.types.ts`    | ~120  | ScriptSegment, StoryboardScene, SceneVideo          | data layer, API, components |
| `trendtube.types.ts` | ~180  | TrendTubeInput, Results, PipelineStep               | data layer, API, hooks      |
| `trend.types.ts`     | ~160  | TrendSnapshot, ScriptGuidelines, TrendFilterOptions | data layer, AI services     |
| `youtube.types.ts`   |  65   | YouTubeVideoItem, YouTubeVideoSnippet               | YouTube API 연동            |
| `channel.types.ts`   |  69   | Channel, CreateChannelInput, UpdateChannelInput     | data layer, API             |
| `shared.types.ts`    |  22   | Color, ImageAsset                                   | 공용                        |

**용도**: DB 도메인 모델, API 계약(input/output), 외부 API 응답 타입, UI 상태 타입. **라우트 외 코드** (lib/, common/data/, hooks/, components/)에서 주로 사용.

#### 비교 결론

| 기준      |              .react-router/types               |                 common/types                 |
| --------- | :--------------------------------------------: | :------------------------------------------: |
| 생성 방식 |               빌드 시 자동 생성                |                  수동 정의                   |
| 내용      | 라우트 인터페이스 (LoaderArgs, ComponentProps) |             비즈니스 도메인 모델             |
| 사용 범위 |            라우트 파일(.tsx)에서만             | data layer, API, lib, hooks, components 전반 |
| 중복 여부 |                    **없음**                    |                   **없음**                   |

**결론**: 두 타입 시스템은 **완전히 다른 목적**을 가지며 중복이 없음. `common/types/`는 프레임워크와 무관한 비즈니스 타입을 정의하므로 **유지 필요**.

---

### 2.7 사용하지 않는 임시 파일 검토

#### Dead Code

| 파일 | 유형 | 근거 | 제안 |
|------|------|------|------|
| `app/supa-client.ts` | 레거시 클라이언트 | import 없음 | **삭제** |
| `app/features/project/queries.ts` | 레거시 쿼리 | import 없음, Drizzle로 대체됨 | **삭제** |
| `app/lib/youtube-oauth.client.ts` | 미사용 가능성 | import하는 파일 없음 (확인 필요) | **확인 후 삭제** |
| `app/drizzle/triggers/` | 빈 디렉토리 | 파일 없음 | **삭제** |

#### Deprecated 코드 (아직 참조 있음)

| 파일/항목 | 위치 | 상태 | 제안 |
|----------|------|------|------|
| `GeneratedIdea` interface | `ideation.types.ts:124` | `@deprecated` — Idea 타입으로 대체됨 | 참조 제거 후 삭제 |
| `SavedIdea` interface | `ideation.types.ts:139` | `@deprecated` — Idea 타입으로 대체됨 | 참조 제거 후 삭제 |
| `AIRecommendation` interface | `project.types.ts:98` | `@deprecated` — Idea 타입으로 대체됨 | 참조 제거 후 삭제 |
| `trendtube-generate-stream.ts` | `studio/api/` | `@deprecated` — 단계별 API로 분리됨 | routes.ts 등록 해제 후 삭제 |

#### 보안 이슈

| 파일 | 이슈 | 심각도 | 제안 |
|------|------|:---:|------|
| `generate-ideas.ts` | `requireAuth()` 누락 — 비인증 사용자 AI 호출 가능 | **높음** | `action` 첫 줄에 `requireAuth(request)` 추가 |

#### 일관성 이슈

| 파일 | 이슈 | 심각도 | 제안 |
|------|------|:---:|------|
| `generate-scene-image.ts` | Data layer 우회 — `db`, `schema`, `eq` 직접 import로 storyboard 조회 | 중간 | `studio.data.server.ts`에 `getStoryboardScene()` 추가 |

#### GEMINI_MOCK 패턴 (정상 사용 중)

`__mocks__/ai-fixtures.ts`는 8개 AI 서비스 파일에서 `process.env.GEMINI_MOCK === "true"` 조건으로 사용됨. 개발 시 API 비용 절감을 위한 **정상적 패턴**으로 유지.

#### TODO 코멘트

| 위치                        | 내용                                                              | 상태             |
| --------------------------- | ----------------------------------------------------------------- | ---------------- |
| `youtube-api.server.ts:354` | `TODO: Implement video upload using YouTube Resumable Upload API` | 향후 기능 — 정상 |

---

## 3. 리팩토링 우선순위 요약

### 긴급 (보안)

| #   | 항목 | 파일 | 변경 범위 | 비고 |
| --- | ---- | ---- | --------- | ---- |
| 1   | **`generate-ideas.ts` 인증 추가** | `features/project/api/generate-ideas.ts` | 1줄 추가 | 비인증 사용자 AI 호출 차단 (§2.3) |

### 즉시 실행 (낮은 노력, 높은 가치)

| #   | 항목 | 파일 | 영향 |
| --- | ---- | ---- | ---- |
| 2   | `supa-client.ts` 삭제 | 1개 파일 | 없음 (dead code) |
| 3   | `queries.ts` 삭제 | 1개 파일 | 없음 (dead code) |
| 4   | `drizzle/triggers/` 삭제 | 빈 디렉토리 | 없음 |
| 5   | `youtube-oauth.client.ts` 확인 후 삭제 | 1개 파일 | import 없음 — 미사용 확인 필요 (§2.7) |

### 단기 (낮은 노력)

| #   | 항목 | 변경 범위 | 비고 |
| --- | ---- | --------- | ---- |
| 6   | `generate-scene-image.ts` data layer 이동 | `studio.data.server.ts`에 함수 추가 + 직접 쿼리 제거 | Data layer 일관성 확보 (§2.3) |
| 7   | `use-media-query.ts` → `features/studio/hooks/`로 이동 | import 1개 변경 | `app/hooks/` 제거 |
| 8   | `scripts/verify-ai-models.ts` package.json 등록 | 1줄 추가 | - |
| 9   | deprecated `trendtube-generate-stream.ts` 제거 | routes.ts + 1파일 | 하위 호환 확인 후 |

### 중기 (Studio 고도화와 연동)

| #   | 항목 | 변경 범위 | 연동 Phase |
| --- | ---- | --------- | ---------- |
| 10  | `lib/ai/` 서브디렉토리 분리 | ~50개 파일 import 변경 | [Studio 고도화 Phase 1H](studio-enhancement-plan.md) |
| 11  | deprecated 타입 정리 (3개 interface) | type 파일 + 참조처 | - |
| 12  | AI 모델 레지스트리 중앙화 | `lib/ai/models.server.ts` 신규 | [AI 중복 최소화 Phase A](project-studio-ai-optimization.md) |
| 13  | retry 미적용 AI 서비스 보완 | `ai-video`, `ai-music`, `tts` 3개 파일 | `withRetry()` 래핑 추가 (§2.2) |

### 보류 (현재 적절)

| 항목 | 현재 상태 | 재검토 시점 |
| ---- | --------- | ----------- |
| `common/data/` feature 분산 | 7파일, 중앙 집중 적절 | 데이터 레이어 10개+ 도달 시 |
| `drizzle/enums.ts` feature 분산 | 중앙 관리 적절 | 순환 import 없는 한 유지 |
| `common/types/` feature 분산 | cross-feature 참조 빈번 | feature 간 경계 강화 시 |
| API 폴더 구조 | 일관성 9/10 | 변경 불필요 |

---

## 4. 기존 문서와의 관계

본 문서는 **코드 구조 (폴더/파일 조직)**에 초점을 맞추며, 기능적 개선 사항은 아래 문서에서 다룸:

| 문서                                                     | 범위                                                                  | 본 문서와의 교차점                                   |
| -------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| [Studio 고도화 계획](studio-enhancement-plan.md)         | Studio/TrendTube 파이프라인 기능 개선, DB 스키마 재설계, AI 모델 교체 | `lib/ai/` 구조 개선 (Phase 1H)                       |
| [AI 중복 최소화 전략](project-studio-ai-optimization.md) | Project-Studio 간 AI 생성 중복 제거, 역할 재정의, 비용 절감           | AI 서비스 통합 (Phase A), 모델 레지스트리 (Phase 1H) |

---

**작성일**: 2026-02-16
