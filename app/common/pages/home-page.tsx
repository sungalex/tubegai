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
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 bg-background overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl mb-6">
            Automate your entire production with <span className="text-primary">TubeGAI</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Integrated creator workflow solution combining generative AI and YouTube data, from idea discovery to final editing.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/auth/join">Start for Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/auth/login">Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Video Introduction Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">See TubeGAI in Action</h2>
            <p className="text-xl text-muted-foreground">Transform your 3-day workload into a 3-hour breeze.</p>
          </div>
          <div className="relative aspect-video bg-muted rounded-xl overflow-hidden shadow-xl border flex items-center justify-center group cursor-pointer max-w-5xl mx-auto">
            <BorderBeam size={250} duration={12} delay={9} />
            <div className="text-center">
              <div className="w-16 h-16 bg-background/90 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-foreground text-foreground ml-1" />
              </div>
              <p className="font-semibold text-sm uppercase tracking-wider">Watch Demo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Workflow Orchestration</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Don't just edit. Orchestrate. TubeGAI integrates every step of your creative process.
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
            <h2 className="text-3xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How is it different from existing tools?</AccordionTrigger>
              <AccordionContent>
                While tools like Vrew or OpusClip focus on specific features (subtitles, shorts), TubeGAI integrates the <strong>entire production process</strong>—from trend analysis and scriptwriting to editing and publishing—into a single, unified workflow powered by YouTube Data API.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Do I need technical knowledge?</AccordionTrigger>
              <AccordionContent>
                No. We use a <strong>text-based editing</strong> approach. If you can edit a word document, you can edit video with TubeGAI. No complex timeline skills required.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Is there a free trial?</AccordionTrigger>
              <AccordionContent>
                Yes! New users get a <strong>14-day free trial</strong> with full access to all features. Experience the productivity boost firsthand before committing.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Can I use it on mobile?</AccordionTrigger>
              <AccordionContent>
                The core creation workflow is optimized for PC (Desktop/Web) for best performance, but you can check analytics and manage account settings on mobile.
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
              <p className="text-sm text-muted-foreground">Empowering Creators with AI.</p>
            </div>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link to="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link to="#" className="hover:text-foreground transition-colors">Contact</Link>
            </nav>
          </div>
          <div className="mt-8 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} TubeGAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    Icon: TrendingUp,
    name: "Trend Analysis",
    description: "Analyze real-time YouTube trends to find winning topics.",
    href: "/auth/join",
    cta: "Start Analyzing",
    background: <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-50" />,
    className: "lg:row-start-1 lg:col-start-1 lg:col-span-2",
  },
  {
    Icon: FileText,
    name: "AI Script Generation",
    description: "Generate optimized scripts instantly.",
    href: "/auth/join",
    cta: "Generate Script",
    background: <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent opacity-50" />,
    className: "lg:row-start-1 lg:col-start-3 lg:col-span-1",
  },
  {
    Icon: Video,
    name: "Stock Footage Match",
    description: "AI finds the perfect stock footage.",
    href: "/auth/join",
    cta: "Learn More",
    background: <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent opacity-50" />,
    className: "lg:row-start-2 lg:col-start-1 lg:col-span-1",
  },
  {
    Icon: Mic,
    name: "Text-Based Editing",
    description: "Edit your video by entering text.",
    href: "/auth/join",
    cta: "Try Editor",
    background: <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-transparent opacity-50" />,
    className: "lg:row-start-2 lg:col-start-2 lg:col-span-2",
  },
];
