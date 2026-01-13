import { Button } from "~/common/components/ui/button";
import { Link } from "react-router";
import { Sparkles, ArrowRight } from "lucide-react";

export const meta = () => {
  return [
    { title: "TubeGAI | TubeGAI" },
    { name: "description", content: "Standard integrated creator workflow solution." },
  ];
};

export default function TubeGAIPage() {
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
        <div className="p-3 bg-primary/10 rounded-full">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          TubeGAI
        </h1>

        <p className="text-xl text-muted-foreground">
          The standard integrated creator workflow solution.
          Automate your YouTube production pipeline with AI-powered tools.
        </p>

        <div className="flex gap-4 pt-4">
          <Button size="lg" asChild>
            <Link to="/projects/new">
              Start Creating <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/dashboard">
              Go to Dashboard
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-16">
          <FeatureCard
            title="Script Generation"
            description="Generate engaging scripts from simple prompts."
          />
          <FeatureCard
            title="AI Storyboarding"
            description="Visualize your video before you start editing."
          />
          <FeatureCard
            title="Smart Export"
            description="Optimize and export for YouTube in one click."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
