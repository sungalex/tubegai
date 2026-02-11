# TrendTube Studio Dashboard 구현 계획

## 개요

Google Opal TrendTube 앱 컨셉을 TubeGAI Studio Dashboard에 구현한다.
유튜브 트렌드 URL과 사용자 아이디어를 입력하면, AI가 자동으로 영상 아이디어 → 스크립트 → 비디오 → 배경음악 → 나레이션을 **한번에 생성**하는 파이프라인 기능이다.

### Opal TrendTube vs TubeGAI 매핑

| Opal TrendTube         | TubeGAI 구현                   | AI 모델                    |
| ---------------------- | ------------------------------ | -------------------------- |
| Enter URL              | YouTube 트렌드 URL 입력        | -                          |
| Add Idea               | 사용자 아이디어 텍스트 입력    | -                          |
| Add Image              | 참고 이미지 업로드 (선택)      | -                          |
| Extract YouTube Trends | 트렌드 콘텐츠 추출/분석        | `gemini-2.5-flash`         |
| Generate Video Ideas   | 바이럴 영상 아이디어 생성      | `gemini-2.5-flash`         |
| Generate YouTube Video | AI 영상 생성 (이미지 시퀀스)   | `nano-banana-pro-preview`  |
| Generate Background Music | 배경 음악 생성              | 외부 API (placeholder)     |
| Write Narration Script | 나레이션 스크립트 작성         | `gemini-2.5-flash-lite`    |
| Generate Voiceover     | 음성 나레이션 생성             | Google Cloud TTS           |
| Display Results        | 결과 대시보드 페이지           | -                          |

---

## 아키텍처

### 파이프라인 흐름

```
[입력 단계]
  ├── YouTube 트렌드 URL
  ├── 사용자 아이디어 (텍스트)
  └── 참고 이미지 (선택)
         │
         ▼
[Step 1] 트렌드 추출 (Gemini)
         │
         ▼
[Step 2] 영상 아이디어 생성 (Gemini)
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
[Step 3]          [Step 4]        [Step 5]
영상 생성         나레이션 스크립트  배경음악 생성
(Imagen)         (Gemini)         (Placeholder)
                    │
                    ▼
                [Step 6]
                음성 생성
                (Google TTS)
         │              │              │
         └──────────────┴──────────────┘
                    │
                    ▼
           [결과 대시보드]
           영상 + 음악 + 음성 + 스크립트 + 아이디어
```

### 병렬 처리 전략

- Step 3 (영상), Step 4 (스크립트), Step 5 (음악)은 **병렬 실행**
- Step 6 (음성)은 Step 4 완료 후 실행
- SSE 스트림으로 각 단계 진행 상황 실시간 전송

---

## 파일 구조

### 신규 파일

```
app/
├── features/studio/
│   ├── pages/
│   │   └── studio-dashboard-page.tsx          # 대시보드 메인 (기존 파일 전체 재작성)
│   ├── components/
│   │   ├── trendtube-input-form.tsx           # 입력 폼 (URL + 아이디어 + 이미지)
│   │   ├── trendtube-pipeline-progress.tsx    # 파이프라인 진행 상황 표시
│   │   └── trendtube-results-display.tsx      # 결과 표시 (영상/음악/음성/스크립트)
│   ├── api/
│   │   └── trendtube-generate-stream.ts       # SSE 스트림 API 라우트
│   └── studio-trendtube-schema.ts             # TrendTube 전용 DB 스키마
├── common/data/
│   └── trendtube.data.server.ts               # TrendTube 데이터 레이어
├── common/types/
│   └── trendtube.types.ts                     # TrendTube 전용 타입
└── lib/
    ├── ai-trendtube.server.ts                 # TrendTube AI 파이프라인 (핵심)
    └── tts.server.ts                          # Google Cloud TTS 서비스
```

### 수정 파일

```
app/
├── routes.ts                                  # Dashboard 라우트 활성화 + API 추가
├── drizzle/enums.ts                           # trendtubePipelineStatusEnum 추가
├── drizzle/index.ts                           # 새 스키마 export 추가
└── features/studio/
    ├── layouts/studio-layout.tsx               # 사이드바에 Dashboard 메뉴 추가
    └── components/studio-sidebar.tsx           # Dashboard 네비게이션 항목 추가
```

---

## 상세 구현

