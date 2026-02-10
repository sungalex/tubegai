import { useState } from "react";
import { TrendingUp, Search, Zap, PlayCircle, Filter, Sparkles, Plus, Bookmark, RefreshCw, ExternalLink, Lightbulb, Loader2, Eye, Target } from "lucide-react";
import { useNavigate } from "react-router";
import AutoScroll from "embla-carousel-auto-scroll";
import { toast } from "sonner";
import { Input } from "~/common/components/ui/input";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent } from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Checkbox } from "~/common/components/ui/checkbox";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "~/common/components/ui/carousel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/common/components/ui/popover";
import { Label } from "~/common/components/ui/label";
import type { TrendItem, AIRecommendation, Channel } from "~/common/types/project.types";
import type { Idea } from "~/common/types/ideation.types";
import { getPrimaryTrend } from "~/common/types/ideation.types";
import { IdeaGeneratorDialog } from "./idea-generator-dialog";
import { AIProjectGeneratorDialog } from "./ai-project-generator-dialog";
import { useTranslation } from "~/i18n/context";

interface TrendAnalyzerProps {
  trends: TrendItem[];
  savedIdeas: Idea[];
  channels?: Channel[];
  onSaveIdea?: (idea: Idea) => void;
  onUpdateSavedIdeas?: (newSavedIdeas: Idea[]) => void;
  isLoading?: boolean;
}

