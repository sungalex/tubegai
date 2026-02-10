# CLAUDE.md

## 빠른 참조

```bash
npm run dev              # 개발 서버 (포트 3000)
npm run build            # 프로덕션 빌드
npm run typecheck        # 타입 체크
npm run db:generate      # 마이그레이션 생성
npm run db:migrate       # 마이그레이션 적용
```

## 기술 스택

| 영역      | 기술                                |
| --------- | ----------------------------------- |
| Framework | React Router v7 + Vite (SSR)        |
| Styling   | Tailwind CSS 4 + Shadcn UI          |
| Forms     | React Hook Form + Zod               |
| Database  | PostgreSQL + Drizzle ORM + Supabase |
| AI        | Google Gemini                       |
| Charts    | Recharts                            |
| Animation | Framer Motion                       |
| i18n      | i18next (ko, en)                    |

## 프로젝트 구조

```
app/
├── features/           # 기능 모듈
│   ├── auth/          # 인증 (GitHub, Google, Email)
│   ├── project/       # 프로젝트, 채널, 아이디어
│   ├── studio/        # 스크립트, 스토리보드, 씬, 내보내기
│   ├── product/       # 제품 페이지
│   └── trend/         # 트렌드 분석
├── common/
│   ├── components/ui/ # Shadcn UI (35개+)
│   ├── data/          # 데이터 레이어 (*.data.server.ts)
│   └── types/         # 공유 타입
├── drizzle/           # DB 스키마, 마이그레이션
├── hooks/             # 커스텀 훅
├── lib/               # 유틸리티, AI, 인증
├── i18n/              # 번역 파일
└── routes.ts          # 라우트 설정
```

### 기능별 구조

```
features/{feature}/
├── pages/              # *-page.tsx
├── components/         # {feature}-*.tsx
├── layouts/           # {feature}-layout.tsx
├── {feature}-schema.ts # Drizzle 스키마
└── queries.ts         # 데이터 접근 (optional)
```

## React Router v7 패턴

**IMPORTANT**: This is NOT Remix. NEVER import from `@remix-run/*`.

### 페이지 컴포넌트

```typescript
import type { Route } from "./+types/page-name";

// Server data loading - MUST return plain objects
export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  const data = await getData(params.id);
  return { data };  // ✓ Never use json()
}

// Form handling - MUST return plain objects
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  return { success: true };
}

// Meta tags
export const meta = () => [{ title: "페이지 제목 | TubeGAI" }];

// Component receives loaderData via props directly
export default function Page({ loaderData }: Route.ComponentProps) {
  const { data } = loaderData;  // ✓ Never use useLoaderData()
  return <div>{data.title}</div>;
}
```

### useFetcher 패턴

Use for async operations (form submission, API calls, state updates):

```typescript
import { useFetcher } from "react-router";

function Component() {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  return (
    <fetcher.Form method="post" action="/api/save">
      <input name="title" />
      <button disabled={isSubmitting}>저장</button>
    </fetcher.Form>
  );
}
```

### 라우트 설정 (routes.ts)

```typescript
import { route, layout, prefix, index } from "@react-router/dev/routes";

export default [
  route("login", "features/auth/pages/login-page.tsx"),
  layout("features/studio/layouts/studio-layout.tsx", [
    ...prefix("studio", [
      index("features/studio/pages/studio-index-page.tsx"),
      route("script/:projectId", "features/studio/pages/script-page.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
```

## 데이터베이스

### 스키마 정의

All tables MUST use `tubegaiSchema` from [app/drizzle/schema-def.ts](app/drizzle/schema-def.ts):

```typescript
import { tubegaiSchema } from "~/drizzle/schema-def";
import { uuid, text, timestamp } from "drizzle-orm/pg-core";

export const projects = tubegaiSchema.table("project", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Enum 정의 ([app/drizzle/enums.ts](app/drizzle/enums.ts))

```typescript
export const projectStatusEnum = tubegaiSchema.enum("project_status", [
  "draft",
  "in_progress",
  "completed",
  "archived",
]);
```

### 데이터 레이어 (\*.data.server.ts)

```typescript
// app/common/data/project.data.server.ts
import { db, schema } from "~/lib/db.server";
import { eq } from "drizzle-orm";

