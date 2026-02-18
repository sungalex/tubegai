# Studio 영상 생성 파이프라인 재설계 + CRUD 버그 수정

> 작성일: 2026-02-19
> 범위: AI 서비스 / API 라우트 / 데이터 레이어 / UI 페이지 / 컴포넌트

---

## 1. 현황 및 목표

### 현재 파이프라인 (4단계)

```
[Pre-Production] → [Script] → [Storyboard + 이미지 일괄] → [Scene Video 다중 파트]
```

**문제점**:

- Pre-Production이 별도 AI 호출로 분리 → 불필요한 비용 + 화면 간 데이터 연계 끊김
- Storyboard에서 텍스트 + 이미지를 일괄 순차 생성 → 느리고 제어 불가
- Scene Video가 다중 파트로 분할 → 복잡한 UI/로직, 실용성 낮음
- 스크립트 편집기에 프로젝트 정보(영상 타입, 길이, 톤)가 매핑되지 않는 버그
- 스크립트 편집기에 프로젝트 컨텍스트 정보(채널, 타겟 오디언스, 카테고리, 트렌드 등)가 UI에 표시되지 않음
- 씬 비디오가 Storage에 저장되지만 페이지 재방문 시 표시되지 않는 버그
- 이미지/비디오 재생성 시 이전 버전을 불러올 수 없음 + 히스토리에서 선택하여 사용하는 기능 없음
- 영상 타입(쇼츠/릴스 vs 일반 영상)에 따른 가로/세로 비율 자동 전환이 없음 (UI, 이미지, 비디오 모두 16:9 하드코딩)
- 씬 비디오 플레이 버튼/다운로드 버튼이 동작하지 않음 (URL 누락 + onClick 핸들러 미구현)
- 씬 비디오 생성 진행률이 `Math.random()`으로 표시됨 (실제 진행률 미연동)
- 미동작 설정 버튼 존재: PDF Export(Storyboard), Download Timeline(Scene), includeHook/CTA 토글(Script — 항상 포함으로 변경 예정)

### 목표 파이프라인 (3단계)

```
[Project Context]
       ↓
[1. Script 생성] ── 단일 AI 호출 ──→ ScriptSegment[]
       │  (AI 내부에서 hooks/guidelines를 먼저 수립 → 대본에 반영)
       ↓
[2. Storyboard] ── AI 텍스트 스트리밍 → 씬별 개별 이미지 생성 (사용자 클릭)
       ↓
[3. Scene Video] ── 씬별 8초 영상 1개 생성 (사용자 클릭)
```

---

## 2. 버그 수정 (Critical)

### 2-1. 씬 비디오 로딩 버그

**증상**: 비디오 생성 후 다른 화면 이동 → 돌아오면 영상 미표시
**근본 원인**: `getSceneSegments()` ([studio.data.server.ts:765-769](../app/common/data/studio.data.server.ts))

```typescript
// 현재 (버그) — url 누락, videoAsset 관계 미로드
parts: { orderBy: [asc(schema.videoParts.partNumber)] },  // ❌ with: { videoAsset: true } 없음

parts = sb.sceneVideo.parts.map((p) => ({
  id: p.id,
  duration: p.duration,
  status: p.status as VideoPart["status"],
  // ❌ url: p.videoAsset?.publicUrl 누락
}));
```

**수정**:

1. Line 749: `parts` 쿼리에 `with: { videoAsset: true }` 추가
2. Line 765-769: 매핑에 `url: p.videoAsset?.publicUrl` 추가

### 2-2. 최신 비디오 선택 보장 버그

**증상**: 비디오 재생성 시 Drizzle `one()` 관계가 순서 미보장 → 구버전 비디오 표시 가능
**근본 원인**: `storyboardsRelations.sceneVideo: one(sceneVideos)` — 같은 storyboardId에 여러 sceneVideo가 있을 때 어떤 것을 반환할지 미정의

**수정**: `getSceneSegments()`에서 sceneVideos를 별도 쿼리하여 `createdAt DESC`로 최신 것만 사용

