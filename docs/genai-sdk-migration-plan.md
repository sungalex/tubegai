# `@google/genai` 통합 마이그레이션 + API Key 세분화 방안

## Context

현재 AI 서비스가 2개 SDK로 분산되어 있어 코드 일관성이 떨어지고, 단일 API Key로 모델별 요금 분석이 불가능함. `@google/genai` SDK가 모든 기능(텍스트, 이미지, 비디오, 음악, TTS)을 통합 지원하므로, SDK 통합과 API Key 세분화를 동시에 진행함.

---

## 1. 현재 상태 vs 마이그레이션 목표

### SDK 현황

| 항목 | 현재 | 목표 |
|------|------|------|
| 텍스트/이미지 SDK | `@google/generative-ai` v0.24.1 | `@google/genai` v1.44.0 |
| 비디오/음악 SDK | `@google/genai` v1.41.0 | `@google/genai` v1.44.0 (통합) |
| TTS | Google Cloud TTS REST API | `@google/genai` TTS 모델 |
| SDK 수 | **2개** + REST | **1개** |

### API 비교: 서비스별 Before → After

#### 텍스트 생성 (Script, Storyboard, Subtitle, TrendTube, Recommendations, Project Generator)

```typescript
// BEFORE (@google/generative-ai)
const client = new GoogleGenerativeAI(apiKey);
const model = client.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction });
const result = await model.generateContent({ contents: [...] });
const text = result.response.text();

// Streaming
const stream = await model.generateContentStream({ contents: [...] });
for await (const chunk of stream.stream) {
  chunk.text();
}

// AFTER (@google/genai)
const ai = new GoogleGenAI({ apiKey });
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "prompt text",
  config: { systemInstruction, temperature: 0.8, responseMimeType: "application/json" },
});
const text = response.text;  // 직접 접근자 (.text() 메서드 → .text 프로퍼티)

// Streaming
const stream = await ai.models.generateContentStream({
  model: "gemini-2.5-flash",
  contents: "prompt text",
  config: { systemInstruction },
});
for await (const chunk of stream) {
  chunk.text;  // 프로퍼티
}
```

**주요 차이점:**

- `client.getGenerativeModel()` → `ai.models.generateContent()` (모델을 호출마다 지정)
- `systemInstruction`이 모델 초기화 → `config` 객체 내부로 이동
- `generationConfig` → `config` (플랫 구조)
- `result.response.text()` → `response.text` (프로퍼티)
- 스트리밍: `stream.stream` 이터레이터 → 응답 자체가 이터레이터

#### 이미지 생성

```typescript
// BEFORE (@google/generative-ai)
const model = client.getGenerativeModel({ model: "gemini-3-pro-image-preview" });
const result = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType, data } }] }],
  generationConfig: { responseModalities: ["image", "text"] },
});
const imagePart = result.response.candidates[0].content.parts.find(p => p.inlineData);

// AFTER (@google/genai)
const response = await ai.models.generateContent({
  model: "gemini-3-pro-image-preview",
  contents: [{ text: prompt }, { inlineData: { mimeType, data } }],
  config: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: { aspectRatio: "16:9" },
  },
});
const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
```

**주요 차이점:**

- contents 구조 단순화: `[{ role, parts }]` → `[{ text }, { inlineData }]` 직접 나열
- `responseModalities` 값: 소문자 → 대문자 ("image" → "IMAGE")
- `imageConfig.aspectRatio` 지원 (기존 수동 픽셀 계산 불필요)

#### 비디오 생성 (Veo 3) — 변경 최소

```typescript
// BEFORE & AFTER (이미 @google/genai 사용 중, 거의 동일)
const ai = new GoogleGenAI({ apiKey });
let operation = await ai.models.generateVideos({
  model: "veo-3.1-generate-preview",
  prompt, image, config: { aspectRatio, numberOfVideos: 1 },
});
// Polling 동일

// AFTER 개선점: 다운로드 방식
// BEFORE: 수동 URL에 API key 붙여서 fetch
const downloadUrl = `${video.uri}?key=${apiKey}`;
// AFTER: SDK 내장 다운로드 (Buffer 반환, downloadPath 대신 메모리)
// 주의: ai.files.download()은 파일 저장만 지원 → 기존 fetch 방식 유지 또는 임시파일 사용
```

#### 음악 생성 (Lyria) — 변경 최소

```typescript
// BEFORE & AFTER (이미 @google/genai 사용 중, 동일)
const client = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });
const session = await client.live.music.connect({ model, callbacks });
```

#### TTS — 가장 큰 변경

```typescript
// BEFORE (REST API)
const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
const res = await fetch(url, { body: JSON.stringify({ input: { text }, voice, audioConfig }) });
// 출력: MP3 base64

// AFTER (@google/genai TTS 모델)
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-preview-tts",
  contents: [{ parts: [{ text: script }] }],
  config: {
    responseModalities: ["AUDIO"],
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
    },
  },
});
const audioBase64 = response.candidates[0].content.parts[0].inlineData.data;
// 출력: PCM 24kHz mono → WAV 변환 필요 (기존 MP3 직접 출력 → PCM+WAV 헤더 추가)
```