export async function getProject(id: string) {
  return db.query.projects.findFirst({
    where: eq(schema.projects.id, id),
    with: { owner: true, mediaAssets: true },
  });
}
```

### Supabase 스키마 규칙

**IMPORTANT**: TubeGAI의 모든 테이블은 `public` 스키마를 사용합니다.

- `tubegaiSchema`는 내부적으로 `pgTable`을 래핑하며, 기본 `public` 스키마를 사용
- 마이그레이션 SQL 작성 시 항상 `public.table_name` 형식 사용
- Raw SQL 쿼리 작성 시 `public` 스키마 명시 필수

```typescript
// ✓ 올바른 마이그레이션 SQL
CREATE TABLE IF NOT EXISTS public.idea_trend (
  idea_id uuid NOT NULL REFERENCES public.idea(id) ON DELETE CASCADE,
  ...
);

// ✓ 올바른 Raw SQL 쿼리
sql`SELECT 1 FROM public.idea_trend WHERE idea_id = ${ideaId}`

// ❌ 잘못된 스키마 참조 (tubegai 스키마는 존재하지 않음)
CREATE TABLE tubegai.idea_trend (...)
```

### RLS 정책 (Row Level Security)

**중요**: RLS 정책은 Supabase 대시보드에서 관리합니다. Drizzle 마이그레이션으로 RLS 정책을 생성하지 마세요.

**문제 상황**:
- Drizzle은 마이그레이션 순차 적용 방식을 사용
- RLS 정책 마이그레이션이 실패하면 (`policy already exists`) 후속 마이그레이션이 차단됨
- `public` 스키마의 일부 테이블 (`profiles`)은 Supabase Auth가 관리

**해결 방법**:

1. **RLS 정책은 Supabase Dashboard에서 설정** (SQL Editor 또는 Authentication > Policies)

2. **마이그레이션에서 RLS 제외**: RLS 관련 마이그레이션 파일은 placeholder로 대체
   ```sql
   -- RLS Policies skipped - manage via Supabase Dashboard
   SELECT 1;
   ```

3. **idempotent 마이그레이션 작성** (불가피한 경우):
   ```sql
   -- DROP 후 CREATE로 idempotent하게 작성
   DROP POLICY IF EXISTS "policy_name" ON "public"."table_name";
   CREATE POLICY "policy_name" ON "public"."table_name" ...;
   ```

**권장 RLS 정책 패턴** (Supabase Dashboard에서 설정):

```sql
-- 사용자 본인 데이터만 접근
CREATE POLICY "user_select_own" ON "public"."table_name"
  FOR SELECT USING (user_id = auth.uid());

-- Junction 테이블은 부모 테이블 기준으로 권한 확인
CREATE POLICY "junction_select_via_parent" ON "public"."idea_trend"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."idea" i
      WHERE i.id = idea_id AND i.user_id = auth.uid()
    )
  );
```

## 인증

### 서버 ([app/lib/auth.server.ts](app/lib/auth.server.ts))

```typescript
// Required auth - redirects to login if unauthenticated
const userId = await requireAuth(request);

// Optional auth - returns null if unauthenticated
const userId = await getCurrentUserId(request);
```

### 클라이언트 ([app/lib/auth.client.ts](app/lib/auth.client.ts))

```typescript
import {
  signInWithEmail,
  signInWithGitHub,
  signInWithGoogle,
} from "~/lib/auth.client";
```

## UI 컴포넌트

### Shadcn UI

NEVER import from Radix directly. Always use Shadcn components:

```typescript
import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "~/common/components/ui/form";
```

### Tailwind CSS 컨벤션

**REQUIRED**: Use Shadcn semantic tokens instead of raw colors:

- Colors: `primary`, `secondary`, `muted`, `accent`, `destructive`
- Text: `foreground`, `muted-foreground`, `primary-foreground`
- Background: `background`, `card`, `popover`
- Border: `border`, `input`, `ring`

```typescript
// ✓ Good - semantic tokens
<div className="bg-card text-card-foreground border-border" />
<span className="text-muted-foreground" />

