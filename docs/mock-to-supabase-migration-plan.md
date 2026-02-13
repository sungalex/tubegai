# Mock 데이터 → Supabase 실제 데이터 고도화 계획

## Context

`app/common/mocks/` 폴더에 3개의 mock 파일이 존재하며, 데이터 레이어 함수와 컴포넌트에서 사용 중.
이를 실제 Supabase DB 쿼리로 교체하고, 완료 후 mock 파일을 삭제한다.

---

## Phase 2+ 스키마 점검 결과

### DB 테이블 존재 현황 (migration 0000에서 생성됨)

| DB 테이블                           | Supabase | Drizzle schema.ts | Drizzle enums.ts            | 비고                        |
| ----------------------------------- | -------- | ----------------- | --------------------------- | --------------------------- |
| `studio_subtitle`                   | ✅       | ✅ 정의됨         | -                           | Mock과 완벽 일치            |
| `studio_seo`                        | ✅       | ✅ 정의됨         | -                           | Mock과 일치 (tags 배열)     |
| `studio_b_roll`                     | ✅       | ❌ 미정의         | ✅ bRollProviderEnum        | TypeScript 스키마 추가 필요 |
| `studio_coloring_preset`            | ✅       | ❌ 미정의         | -                           | TypeScript 스키마 추가 필요 |
| `studio_coloring_setting`           | ✅       | ❌ 미정의         | -                           | TypeScript 스키마 추가 필요 |
| `studio_thumbnail`                  | ✅       | ❌ 미정의         | -                           | TypeScript 스키마 추가 필요 |
| `studio_thumbnail_candidate`        | ✅       | ❌ 미정의         | -                           | TypeScript 스키마 추가 필요 |
| `studio_thumbnail_overlay`          | ✅       | ❌ 미정의         | ❌ thumbnailOverlayTypeEnum | 둘 다 추가 필요             |
| `studio_rough_cut_timeline`         | ✅       | ❌ 미정의         | ❌ timelineTrackTypeEnum    | 둘 다 추가 필요             |
| `studio_rough_cut_timeline_segment` | ✅       | ❌ 미정의         | ❌ timelineResourceTypeEnum | 둘 다 추가 필요             |
| `studio_rough_cut_version`          | ✅       | ❌ 미정의         | -                           | TypeScript 스키마 추가 필요 |

### Mock 데이터 vs DB 스키마 매핑 분석

**B-Roll (`BROLL_VIDEOS`, `BROLL_SCENES`):**

- `BROLL_VIDEOS`는 외부 API(Pexels/Pixabay) 검색 결과 → DB 저장 대상 아님 (API 응답 캐시)
- `BROLL_SCENES`의 "assigned" 개념 → `studio_b_roll` 테이블이 이를 담당
- `BROLL_COLORS` → 순수 UI 상수, DB 불필요

**Subtitles (`SUBTITLES`):**

- Mock: `{id, startTime, endTime, text}`
- DB: `{id, project_id, start_time, end_time, text, created_at}`
- ✅ 완벽 일치

**Color Presets (`COLOR_PRESETS`):**

- Mock: `{id, name, filter: "CSS문자열", previewColor}`
- DB: `{id (text), name, filter_parameters (jsonb)}`
- ⚠️ CSS filter string vs jsonb → seed 데이터로 DB에 삽입 필요
- `previewColor`는 UI 전용 → filter_parameters jsonb에 포함 가능

**Thumbnails (`THUMBNAIL_IMAGES`):**

- Mock: URL 문자열 배열 (AI 생성 후보)
- DB: `studio_thumbnail` + `studio_thumbnail_candidate` (media_asset FK)
- AI 생성 후보 → media_asset에 저장 후 candidate 레코드 생성

**SEO (`SEO_TITLES`, `SEO_TAGS`):**

- Mock: 제안 문자열 배열 (AI 생성)
- DB: `studio_seo` - 최종 선택 값만 저장 (`title` 단일, `tags` 배열)
- AI 제안은 실시간 생성 데이터 → DB에 직접 저장하지 않음

