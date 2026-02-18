# CLAUDE.md

## 빠른 참조

```bash
npm run dev          # 개발 서버 (포트 3000)
npm run build        # 프로덕션 빌드
npm run typecheck    # 타입 체크
npm run lint         # Lint 체크 (Tailwind CSS 4 포함)
npm run db:generate  # 마이그레이션 생성
npm run db:migrate   # 마이그레이션 적용
```

## 기술 스택

| 영역      | 기술                                          |
| --------- | --------------------------------------------- |
| Framework | React Router v7 + Vite (SSR)                  |
| Styling   | Tailwind CSS 4 + Shadcn UI                    |
| Forms     | React Hook Form + Zod                         |
| Database  | PostgreSQL + Drizzle ORM + Supabase           |
| Storage   | Supabase Storage (`media` 버킷)               |
| AI        | Google Gemini (텍스트/이미지/비디오/음악/TTS) |
| UI 언어   | 한국어 전용 (하드코딩)                        |

### AI 모델 레지스트리

```typescript
// 목표: app/lib/ai/models.server.ts (중앙 관리)
const AI_MODELS = {
  text: { primary: "gemini-2.5-flash", lite: "gemini-2.5-flash-lite" },
  image: { primary: "gemini-3-pro-image-preview" },
  video: { primary: "veo-3.1-generate-preview" }, // 1회 최대 8초
  music: { primary: "lyria-realtime-exp" },
};
```

| 용도                       | 모델                         | SDK                       | 서비스 파일                                      |
| -------------------------- | ---------------------------- | ------------------------- | ------------------------------------------------ |
| Script / Storyboard 텍스트 | `gemini-2.5-flash`           | `@google/generative-ai`   | `ai-script.server.ts`, `ai-storyboard.server.ts` |
| Project AI Generator       | `gemini-2.5-flash-lite`      | `@google/generative-ai`   | `ai-project-generator.server.ts`                 |
| Scene 이미지 생성          | `gemini-3-pro-image-preview` | `@google/generative-ai`   | `ai-image.server.ts`                             |
| Scene 비디오 생성          | `veo-3.1-generate-preview`   | `@google/genai`           | `ai-video.server.ts`                             |
| 배경음악 생성              | `lyria-realtime-exp`         | `@google/genai` (v1alpha) | `ai-music.server.ts`                             |
| TTS 내레이션               | Google Cloud TTS             | HTTP REST                 | `tts.server.ts`                                  |
| TrendTube 텍스트           | `gemini-2.5-flash` / `-lite` | `@google/generative-ai`   | `ai-trendtube.server.ts`                         |
| Idea 추천                  | `gemini-2.5-flash`           | `@google/generative-ai`   | `ai.server.ts`                                   |

## 프로젝트 구조

```
app/
├── features/           # 기능별 모듈
│   ├── auth/           # 인증 (schema, pages)
│   ├── project/        # 프로젝트 관리 (schema, api, components, pages)
│   ├── studio/         # 영상 제작 (schema ×2, api, components, hooks, pages)
│   ├── trend/          # 트렌드 (schema)
│   ├── product/        # 상품 페이지 (pages)
│   ├── settings/       # 설정 (Phase 2+, 비활성)
│   └── audit/          # 감사 로그 (schema)
│
├── common/
│   ├── components/ui/  # Shadcn UI (40개+)
│   ├── data/           # 데이터 레이어 (7개 *.data.server.ts)
│   ├── types/          # 도메인 타입 (8개 *.types.ts)
│   ├── constants/      # 상수 (colors, images)
│   └── pages/          # 공유 페이지 (home)
│
├── drizzle/
│   ├── index.ts        # 전체 스키마 집계 (re-export)
│   ├── enums.ts        # 모든 PostgreSQL enum 중앙 정의
│   ├── schema-def.ts   # tubegaiSchema 래퍼
│   ├── enable-rls.ts   # RLS 정책 스크립트
│   └── migrations/     # 마이그레이션 SQL
│
├── lib/                # 유틸리티, AI 서비스, 인증, DB 클라이언트
│   ├── ai-*.server.ts  # AI 서비스 (11개)
│   ├── gemini-*.server.ts  # Gemini 클라이언트 + retry
│   ├── tts.server.ts   # Google Cloud TTS
│   ├── auth.server.ts / auth.client.ts  # 인증
│   ├── youtube-*.server.ts  # YouTube API + OAuth
│   ├── db.server.ts    # Drizzle ORM 클라이언트
│   ├── supabase-storage.server.ts  # Storage 유틸리티
│   ├── video-composer.server.ts    # FFmpeg 합성
│   ├── utils.ts        # cn() 유틸리티
│   └── __mocks__/ai-fixtures.ts    # GEMINI_MOCK용 mock 데이터
│
└── routes.ts           # 라우트 설정
```

