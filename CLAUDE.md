# CLAUDE.md

## 빠른 참조

```bash
npm run dev          # 개발 서버 (포트 3000)
npm run build        # 프로덕션 빌드
npm run typecheck    # 타입 체크
npm run lint         # Lint 체크 (Tailwind CSS 4 포함)
npm run db:generate  # 마이그레이션 생성
npm run db:migrate   # 마이그레이션 적용
```

## 기술 스택

| 영역      | 기술                                |
| --------- | ----------------------------------- |
| Framework | React Router v7 + Vite (SSR)        |
| Styling   | Tailwind CSS 4 + Shadcn UI          |
| Forms     | React Hook Form + Zod               |
| Database  | PostgreSQL + Drizzle ORM + Supabase |
| AI        | Google Gemini                       |
| i18n      | i18next (ko, en)                    |

## 프로젝트 구조

```
app/
├── features/           # 기능별 모듈 (auth, project, studio, product, trend)
├── common/
│   ├── components/ui/  # Shadcn UI 컴포넌트
│   ├── data/           # 데이터 레이어 (*.data.server.ts)
│   └── types/          # 공유 타입
├── drizzle/            # DB 스키마, 마이그레이션
├── lib/                # 유틸리티, AI, 인증
├── i18n/               # 번역 파일
└── routes.ts           # 라우트 설정
```

---

## 핵심 패턴

### React Router v7

**IMPORTANT**: This is NOT Remix. NEVER import from `@remix-run/*`.

```typescript
import type { Route } from "./+types/page-name";

// loader/action: plain object 반환 (json() 사용 금지)
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  return { data };
}

// 컴포넌트: loaderData props 직접 접근 (useLoaderData() 사용 금지)
export default function Page({ loaderData }: Route.ComponentProps) {
  const { data } = loaderData;
}
```

- `useFetcher`: 비동기 폼 제출, API 호출에 사용
- 라우트 설정: [routes.ts](app/routes.ts) 참조

### 데이터 레이어

```typescript
// app/common/data/*.data.server.ts
import { db, schema } from "~/lib/db.server";
import { eq } from "drizzle-orm";

export async function getProject(id: string) {
  return db.query.projects.findFirst({
    where: eq(schema.projects.id, id),
    with: { owner: true },
  });
}
```

### 인증

```typescript
// 서버 (app/lib/auth.server.ts)
const userId = await requireAuth(request); // 필수 인증
const userId = await getCurrentUserId(request); // 선택적 인증

// 클라이언트 (app/lib/auth.client.ts)
import {
  signInWithEmail,
  signInWithGitHub,
  signInWithGoogle,
} from "~/lib/auth.client";
```

---

## UI & 스타일

### Shadcn UI

Radix 직접 import 금지. 항상 Shadcn 컴포넌트 사용:

```typescript
import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardHeader } from "~/common/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
} from "~/common/components/ui/form";
```

### Tailwind CSS 4

**시맨틱 토큰 사용** (raw 색상 금지):

| 용도   | 토큰                                       |
| ------ | ------------------------------------------ |
| 배경   | `bg-background`, `bg-card`, `bg-muted`     |
| 텍스트 | `text-foreground`, `text-muted-foreground` |
| 테두리 | `border-border`, `border-input`            |
| 강조   | `bg-primary`, `text-primary-foreground`    |

**v3 → v4 클래스명 변경**:

| v3 (금지)           | v4 (사용)       |
| ------------------- | --------------- |
| `flex-shrink-0`     | `shrink-0`      |
| `flex-grow`         | `grow`          |
| `overflow-ellipsis` | `text-ellipsis` |

**금지**: Arbitrary values (`w-[140px]`, `text-[14px]`)

**cn() 유틸리티**: `import { cn } from "~/lib/utils";`

---

## 데이터베이스

### 스키마 정의

모든 테이블은 `public` 스키마 사용 (`tubegai` 스키마 금지):

