# Idea-Trend 매핑 방안

## 현재 상황

### 데이터 구조

**idea 테이블:**
```sql
basedOnTrends  text[]    -- 트렌드 제목들 (예: ["AI 기술 트렌드", "ChatGPT 활용법"])
trendId        uuid      -- 단일 트렌드 ID (현재 모두 NULL)
```

**trend 테이블:**
```sql
id             uuid      -- PK
title          text      -- 트렌드 제목
externalId     text      -- YouTube video ID
```

### 문제점

1. `basedOnTrends`에는 트렌드 **제목**만 저장됨
2. `trendId`는 모두 NULL - 트렌드와의 직접 연결 불가
3. AI 추천 생성 시 입력받는 `TrendItem.trendUuid`가 저장되지 않음

### 데이터 흐름

```
[트렌드 분석 페이지]
    ↓
TrendItem[] (trendUuid 포함)
    ↓
[AI 추천 생성] → Gemini API → AIGeneratedRecommendation
    ↓                              (basedOnTrends: 제목만)
[DB 저장]
    → basedOnTrends: 제목 배열 ✓
    → trendId: NULL ✗
```

---

## 해결 방안

### 방안 1: 단기 - 매핑 로직 추가 (스키마 변경 없음)

**구현:**
- `saveGeneratedRecommendations` 함수에 입력 trends 전달
- AI 응답의 `basedOnTrends` 제목과 입력 trends 매칭
- 첫 번째 매칭되는 트렌드의 UUID를 `trendId`에 저장

**장점:**
- 스키마 변경 불필요
- 마이그레이션 불필요
- 즉시 적용 가능

**단점:**
- 하나의 trendId만 저장 가능 (여러 트렌드 기반 아이디어는 첫 번째만)
- 제목 매칭 시 불일치 가능성

**코드 변경:**

```typescript
// idea.data.server.ts

async function saveGeneratedRecommendations(
  userId: string,
  recommendations: AIGeneratedRecommendation[],
  inputTrends: TrendItem[]  // 추가
): Promise<void> {
  // ... existing code ...

  // 제목으로 트렌드 UUID 매핑
  const trendTitleToUuid = new Map(
    inputTrends
      .filter(t => t.trendUuid)
      .map(t => [t.title.toLowerCase(), t.trendUuid])
  );

  for (const rec of recommendations) {
    // basedOnTrends에서 첫 번째 매칭 트렌드 찾기
    const matchedTrendId = rec.basedOnTrends
      ?.map(title => trendTitleToUuid.get(title.toLowerCase()))
      .find(uuid => uuid);

    await db.insert(schema.ideas).values({
      // ... existing fields ...
      trendId: matchedTrendId || null,  // 추가
    });
  }
}
```

---

### 방안 2: 장기 - trendIds 배열 추가 (스키마 변경)

**스키마 변경:**
```sql
ALTER TABLE tubegai.idea
  ADD COLUMN trend_ids uuid[] DEFAULT '{}';

COMMENT ON COLUMN tubegai.idea.trend_ids IS
  'Array of trend UUIDs this idea is based on';
```

**장점:**
- 여러 트렌드와의 관계 저장 가능
- 정확한 FK 관계 유지
- 트렌드 삭제 시 추적 가능

**단점:**
- 마이그레이션 필요
- 기존 데이터 업데이트 필요

**코드 변경:**

```typescript
// project-schema.ts
export const ideas = tubegaiSchema.table("idea", {
  // ... existing fields ...
  trendId: uuid("trend_id"),  // 유지 (하위 호환)
  trendIds: uuid("trend_ids").array().default([]),  // 추가
});

// idea.data.server.ts
async function saveGeneratedRecommendations(
  userId: string,
  recommendations: AIGeneratedRecommendation[],
  inputTrends: TrendItem[]
): Promise<void> {
  const trendTitleToUuid = new Map(
    inputTrends
      .filter(t => t.trendUuid)
      .map(t => [t.title.toLowerCase(), t.trendUuid!])
  );

  for (const rec of recommendations) {
    const matchedTrendIds = (rec.basedOnTrends ?? [])
      .map(title => trendTitleToUuid.get(title.toLowerCase()))
      .filter((uuid): uuid is string => !!uuid);

    await db.insert(schema.ideas).values({
      // ... existing fields ...
      trendId: matchedTrendIds[0] || null,
      trendIds: matchedTrendIds,
    });
  }
}
```

