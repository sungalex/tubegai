# TrendTube Studio Dashboard 구현 계획

## 개요

Google Opal TrendTube 앱 컨셉을 TubeGAI Studio Dashboard에 구현한다.
유튜브 트렌드 URL과 사용자 아이디어를 입력하면, AI가 자동으로 영상 아이디어 → 영상 → 배경음악 → 나레이션 → 보이스오버 → 영상 합성을 **7단계 파이프라인으로 한번에 생성**하는 기능이다.

### Opal TrendTube vs TubeGAI 매핑

| Opal TrendTube            | TubeGAI 구현                    | AI 모델 / 기술                  |
| ------------------------- | ------------------------------- | ------------------------------- |
| Enter URL                 | YouTube 트렌드 URL 입력         | -                               |
| Add Idea                  | 사용자 아이디어 텍스트 입력     | -                               |
| Add Image                 | 참고 이미지 업로드 (선택)       | -                               |
| Extract YouTube Trends    | 트렌드 콘텐츠 추출/분석         | `gemini-2.5-flash`              |
| Generate Video Ideas      | 바이럴 영상 아이디어 생성       | `gemini-2.5-flash`              |
| Generate YouTube Video    | AI 영상 생성 (8초 동영상)       | `veo-3.0-generate-preview`      |
| Generate Background Music | AI 배경 음악 생성 (8초)         | `lyria-002` (Vertex AI)         |
| Write Narration Script    | 나레이션 스크립트 작성 (8초)    | `gemini-2.5-flash-lite`         |
| Generate Voiceover        | 음성 나레이션 생성 (8초)        | Google Cloud TTS                |
| Compose Video             | 영상 합성 (FFmpeg)              | FFmpeg (server-side)            |
| Display Results           | 결과 대시보드 (비디오 플레이어) | -                               |

---

## 아키텍처

### 파이프라인 흐름 (7단계)

```
[입력 단계]
  ├── YouTube 트렌드 URL
  ├── 사용자 아이디어 (텍스트)
  └── 참고 이미지 (선택)
         │
         ▼
[Step 1] 트렌드 추출 (Gemini 2.5-flash)
         │
         ▼
[Step 2] 영상 아이디어 생성 (Gemini 2.5-flash)
         │
         ├──────────────────┬───────────────────┐
         ▼                  ▼                   ▼
[Step 3]             [Step 4]             [Step 5]
영상 생성             배경음악 생성         나레이션 스크립트 생성
(Veo 3)              (Lyria 2)            (Gemini 2.5-flash-lite)
8초 영상              8초 음악                  │
         │                  │                   ▼
         │                  │             [Step 6]
         │                  │             보이스오버 생성
         │                  │             (Google Cloud TTS)
         │                  │             8초 분량
         │                  │                   │
         └──────────────────┴───────────────────┘
                           │
                           ▼
                     [Step 7]
                     영상 합성 (FFmpeg)
                     video + music + voiceover → MP4
                           │
                           ▼
                    [결과 대시보드]
              합성 영상 + 개별 에셋 + 텍스트 결과
```

### 병렬 처리 전략

- **순차 실행**: Step 1 → Step 2
- **병렬 실행**: Step 3 (영상), Step 4 (음악), Step 5 (스크립트) 동시 시작
- **조건부 순차**: Step 6 (보이스오버)는 Step 5 완료 후 즉시 실행 (3, 4는 계속 진행)
- **합성 대기**: Step 7은 Steps 3, 4, 6 모두 완료 후 실행
- SSE 스트림으로 각 단계 진행 상황 + AI 입력/출력 실시간 전송

```typescript
// 병렬 실행 전략 (의사코드)
const videoPromise = generateVideo(ideas);       // Step 3 시작
const musicPromise = generateMusic(ideas);       // Step 4 시작
const script = await generateNarrationScript(ideas); // Step 5 대기

const voiceover = await generateVoiceover(script);   // Step 6 (5 완료 후)
const [video, music] = await Promise.all([videoPromise, musicPromise]); // 3, 4 대기

const composited = await composeVideo(video, music, voiceover); // Step 7
```

---

## 파일 구조

### 신규 파일

```
app/
├── features/studio/
│   ├── pages/
│   │   └── studio-dashboard-page.tsx          # 대시보드 메인 (7단계 SSE 핸들러)
│   ├── components/
│   │   ├── trendtube-input-form.tsx           # 입력 폼 (URL + 아이디어 + 이미지)
│   │   ├── trendtube-pipeline-progress.tsx    # 파이프라인 진행 (AI Input/Output 표시)
│   │   └── trendtube-results-display.tsx      # 결과 표시 (비디오 플레이어 + 에셋)
│   ├── api/
│   │   └── trendtube-generate-stream.ts       # SSE 스트림 API 라우트 (7단계)
│   └── studio-trendtube-schema.ts             # TrendTube 전용 DB 스키마
├── common/data/
│   └── trendtube.data.server.ts               # TrendTube 데이터 레이어
├── common/types/
│   └── trendtube.types.ts                     # TrendTube 전용 타입
└── lib/
    ├── ai-trendtube.server.ts                 # TrendTube AI (트렌드/아이디어/스크립트)
    ├── ai-veo.server.ts                       # Veo 3 영상 생성 서비스 [신규]
    ├── ai-lyria.server.ts                     # Lyria 2 음악 생성 서비스 [신규]
    ├── video-composer.server.ts               # FFmpeg 영상 합성 서비스 [신규]
    └── tts.server.ts                          # Google Cloud TTS 서비스
```