### 목표 구조 (리팩토링 시)

AI 11개 파일 → `lib/ai/` 서브디렉토리 분리 예정 (Studio 고도화 Phase 1H와 동시 실행):

```
lib/ai/
├── models.server.ts             # AI_MODELS 상수 레지스트리 (신규)
├── context-builder.server.ts    # 공유 컨텍스트 빌더 (신규)
├── client.server.ts             # ← gemini-client.server.ts
├── retry.server.ts              # ← gemini-retry.server.ts
├── script.server.ts             # ← ai-script.server.ts
├── storyboard.server.ts         # ← ai-storyboard.server.ts
├── image.server.ts              # ← ai-image.server.ts
├── video.server.ts              # ← ai-video.server.ts
├── music.server.ts              # ← ai-music.server.ts
├── trendtube.server.ts          # ← ai-trendtube.server.ts
├── project-generator.server.ts  # ← ai-project-generator.server.ts
├── tts.server.ts                # ← tts.server.ts
└── __mocks__/fixtures.ts
```

---

## 아키텍처

### 도메인 역할 분리

| 도메인        | 역할                             | AI 생성 필드                                                                                 |
| ------------- | -------------------------------- | -------------------------------------------------------------------------------------------- |
| **Project**   | 기획 + 컨텍스트 관리             | title, description, targetAudience, estimatedViews, suggestedTone, suggestedDifficulty (6개) |
| **Studio**    | 프로덕션 콘텐츠 생성 (세션 기반) | hooks, scriptGuidelines, seoKeywords (Pre-Production) + 전체 대본, 스토리보드, 미디어        |
| **TrendTube** | 트렌드 기반 빠른 영상 생성       | 트렌드 분석, 아이디어, 미디어 (Studio 재활용 가능)                                           |

> **원칙**: Project는 기획 메타데이터만, 프로덕션 가이드(hooks, scriptGuidelines, keywords)는 Studio Pre-Production에서 생성

### Studio Pipeline

```
[Studio 진입] → studio_session 생성
  │
  ├── [Pre-Production] (신규 — studio_script에 저장)
  │    AI 생성: hooks[], scriptGuidelines, seoKeywords[]
  │    입력: Project 메타데이터 + 채널 정보 + 트렌드 스냅샷
  │
  ├── [Step 1: Script]
  │    AI: gemini-2.5-flash
  │    출력: 5개 세그먼트 (hook/intro/body/cta/outro)
  │    메타데이터 전체 저장: type, content, duration, visualNotes,
  │                         emotionalTone, keywords[], sceneHints
  │
  ├── [Step 2: Storyboard + Scene 이미지]
  │    AI 텍스트: gemini-2.5-flash (SSE 스트리밍)
  │    AI 이미지: gemini-3-pro-image-preview (Scene별 순차, 참조 체이닝)
  │    입력: Script 전체 메타데이터 (content 300자 + duration + visualNotes + emotionalTone + sceneHints)
  │
  ├── [Step 3: Scene Video]
  │    AI: veo-3.1-generate-preview (8초 클립 × N)
  │    참조 체이닝: Step 2 이미지 + 이전 클립 → inlineData 전달
  │    클립 분할: Scene duration ÷ 8 (올림)
  │
  ├── [Step 4: B-Roll]
  │    Script keywords[] 직접 사용 (AI 추가 호출 없음)
  │    외부 API: Pexels / Pixabay
  │
  └── [Step 5: Rough Cut] (Phase 2)
       Scene Video + B-Roll + TrendTube 미디어 배치
```

### 세션 기반 관리

Studio와 TrendTube 모두 **세션 패턴** 사용:

| 동작      | Studio (개선 후)               | TrendTube (기존)            |
| --------- | ------------------------------ | --------------------------- |
| 생성      | 새 `studio_session` 생성       | 새 `trendtube_session` 생성 |
| 재생성    | 기존 세션 `archived` → 새 세션 | 새 세션 생성 (이전 보존)    |
| 이전 결과 | archived 세션 조회             | 세션 이력 조회              |
| 롤백      | archived → active 전환         | 세션 선택                   |

