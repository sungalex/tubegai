# Mock를 Real Data(Supabase) 데이터로 변경

# AI 호출 프롬프트를 미세 조정을 위한 Playground 기능 구현

## 코드에 구현된 기능은 google ai Studio에서 검증

# "내 채널 컨텐츠": 내 채널의 기존 컨텐츠 기반 프로젝트 생성

# 저장된 아이디어 탭, 아이디어 Hub 통합

# 이미지, 영상 생성 일괄처리 대시보드 : Opal TrendTube 설정 활용

# 만료된 데이터 물리적 삭제(삭제 기능은 이미 구현됨) - cron 또는 호출 로직 구현

- cleanupExpiredIdeas() (line 595-610)가 만료된 unsaved AI 아이디어를 DB에서 삭제합니다. 다만 현재 이 함수를 호출하는 곳이 없으므로 cron이나 적절한 시점에 호출을 추가하는 것이 좋습니다.
