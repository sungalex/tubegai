// =============================================================================
// YouTube OAuth API Route (Standalone OAuth - Supabase Auth 외부)
// =============================================================================
// GitHub 로그인 세션을 유지하면서 YouTube OAuth를 별도로 처리
// TubeGAI 로그인(GitHub) + YouTube 채널 연동(Google OAuth)

import type { Route } from "./+types/youtube-oauth";
import { requireAuth } from "~/lib/auth.server";
import {
  generateYouTubeOAuthUrl,
  exchangeCodeForTokens,
} from "~/lib/youtube-oauth.server";
import { upsertChannel } from "~/common/data/channel.data.server";
import type { CreateChannelInput } from "~/common/types/channel.types";

// =============================================================================
// Types
// =============================================================================

interface YouTubeChannelInfo {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    thumbnails: {
      default: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
  brandingSettings?: {
    image?: {
      bannerExternalUrl?: string;
    };
  };
}

// =============================================================================
// Loader - OAuth Callback Handler
// =============================================================================

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  // OAuth 에러 처리
  if (error) {
    const errorDesc = url.searchParams.get("error_description") || error;
    console.error("[YouTube:OAuth] Callback error:", errorDesc);
    return Response.redirect(
      `${url.origin}/projects/channels?error=cancelled&message=${encodeURIComponent(errorDesc)}`,
      302
    );
  }

  // code가 없으면 에러
  if (!code) {
    return Response.redirect(
      `${url.origin}/projects/channels?error=no_code`,
      302
    );
  }

  try {
    // TubeGAI 로그인 확인 (GitHub 세션)
    const userId = await requireAuth(request);

    // Redirect URI 생성 (현재 URL에서 query params 제거)
    const redirectUri = `${url.origin}/api/youtube-oauth`;

    // Authorization code를 토큰으로 교환
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // YouTube API로 채널 정보 가져오기
    let channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&managedByMe=true&maxResults=50",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }
    );

    // managedByMe 실패 시 mine=true로 fallback
    if (!channelResponse.ok) {
      channelResponse = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&mine=true",
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );
    }

    if (!channelResponse.ok) {
      const errorText = await channelResponse.text();
      console.error("[YouTube:OAuth] YouTube API error:", errorText);
      return Response.redirect(
        `${url.origin}/projects/channels?error=youtube`,
        302
      );
    }

    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
      return Response.redirect(
        `${url.origin}/projects/channels?error=no_channel`,
        302
      );
    }

    const channels: YouTubeChannelInfo[] = channelData.items;

    // 채널 정보를 DB에 저장
    let created = 0;
    let updated = 0;

    for (const channel of channels) {
      const channelInput: CreateChannelInput = {
        youtubeChannelId: channel.id,
        name: channel.snippet.title,
        handle: channel.snippet.customUrl || undefined,
        description: channel.snippet.description || undefined,
        avatarUrl:
          channel.snippet.thumbnails.high?.url ||
          channel.snippet.thumbnails.default.url,
        bannerUrl: channel.brandingSettings?.image?.bannerExternalUrl || undefined,
        subscriberCount: parseInt(channel.statistics.subscriberCount || "0", 10),
        videoCount: parseInt(channel.statistics.videoCount || "0", 10),
        viewCount: parseInt(channel.statistics.viewCount || "0", 10),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || undefined,
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      };

      const result = await upsertChannel(userId, channelInput);

      if (result.isNew) {
        created++;
      } else {
        updated++;
      }
    }

    console.log(`[YouTube:OAuth] Channel connected | userId=${userId} | created=${created} | updated=${updated}`);

    // 성공 시 채널 페이지로 리다이렉트
    return Response.redirect(
      `${url.origin}/projects/channels?success=connected&created=${created}&updated=${updated}`,
      302
    );
  } catch (error) {
    console.error("[YouTube:OAuth] Callback FAILED:", error instanceof Error ? error.message : error);

    // 인증 실패 시 로그인 페이지로
    if (error instanceof Response && error.status === 302) {
      throw error;
    }

    return Response.redirect(
      `${url.origin}/projects/channels?error=unknown&message=${encodeURIComponent(
        error instanceof Error ? error.message : "Unknown error"
      )}`,
      302
    );
  }
}

// =============================================================================
// Action - OAuth Start
// =============================================================================

export async function action({ request }: Route.ActionArgs) {
  try {
    // TubeGAI 로그인 확인 (GitHub 세션)
    await requireAuth(request);

    const url = new URL(request.url);
    const redirectUri = `${url.origin}/api/youtube-oauth`;

    // state 파라미터 생성 (CSRF 방지)
    const state = crypto.randomUUID();

    // OAuth URL 생성
    const authUrl = generateYouTubeOAuthUrl(redirectUri, state);

    // Google OAuth 동의 화면으로 리다이렉트
    return Response.redirect(authUrl, 302);
  } catch (error) {
    console.error("[YouTube:OAuth] Start FAILED:", error instanceof Error ? error.message : error);

    // 인증 실패 시 로그인 페이지로
    if (error instanceof Response && error.status === 302) {
      throw error;
    }

    return Response.json(
      { error: "Failed to start OAuth flow" },
      { status: 500 }
    );
  }
}
