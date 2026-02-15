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
import type { UserInfo } from "~/root";

interface NavigationProps {
  user: UserInfo | null;
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
    name: "제품",
    to: "/products",
    icon: Box,
    items: [
      {
        name: "TubeGAI",
        description: "표준 통합 크리에이터 워크플로우 솔루션.",
        to: "/products",
        icon: Sparkles,
        featured: true,
      },
      // DISABLED: Phase 2+
      {
        name: "TubeGAI Pro",
        description: "출시 예정 - 고급 분석 기능.",
        to: "#",
        icon: Crown,
        disabled: true,
      },
      {
        name: "TubeGAI Plus",
        description: "출시 예정 - 기업용 솔루션.",
        to: "#",
        icon: Trophy,
        disabled: true,
      },
    ],
  },

  {
    name: "프로젝트",
    to: "/projects",
    icon: FolderKanban,
    items: [
      {
        name: "프로젝트 대시보드",
        description: "크리에이티브 워크플로우와 제작을 관리하세요.",
        to: "/projects",
        featured: true,
        icon: LayoutDashboard,
      },
      {
        name: "새 프로젝트",
        description: "새로운 비디오 프로젝트를 시작하세요.",
        to: "/projects/new",
        icon: Plus,
      },
      {
        name: "채널",
        description: "YouTube 채널 관리.",
        to: "/projects/channels",
        icon: Radio,
      },
      // DISABLED: Phase 2+
      {
        name: "라벨",
        description: "출시 예정 - 프로젝트 분류.",
        to: "#",
        icon: Tag,
        disabled: true,
      },
    ],
  },
  {
    name: "스튜디오",
    to: "/studio/dashboard",
    icon: Clapperboard,
    items: [
      // MVP Features
      {
        name: "스튜디오 대시보드",
        description: "One Stop 제작 파이프라인 - TrendTube",
        to: "/studio/dashboard",
        icon: LayoutDashboard,
        featured: true,
      },
      {
        name: "스크립트",
        description: "AI로 비디오 스크립트를 작성하고 편집하세요.",
        to: "/studio/script",
        icon: FileText,
      },
      {
        name: "스토리보드",
        description: "장면과 샷을 시각화하세요.",
        to: "/studio/storyboard",
        icon: Image,
      },
      {
        name: "씬",
        description: "환경과 에셋을 설정하세요.",
        to: "/studio/scene",
        icon: Film,
      },
      // DISABLED: Phase 2+ Features
      {
        name: "B-Roll",
        description: "출시 예정 - 스톡 영상.",
        to: "#",
        icon: Video,
        disabled: true,
      },
      {
        name: "자막",
        description: "출시 예정 - 자막 생성.",
        to: "#",
        icon: Captions,
        disabled: true,
      },
      {
        name: "색보정",
        description: "출시 예정 - 컬러 그레이딩.",
        to: "#",
        icon: Palette,
        disabled: true,
      },
      {
        name: "썸네일",
        description: "출시 예정 - 썸네일 디자이너.",
        to: "#",
        icon: Image,
        disabled: true,
      },
      {
        name: "SEO",
        description: "출시 예정 - 검색 최적화.",
        to: "#",
        icon: Search,
        disabled: true,
      },
      {
        name: "내보내기",
        description: "최종 비디오를 렌더링하고 다운로드하세요.",
        to: "/studio/export",
        icon: Download,
      },
    ],
  },
];

export default function Navigation({
  user,
  hasNotifications,
  hasMessages,
}: NavigationProps) {
  const params = useParams();
  const projectId = params.projectId || "1";
  const navItems = getNavItems(projectId);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="w-full px-4 md:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-6">
            <MobileNavigation
              navItems={navItems}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
            />
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
              user={user}
              hasNotifications={hasNotifications}
              hasMessages={hasMessages}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
