# YouTube API 설정 가이드

TubeGAI에서 YouTube 기능을 사용하기 위한 API 설정 가이드입니다.

> **참고**: TubeGAI 로그인(Google/GitHub OAuth)을 위한 설정은 [Supabase 로그인 인증 설정 가이드](./supabase-auth-setup-guide.md)를 참조하세요.

---

## 개요

TubeGAI는 YouTube API를 **2가지 방식**으로 사용합니다:

| 용도                          | 인증 방식 | 환경 변수                                  | Google Cloud 프로젝트 |
| ----------------------------- | --------- | ------------------------------------------ | --------------------- |
| **트렌드 조회** (공개 데이터) | API Key   | `GEMINI_YOUTUBE_DATA_API_KEY`              | AI Studio 프로젝트    |
| **채널 관리** (비공개 데이터) | OAuth 2.0 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | 별도 GCP 프로젝트     |

### 왜 2가지로 나뉘는가?

- **트렌드 조회**: YouTube 인기 동영상은 공개 데이터이므로 API Key만으로 접근 가능
- **채널 관리**: 사용자의 YouTube 채널 정보는 비공개 데이터이므로 OAuth 2.0 인증이 필요

---

## 중요: Google Cloud 프로젝트 구성

TubeGAI는 **2개의 Google Cloud 프로젝트**를 사용합니다:

| 프로젝트               | 용도                                  | 인증      | 환경 변수                                                |
| ---------------------- | ------------------------------------- | --------- | -------------------------------------------------------- |
| **AI Studio 프로젝트** | Gemini AI + YouTube Data API (트렌드) | API Key   | `GEMINI_API_KEY`, `GEMINI_YOUTUBE_DATA_API_KEY`          |
| **별도 GCP 프로젝트**  | YouTube OAuth (채널 관리)             | OAuth 2.0 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`               |

> **왜 프로젝트를 분리하는가?**
>
> - AI Studio에서 생성한 프로젝트에는 프로젝트 소유자를 OAuth 인증 대상(개발단계 테스터)으로 등록할 수 없음
> - YouTube OAuth용으로 Google Cloud Console에서 프로젝트를 별도 생성해야 함
> - Gemini API Key(`GEMINI_API_KEY`)와 YouTube Data API Key(`GEMINI_YOUTUBE_DATA_API_KEY`)는 동일한 AI Studio 프로젝트에서 발급 가능

---

## 목차

- [Part 1: YouTube Data API 설정 (트렌드 조회)](#part-1-youtube-data-api-설정-트렌드-조회)
- [Part 2: YouTube OAuth 설정 (채널 관리)](#part-2-youtube-oauth-설정-채널-관리)
- [환경 변수 종합 요약](#환경-변수-종합-요약)
- [문제 해결](#문제-해결)
- [프로덕션 배포 체크리스트](#프로덕션-배포-체크리스트)

---

## Part 1: YouTube Data API 설정 (트렌드 조회)

### 1.1 개요

| 항목           | 내용                                                                 |
| -------------- | -------------------------------------------------------------------- |
| 용도           | YouTube 인기 동영상(트렌드) 데이터 조회                              |
| 인증 방식      | API Key (OAuth 불필요)                                               |
| API 엔드포인트 | `GET https://www.googleapis.com/youtube/v3/videos?chart=mostPopular` |
| 캐시           | 15분 Supabase 캐시로 API 쿼터 관리                                   |

### 관련 코드 파일

| 파일                                     | 역할                                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| `app/common/data/youtube.data.server.ts` | YouTube API 호출 + Supabase 캐시 관리 (`getYouTubeTrends()`, `getYouTubeTrendsWithFilters()`) |
| `app/common/types/youtube.types.ts`      | YouTube API 응답 타입 정의                                                                    |

### 1.2 API Key 설정

#### 방법 A: AI Studio에서 설정 (권장)

Gemini API Key가 이미 있다면 별도 설정이 필요 없습니다. **동일한 Key로 YouTube Data API도 사용 가능**합니다.