```typescript
// sceneVideos를 별도로 쿼리 (최신 순)
const allVideos = await db.query.sceneVideos.findMany({
  where: eq(schema.sceneVideos.projectId, projectId),
  orderBy: [desc(schema.sceneVideos.createdAt)],
  with: {
    parts: {
      orderBy: [asc(schema.videoParts.partNumber)],
      with: { videoAsset: true },
    },
  },
});
// storyboardId → 최신 video 맵
const latestVideoMap = new Map<string, (typeof allVideos)[0]>();
for (const v of allVideos) {
  if (!latestVideoMap.has(v.storyboardId)) {
    latestVideoMap.set(v.storyboardId, v);
  }
}
```

### 2-3. 스크립트 편집기 프로젝트 정보 미매핑 버그

**증상**: 영상 타입, 영상 길이, 톤/스타일이 프로젝트 설정과 무관하게 하드코딩된 기본값 사용
**근본 원인**: [studio-script-page.tsx:219-220](../app/features/studio/pages/studio-script-page.tsx)

```typescript
// 현재 — 프로젝트 정보 무시, 하드코딩 기본값
const [tone, setTone] = useState<string>("informative");
const [length, setLength] = useState<string>("medium");
```

**수정**: 프로젝트의 `contentTone`, `videoLength`, `type` 필드를 읽어 초기값으로 매핑

```typescript
// 프로젝트 contentTone → UI tone 매핑
const mapProjectToneToUI = (contentTone: string | null): string => {
  const toneMap: Record<string, string> = {
    casual: "casual",
    professional: "professional",
    dramatic: "dramatic",
    funny: "funny",
    educational: "informative",
  };
  return contentTone ? (toneMap[contentTone] ?? "informative") : "informative";
};

// 프로젝트 type/videoLength → UI length 매핑
const mapProjectLengthToUI = (
  type: string | null,
  videoLength: string | null,
): string => {
  if (type === "short") return "short";
  if (videoLength) {
    // videoLength가 분 단위 문자열일 경우 파싱
    const minutes = parseInt(videoLength);
    if (!isNaN(minutes)) {
      if (minutes <= 2) return "short";
      if (minutes <= 10) return "medium";
      return "long";
    }
  }
  return "medium";
};

const [tone, setTone] = useState<string>(
  mapProjectToneToUI(project.contentTone),
);
const [length, setLength] = useState<string>(
  mapProjectLengthToUI(project.type, project.videoLength),
);
```

### 2-4. 씬 비디오 플레이/다운로드 버튼 미동작 버그

**증상**: 씬 생성 화면에서 생성 완료된 비디오의 플레이 버튼, 다운로드 버튼이 동작하지 않음
**근본 원인**: 3중 버그 (데이터 누락 + UI 핸들러 미구현)

**버그 1 (PRIMARY)**: `getSceneSegments()` VideoPart 매핑에서 `url` 필드 누락

- [studio.data.server.ts:765-769](../app/common/data/studio.data.server.ts) — `url: p.videoAsset?.publicUrl` 미매핑
- `scene-video-card.tsx:87`의 조건 `part.status === "completed" && part.url`이 항상 falsy → 버튼 자체가 렌더링 안됨
- **→ 버그 2-1 수정으로 함께 해결됨** (videoAsset 관계 로드 + url 매핑 추가)

**버그 2**: 플레이 버튼에 `onClick` 핸들러 없음

- [scene-video-card.tsx:95-99](../app/features/studio/components/scene-video-card.tsx) — hover overlay에 `cursor-pointer` 있으나 `onClick` 미구현

```typescript
// 현재 (버그) — onClick 핸들러 없음
<div className="absolute inset-0 flex items-center justify-center bg-black/30 ...">
  <div className="w-12 h-12 ...">
    <Play className="h-5 w-5 fill-white text-white ml-0.5" />
  </div>
</div>
```

**수정**: 비디오 URL을 새 탭에서 열거나, 인라인 `<video>` 플레이어 토글

```typescript
// 방안 1: 인라인 비디오 재생 토글
const [isPlaying, setIsPlaying] = useState(false);

{isPlaying ? (
  <video src={part.url} autoPlay controls className="w-full h-full object-cover" />
) : (
  <div onClick={() => setIsPlaying(true)} className="cursor-pointer ...">
    <Play />
  </div>
)}
```

**버그 3**: 다운로드 버튼에 `onClick`/`href` 없음