### Phase 1: 데이터베이스 스키마

#### 1.1 Enum 추가 (`app/drizzle/enums.ts`)

```typescript
export const trendtubePipelineStatusEnum = tubegaiSchema.enum(
  "trendtube_pipeline_status",
  ["pending", "extracting", "generating_ideas", "generating_media", "completed", "failed"]
);

export const trendtubeMediaTypeEnum = tubegaiSchema.enum(
  "trendtube_media_type",
  ["video_image", "background_music", "voiceover"]
);
```

#### 1.2 신규 테이블 (`app/features/studio/studio-trendtube-schema.ts`)

**trendtube_session** — 파이프라인 세션

| 컬럼             | 타입        | 설명                    |
| ---------------- | ----------- | ----------------------- |
| id               | uuid (PK)   | 세션 ID                 |
| project_id       | uuid (FK)   | 프로젝트 참조           |
| user_id          | uuid (FK)   | 사용자 참조             |
| trends_url       | text        | 입력 YouTube 트렌드 URL |
| user_idea        | text        | 사용자 아이디어 텍스트  |
| reference_image_url | text     | 참고 이미지 URL (선택)  |
| status           | enum        | 파이프라인 상태         |
| current_step     | integer     | 현재 진행 단계 (1-6)    |
| error_message    | text        | 에러 메시지 (실패 시)   |
| created_at       | timestamp   | 생성일                  |
| completed_at     | timestamp   | 완료일                  |

**trendtube_result** — 파이프라인 결과 데이터

| 컬럼               | 타입       | 설명                      |
| ------------------ | ---------- | ------------------------- |
| id                 | uuid (PK)  | 결과 ID                   |
| session_id         | uuid (FK)  | 세션 참조                 |
| extracted_trends   | text       | 추출된 트렌드 요약        |
| video_ideas        | text       | 생성된 영상 아이디어      |
| narration_script   | text       | 나레이션 스크립트         |
| created_at         | timestamp  | 생성일                    |

**trendtube_media** — 생성된 미디어 에셋

| 컬럼             | 타입       | 설명                          |
| ---------------- | ---------- | ----------------------------- |
| id               | uuid (PK)  | 미디어 ID                     |
| session_id       | uuid (FK)  | 세션 참조                     |
| media_type       | enum       | video_image/background_music/voiceover |
| media_asset_id   | uuid (FK)  | mediaAssets 참조              |
| metadata         | jsonb      | 추가 메타데이터               |
| created_at       | timestamp  | 생성일                        |

#### 1.3 Relations

```
trendtube_session 1──N trendtube_media
trendtube_session 1──1 trendtube_result
trendtube_session N──1 projects
trendtube_media   N──1 media_assets
```

---

### Phase 2: AI 서버 함수

#### 2.1 트렌드 추출 (`ai-trendtube.server.ts`)

```typescript
async function extractYouTubeTrends(url: string, userIdea?: string): Promise<string>
```

- **모델**: `gemini-2.5-flash`
- **기능**: URL에서 트렌드 정보 추출 및 분석
- **입력**: YouTube 트렌드 URL, 사용자 아이디어 (선택)
- **출력**: 트렌드 분석 요약 텍스트
- **프롬프트 전략**:
  - Gemini의 URL 분석 기능 활용 (google search grounding)
  - 트렌드 주제, 인기 키워드, 시청자 관심사 추출
  - 사용자 아이디어와 트렌드 교차 분석

#### 2.2 영상 아이디어 생성 (`ai-trendtube.server.ts`)

```typescript
async function generateVideoIdeas(
  extractedTrends: string,
  referenceImageUrl?: string
): Promise<string>
```

- **모델**: `gemini-2.5-flash`
- **기능**: 트렌드 기반 바이럴 영상 아이디어 생성
- **입력**: 추출된 트렌드, 참고 이미지 (선택)
- **출력**: 상세 영상 아이디어 텍스트
- **프롬프트 전략**:
  - 트렌드 분석 결과 기반 창의적 영상 컨셉 도출
  - 영상 구성, 스타일, 톤 제안
  - 바이럴 요소 (훅, 감정 유발 포인트) 포함

#### 2.3 영상 이미지 생성 (`ai-trendtube.server.ts`)

```typescript
async function generateVideoImages(videoIdeas: string): Promise<string[]>
```

