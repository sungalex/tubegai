import { Button } from "~/common/components/ui/button";
import { Badge } from "~/common/components/ui/badge";
import { Link } from "react-router";
import { Check, Users, ShieldCheck, Globe, Database, Headset } from "lucide-react";
import { Card, CardContent } from "~/common/components/ui/card";

export const meta = () => {
  return [
    { title: "TubeGAI Plus - For Teams | TubeGAI" },
    { name: "description", content: "Scale your video production with TubeGAI Plus for teams and agencies." },
  ];
};

export default function PlusPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-24 px-4 text-center bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto max-w-5xl space-y-6">
          <Badge variant="secondary" className="px-4 py-1 text-sm bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            For Teams & Agencies
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Scale Your Production <br /> with <span className="text-blue-600">TubeGAI Plus</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            The collaborative powerhouse for MCNs, agencies, and large production teams.
            Manage multiple brands and creators in one workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button size="lg" className="h-12 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white" asChild>
              <Link to="/contact">Contact Sales</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg" asChild>
              <Link to="/products/pro">Compare with Pro</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Difference Grid */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900">
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">Team Collaboration</h3>
                <p className="text-blue-700 dark:text-blue-300">
                  Invite Editors, Scriptwriters, and Managers. Assign roles and permissions per project or channel.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900">
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">Unlimited Integrated Channels</h3>
                <p className="text-indigo-700 dark:text-indigo-300">
                  Manage 50+ YouTube channels from a single dashboard. Perfect for MCNs and multilingual brands.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-100 dark:border-purple-900">
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-purple-600 text-white flex items-center justify-center mb-4">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100">API & Bulk Actions</h3>
                <p className="text-purple-700 dark:text-purple-300">
                  Connect TubeGAI to your CMS via API. Batch generate videos from CSV or database sources.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature List */}
      <section className="py-20 px-4 bg-secondary/20">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Plus Exclusive Features</h2>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
            {[
              "Everything in Pro",
              "Dedicated Account Manager",
              "Custom Brand Kits & Templates",
              "SSO (Single Sign-On)",
              "Audit Logs & Compliance",
              "Priority 1-Hour Support",
              "Custom Invoice Billing",
              "Onboarding Training Session"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-background rounded-lg border">
                <Check className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Need a custom solution?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            We help large organizations automate video production at scale.
            Let's talk about your needs.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="h-14 px-10 text-lg">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
