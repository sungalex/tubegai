---
paths:
  - "app/features/**/pages/**"
  - "app/features/**/api/**"
  - "app/routes.ts"
---

# React Router v7

**NOT Remix. NEVER import from `@remix-run/*`.**

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

- `useLoaderData()`, `useActionData()` 사용 금지 → `loaderData` / `actionData` props 사용
- `json()` 사용 금지 → plain object 반환
- 상태 코드 필요 시 `data()` 사용
- `useFetcher`: 비동기 폼 제출, API 호출에 사용
- 모든 API `action`에 `requireAuth(request)` 필수