```
project
 ├── studio_session (1:N)        # active 1개만 (partial unique index)
 │    ├── studio_script (1:1)
 │    │    └── studio_script_segment (1:N)
 │    ├── studio_storyboard (1:N)
 │    │    └── studio_video (1:1)
 │    │         └── studio_video_part (1:N)  # 8초 클립 단위
 │    └── (Phase 2+) studio_b_roll, rough_cut_timeline
 │
 ├── trendtube_session (1:N)     # 기존 패턴 유지
 │    ├── trendtube_result (1:1)
 │    └── trendtube_media (1:N) → media_asset
 │
 └── media_asset (1:N)           # 통합 미디어 자산 저장소
```

### TrendTube ↔ Studio 연계

- `trendSnapshot` 재사용: Project에 저장된 트렌드 정보 → TrendTube Step 1 AI 호출 생략
- `narrationScript` 가져오기: TrendTube 결과 → Studio Script import (`source_trendtube_session_id` FK)
- 미디어 재활용: TrendTube 생성 미디어 → Studio B-Roll/오디오 트랙

### Veo 3 영상 생성 제약

- **1회당 최대 8초** 클립 생성
- Scene duration > 8초 → 8초 단위 클립 분할 (올림)
- 참조 체이닝: 이전 Scene 이미지 → `inlineData` (base64 Buffer), 이전 클립 → Veo `video` 파라미터
- **Gemini 이미지 생성은 `inlineData` 전용** — `fileUri`(URL)는 이미지 생성 모드에서 미지원

---

## 핵심 패턴

### React Router v7

**IMPORTANT**: This is NOT Remix. NEVER import from `@remix-run/*`.

```typescript
import type { Route } from "./+types/page-name";

// loader/action: plain object 반환 (json() 사용 금지)
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  return { data };
}

// 컴포넌트: loaderData props 직접 접근 (useLoaderData() 사용 금지)
export default function Page({ loaderData }: Route.ComponentProps) {
  const { data } = loaderData;
}
```

- `useFetcher`: 비동기 폼 제출, API 호출에 사용
- 라우트 설정: [routes.ts](app/routes.ts) 참조

### 데이터 레이어

```typescript
// app/common/data/*.data.server.ts
import { db, schema } from "~/lib/db.server";
import { eq } from "drizzle-orm";

export async function getProject(id: string) {
  return db.query.projects.findFirst({
    where: eq(schema.projects.id, id),
    with: { owner: true },
  });
}
```

- **API 라우트에서 DB 직접 쿼리 금지** — 반드시 `common/data/*.data.server.ts`를 통해 접근
- 타입은 `common/types/*.types.ts`에서 import

### 인증

```typescript
// 서버 (app/lib/auth.server.ts)
const userId = await requireAuth(request); // 필수 인증
const userId = await getCurrentUserId(request); // 선택적 인증

// 클라이언트 (app/lib/auth.client.ts)
import {
  signInWithEmail,
  signInWithGitHub,
  signInWithGoogle,
} from "~/lib/auth.client";
```

**모든 API action에 `requireAuth(request)` 필수** — 인증 누락 금지

### AI 서비스

```typescript
// Gemini 클라이언트 (app/lib/gemini-client.server.ts)
import { getGeminiClient, getTextModel } from "~/lib/gemini-client.server";

// retry 래퍼 (app/lib/gemini-retry.server.ts)
import { withRetry } from "~/lib/gemini-retry.server";

// 개발 시 Mock 패턴
if (process.env.GEMINI_MOCK === "true") {
  return MOCK_DATA; // app/lib/__mocks__/ai-fixtures.ts
}
```

- **모든 AI 서비스에 `withRetry()` 적용** (비디오/음악/TTS 포함)
- **모델명은 `AI_MODELS` 상수 참조** (하드코딩 금지)
- Gemini API 공식 문서: <https://ai.google.dev/gemini-api/docs?hl=ko>

### Supabase Storage

```typescript
// app/lib/supabase-storage.server.ts
import { uploadProjectMedia } from "~/lib/supabase-storage.server";
```

**경로 구조**:

```
media/                                              (버킷)
└── projects/{projectId}/
     ├── studio/{sessionId}/
     │    ├── storyboard/scene-{N}_{timestamp}.png   (Step 2 이미지)
     │    └── scene-video/scene-{N}_{timestamp}.mp4  (Step 3 비디오)
     └── trendtube/{sessionId}/
          ├── video_{timestamp}.mp4
          ├── music_{timestamp}.wav
          ├── voiceover_{timestamp}.mp3
          └── composited_{timestamp}.mp4
```

- 세션 기반 경로 → Script 재생성 시 이전 세션 파일 자동 보존
- 모든 미디어 → `media_asset` 테이블 FK 연결

---

## UI & 스타일

### Shadcn UI

Radix 직접 import 금지. 항상 Shadcn 컴포넌트 사용:

```typescript
import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardHeader } from "~/common/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
} from "~/common/components/ui/form";
```

### Tailwind CSS 4

**시맨틱 토큰 사용** (raw 색상 금지):

| 용도   | 토큰                                       |
| ------ | ------------------------------------------ |
| 배경   | `bg-background`, `bg-card`, `bg-muted`     |
| 텍스트 | `text-foreground`, `text-muted-foreground` |
| 테두리 | `border-border`, `border-input`            |
| 강조   | `bg-primary`, `text-primary-foreground`    |

**v3 → v4 클래스명 변경**:

| v3 (금지)           | v4 (사용)       |
| ------------------- | --------------- |
| `flex-shrink-0`     | `shrink-0`      |
| `flex-grow`         | `grow`          |
| `overflow-ellipsis` | `text-ellipsis` |

**금지**: Arbitrary values (`w-[140px]`, `text-[14px]`)

**cn() 유틸리티**: `import { cn } from "~/lib/utils";`

- 어플리케이션 전체에 일관된 UX 사용자 경험을 제공

---

## 데이터베이스

### 스키마 정의

모든 테이블은 `public` 스키마 사용 (`tubegai` 스키마 금지):

```typescript
import { tubegaiSchema } from "~/drizzle/schema-def";

export const projects = tubegaiSchema.table("project", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

- Enum 정의: [app/drizzle/enums.ts](app/drizzle/enums.ts) (중앙 관리)
- 스키마 파일: 각 feature 내 `*-schema.ts`에 정의 → [drizzle/index.ts](app/drizzle/index.ts)에서 집계
- 마이그레이션 SQL: 항상 `public.table_name` 형식 사용
- **RLS 정책**: Supabase Dashboard에서 관리 (Drizzle 마이그레이션 금지)

### 목표 데이터 관계도

```
project
 ├── studio_session (1:N) ← 세션 기반 관리 (active 1개, archived N개)
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
 │    │    ├── [신규] sessionId, emotionalTone, cameraAngle
 │    │    └── studio_video (1:1)
 │    │         └── studio_video_part (1:N) ← 8초 클립 단위
 │    │              └── videoAssetId → media_asset
 │    │
 │    └── (Phase 2+) studio_b_roll, studio_rough_cut_timeline
 │
 ├── trendtube_session (1:N) ← 기존 패턴 유지
 │    ├── trendtube_result (1:1)
 │    └── trendtube_media (1:N)
 │         ├── mediaAssetId → media_asset (Storage 전환 후 NOT NULL)
 │         └── [신규] prompt, clipNumber
 │
 ├── media_asset (1:N) ← 통합 미디어 자산 저장소 (Supabase Storage)
 ├── project_label (N:M) → label
 └── idea → idea_trend (N:M) → trend
```

### 핵심 스키마 변경 (고도화)

| 변경            | 테이블                                      | 상세                                                                     |
| --------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| **신규**        | `studio_session`                            | 프로젝트당 active 세션 1개 (partial unique index)                        |
| **수정**        | `studio_script`                             | `projectId` UNIQUE 제거, `sessionId` FK 추가, Pre-Production 필드 추가   |
| **수정**        | `studio_script_segment`                     | `visualNotes`, `emotionalTone`, `keywords[]`, `sceneHints` 4개 컬럼 추가 |
| **수정**        | `studio_storyboard`                         | `sessionId`, `emotionalTone`, `cameraAngle` 추가                         |
| **수정**        | `studio_video`                              | `sessionId` 추가                                                         |
| **수정**        | `trendtube_media`                           | `prompt`, `clipNumber` 추가                                              |
| **제거**        | `project.tone`                              | `contentTone`으로 통합 (cinematic→dramatic, vlog→casual)                 |
| **제거**        | `project.basedOnTrendId`                    | `basedOnTrendUuid` (UUID)로 대체 완료                                    |
| **제거**        | `studio_coloring_preset/setting`            | Dead Code (FFmpeg 컬러 그레이딩 비현실적)                                |
| **제거**        | `projectToneEnum`                           | `contentToneEnum`으로 통합                                               |
| **@deprecated** | `project.hooks`, `project.scriptGuidelines` | Studio Pre-Production으로 이동 예정                                      |

### 마이그레이션

- **Clean Rebuild**: 기존 마이그레이션 히스토리 초기화 → 단일 Clean 마이그레이션 생성
- `npm run db:generate` → `npm run db:migrate`
- 실패 시: Supabase SQL Editor에서 `app/drizzle/migrations/XXXX_*.sql` 직접 실행
- 가급적 항상 `npm run db:migrate`로 적용하고, 부득이하게 SQL Editor를 사용해야 할 경우 추적 레코드(`__drizzle_migrations`) 정보도 함께 INSERT 하도록 SQL문 제공

---

## 도구 & 유틸리티

### 폼 (React Hook Form + Zod)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "~/common/components/ui/form";
```