### 수정 파일

```
app/
├── routes.ts                                  # Dashboard 라우트 활성화 + API 추가
├── drizzle/enums.ts                           # trendtube enum 업데이트
├── drizzle/index.ts                           # 새 스키마 export 추가
└── features/studio/
    ├── layouts/studio-layout.tsx               # 사이드바에 Dashboard 메뉴 추가
    └── components/studio-sidebar.tsx           # Dashboard 네비게이션 항목 추가
```

---

## 상세 구현

### Phase 1: 데이터베이스 스키마

#### 1.1 Enum 업데이트 (`app/drizzle/enums.ts`)

```typescript
export const trendtubePipelineStatusEnum = tubegaiSchema.enum(
  "trendtube_pipeline_status",
  ["pending", "extracting", "generating_ideas", "generating_media", "compositing", "completed", "failed"]
);

export const trendtubeMediaTypeEnum = tubegaiSchema.enum(
  "trendtube_media_type",
  ["generated_video", "background_music", "voiceover", "composited_video"]
);
```

> **마이그레이션 참고**: 기존 `video_image` 값은 Postgres에서 삭제 불가. `generated_video`, `composited_video` 추가 + `compositing` 상태 추가. 기존 `video_image` 레코드는 미사용 처리.

```sql
-- 마이그레이션 SQL
ALTER TYPE public.trendtube_pipeline_status ADD VALUE IF NOT EXISTS 'compositing';
ALTER TYPE public.trendtube_media_type ADD VALUE IF NOT EXISTS 'generated_video';
ALTER TYPE public.trendtube_media_type ADD VALUE IF NOT EXISTS 'composited_video';
```

#### 1.2 테이블 (`app/features/studio/studio-trendtube-schema.ts`)

**trendtube_session** — 파이프라인 세션

| 컬럼                | 타입      | 설명                    |
| ------------------- | --------- | ----------------------- |
| id                  | uuid (PK) | 세션 ID                 |
| project_id          | uuid (FK) | 프로젝트 참조           |
| user_id             | uuid (FK) | 사용자 참조             |
| trends_url          | text      | 입력 YouTube 트렌드 URL |
| user_idea           | text      | 사용자 아이디어 텍스트  |
| reference_image_url | text      | 참고 이미지 URL (선택)  |
| voice_option        | text      | 음성 옵션               |
| status              | enum      | 파이프라인 상태         |
| current_step        | integer   | 현재 진행 단계 (1-7)    |
| error_message       | text      | 에러 메시지 (실패 시)   |
| created_at          | timestamp | 생성일                  |
| completed_at        | timestamp | 완료일                  |

**trendtube_result** — 파이프라인 결과 데이터

| 컬럼             | 타입      | 설명                 |
| ---------------- | --------- | -------------------- |
| id               | uuid (PK) | 결과 ID              |
| session_id       | uuid (FK) | 세션 참조            |
| extracted_trends | text      | 추출된 트렌드 요약   |
| video_ideas      | text      | 생성된 영상 아이디어 |
| narration_script | text      | 나레이션 스크립트    |
| created_at       | timestamp | 생성일               |

**trendtube_media** — 생성된 미디어 에셋

| 컬럼           | 타입      | 설명                                               |
| -------------- | --------- | -------------------------------------------------- |
| id             | uuid (PK) | 미디어 ID                                          |
| session_id     | uuid (FK) | 세션 참조                                          |
| media_type     | enum      | generated_video/background_music/voiceover/composited_video |
| media_asset_id | uuid (FK) | mediaAssets 참조                                   |
| public_url     | text      | 미디어 공개 URL                                    |
| metadata       | jsonb     | 추가 메타데이터 (duration 등)                      |
| created_at     | timestamp | 생성일                                             |

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

#### 2.3 영상 생성 (`ai-veo.server.ts`) [신규]

```typescript
async function generateVideo(
  videoIdeas: string,
  options?: { durationSeconds?: number; aspectRatio?: string }
): Promise<{ url: string; duration: number }>
```

- **모델**: `veo-3.0-generate-preview` (Google Veo 3 API)
- **SDK**: `@google/genai` (기존 `@google/generative-ai`와 별도 추가)
- **기능**: 영상 아이디어 기반 **8초 동영상** 생성 (전체 스토리의 첫 8초 분량)
- **입력**: 영상 아이디어 텍스트
- **출력**: 비디오 파일 URL + 재생 시간
- **구현 패턴**:
  1. 아이디어에서 영상 프롬프트 생성 (Gemini로 시각적 장면 설명 추출)
  2. `ai.models.generateVideos()` 호출 → operation ID 반환
  3. 10초 간격 폴링으로 완료 대기 (30~120초 소요)
  4. 완료 시 비디오 바이너리 → Supabase Storage 업로드
- **Aspect Ratio**: `16:9` (기본값)
- **에러 처리**: 생성 실패 시 placeholder 비디오 반환

