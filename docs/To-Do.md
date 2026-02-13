# To-Do

## AI 호출 프롬프트 미세 조정 가능한 Playground 기능 구현

## 저장된 아이디어 탭, 아이디어 Hub 통합

## "내 채널 컨텐츠": 내 채널의 기존 컨텐츠 기반 프로젝트 생성

## 검증 및 수정 사항

- 만료된 데이터 물리적 삭제(삭제 기능은 이미 구현됨) - cron 또는 호출 로직 구현
  - cleanupExpiredIdeas() (line 595-610)가 만료된 unsaved AI 아이디어를 DB에서 삭제합니다. 다만 현재 이 함수를 호출하는 곳이 없으므로 cron이나 적절한 시점에 호출을 추가하는 것이 좋습니다.

- Audit_log 동작 여부 검증

- 데이터베이스 스키마 정제 및 데이터 정제
  - 테이블, 필드 사용 용도 및 기능 반영 여부 점검(테이블 릴레이션, 필드 속성, 데이터 사용 방식 및 업데이트 방식 등)
  - outdate old 데이터 삭제)

- common/types에 .ts 파일과 .react-router/types/app/features/\*\*/+types의 .ts 비교
  - common/types에 별도로 생성한 이유와 사용 목적 확인

- trendtube 생성 과정 단계별로 AI Input과 실행결과 출력(좌우 화면 분리)

- GOOGLE_CLIENT_STT_SCRET_KEY 키값 사용 여부 확인(GEMINI_API_KEY 키로 대체 여부 확인)