---

## 구현 단계 (Mock 사용처별 단계적 실행)

각 단계 완료 후 `npm run typecheck && npm run lint` 검증하고, 사용자 확인 후 다음 단계 진행.

---

### 단계 1: 상수/설정 파일 분리 + Phase 2+ Drizzle 스키마 정의

**목표:** Mock 파일에서 상수 데이터를 분리하고, Supabase에 이미 존재하는 Phase 2+ 테이블의 Drizzle 스키마를 정의

#### 1-A. 상수 파일 생성

| 신규 파일                        | 이동할 데이터                               | 출처                            |
| -------------------------------- | ------------------------------------------- | ------------------------------- |
| `app/common/constants/colors.ts` | `COLORS`, `LABEL_COLORS`, `buildImageUrl()` | shared-mock.ts, project-mock.ts |
| `app/common/constants/images.ts` | `IMAGES`                                    | shared-mock.ts                  |

#### 1-B. Phase 2+ Drizzle 스키마 추가 (DB 마이그레이션 없음 - 테이블 이미 존재)

파일: `app/drizzle/enums.ts` - 누락된 enum 3개 추가:

```typescript
export const thumbnailOverlayTypeEnum = tubegaiSchema.enum(
  "thumbnail_overlay_type",
  ["text", "image"],
);
export const timelineTrackTypeEnum = tubegaiSchema.enum("timeline_track_type", [
  "video",
  "audio",
]);
export const timelineResourceTypeEnum = tubegaiSchema.enum(
  "timeline_resource_type",
  ["scene", "b_roll", "upload", "audio"],
);
```

파일: `app/features/studio/studio-schema.ts` - Phase 2+ 테이블 정의 추가:

- `bRolls` 테이블 (studio_b_roll)
- `coloringPresets` 테이블 (studio_coloring_preset)
- `coloringSettings` 테이블 (studio_coloring_setting)
- `thumbnails` 테이블 (studio_thumbnail)
- `thumbnailCandidates` 테이블 (studio_thumbnail_candidate)
- `thumbnailOverlays` 테이블 (studio_thumbnail_overlay)
- `roughCutTimelines` 테이블 (studio_rough_cut_timeline)
- `roughCutTimelineSegments` 테이블 (studio_rough_cut_timeline_segment)
- `roughCutVersions` 테이블 (studio_rough_cut_version)
- 각 테이블의 relations 정의

#### 1-C. Color Presets seed 데이터

`studio_coloring_preset` 테이블에 기본 프리셋 삽입 (Supabase SQL Editor 사용):

```sql
INSERT INTO public.studio_coloring_preset (id, name, filter_parameters) VALUES
  ('none', 'Original', '{"filter": "none", "previewColor": "bg-zinc-500"}'),
  ('cinematic', 'Cinematic', '{"filter": "contrast(1.2) saturate(1.1) brightness(0.9) sepia(0.2)", "previewColor": "bg-blue-900"}'),
  ('vibrant', 'Vibrant', '{"filter": "saturate(1.5) contrast(1.1)", "previewColor": "bg-orange-500"}'),
  ('vintage', 'Vintage', '{"filter": "sepia(0.6) contrast(0.9) brightness(1.1)", "previewColor": "bg-yellow-700"}'),
  ('bnw', 'Noir', '{"filter": "grayscale(1) contrast(1.2)", "previewColor": "bg-black"}'),
  ('cool', 'Cool Blues', '{"filter": "hue-rotate(180deg) opacity(0.9)", "previewColor": "bg-cyan-600"}')
ON CONFLICT (id) DO NOTHING;
```

**검증:**

```bash
npm run typecheck && npm run lint
```

---

### 단계 2: `project.data.server.ts` Mock 함수 교체

**목표:** project 데이터 레이어의 mock 반환 함수를 실제 DB 쿼리로 교체

**파일: `app/common/data/project.data.server.ts`**

