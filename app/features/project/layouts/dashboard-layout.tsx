import { Outlet, useLocation, useNavigate } from "react-router";
import type { Route } from "./+types/dashboard-layout";
import { Tabs, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import { requireAuth } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return {};
}

export const meta = () => {
  return [
    { title: "Dashboard | TubeGAI" },
    { name: "description", content: "Manage your creative workflow and production." },
  ];
};

// Map URL paths to tab values
function getTabFromPath(pathname: string): string {
  if (pathname.includes("/trends")) return "trends";
  if (pathname.includes("/saved-ideas")) return "saved-ideas";
  return "projects";
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = getTabFromPath(location.pathname);

  function handleTabChange(value: string) {
    if (value === "projects") {
      navigate("/projects");
    } else {
      navigate(`/projects/${value}`);
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">프로젝트 대시보드</h2>
        <p className="text-muted-foreground">크리에이티브 워크플로우와 제작을 관리하세요.</p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full max-w-100 grid-cols-3">
          <TabsTrigger value="projects">프로젝트</TabsTrigger>
          <TabsTrigger value="trends">트렌드</TabsTrigger>
          <TabsTrigger value="saved-ideas">저장된 아이디어</TabsTrigger>
        </TabsList>

        {/* Tab Content via Outlet */}
        <div className="space-y-6">
          <Outlet />
        </div>
      </Tabs>
    </div>
  );
}
