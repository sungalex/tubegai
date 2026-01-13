# CreatorFlow AI 구현 계획서

## 📋 목차
1. [전체 기능 목록](#전체-기능-목록)
2. [MVP 기능 목록](#mvp-기능-목록)
3. [MVP 구현 단계](#mvp-구현-단계)
4. [전체 기능 구현 단계](#전체-기능-구현-단계)
5. [사전 검토 및 준비 사항](#사전-검토-및-준비-사항)
6. [AI 서비스 우선 구현 전략](#ai-서비스-우선-구현-전략)
7. [기술 스택 및 아키텍처](#기술-스택-및-아키텍처)

---

## 전체 기능 목록

### 1. 기획 및 아이디어 생성
- **AI 기반** 유튜브 트렌드 분석 및 키워드 추천 (Gemini)
- **AI 기반** 채널 성과 데이터 분석 및 콘텐츠 아이디어 제안 (Gemini)
- **AI 기반** 경쟁 채널 분석 및 차별화 포인트 도출 (Gemini Vision)
- **AI 기반** 대본 초안 생성 (Gemini)

### 2. 대본 작성 및 최적화
- LLM 기반 대본 자동 생성
- SEO 최적화 키워드 삽입
- 톤앤매너 맞춤화 (채널별 스타일 학습)
- AI 에이전트 기반 피드백 루프 (사용자 수정 내역 학습)
- 대본 편집 및 수정 인터페이스

### 3. 자동 B-roll 매칭
**우선순위 1: 유튜브 AI 서비스**
- **AI 생성 영상**: YouTube Veo API (비디오 생성)
- **배경 생성**: YouTube Dream Screen API
- 유튜브 API를 통한 관련 영상 클립 추출

**우선순위 2: 무료 AI 서비스**
- 대본 분석 기반 스톡 푸티지 자동 검색 (Pexels, Pixabay 무료)
- Google Vision API (무료 할당량)를 통한 색감 분석

**우선순위 3: 유료 AI 서비스**
- Gemini Vision 기반 맥락 이해도 B-roll 추천
- 색감(Color Palette) 필터링 및 시각적 일관성 유지
- B-roll 타이밍 자동 배치

### 4. 텍스트 기반 편집
- **AI 기반** 대본 분석 및 자동 컷 편집 (Gemini)
- **AI 기반** 자막 자동 생성 및 스타일링 (Gemini + TTS)
- **AI 기반** 전환 효과 자동 선택 및 적용 (Gemini)
- **AI 기반** 음악 생성 및 효과음 자동 배치 (Suno AI / Udio + Gemini)

### 5. 다국어 확산
**우선순위 1: 유튜브 AI 서비스**
- **다국어 더빙**: YouTube AI 음성 생성 API (다국어 지원)
- **다국어 자막**: YouTube AI 자막/번역 API
- **번역**: YouTube AI 번역 API

**우선순위 2: 무료 AI 서비스**
- Google Cloud TTS (무료 할당량, 다국어)
- Google Translate API (무료 할당량)

**우선순위 3: 유료 AI 서비스**
- ElevenLabs (고품질 다국어 TTS)
- Gemini 기반 문화적 맥락 고려 번역 및 현지화
- 로컬라이징 에이전트 (문화적 금기어, 유행어 체크)
- 썸네일 및 배경 요소 자동 현지화
- 다국어 버전 자동 렌더링

### 6. 유튜브 통합
**우선순위 1: 유튜브 AI 서비스**
- 유튜브 API를 통한 직접 업로드
- **썸네일 생성**: YouTube AI 썸네일 생성 API
- **메타데이터 생성**: YouTube AI 메타데이터 생성 API (제목, 설명, 태그)
- SynthID 워크마크 자동 삽입 (AI 콘텐츠 표기)
- self_declared_ai_generated 플래그 자동 설정

**우선순위 2: 무료 AI 서비스**
- Google Vision API를 통한 썸네일 분석

**우선순위 3: 유료 AI 서비스**
- DALL-E 3 / Midjourney (고품질 썸네일 필요 시)
- Gemini 기반 메타데이터 생성 (고급 최적화 필요 시)
- 스케줄링 업로드

### 7. 개인화 및 학습
- 채널별 편집 스타일 학습
- 사용자 선호도 기반 B-roll 추천
- 성과 데이터 기반 최적화 제안
- A/B 테스트 지원

### 8. 다플랫폼 리퍼포징
- 숏폼 자동 생성 (YouTube Shorts, TikTok, Instagram Reels)
- 플랫폼별 최적화 (비율, 길이, 포맷)
- 크로스 플랫폼 업로드

---

## MVP 기능 목록

MVP는 **핵심 워크플로우의 70% 자동화**를 목표로 다음 3가지 핵심 기능에 집중합니다:

### MVP Core Features

1. **유튜브 트렌드 기반 대본 생성**
   - 유튜브 API를 통한 트렌드 키워드 수집
   - 유튜브 Inspiration API를 통한 채널 맞춤형 트렌드 분석
   - LLM을 활용한 대본 초안 생성
   - 기본적인 대본 편집 UI
   - 사용자 수정 내역 기반 피드백 루프 (MVP 후반부)

2. **자동 스톡 푸티지 매칭**
   - 대본 분석을 통한 키워드 추출
   - 스톡 푸티지 API 연동 (Pexels, Pixabay 등)
   - 색감 일관성 기반 B-roll 필터링 (기본)
   - 대본 구간별 B-roll 자동 매칭

3. **AI 다국어 더빙 및 자막 통합 렌더링**
   - TTS API를 통한 음성 생성
   - 자막 자동 생성 및 타임라인 배치
   - 기본 비디오 편집 엔진을 통한 렌더링
   - SynthID 워크마크 자동 삽입 (AI 콘텐츠 표기)

---

## MVP 구현 단계

### Phase 1: 프로젝트 기반 구조 설정 (1주)

#### 1.1 프로젝트 아키텍처 설계
- [ ] 폴더 구조 설계
  ```
  AICreator/
  ├── app/                                    # React Router 7 앱
  │   ├── routes/                             # 라우트 페이지
  │   │   ├── _index.tsx                      # 홈/대시보드
  │   │   ├── auth/                           # 인증 관련
  │   │   │   ├── login.tsx
  │   │   │   ├── callback.tsx                # OAuth 콜백
  │   │   │   └── +types/
  │   │   ├── projects/                       # 프로젝트 관리
  │   │   │   ├── _index.tsx                  # 프로젝트 목록
  │   │   │   ├── $projectId/                 # 프로젝트 상세
  │   │   │   │   ├── _layout.tsx
  │   │   │   │   ├── script/                 # 대본 생성/편집
  │   │   │   │   ├── broll/                  # B-roll 매칭
  │   │   │   │   ├── audio/                  # 오디오/TTS
  │   │   │   │   ├── render/                 # 렌더링
  │   │   │   │   └── upload/                 # 유튜브 업로드
  │   │   │   └── +types/
  │   │   ├── settings/                       # 설정
  │   │   │   ├── profile.tsx
  │   │   │   ├── api-keys.tsx                # API 키 관리
  │   │   │   └── preferences.tsx             # 개인화 설정
  │   │   └── +types/
  │   ├── components/                         # 재사용 가능한 컴포넌트
  │   │   ├── ui/                             # Shadcn UI 기본 컴포넌트
  │   │   │   ├── button.tsx
  │   │   │   ├── dialog.tsx
  │   │   │   ├── form.tsx
  │   │   │   └── ...
  │   │   ├── layout/                         # 레이아웃 컴포넌트
  │   │   │   ├── header.tsx
  │   │   │   ├── sidebar.tsx
  │   │   │   ├── footer.tsx
  │   │   │   └── main-layout.tsx
  │   │   ├── script/                         # 대본 관련 컴포넌트
  │   │   │   ├── script-editor.tsx           # 대본 편집기
  │   │   │   ├── script-generator.tsx        # 대본 생성 UI
  │   │   │   ├── script-preview.tsx          # 대본 프리뷰
  │   │   │   └── feedback-tracker.tsx        # 피드백 루프
  │   │   ├── video/                          # 비디오 관련 컴포넌트
  │   │   │   ├── video-preview.tsx           # 비디오 프리뷰
  │   │   │   ├── video-timeline.tsx          # 타임라인
  │   │   │   ├── broll-selector.tsx           # B-roll 선택기
  │   │   │   ├── subtitle-editor.tsx         # 자막 편집기
  │   │   │   └── render-progress.tsx         # 렌더링 진행률
  │   │   ├── ai/                             # AI 관련 컴포넌트
  │   │   │   ├── ai-status.tsx               # AI 처리 상태
  │   │   │   ├── ai-suggestions.tsx          # AI 제안
  │   │   │   └── ai-feedback.tsx             # AI 피드백
  │   │   └── common/                         # 공통 컴포넌트
  │   │       ├── loading.tsx
  │   │       ├── error-boundary.tsx
  │   │       └── toast.tsx
  │   ├── lib/                                # 라이브러리 및 유틸리티
  │   │   ├── api/                            # API 클라이언트
  │   │   │   ├── youtube/                    # 유튜브 API
  │   │   │   │   ├── client.ts               # 기본 클라이언트
  │   │   │   │   ├── data-api.ts             # Data API v3
  │   │   │   │   ├── veo-api.ts              # Veo API
  │   │   │   │   ├── dream-screen-api.ts     # Dream Screen API
  │   │   │   │   ├── inspiration-api.ts      # Inspiration API
  │   │   │   │   ├── ai-services.ts          # AI 서비스 통합
  │   │   │   │   └── synthid.ts              # SynthID
  │   │   │   ├── gemini/                     # Google Gemini
  │   │   │   │   ├── client.ts
  │   │   │   │   ├── text.ts                 # 텍스트 생성
  │   │   │   │   ├── vision.ts               # 비전 분석
  │   │   │   │   └── embeddings.ts           # 임베딩
  │   │   │   ├── google-cloud/               # Google Cloud 서비스
  │   │   │   │   ├── tts.ts                  # Text-to-Speech
  │   │   │   │   ├── vision.ts                # Vision API
  │   │   │   │   └── translate.ts            # Translate API
  │   │   │   ├── stock-footage/              # 스톡 푸티지
  │   │   │   │   ├── pexels.ts
  │   │   │   │   └── pixabay.ts
  │   │   │   ├── ai-services/                # 기타 AI 서비스
  │   │   │   │   ├── openai.ts               # OpenAI (TTS, DALL-E)
  │   │   │   │   ├── elevenlabs.ts           # ElevenLabs
  │   │   │   │   ├── suno.ts                 # Suno AI
  │   │   │   │   └── udio.ts                 # Udio
  │   │   │   └── supabase/                   # Supabase 클라이언트
  │   │   │       ├── client.ts
  │   │   │       └── storage.ts
  │   │   ├── services/                       # 비즈니스 로직 서비스
  │   │   │   ├── script/                     # 대본 서비스
  │   │   │   │   ├── generator.ts            # 대본 생성
  │   │   │   │   ├── analyzer.ts             # 대본 분석
  │   │   │   │   ├── optimizer.ts            # SEO 최적화
  │   │   │   │   ├── feedback.ts             # 피드백 루프
  │   │   │   │   └── personalization.ts      # 개인화
  │   │   │   ├── video/                      # 비디오 서비스
  │   │   │   │   ├── broll-matcher.ts        # B-roll 매칭
  │   │   │   │   ├── color-analyzer.ts       # 색감 분석
  │   │   │   │   ├── editor.ts               # 편집 로직
  │   │   │   │   └── composer.ts             # 컴포지션
  │   │   │   ├── audio/                      # 오디오 서비스
  │   │   │   │   ├── tts.ts                  # TTS 생성
  │   │   │   │   ├── stt.ts                  # STT (Whisper)
  │   │   │   │   ├── subtitle.ts             # 자막 생성
  │   │   │   │   └── music.ts                # 음악 매칭
  │   │   │   ├── rendering/                  # 렌더링 서비스
  │   │   │   │   ├── client-renderer.ts      # FFmpeg.wasm
  │   │   │   │   ├── server-renderer.ts      # 서버 FFmpeg
  │   │   │   │   ├── queue.ts                # 렌더링 큐
  │   │   │   │   └── synthid.ts              # SynthID 삽입
  │   │   │   ├── localization/               # 현지화 서비스
  │   │   │   │   ├── translator.ts           # 번역
  │   │   │   │   ├── cultural-checker.ts     # 문화적 검증
  │   │   │   │   └── localizer.ts            # 현지화
  │   │   │   ├── youtube/                    # 유튜브 통합
  │   │   │   │   ├── uploader.ts             # 업로드
  │   │   │   │   ├── metadata.ts             # 메타데이터 생성
  │   │   │   │   └── scheduler.ts            # 스케줄링
  │   │   │   └── analytics/                  # 분석 서비스
  │   │   │       ├── trend-analyzer.ts       # 트렌드 분석
  │   │   │       ├── performance.ts          # 성과 분석
  │   │   │       └── recommendations.ts      # 추천
  │   │   ├── utils/                          # 유틸리티 함수
  │   │   │   ├── format.ts                   # 포맷팅
  │   │   │   ├── validation.ts               # 검증
  │   │   │   ├── cache.ts                    # 캐싱
  │   │   │   ├── error-handler.ts            # 에러 처리
  │   │   │   └── constants.ts                # 상수
  │   │   ├── hooks/                          # 커스텀 훅
  │   │   │   ├── use-script.ts
  │   │   │   ├── use-video.ts
  │   │   │   ├── use-render.ts
  │   │   │   └── use-youtube.ts
  │   │   ├── stores/                         # 상태 관리 (Zustand)
  │   │   │   ├── script-store.ts
  │   │   │   ├── video-store.ts
  │   │   │   ├── project-store.ts
  │   │   │   └── user-store.ts
  │   │   └── types/                          # TypeScript 타입
  │   │       ├── script.ts
  │   │       ├── video.ts
  │   │       ├── project.ts
  │   │       ├── user.ts
  │   │       └── api.ts
  │   ├── styles/                             # 스타일
  │   │   ├── app.css
  │   │   └── globals.css
  │   ├── root.tsx                            # 루트 컴포넌트
  │   └── routes.ts                           # 라우트 설정
  ├── server/                                 # 서버 사이드 코드 (선택적)
  │   ├── functions/                          # Supabase Edge Functions
  │   │   ├── render-video/                  # 비디오 렌더링
  │   │   │   └── index.ts
  │   │   ├── process-audio/                 # 오디오 처리
  │   │   │   └── index.ts
  │   │   └── webhook/                        # 웹훅 핸들러
  │   │       └── index.ts
  │   └── scripts/                            # 스크립트
  │       ├── migrate.ts                      # DB 마이그레이션
  │       └── seed.ts                         # 시드 데이터
  ├── supabase/                               # Supabase 설정
  │   ├── migrations/                         # DB 마이그레이션
  │   │   └── *.sql
  │   ├── functions/                          # Edge Functions
  │   │   └── ...
  │   └── config.toml                         # Supabase 설정
  ├── public/                                 # 정적 파일
  │   ├── favicon.ico
  │   └── assets/
  ├── tests/                                  # 테스트
  │   ├── unit/
  │   ├── integration/
  │   └── e2e/
  ├── .env.example                            # 환경 변수 예제
  ├── .gitignore
  ├── package.json
  ├── tsconfig.json
  ├── vite.config.ts
  ├── react-router.config.ts
  └── README.md
  ```

**폴더 구조 설계 원칙:**
1. **도메인 기반 구조**: 기능별로 명확히 분리 (script, video, audio 등)
2. **계층적 아키텍처**: API → Service → Component 순서로 의존성 관리
3. **확장성**: 새로운 AI 서비스나 기능 추가 시 쉽게 확장 가능
4. **재사용성**: 공통 컴포넌트와 유틸리티를 명확히 분리
5. **타입 안정성**: TypeScript 타입을 중앙에서 관리

**주요 폴더 설명:**

- **`app/routes/`**: React Router 7 라우트 페이지
  - 동적 라우팅 지원 (`$projectId`)
  - 각 페이지는 독립적인 loader, action, meta 함수 포함

- **`app/lib/api/`**: 외부 API 클라이언트
  - 서비스별로 폴더 분리 (youtube, gemini, google-cloud 등)
  - 각 API는 독립적인 클라이언트로 관리
  - 에러 핸들링 및 재시도 로직 포함

- **`app/lib/services/`**: 비즈니스 로직 레이어
  - API 결과를 비즈니스 로직으로 변환
  - 도메인별 서비스 분리 (script, video, audio 등)
  - AI 서비스 결과를 통합하여 처리

- **`app/components/`**: UI 컴포넌트
  - 기능별로 폴더 분리 (script, video, ai 등)
  - 재사용 가능한 공통 컴포넌트는 `common/`에 배치
  - Shadcn UI 기본 컴포넌트는 `ui/`에 배치

- **`app/lib/stores/`**: 전역 상태 관리
  - Zustand를 사용한 상태 관리
  - 도메인별 스토어 분리

- **`server/functions/`**: Supabase Edge Functions
  - 무거운 작업(렌더링, 오디오 처리)은 서버에서 처리
  - 각 함수는 독립적으로 배포 가능

- **`supabase/`**: Supabase 설정 및 마이그레이션
  - 데이터베이스 스키마 관리
  - Edge Functions 코드

#### 1.2 인증 및 사용자 관리
- [ ] Supabase 인증 설정
- [ ] 사용자 프로필 관리
- [ ] 유튜브 OAuth 연동 준비

#### 1.3 기본 UI 컴포넌트 구축
- [ ] Shadcn UI 설치 및 설정
- [ ] 레이아웃 컴포넌트 (Header, Sidebar, Footer)
- [ ] 대시보드 기본 구조

**기술 스택 추가:**
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install @radix-ui/react-* (Shadcn UI 설치 시 자동)
npm install zod react-hook-form @hookform/resolvers
```

---

### Phase 2: 유튜브 API 연동 (1주)

#### 2.1 유튜브 API 설정
- [ ] Google Cloud Console 프로젝트 생성
- [ ] YouTube Data API v3 활성화
- [ ] OAuth 2.0 클라이언트 ID 생성
- [ ] API 키 및 인증 정보 환경 변수 설정

#### 2.2 유튜브 트렌드 데이터 수집
**배경**: 범용 트렌드보다 채널 구독자 맞춤형 트렌드 데이터를 우선 활용하여 조회수 상승에 더 효과적인 데이터를 활용합니다.

- [ ] 트렌딩 비디오 API 연동
- [ ] **유튜브 Inspiration API 심층 통합** (우선순위)
  - 구독자가 보고 싶어 하는 주제 데이터 수집
  - 채널 맞춤형 트렌드 분석
- [ ] 키워드 트렌드 분석 함수 구현
- [ ] 채널 성과 데이터 수집 (조회수, 구독자 등)
- [ ] 데이터 캐싱 전략 수립

**필요한 API 엔드포인트:**
- `videos/list` - 트렌딩 비디오 조회
- `search/list` - 키워드 기반 검색
- `channels/list` - 채널 정보 조회
- `inspiration` - Inspiration API (채널 맞춤형 트렌드)
- `analytics` - 채널 분석 데이터 (향후)

#### 2.4 API 할당량 관리 전략
- [ ] 사용자 개인 YouTube 클라이언트 ID 입력 옵션 제공
- [ ] 공유 API 키와 개인 API 키 선택 로직 구현
- [ ] 할당량 모니터링 및 알림 시스템
- [ ] 사용자별 할당량 사용량 추적

**환경 변수 설정:**
```env
YOUTUBE_API_KEY=your_api_key
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
```

#### 2.3 트렌드 분석 UI
- [ ] 트렌드 키워드 표시 컴포넌트
- [ ] 키워드 선택 인터페이스
- [ ] 트렌드 차트 시각화

---

### Phase 3: 대본 생성 기능 (2주)

#### 3.1 LLM API 연동 (우선순위 기반)
**우선순위 1: 유튜브 AI 서비스**
- [ ] YouTube AI 대본 생성 API 확인 및 연동 (가능한 경우)
- [ ] YouTube AI 메타데이터 생성 API 연동

**우선순위 2: 무료 AI 서비스**
- [ ] **Google Gemini API (무료 티어) 설정**
- [ ] Hugging Face 오픈소스 모델 검토 (Llama, Mistral 등)
- [ ] 프롬프트 엔지니어링
  - 트렌드 키워드 기반 대본 생성 프롬프트
  - 채널 톤앤매너 반영 프롬프트
  - SEO 최적화 프롬프트
- [ ] API 클라이언트 구현
- [ ] 에러 핸들링 및 재시도 로직

**우선순위 3: 유료 AI 서비스**
- [ ] **Google Gemini Pro API 설정** (고품질 필요 시)
- [ ] 대본 생성 전용 프롬프트 템플릿

#### 3.2 대본 생성 서비스
- [ ] 대본 생성 함수 구현
  - 입력: 키워드, 채널 정보, 영상 길이, 톤앤매너
  - 출력: 구조화된 대본 (구간별 텍스트, 타임스탬프)
- [ ] 대본 구조 파싱 (구간 분리, 타임스탬프 추출)
- [ ] 대본 저장 및 관리 (Supabase DB)

#### 3.4 AI 피드백 루프 시스템 (MVP 후반부)
**배경**: 대본 생성이 일방향(입력→출력)으로 개인화가 부족한 문제를 해결하여 채널 고유 톤앤매너를 구축합니다.

- [ ] 사용자 수정 내역 추적 시스템
  - 삭제된 문장/구문 기록
  - 자주 수정되는 단어/표현 추적
  - 선호하는 톤앤매너 패턴 분석
- [ ] 채널별 개인화 데이터 저장
- [ ] 다음 대본 생성 시 학습 데이터 반영 로직
- [ ] 개인화된 프롬프트 자동 생성

**데이터베이스 스키마 추가:**
```sql
-- script_feedback 테이블 (피드백 루프)
CREATE TABLE script_feedback (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  script_id UUID REFERENCES scripts(id),
  deleted_segments JSONB, -- 삭제된 구간
  modified_words JSONB, -- 수정된 단어/표현
  preferred_tone TEXT, -- 선호하는 톤
  created_at TIMESTAMP
);

-- user_preferences 테이블 (채널별 개인화)
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  tone_style JSONB, -- 톤앤매너 패턴
  preferred_keywords TEXT[],
  editing_style JSONB,
  updated_at TIMESTAMP
);
```

#### 3.3 대본 편집기 UI
- [ ] 리치 텍스트 에디터 구현
- [ ] 구간별 편집 기능
- [ ] 실시간 프리뷰
- [ ] 대본 저장/불러오기

**데이터베이스 스키마:**
```sql
-- scripts 테이블
CREATE TABLE scripts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  content JSONB, -- 구조화된 대본 데이터
  keywords TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

### Phase 4: 스톡 푸티지 매칭 (2주)

#### 4.1 스톡 푸티지 API 연동 (우선순위 기반)
**우선순위 1: 유튜브 AI 서비스**
- [ ] **YouTube Veo API 연동** (AI 비디오 생성)
- [ ] **YouTube Dream Screen API 연동** (배경 생성)
- [ ] 유튜브 API를 통한 관련 영상 클립 추출

**우선순위 2: 무료 AI 서비스**
- [ ] Pexels API 연동 (무료, 고품질, 월 200회)
- [ ] Pixabay API 연동 (무료, 월 제한)
- [ ] API 클라이언트 구현
- [ ] 비디오 검색 및 다운로드 함수

**우선순위 3: 유료 AI 서비스**
- [ ] 유료 스톡 푸티지 서비스 검토 (필요 시)

#### 4.2 대본 분석 및 키워드 추출 (AI 서비스 활용)
- [ ] **Gemini를 활용한 대본 분석**
  - 대본 구간별 키워드 추출
  - 감정/분위기 분석 (AI 기반 감정 분석)
  - 장면 타입 분류 (설명, 예시, 전환 등)
  - 맥락 이해 및 의미 분석
- [ ] 구조화된 분석 결과 파싱 (JSON 형식)
- [ ] 분석 결과 캐싱 (재분석 비용 절감)

#### 4.3 B-roll 자동 매칭 알고리즘 (우선순위 기반)
**배경**: 단순 키워드 매칭으로 인한 시각적 일관성 부족 문제를 해결하여 유사한 톤의 B-roll을 우선 추천합니다.

**우선순위 1: 유튜브 AI 서비스**
- [ ] YouTube Veo API를 통한 AI 비디오 생성
- [ ] YouTube Dream Screen API를 통한 배경 생성

**우선순위 2: 무료 AI 서비스**
- [ ] 키워드 기반 비디오 검색 (Pexels, Pixabay)
- [ ] **Google Vision API를 활용한 시각적 분석** (무료 할당량)
  - 비디오 프레임 색상 추출 및 분석
  - 색감 일관성 점수 계산
  - 기본적인 시각적 분석
  - **색감(Color Palette) 필터링** 기능

**우선순위 3: 유료 AI 서비스**
- [ ] **Gemini Vision을 활용한 고급 시각적 분석**
  - 시각적 맥락 이해 (객체, 장면, 분위기)
- [ ] **Gemini 기반 맥락 이해도 매칭**
  - 대본 맥락과 B-roll 시각적 내용 매칭
  - 감정/분위기 일치도 분석
  - 관련도 점수 계산 (AI 기반)
- [ ] 구간별 B-roll 자동 배치 (AI 추천 기반)
- [ ] 수동 조정 인터페이스

#### 4.4 B-roll 관리 UI
- [ ] 검색 결과 표시
- [ ] B-roll 미리보기
- [ ] 타임라인에 B-roll 배치
- [ ] 대본 구간과 B-roll 연결

**데이터베이스 스키마:**
```sql
-- video_assets 테이블
CREATE TABLE video_assets (
  id UUID PRIMARY KEY,
  script_id UUID REFERENCES scripts(id),
  source TEXT, -- 'pexels', 'pixabay', 'user_upload'
  url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  start_time FLOAT, -- 대본에서 시작 시간
  end_time FLOAT,
  keywords TEXT[]
);
```

---

### Phase 5: TTS 및 자막 생성 (1주)

#### 5.1 TTS API 연동 (우선순위 기반)
**우선순위 1: 유튜브 AI 서비스**
- [ ] **YouTube AI 음성 생성 API 연동**
- [ ] **YouTube AI 자막/번역 API 연동**
- [ ] 다국어 음성 생성
- [ ] 음성 스타일 선택 (성별, 톤, 속도)
- [ ] 오디오 파일 생성 및 저장

**우선순위 2: 무료 AI 서비스**
- [ ] Google Cloud Text-to-Speech 연동 (무료 할당량)
- [ ] 다국어 음성 생성 (무료 티어 내)

**우선순위 3: 유료 AI 서비스**
- [ ] OpenAI TTS (tts-1 또는 tts-1-hd) - 고품질 필요 시
- [ ] ElevenLabs - 프리미엄 음질 필요 시

#### 5.4 문화적 현지화 (우선순위 기반)
**배경**: 단순 번역을 넘어선 문화적 현지화를 통해 썸네일 및 배경 요소까지 자동 현지화합니다.

**우선순위 1: 유튜브 AI 서비스**
- [ ] **YouTube AI 번역 API 활용** (문화적 맥락 고려)
- [ ] **YouTube AI 썸네일 생성 API** (다국어 버전)

**우선순위 2: 무료 AI 서비스**
- [ ] Google Translate API (무료 할당량, 기본 번역)
- [ ] Hugging Face 오픈소스 번역 모델

**우선순위 3: 유료 AI 서비스**
- [ ] **Gemini를 활용한 고급 문화적 현지화**
  - 문화적 금기어 체크 (AI 기반 검증)
  - 유행어 및 현지 표현 자동 반영
  - 번역 품질 검증 (문화적 맥락 고려)
  - 지역별 문화적 뉘앙스 분석
- [ ] **DALL-E 3를 활용한 썸네일 현지화**
  - 썸네일 텍스트 자동 현지화
  - 문화적 요소 반영 (통화, 날짜 형식, 색상 선호도 등)
- [ ] 배경 요소 현지화 (AI 기반 자동 변환)

#### 5.2 자막 생성
- [ ] Whisper API 또는 대체 STT 서비스
- [ ] 타임스탬프 기반 자막 생성
- [ ] 자막 스타일링 (폰트, 색상, 위치)
- [ ] SRT/VTT 파일 생성

#### 5.3 오디오/자막 통합
- [ ] 오디오와 자막 동기화
- [ ] 자막 타이밍 조정
- [ ] 프리뷰 기능

---

### Phase 6: 비디오 렌더링 (2주)

#### 6.1 비디오 편집 엔진 선택 (하이브리드 방식)
**하이브리드 접근 방식 (권장)**

**배경**: 서버 사이드 렌더링만 사용 시 사용자 증가에 따른 서버 비용과 대기 시간이 급증하는 문제를 해결하기 위해 하이브리드 방식을 채택합니다.

**클라이언트 사이드 (FFmpeg.wasm) - 실시간 프리뷰용**
- 실시간 프리뷰 및 간단한 컷 편집
- 서버 부하 감소
- 즉각적인 편집 경험 제공

**서버 사이드 (FFmpeg + Node.js) - 최종 렌더링용**
- 고화질 최종 렌더링
- 복잡한 컴포지션 처리
- 서버 비용 최적화 (프리뷰는 클라이언트에서 처리)

**옵션 3: 클라우드 서비스 (Mux, Cloudinary)**
- 장점: 확장성, 관리 편의성
- 단점: 비용, API 의존성

**MVP 추천: 하이브리드 방식 (FFmpeg.wasm + 서버 FFmpeg)**
- 프리뷰: FFmpeg.wasm (클라이언트)
- 최종 렌더링: 서버 FFmpeg

#### 6.2 렌더링 서비스 구현
**배경**: 유튜브 AI 생성 콘텐츠 표기 의무화 정책에 따라 SynthID 워크마크를 자동 삽입하여 정책 위반으로 인한 채널 정지를 방지합니다.

- [ ] FFmpeg.wasm 클라이언트 사이드 설정
  - 실시간 프리뷰 렌더링
  - 간단한 컷 편집 기능
- [ ] 서버 사이드 FFmpeg 설치 및 설정
- [ ] 비디오 컴포지션 로직
  - 메인 비디오 + B-roll 오버레이
  - 자막 오버레이
  - 오디오 믹싱
  - **SynthID 워크마크 자동 삽입** (AI 콘텐츠 표기, 비가시적 워크마크)

#### 6.4 썸네일 자동 생성 (우선순위 기반)
**우선순위 1: 유튜브 AI 서비스**
- [ ] **YouTube AI 썸네일 생성 API 연동**
  - 대본 내용 기반 썸네일 자동 생성
  - 채널 스타일에 맞는 썸네일 생성
- [ ] 썸네일 텍스트 오버레이
- [ ] 다국어 버전 썸네일 자동 생성

**우선순위 2: 무료 AI 서비스**
- [ ] Stable Diffusion (오픈소스, 자체 호스팅)
- [ ] Google Vision API를 통한 썸네일 분석

**우선순위 3: 유료 AI 서비스**
- [ ] **DALL-E 3 또는 Midjourney API 연동** (고품질 필요 시)
  - 대본 내용 기반 썸네일 프롬프트 생성 (Gemini)
  - AI 이미지 생성

- [ ] 렌더링 큐 시스템
- [ ] 진행률 추적

#### 6.3 렌더링 API 엔드포인트
- [ ] 렌더링 작업 생성 API
- [ ] 진행률 조회 API
- [ ] 완료된 비디오 다운로드 API

**서버 구조 (Supabase Edge Functions 또는 별도 Node.js 서버):**
```
functions/
  └── render-video/
      └── index.ts
```

---

### Phase 7: 통합 및 테스트 (1주)

#### 7.1 전체 워크플로우 통합
- [ ] 대본 생성 → B-roll 매칭 → 렌더링 파이프라인 연결
- [ ] 에러 핸들링 및 롤백 로직
- [ ] 사용자 피드백 수집 포인트

#### 7.2 UI/UX 개선
- [ ] 로딩 상태 표시
- [ ] 진행률 바
- [ ] 에러 메시지 개선
- [ ] 반응형 디자인

#### 7.3 성능 최적화
- [ ] API 호출 최적화
- [ ] 이미지/비디오 최적화
- [ ] 캐싱 전략 적용

#### 7.4 테스트
- [ ] 단위 테스트 (핵심 서비스)
- [ ] 통합 테스트 (전체 워크플로우)
- [ ] 사용자 테스트 (베타 테스터 10명)

---

## 전체 기능 구현 단계

MVP 완료 후 다음 단계로 확장:

### Phase 8: 유튜브 직접 업로드 (2주)
- [ ] 유튜브 OAuth 완전 연동
- [ ] 비디오 업로드 API
- [ ] **self_declared_ai_generated 플래그 자동 설정**
  - AI 생성 콘텐츠 자동 표기
  - 유튜브 정책 준수
- [ ] **AI 기반 메타데이터 자동 생성 (우선순위 기반)**
  **우선순위 1: 유튜브 AI 서비스**
  - YouTube AI 메타데이터 생성 API 활용
    - 제목 생성 (SEO 최적화)
    - 설명 생성 (키워드 포함)
    - 태그 자동 생성
    - 채널 성과 데이터 기반 최적화
  
  **우선순위 2: 무료 AI 서비스**
  - Gemini API (무료 티어)를 활용한 기본 메타데이터 생성
  
  **우선순위 3: 유료 AI 서비스**
  - Gemini Pro를 활용한 고급 메타데이터 생성 (고품질 필요 시)
- [ ] 메타데이터 자동 입력
- [ ] 스케줄링 기능

### Phase 9: 개인화 및 학습 (3주)
- [ ] 채널별 편집 스타일 분석
- [ ] 사용자 선호도 학습
- [ ] 맞춤형 추천 시스템

### Phase 10: 다국어 확산 고도화 (2주)
- [ ] 문화적 맥락 고려 번역 (로컬라이징 에이전트 고도화)
- [ ] 썸네일 및 배경 요소 자동 현지화
- [ ] 다국어 버전 일괄 생성
- [ ] 번역 품질 검증

### Phase 11: 다플랫폼 리퍼포징 (3주)
- [ ] 숏폼 자동 생성
- [ ] 플랫폼별 최적화
- [ ] 크로스 플랫폼 업로드

### Phase 12: 고급 편집 기능 (4주)
**우선순위 1: 유튜브 AI 서비스**
- [ ] **YouTube AI 자동 편집 기능 활용** (가능한 경우)
- [ ] **YouTube AI 음악 생성 API 활용** (가능한 경우)

**우선순위 2: 무료 AI 서비스**
- [ ] Google Vision API를 통한 기본 색감 분석
- [ ] 전환 효과 라이브러리 통합 (오픈소스)

**우선순위 3: 유료 AI 서비스**
- [ ] **AI 기반 전환 효과 자동 선택**
  - Gemini가 대본 맥락 분석하여 적절한 전환 효과 추천
  - 전환 효과 라이브러리 통합
- [ ] **AI 음악 생성 및 자동 배치**
  - Suno AI / Udio API 연동 (배경 음악 자동 생성)
  - Gemini가 대본 분위기 분석하여 음악 스타일 추천
  - 음악 자동 배치 및 타이밍 조정
- [ ] **AI 기반 색상 보정**
  - Gemini Vision으로 색감 분석
  - 일관성 있는 색상 보정 자동 적용
- [ ] **AI 기반 고급 자막 애니메이션**
  - Gemini가 톤앤매너 분석하여 자막 스타일 추천
  - 자막 애니메이션 자동 적용

---

## 사전 검토 및 준비 사항

### 🔴 Critical (즉시 검토 필요)

#### 1. 유튜브 API 제한사항 및 정책
- [ ] **YouTube Data API v3 할당량 확인**
  - 일일 할당량: 기본 10,000 units/day
  - 주요 작업별 units:
    - `videos.list`: 1 unit
    - `search.list`: 100 units
    - `channels.list`: 1 unit
  - **액션**: 할당량 증가 요청 필요 여부 확인

- [ ] **API 할당량 공유 경제 모델 구현**
  - 사용자 개인 YouTube 클라이언트 ID 입력 옵션 제공
  - 서비스 공유 API 키와 개인 API 키 선택 로직
  - 할당량 모니터링 및 사용량 추적
  - **목적**: 서비스 운영 비용 절감 및 대규모 사용자 수용

- [ ] **YouTube API 서비스 약관 검토**
  - 서드파티 업로드 정책
  - AI 생성 콘텐츠 표기 요구사항 (2025-2026 최신 정책)
  - 저작권 정책

- [ ] **YouTube Partner Program 요구사항**
  - API 업로드 권한은 파트너 프로그램 가입 필요
  - 초기 MVP는 다운로드만 제공 후 업로드는 Phase 8에서 구현

- [ ] **유튜브 Inspiration API 접근 권한 확인**
  - Inspiration API 사용 가능 여부 확인
  - API 문서 및 사용 제한 사항 검토

#### 2. AI 콘텐츠 표기 및 저작권
- [ ] **유튜브 AI 콘텐츠 표기 정책 준수 (2025-2026 최신 정책)**
  - AI로 생성된 콘텐츠는 반드시 표기 필요
  - **SynthID 워크마크 자동 삽입** (구글의 비가시적 워크마크)
  - **self_declared_ai_generated 플래그 자동 설정**
  - API를 통한 자동 표기 방법 구현

- [ ] **저작권 문제**
  - 스톡 푸티지 라이선스 확인 (Pexels, Pixabay는 무료 사용 가능)
  - TTS 음성 저작권
  - 생성된 콘텐츠의 저작권 귀속

- [ ] **SynthID API 연동**
  - 구글 SynthID API 문서 검토
  - 워크마크 삽입 로직 구현
  - 메타데이터에 AI 생성 정보 자동 추가

#### 3. 비용 구조 분석 (우선순위 기반)
- [ ] **우선순위 1: 유튜브 AI 서비스 비용**
  - YouTube Veo API: 가격 정책 확인 필요
  - YouTube Dream Screen API: 가격 정책 확인 필요
  - YouTube AI 음성/자막/번역 API: 가격 정책 확인 필요
  - YouTube AI 썸네일/메타데이터 생성 API: 가격 정책 확인 필요
  - YouTube Data API v3: 무료 (할당량 내)
  - **예상**: 유튜브 AI 서비스는 무료 또는 저렴한 가격 정책일 가능성 높음

- [ ] **우선순위 2: 무료 AI 서비스 비용**
  - **Google Gemini API (무료 티어)**: 무료 (제한된 할당량)
  - Google Cloud TTS/Vision/Translate API: 무료 (제한된 할당량)
  - Pexels/Pixabay API: 무료
  - Hugging Face 오픈소스 모델: 무료 (자체 호스팅 비용만)
  - **예상**: 무료 티어 내에서 운영 가능

- [ ] **우선순위 3: 유료 AI 서비스 비용** (필요 시만)
  - **Google Gemini Pro**: 가격 정책 확인 필요 (일반적으로 GPT-4보다 저렴)
  - **Gemini Vision**: 가격 정책 확인 필요
  - OpenAI TTS: $15/1M characters
  - DALL-E 3: $0.04/image (1024x1024)
  - ElevenLabs TTS: $0.18/1K characters (프리미엄 음질)
  - Suno AI / Udio: API 가격 확인 필요

- [ ] **기타 비용**
  - 렌더링 서버: AWS/GCP 인스턴스 비용
  - 스토리지: Supabase Storage 비용

- [ ] **월간 사용량 예상 및 비용 계산**
  - 사용자 100명 기준 예상 비용 산출
  - **우선순위 1, 2 서비스 우선 활용으로 비용 최소화**
  - AI 서비스 사용량 최적화 전략 (캐싱, 배치 처리)
  - 가격 모델 설계 (무료 티어 vs 유료)

#### 4. 기술적 제약사항
- [ ] **렌더링 성능 (하이브리드 방식)**
  - FFmpeg.wasm 클라이언트 성능 테스트
  - 서버 FFmpeg 사양 결정 (CPU, RAM, 스토리지)
  - 동시 렌더링 작업 수 제한
  - 렌더링 시간 예상 (1분 영상 = ?분 렌더링)
  - 프리뷰 vs 최종 렌더링 성능 비교

- [ ] **스토리지 용량**
  - 비디오 파일 저장 공간 (Supabase Storage 제한 확인)
  - CDN 필요 여부
  - 프리뷰 파일 임시 저장 전략

### 🟡 Important (구현 전 검토)

#### 5. 데이터베이스 설계
- [ ] **Supabase 스키마 설계**
  - 사용자, 프로젝트, 스크립트, 비디오 에셋 테이블
  - 관계 및 인덱스 최적화
  - Row Level Security (RLS) 정책

- [ ] **데이터 백업 전략**
  - 자동 백업 설정
  - 재해 복구 계획

#### 6. 보안 및 인증
- [ ] **OAuth 2.0 플로우 설계**
  - 유튜브 인증 플로우
  - 토큰 갱신 로직
  - 보안 저장소 (환경 변수)

- [ ] **API 키 관리**
  - 서버 사이드에서만 API 키 사용
  - 클라이언트 노출 방지

#### 7. 확장성 고려사항
- [ ] **서버 아키텍처**
  - 렌더링 서버 스케일 아웃 전략
  - 큐 시스템 (Bull, BullMQ 등)
  - 로드 밸런싱

- [ ] **캐싱 전략**
  - Redis 또는 Supabase 캐싱
  - API 응답 캐싱
  - 비디오 프리뷰 캐싱

### 🟢 Nice to Have (구현 중 점진적 개선)

#### 8. 모니터링 및 로깅
- [ ] **에러 추적**
  - Sentry 또는 유사 서비스
  - 로그 수집 시스템

- [ ] **성능 모니터링**
  - API 응답 시간 추적
  - 렌더링 시간 통계
  - 사용자 행동 분석

#### 9. 사용자 경험
- [ ] **온보딩 플로우**
  - 첫 사용자 가이드
  - 튜토리얼

- [ ] **피드백 수집**
  - 인앱 피드백 시스템
  - 사용자 설문

---

## AI 서비스 우선 구현 전략

본 프로젝트는 **AI 서비스를 최우선으로 활용**하여 개발 효율성을 극대화하고 사용자 경험을 향상시킵니다.

### 기술 선택 우선순위

기술적 구현 방법 선택 시 다음 순서로 우선순위를 적용합니다:

1. **유튜브의 AI 서비스를 연동하여 활용** (최우선)
   - YouTube Veo (비디오 생성)
   - YouTube Dream Screen (배경 생성)
   - YouTube AI 음악 생성
   - YouTube AI 자막/번역
   - YouTube AI 썸네일 생성
   - YouTube AI 메타데이터 생성
   - YouTube AI 자동 편집 기능

2. **무료 AI 서비스를 이용하여 구현**
   - OpenAI API (무료 티어)
   - Google Cloud TTS (무료 할당량)
   - Pexels/Pixabay (무료 스톡 푸티지)
   - Hugging Face (오픈소스 모델)

3. **유료 AI 서비스를 이용하여 구현 또는 자체 기능 구현**
   - OpenAI GPT-4 (유료)
   - DALL-E 3 (유료)
   - ElevenLabs (유료)
   - Suno AI / Udio (유료)
   - 자체 구현 (FFmpeg 등)

### 핵심 AI 서비스 활용 영역

#### 1. 콘텐츠 생성 및 분석
**우선순위 1: 유튜브 AI 서비스**
- **메타데이터 생성**: YouTube AI 메타데이터 생성 API (제목, 설명, 태그)

**우선순위 2: 무료 AI 서비스**
- **대본 생성**: Google Gemini API (무료 티어) / Hugging Face 오픈소스 모델
- **대본 분석**: Gemini (무료 티어) / Hugging Face NLP 모델 (키워드 추출, 감정 분석)

**우선순위 3: 유료 AI 서비스**
- **대본 생성**: Google Gemini Pro (고품질 필요 시)
- **대본 분석**: Gemini Vision (고급 분석 필요 시)
- **경쟁 채널 분석**: Gemini + YouTube API 데이터 분석

#### 2. 비전 및 이미지 처리
**우선순위 1: 유튜브 AI 서비스**
- **썸네일 생성**: YouTube AI 썸네일 생성 API
- **배경 생성**: YouTube Dream Screen API

**우선순위 2: 무료 AI 서비스**
- **색감 분석**: Google Vision API (무료 할당량)
- **이미지 생성**: Stable Diffusion (오픈소스, 자체 호스팅)

**우선순위 3: 유료 AI 서비스**
- **썸네일 생성**: DALL-E 3 / Midjourney API (고품질 필요 시)
- **색감 분석**: Gemini Vision (고급 분석 필요 시)
- **B-roll 시각적 매칭**: Gemini Vision (맥락 이해 기반 추천)
- **이미지 현지화**: DALL-E 3 (썸네일 텍스트 자동 현지화)

#### 3. 오디오 및 음성 처리
**우선순위 1: 유튜브 AI 서비스**
- **TTS (Text-to-Speech)**: YouTube AI 음성 생성 API
- **자막/번역**: YouTube AI 자막/번역 API
- **음악 생성**: YouTube AI 음악 생성 API (가능한 경우)

**우선순위 2: 무료 AI 서비스**
- **TTS**: Google Cloud TTS (무료 할당량)
- **STT**: OpenAI Whisper (오픈소스, 자체 호스팅 가능)
- **번역**: Google Translate API (무료 할당량)

**우선순위 3: 유료 AI 서비스**
- **TTS**: OpenAI TTS / ElevenLabs (고품질 음성 필요 시)
- **음악 생성**: Suno AI / Udio API (배경 음악 자동 생성)
- **효과음 매칭**: Gemini 기반 오디오 분석 및 추천

#### 4. 비디오 편집 자동화
- **전환 효과 선택**: Gemini (대본 맥락 기반 자동 선택)
- **컷 편집**: Gemini (대본 분석 기반 자동 컷 포인트 추천)
- **자막 스타일링**: Gemini (톤앤매너 기반 자막 스타일 추천)

#### 5. 번역 및 현지화
- **번역**: Gemini / Google Translate API
- **문화적 현지화**: Gemini (금기어 체크, 유행어 반영)
- **다국어 더빙**: ElevenLabs (다국어 음성 생성)

#### 6. AI 에이전트 및 자동화
- **피드백 루프**: Gemini (사용자 수정 패턴 학습)
- **개인화 추천**: Gemini (채널별 스타일 학습)
- **워크플로우 최적화**: Gemini (사용자 행동 분석 기반 제안)

### AI 서비스 선택 기준

1. **품질 우선**: 최고 품질의 AI 서비스 선택 (Gemini Pro 등)
2. **API 우선**: 직접 구현보다 검증된 AI API 활용
3. **비용 효율**: 사용량에 따른 비용 최적화
4. **확장성**: 향후 더 나은 AI 모델로 교체 가능한 구조

### AI 서비스 통합 아키텍처

```
┌─────────────────────────────────────────┐
│         AI Service Layer                │
├─────────────────────────────────────────┤
│  • LLM Services (Gemini)                │
│  • Vision Services (Gemini Vision)      │
│  • Audio Services (TTS, STT, Music)     │
│  • Image Generation (DALL-E, Midjourney)│
│  • Translation & Localization           │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│      Business Logic Layer               │
│  (AI 결과를 비즈니스 로직으로 변환)            │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│      Application Layer                  │
│  (사용자 인터페이스 및 워크플로우)              │
└─────────────────────────────────────────┘
```

---

## 기술 스택 및 아키텍처

### Frontend
- **Framework**: React Router 7
- **UI**: Shadcn UI + Radix UI + Tailwind CSS
- **State Management**: React Hooks + Context API (필요시 Zustand)
- **Form**: React Hook Form + Zod
- **Video Preview**: Video.js 또는 React Player
- **Video Editing (Client)**: FFmpeg.wasm (실시간 프리뷰 및 간단한 편집)

### Backend
- **Runtime**: Node.js (Supabase Edge Functions 또는 별도 서버)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth

### APIs & Services (우선순위 기반)

#### 우선순위 1: 유튜브 AI 서비스 (최우선)
- **비디오 생성**: YouTube Veo API
- **배경 생성**: YouTube Dream Screen API
- **음성 생성**: YouTube AI 음성 생성 API
- **자막/번역**: YouTube AI 자막/번역 API
- **썸네일 생성**: YouTube AI 썸네일 생성 API
- **메타데이터 생성**: YouTube AI 메타데이터 생성 API
- **기타**: YouTube Data API v3, Inspiration API
- **AI 표기**: Google SynthID API

#### 우선순위 2: 무료 AI 서비스
- **LLM**: Google Gemini API (무료 티어) / Hugging Face 오픈소스 모델
- **Vision AI**: Google Vision API (무료 할당량)
- **TTS**: Google Cloud TTS (무료 할당량)
- **STT**: OpenAI Whisper (오픈소스, 자체 호스팅 가능)
- **이미지 생성**: Stable Diffusion (오픈소스, 자체 호스팅)
- **번역**: Google Translate API (무료 할당량)
- **Stock Footage**: Pexels API, Pixabay API (무료)

#### 우선순위 3: 유료 AI 서비스 또는 자체 구현
- **LLM**: Google Gemini Pro (고품질 필요 시)
- **Vision AI**: Gemini Vision (고급 분석 필요 시)
- **TTS**: OpenAI TTS / ElevenLabs (고품질 음성 필요 시)
- **이미지 생성**: DALL-E 3 API / Midjourney API (고품질 필요 시)
- **음악 생성**: Suno AI API / Udio API (배경 음악)
- **번역**: Gemini (고품질 번역 필요 시)
- **Video Rendering**: 
  - FFmpeg.wasm (클라이언트 - 프리뷰 및 간단한 편집)
  - FFmpeg (서버 사이드 - 최종 고화질 렌더링)

### Infrastructure
- **Hosting**: Vercel 또는 Netlify (Frontend)
- **Server**: AWS EC2, Google Cloud Run, 또는 Railway (Rendering)
- **Queue**: Bull/BullMQ (Redis 기반)
- **CDN**: Cloudflare 또는 Supabase CDN

### Development Tools
- **TypeScript**: 타입 안정성
- **ESLint + Prettier**: 코드 품질
- **Vitest**: 테스팅
- **GitHub Actions**: CI/CD

---

## 예상 타임라인

### MVP 개발 (총 10주)
- Phase 1: 프로젝트 기반 구조 (1주)
- Phase 2: 유튜브 API 연동 (1주)
- Phase 3: 대본 생성 기능 (2주)
- Phase 4: 스톡 푸티지 매칭 (2주)
- Phase 5: TTS 및 자막 생성 (1주)
- Phase 6: 비디오 렌더링 (2주)
- Phase 7: 통합 및 테스트 (1주)

### 전체 기능 개발 (추가 14주)
- Phase 8-12: 고급 기능 구현

**총 개발 기간: 약 6개월 (MVP 기준 3개월)**

---

## 리스크 및 대응 방안

### 기술적 리스크
1. **렌더링 성능 문제**
   - 대응: 하이브리드 방식 (FFmpeg.wasm + 서버 FFmpeg)으로 서버 부하 분산
   - 대안: 클라우드 렌더링 서비스 (Mux) 검토
   
2. **API 할당량 초과**
   - 대응: 
     - 캐싱 강화
     - 사용자 개인 API 키 옵션 제공 (공유 경제 모델)
     - 사용자별 할당량 제한 및 모니터링

3. **비용 급증**
   - 대응: 
     - 사용량 모니터링
     - 자동 스케일링 제한
     - 프리뷰는 클라이언트에서 처리하여 서버 비용 절감

4. **유튜브 정책 변경 (AI 콘텐츠 표기)**
   - 대응:
     - SynthID 워크마크 자동 삽입
     - self_declared_ai_generated 플래그 자동 설정
     - 정기적 정책 모니터링

### 비즈니스 리스크
1. **유튜브 정책 변경**
   - 대응: 정기적 정책 모니터링, 대안 플랫폼 준비

2. **경쟁사 대응**
   - 대응: 차별화 기능 강화, 사용자 경험 개선

---

## 다음 단계

1. **즉시 시작할 작업 (우선순위 순서)**
   - [ ] Google Cloud Console 프로젝트 생성
   - [ ] **우선순위 1: 유튜브 AI 서비스 API 키 발급**
     - YouTube Data API v3 키
     - YouTube Veo API 접근 권한 확인
     - YouTube Dream Screen API 접근 권한 확인
     - YouTube AI 음성/자막/번역 API 접근 권한 확인
     - YouTube AI 썸네일/메타데이터 생성 API 접근 권한 확인
     - Google SynthID API 접근 권한 확인
   - [ ] **우선순위 2: 무료 AI 서비스 API 키 발급**
     - **Google Gemini API 키 (무료 티어)**
     - Google Cloud TTS API 키 (무료 할당량)
     - Google Vision API 키 (무료 할당량)
     - Google Translate API 키 (무료 할당량)
     - Pexels API 키 (무료)
     - Pixabay API 키 (무료)
   - [ ] **우선순위 3: 유료 AI 서비스 API 키 발급** (필요 시)
     - **Google Gemini Pro API 키** (고품질 LLM)
     - OpenAI API 키 (DALL-E 3)
     - ElevenLabs API 키 (고품질 TTS)
     - Suno AI / Udio API 키 (음악 생성)
   - [ ] Supabase 프로젝트 생성 및 설정

2. **1주 내 완료**
   - [ ] 프로젝트 폴더 구조 생성
   - [ ] 기본 인증 시스템 구축
   - [ ] Shadcn UI 컴포넌트 설치

3. **검토 필요 사항 (우선순위 순서)**
   - [ ] **우선순위 1: 유튜브 AI 서비스 검토**
     - 유튜브 API 서비스 약관 상세 검토 (2025-2026 최신 정책)
     - 유튜브 Inspiration API 접근 권한 확인
     - YouTube Veo API 접근 권한 및 사용 제한 확인
     - YouTube Dream Screen API 접근 권한 및 사용 제한 확인
     - YouTube AI 음성/자막/번역 API 접근 권한 확인
     - YouTube AI 썸네일/메타데이터 생성 API 접근 권한 확인
     - Google SynthID API 문서 및 연동 방법 검토
   - [ ] **우선순위 2: 무료 AI 서비스 검토**
     - **Google Gemini API (무료 티어) rate limits 및 할당량**
     - Google Cloud TTS/Vision/Translate API 무료 할당량 확인
     - Pexels/Pixabay API 무료 제한 확인
     - Hugging Face 오픈소스 모델 사용 가능 여부
   - [ ] **우선순위 3: 유료 AI 서비스 검토** (필요 시)
     - **Google Gemini Pro rate limits 및 할당량**
     - **Gemini Vision 가격 정책 확인**
     - OpenAI API (DALL-E 3) rate limits 및 할당량
     - DALL-E 3 사용 제한 및 가격 정책
     - Suno AI / Udio API 접근성 및 가격
     - ElevenLabs API 제한사항
   - [ ] **AI 서비스 비용 구조 최종 확정**
     - 우선순위 1, 2 서비스 우선 활용으로 비용 최소화
     - 사용량 기반 비용 모델 설계
     - 캐싱 전략으로 API 호출 최소화
   - [ ] 비용 구조 최종 확정 (하이브리드 렌더링 방식 고려)
   - [ ] 렌더링 서버 인프라 결정 (FFmpeg.wasm + 서버 FFmpeg)
   - [ ] API 할당량 공유 경제 모델 설계