| 함수                             | 변경 내용                                            |
| -------------------------------- | ---------------------------------------------------- |
| `getLabels(userId)`              | 시그니처에 userId 추가, `db.query.labels.findMany()` |
| `getLabelsWithDetails(userId)`   | userId 추가, labels + projectLabels count 쿼리       |
| `getChannelsWithDetails(userId)` | userId 추가, `db.query.channels.findMany()`          |
| `getLabelColors()`               | import를 `constants/colors.ts`로 변경                |
| `getAIRecommendations()`         | 삭제 (미사용, idea.data.server.ts에 실제 구현)       |
| mock import 블록                 | 전체 삭제                                            |

**`getLabels()` 구현:**

```typescript
export async function getLabels(userId: string): Promise<Label[]> {
  const labelList = await db.query.labels.findMany({
    where: eq(schema.labels.userId, userId),
    orderBy: [asc(schema.labels.name)],
  });
  return labelList.map((label) => ({
    id: label.id,
    name: label.name,
    color: label.color,
  }));
}
```

**`getChannelsWithDetails()` 구현:**

```typescript
export async function getChannelsWithDetails(
  userId: string,
): Promise<Channel[]> {
  const channelList = await db.query.channels.findMany({
    where: eq(schema.channels.userId, userId),
    orderBy: [desc(schema.channels.createdAt)],
  });
  return channelList.map((ch) => ({
    id: ch.id,
    name: ch.name,
    handle: ch.handle ?? "",
    avatar: ch.avatarUrl ?? undefined,
    subscribers:
      ch.subscriberCount != null
        ? formatSubscribers(ch.subscriberCount)
        : undefined,
    videos: ch.videoCount ?? undefined,
    status: ch.status ?? "active",
    lastSynced: ch.lastSyncedAt
      ? formatDistanceToNow(ch.lastSyncedAt, { addSuffix: true })
      : undefined,
  }));
}
```

**영향받는 호출자:**

파일: `app/features/project/pages/new-project-page.tsx`

- Line 117: `getLabels()` → `getLabels(userId)` (userId는 line 114에서 이미 존재)

**검증:**

```bash
npm run typecheck && npm run lint
# /projects/new 페이지에서 라벨 드롭다운 확인
```

---

### 단계 3: YouTube TRENDS_DATA fallback 제거

**목표:** mock TRENDS_DATA 의존 제거

**파일: `app/common/data/youtube.data.server.ts`**

- `import { TRENDS_DATA } from "../mocks/project-mock"` 삭제
- 3곳의 `return TRENDS_DATA` → `return []` 변경
  - API key 없을 때 (line ~365)
  - API 결과 비었을 때 (line ~398)
  - API 에러 시 (line ~417)

**검증:**

```bash
npm run typecheck && npm run lint
# /projects/trends 탭에서 트렌드 표시 확인 (API key 있으면 정상 동작)
```

---

### 단계 4: Scene 페이지 서버사이드 데이터 함수

**목표:** `getSceneSegments()`를 mock에서 실제 DB 쿼리로 교체

**현재 데이터 흐름:**

```typescript
studio-scene-page.tsx (loader)
  → studio.data.ts: getSceneSegments(projectId)
    → SCENE_SEGMENTS (mock 상수 반환)
```

**변경 후 데이터 흐름:**

```typescript
studio-scene-page.tsx (loader)
  → studio.data.server.ts: getSceneSegments(projectId)
    → DB 쿼리: scripts → segments → storyboards → sceneVideos → videoParts
```

**DB → UI 필드 매핑:**

