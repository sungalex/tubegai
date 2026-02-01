import { Link } from "react-router";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/common/components/ui/accordion";
import { Sparkles, TrendingUp, FileText, Video, Mic, Share2, Play } from "lucide-react";
import { BorderBeam } from "~/common/components/magicui/border-beam";
import { BentoGrid, BentoCard } from "~/common/components/magicui/bento-grid";
import { useTranslation } from "~/i18n/context";

export const meta = () => {
  return [
    { title: "TubeGAI - Automate Your YouTube Workflow" },
    { name: "description", content: "TubeGAI: Integrated creator workflow solution combining generative AI and YouTube data." },
  ];
}

export default function HomePage() {
  const { t } = useTranslation("home");
  const features = [
    {
      Icon: TrendingUp,
      name: t("features.trendAnalysis.title"),
      description: t("features.trendAnalysis.description"),
      href: "/auth/join",
      cta: t("features.trendAnalysis.cta"),
      background: <div className="absolute inset-0 bg-linear-to-br from-blue-500/20 to-transparent opacity-50" />,
      className: "lg:row-start-1 lg:col-start-1 lg:col-span-2",
    },
    {
      Icon: FileText,
      name: t("features.aiScript.title"),
      description: t("features.aiScript.description"),
      href: "/auth/join",
      cta: t("features.aiScript.cta"),
      background: <div className="absolute inset-0 bg-linear-to-br from-purple-500/20 to-transparent opacity-50" />,
      className: "lg:row-start-1 lg:col-start-3 lg:col-span-1",
    },
    {
      Icon: Video,
      name: t("features.stockFootage.title"),
      description: t("features.stockFootage.description"),
      href: "/auth/join",
      cta: t("features.stockFootage.cta"),
      background: <div className="absolute inset-0 bg-linear-to-br from-green-500/20 to-transparent opacity-50" />,
      className: "lg:row-start-2 lg:col-start-1 lg:col-span-1",
    },
    {
      Icon: Mic,
      name: t("features.textEditing.title"),
      description: t("features.textEditing.description"),
      href: "/auth/join",
      cta: t("features.textEditing.cta"),
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
            {t("hero.title").split("TubeGAI")[0]}<span className="text-primary">TubeGAI</span>{t("hero.title").split("TubeGAI")[1] || ""}
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/auth/join">{t("hero.startFree")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/auth/login">{t("hero.login")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Video Introduction Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">{t("hero.demoTitle")}</h2>
            <p className="text-xl text-muted-foreground">{t("hero.demoSubtitle")}</p>
          </div>
          <div className="relative aspect-video bg-muted rounded-xl overflow-hidden shadow-xl border flex items-center justify-center group cursor-pointer max-w-5xl mx-auto">
            <BorderBeam size={250} duration={12} delay={9} />
            <div className="text-center">
              <div className="w-16 h-16 bg-background/90 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-foreground text-foreground ml-1" />
              </div>
              <p className="font-semibold text-sm uppercase tracking-wider">{t("hero.watchDemo")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">{t("features.sectionTitle")}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("features.sectionSubtitle")}
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
            <h2 className="text-3xl font-bold tracking-tight mb-4">{t("faq.title")}</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>{t("faq.q1.question")}</AccordionTrigger>
              <AccordionContent>
                {t("faq.q1.answer")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>{t("faq.q2.question")}</AccordionTrigger>
              <AccordionContent>
                {t("faq.q2.answer")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>{t("faq.q3.question")}</AccordionTrigger>
              <AccordionContent>
                {t("faq.q3.answer")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>{t("faq.q4.question")}</AccordionTrigger>
              <AccordionContent>
                {t("faq.q4.answer")}
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
              <h3 className="text-lg font-bold">{t("footer.brand")}</h3>
              <p className="text-sm text-muted-foreground">{t("footer.tagline")}</p>
            </div>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link to="#" className="hover:text-foreground transition-colors">{t("footer.privacy")}</Link>
              <Link to="#" className="hover:text-foreground transition-colors">{t("footer.terms")}</Link>
              <Link to="#" className="hover:text-foreground transition-colors">{t("footer.contact")}</Link>
            </nav>
          </div>
          <div className="mt-8 text-center text-xs text-muted-foreground">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </div>
        </div>
      </footer>
    </div>
  );
}