- **모델**: `nano-banana-pro-preview` (기존 Imagen 서비스 활용)
- **기능**: 영상 아이디어 기반 키 프레임 이미지 생성
- **입력**: 영상 아이디어 텍스트
- **출력**: 생성된 이미지 URL 배열 (3-5장)
- **구현**: 기존 `ai-imagen.server.ts` 패턴 활용

#### 2.4 나레이션 스크립트 생성 (`ai-trendtube.server.ts`)

```typescript
async function generateNarrationScript(videoIdeas: string): Promise<string>
```

- **모델**: `gemini-2.5-flash-lite`
- **기능**: 영상 아이디어 기반 나레이션 스크립트 작성
- **입력**: 영상 아이디어 텍스트
- **출력**: 프로덕션 레디 나레이션 스크립트
- **프롬프트 전략**:
  - 매력적이고 간결한 유튜브 나레이션 형식
  - 보이스오버에 최적화된 문장 구조
  - 인트로/본문/아웃트로 구분

#### 2.5 배경 음악 생성 (Placeholder)

```typescript
async function generateBackgroundMusic(videoIdeas: string): Promise<{ url: string; metadata: object }>
```

- **현재**: Placeholder 구현 (더미 오디오 또는 무료 BGM 라이브러리 연동)
- **향후**: Google Lyria 2 API 연동 예정
- **출력**: 오디오 파일 URL + 메타데이터

> **참고**: Google Lyria 2는 현재 공개 API가 제한적이므로, 초기 구현은 프리셋 BGM 선택 방식 또는 placeholder로 진행한다. API 사용 가능 시 실제 AI 생성으로 전환.

#### 2.6 음성 나레이션 생성 (`tts.server.ts`)

```typescript
async function generateVoiceover(
  script: string,
  voice: "male_en" | "female_en" | "male_ko" | "female_ko"
): Promise<{ url: string; duration: number }>
```

- **모델**: Google Cloud Text-to-Speech API
- **기능**: 나레이션 스크립트를 음성으로 변환
- **입력**: 스크립트 텍스트, 음성 옵션
- **출력**: 오디오 파일 URL + 재생 시간
- **음성 옵션**:
  - 남성/여성 영어 (ko-KR-Standard-B, ko-KR-Standard-A 등)
  - 남성/여성 한국어
- **환경 변수**: `GOOGLE_CLOUD_TTS_API_KEY` 또는 `GOOGLE_APPLICATION_CREDENTIALS`

---

### Phase 3: API 라우트

#### 3.1 TrendTube 스트림 API (`api/trendtube-generate-stream.ts`)

**엔드포인트**: `POST /api/studio/trendtube-generate-stream`

**Request Body**:
```typescript
{
  projectId: string;
  trendsUrl: string;
  userIdea: string;
  referenceImageUrl?: string;
  voiceOption?: "male_en" | "female_en" | "male_ko" | "female_ko";
}
```

**SSE 이벤트 타입**:

| 이벤트 타입             | 데이터                              | 설명                  |
| ----------------------- | ----------------------------------- | --------------------- |
| `pipeline_start`        | `{ sessionId }`                     | 파이프라인 시작       |
| `step_start`            | `{ step, stepName, total: 6 }`      | 단계 시작             |
| `step_progress`         | `{ step, text }`                    | 단계 진행 텍스트      |
| `step_complete`         | `{ step, stepName, data }`          | 단계 완료 + 결과 데이터 |
| `pipeline_complete`     | `{ sessionId, results }`            | 전체 완료             |
| `pipeline_error`        | `{ step, error }`                   | 에러 발생             |

**파이프라인 실행 흐름**:

