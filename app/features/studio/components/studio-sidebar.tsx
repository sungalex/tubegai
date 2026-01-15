"use client"

import { Link, useLocation, useParams } from "react-router"
import { cn } from "~/lib/utils"
import { buttonVariants } from "~/common/components/ui/button"
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
} from "lucide-react"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  // items array can be passed or we can define it internally since it's specific to Studio
}

export function StudioSidebar({ className, ...props }: SidebarNavProps) {
  const location = useLocation()
  const params = useParams()
  const projectId = params.projectId

  // Helper to build path
  const getPath = (segment: string) => {
    return projectId ? `/studio/${segment}/${projectId}` : `/studio/${segment}`
  }

  // Dashboard path is special: /studio/dashboard (generic) or /studio/:projectId (specific)
  // Wait, route for dashboard with project is /studio/:projectId. 
  // Route for generic dashboard is /studio/dashboard.
  const getDashboardPath = () => {
    return projectId ? `/studio/${projectId}` : `/studio/dashboard`
  }

  const items = [
    { title: "Dashboard", href: getDashboardPath(), icon: LayoutDashboard },
    { title: "Script", href: getPath("script"), icon: FileText },
    { title: "Storyboard", href: getPath("storyboard"), icon: Presentation },
    { title: "Scene", href: getPath("scene"), icon: Clapperboard }, // Scene/Set
    { title: "B-Roll", href: getPath("b-roll"), icon: Film },
    { title: "Subtitles", href: getPath("subtitles"), icon: Captions },
    { title: "Coloring", href: getPath("coloring"), icon: Palette },
    { title: "Thumbnail", href: getPath("thumbnail"), icon: ImageIcon },
    { title: "SEO", href: getPath("seo"), icon: LineChart },
    { title: "Export", href: getPath("export"), icon: Download },
  ]

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => {
        // Active check logic needs to be robust
        // If current path starts with item.href (careful with prefixes)
        // Actually, simple equality or checking the segment is safer.
        // Let's use exact match for simple implementation or check if pathname includes the segment.
        const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              isActive
                ? "bg-muted hover:bg-muted"
                : "hover:bg-transparent hover:underline",
              "justify-start gap-2"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
