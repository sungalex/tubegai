// =============================================================================
// Project Feature Types
// =============================================================================

export interface RecentProject {
  id: string;
  name: string;
  status: string;
  date: string;
  step: string;
  progress: number;
}

export interface Project {
  id: string;
  title: string;
  thumbnail?: string;
  status: "Draft" | "In Progress" | "Completed" | "Processing";
  lastModified: string;
  progress: number;
}

export interface WorkflowStep {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status: string;
}

export interface Channel {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  subscribers?: string;
  videos?: number;
  status?: "active" | "error";
  lastSynced?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
  projectCount?: number;
}

export interface TrendItem {
  id: number;
  title: string;
  category: string;
  views: string;
  growth: string;
  thumbnail: string;
  tags: string[];
  videoUrl?: string;
}

export interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  thumbnail: string;
  channel: {
    name: string;
    avatar: string;
  };
  topic: string;
  labels: Array<{ name: string; color: string }>;
  createdAt: string;
  updatedAt: string;
  size: string;
  duration: string;
}

export interface LabelColor {
  name: string;
  value: string;
}

export interface AIRecommendation {
  title: string;
  reason: string;
  growth: string;
}