---

### 방안 3: 기존 데이터 마이그레이션

기존 `basedOnTrends`(제목)으로 `trend` 테이블 조회하여 ID 매핑:

```sql
-- 기존 데이터 업데이트 (제목으로 매칭)
UPDATE tubegai.idea i
SET trend_id = t.id
FROM tubegai.trend t
WHERE i.trend_id IS NULL
  AND i.based_on_trends IS NOT NULL
  AND array_length(i.based_on_trends, 1) > 0
  AND t.title ILIKE '%' || i.based_on_trends[1] || '%';
```

---

---

## 방안 A: Junction 테이블 상세 설계 (idea_trend)

### 스키마 설계

기존 `project_label` 패턴을 따르는 설계:

```typescript
// project-schema.ts

/**
 * Junction table: Idea ↔ Trend (N:M 관계)
 * - 하나의 아이디어가 여러 트렌드를 기반으로 생성될 수 있음
 * - 하나의 트렌드가 여러 아이디어에 참조될 수 있음
 */
export const ideaTrends = tubegaiSchema.table(
  "idea_trend",
  {
    ideaId: uuid("idea_id")
      .references(() => ideas.id, { onDelete: "cascade" })
      .notNull(),
    trendId: uuid("trend_id")
      .references(() => trends.id, { onDelete: "cascade" })
      .notNull(),
    // 메타데이터 (선택적)
    isPrimary: boolean("is_primary").default(false), // 주요 트렌드 표시
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.ideaId, table.trendId] }),
  })
);

export const ideaTrendsRelations = relations(ideaTrends, ({ one }) => ({
  idea: one(ideas, {
    fields: [ideaTrends.ideaId],
    references: [ideas.id],
  }),
  trend: one(trends, {
    fields: [ideaTrends.trendId],
    references: [trends.id],
  }),
}));

// ideas relation 업데이트
export const ideasRelations = relations(ideas, ({ one, many }) => ({
  user: one(users, { ... }),
  usedForProject: one(projects, { ... }),
  ideaTrends: many(ideaTrends),  // 추가
}));

// trends relation 업데이트
export const trendsRelations = relations(trends, ({ one, many }) => ({
  user: one(users, { ... }),
  ideaTrends: many(ideaTrends),  // 추가
}));
```

### 마이그레이션 SQL

```sql
-- 0022_idea_trend_junction.sql

-- 1. Junction 테이블 생성
CREATE TABLE tubegai.idea_trend (
  idea_id uuid NOT NULL REFERENCES tubegai.idea(id) ON DELETE CASCADE,
  trend_id uuid NOT NULL REFERENCES tubegai.trend(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  created_at timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY (idea_id, trend_id)
);

-- 2. 인덱스 생성 (역방향 조회 최적화)
CREATE INDEX idx_idea_trend_trend_id ON tubegai.idea_trend(trend_id);

-- 3. 기존 데이터 마이그레이션 (based_on_trends → idea_trend)
INSERT INTO tubegai.idea_trend (idea_id, trend_id, is_primary, created_at)
SELECT DISTINCT
  i.id AS idea_id,
  t.id AS trend_id,
  (t.title = i.based_on_trends[1]) AS is_primary,
  i.created_at
FROM tubegai.idea i
CROSS JOIN LATERAL unnest(i.based_on_trends) AS trend_title
JOIN tubegai.trend t ON t.title ILIKE '%' || trend_title || '%'
WHERE i.based_on_trends IS NOT NULL
  AND array_length(i.based_on_trends, 1) > 0;

-- 4. (선택) 기존 컬럼 deprecate 주석
COMMENT ON COLUMN tubegai.idea.trend_id IS 'DEPRECATED: Use idea_trend junction table';
COMMENT ON COLUMN tubegai.idea.based_on_trends IS 'DEPRECATED: Use idea_trend junction table';
```

### 쿼리 패턴 변경

**Before (배열 기반):**
```typescript
// 아이디어 조회 - 트렌드 정보 없음
const ideas = await db.query.ideas.findMany({
  where: eq(schema.ideas.userId, userId),
});
```

