import { Card, CardContent } from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Button } from "~/common/components/ui/button";
import { Link } from "react-router";
import {
  Clock,
  Play,
  Edit2,
  Info,
  Eye,
  Video,
  Gauge,
  Target,
  TrendingUp,
} from "lucide-react";
import type { Project } from "~/common/types/project.types";
import { cn } from "~/lib/utils";

interface ProjectCardProps {
  project: Project;
}

const STATUS_STYLES: Record<string, string> = {
  초안: "bg-muted text-muted-foreground",
  진행중: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  완료: "bg-green-500/10 text-green-600 border-green-500/20",
  보관: "bg-muted text-muted-foreground",
};

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  easy: {
    label: "쉬움",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  medium: {
    label: "보통",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  hard: {
    label: "어려움",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
  },
};

const LENGTH_LABELS: Record<string, string> = {
  short: "숏폼",
  medium: "중간",
  long: "롱폼",
};

export function ProjectCard({ project }: ProjectCardProps) {
  const difficultyInfo = project.difficulty
    ? DIFFICULTY_LABELS[project.difficulty]
    : undefined;
  const toneLabel = project.contentTone || undefined;
  const lengthLabel = project.videoLength
    ? LENGTH_LABELS[project.videoLength] || project.videoLength
    : undefined;
  const typeLabel =
    project.type === "short"
      ? "Shorts"
      : project.type === "long"
        ? "일반 영상"
        : undefined;

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-col">
      {/* Top: Thumbnail (compact) + Status */}
      <div className="flex gap-2.5 p-2.5 pb-0">
        <div className="relative w-24 h-16 shrink-0 rounded-md overflow-hidden bg-muted">
          {project.thumbnail ? (
            <img
              src={project.thumbnail}
              alt={project.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-secondary/30">
              <Play className="w-6 h-6 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3
              className="text-sm font-semibold line-clamp-2 leading-tight"
              title={project.title}
            >
              {project.title}
            </h3>
            <Badge
              variant="outline"
              className={cn(
                "text-xs h-5 px-1.5 shrink-0",
                STATUS_STYLES[project.status] || "bg-background/80",
              )}
            >
              {project.status}
            </Badge>
          </div>
          {project.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {project.description}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <CardContent className="px-2.5 pt-1.5 pb-2.5 flex flex-col gap-1.5 flex-1">
        {/* Metadata Badges: type, tone, difficulty */}
        <div className="flex flex-wrap gap-1">
          {project.category && (
            <Badge variant="outline" className="text-xs h-5 px-1.5">
              {project.category}
            </Badge>
          )}
          {(typeLabel || lengthLabel) && (
            <Badge variant="outline" className="text-xs h-5 px-1.5 gap-0.5">
              <Video className="h-3 w-3" />
              {typeLabel}
              {typeLabel && lengthLabel ? " · " : ""}
              {lengthLabel}
            </Badge>
          )}
          {toneLabel && (
            <Badge variant="outline" className="text-xs h-5 px-1.5">
              {toneLabel}
            </Badge>
          )}
          {difficultyInfo && (
            <Badge
              variant="outline"
              className={cn("text-xs h-5 px-1.5", difficultyInfo.color)}
            >
              <Gauge className="h-3 w-3 mr-0.5" />
              {difficultyInfo.label}
            </Badge>
          )}
        </div>

        {/* Stats: views, audience, trend */}
        <div className="space-y-0.5 text-xs">
          {project.estimatedViews && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-3 w-3 shrink-0" />
              <span className="text-green-600 font-medium">
                {project.estimatedViews}
              </span>
            </div>
          )}
          {project.basedOnTrend && (
            <div className="flex items-start gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{project.basedOnTrend}</span>
            </div>
          )}
          {project.targetAudience && (
            <div className="flex items-start gap-1 text-muted-foreground">
              <Target className="h-3 w-3 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{project.targetAudience}</span>
            </div>
          )}
        </div>

        {/* Progress + Timestamp */}
        <div className="mt-auto">
          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">
              {project.progress}%
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {project.lastModified}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Hover Actions Overlay - slides up from bottom */}
      <div className="absolute inset-0 flex items-end translate-y-full group-hover:translate-y-0 transition-transform duration-200 pointer-events-none">
        <div className="w-full p-2.5 pt-8 bg-linear-to-t from-card from-70% to-transparent pointer-events-auto">
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              className="flex-1 text-xs h-8 px-2 bg-card"
            >
              <Link to={`/projects/${project.id}`}>
                <Info className="w-3.5 h-3.5 mr-1" />
                프로젝트 상세정보
              </Link>
            </Button>
            <Button asChild className="flex-1 text-xs h-8 px-2">
              <Link to={`/studio/script/${project.id}`}>
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                스튜디오
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
