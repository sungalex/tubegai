# To-Do List

## 프로젝트 초기 설정

### [x] 메뉴바 > projects > Current Project 삭제

- 프로젝트 디테일 페이지는 전체 프로젝트 리스트에서 선택하여 접근하도록 수정(메뉴에서는 삭제하고, Project > list 페이지에서 접근하도록 수정)

### [x] 메뉴바 > projects 하위 메뉴 추가

- Projects 하위에 Channels, Labels 페이지 추가

### [x] Products 메뉴 추가

- Products 메뉴 하위에 TubeGAI, TubeGAI Pro, TubeGAI Plus 등 메뉴을 추가
- TubeGAI Pro, TubeGAI Plus 메뉴는 Disable 상태로 추가

### [x] Dashboard 메뉴를 Projects 메뉴 하위로 이동

### [x] Settings 페이지를 Login Dropdown 메뉴로 이동

- profile: 사용자 정보 관리 (/settings/profile)
- setting: 유튜브 채널 및 AI 서비스 연동 설정 (/settings/integrations)

### [x] Dashboard 페이지 구현

- 유튜브 API를 통해 실시간 트렌드를 분석하고, Project(영상제작) 테마를 선택하는 화면 제공
- 전체 프로젝트, Channels, Labels에 대한 대시보드를 구분해서 보여주도록 수정

### [x] const meta 수정(전체 파일)

- title, description, keywords 수정: 메뉴명 | TubeGAI

### [x] README.md 업데이트

## [ ] Projects 페이지 구현

- Projects 페이지 구현

## [ ] Studio 페이지 구현

- 프로젝트 목록 프로젝트 선택 --> Studio로 이동(/studio/:projectId) --> Studio 기능별 페이지로 이동
- Studio 기능별 페이지에서 프로젝트 ID를 조회하여 해당 프로젝트의 Studio 작업 수행

### [ ] Studio 기능별 페이지 구현
