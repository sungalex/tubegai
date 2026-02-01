// =============================================================================
// YouTube OAuth Callback Page (Legacy - Redirect to new flow)
// =============================================================================
// 이 페이지는 더 이상 직접 사용되지 않습니다.
// 새로운 YouTube OAuth 흐름은 /api/youtube-oauth에서 처리됩니다.
// 이 페이지는 호환성을 위해 유지됩니다.

import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Loader2 } from "lucide-react";

export function meta() {
  return [{ title: "YouTube 채널 연결 중... - TubeGAI" }];
}

export default function ChannelsCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // 새로운 OAuth 흐름을 사용하므로 채널 페이지로 리다이렉트
    navigate("/projects/channels", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            리다이렉트 중...
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">채널 페이지로 이동합니다...</p>
        </CardContent>
      </Card>
    </div>
  );
}