### 알림 (Sonner)

```typescript
import { toast } from "sonner";
toast.success("저장 완료");
toast.error("오류 발생", { description: "다시 시도해주세요." });
```

---

## 코딩 규칙

### 금지 vs 권장

| 영역        | ❌ 금지                                  | ✓ 권장                                     |
| ----------- | ---------------------------------------- | ------------------------------------------ |
| Import      | `@remix-run/*`, `@radix-ui/*`            | `react-router`, `~/common/components/ui/*` |
| 반환값      | `json({ data })`                         | `{ data }`                                 |
| 데이터 접근 | `useLoaderData()`                        | `loaderData` props                         |
| 타입        | `enum Status {}`                         | `type Status = "draft" \| "active"`        |
| Tailwind    | `flex-shrink-0`, `w-[140px]`             | `shrink-0`, `w-36`                         |
| 색상        | `bg-white`, `text-gray-500`              | `bg-card`, `text-muted-foreground`         |
| 스키마      | `tubegai.table`                          | `public.table`                             |
| RLS         | Drizzle 마이그레이션                     | Supabase Dashboard                         |
| AI 모델명   | 문자열 하드코딩                          | `AI_MODELS.*` 상수 참조                    |
| DB 직접쿼리 | API route에서 `db`, `schema` 직접 import | `common/data/*.data.server.ts` 경유        |
| 미디어 저장 | base64 DB 저장                           | Supabase Storage + `media_asset` FK        |

### 작업 규칙

- Page UI 텍스트: 한국어 기본
- 분석/리포트: 한국어, `/docs` 폴더 저장. Code, 전문용어 등 영문을 유지해야 의미가 더 명확한 것들은 영어 사용
- 변경 전 기존 파일 읽기 필수
- 재구성(Refactoring, 재설계, 아키텍처 변경 등) 요청을 명확히 하지 않는 경우 기존 패턴 따르기, 과도한 엔지니어링 금지
- 모든 API `action`에 `requireAuth(request)` 필수
- Script/Storyboard AI 생성 시 **메타데이터 전체 저장** (type, content, duration + visualNotes, emotionalTone, keywords, sceneHints)
- Studio 재생성 시 세션 기반 이력 보존 (기존 세션 `archived` → 새 세션 생성)
- TrendTube 미디어는 반드시 Supabase Storage 업로드 + `media_asset` FK 연결

### 변경사항 검증 체크리스트

```bash
# 1. 타입 & 린트 체크
npm run typecheck
npm run lint

# 2. 관련 코드 검색 (변경된 함수/타입/컬럼명)
Grep "변경된이름" app/

# 3. 스키마 변경 시 점검 파일
# - *-schema.ts (컬럼 정의)
# - *.types.ts (인터페이스)
# - *.data.server.ts (CRUD 함수)
# - API 라우트, 컴포넌트

# 4. 마이그레이션 후 DB 반영 확인
npm run db:migrate
```

---

## 환경 변수

```bash
# Database configuration
DATABASE_PASSWORD
DATABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
# Google Cloud Project ID and Gemini API Key
GOOGLE_CLOUD_PROJECT_ID
GEMINI_API_KEY
# Google OAuth Credentials for Youtube Channel
GOOGLE_CLIENT_ID
OOGLE_CLIENT_SECRET
# Gemini AI Mock Data setting ("true" → AI 호출 대신 mock 데이터 사용)
GEMINI_MOCK=true
---

## 참조 문서

| 문서                                                                              | 내용                                                      |
| --------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [Studio + TrendTube 통합 고도화 계획서](docs/studio-enhancement-plan.md)          | Pipeline 설계, Storage 통합, DB 재설계, Phase별 구현 계획 |
| [Project-Studio AI 중복 최소화 전략](docs/project-studio-ai-optimization-plan.md) | 도메인 역할 재정의, Pre-Production 도입, AI 비용 절감     |
| [프로젝트 구조 리팩토링 계획](docs/project-structure-refactoring-plan.md)         | 폴더 구조 분석, Dead Code 정리, 일관성 개선               |
| [DB 스키마 재구축 전략서](docs/db-schema-rebuild-strategy.md)                     | 테이블 전수 분석, Clean Rebuild 절차, 목표 스키마 명세    |
```
