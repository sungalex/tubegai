import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Button } from "~/common/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/common/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  Activity,
  Users,
  Video,
  Clock,
  Edit2,
  FolderKanban,
  Radio,
  Tag
} from "lucide-react";
import { Link } from "react-router";
import { TrendAnalyzer } from "../components/trend-analyzer";

// Mock Data
const data = [
  { name: 'Jan', views: 4000, subs: 2400 },
  { name: 'Feb', views: 3000, subs: 1398 },
  { name: 'Mar', views: 2000, subs: 9800 },
  { name: 'Apr', views: 2780, subs: 3908 },
  { name: 'May', views: 1890, subs: 4800 },
  { name: 'Jun', views: 2390, subs: 3800 },
];

const performanceData = [
  { topic: 'AI News', watchTime: 120 },
  { topic: 'Tutorials', watchTime: 200 },
  { topic: 'Vlog', watchTime: 80 },
  { topic: 'Reviews', watchTime: 160 },
];

const recentProjects = [
  { id: 1, name: "AI Revolution 2026", status: "In Progress", date: "2026-05-20", step: "Scripting" },
  { id: 2, name: "Tech Trends Q3", status: "Completed", date: "2026-05-18", step: "Done" },
  { id: 3, name: "Product Review: X1", status: "Draft", date: "2026-05-15", step: "Idea" },
  { id: 4, name: "Weekly Vlog #42", status: "In Progress", date: "2026-05-12", step: "Editing" },
];

export const meta = () => {
  return [
    { title: "Dashboard | TubeGAI" },
    { name: "description", content: "Manage your creative workflow and production." },
  ];
};

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects Dashboard</h2>
          <p className="text-muted-foreground">Manage your creative workflow and production.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link to="/projects/new">New Project</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-[500px] grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">All Projects</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="labels">Labels</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">

          {/* Trend Analysis Section - New Feature */}
          <section className="bg-background/50 rounded-xl border p-6 backdrop-blur-sm">
            <TrendAnalyzer />
          </section>

          {/* Stat Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.4M</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15.2K</div>
                <p className="text-xs text-muted-foreground">+5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">All Projects</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentProjects.length}</div>
                <p className="text-xs text-muted-foreground">Stored in workspace</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">120h</div>
                <p className="text-xs text-muted-foreground">Using AI automation</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Growth Trends Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Views and Subscriber growth over time.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line type="monotone" dataKey="views" stroke="#8884d8" name="Views" strokeWidth={2} />
                    <Line type="monotone" dataKey="subs" stroke="#82ca9d" name="Subscribers" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Content Performance Chart */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
                <CardDescription>Average Watch Time by Topic.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis dataKey="topic" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="watchTime" fill="#adfa1d" radius={[4, 4, 0, 0]} name="Avg. Watch Time (s)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PROJECTS TAB */}
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                All Projects
              </CardTitle>
              <CardDescription>
                Detailed list of all your video production projects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Step</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <Badge variant={project.status === 'Completed' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{project.step}</TableCell>
                      <TableCell>{project.date}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/projects/${project.id}`}>
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TOPICS / CHANNELS TAB */}
        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Connected Channels
              </CardTitle>
              <CardDescription>
                Manage your YouTube channel integrations here.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground border-dashed border-2 rounded-md m-4">
              Channel Management Component Coming Soon
            </CardContent>
          </Card>
        </TabsContent>

        {/* LABELS TAB */}
        <TabsContent value="labels">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Project Labels
              </CardTitle>
              <CardDescription>
                Organize your projects with custom taxonomy.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground border-dashed border-2 rounded-md m-4">
              Label Management Component Coming Soon
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
