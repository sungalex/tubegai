import { useParams, Link } from "react-router";
import {
  FileText,
  Presentation,
  Clapperboard,
  Film,
  Captions,
  Palette,
  Image as ImageIcon,
  LineChart,
  Download,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "~/common/components/ui/card";
import { Progress } from "~/common/components/ui/progress";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";

export const meta = () => {
  return [
    { title: "Studio Dashboard | TubeGAI" },
    { name: "description", content: "Overview of your production pipeline." },
  ];
};

export default function StudioDashboardPage() {
  const { projectId } = useParams();

  // Mock Data for a Specific Project
  const projectData = {
    id: projectId,
    title: "AI Automation Tutorial 2024",
    description: "A comprehensive guide to setting up AI agents.",
    progress: 35,
    status: "In Progress",
    lastEdited: "2 hours ago",
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    steps: [
      { id: "script", label: "Script", status: "completed", icon: FileText },
      { id: "storyboard", label: "Storyboard", status: "completed", icon: Presentation },
      { id: "scene", label: "Scene", status: "in-progress", icon: Clapperboard },
      { id: "b-roll", label: "B-Roll", status: "pending", icon: Film },
      { id: "subtitles", label: "Subtitles", status: "pending", icon: Captions },
      { id: "coloring", label: "Coloring", status: "pending", icon: Palette },
      { id: "thumbnail", label: "Thumbnail", status: "pending", icon: ImageIcon },
      { id: "seo", label: "SEO", status: "pending", icon: LineChart },
      { id: "export", label: "Export", status: "pending", icon: Download },
    ]
  };

  // Mock Data for "No Project" (Recent Projects List)
  const recentProjects = [
    { id: "1", title: "Tech Review: MacBook Pro", status: "Draft", lastEdited: "1 day ago", progress: 10 },
    { id: "2", title: "Vlog: Day in Life", status: "Review", lastEdited: "3 days ago", progress: 80 },
    { id: "3", title: "React Router v7 Guide", status: "Completed", lastEdited: "1 week ago", progress: 100 },
  ];

  if (!projectId) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Welcome to Studio</h2>
            <p className="text-muted-foreground">Select a project to continue your work or start a new one.</p>
          </div>
          <Button asChild>
            <Link to="/projects/new">
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentProjects.map((project) => (
            <Card key={project.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-start">
                  <span className="truncate">{project.title}</span>
                  <Badge variant={project.status === "Completed" ? "default" : "secondary"}>
                    {project.status}
                  </Badge>
                </CardTitle>
                <CardDescription>Last edited {project.lastEdited}</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full justify-between" asChild>
                  <Link to={`/studio/dashboard/${project.id}`}>
                    Open Studio <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <Clapperboard className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No active projects?</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Get started by creating a new project. Our AI tools will help you generate scripts, storyboards, and videos in minutes.
            </p>
            <Button variant="outline" asChild>
              <Link to="/projects/new">Create Project</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Project Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-[240px] aspect-video bg-muted rounded-lg overflow-hidden shrink-0 border relative group">
          <img
            src={projectData.thumbnail}
            alt="Project Thumbnail"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs uppercase tracking-wider">{projectData.status}</Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Last edited {projectData.lastEdited}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{projectData.title}</h1>
          <p className="text-muted-foreground max-w-2xl">{projectData.description}</p>

          <div className="pt-4 max-w-md space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Overall Completion</span>
              <span>{projectData.progress}%</span>
            </div>
            <Progress value={projectData.progress} className="h-2" />
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <Button size="lg" className="w-full md:w-auto">
            Resume Editing
          </Button>
          <Button variant="outline" className="w-full md:w-auto">
            Project Settings
          </Button>
        </div>
      </div>

      <Separator />

      {/* Pipeline Visualizer */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Production Pipeline</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {projectData.steps.map((step) => (
            <Link
              key={step.id}
              to={`/studio/${step.id}/${projectId}`}
              className={`
                relative flex flex-col items-center p-4 rounded-xl border transition-all hover:shadow-md
                ${step.status === 'completed' ? 'bg-primary/5 border-primary/20 hover:border-primary/50' :
                  step.status === 'in-progress' ? 'bg-background border-primary border-2 shadow-sm scale-105 z-10' :
                    'bg-muted/30 border-muted hover:bg-muted/50'}
              `}
            >
              <div className={`
                p-3 rounded-full mb-3
                ${step.status === 'completed' ? 'bg-primary/10 text-primary' :
                  step.status === 'in-progress' ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'}
              `}>
                <step.icon className="h-6 w-6" />
              </div>
              <span className={`font-medium text-sm ${step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>
                {step.label}
              </span>

              {/* Status Indicator */}
              <div className="absolute top-2 right-2">
                {step.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {step.status === 'in-progress' && <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity / Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-start gap-4 text-sm pb-4 border-b last:border-0 last:pb-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Script generated by Gemini</p>
                    <p className="text-muted-foreground">The AI generated 3 versions of the intro.</p>
                    <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated Duration</span>
                <span className="font-medium">10:45</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Asset Count</span>
                <span className="font-medium">24 Files</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Scenes</span>
                <span className="font-medium">8 Scenes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">AI Tokens Used</span>
                <span className="font-medium">12,450</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg flex gap-3 text-sm text-yellow-700 dark:text-yellow-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>
                <strong>Tip:</strong> You haven't generated a storyboard yet. Visualizing your script helps reduce revision time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