**주요 차이점:**

- REST API → SDK `generateContent()` 통합
- 출력 포맷: MP3 → PCM 24kHz mono (WAV 헤더 수동 추가 필요)
- Voice: `ko-KR-Standard-A` 등 → 30개 prebuilt voice (`Kore`, `Puck`, `Charon` 등)
- 한국어 자동 감지 (languageCode 불필요)
- Multi-speaker 지원 추가 (향후 확장 가능)

---

## 2. API Key 세분화

| 환경변수 | 대상 | 분리 이유 |
|----------|------|-----------|
| `GEMINI_API_KEY` | 폴백 (필수) | 기존 환경 호환 |
| `GEMINI_API_KEY_TEXT` | Script, Storyboard, Subtitle, TrendTube, Recommendations, ProjectGen | 텍스트 (최다 호출) |
| `GEMINI_API_KEY_IMAGE` | Scene 이미지 | 이미지 (높은 단가) |
| `GEMINI_API_KEY_VIDEO` | Veo 3 비디오 | 비디오 (최고 단가) |
| `GEMINI_API_KEY_MUSIC` | Lyria 음악 | 음악 (별도 v1alpha) |
| `GEMINI_API_KEY_TTS` | TTS | TTS |
| `GEMINI_YOUTUBE_DATA_API_KEY` | YouTube Data | 유지 (이미 분리) |

> 개별 키 미설정 시 `GEMINI_API_KEY`로 자동 폴백

---

## 3. 구현 계획

### Step 1: 패키지 업데이트 + 제거

```bash
npm install @google/genai@latest
npm uninstall @google/generative-ai
```

### Step 2: `client.server.ts` 전면 재작성

```typescript
import { GoogleGenAI } from "@google/genai";

type ApiKeyCategory = "text" | "image" | "video" | "music" | "tts";

export function getApiKey(category: ApiKeyCategory): string | null {
  const envMap: Record<ApiKeyCategory, string> = {
    text: "GEMINI_API_KEY_TEXT",
    image: "GEMINI_API_KEY_IMAGE",
    video: "GEMINI_API_KEY_VIDEO",
    music: "GEMINI_API_KEY_MUSIC",
    tts: "GEMINI_API_KEY_TTS",
  };
  return process.env[envMap[category]] || process.env.GEMINI_API_KEY || null;
}

// 카테고리별 싱글톤
const _clients = new Map<string, GoogleGenAI>();

export function getClient(category: ApiKeyCategory = "text"): GoogleGenAI | null {
  const apiKey = getApiKey(category);
  if (!apiKey) return null;
  const cacheKey = `${category}:${apiKey}`;
  if (!_clients.has(cacheKey)) {
    const opts = category === "music"
      ? { apiKey, httpOptions: { apiVersion: "v1alpha" as const } }
      : { apiKey };
    _clients.set(cacheKey, new GoogleGenAI(opts));
  }
  return _clients.get(cacheKey)!;
}

// 기존 함수 호환 래퍼 (마이그레이션 중 점진적 전환용)
export { getClient as getGenAIClient };
```

- `getGeminiClient()`, `getTextModel()`, `getGenAIClient()`, `getGenAIAlphaClient()` → 단일 `getClient(category)`
- `getTextModel()` 제거 — 각 서비스에서 `ai.models.generateContent({ model, config: { systemInstruction } })` 직접 호출

### Step 3: 텍스트 생성 서비스 마이그레이션 (6개 파일)

공통 변경 패턴:

```typescript
// BEFORE
import { getGeminiClient, getTextModel } from "./client.server";
const model = getTextModel(AI_MODELS.text.primary, systemPrompt);
const result = await model.generateContent({ contents: [...], generationConfig: { ... } });
const text = result.response.text();

// AFTER
import { getClient } from "./client.server";
const ai = getClient("text");
const response = await ai.models.generateContent({
  model: AI_MODELS.text.primary,
  contents: [...],
  config: { systemInstruction: systemPrompt, temperature: 0.8, maxOutputTokens: 8192, responseMimeType: "application/json" },
});
const text = response.text;
```

**스트리밍 패턴 변경 (script, storyboard):**

```typescript
// BEFORE
const result = await model.generateContentStream({ contents, generationConfig });
for await (const chunk of result.stream) { chunk.text(); }

// AFTER
const stream = await ai.models.generateContentStream({ model, contents, config });
for await (const chunk of stream) { chunk.text; }
```

대상 파일:

| 파일 | 특이사항 |
|------|----------|
| `script.server.ts` | 스트리밍 + JSON 파싱, `getTextModel()` 2번 (primary + lite) |
| `storyboard.server.ts` | 스트리밍 + JSON 파싱 |
| `subtitle.server.ts` | JSON 모드, lite 모델 |
| `trendtube.server.ts` | 5개 함수, primary + lite 혼용 |
| `recommendations.server.ts` | JSON 모드 |
| `project-generator.server.ts` | JSON 모드, lite 모델 |

