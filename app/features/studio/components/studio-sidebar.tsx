"use client"

import { Link, useLocation, useParams } from "react-router"
import { cn } from "~/lib/utils"
import { buttonVariants } from "~/common/components/ui/button"
import { Separator } from "~/common/components/ui/separator"
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
} from "lucide-react"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export function StudioSidebar({ className, isCollapsed, toggleSidebar, ...props }: SidebarNavProps) {
  const location = useLocation()
  const params = useParams()
  const projectId = params.projectId

  // Helper to build path
  const getPath = (segment: string) => {
    return projectId ? `/studio/${segment}/${projectId}` : `/studio/${segment}`
  }

  const items = [
    { title: "Dashboard", href: "/studio/dashboard", icon: LayoutDashboard },
    { title: "Script", href: getPath("script"), icon: FileText },
    { title: "Storyboard", href: getPath("storyboard"), icon: Presentation },
    { title: "Scene", href: getPath("scene"), icon: Clapperboard },
    { title: "B-Roll", href: getPath("b-roll"), icon: Film },
    { title: "Subtitles", href: getPath("subtitles"), icon: Captions },
    { title: "Coloring", href: getPath("coloring"), icon: Palette },
    { title: "Thumbnail", href: getPath("thumbnail"), icon: ImageIcon },
    { title: "SEO", href: getPath("seo"), icon: LineChart },
    { title: "Export", href: getPath("export"), icon: Download },
  ]

  return (
    <div className={cn("flex flex-col h-full", className)} {...props}>
      {/* Header Section with Toggle */}
      <div className={cn("flex items-center h-14", isCollapsed ? "justify-center" : "px-4 justify-between")}>
        {!isCollapsed && (
          <span className="font-bold text-lg tracking-tight whitespace-nowrap overflow-hidden">
            Creator Studio
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors",
            !isCollapsed && "ml-2"
          )}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
        </button>
      </div>

      <Separator />

      {/* Navigation Items */}
      <nav className="flex-1 py-4 space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
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
                isCollapsed ? "px-2 justify-center" : "px-4"
              )}
            >
              <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer Info Only */}
      <div className="mt-auto p-2 border-t text-[10px] text-muted-foreground text-center">
        {!isCollapsed && projectId && (
          <div className="px-2 pb-2">
            Project: {projectId}
          </div>
        )}
      </div>
    </div>
  )
}