export function TrendAnalyzer({ trends, savedIdeas, channels = [], onSaveIdea, onUpdateSavedIdeas, isLoading = false }: TrendAnalyzerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);
  const [isIdeaDialogOpen, setIsIdeaDialogOpen] = useState(false);
  const [isAIProjectDialogOpen, setIsAIProjectDialogOpen] = useState(false);
  const [selectedTrendForAI, setSelectedTrendForAI] = useState<TrendItem | null>(null);
  const [usingIdeaIdx, setUsingIdeaIdx] = useState<number | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation("project");
  const { t: tc } = useTranslation("common");

  // Get unique categories from trends
  const availableCategories = [...new Set(trends.map((t) => t.category))];

  // Filter trends by search term and selected categories
  const filteredTrends = trends.filter((trend) => {
    const trendTags = trend.tags ?? [];
    const matchesSearch =
      searchTerm === "" ||
      trend.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trendTags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(trend.category);

    return matchesSearch && matchesCategory;
  });

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
  };

  const handleGenerateIdeas = (trend: TrendItem) => {
    setSelectedTrend(trend);
    setIsIdeaDialogOpen(true);
  };

  // 단일 트렌드 기반 AI 아이디어 즉시 생성
  const handleGenerateIdeasFromTrend = async (trend: TrendItem) => {
    if (!trend.trendUuid) {
      toast.error("트렌드 ID가 없습니다", {
        description: "트렌드 데이터를 다시 가져와주세요.",
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "refresh",
          language: "ko",
          trendIds: [trend.trendUuid],
        }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error("AI 아이디어 생성 실패", { description: data.error });
        return;
      }

      if (data.ideas) {
        const recommendations = data.ideas.map((idea: { id: string; title: string; reason?: string; growthRate?: string; description?: string; hooks?: string[]; targetAudience?: string; estimatedViews?: string }) => ({
          id: idea.id,
          title: idea.title,
          reason: idea.reason || `${trend.title} 기반`,
          growth: idea.growthRate || trend.growth,
          description: idea.description,
          hooks: idea.hooks,
          targetAudience: idea.targetAudience,
          estimatedViews: idea.estimatedViews,
        }));
        setAiRecommendations(recommendations);
        toast.success(`"${trend.title}" 기반 아이디어가 생성되었습니다!`);
      }
    } catch (error) {
      toast.error("AI 아이디어 생성 실패");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleOpenAIProjectGenerator = (trend: TrendItem) => {
    setSelectedTrendForAI(trend);
    setIsAIProjectDialogOpen(true);
  };

  const handleAIProjectCreated = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  // Convert AI recommendation to TrendItem for idea generation
  const handleGenerateIdeasFromRecommendation = (recommendation: AIRecommendation) => {
    const mockTrend: TrendItem = {
      id: Date.now(),
      title: recommendation.title,
      category: recommendation.reason,
      views: "N/A",
      growth: recommendation.growth,
      thumbnail: "",
      tags: [],
    };
    setSelectedTrend(mockTrend);
    setIsIdeaDialogOpen(true);
  };

  // Handle opening YouTube video in new tab
  const handleOpenVideo = (trend: TrendItem) => {
    if (trend.videoUrl) {
      window.open(trend.videoUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Save recommendation as idea to Supabase
  const handleSaveRecommendation = async (recommendation: AIRecommendation) => {
    try {
      // If the recommendation has an ID, use the save intent to mark it as saved
      if (recommendation.id) {
        const response = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent: "save", ideaId: recommendation.id }),
        });

        const data = await response.json();

        if (data.error) {
          toast.error("아이디어 저장 실패", { description: data.error });
          return;
        }

        // Update local state to reflect saved status
        setAiRecommendations((prev) =>
          prev.filter((rec) => rec.id !== recommendation.id)
        );

        // Notify parent component of saved idea
        if (data.idea && onSaveIdea) {
          onSaveIdea(data.idea);
        }

        toast.success("아이디어가 저장되었습니다!", {
          description: "저장된 아이디어 탭에서 확인하세요.",
        });
      } else {
        // Fallback for recommendations without ID - create new idea
        const idea = {
          title: recommendation.title,
          description: recommendation.description || `AI 추천 아이디어: ${recommendation.reason}`,
          hooks: recommendation.hooks || [`${recommendation.title}에 대한 흥미로운 시작`],
          targetAudience: recommendation.targetAudience || "일반 시청자",
          estimatedViews: recommendation.estimatedViews || "10K-50K",
          difficulty: "medium" as const,
          source: "user_created" as const,
          // Note: trendIds not available for fallback recommendations
        };

        const response = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent: "create", idea }),
        });

        const data = await response.json();

        if (data.error) {
          toast.error("아이디어 저장 실패", { description: data.error });
          return;
        }

        if (data.idea && onSaveIdea) {
          onSaveIdea(data.idea);
        }

        toast.success("아이디어가 저장되었습니다!", {
          description: "저장된 아이디어 탭에서 확인하세요.",
        });
      }
    } catch (error) {
      toast.error("아이디어 저장 실패");
    }
  };

  // Open idea generator without a specific trend (for new idea creation)
  const handleOpenIdeaGenerator = () => {
    const defaultTrend: TrendItem = {
      id: Date.now(),
      title: "새 아이디어",
      category: "일반",
      views: "N/A",
      growth: "N/A",
      thumbnail: "",
      tags: [],
    };
    setSelectedTrend(defaultTrend);
    setIsIdeaDialogOpen(true);
  };

  // Generate AI recommendations (lazy loading) - passes only trend IDs
  const handleGenerateAIRecommendations = async () => {
    if (trends.length === 0) {
      toast.error("트렌드 데이터가 없습니다", { description: "먼저 YouTube에서 트렌드를 가져와주세요." });
      return;
    }

    // Extract trendUuids from loaded trends (only those with valid UUIDs)
    const trendIds = trends
      .slice(0, 10)
      .filter((t) => t.trendUuid)
      .map((t) => t.trendUuid as string);

    if (trendIds.length === 0) {
      toast.error("트렌드 ID가 없습니다", { description: "트렌드 데이터를 다시 가져와주세요." });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "refresh",
          language: "ko",
          trendIds,
        }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error("AI 추천 생성 실패", { description: data.error });
        return;
      }

      if (data.ideas) {
        // Convert Idea type to AIRecommendation format for compatibility
        const recommendations = data.ideas.map((idea: { id: string; title: string; reason?: string; growthRate?: string; description?: string; hooks?: string[]; targetAudience?: string; estimatedViews?: string }) => ({
          id: idea.id,
          title: idea.title,
          reason: idea.reason || "AI 추천",
          growth: idea.growthRate || "+50%",
          description: idea.description,
          hooks: idea.hooks,
          targetAudience: idea.targetAudience,
          estimatedViews: idea.estimatedViews,
        }));
        setAiRecommendations(recommendations);
        toast.success("AI 추천이 생성되었습니다!");
      }
    } catch (error) {
      toast.error("AI 추천 생성 실패");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Use saved idea - navigate to new project page
  const handleUseSavedIdea = async (idea: Idea, idx: number) => {
    setUsingIdeaIdx(idx);
    try {
      navigate("/projects/new", {
        state: {
          idea,
          topic: idea.title,
          hooks: idea.hooks,
          targetAudience: idea.targetAudience,
          estimatedViews: idea.estimatedViews,
          description: idea.description,
        }
      });
    } finally {
      setUsingIdeaIdx(null);
    }
  };

  // Use AI recommendation - save and navigate to new project page
  const handleUseAIRecommendation = async (recommendation: AIRecommendation) => {
    try {
      let savedIdea;

      // If the recommendation has an ID, use the save intent
      if (recommendation.id) {
        const response = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent: "save", ideaId: recommendation.id }),
        });

        const data = await response.json();

        if (data.error) {
          toast.error("아이디어 저장 실패", { description: data.error });
          return;
        }

        savedIdea = data.idea;

        // Update local state to reflect saved status
        setAiRecommendations((prev) =>
          prev.filter((rec) => rec.id !== recommendation.id)
        );
      } else {
        // Fallback for recommendations without ID - create new idea
        const idea = {
          title: recommendation.title,
          description: recommendation.description || `AI 추천 아이디어: ${recommendation.reason}`,
          hooks: recommendation.hooks || [`${recommendation.title}에 대한 흥미로운 시작`],
          targetAudience: recommendation.targetAudience || "일반 시청자",
          estimatedViews: recommendation.estimatedViews || "10K-50K",
          difficulty: "medium" as const,
          source: "user_created" as const,
          // Note: trendIds not available for fallback recommendations
        };

        const response = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent: "create", idea }),
        });

        const data = await response.json();

        if (data.error) {
          toast.error("아이디어 저장 실패", { description: data.error });
          return;
        }

        savedIdea = data.idea;
      }

      if (savedIdea && onSaveIdea) {
        onSaveIdea(savedIdea);
      }

      toast.success("아이디어가 저장되었습니다!");
      navigate("/projects/new", {
        state: {
          idea: savedIdea,
          topic: recommendation.title,
          hooks: recommendation.hooks,
          targetAudience: recommendation.targetAudience,
          estimatedViews: recommendation.estimatedViews,
          description: recommendation.description,
        }
      });
    } catch (error) {
      toast.error("아이디어 저장 실패");
    }
  };

  return (
    <div className="space-y-8">
      {/* Real-time Trends Section - Now on TOP */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-500" />
            {t("trends.title")}
          </h3>
          <p className="text-muted-foreground text-sm">
            {t("trends.subtitle")}
          </p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative w-full md:w-75">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("trends.searchPlaceholder")}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={selectedCategories.length > 0 ? "border-primary text-primary" : ""}
              >
                <Filter className="h-4 w-4" />
                {selectedCategories.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {selectedCategories.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{t("trends.filterByCategory")}</h4>
                  {selectedCategories.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {tc("button.clearAll")}
                    </Button>
                  )}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableCategories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                      />
                      <Label
                        htmlFor={`category-${category}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {category}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {trends.filter((t) => t.category === category).length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="w-full">
        <Carousel
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
            skipSnaps: true,
          }}
          plugins={[
            AutoScroll({
              speed: 1,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
              playOnInit: true,
            }),
          ]}
          className="w-full cursor-grab active:cursor-grabbing"
        >
          <CarouselContent>
            {filteredTrends.map((trend) => (
              <CarouselItem key={trend.id} className="basis-full md:basis-1/2 lg:basis-1/4">
                <div className="p-1">
                  <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-none bg-secondary/20 h-full">
                    <CardContent className="p-0 h-full flex flex-col">
                      <div
                        className="relative aspect-video w-full overflow-hidden shrink-0 cursor-pointer"
                        onClick={() => handleOpenVideo(trend)}
                      >
                        <img
                          src={trend.thumbnail}
                          alt={trend.title}
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                          {trend.videoUrl && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenVideo(trend);
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {t("trends.watchVideo")}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full"
                            disabled={isGeneratingAI}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateIdeasFromTrend(trend);
                            }}
                          >
                            {isGeneratingAI ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3 mr-1" />
                            )}
                            {t("trends.generateIdeas")}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAIProjectGenerator(trend);
                            }}
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI 프로젝트 생성
                          </Button>
                        </div>
                        <Badge className="absolute top-2 left-2 bg-black/60 hover:bg-black/70 backdrop-blur-sm text-white border-0">
                          {trend.category}
                        </Badge>
                        <div className="absolute bottom-2 right-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded font-bold flex items-center gap-1 shadow-sm">
                          <TrendingUp className="h-3 w-3" />
                          {trend.growth}
                        </div>
                      </div>
                      <div className="p-4 space-y-3 grow flex flex-col justify-between">
                        <h4 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                          {trend.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <PlayCircle className="h-3 w-3" /> {trend.views} views
                          </span>
                          <div className="flex gap-1">
                            {trend.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="bg-background px-1.5 py-0.5 rounded border">#{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Idea Hub Section - Now on BOTTOM */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            {t("trends.ideaHubTitle")}
          </h3>
          <p className="text-muted-foreground text-sm">{t("trends.ideaHubSubtitle")}</p>
        </div>

        {/* Saved Ideas Section */}
        <section className="bg-linear-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-200/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20 gap-1 px-3 py-1">
                <Bookmark className="h-3.5 w-3.5" fill="currentColor" />
                저장된 아이디어
              </Badge>
              <span className="text-sm text-muted-foreground">
                {savedIdeas.length}개
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="bg-background/80 hover:bg-background"
              onClick={handleOpenIdeaGenerator}
            >
              <Plus className="h-3 w-3 mr-1" />
              {t("trends.newIdea")}
            </Button>
          </div>

          {savedIdeas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">저장된 아이디어가 없습니다.</p>
              <p className="text-xs mt-1">트렌드에서 아이디어를 생성해보세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {savedIdeas.map((idea, idx) => (
                <Card key={idea.id} className="bg-background/60 border-yellow-500/10 hover:border-yellow-500/30 transition-all cursor-pointer group hover:shadow-md hover:shadow-yellow-500/5">
                  <CardContent className="p-4 flex flex-col h-full gap-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-yellow-200/10">
                        {idea.difficulty}
                      </Badge>
                      {getPrimaryTrend(idea)?.trend?.title && (
                        <span className="text-xs text-muted-foreground truncate max-w-20">
                          {getPrimaryTrend(idea)?.trend?.title}
                        </span>
                      )}
                    </div>

                    <h4 className="font-medium group-hover:text-yellow-600 transition-colors line-clamp-2">{idea.title}</h4>

                    {idea.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{idea.description}</p>
                    )}

                    {idea.hooks && idea.hooks.length > 0 && (
                      <div className="text-xs bg-yellow-500/5 rounded-md p-2 border border-yellow-500/10">
                        <span className="font-medium text-yellow-600">Hook: </span>
                        <span className="text-muted-foreground line-clamp-1">{idea.hooks[0]}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs">
                      {idea.targetAudience && (
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground truncate max-w-24">{idea.targetAudience}</span>
                        </div>
                      )}
                      {idea.estimatedViews && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          <span className="text-green-500 font-medium">{idea.estimatedViews}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-auto pt-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                        disabled={usingIdeaIdx === idx}
                        onClick={() => handleUseSavedIdea(idea, idx)}
                      >
                        {usingIdeaIdx === idx ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : null}
                        {t("trends.useIdea")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* AI Recommendations Section */}
        <section className="bg-linear-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-200/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/20 gap-1 px-3 py-1">
                <Zap className="h-3.5 w-3.5" fill="currentColor" />
                {t("trends.aiRecommended")}
              </Badge>
              <h3 className="text-lg font-semibold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t("trends.topPicks")}
              </h3>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="bg-background/80 hover:bg-background"
              onClick={handleGenerateAIRecommendations}
              disabled={isGeneratingAI}
            >
              {isGeneratingAI ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              {aiRecommendations.length > 0 ? "새로고침" : "AI 추천 생성"}
            </Button>
          </div>

          {aiRecommendations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">AI 추천을 생성해보세요.</p>
              <p className="text-xs mt-1">현재 트렌드를 분석하여 콘텐츠 아이디어를 추천합니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiRecommendations.map((item, idx) => (
                <Card key={idx} className="bg-background/60 border-purple-500/10 hover:border-purple-500/30 transition-all cursor-pointer group hover:shadow-md hover:shadow-purple-500/5">
                  <CardContent className="p-4 flex flex-col h-full gap-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-purple-200/10">
                        {item.reason}
                      </Badge>
                      <span className="text-xs font-bold text-green-400 flex items-center gap-0.5">
                        <TrendingUp className="h-3 w-3" /> {item.growth}
                      </span>
                    </div>

                    <h4 className="font-medium group-hover:text-purple-400 transition-colors line-clamp-2">{item.title}</h4>

                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    )}

                    {item.hooks && item.hooks.length > 0 && (
                      <div className="text-xs bg-purple-500/5 rounded-md p-2 border border-purple-500/10">
                        <span className="font-medium text-purple-400">Hook: </span>
                        <span className="text-muted-foreground line-clamp-1">{item.hooks[0]}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs">
                      {item.targetAudience && (
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground truncate max-w-24">{item.targetAudience}</span>
                        </div>
                      )}
                      {item.estimatedViews && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          <span className="text-green-500 font-medium">{item.estimatedViews}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-auto pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-background/80 hover:bg-background"
                        onClick={() => handleGenerateIdeasFromRecommendation(item)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {t("trends.regeneration")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-background/80 hover:bg-background"
                        onClick={() => handleSaveRecommendation(item)}
                      >
                        <Bookmark className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                        onClick={() => handleUseAIRecommendation(item)}
                      >
                        {t("trends.useIdea")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Idea Generator Dialog */}
      {selectedTrend && (
        <IdeaGeneratorDialog
          open={isIdeaDialogOpen}
          onOpenChange={setIsIdeaDialogOpen}
          trend={selectedTrend}
          onSaveIdea={onSaveIdea}
        />
      )}

      {/* AI Project Generator Dialog */}
      <AIProjectGeneratorDialog
        open={isAIProjectDialogOpen}
        onOpenChange={setIsAIProjectDialogOpen}
        trend={selectedTrendForAI}
        channels={channels}
        onProjectCreated={handleAIProjectCreated}
      />
    </div>
  );
}
