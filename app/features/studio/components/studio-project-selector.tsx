"use client";

import { useState, useEffect, useMemo } from "react";
import { Link, useFetcher } from "react-router";
import {
  Plus,
  ArrowRight,
  Clapperboard,
  LayoutDashboard,
  FileText,
  Presentation,
  Film,
  Captions,
  Palette,
  Image as ImageIcon,
  LineChart,
  Download,
  Search,
  Filter,
  Scissors,
  Loader2,
} from "lucide-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "~/common/components/ui/card";
import { Progress } from "~/common/components/ui/progress";
import { Badge } from "~/common/components/ui/badge";
import { Input } from "~/common/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/common/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/common/components/ui/tooltip";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "~/common/components/ui/carousel";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/common/components/ui/pagination";
import type { StudioProject } from "~/common/types/studio.types";

const QUICK_ACCESS_STEPS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "script", icon: FileText, label: "Script" },
  { id: "storyboard", icon: Presentation, label: "Storyboard" },
  { id: "scene", icon: Clapperboard, label: "Scene" },
  { id: "scene", icon: Clapperboard, label: "Scene" },
  { id: "b-roll", icon: Film, label: "B-Roll" },
  { id: "roughcut", icon: Scissors, label: "Rough Cut" },
  { id: "subtitles", icon: Captions, label: "Subtitles" },
  { id: "coloring", icon: Palette, label: "Coloring" },
  { id: "thumbnail", icon: ImageIcon, label: "Thumbnail" },
  { id: "seo", icon: LineChart, label: "SEO" },
  { id: "export", icon: Download, label: "Export" },
];

const ITEMS_PER_PAGE = 6;

interface StudioProjectSelectorProps {
  title?: string;
  description?: string;
  context?: "dashboard" | "script" | "storyboard" | "scene" | "b-roll" | "subtitles" | "coloring" | "thumbnail" | "seo" | "export" | "roughcut";
}