```typescript
import { tubegaiSchema } from "~/drizzle/schema-def";

export const projects = tubegaiSchema.table("project", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

- Enum 정의: [app/drizzle/enums.ts](app/drizzle/enums.ts)
- 마이그레이션 SQL: 항상 `public.table_name` 형식 사용
- **RLS 정책**: Supabase Dashboard에서 관리 (Drizzle 마이그레이션 금지)

### 마이그레이션 실패 시

1. Supabase Dashboard > SQL Editor 접속
2. `app/drizzle/migrations/XXXX_*.sql` 내용 복사 후 직접 실행
3. `npm run db:migrate` 재실행

---

## 도구 & 유틸리티

### 폼 (React Hook Form + Zod)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "~/common/components/ui/form";
```

### 알림 (Sonner)

```typescript
import { toast } from "sonner";
toast.success("저장 완료");
toast.error("오류 발생", { description: "다시 시도해주세요." });
```

### 국제화 (i18n)

```typescript
import { useTranslation } from "~/i18n/context";
const { t } = useTranslation("project"); // common, auth, project, studio, home
```

### AI (Gemini)

- **기본 AI**: Google Gemini 사용 (다른 AI 서비스 사용 시 승인 필요)
- 구현 참조: [app/lib/ai.server.ts](app/lib/ai.server.ts)

**모델 선택 기준**:

| 용도                 | 모델                         | 특징                    |
| -------------------- | ---------------------------- | ----------------------- |
| 텍스트 생성 (고품질) | `gemini-2.5-flash`           | 아이디어 추천           |
| 텍스트 생성 (빠름)   | `gemini-2.5-flash-lite`      | 스크립트, 프로젝트 생성 |
| 이미지 분석          | `gemini-3-pro-image-preview` | 멀티모달 분석           |
| 이미지 생성          | `nano-banana-pro-preview`    | 스토리보드, 썸네일      |

---

## 코딩 규칙

### 금지 vs 권장

| 영역        | ❌ 금지                       | ✓ 권장                                     |
| ----------- | ----------------------------- | ------------------------------------------ |
| Import      | `@remix-run/*`, `@radix-ui/*` | `react-router`, `~/common/components/ui/*` |
| 반환값      | `json({ data })`              | `{ data }`                                 |
| 데이터 접근 | `useLoaderData()`             | `loaderData` props                         |
| 타입        | `enum Status {}`              | `type Status = "draft" \| "active"`        |
| Tailwind    | `flex-shrink-0`, `w-[140px]`  | `shrink-0`, `w-36`                         |
| 색상        | `bg-white`, `text-gray-500`   | `bg-card`, `text-muted-foreground`         |
| 스키마      | `tubegai.table`               | `public.table`                             |
| RLS         | Drizzle 마이그레이션          | Supabase Dashboard                         |

### 작업 규칙

- Page UI 텍스트: 한국어 기본
- 분석/리포트: 한국어, `/docs` 폴더 저장
- 변경 전 기존 파일 읽기 필수
- 기존 패턴 따르기, 과도한 엔지니어링 금지
- Phase 2+ 기능 구현 금지 (명시적 요청 시에만)

### 변경사항 검증 체크리스트

```bash
# 1. 타입 & 린트 체크
npm run typecheck
npm run lint

# 2. 관련 코드 검색 (변경된 함수/타입/컬럼명)
Grep "변경된이름" app/

# 3. 스키마 변경 시 점검 파일
# - *-schema.ts (컬럼 정의)
# - *.types.ts (인터페이스)
# - *.data.server.ts (CRUD 함수)
# - API 라우트, 컴포넌트

# 4. 마이그레이션 후 DB 반영 확인
npm run db:migrate
# 실패 시 Supabase SQL Editor에서 직접 실행
```

---

## 환경 변수

```bash
DATABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
GEMINI_API_KEY
GOOGLE_CLIENT_ID_YOUTUBE
GOOGLE_CLIENT_SECRET_YOUTUBE
```
