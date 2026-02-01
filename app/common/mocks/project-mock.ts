// =============================================================================
// Project Feature Mock Data
// =============================================================================

// Re-export types from types file for backward compatibility
export type {
  RecentProject,
  Project,
  WorkflowStep,
  Channel,
  Label,
  TrendItem,
  ProjectDetail,
  LabelColor,
  AIRecommendation,
} from "../types/project.types";

import type {
  RecentProject,
  Project,
  Channel,
  Label,
  TrendItem,
  ProjectDetail,
  LabelColor,
} from "../types/project.types";

// =============================================================================
// Dashboard Mock Data
// =============================================================================

export const RECENT_PROJECTS: RecentProject[] = [
  {
    id: "1",
    name: "AI Revolution 2026",
    status: "In Progress",
    date: "2026-05-20",
    step: "Scripting",
    progress: 45,
  },
  {
    id: "2",
    name: "Tech Trends Q3",
    status: "Completed",
    date: "2026-05-18",
    step: "Done",
    progress: 100,
  },
  {
    id: "3",
    name: "Product Review: X1",
    status: "Draft",
    date: "2026-05-15",
    step: "Idea",
    progress: 10,
  },
  {
    id: "4",
    name: "Weekly Vlog #42",
    status: "In Progress",
    date: "2026-05-12",
    step: "Editing",
    progress: 75,
  },
];

// =============================================================================
// Project List Mock Data
// =============================================================================