| DB 테이블.필드                            | UI 타입.필드                 | 변환             |
| ----------------------------------------- | ---------------------------- | ---------------- |
| `script_segment.id`                       | `SceneScriptSegment.id`      | 직접             |
| `script_segment.orderIndex`               | `SceneScriptSegment.order`   | +1               |
| `script_segment.content`                  | `SceneScriptSegment.content` | 직접             |
| `storyboard.id`                           | `SceneVideo.sceneId`         | 직접             |
| `storyboard.sceneNumber`                  | `SceneVideo.sceneNumber`     | 직접             |
| `storyboard.description`                  | `SceneVideo.description`     | `?? ""`          |
| `storyboard.duration`                     | `SceneVideo.totalDuration`   | `?? 5`           |
| `mediaAsset.publicUrl` (via imageAssetId) | `SceneVideo.thumbnailUrl`    | `?? ""`          |
| `video_part.id`                           | `VideoPart.id`               | 직접             |
| `video_part.duration`                     | `VideoPart.duration`         | 직접             |
| `video_part.status`                       | `VideoPart.status`           | 직접 (enum 일치) |
| `mediaAsset.publicUrl` (via videoAssetId) | `VideoPart.url`              | optional         |

**Drizzle 릴레이션 체인 (이미 정의됨):**

```md
scripts → segments (many)
storyboards → scriptSegment (one), imageAsset (one), sceneVideo (one)
sceneVideos → parts (many)
videoParts → videoAsset (one)
```

**파일: `app/common/data/studio.data.server.ts`** - 함수 추가:

```typescript
import type {
  SceneScriptSegment,
  SceneVideo,
  VideoPart,
} from "../types/studio.types";

export async function getSceneSegments(
  projectId: string,
): Promise<SceneScriptSegment[]> {
  // 1. Script with segments
  const script = await db.query.scripts.findFirst({
    where: eq(schema.scripts.projectId, projectId),
    with: {
      segments: { orderBy: [asc(schema.scriptSegments.orderIndex)] },
    },
  });
  if (!script || script.segments.length === 0) return [];

  // 2. Storyboards with sceneVideo + videoParts
  const storyboards = await db.query.storyboards.findMany({
    where: eq(schema.storyboards.projectId, projectId),
    orderBy: [asc(schema.storyboards.sceneNumber)],
    with: {
      imageAsset: true,
      sceneVideo: {
        with: {
          parts: { orderBy: [asc(schema.videoParts.partNumber)] },
          videoAsset: true,
        },
      },
    },
  });

  // 3. Group by script segment
  const segmentMap = new Map<string, SceneVideo[]>();
  for (const sb of storyboards) {
    if (!segmentMap.has(sb.scriptSegmentId)) {
      segmentMap.set(sb.scriptSegmentId, []);
    }

    let parts: VideoPart[];
    if (sb.sceneVideo && sb.sceneVideo.parts.length > 0) {
      parts = sb.sceneVideo.parts.map((p) => ({
        id: p.id,
        duration: p.duration,
        status: p.status as VideoPart["status"],
        url: p.videoAsset?.publicUrl ?? undefined,
      }));
    } else {
      // No video/parts yet → default pending part
      parts = [
        {
          id: `pending-${sb.id}`,
          duration: sb.duration ?? 5,
          status: "pending" as const,
        },
      ];
    }

    segmentMap.get(sb.scriptSegmentId)!.push({
      sceneId: sb.id,
      sceneNumber: sb.sceneNumber,
      description: sb.description ?? "",
      thumbnailUrl: sb.imageAsset?.publicUrl ?? "",
      totalDuration: sb.duration ?? 5,
      parts,
    });
  }

  // 4. Build result
  return script.segments.map((seg, idx) => ({
    id: seg.id,
    order: idx + 1,
    content: seg.content,
    scenes: segmentMap.get(seg.id) ?? [],
  }));
}
```

**파일: `app/features/studio/pages/studio-scene-page.tsx`** - import 변경:

```typescript
// Before:
import { getSceneSegments } from "~/common/data/studio.data";
// After:
import { getSceneSegments } from "~/common/data/studio.data.server";
```

**빈 데이터 처리:**

- Storyboard가 없는 프로젝트 → 빈 segments 반환 → scene 페이지에서 빈 상태 표시
- SceneVideo가 없는 storyboard → default pending part 생성

**검증:**

```bash
npm run typecheck && npm run lint
# /studio/scene/:projectId 페이지에서 실제 storyboard 기반 scene 표시 확인
# storyboard가 있는 프로젝트와 없는 프로젝트 모두 테스트
```

---

