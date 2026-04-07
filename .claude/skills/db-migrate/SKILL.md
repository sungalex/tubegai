---
name: db-migrate
description: Drizzle 마이그레이션 생성 및 적용
allowed-tools: Bash Read Grep
---

데이터베이스 마이그레이션을 수행합니다:

1. 마이그레이션 SQL 생성
```bash
npm run db:generate
```

2. 생성된 마이그레이션 파일 검토
   - `app/drizzle/migrations/` 디렉토리의 최신 SQL 파일 확인
   - 테이블명이 `public.table_name` 형식인지 확인

3. 마이그레이션 적용
```bash
npm run db:migrate
```

4. 적용 실패 시:
   - SQL 파일 내용을 Supabase SQL Editor에서 직접 실행하도록 안내
   - `__drizzle_migrations` 레코드 INSERT SQL도 함께 제공
