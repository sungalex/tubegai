import { Link, useParams } from "react-router";
import {
  LayoutDashboard,
  Box,
  Sparkles,
  Crown,
  Trophy,
  FolderKanban,
  Radio,
  Tag,
  Clapperboard,
  FileText,
  Download,
  Image,
  Film,
  Palette,
  Captions,
  Video,
  Search,
  Plus,
} from "lucide-react";
import { DesktopNavigation } from "./desktop-navigation";
import { MobileNavigation } from "./mobile-navigation";
import { UserNavigation } from "./user-navigation";
import { useState } from "react";

interface NavigationProps {
  isLoggedIn: boolean;
  hasNotifications: boolean;
  hasMessages: boolean;
}

/**
 * MVP Navigation Items
 * - Products: TubeGAI only (Pro/Plus disabled)
 * - Projects: Dashboard, All Projects, New Project (Channels/Labels disabled)
 * - Studio: Dashboard, Script, Export (other features disabled)
 */
const getNavItems = (_projectId: string) => [
  {
    name: "Products",
    to: "/products",
    icon: Box,
    items: [
      {
        name: "TubeGAI",
        description: "Standard integrated creator workflow solution.",
        to: "/products",
        icon: Sparkles,
        featured: true,
      },
      // DISABLED: Phase 2+
      {
        name: "TubeGAI Pro",
        description: "Coming soon - Advanced analytics.",
        to: "#",
        icon: Crown,
        disabled: true,
      },
      {
        name: "TubeGAI Plus",
        description: "Coming soon - Enterprise solutions.",
        to: "#",
        icon: Trophy,
        disabled: true,
      },
    ],
  },

  {
    name: "Projects",
    to: "/projects",
    icon: FolderKanban,
    items: [
      {
        name: "Dashboard",
        description: "Manage your creative workflow and production.",
        to: "/projects",
        featured: true,
        icon: LayoutDashboard,
      },
      {
        name: "All Projects",
        description: "View and manage all your creative projects.",
        to: "/projects/lists",
        featured: true,
        icon: FolderKanban,
      },
      {
        name: "New Project",
        description: "Start a new video project from scratch.",
        to: "/projects/new",
        icon: Plus,
      },
      // DISABLED: Phase 2+
      {
        name: "Channels",
        description: "Coming soon - YouTube channel management.",
        to: "#",
        icon: Radio,
        disabled: true,
      },
      {
        name: "Labels",
        description: "Coming soon - Project organization.",
        to: "#",
        icon: Tag,
        disabled: true,
      },
    ],
  },
  {
    name: "Studio",
    to: "/studio/script",
    icon: Clapperboard,
    items: [
      // MVP Features
      {
        name: "Script",
        description: "Write and edit your video script with AI.",
        to: "/studio/script",
        icon: FileText,
        featured: true,
      },
      {
        name: "Storyboard",
        description: "Visualize scenes and shots.",
        to: "/studio/storyboard",
        icon: Image,
        featured: true,
      },
      {
        name: "Scene",
        description: "Set up environments and assets.",
        to: "/studio/scene",
        icon: Film,
      },
      {
        name: "Export",
        description: "Render and download final video.",
        to: "/studio/export",
        icon: Download,
      },
      // DISABLED: Phase 2+ Features
      {
        name: "Studio Dashboard",
        description: "Coming soon - Production pipeline overview.",
        to: "#",
        icon: LayoutDashboard,
        disabled: true,
      },
      {
        name: "B-Roll",
        description: "Coming soon - Stock footage.",
        to: "#",
        icon: Video,
        disabled: true,
      },
      {
        name: "Subtitles",
        description: "Coming soon - Caption generation.",
        to: "#",
        icon: Captions,
        disabled: true,
      },
      {
        name: "Coloring",
        description: "Coming soon - Color grading.",
        to: "#",
        icon: Palette,
        disabled: true,
      },
      {
        name: "Thumbnail",
        description: "Coming soon - Thumbnail designer.",
        to: "#",
        icon: Image,
        disabled: true,
      },
      {
        name: "SEO",
        description: "Coming soon - Search optimization.",
        to: "#",
        icon: Search,
        disabled: true,
      },
    ],
  },
];

export default function Navigation({ isLoggedIn, hasNotifications, hasMessages }: NavigationProps) {
  const params = useParams();
  const projectId = params.projectId || "1";
  const navItems = getNavItems(projectId);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-4 md:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-6">
            <MobileNavigation navItems={navItems} isOpen={isOpen} setIsOpen={setIsOpen} />
            <Link to="/">
              <span className="text-xl font-bold bg-linear-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent hidden sm:inline-block">
                TubeGAI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <DesktopNavigation navItems={navItems} />
          </div>

          <div className="flex items-center space-x-2">

            <UserNavigation
              isLoggedIn={isLoggedIn}
              hasNotifications={hasNotifications}
              hasMessages={hasMessages}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}