```typescript
// Veo 3 API 호출 예시
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

let operation = await ai.models.generateVideos({
  model: "veo-3.0-generate-preview",
  prompt: videoPrompt,
  config: {
    aspectRatio: "16:9",
    numberOfVideos: 1,
  },
});

// 폴링
while (!operation.done) {
  await new Promise((r) => setTimeout(r, 10000));
  operation = await ai.operations.getVideosOperation({ operation });
}
```

#### 2.4 배경 음악 생성 (`ai-lyria.server.ts`) [신규]

```typescript
async function generateMusic(
  videoIdeas: string,
  options?: { durationSeconds?: number }
): Promise<{ url: string; duration: number }>
```

- **모델**: `lyria-002` (Vertex AI)
- **기능**: 영상 아이디어 분위기에 맞는 **8초 배경 음악** 생성
- **입력**: 영상 아이디어 텍스트
- **출력**: 오디오 파일 URL + 재생 시간
- **구현 패턴**:
  1. 아이디어에서 음악 프롬프트 생성 (분위기, 템포, 장르 추출)
  2. Vertex AI REST endpoint `lyria-002:predict` 호출
  3. 30초 WAV 오디오 생성 → FFmpeg로 8초 트리밍
  4. Supabase Storage 업로드

```typescript
// Lyria 2 API 호출 예시 (Vertex AI REST)
const response = await fetch(
  `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/lyria-002:predict`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instances: [{ prompt: musicPrompt }],
      parameters: { sampleCount: 1 },
    }),
  }
);
```

#### 2.5 나레이션 스크립트 생성 (`ai-trendtube.server.ts`)

```typescript
async function generateNarrationScript(videoIdeas: string): Promise<string>
```

- **모델**: `gemini-2.5-flash-lite`
- **기능**: 영상 아이디어 기반 **8초 분량** 나레이션 스크립트 작성
- **입력**: 영상 아이디어 텍스트
- **출력**: 프로덕션 레디 나레이션 스크립트
- **프롬프트 전략**:
  - 8초 분량에 맞는 간결한 오프닝 나레이션
  - 한국어 기준 약 40자, 영어 기준 약 20단어
  - 시청자를 끌어들이는 강력한 훅 문장
  - 보이스오버에 최적화된 문장 구조

#### 2.6 음성 나레이션 생성 (`tts.server.ts`)

```typescript
async function generateVoiceover(
  script: string,
  voice: "male_en" | "female_en" | "male_ko" | "female_ko",
  options?: { targetDuration?: number }
): Promise<{ audioBase64: string; mimeType: string; estimatedDuration: number }>
```

- **모델**: Google Cloud Text-to-Speech API
- **기능**: 나레이션 스크립트를 **8초 음성**으로 변환
- **입력**: 스크립트 텍스트, 음성 옵션, 타겟 길이
- **출력**: Base64 오디오 + MIME 타입 + 재생 시간
- **8초 타겟 로직**: 스크립트 길이를 8초에 맞게 자동 조정 (한국어 ~40자, 영어 ~20단어)
- **음성 옵션**:
  - 남성/여성 한국어 (ko-KR-Standard-C, ko-KR-Standard-A)
  - 남성/여성 영어 (en-US-Standard-B, en-US-Standard-C)

#### 2.7 영상 합성 (`video-composer.server.ts`) [신규]

```typescript
async function composeVideo(options: {
  videoUrl: string;
  musicUrl: string;
  voiceoverUrl: string;
  outputFormat?: "mp4";
}): Promise<{ url: string; duration: number }>
```

- **기술**: FFmpeg (server-side, `child_process.execFile`)
- **기능**: 영상 + 배경 음악 + 보이스오버를 하나의 MP4로 합성
- **입력**: 비디오 URL, 음악 URL, 보이스오버 URL
- **출력**: 합성 MP4 URL + 재생 시간
- **오디오 믹싱**: 배경 음악 30% 볼륨 + 보이스오버 100% 볼륨
- **구현 패턴**:
  1. 3개 미디어 파일을 `/tmp` 디렉토리에 다운로드
  2. FFmpeg로 합성
  3. 결과 MP4를 Supabase Storage 업로드
  4. temp 파일 정리

```bash
# FFmpeg 합성 명령어
ffmpeg -i video.mp4 -i music.wav -i voiceover.mp3 \
  -filter_complex "[1:a]volume=0.3[bg];[2:a]volume=1.0[vo];[bg][vo]amix=inputs=2:duration=shortest[aout]" \
  -map 0:v -map "[aout]" \
  -c:v copy -c:a aac -shortest \
  -t 8 output.mp4
```

---

### Phase 3: 타입 정의

#### 3.1 타입 업데이트 (`app/common/types/trendtube.types.ts`)