- [scene-video-card.tsx:102-106](../app/features/studio/components/scene-video-card.tsx) — `<Button>`에 동작 미연결

```typescript
// 현재 (버그) — 아무 동작 없음
<Button size="icon" variant="secondary" className="h-6 w-6">
  <Download className="h-3 w-3" />
</Button>
```

**수정**: `<a>` 태그로 감싸거나 onClick으로 다운로드 트리거

```typescript
// 수정
<Button size="icon" variant="secondary" className="h-6 w-6" asChild>
  <a href={part.url} download={`scene-${sceneNumber}-part-${partNumber}.mp4`}>
    <Download className="h-3 w-3" />
  </a>
</Button>
```

**수정 파일**: `scene-video-card.tsx` (UI 핸들러 추가) — 데이터 누락은 버그 2-1에서 이미 수정

---

## 3. Phase 1: AI 서비스 수정

### 3-1. Script AI — Pre-Production 내재화

**파일**: `app/lib/ai/script.server.ts`

현재 `pre-production.server.ts`가 별도 AI 호출로 hooks/guidelines/keywords를 생성하고, `script.server.ts`가 이를 컨텍스트로 소비하는 2단계 구조다. 이를 **단일 AI 호출**로 통합하되, hooks/guidelines는 **AI 내부 추론 과정**으로만 활용하고 출력에는 포함하지 않는다.

**핵심 전략**: AI 시스템 프롬프트에 "스크립트 작성 전에 먼저 오프닝 훅 전략, 스크립트 구성 가이드라인, SEO 키워드를 내부적으로 수립하고, 이를 바탕으로 완성도 높은 스크립트를 작성하라"는 지침을 추가한다.

**변경사항**:

- 시스템 프롬프트에 Pre-Production 사고 과정 지침 병합 (내부 추론용)
- **출력 포맷 변경 없음** — 기존과 동일한 `ScriptSegment[]` JSON 배열
- **스트리밍 파서 변경 없음** — 기존 `extractCompleteSegments()` 그대로 사용
- `generateScriptStream()`에서 `preProduction?` 파라미터 제거 (외부 컨텍스트 불필요)
- `ScriptGenerationOptions`에서 `includeHook`/`includeCTA` 제거 (항상 포함)

**AI 출력 스키마** (기존과 동일):

```typescript
// 변경 없음 — ScriptSegment[] 배열
Array<{
  type: "hook" | "intro" | "body" | "cta" | "outro";
  content: string;
  duration: number;
  visualNotes: string;
  emotionalTone: string;
  keywords: string[];
}>;
```

**시스템 프롬프트에 추가할 지침**:

```
## 스크립트 작성 프로세스
대본을 작성하기 전에 다음 3가지를 내부적으로 수립하고 이를 대본에 반영하세요:

1. **오프닝 훅 전략**: 시청자의 클릭을 유도하는 3가지 오프닝 전략을 구상하고,
   가장 효과적인 것을 Hook 세그먼트에 적용하세요.
   (감탄사, 질문, 놀라운 사실 등 활용)

2. **스크립트 가이드라인**: 도입 전략, 핵심 포인트 3-5개, CTA 전략, 마무리 전략을
   수립하고 각 세그먼트에 일관되게 적용하세요.

3. **SEO 키워드**: YouTube 검색 최적화를 위한 키워드 5-10개를 선정하고,
   각 세그먼트의 keywords 필드에 관련 키워드를 배치하세요.

이 사전 기획은 출력에 포함하지 마세요. 오직 최종 세그먼트 배열만 반환합니다.
```

### 3-2. Storyboard AI — 8초 씬 분할

**파일**: `app/lib/ai/storyboard.server.ts`

현재 `density` 파라미터 기반으로 세그먼트당 1-4개 씬을 임의 duration으로 생성한다. 이를 **고정 8초 씬 단위 분할**로 변경한다.

**변경사항**:

- `StoryboardGenerationOptions`에서 `density` 제거
- 시스템 프롬프트: "각 씬은 정확히 8초. 총 씬 수 = ceil(총\_스크립트\_duration / 8)"
- `buildStoryboardPrompt()`에서 총 duration 계산 후 씬 수를 명시
- 모든 씬의 duration을 8로 고정 (마지막 씬 포함)
- 씬의 `visualPrompt`에 이전 단계의 `visualNotes`, `emotionalTone` 반영

