---
paths:
  - "app/drizzle/**"
  - "app/common/data/**"
  - "app/features/**/*-schema.ts"
---

# 데이터베이스 규칙

## 스키마 정의
- 모든 테이블은 `public` 스키마 (`tubegai` 스키마 금지)
- Enum은 `app/drizzle/enums.ts` 중앙 관리
- 스키마: 각 feature `*-schema.ts` → `drizzle/index.ts`에서 집계
- 마이그레이션 SQL: 항상 `public.table_name` 형식

## 데이터 레이어
- **API 라우트에서 DB 직접 쿼리 금지** — 반드시 `common/data/*.data.server.ts` 경유
- 타입은 `common/types/*.types.ts`에서 import

## RLS
- Supabase Dashboard에서만 관리 (Drizzle 마이그레이션 금지)

## 마이그레이션
- `npm run db:generate` → `npm run db:migrate`
- 실패 시: Supabase SQL Editor에서 직접 실행
  - 이 경우 `__drizzle_migrations` 레코드도 함께 INSERT

## 스키마 변경 시 점검 순서
1. `*-schema.ts` (컬럼 정의)
2. `*.types.ts` (인터페이스)
3. `*.data.server.ts` (CRUD 함수)
4. API 라우트, 컴포넌트
