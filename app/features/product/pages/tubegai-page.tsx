import { Button } from "~/common/components/ui/button";
import { Badge } from "~/common/components/ui/badge";
import { Link } from "react-router";
import { Check, Clock, Sparkles, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "~/common/components/ui/card";

export const meta = () => {
  return [
    { title: "TubeGAI - Free Trial | TubeGAI" },
    { name: "description", content: "Start your 2-week free trial of TubeGAI Pro." },
  ];
};

export default function TubeGaiPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto max-w-4xl space-y-6">
          <Badge variant="outline" className="px-4 py-1 text-sm border-primary/50 text-primary bg-primary/10">
            Free 2-Week Trial
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
            Experience the Future of Content Creation
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Try all the powerful features of TubeGAI Pro for free.
            Automate your video production and grow your channel today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="h-12 px-8 text-lg" asChild>
              <Link to="/auth/join">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8" asChild>
              <Link to="/products/pro">Compare Plans</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground pt-4">
            No credit card required. 14 days free access.
          </p>
        </div>
      </section>

      {/* Trial Features Grid */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What's included in your Trial?</h2>
            <p className="text-muted-foreground">You get access to Pro features with some usage limits.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>AI Automation Scripts</CardTitle>
                <CardDescription>Full access to AI script writer</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> AI Topic Generator</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Script & Storyboard AI</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Scene Generation</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Usage Limits (Trial)</CardTitle>
                <CardDescription>Generous limits to test the waters</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 5 Projects / Month</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 1 Connected Channel</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 720p Export</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-muted bg-muted/30">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <X className="h-6 w-6 text-gray-500" />
                </div>
                <CardTitle>What's restricted?</CardTitle>
                <CardDescription>Unlock these with a full Pro sub</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><X className="h-4 w-4 text-muted-foreground" /> No Watermarks (Watermarked in trial)</li>
                  <li className="flex items-center gap-2"><X className="h-4 w-4 text-muted-foreground" /> 4K Resolution Export</li>
                  <li className="flex items-center gap-2"><X className="h-4 w-4 text-muted-foreground" /> Priority Support</li>
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
              <h2 className="text-3xl md:text-4xl font-bold">Ready to revolutionize your content?</h2>
              <p className="text-lg opacity-90 max-w-xl mx-auto">
                Join thousands of creators saving 100+ hours a month.
                Start your free 2-week trial today.
              </p>
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-semibold" asChild>
                <Link to="/auth/join">Start Building Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
