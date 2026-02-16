# Project-Studio AI 중복 최소화 및 연계 활용 전략

> **관련 문서**: [Studio + TrendTube 통합 고도화 계획서](studio-enhancement-plan.md)
>
> 본 문서는 Studio 고도화 계획과 **통합 관점**에서 Project-Studio 간 AI 생성결과 중복을 분석하고, 역할 재정의 및 연계 활용 전략을 수립한다.

---

## 1. 현황 분석

### 1.1 현재 AI 생성 파이프라인

```
[Trend 탐색] ─── AI 아이디어 생성 ──> [Idea]
                                          │
                                          ▼
[Trend 선택] ─── AI 프로젝트 컨텍스트 생성 ──> [Project]
                  (ai-project-generator.server.ts)    │
                  Model: gemini-2.5-flash-lite         │
                                                       ▼
                                         ┌─── [Studio Pipeline] ───────────────────────────┐
                                         │  Step 1: Script (ai-script.server.ts)            │
                                         │    Model: gemini-2.5-flash                       │
                                         │    ⚠ 4개 메타데이터 필드 DB 미저장               │
                                         │              │                                   │
                                         │              ▼                                   │
                                         │  Step 2: Storyboard (ai-storyboard.server.ts)    │
                                         │    Model: nano-banana-pro-preview ← 부적합 모델  │
                                         │    ⚠ Script 메타데이터 미활용, 200자 제한         │
                                         │              │                                   │
                                         │              ▼                                   │
                                         │  Step 3: Scene Video ← MOCKED (미구현)          │
                                         │  Step 4: B-Roll ← 미구현                        │
                                         │  Step 5: Rough Cut ← 미구현                     │
                                         └──────────────────────────────────────────────────┘

[별도 경로]
┌─── [TrendTube Pipeline] ─────────────────────────────────────────────────┐
│  Step 1: 트렌드 재분석 (extractYouTubeTrends)                            │
│  Step 2: 아이디어 재생성 (generateVideoIdeas)                            │
│  Step 3-6: 미디어 생성 (video, music, voiceover) ← base64 DB 저장 문제  │
│  Step 7: 합성 ← 8초 하드코딩, 다중 클립 미지원                          │
│  ⚠ Studio 연결 없음 (결과물 재활용 불가)                                │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.2 단계별 AI 생성 필드 비교

| AI 생성 필드 | Idea Generator | Project Generator | Studio Script | TrendTube Step 1-2 |
|---|:---:|:---:|:---:|:---:|
| title (영상 제목) | O | O | 프로젝트 데이터 읽기 | O (텍스트 내 포함) |
| description (영상 설명) | O | O | 프로젝트 데이터 읽기 | O (텍스트 내 포함) |
| hooks[] (오프닝 훅) | O | O | **재생성** (hook 세그먼트) | O (텍스트 내 포함) |
| targetAudience (타겟 시청자) | O | O | 프로젝트 데이터 읽기 | O (텍스트 내 포함) |
| estimatedViews (예상 조회수) | O | O | 프로젝트 데이터 읽기 | - |
| scriptGuidelines (대본 가이드) | - | O | **재생성** (전체 대본으로 확장) | - |
| keywords[] (키워드) | - | O | **재생성** (세그먼트별 키워드) | - |
| suggestedTone (톤) | O | O | 프로젝트 데이터 읽기 | - |
| suggestedDifficulty (난이도) | O | O | - | - |
| 트렌드 분석 | 트렌드 직접 참조 | trendSnapshot 저장 | trendSnapshot 읽기 | **독립적으로 재분석** |
| 전체 대본 텍스트 | - | - | O (5개 세그먼트) | - |
| visualNotes / emotionalTone | - | - | O (AI 생성) ← **DB 미저장** | - |
| sceneHints / keywords | - | - | O (AI 생성) ← **DB 미저장** | - |
| 시각적 씬 구성 | - | - | sceneHints (부가) | O (텍스트 내 포함) |
| 내레이션 스크립트 | - | - | - | O (Step 5) |

### 1.3 핵심 중복 포인트

#### 중복 1: Idea → Project → Studio 단계별 반복 생성 (높음)

```
Idea 생성:     title, hooks, targetAudience, estimatedViews, contentTone, difficulty
                                    ▼ (Idea에서 Project 생성 시 복사)
Project 생성:  title, hooks, targetAudience, estimatedViews + scriptGuidelines, keywords 추가 생성
                                    ▼ (Project 데이터를 읽어서 프롬프트에 포함)