// ❌ Bad - raw colors
<div className="bg-white text-gray-900 border-gray-200" />
```

### Tailwind CSS 4 - 표준 클래스 사용

**FORBIDDEN**: Arbitrary values (`w-[140px]`, `text-[14px]`)

**REQUIRED**: Use standard Tailwind classes

| 클래스      | 픽셀  |
| ----------- | ----- |
| `w-20`      | 80px  |
| `w-24`      | 96px  |
| `w-28`      | 112px |
| `w-32`      | 128px |
| `w-36`      | 144px |
| `w-40`      | 160px |
| `text-xs`   | 12px  |
| `text-sm`   | 14px  |
| `text-base` | 16px  |

### cn() 유틸리티

```typescript
import { cn } from "~/lib/utils";

<div className={cn("rounded-lg border", isActive && "border-primary")} />
```

## 폼 처리

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(6, "최소 6자 이상")
});

function LoginForm() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

## 국제화 (i18n)

```typescript
import { useTranslation } from "~/i18n/context";

function Component() {
  const { t } = useTranslation("auth");
  return <label>{t("login.email")}</label>;
}
```

Namespaces: `common`, `navigation`, `auth`, `project`, `studio`, `home`

## 알림 (Sonner)

```typescript
import { toast } from "sonner";

toast.success("저장 완료");
toast.error("오류 발생", { description: "다시 시도해주세요." });
```

## AI 통합

- **Gemini를 기본 AI 서비스로 사용한다**
- 다른 AI 서비스(Claude, OpenAI 등) 이용이 필요한 경우 승인 요청 필수

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
// See app/common/data/ideation.data.server.ts
```

## Gemini 모델

| 콘텐츠 타입   | 추천 모델 (2026 기준) | 모델명            | 특징 및 용도                                |
| ------------- | --------------------- | ----------------- | ------------------------------------------- |
| 텍스트/추론   | Gemini 3 Pro          | `gemini-3-pro`    | 복잡한 논리, 코드 생성, 장문 요약           |
| 텍스트/속도   | Gemini 3 Flash        | `gemini-3-flash`  | 실시간 챗봇, 단순 데이터 추출 (가성비 최고) |
| 이미지 생성   | Nano Banana           | `nano-banana-001` | 텍스트 가이드 기반 고품질 이미지 생성       |
| 영상 생성     | Veo 3.1               | `veo-3-flash`     | 고해상도 시네마틱 영상 및 오디오 생성       |
| 멀티모달 분석 | Gemini 3 Pro (Vision) | `gemini-3-pro`    | 업로드된 이미지/영상 내용 설명 및 분석      |

## YouTube OAuth

Channel integration: [app/lib/youtube-oauth.server.ts](app/lib/youtube-oauth.server.ts)

```typescript
import { getChannelInfo } from "~/common/data/channel.data.server";
```

## 환경 변수

```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...

# YouTube OAuth (별도 OAuth 앱)
GOOGLE_CLIENT_ID_YOUTUBE=...
GOOGLE_CLIENT_SECRET_YOUTUBE=...

# Supabase OAuth (Supabase 대시보드에서 설정)
GOOGLE_CLIENT_ID_SUPABASE=...
GOOGLE_CLIENT_SECRET_SUPABASE=...
```

## 금지 패턴