### 3-3. Context Builder 정리

**파일**: `app/lib/ai/context-builder.server.ts`

- `PreProductionContext` 타입과 `preProduction?` 파라미터 제거
- `buildProjectContext(project, language)` 시그니처로 단순화 (2개 인자만)

### 3-4. Mock 데이터 업데이트

**파일**: `app/lib/ai/__mocks__/fixtures.ts`

- `MOCK_SCRIPT_SEGMENTS` 유지 (출력 포맷 변경 없음)
- `MOCK_STORYBOARD_SCENES`의 모든 duration을 8로 변경
- `MOCK_PRE_PRODUCTION` 제거 (더 이상 사용하지 않음)

---

## 4. Phase 2: API 라우트 수정

### 4-1. Script Stream API 수정

**파일**: `app/features/studio/api/generate-script-stream.ts`

- `getPreProductionData()` 호출 제거 (Pre-Production은 AI 내부 추론으로 대체)
- **SSE 이벤트 변경 없음** — 기존과 동일: `start` → `segment` × N → `complete`
- `saveScript()` 호출 로직 유지 (segments만 저장, pre-production 데이터 없음)

### 4-2. Pre-Production API 삭제

- **삭제**: `app/features/studio/api/generate-pre-production.ts`
- **routes.ts**: `studio/generate-pre-production` 라우트 제거

### 4-3. Storyboard Stream API 수정

**파일**: `app/features/studio/api/generate-storyboard-stream.ts`

- **이미지 생성 루프 전체 제거** (현재 line 129-212)
- `generateImage`, `generatePlaceholderImage`, `uploadStudioMedia`, `createMediaAsset`, `linkImageToStoryboard` import 제거
- SSE 이벤트: `start` → `scene` × N → `text_complete` → `complete`
- `image_progress`, `image_complete`, `image_error` 이벤트 제거

### 4-4. Scene Image API 유지 + 소폭 수정

**파일**: `app/features/studio/api/generate-scene-image.ts`

- 기존 per-scene 이미지 생성 로직 유지
- 선택적 `referenceSceneId` 파라미터 추가: 이전 씬의 이미지를 reference로 활용하는 체이닝 지원

### 4-5. Scene Video Stream API 단순화

**파일**: `app/features/studio/api/generate-scene-video-stream.ts`

- `createSceneVideoParts()` 호출 제거
- 파트 루프 제거 → 단일 8초 클립 생성
- `updateSceneVideoPart()` → `updateSceneVideoAsset()` (새 함수)으로 교체
- SSE 이벤트 단순화: `start` → `generating` → `complete`/`error`

### 4-6. 미디어 히스토리 API (신규)

| 파일                              | 타입   | 용도                                 |
| --------------------------------- | ------ | ------------------------------------ |
| `api/scene-video-history.ts`      | loader | storyboardId의 비디오 버전 목록 반환 |
| `api/select-scene-video.ts`       | action | 특정 비디오 버전을 최신으로 선택     |
| `api/storyboard-image-history.ts` | loader | sceneId의 이미지 버전 목록 반환      |
| `api/select-storyboard-image.ts`  | action | 특정 이미지를 씬에 연결              |

---

## 5. Phase 3: 데이터 레이어 수정

### 5-1. studio.data.server.ts

**파일**: `app/common/data/studio.data.server.ts`

**제거할 함수**:

- `createSceneVideoParts()` — 파트 분할 불필요
- `updateSceneVideoPart()` — 파트 없음
- `getPreProductionData()` — Pre-Production 단계 삭제
- `savePreProduction()` — Pre-Production 단계 삭제
- `updatePreProductionStatus()` — Pre-Production 단계 삭제

**수정할 함수**:

- `getSceneSegments()` — **버그 수정 포함**: parts에 videoAsset 로드 + url 매핑 + 최신 video 선택 보장
- `saveScript()` — 기존 로직 유지 (segments 저장)
- `createSceneVideo()` — 기존 유지

**추가할 함수**:

- `updateSceneVideoAsset(videoId, { status, videoAssetId })` — 비디오 에셋 직접 연결
- `getSceneVideoHistory(storyboardId)` — 비디오 히스토리 조회
- `selectSceneVideo(videoId)` — 특정 비디오를 최신으로 설정 (createdAt 업데이트)

### 5-2. media.data.server.ts

**파일**: `app/common/data/media.data.server.ts`

**추가할 함수**:

- `getStoryboardImageHistory(storyboardId)` — 이미지 히스토리 조회

```typescript
export async function getStoryboardImageHistory(storyboardId: string) {
  const scene = await db.query.storyboards.findFirst({
    where: eq(schema.storyboards.id, storyboardId),
    columns: { projectId: true, sceneNumber: true },
  });
  if (!scene) return [];

  const pattern = `%storyboard/scene-${scene.sceneNumber}_%`;
  const assets = await db.query.mediaAssets.findMany({
    where: and(
      eq(schema.mediaAssets.projectId, scene.projectId),
      eq(schema.mediaAssets.type, "image"),
      like(schema.mediaAssets.storageKey, pattern),
    ),
    orderBy: [desc(schema.mediaAssets.createdAt)],
  });

  return assets.map((a) => ({
    id: a.id,
    publicUrl: a.publicUrl,
    createdAt: a.createdAt,
  }));
}
```

### 5-3. studio.types.ts

**파일**: `app/common/types/studio.types.ts`

- `VideoPart` 인터페이스 제거
- `SceneVideo` 단순화:

  ```typescript
  export interface SceneVideo {
    sceneId: string;
    sceneNumber: number;
    description: string;
    thumbnailUrl: string;
    duration: number; // always 8
    status: "pending" | "generating" | "completed" | "failed";
    videoUrl?: string;
  }
  ```

- `SceneScriptSegment.scenes` 타입을 단순화된 `SceneVideo[]`로 변경

### 5-4. Schema 수정

**파일**: `app/features/studio/studio-schema.ts`

- `videoParts` 테이블 및 `videoPartsRelations` 관계 deprecated 처리
- `sceneVideosRelations`에서 `parts: many(videoParts)` 제거
- 파괴적 마이그레이션은 하지 않음 (테이블은 유지, 코드에서 미사용)

---

## 6. Phase 4: UI 재설계

### 6-1. Script 페이지 재설계

**파일**: `app/features/studio/pages/studio-script-page.tsx`

**제거**:

- `PreProductionCard` 컴포넌트 및 import
- loader에서 `getPreProductionData()`, `getTrendTubeSessions()` 호출
- 사이드바의 Pre-Production 카드 영역
- Pre-Production 관련 상태 및 핸들러 전체
- `includeHook`/`includeCTA` 토글 UI (항상 포함으로 변경 → 설정 불필요)

**버그 수정**:

- `tone` 초기값을 `project.contentTone`에서 매핑
- `length` 초기값을 `project.type` / `project.videoLength`에서 매핑

**수정**:

- 3열 → 2열 레이아웃 단순화 (좌: 세그먼트 에디터, 우: 생성 옵션 + 미세 조정)
- Pre-Production은 AI 내부 추론이므로 UI에 별도 표시 불필요
- 헤더에 프로젝트 컨텍스트 요약 표시 (읽기 전용: channel, type, category, contentTone, targetAudience, difficulty, videoLength, trendSnapshot)

**UI 레이아웃** (3열 → 2열):

```
┌──────────────────────────────────────────────────────┐
│ 헤더: 프로젝트명 + 예상 길이 + 저장 버튼            │
├───────────────────────────┬──────────────────────────┤
│ 스크립트 세그먼트 에디터  │ AI 스크립트 생성 옵션     │
│ (세그먼트 목록)           │ - 톤/스타일 (프로젝트 연동)│
│                           │ - 영상 길이 (프로젝트 연동)│
│ - hook                    │ - 추가 지시사항           │
│ - intro                   │ - 고급 AI 파라미터        │
│ - body                    │ - [스크립트 생성] 버튼    │
│ - cta                     │──────────────────────────│
│ - outro                   │ 세그먼트 미세 조정         │
│                           │ - 문법 개선               │
│                           │ - 간결하게                │
│                           │ - 내용 확장               │
└───────────────────────────┴──────────────────────────┘
```