```typescript
async function executePipeline(controller, input) {
  // Step 1: 트렌드 추출
  emit("step_start", { step: 1, stepName: "트렌드 추출" });
  const trends = await extractYouTubeTrends(input.trendsUrl, input.userIdea);
  emit("step_complete", { step: 1, data: trends });

  // Step 2: 영상 아이디어 생성
  emit("step_start", { step: 2, stepName: "영상 아이디어 생성" });
  const ideas = await generateVideoIdeas(trends, input.referenceImageUrl);
  emit("step_complete", { step: 2, data: ideas });

  // Step 3, 4, 5: 병렬 실행
  emit("step_start", { step: 3, stepName: "미디어 생성 (영상/스크립트/음악)" });

  const [images, script, music] = await Promise.all([
    generateVideoImages(ideas),        // Step 3
    generateNarrationScript(ideas),     // Step 4
    generateBackgroundMusic(ideas),     // Step 5
  ]);

  emit("step_complete", { step: 3, data: { images } });
  emit("step_complete", { step: 4, data: { script } });
  emit("step_complete", { step: 5, data: { music } });

  // Step 6: 음성 생성 (스크립트 완료 후)
  emit("step_start", { step: 6, stepName: "음성 나레이션 생성" });
  const voiceover = await generateVoiceover(script, input.voiceOption);
  emit("step_complete", { step: 6, data: { voiceover } });

  // DB 저장
  await saveTrendTubeResults(sessionId, { trends, ideas, images, script, music, voiceover });

  emit("pipeline_complete", { sessionId, results: { ... } });
}
```

---

### Phase 4: 프론트엔드 UI

#### 4.1 Dashboard 페이지 (`studio-dashboard-page.tsx`)

**페이지 구조**: 3단계 UI 전환

1. **입력 모드**: 트렌드 URL + 아이디어 입력 폼
2. **생성 모드**: 파이프라인 진행 상황 실시간 표시
3. **결과 모드**: 생성된 콘텐츠 대시보드 (Opal 결과 페이지 스타일)

**라우트**: `/studio/dashboard` (기존), `/studio/dashboard/:projectId` (기존)

#### 4.2 입력 폼 컴포넌트 (`trendtube-input-form.tsx`)

```
┌──────────────────────────────────────────┐
│  🎬 TrendTube - AI 영상 자동 생성        │
│                                          │
│  YouTube 트렌드 URL *                    │
│  ┌────────────────────────────────────┐  │
│  │ https://youtube.com/feed/trending  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  아이디어 *                              │
│  ┌────────────────────────────────────┐  │
│  │ AI 자동화로 돈 버는 방법 3가지     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  참고 이미지 (선택)                      │
│  ┌────────────────────────────────────┐  │
│  │  📎 이미지를 드래그하거나 클릭     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ▼ 고급 설정                             │
│    음성: ○ 남성(한국어) ○ 여성(한국어)   │
│          ○ 남성(영어)   ○ 여성(영어)     │
│                                          │
│  [ 🚀 한번에 생성하기 ]                  │
└──────────────────────────────────────────┘
```

**구현 상세**:
- React Hook Form + Zod 유효성 검사
- URL 필드: `z.string().url()` (YouTube URL 패턴 검증)
- 아이디어 필드: `z.string().min(5).max(500)`
- 이미지: 드래그앤드롭 + 클릭 업로드 (FileReader → base64)
- 음성 옵션: Radio Group (기본값: `female_ko`)

#### 4.3 파이프라인 진행 컴포넌트 (`trendtube-pipeline-progress.tsx`)

```
┌──────────────────────────────────────────┐
│  생성 중... (3/6 단계)                   │
│                                          │
│  ✅ Step 1: 트렌드 추출 완료             │
│     "AI, 자동화, 생산성 관련 인기 트렌드 │
│      5개 발견..."                        │
│                                          │
│  ✅ Step 2: 영상 아이디어 생성 완료      │
│     "AI 자동화로 월 500만원 버는 직업... │
│                                          │
│  ⏳ Step 3: 영상 이미지 생성 중...       │
│     ████████████░░░░░░░ 65%              │
│                                          │
│  ⏳ Step 4: 나레이션 스크립트 생성 중... │
│     ██████████████████░ 90%              │
│                                          │
│  ⏳ Step 5: 배경 음악 생성 중...         │
│     ████████░░░░░░░░░░ 40%              │
│                                          │
│  ⬜ Step 6: 음성 나레이션 생성 대기      │
│                                          │
│  ━━━━━━━━━━━━━━━░░░░░░ 전체 55%         │
└──────────────────────────────────────────┘
```

**구현 상세**:
- SSE 이벤트 기반 실시간 업데이트
- 각 단계별 상태 아이콘: ⬜ pending → ⏳ in_progress → ✅ completed → ❌ failed
- 단계 완료 시 결과 미리보기 텍스트 표시
- 전체 진행률 Progress 바
- 에러 발생 시 재시도 버튼

