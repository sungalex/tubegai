# Supabase 로그인 인증 설정 가이드

TubeGAI에서 사용자 로그인/회원가입을 위한 Supabase Auth 설정 가이드입니다.

> **참고**: YouTube 채널 관리를 위한 OAuth 설정은 [YouTube API 설정 가이드](./youtube-api-setup-guide.md)를 참조하세요.

---

## 개요

TubeGAI는 Supabase Auth를 통해 3가지 로그인 방식을 지원합니다:

| 방식            | 설명                     |
| --------------- | ------------------------ |
| 이메일/비밀번호 | Supabase Auth 기본 인증  |
| Google OAuth    | Supabase Google Provider |
| GitHub OAuth    | Supabase GitHub Provider |

### 인증 흐름

```txt
[사용자] → [로그인 버튼 클릭]
  ↓
[Supabase Auth SDK] → signInWithGoogle() / signInWithGitHub()
  ↓
[OAuth Provider] → Google / GitHub 로그인 화면
  ↓
[Supabase 콜백] → https://<project-ref>.supabase.co/auth/v1/callback
  ↓
[앱 콜백] → /auth/callback (세션 교환)
  ↓
[리다이렉트] → /projects
```

### 관련 코드 파일

| 파일                                             | 역할                                                                             |
| ------------------------------------------------ | -------------------------------------------------------------------------------- |
| `app/lib/auth.client.ts`                         | 클라이언트 인증: `signInWithGoogle()`, `signInWithGitHub()`, `signInWithEmail()` |
| `app/lib/auth.server.ts`                         | 서버 인증: `createSupabaseServerClient()`, `requireAuth()`, `getCurrentUserId()` |
| `app/features/auth/pages/auth-callback-page.tsx` | OAuth 콜백 처리 (세션 교환 → /projects 리다이렉트)                               |
| `app/features/auth/pages/login-page.tsx`         | 로그인 UI                                                                        |
| `app/features/auth/pages/join-page.tsx`          | 회원가입 UI                                                                      |

---

## 목차

