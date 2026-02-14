"use client";

import { Link, useLocation, useParams } from "react-router";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/common/components/ui/button";
import { Separator } from "~/common/components/ui/separator";
import {
  LayoutDashboard,
  FileText,
  Presentation,
  Image as ImageIcon,
  Clapperboard,
  Film,
  Palette,
  LineChart,
  Download,
  Captions,
  ChevronsLeft,
  ChevronsRight,
  Scissors,
  Sparkles,
} from "lucide-react";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export function StudioSidebar({
  className,
  isCollapsed,
  toggleSidebar,
  ...props
}: SidebarNavProps) {
  const location = useLocation();
  const params = useParams();
  const projectId = params.projectId;

  // Helper to build path
  const getPath = (segment: string) => {
    return projectId ? `/studio/${segment}/${projectId}` : `/studio/${segment}`;
  };

  /**
   * MVP Studio Items:
   * - Script, Storyboard, Scene, Export: Active
   * - Dashboard & Others: Disabled (Phase 2+)
   */
  const items = [
    // TrendTube Dashboard
    {
      title: "TrendTube",
      href: getPath("dashboard"),
      icon: Sparkles,
      disabled: false,
    },
    // MVP Features
    {
      title: "스크립트",
      href: getPath("script"),
      icon: FileText,
      disabled: false,
    },
    {
      title: "스토리보드",
      href: getPath("storyboard"),
      icon: Presentation,
      disabled: false,
    },
    {
      title: "씬",
      href: getPath("scene"),
      icon: Clapperboard,
      disabled: false,
    },
    {
      title: "내보내기 & 게시",
      href: getPath("export"),
      icon: Download,
      disabled: false,
    },
    // Phase 2+ Features (Disabled)
    { title: "B-Roll", href: "#", icon: Film, disabled: true },
    { title: "Rough Cut", href: "#", icon: Scissors, disabled: true },
    {
      title: "자막",
      href: "#",
      icon: Captions,
      disabled: true,
    },
    {
      title: "색보정",
      href: "#",
      icon: Palette,
      disabled: true,
    },
    {
      title: "썸네일",
      href: "#",
      icon: ImageIcon,
      disabled: true,
    },
    { title: "SEO", href: "#", icon: LineChart, disabled: true },
  ];

  return (
    <div className={cn("flex flex-col h-full", className)} {...props}>
      {/* Header Section with Toggle */}
      <div
        className={cn(
          "flex items-center h-14",
          isCollapsed ? "justify-center" : "px-4 justify-between",
        )}
      >
        {!isCollapsed && (
          <span className="font-bold text-lg tracking-tight whitespace-nowrap overflow-hidden">
            스튜디오
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors",
            !isCollapsed && "ml-2",
          )}
          title={
            isCollapsed
              ? "사이드바 펼치기"
              : "사이드바 접기"
          }
        >
          {isCollapsed ? (
            <ChevronsRight className="h-5 w-5" />
          ) : (
            <ChevronsLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <Separator />

      {/* Navigation Items */}
      <nav className="flex-1 py-4 space-y-1">
        {items.map((item) => {
          const isActive =
            !item.disabled &&
            (location.pathname === item.href ||
              location.pathname.startsWith(item.href + "/"));

          if (item.disabled) {
            return (
              <div
                key={item.title}
                title={isCollapsed ? `${item.title} (Coming Soon)` : undefined}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "w-full justify-start cursor-not-allowed opacity-40",
                  isCollapsed ? "px-2 justify-center" : "px-4",
                )}
              >
                <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && <span>{item.title}</span>}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              to={item.href}
              title={isCollapsed ? item.title : undefined}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                isActive
                  ? "bg-muted hover:bg-muted text-primary"
                  : "hover:bg-transparent hover:underline text-muted-foreground",
                "w-full justify-start",
                isCollapsed ? "px-2 justify-center" : "px-4",
              )}
            >
              <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info Only */}
      <div className="mt-auto p-2 border-t text-[10px] text-muted-foreground text-center">
        {!isCollapsed && projectId && (
          <div className="px-2 pb-2">
            프로젝트: {projectId}
          </div>
        )}
      </div>
    </div>
  );
}