```typescript
// 파이프라인 상태
export type TrendTubePipelineStatus =
  | "pending"
  | "extracting"
  | "generating_ideas"
  | "generating_media"
  | "compositing"
  | "completed"
  | "failed";

// 미디어 타입
export type TrendTubeMediaType =
  | "generated_video"
  | "background_music"
  | "voiceover"
  | "composited_video";

export type TrendTubeVoiceOption = "male_ko" | "female_ko" | "male_en" | "female_en";

// 입력
export interface TrendTubeInput {
  projectId: string;
  trendsUrl: string;
  userIdea: string;
  referenceImageUrl?: string;
  voiceOption?: TrendTubeVoiceOption;
}

// 단계별 AI 입출력 데이터
export interface TrendTubeStepIO {
  type: "text" | "video" | "audio" | "mixed";
  label: string;
  text?: string;
  textPreview?: string;
  mediaUrl?: string;
  mediaDuration?: number;
  items?: TrendTubeStepIO[];
}

// 파이프라인 단계
export interface TrendTubePipelineStep {
  step: number;
  name: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  input?: TrendTubeStepIO;
  output?: TrendTubeStepIO;
  error?: string;
}

// SSE 스트림 이벤트
export type TrendTubeStreamEvent =
  | { type: "pipeline_start"; sessionId: string }
  | { type: "step_start"; step: number; stepName: string; total: number;
      input?: TrendTubeStepIO }
  | { type: "step_progress"; step: number; text: string }
  | { type: "step_complete"; step: number; stepName: string;
      output?: TrendTubeStepIO }
  | { type: "pipeline_complete"; sessionId: string; results: TrendTubeResults }
  | { type: "pipeline_error"; step: number; error: string };

// 전체 결과
export interface TrendTubeResults {
  extractedTrends: string;
  videoIdeas: string;
  narrationScript: string;
  videoUrl?: string;
  musicUrl?: string;
  musicDuration?: number;
  voiceoverUrl?: string;
  voiceoverDuration?: number;
  compositedVideoUrl?: string;
  compositedDuration?: number;
}
```

---

### Phase 4: API 라우트

#### 4.1 TrendTube 스트림 API (`api/trendtube-generate-stream.ts`)

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

**SSE 이벤트 타입 (확장)**:

| 이벤트 타입         | 데이터                                            | 설명                        |
| ------------------- | ------------------------------------------------- | --------------------------- |
| `pipeline_start`    | `{ sessionId }`                                   | 파이프라인 시작             |
| `step_start`        | `{ step, stepName, total: 7, input? }`            | 단계 시작 + AI 입력 데이터  |
| `step_progress`     | `{ step, text }`                                  | 단계 진행 텍스트            |
| `step_complete`     | `{ step, stepName, output? }`                     | 단계 완료 + 생성 결과       |
| `pipeline_complete` | `{ sessionId, results }`                          | 전체 완료                   |
| `pipeline_error`    | `{ step, error }`                                 | 에러 발생                   |

**파이프라인 실행 흐름**:

```typescript
async function executePipeline(controller, input) {
  const TOTAL_STEPS = 7;

  // ========================================
  // Step 1: 트렌드 추출
  // ========================================
  emit("step_start", {
    step: 1, stepName: "트렌드 추출", total: TOTAL_STEPS,
    input: {
      type: "text",
      label: "YouTube URL + 사용자 아이디어",
      text: `URL: ${input.trendsUrl}\n아이디어: ${input.userIdea}`,
    },
  });
  const trends = await extractYouTubeTrends(input.trendsUrl, input.userIdea);
  emit("step_complete", {
    step: 1, stepName: "트렌드 추출",
    output: {
      type: "text", label: "추출된 트렌드",
      text: trends, textPreview: trends.substring(0, 200) + "...",
    },
  });

  // ========================================
  // Step 2: 영상 아이디어 생성
  // ========================================
  emit("step_start", {
    step: 2, stepName: "영상 아이디어 생성", total: TOTAL_STEPS,
    input: {
      type: "text", label: "트렌드 분석",
      textPreview: trends.substring(0, 200) + "...",
    },
  });
  const ideas = await generateVideoIdeas(trends, input.referenceImageUrl);
  emit("step_complete", {
    step: 2, stepName: "영상 아이디어 생성",
    output: {
      type: "text", label: "영상 아이디어",
      text: ideas, textPreview: ideas.substring(0, 200) + "...",
    },
  });

  // ========================================
  // Step 3, 4, 5: 병렬 실행
  // ========================================
  emit("step_start", {
    step: 3, stepName: "영상 생성 (Veo 3)", total: TOTAL_STEPS,
    input: { type: "text", label: "비디오 프롬프트", textPreview: videoPrompt },
  });
  emit("step_start", {
    step: 4, stepName: "배경음악 생성 (Lyria 2)", total: TOTAL_STEPS,
    input: { type: "text", label: "음악 프롬프트", textPreview: musicPrompt },
  });
  emit("step_start", {
    step: 5, stepName: "나레이션 스크립트 생성", total: TOTAL_STEPS,
    input: {
      type: "text", label: "영상 아이디어",
      textPreview: ideas.substring(0, 200) + "...",
    },
  });

  // 병렬 시작
  const videoPromise = generateVideo(ideas, { durationSeconds: 8 });
  const musicPromise = generateMusic(ideas, { durationSeconds: 8 });
  const scriptPromise = generateNarrationScript(ideas);

  // Step 5 완료 대기 → Step 6 즉시 시작
  const narrationScript = await scriptPromise;
  emit("step_complete", {
    step: 5, stepName: "나레이션 스크립트 생성",
    output: {
      type: "text", label: "나레이션 스크립트",
      text: narrationScript,
      textPreview: narrationScript.substring(0, 200) + "...",
    },
  });

  // ========================================
  // Step 6: 보이스오버 생성 (Step 5 완료 후)
  // ========================================
  emit("step_start", {
    step: 6, stepName: "보이스오버 생성", total: TOTAL_STEPS,
    input: {
      type: "text", label: "나레이션 스크립트",
      textPreview: narrationScript.substring(0, 100) + "...",
    },
  });
  const voiceover = await generateVoiceover(narrationScript, input.voiceOption, { targetDuration: 8 });
  emit("step_complete", {
    step: 6, stepName: "보이스오버 생성",
    output: {
      type: "audio", label: "보이스오버 (8초)",
      mediaUrl: voiceoverUrl, mediaDuration: voiceover.estimatedDuration,
    },
  });

  // Step 3, 4 완료 대기
  const [videoResult, musicResult] = await Promise.all([videoPromise, musicPromise]);

  emit("step_complete", {
    step: 3, stepName: "영상 생성 (Veo 3)",
    output: {
      type: "video", label: "생성된 영상 (8초)",
      mediaUrl: videoResult.url, mediaDuration: 8,
    },
  });
  emit("step_complete", {
    step: 4, stepName: "배경음악 생성 (Lyria 2)",
    output: {
      type: "audio", label: "배경 음악 (8초)",
      mediaUrl: musicResult.url, mediaDuration: musicResult.duration,
    },
  });

  // ========================================
  // Step 7: 영상 합성 (FFmpeg)
  // ========================================
  emit("step_start", {
    step: 7, stepName: "영상 합성", total: TOTAL_STEPS,
    input: {
      type: "mixed", label: "합성 소스",
      items: [
        { type: "video", label: "원본 영상", mediaUrl: videoResult.url },
        { type: "audio", label: "배경 음악", mediaUrl: musicResult.url },
        { type: "audio", label: "보이스오버", mediaUrl: voiceoverUrl },
      ],
    },
  });
  const composited = await composeVideo({
    videoUrl: videoResult.url,
    musicUrl: musicResult.url,
    voiceoverUrl,
  });
  emit("step_complete", {
    step: 7, stepName: "영상 합성",
    output: {
      type: "video", label: "합성 완료 영상",
      mediaUrl: composited.url, mediaDuration: composited.duration,
    },
  });

  // DB 저장 + Pipeline Complete
  emit("pipeline_complete", { sessionId, results: { ... } });
}
```