### 단계 5: StudioProjectSelector 실제 데이터 교체

**목표:** mock 프로젝트 목록 → 실제 DB 프로젝트 데이터

**현재 상태:**

```typescript
studio-project-selector.tsx
  → import { SELECTOR_RECENT_PROJECTS, SELECTOR_ALL_PROJECTS } from "~/common/mocks/studio-mock"
  → UNIQUE_CHANNELS = Set(SELECTOR_ALL_PROJECTS.map(p => p.channel))
  → 클라이언트 사이드에서 직접 mock 데이터 사용
```

#### 변경 방식: API route + useFetcher

이유:

- StudioProjectSelector는 5개 이상의 studio 페이지에서 `!projectId` 일 때 렌더링됨
- 각 페이지 loader에 프로젝트 데이터를 중복 추가하는 것보다 API route가 DRY
- `useFetcher`는 CLAUDE.md에서 비동기 API 호출 권장 패턴
- Phase 2+ 비활성 페이지도 자동으로 혜택

#### 5-A. 서버사이드 함수 추가

파일: `app/common/data/studio.data.server.ts`

```typescript
import type { StudioProject } from "../types/studio.types";
import { formatDistanceToNow } from "date-fns";

const STATUS_DISPLAY_MAP: Record<string, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
  archived: "Archived",
};

export async function getStudioProjects(
  userId: string,
): Promise<StudioProject[]> {
  const projects = await db.query.projects.findMany({
    where: eq(schema.projects.ownerId, userId),
    orderBy: [desc(schema.projects.updatedAt)],
    with: {
      channel: { columns: { name: true } },
      labels: { with: { label: { columns: { name: true } } } },
    },
  });

  return projects.map((p) => ({
    id: p.id,
    title: p.title,
    status: STATUS_DISPLAY_MAP[p.status] ?? p.status,
    lastEdited: formatDistanceToNow(p.updatedAt, { addSuffix: true }),
    progress: p.progress,
    channel: p.channel?.name ?? "",
    labels: p.labels.map((pl) => pl.label.name),
  }));
}
```

#### 5-B. API route 생성

신규 파일: `app/features/studio/api/projects.ts`

```typescript
import { requireAuth } from "~/lib/auth.server";
import { getStudioProjects } from "~/common/data/studio.data.server";
import type { Route } from "./+types/projects";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  const projects = await getStudioProjects(userId);
  return { projects };
}
```

파일: `app/routes.ts` - API route 추가:

```typescript
route("studio/projects", "features/studio/api/projects.ts"),
```

#### 5-C. 컴포넌트 리팩터링

파일: `app/features/studio/components/studio-project-selector.tsx`

변경사항:

1. mock import 삭제 (`SELECTOR_RECENT_PROJECTS`, `SELECTOR_ALL_PROJECTS`)
2. `useFetcher` 추가하여 `/api/studio/projects` 데이터 로드
3. `UNIQUE_CHANNELS`를 실제 데이터에서 동적 계산
4. loading 상태 처리 (skeleton 또는 spinner)
5. 빈 프로젝트 상태 UI 유지 (이미 존재)

```typescript
import { useFetcher } from "react-router";
import type { StudioProject } from "~/common/types/studio.types";

export function StudioProjectSelector({ ... }: StudioProjectSelectorProps) {
  const fetcher = useFetcher<{ projects: StudioProject[] }>();

  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load("/api/studio/projects");
    }
  }, [fetcher]);

  const allProjects = fetcher.data?.projects ?? [];
  const recentProjects = allProjects.slice(0, 5);
  const uniqueChannels = Array.from(new Set(allProjects.map(p => p.channel))).filter(Boolean).sort();

  // ... 기존 filter/sort/pagination 로직은 allProjects 기반으로 동작 (변경 최소화)

  if (fetcher.state === "loading") {
    return <LoadingSkeleton />;
  }
}
```

**검증:**

```bash
npm run typecheck && npm run lint
# /studio/script (projectId 없이) → 프로젝트 선택기에 실제 프로젝트 목록 표시
# /studio/dashboard (projectId 없이) → 프로젝트 선택기 정상 동작
# 프로젝트가 0개인 사용자 → 빈 상태 UI 표시
```