#### 4.4 결과 표시 컴포넌트 (`trendtube-results-display.tsx`)

Opal의 "Display Video Results Webpage" 스타일을 반영한 다크 테마 프리미엄 레이아웃.

```
┌──────────────────────────────────────────────────────┐
│  🎬 TrendTube 결과                    [ 새로 생성 ] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │                                              │    │
│  │          🎥 생성된 영상 이미지                │    │
│  │        (이미지 캐러셀 / 슬라이드쇼)           │    │
│  │                                              │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────┐ ┌─────────────────────┐    │
│  │ 🎵 배경 음악        │ │ 🎙️ 나레이션         │    │
│  │ ▶ ━━━━━━━━░░ 2:30  │ │ ▶ ━━━━━━━━░░ 1:45  │    │
│  └─────────────────────┘ └─────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  💡 영상 아이디어                             │    │
│  │                                              │    │
│  │  AI 자동화 관련 트렌드를 활용한 3가지 영상   │    │
│  │  컨셉: ...                                    │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  📝 나레이션 스크립트             [ 복사 ]    │    │
│  │                                              │    │
│  │  [인트로]                                     │    │
│  │  "안녕하세요, 오늘은 AI를 활용해서..."       │    │
│  │  [본문]                                       │    │
│  │  "첫 번째 방법은..."                          │    │
│  │  ...                                          │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  📊 트렌드 분석                               │    │
│  │                                              │    │
│  │  분석된 YouTube 트렌드 요약...               │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  [ 프로젝트로 저장 ]  [ 다운로드 ]                  │
└──────────────────────────────────────────────────────┘
```

**구현 상세**:
- 다크 테마 기반 프리미엄 카드 레이아웃
- 이미지 캐러셀: 생성된 이미지를 슬라이드로 표시
- HTML5 `<audio>` 플레이어: 배경 음악 + 나레이션 각각
- 텍스트 카드: 아이디어, 스크립트, 트렌드 분석을 접을 수 있는(Collapsible) 카드
- 반응형: 모바일에서 세로 스택, 데스크톱에서 그리드 레이아웃
- 액션 버튼: "프로젝트로 저장", "새로 생성", "복사", "다운로드"

---

### Phase 5: 라우트 설정

#### 5.1 `app/routes.ts` 변경

```typescript
// 기존 비활성화 주석 해제 + 수정
// Studio Dashboard (TrendTube)
route("dashboard", "features/studio/pages/studio-dashboard-page.tsx", {
  id: "studio-dashboard-static",
}),
route(
  "dashboard/:projectId",
  "features/studio/pages/studio-dashboard-page.tsx"
),

// API 추가
route(
  "studio/trendtube-generate-stream",
  "features/studio/api/trendtube-generate-stream.ts"
),
```

#### 5.2 사이드바 변경

`studio-sidebar.tsx`에 Dashboard 메뉴 항목 추가:
- 아이콘: `Sparkles` (lucide-react)
- 라벨: "TrendTube"
- 위치: 사이드바 최상단 (Script 위)

---

## 구현 순서 (작업 단위)

### Step 1: 데이터베이스 (1단계)
1. `app/drizzle/enums.ts`에 enum 추가
2. `app/features/studio/studio-trendtube-schema.ts` 스키마 정의
3. `app/drizzle/index.ts`에 export 추가
4. `npm run db:generate` → `npm run db:migrate`

### Step 2: 타입 정의 (2단계)
1. `app/common/types/trendtube.types.ts` 타입 정의
   - `TrendTubeSession`, `TrendTubeResult`, `TrendTubeMedia`
   - `TrendTubePipelineStatus`, `TrendTubeInput`
   - `TrendTubeStreamEvent` (SSE 이벤트 타입)

### Step 3: AI 서버 함수 (3단계)
1. `app/lib/ai-trendtube.server.ts` 구현
   - `extractYouTubeTrends()` — Gemini로 트렌드 추출
   - `generateVideoIdeas()` — 영상 아이디어 생성
   - `generateVideoImages()` — Imagen 이미지 생성
   - `generateNarrationScript()` — 나레이션 스크립트 생성
   - `generateBackgroundMusic()` — BGM placeholder
2. `app/lib/tts.server.ts` 구현
   - `generateVoiceover()` — Google Cloud TTS 연동

