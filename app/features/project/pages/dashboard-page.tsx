import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/dashboard-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/common/components/ui/dropdown-menu";
import {
  Edit2,
  FolderKanban,
  Target,
  Eye,
  Clock,
  Sparkles,
  Search,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { TrendAnalyzer } from "../components/trend-analyzer";
import { SavedIdeasSection } from "../components/saved-ideas-section";
import { ProjectCard } from "../components/project-card";
import { getRecentProjects, getTrends, getProjectStats, getProjects, type ProjectSortOption } from "~/common/data/project.data.server";
import { getSavedIdeas } from "~/common/data/ideation.data.server";
import { getAIRecommendationsForUser } from "~/common/data/ai-recommendation.data.server";
import { requireAuth } from "~/lib/auth.server";
import type { SavedIdea } from "~/common/types/ideation.types";
import { useTranslation } from "~/i18n/context";

const SORT_KEYS: { value: ProjectSortOption; key: string }[] = [
  { value: "newest", key: "list.sortOptions.newest" },
  { value: "oldest", key: "list.sortOptions.oldest" },
  { value: "name", key: "list.sortOptions.name" },
  { value: "progress", key: "list.sortOptions.progress" },
];

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  const url = new URL(request.url);

  // Project list params
  const search = url.searchParams.get("q") ?? undefined;
  const sort = (url.searchParams.get("sort") as ProjectSortOption) || "newest";
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const tab = url.searchParams.get("tab") ?? "trends";

  // First get trends, then use them for AI recommendations
  const [recentProjects, trends, savedIdeas, projectStats, paginatedProjects] = await Promise.all([
    getRecentProjects(userId),
    getTrends(),
    getSavedIdeas(userId),
    getProjectStats(userId),
    getProjects(userId, { search, sort, page }),
  ]);

  // Generate AI recommendations based on current trends
  const recommendations = await getAIRecommendationsForUser(userId, trends, {
    count: 3,
    language: "ko",
  });

  return {
    recentProjects,
    trends,
    recommendations,
    savedIdeas,
    projectStats,
    paginatedProjects,
    search: search ?? "",
    sort,
    tab,
  };
}