Studio Script: hooks → hook 세그먼트로 재생성, scriptGuidelines → 전체 대본으로 재생성
```

- `hooks[]`: Project에서 3개 생성 → Studio에서 hook 세그먼트로 **다시 생성**
- `scriptGuidelines`: Project에서 구조(openingStrategy, mainPoints, ctaStrategy, closingStrategy) 생성 → Studio에서 **동일한 구조를 전체 대본으로 확장**하며 재생성
- `keywords[]`: Project에서 SEO 키워드 5개 생성 → Studio에서 세그먼트별 B-roll 키워드로 **재생성**

#### 중복 2: TrendTube 독립 재분석 + Studio 연결 부재 (높음)

```
Project 생성 시: trendSnapshot (트렌드 정보 스냅샷 저장)
                                    ▼ (TrendTube에서 무시됨)
TrendTube Step 1: 트렌드 URL을 독립적으로 재분석 (extractYouTubeTrends)
TrendTube Step 2: 영상 아이디어 독립적으로 재생성 (generateVideoIdeas)
                                    ▼ (Studio에서 재활용 불가)
TrendTube 결과: narrationScript, 미디어 ← Studio Pipeline과 완전히 단절
```

- Project에 이미 `trendSnapshot`, `scriptGuidelines`, `hooks`가 저장되어 있지만 TrendTube는 이를 활용하지 않고 독립적으로 AI 호출
- TrendTube 생성 결과(narrationScript, 비디오, 음악)를 Studio에서 재활용할 수 없음
- **불필요한 AI 호출 2회** (gemini-2.5-flash x 2) + Studio-TrendTube 간 자산 고립

#### 중복 3: Project AI Generator의 과도한 생성 범위 (중간)

현재 `ai-project-generator.server.ts`가 생성하는 9개 필드:
```typescript
AIProjectGenerationOutput {
  title, description,           // 기본 메타데이터 (Project 영역)
  hooks[],                      // 프로덕션 콘텐츠 (Studio 영역)
  targetAudience,               // 기획 메타데이터 (Project 영역)
  estimatedViews,               // 예측 데이터 (Project 영역)
  scriptGuidelines,             // 프로덕션 콘텐츠 (Studio 영역)
  keywords[],                   // SEO 데이터 (Studio 영역)
  suggestedTone,                // 사용자 설정 (Project 영역)
  suggestedDifficulty           // 사용자 설정 (Project 영역)
}
```

이 중 `hooks`, `scriptGuidelines`, `keywords`는 Studio 프로덕션 단계에서 더 풍부한 컨텍스트(채널 정보, 트렌드 스냅샷 전체)로 생성하는 것이 품질 면에서 유리함

#### 중복 4: Script 메타데이터 손실로 인한 후속 단계 재생성 (중간)

```
Studio Script AI가 생성하는 7개 필드 중:
  type, content, duration         ← DB 저장 O
  visualNotes, emotionalTone,     ← DB 미저장 ✗ → Storyboard AI가 이 정보 없이 재추론
  keywords, sceneHints            ← DB 미저장 ✗ → B-Roll 검색 키워드 재생성 필요
```

- Script AI가 이미 `visualNotes`, `sceneHints`를 생성하지만 DB에 저장되지 않아 Storyboard AI가 content 200자만으로 시각적 씬을 재추론
- `keywords`가 저장되지 않아 B-Roll 단계에서 별도 키워드 생성 필요

---

## 2. 역할 재정의

### 2.1 Project: 기획 및 컨텍스트 관리

**Project의 핵심 역할**: 트렌드 기반 영상 기획 메타데이터 관리

| 구분 | 필드 | 설명 | 유지/이동 |
|---|---|---|---|
| 기본 정보 | `title`, `description`, `topic` | 사용자 편집 가능한 기본 메타데이터 | **유지** |
| 영상 설정 | `type`, `contentTone`, `videoLength`, `difficulty` | 사용자 선호 설정 | **유지** |
| 기획 정보 | `targetAudience`, `estimatedViews` | AI 추천 + 사용자 수정 가능 | **유지** |
| 트렌드 연결 | `trendSnapshot`, `basedOnTrendUuid`, `referenceUrl` | 트렌드 기록 | **유지** |
| 프로젝트 관리 | `status`, `progress`, `visibility`, `channelId` | 관리 메타데이터 | **유지** |
| 프로덕션 가이드 | `hooks[]` | 오프닝 훅 제안 | **Studio로 이동** |
| 프로덕션 가이드 | `scriptGuidelines` | 대본 구조 가이드 | **Studio로 이동** |
| SEO | `aiContext.keywords` | SEO 키워드 | **Studio로 이동** |
| 레거시 | `tone` (projectToneEnum) | `contentTone`과 중복 | **제거** (contentTone으로 통합) |

> **Enum 통합**: `project.tone` (informative, funny, cinematic, vlog) → `project.contentTone` (informative, funny, dramatic, casual, professional)로 통합. 매핑: cinematic→dramatic, vlog→casual. (Studio 고도화 Phase 1D에서 실행)

### 2.2 Studio: 프로덕션 콘텐츠 생성 (세션 기반)

**Studio의 핵심 역할**: Project 컨텍스트를 기반으로 영상 제작에 필요한 모든 AI 콘텐츠를 **세션 단위**로 생성/관리

> **세션 모델 도입**: Studio 고도화 계획에서 `studio_session` 테이블을 도입하여 TrendTube와 동일한 세션 기반 관리 패턴 적용. Script 재생성 시 이전 결과 보존, 롤백 가능.

```
Studio 생성 책임 (세션 기반):
├── Pre-Production (신규 — Studio 세션 내)
│   ├── hooks[] 생성 (Project 기획 의도 반영)
│   ├── scriptGuidelines 생성 (대본 구조 설계)
│   └── SEO keywords 생성
├── Step 1: Script 생성
│   ├── 5개 세그먼트 전체 대본 (hook, intro, body, cta, outro)
│   └── 세그먼트별 visualNotes, emotionalTone, keywords, sceneHints ← 전부 DB 저장
├── Step 2: Storyboard + Scene 이미지 순차 생성
│   ├── AI 텍스트 스토리보드 (gemini-2.5-flash로 교체)
│   ├── Scene별 순차 이미지 생성 (참조 체이닝으로 시각적 일관성)
│   └── Script 메타데이터(visualNotes, sceneHints) 활용
├── Step 3: Scene Video 순차 생성
│   ├── Veo 3 연결, 8초 클립 분할
│   └── 이미지 + 이전 비디오 참조 체이닝
├── Step 4: B-Roll 매칭
│   └── Script keywords[] 직접 사용 (AI 추가 호출 없음)
├── Step 5: Rough Cut (Phase 2)
│   └── Scene Video + B-Roll + TrendTube 미디어 자동 배치
└── TrendTube 연결
    ├── narrationScript → Studio Script 가져오기
    └── 미디어 자산 → B-Roll/오디오 트랙으로 재활용
