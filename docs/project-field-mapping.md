# 프로젝트 필드 매핑 분석 보고서

## 요약

프로젝트 생성 시 UI → 서버 → DB 필드 매핑을 분석하고 문제점을 수정했습니다.

## 발견된 문제

### 문제 1: enum 필드에 빈 문자열 전달
- **원인**: action 핸들러에서 `tone`, `difficulty`, `contentTone`, `videoLength` 필드가 빈 문자열("")을 그대로 전달
- **증상**: `PostgresError: invalid input value for enum project_tone: ""`
- **해결**: ternary 연산자 패턴으로 변경하여 빈 문자열을 undefined로 변환

```typescript
// Before (문제)
tone: data.tone as "informative" | "funny" | "cinematic" | "vlog" | undefined,

// After (수정)
tone: (data.tone as string) ? (data.tone as "informative" | "funny" | "dramatic" | "casual" | "professional") : undefined,
```

## 필드 매핑 현황

| UI 필드 | Hidden Input | Action 변환 | DB 컬럼 | 타입 |
|---------|-------------|-------------|---------|------|
| title | ✓ | string fallback | title | text |
| description | ✓ | string \| undefined | description | text |
| type | ✓ | enum fallback | type | projectTypeEnum |
| tone | ✓ | ternary → undefined | tone | projectToneEnum |
| visibility | ✓ | enum fallback | visibility | projectVisibilityEnum |
| topic | ✓ | string \| undefined | topic | text |
| channelId | ✓ | string \| undefined | channel_id | uuid |
| hooks | ✓ (JSON) | array parse | hooks | text[] |
| labels | ✓ (JSON) | array parse | project_label (M:N) | - |
| targetAudience | ✓ | string \| undefined | target_audience | text |
| estimatedViews | ✓ | string \| undefined | estimated_views | text |
| difficulty | ✓ | ternary → undefined | difficulty | ideaDifficultyEnum |
| contentTone | ✓ | ternary → undefined | content_tone | contentToneEnum |
| videoLength | ✓ | ternary → undefined | video_length | videoLengthEnum |
| basedOnTrend | ✓ | string \| undefined | based_on_trend | text |
| basedOnTrendId | ✓ (조건부) | parseInt \| undefined | based_on_trend_id | integer |
| sourceIdeaId | ✓ (조건부) | string \| undefined | source_idea_id | uuid |
| keywords | ✓ | aiContext.keywords | ai_context (JSONB) | string[] |
| scriptGuidelines | ✓ | aiContext.scriptGuidelines | ai_context (JSONB) | string |
| callToAction | ✓ | aiContext.callToAction | ai_context (JSONB) | string |

## enum 타입 정의

### projectToneEnum
- `informative`, `funny`, `cinematic`, `vlog`

### ideaDifficultyEnum
- `easy`, `medium`, `hard`

### contentToneEnum
- `informative`, `funny`, `dramatic`, `casual`, `professional`

### videoLengthEnum
- `short`, `medium`, `long`

## 주의사항

1. **Hidden Input 필수**: React Hook Form의 controlled 컴포넌트는 native form submission에서 제외되므로, 모든 필드에 hidden input 필요
2. **enum 빈 문자열 처리**: PostgreSQL enum은 빈 문자열을 허용하지 않으므로 반드시 undefined로 변환 필요
3. **emptyToNull 헬퍼**: createProject 함수에서 이미 빈 문자열을 undefined로 변환하지만, action에서도 미리 처리하는 것이 안전

## 테스트 체크리스트

- [ ] 필수 필드만 입력하여 프로젝트 생성
- [ ] 모든 필드 입력하여 프로젝트 생성
- [ ] 저장된 아이디어에서 프로젝트 생성
- [ ] 트렌드에서 프로젝트 생성
- [ ] Supabase에서 저장된 값 확인