---

### Phase 5: 프론트엔드 UI

#### 5.1 Dashboard 페이지 (`studio-dashboard-page.tsx`)

**페이지 구조**: 3단계 UI 전환

1. **입력 모드**: 트렌드 URL + 아이디어 입력 폼
2. **생성 모드**: 파이프라인 진행 상황 (AI Input/Output 실시간 표시)
3. **결과 모드**: 합성 영상 + 개별 에셋 + 텍스트 결과 대시보드

**라우트**: `/studio/dashboard` (기존), `/studio/dashboard/:projectId` (기존)

**SSE 핸들러 업데이트**:
```typescript
const TOTAL_STEPS = 7;

const INITIAL_STEPS: TrendTubePipelineStep[] = [
  { step: 1, name: "트렌드 추출", status: "pending" },
  { step: 2, name: "영상 아이디어 생성", status: "pending" },
  { step: 3, name: "영상 생성 (Veo 3)", status: "pending" },
  { step: 4, name: "배경음악 생성 (Lyria 2)", status: "pending" },
  { step: 5, name: "나레이션 스크립트 생성", status: "pending" },
  { step: 6, name: "보이스오버 생성", status: "pending" },
  { step: 7, name: "영상 합성", status: "pending" },
];

// SSE 이벤트 처리에서 input/output 저장
case "step_start":
  updateStep(event.step, {
    status: "in_progress",
    name: event.stepName,
    input: event.input,     // AI 입력 정보 저장
  });
  break;

case "step_complete":
  updateStep(event.step, {
    status: "completed",
    name: event.stepName,
    output: event.output,   // 생성 결과 저장
  });
  break;
```

#### 5.2 입력 폼 컴포넌트 (`trendtube-input-form.tsx`)

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

#### 5.3 파이프라인 진행 컴포넌트 (`trendtube-pipeline-progress.tsx`) — 재설계

각 단계를 **Collapsible 카드**로 확장하여 **AI 입력**과 **생성 결과**를 실시간 표시.

**단계별 AI Input / Output 데이터 매핑**:

| Step                      | AI 입력 (UI에 표시)                            | 생성 결과 (UI에 표시)                          |
| ------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| 1. 트렌드 추출            | URL + 사용자 아이디어 텍스트                   | 추출된 트렌드 전문 (scrollable 텍스트)         |
| 2. 아이디어 생성          | Step 1 트렌드 요약 + 참고 이미지               | 영상 아이디어 전문 (scrollable 텍스트)         |
| 3. 영상 생성 (Veo 3)     | 비디오 프롬프트 텍스트                         | 8초 비디오 `<video>` 인라인 플레이어           |
| 4. 배경음악 생성 (Lyria 2)| 음악 프롬프트 텍스트                           | 8초 `<audio>` 인라인 플레이어                  |
| 5. 스크립트 생성          | Step 2 아이디어 요약                           | 나레이션 스크립트 전문 (scrollable 텍스트)     |
| 6. 보이스오버             | Step 5 스크립트 텍스트                         | 8초 `<audio>` 인라인 플레이어 + 재생 시간      |
| 7. 영상 합성              | "영상 + 음악 + 보이스오버" 에셋 목록 (Badge)   | 합성 MP4 `<video>` 인라인 플레이어 + 다운로드  |

