/**
 * Unified IdeaCard Component
 *
 * Displays both AI-generated and user-created ideas with appropriate
 * styling and actions based on the idea's source and saved state.
 */

import {
  Bookmark,
  BookmarkCheck,
  Trash2,
  Target,
  Eye,
  CheckCircle2,
  Pencil,
  RefreshCw,
  Zap,
  TrendingUp,
  Star,
  Video,
  Gauge,
  Play,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "~/common/components/ui/button";
import { Badge } from "~/common/components/ui/badge";
import { Card, CardContent } from "~/common/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/common/components/ui/alert-dialog";
import { cn } from "~/lib/utils";
import type { Idea } from "~/common/types/ideation.types";
import { getPrimaryTrend } from "~/common/types/ideation.types";

export interface IdeaCardProps {
  idea: Idea;
  onSave?: (ideaId: string) => void;
  onUse?: (idea: Idea) => void;
  onEdit?: (idea: Idea) => void;
  onDelete?: (ideaId: string) => void;
  onRegenerate?: (idea: Idea) => void;
  isDeleting?: boolean;
  isSaving?: boolean;
}

const DIFFICULTY_INFO: Record<string, { label: string; color: string }> = {
  easy: { label: "쉬움", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  medium: { label: "보통", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  hard: { label: "어려움", color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

const VIDEO_TYPE_LABELS: Record<string, string> = {
  short: "숏폼",
  medium: "중간",
  long: "롱폼",
};

export function IdeaCard({
  idea,
  onSave,
  onUse,
  onEdit,
  onDelete,
  onRegenerate,
  isDeleting = false,
  isSaving = false,
}: IdeaCardProps) {
  const isAI = idea.source === "ai_generated";
  const isSaved = idea.isSaved;
  const primaryTrend = getPrimaryTrend(idea);
  const thumbnailUrl = primaryTrend?.trend?.thumbnailUrl;
  const difficultyInfo = idea.difficulty ? DIFFICULTY_INFO[idea.difficulty] : undefined;

  return (
    <Card
      className={cn(
        "relative group transition-all duration-200 flex flex-col overflow-hidden",
        idea.isUsed && "opacity-60",
        isAI && !isSaved && "border-purple-500/10 hover:border-purple-500/30 hover:shadow-purple-500/5",
        isSaved && "border-yellow-500/10 hover:border-yellow-500/30 hover:shadow-yellow-500/5",
      )}
    >
      {/* Top: Thumbnail (compact) + Title + Badges */}
      <div className="flex gap-2.5 p-2.5 pb-0">
        <div className="relative w-20 h-14 shrink-0 rounded-md overflow-hidden bg-muted">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={primaryTrend?.trend?.title || idea.title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-secondary/30">
              <Play className="w-5 h-5 text-muted-foreground/30" />
            </div>
          )}
          {/* Score overlay */}
          {idea.score != null && (
            <div className="absolute bottom-0.5 left-0.5">
              <Badge className="bg-background/80 backdrop-blur-sm text-xs h-4 px-1 gap-0.5">
                <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
                {idea.score}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-sm font-semibold line-clamp-2 leading-tight">
              {idea.title}
            </h3>
            <div className="flex items-center gap-0.5 shrink-0">
              {isAI && !isSaved && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-xs h-5 px-1">
                  <Zap className="h-3 w-3" />
                </Badge>
              )}
              {isSaved && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs h-5 px-1">
                  <BookmarkCheck className="h-3 w-3" />
                </Badge>
              )}
              {idea.isUsed && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs h-5 px-1">
                  <CheckCircle2 className="h-3 w-3" />
                </Badge>
              )}
            </div>
          </div>
          {primaryTrend?.trend?.title && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {primaryTrend.trend.title}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <CardContent className="px-2.5 pt-1.5 pb-2.5 flex flex-col gap-1.5 flex-1">
        {/* Description or Reason */}
        {isAI && idea.reason ? (
          <p className="text-xs text-muted-foreground line-clamp-1 italic">{idea.reason}</p>
        ) : idea.description ? (
          <p className="text-xs text-muted-foreground line-clamp-1">{idea.description}</p>
        ) : null}

        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-1">
          {idea.category && (
            <Badge variant="outline" className="text-xs h-5 px-1.5">
              {idea.category}
            </Badge>
          )}
          {difficultyInfo && (
            <Badge variant="outline" className={cn("text-xs h-5 px-1.5", difficultyInfo.color)}>
              <Gauge className="h-3 w-3 mr-0.5" />
              {difficultyInfo.label}
            </Badge>
          )}
          {idea.contentTones && idea.contentTones.length > 0 && (
            <Badge variant="outline" className="text-xs h-5 px-1.5">
              {idea.contentTones.slice(0, 2).join(", ")}
            </Badge>
          )}
          {idea.videoTypes && idea.videoTypes.length > 0 &&
            idea.videoTypes.slice(0, 1).map((vt) => (
              <Badge key={vt} variant="outline" className="text-xs h-5 px-1.5 gap-0.5">
                <Video className="h-3 w-3" />
                {VIDEO_TYPE_LABELS[vt] || vt}
              </Badge>
            ))
          }
          {isAI && idea.growthRate && (
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs h-5 px-1.5">
              <TrendingUp className="h-3 w-3 mr-0.5" />
              {idea.growthRate}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          {idea.estimatedViews && (
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span className="text-green-500 font-medium">{idea.estimatedViews}</span>
            </span>
          )}
          {idea.targetAudience && (
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <Target className="h-3 w-3" />
              <span className="truncate max-w-28">{idea.targetAudience}</span>
            </span>
          )}
        </div>

        {/* Hook */}
        {idea.hooks && idea.hooks.length > 0 && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            <span className="font-medium">Hook:</span> {idea.hooks[0]}
          </p>
        )}

        {/* Timestamp */}
        <div className="mt-auto text-xs text-muted-foreground">
          {isSaved ? "저장 " : "생성 "}
          {formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}
        </div>
      </CardContent>

      {/* Hover Actions Overlay */}
      <div className="absolute inset-0 flex items-end translate-y-full group-hover:translate-y-0 transition-transform duration-200 pointer-events-none">
        <div className="w-full p-2.5 pt-8 bg-linear-to-t from-card from-70% to-transparent pointer-events-auto">
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className={cn(
                "flex-1 h-8 text-xs",
                isAI && !isSaved ? "bg-purple-500 hover:bg-purple-600" : "bg-yellow-500 hover:bg-yellow-600 text-black",
              )}
              disabled={idea.isUsed}
              onClick={() => onUse?.(idea)}
            >
              사용하기
            </Button>
            {isAI && !isSaved && (
              <>
                {onRegenerate && (
                  <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => onRegenerate(idea)} title="재생성">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
                {onSave && (
                  <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => onSave(idea.id)} disabled={isSaving} title="저장">
                    <Bookmark className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}
            {isSaved && (
              <>
                {onEdit && (
                  <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => onEdit(idea)} title="수정">
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
                {onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 bg-card text-destructive hover:text-destructive" disabled={isDeleting} title="삭제">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>아이디어 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          &ldquo;{idea.title}&rdquo; 아이디어를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(idea.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