```typescript
// ❌ Remix imports
import { useLoaderData } from "@remix-run/react";

// ❌ Using json()
return json({ data });

// ❌ useLoaderData/useActionData hooks
const data = useLoaderData();

// ❌ Direct Radix imports
import { Button } from "@radix-ui/react-button";

// ❌ TypeScript enums
enum Status {
  Draft,
  Active,
}

// ❌ Arbitrary Tailwind values (e.g., w-[NNpx], h-[NNpx], text-[NNpx])

// ❌ Raw colors instead of semantic tokens
className = "bg-white text-gray-500";

// ❌ 존재하지 않는 스키마 참조 (tubegai 스키마 사용 금지)
CREATE TABLE tubegai.my_table (...)  // → public.my_table 사용
sql`SELECT * FROM tubegai.idea`      // → public.idea 사용

// ❌ Drizzle 마이그레이션에서 RLS 정책 생성
CREATE POLICY "..." ON "public"."table"  // → Supabase Dashboard 사용
```

## 권장 패턴

```typescript
// ✓ Use Route.ComponentProps
export default function Page({ loaderData }: Route.ComponentProps) {}

// ✓ Return plain objects
return { data };

// ✓ Import from Shadcn UI
import { Button } from "~/common/components/ui/button";

// ✓ Use union types instead of enums
type Status = "draft" | "active";

// ✓ Use interfaces for object shapes
interface User {
  name: string;
}

// ✓ Use standard Tailwind classes
className = "w-36";

// ✓ Use Shadcn semantic tokens
className = "bg-card text-muted-foreground";
```

## MVP 기능 현황

**활성화 (MVP)**:

- Auth: 로그인, 회원가입, OAuth
- Projects: 대시보드, 생성, 채널 관리
- Studio: 스크립트, 스토리보드, 씬, 내보내기
- Trends: 트렌드 분석, AI 추천
- Product: 메인 페이지

**비활성화 (Phase 2+)**: Settings, Pro/Plus, 고급 Studio 기능

## 작업 규칙

- Reports and analysis: Write in Korean, save to `/docs` folder
- Page UI text: Korean as default language
- Always read existing files before making changes
- Follow existing patterns, avoid over-engineering
- Do NOT build Phase 2+ features unless explicitly requested
- Provide a brief context of the operation and then trigger the approval request, when an agent requires authorization.

## 변경사항 검증 규칙 (필수)

### 사이드 이펙트 점검

**모든 변경사항은 기존 기능에 사이드 이펙트가 발생하지 않았는지 철저히 점검**:

1. 타입 체크 실행: `npm run typecheck`
2. 관련 코드 전체 검색: `Grep`으로 변경된 함수/타입/컬럼명 사용처 확인
3. 모든 사용처에서 수정사항 반영 여부 확인

### 마이그레이션 검증

**마이그레이션 실행 후 DB 반영 여부 필수 확인**:

1. `npm run db:migrate` 실행 후 성공 메시지 확인
2. 실제 DB에 컬럼/테이블 생성 여부 검증 (Drizzle Studio 또는 SQL 쿼리)
3. 마이그레이션 실패 시, 아래 **수동 마이그레이션 가이드** 제공

**수동 마이그레이션 가이드** (마이그레이션 실패 시):

```
1. Supabase Dashboard > SQL Editor 접속
2. 마이그레이션 SQL 파일 내용 복사 (app/drizzle/migrations/XXXX_*.sql)
3. SQL Editor에서 직접 실행
4. 결과 확인 후 다시 npm run db:migrate 실행
```

### 스키마 변경 후 코드 점검

**마이그레이션으로 테이블 스키마 변경 시, 기존 스키마를 사용하던 모든 코드 점검 필수**:

1. **스키마 파일**: `*-schema.ts` 파일에서 컬럼 정의 수정
2. **타입 파일**: `*.types.ts` 파일에서 인터페이스 수정
3. **데이터 레이어**: `*.data.server.ts` 파일에서 CRUD 함수 수정
4. **API 라우트**: 해당 테이블 사용하는 API 수정
5. **컴포넌트**: 해당 데이터 표시하는 UI 컴포넌트 수정
6. **Grep으로 전체 검색**: 변경된 컬럼명으로 검색하여 누락 확인

```bash
# 예: content_tone → content_tones 변경 시
Grep "contentTone[^s]" app/  # 수정 누락된 곳 찾기
```
