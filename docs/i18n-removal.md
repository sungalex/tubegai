# i18n 제거 및 한국어 전용 전환

## 개요

프로젝트에서 `i18next` + `react-i18next` 기반의 다국어(한국어/영어) 지원을 완전히 제거하고, 한국어 텍스트를 컴포넌트에 직접 하드코딩하는 방식으로 전환.

## 변경 사유

- 영어 지원이 더 이상 필요하지 않음
- i18n 인프라 제거로 코드 복잡도 감소
- 번들 사이즈 최적화 (i18next, react-i18next 패키지 제거)
- 번역 키 간접 참조 제거로 코드 가독성 향상

---

## 이전 i18n 아키텍처

### 동작 방식

```txt
[요청] → server.ts (쿠키/Accept-Language로 locale 감지)
       → root.tsx loader (initI18n으로 서버 i18n 인스턴스 생성)
       → <LanguageProvider initialLocale={locale}>
           → React Context로 전체 앱에 locale/t 함수 전파
           → 각 컴포넌트에서 useTranslation(namespace)로 t() 함수 획득
           → t("key") → JSON 번역 파일에서 문자열 조회
```

### 주요 구성 요소

| 구성 요소                    | 역할                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `app/i18n/server.ts`         | `getLocaleFromRequest()` — 쿠키(`tubegai_locale`) 또는 `Accept-Language` 헤더에서 locale 감지 |
| `app/i18n/config.ts`         | `initI18n()` — i18next 인스턴스 초기화, `Locale`/`Namespace` 타입 정의                        |
| `app/i18n/context.tsx`       | `LanguageProvider` — React Context, `useLanguage()`/`useTranslation()` 훅 제공                |
| `app/i18n/locales/ko/*.json` | 한국어 번역 파일 (6개 네임스페이스)                                                           |
| `app/i18n/locales/en/*.json` | 영어 번역 파일 (6개 네임스페이스)                                                             |
| `language-selector.tsx`      | 언어 전환 드롭다운 UI (한국어/영어)                                                           |

### 번역 네임스페이스 및 키 수

| 네임스페이스 | 키 수 (약) | 주요 내용                                     |
| ------------ | ---------- | --------------------------------------------- |
| `common`     | ~80        | 버튼, 상태, 유효성 검사, 에러, 시간, 토스트   |
| `navigation` | ~100       | 브랜드, 제품, 프로젝트, 스튜디오, 사용자 메뉴 |
| `auth`       | ~52        | 로그인, 가입, 비밀번호 찾기, 비밀번호 재설정  |
| `project`    | ~202       | 대시보드, 목록, 생성, 카드, 트렌드, 아이디어  |
| `studio`     | ~204       | 스크립트, 스토리보드, 씬, 내보내기, 사이드바  |
| `home`       | ~62        | 히어로, 기능, FAQ, 푸터                       |
| **합계**     | **~700**   |                                               |

---

## 삭제된 파일

### i18n 인프라 (app/i18n/)

| 파일                   | 역할                                             |
| ---------------------- | ------------------------------------------------ |
| `app/i18n/context.tsx` | LanguageProvider, useLanguage, useTranslation 훅 |
| `app/i18n/config.ts`   | i18next 초기화, Locale/Namespace 타입            |
| `app/i18n/server.ts`   | 서버 사이드 locale 감지 (쿠키, Accept-Language)  |

### 번역 파일 (app/i18n/locales/)

| 네임스페이스 | 한국어               | 영어                 |
| ------------ | -------------------- | -------------------- |
| common       | `ko/common.json`     | `en/common.json`     |
| navigation   | `ko/navigation.json` | `en/navigation.json` |
| auth         | `ko/auth.json`       | `en/auth.json`       |
| project      | `ko/project.json`    | `en/project.json`    |
| studio       | `ko/studio.json`     | `en/studio.json`     |
| home         | `ko/home.json`       | `en/home.json`       |

### UI 컴포넌트

| 파일                                          | 역할                             |
| --------------------------------------------- | -------------------------------- |
| `app/common/components/language-selector.tsx` | 언어 전환 드롭다운 (한국어/영어) |

## 제거된 NPM 패키지

- `i18next` (^25.8.0)
- `react-i18next` (^16.5.4)

---

## 수정된 파일 상세 내역

### root.tsx — 핵심 통합 포인트

i18n 시스템의 진입점이었던 root.tsx에서 모든 관련 코드를 제거.