1. [Supabase 프로젝트 기본 설정](#1-supabase-프로젝트-기본-설정)
2. [Google OAuth 로그인 설정](#2-google-oauth-로그인-설정)
3. [GitHub OAuth 로그인 설정](#3-github-oauth-로그인-설정)
4. [이메일/비밀번호 인증 설정](#4-이메일비밀번호-인증-설정)
5. [서버 사이드 인증](#5-서버-사이드-인증)
6. [환경 변수 요약](#6-환경-변수-요약)
7. [테스트](#7-테스트)
8. [문제 해결](#8-문제-해결)
9. [프로덕션 배포 체크리스트](#9-프로덕션-배포-체크리스트)

---

## 1. Supabase 프로젝트 기본 설정

### 1.1 Supabase 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에 접속
2. **New Project** 클릭
3. 프로젝트 이름 입력 (예: `TubeGAI`)
4. 데이터베이스 비밀번호 설정
5. 리전 선택 후 **Create new project** 클릭

### 1.2 환경 변수 확인

프로젝트 생성 후 **Project Settings > API**에서 다음 값을 확인합니다:

| 항목                | 환경 변수                   | 위치                                      |
| ------------------- | --------------------------- | ----------------------------------------- |
| Project URL         | `SUPABASE_URL`              | Project Settings > API > Project URL      |
| anon public key     | `SUPABASE_ANON_KEY`         | Project Settings > API > Project API keys |
| service_role secret | `SUPABASE_SERVICE_ROLE_KEY` | Project Settings > API > Project API keys |

`.env` 파일에 설정:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **주의**: `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용입니다. 클라이언트에 노출하지 마세요.

### 1.3 URL Configuration 설정

**Supabase Dashboard > Authentication > URL Configuration**에서:

| 항목          | 개발 환경                             | 프로덕션                                |
| ------------- | ------------------------------------- | --------------------------------------- |
| Site URL      | `http://localhost:3000`               | `https://your-domain.com`               |
| Redirect URLs | `http://localhost:3000/auth/callback` | `https://your-domain.com/auth/callback` |

---

## 2. Google OAuth 로그인 설정

> **중요**: 이 설정은 TubeGAI **로그인 전용**입니다. YouTube 채널 관리용 OAuth와는 별개입니다.
> 로그인에는 YouTube scope가 필요하지 않으며, 기본 프로필 scope(openid, email, profile)만 사용합니다.

### 2.1 Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com)에 접속
2. 프로젝트 선택 또는 새 프로젝트 생성

#### OAuth 동의 화면 구성

**APIs & Services > OAuth consent screen** 에서:

1. User Type: **External** 선택
2. 앱 정보 입력:

   | 필드                  | 값                      |
   | --------------------- | ----------------------- |
   | 앱 이름               | `TubeGAI`               |
   | 사용자 지원 이메일    | 본인 이메일             |
   | 애플리케이션 홈페이지 | `http://localhost:3000` |
   | 개발자 연락처 정보    | 본인 이메일             |

3. Scopes: **기본 scopes만** 선택 (openid, email, profile)
   - YouTube 관련 scope는 추가하지 않음
4. 테스트 사용자 추가 (개발 단계에서는 등록된 이메일만 로그인 가능)

#### OAuth 클라이언트 ID 생성

**APIs & Services > Credentials > + CREATE CREDENTIALS > OAuth client ID**:

| 필드                | 값                                                   |
| ------------------- | ---------------------------------------------------- |
| 애플리케이션 유형   | **Web application**                                  |
| 이름                | `TubeGAI Login`                                      |
| 승인된 리디렉션 URI | `https://<project-ref>.supabase.co/auth/v1/callback` |

> **Supabase 프로젝트 참조 ID 찾기**: Supabase Dashboard > Project Settings > General > Reference ID

**만들기** 클릭 후 **클라이언트 ID**와 **클라이언트 보안 비밀번호**를 복사합니다.

### 2.2 Supabase Dashboard 설정

**Authentication > Providers > Google**:

| 필드                       | 값                                               |
| -------------------------- | ------------------------------------------------ |
| Enable Sign in with Google | **ON**                                           |
| Client ID                  | Google Cloud에서 복사한 클라이언트 ID            |
| Client Secret              | Google Cloud에서 복사한 클라이언트 보안 비밀번호 |
| Additional Scopes          | **비워두기** (로그인에 YouTube scope 불필요)     |

**Save** 클릭

### 2.3 코드 동작 방식

```typescript
// app/lib/auth.client.ts
export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  // ...
}
```

1. `signInWithGoogle()` 호출 → Supabase SDK가 Google 로그인 페이지로 리다이렉트
2. 사용자 인증 후 → Supabase 콜백 URL로 리다이렉트 (`supabase.co/auth/v1/callback`)
3. Supabase가 세션 생성 → 앱의 `/auth/callback`으로 리다이렉트
4. `auth-callback-page.tsx`에서 `exchangeCodeForSession()` → 세션 확립
5. `/projects`로 리다이렉트

---

## 3. GitHub OAuth 로그인 설정

### 3.1 GitHub OAuth App 생성

1. [GitHub Developer Settings](https://github.com/settings/developers)에 접속
2. **OAuth Apps** > **New OAuth App** 클릭

   | 필드                       | 값                                                   |
   | -------------------------- | ---------------------------------------------------- |
   | Application name           | `TubeGAI`                                            |
   | Homepage URL               | `http://localhost:3000`                              |
   | Authorization callback URL | `https://<project-ref>.supabase.co/auth/v1/callback` |

3. **Register application** 클릭
4. **Client ID** 확인
5. **Generate a new client secret** 클릭 후 **Client Secret** 복사

> **주의**: Client Secret은 생성 직후에만 확인 가능합니다. 안전하게 보관하세요.

### 3.2 Supabase Dashboard 설정

**Authentication > Providers > GitHub**:

| 필드                       | 값                              |
| -------------------------- | ------------------------------- |
| Enable Sign in with GitHub | **ON**                          |
| Client ID                  | GitHub에서 복사한 Client ID     |
| Client Secret              | GitHub에서 복사한 Client Secret |

**Save** 클릭

### 3.3 코드 동작 방식

```typescript
// app/lib/auth.client.ts
export async function signInWithGitHub(): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  // ...
}
```

플로우는 Google OAuth와 동일합니다 (provider만 `"github"`으로 변경).

---

## 4. 이메일/비밀번호 인증 설정

### 4.1 Supabase Dashboard 설정

**Authentication > Providers > Email**:

| 항목                         | 권장 설정                 |
| ---------------------------- | ------------------------- |
| Enable Email provider        | **ON** (기본 활성화)      |
| Confirm email                | **ON** (이메일 인증 필수) |
| Double confirm email changes | **ON**                    |
| Secure password change       | **ON**                    |

### 4.2 관련 함수

| 함수                                      | 설명                        |
| ----------------------------------------- | --------------------------- |
| `signInWithEmail(email, password)`        | 이메일 로그인               |
| `signUpWithEmail(email, password, name?)` | 이메일 회원가입             |
| `sendPasswordResetEmail(email)`           | 비밀번호 초기화 이메일 발송 |

---

## 5. 서버 사이드 인증

### 5.1 인증 미들웨어

서버에서 인증을 처리하는 핵심 함수들:

```typescript
// app/lib/auth.server.ts

// Supabase 서버 클라이언트 생성 (Cookie 기반 세션)
const { supabase, headers } = createSupabaseServerClient(request);

// 필수 인증: 미인증 시 /auth/login으로 리다이렉트
const userId = await requireAuth(request);

// 선택적 인증: 미인증 시 null 반환
const userId = await getCurrentUserId(request);
```

### 5.2 개발 모드 폴백

개발 환경(`NODE_ENV !== "production"`)에서 세션이 없으면, DB의 첫 번째 사용자를 자동으로 사용합니다:

```typescript
if (isDev) {
  const devUserId = await getDevUserId();
  // SELECT id FROM auth.users LIMIT 1
}
```

이를 통해 OAuth 설정 없이도 개발이 가능합니다.

### 5.3 클라이언트 환경 변수 전달

`app/root.tsx`의 loader에서 `window.ENV`로 Supabase URL과 Anon Key를 클라이언트에 전달합니다:

```typescript
// root.tsx loader
return {
  ENV: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
};
```

---

## 6. 환경 변수 요약

| 변수                        | 용도                       | 설정 위치 | 클라이언트 노출  |
| --------------------------- | -------------------------- | --------- | ---------------- |
| `SUPABASE_URL`              | Supabase 프로젝트 URL      | `.env`    | O (`window.ENV`) |
| `SUPABASE_ANON_KEY`         | Supabase 익명 키           | `.env`    | O (`window.ENV`) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서비스 역할 키 (서버 전용) | `.env`    | X                |

> **참고**: Google/GitHub OAuth의 Client ID와 Client Secret은 **Supabase Dashboard**에서 직접 관리합니다. `.env` 파일에 별도로 설정할 필요가 없습니다.

---

## 7. 테스트

### 7.1 개발 서버 실행

```bash
npm run dev
```

### 7.2 로그인 테스트

1. `http://localhost:3000/auth/login` 접속
2. 각 로그인 방식 테스트:

| 방식   | 절차                                                      |
| ------ | --------------------------------------------------------- |
| 이메일 | 이메일/비밀번호 입력 → "로그인" 클릭                      |
| Google | "Google로 계속하기" 클릭 → Google 계정 선택 → 권한 승인   |
| GitHub | "GitHub로 계속하기" 클릭 → GitHub 계정 로그인 → 권한 승인 |

### 7.3 성공 확인

- `/auth/callback` 페이지에서 "로그인 성공! 리다이렉트 중..." 메시지 표시
- 1.5초 후 `/projects` 페이지로 자동 이동

---

## 8. 문제 해결

### 8.1 "redirect_uri_mismatch" 오류

**원인**: OAuth Provider의 리디렉션 URI가 Supabase 콜백 URL과 불일치

**해결**:

1. Google: Cloud Console > Credentials > 승인된 리디렉션 URI 확인
2. GitHub: OAuth App Settings > Authorization callback URL 확인
3. 올바른 형식: `https://<project-ref>.supabase.co/auth/v1/callback`
4. 슬래시, 오타 주의

### 8.2 "access_denied" 오류

**원인 1**: Google 앱이 테스트 모드이고 테스트 사용자로 등록되지 않음

**해결**: Google Cloud Console > OAuth consent screen > Test users에서 사용자 추가

**원인 2**: 사용자가 권한을 거부함

**해결**: 다시 시도하고 모든 권한 허용

### 8.3 "invalid_client" 오류

**원인**: Client ID 또는 Client Secret이 잘못됨

**해결**:

1. Google Cloud Console 또는 GitHub에서 credentials 다시 확인
2. Supabase Dashboard에 올바른 값 입력
3. 앞뒤 공백 제거

### 8.4 "window.ENV is undefined" 오류

**원인**: 클라이언트 환경 변수가 로드되지 않음

**해결**:

1. 브라우저 새로고침 (Ctrl+Shift+R / Cmd+Shift+R)
2. 개발 서버 재시작: `npm run dev`
3. `.env` 파일에 `SUPABASE_URL`, `SUPABASE_ANON_KEY`가 설정되어 있는지 확인

### 8.5 세션이 유지되지 않는 경우

**원인**: Cookie 설정 문제

**해결**:

1. 브라우저 개발자 도구 > Application > Cookies 확인
2. `sb-*` 쿠키가 존재하는지 확인
3. 서버 측 `createSupabaseServerClient()`가 올바르게 동작하는지 확인

### 8.6 GitHub 이메일이 표시되지 않는 경우

**원인**: GitHub 계정의 이메일이 비공개 설정

**해결**: GitHub > Settings > Emails에서 이메일 공개 설정 확인

---

## 9. 프로덕션 배포 체크리스트

### Google OAuth

- [ ] OAuth 동의 화면을 **프로덕션**으로 게시
- [ ] 프로덕션 도메인의 Supabase 콜백 URL을 승인된 리디렉션 URI에 추가
- [ ] 민감한 scope 사용 시 앱 검토 제출 (로그인 전용이면 불필요)

### GitHub OAuth

- [ ] GitHub OAuth App의 Authorization callback URL에 프로덕션 콜백 URL 추가
- [ ] Homepage URL을 프로덕션 도메인으로 변경

### Supabase

- [ ] Authentication > URL Configuration > Site URL을 프로덕션 도메인으로 설정
- [ ] Redirect URLs에 프로덕션 콜백 URL 추가: `https://your-domain.com/auth/callback`

### 환경 변수

- [ ] 프로덕션 환경에 `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 설정
- [ ] 비밀 키가 노출되지 않도록 확인

---

## 참고 자료

- [Supabase Auth - Google Provider](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Auth - GitHub Provider](https://supabase.com/docs/guides/auth/social-login/auth-github)
- [Supabase SSR Auth](https://supabase.com/docs/guides/auth/server-side)
- [GitHub OAuth Apps 문서](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