**와이어프레임**:

```
┌──────────────────────────────────────────────────────┐
│  생성 중... (4/7 단계)                 전체 57%      │
│  ━━━━━━━━━━━━━━━━━━━━░░░░░░░░░                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ✅ Step 1: 트렌드 추출                      [▼]    │
│  ┌────────────────────────────────────────────────┐  │
│  │ 📥 AI 입력                                     │  │
│  │ ┌──────────────────────────────────────────┐   │  │
│  │ │ URL: https://youtube.com/feed/trending   │   │  │
│  │ │ 아이디어: AI 자동화로 돈 버는 방법 3가지 │   │  │
│  │ └──────────────────────────────────────────┘   │  │
│  │                                                │  │
│  │ 📤 생성 결과                                   │  │
│  │ ┌──────────────────────────────────────────┐   │  │
│  │ │ **인기 주제 5개**:                        │   │  │
│  │ │ 1. AI 자동화 도구 활용법                  │   │  │
│  │ │ 2. 챗봇 비즈니스 구축하기                 │   │  │
│  │ │ ...                            [더 보기]  │   │  │
│  │ └──────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ✅ Step 2: 영상 아이디어 생성               [▼]    │
│  ┌────────────────────────────────────────────────┐  │
│  │ 📥 AI 입력                                     │  │
│  │ ┌──────────────────────────────────────────┐   │  │
│  │ │ 트렌드: AI 자동화, 챗봇, 생산성...       │   │  │
│  │ └──────────────────────────────────────────┘   │  │
│  │                                                │  │
│  │ 📤 생성 결과                                   │  │
│  │ ┌──────────────────────────────────────────┐   │  │
│  │ │ 💡 아이디어 1: AI 자동화 월급 뛰어넘기   │   │  │
│  │ │ 💡 아이디어 2: 챗봇으로 24시간 수익...   │   │  │
│  │ │ ...                            [더 보기]  │   │  │
│  │ └──────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ⏳ Step 3: 영상 생성 (Veo 3)               [▼]    │
│  ┌────────────────────────────────────────────────┐  │
│  │ 📥 AI 입력                                     │  │
│  │ ┌──────────────────────────────────────────┐   │  │
│  │ │ 프롬프트: "A dynamic scene showcasing AI  │   │  │
│  │ │ automation tools with modern UI..."       │   │  │
│  │ └──────────────────────────────────────────┘   │  │
│  │                                                │  │
│  │ 📤 생성 결과                                   │  │
│  │ ┌──────────────────────────────────────────┐   │  │
│  │ │       ⏳ 영상 생성 대기 중... (30s)       │   │  │
│  │ │       ████████░░░░░░░░ 폴링 중            │   │  │
│  │ └──────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ⏳ Step 4: 배경음악 생성 (Lyria 2)          [▼]    │
│  ┌────────────────────────────────────────────────┐  │
│  │ 📥 AI 입력                                     │  │
│  │ ┌──────────────────────────────────────────┐   │  │
│  │ │ 프롬프트: "Upbeat electronic background   │   │  │
│  │ │ music for tech/AI content..."             │   │  │
│  │ └──────────────────────────────────────────┘   │  │
│  │                                                │  │
│  │ 📤 생성 결과                                   │  │
│  │ ┌──────────────────────────────────────────┐   │  │
│  │ │       ⏳ 음악 생성 중...                   │   │  │
│  │ └──────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ✅ Step 5: 나레이션 스크립트 생성           [▼]    │
│  ┌────────────────────────────────────────────────┐  │
│  │ 📥 AI 입력                                     │  │
│  │ ┌──────────────────────────────────────────┐   │  │
│  │ │ 아이디어: AI 자동화 월급 뛰어넘기 ...    │   │  │
│  │ └──────────────────────────────────────────┘   │  │
│  │                                                │  │
│  │ 📤 생성 결과                                   │  │
│  │ ┌──────────────────────────────────────────┐   │  │
│  │ │ [인트로] 안녕하세요, 오늘은 AI를...      │   │  │
│  │ │ [본문] 첫 번째 방법은...                  │   │  │
│  │ │ ...                            [더 보기]  │   │  │
│  │ └──────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ⏳ Step 6: 보이스오버 생성                  [▽]    │
│  (접힌 상태 - 스크립트 기반 TTS 생성 중...)         │
│                                                      │
│  ⬜ Step 7: 영상 합성                        [▽]    │
│  (대기 중)                                           │
│                                                      │
│  ─────────────────────────────────────────────────   │
│  [취소하고 돌아가기]                                  │
└──────────────────────────────────────────────────────┘
```

**구현 상세**:
- **사용 컴포넌트**: Shadcn `Collapsible`, `Card`, `Badge`, `Progress` + HTML5 `<video>`, `<audio>`
- **Collapsible 동작 규칙**:
  - **pending 단계**: 접힌 상태, 클릭 불가, 흐린 텍스트
  - **in_progress 단계**: 자동 펼침, AI 입력 표시 + 생성 결과에 로딩 스피너
  - **completed 단계**: 자동 펼침 유지 (사용자가 접을 수 있음), 입력/출력 모두 표시
  - **failed 단계**: 펼침, 에러 메시지 표시