---

### 단계 6: `studio.data.ts` Phase 2+ 함수 교체

**목표:** Phase 2+ mock 함수를 실제 DB 쿼리로 교체 (비활성 라우트이지만 TypeScript 컴파일 유지 필요)

**현재 함수 목록과 교체 방식:**

| 함수                            | Mock 데이터              | 교체 방식                      | DB 테이블                  |
| ------------------------------- | ------------------------ | ------------------------------ | -------------------------- |
| `getScriptSegments()`           | MOCK_SCRIPTS             | 삭제 (server-side 이미 존재)   | studio_script_segment      |
| `getStoryboardSegments()`       | STORYBOARD_SEGMENTS      | 삭제 (server-side 이미 존재)   | studio_storyboard          |
| `getStoryboardScenesPool()`     | STORYBOARD_SCENES_POOL   | 삭제 (server-side 이미 존재)   | studio_storyboard          |
| `getStockVideos()`              | BROLL_VIDEOS             | → 빈 배열 (외부 API 검색 결과) | -                          |
| `getBRollScenes(projectId)`     | BROLL_SCENES             | → DB 쿼리 스텁                 | studio_b_roll              |
| `getBRollColors()`              | BROLL_COLORS             | → constants 파일 이동          | -                          |
| `getSubtitles(projectId)`       | SUBTITLES                | → DB 쿼리                      | studio_subtitle            |
| `getColorPresets()`             | COLOR_PRESETS            | → DB 쿼리                      | studio_coloring_preset     |
| `getThumbnailImages(projectId)` | THUMBNAIL_IMAGES         | → DB 쿼리                      | studio_thumbnail_candidate |
| `getSEOTitles(projectId)`       | SEO_TITLES               | → 빈 배열 (AI 생성 결과)       | -                          |
| `getSEOTags(projectId)`         | SEO_TAGS                 | → DB 쿼리                      | studio_seo                 |
| `getQuickAccessSteps()`         | QUICK_ACCESS_STEPS       | 삭제 (컴포넌트 inline)         | -                          |
| `getSelectorRecentProjects()`   | SELECTOR_RECENT_PROJECTS | 삭제 (단계 5에서 교체)         | -                          |
| `getSelectorAllProjects()`      | SELECTOR_ALL_PROJECTS    | 삭제 (단계 5에서 교체)         | -                          |

**`studio.data.ts` 파일을 `studio.data.server.ts`로 통합:**

Phase 2+ 함수들 중 DB 쿼리가 필요한 것을 `studio.data.server.ts`에 추가:

```typescript
// Subtitles
export async function getSubtitles(
  projectId: string,
): Promise<SubtitleSegment[]> {
  const subs = await db.query.subtitles.findMany({
    where: eq(schema.subtitles.projectId, projectId),
    orderBy: [asc(schema.subtitles.startTime)],
  });
  return subs.map((s) => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    text: s.text,
  }));
}

// Color Presets
export async function getColorPresets(): Promise<ColorPreset[]> {
  const presets = await db.query.coloringPresets.findMany();
  return presets.map((p) => ({
    id: p.id,
    name: p.name,
    filter: (p.filterParameters as { filter: string }).filter ?? "none",
    previewColor:
      (p.filterParameters as { previewColor: string }).previewColor ??
      "bg-zinc-500",
  }));
}

// SEO
export async function getSEOData(projectId: string) {
  const seo = await db.query.seos.findFirst({
    where: eq(schema.seos.projectId, projectId),
  });
  return {
    titles: seo?.title ? [seo.title] : [],
    tags: seo?.tags ?? [],
    description: seo?.description ?? "",
  };
}

// Thumbnails
export async function getThumbnailImages(projectId: string): Promise<string[]> {
  const thumbnail = await db.query.thumbnails.findFirst({
    where: eq(schema.thumbnails.projectId, projectId),
    with: {
      candidates: { with: { imageAsset: true } },
    },
  });
  return (
    (thumbnail?.candidates
      ?.map((c) => c.imageAsset?.publicUrl)
      .filter(Boolean) as string[]) ?? []
  );
}

// B-Roll (assigned to project)
export async function getBRollScenes(projectId: string) {
  const brolls = await db.query.bRolls.findMany({
    where: eq(schema.bRolls.projectId, projectId),
    with: { asset: true, storyboard: true },
  });
  return brolls;
}
```

