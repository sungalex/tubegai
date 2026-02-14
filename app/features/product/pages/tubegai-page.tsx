import { Button } from "~/common/components/ui/button";
import { Badge } from "~/common/components/ui/badge";
import { Link } from "react-router";
import { Check, Clock, Sparkles, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/common/components/ui/card";

export const meta = () => {
  return [
    { title: "TubeGAI - 무료 체험 | TubeGAI" },
    { name: "description", content: "TubeGAI Pro 2주 무료 체험을 시작하세요." },
  ];
};

export default function TubeGaiPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-linear-to-b from-background to-secondary/20">
        <div className="container mx-auto max-w-4xl space-y-6">
          <Badge variant="outline" className="px-4 py-1 text-sm border-primary/50 text-primary bg-primary/10">
            2주 무료 체험
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-primary via-purple-500 to-pink-500">
            콘텐츠 제작의 미래를 경험하세요
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            TubeGAI Pro의 모든 강력한 기능을 무료로 체험해보세요.
            영상 제작을 자동화하고 채널을 성장시키세요.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="h-12 px-8 text-lg" asChild>
              <Link to="/auth/join">무료 체험 시작하기</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8" asChild>
              <Link to="/products/pro">요금제 비교하기</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground pt-4">
            신용카드 불필요. 14일간 무료 이용 가능.
          </p>
        </div>
      </section>

      {/* Trial Features Grid */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">체험판에 포함된 기능</h2>
            <p className="text-muted-foreground">일부 사용량 제한과 함께 Pro 기능을 이용할 수 있습니다.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI 자동화 스크립트</CardTitle>
                <CardDescription>AI 스크립트 작성기 전체 이용 가능</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> AI 주제 생성기</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 스크립트 & 스토리보드 AI</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 씬 생성</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle>사용량 제한 (체험판)</CardTitle>
                <CardDescription>충분한 제한으로 자유롭게 체험하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 월 5개 프로젝트</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 채널 1개 연결</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 720p 내보내기</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-muted bg-muted/30">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <X className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle>제한되는 기능</CardTitle>
                <CardDescription>Pro 구독으로 잠금 해제할 수 있습니다</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><X className="h-4 w-4 text-muted-foreground" /> 워터마크 제거 (체험판에서는 워터마크 포함)</li>
                  <li className="flex items-center gap-2"><X className="h-4 w-4 text-muted-foreground" /> 4K 해상도 내보내기</li>
                  <li className="flex items-center gap-2"><X className="h-4 w-4 text-muted-foreground" /> 우선 지원</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-black/10 z-0 pointer-events-none" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">콘텐츠 혁신을 시작할 준비가 되셨나요?</h2>
              <p className="text-lg opacity-90 max-w-xl mx-auto">
                매달 100시간 이상을 절약하는 수천 명의 크리에이터와 함께하세요.
                지금 2주 무료 체험을 시작하세요.
              </p>
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-semibold" asChild>
                <Link to="/auth/join">무료로 시작하기</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
