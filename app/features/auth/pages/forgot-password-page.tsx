// =============================================================================
// Forgot Password Page
// =============================================================================
// 비밀번호 복구 이메일 전송

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

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
import { useTranslation } from "~/i18n/context";
import { sendPasswordResetEmail } from "~/lib/auth.client";

// =============================================================================
// Schema
// =============================================================================

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "올바른 이메일 주소를 입력해주세요." }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

// =============================================================================
// Component
// =============================================================================

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const { t } = useTranslation("auth");

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordValues) {
    setIsLoading(true);

    try {
      const result = await sendPasswordResetEmail(data.email);

      if (!result.success) {
        toast.error("이메일 전송 실패", {
          description: result.error || "오류가 발생했습니다.",
        });
        return;
      }

      setSentEmail(data.email);
      setIsEmailSent(true);
      toast.success("이메일이 전송되었습니다.", {
        description: "이메일을 확인해주세요.",
      });
    } catch (error) {
      toast.error("이메일 전송 실패", {
        description: "오류가 발생했습니다. 다시 시도해주세요.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Email sent success state
  if (isEmailSent) {
    return (
      <div className="flex h-full min-h-[calc(100vh-200px)] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold">이메일이 전송되었습니다</CardTitle>
            <CardDescription>
              <span className="font-medium text-foreground">{sentEmail}</span>
              <br />
              위 이메일로 비밀번호 재설정 링크를 보냈습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p>이메일이 도착하지 않았다면:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>스팸 폴더를 확인해주세요</li>
                <li>입력한 이메일 주소가 정확한지 확인해주세요</li>
                <li>몇 분 후에 다시 시도해주세요</li>
              </ul>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsEmailSent(false);
                form.reset();
              }}
            >
              다른 이메일로 다시 시도
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/auth/login" className="text-sm text-primary hover:underline flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              로그인으로 돌아가기
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-200px)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t("forgotPassword.title")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("forgotPassword.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forgotPassword.email")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t("forgotPassword.emailPlaceholder")}
                          className="pl-9"
                          {...field}
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/auth/login" className="text-sm text-primary hover:underline flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {t("forgotPassword.backToLogin")}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
