// =============================================================================
// Ideation Hub Types
// =============================================================================

/**
 * AI-generated idea from trend analysis
 */
export interface GeneratedIdea {
  id: string;
  title: string;
  description: string;
  hooks: string[];
  targetAudience: string;
  estimatedViews: string;
  difficulty: "easy" | "medium" | "hard";
  basedOnTrend: string;
  trendId?: number;
}

/**
 * Saved idea in database
 */
export interface SavedIdea {
  id: string;
  userId: string;
  title: string;
  description: string;
  hooks: string[];
  targetAudience: string;
  estimatedViews: string;
  difficulty: "easy" | "medium" | "hard";
  basedOnTrend: string;
  trendId?: number;
  usedForProjectId?: string;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Ideation generation options/prompts
 */
export interface IdeationOptions {
  contentTone: ContentTone;
  videoType: VideoType;
  targetAudienceType: TargetAudienceType;
  ideaCount: number;
  customPrompt?: string;
}

export const CONTENT_TONES = [
  { value: "informative", label: "Informative", description: "Educational and fact-based content" },
  { value: "funny", label: "Funny", description: "Humorous and entertaining content" },
  { value: "dramatic", label: "Dramatic", description: "Engaging storytelling with tension" },
  { value: "casual", label: "Casual", description: "Relaxed, conversational style" },
  { value: "professional", label: "Professional", description: "Polished and authoritative" },
] as const;

export type ContentTone = (typeof CONTENT_TONES)[number]["value"];

export const VIDEO_TYPES = [
  { value: "short", label: "Short (< 1 min)", description: "Quick, punchy content for Shorts/Reels" },
  { value: "medium", label: "Medium (1-10 min)", description: "Standard YouTube video length" },
  { value: "long", label: "Long (10+ min)", description: "In-depth, comprehensive content" },
] as const;

export type VideoType = (typeof VIDEO_TYPES)[number]["value"];

export const TARGET_AUDIENCE_TYPES = [
  { value: "general", label: "General Audience", description: "Broad appeal for everyone" },
  { value: "young", label: "Young (13-24)", description: "Gen Z and young millennials" },
  { value: "adult", label: "Adult (25-44)", description: "Working professionals" },
  { value: "mature", label: "Mature (45+)", description: "Older, experienced viewers" },
  { value: "niche", label: "Niche Experts", description: "Specialized enthusiasts" },
] as const;

export type TargetAudienceType = (typeof TARGET_AUDIENCE_TYPES)[number]["value"];

export const DEFAULT_IDEATION_OPTIONS: IdeationOptions = {
  contentTone: "informative",
  videoType: "medium",
  targetAudienceType: "general",
  ideaCount: 3,
};

/**
 * Request to generate ideas from a trend
 */
export interface GenerateIdeasRequest {
  trendTitle: string;
  trendCategory: string;
  trendTags: string[];
  trendId?: number;
  options?: IdeationOptions;
}

/**
 * Available trend categories for filtering
 */
export const TREND_CATEGORIES = [
  "Entertainment",
  "Gaming",
  "Music",
  "Sports",
  "News",
  "Education",
  "Science & Tech",
  "Howto & Style",
  "Travel",
  "Comedy",
  "Film",
  "Autos",
  "Pets",
  "People & Blogs",
] as const;

export type TrendCategory = (typeof TREND_CATEGORIES)[number];
