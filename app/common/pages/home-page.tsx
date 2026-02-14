import { Link } from "react-router";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/common/components/ui/accordion";
import { Sparkles, TrendingUp, FileText, Video, Mic, Share2, Play } from "lucide-react";
import { BorderBeam } from "~/common/components/magicui/border-beam";
import { BentoGrid, BentoCard } from "~/common/components/magicui/bento-grid";

export const meta = () => {
  return [
    { title: "TubeGAI - Automate Your YouTube Workflow" },
    { name: "description", content: "TubeGAI: Integrated creator workflow solution combining generative AI and YouTube data." },
  ];
}

export default function HomePage() {
  const features = [
    {
      Icon: TrendingUp,
      name: "트렌드 분석",
      description: "실시간 YouTube 트렌드를 분석하여 인기 주제를 찾아보세요.",
      href: "/auth/join",
      cta: "분석 시작",
      background: <div className="absolute inset-0 bg-linear-to-br from-blue-500/20 to-transparent opacity-50" />,
      className: "lg:row-start-1 lg:col-start-1 lg:col-span-2",
    },
    {
      Icon: FileText,
      name: "AI 스크립트 생성",
      description: "최적화된 스크립트를 즉시 생성하세요.",
      href: "/auth/join",
      cta: "스크립트 생성",
      background: <div className="absolute inset-0 bg-linear-to-br from-purple-500/20 to-transparent opacity-50" />,
      className: "lg:row-start-1 lg:col-start-3 lg:col-span-1",
    },
    {
      Icon: Video,
      name: "스톡 영상 매칭",
      description: "AI가 완벽한 스톡 영상을 찾아드립니다.",
      href: "/auth/join",
      cta: "자세히 보기",
      background: <div className="absolute inset-0 bg-linear-to-br from-green-500/20 to-transparent opacity-50" />,
      className: "lg:row-start-2 lg:col-start-1 lg:col-span-1",
    },
    {
      Icon: Mic,
      name: "텍스트 기반 편집",
      description: "텍스트를 입력하여 비디오를 편집하세요.",
      href: "/auth/join",
      cta: "에디터 사용해보기",
      background: <div className="absolute inset-0 bg-linear-to-br from-pink-500/20 to-transparent opacity-50" />,
      className: "lg:row-start-2 lg:col-start-2 lg:col-span-2",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 bg-background overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl mb-6">
            <span className="text-primary">TubeGAI</span>로 전체 제작 과정을 자동화하세요
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            아이디어 발굴부터 최종 편집까지, 생성형 AI와 YouTube 데이터를 결합한 통합 크리에이터 워크플로우 솔루션.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/auth/join">무료로 시작하기</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/auth/login">로그인</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Video Introduction Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">TubeGAI 실제 사용 보기</h2>
            <p className="text-xl text-muted-foreground">3일 작업을 3시간 만에 완료하세요.</p>
          </div>
          <div className="relative aspect-video bg-muted rounded-xl overflow-hidden shadow-xl border flex items-center justify-center group cursor-pointer max-w-5xl mx-auto">
            <BorderBeam size={250} duration={12} delay={9} />
            <div className="text-center">
              <div className="w-16 h-16 bg-background/90 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-foreground text-foreground ml-1" />
              </div>
              <p className="font-semibold text-sm uppercase tracking-wider">데모 보기</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">워크플로우 오케스트레이션</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              편집만 하지 마세요. 오케스트레이션하세요. TubeGAI는 크리에이티브 프로세스의 모든 단계를 통합합니다.
            </p>
          </div>

          <BentoGrid className="max-w-6xl mx-auto lg:grid-cols-3 lg:auto-rows-[20rem]">
            {features.map((feature) => (
              <BentoCard
                key={feature.name}
                {...feature}
                className={feature.className}
              />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto max-w-3xl px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">자주 묻는 질문</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>기존 도구와 어떻게 다른가요?</AccordionTrigger>
              <AccordionContent>
                TubeGAI는 단순한 편집 도구가 아닙니다. 아이디어 발굴부터 최종 편집까지 전체 비디오 제작 파이프라인을 단일 AI 기반 워크플로우로 통합합니다. 트렌드 분석, 스크립트 작성, 스토리보드 생성, 편집, SEO 최적화까지 모든 것이 하나의 플랫폼에서 원활하게 연결됩니다.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>기술적 지식이 필요한가요?</AccordionTrigger>
              <AccordionContent>
                전혀 아닙니다! TubeGAI는 모든 경험 수준의 크리에이터를 위해 설계되었습니다. 직관적인 인터페이스와 AI 어시스턴트가 각 단계를 안내하므로 초보자도 전문가 수준의 콘텐츠를 제작할 수 있습니다.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>무료 체험판이 있나요?</AccordionTrigger>
              <AccordionContent>
                네! 신용카드 없이 무료로 시작할 수 있습니다. 무료 플랜에는 월 3개 프로젝트 제작, AI 스크립트 생성 10회, 기본 트렌드 분석 기능이 포함됩니다.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>모바일에서 사용할 수 있나요?</AccordionTrigger>
              <AccordionContent>
                현재 TubeGAI는 데스크톱과 태블릿에 최적화되어 있습니다. 모바일 앱은 2024년 상반기에 출시될 예정이며, 전용 iOS 및 Android 앱을 통해 이동 중에도 프로젝트를 관리할 수 있게 될 것입니다.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center sm:items-start">
              <h3 className="text-lg font-bold">TubeGAI</h3>
              <p className="text-sm text-muted-foreground">AI로 크리에이터에게 힘을.</p>
            </div>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link to="#" className="hover:text-foreground transition-colors">개인정보처리방침</Link>
              <Link to="#" className="hover:text-foreground transition-colors">이용약관</Link>
              <Link to="#" className="hover:text-foreground transition-colors">문의하기</Link>
            </nav>
          </div>
          <div className="mt-8 text-center text-xs text-muted-foreground">
            {`© ${new Date().getFullYear()} TubeGAI. All rights reserved.`}
          </div>
        </div>
      </footer>
    </div>
  );
}