- **텍스트 결과 표시**: `max-h-40 overflow-y-auto` 스크롤 영역
- **미디어 결과 표시**: `<video controls>` 또는 `<audio controls>` 인라인 플레이어
- **복합 입력 (Step 7)**: `items` 배열을 Badge 태그 목록으로 표시
- SSE `step_progress` 이벤트로 폴링 대기 상태 실시간 표시

#### 5.4 결과 표시 컴포넌트 (`trendtube-results-display.tsx`)

합성 영상 중심의 프리미엄 레이아웃.

```
┌──────────────────────────────────────────────────────┐
│  🎬 TrendTube 결과                    [ 새로 생성 ] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │                                              │    │
│  │     🎬 합성된 최종 영상 (MP4)                │    │
│  │     <video> 플레이어 (controls)              │    │
│  │     [ ▶ ━━━━━━━━━━━━━━━ 0:08 ]               │    │
│  │                                              │    │
│  │     [ 📥 다운로드 ]                           │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────── 개별 에셋 ────────────────────┐   │
│  │                                               │   │
│  │  ┌───────────────┐ ┌───────────────┐          │   │
│  │  │ 🎥 원본 영상   │ │ 🎵 배경 음악  │          │   │
│  │  │ <video> 8초    │ │ <audio> 8초   │          │   │
│  │  └───────────────┘ └───────────────┘          │   │
│  │                                               │   │
│  │  ┌───────────────────────────────────┐        │   │
│  │  │ 🎙️ 나레이션 오디오                │        │   │
│  │  │ <audio> 8초                       │        │   │
│  │  └───────────────────────────────────┘        │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  💡 영상 아이디어                     [복사]  │    │
│  │  AI 자동화 관련 트렌드를 활용한 3가지 영상   │    │
│  │  컨셉: ...                                    │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  📝 나레이션 스크립트                 [복사]  │    │
│  │  [인트로] "안녕하세요, 오늘은 AI를..."       │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  📊 트렌드 분석                       [복사]  │    │
│  │  분석된 YouTube 트렌드 요약...               │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  [ 프로젝트로 저장 ]  [ 새로 생성 ]                  │
└──────────────────────────────────────────────────────┘
```

**구현 상세**:
- **Hero 영상**: 합성된 최종 MP4 `<video>` 플레이어 (controls + 다운로드 버튼)
- **개별 에셋 섹션**: 원본 Veo 영상, Lyria 음악, TTS 보이스오버 각각 플레이어
- **텍스트 카드**: 아이디어, 스크립트, 트렌드 분석을 Collapsible 카드로 표시
- **반응형**: 모바일에서 세로 스택, 데스크톱에서 그리드 레이아웃
- **액션 버튼**: "프로젝트로 저장", "새로 생성", "복사", "다운로드"

---

### Phase 6: 라우트 설정

#### 6.1 `app/routes.ts` 변경

```typescript
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

#### 6.2 사이드바 변경

`studio-sidebar.tsx`에 Dashboard 메뉴 항목 추가:
- 아이콘: `Sparkles` (lucide-react)
- 라벨: "TrendTube"
- 위치: 사이드바 최상단 (Script 위)

---

## 구현 순서 (작업 단위)

### Step 1: 데이터베이스 (1단계)
1. `app/drizzle/enums.ts`에 enum 값 추가 (`compositing`, `generated_video`, `composited_video`)
2. `app/features/studio/studio-trendtube-schema.ts` current_step 범위 업데이트 (1-7)
3. `npm run db:generate` → `npm run db:migrate`

### Step 2: 타입 정의 (2단계)
1. `app/common/types/trendtube.types.ts` 전면 업데이트
   - `TrendTubeStepIO` 타입 추가 (단계별 AI 입출력)
   - `TrendTubePipelineStep` 타입에 `input`/`output` 필드 추가
   - `TrendTubeStreamEvent` 타입에 `input`/`output` 필드 추가
   - `TrendTubeResults` 타입 변경 (`imageUrls` → `videoUrl`, `compositedVideoUrl`)
   - `TrendTubeMediaType` 업데이트
   - `TrendTubePipelineStatus` 업데이트

### Step 3: AI 서버 함수 (3단계)
1. `app/lib/ai-veo.server.ts` 신규 생성
   - `generateVideo()` — Veo 3 API 영상 생성
2. `app/lib/ai-lyria.server.ts` 신규 생성
   - `generateMusic()` — Lyria 2 API 음악 생성
3. `app/lib/video-composer.server.ts` 신규 생성
   - `composeVideo()` — FFmpeg 합성
4. `app/lib/ai-trendtube.server.ts` 수정
   - `generateVideoImages()` 함수 삭제
   - `selectBackgroundMusic()` 함수 삭제
   - `generateNarrationScript()` 프롬프트 8초 분량으로 조정
5. `app/lib/tts.server.ts` 수정
   - `generateVoiceover()` 에 `targetDuration` 옵션 추가 (8초)

### Step 4: 데이터 레이어 (4단계)
1. `app/common/data/trendtube.data.server.ts` 기존 함수 유지 (변경 불필요)

### Step 5: API 라우트 (5단계)
1. `app/features/studio/api/trendtube-generate-stream.ts` 전면 재작성
   - TOTAL_STEPS: 6 → 7
   - 7단계 파이프라인 실행 흐름
   - SSE 이벤트에 `input`/`output` 데이터 포함
   - 병렬 실행 전략 적용 (3,4,5 동시 → 6 → 7)
2. `app/routes.ts` 라우트 확인 (기존 유지)

### Step 6: 프론트엔드 UI (6단계)
1. `trendtube-pipeline-progress.tsx` — Collapsible 카드 재작성
   - 각 단계별 AI 입력 / 생성 결과 실시간 표시
   - 텍스트: scrollable 영역, 미디어: `<video>` / `<audio>` 플레이어
2. `trendtube-results-display.tsx` — 비디오 플레이어 중심 재작성
   - 이미지 캐러셀 → 합성 영상 Hero 비디오 플레이어
   - 개별 에셋 섹션 (원본 영상 + 배경 음악 + 나레이션 오디오)
3. `studio-dashboard-page.tsx` — SSE 핸들러 + steps 상태 업데이트
   - INITIAL_STEPS 7단계로 업데이트
   - step_start 이벤트에서 `input` 저장
   - step_complete 이벤트에서 `output` 저장

### Step 7: 라우트 활성화 및 통합 (7단계)
1. 전체 플로우 통합 테스트
2. `npm run typecheck && npm run lint` 검증

---

## 환경 변수 추가

```bash
# 기존
GEMINI_API_KEY=...

