import { useState } from "react";
import { Link } from "react-router";
import {
  Sparkles,
  Bookmark,
  Loader2,
  Target,
  Eye,
  ChevronRight,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/common/components/ui/dialog";
import { Button } from "~/common/components/ui/button";
import { Badge } from "~/common/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { ScrollArea } from "~/common/components/ui/scroll-area";
import type { TrendItem } from "~/common/types/project.types";
import type { GeneratedIdea } from "~/common/types/ideation.types";

interface IdeaGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trend: TrendItem;
}

export function IdeaGeneratorDialog({
  open,
  onOpenChange,
  trend,
}: IdeaGeneratorDialogProps) {
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedIdeaIds, setSavedIdeaIds] = useState<Set<string>>(new Set());

  const generateIdeas = async () => {
    setIsLoading(true);
    setIdeas([]);

    try {
      const response = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trendTitle: trend.title,
          trendCategory: trend.category,
          trendTags: trend.tags,
          trendId: trend.id,
        }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error("Failed to generate ideas", { description: data.error });
        return;
      }

      setIdeas(data.ideas);
      toast.success("Ideas generated!", {
        description: `${data.ideas.length} content ideas ready`,
      });
    } catch (error) {
      toast.error("Failed to generate ideas");
    } finally {
      setIsLoading(false);
    }
  };

  const saveIdea = async (idea: GeneratedIdea) => {
    try {
      const response = await fetch("/api/saved-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error("Failed to save idea", { description: data.error });
        return;
      }

      setSavedIdeaIds((prev) => new Set([...prev, idea.id]));
      toast.success("Idea saved!", {
        description: "View it in your Saved Ideas tab",
      });
    } catch (error) {
      toast.error("Failed to save idea");
    }
  };

  const getDifficultyColor = (difficulty: GeneratedIdea["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "hard":
        return "bg-red-500/10 text-red-500 border-red-500/20";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Idea Generator
          </DialogTitle>
          <DialogDescription>
            Generate content ideas based on: <strong>{trend.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trend Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{trend.category}</Badge>
            <span>•</span>
            <span>{trend.views} views</span>
            <span>•</span>
            <span className="text-green-500">{trend.growth}</span>
          </div>

          {/* Generate Button */}
          {ideas.length === 0 && !isLoading && (
            <Button
              onClick={generateIdeas}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Content Ideas
            </Button>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-purple-500" />
              <p className="text-sm">Analyzing trend and generating ideas...</p>
            </div>
          )}

          {/* Ideas List */}
          {ideas.length > 0 && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {ideas.map((idea) => (
                  <Card key={idea.id} className="group">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-base font-semibold">
                          {idea.title}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={getDifficultyColor(idea.difficulty)}
                        >
                          {idea.difficulty}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {idea.description}
                      </p>

                      {/* Hooks */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Hook Ideas:
                        </p>
                        <ul className="space-y-1">
                          {idea.hooks.map((hook, idx) => (
                            <li
                              key={idx}
                              className="text-sm flex items-start gap-2"
                            >
                              <ChevronRight className="h-3 w-3 mt-1 text-purple-500 shrink-0" />
                              <span>{hook}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Metrics */}
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Audience:</span>
                          <span>{idea.targetAudience}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Est. Views:</span>
                          <span className="text-green-500 font-medium">
                            {idea.estimatedViews}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => saveIdea(idea)}
                          disabled={savedIdeaIds.has(idea.id)}
                        >
                          {savedIdeaIds.has(idea.id) ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Saved
                            </>
                          ) : (
                            <>
                              <Bookmark className="h-3 w-3 mr-1" />
                              Save Idea
                            </>
                          )}
                        </Button>
                        <Button size="sm" asChild>
                          <Link
                            to="/projects/new"
                            state={{ topic: idea.title, hooks: idea.hooks }}
                          >
                            Use This Idea
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Regenerate Button */}
          {ideas.length > 0 && !isLoading && (
            <div className="flex justify-center pt-2">
              <Button variant="ghost" onClick={generateIdeas}>
                <Sparkles className="h-3 w-3 mr-1" />
                Generate More Ideas
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
