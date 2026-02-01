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
import { LanguageSelector } from "./language-selector";
import { useState } from "react";
import { useTranslation } from "~/i18n/context";

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
const getNavItems = (_projectId: string, t: (key: string) => string) => [
  {
    name: t("products.title"),
    to: "/products",
    icon: Box,
    items: [
      {
        name: t("products.tubegai.name"),
        description: t("products.tubegai.description"),
        to: "/products",
        icon: Sparkles,
        featured: true,
      },
      // DISABLED: Phase 2+
      {
        name: t("products.pro.name"),
        description: t("products.pro.description"),
        to: "#",
        icon: Crown,
        disabled: true,
      },
      {
        name: t("products.plus.name"),
        description: t("products.plus.description"),
        to: "#",
        icon: Trophy,
        disabled: true,
      },
    ],
  },

  {
    name: t("projects.title"),
    to: "/projects",
    icon: FolderKanban,
    items: [
      {
        name: t("projects.dashboard.name"),
        description: t("projects.dashboard.description"),
        to: "/projects",
        featured: true,
        icon: LayoutDashboard,
      },
      {
        name: t("projects.newProject.name"),
        description: t("projects.newProject.description"),
        to: "/projects/new",
        icon: Plus,
      },
      // DISABLED: Phase 2+
      {
        name: t("projects.channels.name"),
        description: t("projects.channels.description"),
        to: "#",
        icon: Radio,
        disabled: true,
      },
      {
        name: t("projects.labels.name"),
        description: t("projects.labels.description"),
        to: "#",
        icon: Tag,
        disabled: true,
      },
    ],
  },
  {
    name: t("studio.title"),
    to: "/studio/script",
    icon: Clapperboard,
    items: [
      // MVP Features
      {
        name: t("studio.script.name"),
        description: t("studio.script.description"),
        to: "/studio/script",
        icon: FileText,
        featured: true,
      },
      {
        name: t("studio.storyboard.name"),
        description: t("studio.storyboard.description"),
        to: "/studio/storyboard",
        icon: Image,
        featured: true,
      },
      {
        name: t("studio.scene.name"),
        description: t("studio.scene.description"),
        to: "/studio/scene",
        icon: Film,
      },
      {
        name: t("studio.export.name"),
        description: t("studio.export.description"),
        to: "/studio/export",
        icon: Download,
      },
      // DISABLED: Phase 2+ Features
      {
        name: t("studio.dashboard.name"),
        description: t("studio.dashboard.description"),
        to: "#",
        icon: LayoutDashboard,
        disabled: true,
      },
      {
        name: t("studio.broll.name"),
        description: t("studio.broll.description"),
        to: "#",
        icon: Video,
        disabled: true,
      },
      {
        name: t("studio.subtitles.name"),
        description: t("studio.subtitles.description"),
        to: "#",
        icon: Captions,
        disabled: true,
      },
      {
        name: t("studio.coloring.name"),
        description: t("studio.coloring.description"),
        to: "#",
        icon: Palette,
        disabled: true,
      },
      {
        name: t("studio.thumbnail.name"),
        description: t("studio.thumbnail.description"),
        to: "#",
        icon: Image,
        disabled: true,
      },
      {
        name: t("studio.seo.name"),
        description: t("studio.seo.description"),
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
  const { t } = useTranslation("navigation");
  const navItems = getNavItems(projectId, t);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="w-full px-4 md:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-6">
            <MobileNavigation navItems={navItems} isOpen={isOpen} setIsOpen={setIsOpen} />
            <Link to="/">
              <span className="text-xl font-bold bg-linear-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent hidden sm:inline-block">
                {t("brand")}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <DesktopNavigation navItems={navItems} />
          </div>

          <div className="flex items-center space-x-2">
            <LanguageSelector />
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


