# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 빠른 참조

```bash
npm run dev          # 개발 서버 (포트 3000)
npm run build        # 프로덕션 빌드
npm run typecheck    # React Router typegen + TypeScript 체크
npm run lint         # Lint 체크 (Tailwind CSS 4 포함)
npm run db:generate  # Drizzle 마이그레이션 생성
npm run db:migrate   # 마이그레이션 적용
npm run db:enable-rls # Supabase RLS 정책 설정
npm run db:typegen   # Supabase 타입 생성
```

## 기술 스택

| 영역      | 기술                                          |
| --------- | --------------------------------------------- |
| Framework | React Router v7 + Vite (SSR)                  |
| Styling   | Tailwind CSS 4 + Shadcn UI                    |
| Forms     | React Hook Form + Zod                         |
| Database  | PostgreSQL + Drizzle ORM + Supabase           |
| Storage   | Supabase Storage (`media` 버킷)               |
| AI        | Google Gemini (`@google/genai` 단일 SDK)      |
| UI 언어   | 한국어 전용 (하드코딩)                        |

## 프로젝트 구조

```
app/
├── features/           # 기능별 모듈 (schema, api, components, pages)
│   ├── auth/           # 인증
│   ├── project/        # 프로젝트 관리
│   ├── studio/         # 영상 제작 (schema ×2, hooks 포함)
│   ├── trend/          # 트렌드
│   ├── product/        # 상품 페이지
│   └── audit/          # 감사 로그
│
├── common/
│   ├── components/ui/  # Shadcn UI (40개+)
│   ├── data/           # 데이터 레이어 (*.data.server.ts)
│   ├── types/          # 도메인 타입 (*.types.ts)
│   ├── constants/      # 상수 (colors, images)
│   └── pages/          # 공유 페이지
│
├── drizzle/            # enums.ts, schema-def.ts, index.ts, migrations/
│
├── lib/
│   ├── ai/             # AI 서비스 (14개 파일: client, retry, models, context-builder + 서비스별)
│   ├── db.server.ts    # Drizzle ORM 클라이언트
│   ├── auth.server.ts / auth.client.ts
│   ├── supabase-storage.server.ts
│   ├── video-composer.server.ts    # FFmpeg 합성
│   ├── youtube-*.server.ts         # YouTube API + OAuth
│   └── utils.ts        # cn() 유틸리티
│
└── routes.ts           # 라우트 설정
```

## 아키텍처 개요

### 도메인 역할 분리

| 도메인        | 역할                             |
| ------------- | -------------------------------- |
| **Project**   | 기획 + 컨텍스트 관리 (메타데이터만) |
| **Studio**    | 프로덕션 콘텐츠 생성 (세션 기반) |
| **TrendTube** | 트렌드 기반 빠른 영상 생성       |

### Studio Pipeline

```
[Studio 진입] → studio_session 생성
  ├── [Pre-Production] hooks[], scriptGuidelines, seoKeywords[]
  ├── [Step 1: Script] 5 세그먼트 (hook/intro/body/cta/outro) + 메타데이터
  ├── [Step 2: Storyboard + Scene 이미지] SSE 스트리밍 + 참조 체이닝
  ├── [Step 3: Scene Video] Veo 3 (8초 클립 × N, 참조 체이닝)
  ├── [Step 4: B-Roll] Script keywords[] → Pexels/Pixabay
  └── [Step 5: Rough Cut] (Phase 2)
```

### 세션 기반 관리

재생성 시 기존 세션 `archived` → 새 세션 생성 (이력 보존)

```
project
 ├── studio_session (1:N, active 1개 — partial unique index)
 │    ├── studio_script (1:1) → studio_script_segment (1:N)
 │    ├── studio_storyboard (1:N) → studio_video (1:1) → studio_video_part (1:N)
 │    └── (Phase 2+) studio_b_roll, rough_cut_timeline
 ├── trendtube_session (1:N) → trendtube_result (1:1), trendtube_media (1:N)
 └── media_asset (1:N) — 통합 미디어 자산 (Supabase Storage)
```

## 금지 vs 권장 (핵심)

| 영역        | ❌ 금지                                  | ✓ 권장                                     |
| ----------- | ---------------------------------------- | ------------------------------------------ |
| Import      | `@remix-run/*`, `@radix-ui/*`            | `react-router`, `~/common/components/ui/*` |
| 반환값      | `json({ data })`                         | `{ data }` (plain object)                  |
| 데이터 접근 | `useLoaderData()`, `useActionData()`     | `loaderData` / `actionData` props          |
| DB 접근     | API route에서 `db` 직접 import           | `common/data/*.data.server.ts` 경유        |
| AI 모델명   | 문자열 하드코딩                          | `AI_MODELS.*` 상수 참조                    |
| 미디어 저장 | base64 DB 저장                           | Supabase Storage + `media_asset` FK        |

> 세부 규칙은 `.claude/rules/` 참조
