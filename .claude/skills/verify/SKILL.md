---
name: verify
description: 타입 체크 + 린트를 실행하여 변경사항 검증
allowed-tools: Bash Grep
---

변경사항을 검증합니다:

1. React Router typegen + TypeScript 타입 체크 실행
```bash
npm run typecheck
```

2. Tailwind CSS 4 포함 린트 체크 실행
```bash
npm run lint
```

3. 오류 발견 시:
   - 타입 오류: 해당 파일의 타입 불일치 수정
   - 린트 오류: 규칙에 맞게 코드 수정
   - 수정 후 다시 검증 실행

4. 스키마 변경이 포함된 경우 추가 점검:
   - `*-schema.ts` → `*.types.ts` → `*.data.server.ts` → API 라우트/컴포넌트 순서로 영향 범위 확인
