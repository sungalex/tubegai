import { Button } from "~/common/components/ui/button";
import { Badge } from "~/common/components/ui/badge";
import { Link } from "react-router";
import { Check, Zap, Star, LayoutDashboard, Film, BarChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/common/components/ui/card";

export const meta = () => {
  return [
    { title: "TubeGAI Pro - For Creators | TubeGAI" },
    { name: "description", content: "The ultimate AI tool for professional content creators." },
  ];
};

const FEATURES = [
  {
    icon: Film,
    title: "Unlimited Projects",
    description: "Create as many videos as your imagination allows. No monthly caps."
  },
  {
    icon: Star,
    title: "4K Export Quality",
    description: "Crystal clear output suitable for big screens and high-end portfolios."
  },
  {
    icon: LayoutDashboard,
    title: "Multi-Channel Management",
    description: "Sync up to 3 YouTube channels and manage them from one dashboard."
  },
  {
    icon: Zap,
    title: "No Watermarks",
    description: "Clean, professional exports with your own branding only."
  },
  {
    icon: BarChart,
    title: "Advanced Trends",
    description: "Deep dive into niche trends with faster update frequencies."
  },
];

export default function ProPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-24 px-4 text-center bg-black dark:bg-black text-white relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />

        <div className="container mx-auto max-w-4xl space-y-8 relative z-10">
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 border-0 px-4 py-1 text-sm font-medium">
            Most Popular Choice
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            TubeGAI <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Pro</span>
          </h1>
          <p className="text-2xl text-gray-300 max-w-2xl mx-auto font-light">
            Unleash your full potential with the tool built for serious creators.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button size="lg" className="h-14 px-10 text-lg bg-white text-black hover:bg-gray-200" asChild>
              <Link to="/auth/join?plan=pro">Get Started - $29/mo</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-gray-700 text-gray-300 hover:bg-gray-900 hover:text-white" asChild>
              <Link to="/products/tubegai">View Free Trial</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Why Pros Choose TubeGAI</h2>
            <p className="text-xl text-muted-foreground mx-auto max-w-2xl">
              Everything you need to scale your production quality and quantity without hiring a team.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {FEATURES.map((feature, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">AI</div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Priority AI Generation</h3>
                <p className="text-muted-foreground leading-relaxed">Skip the queue. Your video rendering and script generation happen first.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Card Section */}
      <section className="py-24 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-xl">
          <Card className="border-2 border-primary/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Badge className="bg-primary">Best Value</Badge>
            </div>
            <CardHeader className="text-center pt-10 pb-8">
              <CardTitle className="text-2xl font-bold text-muted-foreground">TubeGAI Pro</CardTitle>
              <div className="flex items-baseline justify-center gap-1 mt-4">
                <span className="text-5xl font-extrabold text-foreground">$29</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription className="mt-4">billed monthly</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-10">
              <ul className="space-y-4">
                {[
                  "Unlimited Projects",
                  "3 Connected Channels",
                  "4K Resolution Export",
                  "No Watermarks",
                  "Advanced Analytics",
                  "Priority Support"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="rounded-full bg-green-500/10 p-1">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-8 h-12 text-lg font-bold" asChild>
                <Link to="/auth/join?plan=pro">Upgrade Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
