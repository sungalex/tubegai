import { useState } from "react";
import { Link } from "react-router";
import {
  Bookmark,
  Trash2,
  ExternalLink,
  Target,
  Eye,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
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
import { formatDistanceToNow } from "date-fns";
import type { SavedIdea } from "~/common/types/ideation.types";

interface SavedIdeasSectionProps {
  ideas: SavedIdea[];
  onDelete?: (ideaId: string) => void;
}

export function SavedIdeasSection({ ideas, onDelete }: SavedIdeasSectionProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDelete = async (ideaId: string) => {
    setDeletingIds((prev) => new Set([...prev, ideaId]));

    try {
      const response = await fetch("/api/saved-ideas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error("Failed to delete idea", { description: data.error });
        return;
      }

      toast.success("Idea deleted");
      onDelete?.(ideaId);
    } catch (error) {
      toast.error("Failed to delete idea");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(ideaId);
        return next;
      });
    }
  };

  const getDifficultyColor = (difficulty: SavedIdea["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "hard":
        return "bg-red-500/10 text-red-500 border-red-500/20";
    }
  };

  if (ideas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Lightbulb className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No saved ideas yet</h3>
        <p className="text-muted-foreground text-sm max-w-md mb-4">
          Browse the Trends tab and use the AI Idea Generator to create and save
          content ideas for later.
        </p>
        <Button variant="outline" asChild>
          <Link to="/projects">
            <ExternalLink className="h-4 w-4 mr-2" />
            Explore Trends
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Saved Ideas
          </h3>
          <p className="text-sm text-muted-foreground">
            {ideas.length} idea{ideas.length !== 1 ? "s" : ""} saved
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ideas.map((idea) => (
          <Card
            key={idea.id}
            className={idea.isUsed ? "opacity-60" : ""}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-semibold line-clamp-2">
                    {idea.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    From: {idea.basedOnTrend}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {idea.isUsed && (
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-500 border-green-500/20 text-xs"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Used
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={getDifficultyColor(idea.difficulty)}
                  >
                    {idea.difficulty}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {idea.description}
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 text-muted-foreground" />
                  <span className="text-green-500 font-medium">
                    {idea.estimatedViews}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground truncate max-w-32">
                    {idea.targetAudience}
                  </span>
                </div>
              </div>

              {/* Hooks Preview */}
              {idea.hooks.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Hook: </span>
                  <span className="line-clamp-1">{idea.hooks[0]}</span>
                </div>
              )}

              {/* Saved Time */}
              <div className="text-xs text-muted-foreground">
                Saved{" "}
                {formatDistanceToNow(new Date(idea.createdAt), {
                  addSuffix: true,
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={idea.isUsed}
                  asChild
                >
                  <Link
                    to="/projects/new"
                    state={{ topic: idea.title, hooks: idea.hooks }}
                  >
                    Use Idea
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={deletingIds.has(idea.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete saved idea?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{idea.title}" from your
                        saved ideas. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(idea.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