**제거된 import:**

```typescript
// 삭제됨
import { LanguageProvider } from "~/i18n/context";
import { getLocaleFromRequest } from "~/i18n/server";
import { initI18n, type Locale } from "~/i18n/config";
```

**loader 변경:**

```typescript
// Before
let ssrLocale: Locale = "ko";

export async function loader({ request }: Route.LoaderArgs) {
  const locale = getLocaleFromRequest(request);
  ssrLocale = locale;
  await initI18n(locale);
  // ...
  return { user, locale, ENV: { ... } };
}

// After
export async function loader({ request }: Route.LoaderArgs) {
  // ...
  return { user, ENV: { ... } };
}
```

**Layout 변경:**

```typescript
// Before
<html lang={ssrLocale} suppressHydrationWarning>

// After
<html lang="ko" suppressHydrationWarning>
```

**App 컴포넌트 변경:**

```typescript
// Before
export default function App({ loaderData }: Route.ComponentProps) {
  const { user, locale, ENV } = loaderData;
  return (
    <LanguageProvider initialLocale={locale}>
      <script dangerouslySetInnerHTML={{ __html: `window.ENV = ${JSON.stringify(ENV)}` }} />
      <div className="py-20">
        <Navigation user={user} hasNotifications={false} hasMessages={false} />
        <Outlet />
      </div>
    </LanguageProvider>
  );
}

// After
export default function App({ loaderData }: Route.ComponentProps) {
  const { user, ENV } = loaderData;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `window.ENV = ${JSON.stringify(ENV)}` }} />
      <div className="py-20">
        <Navigation user={user} hasNotifications={false} hasMessages={false} />
        <Outlet />
      </div>
    </>
  );
}
```

**ErrorBoundary 변경:**

```typescript
// Before
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const isKorean =
    typeof document !== "undefined"
      ? document.documentElement.lang === "ko"
      : ssrLocale === "ko";

  let message = isKorean ? "오류!" : "Oops!";
  let details = isKorean
    ? "예기치 않은 오류가 발생했습니다."
    : "An unexpected error occurred.";
  // ...
}

// After
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "오류!";
  let details = "예기치 않은 오류가 발생했습니다.";
  // ...
}
```

---

### Navigation 컴포넌트 (3개 파일)

#### navigation.tsx — 구조적 리팩토링

`getNavItems` 함수 시그니처에서 `t` 파라미터를 완전히 제거하고 한국어 직접 삽입.

```typescript
// Before
const getNavItems = (_projectId: string, t: (key: string) => string) => [
  {
    name: t("products.title"),
    to: "/products",
    icon: Box,
    items: [
      {
        name: t("products.tubegai.name"),
        description: t("products.tubegai.description"),
        to: "/products",
        icon: Sparkles,
        featured: true,
      },
      // ...
    ],
  },
  // ...
];

// 호출부
const { t } = useTranslation("navigation");
const navItems = getNavItems(projectId, t);

// After
const getNavItems = (_projectId: string) => [
  {
    name: "제품",
    to: "/products",
    icon: Box,
    items: [
      {
        name: "TubeGAI",
        description: "표준 통합 크리에이터 워크플로우 솔루션.",
        to: "/products",
        icon: Sparkles,
        featured: true,
      },
      // ...
    ],
  },
  // ...
];

// 호출부
const navItems = getNavItems(projectId);
```

추가 변경:

- `<LanguageSelector />` 렌더링 및 import 제거
- `useTranslation("navigation")` 제거

#### user-navigation.tsx

- `useTranslation` import 및 `const { t } = useTranslation("navigation")` 제거
- 메뉴 항목 ~15개 한국어 하드코딩: 로그인, 가입, 알림, 메시지, 설정, 프로필, 계정, 화면 설정, 연동, 로그아웃 등
- `t("misc.comingSoon", { ns: "common" })` → `"출시 예정"`

#### mobile-navigation.tsx

- `useTranslation` import 및 훅 호출 제거
- `t("toggleMenu")` → `"메뉴 열기/닫기"`
- `t("brand")` → `"TubeGAI"`

---

### Auth 페이지 (4개 파일)

모든 Auth 페이지에서 동일한 패턴 적용:

1. `import { useTranslation } from "~/i18n/context"` 제거
2. `const { t } = useTranslation("auth")` 및 `const { t: tc } = useTranslation("common")` 제거
3. 모든 `t("key")` / `tc("key")` 호출을 한국어 문자열로 대체

