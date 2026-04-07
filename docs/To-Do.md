# To-Do

## Phase 2 고도화 (Next Phase)

### AI 호출 프롬프트 미세 조정 가능한 Playground 기능 구현 (Next Phase)

### TrendTube 고도화 (Next Phase)

- 텍스트 기반 동영상 생성에서 이미지 또는 동영상에서 새로운 동영상 생성으로 확장
- 내 채널의 재생목록에서 새로운 동영상 생성

### "내 채널 컨텐츠": 내 채널의 기존 컨텐츠 기반 프로젝트 생성 및 동영상 컨텐츠 생성 (Next Phase)

### AI 사용량(요청, 응답) 데이터 및 비용 예측 (Next Phase)

- 모든 AI 호출 시 사용량 데이터 저장
- 사용량 데이터 기반 비용 예측 기능 구현
- 향후 사용자별 사용량 통제 및 비용 산정 도구로 활용

#### API Key 세분화

- api 별 요금 분석을 위해 AI 모델별 api key 세분화 (Cloud Console에서 일부 키를 분리하여 생성했으나, API Key를 AI Studio에서 생성 및 관리하는 방안 검토. 비용은 Cloud Console에서 관리)

### API 및 MCP를 이용한 어플리케이션 확장 (Next Phase)

- ElevenLabs (Speech-to-Speech API)
- CapCut
- Vrew
- OpenClaw

### 구현된 기능에 대한 검증 및 수정 방안 검토 (Next Phase)

- 만료된 데이터 물리적 삭제(삭제 기능은 이미 구현됨) - cron 또는 호출 로직 구현
  - cleanupExpiredIdeas() (line 595-610)가 만료된 unsaved AI 아이디어를 DB에서 삭제합니다. 다만 현재 이 함수를 호출하는 곳이 없으므로 cron이나 적절한 시점에 호출을 추가하는 것이 좋습니다.

- 데이터베이스 테이블 audit_log 활용 방안 검토

### 롱폼과 숏폼 제작용 프로젝트 컨텍스트, 스크립트 생성 분리

- 숏폼 제작용 프로젝트 컨텍스트, 스크립트 생성 기능 구현

## Gemini 최신 model 적용

- Claude.md에 정리한 Gemini 최신 버전 정보를 models.server.ts의 실제 코드애 최신 모델로 마이그레이션
