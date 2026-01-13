# System Footprint & URL Map Worksheet for TubeGAI

## 소개

- _본격적인 코딩에 들어가기 전에, 애플리케이션의 전체 구조, 페이지 구성, 사용자 흐름 등을 한눈에 파악하는 것이 이 과제의 목표입니다._
- _단순한 기능 단위의 나열이 아니라, 사용자가 실제 어떤 흐름으로 서비스를 경험하게 되는지를 중심으로 적어보세요._
- _페이지 구성, URL 경로, 사용자 행동, 역할별 권한 등을 사전에 정리하는 작업은, 설계의 누락이나 중복을 방지하고 개발 효율을 높이는 데 도움이 됩니다._
- _실제로 개발할 때 발생할 수 있는 여러 엣지 케이스나 오류 상황도 미리 생각해봄으로써, 더 나은 사용자 경험과 안정성을 갖출 수 있을 것입니다._

## 1. 주요 흐름 (Key Flows)

_애플리케이션 내에서 사용자가 수행하게 될 3~5가지 핵심 여정_

- **트렌드 기반 영상 주제 선정**: 사용자가 특정 키워드를 입력하거나, 유튜브 API를 통해 트렌드를 분석하여, 이를 바탕으로 영상 주제를 선정.
- **AI 대본 생성 및 검토**: 선정된 주제에 맞춰 AI가 대본을 작성해주면, 사용자가 이를 검토하고 확정.
- **콘티(Storyboard) 및 Scene 단위 영상 생성**: AI가 대본에 맞춰 콘티(Storyboard) 생성 및 Scene 단위 영상을 생성. 사용자 요청을 반영하여 AI가 생성한 영상을 수정.
- **B-Roll 매칭**: AI가 대본 맥락에 맞는 스톡 영상을 추천하고, 사용자가 선택한 스톡 영상을 AI가 A-Roll과 자동으로 매칭.
- **포스트 프로덕션**: AI가 대사를 자막으로 넣거나 강조 자막을 생성하고, 색 교정 및 썸네일 제작, SEO 최적화(Search Engine Optimization) 제안. 완성된 영상을 렌더링/익스포팅.

## 2. 사용자가 방문할 URL/페이지

_주요 페이지의 URL과 해당 페이지의 목적, 접근 권한을 정리하세요_

| Page Name               | URL Path                        | Purpose (페이지 목적)                                     | Access Level (접근 권한) |
| ----------------------- | ------------------------------- | --------------------------------------------------------- | ------------------------ |
| Landing Page            | `/`                             | 서비스 소개 및 가입 유도                                  | Public                   |
| Login                   | `/auth/login`                   | 사용자 로그인                                             | Public (Guest)           |
| Dashboard               | `/dashboard`                    | 채널 성과 요약 및 트렌드 스냅샷                           | User (Auth)              |
| Project List            | `/projects`                     | 진행 중/완료된 프로젝트 목록 관리                         | User (Auth)              |
| Project Detail          | `/projects/:projectId`          | 프로젝트 상세 정보 및 스튜디오로 이동                     | User (Auth)              |
| New Project (Trend)     | `/projects/new`                 | **(Flow 1)** 트렌드 분석 및 영상 주제 선정                | User (Auth)              |
| The Studio (Script)     | `/studio/script/:projectId`     | **(Flow 2)** AI 대본 생성                                 | User (Auth)              |
| The Studio (Storyboard) | `/studio/storyboard/:projectId` | **(Flow 3)** AI 콘티(Storyboard) 생성                     | User (Auth)              |
| The Studio (Scene)      | `/studio/scene/:projectId`      | **(Flow 4)** Scene 단위 영상 생성                         | User (Auth)              |
| The Studio (B-Roll)     | `/studio/b-roll/:projectId`     | **(Flow 5)** B-Roll (스톡 영상) 매칭                      | User (Auth)              |
| The Studio (Subtitles)  | `/studio/subtitles/:projectId`  | **(Flow 6-1)** AI 대본 자막 및 강조 자막 생성             | User (Auth)              |
| The Studio (Coloring)   | `/studio/coloring/:projectId`   | **(Flow 6-2)** 영상 색 교정(Color Grading)                | User (Auth)              |
| The Studio (Thumbnail)  | `/studio/thumbnail/:projectId`  | **(Flow 6-3)** 썸네일 제작                                | User (Auth)              |
| The Studio (SEO)        | `/studio/seo/:projectId`        | **(Flow 6-4)** SEO 메타데이터(제목, 태그 등) 추천         | User (Auth)              |
| Export                  | `/studio/export/:projectId`     | **(Flow 6-5)** 최종 영상 렌더링/익스포팅 및 파일 다운로드 | User (Auth)              |
| Settings                | `/settings`                     | 계정 설정, 유튜브 채널 및 AI 서비스 연동                  | User (Auth)              |

