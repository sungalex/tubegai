// =============================================================================
// TrendTube Types - Studio Dashboard Pipeline (7-Step)
// =============================================================================

// ---------------------------
// Pipeline Status
// ---------------------------
export type TrendTubePipelineStatus =
  | "pending"
  | "extracting"
  | "generating_ideas"
  | "generating_media"
  | "compositing"
  | "completed"
  | "failed";

export type TrendTubeMediaType =
  | "video_image"
  | "background_music"
  | "voiceover"
  | "generated_video"
  | "composited_video";

export type TrendTubeVoiceOption =
  | "male_ko"
  | "female_ko"
  | "male_en"
  | "female_en";

// ---------------------------
// Input
// ---------------------------
export interface TrendTubeInput {
  projectId: string;
  trendsUrl: string;
  userIdea: string;
  referenceImageUrl?: string;
  voiceOption?: TrendTubeVoiceOption;
}

// ---------------------------
// Session
// ---------------------------
export interface TrendTubeSession {
  id: string;
  projectId: string;
  userId: string;
  trendsUrl: string;
  userIdea: string;
  referenceImageUrl?: string | null;
  voiceOption: string;
  status: TrendTubePipelineStatus;
  currentStep: number;
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
  result?: TrendTubeResult | null;
  media?: TrendTubeMediaItem[];
}

// ---------------------------
// Result (text outputs)
// ---------------------------
export interface TrendTubeResult {
  id: string;
  sessionId: string;
  extractedTrends?: string | null;
  videoIdeas?: string | null;
  narrationScript?: string | null;
  createdAt: string;
}

// ---------------------------
// Media
// ---------------------------
export interface TrendTubeMediaItem {
  id: string;
  sessionId: string;
  mediaType: TrendTubeMediaType;
  mediaAssetId?: string | null;
  publicUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

// ---------------------------
// Step IO (AI Input / Output per step)
// ---------------------------
export interface TrendTubeStepIO {
  type: "text" | "video" | "audio" | "mixed";
  label: string;
  text?: string;
  textPreview?: string;
  mediaUrl?: string;
  mediaDuration?: number;
  items?: TrendTubeStepIO[];
}

// ---------------------------
// Pipeline Step
// ---------------------------
export interface TrendTubePipelineStep {
  step: number;
  name: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  input?: TrendTubeStepIO;
  output?: TrendTubeStepIO;
  error?: string;
}

// ---------------------------
// SSE Stream Events
// ---------------------------
export type TrendTubeStreamEvent =
  | { type: "pipeline_start"; sessionId: string }
  | { type: "step_start"; step: number; stepName: string; total: number; input?: TrendTubeStepIO }
  | { type: "step_progress"; step: number; text: string }
  | { type: "step_complete"; step: number; stepName: string; output?: TrendTubeStepIO }
  | { type: "pipeline_complete"; sessionId: string; results: TrendTubeResults }
  | { type: "pipeline_error"; step: number; error: string };

// ---------------------------
// Full Results (for display)
// ---------------------------
export interface TrendTubeResults {
  extractedTrends: string;
  videoIdeas: string;
  narrationScript: string;
  videoUrl?: string;
  musicUrl?: string;
  musicDuration?: number;
  voiceoverUrl?: string;
  voiceoverDuration?: number;
  compositedVideoUrl?: string;
  compositedDuration?: number;
}
