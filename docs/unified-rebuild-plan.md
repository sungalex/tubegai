# TubeGAI 전면 재구축 통합 실행 계획서

> **목적**: 5개 개별 계획서를 하나의 실행 로드맵으로 통합한다. 기술 부채의 근본 원인을 진단하고, 목표 아키텍처를 정의하며, 17개 Phase를 6개 실행 배치로 구조화하여 순차 실행할 수 있는 단일 참조 문서를 제공한다.
>
> **통합 원본 문서**:
>
> | 문서                                                                         | 범위                                           | 약어   |
> | ---------------------------------------------------------------------------- | ---------------------------------------------- | ------ |
> | [Studio + TrendTube 통합 고도화 계획서](studio-enhancement-plan.md)          | Studio/TrendTube Pipeline 고도화, DB 재설계    | **SE** |
> | [Project-Studio AI 중복 최소화 전략](project-studio-ai-optimization-plan.md) | AI 중복 제거, 역할 재정의, Pre-Production 도입 | **AO** |
> | [프로젝트 구조 리팩토링 계획](project-structure-refactoring-plan.md)         | 코드 구조 정리, Dead Code, 일관성 개선         | **SR** |
> | [DB 스키마 재구축 전략서](db-schema-rebuild-strategy.md)                     | 테이블 전수 분석, Clean Rebuild 절차           | **DB** |
> | [To-Do](To-Do.md)                                                            | 전체 할 일 목록                                | **TD** |
>
> **작성일**: 2026-02-16

---

## 1. 전략적 개요

### 1.1 재구축 배경 및 동기

TubeGAI는 MVP 개발 과정에서 "빠른 기능 구현" 우선 전략을 취했다. 그 결과 **핵심 파이프라인은 동작하지만, 확장성과 데이터 무결성에 구조적 한계**가 누적되었다. 현재 상태에서 기능을 추가하면 기술 부채가 가속되므로, 이 시점에서 전면 재구축을 실행한다.

**재구축 범위**:

- DB 스키마: 28개 테이블 → Clean Rebuild (27개 테이블, 단일 마이그레이션)
- Studio Pipeline: Script/Storyboard/Scene Video 전 단계 고도화 + 세션 기반 관리
- TrendTube: base64 DB 저장 → Supabase Storage 전환 + Studio 연계
- AI 서비스: 중복 제거, 모델 레지스트리 중앙화, retry 통일
- 코드 구조: Dead Code 정리, 보안 수정, AI 서비스 디렉토리 분리

### 1.2 핵심 기술 부채 분석 — 5대 구조적 문제

개별 문서에서 식별된 수십 개의 이슈를 **5개의 구조적 문제**로 분류한다. 각 문제는 하나 이상의 Phase에서 해결된다.

|   #    | 구조적 문제                   | 근본 원인                                                                      | 영향 범위                                                    | 해결 Phase     |
| :----: | ----------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ | -------------- |
| **P1** | **데이터 관리 패턴 불일치**   | Studio 1:1 덮어쓰기 vs TrendTube 세션 기반                                     | Studio 전체: 이력 소실, FK 고아화, 롤백 불가                 | S-0A           |
| **P2** | **AI 파이프라인 데이터 손실** | Script 7개 필드 중 3개만 저장, Storyboard AI 모델 부적합, 메타데이터 미활용    | Storyboard/Video/B-Roll 품질 저하, 불필요한 재추론           | S-1A, S-1B     |
| **P3** | **미디어 저장소 이원화**      | Studio(Supabase Storage) vs TrendTube(base64 DB), media_asset FK 미연결        | DB 성능(건당 6.5-26MB), 자산 관리 불가, 비용 증가            | S-0B           |
| **P4** | **도메인 간 역할 경계 모호**  | Project AI Generator가 Studio 영역(hooks, scriptGuidelines, keywords) 생성     | AI 호출 2회 중복, 토큰 ~40% 낭비, Studio-TrendTube 자산 단절 | A-C, A-B, S-1E |
| **P5** | **코드 구조 파편화**          | AI 11파일 flat 구조, 2 SDK 혼용, retry 3곳 미적용, 인증 누락 1곳, Dead Code 4+ | 유지보수성 저하, 일시적 오류 시 즉시 실패, 보안 취약점       | S-1H, F-1, R-S |

### 1.3 재구축 원칙 및 전략 방향

#### 3대 원칙

| 원칙               | 설명                                                                    | 적용                                                                          |
| ------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **세션 기반 통합** | Studio와 TrendTube 모두 세션 패턴으로 생성 이력 보존                    | `studio_session` 신설, 재생성 시 이전 세션 archived                           |
| **데이터 연속성**  | AI 생성 → DB 저장 → 후속 단계 소비의 끊김 없는 파이프라인               | Script 7/7 필드 저장, Storyboard 메타데이터 전달, keywords → B-Roll 직접 사용 |
| **Clean Rebuild**  | 28개 마이그레이션 히스토리 초기화, 목표 스키마로 단일 마이그레이션 생성 | 모든 스키마 변경을 한 번에 적용 → 이후 Phase는 앱 로직만 구현                 |

#### 전략 방향

```
[근본 원인 진단]          [아키텍처 재설계]           [단계적 구현]
  5대 구조적 문제    →    목표 아키텍처 정의     →    6 Batch / 17 Phase
  (§1.2)                  (§2)                        (§3, §4)
```

---

## 2. 목표 아키텍처

### 2.1 도메인 역할 재정의

| 도메인        | 핵심 역할                        | AI 생성 필드                                                                                 | 변경 사항                                                 |
| ------------- | -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Project**   | 기획 + 컨텍스트 관리             | title, description, targetAudience, estimatedViews, suggestedTone, suggestedDifficulty (6개) | hooks, scriptGuidelines, keywords를 Studio로 이동 (9→6개) |
| **Studio**    | 프로덕션 콘텐츠 생성 (세션 기반) | Pre-Production(hooks, scriptGuidelines, seoKeywords) + 전체 대본 + 스토리보드 + 미디어       | 세션 도입, Pre-Production 신설, 메타데이터 전체 저장      |
| **TrendTube** | 트렌드 기반 빠른 영상 생성       | 트렌드 분석, 아이디어, 나레이션, 미디어 (Studio 재활용 가능)                                 | Storage 전환, Studio 연계, N클립 생성                     |

### 2.2 목표 데이터 관계도

```
project
 ├── studio_session (1:N) ← [신규] 세션 기반 관리 (active 1개, archived N개)
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
 │    │         ├── [신규] sessionId
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

**스키마 변경 요약**: 2개 테이블 제거 (`studio_coloring_preset/setting`) + 1개 신규 (`studio_session`) + 7개 수정 = **27개 테이블** (최종)

### 2.3 Studio Pipeline 설계

```
[Studio 진입] → studio_session 생성
  │
  ├── [Pre-Production] (신규 — studio_script에 저장)
  │    AI 생성: hooks[], scriptGuidelines, seoKeywords[]
  │    입력: Project 메타데이터 + 채널 정보 + 트렌드 스냅샷
  │
  ├── [Step 1: Script]
  │    AI: gemini-2.5-flash (SSE 스트리밍)
  │    출력: 5개 세그먼트 (hook/intro/body/cta/outro)
  │    저장: type, content, duration + visualNotes, emotionalTone, keywords[], sceneHints (7/7)
  │
  ├── [Step 2: Storyboard + Scene 이미지]
  │    AI 텍스트: gemini-2.5-flash (SSE, ← nano-banana-pro-preview 교체)
  │    AI 이미지: gemini-3-pro-image-preview (Scene별 순차, 참조 체이닝)
  │    입력: Script 전체 메타데이터 (content 300자 + duration + visualNotes + emotionalTone + sceneHints)
  │
  ├── [Step 3: Scene Video]
  │    AI: veo-3.1-generate-preview (8초 클립 × N, ← MOCKED 제거)
  │    참조 체이닝: Step 2 이미지 + 이전 클립 → inlineData 전달
  │    클립 분할: Scene duration ÷ 8 (올림)
  │
  ├── [Step 4: B-Roll]
  │    Script keywords[] 직접 사용 (AI 추가 호출 없음)
  │    외부 API: Pexels / Pixabay
  │
  └── [Step 5: Rough Cut] (Phase 2)
       Scene Video + B-Roll + TrendTube 미디어 자동 배치
```

**TrendTube 연계 흐름**:

```
TrendTube 결과 ──→ Studio 활용
  narrationScript  →  "TrendTube 스크립트 가져오기" → studio_script (source_trendtube_session_id FK)
  generated_video  →  Studio B-Roll/Scene 재사용
  background_music →  Rough Cut 오디오 트랙 (Phase 2)
  voiceover        →  Rough Cut 오디오 트랙 (Phase 2)
