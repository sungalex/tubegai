import { useState } from "react";
import { Link } from "react-router";
import { Plus, Search, Filter, SortAsc } from "lucide-react";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/common/components/ui/pagination";
import { ProjectCard } from "../components/project-card";

// Mock Data
const MOCK_PROJECTS = [
  {
    id: "1",
    title: "AI Revolution 2026",
    status: "In Progress" as const,
    lastModified: "2026-05-20",
    progress: 45,
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "2",
    title: "Tech Trends Q3 Review",
    status: "Completed" as const,
    lastModified: "2026-05-18",
    progress: 100,
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "3",
    title: "Product Unboxing: X1",
    status: "Draft" as const,
    lastModified: "2026-05-15",
    progress: 10,
    thumbnail: undefined,
  },
  {
    id: "4",
    title: "Weekly Vlog #42: My Setup",
    status: "In Progress" as const,
    lastModified: "2026-05-12",
    progress: 75,
    thumbnail: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "5",
    title: "How to Code in 2026",
    status: "Processing" as const,
    lastModified: "2026-05-10",
    progress: 90,
    thumbnail: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "6",
    title: "Travel Diary: Tokyo",
    status: "Draft" as const,
    lastModified: "2026-05-01",
    progress: 5,
    thumbnail: undefined,
  },
];

export const meta = () => {
  return [
    { title: "Projects | TubeGAI" },
    { name: "description", content: "View and manage all your video projects." },
  ];
};

export default function ProjectListPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = MOCK_PROJECTS.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Your Projects</h1>
          <p className="text-muted-foreground">Manage and organize your video creations.</p>
        </div>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <SortAsc className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Project Grid */}
      {filteredProjects.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">
                  3
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      ) : (
        <div className="text-center py-20 border rounded-lg bg-muted/20 border-dashed">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Search className="h-10 w-10 mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No projects found</h3>
            <p className="text-sm max-w-sm mt-1 mb-4">
              We couldn't find any projects matching "{searchQuery}". Try adjusting your search term.
            </p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

