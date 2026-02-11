# YouTube OAuth 연동 설정 가이드

TubeGAI에서 YouTube 채널을 연결하기 위한 OAuth 설정 가이드입니다.

## 목차

1. [Google Cloud Console 설정](#1-google-cloud-console-설정)
2. [Supabase Dashboard 설정](#2-supabase-dashboard-설정)
3. [환경 변수 확인](#3-환경-변수-확인)
4. [테스트](#4-테스트)
5. [문제 해결](#5-문제-해결)

---

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성 또는 선택

1. [Google Cloud Console](https://console.cloud.google.com)에 접속
2. 상단의 프로젝트 선택 드롭다운 클릭
3. **새 프로젝트** 클릭 또는 기존 프로젝트 선택
4. 프로젝트 이름 입력 (예: `TubeGAI Production`)
5. **만들기** 클릭

### 1.2 YouTube Data API 활성화

1. 좌측 메뉴에서 **APIs & Services** > **Library** 클릭
2. 검색창에 `YouTube Data API v3` 입력
3. **YouTube Data API v3** 클릭
4. **사용** 버튼 클릭하여 API 활성화

### 1.3 OAuth 동의 화면 구성

1. 좌측 메뉴에서 **APIs & Services** > **OAuth consent screen** 클릭
2. User Type 선택:
   - **External**: 모든 Google 계정 사용자 (일반적으로 선택)
   - **Internal**: Google Workspace 조직 내 사용자만
3. **만들기** 클릭

#### 앱 정보 입력

| 필드 | 값 |
|------|-----|
| 앱 이름 | `TubeGAI` |
| 사용자 지원 이메일 | 본인 이메일 |
| 앱 로고 | (선택사항) |
| 애플리케이션 홈페이지 | `https://your-domain.com` |
| 애플리케이션 개인정보처리방침 링크 | `https://your-domain.com/privacy` |
| 애플리케이션 서비스 약관 링크 | `https://your-domain.com/terms` |
| 개발자 연락처 정보 | 본인 이메일 |

4. **저장 후 계속** 클릭

#### Scopes 추가

1. **범위 추가 또는 삭제** 클릭
2. 필터에서 `YouTube` 검색
3. 다음 범위 선택:
   - `https://www.googleapis.com/auth/youtube.readonly` - 채널 정보 읽기
   - `https://www.googleapis.com/auth/youtube.upload` - 동영상 업로드
   - `https://www.googleapis.com/auth/youtube` - YouTube 전체 액세스
4. **업데이트** 클릭
5. **저장 후 계속** 클릭

#### 테스트 사용자 추가 (개발 중일 때)

앱이 "테스트" 상태일 때는 테스트 사용자만 OAuth를 사용할 수 있습니다.

1. **+ ADD USERS** 클릭
2. 테스트할 Google 계정 이메일 입력
3. **추가** 클릭
4. **저장 후 계속** 클릭

### 1.4 OAuth 클라이언트 ID 생성

1. 좌측 메뉴에서 **APIs & Services** > **Credentials** 클릭
2. 상단의 **+ CREATE CREDENTIALS** 클릭
3. **OAuth client ID** 선택

#### 클라이언트 설정

| 필드 | 값 |
|------|-----|
| 애플리케이션 유형 | **Web application** |
| 이름 | `TubeGAI Web Client` |

#### 승인된 리디렉션 URI 추가

**중요**: Supabase 프로젝트의 콜백 URL을 정확히 입력해야 합니다.

```
https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
```

예시:
```
https://abcdefghijklmnop.supabase.co/auth/v1/callback
```

> **Supabase 프로젝트 참조 ID 찾기**:
> Supabase Dashboard > Project Settings > General > Reference ID

5. **만들기** 클릭
6. **클라이언트 ID**와 **클라이언트 보안 비밀번호** 복사하여 안전하게 보관

---

## 2. Supabase Dashboard 설정

### 2.1 Google Provider 활성화

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **Authentication** 클릭
4. **Providers** 탭 클릭
5. **Google** 행을 찾아 클릭하여 확장

### 2.2 Google Provider 설정

| 필드 | 값 |
|------|-----|
| Enable Sign in with Google | **ON** (토글 활성화) |
| Client ID | Google Cloud에서 복사한 클라이언트 ID |
| Client Secret | Google Cloud에서 복사한 클라이언트 보안 비밀번호 |

#### Additional Scopes (선택사항)

OAuth 클라이언트 코드에서 이미 scopes를 지정하지만, 여기에도 추가할 수 있습니다:

```
https://www.googleapis.com/auth/youtube.readonly
https://www.googleapis.com/auth/youtube.upload
https://www.googleapis.com/auth/youtube
```

> 각 scope는 **공백**으로 구분하거나 **줄바꿈**으로 구분

### 2.3 저장

**Save** 버튼 클릭

---

## 3. 환경 변수 확인

프로젝트 루트의 `.env` 파일에 다음 변수가 설정되어 있는지 확인:

```env
# Supabase 설정
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# YouTube API (트렌드 조회용, 선택사항)
YOUTUBE_API_KEY=your-youtube-api-key
```

### Supabase 키 찾기

1. Supabase Dashboard > Project Settings > API
2. **Project URL** → `SUPABASE_URL`
3. **Project API keys** > `anon` `public` → `SUPABASE_ANON_KEY`

---

## 4. 테스트

### 4.1 개발 서버 실행

```bash
npm run dev
```

### 4.2 채널 연결 테스트

1. 브라우저에서 `http://localhost:3000/projects/channels` 접속
2. **YouTube 계정 연결** 버튼 클릭
3. Google 로그인 화면으로 리디렉션됨
4. Google 계정 선택 및 로그인
5. YouTube 권한 승인 화면에서 **허용** 클릭
6. `/projects/channels/callback`으로 리디렉션됨
7. 채널 정보가 자동으로 저장되고 채널 목록에 표시됨

### 4.3 성공 확인

- 채널 카드에 다음 정보가 표시되어야 함:
  - 채널 이름
  - 채널 핸들 (@username)
  - 구독자 수
  - 영상 수
  - 총 조회수
  - "OAuth 연결됨" 표시

---

## 5. 문제 해결

### 5.1 "redirect_uri_mismatch" 오류

**원인**: Google Cloud Console의 승인된 리디렉션 URI가 일치하지 않음

**해결**:
1. Google Cloud Console > Credentials > OAuth 2.0 Client IDs
2. 생성한 클라이언트 클릭
3. 승인된 리디렉션 URI 확인:
   ```
   https://<your-supabase-ref>.supabase.co/auth/v1/callback
   ```
4. 정확한 URL인지 확인 (슬래시, 오타 주의)

### 5.2 "access_denied" 오류

**원인 1**: 앱이 테스트 모드이고 테스트 사용자로 등록되지 않음

**해결**:
1. Google Cloud Console > OAuth consent screen
2. Test users 섹션에서 사용자 추가

**원인 2**: 사용자가 권한을 거부함

**해결**: 다시 시도하고 모든 권한 허용

### 5.3 "invalid_client" 오류

**원인**: Client ID 또는 Client Secret이 잘못됨

**해결**:
1. Google Cloud Console에서 credentials 다시 확인
2. Supabase Dashboard에 올바른 값 입력
3. 앞뒤 공백 제거

### 5.4 YouTube 채널을 찾을 수 없음

**원인**: 로그인한 Google 계정에 YouTube 채널이 없음

**해결**:
1. [YouTube Studio](https://studio.youtube.com)에서 채널 생성
2. 다시 OAuth 연결 시도

### 5.5 "window.ENV is undefined" 오류

**원인**: 클라이언트 환경 변수가 로드되지 않음

**해결**:
1. 브라우저 새로고침 (Ctrl+Shift+R / Cmd+Shift+R)
2. 개발 서버 재시작: `npm run dev`

### 5.6 토큰 만료 오류

**원인**: OAuth 액세스 토큰이 만료됨

**해결**:
- Supabase Auth가 자동으로 토큰을 갱신합니다
- 문제가 지속되면 채널 연결 해제 후 다시 연결

---

## 6. 프로덕션 배포 체크리스트

### 6.1 Google Cloud Console

- [ ] OAuth consent screen을 **프로덕션**으로 게시
- [ ] 프로덕션 도메인을 승인된 리디렉션 URI에 추가
- [ ] 앱 검토 제출 (민감한 범위 사용 시)

### 6.2 Supabase

- [ ] Site URL 설정 (Authentication > URL Configuration)
- [ ] Redirect URLs에 프로덕션 콜백 URL 추가

### 6.3 환경 변수

- [ ] 프로덕션 환경에 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 설정
- [ ] 비밀 키가 노출되지 않도록 확인

---

## 참고 자료

- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [YouTube Data API 문서](https://developers.google.com/youtube/v3)
- [Supabase Auth - Google Provider](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Auth - Provider Tokens](https://supabase.com/docs/guides/auth/social-login#provider-tokens)
