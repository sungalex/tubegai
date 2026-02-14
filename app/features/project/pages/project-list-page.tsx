import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Search, Check, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/common/components/ui/dropdown-menu";
import { ProjectCard } from "../components/project-card";
import type { Route } from "./+types/project-list-page";
import { getProjects, type ProjectSortOption } from "~/common/data/project.data.server";
import { requireAuth } from "~/lib/auth.server";

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
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);

  const result = await getProjects(userId, { search, sort, page });
  return { ...result, search: search ?? "", sort };
}

export const meta = () => {
  return [
    { title: "Projects | TubeGAI" },
    { name: "description", content: "View and manage all your video projects." },
  ];
};

export default function ProjectListPage({ loaderData }: Route.ComponentProps) {
  const { projects, search, sort, totalCount, totalPages, currentPage } = loaderData;
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(search);

  // Build URL with search params
  function buildUrl(params: { q?: string; sort?: string; page?: number }) {
    const url = new URLSearchParams();
    if (params.q) url.set("q", params.q);
    if (params.sort && params.sort !== "newest") url.set("sort", params.sort);
    if (params.page && params.page > 1) url.set("page", params.page.toString());
    const queryString = url.toString();
    return queryString ? `?${queryString}` : "";
  }

  // Handle search submit (reset to page 1)
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/projects?tab=active-projects${buildUrl({ q: searchQuery, sort })}`);
  }

  // Handle sort change (reset to page 1)
  function handleSortChange(newSort: ProjectSortOption) {
    navigate(`/projects?tab=active-projects${buildUrl({ q: search, sort: newSort })}`);
  }

  // Handle page change
  function handlePageChange(page: number) {
    navigate(`/projects?tab=active-projects${buildUrl({ q: search, sort, page })}`);
  }

  // Get current sort label
  const currentSortLabel = SORT_KEYS.find((opt) => opt.value === sort)?.label ?? "정렬";

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">내 프로젝트</h1>
          <p className="text-muted-foreground">비디오 제작물을 관리하고 정리하세요.</p>
        </div>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            새 프로젝트
          </Link>
        </Button>
      </div>

      {/* Toolbar */}
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
        <div className="text-center py-20 border rounded-lg bg-muted/20 border-dashed">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Search className="h-10 w-10 mb-4 opacity-50" />
            <h3 className="text-lg font-medium">프로젝트를 찾을 수 없습니다</h3>
            <p className="text-sm max-w-sm mt-1 mb-4">
              {search
                ? `"${search}"에 해당하는 프로젝트를 찾을 수 없습니다. 검색어를 조정해보세요.`
                : "아직 프로젝트가 없습니다. 새 프로젝트를 만들어보세요."}
            </p>
            {search ? (
              <Button variant="outline" onClick={() => navigate("/projects?tab=active-projects")}>
                검색 지우기
              </Button>
            ) : (
              <Button asChild>
                <Link to="/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  프로젝트 만들기
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