# 신규: Veo 3 (Gemini API 경유)
GOOGLE_GENAI_API_KEY=...               # @google/genai SDK API 키 (유료 티어 필요)
                                       # GEMINI_API_KEY와 동일할 수 있음

# 신규: Lyria 2 (Vertex AI)
GOOGLE_CLOUD_PROJECT_ID=...            # GCP 프로젝트 ID
GOOGLE_CLOUD_LOCATION=us-central1      # Vertex AI 리전
GOOGLE_APPLICATION_CREDENTIALS=...     # 서비스 계정 JSON 경로

# 기존 (TTS)
# GEMINI_API_KEY 재사용 (Google Cloud TTS)

# 선택: FFmpeg
FFMPEG_PATH=/usr/bin/ffmpeg            # FFmpeg 바이너리 경로 (기본: system PATH)
```

---

## 기술적 고려사항

### 1. SDK 마이그레이션

현재 프로젝트는 `@google/generative-ai` (레거시 Gemini SDK)를 사용 중. Veo 3, Lyria 2 API는 `@google/genai` (새 통합 SDK) 필요.

- **권장**: `@google/genai`를 추가 의존성으로 설치하고 Veo/Lyria 서비스에서만 사용
- 기존 Gemini 텍스트 생성은 `@google/generative-ai` 유지 (리스크 최소화)
- 향후 전체 SDK 마이그레이션 고려

### 2. Veo 3 폴링 지연

- Veo 3 영상 생성은 비동기 작업으로 **30~120초** 소요
- `step_progress` SSE 이벤트로 10초 간격 폴링 상태를 클라이언트에 전송
- UI에 "영상 생성 대기 중..." + 폴링 카운터 표시

### 3. Lyria 2 Duration 트리밍

- Lyria 2는 30초 오디오를 생성하지만 8초만 필요
- `ai-lyria.server.ts`에서 생성 후 FFmpeg로 즉시 8초 트리밍
- 또는 `video-composer.server.ts`에서 합성 시 `-t 8` 옵션으로 처리

### 4. 미디어 저장 전략

- **현재**: Base64 data URL로 DB에 저장 (이미지/오디오용으로는 OK)
- **변경 필요**: 영상 파일은 수 MB~수십 MB → Supabase Storage 업로드 + public URL 저장
- FFmpeg 합성 시 temp 파일 → `/tmp` 디렉토리 사용 → 완료 후 정리

### 5. FFmpeg 서버 의존성

- 개발 환경: `brew install ffmpeg` (macOS)
- 프로덕션: Docker 이미지에 FFmpeg 포함 또는 Lambda Layer
- npm 의존성 불필요 — `child_process.execFile`로 호출

### 6. 비용 고려

| 서비스 | 비용 | 비고 |
|--------|------|------|
| Veo 3 | 영상 초당 과금 | 유료 티어 API 키 필요 |
| Lyria 2 | $0.06 / 30초 | Vertex AI 과금 |
| Google Cloud TTS | 무료 100만 자/월 (Standard) | 초기 구현에 충분 |
| FFmpeg | 서버 CPU만 | API 비용 없음 |
| Gemini 2.5-flash | 저비용 | 기존과 동일 |

### 7. Gemini URL 분석 (트렌드 추출)

- **방안 A**: 서버에서 `fetch(url)` → HTML 파싱 → 텍스트 추출 → Gemini에 전달
- **방안 B**: YouTube Data API v3로 trending 데이터 가져와서 Gemini에 전달
- **권장**: 방안 A + B 조합

### 8. 에러 핸들링

- 각 파이프라인 단계 독립 실행 → 한 단계 실패 시 나머지 계속
- 실패한 단계만 재시도 가능한 UI 제공
- 세션 상태 DB 저장 → 페이지 새로고침 후에도 결과 유지

---

## 참고 문서

- 원본 스펙: [Studio-Dashboard-for-Opal-TrendTube-App-en.md](Studio-Dashboard-for-Opal-TrendTube-App-en.md)
- 한국어 번역: [Studio-Dashboard-for-Opal-TrendTube-App-ko.md](Studio-Dashboard-for-Opal-TrendTube-App-ko.md)
