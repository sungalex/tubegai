// =============================================================================
// Auth Callback Page
// =============================================================================
// OAuth 리다이렉트 후 세션 처리
// GitHub, Google OAuth 로그인 완료 후 이 페이지로 리다이렉트됨

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export function meta() {
  return [{ title: "로그인 처리 중... - TubeGAI" }];
}

interface CallbackState {
  status: "loading" | "success" | "error";
  message: string;
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<CallbackState>({
    status: "loading",
    message: "로그인 처리 중...",
  });

  useEffect(() => {
    handleAuthCallback();
  }, []);

  async function handleAuthCallback() {
    try {
      // Check for error in URL params
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        setState({
          status: "error",
          message: errorDescription || "인증 중 오류가 발생했습니다.",
        });
        setTimeout(() => navigate("/auth/login?error=auth_failed"), 3000);
        return;
      }

      // Create Supabase client
      const supabase = createBrowserClient(
        window.ENV.SUPABASE_URL,
        window.ENV.SUPABASE_ANON_KEY
      );

      // Get session from URL (Supabase handles the code exchange)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("[Auth Callback] Session error:", sessionError);
        setState({
          status: "error",
          message: "세션을 가져오는 중 오류가 발생했습니다.",
        });
        setTimeout(() => navigate("/auth/login?error=session"), 3000);
        return;
      }

      if (!session) {
        // No session yet, might need to exchange code
        // Check if there's a code in the URL hash or search params
        const code = searchParams.get("code");

        if (code) {
          // Exchange code for session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error("[Auth Callback] Code exchange error:", exchangeError);
            setState({
              status: "error",
              message: "인증 코드 처리 중 오류가 발생했습니다.",
            });
            setTimeout(() => navigate("/auth/login?error=code_exchange"), 3000);
            return;
          }
        } else {
          setState({
            status: "error",
            message: "세션을 찾을 수 없습니다.",
          });
          setTimeout(() => navigate("/auth/login?error=no_session"), 3000);
          return;
        }
      }

      // Success
      setState({
        status: "success",
        message: "로그인 성공! 리다이렉트 중...",
      });

      // Redirect to dashboard
      setTimeout(() => navigate("/projects"), 1500);
    } catch (error) {
      console.error("[Auth Callback] Error:", error);
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      });
      setTimeout(() => navigate("/auth/login?error=unknown"), 3000);
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
            {state.status === "loading" ? "로그인 처리 중" :
             state.status === "success" ? "로그인 완료" : "로그인 실패"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{state.message}</p>

          {state.status !== "loading" && (
            <p className="text-sm text-muted-foreground">
              잠시 후 페이지가 이동합니다...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
