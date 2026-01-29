// =============================================================================
// Studio Feature Types
// =============================================================================

// ---------------------------
// Script Types
// ---------------------------
export type ScriptSegment = {
  id: string;
  type: "hook" | "intro" | "body" | "cta" | "outro";
  content: string;
  duration: number; // seconds
};

// ---------------------------
// Storyboard Types
// ---------------------------
export interface StoryboardScene {
  id: string;
  sceneNumber: number;
  description: string;
  visualPrompt: string;
  duration: number;
  imageUrl: string;
}

export interface StoryboardScriptSegment {
  id: string;
  order: number;
  content: string;
  scenes: StoryboardScene[];
}

// ---------------------------
// Scene Types
// ---------------------------
export interface VideoPart {
  id: string;
  duration: number;
  status: "pending" | "generating" | "completed" | "failed";
  url?: string;
}

export interface SceneVideo {
  sceneId: string;
  sceneNumber: number;
  description: string;
  thumbnailUrl: string;
  totalDuration: number;
  parts: VideoPart[];
}

export interface SceneScriptSegment {
  id: string;
  order: number;
  content: string;
  scenes: SceneVideo[];
}

// ---------------------------
// B-Roll Types
// ---------------------------
export interface StockVideo {
  id: string;
  thumbnail: string;
  duration: number;
  provider: "Pexels" | "Pixabay" | "Unsplash" | "Custom";
  title: string;
  url: string;
}

export interface BRollSceneContext {
  id: string;
  order: number;
  content: string;
  keyword: string;
  assignedVideo?: StockVideo;
}

export interface BRollColor {
  name: string;
  class: string;
}

// ---------------------------
// Subtitles Types
// ---------------------------
export interface SubtitleSegment {
  id: string;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
}

// ---------------------------
// Coloring Types
// ---------------------------
export interface ColorPreset {
  id: string;
  name: string;
  filter: string; // CSS filter string
  previewColor: string;
}

// ---------------------------
// Studio Project Types
// ---------------------------
export interface StudioProject {
  id: string;
  title: string;
  status: string;
  lastEdited: string;
  progress: number;
  channel: string;
  labels: string[];
}

export interface QuickAccessStep {
  id: string;
  label: string;
}