### 6-2. Storyboard 페이지 재설계

**파일**: `app/features/studio/pages/studio-storyboard-page.tsx`

**제거**:

- 씬 밀도(density) 슬라이더
- 이미지 스트리밍 관련 상태/이벤트 (`image_progress`, `image_complete`, `image_error`)
- 일괄 이미지 생성 진행 표시
- PDF Export 버튼 (미동작, Phase 2+ 기능)

**수정**:

- 스토리보드 생성은 **텍스트만** SSE로 스트리밍
- 각 씬 카드에 **"이미지 생성" 버튼** 표시 (이미지 없을 때 prominent하게)
- 씬 duration 항상 8s로 고정 표시
- 이미지 히스토리 기능 추가 (씬 카드에서 이전 이미지 불러오기)

**UI 레이아웃**:

```
┌──────────────────────────────────────────────────────┐
│ 헤더: 총 씬 수 / 예상 길이 + 저장                    │
├───────────────────────────┬──────────────────────────┤
│ 세그먼트별 씬 그리드       │ AI 스토리보드 생성        │
│                           │ - 비주얼 스타일 (4종)     │
│ [세그먼트 1 헤더]         │ - 화면 비율               │
│ ┌────────┐ ┌────────┐    │ - 고급: 카메라, 조명      │
│ │ 씬 1   │ │ 씬 2   │    │ - [스토리보드 생성] 버튼  │
│ │ 8s     │ │ 8s     │    │──────────────────────────│
│ │[이미지]│ │[생성▶] │    │ 씬 미세 조정              │
│ │[히스토리]│[      ]│    │ - 씬 설명 편집            │
│ └────────┘ └────────┘    │ - 비주얼 프롬프트 편집    │
│                           │ - [이미지 생성] 버튼      │
│ [세그먼트 2 헤더]         │ - [이미지 히스토리] 버튼  │
│ ┌────────┐ ┌────────┐    │ - [씬 삭제] 버튼          │
│ │ 씬 3   │ │ 씬 4   │    │                           │
│ └────────┘ └────────┘    │                           │
└───────────────────────────┴──────────────────────────┘
```

### 6-3. Scene 페이지 재설계

**파일**: `app/features/studio/pages/studio-scene-page.tsx`

**제거**:

- `VideoGeneratorSidebar` 컴포넌트 (모든 비디오 생성 + 미사용 AI 모델 선택)
- `handleGenerateAll()` 함수
- 파트 분할 표시 (Part 1, Part 2...)
- `handleRegeneratePart()` 함수
- Download Timeline Export 버튼 (미동작, Phase 2+ 기능)

**수정**:

- 각 씬 카드에 인라인 "영상 생성" 버튼
- `SceneVideoCard` 단순화: 파트 루프 제거, 단일 비디오 영역
- 비디오 히스토리 기능 추가 (이전 영상 불러오기)

**UI 레이아웃** (사이드바 제거, 풀 너비):

