# 코딩 스타일 규칙

## TypeScript
- interfaces 선호 (types보다)
- enums 금지 → union types 사용: `type Status = "draft" | "active"`
- Named exports 사용
- 설명적 변수명: `isLoading`, `hasError`, `canSubmit`
- 디렉토리명 lowercase + dashes (e.g., `auth-wizard`)

## 언어
- Page UI 텍스트: 한국어 기본
- 분석/리포트: 한국어, `/docs` 폴더 저장 (전문용어는 영어 유지)

## 작업 원칙
- 변경 전 기존 파일 읽기 필수
- 재구성 요청이 명확하지 않으면 기존 패턴 따르기
- 모든 API `action`에 `requireAuth(request)` 필수

## 인증
```typescript
const userId = await requireAuth(request);      // 필수 인증 (모든 action에 필수)
const userId = await getCurrentUserId(request);  // 선택적 인증
```

## Supabase Storage
- 경로: `media/projects/{projectId}/studio/{sessionId}/storyboard/` 또는 `scene-video/`
- 모든 미디어 → `media_asset` 테이블 FK 연결
- 세션 기반 경로로 이전 세션 파일 자동 보존