export function StudioProjectSelector({
  title = "Select a Project for Studio",
  description = "Select a project to continue your work or start a new one.",
  context = "dashboard"
}: StudioProjectSelectorProps) {

  const fetcher = useFetcher<{ projects: StudioProject[] }>();

  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load("/api/studio/projects");
    }
  }, [fetcher.state, fetcher.data]);

  const allProjects = fetcher.data?.projects ?? [];
  const recentProjects = allProjects.slice(0, 5);
  const uniqueChannels = useMemo(
    () => Array.from(new Set(allProjects.map(p => p.channel))).filter(Boolean).sort(),
    [allProjects]
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [searchScope, setSearchScope] = useState("title"); // title, labels
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("last_edited_desc");
  const [currentPage, setCurrentPage] = useState(1);

  const getPrimaryAction = () => {
    switch (context) {
      case "script":
        return { label: "Go Script", segment: "script" };
      case "storyboard":
        return { label: "Go Storyboard", segment: "storyboard" };
      case "scene":
        return { label: "Go Scene", segment: "scene" };
      case "b-roll":
        return { label: "Go B-Roll", segment: "b-roll" };
      case "roughcut":
        return { label: "Go Rough Cut", segment: "roughcut" };
      case "subtitles":
        return { label: "Go Subtitles", segment: "subtitles" };
      case "coloring":
        return { label: "Go Coloring", segment: "coloring" };
      case "thumbnail":
        return { label: "Go Thumbnail", segment: "thumbnail" };
      case "seo":
        return { label: "Go SEO", segment: "seo" };
      case "export":
        return { label: "Go Export", segment: "export" };
      case "dashboard":
      default:
        return { label: "Open Studio Dashboard", segment: "dashboard" };
    }
  };

  const { label: primaryLabel, segment: primarySegment } = getPrimaryAction();

  // Filter & Sort Logic
  const filteredAndSortedProjects = allProjects
    .filter(project => {
      // 1. Search Logic based on Scope (Title or Labels)
      const term = searchTerm.toLowerCase();
      let matchesSearch = false;

      switch (searchScope) {
        case "labels":
          matchesSearch = project.labels.some(label => label.toLowerCase().includes(term));
          break;
        case "title":
        default:
          matchesSearch = project.title.toLowerCase().includes(term);
          break;
      }

      // 2. Status Filter
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "in-progress" && project.status === "In Progress") ||
        (statusFilter === "completed" && project.status === "Completed") ||
        (statusFilter === "draft" && project.status === "Draft");

      // 3. Channel Filter
      const matchesChannel = channelFilter === "all" || project.channel === channelFilter;

      return matchesSearch && matchesStatus && matchesChannel;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.title.localeCompare(b.title);
        case "name_desc":
          return b.title.localeCompare(a.title);
        case "progress_asc":
          return a.progress - b.progress;
        case "progress_desc":
          return b.progress - a.progress;
        case "last_edited_asc":
          return a.lastEdited.localeCompare(b.lastEdited);
        case "last_edited_desc":
        default:
          return 0;
      }
    });

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProjects = filteredAndSortedProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Loading state
  if (fetcher.state === "loading" && !fetcher.data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-12 p-8 h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="space-y-1 shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* 1. Project Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96 flex gap-2">
          {/* Search Scope Selector (Title/Labels) - Channel moved to filter */}
          <Select value={searchScope} onValueChange={setSearchScope}>
            <SelectTrigger className="w-27.5 shrink-0">
              <SelectValue placeholder="Target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="labels">Labels</SelectItem>
            </SelectContent>
          </Select>

          {/* Search Input */}
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search by ${searchScope}...`}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Channel Selection */}
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-35">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              {uniqueChannels.map(channel => (
                <SelectItem key={channel} value={channel}>{channel}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Selection */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-35">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            Search
          </Button>
        </div>
      </div>

      {/* 2. Recent Projects (Carousel) */}
      {!searchTerm && statusFilter === "all" && channelFilter === "all" && recentProjects.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            Recent Projects
          </h3>
          <div className="flex items-center justify-center">
            <Carousel
              className="w-full max-w-full"
              opts={{ align: "start", loop: true }}
              plugins={[
                AutoScroll({
                  speed: 1,
                  stopOnInteraction: false,
                  stopOnMouseEnter: true,
                }),
              ]}
            >
              <CarouselContent className="-ml-4">
                {recentProjects.map((project) => (
                  <CarouselItem key={project.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <ProjectCard project={project} primaryLabel={primaryLabel} primarySegment={primarySegment} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      )}

      {/* 3. All Projects (Grid + Pagination) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            All Projects
          </h3>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_edited_desc">Newest First</SelectItem>
              <SelectItem value="last_edited_asc">Oldest First</SelectItem>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              <SelectItem value="progress_desc">Highest Progress</SelectItem>
              <SelectItem value="progress_asc">Lowest Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paginatedProjects.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} primaryLabel={primaryLabel} primarySegment={primarySegment} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === page}
                          onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                        aria-disabled={currentPage === totalPages}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            <div className="mx-auto flex max-w-105 flex-col items-center justify-center text-center">
              <Clapperboard className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">No projects found</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Try adjusting filters or search terms.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Extracted Project Card Component for Reusability
function ProjectCard({ project, primaryLabel, primarySegment }: { project: StudioProject, primaryLabel: string, primarySegment: string }) {
  return (
    <Card className="hover:border-primary/50 transition-colors flex flex-col group h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex justify-between items-start text-xl gap-2 w-full min-w-0">
          <span className="truncate flex-1 block" title={project.title}>{project.title}</span>
          <Badge variant={project.status === "Completed" ? "default" : "secondary"} className="shrink-0">
            {project.status}
          </Badge>
        </CardTitle>
        <CardDescription className="flex flex-col gap-1 mt-1">
          <span>{project.channel}</span>
          <span>Last edited {project.lastEdited}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4 flex-1 flex flex-col gap-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2.5" />
        </div>

        {/* Labels Display */}
        {project.labels && project.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.labels.map((label: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs px-1.5 py-0 font-normal text-muted-foreground">
                {label}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-3 mt-auto">
          <p className="text-sm text-muted-foreground font-medium">Quick Access</p>
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              {QUICK_ACCESS_STEPS.map((step) => (
                <Tooltip key={step.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground hover:text-foreground"
                      asChild
                    >
                      <Link to={`/studio/${step.id}/${project.id}`}>
                        <step.icon className="h-5 w-5" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{step.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 mt-auto">
        <Button className="w-full" asChild>
          <Link to={`/studio/${primarySegment}/${project.id}`}>
            {primaryLabel} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
