// =============================================================================
// Join (Sign Up) Page
// =============================================================================
// 이메일, GitHub, Google 회원가입 지원

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Github } from "lucide-react";

import { Button } from "~/common/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/common/components/ui/form";
import { Input } from "~/common/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Separator } from "~/common/components/ui/separator";
import { useTranslation } from "~/i18n/context";
import {
  signUpWithEmail,
  signInWithGitHub,
  signInWithGoogle,
} from "~/lib/auth.client";

// =============================================================================
// Schema
// =============================================================================

const joinSchema = z.object({
  name: z.string().min(2, { message: "이름은 최소 2자 이상이어야 합니다." }),
  email: z.string().email({ message: "올바른 이메일 주소를 입력해주세요." }),
  password: z.string().min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다.",
  path: ["confirmPassword"],
});

type JoinValues = z.infer<typeof joinSchema>;

// =============================================================================
// Component
// =============================================================================

export default function JoinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<"github" | "google" | null>(null);
  const { t } = useTranslation("auth");
  const { t: tc } = useTranslation("common");

  const form = useForm<JoinValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle URL error params
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast.error("오류가 발생했습니다.");
      window.history.replaceState({}, "", "/auth/join");
    }
  }, [searchParams]);

  // Email/Password Sign Up
  async function onSubmit(data: JoinValues) {
    setIsLoading(true);

    try {
      const result = await signUpWithEmail(data.email, data.password, data.name);

      if (!result.success) {
        toast.error("회원가입 실패", {
          description: result.error || "오류가 발생했습니다.",
        });
        return;
      }

      toast.success("회원가입 완료!", {
        description: "이메일을 확인하여 계정을 활성화해주세요.",
      });

      navigate("/auth/login");
    } catch (error) {
      toast.error("회원가입 실패", {
        description: "오류가 발생했습니다. 다시 시도해주세요.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // GitHub OAuth Sign Up
  async function handleGitHubSignUp() {
    setIsOAuthLoading("github");

    try {
      const result = await signInWithGitHub();

      if (!result.success) {
        toast.error("GitHub 가입 실패", {
          description: result.error,
        });
        setIsOAuthLoading(null);
      }
      // If successful, user will be redirected to GitHub
    } catch (error) {
      toast.error("GitHub 가입 실패", {
        description: "오류가 발생했습니다.",
      });
      setIsOAuthLoading(null);
    }
  }

  // Google OAuth Sign Up
  async function handleGoogleSignUp() {
    setIsOAuthLoading("google");

    try {
      const result = await signInWithGoogle();

      if (!result.success) {
        toast.error("Google 가입 실패", {
          description: result.error,
        });
        setIsOAuthLoading(null);
      }
      // If successful, user will be redirected to Google
    } catch (error) {
      toast.error("Google 가입 실패", {
        description: "오류가 발생했습니다.",
      });
      setIsOAuthLoading(null);
    }
  }

  const isAnyLoading = isLoading || isOAuthLoading !== null;

  return (
    <div className="flex h-full min-h-[calc(100vh-200px)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t("join.title")}</CardTitle>
          <CardDescription className="text-center">
            {t("join.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OAuth Buttons */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGitHubSignUp}
              disabled={isAnyLoading}
            >
              {isOAuthLoading === "github" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Github className="mr-2 h-4 w-4" />
              )}
              {t("join.signUpWith", { provider: "GitHub" })}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={isAnyLoading}
            >
              {isOAuthLoading === "google" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {t("join.signUpWith", { provider: "Google" })}
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">{tc("misc.or")}</span>
            <Separator className="flex-1" />
          </div>

          {/* Email/Password Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("join.name")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t("join.namePlaceholder")}
                          className="pl-9"
                          {...field}
                          disabled={isAnyLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("join.email")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t("join.emailPlaceholder")}
                          className="pl-9"
                          {...field}
                          disabled={isAnyLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("join.password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="••••••"
                          className="pl-9"
                          {...field}
                          disabled={isAnyLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("join.confirmPassword")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="••••••"
                          className="pl-9"
                          {...field}
                          disabled={isAnyLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isAnyLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? t("join.submitting") : t("join.submit")}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            {t("join.hasAccount")}{" "}
            <Link to="/auth/login" className="text-primary hover:underline font-medium">
              {t("join.signIn")}
            </Link>
          </div>
          <div className="text-center text-xs text-muted-foreground px-8">
            {t("join.terms")}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