```

### 2.3 데이터 흐름 (개선 후)

```
[Trend] ──> [Project 생성 (경량)]
             │ AI 생성: title, description, targetAudience, estimatedViews,
             │          suggestedTone, suggestedDifficulty (6개 필드)
             │ 저장: trendSnapshot (트렌드 스냅샷)
             │
             ▼
        [Studio 진입]
             │
             ├── studio_session 생성 (세션 기반 관리)
             │
             ├── [Pre-Production] (신규 단계 — studio_script 테이블에 저장)
             │    AI 생성: hooks[], scriptGuidelines, keywords[]
             │    입력: Project 메타데이터 + 채널 정보 + 트렌드 스냅샷
             │
             ├── [Step 1: Script 생성]
             │    AI 생성: 전체 대본 (5 세그먼트) + 메타데이터 전체 저장
             │    입력: Project 메타데이터 + Pre-Production 결과
             │    저장: studio_script_segment (7개 필드 모두 저장)
             │
             ├── [Step 2: Storyboard + Scene 이미지]
             │    AI 생성: 텍스트 스토리보드 (gemini-2.5-flash)
             │    이미지: Scene별 순차 생성 (참조 체이닝)
             │    입력: Script 전체 메타데이터 (duration, visualNotes, emotionalTone, sceneHints)
             │
             ├── [Step 3: Scene Video]
             │    Veo 3: Scene별 순차 생성, 8초 클립 분할
             │    입력: Step 2 이미지 + visualPrompt + emotionalTone
             │
             ├── [TrendTube 연계]
             │    Step 1: trendSnapshot 재사용 (AI 호출 생략)
             │    Step 2: Project 컨텍스트 주입 (AI 호출 경량화)
             │    Steps 3-7: 미디어 생성 → Supabase Storage 저장
             │    결과: narrationScript → Script 가져오기, 미디어 → Studio 재활용
             │
             └── [미디어 저장: Supabase Storage 통합]
                  경로: projects/{projectId}/{studio|trendtube}/{sessionId}/...
                  모든 미디어 → media_asset 테이블 연결
```

---

## 3. 중복 제거 전략

### 3.1 Project AI Generator 경량화

**현재** (`ai-project-generator.server.ts`):
```typescript
// 9개 필드 생성 (gemini-2.5-flash-lite)
AIProjectGenerationOutput {
  title, description, hooks[], targetAudience, estimatedViews,
  scriptGuidelines, keywords[], suggestedTone, suggestedDifficulty
}
```

**개선 후**:
```typescript
// 6개 필드만 생성 (프로덕션 관련 필드 제거)
AIProjectGenerationOutput {
  title,                    // 유지: 기본 메타데이터
  description,              // 유지: 기본 메타데이터
  targetAudience,           // 유지: 기획 정보
  estimatedViews,           // 유지: 예측 정보
  suggestedTone,            // 유지: 사용자 설정 추천
  suggestedDifficulty       // 유지: 사용자 설정 추천
  // 제거: hooks[], scriptGuidelines, keywords[] → Studio Pre-Production으로 이동
}
```

**효과**: AI 프롬프트 간소화, 응답 토큰 ~40% 절감, 역할 명확화

### 3.2 Studio Pre-Production 단계 신설

Studio Script 생성 **이전**에 Pre-Production 단계를 추가하여, Project에서 제거된 프로덕션 가이드를 생성:

```typescript
// 신규: app/lib/ai-pre-production.server.ts
interface PreProductionOutput {
  hooks: string[];                    // 오프닝 훅 3개
  scriptGuidelines: ScriptGuidelines; // 대본 구조 가이드
  seoKeywords: string[];              // SEO 키워드 5-10개
}