**After (Junction 테이블):**
```typescript
// 아이디어 + 관련 트렌드 조회
const ideas = await db.query.ideas.findMany({
  where: eq(schema.ideas.userId, userId),
  with: {
    ideaTrends: {
      with: {
        trend: true,  // 트렌드 상세 정보 포함
      },
    },
  },
});

// 결과 구조
// idea.ideaTrends[0].trend.title
// idea.ideaTrends[0].trend.category
// idea.ideaTrends[0].isPrimary
```

**특정 트렌드 기반 아이디어 조회:**
```typescript
// 특정 트렌드로 생성된 아이디어들
const ideasFromTrend = await db
  .select()
  .from(schema.ideas)
  .innerJoin(
    schema.ideaTrends,
    eq(schema.ideas.id, schema.ideaTrends.ideaId)
  )
  .where(eq(schema.ideaTrends.trendId, trendUuid));
```

### 데이터 저장 로직 변경

```typescript
// idea.data.server.ts

async function saveGeneratedRecommendations(
  userId: string,
  recommendations: AIGeneratedRecommendation[],
  inputTrends: TrendItem[]
): Promise<void> {
  const trendTitleToUuid = new Map(
    inputTrends
      .filter(t => t.trendUuid)
      .map(t => [t.title.toLowerCase(), t.trendUuid!])
  );

  for (const rec of recommendations) {
    // 1. 아이디어 저장
    const [idea] = await db.insert(schema.ideas).values({
      userId,
      title: rec.title,
      // ... other fields
      basedOnTrends: rec.basedOnTrends ?? [],  // 하위 호환용 유지
    }).returning();

    // 2. Junction 테이블에 관계 저장
    const matchedTrends = (rec.basedOnTrends ?? [])
      .map((title, idx) => ({
        title: title.toLowerCase(),
        isPrimary: idx === 0,
      }))
      .filter(t => trendTitleToUuid.has(t.title));

    if (matchedTrends.length > 0) {
      await db.insert(schema.ideaTrends).values(
        matchedTrends.map(t => ({
          ideaId: idea.id,
          trendId: trendTitleToUuid.get(t.title)!,
          isPrimary: t.isPrimary,
        }))
      );
    }
  }
}
```

### 장단점 분석

| 항목 | Junction 테이블 | 배열 컬럼 |
|------|-----------------|----------|
| **FK 무결성** | DB 레벨 보장 ✓ | 불가 |
| **CASCADE 삭제** | 자동 ✓ | 수동 처리 필요 |
| **N:M 관계** | 자연스러움 ✓ | 어색함 |
| **쿼리 복잡도** | JOIN 필요 | 단순 |
| **메타데이터** | 확장 가능 ✓ | 불가 |
| **인덱싱** | B-tree (효율적) | GIN (복잡) |
| **Drizzle ORM** | 완벽 지원 ✓ | 부분 지원 |

### 하위 호환성

기존 `basedOnTrends` 배열은 **유지**하되 점진적으로 deprecate:

1. **Phase 1**: Junction 테이블 추가, 양쪽 모두 저장
2. **Phase 2**: 읽기는 Junction 테이블 우선, basedOnTrends fallback
3. **Phase 3**: basedOnTrends 쓰기 중단, 읽기만 유지
4. **Phase 4**: basedOnTrends 컬럼 삭제 (선택)

---

## 권장 구현 순서

### Phase 1: 즉시 적용 (방안 1)
1. `saveGeneratedRecommendations` 함수 수정
2. `getAIRecommendationsForUser`에서 trends 전달
3. 새로 생성되는 AI 추천에 `trendId` 저장

### Phase 2: 스키마 개선 (방안 2)
1. `trend_ids` 컬럼 추가 마이그레이션
2. 코드 업데이트
3. 기존 데이터 마이그레이션 (방안 3)

### Phase 3: 정리
1. `trendId` deprecated 처리 (또는 첫 번째 ID로 유지)
2. 쿼리 최적화 (GIN 인덱스 추가)

---

## 영향 범위

### 수정 필요 파일
- `app/common/data/idea.data.server.ts` - 저장 로직 수정
- `app/features/project/api/ideas.ts` - API에 trends 전달
- `app/features/project/project-schema.ts` - 스키마 변경 (Phase 2)
- `app/common/types/ideation.types.ts` - 타입 추가 (Phase 2)

### 관련 기능
- AI 추천 생성
- 아이디어 검색 (트렌드 기반 필터링 가능)
- 아이디어 → 트렌드 연결 표시