export const meta = () => {
  return [
    { title: "Dashboard | TubeGAI" },
    { name: "description", content: "Manage your creative workflow and production." },
  ];
};

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const {
    recentProjects,
    trends,
    recommendations: initialRecommendations,
    savedIdeas: initialSavedIdeas,
    projectStats,
    paginatedProjects,
    search,
    sort,
    tab: initialTab,
  } = loaderData;

  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>(initialSavedIdeas);
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [searchQuery, setSearchQuery] = useState(search);
  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();
  const { t } = useTranslation("project");
  const { t: tc } = useTranslation("common");

  const { projects, totalCount, totalPages, currentPage } = paginatedProjects;

  const handleDeleteIdea = (ideaId: string) => {
    setSavedIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));
  };

  const handleSaveIdea = (idea: SavedIdea) => {
    setSavedIdeas((prev) => [idea, ...prev]);
  };

  const handleEditIdea = (updatedIdea: SavedIdea) => {
    setSavedIdeas((prev) =>
      prev.map((idea) => (idea.id === updatedIdea.id ? updatedIdea : idea))
    );
  };

  const handleRefreshRecommendations = (newRecommendations: typeof recommendations) => {
    setRecommendations(newRecommendations);
  };

  // Build URL with search params
  function buildUrl(params: { q?: string; sort?: string; page?: number; tab?: string }) {
    const url = new URLSearchParams();
    if (params.tab && params.tab !== "trends") url.set("tab", params.tab);
    if (params.q) url.set("q", params.q);
    if (params.sort && params.sort !== "newest") url.set("sort", params.sort);
    if (params.page && params.page > 1) url.set("page", params.page.toString());
    const queryString = url.toString();
    return queryString ? `?${queryString}` : "";
  }

  // Handle tab change
  function handleTabChange(value: string) {
    setActiveTab(value);
    navigate(`/projects${buildUrl({ tab: value })}`);
  }

  // Handle search submit (reset to page 1)
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/projects${buildUrl({ q: searchQuery, sort, tab: "active-projects" })}`);
  }

  // Handle sort change (reset to page 1)
  function handleSortChange(newSort: ProjectSortOption) {
    navigate(`/projects${buildUrl({ q: search, sort: newSort, tab: "active-projects" })}`);
  }

  // Handle page change
  function handlePageChange(page: number) {
    navigate(`/projects${buildUrl({ q: search, sort, page, tab: "active-projects" })}`);
  }

  // Get current sort label
  const currentSortLabel = SORT_KEYS.find((opt) => opt.value === sort)?.key
    ? t(SORT_KEYS.find((opt) => opt.value === sort)!.key)
    : t("list.sort");

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h2>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      {/* MVP: Trends, Saved Ideas, and Projects tabs are active */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full max-w-100 grid-cols-3">
          <TabsTrigger value="trends">{t("dashboard.tabs.trends")}</TabsTrigger>
          <TabsTrigger value="saved-ideas">
            {t("dashboard.tabs.savedIdeas")}
            {savedIdeas.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {savedIdeas.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active-projects">
            {t("dashboard.tabs.projects")}
            {totalCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {totalCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TRENDS & IDEATION TAB */}
        <TabsContent value="trends" className="space-y-6">
          {/* Full Trend Analyzer Component */}
          <TrendAnalyzer trends={trends} recommendations={recommendations} onSaveIdea={handleSaveIdea} onRefreshRecommendations={handleRefreshRecommendations} />
        </TabsContent>

        {/* SAVED IDEAS TAB */}
        <TabsContent value="saved-ideas" className="space-y-6">
          <SavedIdeasSection ideas={savedIdeas} onDelete={handleDeleteIdea} onEdit={handleEditIdea} />
        </TabsContent>

        {/* ACTIVE PROJECTS TAB */}
        <TabsContent value="active-projects" className="space-y-6">

          {/* Status Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.stats.inProgress")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectStats.inProgress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.stats.completed")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectStats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.stats.drafts")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectStats.drafts}</div>
              </CardContent>
            </Card>
          </div>

          {/* Toolbar: Search, Sort, New Project */}
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("list.searchPlaceholder")}
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                className="transition-all hover:bg-primary hover:text-primary-foreground"
              >
                <Search className="h-4 w-4 mr-2" />
                {tc("button.search")}
              </Button>
            </form>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-36">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    {currentSortLabel}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {SORT_KEYS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className="flex items-center justify-between"
                    >
                      {t(option.key)}
                      {sort === option.value && <Check className="h-4 w-4 ml-2" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button asChild>
                <Link to="/projects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("list.newProject")}
                </Link>
              </Button>
            </div>
          </div>

          {/* Project Grid */}
          {projects.length > 0 ? (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {tc("button.previous")}
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage =
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1;

                      if (!showPage) {
                        // Show ellipsis only once between gaps
                        if (page === 2 && currentPage > 3) {
                          return <span key={page} className="px-2 text-muted-foreground">...</span>;
                        }
                        if (page === totalPages - 1 && currentPage < totalPages - 2) {
                          return <span key={page} className="px-2 text-muted-foreground">...</span>;
                        }
                        return null;
                      }

                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          className="w-9"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    {tc("button.next")}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}

              {/* Result count */}
              <p className="text-center text-sm text-muted-foreground">
                {t("list.pagination.showing", { count: projects.length, total: totalCount })}
              </p>
            </div>
          ) : (
            <Card className="p-8">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  {search ? (
                    <Search className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <FolderKanban className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium">
                    {search ? t("list.empty.title") : "아직 프로젝트가 없습니다"}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {search
                      ? t("list.empty.searchEmpty", { query: search })
                      : "트렌드에서 아이디어를 선택하거나 새 프로젝트를 만들어보세요"}
                  </p>
                </div>
                {search ? (
                  <Button variant="outline" onClick={() => {
                    setSearchQuery("");
                    navigate("/projects?tab=active-projects");
                  }}>
                    {tc("button.clearSearch")}
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/projects/new">
                      <Sparkles className="h-4 w-4 mr-2" />
                      첫 프로젝트 만들기
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          )}

        </TabsContent>
      </Tabs>
    </div>
  );
}
