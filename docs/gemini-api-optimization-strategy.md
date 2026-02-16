# Gemini API 사용 최적화 전략

- 작성일: 2026-02-14
- 최종 업데이트: 2026-02-16
- 대상 프로젝트: TubeGai (YouTube 콘텐츠 생성 플랫폼)
- 참고: [Gemini API 공식 문서](https://ai.google.dev/gemini-api/docs?hl=ko)
- 관련 문서:
  - [Studio + TrendTube 통합 고도화 계획서](studio-enhancement-plan.md)
  - [Project-Studio AI 중복 최소화 전략](project-studio-ai-optimization-plan.md)
  - [DB 스키마 재구축 전략서](db-schema-rebuild-strategy.md)

---

## 목차

1. [현재 상태 분석](#1-현재-상태-분석)
2. [모델 선택 최적화](#2-모델-선택-최적화)
3. [개발 비용 최소화](#3-개발-비용-최소화)
4. [API 결과 재사용 전략](#4-api-결과-재사용-전략)
5. [파이프라인 아키텍처 개선](#5-파이프라인-아키텍처-개선)
6. [통합 구현 우선순위](#6-통합-구현-우선순위)
7. [도메인 간 AI 중복 최소화 전략](#7-도메인-간-ai-중복-최소화-전략)
8. [참고 자료](#8-참고-자료)

---

## 1. 현재 상태 분석

### 1.1 AI 서비스 파일별 모델 사용 현황

프로젝트 전체에서 **8개 AI 서비스 파일**, **17개 함수**에서 Gemini API를 사용 중.

| 파일 | 함수 | 모델 | sysInst | mimeType | retry | mock |
|---|---|---|:---:|:---:|:---:|:---:|
| `ai.server.ts` | `generateAIRecommendations` | gemini-2.5-flash | ✅ | ✅ JSON | ✅ | ✅ |
| `ai-script.server.ts` | `generateScript` | gemini-2.5-flash | ✅ | ✅ JSON | ✅ | ✅ |
| `ai-script.server.ts` | `generateScriptStream` | gemini-2.5-flash | ✅ | ✅ JSON | - (stream) | ✅ |
| `ai-script.server.ts` | `refineScriptSegment` | gemini-2.5-flash-lite | ✅ | - | ✅ | ✅ |
| `ai-trendtube.server.ts` | `extractYouTubeTrends` | gemini-2.5-flash | ✅ | - (text) | ✅ | ✅ |
| `ai-trendtube.server.ts` | `generateVideoIdeas` | gemini-2.5-flash | ✅ | - (text) | ✅ | ✅ |
| `ai-trendtube.server.ts` | `generateNarrationScript` | gemini-2.5-flash-lite | ✅ | - (text) | ✅ | ✅ |
| `ai-project-generator.server.ts` | `generateProjectContext` | gemini-2.5-flash-lite | ✅ | ✅ JSON | ✅ | ✅ |
| `ai-storyboard.server.ts` | `generateStoryboard` | **nano-banana-pro-preview** | ✅ | ✅ JSON | ✅ | ✅ |
| `ai-storyboard.server.ts` | `generateStoryboardStream` | **nano-banana-pro-preview** | ✅ | ✅ JSON | - (stream) | ✅ |
| `ai-video.server.ts` | `generateVideoPrompt` | gemini-2.5-flash-lite | ✅ | - | ✅ | - |
| `ai-video.server.ts` | `generateVideo` (Veo 3) | veo-3.1-generate-preview | N/A | N/A | **❌** | ✅ |
| `ai-music.server.ts` | `generateMusicPrompt` | gemini-2.5-flash-lite | ✅ | ✅ JSON | ✅ | - |
| `ai-music.server.ts` | `generateMusic` (Lyria) | lyria-realtime-exp | N/A | N/A | **❌** | ✅ |
| `ai-image.server.ts` | `generateImage` | gemini-3-pro-image-preview | N/A | N/A | ✅ | ✅ |
| `ai-image.server.ts` | `generateImageWithImagen` | nano-banana-pro-preview | N/A | N/A | ✅ | - |
| `tts.server.ts` | `generateVoiceover` | Google Cloud TTS | N/A | N/A | **❌** | - |

> **범례**: sysInst = `systemInstruction` 사용, mimeType = `responseMimeType: "application/json"` 설정, retry = `withRetry()` 래퍼 적용, mock = `GEMINI_MOCK` 패턴 구현

### 1.2 Gemini API 모델별 가격 (백만 토큰당, 2026-02 기준)

| 모델 | Input | Output | Cached Input | 비고 |
|---|---|---|---|---|
| gemini-2.5-flash | $0.30 | $2.50 | $0.05 | 균형형 (속도 + 품질) |
| gemini-2.5-flash-lite | $0.10 | $0.40 | - | 최저가, 고처리량 |
| gemini-2.5-pro | $1.25 | $10.00 | - | 고품질 추론 |
| gemini-3-pro | $2.00 | $12.00 | - | 최신 고성능 |
| gemini-3-flash (preview) | - | - | - | 차세대 균형형 |

**미디어 생성 가격:**

| 항목 | 가격 |
|---|---|
| Imagen 4 Fast | $0.02/장 |
| Imagen 4 Standard | $0.04/장 |
| Gemini Flash Image | $0.039/장 |
| Veo 3.1 Standard (720p/1080p) | $0.40/건 |
| Veo 3.1 Standard (4K) | $0.60/건 |
| Veo 3.1 Fast (720p/1080p) | $0.15/건 |
| Batch API | 전 모델 **50% 할인** |

### 1.3 아키텍처 문제점

#### ✅ 해결됨 — 문제 1: GoogleGenerativeAI 인스턴스 중복

`gemini-client.server.ts` 싱글턴 클라이언트 도입으로 해결. 모든 텍스트 AI 서비스가 `getGeminiClient()` / `getTextModel()` 공유 함수를 사용.

> 단, `ai-video.server.ts`와 `ai-music.server.ts`는 `@google/genai` SDK의 `GoogleGenAI` 인스턴스를 별도로 생성 (SDK가 다르므로 예상된 동작).

#### ✅ 해결됨 — 문제 2: systemInstruction 미사용

모든 텍스트 AI 서비스에서 `getTextModel(modelName, systemPrompt)` 호출로 전환 완료. Gemini의 implicit caching이 자동 활성화.

```typescript
// 현재 패턴 (모든 텍스트 AI 서비스)
const model = getTextModel("gemini-2.5-flash", SYSTEM_PROMPT_KO);
// → systemInstruction 파라미터로 자동 전달
```

#### 부분 해결 — 문제 3: 파이프라인 결합도

**TrendTube**: 4개 단계별 API 엔드포인트로 분리 완료.

```txt
trendtube-step-trends.ts  → Step 1: 트렌드 추출
trendtube-step-ideas.ts   → Step 2: 아이디어 생성
trendtube-step-media.ts   → Step 3-5: 미디어 생성 (병렬)
trendtube-step-compose.ts → Step 6-7: TTS + 합성
```

**Studio**: 아직 단일 파이프라인. Script → Storyboard → Scene 간 단계별 분리는 Studio 고도화에서 진행 예정.

#### 미해결 — 문제 4: 결과 캐싱 부재

- 동일 입력에 대한 AI 호출이 매번 새로 실행
- DB에 최종 결과만 저장, 중간 결과(video prompt, music prompt)는 유실
- API 레벨 캐싱 전무

#### 미해결 — 문제 5: 모델명 하드코딩 (신규)

각 AI 서비스 파일에서 모델명을 문자열 리터럴로 직접 사용. 중앙 `AI_MODELS` 레지스트리가 아직 구축되지 않음.

```txt
ai-script.server.ts            → "gemini-2.5-flash" (2곳), "gemini-2.5-flash-lite" (1곳)
ai-storyboard.server.ts        → "nano-banana-pro-preview" (1곳)
ai-trendtube.server.ts         → "gemini-2.5-flash" (2곳), "gemini-2.5-flash-lite" (1곳)
ai-project-generator.server.ts → "gemini-2.5-flash-lite" (1곳)
ai-video.server.ts             → "veo-3.1-generate-preview" (1곳), "gemini-2.5-flash-lite" (1곳)
ai-music.server.ts             → "models/lyria-realtime-exp" (1곳), "gemini-2.5-flash-lite" (1곳)
ai-image.server.ts             → "gemini-3-pro-image-preview" (1곳), "nano-banana-pro-preview" (1곳)
ai.server.ts                   → "gemini-2.5-flash" (1곳)
```

#### 미해결 — 문제 6: SDK 이중화 지속 (신규)

| SDK | 사용 파일 |
|---|---|
| `@google/generative-ai` | `gemini-client.server.ts` (싱글턴) → 6개 텍스트 서비스에서 공유 |
| `@google/genai` | `ai-video.server.ts` (Veo 3), `ai-music.server.ts` (Lyria + 프롬프트) |

장기적으로 `@google/genai` 통합 SDK로 마이그레이션이 바람직하나, 기능 패리티 검증 필요.

### 1.4 파이프라인 아키텍처

#### TrendTube 파이프라인 (단계별 API)

```txt
Step 1: extractYouTubeTrends (gemini-2.5-flash)        ← trendtube-step-trends.ts
  │
Step 2: generateVideoIdeas (gemini-2.5-flash)           ← trendtube-step-ideas.ts
  │
Step 3-5 병렬 실행:                                     ← trendtube-step-media.ts
  ├─ Step 3: generateVideo → videoPrompt (flash-lite) → Veo 3.1
  ├─ Step 4: generateMusic → musicPrompt (flash-lite) → Lyria 2
  └─ Step 5: generateNarrationScript (flash-lite)
  │
Step 6-7:                                               ← trendtube-step-compose.ts
  ├─ Step 6: generateVoiceover (Google Cloud TTS)
  └─ Step 7: composeVideo (FFmpeg)
```

Gemini 텍스트 API 호출: **5회/파이프라인 실행**

#### Studio Pipeline (현재)

```txt
generateScriptStream (gemini-2.5-flash, 스트리밍) → DB 저장
  └─ (선택) refineScriptSegment (flash-lite, 세그먼트별)

generateStoryboardStream (nano-banana, 스트리밍) → DB 저장
  └─ generateImage × N씬 (gemini-3-pro-image → nano-banana 폴백)

Scene Video → MOCKED (미구현)
```

#### Studio Pipeline (목표 — Studio 고도화 후)

> 상세: [Studio + TrendTube 통합 고도화 계획서](studio-enhancement-plan.md)

```txt
[Pre-Production] (신규)
  AI: gemini-2.5-flash-lite → hooks[], scriptGuidelines, seoKeywords[]
  │
[Step 1: Script]
  AI: gemini-2.5-flash (스트리밍) → 5 세그먼트 + 메타데이터 전체 저장
  │
[Step 2: Storyboard + Scene 이미지]
  텍스트: gemini-2.5-flash (스트리밍)
  이미지: gemini-3-pro-image × N씬 (순차, 참조 체이닝)
  │
[Step 3: Scene Video]
  Veo 3.1 × M클립 (8초 단위, 순차, 참조 체이닝)
  │
[Step 4: B-Roll]
  Script keywords[] 직접 사용 (AI 추가 호출 없음)
  │
[Step 5: Rough Cut] (Phase 2)
```

### 1.5 파이프라인별 예상 비용

#### TrendTube 1회 실행 (텍스트 API)

| 단계 | 모델 | Input | Output | 비용 |
|---|---|---|---|---|
| extractYouTubeTrends | flash | ~1K | ~2K | ~$0.005 |
| generateVideoIdeas | flash | ~3K | ~3K | ~$0.008 |
| generateNarrationScript | flash-lite | ~3K | ~0.25K | ~$0.0004 |
| generateVideoPrompt | flash-lite | ~1K | ~0.1K | ~$0.0001 |
| generateMusicPrompt | flash-lite | ~1K | ~0.1K | ~$0.0001 |
| **텍스트 API 합계** | | | | **~$0.014** |
| + Veo 3.1 (비디오) | | | | +$0.40 |
| + Lyria 2 (음악) | | | | +별도 |

#### Studio Script 1회 생성

| 단계 | 모델 | Input | Output | 비용 |
|---|---|---|---|---|
| generateScriptStream | **flash** | ~3K | ~10K | **~$0.026** |

> 이전: flash-lite 사용 시 ~$0.004. flash 업그레이드로 비용 증가했으나 대본 품질 대폭 향상.

#### Studio Pre-Production 1회 (목표)

| 단계 | 모델 | Input | Output | 비용 |
|---|---|---|---|---|
| generatePreProduction | flash-lite | ~2K | ~2K | ~$0.003 |

#### Studio Storyboard 10씬

| 단계 | 모델 | 비용 |
|---|---|---|
| generateStoryboardStream | nano-banana (→ flash 예정) | ~$0.003 |
| generateImage × 10 (순차, 참조 체이닝) | gemini-3-pro-image | **~$0.39** |
| **합계** | | **~$0.39** (이미지가 지배적) |

---

## 2. 모델 선택 최적화

### 2.1 함수별 모델 현황 및 권장사항

| 함수 | 현재 모델 | 권장 모델 | 상태 | 비고 |
|---|---|---|:---:|---|
| `generateScript` | flash | flash | **✅ 완료** | flash-lite에서 업그레이드됨 |
| `generateScriptStream` | flash | flash | **✅ 완료** | 동일 |
| `generateStoryboardStream` | **nano-banana** | **flash** | **미완료** | 이미지 전용 모델 → 텍스트 모델로 교체 필요 |
| `generateStoryboard` | **nano-banana** | **flash** | **미완료** | 동일 |
| `extractYouTubeTrends` | flash | flash | ✅ 적절 | 복합 분석 + URL 해석 |
| `generateVideoIdeas` | flash | flash | ✅ 적절 | 높은 창의성 요구 |
| `generateNarrationScript` | flash-lite | flash-lite | ✅ 적절 | 단순 텍스트 변환 |
| `refineScriptSegment` | flash-lite | flash-lite | ✅ 적절 | 경량 수정 작업 |
| `generateProjectContext` | flash-lite | flash-lite | ✅ 적절 | 구조화 JSON 출력 |
| `generateVideoPrompt` | flash-lite | flash-lite | ✅ 적절 | 1-2문장 생성 |
| `generateMusicPrompt` | flash-lite | flash-lite | ✅ 적절 | 1문장 생성 |
| **(신규)** `generatePreProduction` | - | flash-lite | **계획** | hooks/guidelines/keywords 생성 |

#### Storyboard 텍스트 생성 모델 교체 (미완료)

`nano-banana-pro-preview`는 **이미지 생성/편집 전용** 모델로 텍스트 JSON 구조화 출력에 부적합:

| 항목 | `nano-banana-pro-preview` | `gemini-2.5-flash` |
|---|---|---|
| **주 용도** | 이미지 생성/편집 | 범용 텍스트/추론 |
| **JSON 구조화 출력** | 미보장 (공식 문서 미언급) | 공식 지원 (`responseMimeType`) |
| **입력 토큰** | 65,536 | 1,048,576 |
| **출력 토큰** | 32,768 | 65,536 |
| **비용** | 이미지 생성 과금 | 텍스트 토큰 과금 (저렴) |

**변경 계획**: `gemini-2.5-flash`로 교체. Script와 동일 모델 → 일관성 확보, JSON 출력 안정성 보장.

> 관련: [Studio 고도화 Phase 1B](studio-enhancement-plan.md)

### 2.2 responseMimeType 적용 현황

#### ✅ 완료

JSON 응답을 기대하는 모든 서비스에 `responseMimeType: "application/json"` 적용 완료:

| 파일 | 상태 |
|---|---|
| `ai.server.ts` | ✅ 완료 |
| `ai-script.server.ts` (generate/stream) | ✅ 완료 |
| `ai-storyboard.server.ts` (generate/stream) | ✅ 완료 |
| `ai-project-generator.server.ts` | ✅ 완료 |
| `ai-music.server.ts` (프롬프트 생성) | ✅ 완료 |

#### 적용 불필요

| 파일 | 이유 |
|---|---|
| `ai-trendtube.server.ts` | 자유 텍스트 출력 (JSON 아님) |
| `ai-image.server.ts` | `responseModalities: ["image", "text"]` 사용 |
| `ai-video.server.ts` | Veo 3 API (별도 프로토콜) |
| `ai-music.server.ts` (음악 생성) | Lyria WebSocket (별도 프로토콜) |

### 2.3 모델 버전 관리 전략

| 모델 유형 | 권장 버전 전략 | 이유 |
|---|---|---|
| 텍스트 생성 (flash, flash-lite) | **Stable 버전** 사용 | 프로덕션 안정성 우선 |
| 이미지 생성 (gemini-3-pro-image) | **Preview 허용** | 이미지 품질 우선, 폴백 있음 |
| 비디오 생성 (veo-3.1) | **최신 버전** 사용 | 빠른 발전 중, 품질 차이 큼 |

**AI_MODELS 중앙 레지스트리** (미구축 — Phase 1H에서 구현 예정):

```typescript
// 목표: app/lib/ai/models.server.ts
export const AI_MODELS = {
  text: { primary: "gemini-2.5-flash", lite: "gemini-2.5-flash-lite" },
  image: { primary: "gemini-3-pro-image-preview" },
  video: { primary: "veo-3.1-generate-preview" },
  music: { primary: "lyria-realtime-exp" },
} as const;
```

새 모델 출시 시 업그레이드 절차:

1. `AI_MODELS` 상수 업데이트 (단일 변경점)
2. 개발 환경에서 품질 비교 테스트
3. fixture 데이터 업데이트
4. 프로덕션 배포

---

## 3. 개발 비용 최소화

### 3.1 ✅ Mock 시스템 (완료)

`GEMINI_MOCK=true` 설정 시 실제 API 호출 없이 fixture 데이터를 반환하는 패턴이 **모든 AI 서비스에 구현 완료**.

**Fixture 파일**: `app/lib/__mocks__/ai-fixtures.ts`

```txt
MOCK_RECOMMENDATIONS        → ai.server.ts
MOCK_SCRIPT_SEGMENTS         → ai-script.server.ts
MOCK_STORYBOARD_SCENES       → ai-storyboard.server.ts
MOCK_PROJECT_CONTEXT         → ai-project-generator.server.ts
MOCK_VIDEO_RESULT            → ai-video.server.ts
MOCK_MUSIC_RESULT            → ai-music.server.ts
MOCK_EXTRACTED_TRENDS        → ai-trendtube.server.ts (Step 1)
MOCK_VIDEO_IDEAS             → ai-trendtube.server.ts (Step 2)
MOCK_NARRATION_SCRIPT        → ai-trendtube.server.ts (Step 5)
```

**Fixture 데이터 수집 방법** (유지):

1. 한 번 실제 API 호출 실행
2. 응답을 `console.log(JSON.stringify(result, null, 2))`로 캡처
3. `ai-fixtures.ts`에 타입 안전하게 저장
4. 이후 개발 시 `GEMINI_MOCK=true`로 전환

### 3.2 ✅ 파이프라인 단계 분리 테스트 (완료)

TrendTube 파이프라인이 4개 단계별 API 엔드포인트로 분리되어 **독립 테스트 가능**:

```txt
trendtube-step-trends.ts  → Step 1만 실행, 결과 DB 저장
trendtube-step-ideas.ts   → DB에서 Step 1 결과 로드 → Step 2 실행
trendtube-step-media.ts   → Step 2 결과 로드 → Step 3-5 병렬 실행
trendtube-step-compose.ts → Step 3-5 결과 로드 → TTS + 합성
```

GEMINI_MOCK + 단계별 API 조합으로 개별 단계 프롬프트 개발 시 전체 파이프라인 실행 불필요.

### 3.3 ✅ 개발 워크플로우 (운용 중)

```txt
┌─────────────────────────────────────────────┐
│ Phase 1: UI/로직 개발 (GEMINI_MOCK=true)    │
│ → API 호출 0건, 비용 $0                     │
│ → UI 렌더링, 에러 핸들링, 상태 관리 테스트  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ Phase 2: 프롬프트 개발 (Mock 해제)           │
│ → 변경된 함수만 개별 호출                    │
│ → 성공한 응답을 fixture에 업데이트           │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ Phase 3: 통합 테스트 (Mock 해제)             │
│ → 전체 파이프라인 1-2회 실행                 │
│ → 결과 검증 후 fixture 최종 업데이트         │
└─────────────────────────────────────────────┘
```

비용 절감 효과: 프롬프트 개발 시 **~85% 절감** (전체 실행 10회 → 단일 함수 3회 + 전체 1회)

---

## 4. API 결과 재사용 전략

### 4.1 ✅ systemInstruction 전환 (완료)

모든 텍스트 AI 서비스에서 `systemInstruction` 파라미터 사용으로 전환 완료.

```typescript
// 현재 패턴 (gemini-client.server.ts)
export function getTextModel(modelName: string, systemInstruction?: string) {
  const client = getGeminiClient();
  return client.getGenerativeModel({
    model: modelName,
    ...(systemInstruction ? { systemInstruction } : {}),
  });
}
```

**적용 효과**: Gemini implicit caching 자동 활성화. 동일 `systemInstruction` 접두사에 대해 캐시 히트 시 할인 적용.

### 4.2 Gemini Context Caching (Explicit) — 미구현

시스템 프롬프트가 크고 호출 빈도가 높은 서비스에 적용. 캐시된 토큰은 **$0.05/M** (일반 $0.30/M 대비 **83% 할인**).

#### 구현 방법

```typescript
import { GoogleAICacheManager } from "@google/generative-ai/server";

const cacheManager = new GoogleAICacheManager(process.env.GEMINI_API_KEY);

// 캐시 생성 (서버 시작 시 1회)
const cache = await cacheManager.create({
  model: "models/gemini-2.5-flash",
  displayName: "tubegai-script-system-prompt",
  systemInstruction: SYSTEM_PROMPT_KO,
  ttl: "3600s", // 1시간
});

// 캐시를 사용한 모델 생성
const model = genAI.getGenerativeModelFromCachedContent(cache);
const result = await model.generateContent(userPrompt);
```

#### 적용 조건

- **최소 토큰 요건**: gemini-2.5-flash는 1,024토큰 이상
- 현재 시스템 프롬프트는 ~125-250토큰으로 단독 적용 미달
- **신규 기회**: 계획 중인 `ai-context-builder.server.ts` 공유 컨텍스트 빌더가 Project 메타데이터 + 채널 정보 + 트렌드 스냅샷을 통합하면 **1,024토큰 최소 요건 충족 가능**

> 관련: [Project-Studio AI 중복 최소화 전략 §3.6](project-studio-ai-optimization-plan.md)

#### 비용 절감 시뮬레이션

| 시나리오 | 일반 | 캐시 적용 | 절감 |
|---|---|---|---|
| Script 생성 100회/일 (시스템+컨텍스트 ~1.5K 토큰) | $0.045 | $0.0075 + 스토리지 | ~80% |
| TrendTube 50회/일 (시스템 프롬프트 0.5K 토큰) | $0.008 | 미달 (1,024 미만) | N/A |

### 4.3 DB 레벨 캐싱 (ai_cache 테이블) — 미구현

동일 입력(모델 + 프롬프트)에 대한 반복 호출을 방지하는 범용 캐시 레이어.

> DB Clean Rebuild 전략(`docs/db-schema-rebuild-strategy.md`)에서 `ai_cache` 테이블을 통합 스키마에 포함할 것을 권장.

#### 테이블 설계

```typescript
// app/drizzle/ai-cache-schema.ts
export const aiCaches = tubegaiSchema.table("ai_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  cacheKey: text("cache_key").unique().notNull(), // SHA-256(model + prompt)
  model: text("model").notNull(),
  inputHash: text("input_hash").notNull(),
  outputText: text("output_text").notNull(),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### 캐시 유틸리티

```typescript
// app/lib/ai-cache.server.ts
export async function cachedGenerate(
  model: string,
  prompt: string,
  generateFn: () => Promise<string>,
  ttlHours = 24,
): Promise<string> {
  const key = generateCacheKey(model, prompt);

  // 캐시 조회
  const cached = await db.query.aiCaches.findFirst({
    where: and(eq(schema.aiCaches.cacheKey, key), gt(schema.aiCaches.expiresAt, new Date())),
  });
  if (cached) return cached.outputText;

  // 실제 API 호출 + 캐시 저장
  const result = await generateFn();
  await db.insert(schema.aiCaches).values({ cacheKey: key, model, inputHash: key, outputText: result, expiresAt }).onConflictDoUpdate({ target: schema.aiCaches.cacheKey, set: { outputText: result, expiresAt } });
  return result;
}
```

#### 적용 우선순위

| 함수 | TTL | 이유 |
|---|---|---|
| `generateProjectContext` | 24시간 | 동일 트렌드 → 동일 프로젝트 컨텍스트 |
| `generateAIRecommendations` | 24시간 | 이미 24시간 만료 로직 존재 |
| `extractYouTubeTrends` | 6시간 | 동일 URL 재분석 방지 |
| `generateVideoIdeas` | 6시간 | 동일 트렌드 입력 시 재사용 |

### 4.4 TrendTube 결과 재사용 전략 (확장)

#### 4.4.1 세션 결과 재사용 (기존)

현재 `trendtube_result` 테이블에 `extractedTrends`, `videoIdeas`, `narrationScript`가 저장되지만 재사용하지 않음.

```txt
사용자가 동일 URL로 재생성 요청 시:

→ "이전 분석 결과가 있습니다 (2시간 전). 재사용하시겠습니까?"
  → "예"    → Step 1-2 건너뛰고 Step 3부터 실행 (비용 ~70% 절감)
  → "아니오" → 전체 파이프라인 재실행
```

#### 4.4.2 trendSnapshot 재사용 (신규 — Project 연계)

Project에 이미 `trendSnapshot` (트렌드 정보 스냅샷)이 저장되어 있으므로, TrendTube Step 1의 AI 호출을 조건부 생략 가능:

```typescript
// ai-trendtube.server.ts 수정 (계획)
export async function extractYouTubeTrends(
  url: string,
  userIdea?: string,
  existingTrendSnapshot?: TrendSnapshot  // 신규 파라미터
): Promise<string> {
  if (existingTrendSnapshot) {
    return formatTrendSnapshotAsAnalysis(existingTrendSnapshot);  // AI 호출 생략
  }
  // 기존 AI 호출 로직...
}
```

**효과**: TrendTube 진입 시 Step 1 AI 호출 1회 절감 (~$0.005/회)

#### 4.4.3 Project 컨텍스트 주입 (신규 — Step 2 경량화)

```typescript
// ai-trendtube.server.ts 수정 (계획)
export async function generateVideoIdeas(
  extractedTrends: string,
  projectContext?: {           // 신규 파라미터
    title: string;
    description: string;
    targetAudience: string;
    hooks: string[];
    scriptGuidelines: ScriptGuidelines;
  }
): Promise<string> {
  // Project 컨텍스트가 있으면 프롬프트에 주입
  // → 기존 기획 의도를 유지하면서 아이디어 확장
}
```

**효과**: 입력 토큰 ~30% 감소, 기획 의도에 부합하는 아이디어 생성

#### 4.4.4 TrendTube → Studio 자산 연결 (신규)

| Studio 단계 | TrendTube 자산 | 활용 방식 |
|---|---|---|
| Script | `narrationScript` | "TrendTube 스크립트 가져오기" 버튼 |
| Scene | `generated_video` | 기존 미디어 재사용 옵션 |
| B-Roll | 전체 미디어 | B-Roll 에셋 후보 목록에 추가 |
| Rough Cut | `background_music`, `voiceover` | 오디오 트랙 옵션 |

> 상세: [Project-Studio AI 중복 최소화 전략 §3.5](project-studio-ai-optimization-plan.md)

#### 비용 절감 효과 (통합)

| 시나리오 | 현재 AI 호출 | 개선 후 | 절감 |
|---|---|---|---|
| Project → TrendTube | 3회 (Project + Step1 + Step2) | 1-2회 (Project + Step2 경량) | **1-2회** |
| TrendTube 전체 | 5회+ (Step 1~5+) | 3-4회 (Step1 생략 + Step2 경량) | **1-2회** |
| Step 1-2 비용 절감 | ~$0.013/회 × 재사용 비율 | | **~$0.39/일** (50회 중 30회 재사용) |

### 4.5 스토리보드 이미지 Batch API — 제거

> **이전**: 씬별 순차 호출을 Batch API로 전환하면 50% 비용 절감이 가능하다고 제안.
>
> **변경**: Studio 고도화 설계에서 Scene 이미지 생성에 **참조 체이닝**(이전 Scene 이미지를 다음 Scene 생성의 referenceImage로 전달)을 채택. 이는 시각적 일관성을 위해 **순차 생성이 필수**이므로 Batch API(비동기 일괄 처리)와 아키텍처적으로 상충.
>
> **결론**: 비용 절감($0.19/스토리보드)보다 시각적 일관성이 더 중요하므로 **순차 생성 + 참조 체이닝 유지**. Batch API 적용 항목에서 제거.

---

## 5. 파이프라인 아키텍처 개선

### 5.1 ✅ 공유 Gemini 클라이언트 (완료)

`app/lib/gemini-client.server.ts`에 싱글턴 클라이언트 구현 완료. 모든 텍스트 AI 서비스에서 공유.

```typescript
// 현재 구현 (gemini-client.server.ts)
export function getGeminiClient(): GoogleGenerativeAI | null { /* 싱글턴 */ }
export function getTextModel(modelName: string, systemInstruction?: string) { /* 모델 생성 */ }
```

### 5.2 중간 결과 저장 강화 — 미구현 (확장)

#### TrendTube 프롬프트 저장

| 결과 | 현재 상태 | 개선 | 관련 Phase |
|---|---|---|---|
| extractedTrends | 저장됨 | 유지 | - |
| videoIdeas | 저장됨 | 유지 | - |
| narrationScript | 저장됨 | 유지 | - |
| **videoPrompt** | **유실** | `trendtube_media.prompt` 컬럼 추가 | Studio 0B |
| **musicPrompt** | **유실** | `trendtube_media.prompt` 컬럼 추가 | Studio 0B |

#### Script 메타데이터 전체 저장 (신규 — 핵심)

현재 Script AI가 생성하는 7개 필드 중 3개만 DB에 저장 (`type`, `content`, `estimatedDuration`). 나머지 4개 필드가 손실되어 후속 단계에서 재추론 필요:

| 필드 | DB 저장 | 후속 소비 | 손실 영향 |
|---|:---:|---|---|
| `type` | ✅ | Step 2: 세그먼트별 시각 스타일 결정 | - |
| `content` | ✅ | Step 2: 씬 내용 기반 시각화 | - |
| `duration` | ✅ | Step 2-3: 씬 duration 합산 기준 | - |
| `visualNotes` | **❌** | Step 2: 시각적 방향 제시 | Storyboard AI가 content만으로 재추론 |
| `emotionalTone` | **❌** | Step 2-3: 이미지/비디오 분위기 | Storyboard AI가 독립적으로 추론 |
| `keywords` | **❌** | Step 4: B-Roll 검색 키워드 | 별도 AI 호출로 키워드 재생성 필요 |
| `sceneHints` | **❌** | Step 2: 씬 분할 수/방향 힌트 | Storyboard AI가 자체 판단 |

**개선**: `studio_script_segment` 테이블에 4개 컬럼 추가

```sql
ALTER TABLE public.studio_script_segment
  ADD COLUMN visual_notes TEXT,
  ADD COLUMN emotional_tone TEXT,
  ADD COLUMN keywords TEXT[],
  ADD COLUMN scene_hints JSONB;
```

**효과**:
- Storyboard AI: `visualNotes` + `emotionalTone` + `sceneHints` 활용 → 품질 향상
- B-Roll: `keywords[]` DB에서 직접 사용 → **Step 4에서 AI 추가 호출 제거**
- Script → Storyboard → Video 파이프라인 데이터 연속성 확보

> 관련: [Studio 고도화 Phase 1A](studio-enhancement-plan.md), [AI 중복 최소화 §3.3](project-studio-ai-optimization-plan.md)

### 5.3 재시도 메커니즘 — 대부분 완료

`app/lib/gemini-retry.server.ts`의 `withRetry()` 유틸리티가 구현되어 있으며 대부분의 서비스에 적용됨.

#### 적용 완료

- `ai.server.ts`, `ai-script.server.ts` (non-streaming), `ai-trendtube.server.ts` (3개 함수 전체)
- `ai-project-generator.server.ts`, `ai-storyboard.server.ts` (non-streaming)
- `ai-image.server.ts`, `ai-video.server.ts` (프롬프트 생성만), `ai-music.server.ts` (프롬프트 생성만)

#### 미적용 (향후 과제)

| 서비스 | 이유 | 난이도 |
|---|---|---|
| `ai-video.server.ts` (Veo 3 API) | polling 기반, 초기 호출에만 retry 필요 | 낮음 |
| `ai-music.server.ts` (Lyria WebSocket) | WebSocket 스트리밍, 재연결 로직 필요 | 중간 |
| `tts.server.ts` (Google Cloud TTS) | HTTP REST, 표준 retry 적용 가능 | 낮음 |
| 스트리밍 함수 (`generateScriptStream`, `generateStoryboardStream`) | 스트리밍 특성상 중간 재시도 어려움 | 높음 |

### 5.4 SDK 통합 — 미구현

현재 두 개의 Google AI SDK를 사용:

| SDK | 사용 파일 |
|---|---|
| `@google/generative-ai` | `gemini-client.server.ts` (싱글턴) → 6개 텍스트 서비스 공유 |
| `@google/genai` | `ai-video.server.ts` (Veo 3), `ai-music.server.ts` (Lyria + 프롬프트 생성) |

`@google/genai`은 Google의 새로운 통합 SDK. 장기적으로 모든 파일을 `@google/genai`으로 마이그레이션하는 것이 바람직하나, context caching/streaming 등 기능 패리티 검증 필요. **P3 우선순위**로 유지.

### 5.5 AI 서비스 디렉토리 재구조화 — 미구현 (신규)

현재 `app/lib/` 루트에 AI 관련 파일 11개가 산재. `app/lib/ai/` 서브디렉토리로 통합 예정:

```txt
app/lib/ai/                              (신규 디렉토리)
├── models.server.ts                      ← AI_MODELS 중앙 레지스트리 (신규)
├── context-builder.server.ts             ← 공유 컨텍스트 빌더 (신규)
├── pre-production.server.ts              ← Pre-Production AI (신규)
├── client.server.ts                      ← gemini-client.server.ts
├── retry.server.ts                       ← gemini-retry.server.ts
├── script.server.ts                      ← ai-script.server.ts
├── storyboard.server.ts                  ← ai-storyboard.server.ts
├── image.server.ts                       ← ai-image.server.ts
├── video.server.ts                       ← ai-video.server.ts
├── music.server.ts                       ← ai-music.server.ts
├── trendtube.server.ts                   ← ai-trendtube.server.ts
├── project-generator.server.ts           ← ai-project-generator.server.ts
├── tts.server.ts                         ← tts.server.ts
└── __mocks__/fixtures.ts                 ← __mocks__/ai-fixtures.ts
```

> 관련: [Studio 고도화 Phase 1H](studio-enhancement-plan.md)

---

## 6. 통합 구현 우선순위

### 우선순위 매트릭스

#### 완료 항목

| 항목 | 완료일 | 관련 파일 |
|---|---|---|
| ~~systemInstruction 전환~~ | ✅ | AI 서비스 전체 |
| ~~공유 Gemini 클라이언트~~ | ✅ | `gemini-client.server.ts` |
| ~~Script 모델 flash-lite → flash~~ | ✅ | `ai-script.server.ts` |
| ~~Mock 시스템 (GEMINI_MOCK)~~ | ✅ | AI 서비스 전체 + `ai-fixtures.ts` |
| ~~responseMimeType 추가~~ | ✅ | JSON 서비스 5개 |
| ~~재시도 메커니즘 (텍스트 서비스)~~ | ✅ | `gemini-retry.server.ts` + 텍스트 서비스 |
| ~~TrendTube 단계 분리 API~~ | ✅ | 4개 step 엔드포인트 |

#### 미완료 항목

| 우선순위 | 항목 | 노력 | 효과 | 관련 Phase |
|---|---|---|---|---|
| **P1** | Storyboard 모델 변경 (nano-banana → flash) | 낮음 | 높음 | Studio 1B |
| **P1** | AI_MODELS 중앙 레지스트리 | 낮음 | 중간 | Studio 1H |
| **P1** | Script 메타데이터 전체 저장 (4개 컬럼 추가) | 중간 | 높음 | Studio 1A |
| **P1** | Pre-Production AI 서비스 신규 | 중간 | 높음 | Phase C |
| **P2** | 공유 컨텍스트 빌더 (`ai-context-builder`) | 중간 | 중간 | Phase A |
| **P2** | Project AI Generator 경량화 (9 → 6 필드) | 중간 | 중간 | Phase C |
| **P2** | TrendTube trendSnapshot/컨텍스트 재사용 | 중간 | 높음 | Phase B |
| **P2** | DB 캐시 테이블 (`ai_cache`) | 중간 | 중간 | - |
| **P2** | Veo/Lyria/TTS retry 확대 | 낮음 | 중간 | Studio 1H |
| **P3** | Explicit Context Caching | 중간 | 중간 | - |
| **P3** | SDK 통합 (`@google/genai`) | 높음 | 낮음 | - |
| **P3** | `ai/` 서브디렉토리 재구성 | 중간 | 낮음 | Studio 1H |

> ~~Batch API (스토리보드 이미지)~~ — **제거**: 참조 체이닝과 아키텍처적으로 상충하므로 적용하지 않음.

### 단계별 구현 로드맵

#### Phase 1: 즉시 적용 — ✅ 완료

1. ~~`gemini-client.server.ts` 생성~~
2. ~~모든 AI 서비스에서 공유 클라이언트 사용~~
3. ~~모든 시스템 프롬프트를 `systemInstruction` 파라미터로 전환~~
4. ~~`ai-fixtures.ts` Mock 데이터 생성~~
5. ~~각 AI 서비스에 `GEMINI_MOCK` 분기 추가~~
6. ~~`ai-script.server.ts` 모델을 flash로 업그레이드~~
7. ~~`responseMimeType` 미적용 파일 개선~~

#### Phase 2: Studio 고도화 병행 (현재 단계)

Studio 고도화 계획의 Phase와 병행 실행:

```txt
Studio 고도화 Phase           API 최적화 항목
─────────────────────         ──────────────────────────────────────
Phase 0A (세션 도입)          (선행 조건 충족)
Phase 0B (Storage 통합)       TrendTube prompt 저장 컬럼 추가
                              공유 컨텍스트 빌더 (Phase A) ← 병행 가능
Phase 1A (Script 메타)        Script 메타데이터 4개 컬럼 추가
Phase 1B (Storyboard)         Storyboard 모델 → gemini-2.5-flash 교체
Phase 1H (AI 서비스 통합)     AI_MODELS 레지스트리 + ai/ 디렉토리 재구성
                              Veo/Lyria/TTS retry 확대
```

#### Phase 3: AI 중복 제거 (후속)

```txt
본 문서 Phase                 상세 항목
─────────────────────         ──────────────────────────────────────
Phase B (TT 컨텍스트 연계)    trendSnapshot 재사용, Project 컨텍스트 주입
Phase C (Pre-Production)      Pre-Production AI 서비스 + Project 경량화
                              DB 캐시 테이블 (ai_cache) 구현
```

#### Phase 4: 고급 최적화 (장기)

1. Explicit Context Caching 적용 (공유 컨텍스트 빌더 완료 후)
2. `@google/genai` SDK 통합 마이그레이션

### 통합 실행 순서

```txt
Studio 고도화                    API 최적화 (본 문서)         AI 중복 제거
──────────────────────           ────────────────────         ─────────────────
Phase 0A (세션 도입)     ────→                               (선행 조건 충족)
Phase 0B (Storage 통합)  ────→   prompt 저장 컬럼 추가       (선행 조건 충족)
                                 Phase A (컨텍스트 빌더)
Phase 1A (Script 메타)   ────→   메타데이터 4컬럼 추가
Phase 1B (Storyboard)    ────→   모델 교체 (→ flash)
                                                              Phase B (TT 연계)
Phase 1D (Enum 정리)
Phase 1E (TT→Studio)
Phase 1F (TT 결과접근)
                                                              Phase C (Pre-Prod)
Phase 1G (TT 8초 클립)
Phase 1H (AI 통합)       ────→   AI_MODELS + retry + ai/
                                 DB 캐시 테이블               Phase D (마이그레이션)
```

---

## 7. 도메인 간 AI 중복 최소화 전략

> 상세: [Project-Studio AI 중복 최소화 전략](project-studio-ai-optimization-plan.md)

### 7.1 도메인 역할 재정의

| 도메인 | 핵심 역할 | AI 생성 필드 |
|---|---|---|
| **Project** | 기획 + 컨텍스트 관리 | title, description, targetAudience, estimatedViews, suggestedTone, suggestedDifficulty (**6개**) |
| **Studio** | 프로덕션 콘텐츠 생성 (세션 기반) | Pre-Production (hooks, scriptGuidelines, seoKeywords) + 전체 대본 + 스토리보드 + 미디어 |
| **TrendTube** | 트렌드 기반 빠른 영상 생성 | 트렌드 분석, 아이디어, 미디어 (Studio 재활용 가능) |

**원칙**: Project는 기획 메타데이터만, 프로덕션 가이드(hooks, scriptGuidelines, keywords)는 Studio Pre-Production에서 생성.

### 7.2 Pre-Production AI 단계

Studio Script 생성 **이전**에 Pre-Production 단계를 추가하여, Project에서 제거될 프로덕션 가이드를 더 풍부한 컨텍스트로 생성:

```typescript
// 신규: app/lib/ai-pre-production.server.ts (→ ai/pre-production.server.ts)
interface PreProductionOutput {
  hooks: string[];                    // 오프닝 훅 3개
  scriptGuidelines: ScriptGuidelines; // 대본 구조 가이드
  seoKeywords: string[];              // SEO 키워드 5-10개
}

// 입력: Project 메타데이터 + 채널 정보 + 트렌드 스냅샷
// 모델: gemini-2.5-flash-lite
// 비용: ~$0.003/호출
```

**장점**:
- Project 데이터 + 채널 구독자 수/설명 + 트렌드 스냅샷을 모두 활용한 **고품질 생성**
- 사용자가 Pre-Production 결과를 확인/수정 후 Script 생성 가능
- 세션 기반 관리로 재생성 시 이전 결과 보존

### 7.3 Project AI Generator 경량화

**현재**: 9개 필드 생성 (hooks, scriptGuidelines, keywords 포함)
**목표**: 6개 필드만 생성 (프로덕션 관련 필드 제거)

```typescript
// 현재
AIProjectGenerationOutput {
  title, description,         // 기본 메타데이터 (유지)
  hooks[],                    // → Studio Pre-Production으로 이동
  targetAudience,             // 기획 정보 (유지)
  estimatedViews,             // 예측 정보 (유지)
  scriptGuidelines,           // → Studio Pre-Production으로 이동
  keywords[],                 // → Studio Pre-Production으로 이동
  suggestedTone,              // 사용자 설정 (유지)
  suggestedDifficulty         // 사용자 설정 (유지)
}
```

**효과**: AI 프롬프트 간소화, 응답 토큰 **~40% 절감**, 역할 명확화

### 7.4 Script 메타데이터 파이프라인 연속성

Script AI가 생성한 **7개 필드 전체를 DB에 저장**하여, 후속 단계에서 재추론/재생성 없이 직접 활용:

```txt
[Script AI 생성 (7필드)]
  type, content, duration, visualNotes, emotionalTone, keywords, sceneHints
                │
                ▼ (전체 DB 저장)
[studio_script_segment 테이블]
                │
  ┌─────────────┼───────────────────────┐
  │             │                       │
  ▼             ▼                       ▼
[Step 2]     [Step 3]              [Step 4]
Storyboard   Scene Video           B-Roll
- content     - emotionalTone      - keywords[]
- visualNotes - visualPrompt         (직접 사용
- emotionalTone  (Step 2 출력)       AI 호출 없음)
- sceneHints
- duration
```

**핵심**: `keywords[]`를 Step 4 B-Roll 검색에 직접 사용하여 **AI 추가 호출 제거**.

### 7.5 비용 절감 효과 요약

#### AI 호출 절감

| 시나리오 | 현재 | 개선 후 | 절감 |
|---|---|---|---|
| Idea → Project → Script | 3회 | 3회 (토큰 절감) | 출력 토큰 ~40% |
| Project → TrendTube | 3회 | 1-2회 | **1-2회 절감** |
| TrendTube 전체 | 5회+ | 3-4회 | **1-2회 절감** |
| Script → B-Roll 키워드 | 재추론 | DB 읽기 | **AI 호출 제거** |

#### 토큰 절감

- Project AI Generator: 출력 토큰 ~40% 감소 (9 → 6 필드)
- TrendTube Step 1: 입출력 토큰 100% 절감 (trendSnapshot 재사용 시)
- TrendTube Step 2: 입력 토큰 ~30% 감소 (컨텍스트 사전 주입)
- Storyboard AI: 입력 품질 향상 (200자 → 300자 + 메타데이터) → 재생성 필요성 감소

#### 인프라 비용 절감

- TrendTube 미디어: base64 DB 저장 → Supabase Storage (건당 ~6.5-26MB DB 텍스트 → ~100B URL)
- `media_asset` FK 연결: 고아 파일 추적 가능, 세션 삭제 시 일괄 정리

---

## 8. 참고 자료

- [Gemini API 공식 문서](https://ai.google.dev/gemini-api/docs?hl=ko)
- [Gemini 모델 목록](https://ai.google.dev/gemini-api/docs/models?hl=ko)
- [Gemini API 가격](https://ai.google.dev/gemini-api/docs/pricing?hl=ko)
- [Context Caching 가이드](https://ai.google.dev/gemini-api/docs/caching?hl=ko)
- [Batch API 가이드](https://ai.google.dev/gemini-api/docs/batch-api?hl=ko)
- [Studio + TrendTube 통합 고도화 계획서](studio-enhancement-plan.md)
- [Project-Studio AI 중복 최소화 전략](project-studio-ai-optimization-plan.md)
- [DB 스키마 재구축 전략서](db-schema-rebuild-strategy.md)
- [프로젝트 구조 리팩토링 계획](project-structure-refactoring-plan.md)
