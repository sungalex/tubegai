// =============================================================================
// YouTube OAuth Server Functions (Standalone - Supabase Auth 외부)
// =============================================================================
// GitHub 로그인 세션을 유지하면서 YouTube OAuth를 별도로 처리
// Google OAuth를 직접 구현하여 토큰을 채널 테이블에 저장

// =============================================================================
// Types
// =============================================================================

export interface YouTubeTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
  tokenType: string;
  scope: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
}

// =============================================================================
// Configuration
// =============================================================================

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// YouTube API scopes
const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
].join(" ");

// =============================================================================
// Helper Functions
// =============================================================================

function getGoogleClientId(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID environment variable is not set");
  }
  return clientId;
}

function getGoogleClientSecret(): string {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRET environment variable is not set");
  }
  return clientSecret;
}

// =============================================================================
// OAuth Functions
// =============================================================================

/**
 * Generate YouTube OAuth authorization URL
 * 사용자를 Google 동의 화면으로 리다이렉트하기 위한 URL 생성
 */
export function generateYouTubeOAuthUrl(
  redirectUri: string,
  state?: string
): string {
  const clientId = getGoogleClientId();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: YOUTUBE_SCOPES,
    access_type: "offline", // refresh_token 받기 위해 필요
    prompt: "consent", // 매번 동의 화면 표시 (refresh_token 보장)
    include_granted_scopes: "true",
  });

  if (state) {
    params.set("state", state);
  }

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 * OAuth 콜백에서 받은 code를 access_token과 refresh_token으로 교환
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<YouTubeTokens> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const data: GoogleTokenResponse = await response.json();

  if (data.error) {
    throw new Error(`Token exchange failed: ${data.error_description || data.error}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
    scope: data.scope,
  };
}

/**
 * Refresh access token using refresh token
 * 만료된 access_token을 refresh_token으로 갱신
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<YouTubeTokens> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data: GoogleTokenResponse = await response.json();

  if (data.error) {
    throw new Error(`Token refresh failed: ${data.error_description || data.error}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken, // refresh_token은 보통 갱신되지 않음
    expiresIn: data.expires_in,
    tokenType: data.token_type,
    scope: data.scope,
  };
}

/**
 * Revoke OAuth tokens
 * 사용자가 연결을 해제할 때 토큰 폐기
 */
export async function revokeToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/revoke?token=${token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}