### Step 4: 이미지 서비스 마이그레이션

`image.server.ts` 변경:

- `getGeminiClient()` → `getClient("image")`
- `model.generateContent()` → `ai.models.generateContent()`
- `responseModalities: ["image", "text"]` → `["IMAGE", "TEXT"]`
- `imageConfig: { aspectRatio }` 활용 가능 (기존 수동 픽셀 계산 대체 검토)
- 응답 파싱: `result.response.candidates` → `response.candidates`

### Step 5: 비디오 서비스 (최소 변경)

`video.server.ts`:

- `getGenAIClient()` → `getClient("video")`
- 다운로드 URL의 `process.env.GEMINI_API_KEY` → `getApiKey("video")`
- 텍스트 프롬프트 생성 부분: `getTextModel()` → `getClient("text").models.generateContent()`
- 나머지 `ai.models.generateVideos()` 패턴은 동일

### Step 6: 음악 서비스 (최소 변경)

`music.server.ts`:

- `getGenAIAlphaClient()` → `getClient("music")` (v1alpha 자동 적용)
- 프롬프트 생성 부분: `getTextModel()` → `getClient("text").models.generateContent()`
- WebSocket `client.live.music.connect()` 패턴은 동일

### Step 7: TTS 서비스 전면 재작성

`tts.server.ts`:

- REST API 호출 → `ai.models.generateContent()` + TTS 모델
- Voice 매핑 변경: `ko-KR-Standard-A` → prebuilt voice name (예: `Kore`)
- 출력 변환: PCM 24kHz → WAV 헤더 추가 (기존 music.server.ts의 `createWavHeader()` 재사용)
- MP3 대신 WAV 출력으로 변경 (또는 ffmpeg 변환 추가)

```typescript
// Voice 매핑 변경
const VOICE_MAP = {
  male_ko: "Charon",    // Informative
  female_ko: "Kore",    // Firm
  male_en: "Puck",      // Upbeat
  female_en: "Sulafat", // Warm
};
```

### Step 8: `.env.example` + `CLAUDE.md` 업데이트

---

## 4. 수정 대상 파일 목록

| # | 파일 | 변경 규모 | 내용 |
|---|------|-----------|------|
| 1 | `package.json` | 소 | `@google/genai` 업데이트, `@google/generative-ai` 제거 |
| 2 | `app/lib/ai/client.server.ts` | **대** | 전면 재작성 (통합 클라이언트 + Key 세분화) |
| 3 | `app/lib/ai/script.server.ts` | 중 | SDK 전환 + 스트리밍 패턴 변경 |
| 4 | `app/lib/ai/storyboard.server.ts` | 중 | SDK 전환 + 스트리밍 패턴 변경 |
| 5 | `app/lib/ai/subtitle.server.ts` | 소 | SDK 전환 |
| 6 | `app/lib/ai/trendtube.server.ts` | 중 | 5개 함수 SDK 전환 |
| 7 | `app/lib/ai/recommendations.server.ts` | 소 | SDK 전환 |
| 8 | `app/lib/ai/project-generator.server.ts` | 소 | SDK 전환 |
| 9 | `app/lib/ai/image.server.ts` | 중 | SDK 전환 + responseModalities 대문자 |
| 10 | `app/lib/ai/video.server.ts` | 소 | 클라이언트 교체 + API Key 함수 |
| 11 | `app/lib/ai/music.server.ts` | 소 | 클라이언트 교체 |
| 12 | `app/lib/ai/tts.server.ts` | **대** | REST → SDK 전면 재작성 + 오디오 포맷 변환 |
| 13 | `.env.example` | 소 | Key 변수 추가 |

---

## 5. 검증

```bash
# 1. 타입 체크 (가장 중요 — import 경로 및 API 시그니처 변경 검증)
npm run typecheck

# 2. 린트
npm run lint

# 3. 빌드
npm run build

# 4. GEMINI_MOCK=true로 개발 서버 실행 (mock 데이터로 전체 흐름 확인)
npm run dev

# 5. GEMINI_MOCK=false로 실제 API 호출 테스트
#    - Script 생성 (스트리밍)
#    - Storyboard 생성 (스트리밍)
#    - 이미지 생성 (참조 이미지 포함)
#    - TTS 음성 생성 (WAV 출력 확인)
```

## 6. 리스크 및 주의사항

- **TTS 음질 변화**: Google Cloud TTS → Gemini TTS 모델로 전환 시 음질/자연스러움이 달라질 수 있음. 한국어 prebuilt voice 품질 테스트 필요
- **TTS 출력 포맷**: MP3 → PCM/WAV 변경으로 다운스트림 코드(TrendTube media 저장 등)에 영향
- **스트리밍 파싱**: 새 SDK의 스트리밍 chunk 형태가 미세하게 다를 수 있음 — incremental JSON 파서 동작 검증 필수
- **`@google/generative-ai` 완전 제거**: 모든 import 경로 변경 후 `npm uninstall` 진행. 누락된 import가 있으면 빌드 실패로 즉시 발견됨