// Project 전체 컨텍스트 + 채널 정보 + 트렌드 정보를 활용
// → Project AI Generator보다 더 풍부한 입력으로 더 높은 품질 출력
```

**장점**:
- Project 데이터 + 채널 구독자 수/설명 + 트렌드 스냅샷을 모두 활용한 고품질 생성
- Script 생성 시 이미 hooks/guidelines가 준비되어 있어 대본 품질 향상
- 사용자가 Pre-Production 결과를 확인/수정 후 Script 생성 가능
- **세션 기반**: Pre-Production 결과도 studio_session 단위로 관리, 재생성 시 이전 결과 보존

### 3.3 Script 메타데이터 전체 저장 (손실 해결)

> **Studio 고도화 Phase 1A와 연동**

**현재**: `generate-script-stream.ts`에서 AI가 생성한 7개 필드 중 3개만 DB 저장 (type, content, duration)

**개선 후**: `studio_script_segment`에 4개 컬럼 추가, 전체 메타데이터 저장

```sql
ALTER TABLE public.studio_script_segment
  ADD COLUMN visual_notes TEXT,
  ADD COLUMN emotional_tone TEXT,
  ADD COLUMN keywords TEXT[],
  ADD COLUMN scene_hints JSONB;
```

**효과**:
- Storyboard AI가 `visualNotes`, `emotionalTone`, `sceneHints` 활용 → 시각적 씬 품질 향상
- `keywords`를 B-Roll 검색에 직접 사용 → Step 4에서 AI 추가 호출 불필요
- Script → Storyboard → Scene Video 파이프라인에서 데이터 연속성 확보

### 3.4 Storyboard AI 최적화

> **Studio 고도화 Phase 1B와 연동**

**모델 교체**: `nano-banana-pro-preview` (이미지 전용 모델) → `gemini-2.5-flash` (텍스트 구조화 출력에 적합)

**프롬프트 개선**: Script 메타데이터를 Storyboard AI 프롬프트에 포함

```typescript
// ai-storyboard.server.ts의 buildStoryboardPrompt() 변경
// 기존: content 200자만 전달, duration 미포함
// 개선: content 300자 + duration + visualNotes + emotionalTone + sceneHints 전달
```

**순차 이미지 생성 추가**: 텍스트 스토리보드 생성 완료 후, Scene별 이미지를 순차 생성하며 이전 Scene 이미지를 참조로 전달 (시각적 일관성)

### 3.5 TrendTube 연계 최적화

#### Step 1 (트렌드 분석) 조건부 생략

```typescript
// ai-trendtube.server.ts 수정
export async function extractYouTubeTrends(
  url: string,
  userIdea?: string,
  existingTrendSnapshot?: TrendSnapshot  // 신규 파라미터
): Promise<string> {
  // Project에 trendSnapshot이 있으면 AI 호출 생략
  if (existingTrendSnapshot) {
    return formatTrendSnapshotAsAnalysis(existingTrendSnapshot);
  }
  // 기존 AI 호출 로직...
}
```

#### Step 2 (아이디어 생성) 컨텍스트 주입

```typescript
// ai-trendtube.server.ts 수정
export async function generateVideoIdeas(
  extractedTrends: string,
  projectContext?: {           // 신규 파라미터
    title: string;
    description: string;
    targetAudience: string;
    hooks: string[];           // Studio Pre-Production 결과
    scriptGuidelines: ScriptGuidelines;
  }
): Promise<string> {
  // Project 컨텍스트가 있으면 프롬프트에 주입
  // → 기존 기획 의도를 유지하면서 아이디어 확장
}
```

#### TrendTube → Studio 자산 연결 (신규)

> **Studio 고도화 Phase 1E와 연동**

```typescript
// 신규: app/features/studio/api/import-trendtube-script.ts
// POST /api/studio/import-trendtube-script
// TrendTube narrationScript → Gemini로 세그먼트 분류 → studio_script에 저장
// studio_script.source_trendtube_session_id FK로 원본 세션 추적
```

| Studio 단계 | TrendTube 자산 연결 | 활용 방식 |
|---|---|---|
| Script | `narrationScript` | "TrendTube 스크립트 가져오기" 버튼 |
| Scene | `generated_video` | 기존 미디어 재사용 옵션 |
| B-Roll | 전체 미디어 | B-Roll 에셋 후보 목록에 추가 |
| Rough Cut (Phase 2) | `background_music`, `voiceover` | 오디오 트랙 옵션 |

**효과**: TrendTube 진입 시 AI 호출 최대 2회 절감 + 생성 결과물 Studio에서 재활용 가능

### 3.6 공유 컨텍스트 빌더 + AI 서비스 레이어 통합

> **Studio 고도화 Phase 1H와 연동**

#### 공유 컨텍스트 빌더

현재 `ai-script.server.ts`의 `buildProjectContext()` 함수를 공유 유틸리티로 분리:

```typescript
// 신규: app/lib/ai-context-builder.server.ts
export function buildStudioContext(
  project: ProjectFullDetail,
  language: "ko" | "en"
): string {
  // Project 기본 정보 + 채널 정보 + 트렌드 정보를 통일된 형식으로 구성
  // Pre-Production, Script, Storyboard, TrendTube 모든 AI 서비스에서 공유
}
```

#### AI 모델 레지스트리 중앙화

```typescript
// 신규: app/lib/ai-models.server.ts
export const AI_MODELS = {
  text: { primary: "gemini-2.5-flash", lite: "gemini-2.5-flash-lite" },
  image: { primary: "gemini-3-pro-image-preview" },
  video: { primary: "veo-3.1-generate-preview" },
  music: { primary: "lyria-realtime-exp" },
} as const;
```

**현재 문제**: 8개 AI 서비스 파일에서 모델명 하드코딩, 2개 SDK 혼용, retry 미적용 파일 존재

**개선**:
- 모델명 → `AI_MODELS.*` 상수 참조로 통일
- `withRetry()` → `ai-video.server.ts`, `ai-music.server.ts`, `tts.server.ts`에도 적용
- SDK 클라이언트 → `gemini-client.server.ts`에서 통합 관리

---

## 4. DB 스키마 개선안

### 4.1 Studio 세션 기반 관리 도입

> **Studio 고도화 Phase 0A에서 실행**

Studio에 TrendTube와 동일한 세션 모델 도입:

```sql
-- 신규: studio_session 테이블
CREATE TABLE public.studio_session (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.auth_user(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'archived'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 프로젝트당 active 세션은 1개만
CREATE UNIQUE INDEX idx_studio_session_active
  ON public.studio_session (project_id) WHERE status = 'active';
```

**기존 테이블 FK 변경**:
- `studio_script`: `projectId` unique 제거 → `session_id` FK 추가
- `studio_storyboard`, `studio_video`: `session_id` FK 추가

### 4.2 `studio_script` 테이블 확장 (Pre-Production 필드)

```sql
-- Pre-Production 결과 저장 + TrendTube 연결
ALTER TABLE public.studio_script
  ADD COLUMN session_id UUID REFERENCES public.studio_session(id) ON DELETE CASCADE,
  ADD COLUMN hooks text[],                          -- Project에서 이동
  ADD COLUMN script_guidelines jsonb,               -- Project에서 이동
  ADD COLUMN seo_keywords text[],                   -- Project aiContext.keywords에서 이동
  ADD COLUMN pre_production_status text DEFAULT 'pending',  -- 'pending' | 'completed'
  ADD COLUMN source_trendtube_session_id UUID       -- TrendTube → Studio 연결
    REFERENCES public.trendtube_session(id) ON DELETE SET NULL;
```

### 4.3 `studio_script_segment` 메타데이터 컬럼 추가

> **Studio 고도화 Phase 1A에서 실행**

```sql
ALTER TABLE public.studio_script_segment
  ADD COLUMN visual_notes TEXT,
  ADD COLUMN emotional_tone TEXT,
  ADD COLUMN keywords TEXT[],
  ADD COLUMN scene_hints JSONB;
```

### 4.4 `studio_storyboard` 메타데이터 컬럼 추가

> **Studio 고도화 Phase 1B에서 실행**

```sql
ALTER TABLE public.studio_storyboard
  ADD COLUMN session_id UUID REFERENCES public.studio_session(id) ON DELETE CASCADE,
  ADD COLUMN emotional_tone TEXT,
  ADD COLUMN camera_angle TEXT;
```

### 4.5 `projects` 테이블 정리

```sql
-- Phase 1: tone → contentTone 통합 (Studio 고도화 Phase 1D)
UPDATE public.project SET content_tone = CASE
  WHEN tone = 'cinematic' THEN 'dramatic'
  WHEN tone = 'vlog' THEN 'casual'
  ELSE tone
END WHERE content_tone IS NULL AND tone IS NOT NULL;
ALTER TABLE public.project DROP COLUMN IF EXISTS tone;

-- Phase 2: 프로덕션 필드 deprecated (데이터 마이그레이션 완료 후)
-- hooks → studio_script.hooks로 이동
-- scriptGuidelines → studio_script.script_guidelines로 이동
-- aiContext.keywords → studio_script.seo_keywords로 이동

-- Phase 3: deprecated 컬럼 안전하게 제거
-- ALTER TABLE public.project DROP COLUMN hooks;
-- ALTER TABLE public.project DROP COLUMN script_guidelines;
```

### 4.6 TrendTube 미디어 테이블 정리

> **Studio 고도화 Phase 0B, 1H에서 실행**

```sql
-- JSONB → 정형 컬럼 승격 + media_asset 필수 연결
ALTER TABLE public.trendtube_media
  ADD COLUMN prompt TEXT,
  ADD COLUMN clip_number INTEGER DEFAULT 1;

-- Phase 0B 완료 후: base64 → Storage 전환 완료 시
-- ALTER TABLE public.trendtube_media ALTER COLUMN media_asset_id SET NOT NULL;
-- Phase 1H: publicUrl 컬럼 제거 (media_asset.publicUrl로 대체)
```

### 4.7 전체 스키마 관계도 (목표)

```
project
 ├── studio_session (1:N) ← 신규: 세션 기반 관리
 │    ├── studio_script (1:1)
 │    │    ├── [기존] prompt, targetDuration, savedAt
 │    │    ├── [신규] hooks[], script_guidelines, seo_keywords, pre_production_status
 │    │    ├── [신규] source_trendtube_session_id → trendtube_session
 │    │    └── studio_script_segment (1:N)
 │    │         ├── [기존] type, content, estimatedDuration
 │    │         └── [신규] visualNotes, emotionalTone, keywords, sceneHints
 │    │
 │    ├── studio_storyboard (1:N)
 │    │    ├── [기존] description, visualPrompt, duration, imageAssetId → media_asset
 │    │    ├── [신규] emotionalTone, cameraAngle
 │    │    └── studio_video (1:1)
 │    │         └── studio_video_part (1:N) ← 8초 클립 단위
 │    │              └── videoAssetId → media_asset
 │    │
 │    └── (Phase 2+) studio_b_roll, studio_rough_cut_timeline
 │
 ├── trendtube_session (1:N) ← 기존 패턴 유지
 │    ├── trendtube_result (1:1)
 │    └── trendtube_media (1:N) → media_asset (필수 FK)
 │
 └── media_asset (1:N) ← 통합 미디어 자산 저장소 (Supabase Storage)
```

---

## 5. UI/UX 플로우 변경

### 5.1 Project 생성 플로우 (간소화)

**현재**:
```
트렌드 선택 → AI 생성 다이얼로그 (옵션 설정)
           → 프롬프트 미리보기
           → AI 결과 리뷰 (기본정보 탭 + 대본 가이드 탭)  ← 9개 필드 편집
           → 프로젝트 생성
```

**개선 후**:
```
트렌드 선택 → AI 생성 다이얼로그 (옵션 설정)
           → 프롬프트 미리보기
           → AI 결과 리뷰 (기본정보만)                    ← 6개 필드 편집
           → 프로젝트 생성
```

- AI 생성 다이얼로그의 "대본 가이드" 탭 제거 (Studio Pre-Production으로 이동)
- 결과 리뷰 화면 간소화: title, description, targetAudience, estimatedViews, tone, difficulty만 표시
- 사용자 경험: **"프로젝트는 기획, 제작은 Studio에서"** 라는 명확한 역할 분리

### 5.2 Studio 플로우 (세션 기반 + Pre-Production 추가)

**현재**:
```
Studio 진입 → 프로젝트 선택 → Script 생성 → Storyboard 생성 → Scene 생성(MOCKED) → Export(미구현)
```

**개선 후**:
```
Studio 진입 → 프로젝트 선택
  │
  ├── studio_session 자동 생성
  │
  ├── [Pre-Production] (신규 단계)
  │    ├── hooks[] 생성/편집
  │    ├── scriptGuidelines 생성/편집
  │    └── SEO keywords 생성/편집
  │
  ├── [Step 1: Script 생성]
  │    └── 메타데이터 전체 DB 저장 (7개 필드)
  │
  ├── [Step 2: Storyboard + Scene 이미지]
  │    ├── 텍스트 스토리보드 (gemini-2.5-flash)
  │    └── Scene별 순차 이미지 생성 (참조 체이닝)
  │
  ├── [Step 3: Scene Video] (Veo 3 연결, 모킹 제거)
  │    └── Scene별 순차 비디오 생성 (8초 클립, 참조 체이닝)
  │
  ├── [Step 4: B-Roll 매칭]
  │    └── Script keywords[] 직접 사용
  │
  └── [Step 5: Rough Cut] (Phase 2)
```

- Pre-Production 단계에서 대본 방향성을 먼저 수립
- Script 재생성 시 기존 세션 archived → 새 세션 생성 (이전 결과 보존)
- 모든 미디어 → Supabase Storage + media_asset 연결

### 5.3 TrendTube 플로우 (자동 연계 + 결과 재접근)

**현재**:
```
TrendTube 대시보드 → URL + 아이디어 입력 → Step 1 (트렌드 분석) → Step 2 (아이디어 생성) → Steps 3-7
⚠ 이전 결과 보려면 ?session=<id> 필요 (접근성 문제)
⚠ 미디어 base64로 DB 저장 (성능 문제)
⚠ 생성 결과 Studio에서 재활용 불가
```

**개선 후**:
```
TrendTube 대시보드 → Project 컨텍스트 자동 로드
  │
  ├── 최신 완료 세션 자동 표시 (session 파라미터 불필요)
  ├── 세션 이력 전환 UI (여러 세션 비교 가능)
  │
  ├── Step 1: "트렌드 정보가 이미 있습니다" (건너뛰기 옵션)
  │    └── trendSnapshot 재사용 시 AI 호출 생략
  ├── Step 2: Project 아이디어 기반 확장 (경량 AI 호출)
  ├── Steps 3-7: 미디어 생성 → Supabase Storage 저장 + media_asset FK 연결
  │    └── 8초 단위 N클립 순차 생성 (참조 체이닝)
  │
  └── Studio 연결
       ├── "스크립트로 가져오기" 버튼 → narrationScript → Studio Script
       └── 미디어 자산 → Studio B-Roll/오디오 트랙에서 재활용
```

---

## 6. AI 비용 절감 효과

### 6.1 호출 절감 분석

| 시나리오 | 현재 AI 호출 | 개선 후 AI 호출 | 절감 |
|---|---|---|---|
| Idea → Project → Script | 3회 (Idea + Project + Script) | 3회 (Idea + Project(경량) + PreProd+Script) | 토큰 절감 |
| Project → Script | 2회 (Project + Script) | 2회 (Project(경량) + PreProd+Script) | 토큰 절감 |
| Project → TrendTube | 3회 (Project + Step1 + Step2) | 1-2회 (Project + Step2(경량)) | **1-2회 절감** |
| TrendTube 전체 | 5회+ (Step1~5+) | 3-4회 (Step1 생략 + Step2 경량) | **1-2회 절감** |
| Script → Storyboard B-Roll 키워드 | Storyboard AI가 재추론 | keywords[] DB에서 읽기 | **후속 단계 재생성 제거** |

### 6.2 토큰 절감

- Project AI Generator: 출력 토큰 ~40% 감소 (9 → 6 필드)
- TrendTube Step 1: 입출력 토큰 100% 절감 (생략 시)
- TrendTube Step 2: 입력 토큰 ~30% 감소 (컨텍스트 사전 주입)
- Storyboard AI: 입력 품질 향상 (200자 → 300자 + 메타데이터) → 재생성 필요성 감소

### 6.3 인프라 비용 절감

- TrendTube 미디어: base64 DB 저장 → Supabase Storage (DB 용량 대폭 감소)
  - 건당 ~6.5-26MB DB 텍스트 → ~100B URL 문자열
- media_asset FK 연결: 고아 파일 추적 가능, 세션 삭제 시 일괄 정리

---

## 7. 구현 로드맵

### Studio 고도화 계획과의 통합

본 문서의 구현 항목은 [Studio 고도화 계획](studio-enhancement-plan.md)의 Phase와 통합하여 실행한다.

```
Studio 고도화 Phase        본 문서 해당 항목
─────────────────────      ──────────────────────────────────────
Phase 0A (세션 도입)     → 4.1 Studio 세션 기반 관리 도입
Phase 0B (Storage 통합)  → TrendTube base64 → Storage 전환
Phase 1A (Script 메타)   → 3.3 Script 메타데이터 전체 저장
Phase 1B (Storyboard)    → 3.4 Storyboard AI 최적화
Phase 1D (Enum 정리)     → 2.1 project.tone 제거, contentTone 통합
Phase 1E (TT→Studio)     → 3.5 TrendTube → Studio 자산 연결
Phase 1F (TT 결과접근)   → 5.3 TrendTube 자동 세션 로딩
Phase 1G (TT 8초 클립)   → TrendTube N클립 순차 생성
Phase 1H (AI 서비스통합) → 3.6 모델 레지스트리 + retry 통합
```

### 추가 Phase: Project-Studio 중복 제거 전용

Studio 고도화 계획에 포함되지 않은 **본 문서 고유 항목**:

#### Phase A: 공유 컨텍스트 빌더 (비파괴적 변경)

**목표**: AI 서비스 간 공유 컨텍스트 구성 통일 (Studio 고도화와 병행 가능)

| 파일 | 변경 내용 |
|---|---|
| `app/lib/ai-context-builder.server.ts` (신규) | `buildStudioContext()` 공유 유틸리티 생성 |
| `app/lib/ai-script.server.ts` | `buildProjectContext()`를 `buildStudioContext()` 호출로 대체 |
| `app/lib/ai-storyboard.server.ts` | `buildStoryboardPrompt()`에서 `buildStudioContext()` 활용 |

**선행 조건**: 없음 (즉시 실행 가능)

#### Phase B: TrendTube 컨텍스트 연계 (AI 호출 절감)

**목표**: TrendTube에서 Project 데이터 활용, 불필요한 AI 호출 제거

| 파일 | 변경 내용 |
|---|---|
| `app/lib/ai-trendtube.server.ts` | `extractYouTubeTrends()`에 trendSnapshot 파라미터 추가 |
| `app/lib/ai-trendtube.server.ts` | `generateVideoIdeas()`에 projectContext 파라미터 추가 |
| `app/features/studio/api/trendtube-step-trends.ts` | trendSnapshot 존재 시 AI 호출 건너뛰기 |
| `app/features/studio/api/trendtube-step-ideas.ts` | Project 컨텍스트 주입 |
| `app/features/studio/pages/studio-dashboard-page.tsx` | UI에 "기존 분석 사용" 옵션 추가 |

**선행 조건**: Studio 고도화 Phase 0B (Storage 통합) 완료 후 권장

#### Phase C: Pre-Production + Project 경량화

**목표**: 프로덕션 가이드(hooks, scriptGuidelines, keywords) 생성을 Studio로 이동

| 파일 | 변경 내용 |
|---|---|
| `app/lib/ai-pre-production.server.ts` (신규) | Pre-Production AI 생성 서비스 |
| `app/lib/ai-project-generator.server.ts` | 출력 필드에서 hooks, scriptGuidelines, keywords 제거 |
| `app/features/studio/studio-schema.ts` | `studio_script` 테이블에 hooks, script_guidelines, seo_keywords 추가 |
| `app/features/project/project-schema.ts` | hooks, scriptGuidelines 컬럼 deprecated 주석 |
| `app/common/data/studio.data.server.ts` | Pre-Production 데이터 CRUD 함수 추가 |
| `app/common/data/project.data.server.ts` | `CreateProjectInput`에서 관련 필드 optional 처리 |
| `app/features/project/components/ai-project-generator-dialog.tsx` | "대본 가이드" 탭 제거, 결과 리뷰 간소화 |
| `app/features/studio/pages/studio-script-page.tsx` | Pre-Production 단계 UI 추가 |
| DB 마이그레이션 SQL | `studio_script` 테이블 컬럼 추가 |

**선행 조건**: Studio 고도화 Phase 0A (세션 도입) 완료

#### Phase D: 데이터 마이그레이션 + 정리

**목표**: 기존 Project 데이터를 Studio로 마이그레이션, deprecated 컬럼 정리

| 파일 | 변경 내용 |
|---|---|
| `app/drizzle/migrations/XXXX_*.sql` (신규) | 데이터 마이그레이션 SQL |
| `app/features/project/project-schema.ts` | deprecated 컬럼 제거 |
| `app/common/data/project.data.server.ts` | 제거된 컬럼 참조 정리 |
| `app/features/project/pages/new-project-page.tsx` | hooks/scriptGuidelines 관련 폼 필드 제거 |
| `app/features/project/pages/project-detail-page.tsx` | Studio 연결 링크로 대체 |

**선행 조건**: Phase C 안정화 후

### 통합 실행 순서

```
Studio 고도화                    본 문서 (중복 제거)
──────────────────────           ──────────────────────
Phase 0A (세션 도입)     ────→   (선행 조건 충족)
Phase 0B (Storage 통합)  ────→   (선행 조건 충족)
                                 Phase A (컨텍스트 빌더) ← 병행 가능
Phase 1A (Script 메타)
Phase 1B (Storyboard)
                                 Phase B (TrendTube 컨텍스트 연계)
Phase 1D (Enum 정리)
Phase 1E (TT→Studio 연결)
Phase 1F (TT 결과 재접근)
                                 Phase C (Pre-Production + Project 경량화)
Phase 1G (TT 8초 클립)
Phase 1H (AI 서비스 통합)
                                 Phase D (데이터 마이그레이션 + 정리)
```

### Phase별 요약

| Phase | 난이도 | 영향 범위 | 비용 절감 | 선행 조건 |
|---|---|---|---|---|
| Phase A | 낮음 | 코드 구조만 | 없음 (준비) | 없음 |
| Phase B | 중간 | TrendTube API + UI | 높음 (AI 호출 1-2회/세션) | Studio 0B 권장 |
| Phase C | 높음 | Project + Studio 전체 | 중간 (토큰 절감) | Studio 0A 필수 |
| Phase D | 중간 | DB + 데이터 레이어 | 없음 (정리) | Phase C 안정화 |
