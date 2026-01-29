import { useLoaderData } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Button } from "~/common/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import { Edit2, FolderKanban } from "lucide-react";
import { Link } from "react-router";
import { TrendAnalyzer } from "../components/trend-analyzer";
import { getRecentProjects, getTrends, getAIRecommendations } from "~/common/data/project.data";

export async function loader() {
  const [recentProjects, trends, recommendations] = await Promise.all([
    getRecentProjects(),
    getTrends(),
    getAIRecommendations(),
  ]);
  return { recentProjects, trends, recommendations };
}

export const meta = () => {
  return [
    { title: "Dashboard | TubeGAI" },
    { name: "description", content: "Manage your creative workflow and production." },
  ];
};

export default function DashboardPage() {
  const { recentProjects, trends, recommendations } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Projects Dashboard</h2>
        <p className="text-muted-foreground">Manage your creative workflow and production.</p>
      </div>

      {/* MVP: Only Trends and Projects tabs are active */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full max-w-75 grid-cols-2">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="active-projects">Projects</TabsTrigger>
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
              <h2 className="text-2xl font-bold tracking-tight">Ideation Hub</h2>
              <p className="text-muted-foreground">Discover winning topics and start creating instantly.</p>
            </div>
          </div>

          {/* Full Trend Analyzer Component */}
          <TrendAnalyzer trends={trends} recommendations={recommendations} />
        </TabsContent>

        {/* ACTIVE PROJECTS TAB */}
        <TabsContent value="active-projects" className="space-y-6">

          {/* Status Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Recent Activity</h3>
            <Button variant="ghost" asChild>
              <Link to="/projects/lists" className="flex items-center gap-2">
                View All Projects <FolderKanban className="h-4 w-4" />
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
                    <div className="bg-primary h-full rounded-full" style={{ width: '45%' }} />
                  </div>
                  <Button className="w-full h-8 text-xs px-2" asChild>
                    <Link to={`/studio/script/${project.id}`}>
                      <Edit2 className="h-3 w-3 mr-1.5" /> Open Script
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
