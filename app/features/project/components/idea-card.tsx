/**
 * Unified IdeaCard Component
 *
 * Displays both AI-generated and user-created ideas with appropriate
 * styling and actions based on the idea's source and saved state.
 */

import { Link } from "react-router";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "~/common/components/ui/button";
import { Badge } from "~/common/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
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
import { useTranslation } from "~/i18n/context";

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
  const { t } = useTranslation("project");
  const isAI = idea.source === "ai_generated";
  const isSaved = idea.isSaved;

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "hard":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleUse = () => {
    onUse?.(idea);
  };

  return (
    <Card
      className={cn(
        "group transition-all duration-200",
        idea.isUsed && "opacity-60",
        // AI unsaved: purple theme
        isAI && !isSaved && "border-purple-500/10 hover:border-purple-500/30 hover:shadow-purple-500/5",
        // Saved: yellow theme
        isSaved && "border-yellow-500/10 hover:border-yellow-500/30 hover:shadow-yellow-500/5"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold line-clamp-2">
              {idea.title}
            </CardTitle>
            <CardDescription className="text-xs">
              {idea.basedOnTrends?.[0] && `From: ${idea.basedOnTrends[0]}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Source Badge */}
            {isAI && !isSaved && (
              <Badge
                variant="outline"
                className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-xs"
              >
                <Zap className="h-3 w-3 mr-1" />
                AI
              </Badge>
            )}
            {isSaved && (
              <Badge
                variant="outline"
                className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs"
              >
                <BookmarkCheck className="h-3 w-3 mr-1" />
                저장됨
              </Badge>
            )}
            {/* Growth Badge (AI only) */}
            {isAI && idea.growthRate && (
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                {idea.growthRate}
              </Badge>
            )}
            {/* Used Badge */}
            {idea.isUsed && (
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-500 border-green-500/20 text-xs"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Used
              </Badge>
            )}
            {/* Difficulty Badge */}
            {idea.difficulty && (
              <Badge
                variant="outline"
                className={cn(getDifficultyColor(idea.difficulty), "text-xs")}
              >
                {idea.difficulty}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Reason (AI only) */}
        {isAI && idea.reason && (
          <Badge variant="outline" className="text-xs">
            {idea.reason}
          </Badge>
        )}

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {idea.description}
        </p>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-3 text-xs">
          {idea.estimatedViews && (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <span className="text-green-500 font-medium">
                {idea.estimatedViews}
              </span>
            </div>
          )}
          {idea.targetAudience && (
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground truncate max-w-32">
                {idea.targetAudience}
              </span>
            </div>
          )}
        </div>

        {/* Hooks Preview */}
        {idea.hooks && idea.hooks.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Hook: </span>
            <span className="line-clamp-1">{idea.hooks[0]}</span>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground">
          {isSaved ? "저장 " : "생성 "}
          {formatDistanceToNow(new Date(idea.createdAt), {
            addSuffix: true,
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {/* Use Button */}
          <Button
            size="sm"
            className={cn(
              "flex-1",
              isAI && !isSaved ? "bg-purple-500 hover:bg-purple-600" : "bg-yellow-500 hover:bg-yellow-600 text-black"
            )}
            disabled={idea.isUsed}
            onClick={handleUse}
          >
            사용하기
          </Button>

          {/* AI-specific actions */}
          {isAI && !isSaved && (
            <>
              {onRegenerate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRegenerate(idea)}
                  title="아이디어 재생성"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
              {onSave && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSave(idea.id)}
                  disabled={isSaving}
                  title="아이디어 저장"
                >
                  <Bookmark className="h-3 w-3" />
                </Button>
              )}
            </>
          )}

          {/* Saved idea actions */}
          {isSaved && (
            <>
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(idea)}
                  title="수정"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={isDeleting}
                      title="삭제"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>아이디어 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        "{idea.title}" 아이디어를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
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
      </CardContent>
    </Card>
  );
}
