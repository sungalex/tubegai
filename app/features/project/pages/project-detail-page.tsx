import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MoreVertical,
  Share2,
  Trash2,
  Archive,
  Pencil,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Palette,
  Type,
  Video,
  ExternalLink
} from "lucide-react";

import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/common/components/ui/breadcrumb"
import { Progress } from "~/common/components/ui/progress";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/common/components/ui/dropdown-menu";

export const meta = () => {
  return [
    { title: "Project Details | TubeGAI" },
    { name: "description", content: "View and manage project details." },
  ];
};

const WORKFLOW_STEPS = [
  { id: "script", label: "Script", icon: FileText, status: "completed" },
  { id: "storyboard", label: "Storyboard", icon: ImageIcon, status: "completed" },
  { id: "scene", label: "Scene", icon: Film, status: "in-progress" },
  { id: "b-roll", label: "B-Roll", icon: Video, status: "pending" },
  { id: "subtitles", label: "Subtitles", icon: Type, status: "pending" },
  { id: "coloring", label: "Color", icon: Palette, status: "pending" },
  { id: "thumbnail", label: "Thumbnail", icon: ImageIcon, status: "pending" },
  { id: "seo", label: "SEO", icon: ExternalLink, status: "pending" },
  { id: "export", label: "Export", icon: Share2, status: "pending" },
];

export default function ProjectDetailPage() {
  const { projectId } = useParams();

  // Mock Data
  const project = {
    id: projectId || "1",
    title: "AI Automation in 2024",
    description: "A comprehensive guide on how AI tools are changing the landscape of automation in 2024. Covering innovative tools and practical applications.",
    status: "In Progress",
    progress: 35,
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
    channel: {
      name: "TubeGAI Official",
      avatar: "https://github.com/shadcn.png"
    },
    topic: "Technology",
    createdAt: "Jan 12, 2024",
    updatedAt: "2 hours ago",
    size: "1.2 GB",
    duration: "10:05",
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 mb-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              {project.title}
              <Badge variant="secondary" className="text-base font-normal">{project.status}</Badge>
            </h1>
            <div className="flex items-center text-muted-foreground text-sm gap-4">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Created {project.createdAt}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Updated {project.updatedAt}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" /> Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="lg" asChild>
              <Link to={`/studio/dashboard/${project.id}`}>
                Open Studio
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Workflow Progress Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Production Workflow</CardTitle>
          <CardDescription>Current stage: Scene Setup</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span>Overall Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {WORKFLOW_STEPS.map((step, index) => {
              const isActive = step.status === "in-progress";
              const isCompleted = step.status === "completed";

              return (
                <Link
                  key={step.id}
                  to={`/studio/${step.id}/${project.id}`}
                  className={`
                                flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-colors hover:bg-accent
                                ${isActive ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"}
                                ${isCompleted ? "bg-muted/50 text-muted-foreground" : ""}
                            `}
                >
                  <step.icon className={`h-5 w-5 mb-2 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs font-medium ${isActive ? "text-primary" : ""}`}>{step.label}</span>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Overview */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted border relative group">
                <img
                  src={project.thumbnail}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="secondary" asChild>
                    <Link to={`/studio/thumbnail/${project.id}`}>Change Thumbnail</Link>
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-sm leading-relaxed">
                  {project.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <div className="text-xs text-muted-foreground mb-1">Target Channel</div>
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={project.channel.avatar} />
                      <AvatarFallback>CH</AvatarFallback>
                    </Avatar>
                    {project.channel.name}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <div className="text-xs text-muted-foreground mb-1">Topic</div>
                  <div className="font-medium text-sm">{project.topic}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Info & Activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">File Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">Estimated Duration</span>
                <span className="text-sm font-medium">{project.duration}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">Asset Size</span>
                <span className="text-sm font-medium">{project.size}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">Resolution</span>
                <span className="text-sm font-medium">1080p (HD)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">Format</span>
                <span className="text-sm font-medium">MP4</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="h-2 w-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                    <div className="space-y-1">
                      <p className="leading-none">Updated script for Scene {3 - i}</p>
                      <p className="text-xs text-muted-foreground">{(i + 1) * 2} hours ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
