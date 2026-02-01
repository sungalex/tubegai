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
  Settings2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "~/i18n/context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/common/components/ui/dialog";
import { Button } from "~/common/components/ui/button";
import { Badge } from "~/common/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import { ScrollArea } from "~/common/components/ui/scroll-area";
import { Label } from "~/common/components/ui/label";
import { Textarea } from "~/common/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/common/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/common/components/ui/collapsible";
import { Slider } from "~/common/components/ui/slider";
import type { TrendItem } from "~/common/types/project.types";
import type {
  GeneratedIdea,
  IdeationOptions,
  SavedIdea,
} from "~/common/types/ideation.types";
import {
  CONTENT_TONES,
  VIDEO_TYPES,
  TARGET_AUDIENCE_TYPES,
  IDEATION_LANGUAGES,
  DEFAULT_IDEATION_OPTIONS,
} from "~/common/types/ideation.types";

interface IdeaGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trend: TrendItem;
  onSaveIdea?: (idea: SavedIdea) => void;
}

export function IdeaGeneratorDialog({
  open,
  onOpenChange,
  trend,
  onSaveIdea,
}: IdeaGeneratorDialogProps) {
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedIdeaIds, setSavedIdeaIds] = useState<Set<string>>(new Set());
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<IdeationOptions>(
    DEFAULT_IDEATION_OPTIONS,
  );
  const { t } = useTranslation("project");

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
          options,
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

      // Notify parent component of saved idea
      if (data.idea && onSaveIdea) {
        onSaveIdea(data.idea);
      }

      toast.success("Idea saved!", {
        description: "View it in your Saved Ideas tab",
      });
    } catch (error) {
      toast.error("Failed to save idea");
    }
  };

  const saveAllIdeas = async () => {
    const unsavedIdeas = ideas.filter((idea) => !savedIdeaIds.has(idea.id));
    if (unsavedIdeas.length === 0) {
      toast.info("All ideas already saved");
      return;
    }

    let savedCount = 0;
    for (const idea of unsavedIdeas) {
      try {
        const response = await fetch("/api/saved-ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea }),
        });

        const data = await response.json();
        if (!data.error) {
          setSavedIdeaIds((prev) => new Set([...prev, idea.id]));
          // Notify parent component of saved idea
          if (data.idea && onSaveIdea) {
            onSaveIdea(data.idea);
          }
          savedCount++;
        }
      } catch (error) {
        // Continue with other ideas
      }
    }

    if (savedCount > 0) {
      toast.success(`${savedCount} ideas saved!`, {
        description: "View them in your Saved Ideas tab",
      });
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

  const updateOption = <K extends keyof IdeationOptions>(
    key: K,
    value: IdeationOptions[K],
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {t("ideaGenerator.title")}
          </DialogTitle>
          <DialogDescription>
            {t("ideaGenerator.basedOn")} <strong>{trend.title}</strong>
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

          {/* Options Section */}
          <Collapsible open={showOptions} onOpenChange={setShowOptions}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-muted-foreground hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  {t("ideaGenerator.adjustOptions")}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showOptions ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="grid gap-4 p-4 border rounded-lg bg-muted/30">
                {/* Language */}
                <div className="grid gap-2">
                  <Label htmlFor="language">
                    {t("ideaGenerator.language")}
                  </Label>
                  <Select
                    value={options.language}
                    onValueChange={(value) =>
                      updateOption(
                        "language",
                        value as IdeationOptions["language"],
                      )
                    }
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {IDEATION_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          <div className="flex items-center gap-2">
                            <span>{lang.label}</span>
                            <span className="text-xs text-muted-foreground">
                              ({lang.description})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Content Tone */}
                <div className="grid gap-2">
                  <Label htmlFor="content-tone">
                    {t("ideaGenerator.contentTone")}
                  </Label>
                  <Select
                    value={options.contentTone}
                    onValueChange={(value) =>
                      updateOption(
                        "contentTone",
                        value as IdeationOptions["contentTone"],
                      )
                    }
                  >
                    <SelectTrigger id="content-tone">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TONES.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          <div className="flex flex-col">
                            <span>{tone.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {tone.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Video Type */}
                <div className="grid gap-2">
                  <Label htmlFor="video-type">
                    {t("ideaGenerator.videoLength")}
                  </Label>
                  <Select
                    value={options.videoType}
                    onValueChange={(value) =>
                      updateOption(
                        "videoType",
                        value as IdeationOptions["videoType"],
                      )
                    }
                  >
                    <SelectTrigger id="video-type">
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      {VIDEO_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span>{type.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {type.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Audience */}
                <div className="grid gap-2">
                  <Label htmlFor="target-audience">
                    {t("ideaGenerator.targetAudience")}
                  </Label>
                  <Select
                    value={options.targetAudienceType}
                    onValueChange={(value) =>
                      updateOption(
                        "targetAudienceType",
                        value as IdeationOptions["targetAudienceType"],
                      )
                    }
                  >
                    <SelectTrigger id="target-audience">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_AUDIENCE_TYPES.map((audience) => (
                        <SelectItem key={audience.value} value={audience.value}>
                          <div className="flex flex-col">
                            <span>{audience.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {audience.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Number of Ideas */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>{t("ideaGenerator.ideaCount")}</Label>
                    <span className="text-sm text-muted-foreground">
                      {options.ideaCount}
                    </span>
                  </div>
                  <Slider
                    value={[options.ideaCount]}
                    onValueChange={([value]) =>
                      updateOption("ideaCount", value)
                    }
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Custom Prompt */}
                <div className="grid gap-2">
                  <Label htmlFor="custom-prompt">
                    {t("ideaGenerator.customFocus")}
                  </Label>
                  <Textarea
                    id="custom-prompt"
                    placeholder={t("ideaGenerator.customFocusPlaceholder")}
                    value={options.customPrompt || ""}
                    onChange={(e) =>
                      updateOption("customPrompt", e.target.value)
                    }
                    className="h-20 resize-none"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Generate Button */}
          {ideas.length === 0 && !isLoading && (
            <Button
              onClick={generateIdeas}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {t("ideaGenerator.generate")}
            </Button>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-purple-500" />
              <p className="text-sm">{t("ideaGenerator.generating")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {
                  IDEATION_LANGUAGES.find((l) => l.value === options.language)
                    ?.label
                }{" "}
                •
                {
                  CONTENT_TONES.find((t) => t.value === options.contentTone)
                    ?.label
                }{" "}
                •{VIDEO_TYPES.find((t) => t.value === options.videoType)?.label}
              </p>
            </div>
          )}

          {/* Ideas List */}
          {ideas.length > 0 && (
            <>
              {/* Bulk Actions */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("ideaGenerator.ideasGenerated", { count: ideas.length })}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={saveAllIdeas}
                  disabled={ideas.every((idea) => savedIdeaIds.has(idea.id))}
                >
                  <Bookmark className="h-3 w-3 mr-1" />
                  {t("ideaGenerator.saveAll")}
                </Button>
              </div>

              <ScrollArea className="h-87.5 pr-4">
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
                            {t("ideaGenerator.hookIdeas")}
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
                            <span className="text-muted-foreground">
                              {t("ideaGenerator.audience")}
                            </span>
                            <span>{idea.targetAudience}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {t("ideaGenerator.estViews")}
                            </span>
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
                                {t("ideaGenerator.saved")}
                              </>
                            ) : (
                              <>
                                <Bookmark className="h-3 w-3 mr-1" />
                                {t("ideaGenerator.saveIdea")}
                              </>
                            )}
                          </Button>
                          <Button size="sm" asChild>
                            <Link
                              to="/projects/new"
                              state={{ topic: idea.title, hooks: idea.hooks }}
                            >
                              {t("ideaGenerator.useIdea")}
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Regenerate Button */}
          {ideas.length > 0 && !isLoading && (
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowOptions(true)}>
                <Settings2 className="h-3 w-3 mr-1" />
                {t("ideaGenerator.adjustOptions")}
              </Button>
              <Button variant="ghost" onClick={generateIdeas}>
                <Sparkles className="h-3 w-3 mr-1" />
                {t("ideaGenerator.regenerate")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