## 3. 각 페이지에서 가능한 사용자 행동

_주요 페이지별로 사용자가 할 수 있는 구체적인 액션을 나열해보세요_

### Dashboard (`/dashboard`)

- 내 유튜브 채널의 실시간 성과(구독자, 조회수 등) 확인
- 현재 내 니치(Niche) 시장의 급상승 검색어/토픽 확인 (Trend Snapshot)
- 새로운 프로젝트 생성 버튼 클릭

### Project List (`/projects`)

- 진행 중/완료된 프로젝트 목록 확인
- 프로젝트 상세 정보 확인 ('프로젝트 ID' 버튼)
- 프로젝트 삭제 또는 복제

### Project Detail (`/projects/:projectId`)

- 프로젝트 진행 상태 및 히스토리 확인
- 해당 프로젝트 스튜디오로 이동 ('계속 편집하기' 버튼)
- 완료된 프로젝트 결과물(영상) 확인 및 다운로드

### Trend Analysis (`/projects/new`)

- **(Flow 1)** 키워드 입력 또는 추천 트렌드 선택
- 유튜브 API 기반 트렌드 분석 결과 확인
- AI가 제안한 영상 주제 중 하나를 선택하여 시작

### The Studio - Script (`/studio/script/:projectId`)

- **(Flow 2)** 선정된 주제에 맞춰 AI 대본 생성
- AI가 작성한 대본 검토 및 내용 수정 (확정)

### The Studio - Storyboard (`/studio/storyboard/:projectId`)

- **(Flow 3)** 확정된 대본 기반 AI 콘티(Storyboard) 생성
- 컷 별 이미지 및 구도 수정

### The Studio - Scene (`/studio/scene/:projectId`)

- **(Flow 4)** 확정된 콘티 기반 Scene 영상 생성
- 생성된 Scene 영상을 텍스트 기반으로 수정 요청하여 재생성 (Re-generation)

### The Studio - B-Roll (`/studio/b-roll/:projectId`)

- **(Flow 5)** AI가 추천하는 B-Roll(스톡 영상) 확인
- AI가 추천하는 B-Roll(스톡 영상)을 A-Roll(본 영상)과 자동으로 매칭

### The Studio - Subtitles (`/studio/subtitles/:projectId`)

- **(Flow 6-1)** AI가 대본 자막 및 강조 자막 생성
- 자막 스타일(폰트, 색상) 변경

### The Studio - Coloring (`/studio/coloring/:projectId`)

- **(Flow 6-2)** 영상 색 교정(Color Grading) 필터 적용
- 밝기/대비 등 Scene, B-Roll 간 일관성 있게 세부 조정

### The Studio - Thumbnail (`/studio/thumbnail/:projectId`)

- **(Flow 6-3)** AI가 제안한 썸네일 후보(3~4개) 생성
- 썸네일 텍스트 및 레이아웃 수정

### The Studio - SEO (`/studio/seo/:projectId`)

- **(Flow 6-4)** AI가 최적화된 제목, 설명, 태그를 추천
- 타겟 키워드 수정 및 SEO 점수 확인

### Export (`/studio/export/:projectId`)

- **(Flow 6-5)** 최종 영상 렌더링/익스포팅
- 생성된 영상 파일 다운로드 (MP4)

### Settings (`/settings`)

- 계정 설정, 유튜브 채널 및 AI 서비스 연동

## 4. 사용자 역할 및 권한

_다양한 사용자 유형과 각 역할의 접근 권한 범위를 정의해보세요_

- **Guest (비회원)**: 랜딩 페이지, 회원가입/로그인 액션 가능.
- **User (회원)**: 대시보드 접근, 프로젝트 관리, 스튜디오 기능, 계정 설정.(MVP 기능에는 무료/유료 구분 없음)
- **Admin (관리자)**: 시스템 설정(유튜브 채널 및 AI 서비스 연동, AI 모델 설정)

## 5. 엣지 케이스 및 오류 처리

_예상 가능한 문제 상황과 그것을 어떻게 처리할 것인지 적어보세요_

- **유튜브 API 쿼터 초과**: "일일 검색 한도를 초과했습니다. 내일 다시 시도해주세요." 메시지 표시 및 캐시된 데이터 제공.
- **AI 생성 지연/실패**: "대본을 생성하는 데 시간이 걸리고 있습니다..." 로딩 애니메이션 유지 및 30초 후 타임아웃 시 재시도 버튼 노출.
- **스톡 푸티지 매칭 실패**: 적절한 영상 소스가 없을 경우, 기본 플레이스홀더 이미지 삽입 및 사용자에게 "직접 업로드" 유도.
- **채널 연동 해제**: 토큰 만료 시, 설정 페이지로 리다이렉트하여 "다시 연동하기" 플로우 진행.
