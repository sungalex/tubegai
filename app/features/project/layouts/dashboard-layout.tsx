import { Outlet, useLocation, useNavigate } from "react-router";
import type { Route } from "./+types/dashboard-layout";
import { Tabs, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import { requireAuth } from "~/lib/auth.server";
import { useTranslation } from "~/i18n/context";

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
  const { t } = useTranslation("project");

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
        <h2 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h2>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full max-w-100 grid-cols-3">
          <TabsTrigger value="projects">{t("dashboard.tabs.projects")}</TabsTrigger>
          <TabsTrigger value="trends">{t("dashboard.tabs.trends")}</TabsTrigger>
          <TabsTrigger value="saved-ideas">{t("dashboard.tabs.savedIdeas")}</TabsTrigger>
        </TabsList>

        {/* Tab Content via Outlet */}
        <div className="space-y-6">
          <Outlet />
        </div>
      </Tabs>
    </div>
  );
}