```
┌──────────────────────────────────────────────────────┐
│ 헤더: 씬 비디오 생성                                  │
├──────────────────────────────────────────────────────┤
│ [세그먼트 1]                                          │
│ ┌─────────────┐ ┌──────────────────────────────────┐ │
│ │ 스크립트     │ │ ┌──────────┐ ┌──────────┐       │ │
│ │ 컨텍스트     │ │ │ 씬 1     │ │ 씬 2     │       │ │
│ │ (sticky)    │ │ │ [▶ 생성]  │ │ [완료 ✓]  │       │ │
│ │             │ │ │ 8s       │ │ [히스토리]│       │ │
│ └─────────────┘ │ └──────────┘ └──────────┘       │ │
│                 └──────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### 6-4. 컴포넌트 수정

**`scene-video-card.tsx`** — 전면 재작성:

- `VideoPart` 타입 제거
- parts 루프 제거, 단일 비디오 영역만 렌더링
- 상태: pending → `[영상 생성]` 버튼 / generating → 프로그레스 / completed → 비디오 플레이어 / failed → 재시도
- **Mock 제거**: `Math.random()` 진행률 → 실제 SSE progress 이벤트에서 수신한 값 사용, "Mock Video Player" 주석 제거
- **플레이/다운로드 버튼 수정**: 인라인 `<video>` 재생 토글 + `<a download>` 다운로드 (버그 2-4)
- **히스토리 버튼**: completed 상태일 때 Popover로 이전 버전 목록 표시

**`storyboard-scene-card.tsx`** — 소폭 수정:

- duration 항상 8s 표시
- 이미지 없을 때 "이미지 생성" 버튼 prominent하게 표시
- **히스토리 버튼**: 이미지 hover 시 Re-Generate 옆에 History 버튼 → Popover로 이전 이미지 격자

---

## 7. Phase 5: 파일 삭제 및 정리

### 삭제할 파일

| 파일                                                         | 사유                               |
| ------------------------------------------------------------ | ---------------------------------- |
| `app/lib/ai/pre-production.server.ts`                        | script.server.ts 프롬프트에 내재화 |
| `app/features/studio/api/generate-pre-production.ts`         | API 라우트 불필요                  |
| `app/features/studio/components/pre-production-card.tsx`     | 독립 UI 제거                       |
| `app/features/studio/components/video-generator-sidebar.tsx` | "모든 비디오 생성" 제거            |

### routes.ts 수정

- `studio/generate-pre-production` 라우트 제거
- 신규 API 라우트 4개 등록 (히스토리 + 선택)

---

## 8. 수정 파일 전체 목록

| 파일                                                       | 변경 규모 | 핵심 변경                                                                           |
| ---------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------- |
| `app/lib/ai/script.server.ts`                              | **대**    | Pre-Production 내재화 (프롬프트에 사고 과정 지침 추가), preProduction 파라미터 제거 |
| `app/lib/ai/storyboard.server.ts`                          | **대**    | 8초 씬 분할 프롬프트, density 제거                                                  |
| `app/lib/ai/context-builder.server.ts`                     | **소**    | PreProductionContext 제거                                                           |
| `app/lib/ai/__mocks__/fixtures.ts`                         | **중**    | Mock 데이터 업데이트                                                                |
| `app/features/studio/api/generate-script-stream.ts`        | **중**    | getPreProductionData() 제거, 기존 SSE 이벤트 유지                                   |
| `app/features/studio/api/generate-storyboard-stream.ts`    | **대**    | 이미지 생성 루프 제거                                                               |
| `app/features/studio/api/generate-scene-image.ts`          | **소**    | referenceSceneId 추가                                                               |
| `app/features/studio/api/generate-scene-video-stream.ts`   | **대**    | 파트 로직 제거, 단일 클립                                                           |
| `app/features/studio/api/scene-video-history.ts`           | **신규**  | 비디오 히스토리 loader                                                              |
| `app/features/studio/api/select-scene-video.ts`            | **신규**  | 비디오 버전 선택 action                                                             |
| `app/features/studio/api/storyboard-image-history.ts`      | **신규**  | 이미지 히스토리 loader                                                              |
| `app/features/studio/api/select-storyboard-image.ts`       | **신규**  | 이미지 버전 선택 action                                                             |
| `app/features/studio/pages/studio-script-page.tsx`         | **대**    | PreProductionCard 제거, 프로젝트 정보 매핑 버그 수정, 3열→2열                       |
| `app/features/studio/pages/studio-storyboard-page.tsx`     | **대**    | density 제거, 이미지 스트리밍 제거, per-scene 이미지, 히스토리                      |
| `app/features/studio/pages/studio-scene-page.tsx`          | **대**    | 사이드바 제거, 파트 제거, per-scene 비디오, 히스토리                                |
| `app/features/studio/components/scene-video-card.tsx`      | **대**    | 파트 루프 제거, 단일 비디오, 히스토리 버튼                                          |
| `app/features/studio/components/storyboard-scene-card.tsx` | **중**    | duration 8s, 이미지 생성 버튼, 히스토리 버튼                                        |
| `app/features/studio/studio-schema.ts`                     | **소**    | videoParts deprecated                                                               |
| `app/common/data/studio.data.server.ts`                    | **대**    | 버그 수정 + 파트 함수 제거 + Pre-Production 함수 제거 + 히스토리 함수 추가          |
| `app/common/data/media.data.server.ts`                     | **소**    | getStoryboardImageHistory() 추가                                                    |
| `app/common/types/studio.types.ts`                         | **중**    | VideoPart 제거, SceneVideo 단순화                                                   |
| `app/routes.ts`                                            | **소**    | pre-production 라우트 제거 + 히스토리 라우트 4개 추가                               |

---

## 9. AI 프롬프트 최적화 요약

| 단계       | 입력                                                                                   | 출력                                                                                                              | 모델                       |
| ---------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Script     | Project context (title, description, audience, tone, trend, channel)                   | `ScriptSegment[]` — `[{type, content, duration, visualNotes, emotionalTone, keywords}]` (기존과 동일)             | gemini-2.5-flash           |
| Storyboard | Script segments (content 300자 + duration + visualNotes + emotionalTone) + 스타일 설정 | `[{scriptSegmentId, sceneNumber, orderIndex, description, visualPrompt, duration:8, emotionalTone, cameraAngle}]` | gemini-2.5-flash           |
| Image      | Scene visualPrompt + 스타일 키워드 + optional referenceImage                           | PNG Buffer                                                                                                        | gemini-3-pro-image-preview |
| Video      | Scene visualPrompt + referenceImageBuffer                                              | MP4 Buffer (8초)                                                                                                  | veo-3.1-generate-preview   |

---

## 10. 구현 순서

```
1단계: 버그 수정 (즉시 효과)
  ├── getSceneSegments() 비디오 URL 로딩 버그 수정
  ├── 최신 비디오 선택 보장
  └── 스크립트 편집기 프로젝트 정보 매핑

