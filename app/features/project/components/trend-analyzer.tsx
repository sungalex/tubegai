import { useState } from "react";
import { TrendingUp, Search, Zap, PlayCircle, Filter, Sparkles } from "lucide-react";
import { Link } from "react-router";
import AutoScroll from "embla-carousel-auto-scroll";
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
import type { TrendItem, AIRecommendation } from "~/common/types/project.types";
import { IdeaGeneratorDialog } from "./idea-generator-dialog";
import { useTranslation } from "~/i18n/context";

interface TrendAnalyzerProps {
  trends: TrendItem[];
  recommendations: AIRecommendation[];
}

export function TrendAnalyzer({ trends, recommendations }: TrendAnalyzerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);
  const [isIdeaDialogOpen, setIsIdeaDialogOpen] = useState(false);
  const { t } = useTranslation("project");
  const { t: tc } = useTranslation("common");

  // Get unique categories from trends
  const availableCategories = [...new Set(trends.map((t) => t.category))];

  // Filter trends by search term and selected categories
  const filteredTrends = trends.filter((trend) => {
    const matchesSearch =
      trend.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trend.tags.some((tag) =>
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

  return (
    <div className="space-y-8">
      {/* AI Recommendations Section */}
      <section className="bg-linear-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-200/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/20 gap-1 px-3 py-1">
            <Zap className="h-3.5 w-3.5" fill="currentColor" />
            {t("trends.aiRecommended")}
          </Badge>
          <h3 className="text-lg font-semibold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {t("trends.topPicks")}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((item, idx) => (
            <Card key={idx} className="bg-background/60 border-purple-500/10 hover:border-purple-500/30 transition-all cursor-pointer group hover:shadow-md hover:shadow-purple-500/5">
              <CardContent className="p-4 flex flex-col h-full justify-between gap-4">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-purple-200/10">
                      {item.reason}
                    </Badge>
                    <span className="text-xs font-bold text-green-400 flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" /> {item.growth}
                    </span>
                  </div>
                  <h4 className="font-medium group-hover:text-purple-400 transition-colors">{item.title}</h4>
                </div>
                <div className="flex gap-2 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-background/80 hover:bg-background"
                    onClick={() => handleGenerateIdeasFromRecommendation(item)}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Ideas
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                    asChild
                  >
                    <Link to="/projects/new" state={{ topic: item.title }}>Use</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center pt-2">
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
                      <div className="relative aspect-video w-full overflow-hidden shrink-0">
                        <img
                          src={trend.thumbnail}
                          alt={trend.title}
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                          <Button
                            size="sm"
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                            asChild
                          >
                            <Link to="/projects/new" state={{ topic: trend.title }}>
                              {t("trends.useTheme")}
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full"
                            onClick={() => handleGenerateIdeas(trend)}
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            {t("trends.generateIdeas")}
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

      {/* Idea Generator Dialog */}
      {selectedTrend && (
        <IdeaGeneratorDialog
          open={isIdeaDialogOpen}
          onOpenChange={setIsIdeaDialogOpen}
          trend={selectedTrend}
        />
      )}
    </div>
  );
}