**`studio.data.ts` 최종 처리:**

- mock import 전체 삭제
- DB 쿼리가 필요한 함수 → `studio.data.server.ts`로 이동 (위 코드)
- 외부 API 결과인 함수 → 빈 배열 반환 스텁
- 미사용 함수 → 삭제
- 이 파일이 비면 삭제

**Phase 2+ 비활성 페이지 import 업데이트:**
비활성 페이지들의 import를 `studio.data.ts` → `studio.data.server.ts`로 변경

**검증:**

```bash
npm run typecheck && npm run lint
# 비활성 라우트의 TypeScript 컴파일 성공 확인
```

---

### 단계 7: Mock 파일 삭제 + 최종 검증

**삭제 대상:**

- `app/common/mocks/project-mock.ts`
- `app/common/mocks/studio-mock.ts`
- `app/common/mocks/shared-mock.ts`
- `app/common/mocks/` 디렉토리

**최종 검증:**

```bash
# 1. Mock import 잔존 확인
grep -r "mocks/" app/ --include="*.ts" --include="*.tsx"

# 2. 타입 & 린트
npm run typecheck && npm run lint

# 3. 개발 서버 실행
npm run dev
```

**수동 검증 체크리스트:**

- [ ] `/projects/new` - 라벨 드롭다운에 실제 DB 라벨 표시
- [ ] `/projects/trends` - 트렌드 표시 (API key 있으면 정상, 없으면 빈 상태)
- [ ] `/studio/script` (projectId 없이) - 프로젝트 선택기에 실제 프로젝트 목록
- [ ] `/studio/scene/:projectId` - 실제 storyboard 기반 scene 표시
- [ ] `/studio/dashboard` (projectId 없이) - 프로젝트 선택기 정상 동작

---

## 수정 파일 전체 목록

| 파일                                                         | 변경                                                      | 단계  |
| ------------------------------------------------------------ | --------------------------------------------------------- | ----- |
| `app/common/constants/colors.ts`                             | **신규**                                                  | 1     |
| `app/common/constants/images.ts`                             | **신규**                                                  | 1     |
| `app/drizzle/enums.ts`                                       | 수정 (enum 3개 추가)                                      | 1     |
| `app/features/studio/studio-schema.ts`                       | 수정 (Phase 2+ 테이블 9개 + relations)                    | 1     |
| `app/common/data/project.data.server.ts`                     | 수정 (mock → DB 쿼리)                                     | 2     |
| `app/features/project/pages/new-project-page.tsx`            | 수정 (getLabels에 userId)                                 | 2     |
| `app/common/data/youtube.data.server.ts`                     | 수정 (fallback 제거)                                      | 3     |
| `app/common/data/studio.data.server.ts`                      | 수정 (getSceneSegments, getStudioProjects, Phase 2+ 함수) | 4,5,6 |
| `app/features/studio/pages/studio-scene-page.tsx`            | 수정 (import 변경)                                        | 4     |
| `app/features/studio/api/projects.ts`                        | **신규**                                                  | 5     |
| `app/routes.ts`                                              | 수정 (API route 추가)                                     | 5     |
| `app/features/studio/components/studio-project-selector.tsx` | 수정 (useFetcher)                                         | 5     |
| `app/common/data/studio.data.ts`                             | 삭제 또는 대폭 축소                                       | 6     |
| Phase 2+ 비활성 페이지들 (6개)                               | 수정 (import 경로 변경)                                   | 6     |
| `app/common/mocks/*.ts`                                      | **삭제** (3개)                                            | 7     |
