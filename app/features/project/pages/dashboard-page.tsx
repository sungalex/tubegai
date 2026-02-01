import { useState } from "react";
import type { Route } from "./+types/dashboard-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Button } from "~/common/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import { Edit2, FolderKanban } from "lucide-react";
import { Link } from "react-router";
import { TrendAnalyzer } from "../components/trend-analyzer";
import { SavedIdeasSection } from "../components/saved-ideas-section";
import { getRecentProjects, getTrends, getAIRecommendations } from "~/common/data/project.data.server";
import { getSavedIdeas } from "~/common/data/ideation.data.server";
import { requireAuth } from "~/lib/auth.server";
import type { SavedIdea } from "~/common/types/ideation.types";
import { useTranslation } from "~/i18n/context";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);

  const [recentProjects, trends, recommendations, savedIdeas] = await Promise.all([
    getRecentProjects(userId),
    getTrends(),
    getAIRecommendations(),
    getSavedIdeas(userId),
  ]);
  return { recentProjects, trends, recommendations, savedIdeas };
}

export const meta = () => {
  return [
    { title: "Dashboard | TubeGAI" },
    { name: "description", content: "Manage your creative workflow and production." },
  ];
};

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { recentProjects, trends, recommendations, savedIdeas: initialSavedIdeas } = loaderData;
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>(initialSavedIdeas);
  const { t } = useTranslation("project");

  const handleDeleteIdea = (ideaId: string) => {
    setSavedIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));
  };

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h2>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      {/* MVP: Trends, Saved Ideas, and Projects tabs are active */}
      <Tabs defaultValue="trends" className="space-y-6">
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
          <TabsTrigger value="active-projects">{t("dashboard.tabs.projects")}</TabsTrigger>
          {/* DISABLED: Phase 2+ tabs
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="labels">Labels</TabsTrigger>
          */}
        </TabsList>

        {/* TRENDS & IDEATION TAB */}
        <TabsContent value="trends" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t("dashboard.ideationHub.title")}</h2>
              <p className="text-muted-foreground">{t("dashboard.ideationHub.subtitle")}</p>
            </div>
          </div>

          {/* Full Trend Analyzer Component */}
          <TrendAnalyzer trends={trends} recommendations={recommendations} />
        </TabsContent>

        {/* SAVED IDEAS TAB */}
        <TabsContent value="saved-ideas" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t("dashboard.savedIdeasSection.title")}</h2>
              <p className="text-muted-foreground">{t("dashboard.savedIdeasSection.subtitle")}</p>
            </div>
          </div>

          <SavedIdeasSection ideas={savedIdeas} onDelete={handleDeleteIdea} />
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
                <div className="text-2xl font-bold">3</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.stats.completed")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.stats.drafts")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{t("dashboard.recentActivity")}</h3>
            <Button variant="ghost" asChild>
              <Link to="/projects/lists" className="flex items-center gap-2">
                {t("dashboard.viewAllProjects")} <FolderKanban className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {recentProjects.map((project) => (
              <Card key={project.id} className="flex flex-col">
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <Badge variant={project.status === 'Completed' ? 'default' : 'secondary'} className="mb-2">
                      {project.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{project.date}</span>
                  </div>
                  <CardTitle className="text-base line-clamp-1" title={project.name}>{project.name}</CardTitle>
                  <CardDescription className="text-xs">Step: {project.step}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 mt-auto">
                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mb-4">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${project.progress}%` }} />
                  </div>
                  <Button className="w-full h-8 text-xs px-2" asChild>
                    <Link to={`/studio/script/${project.id}`}>
                      <Edit2 className="h-3 w-3 mr-1.5" /> {t("dashboard.openScript")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

        </TabsContent>

        {/* DISABLED: Phase 2+ Tab Contents
        <TabsContent value="overview">...</TabsContent>
        <TabsContent value="channels">...</TabsContent>
        <TabsContent value="labels">...</TabsContent>
        */}
      </Tabs>
    </div>
  );
}