### Step 4: 데이터 레이어 (4단계)
1. `app/common/data/trendtube.data.server.ts` 구현
   - `createTrendTubeSession()` — 세션 생성
   - `updateSessionStatus()` — 상태 업데이트
   - `saveTrendTubeResults()` — 결과 저장
   - `getTrendTubeSession()` — 세션 조회
   - `getTrendTubeSessions()` — 세션 목록 (프로젝트별)

### Step 5: API 라우트 (5단계)
1. `app/features/studio/api/trendtube-generate-stream.ts` SSE 스트림 API
2. `app/routes.ts` 라우트 등록

### Step 6: 프론트엔드 UI (6단계)
1. `trendtube-input-form.tsx` — 입력 폼 컴포넌트
2. `trendtube-pipeline-progress.tsx` — 진행 상황 컴포넌트
3. `trendtube-results-display.tsx` — 결과 표시 컴포넌트
4. `studio-dashboard-page.tsx` — 대시보드 페이지 전체 재작성
5. `studio-sidebar.tsx` / `studio-layout.tsx` — 네비게이션 추가

### Step 7: 라우트 활성화 및 통합 (7단계)
1. `app/routes.ts` Dashboard 라우트 주석 해제
2. 전체 플로우 통합 테스트
3. `npm run typecheck && npm run lint` 검증

---

## 환경 변수 추가

```bash
# 기존
GEMINI_API_KEY=...

# 신규 (TTS용)
GOOGLE_CLOUD_TTS_API_KEY=...        # Google Cloud TTS API 키
# 또는
GOOGLE_APPLICATION_CREDENTIALS=...   # 서비스 계정 JSON 경로

# 향후 (Lyria 2 연동 시)
# GOOGLE_LYRIA_API_KEY=...
```

---

## 기술적 고려사항

### 1. Gemini URL 분석 (트렌드 추출)

Gemini 2.5 Flash는 URL 직접 분석을 지원하지 않으므로, 대안 전략:

- **방안 A**: 서버에서 `fetch(url)` → HTML 파싱 → 텍스트 추출 → Gemini에 전달
- **방안 B**: YouTube Data API v3로 trending 데이터 가져와서 Gemini에 전달
- **방안 C**: 사용자가 트렌드 페이지 텍스트를 복사/붙여넣기

**권장**: 방안 A + B 조합. URL을 받으면 먼저 YouTube Data API로 시도, 실패 시 fetch+파싱 폴백.

### 2. 이미지 생성 vs 비디오 생성

Opal은 Veo3로 실제 비디오를 생성하지만, 현재 TubeGAI에서 사용 가능한 모델은 `nano-banana-pro-preview` (이미지)이다.

- **초기 구현**: 이미지 시퀀스 생성 (3-5장 키프레임)으로 대체
- **UI 표현**: 이미지 슬라이드쇼/캐러셀로 영상 컨셉 시각화
- **향후**: Veo API 또는 Vertex AI Video 연동 시 실제 영상 생성으로 업그레이드

### 3. 배경 음악 생성

Google Lyria 2는 현재 공개 API가 제한적이다.

- **초기 구현**: 프리셋 BGM 라이브러리 (로열티프리 트랙 5-10개 내장)
  - 장르별: upbeat, calm, dramatic, cinematic, tech
  - AI가 영상 아이디어 분위기에 맞는 트랙 자동 선택
- **향후**: Lyria 2 API 연동

### 4. Google Cloud TTS 비용

- **Standard 음성**: 무료 100만 자/월 → 초기 구현에 충분
- **WaveNet/Neural2 음성**: 유료 ($16/100만 자)
- **권장**: Standard 음성으로 시작, 품질 필요 시 WaveNet 전환

### 5. 에러 핸들링

- 각 파이프라인 단계 독립 실행 → 한 단계 실패 시 나머지 계속
- 실패한 단계만 재시도 가능한 UI 제공
- 세션 상태 DB 저장 → 페이지 새로고침 후에도 결과 유지

---

## 참고 문서

- 원본 스펙: [Studio-Dashboard-for-Opal-TrendTube-App-en.md](Studio-Dashboard-for-Opal-TrendTube-App-en.md)
- 한국어 번역: [Studio-Dashboard-for-Opal-TrendTube-App-ko.md](Studio-Dashboard-for-Opal-TrendTube-App-ko.md)
