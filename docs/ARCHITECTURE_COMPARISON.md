# 데이터 레이어 패턴 vs Loader 직접 구현 비교

## 패턴 1: 데이터 레이어 패턴 (현재 프로젝트 방식)

### 구조
```
app/common/data/project.data.ts  ← 데이터 접근 로직
         ↓ (함수 호출)
app/features/project/pages/dashboard-page.tsx (loader)
```

### 코드 예시

**app/common/data/project.data.ts:**
```typescript
import { db } from "~/lib/db.server";
import { projects } from "~/features/project/project-schema";
import { eq, desc } from "drizzle-orm";
import type { RecentProject } from "../types/project.types";

export async function getRecentProjects(userId: string): Promise<RecentProject[]> {
  const result = await db
    .select({
      id: projects.id,
      name: projects.title,
      status: projects.status,
      date: projects.updatedAt,
      step: projects.currentStep,
    })
    .from(projects)
    .where(eq(projects.ownerId, userId))
    .orderBy(desc(projects.updatedAt))
    .limit(4);

  return result;
}
```

**app/features/project/pages/dashboard-page.tsx:**
```typescript
import { getRecentProjects } from "~/common/data/project.data";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request); // 인증 헬퍼
  const recentProjects = await getRecentProjects(userId);
  return { recentProjects };
}
```

### ✅ 장점

1. **재사용성 (Reusability)**
   - `getRecentProjects()`를 여러 곳에서 재사용 가능
   - 예: Dashboard, Sidebar, Mobile App API 등

2. **테스트 용이성 (Testability)**
   - 데이터 함수만 독립적으로 단위 테스트 가능
   - Mock 데이터 → 실제 DB로 전환 시 한 곳만 수정

3. **관심사 분리 (Separation of Concerns)**
   - UI 로직과 데이터 로직 명확히 분리
   - 데이터 팀, 프론트 팀 분업 가능

4. **타입 안정성**
   - 함수 시그니처로 명확한 입출력 타입 정의
   - IDE 자동완성 지원

5. **Migration 용이**
   - 나중에 REST API, GraphQL로 전환 시 함수만 교체
   - Mock → Supabase → Custom API 등 쉽게 전환

6. **코드 가독성**
   - Loader가 간결하고 의도가 명확
   - "무엇을 가져오는가"에 집중

### ❌ 단점

1. **파일 분산**
   - 코드가 2개 파일에 걸쳐 있어 추적 필요

2. **간단한 쿼리에는 과도함**
   - 한 번만 사용하는 쿼리도 함수로 분리해야 함

3. **약간의 추상화 오버헤드**
   - 함수 호출 스택이 한 단계 더 깊어짐

---

## 패턴 2: Loader 직접 구현 패턴

### 구조
```
app/features/project/pages/dashboard-page.tsx
  ↓ (loader 내부에서 직접 DB 쿼리)
Database
```

### 코드 예시

**app/features/project/pages/dashboard-page.tsx:**
```typescript
import { db } from "~/lib/db.server";
import { projects } from "~/features/project/project-schema";
import { eq, desc } from "drizzle-orm";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);

  // 직접 DB 쿼리
  const recentProjects = await db
    .select({
      id: projects.id,
      name: projects.title,
      status: projects.status,
      date: projects.updatedAt,
      step: projects.currentStep,
    })
    .from(projects)
    .where(eq(projects.ownerId, userId))
    .orderBy(desc(projects.updatedAt))
    .limit(4);

  const trends = await getTrends(); // 다른 데이터는 헬퍼 사용 가능

  return { recentProjects, trends };
}
```

### ✅ 장점

1. **코드 집중성**
   - 모든 로직이 한 파일에 있어 이해하기 쉬움
   - 파일 간 이동 없이 전체 흐름 파악 가능

2. **빠른 프로토타이핑**
   - 빠르게 구현하고 나중에 리팩토링 가능

3. **페이지별 최적화 용이**
   - 해당 페이지에만 필요한 특수 쿼리 작성 가능
   - Join, 복잡한 조건 등 페이지 맞춤형 쿼리

4. **추가 파일 불필요**
   - 간단한 쿼리는 별도 파일 없이 바로 작성

### ❌ 단점

1. **재사용 불가**
   - 같은 쿼리를 다른 페이지에서 사용 시 중복 코드 발생

2. **테스트 어려움**
   - Loader 전체를 테스트해야 함 (데이터 로직만 테스트 불가)

3. **관심사 혼재**
   - UI 로직과 데이터 로직이 섞임
   - Loader가 복잡해지면 가독성 저하

4. **Migration 어려움**
   - API 전환 시 모든 loader를 수정해야 함

5. **타입 안정성 낮음**
   - 함수 시그니처가 없어 타입 추론이 약함

---

## 📊 비교표

| 항목 | 데이터 레이어 패턴 | Loader 직접 구현 |
|------|-------------------|-----------------|
| **재사용성** | ⭐⭐⭐⭐⭐ | ⭐ |
| **테스트 용이성** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **초기 구현 속도** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **유지보수성** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **코드 집중도** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Migration 용이성** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **타입 안정성** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **학습 곡선** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🎯 실제 사용 시나리오