```

### 2.4 AI 서비스 아키텍처

**현재** → **목표**:

```
[현재]                                          [목표]
app/lib/                                        app/lib/ai/
├── gemini-client.server.ts  (텍스트 전용)      ├── models.server.ts     ← [신규] AI_MODELS 레지스트리
├── gemini-retry.server.ts                      ├── client.server.ts     ← 통합 클라이언트 (2 SDK)
├── ai-script.server.ts      ← 모델명 하드코딩  ├── retry.server.ts
├── ai-storyboard.server.ts  ← 잘못된 모델      ├── context-builder.server.ts ← [신규] 공유 컨텍스트
├── ai-image.server.ts                          ├── script.server.ts
├── ai-video.server.ts       ← retry 없음       ├── storyboard.server.ts
├── ai-music.server.ts       ← retry 없음       ├── image.server.ts
├── ai-trendtube.server.ts                      ├── video.server.ts      ← retry 적용
├── ai-project-generator.server.ts              ├── music.server.ts      ← retry 적용
├── tts.server.ts            ← retry 없음       ├── trendtube.server.ts
└── __mocks__/ai-fixtures.ts                    ├── project-generator.server.ts
                                                ├── pre-production.server.ts ← [신규]
                                                ├── tts.server.ts        ← retry 적용
                                                └── __mocks__/fixtures.ts
```

**AI 모델 레지스트리**:

```typescript
// app/lib/ai/models.server.ts
export const AI_MODELS = {
  text: { primary: "gemini-2.5-flash", lite: "gemini-2.5-flash-lite" },
  image: { primary: "gemini-3-pro-image-preview" },
  video: { primary: "veo-3.1-generate-preview" }, // 1회 최대 8초
  music: { primary: "lyria-realtime-exp" },
} as const;
```

### 2.5 미디어 저장소 통합 설계

**통합 경로 구조**:

```
media/                                               (Supabase Storage 버킷)
└── projects/{projectId}/
     ├── studio/{sessionId}/
     │    ├── storyboard/scene-{N}_{timestamp}.png    (Step 2 Scene 이미지)
     │    └── scene-video/scene-{N}_{timestamp}.mp4   (Step 3 Scene 비디오)
     │
     └── trendtube/{sessionId}/
          ├── video_{timestamp}.mp4                   (Veo 3 생성 영상)
          ├── music_{timestamp}.wav                   (Lyria 배경음악)
          ├── voiceover_{timestamp}.mp3               (TTS 나레이션)
          └── composited_{timestamp}.mp4              (FFmpeg 합성 영상)
```

**세션 기반 경로의 핵심 이점**:

- Script 재생성 시 새 세션 생성 → 이전 세션 미디어 파일 **자동 보존**
- 세션 삭제 시 해당 경로 하위 파일 일괄 삭제 가능
- `media_asset.storageKey`로 고아 파일 추적

### 2.6 현재 → 목표 변환 요약

| 영역                      | Before                                          | After                                               |
| ------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| Studio Script 재생성      | 덮어쓰기 (이전 결과 소실)                       | 세션 기반 (이전 결과 보존, 롤백 가능)               |
| Script AI 메타데이터 저장 | 3/7 필드 (43%)                                  | 7/7 필드 (100%)                                     |
| Storyboard 텍스트 AI 모델 | `nano-banana-pro-preview` (이미지 전용, 부적합) | `gemini-2.5-flash` (텍스트 최적화)                  |
| Scene 이미지 생성         | 수동 개별 생성, 시각적 일관성 없음              | 자동 순차 생성 + 참조 체이닝 (일관성 확보)          |
| Scene Video               | `setTimeout` 완전 모킹                          | Veo 3 연결, 8초 클립 순차 생성                      |
| TrendTube 미디어 저장     | base64 DB (건당 6.5-26MB 텍스트)                | Supabase Storage (URL ~100B)                        |
| TrendTube → Studio        | 완전 단절                                       | narrationScript import + 미디어 재활용              |
| TrendTube 결과 접근       | `?session=<id>` 필수                            | 최신 완료 세션 자동 로딩                            |
| TrendTube 비디오          | 8초 1개 클립 고정                               | 나레이션 길이에 맞춘 N클립 순차 생성                |
| Project AI Generator      | 9개 필드 (Studio 영역 포함)                     | 6개 필드 (기획 메타데이터만)                        |
| Studio Pre-Production     | 없음                                            | hooks, scriptGuidelines, seoKeywords 전담 생성      |
| AI 모델명 관리            | 8개 파일에 문자열 하드코딩                      | `AI_MODELS` 중앙 레지스트리                         |
| AI retry                  | 5/8 서비스만 적용                               | 8/8 서비스 전체 적용                                |
| AI SDK 클라이언트         | 2개 SDK 별도 초기화                             | 통합 클라이언트 관리 (`gemini-client.server.ts`)    |
| Storage 경로              | 비일관적                                        | `projects/{id}/{studio\|trendtube}/{sessionId}/...` |
| Dead Code                 | Coloring 2테이블, supa-client.ts, queries.ts 등 | 완전 제거                                           |

---

## 3. 실행 전략

### 3.1 통합 Phase 전체 목록

5개 원본 문서의 모든 작업 항목을 **17개 Phase**로 통합한다.

| Phase ID | 이름                                     | 원본  | 해결하는 구조적 문제 | 난이도 |
| :------: | ---------------------------------------- | :---: | :------------------: | :----: |
| **F-0**  | DB Clean Rebuild                         |  DB   | P1-P5 (스키마 기반)  |  높음  |
| **F-1**  | 긴급 보안 + Dead Code 정리               |  SR   |          P5          |  낮음  |
| **S-0A** | Studio 세션 기반 관리 도입               |  SE   |          P1          |  중간  |
| **S-0B** | Supabase Storage 통합                    |  SE   |          P3          |  중간  |
| **A-A**  | 공유 컨텍스트 빌더                       |  AO   |      P4 (준비)       |  낮음  |
| **S-1D** | Enum 정리 + Coloring 제거                |  SE   |          P5          |  낮음  |
| **R-S**  | 단기 리팩토링                            |  SR   |          P5          |  낮음  |
| **S-1A** | Script 메타데이터 전체 저장              |  SE   |          P2          |  중간  |
| **S-1B** | Storyboard 메타데이터 + 순차 이미지 생성 |  SE   |          P2          |  높음  |
| **S-1C** | Scene Video 순차 생성 + 8초 클립         |  SE   |          P2          |  높음  |
| **S-1E** | TrendTube → Studio 자산 연결             |  SE   |          P4          |  중간  |
| **S-1F** | TrendTube 결과 자동 로딩                 |  SE   |       P3 (UX)        |  낮음  |
| **A-B**  | TrendTube 컨텍스트 연계                  |  AO   |          P4          |  중간  |
| **S-1G** | TrendTube 8초 단계적 N클립 생성          |  SE   |          P2          |  높음  |
| **A-C**  | Pre-Production + Project 경량화          |  AO   |          P4          |  높음  |
| **S-1H** | AI 서비스 통합 + `lib/ai/` 분리          | SE+SR |          P5          |  높음  |
| **A-D**  | 데이터 마이그레이션 + deprecated 정리    |  AO   |     P4 (마무리)      |  중간  |

### 3.2 의존성 그래프

```
F-0 (DB Clean Rebuild)
 │
 ├──→ F-1 (보안/Dead Code) ─────────────────────────────────────────────────── 즉시 실행
 │
 ├──→ S-0A (Studio Session) ─┬──→ S-0B (Storage) ─┬──→ S-1B (Storyboard) ──→ S-1C (Video)
 │                            │                     │                              │
 │                            │                     ├──→ S-1F (TT 자동 로딩)       │
 │                            │                     ├──→ A-B  (TT 컨텍스트)        │
 │                            │                     └──→ S-1H (AI 통합)            │
 │                            │                                                    │
 │                            ├──→ S-1A (Script 메타) ──→ S-1B                     │
 │                            │         │                                          │
 │                            │         └──→ S-1E (TT→Studio)                     │
 │                            │                                                    │
 │                            └──→ A-C (Pre-Production) ──→ A-D (deprecated 정리) │
 │                                                                                 │
 ├──→ A-A  (컨텍스트 빌더) ─────────────────────── 즉시 병행 가능                 │
 ├──→ S-1D (Enum/Coloring) ─────────────────────── 즉시 병행 가능                 │
 ├──→ R-S  (단기 리팩토링) ─────────────────────── 즉시 병행 가능                 │
 │                                                                                 │
 └──→ S-1G (TT 8초 N클립) ← S-0B + S-1C 완료 필요 ───────────────────────────────┘