2단계: AI 서비스 (Phase 1)
  ├── script.server.ts — Pre-Production 내재화
  ├── storyboard.server.ts — 8초 씬 분할
  └── context-builder.server.ts — 정리

3단계: API 라우트 (Phase 2)
  ├── generate-script-stream.ts — 수정
  ├── generate-storyboard-stream.ts — 이미지 루프 제거
  ├── generate-scene-video-stream.ts — 파트 제거
  ├── 히스토리 API 4개 신규
  └── generate-pre-production.ts — 삭제

4단계: 데이터 레이어 (Phase 3)
  ├── studio.data.server.ts — 함수 정리 + 히스토리 추가
  ├── media.data.server.ts — 이미지 히스토리
  ├── studio.types.ts — 타입 단순화
  └── studio-schema.ts — videoParts deprecated

5단계: UI (Phase 4)
  ├── studio-script-page.tsx — 2열 레이아웃 + 프로젝트 매핑
  ├── studio-storyboard-page.tsx — 텍스트만 스트리밍 + 이미지 히스토리
  ├── studio-scene-page.tsx — 사이드바 제거 + 비디오 히스토리
  ├── scene-video-card.tsx — 단일 비디오 + 히스토리
  └── storyboard-scene-card.tsx — 8s + 이미지 히스토리

6단계: 정리 (Phase 5)
  ├── 파일 삭제 4개
  └── routes.ts 업데이트
```

---

## 11. 검증 방법

```bash
# 1. 타입 & 린트 체크
npm run typecheck
npm run lint

# 2. 버그 수정 검증
# → 씬 비디오 생성 → 다른 페이지 이동 → 돌아오기 → 영상 표시 확인
# → 스크립트 편집기 진입 → 톤/길이가 프로젝트 설정값과 일치하는지 확인

# 3. 파이프라인 E2E 테스트
# → 프로젝트 선택 → Script 생성 → Storyboard 생성 → 씬별 이미지 생성 → 씬별 비디오 생성

# 4. 히스토리 기능 검증
# → 같은 씬의 이미지 2회 생성 → History → 이전 이미지 선택 → 전환 확인
# → 같은 씬의 비디오 2회 생성 → History → 이전 비디오 선택 → 전환 확인

# 5. GEMINI_MOCK=true 모드에서 전체 플로우 테스트
# Mock 데이터로 UI/DB 저장 검증

# 6. DB 데이터 검증
# studio_script + studio_script_segment: 세그먼트 저장 확인
# studio_storyboard: 모든 씬 duration=8 확인
# studio_video: videoAssetId 직접 연결 확인
# studio_video_part: 새 데이터 미생성 확인
```
