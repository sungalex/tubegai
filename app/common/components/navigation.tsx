import { Link, useParams } from "react-router";
import { LayoutDashboard, Box, Sparkles, Crown, Trophy, FolderKanban, Radio, Tag, Clapperboard } from "lucide-react";
import { DesktopNavigation } from "./desktop-navigation";
import { MobileNavigation } from "./mobile-navigation";
import { UserNavigation } from "./user-navigation";
import { useState } from "react";

interface NavigationProps {
  isLoggedIn: boolean;
  hasNotifications: boolean;
  hasMessages: boolean;
}

const getNavItems = (projectId: string) => [
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
      {
        name: "TubeGAI Pro",
        description: "Advanced analytics and unlimited AI generation.",
        to: "#",
        icon: Crown,
        disabled: true,
      },
      {
        name: "TubeGAI Plus",
        description: "Enterprise solutions for teams and agencies.",
        to: "#",
        icon: Trophy,
        disabled: true,
      },
    ]
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
        name: "Channels",
        description: "Manage your connected YouTube channels.",
        to: "/projects/channels",
        icon: Radio,
      },
      {
        name: "Labels",
        description: "Organize projects with custom labels.",
        to: "/projects/labels",
        icon: Tag,
      },
      {
        name: "New Project",
        description: "Start a new video project from scratch.",
        to: "/projects/new",
      },
    ],
  },
  {
    name: "Studio",
    to: `/studio/${projectId}`,
    icon: Clapperboard,
    items: [
      { name: "Studio Dashboard", description: "Overview of your production pipeline.", to: `/studio/${projectId}` },
      { name: "Script", description: "Write and edit your video script.", to: `/studio/script/${projectId}` },
      { name: "Storyboard", description: "Visualize scenes and shots.", to: `/studio/storyboard/${projectId}` },
      { name: "Scene", description: "Set up environments and assets.", to: `/studio/scene/${projectId}` },
      { name: "B-Roll", description: "Manage supplemental footage.", to: `/studio/b-roll/${projectId}` },
      { name: "Subtitles", description: "Generate and edit captions.", to: `/studio/subtitles/${projectId}` },
      { name: "Coloring", description: "Apply color grading and effects.", to: `/studio/coloring/${projectId}` },
      { name: "Thumbnail", description: "Design eye-catching thumbnails.", to: `/studio/thumbnail/${projectId}` },
      { name: "SEO", description: "Optimize for search visibility.", to: `/studio/seo/${projectId}` },
      { name: "Export", description: "Render and download final video.", to: `/studio/export/${projectId}` },
    ],
  },

];

import logo from "~/assets/logo.png";

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
            <Link to="/" className="mr-4 flex items-center gap-2">
              <img src={logo} alt="TubeGAI" className="h-8 w-auto" />
              <span className="text-xl font-bold bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent hidden sm:inline-block">
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


