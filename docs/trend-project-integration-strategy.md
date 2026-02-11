# 실시간 트렌드-프로젝트 통합 전략

> TubeGAI에서 실시간 트렌드 정보를 프로젝트에 효과적으로 연결하고 AI 기반 콘텐츠 생성의 기초 데이터로 활용하기 위한 전략 문서

## 목차

1. [현재 상태 분석](#1-현재-상태-분석)
2. [트렌드 필터링 고도화](#2-트렌드-필터링-고도화)
3. [트렌드-프로젝트 관계 개선](#3-트렌드-프로젝트-관계-개선)
4. [AI 기반 프로젝트 정보 자동 생성](#4-ai-기반-프로젝트-정보-자동-생성)
5. [데이터 흐름 설계](#5-데이터-흐름-설계)
6. [스키마 변경 제안](#6-스키마-변경-제안)
7. [구현 우선순위](#7-구현-우선순위)

---

## 1. 현재 상태 분석

### 1.1 트렌드 데이터 구조

```
trends 테이블
├── 기본 정보: title, description, category, tags[]
├── 메트릭: viewsCount, growthRate, viewCount, likeCount, commentCount
├── 소스: source (youtube_api | ai_generated | manual), externalId, externalUrl
├── 캐시: fetchedAt (15분 캐시)
└── 프로젝트 연결: usedForProjectId (FK → projects)
```

### 1.2 프로젝트 데이터 구조

```
projects 테이블
├── 기본 정보: title, description, topic, type, tone
├── AI 컨텍스트
│   ├── hooks[], targetAudience, estimatedViews
│   ├── difficulty, contentTone, videoLength
│   └── aiContext (JSONB): keywords, styleNotes, scriptGuidelines, targetLength, callToAction
├── 트렌드 연결 (현재)
│   ├── basedOnTrend (TEXT) - 트렌드 제목만 저장
│   └── basedOnTrendId (INTEGER) - 레거시, UUID 아님
└── 아이디어 연결: sourceIdeaId (FK → saved_ideas)
```

### 1.3 현재 한계점

| 문제 | 영향 |
|------|------|
| 트렌드 필터링 제한적 (regionCode만) | 사용자가 원하는 트렌드를 찾기 어려움 |
| 트렌드-프로젝트 연결이 텍스트 기반 | 트렌드 업데이트 시 프로젝트에 반영 불가 |
| `basedOnTrendId`가 INTEGER | trends.id(UUID)와 타입 불일치 |
| 트렌드 메타데이터 미활용 | AI 생성 시 충분한 컨텍스트 제공 불가 |

---

## 2. 트렌드 필터링 고도화

### 2.1 필터링 옵션 확장

```typescript
interface TrendFilterOptions {
  // 지역/언어
  regionCode: string;        // KR, US, JP, etc.
  language?: string;         // ko, en, ja, etc.

  // 카테고리
  category?: YouTubeCategory; // Film, Music, Gaming, etc.

  // 메트릭 기반
  minViews?: number;         // 최소 조회수
  minGrowthRate?: number;    // 최소 성장률
  publishedAfter?: Date;     // 게시일 기준

  // 콘텐츠 유형
  videoDuration?: 'short' | 'medium' | 'long';

  // 테마/키워드
  keywords?: string[];       // 포함해야 할 키워드
  excludeKeywords?: string[]; // 제외할 키워드
}
```

### 2.2 YouTube API 파라미터 확장

```typescript
// youtube.data.server.ts 개선
async function getYouTubeTrends(filters: TrendFilterOptions) {
  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    chart: 'mostPopular',
    regionCode: filters.regionCode,
    maxResults: '50', // 필터링 후 결과 보장을 위해 증가

    // 추가 파라미터
    ...(filters.category && { videoCategoryId: filters.category }),
    ...(filters.publishedAfter && {
      publishedAfter: filters.publishedAfter.toISOString()
    }),
  });

  // videoDuration 필터 (Search API 필요)
  // keywords 필터 (Search API 필요)
}
```

### 2.3 하이브리드 소스 전략

```
┌─────────────────────────────────────────────────────────────────┐
│                    트렌드 데이터 소스                              │
├─────────────────────────────────────────────────────────────────┤
│  1. YouTube API (실시간)                                         │
│     - 15분 캐시                                                  │
│     - 지역별 인기 동영상                                          │
│     - 카테고리별 필터링                                           │
│                                                                 │
│  2. Supabase 캐시 (저장된 트렌드)                                 │
│     - 사용자별 관심 트렌드 저장                                    │
│     - AI 추천 트렌드 (24시간 캐시)                                │
│     - 이전에 프로젝트로 전환한 트렌드                               │
│                                                                 │
│  3. 사용자 정의 트렌드                                            │
│     - 수동 입력 (source = 'manual')                              │
│     - 경쟁사 분석 결과                                            │
│     - 커뮤니티 추천                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 트렌드 카테고리 확장

```typescript
// drizzle/enums.ts에 추가
export const trendCategoryEnum = tubegaiSchema.enum('trend_category', [
  // YouTube 공식 카테고리
  'film_animation',
  'autos_vehicles',
  'music',
  'pets_animals',
  'sports',
  'travel_events',
  'gaming',
  'people_blogs',
  'comedy',
  'entertainment',
  'news_politics',
  'howto_style',
  'education',
  'science_tech',
  'nonprofits_activism',

  // 확장 카테고리 (AI 분류)
  'ai_tech',
  'lifestyle',
  'finance',
  'health_fitness',
  'food_cooking',
  'diy_crafts',
]);
```

---

## 3. 트렌드-프로젝트 관계 개선

### 3.1 관계 스키마 개선

```typescript
// 1. basedOnTrendId를 UUID로 변경
basedOnTrendId: uuid('based_on_trend_id')
  .references(() => trends.id, { onDelete: 'set null' }),

// 2. 트렌드 스냅샷 저장 (트렌드 삭제/변경 시에도 원본 정보 유지)
trendSnapshot: jsonb('trend_snapshot').$type<TrendSnapshot>(),
```

```typescript
interface TrendSnapshot {
  // 트렌드 생성 시점의 정보 캡처
  capturedAt: string;
  title: string;
  category: string;
  tags: string[];
  viewsCount: string;
  growthRate: string;
  externalUrl?: string;
  thumbnailUrl?: string;
}
```

### 3.2 다중 트렌드 참조 지원

프로젝트가 여러 트렌드를 조합해서 만들어질 수 있음:

```typescript
// 새로운 테이블: project_trends (M:N)
export const projectTrends = tubegaiSchema.table('project_trend', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  trendId: uuid('trend_id')
    .references(() => trends.id, { onDelete: 'set null' }),

  // 관계 메타데이터
  role: text('role').default('primary'), // 'primary' | 'secondary' | 'reference'
  relevanceScore: integer('relevance_score'), // 0-100

  // 연결 시점의 트렌드 스냅샷
  snapshot: jsonb('snapshot').$type<TrendSnapshot>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 3.3 트렌드 활용 추적

```typescript
// trends 테이블 확장
usageCount: integer('usage_count').default(0), // 프로젝트 생성 횟수
lastUsedAt: timestamp('last_used_at'),         // 마지막 사용 시점
```

---

## 4. AI 기반 프로젝트 정보 자동 생성

### 4.1 트렌드 → 프로젝트 전환 시 AI 생성 항목

```typescript
interface AIGeneratedProjectContext {
  // 기본 정보 (트렌드 기반 생성)
  title: string;              // 트렌드 제목 기반 최적화된 제목
  description: string;        // 영상 설명 초안
  topic: string;              // 핵심 주제

  // 콘텐츠 전략
  hooks: string[];            // 오프닝 훅 3-5개
  targetAudience: string;     // 타겟 시청자 상세
  estimatedViews: string;     // 예상 조회수 범위

  // 스크립트 가이드라인
  scriptGuidelines: {
    openingStrategy: string;  // 도입부 전략
    mainPoints: string[];     // 핵심 포인트
    ctaStrategy: string;      // CTA 전략
    closingStrategy: string;  // 마무리 전략
  };

  // 제작 가이드
  suggestedTone: ContentTone;
  suggestedLength: VideoLength;
  suggestedDifficulty: Difficulty;

  // SEO/최적화
  keywords: string[];         // 검색 키워드
  hashtags: string[];         // 해시태그 추천
  thumbnailConcepts: string[]; // 썸네일 컨셉
}
```

### 4.2 AI 프롬프트 설계

```typescript
// lib/ai-project-generator.server.ts
const systemPrompt = `
당신은 유튜브 콘텐츠 전략가입니다.
트렌드 데이터를 분석하여 프로젝트 정보를 생성합니다.

입력 데이터:
- 트렌드 제목, 카테고리, 태그
- 조회수, 성장률
- 사용자 채널 정보 (있는 경우)
- 사용자 선호 설정 (언어, 톤, 영상 길이)

출력 항목:
1. 최적화된 영상 제목 (검색 친화적)
2. 설명 초안 (150자 이내)
3. 오프닝 훅 3개
4. 핵심 주제 키워드
5. 타겟 시청자 프로필
6. 스크립트 가이드라인
7. 추천 해시태그 5개
`;

async function generateProjectFromTrend(
  trend: Trend,
  options: GenerationOptions
): Promise<AIGeneratedProjectContext> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: buildPrompt(trend, options)
    }]
  });

  return parseAIResponse(response);
}
```

### 4.3 단계별 AI 활용

```
┌─────────────────────────────────────────────────────────────────┐
│  단계 1: 트렌드 선택                                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 트렌드 분석 AI                                           │    │
│  │ - 트렌드 성장 가능성 예측                                  │    │
│  │ - 경쟁도 분석                                            │    │
│  │ - 사용자 채널과의 적합성 점수                              │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  단계 2: 프로젝트 생성                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 프로젝트 컨텍스트 AI                                       │    │
│  │ - 제목/설명/훅 생성                                       │    │
│  │ - 타겟 시청자 분석                                        │    │
│  │ - 스크립트 가이드라인                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  단계 3: 스크립트 작성 (Studio)                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 스크립트 AI (기존)                                        │    │
│  │ - 프로젝트 컨텍스트 활용                                   │    │
│  │ - 훅, 톤, 타겟 시청자 반영                                 │    │
│  │ - 트렌드 키워드 자연스럽게 포함                             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. 데이터 흐름 설계

### 5.1 전체 흐름도

```
                    ┌─────────────────┐
                    │  YouTube API    │
                    └────────┬────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────────┐
│                      트렌드 수집/필터링                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │  지역 필터   │    │ 카테고리 필터 │    │ 메트릭 필터  │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
└───────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────────┐
│                      trends 테이블                             │
│  - 15분 캐시 (YouTube)                                         │
│  - 사용자 저장 트렌드 (영구)                                     │
│  - AI 추천 (24시간)                                            │
└───────────────────────────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │ 아이디어 생성 │  │ 프로젝트 생성 │  │  트렌드 저장  │
     └──────┬─────┘  └──────┬─────┘  └────────────┘
            │               │
            ▼               ▼
     ┌────────────┐  ┌────────────────────────────────────────┐
     │saved_ideas │  │              projects                   │
     └──────┬─────┘  │  ┌────────────────────────────────────┐ │
            │        │  │ AI 생성 컨텍스트                      │ │
            │        │  │ - hooks, targetAudience             │ │
            │        │  │ - scriptGuidelines                  │ │
            │        │  │ - trendSnapshot                     │ │
            │        │  └────────────────────────────────────┘ │
            │        │  ┌────────────────────────────────────┐ │
            │        │  │ 트렌드 참조 (project_trends)         │ │
            │        │  │ - primary trend                     │ │
            │        │  │ - secondary trends                  │ │
            │        │  └────────────────────────────────────┘ │
            │        └────────────────────────────────────────┘
            │                        │
            └────────────────────────┤
                                     ▼
                          ┌────────────────────┐
                          │   Studio (스크립트)  │
                          │   AI 컨텍스트 활용   │
                          └────────────────────┘
```

### 5.2 프로젝트 생성 시 데이터 매핑

```typescript
// 트렌드 → 프로젝트 필드 매핑
const trendToProjectMapping = {
  // 직접 매핑
  'trend.title'       → 'project.basedOnTrend',
  'trend.id'          → 'project.basedOnTrendId',
  'trend.category'    → 'project.topic',
  'trend.tags'        → 'project.aiContext.keywords',
  'trend.thumbnailUrl'→ 'project.thumbnailUrl' (optional),

  // AI 생성 매핑
  'AI.title'          → 'project.title',
  'AI.description'    → 'project.description',
  'AI.hooks'          → 'project.hooks',
  'AI.targetAudience' → 'project.targetAudience',
  'AI.estimatedViews' → 'project.estimatedViews',
  'AI.scriptGuidelines' → 'project.aiContext.scriptGuidelines',
  'AI.suggestedTone'  → 'project.contentTone',
  'AI.suggestedLength'→ 'project.videoLength',
  'AI.suggestedDifficulty' → 'project.difficulty',
  'AI.keywords'       → 'project.aiContext.keywords',

  // 스냅샷 저장
  'trend.*'           → 'project.trendSnapshot',
};
```

### 5.3 Studio 스크립트 생성 시 컨텍스트 활용

```typescript
// lib/ai-script.server.ts 개선
interface ScriptGenerationContext {
  // 프로젝트 기본 정보
  title: string;
  description: string;
  topic: string;

  // 트렌드 기반 정보 (핵심!)
  trendSnapshot?: TrendSnapshot;
  relatedTrends?: TrendSnapshot[];

  // AI 생성 컨텍스트
  hooks: string[];
  targetAudience: string;
  contentTone: ContentTone;
  videoLength: VideoLength;
  scriptGuidelines?: {
    openingStrategy: string;
    mainPoints: string[];
    ctaStrategy: string;
    closingStrategy: string;
  };
  keywords: string[];

  // 채널 정보
  channel?: {
    name: string;
    subscriberCount: number;
    previousContent?: string[];
  };
}

function buildScriptPrompt(context: ScriptGenerationContext): string {
  return `
## 영상 정보
- 제목: ${context.title}
- 주제: ${context.topic}
- 톤: ${context.contentTone}
- 길이: ${context.videoLength}

## 트렌드 배경
${context.trendSnapshot ? `
- 기반 트렌드: ${context.trendSnapshot.title}
- 카테고리: ${context.trendSnapshot.category}
- 현재 조회수: ${context.trendSnapshot.viewsCount}
- 성장률: ${context.trendSnapshot.growthRate}
- 관련 키워드: ${context.trendSnapshot.tags.join(', ')}
` : '직접 기획된 콘텐츠'}

## 타겟 시청자
${context.targetAudience}

## 오프닝 훅 (선택하여 사용)
${context.hooks.map((h, i) => `${i + 1}. ${h}`).join('\n')}

## 스크립트 가이드라인
${context.scriptGuidelines ? `
- 도입부: ${context.scriptGuidelines.openingStrategy}
- 핵심 포인트: ${context.scriptGuidelines.mainPoints.join(', ')}
- CTA: ${context.scriptGuidelines.ctaStrategy}
- 마무리: ${context.scriptGuidelines.closingStrategy}
` : '자유 형식'}

## 포함 키워드
${context.keywords.join(', ')}

위 정보를 바탕으로 ${context.videoLength} 길이의 유튜브 스크립트를 작성해주세요.
`;
}
```

---

## 6. 스키마 변경 제안

### 6.1 trends 테이블 확장

```typescript
// trend-schema.ts 수정
export const trends = tubegaiSchema.table('trend', {
  // 기존 필드...

  // 필터링 지원 필드 추가
  regionCode: text('region_code').default('KR'),
  languageCode: text('language_code').default('ko'),
  videoDuration: text('video_duration'), // 'short' | 'medium' | 'long'

  // 활용 추적
  usageCount: integer('usage_count').default(0),
  lastUsedAt: timestamp('last_used_at'),

  // 사용자 관심 트렌드 (북마크)
  isSaved: boolean('is_saved').default(false),
  savedByUserId: uuid('saved_by_user_id').references(() => users.id),
  savedAt: timestamp('saved_at'),
});
```

### 6.2 projects 테이블 수정

```typescript
// project-schema.ts 수정
export const projects = tubegaiSchema.table('project', {
  // 기존 필드...

  // 트렌드 관계 개선 (UUID로 변경)
  basedOnTrendId: uuid('based_on_trend_id')
    .references(() => trends.id, { onDelete: 'set null' }),

  // 트렌드 스냅샷 (원본 정보 보존)
  trendSnapshot: jsonb('trend_snapshot').$type<TrendSnapshot>(),

  // AI 생성 스크립트 가이드라인 (기존 aiContext에 통합 가능)
  scriptGuidelines: jsonb('script_guidelines').$type<ScriptGuidelines>(),
});
```

### 6.3 project_trends 테이블 추가 (다중 트렌드)

```typescript
// project-schema.ts에 추가
export const projectTrends = tubegaiSchema.table('project_trend', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  trendId: uuid('trend_id')
    .references(() => trends.id, { onDelete: 'set null' }),

  role: text('role').default('primary'), // 'primary' | 'secondary' | 'reference'
  relevanceScore: integer('relevance_score'),
  snapshot: jsonb('snapshot').$type<TrendSnapshot>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projectTrendsRelations = relations(projectTrends, ({ one }) => ({
  project: one(projects, {
    fields: [projectTrends.projectId],
    references: [projects.id],
  }),
  trend: one(trends, {
    fields: [projectTrends.trendId],
    references: [trends.id],
  }),
}));
```

### 6.4 타입 정의

```typescript
// common/types/trend.types.ts
export interface TrendSnapshot {
  capturedAt: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  viewsCount: string;
  growthRate: string;
  externalId?: string;
  externalUrl?: string;
  thumbnailUrl?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}

export interface ScriptGuidelines {
  openingStrategy: string;
  mainPoints: string[];
  ctaStrategy: string;
  closingStrategy: string;
  targetLength?: string;
  keyMessages?: string[];
}

export interface TrendFilterOptions {
  regionCode?: string;
  languageCode?: string;
  category?: string;
  minViews?: number;
  minGrowthRate?: number;
  videoDuration?: 'short' | 'medium' | 'long';
  keywords?: string[];
  excludeKeywords?: string[];
  publishedAfter?: Date;
  source?: 'youtube_api' | 'ai_generated' | 'manual' | 'saved';
}
```

---

## 7. 구현 우선순위

### Phase 1: 관계 개선 (필수)

| 순서 | 작업 | 영향도 |
|------|------|--------|
| 1.1 | `basedOnTrendId`를 UUID로 마이그레이션 | 높음 |
| 1.2 | `trendSnapshot` JSONB 컬럼 추가 | 높음 |
| 1.3 | 프로젝트 생성 시 스냅샷 자동 저장 | 높음 |
| 1.4 | 프로젝트 상세에서 트렌드 정보 표시 | 중간 |

### Phase 2: AI 컨텍스트 생성

| 순서 | 작업 | 영향도 |
|------|------|--------|
| 2.1 | `generateProjectFromTrend` AI 함수 구현 | 높음 |
| 2.2 | 프로젝트 생성 폼에 AI 생성 옵션 추가 | 높음 |
| 2.3 | `scriptGuidelines` 컬럼 추가 및 활용 | 중간 |
| 2.4 | Studio 스크립트 생성 시 컨텍스트 전달 | 높음 |

### Phase 3: 필터링 고도화

| 순서 | 작업 | 영향도 |
|------|------|--------|
| 3.1 | trends 테이블 필터링 필드 추가 | 중간 |
| 3.2 | YouTube API 호출 파라미터 확장 | 중간 |
| 3.3 | 트렌드 필터 UI 구현 | 중간 |
| 3.4 | 트렌드 북마크 기능 | 낮음 |

### Phase 4: 다중 트렌드 지원

| 순서 | 작업 | 영향도 |
|------|------|--------|
| 4.1 | `project_trends` M:N 테이블 생성 | 중간 |
| 4.2 | 프로젝트에 여러 트렌드 연결 UI | 중간 |
| 4.3 | 트렌드 조합 분석 AI | 낮음 |

---

## 부록: API 엔드포인트 설계

### 트렌드 API

```
GET  /api/trends
     ?region=KR
     &language=ko
     &category=gaming
     &minViews=100000
     &duration=short
     &source=youtube_api

POST /api/trends/save
     { trendId: string }

POST /api/trends/:id/generate-project
     { options: GenerationOptions }
```

### 프로젝트 API 확장

```
POST /api/projects
     {
       // 기존 필드...
       generateFromTrend: boolean,
       trendId?: string,
       aiGenerationOptions?: {
         generateTitle: boolean,
         generateHooks: boolean,
         generateGuidelines: boolean,
       }
     }

GET  /api/projects/:id/trend-context
     // 프로젝트의 트렌드 컨텍스트 조회
```

---

## 결론

이 전략을 통해:

1. **트렌드 활용도 극대화**: 실시간 트렌드의 모든 메타데이터를 프로젝트에 보존하고 활용
2. **AI 컨텍스트 강화**: 트렌드 기반으로 자동 생성된 훅, 가이드라인이 스크립트 생성 품질 향상
3. **데이터 일관성**: UUID 기반 관계와 스냅샷으로 안정적인 데이터 연결
4. **확장성**: 다중 트렌드 조합, 고급 필터링으로 다양한 콘텐츠 전략 지원
