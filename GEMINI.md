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
- **차트**: Recharts
- **데이터베이스 ORM**: Drizzle ORM
- **데이터베이스**: PostgreSQL

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
- **데이터베이스**: Drizzle ORM을 사용하여 데이터베이스 스키마 정의 및 마이그레이션을 관리합니다. `npm run db:generate`로 스키마 변경 사항을 생성하고, `npm run db:migrate`로 데이터베이스에 적용합니다.
- **라우팅**: React Router v7을 사용하여 애플리케이션 라우팅을 관리합니다.
