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
| AI        | Anthropic Claude + Google Gemini    |
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

### Claude (스크립트 생성)

```typescript
import { Anthropic } from "@anthropic-ai/sdk";
// See app/lib/ai-script.server.ts
```

### Gemini (아이디어 생성)

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
// See app/common/data/ideation.data.server.ts
```

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
ANTHROPIC_API_KEY=...
GOOGLE_AI_API_KEY=...
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

## AI model

- Prioritize using Gemini as the AI model
- Available models in Gemini:
  - gemini-3-pro-preview
  - gemini-3-flash-preview
  - gemini-3-pro-image-preview
  - gemini-pro-latest
  - gemini-flash-latest
  - nano-banana-pro-preview
  - deep-research-pro-preview-12-2025
  - gemini-2.5-pro
  - gemini-2.5-flash
  - gemini-2.5-flash-lite
  - gemini-2.5-pro-preview-tts
  - gemini-2.5-flash-preview-tts
  - gemini-2.5-flash-image
