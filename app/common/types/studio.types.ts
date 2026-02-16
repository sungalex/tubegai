// =============================================================================
// Studio Feature Types
// =============================================================================

// ---------------------------
// Script Types
// ---------------------------

/**
 * Scene hint for storyboard generation
 * Each segment can suggest multiple scenes for visual breakdown
 */
export interface SceneHint {
  description: string;      // Brief scene description
  visualPrompt: string;     // AI image/video generation prompt
  duration: number;         // Suggested duration in seconds
  cameraAngle?: string;     // Optional: "wide", "close-up", "medium", "pov"
}

/**
 * Script segment with enhanced metadata for storyboard/scene generation
 */
export type ScriptSegment = {
  id: string;
  type: "hook" | "intro" | "body" | "cta" | "outro";
  content: string;
  duration: number; // seconds

  // Enhanced metadata for storyboard/scene generation
  visualNotes?: string;      // Overall visual direction for this segment
  sceneHints?: SceneHint[];  // Suggested scene breakdowns
  keywords?: string[];       // Keywords for B-roll search
  emotionalTone?: string;    // Emotional tone: "exciting", "calm", "dramatic", etc.
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
// Session Types
// ---------------------------
export interface StudioSession {
  id: string;
  projectId: string;
  userId: string;
  version: number;
  status: "active" | "archived";
  name: string | null;
  createdAt: string;
  archivedAt: string | null;
}

// ---------------------------
// Storyboard Scene (with session metadata)
// ---------------------------
export interface StoryboardSceneWithImage extends StoryboardScene {
  emotionalTone?: string;
  cameraAngle?: string;
  imageAssetId?: string;
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
