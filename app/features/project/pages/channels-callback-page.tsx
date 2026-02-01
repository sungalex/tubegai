// =============================================================================
// YouTube OAuth Callback Page
// =============================================================================
// Handles the OAuth redirect from Google after user grants YouTube permissions
// Saves channel info directly to the channels table

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

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

interface CallbackState {
  status: "loading" | "fetching" | "saving" | "success" | "error";
  message: string;
  channelName?: string;
  channelCount?: number;
}

// =============================================================================
// Meta
// =============================================================================

export function meta() {
  return [{ title: "YouTube 채널 연결 중... - TubeGAI" }];
}

// =============================================================================
// Component
// =============================================================================

export default function ChannelsCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<CallbackState>({
    status: "loading",
    message: "인증 정보 확인 중...",
  });

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  async function handleOAuthCallback() {
    try {
      // Check for error in URL params
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        setState({
          status: "error",
          message: errorDescription || "OAuth 인증이 취소되었습니다.",
        });
        setTimeout(() => navigate("/projects/channels?error=cancelled"), 3000);
        return;
      }

      // Create Supabase client
      const supabase = createBrowserClient(
        window.ENV.SUPABASE_URL,
        window.ENV.SUPABASE_ANON_KEY
      );

      // Get current session with provider tokens
      setState({ status: "loading", message: "세션 정보 확인 중..." });

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setState({
          status: "error",
          message: "세션을 찾을 수 없습니다. 다시 로그인해주세요.",
        });
        setTimeout(() => navigate("/projects/channels?error=session"), 3000);
        return;
      }

      const accessToken = session.provider_token;
      const refreshToken = session.provider_refresh_token;

      if (!accessToken) {
        setState({
          status: "error",
          message: "YouTube 액세스 토큰을 찾을 수 없습니다.",
        });
        setTimeout(() => navigate("/projects/channels?error=token"), 3000);
        return;
      }

      // Fetch YouTube channel information
      setState({ status: "fetching", message: "YouTube 채널 정보 가져오는 중..." });

      // Try to get channels the user can manage (including Brand Accounts)
      let channelResponse = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&managedByMe=true&maxResults=50",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // If managedByMe fails, fall back to mine=true
      if (!channelResponse.ok) {
        console.log("[YouTube OAuth] managedByMe failed, falling back to mine=true");
        channelResponse = await fetch(
          "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&mine=true",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }

      if (!channelResponse.ok) {
        const errorText = await channelResponse.text();
        console.error("YouTube API Error:", errorText);
        setState({
          status: "error",
          message: "YouTube 채널 정보를 가져오는데 실패했습니다.",
        });
        setTimeout(() => navigate("/projects/channels?error=youtube"), 3000);
        return;
      }

      const channelData = await channelResponse.json();

      if (!channelData.items || channelData.items.length === 0) {
        setState({
          status: "error",
          message: "연결된 YouTube 채널을 찾을 수 없습니다.",
        });
        setTimeout(() => navigate("/projects/channels?error=no_channel"), 3000);
        return;
      }

      const channels: YouTubeChannelInfo[] = channelData.items;
      const channelCount = channels.length;

      // Save channels to database
      setState({
        status: "saving",
        message: "채널 정보 저장 중...",
        channelCount,
      });

      // Prepare channel data for the server
      const channelsData = channels.map((channel) => ({
        youtubeChannelId: channel.id,
        name: channel.snippet.title,
        handle: channel.snippet.customUrl || undefined,
        description: channel.snippet.description || undefined,
        avatarUrl:
          channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default.url,
        bannerUrl: channel.brandingSettings?.image?.bannerExternalUrl || undefined,
        subscriberCount: parseInt(channel.statistics.subscriberCount || "0", 10),
        videoCount: parseInt(channel.statistics.videoCount || "0", 10),
        viewCount: parseInt(channel.statistics.viewCount || "0", 10),
      }));

      // Submit to API with save-channels intent
      const formData = new FormData();
      formData.append("intent", "save-channels");
      formData.append("accessToken", accessToken);
      formData.append("refreshToken", refreshToken || "");
      formData.append("channels", JSON.stringify(channelsData));

      const saveResponse = await fetch("/api/channels", {
        method: "POST",
        body: formData,
      });

      const result = await saveResponse.json();

      if (!saveResponse.ok || !result.success) {
        console.error("Save Error:", result.error);
        setState({
          status: "error",
          message: result.error || "채널 정보 저장에 실패했습니다.",
        });
        setTimeout(() => navigate("/projects/channels?error=save"), 3000);
        return;
      }

      // Success message
      let successMessage = "";
      if (result.created > 0 && result.updated > 0) {
        successMessage = `${result.created}개 채널 추가, ${result.updated}개 채널 업데이트됨`;
      } else if (result.created > 0) {
        successMessage = `${result.created}개 채널이 연결되었습니다!`;
      } else if (result.updated > 0) {
        successMessage = `${result.updated}개 채널 정보가 업데이트되었습니다!`;
      } else {
        successMessage = "채널이 연결되었습니다!";
      }

      setState({
        status: "success",
        message: successMessage,
        channelName: channels.length === 1 ? channels[0].snippet.title : undefined,
        channelCount,
      });

      // Redirect to channels page
      setTimeout(() => navigate("/projects/channels?success=connected"), 2000);
    } catch (error) {
      console.error("OAuth Callback Error:", error);
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      });
      setTimeout(() => navigate("/projects/channels?error=unknown"), 3000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {state.status === "error" ? (
              <XCircle className="w-6 h-6 text-destructive" />
            ) : state.status === "success" ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            )}
            YouTube 채널 연결
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{state.message}</p>

          {state.channelName && <p className="font-medium text-lg">{state.channelName}</p>}

          {state.status === "error" && (
            <p className="text-sm text-muted-foreground">
              잠시 후 채널 페이지로 이동합니다...
            </p>
          )}

          {state.status === "success" && (
            <p className="text-sm text-muted-foreground">채널 페이지로 이동합니다...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
