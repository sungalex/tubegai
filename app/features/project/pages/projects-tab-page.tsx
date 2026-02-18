import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/projects-tab-page";
import { Card, CardContent } from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/common/components/ui/dropdown-menu";
import {
  FolderKanban,
  Sparkles,
  Search,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { ProjectCard } from "../components/project-card";
import { getProjectStats, getProjects, type ProjectSortOption, type ProjectStatusFilter } from "~/common/data/project.data.server";
import { requireAuth } from "~/lib/auth.server";
import { cn } from "~/lib/utils";

const SORT_KEYS: { value: ProjectSortOption; label: string }[] = [
  { value: "newest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
  { value: "name", label: "이름순 (A-Z)" },
  { value: "progress", label: "진행률순" },
];

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  const url = new URL(request.url);

  const search = url.searchParams.get("q") ?? undefined;
  const sort = (url.searchParams.get("sort") as ProjectSortOption) || "newest";
  const status = (url.searchParams.get("status") as ProjectStatusFilter) || undefined;
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);

  const [projectStats, paginatedProjects] = await Promise.all([
    getProjectStats(userId),
    getProjects(userId, { search, sort, status, page }),
  ]);

  return {
    projectStats,
    paginatedProjects,
    search: search ?? "",
    sort,
    status,
  };
}

export default function ProjectsTabPage({ loaderData }: Route.ComponentProps) {
  const { projectStats, paginatedProjects, search, sort, status } = loaderData;

  const [searchQuery, setSearchQuery] = useState(search);
  const navigate = useNavigate();

  const { projects, totalCount, totalPages, currentPage } = paginatedProjects;

  function buildUrl(params: { q?: string; sort?: string; status?: string; page?: number }) {
    const url = new URLSearchParams();
    if (params.q) url.set("q", params.q);
    if (params.sort && params.sort !== "newest") url.set("sort", params.sort);
    if (params.status) url.set("status", params.status);
    if (params.page && params.page > 1) url.set("page", params.page.toString());
    const queryString = url.toString();
    return queryString ? `?${queryString}` : "";
  }

  function handleStatusFilter(newStatus: ProjectStatusFilter | undefined) {
    // Toggle: if same status, clear filter
    const targetStatus = status === newStatus ? undefined : newStatus;
    navigate(`/projects${buildUrl({ q: search, sort, status: targetStatus })}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/projects${buildUrl({ q: searchQuery, sort, status })}`);
  }

  function handleSortChange(newSort: ProjectSortOption) {
    navigate(`/projects${buildUrl({ q: search, sort: newSort, status })}`);
  }

  function handlePageChange(page: number) {
    navigate(`/projects${buildUrl({ q: search, sort, status, page })}`);
  }

  const currentSortLabel = SORT_KEYS.find((opt) => opt.value === sort)?.label ?? "정렬";

  return (
    <>
      {/* Status Summary - Clickable filters */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            status === "in_progress" && "border-primary bg-primary/5"
          )}
          onClick={() => handleStatusFilter("in_progress")}
        >
          <CardContent className="flex items-center justify-between p-3">
            <span className="text-sm font-medium text-muted-foreground">진행 중</span>
            <span className="text-xl font-bold">{projectStats.inProgress}</span>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            status === "completed" && "border-primary bg-primary/5"
          )}
          onClick={() => handleStatusFilter("completed")}
        >
          <CardContent className="flex items-center justify-between p-3">
            <span className="text-sm font-medium text-muted-foreground">완료됨</span>
            <span className="text-xl font-bold">{projectStats.completed}</span>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            status === "draft" && "border-primary bg-primary/5"
          )}
          onClick={() => handleStatusFilter("draft")}
        >
          <CardContent className="flex items-center justify-between p-3">
            <span className="text-sm font-medium text-muted-foreground">초안</span>
            <span className="text-xl font-bold">{projectStats.drafts}</span>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar: Search, Sort, New Project */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="relative flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="프로젝트 검색..."
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
            검색
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
                  {option.label}
                  {sort === option.value && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild>
            <Link to="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              새 프로젝트
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
                이전
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1;

                  if (!showPage) {
                    if (page === 2 && currentPage > 3) {
                      return (
                        <span key={page} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      );
                    }
                    if (page === totalPages - 1 && currentPage < totalPages - 2) {
                      return (
                        <span key={page} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      );
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
                다음
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Result count */}
          <p className="text-center text-sm text-muted-foreground">
            {`총 ${totalCount}개 중 ${projects.length}개 표시`}
          </p>
        </div>
      ) : (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              {search || status ? (
                <Search className="h-6 w-6 text-muted-foreground" />
              ) : (
                <FolderKanban className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h4 className="font-medium">
                {search || status ? "프로젝트를 찾을 수 없습니다" : "아직 프로젝트가 없습니다"}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {search
                  ? `"${search}"에 해당하는 프로젝트를 찾을 수 없습니다. 검색어를 조정해보세요.`
                  : status
                    ? "해당 상태의 프로젝트가 없습니다"
                    : "트렌드에서 아이디어를 선택하거나 새 프로젝트를 만들어보세요"}
              </p>
            </div>
            {search || status ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  navigate("/projects");
                }}
              >
                검색 지우기
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
    </>
  );
}
