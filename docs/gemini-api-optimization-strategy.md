# Gemini API 사용 최적화 전략

- 작성일: 2026-02-14
- 대상 프로젝트: TubeGai (YouTube 콘텐츠 생성 플랫폼)
- 참고: [Gemini API 공식 문서](https://ai.google.dev/gemini-api/docs?hl=ko)

---

## 목차

1. [현재 상태 분석](#1-현재-상태-분석)
2. [모델 선택 최적화](#2-모델-선택-최적화)
3. [개발 비용 최소화](#3-개발-비용-최소화)
4. [API 결과 재사용 전략](#4-api-결과-재사용-전략)
5. [파이프라인 아키텍처 개선](#5-파이프라인-아키텍처-개선)
6. [구현 우선순위](#6-구현-우선순위)

---

## 1. 현재 상태 분석

### 1.1 AI 서비스 파일별 모델 사용 현황

프로젝트 전체에서 **9개 AI 서비스 파일**, **13개 함수**에서 Gemini API를 사용 중.

| 파일                                     | 함수                        | 모델                       | temp    | maxTokens | 용도              |
| ---------------------------------------- | --------------------------- | -------------------------- | ------- | --------- | ----------------- |
| `app/lib/ai.server.ts`                   | `generateAIRecommendations` | gemini-2.5-flash           | 0.8     | 8,192     | 콘텐츠 추천       |
| `app/lib/ai-trendtube.server.ts`         | `extractYouTubeTrends`      | gemini-2.5-flash           | 0.7     | 4,096     | 트렌드 추출       |
| `app/lib/ai-trendtube.server.ts`         | `generateVideoIdeas`        | gemini-2.5-flash           | 0.9     | 6,144     | 영상 아이디어     |
| `app/lib/ai-trendtube.server.ts`         | `generateNarrationScript`   | gemini-2.5-flash-lite      | 0.7     | 512       | 8초 나레이션      |
| `app/lib/ai-script.server.ts`            | `generateScript`            | gemini-2.5-flash-lite      | 0.8     | 8,192     | 전체 대본         |
| `app/lib/ai-script.server.ts`            | `generateScriptStream`      | gemini-2.5-flash-lite      | 0.7     | 16,384    | 스트리밍 대본     |
| `app/lib/ai-script.server.ts`            | `refineScriptSegment`       | gemini-2.5-flash-lite      | 0.5     | 1,024     | 세그먼트 수정     |
| `app/lib/ai-project-generator.server.ts` | `generateProjectContext`    | gemini-2.5-flash-lite      | default | default   | 프로젝트 컨텍스트 |
| `app/lib/ai-veo.server.ts`               | `generateVideoPrompt`       | gemini-2.5-flash-lite      | 0.7     | 256       | 비디오 프롬프트   |
| `app/lib/ai-lyria.server.ts`             | (music prompt)              | gemini-2.5-flash-lite      | 0.5     | 256       | 음악 프롬프트     |
| `app/lib/ai-imagen.server.ts`            | `generateImage`             | gemini-3-pro-image-preview | -       | -         | 이미지 생성       |
| `app/lib/ai-imagen.server.ts`            | `generateImageWithImagen`   | nano-banana-pro-preview    | -       | -         | 이미지 폴백       |
| `app/lib/ai-storyboard.server.ts`        | `generateStoryboardStream`  | nano-banana-pro-preview    | 0.7     | 8,192     | 스토리보드 씬     |

### 1.2 Gemini API 모델별 가격 (백만 토큰당, 2026-02 기준)

| 모델                     | Input | Output | Cached Input | 비고                 |
| ------------------------ | ----- | ------ | ------------ | -------------------- |
| gemini-2.5-flash         | $0.30 | $2.50  | $0.05        | 균형형 (속도 + 품질) |
| gemini-2.5-flash-lite    | $0.10 | $0.40  | -            | 최저가, 고처리량     |
| gemini-2.5-pro           | $1.25 | $10.00 | -            | 고품질 추론          |
| gemini-3-pro             | $2.00 | $12.00 | -            | 최신 고성능          |
| gemini-3-flash (preview) | -     | -      | -            | 차세대 균형형        |

**미디어 생성 가격:**

| 항목                          | 가격                 |
| ----------------------------- | -------------------- |
| Imagen 4 Fast                 | $0.02/장             |
| Imagen 4 Standard             | $0.04/장             |
| Gemini Flash Image            | $0.039/장            |
| Veo 3.1 Standard (720p/1080p) | $0.40/건             |
| Veo 3.1 Standard (4K)         | $0.60/건             |
| Veo 3.1 Fast (720p/1080p)     | $0.15/건             |
| Batch API                     | 전 모델 **50% 할인** |

### 1.3 현재 아키텍처 문제점

#### 문제 1: GoogleGenerativeAI 인스턴스 중복

6개 파일에서 각각 독립적으로 `new GoogleGenerativeAI(apiKey)` 인스턴스를 생성.

```txt
ai.server.ts          → const genAI = new GoogleGenerativeAI(...)
ai-script.server.ts   → const genAI = new GoogleGenerativeAI(...)
ai-trendtube.server.ts → const genAI = new GoogleGenerativeAI(...)
ai-storyboard.server.ts → const genAI = new GoogleGenerativeAI(...)
ai-imagen.server.ts   → const genAI = new GoogleGenerativeAI(...)
ai-lyria.server.ts    → const geminiClient = new GoogleGenerativeAI(...)
ai-veo.server.ts      → @google/genai + @google/generative-ai 두 SDK 동시 사용
ai-project-generator.server.ts → 함수 내부에서 매 호출마다 새 인스턴스 생성
```

#### 문제 2: systemInstruction 미사용

모든 파일에서 시스템 프롬프트를 user message에 합쳐서 전송. Gemini의 `systemInstruction` 파라미터를 사용하지 않아 **implicit caching 불가**.

```typescript
// 현재 패턴 (모든 AI 서비스 파일)
const result = await model.generateContent({
  contents: [
    { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
  ],
});
```

#### 문제 3: 파이프라인 결합도

TrendTube 파이프라인은 7단계가 `trendtube-generate-stream.ts` 하나의 라우트 핸들러에서 일괄 실행됨:

- 개별 단계 테스트 불가
- 중간 단계 실패 시 전체 파이프라인 재시작 필요
- Step 2 테스트를 위해 Step 1을 반드시 실행해야 함

#### 문제 4: 결과 캐싱 부재

- 동일 입력에 대한 AI 호출이 매번 새로 실행
- DB에 최종 결과만 저장, 중간 결과(video prompt, music prompt)는 유실
- API 레벨 캐싱 전무

### 1.4 파이프라인 아키텍처

#### TrendTube 파이프라인 (7단계)

```txt
Step 1: extractYouTubeTrends (gemini-2.5-flash)
  │
Step 2: generateVideoIdeas (gemini-2.5-flash)
  │
Step 3-5 병렬 실행:
  ├─ Step 3: generateVideo → videoPrompt (flash-lite) → Veo 3.1
  ├─ Step 4: generateMusic → musicPrompt (flash-lite) → Lyria 2
  └─ Step 5: generateNarrationScript (flash-lite)
  │
Step 6: generateVoiceover (Google Cloud TTS)
  │
Step 7: composeVideo (FFmpeg)
```

Gemini 텍스트 API 호출: **5회/파이프라인 실행**

#### Studio Script 파이프라인

```txt
generateScriptStream (flash-lite, 스트리밍) → DB 저장
  └─ (선택) refineScriptSegment (flash-lite, 세그먼트별)
```

#### Studio Storyboard 파이프라인

```txt
generateStoryboardStream (nano-banana, 스트리밍) → DB 저장
  └─ generateImage × N씬 (gemini-3-pro-image → nano-banana 폴백)
```

### 1.5 파이프라인별 예상 비용

#### TrendTube 1회 실행 (텍스트 API)

| 단계                    | 모델       | Input | Output | 비용        |
| ----------------------- | ---------- | ----- | ------ | ----------- |
| extractYouTubeTrends    | flash      | ~1K   | ~2K    | ~$0.005     |
| generateVideoIdeas      | flash      | ~3K   | ~3K    | ~$0.008     |
| generateNarrationScript | flash-lite | ~3K   | ~0.25K | ~$0.0004    |
| generateVideoPrompt     | flash-lite | ~1K   | ~0.1K  | ~$0.0001    |
| generateMusicPrompt     | flash-lite | ~1K   | ~0.1K  | ~$0.0001    |
| **텍스트 API 합계**     |            |       |        | **~$0.014** |
| + Veo 3.1 (비디오)      |            |       |        | +$0.40      |
| + Lyria 2 (음악)        |            |       |        | +별도       |

#### Studio Script 1회 생성

| 단계                 | 모델       | Input | Output | 비용    |
| -------------------- | ---------- | ----- | ------ | ------- |
| generateScriptStream | flash-lite | ~3K   | ~10K   | ~$0.004 |

#### Studio Storyboard 10씬

| 단계                     | 모델               | 비용                         |
| ------------------------ | ------------------ | ---------------------------- |
| generateStoryboardStream | nano-banana        | ~$0.003                      |
| generateImage × 10       | gemini-3-pro-image | **~$0.39**                   |
| **합계**                 |                    | **~$0.39** (이미지가 지배적) |

---

## 2. 모델 선택 최적화

### 2.1 함수별 현재 모델 vs 권장 모델

| 함수                       | 현재 모델   | 권장 모델      | 변경 이유                                             | 비용 변화  |
| -------------------------- | ----------- | -------------- | ----------------------------------------------------- | ---------- |
| `generateScript`           | flash-lite  | **flash**      | 사용자 대면 핵심 기능, 대본 품질이 제품 가치에 직결   | +$0.002/회 |
| `generateScriptStream`     | flash-lite  | **flash**      | 동일 (스트리밍 버전)                                  | +$0.003/회 |
| `generateStoryboardStream` | nano-banana | **flash-lite** | nano-banana는 이미지 모델로 텍스트 JSON 생성에 부적합 | 검증 필요  |
| `extractYouTubeTrends`     | flash       | flash          | 적절 (복합 분석 + URL 해석)                           | 유지       |
| `generateVideoIdeas`       | flash       | flash          | 적절 (높은 창의성 요구)                               | 유지       |
| `generateNarrationScript`  | flash-lite  | flash-lite     | 적절 (단순 텍스트 변환, 40자)                         | 유지       |
| `refineScriptSegment`      | flash-lite  | flash-lite     | 적절 (경량 수정 작업)                                 | 유지       |
| `generateProjectContext`   | flash-lite  | flash-lite     | 적절 (구조화 JSON 출력)                               | 유지       |
| `generateVideoPrompt`      | flash-lite  | flash-lite     | 적절 (1-2문장 생성)                                   | 유지       |
| (music prompt)             | flash-lite  | flash-lite     | 적절 (1문장 생성)                                     | 유지       |

#### 핵심 권장사항

##### Script 생성 모델 업그레이드 (flash-lite → flash)

대본 생성은 사용자가 직접 확인하고 사용하는 핵심 출력물. flash-lite($0.10/$0.40)에서 flash($0.30/$2.50)로 변경 시:

- 비용 증가: ~$0.005/회 (미미)
- 품질 향상: 더 자연스러운 한국어 표현, 맥락 이해도 향상
- 대상 파일: `app/lib/ai-script.server.ts` (line 238, 385)

##### Storyboard 텍스트 생성 모델 검토

`nano-banana-pro-preview`는 이미지 생성에 특화된 모델. 스토리보드 씬 설명(JSON 텍스트) 생성에 flash-lite가 더 적합할 수 있음. A/B 테스트 권장.

### 2.2 responseMimeType 미적용 파일 개선

JSON 응답을 기대하는데 `responseMimeType: "application/json"`을 설정하지 않은 파일:

| 파일                             | 현재                                   | 개선                    |
| -------------------------------- | -------------------------------------- | ----------------------- |
| `ai.server.ts`                   | 수동 JSON 파싱 + `cleanJsonResponse()` | `responseMimeType` 추가 |
| `ai-project-generator.server.ts` | 수동 마크다운 제거 + JSON 파싱         | `responseMimeType` 추가 |
| `ai-trendtube.server.ts`         | 자유 텍스트 출력                       | 현행 유지 (JSON 아님)   |

`responseMimeType: "application/json"` 적용 시:

- Gemini가 구조적으로 유효한 JSON만 출력
- `cleanJsonResponse()` 같은 후처리 로직 제거 가능
- JSON 파싱 실패율 대폭 감소

### 2.3 모델 버전 관리 전략

| 모델 유형                        | 권장 버전 전략       | 이유                        |
| -------------------------------- | -------------------- | --------------------------- |
| 텍스트 생성 (flash, flash-lite)  | **Stable 버전** 사용 | 프로덕션 안정성 우선        |
| 이미지 생성 (gemini-3-pro-image) | **Preview 허용**     | 이미지 품질 우선, 폴백 있음 |
| 비디오 생성 (veo-3.1)            | **최신 버전** 사용   | 빠른 발전 중, 품질 차이 큼  |

새 모델 출시 시 업그레이드 절차:

1. `scripts/verify-ai-models.ts`로 모델 가용성 확인
2. 개발 환경에서 품질 비교 테스트
3. fixture 데이터 업데이트
4. 프로덕션 배포

---

## 3. 개발 비용 최소화

### 3.1 Mock 시스템 구축

#### 환경변수 기반 Mock 전환

`GEMINI_MOCK=true` 설정 시 실제 API 호출 없이 사전 저장된 fixture 데이터를 반환.

```typescript
// 각 AI 서비스 함수 상단에 추가하는 패턴
import { MOCK_SCRIPT_SEGMENTS } from "./__mocks__/ai-fixtures";

export async function generateScript(
  input: GenerateScriptInput,
): Promise<ScriptSegment[]> {
  if (process.env.GEMINI_MOCK === "true") {
    return MOCK_SCRIPT_SEGMENTS;
  }
  // ... 실제 API 호출 구현
}
```

#### Fixture 파일 구조

```txt
app/lib/__mocks__/
  ai-fixtures.ts          # 모든 AI 함수의 mock 데이터
    ├─ MOCK_RECOMMENDATIONS      # generateAIRecommendations 출력
    ├─ MOCK_TRENDS_TEXT           # extractYouTubeTrends 출력
    ├─ MOCK_VIDEO_IDEAS           # generateVideoIdeas 출력
    ├─ MOCK_NARRATION_SCRIPT      # generateNarrationScript 출력
    ├─ MOCK_VIDEO_PROMPT          # generateVideoPrompt 출력
    ├─ MOCK_MUSIC_PROMPT          # generateMusicPrompt 출력
    ├─ MOCK_SCRIPT_SEGMENTS       # generateScript/Stream 출력
    ├─ MOCK_STORYBOARD_SCENES     # generateStoryboardStream 출력
    └─ MOCK_PROJECT_CONTEXT       # generateProjectContext 출력
```

#### Fixture 데이터 수집 방법

1. 한 번 실제 API 호출 실행
2. 응답을 `console.log(JSON.stringify(result, null, 2))`로 캡처
3. `ai-fixtures.ts`에 타입 안전하게 저장
4. 이후 개발 시 `GEMINI_MOCK=true`로 전환

### 3.2 파이프라인 단계 분리 테스트

#### 문제

TrendTube Step 2(`generateVideoIdeas`)를 테스트하려면 반드시 Step 1(`extractYouTubeTrends`)을 먼저 실행해야 함. 프롬프트 한 줄 수정에도 전체 파이프라인 비용 발생.

#### 해결: Fixture 기반 독립 테스트

```typescript
// 예: Step 2만 독립적으로 테스트
import { MOCK_TRENDS_TEXT } from "./__mocks__/ai-fixtures";

// Step 1 실행 없이 Step 2의 프롬프트/파라미터만 테스트
const ideas = await generateVideoIdeas(MOCK_TRENDS_TEXT);
console.log(ideas);
```

#### 단계별 테스트 스크립트

```typescript
// scripts/test-trendtube-step.ts
const STEP = process.argv[2]; // "1", "2", "3", "4", "5"

switch (STEP) {
  case "1":
    const trends = await extractYouTubeTrends("https://...", "AI");
    console.log(trends);
    break;
  case "2":
    const ideas = await generateVideoIdeas(MOCK_TRENDS_TEXT);
    console.log(ideas);
    break;
  case "3":
    const videoPrompt = await generateVideoPrompt(MOCK_VIDEO_IDEAS);
    console.log(videoPrompt);
    break;
  // ...
}
```

### 3.3 프롬프트 반복 호출 최소화

#### 개발 워크플로우

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

#### 비용 절감 효과 추정

- 기존: 프롬프트 수정 10회 × TrendTube 전체 실행 = 10 × $0.014 = **$0.14**
- 개선: Phase 1(0) + Phase 2(단일 함수 3회) + Phase 3(전체 1회) = **~$0.02**
- **절감: ~85%**

### 3.4 AI Chain 분리 구현 패턴

#### 현재: 단일 스트림 엔드포인트

```txt
POST /api/trendtube/generate-stream
  → 7단계 일괄 실행 (실패 시 전체 재시작)
```

#### 제안: 단계별 API 엔드포인트

```txt
POST /api/trendtube/step1-trends     ← Step 1만 실행, 결과 DB 저장
POST /api/trendtube/step2-ideas      ← DB에서 Step 1 결과 로드 → Step 2 실행
POST /api/trendtube/step3-media      ← Step 2 결과 로드 → Step 3-5 병렬 실행
POST /api/trendtube/step4-compose    ← Step 3-5 결과 로드 → 최종 합성
```

#### 장점

| 측면      | 현재                     | 개선 후                |
| --------- | ------------------------ | ---------------------- |
| 테스트    | 전체 파이프라인만 가능   | 단계별 독립 테스트     |
| 실패 복구 | 전체 재시작              | 실패 단계만 재실행     |
| 비용      | 실패 시 전체 비용 재발생 | 성공한 단계 비용 절약  |
| UX        | "생성 중..." 단일 상태   | 단계별 진행률 표시     |
| 디버깅    | 로그에서 실패 지점 추적  | API 응답으로 즉시 확인 |

#### 구현 패턴

```typescript
// app/features/studio/api/trendtube-step1.ts
export async function action({ request }: Route.ActionArgs) {
  const { sessionId, trendsUrl, userIdea } = await parseFormData(request);

  // Step 1 실행
  const trends = await extractYouTubeTrends(trendsUrl, userIdea);

  // 결과 DB 저장
  await saveTrendTubeStepResult(sessionId, "step1", {
    extractedTrends: trends,
  });

  return { success: true, step: 1, sessionId };
}

// app/features/studio/api/trendtube-step2.ts
export async function action({ request }: Route.ActionArgs) {
  const { sessionId } = await parseFormData(request);

  // Step 1 결과 로드
  const step1 = await loadTrendTubeStepResult(sessionId, "step1");

  // Step 2 실행
  const ideas = await generateVideoIdeas(step1.extractedTrends);

  // 결과 DB 저장
  await saveTrendTubeStepResult(sessionId, "step2", { videoIdeas: ideas });

  return { success: true, step: 2, sessionId };
}
```

---

## 4. API 결과 재사용 전략

### 4.1 systemInstruction 전환 (Implicit Caching 활성화)

**가장 높은 ROI의 최적화.** 코드 변경 최소, 즉시 적용 가능.

#### Before (현재 - 모든 AI 서비스 파일)

```typescript
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const result = await model.generateContent({
  contents: [
    { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
  ],
  generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
});
```

#### After (권장)

```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: systemPrompt, // Gemini가 자동으로 implicit caching
});

const result = await model.generateContent({
  contents: [
    { role: "user", parts: [{ text: userPrompt }] }, // user prompt만 전송
  ],
  generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
});
```

#### 효과

- Gemini의 implicit caching이 동일 `systemInstruction` 접두사를 자동 인식
- 캐시 히트 시 시스템 프롬프트 토큰에 대해 할인 적용
- 프롬프트가 `user` role과 분리되어 의미적으로도 올바름

#### 변경 대상 파일 (6개)

| 파일                                     | 변경 위치                      |
| ---------------------------------------- | ------------------------------ |
| `app/lib/ai.server.ts`                   | line 196-209                   |
| `app/lib/ai-script.server.ts`            | line 238-255, 385-401, 607-619 |
| `app/lib/ai-trendtube.server.ts`         | line 25-49, 68-93, 112-137     |
| `app/lib/ai-storyboard.server.ts`        | 스트리밍 생성 함수             |
| `app/lib/ai-project-generator.server.ts` | line 173-183                   |
| `app/lib/ai-lyria.server.ts`             | 음악 프롬프트 생성 함수        |

### 4.2 Gemini Context Caching (Explicit)

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

- **최소 토큰 요건**: gemini-2.5-flash는 1,024토큰 이상, gemini-2.5-pro는 4,096토큰 이상
- 현재 시스템 프롬프트는 ~125-250토큰으로 단독 적용 미달
- **대안**: 시스템 프롬프트 + 공통 컨텍스트(예: 채널 정보, 스타일 가이드)를 합쳐 1,024토큰 이상으로 구성 시 적용 가능
- 또는 자주 분석하는 트렌드 데이터를 캐시에 포함

#### 비용 절감 시뮬레이션

| 시나리오                                       | 일반   | 캐시 적용         | 절감 |
| ---------------------------------------------- | ------ | ----------------- | ---- |
| Script 생성 100회/일 (시스템 프롬프트 1K 토큰) | $0.03  | $0.005 + 스토리지 | ~80% |
| TrendTube 50회/일 (시스템 프롬프트 0.5K 토큰)  | $0.008 | 미달 (1,024 미만) | N/A  |

### 4.3 DB 레벨 캐싱 (ai_cache 테이블)

동일 입력(모델 + 프롬프트)에 대한 반복 호출을 방지하는 범용 캐시 레이어.

#### 테이블 설계

```typescript
// app/drizzle/ai-cache-schema.ts
import { tubegaiSchema } from "./schema-def";
import { uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

export const aiCaches = tubegaiSchema.table("ai_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  cacheKey: text("cache_key").unique().notNull(), // SHA-256(model + prompt)
  model: text("model").notNull(), // 사용된 모델명
  inputHash: text("input_hash").notNull(), // 입력 해시
  outputText: text("output_text").notNull(), // AI 응답 원문
  inputTokens: integer("input_tokens"), // 사용된 입력 토큰
  outputTokens: integer("output_tokens"), // 사용된 출력 토큰
  expiresAt: timestamp("expires_at").notNull(), // 만료 시간
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### 캐시 유틸리티

```typescript
// app/lib/ai-cache.server.ts
import { createHash } from "crypto";
import { db, schema } from "~/lib/db.server";
import { eq, and, gt } from "drizzle-orm";

function generateCacheKey(model: string, prompt: string): string {
  return createHash("sha256").update(`${model}:${prompt}`).digest("hex");
}

export async function cachedGenerate(
  model: string,
  prompt: string,
  generateFn: () => Promise<string>,
  ttlHours = 24,
): Promise<string> {
  const key = generateCacheKey(model, prompt);

  // 캐시 조회
  const cached = await db.query.aiCaches.findFirst({
    where: and(
      eq(schema.aiCaches.cacheKey, key),
      gt(schema.aiCaches.expiresAt, new Date()),
    ),
  });

  if (cached) return cached.outputText;

  // 실제 API 호출
  const result = await generateFn();

  // 캐시 저장
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ttlHours);

  await db
    .insert(schema.aiCaches)
    .values({
      cacheKey: key,
      model,
      inputHash: key,
      outputText: result,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: schema.aiCaches.cacheKey,
      set: { outputText: result, expiresAt },
    });

  return result;
}
```

#### 적용 우선순위

| 함수                        | TTL    | 이유                                               |
| --------------------------- | ------ | -------------------------------------------------- |
| `generateProjectContext`    | 24시간 | 동일 트렌드 → 동일 프로젝트 컨텍스트               |
| `generateAIRecommendations` | 24시간 | 이미 24시간 만료 로직 존재 (`idea.data.server.ts`) |
| `extractYouTubeTrends`      | 6시간  | 동일 URL 재분석 방지                               |
| `generateVideoIdeas`        | 6시간  | 동일 트렌드 입력 시 재사용                         |

### 4.4 TrendTube 세션 결과 재사용

현재 `trendtube_result` 테이블에 `extractedTrends`, `videoIdeas`, `narrationScript`가 저장되지만 재사용하지 않음.

#### 제안: 재생성 시 이전 결과 옵션 제공

```txt
사용자가 동일 URL로 재생성 요청 시:

→ "이전 분석 결과가 있습니다 (2시간 전). 재사용하시겠습니까?"
  → "예"    → Step 1-2 건너뛰고 Step 3부터 실행 (비용 ~70% 절감)
  → "아니오" → 전체 파이프라인 재실행
```

#### 비용 절감 효과

- Step 1-2 비용: ~$0.013 (전체 텍스트 API 비용의 ~93%)
- 재사용 시 절감: **$0.013/회**
- 하루 50회 재실행 중 30회 재사용 가정: **$0.39/일 절감**

### 4.5 스토리보드 이미지 Batch API

현재 씬별 순차 호출을 Batch API로 전환하면 **50% 비용 절감**.

| 항목             | 현재 (순차)         | Batch API                  |
| ---------------- | ------------------- | -------------------------- |
| 10씬 이미지 생성 | 10 × $0.039 = $0.39 | 10 × $0.02 = $0.20         |
| **절감**         |                     | **$0.19/스토리보드 (49%)** |

#### 구현 고려사항

- Batch API는 비동기 처리 (즉시 결과 아님)
- 스토리보드 이미지는 실시간성이 낮아 Batch에 적합
- 사용자에게 "이미지 생성 중..." 상태를 표시하고 완료 시 알림

---

## 5. 파이프라인 아키텍처 개선

### 5.1 공유 Gemini 클라이언트

모든 AI 서비스 파일이 하나의 공유 클라이언트를 사용하도록 통합.

#### 신규 파일: `app/lib/gemini-client.server.ts`

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

let _client: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!_client) {
    _client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _client;
}

export function getTextModel(modelName: string, systemInstruction?: string) {
  const client = getGeminiClient();
  if (!client) return null;
  return client.getGenerativeModel({
    model: modelName,
    ...(systemInstruction ? { systemInstruction } : {}),
  });
}
```

#### 각 AI 서비스 파일 변경

```typescript
// Before (각 파일마다 독립 인스턴스)
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// After (공유 클라이언트 사용)
import { getTextModel } from "~/lib/gemini-client.server";
```

### 5.2 중간 결과 저장 강화

현재 `trendtube_result` 테이블에 저장되지 않는 중간 결과:

| 결과            | 현재 상태 | 개선                              |
| --------------- | --------- | --------------------------------- |
| extractedTrends | 저장됨    | 유지                              |
| videoIdeas      | 저장됨    | 유지                              |
| narrationScript | 저장됨    | 유지                              |
| **videoPrompt** | **유실**  | `trendtube_media.metadata`에 저장 |
| **musicPrompt** | **유실**  | `trendtube_media.metadata`에 저장 |

### 5.3 재시도 메커니즘

Gemini API의 일시적 오류(rate limit, 네트워크 등)에 대한 자동 재시도.

#### 신규 유틸리티: `app/lib/gemini-retry.server.ts`

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { maxRetries?: number; baseDelay?: number },
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000 } = options ?? {};

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // 429 (Rate Limit) 또는 5xx 에러만 재시도
      const status = (error as { status?: number }).status;
      if (status && status !== 429 && status < 500) throw error;

      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(
        `[Gemini Retry] Attempt ${attempt + 1}/${maxRetries}, waiting ${delay}ms`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Unreachable");
}
```

#### 사용 예시

```typescript
const result = await withRetry(() =>
  model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
  }),
);
```

### 5.4 SDK 통합 고려사항

현재 두 개의 Google AI SDK를 사용:

| SDK                     | 버전 | 사용 파일                                |
| ----------------------- | ---- | ---------------------------------------- |
| `@google/generative-ai` | -    | 7개 파일 (텍스트, 이미지, 스토리보드 등) |
| `@google/genai`         | -    | 1개 파일 (`ai-veo.server.ts` - Veo 3)    |

`@google/genai`은 Google의 새로운 통합 SDK. 장기적으로 모든 파일을 `@google/genai`으로 마이그레이션하는 것이 바람직하나, 현재는 기능 패리티(context caching, streaming 등) 검증 필요. **P3 우선순위**로 진행.

---

## 6. 구현 우선순위

### 우선순위 매트릭스

| 우선순위 | 항목                           | 노력 | 효과 | 관련 파일                              |
| -------- | ------------------------------ | ---- | ---- | -------------------------------------- |
| **P0**   | systemInstruction 전환         | 낮음 | 높음 | AI 서비스 6개                          |
| **P0**   | 공유 Gemini 클라이언트         | 낮음 | 중간 | 신규 1개 + AI 서비스 전체              |
| **P1**   | Script 모델 flash-lite → flash | 낮음 | 중간 | `ai-script.server.ts`                  |
| **P1**   | Mock 시스템 (GEMINI_MOCK)      | 중간 | 높음 | 신규 fixture + AI 서비스 전체          |
| **P1**   | responseMimeType 추가          | 낮음 | 낮음 | `ai.server.ts`, `ai-project-generator` |
| **P2**   | DB 캐시 테이블                 | 중간 | 중간 | 신규 스키마 + 유틸리티                 |
| **P2**   | TrendTube 단계 분리 API        | 높음 | 높음 | trendtube 관련 전체                    |
| **P2**   | 재시도 메커니즘                | 낮음 | 중간 | 신규 유틸리티                          |
| **P3**   | Explicit Context Caching       | 중간 | 중간 | `gemini-client.server.ts`              |
| **P3**   | Batch API (스토리보드 이미지)  | 높음 | 중간 | `ai-imagen.server.ts`                  |
| **P3**   | SDK 통합 (@google/genai)       | 높음 | 낮음 | 전체 AI 파일 + package.json            |

### 단계별 구현 로드맵

#### Phase 1: 즉시 적용 (P0, 1-2일)

1. `gemini-client.server.ts` 생성
2. 모든 AI 서비스 파일에서 공유 클라이언트 사용
3. 모든 시스템 프롬프트를 `systemInstruction` 파라미터로 전환

#### Phase 2: 개발 효율화 (P1, 3-5일)

1. `ai-fixtures.ts` Mock 데이터 생성
2. 각 AI 서비스에 `GEMINI_MOCK` 분기 추가
3. `ai-script.server.ts` 모델을 flash로 업그레이드
4. `responseMimeType` 미적용 파일 개선

#### Phase 3: 비용 최적화 (P2, 1-2주)

1. `ai_cache` 테이블 생성 + 마이그레이션
2. `cachedGenerate` 유틸리티 구현
3. TrendTube 파이프라인 단계별 API 분리
4. 재시도 유틸리티 적용

#### Phase 4: 고급 최적화 (P3, 필요 시)

1. Explicit Context Caching 적용
2. Batch API 스토리보드 이미지 전환
3. `@google/genai` SDK 통합 마이그레이션

---

## 참고 자료

- [Gemini API 공식 문서](https://ai.google.dev/gemini-api/docs?hl=ko)
- [Gemini 모델 목록](https://ai.google.dev/gemini-api/docs/models?hl=ko)
- [Gemini API 가격](https://ai.google.dev/gemini-api/docs/pricing?hl=ko)
- [Context Caching 가이드](https://ai.google.dev/gemini-api/docs/caching?hl=ko)
- [Batch API 가이드](https://ai.google.dev/gemini-api/docs/batch-api?hl=ko)