#### login-page.tsx

| 변환 전                                           | 변환 후                            |
| ------------------------------------------------- | ---------------------------------- |
| `t("login.title")`                                | `"로그인"`                         |
| `t("login.description")`                          | `"이메일과 비밀번호를 입력하세요"` |
| `t("login.email")`                                | `"이메일"`                         |
| `t("login.password")`                             | `"비밀번호"`                       |
| `t("login.forgotPassword")`                       | `"비밀번호를 잊으셨나요?"`         |
| `t("login.submit")`                               | `"로그인"`                         |
| `t("login.noAccount")`                            | `"계정이 없으신가요?"`             |
| `t("login.joinLink")`                             | `"가입하기"`                       |
| `t("login.continueWith", { provider: "GitHub" })` | `"GitHub로 계속하기"`              |
| `t("login.continueWith", { provider: "Google" })` | `"Google로 계속하기"`              |

#### join-page.tsx

| 변환 전                                        | 변환 후                     |
| ---------------------------------------------- | --------------------------- |
| `t("join.title")`                              | `"계정 만들기"`             |
| `t("join.signUpWith", { provider: "GitHub" })` | `"GitHub로 가입하기"`       |
| `t("join.signUpWith", { provider: "Google" })` | `"Google로 가입하기"`       |
| `t("join.hasAccount")`                         | `"이미 계정이 있으신가요?"` |
| `t("join.loginLink")`                          | `"로그인"`                  |

#### forgot-password-page.tsx

| 변환 전                           | 변환 후                 |
| --------------------------------- | ----------------------- |
| `t("forgotPassword.title")`       | `"비밀번호 찾기"`       |
| `t("forgotPassword.submit")`      | `"재설정 링크 보내기"`  |
| `t("forgotPassword.backToLogin")` | `"로그인으로 돌아가기"` |

#### reset-password-page.tsx

| 변환 전                              | 변환 후              |
| ------------------------------------ | -------------------- |
| `t("resetPassword.title")`           | `"새 비밀번호 설정"` |
| `t("resetPassword.newPassword")`     | `"새 비밀번호"`      |
| `t("resetPassword.confirmPassword")` | `"비밀번호 확인"`    |
| `t("resetPassword.submit")`          | `"비밀번호 변경"`    |

---

### Project 관련 (8개 파일)

#### project-list-page.tsx, projects-tab-page.tsx — 구조적 변경

`SORT_KEYS` 배열에서 동적 번역 키 조회 패턴을 직접 라벨 문자열로 변경:

```typescript
// Before
const SORT_KEYS: { value: ProjectSortOption; key: string }[] = [
  { value: "newest", key: "list.sort.newest" },
  { value: "oldest", key: "list.sort.oldest" },
  { value: "name", key: "list.sort.name" },
  { value: "progress", key: "list.sort.progress" },
];

// 사용부
const currentSortLabel = SORT_KEYS.find((opt) => opt.value === sort);
// ... t(currentSortLabel.key)

// After
const SORT_KEYS: { value: ProjectSortOption; label: string }[] = [
  { value: "newest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
  { value: "name", label: "이름순 (A-Z)" },
  { value: "progress", label: "진행률순" },
];

// 사용부
const currentSortLabel =
  SORT_KEYS.find((opt) => opt.value === sort)?.label ?? "정렬";
```

#### dashboard-layout.tsx (~6개 t() 대체)

탭 라벨, 페이지 타이틀 등 한국어 하드코딩.

#### idea-generator-dialog.tsx (~22개 t() 대체)

다이얼로그 타이틀, 입력 필드 라벨, 버튼 텍스트, 에러 메시지 등.

#### edit-idea-dialog.tsx (~19개 t() 대체)

편집 다이얼로그의 폼 라벨, 상태 메시지, 버튼 텍스트.

#### trend-analyzer.tsx (~13개 t()/tc() 대체)

트렌드 분석 UI의 라벨, 상태 텍스트, 결과 표시 문구.

#### idea-card.tsx

JSX 내 t() 호출 없음, import 및 훅 선언만 제거.

#### new-project-page.tsx

이미 한국어가 하드코딩되어 있었으므로 사용하지 않는 i18n import만 제거.

---

### Studio 관련 (7개 파일)

#### studio-export-page.tsx (~40+ t() 대체) — 가장 많은 변환

