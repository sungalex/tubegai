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
  Tag,
  Zap
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Projects Dashboard</h2>
        <p className="text-muted-foreground">Manage your creative workflow and production.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-[600px] grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="active-projects">Projects</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="labels">Labels</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">

          {/* Stat Cards - Executive Summary */}
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
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">in progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Top 5%</div>
                <p className="text-xs text-muted-foreground">vs similar creators</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Main Chart area - Efficiency or Growth ?? Let's keep Growth Trends for now */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Views and Subscriber growth over time.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
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

            {/* Widgets Column */}
            <div className="col-span-3 space-y-4">

              {/* Mini Trends Widget */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Trending Now</CardTitle>
                    <Link to="#" onClick={(e) => { e.preventDefault(); document.querySelector('[value="trends"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); }} className="text-xs text-muted-foreground hover:text-primary">
                      View Hub
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: "AI Revolution 2026", growth: "+145%" },
                    { title: "Minimalist Desk Setup", growth: "+89%" },
                    { title: "Japan Travel Tips", growth: "+210%" },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                      <span className="text-sm font-medium line-clamp-1">{t.title}</span>
                      <span className="text-xs font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">{t.growth}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Project Shortcut */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Continue Working</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentProjects.slice(0, 1).map(p => (
                    <div key={p.id} className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.step}</div>
                        </div>
                        <Badge variant="secondary">{p.status}</Badge>
                      </div>
                      <Button size="sm" className="w-full" asChild>
                        <Link to={`/studio/dashboard/${p.id}`}>
                          <Edit2 className="h-3 w-3 mr-2" /> Resume Studio
                        </Link>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TRENDS & IDEATION TAB - New Feature */}
        <TabsContent value="trends" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Ideation Hub</h2>
              <p className="text-muted-foreground">Discover winning topics and start creating instantly.</p>
            </div>
          </div>

          {/* Full Trend Analyzer Component */}
          <TrendAnalyzer />
        </TabsContent>

        {/* ACTIVE PROJECTS TAB (Renamed from Projects) */}
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
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button variant="outline" className="w-full h-8 text-xs px-2" asChild>
                      <Link to={`/projects/${project.id}`}>
                        Details
                      </Link>
                    </Button>
                    <Button className="w-full h-8 text-xs px-2" asChild>
                      <Link to={`/studio/dashboard/${project.id}`}>
                        <Edit2 className="h-3 w-3 mr-1.5" /> Studio
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

        </TabsContent>

        {/* CHANNELS TAB */}
        <TabsContent value="channels">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Channel Overview</h3>
                <p className="text-sm text-muted-foreground">Monitor performance across connected channels.</p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/projects/channels">Manage Channels</Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">892.4K</div>
                  <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Channels</CardTitle>
                  <Radio className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">Both functioning normally</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Simultaneous Uploads</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">Max allowed by plan</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Channel Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "TubeGAI Official", status: "Active", latency: "24ms" },
                    { name: "Alex Vlogs", status: "Active", latency: "31ms" },
                  ].map((channel, i) => (
                    <div key={i} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <div className="font-medium">{channel.name}</div>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4">
                        <span>Latency: {channel.latency}</span>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-200">
                          {channel.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LABELS TAB */}
        <TabsContent value="labels">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Label Analysis</h3>
                <p className="text-sm text-muted-foreground">See how you are categorizing your projects.</p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/projects/labels">Manage Labels</Link>
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Used Labels</CardTitle>
                  <CardDescription>Most frequently applied tags across all projects.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {[
                      { name: "Tutorial", count: 12, percentage: 75, color: "bg-blue-500" },
                      { name: "Vlog", count: 8, percentage: 50, color: "bg-green-500" },
                      { name: "Review", count: 5, percentage: 30, color: "bg-yellow-500" },
                      { name: "Shorts", count: 3, percentage: 15, color: "bg-purple-500" },
                    ].map((label, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${label.color}`} />
                            {label.name}
                          </span>
                          <span className="text-muted-foreground">{label.count} projects</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full ${label.color}`} style={{ width: `${label.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Tagging Activity</CardTitle>
                  <CardDescription>Recently labeled projects.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { project: "AI News Week 4", label: "News", date: "2 hours ago" },
                      { project: "React Tutorial", label: "Tutorial", date: "5 hours ago" },
                      { project: "Tokyo Trip", label: "Vlog", date: "1 day ago" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{item.project}</span>
                          <span className="text-xs text-muted-foreground">{item.date}</span>
                        </div>
                        <Badge variant="secondary">{item.label}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
