# Lyria RealTime 음악 생성 환경 설정 가이드

Lyria RealTime(`lyria-realtime-exp`)은 `@google/genai` SDK의 **v1alpha** API를 통해 WebSocket 스트리밍으로 배경음악을 생성합니다.

> 구현 파일: `app/lib/ai-music.server.ts`

## 1. 필요 환경변수

```bash
GEMINI_API_KEY=your-gemini-api-key   # 필수 (기존 Gemini API 키와 동일)
GEMINI_MOCK=true                      # 선택 (Mock 모드: AI 호출 없이 placeholder 반환)
```

별도의 Google Cloud 프로젝트 설정이나 gcloud CLI 인증은 **불필요**합니다. 기존 `GEMINI_API_KEY`만 있으면 동작합니다.

## 2. 사용 SDK 및 클라이언트 설정

### SDK

- **패키지**: `@google/genai` (v1.41.0) — Gemini 텍스트/이미지용 `@google/generative-ai`와 **별도 패키지**
- **API 버전**: `v1alpha` (Lyria RealTime 접근에 필수)

### 클라이언트 초기화

```typescript
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { apiVersion: "v1alpha" },
});
```

싱글톤 패턴으로 전역 캐싱되며, `GEMINI_API_KEY` 미설정 시 `null` 반환 (placeholder fallback).

## 3. 음악 생성 파이프라인

### 2단계 프로세스

| 단계 | 모델 | 용도 |
| --- | --- | --- |
| Step 1: 프롬프트 생성 | `gemini-2.5-flash-lite` | 영상 아이디어 → 음악 프롬프트 + 장르 생성 |
| Step 2: 음악 스트리밍 | `lyria-realtime-exp` | 프롬프트 → WebSocket PCM 오디오 스트리밍 |

### Step 1: 음악 프롬프트 생성

Gemini 2.5 Flash Lite 텍스트 모델로 영상 아이디어를 분석하여 JSON 응답 생성:

```json
{ "prompt": "Energetic electronic beats with synth melodies", "genre": "electronic" }
```

- Temperature: 0.5, Max tokens: 256
- 장르 옵션: `electronic`, `acoustic`, `orchestral`, `ambient`, `hiphop`

### Step 2: Lyria RealTime 스트리밍

WebSocket Live Music API를 통해 실시간 PCM 오디오 청크를 수신:

```typescript
const session = await client.live.music.connect({
  model: "models/lyria-realtime-exp",
  callbacks: { onmessage, onerror, onclose },
});

await session.setWeightedPrompts({
  weightedPrompts: [{ text: prompt, weight: 1.0 }],
});

await session.setMusicGenerationConfig({
  musicGenerationConfig: {
    bpm: genreToBpm(genre),  // 장르별 BPM (70~120)
    temperature: 1.1,
    guidance: 4.0,
  },
});

await session.play();
// → durationSeconds + 500ms 후 session.close()
```

## 4. 오디오 사양

| 항목 | 값 |
| --- | --- |
| 모델 | `models/lyria-realtime-exp` |
| 포맷 | WAV (RIFF/PCM) |
| 샘플레이트 | 48,000 Hz |
| 비트 깊이 | 16-bit |
| 채널 | 2 (Stereo) |
| 최대 생성 길이 | 8초 (기본값) |
| 출력 형태 | Base64 Data URL (`data:audio/wav;base64,...`) |

### 장르별 BPM 매핑

| 장르 | BPM |
| --- | --- |
| ambient | 70 |
| orchestral | 85 |
| acoustic | 90 |
| hiphop | 95 |
| electronic (기본값) | 120 |

## 5. Fallback 동작

API 키 미설정이나 생성 실패 시, 파이프라인은 **중단되지 않고** placeholder를 반환합니다:

| 상황 | 동작 |
| --- | --- |
| `GEMINI_API_KEY` 미설정 | placeholder 반환 (url: `""`) |
| `GEMINI_MOCK=true` | Mock 데이터 즉시 반환 |
| Lyria 생성 에러 | placeholder 반환 + 에러 로그 |
| 프롬프트 필터링 | 경고 로그, 오디오 데이터 없음 → placeholder |
| 빈 오디오 데이터 수신 | placeholder 반환 |

## 6. 확인 방법

```bash
# 1. 환경변수 확인 (.env 파일)
grep GEMINI_API_KEY .env

# 2. Mock 모드로 동작 테스트 (AI 호출 없이)
GEMINI_MOCK=true npm run dev

# 3. 실제 생성 테스트
# TrendTube 미디어 생성 단계에서 배경음악이 생성되는지 확인
```

## 7. 비용 참고

- **음악 프롬프트 생성** (Gemini Flash Lite): 극소 비용 (~$0.0001/회)
- **Lyria RealTime 오디오 생성**: Gemini API 가격 정책 적용
- `GEMINI_MOCK=true` 설정으로 개발 시 비용 절감 가능

## 8. 배포 환경

Gemini API 키 기반이므로 배포 시 별도의 서비스 계정 설정이 불필요합니다:

```bash
# 배포 환경 환경변수 설정만 필요
GEMINI_API_KEY=your-production-api-key
```
