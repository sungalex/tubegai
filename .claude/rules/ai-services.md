---
paths:
  - "app/lib/ai/**"
---

# AI 서비스 규칙

## 클라이언트 & Retry
```typescript
import { getClient, getAlphaClient } from "~/lib/ai/client.server";
import { withRetry } from "~/lib/ai/retry.server";  // 모든 AI 서비스에 적용 필수
```

## 모델 레지스트리
```typescript
// app/lib/ai/models.server.ts — 하드코딩 금지, 반드시 AI_MODELS.* 참조
const AI_MODELS = {
  text: { primary: "gemini-2.5-flash", lite: "gemini-2.5-flash-lite" },
  image: { primary: "gemini-3-pro-image-preview", fallback: "nano-banana-pro-preview" },
  video: { primary: "veo-3.1-generate-preview" }, // 1회 최대 8초
  music: { primary: "models/lyria-realtime-exp" },
  tts: { primary: "gemini-2.5-flash-preview-tts" },
};
```

> ⚠ `gemini-2.5-flash`, `gemini-2.5-pro`는 **2026-06-17 지원 종료** 예정

### 최신 대안 (2026-04 기준)

| 카테고리  | 현재 사용 중                   | 최신 대안                                                    |
| --------- | ------------------------------ | ------------------------------------------------------------ |
| Text      | `gemini-2.5-flash` (stable)    | `gemini-3-flash-preview`, `gemini-3.1-pro-preview`           |
| Text Lite | `gemini-2.5-flash-lite`        | `gemini-3.1-flash-lite-preview`                              |
| Image     | `gemini-3-pro-image-preview`   | `gemini-3.1-flash-image-preview`, `imagen-4` (stable)        |
| Video     | `veo-3.1-generate-preview`     | `veo-3.1-lite-generate-preview` (저비용/고속)                |
| Music     | `lyria-realtime-exp`           | `lyria-3-pro-preview` (풀 곡), `lyria-3-clip-preview` (30초) |
| TTS       | `gemini-2.5-flash-preview-tts` | `gemini-2.5-pro-preview-tts` (장문/전문 내레이션)            |

## Veo 3 영상 생성 제약
- 1회당 최대 8초 클립 → duration > 8초는 8초 단위 분할
- 참조 체이닝: 이전 Scene 이미지 → `inlineData` (base64), 이전 클립 → Veo `video` 파라미터
- **Gemini 이미지 생성은 `inlineData` 전용** — `fileUri`(URL)는 이미지 생성 모드 미지원

## 개발 Mock
- `GEMINI_MOCK=true` → `app/lib/__mocks__/ai-fixtures.ts` 사용

## 작업 규칙
- Script/Storyboard AI 생성 시 메타데이터 전체 저장 (type, content, duration + visualNotes, emotionalTone, keywords, sceneHints)
- 모든 미디어 → Supabase Storage 업로드 + `media_asset` FK 연결