export const PROJECTS: Project[] = [
  {
    id: "1",
    title: "AI Revolution 2026",
    status: "In Progress" as const,
    lastModified: "2026-05-20",
    progress: 45,
    thumbnail:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "2",
    title: "Tech Trends Q3 Review",
    status: "Completed" as const,
    lastModified: "2026-05-18",
    progress: 100,
    thumbnail:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
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
    thumbnail:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "5",
    title: "How to Code in 2026",
    status: "Processing" as const,
    lastModified: "2026-05-10",
    progress: 90,
    thumbnail:
      "https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=800",
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

// =============================================================================
// Project Detail Mock Data
// =============================================================================

export const PROJECT_DETAIL: ProjectDetail = {
  id: "1",
  title: "AI Automation in 2024",
  description:
    "A comprehensive guide on how AI tools are changing the landscape of automation in 2024. Covering innovative tools and practical applications.",
  status: "In Progress",
  progress: 35,
  thumbnail:
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
  channel: {
    name: "TubeGAI Official",
    avatar: "https://github.com/shadcn.png",
  },
  topic: "Technology",
  labels: [
    { name: "Urgent", color: "bg-red-500" },
    { name: "Marketing", color: "bg-purple-500" },
  ],
  createdAt: "Jan 12, 2024",
  updatedAt: "2 hours ago",
  size: "1.2 GB",
  duration: "10:05",
};

// =============================================================================
// New Project Form Mock Data
// =============================================================================

export const CHANNELS: Channel[] = [
  { id: "1", name: "TubeGAI Official", handle: "@tubegai_official" },
  { id: "2", name: "Alex's Vlog", handle: "@alex_vlog_daily" },
  { id: "3", name: "Tech Reviews", handle: "@tech_reviews_2024" },
];

export const LABELS: Label[] = [
  { id: "l1", name: "Urgent", color: "bg-red-500" },
  { id: "l2", name: "In Progress", color: "bg-blue-500" },
  { id: "l3", name: "Marketing", color: "bg-purple-500" },
  { id: "l4", name: "Tutorial", color: "bg-green-500" },
];

// =============================================================================
// Channels Page Mock Data
// =============================================================================

export const INITIAL_CHANNELS: Channel[] = [
  {
    id: "1",
    name: "TubeGAI Official",
    handle: "@tubegai_official",
    avatar: "https://github.com/shadcn.png",
    subscribers: "12.5K",
    videos: 42,
    status: "active",
    lastSynced: "Just now",
  },
  {
    id: "2",
    name: "Alex's Vlog",
    handle: "@alex_vlog_daily",
    avatar: "https://github.com/sungalex.png",
    subscribers: "1.2M",
    videos: 156,
    status: "error",
    lastSynced: "2 days ago",
  },
];

// =============================================================================
// Labels Page Mock Data
// =============================================================================

export const LABEL_COLORS: LabelColor[] = [
  { name: "Red", value: "bg-red-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Amber", value: "bg-amber-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Slate", value: "bg-slate-500" },
];

export const INITIAL_LABELS: Label[] = [
  {
    id: "1",
    name: "Urgent",
    color: "bg-red-500",
    description: "High priority tasks",
    projectCount: 5,
  },
  {
    id: "2",
    name: "In Progress",
    color: "bg-blue-500",
    description: "Currently working on",
    projectCount: 12,
  },
  {
    id: "3",
    name: "Review",
    color: "bg-amber-500",
    description: "Needs review",
    projectCount: 3,
  },
  {
    id: "4",
    name: "Marketing",
    color: "bg-purple-500",
    description: "Related to marketing campaigns",
    projectCount: 8,
  },
];

// =============================================================================
// Trend Analyzer Mock Data
// =============================================================================

export const TRENDS_DATA: TrendItem[] = [
  {
    id: 1,
    title: "AI Automation in 2026: What Changed?",
    category: "Tech & Science",
    views: "1.2M",
    growth: "+145%",
    thumbnail:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&q=80",
    tags: ["AI", "Future", "Automation"],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: 2,
    title: "Minimalist Desk Setup Tour",
    category: "Lifestyle",
    views: "850K",
    growth: "+89%",
    thumbnail:
      "https://images.unsplash.com/photo-1486946255434-2466348c2166?w=500&q=80",
    tags: ["Setup", "Productivity", "Desk"],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: 3,
    title: "Top 10 Hidden Gems in Japan",
    category: "Travel",
    views: "2.5M",
    growth: "+210%",
    thumbnail:
      "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=500&q=80",
    tags: ["Travel", "Japan", "Vlog"],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: 4,
    title: "How to Cook the Perfect Steak",
    category: "Food",
    views: "5.1M",
    growth: "+30%",
    thumbnail:
      "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500&q=80",
    tags: ["Cooking", "Foodie", "Recipe"],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: 5,
    title: "Beginner Guide to React 19",
    category: "Coding",
    views: "320K",
    growth: "+120%",
    thumbnail:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&q=80",
    tags: ["React", "Code", "WebDev"],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: 6,
    title: "5 Minute Morning Yoga Routine",
    category: "Health",
    views: "1.8M",
    growth: "+65%",
    thumbnail:
      "https://images.unsplash.com/photo-1544367563-12123d8959bd?w=500&q=80",
    tags: ["Yoga", "Wellness", "Morning"],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: 7,
    title: "Galaxy S30 Ultra Review",
    category: "Tech",
    views: "4.2M",
    growth: "+310%",
    thumbnail:
      "https://images.unsplash.com/photo-1610945265078-38584e274352?w=500&q=80",
    tags: ["Tech", "Mobile", "Review"],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: 8,
    title: "Street Photography Tips",
    category: "Photography",
    views: "750K",
    growth: "+40%",
    thumbnail:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=500&q=80",
    tags: ["Photo", "Art", "Street"],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
];

// =============================================================================
// AI Recommendation Mock Data
// =============================================================================

export const AI_RECOMMENDATIONS = [
  {
    title: "Day in the Life: AI Engineer",
    reason: "Matches your tech audience",
    growth: "+210%",
    description: "AI 엔지니어의 하루 일과를 따라가며 실제 업무 환경, 사용하는 도구들, 그리고 AI 개발의 현실적인 모습을 보여주는 콘텐츠입니다.",
    hooks: [
      "AI 엔지니어가 되고 싶은데 현실이 궁금하다면?",
      "ChatGPT 만드는 사람들은 하루를 어떻게 보낼까요?",
      "연봉 1억 AI 개발자의 24시간 밀착 취재"
    ],
    targetAudience: "개발자 지망생, IT 취준생",
    estimatedViews: "50K-100K",
  },
  {
    title: "Home Office Makeover 2026",
    reason: "Highly requested topic",
    growth: "+85%",
    description: "2026년 최신 트렌드를 반영한 홈 오피스 인테리어 가이드. 생산성을 높이는 데스크 셋업과 필수 가젯을 소개합니다.",
    hooks: [
      "재택근무 3년차가 알려주는 최적의 홈오피스 셋업",
      "100만원으로 완성하는 프로 유튜버급 데스크 환경",
      "집중력 200% 올리는 홈오피스 필수템 TOP 10"
    ],
    targetAudience: "재택근무자, 프리랜서",
    estimatedViews: "30K-70K",
  },
  {
    title: "React vs Vue: The Final Battle",
    reason: "Trending in Dev Community",
    growth: "+340%",
    description: "2026년 기준으로 React와 Vue를 철저하게 비교 분석합니다. 성능, 생태계, 취업시장, 학습 곡선까지 모든 것을 다룹니다.",
    hooks: [
      "React 개발자들이 Vue를 무시하는 진짜 이유",
      "2026년 프론트엔드 프레임워크 최종 승자는?",
      "3년차 개발자가 말하는 React vs Vue 현실 비교"
    ],
    targetAudience: "웹 개발자, 프론트엔드 입문자",
    estimatedViews: "80K-150K",
  },
];
