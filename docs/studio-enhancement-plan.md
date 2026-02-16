# Studio + TrendTube 통합 고도화 계획서

## 목차

1. [현황 분석](#1-현황-분석)
2. [핵심 문제점 상세 분석](#2-핵심-문제점-상세-분석)
3. [목표 파이프라인 설계](#3-목표-파이프라인-설계)
4. [Supabase Storage 통합 설계](#4-supabase-storage-통합-설계)
5. [DB 스키마 재설계](#5-db-스키마-재설계)
6. [단계별 데이터 플로우 최적화](#6-단계별-데이터-플로우-최적화)
7. [TrendTube 고도화](#7-trendtube-고도화)
8. [구현 Phase 계획](#8-구현-phase-계획)

---

## 결정 사항

- **Coloring 테이블**: `studio_coloring_preset`, `studio_coloring_setting` **완전 제거** (테이블 + 코드 + 메뉴)
- **미디어 저장소**: Supabase Storage (MVP) → Cloudflare R2 (확장 시)
- **Enum 통합**: `project.tone` 제거 → `project.contentTone`으로 통합
- **Scene 이미지 생성**: Step 2에서 텍스트 스토리보드 생성 후 Scene 단위 순차 이미지 생성 (참조 체이닝)
- **Scene Video 생성**: Step 3에서 Scene 단위 순차 비디오 생성 (이미지 + 이전 비디오 참조 체이닝)
- **일괄 생성 제거**: Step 2 이미지, Step 3 비디오 모두 Scene 단위 개별 생성
- **Veo 8초 제약**: 모든 비디오를 8초 단위 클립으로 생성. Studio는 Scene당 1클립, TrendTube는 단계적 N클립 생성
- **미디어 에셋 테이블 명명 통일**: Studio/TrendTube 모두 `media_asset` 테이블 중심 + 용도별 연결 테이블 패턴
- **AI 서비스 레이어 통합**: 텍스트/이미지/비디오 생성 함수를 Studio와 TrendTube가 동일 레퍼런스로 공유

---

## 1. 현황 분석

### 1.1 Studio 파이프라인 (현재 MVP)

```
[Script 생성] → [Storyboard 생성] → [Scene 비디오] → [Export]
    AI ✓           AI ✓            MOCKED ✗        미구현 ✗
```

| 단계        | 현재 AI 모델                       | 목표 AI 모델                | 상태          | 주요 문제                                      |
| ----------- | ---------------------------------- | --------------------------- | ------------- | ---------------------------------------------- |
| Script      | `gemini-2.5-flash`                 | (유지)                      | 동작          | AI 생성 메타데이터 4개 필드 DB 미저장          |
| Storyboard  | `nano-banana-pro-preview` (부적합) | `gemini-2.5-flash` (텍스트) | 동작          | Script 메타데이터 미활용, content 200자만 전달 |
| Scene Image | `gemini-3-pro-image-preview`       | (유지)                      | 부분 동작     | 개별 수동 생성만 가능, 순차 참조 미지원        |
| Scene Video | 없음 (mocked)                      | `veo-3.1-generate-preview`  | 미구현        | `setTimeout`으로 완전 모킹, Veo 3 미연결       |
| B-Roll      | 없음                               | 없음 (스톡 API)             | 미구현        | DB 테이블만 정의, 코드 없음                    |
| Rough Cut   | 없음                               | 없음 (FFmpeg)               | 미구현        | DB 테이블만 정의, 코드 없음                    |
| Subtitles   | 없음                               | (Phase 2)                   | 미구현        | DB 테이블만 정의, 조회 함수만 존재             |
| SEO         | 없음                               | (Phase 2)                   | 미구현        | DB 테이블만 정의, 조회 함수만 존재             |
| Export      | 없음                               | (Phase 2)                   | 미구현        | DB 테이블만 정의, 라우트만 존재                |
| Coloring    | 없음                               | **제거**                    | **제거 대상** | FFmpeg 기반 구현 비현실적, 테이블+코드 제거    |

### 1.2 TrendTube 파이프라인 (별도 시스템)

```
[트렌드 추출] → [아이디어 생성] → [미디어 생성(병렬)] → [합성]
   Step 1           Step 2          Step 3              Step 4
```

| 출력물                   | 저장 위치          | 저장 방식        | Studio 연결 |
| ------------------------ | ------------------ | ---------------- | ----------- |
| `extractedTrends` (text) | `trendtube_result` | text 컬럼        | ❌ 없음     |
| `videoIdeas` (text)      | `trendtube_result` | text 컬럼        | ❌ 없음     |
| `narrationScript` (text) | `trendtube_result` | text 컬럼        | ❌ 없음     |
| `generated_video` (MP4)  | `trendtube_media`  | **base64 in DB** | ❌ 없음     |
| `background_music` (WAV) | `trendtube_media`  | **base64 in DB** | ❌ 없음     |
| `voiceover` (MP3)        | `trendtube_media`  | **base64 in DB** | ❌ 없음     |
| `composited_video` (MP4) | `trendtube_media`  | **base64 in DB** | ❌ 없음     |

### 1.3 TrendTube 결과 접근성 문제

- `/studio/dashboard/:projectId` 접속 시 항상 **입력 폼**만 표시
- 이전 결과를 보려면 `?session=<sessionId>` 파라미터가 필요
- 사용자가 sessionId를 기억하거나 URL을 보관해야 함

### 1.4 데이터 관계도 (현재)

```
project
 ├── studio_script (1:1, unique) ← ⚠️ 재생성 시 덮어쓰기 (이전 결과 소실)
 │    └── studio_script_segment (1:N) ← ⚠️ 재생성 시 전체 DELETE 후 재INSERT
 │         └── studio_storyboard (1:N) ← ⚠️ segment 삭제 시 scriptSegmentId SET NULL (고아화)
 │              ├── media_asset (이미지) ← imageAssetId (수동 개별 생성)
 │              └── studio_video (1:1) [MOCKED]
 │                   └── studio_video_part (1:N) [MOCKED]
 │
 ├── trendtube_session (1:N) ← ✅ 매 실행마다 새 세션 생성 (이전 결과 보존)
 │    ├── trendtube_result (1:1)
 │    └── trendtube_media (1:N) [base64 in DB, mediaAssetId 항상 NULL]
 │
 └── (Phase 2+ 미구현)
      ├── studio_b_roll
      ├── studio_rough_cut_timeline / segment / version
      ├── studio_subtitle
      ├── studio_seo
      ├── studio_export_history
      ├── studio_coloring_preset / setting  ← 제거 대상
      └── studio_thumbnail / candidate / overlay
```

### 1.5 Supabase Storage 현황

- `media` 버킷만 존재 (기존 `storyboard-images/` 데이터 전부 삭제됨)
- 기존 경로 마이그레이션 불필요 — 신규 경로 구조로 바로 시작 가능

---

## 2. 핵심 문제점 상세 분석

### 2.1 Studio vs TrendTube 생성 관리 방식 불일치

**TrendTube**: 세션 기반 (1:N) — 이력 보존

```text
project → trendtube_session (1:N)
            ├── trendtube_result (1:1) — 텍스트 결과
            └── trendtube_media (1:N) — 미디어 에셋
```

- 매 실행마다 **새 세션** 생성 → 이전 결과 보존
- 세션 단위로 이력 추적, A/B 비교 가능
- 세션 삭제 시 관련 데이터 cascade 정리

**Studio**: 덮어쓰기 (1:1) — 이력 소실

```text
project → studio_script (1:1, unique constraint)
            └── studio_script_segment (1:N) — 재생성 시 전체 DELETE
                 └── studio_storyboard (1:N) — FK SET NULL로 고아화
```

- `saveScript()`: 기존 segments **전체 DELETE** → 새 segments INSERT
- `saveStoryboard()`: 기존 storyboards **전체 DELETE** → 새 scenes INSERT
- 재생성 시 이전 결과가 **완전히 소실**
- Script 재생성 → segments 삭제 → storyboard의 `scriptSegmentId` SET NULL → 고아 storyboard + 이미지/비디오 미아

**문제 영향**:

| 시나리오              | TrendTube                    | Studio (현재)              |
| --------------------- | ---------------------------- | -------------------------- |
| AI 재생성             | 새 세션 생성, 이전 결과 보존 | 이전 결과 완전 소실        |
| A/B 비교              | 세션 간 비교 가능            | 불가능 (이전 결과 없음)    |
| 비용이 큰 미디어 보호 | 세션별 독립 관리             | Script 재생성 시 연쇄 파괴 |
| Storage 고아 파일     | 세션 cascade로 정리          | DB 연결 끊어져도 파일 잔존 |
| 롤백                  | 이전 세션 선택               | 불가능                     |

### 2.2 데이터 손실: Script AI 메타데이터 미저장

**원인**: `generate-script-stream.ts` 라인 83-87에서 AI 생성 결과를 DB에 저장할 때 3개 필드만 매핑

```typescript
// app/features/studio/api/generate-script-stream.ts (현재)
await saveScript({
  projectId,
  prompt: options.customPrompt,
  segments: allSegments.map((seg) => ({
    type: seg.type,
    content: seg.content,
    estimatedDuration: seg.duration,
    // ❌ 누락: visualNotes, emotionalTone, keywords, sceneHints
  })),
});
```

**AI가 생성하는 ScriptSegment 전체 필드** (`ai-script.server.ts`):

| 필드            | 타입                                              | DB 저장                       | 후속 단계 소비                                                        |
| --------------- | ------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------- |
| `type`          | `"hook" \| "intro" \| "body" \| "cta" \| "outro"` | ✅ 저장                       | **Step 2**: Storyboard AI가 세그먼트 유형별 시각 스타일 결정에 사용   |
| `content`       | `string`                                          | ✅ 저장                       | **Step 2**: Storyboard AI 입력 (내용 기반 씬 생성)                    |
| `duration`      | `number`                                          | ✅ 저장 (`estimatedDuration`) | **Step 2**: Storyboard 씬 duration 합산 기준 (현재 미전달, 수정 필요) |
| `visualNotes`   | `string`                                          | ❌ 미저장                     | **Step 2**: Storyboard 시각적 방향 제시                               |
| `emotionalTone` | `string`                                          | ❌ 미저장                     | **Step 2→3**: Storyboard/Scene 분위기 설정                            |
| `keywords`      | `string[]`                                        | ❌ 미저장                     | **Step 4**: B-Roll 스톡 영상 검색 키워드                              |
| `sceneHints`    | `SceneHint[]`                                     | ❌ 미저장                     | **Step 2**: Storyboard 씬 분할 수/방향 힌트                           |

**DB 확인**: `studio_script_segment` 테이블에는 `type`, `content`, `estimated_duration`만 존재. 나머지 필드를 위한 컬럼이 없음.

### 2.3 Storyboard AI가 Script 메타데이터 미활용

**원인**: `ai-storyboard.server.ts`의 `buildStoryboardPrompt` 함수에서 `content`의 첫 200자만 사용. `duration`도 미전달.

```typescript
// app/lib/ai-storyboard.server.ts (현재)
const segmentsList = scriptSegments
  .map((seg, i) => {
    const preview =
      seg.content.length > 200
        ? seg.content.slice(0, 200) + "..."
        : seg.content;
    return `${i + 1}. [ID: ${seg.id}] [Type: ${seg.type}] ${preview}`;
    // ❌ duration 미포함
    // ❌ visualNotes, emotionalTone, sceneHints 미포함
  })
  .join("\n");
```

### 2.4 Storyboard 텍스트 생성에 부적합한 AI 모델

**현재**: `ai-storyboard.server.ts`에서 `nano-banana-pro-preview`를 텍스트 스토리보드 생성에 사용

**문제**: `nano-banana-pro-preview` (= Nano Banana Pro, Gemini 3 Pro Image)는 **이미지 생성/편집 전용 모델**

| 항목                 | `nano-banana-pro-preview` | `gemini-2.5-flash`             |
| -------------------- | ------------------------- | ------------------------------ |
| **주 용도**          | 이미지 생성/편집          | 범용 텍스트/추론               |
| **JSON 구조화 출력** | 미보장 (공식 문서 미언급) | 공식 지원 (`responseMimeType`) |
| **입력 토큰**        | 65,536                    | 1,048,576                      |
| **출력 토큰**        | 32,768 (이미지 모델 제한) | 65,536                         |
| **스트리밍**         | 이미지 중심               | 텍스트 스트리밍 최적화         |
| **비용 구조**        | 이미지 생성 과금          | 텍스트 토큰 과금 (저렴)        |

**변경**: `gemini-2.5-flash`로 교체. Step 1 (Script)과 동일 모델 → 일관성 확보, JSON 구조화 출력 안정성 보장.

### 2.5 Scene 이미지: 개별 수동 생성만 가능, 순차 참조 미지원

**현재 상태**:

- `generate-scene-image.ts` API가 존재하여 개별 Scene 이미지를 수동으로 생성 가능
- `ai-image.server.ts`의 `generateImage(prompt, options)` 사용 (`gemini-3-pro-image-preview`)
- **문제점**:
  - 사용자가 각 씬을 수동으로 하나씩 이미지 생성 버튼 클릭 필요
  - 이전 씬 이미지를 참조 이미지로 전달하는 기능 없음 → 시각적 일관성 보장 불가
  - `ImageGenerationOptions`에 `referenceImage` 파라미터 없음

### 2.6 Scene Video 페이지 완전 모킹

**원인**: `studio-scene-page.tsx`에서 모든 비디오 생성 로직이 `setTimeout`으로 모킹

**영향**:

- `studio_video` / `studio_video_part` 테이블이 DB에 존재하지만 실제 레코드 미생성
- Veo 3 API(`ai-video.server.ts`)는 TrendTube에서만 사용, Studio Scene 미연결
- `ai-video.server.ts`의 `generateVideo()`가 image-to-video 미지원, base64 반환

### 2.7 TrendTube 미디어 base64 DB 저장

- **모든 미디어가 base64 data URL로 PostgreSQL에 저장**
  - 8초 MP4 영상: ~5-20MB → base64 인코딩 시 ~6.5-26MB 텍스트
  - 배경음악(WAV): ~1-3MB, 보이스오버(MP3): ~100KB-1MB
- DB에 대용량 텍스트 저장 → 쿼리 성능 저하, 백업 비효율
- `trendtube_media.mediaAssetId`는 항상 NULL (media_asset 테이블 미활용)

#### 현재 데이터 흐름 비교: Studio 이미지 vs TrendTube 비디오

**Studio 이미지 (정상 패턴)**:

```text
Gemini API 응답 (inlineData.data: base64 string)
  ↓ Buffer.from(imageData.data, "base64")         ← ai-image.server.ts:141
  ↓ return { buffer, mimeType, ... }               ← Buffer 반환 ✅
  ↓
uploadStoryboardImage(projectId, sceneId, buffer, mimeType)
  ↓ supabase.storage.upload(storageKey, buffer)    ← 바이너리로 Storage 업로드 ✅
  ↓
publicUrl 반환 → media_asset.publicUrl에 저장      ← 짧은 URL 문자열 ✅
```

**TrendTube 비디오 (문제 패턴)**:

```text
Veo 3 API → video.uri (임시 다운로드 URL)
  ↓ fetch(downloadUrl) → arrayBuffer               ← ai-video.server.ts:103-111
  ↓ Buffer.from(arrayBuffer)                        ← Buffer 생성
  ↓
  ↓ ⚠️ Buffer를 다시 base64 data URL 문자열로 변환
  ↓ `data:${contentType};base64,${buffer.toString("base64")}`  ← :114
  ↓ return { url: dataUrl, ... }                    ← base64 data URL 반환 ❌
  ↓
saveTrendTubeMedia({ publicUrl: result.url })        ← trendtube-step-media.ts:101
  ↓
trendtube_media.public_url = "data:video/mp4;base64,AAAA..."
  ↓                                                 ← DB text 컬럼에 수 MB 저장 ❌
media_asset 레코드 미생성, mediaAssetId = NULL       ← 에셋 관리 불가 ❌
```

| 구분             | Studio 이미지               | TrendTube 비디오/음악/TTS              |
| ---------------- | --------------------------- | -------------------------------------- |
| AI 서비스 반환값 | `{ buffer: Buffer }`        | `{ url: "data:video/mp4;base64,..." }` |
| 저장 위치        | Supabase Storage (바이너리) | PostgreSQL text 컬럼 (base64 문자열)   |
| DB 저장값        | Storage public URL (~100B)  | base64 data URL (~6.5-26MB/건)         |
| media_asset 연결 | `imageAssetId` FK 연결      | `mediaAssetId` 항상 NULL               |
| 재사용 가능 여부 | public URL로 즉시 접근      | DB 조회 + base64 디코딩 필요           |

### 2.8 TrendTube 결과 재접근 불가

- `?session=<sessionId>` 없이 접속 시 항상 입력 폼만 표시
- 이전 생성 결과를 볼 수 없음

### 2.9 Enum 불일치: project.tone vs project.contentTone

| 필드                  | Enum              | 값                                                           |
| --------------------- | ----------------- | ------------------------------------------------------------ |
| `project.tone`        | `projectToneEnum` | `informative`, `funny`, `cinematic`, `vlog`                  |
| `project.contentTone` | `contentToneEnum` | `informative`, `funny`, `dramatic`, `casual`, `professional` |

- `tone`은 레거시, `contentTone`이 개선 버전

### 2.10 Coloring 테이블 및 기능 (제거 대상)

- `studio_coloring_preset`, `studio_coloring_setting` 테이블, `getColorPresets()` 함수, `studio-coloring-page.tsx` 페이지
- **결정**: FFmpeg 기반 컬러 그레이딩 구현이 비현실적이므로 **완전 제거**

### 2.11 Veo 3 영상 길이 제약 (8초) 미반영

**Veo 3 API 제약**: 1회 생성당 최대 **8초** 영상만 생성 가능.

**현재 구현**: 모든 영상 생성이 단일 8초 클립으로 하드코딩됨.

| 위치                          | 하드코딩 내용                                                            |
| ----------------------------- | ------------------------------------------------------------------------ |
| `ai-video.server.ts:33`       | `targetDuration = options?.durationSeconds ?? 8`                         |
| `trendtube-step-media.ts:93`  | `generateVideo(videoIdeas, { durationSeconds: 8 })`                      |
| `trendtube-step-media.ts:141` | `generateMusic(videoIdeas, { durationSeconds: 8 })`                      |
| `trendtube-step-media.ts:216` | `generateVoiceover(narrationScript, voiceOption, { targetDuration: 8 })` |
| `video-composer.server.ts:75` | FFmpeg `-t 8` (8초 트림)                                                 |
| `ai-trendtube.server.ts:5`    | 코멘트 "8-second format"                                                 |
| `tts.server.ts:49-55`         | 8초 기준 스크립트 문자 수 제한 (한국어 ~40자, 영문 ~120자)               |

**문제**:

- **Studio**: Script의 `estimatedDuration`이 수 분 단위이나, Scene 비디오가 8초 1개만 생성 → 전체 영상 길이 부족
- **TrendTube**: 나레이션 스크립트를 8초에 맞춰 강제 절단 → 내용 손실
- 두 시스템 모두 **다수 클립 순차 생성** 로직 없음
- 클립 간 합성/이어붙이기 로직 없음

### 2.12 미디어 에셋 테이블 명명 규칙 불일치

**3가지 서로 다른 미디어 메타데이터 저장 패턴**이 공존:

| 테이블            | 위치                       | 역할                | 메타데이터 저장 방식                                                   |
| ----------------- | -------------------------- | ------------------- | ---------------------------------------------------------------------- |
| `media_asset`     | project-schema.ts          | 공용 에셋 저장소    | 컬럼: width, height, duration, fileSize, mimeType                      |
| `studio_video`    | studio-schema.ts           | Studio Scene 비디오 | 컬럼: duration, status + FK `videoAssetId` → media_asset               |
| `trendtube_media` | studio-trendtube-schema.ts | TrendTube 미디어    | JSONB: `{ duration, prompt, genre }` + FK `mediaAssetId` → media_asset |

**문제**:

- `media_asset`에 기술 메타데이터(width, height, duration)가 있는데, `studio_video`와 `trendtube_media`에도 duration이 중복 저장
- `trendtube_media.metadata` (JSONB)에 비정형으로 저장 vs `studio_video.duration` 컬럼으로 정형 저장 → 일관성 없음
- `trendtube_media.mediaAssetId`가 항상 NULL → `media_asset` 테이블과 실질적으로 연결 안 됨
- Studio는 `studio_video.videoAssetId`로 직접 FK, TrendTube는 `trendtube_media.publicUrl`에 base64 저장 → 완전히 다른 패턴

### 2.13 AI 서비스 호출 패턴 파편화

**2개 SDK, 모델 하드코딩, retry 미적용 등 AI 호출 패턴이 파일별로 다름**:

| AI 서비스 파일                   | 모델                         | SDK                       | retry        | 용도               |
| -------------------------------- | ---------------------------- | ------------------------- | ------------ | ------------------ |
| `ai-script.server.ts`            | `gemini-2.5-flash`           | `@google/generative-ai`   | withRetry ✅ | Studio Script      |
| `ai-storyboard.server.ts`        | `nano-banana-pro-preview` ⚠️ | `@google/generative-ai`   | withRetry ✅ | Studio Storyboard  |
| `ai-image.server.ts`             | `gemini-3-pro-image-preview` | `@google/generative-ai`   | withRetry ✅ | Studio Scene Image |
| `ai-video.server.ts`             | `veo-3.1-generate-preview`   | `@google/genai`           | ❌ polling만 | Studio + TrendTube |
| `ai-music.server.ts`             | `lyria-realtime-exp`         | `@google/genai` (v1alpha) | ❌ 없음      | TrendTube          |
| `tts.server.ts`                  | Google Cloud TTS             | HTTP REST                 | ❌ 없음      | TrendTube          |
| `ai-trendtube.server.ts`         | `gemini-2.5-flash`, `-lite`  | `@google/generative-ai`   | withRetry ✅ | TrendTube 텍스트   |
| `ai-project-generator.server.ts` | `gemini-2.5-flash-lite`      | `@google/generative-ai`   | withRetry ✅ | 프로젝트 생성      |

**문제**:

1. **2개 SDK 혼용**: 텍스트 모델은 `@google/generative-ai`의 `GoogleGenerativeAI`, 비디오/음악은 `@google/genai`의 `GoogleGenAI` → 별도 인스턴스, 별도 초기화
2. **모델명 하드코딩**: 각 파일에서 모델명 문자열 직접 사용 → 모델 변경 시 전체 파일 수정 필요
3. **retry 미적용**: `ai-video.server.ts`, `ai-music.server.ts`, `tts.server.ts`는 `withRetry()` 미사용 → 일시적 API 오류 시 즉시 실패
4. **TrendTube 전용 `ai-trendtube.server.ts`**: Studio의 `ai-script.server.ts`와 유사한 텍스트 생성이지만 완전히 별도 파일 → 프롬프트 패턴, 에러 핸들링 중복
5. **중앙 모델 레지스트리 없음**: 어떤 모델이 어디서 사용되는지 한눈에 파악 불가

---

## 3. 목표 파이프라인 설계

### 3.1 통합 파이프라인 흐름

```
[TrendTube] ───────────────────────────────────────────────────────┐
  │ narrationScript → studio_script (import)                       │
  │ generated_video → media_asset (B-Roll/Scene 재사용)             │
  │ voiceover → studio_subtitle (자동 생성 기반)                    │
  │ background_music → rough_cut_timeline (오디오 트랙)             │
  └────────────────────────────────────────────────────────────────┘

[Studio Pipeline]
  ┌──────────┐    ┌───────────────────────┐    ┌─────────────────────┐    ┌─────────┐    ┌───────────┐
  │ Step 1   │ →  │      Step 2           │ →  │      Step 3         │ →  │ Step 4  │ →  │  Step 5   │
  │ Script   │    │ Storyboard + Image    │    │    Scene Video      │    │ B-Roll  │    │ Rough Cut │
  │ (AI텍스트)│    │ (AI텍스트 → 순차이미지)│    │ (순차비디오, 참조체인)│    │         │    │           │
  └──────────┘    └───────────────────────┘    └─────────────────────┘    └─────────┘    └───────────┘
```

### 3.2 각 단계별 기능 정의 및 데이터 플로우

#### Step 1: Script 생성

| 항목             | 설명                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| **입력**         | 프로젝트 정보 (title, topic, targetAudience, hooks, channel, trends, scriptGuidelines, aiContext) |
| **AI 모델**      | `gemini-2.5-flash`                                                                                |
| **AI 출력 필드** | 아래 "Step 1 출력 → 소비 매핑" 참조                                                               |
| **DB 저장**      | `studio_script` + `studio_script_segment` (**모든 필드** 저장)                                    |

**Step 1 출력 → 소비 매핑**:

| 출력 필드       | 소비 단계                       | 소비 방식                                                   | 비고                                    |
| --------------- | ------------------------------- | ----------------------------------------------------------- | --------------------------------------- |
| `type`          | **Step 2** (Storyboard)         | Storyboard AI 프롬프트에서 세그먼트 유형별 시각 스타일 결정 | 기존 전달 O                             |
| `content`       | **Step 2** (Storyboard)         | Storyboard AI가 씬 내용 기반으로 시각화                     | 기존 전달 O (200자 제한 → 300자로 확장) |
| `duration`      | **Step 2** (Storyboard)         | 각 세그먼트의 씬 duration 합산 기준값으로 전달              | ⚠️ 현재 미전달, **수정 필요**           |
| `visualNotes`   | **Step 2** (Storyboard)         | 씬 시각적 방향 제시 (조명, 분위기, 배경 등)                 | ❌ 미저장, **신규 저장**                |
| `emotionalTone` | **Step 2→3** (Storyboard→Scene) | 이미지/비디오 생성 분위기 제어                              | ❌ 미저장, **신규 저장**                |
| `keywords`      | **Step 4** (B-Roll)             | 스톡 영상 검색 키워드로 직접 사용 (추가 AI 호출 불필요)     | ❌ 미저장, **신규 저장**                |
| `sceneHints`    | **Step 2** (Storyboard)         | 씬 분할 수/방향 힌트, 초기 visualPrompt 참조                | ❌ 미저장, **신규 저장**                |

#### Step 2: Storyboard + Scene 이미지 생성

| 항목            | 설명                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **입력**        | Step 1 전체 출력 (type + content + duration + visualNotes + emotionalTone + sceneHints) + 스타일 옵션                           |
| **Step 2a**     | `gemini-2.5-flash`로 텍스트 스토리보드 생성 (SSE 스트리밍, JSON 구조화 출력)                                                    |
| **Step 2b**     | 텍스트 생성 완료 후, 각 Scene별 **순차** 이미지 생성 (참조 체이닝)                                                              |
| **이미지 AI**   | `gemini-3-pro-image-preview` (기존 `generateImage()` 확장)                                                                      |
| **참조 체이닝** | Scene N 이미지 생성 시 Scene N-1의 이미지 Buffer를 `inlineData`로 전달 → Gemini multimodal 입력으로 시각적 일관성 확보          |
| **입력 방식**   | Gemini 이미지 생성은 **`inlineData` (base64) 전용** — `fileUri` (URL)는 이미지 생성 모드에서 미지원. 메모리 내 Buffer 직접 전달 |

**Step 2 순차 이미지 생성 흐름**:

```
텍스트 스토리보드 스트리밍 완료 (Scene 1~N 확정)
  │
  ├── Scene 1: generateImage(visualPrompt₁)
  │    └── buffer₁ (메모리 유지) → Storage 업로드 → media_asset → storyboard.imageAssetId
  │         └── SSE: { type: "image", sceneNumber: 1, imageUrl }
  │
  ├── Scene 2: generateImage(visualPrompt₂, { referenceImage: buffer₁ })
  │    └── buffer₂ (메모리 유지) → Storage 업로드 → media_asset → storyboard.imageAssetId
  │         └── SSE: { type: "image", sceneNumber: 2, imageUrl }
  │
  └── Scene N: generateImage(visualPromptₙ, { referenceImage: bufferₙ₋₁ })
       └── bufferₙ → Storage 업로드 → media_asset → storyboard.imageAssetId
            └── SSE: { type: "image", sceneNumber: N, imageUrl }
```

> **참조 입력 제약**: Gemini 이미지 생성 API는 외부 URL(`fileUri`)을 참조 이미지로 사용할 수 없음.
> `inlineData` (base64 인코딩 Buffer)만 지원. 따라서 이전 Scene의 생성 결과 Buffer를
> 메모리에 유지하여 다음 Scene 생성에 직접 전달.

**Step 2 출력 → 소비 매핑**:

| 출력 필드       | 소비 단계                                        | 소비 방식                                 |
| --------------- | ------------------------------------------------ | ----------------------------------------- |
| `visualPrompt`  | **Step 3** (Scene Video)                         | Veo 3 비디오 생성 프롬프트로 직접 사용    |
| `imageAssetId`  | **Step 3** (Scene Video)                         | Veo 3 image-to-video 참조 이미지          |
| `duration`      | **Step 3** (Scene Video), **Step 5** (Rough Cut) | 클립 길이 결정                            |
| `emotionalTone` | **Step 3** (Scene Video)                         | 비디오 분위기 제어 (Script에서 전달된 값) |
| `description`   | UI 표시 전용                                     | 한국어 씬 설명 (후속 AI 입력에 불필요)    |

#### Step 3: Scene Video 생성

| 항목            | 설명                                                                             |
| --------------- | -------------------------------------------------------------------------------- |
| **입력**        | Step 2 출력 (visualPrompt + imageAssetId + emotionalTone + duration)             |
| **AI 모델**     | Veo 3 (`veo-3.1-generate-preview`) — **1회당 최대 8초 클립**                     |
| **클립 분할**   | Scene duration > 8초일 경우, 8초 단위 클립으로 분할 생성 (Scene 내 순차)         |
| **생성 방식**   | Scene 단위 **순차** 생성 (참조 체이닝) × 클립 단위 **순차** 생성 (Scene 내)      |
| **참조 체이닝** | Scene N 생성 시 Step 2 이미지 + 이전 Scene 비디오를 참조로 전달                  |
| **이미지 입력** | Storage에서 `fetch()` → Buffer → `inlineData`. Veo 3는 URL 미지원                |
| **비디오 참조** | Veo `video` 파라미터로 이전 생성의 응답 객체를 직접 전달 (재업로드 불필요)       |
| **출력**        | 비디오 → Supabase Storage → `media_asset` + `studio_video` + `studio_video_part` |

**Step 3 순차 비디오 생성 흐름 (8초 클립 단위)**:

```text
Step 2 완료 (모든 Scene에 imageAssetId 존재)
  │
  ├── Scene 1 (duration: 16초 → 2클립)
  │    ├── Clip 1-1: generateVideo(visualPrompt₁_part1, {
  │    │      image: fetch(storyboardImage₁) → Buffer → inlineData
  │    │    })
  │    │    └── veoClip₁₋₁ → Buffer → Storage 업로드 → studio_video_part
  │    │         └── SSE: { type: "video_clip", sceneNumber: 1, clipNumber: 1 }
  │    │
  │    └── Clip 1-2: generateVideo(visualPrompt₁_part2, {
  │         image: storyboardImage₁ Buffer,
  │         video: veoClip₁₋₁  ← 이전 클립 참조 (장면 내 연속성)
  │       })
  │       └── veoClip₁₋₂ → Buffer → Storage 업로드 → studio_video_part
  │            └── SSE: { type: "video_clip", sceneNumber: 1, clipNumber: 2 }
  │
  ├── Scene 2 (duration: 8초 → 1클립)
  │    └── Clip 2-1: generateVideo(visualPrompt₂, {
  │         image: fetch(storyboardImage₂) → Buffer → inlineData,
  │         video: veoClip₁₋₂  ← 이전 Scene 마지막 클립 참조 (장면 간 연속성)
  │       })
  │       └── veoClip₂₋₁ → Buffer → Storage 업로드 → studio_video_part
  │            └── SSE: { type: "video_clip", sceneNumber: 2, clipNumber: 1 }
  │
  └── SSE: { type: "complete" }
```

> **8초 클립 분할 규칙**:
>
> - Scene `duration` ÷ 8 = 필요 클립 수 (올림). 예: 16초 → 2클립, 24초 → 3클립
> - 각 클립의 visualPrompt는 원본을 시간 순서대로 분할하여 생성
> - 클립 간 참조 체이닝: Scene 내 이전 클립 → 장면 내 시각적 연속성 확보
> - Scene 간 참조 체이닝: 이전 Scene의 마지막 클립 → 장면 전환 자연스러움 확보
> - 각 클립은 `studio_video_part` 레코드로 저장 (partNumber, startTime, endTime, duration)
>
> **참조 입력 제약**:
>
> - **referenceImage**: Veo 3는 외부 URL을 참조 이미지로 직접 수용 불가. Supabase Storage
>   publicUrl에서 `fetch()` → Buffer 변환 후 `inlineData`로 전달 필수.
> - **referenceVideo**: Veo 3의 `video` 파라미터는 이전 생성의 Veo 응답 `video` 객체를
>   직접 참조. 순차 생성 루프 내에서 이전 응답 객체를 메모리에 유지하여 전달하므로
>   별도 다운로드/재업로드 불필요.

**Step 3 출력 → 소비 매핑**:

| 출력 필드      | 소비 단계              | 소비 방식                 |
| -------------- | ---------------------- | ------------------------- |
| `videoAssetId` | **Step 5** (Rough Cut) | 타임라인 비디오 트랙 소스 |
| `duration`     | **Step 5** (Rough Cut) | 타임라인 세그먼트 길이    |

#### Step 4: B-Roll 매칭

| 항목          | 설명                                                                     |
| ------------- | ------------------------------------------------------------------------ |
| **입력**      | Step 1의 `keywords[]` (AI 추가 호출 없이 직접 사용)                      |
| **외부 API**  | Pexels / Pixabay (스톡 영상 검색)                                        |
| **AI 최적화** | AI 호출 없음. Script AI가 이미 생성한 keywords를 검색 키워드로 직접 사용 |

**Step 4 출력 → 소비 매핑**:

| 출력 필드 | 소비 단계              | 소비 방식               |
| --------- | ---------------------- | ----------------------- |
| `assetId` | **Step 5** (Rough Cut) | 타임라인 보조 영상 소스 |

#### Step 5: Rough Cut 편집

| 항목       | 설명                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------ |
| **입력**   | Step 3 (videoAssetId) + Step 4 (B-Roll assetId) + TrendTube 미디어 (background_music, voiceover) |
| **출력**   | `studio_rough_cut_timeline` + `studio_rough_cut_timeline_segment`                                |
| **렌더링** | FFmpeg 서버사이드 → `studio_rough_cut_version`                                                   |

### 3.3 AI 호출 최적화 요약

| 단계                 | AI 호출                                                   | 최적화 방안                                                    |
| -------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| Step 1 (Script)      | Gemini `gemini-2.5-flash` 1회                             | `keywords`, `sceneHints`를 한 번에 생성 → Step 2, 4에서 재사용 |
| Step 2 (Storyboard)  | Gemini `gemini-2.5-flash` 1회 (텍스트)                    | Step 1의 `sceneHints`가 있으면 이를 참조하여 씬 분할           |
| Step 2 (Scene Image) | `gemini-3-pro-image-preview` N회 (Scene 당 1회, **순차**) | 이전 Scene 이미지를 참조로 전달 → 시각적 일관성                |
| Step 3 (Scene Video) | Veo 3 M회 (Scene당 ceil(duration/8)클립, **순차**)        | Step 2 이미지 + 이전 클립 참조 체이닝 → 장면 내/간 연속성      |
| Step 4 (B-Roll)      | AI 호출 없음                                              | Step 1의 `keywords`로 직접 검색                                |
| Step 5 (Rough Cut)   | AI 호출 없음 (Phase 2에서 AI 편집 추가 가능)              | Step 3/4의 에셋을 자동 배치                                    |

### 3.4 AI 서비스 아키텍처 통합

#### 현재: 파일별 독립 구현

```text
app/lib/
 ├── gemini-client.server.ts     ← GoogleGenerativeAI 싱글턴 (텍스트 모델 전용)
 ├── gemini-retry.server.ts      ← withRetry() (텍스트 모델에만 적용)
 ├── ai-script.server.ts         ← gemini-2.5-flash (Studio Script)
 ├── ai-storyboard.server.ts     ← nano-banana-pro-preview ⚠️ (잘못된 모델)
 ├── ai-image.server.ts          ← gemini-3-pro-image-preview (Studio Image)
 ├── ai-video.server.ts          ← GoogleGenAI 별도 인스턴스, retry 없음
 ├── ai-music.server.ts          ← GoogleGenAI v1alpha, retry 없음
 ├── ai-trendtube.server.ts      ← gemini-2.5-flash/lite (TrendTube 전용)
 ├── ai-project-generator.server.ts ← gemini-2.5-flash-lite
 └── tts.server.ts               ← Google Cloud TTS REST API, retry 없음
```

#### 목표: 통합 AI 서비스 레이어

**원칙**:

1. **모델 레지스트리**: 모든 모델명을 중앙 설정 파일에서 관리
2. **클라이언트 통합**: SDK별 싱글턴 패턴을 `gemini-client.server.ts`에서 통합 관리
3. **retry 일괄 적용**: `withRetry()`를 비디오/음악/TTS에도 적용
4. **공유 서비스 함수**: Studio와 TrendTube가 동일 AI 서비스 함수를 호출

**모델 레지스트리** (`app/lib/ai-models.server.ts` 신규):

```typescript
export const AI_MODELS = {
  // 텍스트 생성 (구조화 JSON 출력)
  text: {
    primary: "gemini-2.5-flash",
    lite: "gemini-2.5-flash-lite",
  },
  // 이미지 생성
  image: {
    primary: "gemini-3-pro-image-preview",
  },
  // 비디오 생성
  video: {
    primary: "veo-3.1-generate-preview",
  },
  // 음악 생성
  music: {
    primary: "lyria-realtime-exp",
  },
} as const;
```

**클라이언트 통합** (`gemini-client.server.ts` 확장):

```typescript
// 기존: 텍스트 모델 전용
export function getGeminiClient(): GoogleGenerativeAI | null;
export function getTextModel(modelName: string, systemInstruction?: string);

// 신규: 비디오/음악 클라이언트도 통합 관리
export function getGenAIClient(): GoogleGenAI | null; // @google/genai SDK
export function getGenAIAlphaClient(): GoogleGenAI | null; // v1alpha (음악)
```

**서비스 공유 매핑 (Studio ↔ TrendTube)**:

| AI 기능           | 공유 서비스 함수         | Studio 호출        | TrendTube 호출                |
| ----------------- | ------------------------ | ------------------ | ----------------------------- |
| 텍스트 스크립트   | `ai-script.server.ts`    | `generateScript()` | `generateScript()` (import)   |
| 나레이션 스크립트 | `ai-trendtube.server.ts` | 미사용             | `generateNarrationScript()`   |
| 이미지 생성       | `ai-image.server.ts`     | `generateImage()`  | 미사용 (Phase 2+)             |
| 비디오 생성       | `ai-video.server.ts`     | `generateVideo()`  | `generateVideo()` (동일 함수) |
| 음악 생성         | `ai-music.server.ts`     | 미사용 (Phase 2+)  | `generateMusic()`             |
| TTS               | `tts.server.ts`          | 미사용 (Phase 2+)  | `generateVoiceover()`         |

> **통합 범위**: Studio와 TrendTube가 이미 동일 `ai-video.server.ts` 함수를 공유.
> `ai-trendtube.server.ts`의 텍스트 생성 함수(trend 추출, 아이디어 생성 등)는 TrendTube 전용 프롬프트이므로 별도 유지.
> 핵심은 **모델 레지스트리 중앙화** + **retry 일괄 적용** + **SDK 클라이언트 통합 관리**.

---

## 4. Supabase Storage 통합 설계

### 4.1 저장소 전략

#### MVP: Supabase Storage

- **이유**: 이미 구성 완료 + 업로드 유틸리티 존재 + 코드 변경 최소
- 기존 `"media"` 버킷 사용, 경로로 구분

#### 확장 시: Cloudflare R2

- 영상 트래픽이 커지면 **Egress 무료**인 R2로 마이그레이션
- S3 호환 API이므로 코드 변경 최소
- `mediaProviderEnum`에 `r2`가 이미 정의되어 있어 스키마 변경 불필요

### 4.2 통합 경로 구조

```text
media/                                                          (버킷)
└── projects/{projectId}/
     ├── studio/{sessionId}/
     │    ├── storyboard/
     │    │    └── scene-{sceneNumber}_{timestamp}.png           (Step 2 Scene 이미지)
     │    │
     │    └── scene-video/
     │         └── scene-{sceneNumber}_{timestamp}.mp4           (Step 3 Scene 비디오)
     │
     └── trendtube/{sessionId}/
          ├── video_{timestamp}.mp4                              (Veo 3 생성 영상)
          ├── music_{timestamp}.wav                              (Lyria 2 배경음악)
          ├── voiceover_{timestamp}.mp3                          (TTS 나레이션)
          └── composited_{timestamp}.mp4                         (FFmpeg 합성 영상)
```

> **세션 기반 경로 설계 이유**:
>
> - Studio와 TrendTube 모두 `{sessionId}`를 경로에 포함하여 **일관된 구조** 유지
> - Script 재생성 시 새 세션이 생성되므로, 이전 세션의 이미지/비디오 파일이 **자동 보존**
> - 세션 삭제 시 해당 경로 하위 파일을 일괄 삭제 가능 (`storage.list() → delete`)
> - `media_asset.storageKey`에 세션 정보가 포함되어 있어 고아 파일 추적 용이

### 4.3 기존 경로 마이그레이션

**현황**: `storyboard-images/` 버킷의 모든 데이터를 삭제함. `media` 버킷만 존재.

| 기존 경로                                          | 상태                        | 조치                     |
| -------------------------------------------------- | --------------------------- | ------------------------ |
| `storyboard-images/{projectId}/{sceneId}/{ts}.png` | **삭제 완료** (데이터 없음) | 마이그레이션 불필요      |
| trendtube: base64 in DB                            | DB에 base64 저장 중         | Phase 0에서 Storage 전환 |

**결론**: 기존 데이터가 없으므로 마이그레이션 없이 **신규 경로 구조로 바로 시작**. `storyboard-images/` 버킷 자체도 삭제 가능함.

### 4.4 업로드 유틸리티 통합

파일: `app/lib/supabase-storage.server.ts`

```typescript
// 기존 함수 제거 (기존 데이터 없음, 신규 경로 구조로 대체)
// export async function uploadStoryboardImage(...) → 삭제

// 신규: 통합 업로드 함수
export async function uploadProjectMedia(
  projectId: string,
  category: "studio" | "trendtube",
  subcategory:
    | "storyboard"
    | "scene-video"
    | "video"
    | "music"
    | "voiceover"
    | "composited",
  fileName: string,
  buffer: Buffer,
  mimeType: string,
  sessionId: string, // studio, trendtube 모두 필수
): Promise<{ storageKey: string; publicUrl: string }>;
// 경로: projects/{projectId}/{category}/{sessionId}/{subcategory}/{fileName}

// 편의 함수: Studio 이미지 업로드
export async function uploadStudioImage(
  projectId: string,
  sessionId: string,
  sceneNumber: number,
  buffer: Buffer,
  mimeType: string,
): Promise<{ storageKey: string; publicUrl: string }>;
// 경로: projects/{projectId}/studio/{sessionId}/storyboard/scene-{sceneNumber}_{timestamp}.png

// 편의 함수: Studio 비디오 업로드
export async function uploadStudioVideo(
  projectId: string,
  sessionId: string,
  sceneNumber: number,
  buffer: Buffer,
  mimeType: string,
): Promise<{ storageKey: string; publicUrl: string }>;
// 경로: projects/{projectId}/studio/{sessionId}/scene-video/scene-{sceneNumber}_{timestamp}.mp4

// 편의 함수: TrendTube 미디어 업로드
export async function uploadTrendTubeMedia(
  projectId: string,
  sessionId: string,
  mediaType: "video" | "music" | "voiceover" | "composited",
  buffer: Buffer,
  mimeType: string,
): Promise<{ storageKey: string; publicUrl: string }>;
// 경로: projects/{projectId}/trendtube/{sessionId}/{mediaType}_{timestamp}.ext
```

### 4.5 캐시 전략

- timestamp 기반 경로 → **immutable 캐시** 적용 가능
- `Cache-Control: public, max-age=31536000, immutable` (기존 패턴 동일)

---

## 5. DB 스키마 재설계

### 5.1 Studio 세션 기반 관리 도입 (TrendTube 패턴 통합)

#### 전략: Studio에도 세션 개념 도입

TrendTube의 `trendtube_session` 패턴을 Studio에 적용하여 **일관된 생성/관리 방식**을 확립한다.

**핵심 변경**: `studio_script`의 `projectId` unique 제약을 제거하고 `studio_session` 테이블을 도입.

#### 신규 테이블: `studio_session`

```sql
CREATE TABLE public.studio_session (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.auth_user(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'archived'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 프로젝트당 active 세션은 1개만 허용
CREATE UNIQUE INDEX idx_studio_session_active
  ON public.studio_session (project_id)
  WHERE status = 'active';
```

**Drizzle 스키마**:

```typescript
export const studioSessions = tubegaiSchema.table("studio_session", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  version: integer("version").default(1).notNull(),
  status: text("status").default("active").notNull(), // "active" | "archived"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### 기존 테이블 FK 변경

```sql
-- studio_script: projectId unique 제거 → sessionId FK 추가
ALTER TABLE public.studio_script
  DROP CONSTRAINT IF EXISTS studio_script_project_id_unique,
  ADD COLUMN session_id UUID REFERENCES public.studio_session(id) ON DELETE CASCADE;

-- studio_storyboard: sessionId FK 추가 (projectId 유지)
ALTER TABLE public.studio_storyboard
  ADD COLUMN session_id UUID REFERENCES public.studio_session(id) ON DELETE CASCADE;

-- studio_video: sessionId FK 추가 (projectId 유지)
ALTER TABLE public.studio_video
  ADD COLUMN session_id UUID REFERENCES public.studio_session(id) ON DELETE CASCADE;
```

#### 통합 관계도 (목표)

```text
project
 ├── studio_session (1:N) ← ✅ TrendTube 패턴과 동일
 │    ├── studio_script (1:1)
 │    │    └── studio_script_segment (1:N)
 │    ├── studio_storyboard (1:N)
 │    │    ├── media_asset (이미지) ← imageAssetId
 │    │    └── studio_video (1:1)
 │    │         └── studio_video_part (1:N)
 │    └── (Phase 2+)
 │         ├── studio_b_roll (1:N)
 │         └── studio_rough_cut_timeline (1:1)
 │
 ├── trendtube_session (1:N) ← ✅ 기존 패턴 유지
 │    ├── trendtube_result (1:1)
 │    └── trendtube_media (1:N)
 │
 └── media_asset (1:N) ← 공유 에셋 저장소
```

#### 생성 흐름 변경

```text
[기존] Script 생성 → 기존 Script DELETE → 새 Script INSERT (덮어쓰기)
[변경] Script 생성 → 기존 session을 "archived" → 새 session 생성 → 새 Script INSERT
```

| 동작            | 기존                             | 변경 후                                  |
| --------------- | -------------------------------- | ---------------------------------------- |
| Script 생성     | 기존 segments DELETE → 새 INSERT | 기존 세션 archived → 새 세션/Script 생성 |
| Storyboard 생성 | 기존 scenes DELETE → 새 INSERT   | 동일 세션 내 scenes DELETE → 새 INSERT   |
| 이전 결과 접근  | 불가                             | archived 세션 조회 가능                  |
| 롤백            | 불가                             | archived 세션을 active로 전환            |

#### `saveScript()` 변경

```typescript
// 기존: 덮어쓰기
export async function saveScript(input: SaveScriptInput): Promise<void> {
  // 기존 segments DELETE → 새 INSERT
}

// 변경: 세션 기반
export async function saveScript(input: SaveScriptInput): Promise<void> {
  // 1. 기존 active 세션이 있으면 "archived"로 변경
  // 2. 새 studio_session 생성 (version = prev + 1)
  // 3. 새 studio_script + segments INSERT
}
```

### 5.2 studio_script_segment: 메타데이터 컬럼 추가

```sql
ALTER TABLE public.studio_script_segment
  ADD COLUMN visual_notes TEXT,
  ADD COLUMN emotional_tone TEXT,
  ADD COLUMN keywords TEXT[],
  ADD COLUMN scene_hints JSONB;
```

**`scene_hints` JSONB 구조**:

```typescript
type SceneHint = {
  description: string;
  visualPrompt: string;
  duration: number;
  cameraAngle?: string;
};
// scene_hints: SceneHint[]
```

**Drizzle 스키마 변경** (`studio-schema.ts`):

```typescript
export const scriptSegments = tubegaiSchema.table("studio_script_segment", {
  id: uuid("id").defaultRandom().primaryKey(),
  scriptId: uuid("script_id")
    .references(() => scripts.id, { onDelete: "cascade" })
    .notNull(),
  orderIndex: integer("order_index").notNull(),
  type: scriptSegmentTypeEnum("type").notNull(),
  content: text("content").notNull(),
  estimatedDuration: integer("estimated_duration"),
  // 신규 컬럼
  visualNotes: text("visual_notes"),
  emotionalTone: text("emotional_tone"),
  keywords: text("keywords").array(),
  sceneHints: jsonb("scene_hints").$type<SceneHint[]>(),
});
```

### 5.3 studio_storyboard: 메타데이터 컬럼 추가

```sql
ALTER TABLE public.studio_storyboard
  ADD COLUMN emotional_tone TEXT,
  ADD COLUMN camera_angle TEXT;
```

Script에서 전달된 `emotionalTone`을 Storyboard 씬에도 저장 → Scene Image/Video 생성 시 분위기 제어에 활용.

**참고**: `imageAssetId` 컬럼은 이미 존재 (Scene 이미지 순차 생성 시 활용).

### 5.4 studio_script: TrendTube 연결 FK 추가

```sql
ALTER TABLE public.studio_script
  ADD COLUMN source_trendtube_session_id UUID
    REFERENCES public.trendtube_session(id) ON DELETE SET NULL;
```

### 5.5 project.tone 컬럼 제거 (contentTone으로 통합)

```sql
-- Step 1: contentTone이 NULL이면 tone 값으로 마이그레이션
UPDATE public.project
SET content_tone = CASE
  WHEN tone = 'informative' THEN 'informative'
  WHEN tone = 'funny' THEN 'funny'
  WHEN tone = 'cinematic' THEN 'dramatic'
  WHEN tone = 'vlog' THEN 'casual'
  ELSE NULL
END
WHERE content_tone IS NULL AND tone IS NOT NULL;

-- Step 2: tone 컬럼 제거
ALTER TABLE public.project DROP COLUMN IF EXISTS tone;
```

**코드 영향**: `project-schema.ts`, `enums.ts`, `new-project-page.tsx`, `project.data.server.ts`, `ai-script.server.ts`

### 5.6 Coloring 테이블 제거

```sql
DROP TABLE IF EXISTS public.studio_coloring_setting;
DROP TABLE IF EXISTS public.studio_coloring_preset;
```

**코드 제거 대상**:

| 파일                                                         | 제거 내용                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| `app/features/studio/studio-schema.ts`                       | `coloringPresets`, `coloringSettings` 테이블 + relations 정의 |
| `app/common/data/studio.data.server.ts`                      | `getColorPresets()` 함수, `ColorPreset` import                |
| `app/common/types/studio.types.ts`                           | `ColorPreset` 타입                                            |
| `app/features/studio/pages/studio-coloring-page.tsx`         | 파일 삭제                                                     |
| `app/features/studio/components/studio-project-selector.tsx` | Coloring 관련 Quick Access 항목 제거                          |
| `app/routes.ts`                                              | Coloring 라우트 제거                                          |

### 5.7 Phase 2+ 테이블 유지/제거 판단

| 테이블                              | 판단     | 이유                                              |
| ----------------------------------- | -------- | ------------------------------------------------- |
| `studio_b_roll`                     | **유지** | Phase 1.5에서 구현 예정 (keywords 기반 자동 매칭) |
| `studio_rough_cut_timeline`         | **유지** | Phase 2에서 구현 예정                             |
| `studio_rough_cut_timeline_segment` | **유지** | Phase 2에서 구현 예정                             |
| `studio_rough_cut_version`          | **유지** | Phase 2에서 구현 예정                             |
| `studio_subtitle`                   | **유지** | Phase 1.5에서 구현 예정                           |
| `studio_seo`                        | **유지** | Phase 1.5에서 구현 예정                           |
| `studio_export_history`             | **유지** | Phase 2에서 구현 예정                             |
| `studio_coloring_preset`            | **제거** | FFmpeg 컬러 그레이딩 비현실적                     |
| `studio_coloring_setting`           | **제거** | FFmpeg 컬러 그레이딩 비현실적                     |
| `studio_thumbnail`                  | **유지** | Phase 2에서 구현 예정                             |
| `studio_thumbnail_candidate`        | **유지** | Phase 2에서 구현 예정                             |
| `studio_thumbnail_overlay`          | **유지** | Phase 2에서 구현 예정                             |

### 5.8 미디어 에셋 테이블 명명 규칙 통일

#### 현재 문제

Studio와 TrendTube가 미디어 메타데이터를 **서로 다른 패턴**으로 저장:

| 패턴      | 테이블              | 메타데이터 저장                                        | media_asset 연결              |
| --------- | ------------------- | ------------------------------------------------------ | ----------------------------- |
| Studio    | `studio_video`      | 컬럼: `duration`, `status`                             | FK `videoAssetId`             |
| Studio    | `studio_video_part` | 컬럼: `partNumber`, `startTime`, `endTime`, `duration` | FK `videoAssetId`             |
| TrendTube | `trendtube_media`   | JSONB: `{ duration, prompt, genre }`                   | FK `mediaAssetId` (항상 NULL) |

**차이점**: Studio는 용도별 테이블 (studio_video, studio_video_part) + 정형 컬럼. TrendTube는 단일 테이블 (trendtube_media) + 비정형 JSONB.

#### 통일 전략: `media_asset` 중심 + 용도별 연결 테이블

**원칙**:

1. **`media_asset`이 모든 미디어의 기술 메타데이터 저장** (width, height, duration, fileSize, mimeType, storageKey, publicUrl)
2. **용도별 테이블은 해당 용도의 컨텍스트만 저장** + `media_asset` FK로 기술 메타데이터 참조
3. **JSONB metadata 제거**: duration, prompt 등 자주 조회하는 값은 정형 컬럼으로 승격
4. **naming convention**: `{feature}_{entity}` 패턴 일관 적용

**변경 계획**:

| 현재                               | 변경 후                                                                 | 비고                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `trendtube_media.metadata` (JSONB) | `trendtube_media.prompt` (text), `trendtube_media.clipNumber` (integer) | JSONB → 정형 컬럼 승격                                               |
| `trendtube_media.publicUrl`        | Phase 0B: Storage URL 저장 (과도기 유지) → Phase 1H: 제거               | Phase 0B에서 media_asset FK 연결 후 Phase 1H에서 publicUrl 컬럼 제거 |
| `studio_video.duration`            | 유지 (합산 duration, media_asset.duration과 별도 용도)                  | media_asset.duration = 개별 클립, studio_video.duration = 전체 Scene |
| `studio_video_part`                | 유지 (8초 클립 단위 저장)                                               | `videoAssetId → media_asset` FK 활용                                 |

**`trendtube_media` 스키마 변경**:

```sql
ALTER TABLE public.trendtube_media
  ADD COLUMN prompt TEXT,
  ADD COLUMN clip_number INTEGER DEFAULT 1,
  ALTER COLUMN media_asset_id SET NOT NULL;  -- Phase 0B 완료 후 필수화

-- metadata JSONB에서 자주 쓰는 값을 컬럼으로 마이그레이션 후
-- 추후 metadata 컬럼은 제거 가능 (또는 비정형 확장 데이터용으로 유지)
```

### 5.9 전체 스키마 관계도 (목표)

```text
project
 ├── studio_session (1:N) ← 신규: TrendTube 패턴 통합
 │    ├── studio_script (1:1)
 │    │    ├── source_trendtube_session_id → trendtube_session (nullable FK)
 │    │    └── studio_script_segment (1:N)
 │    │         ├── [기존] type, content, estimatedDuration
 │    │         └── [신규] visualNotes, emotionalTone, keywords, sceneHints
 │    │
 │    ├── studio_storyboard (1:N)
 │    │    ├── [기존] description, visualPrompt, duration, imageAssetId → media_asset
 │    │    ├── [신규] emotionalTone, cameraAngle
 │    │    └── studio_video (1:1)
 │    │         ├── duration (전체 Scene 합산)
 │    │         └── studio_video_part (1:N) ← 8초 클립 단위
 │    │              └── videoAssetId → media_asset (클립별 에셋)
 │    │
 │    └── (Phase 2+)
 │         ├── studio_b_roll (1:N) → media_asset
 │         └── studio_rough_cut_timeline (1:1)
 │              └── studio_rough_cut_timeline_segment (1:N)
 │
 ├── trendtube_session (1:N) ← 기존 패턴 유지
 │    ├── trendtube_result (1:1)
 │    └── trendtube_media (1:N)
 │         ├── mediaAssetId → media_asset (필수 FK)
 │         ├── clipNumber (8초 클립 순서)
 │         └── prompt (생성 프롬프트)
 │
 ├── studio_subtitle (1:N)
 ├── studio_seo (1:1)
 ├── studio_rough_cut_version (1:N) → media_asset
 ├── studio_export_history (1:N) → media_asset
 ├── studio_thumbnail (1:1)
 │    ├── studio_thumbnail_candidate (1:N) → media_asset
 │    └── studio_thumbnail_overlay (1:N)
 │
 └── media_asset (1:N) [통합 미디어 자산 저장소]
      ├── storageKey, publicUrl (Storage 위치)
      ├── width, height, duration, fileSize, mimeType (기술 메타데이터)
      └── type: "image" | "video" | "audio" (미디어 유형)
```

---

## 6. 단계별 데이터 플로우 최적화

### 6.1 Step 1: Script 생성 최적화

**목표**: AI 생성 데이터 100% DB 저장 → 후속 단계에서 재사용

#### (A) `SaveScriptInput` 타입 확장

파일: `app/common/data/studio.data.server.ts`

```typescript
export interface SaveScriptInput {
  projectId: string;
  prompt?: string | null;
  targetDuration?: number | null;
  sourceTrendtubeSessionId?: string | null; // 신규: TrendTube 연결
  segments: Array<{
    id?: string;
    type: "hook" | "intro" | "body" | "cta" | "outro";
    content: string;
    estimatedDuration?: number;
    // 신규 필드
    visualNotes?: string;
    emotionalTone?: string;
    keywords?: string[];
    sceneHints?: SceneHint[];
  }>;
}
```

#### (B) `saveScript` 함수에서 전체 필드 저장

```typescript
await db.insert(schema.scriptSegments).values(
  segments.map((seg, index) => ({
    scriptId: script.id,
    orderIndex: index,
    type: seg.type,
    content: seg.content,
    estimatedDuration:
      seg.estimatedDuration ?? Math.ceil(seg.content.length / 15),
    // 신규 필드 저장
    visualNotes: seg.visualNotes ?? null,
    emotionalTone: seg.emotionalTone ?? null,
    keywords: seg.keywords ?? null,
    sceneHints: seg.sceneHints ?? null,
  })),
);
```

#### (C) `generate-script-stream.ts`에서 전체 메타데이터 전달

```typescript
// app/features/studio/api/generate-script-stream.ts (변경 후)
await saveScript({
  projectId,
  prompt: options.customPrompt,
  segments: allSegments.map((seg) => ({
    type: seg.type,
    content: seg.content,
    estimatedDuration: seg.duration,
    visualNotes: seg.visualNotes, // 신규
    emotionalTone: seg.emotionalTone, // 신규
    keywords: seg.keywords, // 신규
    sceneHints: seg.sceneHints, // 신규
  })),
});
```

#### (D) `getScriptWithSegments`에서 전체 메타데이터 반환

```typescript
segments: script.segments.map((seg) => ({
  id: seg.id,
  type: seg.type as ScriptSegment["type"],
  content: seg.content,
  duration: seg.estimatedDuration ?? 0,
  // 신규 필드 반환 (Step 2에서 사용)
  visualNotes: seg.visualNotes ?? undefined,
  emotionalTone: seg.emotionalTone ?? undefined,
  keywords: seg.keywords ?? undefined,
  sceneHints: seg.sceneHints as SceneHint[] ?? undefined,
})),
```

### 6.2 Step 2: Storyboard + Scene 이미지 생성 최적화

**목표**: Script 메타데이터를 AI 프롬프트에 포함 + 텍스트 생성 후 Scene별 순차 이미지 생성

#### (A) `buildStoryboardPrompt`에서 메타데이터 + duration 포함

파일: `app/lib/ai-storyboard.server.ts`

```typescript
const segmentsList = scriptSegments
  .map((seg, i) => {
    const preview =
      seg.content.length > 300
        ? seg.content.slice(0, 300) + "..."
        : seg.content;

    let entry = `${i + 1}. [ID: ${seg.id}] [Type: ${seg.type}] [Duration: ${seg.duration}s] ${preview}`;

    if (seg.visualNotes) {
      entry += `\n   Visual Notes: ${seg.visualNotes}`;
    }
    if (seg.emotionalTone) {
      entry += `\n   Emotional Tone: ${seg.emotionalTone}`;
    }
    if (seg.sceneHints && seg.sceneHints.length > 0) {
      entry += `\n   Scene Hints:`;
      seg.sceneHints.forEach((hint, j) => {
        entry += `\n     ${j + 1}) ${hint.description} (${hint.duration}s)`;
        if (hint.visualPrompt) entry += ` - ${hint.visualPrompt}`;
        if (hint.cameraAngle) entry += ` [Camera: ${hint.cameraAngle}]`;
      });
    }
    // keywords는 Step 4 (B-Roll)에서 사용, Storyboard AI 프롬프트에 불필요 → 미포함

    return entry;
  })
  .join("\n\n");
```

#### (B) `ai-image.server.ts`에 `referenceImage` 지원 추가

```typescript
export interface ImageGenerationOptions {
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "2.35:1";
  style?: string;
  negativePrompt?: string;
  referenceImage?: Buffer; // 신규: 이전 Scene 이미지 참조
}

export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {},
): Promise<GeneratedImage> {
  // ...
  const parts: Part[] = [{ text: `Create an image: ${enhancedPrompt}...` }];

  // 참조 이미지가 있으면 multimodal 입력으로 추가
  if (options.referenceImage) {
    parts.unshift({
      inlineData: {
        data: options.referenceImage.toString("base64"),
        mimeType: "image/png",
      },
    });
    parts[1] = {
      text: `Based on the reference image above, create a NEW scene: ${enhancedPrompt}. Maintain visual consistency (character appearance, color palette, art style) with the reference while depicting the new scene described.`,
    };
  }
  // ...
}
```

#### (C) `generate-storyboard-stream.ts`에서 텍스트 후 순차 이미지 생성

```typescript
// 텍스트 스토리보드 생성 완료 후...

// DB에 텍스트 데이터 저장
await saveStoryboard({ projectId, scenes: allScenes.map(...) });

// Scene별 순차 이미지 생성
let previousImageBuffer: Buffer | undefined;

for (const scene of allScenes) {
  // 진행 상황 SSE 전송
  controller.enqueue(
    encoder.encode(`data: ${JSON.stringify({
      type: "image_progress",
      sceneNumber: scene.sceneNumber,
    })}\n\n`)
  );

  // 이미지 생성 (이전 Scene 이미지를 참조로 전달)
  const image = await generateImage(scene.visualPrompt, {
    aspectRatio: options.aspectRatio,
    style: options.style,
    referenceImage: previousImageBuffer,
  });

  // Storage 업로드 + media_asset + storyboard.imageAssetId 연결
  const { publicUrl } = await uploadStudioImage(
    projectId,
    sessionId,
    scene.sceneNumber,
    image.buffer,
    image.mimeType,
  );

  const assetId = await createMediaAsset({ ... });
  await linkImageToStoryboard(scene.dbId, assetId);

  // 다음 Scene 참조를 위해 현재 이미지 Buffer 저장
  previousImageBuffer = image.buffer;

  // 완료 SSE 전송
  controller.enqueue(
    encoder.encode(`data: ${JSON.stringify({
      type: "image",
      sceneNumber: scene.sceneNumber,
      imageUrl: publicUrl,
    })}\n\n`)
  );
}
```

#### (D) `SaveStoryboardInput` 확장

```typescript
export interface SaveStoryboardInput {
  projectId: string;
  scenes: Array<{
    scriptSegmentId: string;
    sceneNumber: number;
    orderIndex: number;
    description: string;
    visualPrompt: string;
    duration: number;
    emotionalTone?: string; // 신규: Script에서 전달된 감정 톤
    cameraAngle?: string; // 신규: AI 또는 sceneHints에서 결정된 카메라 앵글
  }>;
}
```

### 6.3 Step 3: Scene Video 순차 생성 (모킹 제거)

**목표**: Veo 3 연결, Scene별 순차 비디오 생성 (이미지 + 이전 비디오 참조 체이닝)

#### (A) `ai-video.server.ts` 확장

```typescript
export interface VideoGenerationOptions {
  durationSeconds?: number;
  aspectRatio?: string;
  referenceImage?: Buffer; // 신규: Step 2의 storyboard 이미지
  referenceVideo?: Buffer; // 신규: 이전 Scene의 비디오
}

export interface VideoGenerationResult {
  buffer: Buffer; // 변경: base64 data URL → Buffer 반환
  duration: number;
  prompt: string;
  mimeType: string;
}

export async function generateVideo(
  prompt: string, // 변경: visualPrompt 직접 전달 (내부 프롬프트 재생성 불필요)
  options?: VideoGenerationOptions,
): Promise<VideoGenerationResult> {
  // Veo 3 API 호출 시 image parameter 추가 (image-to-video)
  const generateParams: any = {
    model: "veo-3.1-generate-preview",
    prompt,
    config: {
      aspectRatio: options?.aspectRatio ?? "16:9",
      numberOfVideos: 1,
    },
  };

  // referenceImage가 있으면 image-to-video 모드
  if (options?.referenceImage) {
    generateParams.image = {
      imageBytes: options.referenceImage.toString("base64"),
      mimeType: "image/png",
    };
  }

  // ... polling, download, Buffer 반환
  const buffer = Buffer.from(arrayBuffer);
  return { buffer, duration: targetDuration, prompt, mimeType: "video/mp4" };
}
```

> **TrendTube 호환**: 시그니처가 `generateVideo(prompt, options)` → `generateVideo(prompt, options)`로 유지됨.
> 기존 TrendTube 호출부(`trendtube-step-media.ts`)는 `generateVideo(videoIdeas, { durationSeconds: 8 })`로 호출하므로
> referenceImage/referenceVideo 없이 기존과 동일하게 동작. 단, 반환값이 `{ url }` → `{ buffer }`로 변경되므로
> Phase 0B에서 TrendTube 호출부도 함께 수정 필요 (`result.url` → `result.buffer` + Storage 업로드).

#### (B) Scene Video 순차 생성 API

파일: `app/features/studio/api/generate-scene-video-stream.ts` (신규)

```typescript
// POST /api/studio/generate-scene-video-stream
// Input: { projectId: string, sessionId: string, options?: { aspectRatio?: string } }
// Process:
//   1. 세션의 모든 storyboard Scene 조회 (sceneNumber 순)
//   2. Scene별 순차 비디오 생성 (SSE 스트리밍)
//      for each scene (순서대로):
//        a. storyboard.imageAssetId → media_asset.publicUrl → fetch → imageBuffer
//        b. clipCount = Math.ceil(scene.duration / 8)  ← 8초 단위 클립 수 계산
//        c. for clipIndex in 0..clipCount-1:
//             - clipPrompt = splitVisualPrompt(scene.visualPrompt, clipIndex, clipCount)
//             - generateVideo(clipPrompt, {
//                 durationSeconds: 8,
//                 referenceImage: imageBuffer,
//                 referenceVideo: previousVeoResponse (있으면)
//               })
//             - Buffer → Storage 업로드 → media_asset
//             - studio_video_part 레코드 생성 (partNumber, startTime, endTime)
//             - SSE: { type: "video_clip", sceneNumber, clipNumber: clipIndex+1 }
//             - previousVeoResponse = currentVeoResponse
//        d. studio_video 레코드 생성/업데이트 (총 duration, status)
//        e. SSE: { type: "scene_complete", sceneNumber }
//   3. SSE: { type: "complete" }
// Output: SSE stream
```

> **클립 분할 참고**:
> Scene duration이 8초 이하이면 1클립만 생성.
> `splitVisualPrompt()`는 원본 visualPrompt를 시간 순서에 맞게 분할하여 각 클립에 적합한 프롬프트를 생성.
> 클립 간 참조 체이닝으로 시각적 연속성을 유지하므로, 프롬프트 분할이 완벽하지 않아도 일관성 있는 영상 생성 가능.

#### (C) 데이터 레이어 함수 추가

파일: `app/common/data/studio.data.server.ts`

```typescript
export async function createSceneVideo(data: {
  storyboardId: string;
  projectId: string;
  videoAssetId: string;
  duration: number;
  status: "pending" | "generating" | "completed" | "failed";
}): Promise<string>;

export async function updateSceneVideoStatus(
  storyboardId: string,
  status: string,
  videoAssetId?: string,
): Promise<void>;
```

#### (D) `studio-scene-page.tsx` 모킹 제거

- `setTimeout` 기반 모킹 → `/api/studio/generate-scene-video-stream` SSE 호출
- Scene별 진행 상태 실시간 표시 (SSE 이벤트 수신)
- 완료 시 DB의 `videoAssetId` → `media_asset.publicUrl`로 비디오 재생

### 6.4 Step 4: B-Roll 매칭 개선

**목표**: Script의 `keywords[]`를 직접 B-Roll 검색 키워드로 활용 (AI 추가 호출 없음)

```typescript
export async function getBRollScenes(
  projectId: string,
): Promise<BRollSceneContext[]> {
  // 1. Script segments with keywords 조회
  // 2. Storyboard scenes 조회
  // 3. Step 1의 keywords를 직접 사용 (AI 호출 없음)
  return storyboardList.map((sb, idx) => {
    const segment = script?.segments.find((s) => s.id === sb.scriptSegmentId);
    const keyword =
      segment?.keywords?.[0] ||
      (sb.description ?? "").split(" ").slice(0, 2).join(" ");
    return {
      id: sb.id,
      order: idx + 1,
      content: sb.description ?? "",
      keyword,
      assignedVideo: undefined,
    };
  });
}
```

### 6.5 Step 5: Rough Cut (Phase 2 설계)

**자동 배치 로직 (Phase 2)**:

```
1. studio_video를 sceneNumber 순으로 정렬
2. 각 video를 timeline_segment로 변환 (type: "video", startTime: 누적 duration)
3. B-Roll이 있으면 해당 구간에 겹쳐 배치
4. TrendTube background_music이 있으면 audio 트랙으로 추가
5. 자동 배치 결과를 studio_rough_cut_timeline에 저장
```

---

## 7. TrendTube 고도화

### 7.1 Phase A: 미디어 영구 저장 (Supabase Storage 전환)

#### A-1. AI 서비스 반환값 변경: base64 data URL → Buffer

| 파일                               | 현재 반환값                            | 변경 후 반환값                              |
| ---------------------------------- | -------------------------------------- | ------------------------------------------- |
| `app/lib/ai-video.server.ts`       | `{ url: "data:video/mp4;base64,..." }` | `{ buffer: Buffer, mimeType: "video/mp4" }` |
| `app/lib/ai-music.server.ts`       | `{ url: "data:audio/wav;base64,..." }` | `{ buffer: Buffer, mimeType: "audio/wav" }` |
| `app/lib/tts.server.ts`            | `{ audioBase64: "...", mimeType }`     | `{ buffer: Buffer, mimeType: "audio/mp3" }` |
| `app/lib/video-composer.server.ts` | base64 data URL                        | `{ buffer: Buffer, mimeType: "video/mp4" }` |

**`ai-video.server.ts` 변경 예시**:

```typescript
// 현재 (ai-video.server.ts:111-119)
const arrayBuffer = await downloadRes.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);
const contentType = downloadRes.headers.get("content-type") || "video/mp4";
const dataUrl = `data:${contentType};base64,${buffer.toString("base64")}`; // ❌ 불필요한 base64 변환
return { url: dataUrl, duration: targetDuration, prompt: videoPrompt };

// 변경 후
const arrayBuffer = await downloadRes.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);
const mimeType = downloadRes.headers.get("content-type") || "video/mp4";
return { buffer, mimeType, duration: targetDuration, prompt: videoPrompt }; // ✅ Buffer 직접 반환
```

#### A-2. 목표 데이터 흐름 (TrendTube 비디오)

```text
Veo 3 API → video.uri → fetch → arrayBuffer
  ↓ Buffer.from(arrayBuffer)                        ← Buffer 생성 (현재와 동일)
  ↓ return { buffer, mimeType, ... }                ← Buffer 직접 반환 ✅
  ↓
uploadTrendTubeMedia(projectId, sessionId, "video", buffer, mimeType)
  ↓ supabase.storage.upload(storageKey, buffer)     ← 바이너리로 Storage 업로드 ✅
  ↓ 경로: projects/{projectId}/trendtube/{sessionId}/video_{ts}.mp4
  ↓
createMediaAsset({ storageKey, publicUrl, ... })    ← media_asset 레코드 생성 ✅
  ↓
saveTrendTubeMedia({ publicUrl, mediaAssetId })     ← Storage URL + 에셋 연결 ✅
  ↓
trendtube_media.public_url = "https://xxx.supabase.co/storage/.../video_123.mp4"
trendtube_media.media_asset_id = "uuid"             ← 짧은 URL + FK 연결 ✅
```

#### A-3. Storage 업로드 유틸리티

`uploadTrendTubeMedia()` 함수 추가 (위 4.4절 참조)

#### A-4. Step API에서 Storage 업로드

| 파일                                                | 변경 내용                                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `app/features/studio/api/trendtube-step-media.ts`   | `result.url` → `result.buffer` + `uploadTrendTubeMedia()` → Storage publicUrl 저장 |
| `app/features/studio/api/trendtube-step-compose.ts` | 합성 영상 Buffer → `uploadTrendTubeMedia()` → Storage publicUrl 저장               |

**`trendtube-step-media.ts` 변경 예시**:

```typescript
// 현재 (trendtube-step-media.ts:93-106)
const result = await generateVideo(videoIdeas, { durationSeconds: 8 });
if (result.url) {
  await saveTrendTubeMedia({
    sessionId: session.id,
    mediaType: "generated_video",
    publicUrl: result.url, // ❌ "data:video/mp4;base64,..." (수 MB)
  });
}

// 변경 후
const result = await generateVideo(videoIdeas, { durationSeconds: 8 });
if (result.buffer) {
  const { storageKey, publicUrl } = await uploadTrendTubeMedia(
    projectId,
    session.id,
    "video",
    result.buffer,
    result.mimeType,
  );
  const assetId = await createMediaAsset({
    userId,
    projectId,
    type: "video",
    storageKey,
    publicUrl,
    fileSize: result.buffer.length,
    mimeType: result.mimeType,
  });
  await saveTrendTubeMedia({
    sessionId: session.id,
    mediaType: "generated_video",
    publicUrl, // ✅ Storage URL (~100B)
    mediaAssetId: assetId, // ✅ FK 연결
  });
}
```

#### A-5. media_asset 테이블 연결

- 위 A-4에서 `createMediaAsset()` → `saveTrendTubeMedia({ mediaAssetId })` 순서로 연결
- `trendtube_media.mediaAssetId`가 실제 FK로 활용됨
- 프로젝트 단위 미디어 자산 관리 가능 (Studio와 동일 패턴)

#### A-6. TrendTube 8초 단위 단계적 비디오 생성

**현재**: 나레이션 스크립트를 8초에 맞춰 강제 절단 → 1개 영상만 생성.

**변경**: 나레이션 스크립트 전체 길이에 맞춰 8초 단위 클립을 **순차적으로** 생성.

```text
나레이션 스크립트 (30초 분량)
  ↓ 8초 단위로 분할 → 4개 세그먼트 (8초 + 8초 + 8초 + 6초)
  │
  ├── Clip 1: generateVideo(segment₁_prompt, { durationSeconds: 8 })
  │    └── buffer₁ → Storage 업로드 → trendtube_media (clipNumber: 1)
  │         └── SSE: { type: "video_clip", clipNumber: 1 }
  │
  ├── Clip 2: generateVideo(segment₂_prompt, {
  │      durationSeconds: 8,
  │      referenceVideo: veoClip₁  ← 이전 클립 참조
  │    })
  │    └── buffer₂ → Storage 업로드 → trendtube_media (clipNumber: 2)
  │         └── SSE: { type: "video_clip", clipNumber: 2 }
  │
  ├── Clip 3~N: 동일 패턴 (이전 클립 참조 체이닝)
  │
  └── 합성: composeVideo([clip₁, clip₂, ..., clipₙ], music, voiceover)
       └── 최종 합성 영상 → Storage 업로드 → trendtube_media (composited)
```

**나레이션 스크립트 분할 로직**:

```typescript
// ai-trendtube.server.ts에 추가
function splitNarrationForClips(
  narrationScript: string,
  secondsPerClip: number = 8,
): string[] {
  // 한국어 기준: ~5자/초, 8초 = ~40자
  // 문장 경계에서 분할 (마침표, 물음표, 느낌표)
  // 각 세그먼트에 대해 별도 videoPrompt 생성
}
```

**음악/보이스오버 연동**:

- 음악: 클립 수 × 8초 길이로 생성 (예: 4클립 → 32초 음악)
- 보이스오버: 각 클립의 나레이션 세그먼트에 맞춰 개별 생성 → 합성 시 이어붙이기
- 합성: 모든 클립 + 전체 음악 + 이어붙인 보이스오버 → FFmpeg 합성

### 7.2 Phase B: 프로젝트 ID 기반 결과 재접근

#### B-1. 데이터 레이어 함수 추가

파일: `app/common/data/trendtube.data.server.ts`

```typescript
export async function getLatestCompletedSessionForUser(
  projectId: string,
  userId: string,
);

export async function getCompletedSessionsForUser(
  projectId: string,
  userId: string,
): Promise<Array<{ id: string; createdAt: Date; completedAt: Date | null }>>;
```

#### B-2. Loader 수정 — 자동 세션 로딩

파일: `app/features/studio/pages/studio-dashboard-page.tsx`

```
?session=<id> 있음 → 해당 세션 결과 로드 (기존 유지)
?session 없음     → getLatestCompletedSessionForUser() 호출
                   → 완료 세션 있으면 결과 + sessionId 반환
                   → 없으면 null → 입력 폼 표시
```

#### B-3. 세션 이력 UI

- 완료 세션이 2개 이상이면 Shadcn `Select`로 세션 전환 UI 표시
- 세션 전환 시 `?session=<선택된 id>`로 navigate

### 7.3 TrendTube → Studio 연결

#### "스크립트로 가져오기" 기능

파일: `app/features/studio/api/import-trendtube-script.ts` (신규)

```typescript
// POST /api/studio/import-trendtube-script
// Input: { projectId: string, sessionId: string }
// Process:
//   1. trendtube_result에서 narrationScript 조회
//   2. Gemini (gemini-2.5-flash-lite)로 세그먼트 분류 + 메타데이터 생성 (1회 호출)
//   3. saveScript({ projectId, sourceTrendtubeSessionId: sessionId, segments: parsedSegments })
// Output: { success: true, scriptId }
```

#### TrendTube 미디어를 Studio에서 조회

```typescript
export async function getTrendTubeMediaAssets(projectId: string): Promise<{
  videos: Array<{ id: string; publicUrl: string; duration?: number }>;
  audio: Array<{
    id: string;
    publicUrl: string;
    type: string;
    duration?: number;
  }>;
}>;
```

#### Studio 각 페이지에서 TrendTube 에셋 연결

| Studio 페이지 | TrendTube 연결                  | UI 변경                            |
| ------------- | ------------------------------- | ---------------------------------- |
| Script        | `narrationScript`               | "TrendTube 스크립트 가져오기" 버튼 |
| Scene         | `generated_video`               | "기존 미디어 사용" 옵션            |
| B-Roll        | TrendTube 미디어 전체           | B-Roll 에셋 후보 목록에 추가       |
| Rough Cut     | `background_music`, `voiceover` | 오디오 트랙 옵션 (Phase 2)         |

---

## 8. 구현 Phase 계획

### Phase 0A: Studio 세션 기반 관리 도입 (우선순위: 최고 — 구조적 선행 조건)

**목표**: Studio에 세션 개념 도입하여 TrendTube와 일관된 생성/관리 패턴 확립

| #   | 작업                                                                      | 파일                                                |
| --- | ------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | 마이그레이션 SQL: `studio_session` 테이블 생성 + partial unique index     | `app/drizzle/migrations/XXXX_studio_session.sql`    |
| 2   | Drizzle 스키마: `studioSessions` 테이블 + relations 추가                  | `app/features/studio/studio-schema.ts`              |
| 3   | 마이그레이션 SQL: `studio_script` unique 제거 + `session_id` FK 추가      | `app/drizzle/migrations/XXXX_studio_session.sql`    |
| 4   | 마이그레이션 SQL: `studio_storyboard`, `studio_video`에 `session_id` 추가 | `app/drizzle/migrations/XXXX_studio_session.sql`    |
| 5   | `saveScript()` 세션 기반으로 변경 (기존 archived → 새 세션 생성)          | `app/common/data/studio.data.server.ts`             |
| 6   | `saveStoryboard()` 세션 기반으로 변경                                     | `app/common/data/studio.data.server.ts`             |
| 7   | `getActiveSession()`, `archiveSession()` 함수 추가                        | `app/common/data/studio.data.server.ts`             |
| 8   | 기존 Script/Storyboard 조회 함수에 sessionId 필터 추가                    | `app/common/data/studio.data.server.ts`             |
| 9   | `generate-script-stream.ts`에서 세션 생성 로직 적용                       | `app/features/studio/api/generate-script-stream.ts` |
| 10  | `studio-scene-page.tsx` Loader에서 sessionId 기반 데이터 로딩 추가        | `app/features/studio/pages/studio-scene-page.tsx`   |
| 11  | 마이그레이션 실행                                                         | `npm run db:migrate`                                |

**검증 체크리스트**:

```bash
# 1. 타입 & 린트
npm run typecheck && npm run lint

# 2. 마이그레이션 적용
npm run db:migrate

# 3. studio_session 테이블 생성 확인
# Supabase Dashboard > Table Editor > studio_session 존재 확인

# 4. Script 생성 → 새 studio_session 레코드 생성 확인
# studio_session.status = 'active', version = 1

# 5. Script 재생성 → 기존 세션 archived + 새 세션 생성 확인
# 기존 세션: status = 'archived' / 새 세션: status = 'active', version = 2

# 6. 이전 세션의 Script/Storyboard 데이터 보존 확인
```

### Phase 0B: Supabase Storage 통합 (우선순위: 최고 — 공유 인프라)

**목표**: Studio + TrendTube 모든 미디어의 통합 저장 경로 구축 (세션 기반 경로)

| #   | 작업                                                          | 파일                                                   |
| --- | ------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | 기존 `uploadStoryboardImage()` 제거 (기존 데이터 없음)        | `app/lib/supabase-storage.server.ts`                   |
| 2   | `uploadProjectMedia()` 통합 업로드 함수 추가 (sessionId 필수) | `app/lib/supabase-storage.server.ts`                   |
| 3   | `uploadStudioImage()`, `uploadStudioVideo()` 편의 함수 추가   | `app/lib/supabase-storage.server.ts`                   |
| 4   | `uploadTrendTubeMedia()` 편의 함수 추가                       | `app/lib/supabase-storage.server.ts`                   |
| 5   | AI 서비스 반환값 Buffer로 변경 (base64 data URL → Buffer)     | `app/lib/ai-video.server.ts` 외 3개                    |
| 6   | TrendTube Step API에서 Storage 업로드 적용                    | `trendtube-step-media.ts`, `trendtube-step-compose.ts` |
| 7   | `trendtube_media.mediaAssetId` 연결                           | `app/common/data/trendtube.data.server.ts`             |
| 8   | `generate-scene-image.ts`에서 `uploadStudioImage()` 사용      | `app/features/studio/api/generate-scene-image.ts`      |

**검증 체크리스트**:

```bash
# 1. 타입 & 린트
npm run typecheck && npm run lint

# 2. TrendTube 파이프라인 실행
# Supabase Dashboard > Storage > media/projects/{projectId}/trendtube/{sessionId}/ 확인

# 3. 저장된 publicUrl로 미디어 재생 확인 (base64가 아닌 Storage URL)

# 4. trendtube_media.mediaAssetId 값 확인

# 5. Studio Scene 이미지 생성 → Storage 경로 확인
# media/projects/{projectId}/studio/{sessionId}/storyboard/scene-1_{ts}.png
```

### Phase 1A: Script 메타데이터 DB 저장 (우선순위: 최고)

**목표**: AI 생성 데이터 손실 해결

| #   | 작업                                                      | 파일                                                |
| --- | --------------------------------------------------------- | --------------------------------------------------- |
| 1   | 마이그레이션 SQL: `studio_script_segment`에 4개 컬럼 추가 | `app/drizzle/migrations/XXXX_script_metadata.sql`   |
| 2   | Drizzle 스키마 업데이트                                   | `app/features/studio/studio-schema.ts`              |
| 3   | `SaveScriptInput` 타입 확장                               | `app/common/data/studio.data.server.ts`             |
| 4   | `saveScript` 함수 수정 (4개 필드 저장)                    | `app/common/data/studio.data.server.ts`             |
| 5   | `getScriptWithSegments` 함수 수정 (4개 필드 반환)         | `app/common/data/studio.data.server.ts`             |
| 6   | `generate-script-stream.ts`에서 전체 필드 전달            | `app/features/studio/api/generate-script-stream.ts` |
| 7   | 마이그레이션 실행                                         | `npm run db:migrate`                                |

**검증 체크리스트**:

```bash
# 1. 타입 & 린트
npm run typecheck && npm run lint

# 2. 마이그레이션 적용
npm run db:migrate

# 3. Script 생성 → DB 확인
# studio_script_segment에 visual_notes, emotional_tone, keywords, scene_hints 값 저장 확인

# 4. 페이지 새로고침 후 메타데이터 유지 확인
```

### Phase 1B: Storyboard 메타데이터 + 순차 이미지 생성 (우선순위: 최고)

**목표**: Step 1 메타데이터 활용 + Scene별 순차 이미지 생성 (참조 체이닝)

| #   | 작업                                                                           | 파일                                                       |
| --- | ------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| 1   | `buildStoryboardPrompt`에 duration + 메타데이터 포함                           | `app/lib/ai-storyboard.server.ts`                          |
| 2   | 마이그레이션 SQL: `studio_storyboard`에 `emotional_tone`, `camera_angle` 추가  | `app/drizzle/migrations/XXXX_storyboard_metadata.sql`      |
| 3   | Drizzle 스키마 업데이트                                                        | `app/features/studio/studio-schema.ts`                     |
| 4   | `SaveStoryboardInput` 타입 확장                                                | `app/common/data/studio.data.server.ts`                    |
| 5   | `saveStoryboard` 함수 수정                                                     | `app/common/data/studio.data.server.ts`                    |
| 6   | `ai-image.server.ts`에 `referenceImage` 옵션 추가                              | `app/lib/ai-image.server.ts`                               |
| 7   | `generate-storyboard-stream.ts`에서 텍스트 후 순차 이미지 생성 루프 추가       | `app/features/studio/api/generate-storyboard-stream.ts`    |
| 8   | `generate-scene-image.ts`에 `referenceImage` 전달 지원                         | `app/features/studio/api/generate-scene-image.ts`          |
| 9   | `StoryboardScene` 타입에 `emotionalTone`, `cameraAngle` 필드 추가              | `app/common/types/studio.types.ts`                         |
| 10  | `storyboard-scene-card.tsx`에 emotionalTone/cameraAngle 표시 UI 추가           | `app/features/studio/components/storyboard-scene-card.tsx` |
| 11  | `studio-storyboard-page.tsx`에 순차 이미지 생성 진행 표시 UI 추가 (SSE 핸들링) | `app/features/studio/pages/studio-storyboard-page.tsx`     |

**검증 체크리스트**:

```bash
# 1. 타입 & 린트
npm run typecheck && npm run lint

# 2. Storyboard AI 프롬프트 확인 (서버 로그)
# Duration, Visual Notes, Emotional Tone 포함 확인

# 3. Storyboard 생성 → Scene별 이미지 순차 생성 확인
# SSE 이벤트: { type: "image", sceneNumber: 1 } → { type: "image", sceneNumber: 2 } → ...

# 4. Supabase Storage: projects/{projectId}/studio/{sessionId}/storyboard/ 경로에 이미지 업로드 확인

# 5. studio_storyboard.imageAssetId 값 확인 (모든 Scene에 이미지 연결)

# 6. 시각적 일관성 확인: Scene 1~N 이미지가 일관된 스타일인지 육안 검증
```

### Phase 1C: Scene Video 순차 생성 + 8초 클립 분할 (우선순위: 높음)

**목표**: 모킹 제거, Veo 3 연결, Scene별 순차 비디오 생성 (8초 클립 단위 참조 체이닝)

| #   | 작업                                                                                              | 파일                                                     |
| --- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | `ai-video.server.ts`에 referenceImage, referenceVideo 옵션 추가 (Buffer 반환은 Phase 0B에서 완료) | `app/lib/ai-video.server.ts`                             |
| 2   | `splitVisualPrompt()` 클립 분할 프롬프트 생성 함수 추가                                           | `app/lib/ai-video.server.ts`                             |
| 3   | `uploadStudioVideo(projectId, sessionId, ...)` 활용                                               | `app/lib/supabase-storage.server.ts`                     |
| 4   | `generate-scene-video-stream.ts` 신규 API (8초 클립 순차 생성)                                    | `app/features/studio/api/generate-scene-video-stream.ts` |
| 5   | `createSceneVideo`, `createSceneVideoPart` 함수 추가                                              | `app/common/data/studio.data.server.ts`                  |
| 6   | `studio-scene-page.tsx`에서 모킹 제거, SSE API 호출 (클립별 진행 표시)                            | `app/features/studio/pages/studio-scene-page.tsx`        |
| 7   | `routes.ts`에 API 라우트 추가                                                                     | `app/routes.ts`                                          |

**검증 체크리스트**:

```bash
# 1. 타입 & 린트
npm run typecheck && npm run lint

# 2. Scene Video 순차 생성 확인
# SSE 이벤트: { type: "video", sceneNumber: 1 } → { type: "video", sceneNumber: 2 } → ...

# 3. Supabase Storage: projects/{projectId}/studio/{sessionId}/scene-video/ 경로에 비디오 업로드 확인

# 4. studio_video 레코드 + media_asset 레코드 확인

# 5. 비디오 재생 확인 (publicUrl)

# 6. 장면 간 시각적 연속성 확인: Scene 1→2→3 비디오가 자연스럽게 이어지는지 육안 검증
```

### Phase 1D: Enum 정리 + Coloring 제거 (우선순위: 중간)

**목표**: 데이터 일관성 확보 + 불필요 코드 제거

| #   | 작업                                                          | 파일                                                                       |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | `tone` → `contentTone` 데이터 마이그레이션 + `tone` 컬럼 DROP | `app/drizzle/migrations/XXXX_remove_tone.sql`                              |
| 2   | `project-schema.ts`에서 `tone` 필드 제거                      | `app/features/project/project-schema.ts`                                   |
| 3   | `enums.ts`에서 `projectToneEnum` 비활성화                     | `app/drizzle/enums.ts`                                                     |
| 4   | `project.tone` 참조하는 모든 코드 수정                        | `new-project-page.tsx`, `project.data.server.ts` 등                        |
| 5   | Coloring 테이블 DROP 마이그레이션                             | `app/drizzle/migrations/XXXX_remove_coloring.sql`                          |
| 6   | Coloring 관련 스키마/코드/페이지 제거                         | `studio-schema.ts`, `studio.data.server.ts`, `studio-coloring-page.tsx` 등 |
| 7   | `studio-sidebar.tsx`에서 "색보정" 메뉴 항목 제거              | `app/features/studio/components/studio-sidebar.tsx`                        |

**검증 체크리스트**:

```bash
# 1. 타입 & 린트
npm run typecheck && npm run lint

# 2. tone 컬럼 제거 확인
# 3. contentTone 마이그레이션 확인 (cinematic → dramatic)
# 4. Coloring 테이블 제거 확인
# 5. 코드 참조 검증
Grep "coloringPresets" app/   # 0개
Grep "ColorPreset" app/       # 0개
```

### Phase 1E: TrendTube + Studio 연결 (우선순위: 중간)

**목표**: TrendTube 결과를 Studio 워크플로에서 활용

| #   | 작업                                                               | 파일                                                    |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| 1   | 마이그레이션: `studio_script`에 `source_trendtube_session_id` 추가 | `app/drizzle/migrations/XXXX_script_trendtube_link.sql` |
| 2   | Drizzle 스키마 업데이트                                            | `app/features/studio/studio-schema.ts`                  |
| 3   | `import-trendtube-script.ts` API 작성                              | `app/features/studio/api/import-trendtube-script.ts`    |
| 4   | `getTrendTubeMediaAssets()` 함수 추가                              | `app/common/data/trendtube.data.server.ts`              |
| 5   | Script 페이지에 "TrendTube 가져오기" 버튼 추가                     | `app/features/studio/pages/studio-script-page.tsx`      |
| 6   | `routes.ts`에 import API 라우트 추가                               | `app/routes.ts`                                         |

**검증 체크리스트**:

```bash
# 1. 타입 & 린트
npm run typecheck && npm run lint

# 2. TrendTube 완료 세션 → Script 페이지 "가져오기" 버튼 표시 확인
# 3. "가져오기" → narrationScript가 세그먼트로 파싱·저장 확인
# 4. studio_script.source_trendtube_session_id 값 확인
```

### Phase 1F: TrendTube 결과 재접근 (우선순위: 중간)

**목표**: 프로젝트 ID만으로 TrendTube 결과 자동 로딩

| #   | 작업                                           | 파일                                                  |
| --- | ---------------------------------------------- | ----------------------------------------------------- |
| 1   | `getLatestCompletedSessionForUser()` 함수 추가 | `app/common/data/trendtube.data.server.ts`            |
| 2   | `getCompletedSessionsForUser()` 함수 추가      | `app/common/data/trendtube.data.server.ts`            |
| 3   | Loader 수정 — 자동 세션 로딩                   | `app/features/studio/pages/studio-dashboard-page.tsx` |
| 4   | 세션 전환 UI (Shadcn Select)                   | `app/features/studio/pages/studio-dashboard-page.tsx` |

**검증 체크리스트**:

```bash
# 1. /studio/dashboard/:projectId 접속 → 최신 완료 세션 결과 자동 표시
# 2. ?session=<id> 없이도 결과가 로드되는지 확인
# 3. 세션 이력에서 다른 세션 선택 → 해당 결과 전환 확인
# 4. 완료 세션 없는 프로젝트 → 입력 폼 표시 확인
```

### Phase 1G: TrendTube 8초 단계적 비디오 생성 (우선순위: 중간)

**목표**: TrendTube 나레이션 스크립트를 8초 단위로 분할하여 순차적 N클립 생성

| #   | 작업                                                                     | 파일                                                             |
| --- | ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| 1   | `splitNarrationForClips()` 나레이션 분할 함수 추가                       | `app/lib/ai-trendtube.server.ts`                                 |
| 2   | `trendtube-step-media.ts` 비디오 생성 루프 변경 (단일 → N클립 순차)      | `app/features/studio/api/trendtube-step-media.ts`                |
| 3   | `trendtube_media`에 `clipNumber` 컬럼 추가 마이그레이션                  | `app/drizzle/migrations/XXXX_trendtube_clips.sql`                |
| 4   | Drizzle 스키마 업데이트                                                  | `app/features/studio/studio-trendtube-schema.ts`                 |
| 5   | 음악/TTS 길이를 클립 수에 맞춰 조정                                      | `app/lib/ai-music.server.ts`, `app/lib/tts.server.ts`            |
| 6   | `video-composer.server.ts`에서 N클립 이어붙이기 + 합성                   | `app/lib/video-composer.server.ts`                               |
| 7   | TrendTube 결과 UI에서 클립별 재생 지원                                   | `app/features/studio/pages/studio-dashboard-page.tsx`            |
| 8   | `TrendTubeMediaStreamEvent`에 `video_clip` 이벤트 타입 추가              | `app/common/types/trendtube.types.ts`                            |
| 9   | `use-trendtube-pipeline.ts` 훅에 `video_clip` SSE 이벤트 핸들러 추가     | `app/features/studio/hooks/use-trendtube-pipeline.ts`            |
| 10  | `trendtube-results-display.tsx`에 클립별 재생 UI 추가                    | `app/features/studio/components/trendtube-results-display.tsx`   |
| 11  | `trendtube-pipeline-progress.tsx`에 N클립 진행 표시 UI 추가              | `app/features/studio/components/trendtube-pipeline-progress.tsx` |
| 12  | `video-composer.server.ts` FFmpeg N클립 concat 대응 (amix 하드코딩 해소) | `app/lib/video-composer.server.ts`                               |

**검증 체크리스트**:

```bash
# 1. 타입 & 린트
npm run typecheck && npm run lint

# 2. TrendTube 30초 나레이션 → 4개 클립 생성 확인 (8초 × 4)
# SSE 이벤트: video_clip 1 → video_clip 2 → ... → video_clip 4

# 3. Supabase Storage: projects/{projectId}/trendtube/{sessionId}/ 에 N개 비디오 파일 확인

# 4. trendtube_media 레코드에 clipNumber 값 확인 (1, 2, 3, 4)

# 5. 합성 영상이 모든 클립을 이어붙인 길이인지 확인

# 6. TrendTube 결과 UI에서 클립별 재생 가능 확인
```

### Phase 1H: AI 서비스 레이어 통합 + 미디어 테이블 정리 (우선순위: 중간)

**목표**: 모델 레지스트리 중앙화, retry 일괄 적용, 미디어 메타데이터 패턴 통일

| #   | 작업                                                                   | 파일                                                   |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | `ai-models.server.ts` 신규: 모델 레지스트리 상수 정의                  | `app/lib/ai-models.server.ts`                          |
| 2   | `gemini-client.server.ts` 확장: `getGenAIClient()` 추가                | `app/lib/gemini-client.server.ts`                      |
| 3   | 모든 ai-\_.server.ts에서 모델명 하드코딩 → `AI_MODELS.*` 참조로 변경   | `app/lib/ai-*.server.ts` 전체                          |
| 4   | `ai-video.server.ts`, `ai-music.server.ts`에 `withRetry()` 적용        | `app/lib/ai-video.server.ts`, `ai-music.server.ts`     |
| 5   | `tts.server.ts`에 `withRetry()` 적용                                   | `app/lib/tts.server.ts`                                |
| 6   | `trendtube_media`에 `prompt` 컬럼 추가, JSONB → 정형 컬럼 마이그레이션 | `app/drizzle/migrations/XXXX_trendtube_media.sql`      |
| 7   | `trendtube_media.mediaAssetId` NOT NULL 제약 추가 (Phase 0B 완료 전제) | `app/features/studio/studio-trendtube-schema.ts`       |
| 8   | `trendtube_media.publicUrl` 제거 (media_asset.publicUrl로 대체)        | `app/features/studio/studio-trendtube-schema.ts`       |
| 9   | `trendtube-step-compose.ts`에서 `media_asset.publicUrl` 조회로 변경    | `app/features/studio/api/trendtube-step-compose.ts`    |
| 10  | `trendtube-generate-stream.ts` 레거시 파일 삭제                        | `app/features/studio/api/trendtube-generate-stream.ts` |

**검증 체크리스트**:

```bash
# 1. 타입 & 린트
npm run typecheck && npm run lint

# 2. 모델 레지스트리 검증
Grep "veo-3.1-generate-preview" app/lib/   # ai-models.server.ts에만 존재
Grep "gemini-2.5-flash" app/lib/           # ai-models.server.ts에만 존재

# 3. retry 적용 확인: ai-video, ai-music, tts에서 withRetry() import 확인
Grep "withRetry" app/lib/ai-video.server.ts  # 존재
Grep "withRetry" app/lib/ai-music.server.ts  # 존재
Grep "withRetry" app/lib/tts.server.ts       # 존재

# 4. trendtube_media.media_asset_id NOT NULL 확인
# 5. trendtube_media.public_url 컬럼 제거 확인
# 6. trendtube_media.prompt 컬럼 존재 확인
```

### Phase 2 이후 (명시적 요청 시에만)

| Phase | 기능                | 설명                                                |
| ----- | ------------------- | --------------------------------------------------- |
| 2A    | Subtitles 자동 생성 | Script `content` → TTS → `studio_subtitle`          |
| 2B    | SEO 자동 생성       | Script `content` + `keywords` → `studio_seo`        |
| 2C    | B-Roll 자동 매칭 UI | `keywords` 기반 Pexels/Pixabay API 연동             |
| 2D    | Rough Cut 타임라인  | Scene Video + B-Roll → 자동 타임라인 배치 + 편집 UI |
| 2E    | Thumbnail AI 생성   | Storyboard 이미지 기반 + 텍스트 오버레이            |
| 2F    | Export 렌더링       | FFmpeg 서버사이드 → YouTube 업로드                  |

### 권장 실행 순서

```text
1. Phase 0A (Studio 세션 도입) ← 구조적 선행 조건, 최우선
   ↓
2. Phase 0B (Supabase Storage 통합) ← Phase 0A 완료 필요 (sessionId 경로)
   ↓
3. Phase 1A (Script 메타데이터) ← Phase 0A 완료 필요
   ↓
4. Phase 1B (Storyboard 메타데이터 + 순차 이미지 생성) ← Phase 0B, 1A 완료 필요
   ↓
5. Phase 1C (Scene Video 순차 생성 + 8초 클립) ← Phase 0B, 1B 완료 필요
   ↓
6. Phase 1D (Enum 정리 + Coloring 제거) ← 독립적, 언제든 가능
   ↓
7. Phase 1E (TrendTube + Studio 연결) ← Phase 1A 완료 필요
   ↓
8. Phase 1F (TrendTube 결과 재접근) ← Phase 0B 완료 필요
   ↓
9. Phase 1G (TrendTube 8초 단계적 생성) ← Phase 0B, 1C 완료 필요
   ↓
10. Phase 1H (AI 서비스 통합 + 미디어 테이블 정리) ← Phase 0B 완료 필요, 독립적
    ↓
11. Phase 2+ (명시적 요청 시)
```