1. [Google AI Studio](https://aistudio.google.com)에 접속
2. **Get API Key** 클릭
3. API Key 확인 또는 새로 생성
4. `.env`에 설정:

```env
GEMINI_YOUTUBE_DATA_API_KEY=your-youtube-data-api-key
```

#### 방법 B: Google Cloud Console에서 직접 설정

AI Studio를 사용하지 않는 경우:

1. [Google Cloud Console](https://console.cloud.google.com)에 접속
2. **APIs & Services > Library** > `YouTube Data API v3` 검색 후 **사용** 클릭
3. **APIs & Services > Credentials > + CREATE CREDENTIALS > API key**
4. API Key 복사
5. (선택) API Key 제한 설정: YouTube Data API v3만 허용

### 1.3 환경 변수 설정

```env
# YouTube Data API (트렌드 조회)
GEMINI_YOUTUBE_DATA_API_KEY=your-youtube-data-api-key
```

> **참고**: YouTube 트렌드 조회에는 `GEMINI_YOUTUBE_DATA_API_KEY`를 사용합니다. Gemini AI용 `GEMINI_API_KEY`와 별도로 관리됩니다.

### 1.4 동작 확인

```bash
npm run dev
```

1. `http://localhost:3000/projects/trends` 접속
2. 인기 동영상 목록이 표시되면 성공

### 1.5 코드 구조

```
getYouTubeTrends(options)
  ├─ getCachedTrends()     → Supabase에서 15분 이내 캐시 조회
  ├─ (캐시 있음) → 캐시 데이터 반환
  └─ (캐시 없음)
     ├─ YouTube API 호출   → GET /youtube/v3/videos?chart=mostPopular&key=GEMINI_YOUTUBE_DATA_API_KEY
     ├─ saveTrendsToCache() → Supabase에 결과 저장
     └─ 결과 반환

getYouTubeTrendsWithFilters(filters)
  └─ 카테고리, 지역, 키워드 필터 적용
```

- API Key가 없으면 빈 배열을 반환 (에러 없이 graceful 처리)
- 기본 지역 코드: `KR` (한국)

---

## Part 2: YouTube OAuth 설정 (채널 관리)

### 2.1 개요

| 항목         | 내용                                                                |
| ------------ | ------------------------------------------------------------------- |
| 용도         | YouTube 채널 정보 조회, 통계 동기화, 영상 업로드                    |
| 인증 방식    | Google OAuth 2.0 (**Supabase Auth와 별도!**)                        |
| OAuth Scopes | `youtube.readonly`, `youtube.upload`, `youtube`                     |
| 토큰 저장    | `channels` 테이블 (`accessToken`, `refreshToken`, `tokenExpiresAt`) |

> **핵심**: YouTube OAuth는 Supabase 로그인 인증과 **완전히 분리된 시스템**입니다.
> 사용자가 GitHub으로 TubeGAI에 로그인하더라도 YouTube 채널을 연결할 수 있도록,
> Google OAuth를 독립적으로 처리합니다.

### 관련 코드 파일

| 파일                                           | 역할                                                                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `app/lib/youtube-oauth.server.ts`              | OAuth 서버 함수: `generateYouTubeOAuthUrl()`, `exchangeCodeForTokens()`, `refreshAccessToken()`, `revokeToken()` |
| `app/features/project/api/youtube-oauth.ts`    | OAuth API 라우트: action(OAuth 시작) + loader(콜백 처리)                                                         |
| `app/lib/youtube-api.server.ts`                | YouTube API 호출: `getMyYouTubeChannel()`, `syncChannelStats()`                                                  |
| `app/common/data/channel.data.server.ts`       | 채널 데이터 CRUD: `upsertChannel()`, `getChannelWithTokens()`, `updateChannelTokens()`                           |
| `app/features/project/pages/channels-page.tsx` | 채널 관리 UI                                                                                                     |

### 2.2 Google Cloud 프로젝트 설정

> **반드시 별도 Google Cloud 프로젝트를 사용해야 합니다.**
> AI Studio 프로젝트에서는 OAuth 테스트 사용자를 등록할 수 없습니다.

#### 2.2.1 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com)에 접속
2. 상단 프로젝트 선택 > **새 프로젝트** 클릭
3. 프로젝트 이름 입력 (예: `TubeGAI YouTube OAuth`)
4. **만들기** 클릭

#### 2.2.2 YouTube Data API v3 활성화

1. **APIs & Services > Library** 클릭
2. `YouTube Data API v3` 검색
3. **YouTube Data API v3** 클릭 후 **사용** 클릭

#### 2.2.3 OAuth 동의 화면 구성

**APIs & Services > OAuth consent screen**:

1. User Type: **External** 선택 후 **만들기** 클릭
2. 앱 정보 입력:

   | 필드                               | 값                              |
   | ---------------------------------- | ------------------------------- |
   | 앱 이름                            | `TubeGAI`                       |
   | 사용자 지원 이메일                 | 본인 이메일                     |
   | 애플리케이션 홈페이지              | `http://localhost:3000`         |
   | 애플리케이션 개인정보처리방침 링크 | `http://localhost:3000/privacy` |
   | 애플리케이션 서비스 약관 링크      | `http://localhost:3000/terms`   |
   | 개발자 연락처 정보                 | 본인 이메일                     |

3. **저장 후 계속** 클릭

#### Scopes 추가

1. **범위 추가 또는 삭제** 클릭
2. `YouTube` 검색 후 다음 범위 선택:
   - `https://www.googleapis.com/auth/youtube.readonly` — 채널 정보 읽기
   - `https://www.googleapis.com/auth/youtube.upload` — 동영상 업로드
   - `https://www.googleapis.com/auth/youtube` — YouTube 전체 액세스
3. **업데이트** 클릭
4. **저장 후 계속** 클릭

#### 테스트 사용자 추가

개발 단계에서는 등록된 테스트 사용자만 OAuth를 사용할 수 있습니다:

1. **+ ADD USERS** 클릭
2. 테스트할 Google 계정 이메일 입력
3. **추가** 클릭
4. **저장 후 계속** 클릭

#### 2.2.4 OAuth 클라이언트 ID 생성

**APIs & Services > Credentials > + CREATE CREDENTIALS > OAuth client ID**:

| 필드                     | 값                                        |
| ------------------------ | ----------------------------------------- |
| 애플리케이션 유형        | **Web application**                       |
| 이름                     | `TubeGAI YouTube OAuth`                   |
| 승인된 자바스크립트 출처 | `http://localhost:3000`                   |
| 승인된 리디렉션 URI      | `http://localhost:3000/api/youtube-oauth` |

> **중요**: 리디렉션 URI는 `http://localhost:3000/api/youtube-oauth`입니다.
> Supabase 콜백 URL(`supabase.co/auth/v1/callback`)이 **아닙니다!**

**만들기** 클릭 후 **클라이언트 ID**와 **클라이언트 보안 비밀번호**를 복사합니다.

### 2.3 환경 변수 설정

```env
# YouTube OAuth (채널 관리 전용)
GOOGLE_CLIENT_ID=your-youtube-oauth-client-id
GOOGLE_CLIENT_SECRET=your-youtube-oauth-client-secret
```

### 2.4 OAuth 플로우

```
[사용자: "채널 추가" 버튼 클릭]
  ↓ POST /api/youtube-oauth (action)
[requireAuth(): TubeGAI 로그인 확인]
  ↓
[generateYouTubeOAuthUrl(): Google OAuth URL 생성]
  ↓ redirect (302)
[Google 동의 화면: YouTube 권한 승인]
  ↓ callback with ?code=xxx
[GET /api/youtube-oauth (loader)]
  ↓
[exchangeCodeForTokens(): code → accessToken + refreshToken]
  ↓
[YouTube API: GET /youtube/v3/channels?mine=true]
  ↓
[upsertChannel(): DB에 채널 정보 + 토큰 저장]
  ↓ redirect (302)
[/projects/channels?success=connected]
```

#### 코드 경로 상세

1. **채널 추가 클릭** → `channels-page.tsx`에서 form POST → `/api/youtube-oauth`
2. **OAuth 시작** → `youtube-oauth.ts` action() → `requireAuth()` → `generateYouTubeOAuthUrl(redirectUri, state)` → Google 동의 화면으로 redirect
3. **Google 동의** → 사용자 승인 → `/api/youtube-oauth?code=xxx`로 콜백
4. **콜백 처리** → `youtube-oauth.ts` loader() → `exchangeCodeForTokens(code, redirectUri)` → YouTube API 호출 → `upsertChannel()`
5. **완료** → `/projects/channels?success=connected`로 redirect

### 2.5 채널 데이터 관리

#### DB 스키마 (`channels` 테이블)

파일: `app/features/project/project-schema.ts`

| 필드               | 타입      | 설명                           |
| ------------------ | --------- | ------------------------------ |
| `youtubeChannelId` | text      | YouTube 채널 고유 ID           |
| `name`             | text      | 채널 이름                      |
| `handle`           | text      | 채널 핸들 (@username)          |
| `subscriberCount`  | integer   | 구독자 수                      |
| `videoCount`       | integer   | 영상 수                        |
| `viewCount`        | bigint    | 총 조회수                      |
| `accessToken`      | text      | OAuth 액세스 토큰              |
| `refreshToken`     | text      | OAuth 리프레시 토큰            |
| `tokenExpiresAt`   | timestamp | 토큰 만료 시각                 |
| `status`           | enum      | `active` / `error` / `syncing` |

#### 채널 동기화

채널 통계를 최신으로 업데이트하는 과정:

1. 채널 페이지에서 "데이터 동기화" 클릭
2. `/api/channels` POST (intent: `sync-channel`)
3. `getChannelWithTokens()` → DB에서 채널 + 토큰 조회
4. `getMyYouTubeChannel(accessToken)` → YouTube API 호출
5. `syncChannelStats()` → DB 업데이트

#### 토큰 갱신

- Access Token은 약 1시간 후 만료
- 만료 시 `refreshAccessToken(refreshToken)` → 새 Access Token 발급
- 갱신된 토큰은 `updateChannelTokens()`로 DB에 저장
- Refresh Token은 보통 변경되지 않음

### 2.6 테스트

#### 개발 서버 실행

```bash
npm run dev
```

#### 채널 연결 테스트

1. `http://localhost:3000/projects/channels` 접속
2. **채널 추가** 버튼 클릭
3. Google 계정 선택 → YouTube 권한 승인 → **허용** 클릭
4. `/projects/channels`로 리다이렉트 (`success=connected`)
5. 채널 카드에 다음 정보가 표시되면 성공:
   - 채널 이름
   - 채널 핸들 (@username)
   - 구독자 수
   - 영상 수
   - 총 조회수

#### 동기화 테스트

- 채널 카드 메뉴 > **데이터 동기화** 클릭
- 최신 통계가 반영되는지 확인

---

## 환경 변수 종합 요약

| 변수                            | 용도                          | 설정 위치 | Google Cloud 프로젝트 |
| ------------------------------- | ----------------------------- | --------- | --------------------- |
| `GEMINI_API_KEY`                | Gemini AI                     | `.env`    | AI Studio 프로젝트    |
| `GEMINI_YOUTUBE_DATA_API_KEY`   | YouTube Data API (트렌드)     | `.env`    | AI Studio 프로젝트    |
| `GOOGLE_CLIENT_ID`              | YouTube OAuth (채널 관리)     | `.env`    | 별도 GCP 프로젝트     |
| `GOOGLE_CLIENT_SECRET`          | YouTube OAuth (채널 관리)     | `.env`    | 별도 GCP 프로젝트     |

```env
# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# YouTube Data API (트렌드 조회)
GEMINI_YOUTUBE_DATA_API_KEY=your-youtube-data-api-key

# YouTube OAuth (채널 관리)
GOOGLE_CLIENT_ID=your-youtube-oauth-client-id
GOOGLE_CLIENT_SECRET=your-youtube-oauth-client-secret
```

---

## 문제 해결

### Part 1: YouTube Data API (트렌드)

#### API Key가 없다는 경고

콘솔에 `GEMINI_YOUTUBE_DATA_API_KEY not configured` 메시지가 출력되는 경우:

- `.env`에 `GEMINI_YOUTUBE_DATA_API_KEY`가 설정되어 있는지 확인
- 개발 서버 재시작: `npm run dev`

#### API 쿼터 초과

YouTube Data API 기본 쿼터: 10,000 units/day

- 15분 캐시가 정상 동작하는지 확인
- 불필요한 `forceRefresh` 호출이 없는지 확인

#### 트렌드 데이터가 비어있는 경우

- API Key가 YouTube Data API v3에 대해 활성화되어 있는지 확인
- Google Cloud Console > APIs & Services > YouTube Data API v3 사용 중인지 확인

### Part 2: YouTube OAuth (채널 관리)

#### "redirect_uri_mismatch" 오류

**원인**: Google Cloud Console의 승인된 리디렉션 URI가 불일치

**해결**:

1. Google Cloud Console > Credentials > OAuth 2.0 Client IDs > 클릭
2. 승인된 리디렉션 URI 확인: `http://localhost:3000/api/youtube-oauth`
3. **주의**: Supabase 콜백 URL(`supabase.co/auth/v1/callback`)이 아님!
4. 슬래시, 오타, `http` vs `https` 주의

#### "access_denied" 오류

**원인 1**: 앱이 테스트 모드이고 테스트 사용자로 등록되지 않음

**해결**: Google Cloud Console > OAuth consent screen > Test users에서 사용자 추가

**원인 2**: 사용자가 권한을 거부함

**해결**: 다시 시도하고 모든 권한 허용

#### "invalid_client" 오류

**원인**: GOOGLE_CLIENT_ID 또는 GOOGLE_CLIENT_SECRET이 잘못됨

**해결**:

1. **별도 GCP 프로젝트**의 credentials인지 확인 (AI Studio 프로젝트가 아님)
2. `.env`에서 값 재확인
3. 앞뒤 공백 제거

#### YouTube 채널을 찾을 수 없음

**원인**: 로그인한 Google 계정에 YouTube 채널이 없음

**해결**:

1. [YouTube Studio](https://studio.youtube.com)에서 채널 생성
2. 다시 OAuth 연결 시도

#### 토큰 만료 오류

**원인**: OAuth 액세스 토큰이 만료됨 (약 1시간)

**해결**:

- 동기화 시 자동으로 `refreshAccessToken()`이 호출됨
- 문제가 지속되면 채널 연결 해제 후 다시 연결

---

## 프로덕션 배포 체크리스트

### YouTube Data API

- [ ] AI Studio 프로젝트의 API Key 쿼터 확인 (기본 10,000 units/day)
- [ ] 필요 시 쿼터 상향 요청

### YouTube OAuth

- [ ] OAuth 동의 화면을 **프로덕션**으로 게시
- [ ] 프로덕션 도메인을 승인된 리디렉션 URI에 추가: `https://your-domain.com/api/youtube-oauth`
- [ ] 승인된 자바스크립트 출처에 프로덕션 도메인 추가
- [ ] 민감한 YouTube scope 사용 시 앱 검토 제출

### 환경 변수

- [ ] 프로덕션 환경에 `GEMINI_API_KEY` 설정
- [ ] 프로덕션 환경에 `GEMINI_YOUTUBE_DATA_API_KEY` 설정
- [ ] 프로덕션 환경에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 설정
- [ ] 비밀 키가 노출되지 않도록 확인

---

## 참고 자료

- [YouTube Data API v3 공식 문서](https://developers.google.com/youtube/v3)
- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [Google AI Studio](https://aistudio.google.com) (Gemini API Key 관리)
- [Google Cloud Console](https://console.cloud.google.com) (OAuth 클라이언트 관리)