내보내기 페이지의 형식 선택, 품질 설정, 해상도 옵션, 진행 상태, 에러 메시지 등 광범위한 번역 키 대체.

#### video-generator-sidebar.tsx (~33개 t() 대체)

비디오 생성 설정 UI. 보간 문자열 변환 포함:

```typescript
// Before
t("videoGenerator.estimatedCost", { cost })
// After
`예상 비용: ~${cost} 크레딧`;
```

#### storyboard-generator-sidebar.tsx (~30개 t() 대체)

스토리보드 생성 설정 UI의 라벨, 옵션, 상태 메시지.

#### studio-storyboard-page.tsx (~20개 t() 대체)

스토리보드 목록, 편집, 생성 UI.

#### studio-scene-page.tsx (~11개 t() 대체)

씬 편집 UI의 라벨과 버튼.

#### studio-script-page.tsx (~2개 t() 대체)

스크립트 편집 UI (대부분 이미 한국어).

#### studio-sidebar.tsx

이중 네임스페이스 사용 (`navigation` + `studio`)을 한국어 직접 삽입으로 변경.

---

### 홈 페이지 (home-page.tsx)

#### 히어로 타이틀 — 특수 패턴 변환

기존에 번역 문자열을 `split()`으로 분리하여 브랜드명에 스타일을 적용하던 패턴을 직접 JSX로 변환:

```tsx
// Before
const titleParts = t("hero.title").split("TubeGAI");
// ... titleParts[0] + <styled>TubeGAI</styled> + titleParts[1]

// After
<>
  <span className="text-primary">TubeGAI</span>로 전체 제작 과정을 자동화하세요
</>;
```

#### 푸터 저작권 — 보간 변환

```typescript
// Before
t("footer.copyright", { year: new Date().getFullYear() })
// After
`© ${new Date().getFullYear()} TubeGAI. All rights reserved.`;
```

---

## 보간 문자열 변환 패턴 (전체 목록)

i18next의 `{{variable}}` 보간 문법을 JavaScript 템플릿 리터럴로 변환:

| 파일                        | 변환 전                                          | 변환 후                                                             |
| --------------------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| project-list-page.tsx       | `t("list.pagination.showing", { count, total })` | `` `총 ${totalCount}개 중 ${projects.length}개 표시` ``             |
| home-page.tsx               | `t("footer.copyright", { year: ... })`           | `` `© ${new Date().getFullYear()} TubeGAI. All rights reserved.` `` |
| login-page.tsx              | `t("login.continueWith", { provider })`          | `"GitHub로 계속하기"` / `"Google로 계속하기"`                       |
| join-page.tsx               | `t("join.signUpWith", { provider })`             | `"GitHub로 가입하기"` / `"Google로 가입하기"`                       |
| video-generator-sidebar.tsx | `t("videoGenerator.estimatedCost", { cost })`    | `` `예상 비용: ~${cost} 크레딧` ``                                  |
| idea-generator-dialog.tsx   | `t("ideaGenerator.resultCount", { count })`      | `` `${count}개의 아이디어가 생성되었습니다` ``                      |

---

## CLAUDE.md 변경사항

| 영역            | 변경 전                    | 변경 후                          |
| --------------- | -------------------------- | -------------------------------- |
| 기술 스택       | `i18n \| i18next (ko, en)` | `언어 \| 한국어 전용 (하드코딩)` |
| 프로젝트 구조   | `├── i18n/` 포함           | `i18n/` 항목 제거                |
| 도구 & 유틸리티 | 국제화 (i18n) 섹션 존재    | 섹션 완전 제거                   |
| 코딩 규칙       | `useTranslation` 사용 안내 | 한국어 직접 하드코딩             |

---

## 검증 결과

```bash
✓ grep -r "i18n|useTranslation|useLanguage|LanguageProvider" app/  → 0 matches
✓ npm run typecheck  → 통과
✓ npm run build      → 성공 (client + SSR)
```

---

## 변경 통계 요약

| 항목                    | 수량                                          |
| ----------------------- | --------------------------------------------- |
| 수정된 파일             | ~25개                                         |
| 삭제된 파일             | 14개 (i18n 디렉토리 전체 + language-selector) |
| 제거된 NPM 패키지       | 2개                                           |
| 대체된 번역 키          | ~450+                                         |
| 삭제된 번역 JSON 파일   | 12개 (6 네임스페이스 × 2 언어)                |
| 삭제된 i18n 인프라 파일 | 3개 (context, config, server)                 |
