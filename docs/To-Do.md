# To-Do

## TubeGAI 전면 재구축 : [통합 실행 계획서](./unified-rebuild-plan.md)

> 아래 4개 개별 계획서를 전략적으로 종합 분석하여 17개 Phase × 6 Batch 통합 실행 로드맵으로 정리

### Project-Studio AI 중복 최소화 및 연계 활용 최적화 : [계획서](./project-studio-ai-optimization-plan.md)

### Studio + TrendTube 통합 고도화 : [계획서](./studio-enhancement-plan.md)

- Studio + TrendTube 통합
- Studio Script, Storyboard, Scene Video 기능 고도화

### 프로젝트 폴더 구조 리펙토링 : [계획서](./project-structure-refactoring-plan.md)

### 데이터베이스 스키마 리빌드 : [계획서](./db-schema-rebuild-strategy.md)

## Phase 2 고도화 (Next Phase)

### Project 대시보드 "저장된 아이디어" 탭, 트랜드 탭 "아이디어 Hub" 통합 (Next Phase)

- 중복된 기능을 "저장된 아이디어" 탭에 통합

### AI 호출 프롬프트 미세 조정 가능한 Playground 기능 구현 (Next Phase)

### TrendTube 고도화 (Next Phase)

- 텍스트 기반 동영상 생성에서 이미지 또는 동영상에서 새로운 동영상 생성으로 확장
- 내 채널의 재생목록에서 새로운 동영상 생성

### "내 채널 컨텐츠": 내 채널의 기존 컨텐츠 기반 프로젝트 생성 및 동영상 컨텐츠 생성 (Next Phase)

### AI 사용량(요청, 응답) 데이터 및 비용 예측 (Next Phase)

- 모든 AI 호출 시 사용량 데이터 저장
- 사용량 데이터 기반 비용 예측 기능 구현
- 향후 사용자별 사용량 통제 및 비용 산정 도구로 활용

### API 및 MCP를 이용한 어플리케이션 확장 (Next Phase)

- ElevenLabs (Speech-to-Speech API)
- CapCut
- Vrew
- OpenClaw

### 구현된 기능에 대한 검증 및 수정 방안 검토 (Next Phase)

- 만료된 데이터 물리적 삭제(삭제 기능은 이미 구현됨) - cron 또는 호출 로직 구현
  - cleanupExpiredIdeas() (line 595-610)가 만료된 unsaved AI 아이디어를 DB에서 삭제합니다. 다만 현재 이 함수를 호출하는 곳이 없으므로 cron이나 적절한 시점에 호출을 추가하는 것이 좋습니다.

- 데이터베이스 테이블 audit_log 활용 방안 검토

### SDK 통합 및 API Key 세분화

- SDK 통합: @google/generative-ai, @google/genai => @google/genai로 통합 (Google AI Studio에서 API Key 관리)

- 한번 요청 시 불필요하게 여러개의 안을 작성하도록 요청하는 API 호출을 조사해서 사용자가 실제 사용할 최소한의 결과만 생성하도록 개선. 모든 API 요청/응답 내용을 분석해서 불필요한 토큰 사용 최소화

- api 별 요금 분석을 위해 AI 모델별 api key 세분화 (Cloud Console에서 일부 키를 분리하여 생성했으나, API Key를 AI Studio에서 생성 및 관리하는 방안 검토. 비용은 Cloud Console에서 관리)

### 롱폼과 숏폼 제작용 프로젝트 컨텍스트, 스크립트 생성 분리

- 숏폼 제작용 별도 작성