```

### 3.3 실행 배치 전략

Phase들을 **6개 배치(Batch)**로 그룹화한다. 각 배치 내 항목은 의존성이 허용하는 범위에서 **병행 실행** 가능하다.

#### Batch 0: 기반 구축 (Foundation)

> 모든 스키마 변경을 한 번에 적용한다. 이후 Phase는 별도 마이그레이션 없이 앱 로직만 구현한다.

| 순서 |  Phase  |   병행   | 설명                                                               |
| :--: | :-----: | :------: | ------------------------------------------------------------------ |
|  1   | **F-0** |    -     | DB Clean Rebuild: 전체 테이블 DROP → 목표 스키마 단일 마이그레이션 |
|  2   | **F-1** | F-0 직후 | 인증 누락 수정 (1줄) + Dead Code 5개 파일 삭제                     |

#### Batch 1: 세션 + 인프라 (Session & Infrastructure)

> 핵심 인프라 계층을 구축한다. 독립적인 Phase들은 병행 실행한다.

| 순서 |  Phase   |     병행     | 설명                                                           |
| :--: | :------: | :----------: | -------------------------------------------------------------- |
|  3   | **S-0A** |      -       | Studio 세션 기반 관리 (앱 로직: saveScript 세션화, CRUD 함수)  |
|  4   | **S-1D** | S-0A와 병행  | Enum/Coloring 코드 정리 (스키마는 F-0에서 완료)                |
|  5   | **A-A**  | S-0A와 병행  | 공유 컨텍스트 빌더 (ai-context-builder.server.ts 신규)         |
|  6   | **R-S**  | S-0A와 병행  | 단기 리팩토링 (data layer 일관성, hooks 이동, deprecated 타입) |
|  7   | **S-0B** | S-0A 완료 후 | Supabase Storage 통합 (sessionId 경로 필요 → S-0A 선행)        |

#### Batch 2: 핵심 파이프라인 (Core Pipeline)

> Script → Storyboard 데이터 파이프라인을 완성한다.

| 순서 |  Phase   |        병행         | 설명                                                             |
| :--: | :------: | :-----------------: | ---------------------------------------------------------------- |
|  8   | **S-1A** |          -          | Script 메타데이터 전체 저장 (7/7 필드)                           |
|  9   | **S-1B** | S-1A + S-0B 완료 후 | Storyboard 메타데이터 활용 + 모델 교체 + 순차 이미지 참조 체이닝 |

#### Batch 3: 미디어 생성 + TrendTube 연계 (Media & Integration)

> Scene Video를 실제 연결하고, TrendTube-Studio 연계를 구축한다.

| 순서 |  Phase   |       병행        | 설명                                                            |
| :--: | :------: | :---------------: | --------------------------------------------------------------- |
|  10  | **S-1C** |         -         | Scene Video 순차 생성 (Veo 3 연결, 모킹 제거, 8초 클립)         |
|  11  | **S-1E** | S-1A 완료 시 병행 | TrendTube narrationScript → Studio Script import                |
|  12  | **S-1F** | S-0B 완료 시 병행 | TrendTube 최신 세션 자동 로딩 (세션 이력 UI)                    |
|  13  | **A-B**  | S-0B 완료 시 병행 | TrendTube에서 Project trendSnapshot 재사용 (AI 호출 1-2회 절감) |

#### Batch 4: 고급 기능 (Advanced Features)

> 고급 기능과 코드 구조 최적화를 수행한다.

| 순서 |  Phase   |     병행     | 설명                                                                 |
| :--: | :------: | :----------: | -------------------------------------------------------------------- |
|  14  | **S-1G** | S-1C 완료 후 | TrendTube 나레이션 기반 N클립 순차 생성                              |
|  15  | **A-C**  | S-0A 완료 후 | Pre-Production 단계 신설 + Project AI Generator 경량화               |
|  16  | **S-1H** | S-0B 완료 후 | AI 모델 레지스트리 + retry 통일 + `lib/ai/` 분리 (~50개 import 변경) |

#### Batch 5: 마무리 (Cleanup)

> deprecated 컬럼을 최종 제거한다.

| 순서 |  Phase  |     병행      | 설명                                                                   |
| :--: | :-----: | :-----------: | ---------------------------------------------------------------------- |
|  17  | **A-D** | A-C 안정화 후 | Project.hooks/scriptGuidelines → Studio 마이그레이션 완료 후 컬럼 제거 |

### 3.4 Phase 간 의존성 매트릭스

> `●` = 이 Phase(행)를 시작하려면 해당 Phase(열)가 완료되어야 함

|          | F-0 | S-0A | S-0B | S-1A | S-1B | S-1C | A-C |
| -------- | :-: | :--: | :--: | :--: | :--: | :--: | :-: |
| **F-1**  |  ●  |      |      |      |      |      |     |
| **S-0A** |  ●  |      |      |      |      |      |     |
| **S-0B** |  ●  |  ●   |      |      |      |      |     |
| **A-A**  |  ●  |      |      |      |      |      |     |
| **S-1D** |  ●  |      |      |      |      |      |     |
| **R-S**  |  ●  |      |      |      |      |      |     |
| **S-1A** |  ●  |  ●   |      |      |      |      |     |
| **S-1B** |  ●  |  ●   |  ●   |  ●   |      |      |     |
| **S-1C** |  ●  |  ●   |  ●   |      |  ●   |      |     |
| **S-1E** |  ●  |  ●   |      |  ●   |      |      |     |
| **S-1F** |  ●  |      |  ●   |      |      |      |     |
| **A-B**  |  ●  |      |  ●   |      |      |      |     |
| **S-1G** |  ●  |  ●   |  ●   |      |      |  ●   |     |
| **A-C**  |  ●  |  ●   |      |      |      |      |     |
| **S-1H** |  ●  |      |  ●   |      |      |      |     |
| **A-D**  |  ●  |  ●   |      |      |      |      |  ●  |

---

## 4. Phase 상세 명세

---

### Batch 0: 기반 구축

---

### Phase F-0: DB Clean Rebuild

> **원본**: [DB 스키마 재구축 전략서](db-schema-rebuild-strategy.md) | **배치**: Batch 0 | **선행**: 없음 | **난이도**: 높음

#### 목표

28개 마이그레이션 히스토리를 초기화하고, 목표 스키마(27개 테이블)를 단일 Clean 마이그레이션으로 생성한다. 이후 모든 Phase가 이 스키마 위에서 앱 로직만 구현하도록 기반을 확보한다.

#### 전략적 의의

**모든 Phase의 선행 조건**. Clean Rebuild로 스키마 변경(세션 테이블 신설, 메타데이터 컬럼 추가, Coloring 제거, Enum 통합, FK 변경)을 한 번에 적용하므로, 이후 Phase에서 별도 마이그레이션 SQL을 작성할 필요가 없다.

#### 핵심 작업

| #   | 작업                                                                         | 영향 파일                                                                                             |
| --- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | 스키마 정의 파일 수정 (Enum 제거, 테이블 추가/수정/삭제, relations 업데이트) | `enums.ts`, `project-schema.ts`, `studio-schema.ts`, `studio-trendtube-schema.ts`, `drizzle/index.ts` |
| 2   | Supabase SQL Editor에서 전체 테이블 + Enum DROP                              | Supabase Dashboard                                                                                    |
| 3   | 마이그레이션 히스토리 초기화 (`rm -rf app/drizzle/migrations/*`)             | `app/drizzle/migrations/`                                                                             |
| 4   | 새 Clean 마이그레이션 생성 (`npm run db:generate`)                           | `app/drizzle/migrations/0000_*.sql`                                                                   |
| 5   | 마이그레이션 적용 (`npm run db:migrate`)                                     | DB                                                                                                    |
| 6   | RLS 정책 재설정 (TABLES/POLICIES 배열 업데이트)                              | `app/drizzle/enable-rls.ts`                                                                           |
| 7   | 데이터 레이어/타입/API 코드 동기화                                           | `studio.data.server.ts`, `project.data.server.ts`, `studio.types.ts` 등                               |

#### 주요 변경 코드 요약

- **`studio-schema.ts`**: `studioSessions` 테이블 추가, `scripts`에 `sessionId`/Pre-Production 필드 추가, `scriptSegments`에 메타데이터 4컬럼 추가, `storyboards`에 `sessionId`/`emotionalTone`/`cameraAngle` 추가, `sceneVideos`에 `sessionId` 추가, `coloringPresets`/`coloringSettings` 완전 제거
- **`project-schema.ts`**: `tone` 컬럼 제거, `basedOnTrendId` 제거, `hooks`/`scriptGuidelines`에 `@deprecated` 주석
- **`enums.ts`**: `projectToneEnum` 제거
- **`enable-rls.ts`**: `studio_session`, `idea` (← `saved_idea`), TrendTube 테이블 정책 추가, `ai_recommendation` 제거

#### 검증

```bash
npm run typecheck && npm run lint
npm run db:migrate
# Supabase Dashboard에서 studio_session 테이블 존재, studio_coloring_* 부재 확인
# studio_script_segment에 visual_notes, emotional_tone, keywords, scene_hints 컬럼 확인
```

#### 원본 상세 참조

[DB 스키마 재구축 전략서 §4 재구축 실행 전략](db-schema-rebuild-strategy.md#4-재구축-실행-전략)

---

### Phase F-1: 긴급 보안 + Dead Code 정리

> **원본**: [프로젝트 구조 리팩토링 계획 §3](project-structure-refactoring-plan.md) | **배치**: Batch 0 | **선행**: F-0 | **난이도**: 낮음

#### 목표

보안 취약점(인증 누락) 즉시 수정 + 확인된 Dead Code 파일/디렉토리 삭제.

#### 전략적 의의

**구조적 문제 P5** 중 가장 위험도 높은 보안 이슈를 최우선 해결. 나머지는 코드 위생(hygiene) 향상.

#### 핵심 작업

| #   | 작업                                                                    | 영향 파일                                    |
| --- | ----------------------------------------------------------------------- | -------------------------------------------- |
| 1   | **[보안]** `generate-ideas.ts` action에 `requireAuth(request)` 1줄 추가 | `app/features/project/api/generate-ideas.ts` |
| 2   | `supa-client.ts` 삭제 (import 0개, Drizzle로 대체됨)                    | `app/supa-client.ts`                         |
| 3   | `queries.ts` 삭제 (import 0개, `supa-client.ts` 종속)                   | `app/features/project/queries.ts`            |
| 4   | `drizzle/triggers/` 빈 디렉토리 삭제                                    | `app/drizzle/triggers/`                      |
| 5   | `youtube-oauth.client.ts` import 확인 후 삭제 (import 0개 확인됨)       | `app/lib/youtube-oauth.client.ts`            |

#### 검증

```bash
npm run typecheck && npm run lint
# Grep "supa-client" app/ → 0개
# Grep "queries" app/features/project/ → import 없음
```

#### 원본 상세 참조

[프로젝트 구조 리팩토링 계획 §2.3 발견된 이슈, §2.7 Dead Code](project-structure-refactoring-plan.md)

---

### Batch 1: 세션 + 인프라

---

### Phase S-0A: Studio 세션 기반 관리 도입

> **원본**: [SE Phase 0A](studio-enhancement-plan.md#phase-0a-studio-세션-기반-관리-도입-우선순위-최고--구조적-선행-조건) | **배치**: Batch 1 | **선행**: F-0 | **난이도**: 중간

#### 목표

Studio에 `studio_session` 기반 생성/관리 패턴을 구현하여, Script 재생성 시 이전 결과를 보존하고 롤백할 수 있도록 한다.

#### 전략적 의의

**구조적 문제 P1 해결의 핵심**. TrendTube와 동일한 세션 패턴을 Studio에 도입하여 데이터 관리 방식을 통합한다. 이 Phase가 완료되어야 S-0B (Storage), S-1A (Script 메타), A-C (Pre-Production) 등 후속 Phase를 진행할 수 있다.

#### 핵심 작업

| #   | 작업                                                                                          | 영향 파일                                           |
| --- | --------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | 세션 CRUD 함수 추가 (`createStudioSession`, `archiveStudioSession`, `getActiveStudioSession`) | `app/common/data/studio.data.server.ts`             |
| 2   | `saveScript()` 세션 기반 변경 (기존 archived → 새 세션 생성 → 새 Script INSERT)               | `app/common/data/studio.data.server.ts`             |
| 3   | `saveStoryboard()` 세션 기반 변경                                                             | `app/common/data/studio.data.server.ts`             |
| 4   | 기존 조회 함수에 sessionId 필터 추가                                                          | `app/common/data/studio.data.server.ts`             |
| 5   | `generate-script-stream.ts`에서 세션 생성 로직 적용                                           | `app/features/studio/api/generate-script-stream.ts` |
| 6   | Studio 페이지 Loader에서 sessionId 기반 데이터 로딩                                           | `app/features/studio/pages/studio-scene-page.tsx`   |
| 7   | `StudioSession` 타입 추가                                                                     | `app/common/types/studio.types.ts`                  |

#### 주요 변경 코드 요약

- `saveScript()`: 기존 `segments DELETE → INSERT` 패턴 → 기존 active 세션 `archived` → 새 세션 생성 (version+1) → 새 Script+segments INSERT
- `saveStoryboard()`: 동일 세션 내에서만 scenes DELETE → INSERT (세션 간 보존)

#### 검증

```bash
npm run typecheck && npm run lint
# Script 생성 → studio_session 레코드 생성 확인 (status='active', version=1)
# Script 재생성 → 기존 세션 archived + 새 세션 active (version=2) 확인
# 이전 세션의 Script/Storyboard 데이터 보존 확인
```

#### 원본 상세 참조

[SE §5.1 Studio 세션 기반 관리 도입](studio-enhancement-plan.md#51-studio-세션-기반-관리-도입-trendtube-패턴-통합), [SE Phase 0A](studio-enhancement-plan.md#phase-0a-studio-세션-기반-관리-도입-우선순위-최고--구조적-선행-조건)

---

### Phase S-0B: Supabase Storage 통합

> **원본**: [SE Phase 0B](studio-enhancement-plan.md#phase-0b-supabase-storage-통합-우선순위-최고--공유-인프라) | **배치**: Batch 1 | **선행**: S-0A | **난이도**: 중간

#### 목표

Studio와 TrendTube의 모든 미디어를 Supabase Storage에 통합 저장한다. TrendTube의 base64 DB 저장 패턴을 제거한다.

#### 전략적 의의

**구조적 문제 P3 해결의 핵심**. TrendTube 미디어 저장 방식을 Studio와 동일하게 통일하여 DB 부하를 제거하고, `media_asset` FK를 실제로 활용 가능하게 한다.

#### 핵심 작업

| #   | 작업                                                                                   | 영향 파일                                                                               |
| --- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | 기존 `uploadStoryboardImage()` 제거, `uploadProjectMedia()` 통합 함수 추가             | `app/lib/supabase-storage.server.ts`                                                    |
| 2   | 편의 함수 추가: `uploadStudioImage()`, `uploadStudioVideo()`, `uploadTrendTubeMedia()` | `app/lib/supabase-storage.server.ts`                                                    |
| 3   | AI 서비스 반환값 변경: base64 data URL → Buffer                                        | `ai-video.server.ts`, `ai-music.server.ts`, `tts.server.ts`, `video-composer.server.ts` |
| 4   | TrendTube Step API에서 Buffer + Storage 업로드 + `media_asset` FK 연결                 | `trendtube-step-media.ts`, `trendtube-step-compose.ts`                                  |
| 5   | `generate-scene-image.ts`에서 새 업로드 함수 사용 (sessionId 경로)                     | `app/features/studio/api/generate-scene-image.ts`                                       |
| 6   | `createMediaAsset()` 함수 활용 확장                                                    | `app/common/data/media.data.server.ts`                                                  |

#### 주요 변경 코드 요약

- `ai-video.server.ts`: `return { url: dataUrl }` → `return { buffer, mimeType }`
- `trendtube-step-media.ts`: `result.url` → `result.buffer` + `uploadTrendTubeMedia()` + `createMediaAsset()` + `saveTrendTubeMedia({ mediaAssetId })`
- Storage 경로: `projects/{projectId}/{studio|trendtube}/{sessionId}/...`

#### 검증

```bash
npm run typecheck && npm run lint
# TrendTube 파이프라인 실행 → Supabase Storage에 파일 업로드 확인
# trendtube_media.publicUrl이 Storage URL (base64 아님) 확인
# trendtube_media.mediaAssetId 값이 NULL이 아님 확인
```

#### 원본 상세 참조

[SE §4 Supabase Storage 통합 설계](studio-enhancement-plan.md#4-supabase-storage-통합-설계), [SE Phase 0B](studio-enhancement-plan.md#phase-0b-supabase-storage-통합-우선순위-최고--공유-인프라), [SE §7.1 Phase A](studio-enhancement-plan.md#71-phase-a-미디어-영구-저장-supabase-storage-전환)

---

### Phase A-A: 공유 컨텍스트 빌더

> **원본**: [AO Phase A](project-studio-ai-optimization-plan.md#phase-a-공유-컨텍스트-빌더-비파괴적-변경) | **배치**: Batch 1 | **선행**: F-0 | **난이도**: 낮음

#### 목표

AI 서비스 간 공유 컨텍스트 구성을 통일하여, 모든 AI 호출이 일관된 Project/채널/트렌드 정보를 사용하도록 한다.

#### 전략적 의의

**구조적 문제 P4 해결 준비**. 현재 `ai-script.server.ts`의 `buildProjectContext()`를 공유 유틸리티로 분리하여 Pre-Production, Script, Storyboard, TrendTube 모든 AI 서비스에서 동일한 컨텍스트를 사용하는 기반을 마련한다.

#### 핵심 작업

| #   | 작업                                                                                  | 영향 파일                                     |
| --- | ------------------------------------------------------------------------------------- | --------------------------------------------- |
| 1   | `buildStudioContext()` 공유 유틸리티 생성                                             | `app/lib/ai-context-builder.server.ts` (신규) |
| 2   | `ai-script.server.ts`의 `buildProjectContext()`를 `buildStudioContext()` 호출로 대체  | `app/lib/ai-script.server.ts`                 |
| 3   | `ai-storyboard.server.ts`의 `buildStoryboardPrompt()`에서 `buildStudioContext()` 활용 | `app/lib/ai-storyboard.server.ts`             |

#### 검증

```bash
npm run typecheck && npm run lint
# Script 생성 시 동일한 AI 출력 품질 유지 확인 (컨텍스트 내용 동일)
```

#### 원본 상세 참조

[AO §3.6 공유 컨텍스트 빌더](project-studio-ai-optimization-plan.md#36-공유-컨텍스트-빌더--ai-서비스-레이어-통합)

---

### Phase S-1D: Enum 정리 + Coloring 제거

> **원본**: [SE Phase 1D](studio-enhancement-plan.md#phase-1d-enum-정리--coloring-제거-우선순위-중간) | **배치**: Batch 1 | **선행**: F-0 | **난이도**: 낮음

#### 목표

F-0에서 스키마 레벨 변경(tone 컬럼 제거, Coloring 테이블 삭제)이 완료되었으므로, 코드 레벨에서 모든 참조를 정리한다.

#### 전략적 의의

**구조적 문제 P5 해결 (코드 위생)**. Dead Code 제거로 코드베이스를 경량화한다.

#### 핵심 작업

| #   | 작업                                                  | 영향 파일                                            |
| --- | ----------------------------------------------------- | ---------------------------------------------------- |
| 1   | `project.tone` 참조 코드 제거, `contentTone`으로 대체 | `new-project-page.tsx`, `project.data.server.ts`     |
| 2   | `studio-coloring-page.tsx` 파일 삭제                  | `app/features/studio/pages/studio-coloring-page.tsx` |
| 3   | Coloring Quick Access / 사이드바 메뉴 항목 제거       | `studio-project-selector.tsx`, `studio-sidebar.tsx`  |
| 4   | Coloring 라우트 제거                                  | `app/routes.ts`                                      |
| 5   | `getColorPresets()` 함수 + `ColorPreset` 타입 제거    | `studio.data.server.ts`, `studio.types.ts`           |

#### 검증

```bash
npm run typecheck && npm run lint
Grep "coloringPresets" app/   # 0개
Grep "ColorPreset" app/       # 0개
Grep "projectToneEnum" app/   # 0개 (enums.ts에서만 주석으로 존재 가능)
```

#### 원본 상세 참조

[SE §5.5 project.tone 제거](studio-enhancement-plan.md#55-projecttone-컬럼-제거-contenttone으로-통합), [SE §5.6 Coloring 제거](studio-enhancement-plan.md#56-coloring-테이블-제거)

---

### Phase R-S: 단기 리팩토링

> **원본**: [SR §3 단기](project-structure-refactoring-plan.md#3-리팩토링-우선순위-요약) | **배치**: Batch 1 | **선행**: F-0 | **난이도**: 낮음

#### 목표

코드 일관성 개선: Data layer 우회 수정, hooks 통합, deprecated 타입 정리.

#### 전략적 의의

**구조적 문제 P5 해결 (코드 일관성)**. API 라우트에서 DB 직접 쿼리 패턴을 제거하고, 불필요한 디렉토리/타입을 정리한다.

#### 핵심 작업

| #   | 작업                                                                                             | 영향 파일                                          |
| --- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| 1   | `generate-scene-image.ts`의 DB 직접 쿼리 → `studio.data.server.ts`에 `getStoryboardScene()` 추가 | `generate-scene-image.ts`, `studio.data.server.ts` |
| 2   | `use-media-query.ts`를 `app/hooks/` → `features/studio/hooks/`로 이동, `app/hooks/` 삭제         | import 1개 변경                                    |
| 3   | `scripts/verify-ai-models.ts` package.json에 등록                                                | `package.json`                                     |
| 4   | deprecated `trendtube-generate-stream.ts` 제거 + routes.ts 라우트 해제                           | `trendtube-generate-stream.ts`, `routes.ts`        |
| 5   | deprecated 타입 정리 (`GeneratedIdea`, `SavedIdea`, `AIRecommendation`)                          | `ideation.types.ts`, `project.types.ts`            |

#### 검증

```bash
npm run typecheck && npm run lint
# generate-scene-image.ts에 db, schema import 없음 확인
Grep "from \"~/lib/db.server\"" app/features/studio/api/generate-scene-image.ts  # 0개
```

#### 원본 상세 참조

[SR §2.3 API 제안](project-structure-refactoring-plan.md#23-appfeaturesapi-폴더), [SR §2.4 hooks 통합](project-structure-refactoring-plan.md#24-hooks-통합--featuresstudiohooks), [SR §2.7 deprecated](project-structure-refactoring-plan.md#27-사용하지-않는-임시-파일-검토)

---

### Batch 2: 핵심 파이프라인

---

### Phase S-1A: Script 메타데이터 전체 저장

> **원본**: [SE Phase 1A](studio-enhancement-plan.md#phase-1a-script-메타데이터-db-저장-우선순위-최고) | **배치**: Batch 2 | **선행**: S-0A | **난이도**: 중간

#### 목표

AI가 생성하는 Script 세그먼트의 7개 필드를 모두 DB에 저장하여, 후속 단계(Storyboard, B-Roll)에서 활용할 수 있도록 한다.

#### 전략적 의의

**구조적 문제 P2 해결의 첫 단계**. 현재 3/7 필드만 저장되어 Storyboard AI가 content 200자만으로 시각적 씬을 재추론하는 문제를 해결한다. 이 Phase 완료 후 S-1B에서 메타데이터를 활용한 고품질 Storyboard 생성이 가능해진다.

#### 핵심 작업

| #   | 작업                                                                                      | 영향 파일                                           |
| --- | ----------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | `SaveScriptInput` 타입에 4개 필드 추가 (visualNotes, emotionalTone, keywords, sceneHints) | `app/common/data/studio.data.server.ts`             |
| 2   | `saveScript()` 함수에서 4개 필드 INSERT                                                   | `app/common/data/studio.data.server.ts`             |
| 3   | `getScriptWithSegments()` 반환에 4개 필드 포함                                            | `app/common/data/studio.data.server.ts`             |
| 4   | `generate-script-stream.ts`에서 saveScript 호출 시 전체 메타데이터 전달                   | `app/features/studio/api/generate-script-stream.ts` |
| 5   | `ScriptSegment` 타입에 신규 필드 추가                                                     | `app/common/types/studio.types.ts`                  |

#### 주요 변경 코드 요약

- `generate-script-stream.ts` 핵심 변경: `saveScript()` 호출 시 `seg.visualNotes`, `seg.emotionalTone`, `seg.keywords`, `seg.sceneHints` 추가 전달
- DB 컬럼은 F-0에서 이미 생성됨 → 마이그레이션 불필요

#### 검증

```bash
npm run typecheck && npm run lint
# Script 생성 → studio_script_segment에 visual_notes, emotional_tone, keywords, scene_hints 값 존재 확인
# 페이지 새로고침 후 메타데이터 유지 확인
```

#### 원본 상세 참조

[SE §6.1 Step 1: Script 생성 최적화](studio-enhancement-plan.md#61-step-1-script-생성-최적화)

---

### Phase S-1B: Storyboard 메타데이터 + 순차 이미지 생성

> **원본**: [SE Phase 1B](studio-enhancement-plan.md#phase-1b-storyboard-메타데이터--순차-이미지-생성-우선순위-최고) | **배치**: Batch 2 | **선행**: S-1A, S-0B | **난이도**: 높음

#### 목표

Script 메타데이터를 Storyboard AI 프롬프트에 활용하고, 부적합 모델을 교체하며, Scene별 순차 이미지 생성 + 참조 체이닝으로 시각적 일관성을 확보한다.

#### 전략적 의의

**구조적 문제 P2 해결의 완성**. Script 메타데이터(S-1A) + Storage(S-0B) 기반 위에서, Storyboard 품질을 비약적으로 향상시키는 핵심 Phase이다.

#### 핵심 작업

| #   | 작업                                                                                               | 영향 파일                                               |
| --- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | `buildStoryboardPrompt()`에 duration + visualNotes + emotionalTone + sceneHints 포함 (300자 limit) | `app/lib/ai-storyboard.server.ts`                       |
| 2   | Storyboard 텍스트 AI 모델 교체: `nano-banana-pro-preview` → `gemini-2.5-flash`                     | `app/lib/ai-storyboard.server.ts`                       |
| 3   | `ai-image.server.ts`에 `referenceImage` 옵션 추가 (이전 Scene Buffer → inlineData)                 | `app/lib/ai-image.server.ts`                            |
| 4   | `generate-storyboard-stream.ts`에서 텍스트 완료 후 Scene별 순차 이미지 생성 루프 추가              | `app/features/studio/api/generate-storyboard-stream.ts` |
| 5   | `SaveStoryboardInput` 타입에 emotionalTone, cameraAngle 추가                                       | `app/common/data/studio.data.server.ts`                 |
| 6   | `saveStoryboard()` 함수 수정                                                                       | `app/common/data/studio.data.server.ts`                 |
| 7   | `StoryboardScene` 타입 업데이트                                                                    | `app/common/types/studio.types.ts`                      |
| 8   | Storyboard UI에 순차 이미지 생성 진행 표시 (SSE 이벤트 핸들링)                                     | `studio-storyboard-page.tsx`                            |
| 9   | Scene Card에 emotionalTone/cameraAngle 메타데이터 표시                                             | `storyboard-scene-card.tsx`                             |

#### 주요 변경 코드 요약

- **참조 체이닝**: Scene N 이미지 생성 시 Scene N-1의 Buffer를 `referenceImage`로 전달. Gemini 이미지 생성은 `inlineData` (base64) 전용 — `fileUri` (URL)는 미지원
- **순차 생성 흐름**: 텍스트 스토리보드 SSE 완료 → DB 저장 → `for (scene of allScenes)` 루프로 이미지 순차 생성 → 각 이미지 SSE 전송

#### 검증

```bash
npm run typecheck && npm run lint
# Storyboard 생성 → SSE 이벤트 순서: text_complete → image (scene 1) → image (scene 2) → ...
# Supabase Storage: projects/{id}/studio/{sessionId}/storyboard/ 에 이미지 파일 확인
# studio_storyboard.imageAssetId 모든 Scene에 연결 확인
# Scene 1~N 이미지의 시각적 일관성 육안 확인
```

#### 원본 상세 참조

[SE §6.2 Step 2: Storyboard + Scene 이미지 생성 최적화](studio-enhancement-plan.md#62-step-2-storyboard--scene-이미지-생성-최적화)

---

### Batch 3: 미디어 생성 + TrendTube 연계

---

### Phase S-1C: Scene Video 순차 생성 + 8초 클립

> **원본**: [SE Phase 1C](studio-enhancement-plan.md#phase-1c-scene-video-순차-생성--8초-클립-분할-우선순위-높음) | **배치**: Batch 3 | **선행**: S-1B | **난이도**: 높음

#### 목표

`setTimeout` 모킹을 제거하고 Veo 3 API를 실제 연결한다. Scene별 순차 비디오 생성 + 8초 클립 분할 + 참조 체이닝을 구현한다.

#### 전략적 의의

**Studio Pipeline 완성의 핵심**. 이 Phase로 Script → Storyboard → Scene Video 전 과정이 실제 AI로 동작하게 된다.

#### 핵심 작업

| #   | 작업                                                                  | 영향 파일                                                       |
| --- | --------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | `ai-video.server.ts`에 referenceImage/referenceVideo 옵션 추가        | `app/lib/ai-video.server.ts`                                    |
| 2   | `splitVisualPrompt()` 클립 분할 프롬프트 생성 함수 추가               | `app/lib/ai-video.server.ts`                                    |
| 3   | `generate-scene-video-stream.ts` 신규 API (SSE, Scene×클립 순차 생성) | `app/features/studio/api/generate-scene-video-stream.ts` (신규) |
| 4   | `createSceneVideo`, `createSceneVideoPart` 데이터 레이어 함수 추가    | `app/common/data/studio.data.server.ts`                         |
| 5   | `studio-scene-page.tsx` 모킹 제거, SSE API 호출 + 클립별 진행 표시    | `app/features/studio/pages/studio-scene-page.tsx`               |
| 6   | routes.ts에 API 라우트 등록                                           | `app/routes.ts`                                                 |

#### 주요 변경 코드 요약

- **8초 클립 분할**: `clipCount = Math.ceil(scene.duration / 8)`. Scene 내 클립 간 이전 클립 참조 (장면 내 연속성). Scene 간 이전 Scene 마지막 클립 참조 (장면 전환 자연스러움)
- **이미지 입력**: Supabase Storage에서 `fetch()` → Buffer → `inlineData`. Veo 3는 URL 미지원

#### 검증

```bash
npm run typecheck && npm run lint
# Scene Video 생성 → SSE 이벤트: video_clip (scene 1, clip 1) → ... → complete
# Supabase Storage: projects/{id}/studio/{sessionId}/scene-video/ 에 비디오 파일 확인
# studio_video + studio_video_part 레코드 + media_asset FK 확인
```

#### 원본 상세 참조

[SE §6.3 Step 3: Scene Video 순차 생성](studio-enhancement-plan.md#63-step-3-scene-video-순차-생성-모킹-제거)

---

### Phase S-1E: TrendTube → Studio 자산 연결

> **원본**: [SE Phase 1E](studio-enhancement-plan.md#phase-1e-trendtube--studio-연결-우선순위-중간) | **배치**: Batch 3 | **선행**: S-1A | **난이도**: 중간

#### 목표

TrendTube의 narrationScript를 Studio Script로 가져오고, 생성 미디어를 Studio에서 재활용할 수 있도록 연결한다.

#### 전략적 의의

**구조적 문제 P4 해결 (Studio-TrendTube 단절 해소)**. 두 파이프라인의 자산을 연결하여 중복 생성을 방지한다.

#### 핵심 작업

| #   | 작업                                                                                         | 영향 파일                                                   |
| --- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | `import-trendtube-script.ts` 신규 API (narrationScript → 세그먼트 분류 → Studio Script 저장) | `app/features/studio/api/import-trendtube-script.ts` (신규) |
| 2   | `getTrendTubeMediaAssets()` 함수 추가                                                        | `app/common/data/trendtube.data.server.ts`                  |
| 3   | Script 페이지에 "TrendTube 스크립트 가져오기" 버튼 UI 추가                                   | `app/features/studio/pages/studio-script-page.tsx`          |
| 4   | routes.ts에 import API 라우트 등록                                                           | `app/routes.ts`                                             |

#### 검증

```bash
npm run typecheck && npm run lint
# TrendTube 완료 세션 존재 시 → Script 페이지에 "가져오기" 버튼 표시
# 버튼 클릭 → narrationScript가 5개 세그먼트로 파싱·저장
# studio_script.source_trendtube_session_id 값 확인
```

#### 원본 상세 참조

[SE §7.3 TrendTube → Studio 연결](studio-enhancement-plan.md#73-trendtube--studio-연결), [AO §3.5 TrendTube → Studio 자산 연결](project-studio-ai-optimization-plan.md#35-trendtube-연계-최적화)

---

### Phase S-1F: TrendTube 결과 자동 로딩

> **원본**: [SE Phase 1F](studio-enhancement-plan.md#phase-1f-trendtube-결과-재접근-우선순위-중간) | **배치**: Batch 3 | **선행**: S-0B | **난이도**: 낮음

#### 목표

`?session=<id>` 없이도 프로젝트 ID만으로 최신 TrendTube 결과를 자동 로딩하고, 세션 이력 전환 UI를 제공한다.

#### 전략적 의의

TrendTube 결과 접근성 문제 해결. 사용자가 sessionId를 기억하지 않아도 이전 결과를 볼 수 있다.

#### 핵심 작업

| #   | 작업                                                  | 영향 파일                                             |
| --- | ----------------------------------------------------- | ----------------------------------------------------- |
| 1   | `getLatestCompletedSessionForUser()` 함수 추가        | `app/common/data/trendtube.data.server.ts`            |
| 2   | `getCompletedSessionsForUser()` 함수 추가             | `app/common/data/trendtube.data.server.ts`            |
| 3   | Loader 수정: ?session 없으면 최신 완료 세션 자동 로딩 | `app/features/studio/pages/studio-dashboard-page.tsx` |
| 4   | 세션 이력 전환 UI (Shadcn Select)                     | `app/features/studio/pages/studio-dashboard-page.tsx` |

#### 검증

```bash
# /studio/dashboard/:projectId 접속 → 최신 완료 세션 결과 자동 표시
# 세션 이력에서 다른 세션 선택 → 해당 결과 전환 확인
# 완료 세션 없는 프로젝트 → 입력 폼 표시 확인
```

#### 원본 상세 참조

[SE §7.2 Phase B: 프로젝트 ID 기반 결과 재접근](studio-enhancement-plan.md#72-phase-b-프로젝트-id-기반-결과-재접근)

---

### Phase A-B: TrendTube 컨텍스트 연계

> **원본**: [AO Phase B](project-studio-ai-optimization-plan.md#phase-b-trendtube-컨텍스트-연계-ai-호출-절감) | **배치**: Batch 3 | **선행**: S-0B | **난이도**: 중간

#### 목표

TrendTube에서 Project에 이미 저장된 `trendSnapshot`을 재사용하여 불필요한 AI 호출을 제거한다.

#### 전략적 의의

**구조적 문제 P4 해결 (AI 호출 절감)**. Project 생성 시 저장된 트렌드 스냅샷을 TrendTube Step 1에서 재사용하면 Gemini 호출 1-2회를 절감할 수 있다.

#### 핵심 작업

| #   | 작업                                                               | 영향 파일                                             |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| 1   | `extractYouTubeTrends()`에 `existingTrendSnapshot` 파라미터 추가   | `app/lib/ai-trendtube.server.ts`                      |
| 2   | `generateVideoIdeas()`에 `projectContext` 파라미터 추가            | `app/lib/ai-trendtube.server.ts`                      |
| 3   | `trendtube-step-trends.ts`: trendSnapshot 존재 시 AI 호출 건너뛰기 | `app/features/studio/api/trendtube-step-trends.ts`    |
| 4   | `trendtube-step-ideas.ts`: Project 컨텍스트 주입                   | `app/features/studio/api/trendtube-step-ideas.ts`     |
| 5   | TrendTube 대시보드 UI에 "기존 분석 사용" 옵션 추가                 | `app/features/studio/pages/studio-dashboard-page.tsx` |

#### 검증

```bash
npm run typecheck && npm run lint
# trendSnapshot 있는 프로젝트 → Step 1 건너뛰기 확인 (AI 호출 없음)
# Step 2에서 Project title/description/targetAudience가 프롬프트에 포함되는지 확인
```

#### 원본 상세 참조

[AO §3.5 TrendTube 연계 최적화](project-studio-ai-optimization-plan.md#35-trendtube-연계-최적화)

---

### Batch 4: 고급 기능

---

### Phase S-1G: TrendTube 8초 단계적 N클립 생성

> **원본**: [SE Phase 1G](studio-enhancement-plan.md#phase-1g-trendtube-8초-단계적-비디오-생성-우선순위-중간) | **배치**: Batch 4 | **선행**: S-0B, S-1C | **난이도**: 높음

#### 목표

TrendTube 나레이션 스크립트를 8초 단위로 분할하여 N개 클립을 순차적으로 생성하고, FFmpeg로 합성한다.

#### 전략적 의의

현재 나레이션을 8초에 맞춰 강제 절단하는 한계를 극복하여, 전체 나레이션에 맞는 길이의 영상을 생성할 수 있게 한다.

#### 핵심 작업

| #   | 작업                                                        | 영향 파일                                                          |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | `splitNarrationForClips()` 나레이션 분할 함수 추가          | `app/lib/ai-trendtube.server.ts`                                   |
| 2   | 비디오 생성 루프 변경 (단일 → N클립 순차, 참조 체이닝)      | `app/features/studio/api/trendtube-step-media.ts`                  |
| 3   | 음악/TTS 길이를 클립 수에 맞춰 조정                         | `app/lib/ai-music.server.ts`, `app/lib/tts.server.ts`              |
| 4   | FFmpeg N클립 concat 대응                                    | `app/lib/video-composer.server.ts`                                 |
| 5   | `TrendTubeMediaStreamEvent`에 `video_clip` 이벤트 추가      | `app/common/types/trendtube.types.ts`                              |
| 6   | `use-trendtube-pipeline.ts` 훅에 video_clip SSE 핸들러 추가 | `app/features/studio/hooks/use-trendtube-pipeline.ts`              |
| 7   | TrendTube 결과 UI에서 클립별 재생 지원                      | `trendtube-results-display.tsx`, `trendtube-pipeline-progress.tsx` |

#### 검증

```bash
npm run typecheck && npm run lint
# 30초 나레이션 → 4개 클립 생성 확인 (SSE: video_clip 1 → 2 → 3 → 4)
# trendtube_media 레코드에 clipNumber 1, 2, 3, 4 확인
# 합성 영상이 모든 클립 이어붙인 길이인지 확인
```

#### 원본 상세 참조

[SE §7.1 Phase A-6: TrendTube 8초 단위 단계적 비디오 생성](studio-enhancement-plan.md#a-6-trendtube-8초-단위-단계적-비디오-생성), [SE Phase 1G](studio-enhancement-plan.md#phase-1g-trendtube-8초-단계적-비디오-생성-우선순위-중간)

---

### Phase A-C: Pre-Production + Project 경량화

> **원본**: [AO Phase C](project-studio-ai-optimization-plan.md#phase-c-pre-production--project-경량화) | **배치**: Batch 4 | **선행**: S-0A | **난이도**: 높음

#### 목표

Studio에 Pre-Production 단계를 신설하여 hooks, scriptGuidelines, seoKeywords 생성을 전담시키고, Project AI Generator를 9→6개 필드로 경량화한다.

#### 전략적 의의

**구조적 문제 P4 해결의 핵심**. "프로젝트는 기획, 제작은 Studio에서"라는 역할 분리를 완성한다. Project 전체 컨텍스트 + 채널 정보 + 트렌드 스냅샷을 활용한 더 높은 품질의 프로덕션 가이드를 생성할 수 있다.

#### 핵심 작업

| #   | 작업                                                                                           | 영향 파일                                    |
| --- | ---------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | `ai-pre-production.server.ts` 신규 (PreProductionOutput: hooks, scriptGuidelines, seoKeywords) | `app/lib/ai-pre-production.server.ts` (신규) |
| 2   | `ai-project-generator.server.ts` 출력에서 hooks, scriptGuidelines, keywords 제거 (9→6 필드)    | `app/lib/ai-project-generator.server.ts`     |
| 3   | Pre-Production 데이터 CRUD 함수 추가                                                           | `app/common/data/studio.data.server.ts`      |
| 4   | `CreateProjectInput`에서 관련 필드 optional 처리                                               | `app/common/data/project.data.server.ts`     |
| 5   | AI 생성 다이얼로그에서 "대본 가이드" 탭 제거, 결과 리뷰 간소화 (6개 필드만)                    | `ai-project-generator-dialog.tsx`            |
| 6   | Studio Script 페이지에 Pre-Production 단계 UI 추가                                             | `studio-script-page.tsx`                     |

#### 주요 변경 코드 요약

- Project AI: `AIProjectGenerationOutput` 에서 `hooks[]`, `scriptGuidelines`, `keywords[]` 제거 → 출력 토큰 ~40% 절감
- Studio Pre-Production: 별도 AI 호출로 더 풍부한 컨텍스트(채널 구독자 수, 트렌드 세부 정보)를 활용하여 고품질 생성

#### 검증

```bash
npm run typecheck && npm run lint
# Project 생성 → hooks, scriptGuidelines 없이 6개 필드만 반환 확인
# Studio 진입 → Pre-Production 단계에서 hooks/guidelines/keywords 생성 확인
# Pre-Production 결과가 studio_script 테이블에 저장 확인
```

#### 원본 상세 참조

[AO §3.1 Project AI Generator 경량화](project-studio-ai-optimization-plan.md#31-project-ai-generator-경량화), [AO §3.2 Studio Pre-Production 단계 신설](project-studio-ai-optimization-plan.md#32-studio-pre-production-단계-신설)

---

### Phase S-1H: AI 서비스 통합 + `lib/ai/` 분리

> **원본**: [SE Phase 1H](studio-enhancement-plan.md#phase-1h-ai-서비스-레이어-통합--미디어-테이블-정리-우선순위-중간) + [SR §2.2](project-structure-refactoring-plan.md#22-applib-폴더) | **배치**: Batch 4 | **선행**: S-0B | **난이도**: 높음

#### 목표

AI 모델 레지스트리를 중앙화하고, retry를 모든 서비스에 적용하며, AI 서비스 파일들을 `lib/ai/` 서브디렉토리로 분리한다.

#### 전략적 의의

**구조적 문제 P5 해결의 최종 단계**. 모델 변경 시 1개 파일만 수정하면 되고, 모든 AI 호출이 일시적 오류에 대한 자동 재시도를 갖추게 된다. ~50개 파일의 import 경로 변경이 수반되므로 다른 Phase와의 충돌을 최소화하기 위해 Batch 4에 배치한다.

#### 핵심 작업

| #   | 작업                                                                             | 영향 파일                                   |
| --- | -------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | `app/lib/ai/models.server.ts` 신규: `AI_MODELS` 상수 레지스트리                  | 신규 파일                                   |
| 2   | `gemini-client.server.ts` 확장: `getGenAIClient()`, `getGenAIAlphaClient()` 추가 | `gemini-client.server.ts`                   |
| 3   | 모든 AI 서비스 파일에서 모델명 하드코딩 → `AI_MODELS.*` 참조                     | 8개 AI 서비스 파일                          |
| 4   | `ai-video.server.ts`, `ai-music.server.ts`, `tts.server.ts`에 `withRetry()` 적용 | 3개 파일                                    |
| 5   | AI 11파일 + mock → `lib/ai/` 서브디렉토리 이동                                   | ~50개 파일 import 변경                      |
| 6   | `trendtube_media.publicUrl` 컬럼 제거, `mediaAssetId` NOT NULL 강제화            | `studio-trendtube-schema.ts`                |
| 7   | deprecated `trendtube-generate-stream.ts` 삭제 (R-S에서 처리 안 된 경우)         | `trendtube-generate-stream.ts`, `routes.ts` |

#### 검증

```bash
npm run typecheck && npm run lint
# 모델명이 AI_MODELS 상수에만 존재하는지 확인
Grep "veo-3.1-generate-preview" app/lib/   # ai/models.server.ts에만 존재
Grep "gemini-2.5-flash" app/lib/           # ai/models.server.ts에만 존재
# retry 적용 확인
Grep "withRetry" app/lib/ai/video.server.ts   # 존재
Grep "withRetry" app/lib/ai/music.server.ts   # 존재
Grep "withRetry" app/lib/ai/tts.server.ts     # 존재
```

#### 원본 상세 참조

[SE §3.4 AI 서비스 아키텍처 통합](studio-enhancement-plan.md#34-ai-서비스-아키텍처-통합), [SE Phase 1H](studio-enhancement-plan.md#phase-1h-ai-서비스-레이어-통합--미디어-테이블-정리-우선순위-중간), [SR §2.2 lib/ AI 서비스 서브디렉토리 분리](project-structure-refactoring-plan.md#22-applib-폴더)

---

### Batch 5: 마무리

---

### Phase A-D: 데이터 마이그레이션 + deprecated 정리

> **원본**: [AO Phase D](project-studio-ai-optimization-plan.md#phase-d-데이터-마이그레이션--정리) | **배치**: Batch 5 | **선행**: A-C 안정화 | **난이도**: 중간

#### 목표

Phase A-C에서 Studio Pre-Production으로 이동한 프로덕션 가이드 필드(hooks, scriptGuidelines)를 Project 테이블에서 최종 제거한다.

#### 전략적 의의

**구조적 문제 P4 해결의 마무리**. @deprecated 표기된 컬럼들의 최종 제거로 스키마를 정리한다.

#### 핵심 작업

| #   | 작업                                                                           | 영향 파일                                         |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| 1   | 기존 Project의 hooks/scriptGuidelines 데이터를 Studio로 마이그레이션 (필요 시) | 마이그레이션 SQL                                  |
| 2   | `project-schema.ts`에서 deprecated 컬럼 제거                                   | `app/features/project/project-schema.ts`          |
| 3   | `project.data.server.ts`에서 제거된 컬럼 참조 정리                             | `app/common/data/project.data.server.ts`          |
| 4   | Project 페이지에서 hooks/scriptGuidelines 관련 폼 필드 제거                    | `new-project-page.tsx`, `project-detail-page.tsx` |

#### 검증

```bash
npm run typecheck && npm run lint
Grep "hooks" app/features/project/   # project-schema에서 제거 확인
Grep "scriptGuidelines" app/features/project/   # 제거 확인
npm run db:migrate  # 마이그레이션 성공
```

#### 원본 상세 참조

[AO §7 구현 로드맵 Phase D](project-studio-ai-optimization-plan.md#phase-d-데이터-마이그레이션--정리)

---

## 5. Phase 2+ 미래 로드맵

아래 항목은 전면 재구축(Phase 1) 완료 후 진행한다.

### Studio 확장

| Phase | 기능                | 설명                                                |
| ----- | ------------------- | --------------------------------------------------- |
| 2A    | Subtitles 자동 생성 | Script `content` → TTS → `studio_subtitle`          |
| 2B    | SEO 자동 생성       | Script `content` + `keywords` → `studio_seo`        |
| 2C    | B-Roll 자동 매칭 UI | `keywords` 기반 Pexels/Pixabay API 연동             |
| 2D    | Rough Cut 타임라인  | Scene Video + B-Roll → 자동 타임라인 배치 + 편집 UI |
| 2E    | Thumbnail AI 생성   | Storyboard 이미지 기반 + 텍스트 오버레이            |
| 2F    | Export 렌더링       | FFmpeg 서버사이드 → YouTube 업로드                  |

### 플랫폼 확장

| 기능                     | 설명                                                                 |
| ------------------------ | -------------------------------------------------------------------- |
| 저장된 아이디어 통합     | Project 대시보드 "저장된 아이디어" 탭, 트렌드 탭 "아이디어 Hub" 통합 |
| AI Playground            | AI 호출 프롬프트 미세 조정 가능한 Playground 기능                    |
| 내 채널 컨텐츠 기반 생성 | 기존 컨텐츠 분석 → 프로젝트 생성                                     |
| TrendTube 고도화         | 이미지, 동영상에서 생성하기. 내 채널 재생목록에서 생성하기           |
| AI 사용량 추적           | 모든 AI 호출 시 사용량 데이터 저장 → 비용 예측/통제                  |
| 외부 API 연동            | ElevenLabs (Speech-to-Speech), CapCut, Vrew, OpenClaw                |

### 운영 개선

| 기능                     | 설명                                   |
| ------------------------ | -------------------------------------- |
| 만료 데이터 삭제         | `cleanupExpiredIdeas()` cron 호출 구현 |
| audit_log 활용           | 감사 로그 조회 UI 및 활용 방안         |
| AI 모델별 API key 세분화 | 요금 분석을 위한 key 분리              |

---

## 6. 리스크 관리 및 검증 전략

### 6.1 공통 검증 프로토콜

모든 Phase 완료 시 아래 검증을 수행한다:

```bash
# 1. 타입 & 린트 (필수)
npm run typecheck && npm run lint

# 2. 프로덕션 빌드 (배치 완료 시)
npm run build

# 3. 변경된 함수/타입/컬럼명 참조 검색 (0개 확인)
Grep "<제거된_식별자>" app/

# 4. 스키마 변경 시
npm run db:migrate
# Supabase Dashboard에서 테이블/컬럼 확인
```

### 6.2 배치별 검증 체크포인트

| Batch      | 검증 포인트                                                                               |
| ---------- | ----------------------------------------------------------------------------------------- |
| **0 완료** | `npm run build` 성공, 모든 테이블 정상 생성, Dead Code 0개                                |
| **1 완료** | Studio 세션 생성/아카이브 동작, TrendTube 미디어가 Storage에 저장, Coloring 메뉴 미표시   |
| **2 완료** | Script 7/7 메타데이터 DB 저장, Storyboard 순차 이미지 생성 + 참조 체이닝 동작             |
| **3 완료** | Scene Video 실제 생성 (MOCK 아님), TrendTube→Studio import 동작, TrendTube 결과 자동 로딩 |
| **4 완료** | N클립 비디오 생성, Pre-Production 단계 동작, AI 모델명이 중앙 레지스트리에만 존재         |
| **5 완료** | Project.hooks/scriptGuidelines 컬럼 제거, 전체 빌드 성공                                  |

### 6.3 롤백 전략

| 시나리오                  | 롤백 방법                                                                        |
| ------------------------- | -------------------------------------------------------------------------------- |
| F-0 Clean Rebuild 실패    | Supabase SQL Editor에서 생성된 SQL 직접 실행. `__drizzle_migrations` 수동 INSERT |
| 마이그레이션 실패         | Supabase SQL Editor에서 `app/drizzle/migrations/0000_*.sql` 직접 실행            |
| Phase 구현 중 심각한 오류 | Git branch 기반 롤백 (각 Batch를 별도 branch로 관리 권장)                        |
| AI API 변경               | `AI_MODELS` 레지스트리 1곳만 수정하면 전체 반영 (S-1H 완료 후)                   |

---

## 7. 부록

### 7.1 원본 문서 매핑 테이블

> 각 원본 문서의 Phase/섹션이 통합 계획서의 어느 Phase에 매핑되는지 추적한다.

| 원본 문서 | 원본 Phase/섹션                               | 통합 Phase |
| --------- | --------------------------------------------- | ---------- |
| **DB**    | §4 Clean Rebuild 전체                         | **F-0**    |
| **SR**    | §3 긴급 (보안), §3 즉시 실행                  | **F-1**    |
| **SE**    | Phase 0A (세션 도입)                          | **S-0A**   |
| **SE**    | Phase 0B (Storage 통합)                       | **S-0B**   |
| **AO**    | Phase A (컨텍스트 빌더)                       | **A-A**    |
| **SE**    | Phase 1D (Enum/Coloring)                      | **S-1D**   |
| **SR**    | §3 단기                                       | **R-S**    |
| **SE**    | Phase 1A (Script 메타)                        | **S-1A**   |
| **SE**    | Phase 1B (Storyboard)                         | **S-1B**   |
| **SE**    | Phase 1C (Scene Video)                        | **S-1C**   |
| **SE**    | Phase 1E (TT→Studio)                          | **S-1E**   |
| **SE**    | Phase 1F (TT 결과 재접근)                     | **S-1F**   |
| **AO**    | Phase B (TT 컨텍스트)                         | **A-B**    |
| **SE**    | Phase 1G (TT 8초 클립)                        | **S-1G**   |
| **AO**    | Phase C (Pre-Production)                      | **A-C**    |
| **SE**    | Phase 1H (AI 통합) + **SR** §3 중기 (lib/ai/) | **S-1H**   |
| **AO**    | Phase D (deprecated 정리)                     | **A-D**    |

### 7.2 Enum 변경 요약

| 처리            | Enum                                                 | 이유                                                     |
| --------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| **제거**        | `project_tone` (informative, funny, cinematic, vlog) | `content_tone`으로 통합. cinematic→dramatic, vlog→casual |
| **유지** (24개) | 나머지 전체                                          | Phase 2+ Enum 포함, 변경 없음                            |

### 7.3 테이블 변경 요약

| 처리          | 테이블                                                                                                                           | 비고                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **제거** (2)  | `studio_coloring_preset`, `studio_coloring_setting`                                                                              | Dead Code — FFmpeg 컬러 그레이딩 비현실적              |
| **신규** (1)  | `studio_session`                                                                                                                 | TrendTube 패턴 통합, active 1개 (partial unique index) |
| **수정** (7)  | `project`, `studio_script`, `studio_script_segment`, `studio_storyboard`, `studio_video`, `trendtube_media`, `trendtube_session` | 컬럼 추가/제거/변경                                    |
| **유지** (18) | 나머지 전체                                                                                                                      | 변경 없음                                              |
| **최종**      | **27개 테이블**                                                                                                                  | 28 - 2 + 1 = 27                                        |
