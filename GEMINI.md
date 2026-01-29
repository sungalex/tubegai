# TubeGAI 프로젝트 개요

TubeGAI는 유튜버 및 콘텐츠 크리에이터를 위해 설계된 AI 기반 통합 크리에이터 워크플로우 솔루션입니다. 이 플랫폼은 생성형 AI와 YouTube 데이터를 결합하여 트렌드 발견, 아이디어 생성, 프로젝트 관리 및 효율적인 콘텐츠 제작 파이프라인을 자동화하고 간소화합니다.

## 주요 기능

- **데이터 기반 대시보드**: YouTube 실시간 트렌드 분석, 채널 성장 및 콘텐츠 성과 추적, 프로젝트/채널/라벨 통합 관리.
- **프로젝트 관리**: 비디오 프로젝트를 상태별로 정리하고, 검색 및 필터링하며, 트렌딩 테마에서 새 프로젝트를 시작할 수 있습니다.
- **스튜디오**: AI 기반 스크립트 생성, 스토리보드, 자산 관리, 후반 작업 (자막, 컬러링, 썸네일, SEO 최적화), YouTube용 원클릭 내보내기 등 포괄적인 비디오 제작 도구 모음을 제공합니다.
- **현대적인 UI/UX**: 반응형 디자인, Shadcn UI 컴포넌트, 다크 모드 지원.

## 기술 스택

- **프레임워크**: React Router v7
- **빌드 도구**: Vite
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **UI 컴포넌트**: Shadcn UI
- **아이콘**: Lucide React
- **데이터베이스 ORM**: Drizzle ORM
- **데이터베이스**: Supabase

## 빌드 및 실행

### 필수 조건

- Node.js (v18 이상)
- npm 또는 yarn

### 설치

1.  저장소를 클론합니다:
    ```bash
    git clone https://github.com/sungalex/tubegai.git
    cd tubegai
    ```
2.  의존성을 설치합니다:
    ```bash
    npm install
    ```
3.  데이터베이스 마이그레이션을 실행합니다:
    ```bash
    npm run db:migrate
    ```

### 개발 서버 시작

개발 서버를 시작하려면 다음 명령어를 실행합니다:

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

### 프로덕션 빌드

프로덕션 배포를 위한 빌드를 생성하려면 다음 명령어를 실행합니다:

```bash
npm run build
```

빌드된 파일은 `build/` 디렉토리에 생성됩니다.

### 타입 확인

타입 검사를 실행하려면 다음 명령어를 사용합니다:

```bash
npm run typecheck
```

## 개발 컨벤션

- **코드 스타일**: TypeScript 기반의 React 애플리케이션이며, Tailwind CSS와 Shadcn UI를 사용하여 UI를 구성합니다.
- **데이터베이스**:
  - **Drizzle ORM**: 데이터베이스 스키마 정의 및 마이그레이션을 관리합니다. `npm run db:generate`로 스키마 변경 사항을 생성하고, `npm run db:migrate`로 데이터베이스에 적용합니다.
  - **Supabase**: `npm run db:typegen`을 사용하여 Supabase에서 TypeScript 타입을 생성(`database.types.ts`)합니다. 클라이언트 사용 시 `app/supa-client.ts`를 통해 Type-safe한 인스턴스를 사용합니다.
- **라우팅**: React Router v7을 사용하여 애플리케이션 라우팅을 관리합니다.
- **React Router v7 규칙**:
  - `useLoaderData`, `useActionData` 훅을 사용하지 않습니다. 대신 컴포넌트 Props(`Route.ComponentProps`)를 통해 `loaderData`, `actionData`를 전달받습니다.
  - 라우트 타입은 `import type { Route } from "./+types/..."` 형식으로 import 합니다.
  - `loader`, `action`, `meta` 함수는 각각 `Route.LoaderArgs`, `Route.ActionArgs`, `Route.MetaArgs` 타입을 파라미터로 받습니다.
  - `json` 헬퍼 함수 대신 평범한 객체(plain object)를 반환합니다. 상태 코드가 필요한 경우에만 `data` 함수를 사용합니다.
- **컴포넌트 구조**:
  - 모든 코드는 TypeScript로 작성하며, interface를 선호합니다.
  - 함수형 컴포넌트와 선언형 프로그래밍 패턴을 사용합니다.
  - Shadcn UI 컴포넌트를 우선적으로 사용하며, Radix UI를 직접 import 하지 않습니다.
  - Remix 관련 import는 모두 `react-router`에서 가져옵니다.
- **네이밍 규칙**:
  - 디렉토리 이름은 소문자와 대시(kebab-case)를 사용합니다 (예: `components/auth-wizard`).
  - 컴포넌트는 `Named Exports`를 선호합니다.
- **파일 구조**:
  - 파일 내 코드는 다음 순서로 배치합니다: `Exported Component` -> `Subcomponents` -> `Helpers` -> `Static Content` -> `Types`.
  - 변수명은 설명적으로 작성하며 조동사를 활용합니다 (예: `isLoading`, `hasError`).
- **구문 및 포맷팅**:
  - 순수 함수는 `function` 키워드를 사용합니다.
  - `Enum` 사용을 피하고 `Map`이나 객체 리터럴을 사용합니다.
  - 조건문 등에서 불필요한 중괄호를 피하고 간결한 문법을 선호합니다.