### Scenario 1: 여러 곳에서 사용되는 쿼리
**예**: "최근 프로젝트 목록"을 Dashboard, Sidebar, Mobile에서 모두 사용

**추천**: ✅ **데이터 레이어 패턴**
```typescript
// ✅ 한 번 정의, 여러 곳에서 재사용
export async function getRecentProjects(userId: string) { ... }

// Dashboard
const projects = await getRecentProjects(userId);

// Sidebar
const projects = await getRecentProjects(userId);

// API Route
export async function GET({ request }) {
  const projects = await getRecentProjects(userId);
  return json(projects);
}
```

---

### Scenario 2: 페이지에서만 사용하는 복잡한 쿼리
**예**: Dashboard에서만 사용하는 "프로젝트 + 채널 + 라벨 + 통계" 조인 쿼리

**추천**: ✅ **Loader 직접 구현** (또는 하이브리드)
```typescript
// ✅ 페이지에 특화된 복잡한 쿼리는 직접 작성
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);

  const dashboardData = await db
    .select({
      project: projects,
      channel: channels,
      labels: sql<Label[]>`array_agg(${labels})`,
      videoCount: sql<number>`count(${sceneVideos.id})`
    })
    .from(projects)
    .leftJoin(channels, eq(projects.channelId, channels.id))
    .leftJoin(projectLabels, eq(projects.id, projectLabels.projectId))
    .leftJoin(labels, eq(projectLabels.labelId, labels.id))
    .leftJoin(sceneVideos, eq(projects.id, sceneVideos.projectId))
    .where(eq(projects.ownerId, userId))
    .groupBy(projects.id, channels.id);

  return { dashboardData };
}
```

---

### Scenario 3: 하이브리드 접근 (추천!)
**공통 쿼리는 데이터 레이어, 특수 쿼리는 Loader 직접**

```typescript
// app/common/data/project.data.ts - 재사용 가능한 기본 쿼리
export async function getRecentProjects(userId: string) { ... }
export async function getProjectById(id: string) { ... }
export async function createProject(data: CreateProjectInput) { ... }

// app/features/project/pages/dashboard-page.tsx - 페이지별 특수 쿼리
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);

  // ✅ 공통 쿼리는 헬퍼 사용
  const recentProjects = await getRecentProjects(userId);
  const trends = await getTrends();

  // ✅ 페이지 특화 쿼리는 직접 작성
  const stats = await db
    .select({
      totalProjects: sql<number>`count(*)`,
      completedProjects: sql<number>`count(*) filter (where ${projects.status} = 'completed')`
    })
    .from(projects)
    .where(eq(projects.ownerId, userId));

  return { recentProjects, trends, stats };
}
```

---

## 💡 TubeGAI 프로젝트 추천 방식

### 현재 프로젝트는 **데이터 레이어 패턴** 채택 이유:

1. **CLAUDE.md 설계 철학**:
   ```
   ## Data Layer Pattern
   Abstract data fetching in `app/common/data/*.data.ts` for easy API integration
   ```

2. **MVP → Production 전환 대비**:
   - Mock → Supabase → Custom API로 쉽게 전환
   - `// TODO: Replace with API` 주석이 이미 준비됨

3. **미래 확장성**:
   - Mobile App, Desktop App 등에서 같은 데이터 레이어 재사용 가능

### 제안: **하이브리드 접근**

```typescript
// ✅ 공통 CRUD는 데이터 레이어
getRecentProjects()
getProjects()
getProjectById()
createProject()
updateProject()
deleteProject()

// ✅ 페이지별 복잡한 쿼리는 Loader 직접
Dashboard의 통계 쿼리
Analytics 페이지의 집계 쿼리
```

---

## 🎓 결론

### 언제 데이터 레이어를 사용할까?
- ✅ 여러 곳에서 재사용되는 쿼리
- ✅ 단순 CRUD 작업
- ✅ 나중에 API로 전환할 가능성이 있는 로직
- ✅ 테스트가 중요한 비즈니스 로직

### 언제 Loader 직접 구현을 사용할까?
- ✅ 해당 페이지에서만 사용하는 복잡한 조인 쿼리
- ✅ 빠른 프로토타이핑이 필요한 경우
- ✅ 페이지별 특수한 데이터 가공이 필요한 경우

---

## 📌 TubeGAI 프로젝트 구현 제안

**현재 계획대로 데이터 레이어 패턴 유지 + 필요시 하이브리드 적용**

```typescript
// app/common/data/project.data.ts
export async function getRecentProjects(userId: string) {
  // DB 쿼리 구현
}

// app/features/project/pages/dashboard-page.tsx
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  const recentProjects = await getRecentProjects(userId); // 재사용 가능
  return { recentProjects };
}
```

**이유:**
1. 이미 Mock → Real DB 전환을 위한 구조가 갖춰짐
2. 코드베이스 일관성 유지
3. 향후 API 전환 용이
4. 테스트 및 유지보수 유리

---

이 비교가 도움이 되었나요? 궁금한 점이 있으면 알려주세요!
