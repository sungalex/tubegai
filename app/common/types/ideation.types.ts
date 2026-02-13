// =============================================================================
// Ideation Hub Types (Unified)
// =============================================================================

/**
 * Idea source type - distinguishes AI-generated vs user-created ideas
 */
export type IdeaSource = "ai_generated" | "user_created";

/**
 * Idea difficulty level
 */
export type IdeaDifficulty = "easy" | "medium" | "hard";

/**
 * Trend reference in idea (from junction table)
 */
export interface IdeaTrend {
  trendId: string;
  isPrimary: boolean;
  trend?: {
    id: string;
    title: string;
    category: string;
    thumbnailUrl?: string;
  };
}

/**
 * Unified Idea interface
 * Combines SavedIdea and AIRecommendation into a single type.
 *
 * - source: Distinguishes AI-generated vs user-created ideas
 * - isSaved: When AI idea is bookmarked, this becomes true
 * - expiresAt: AI ideas expire after 24h unless saved
 * - trends: Related trends via junction table (replaces basedOnTrends/trendId)
 */
export interface Idea {
  id: string;
  userId: string;

  // Core content
  title: string;
  description?: string;
  hooks: string[];
  targetAudience?: string;
  estimatedViews?: string;
  difficulty?: IdeaDifficulty;
  referenceUrl?: string;

  // Source tracking
  source: IdeaSource;
  trends: IdeaTrend[]; // Replaces basedOnTrends and trendId

  // AI-specific fields (optional for user_created)
  reason?: string;
  growthRate?: string;
  score?: number;
  // Changed to arrays to support multiple tones/types from AI
  contentTones?: string[];
  videoTypes?: string[];
  category?: string;

  // State management
  isSaved: boolean;
  isUsed: boolean;
  usedForProjectId?: string;

  // Expiration
  expiresAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new idea
 */
export interface CreateIdeaInput {
  title: string;
  description?: string;
  hooks?: string[];
  targetAudience?: string;
  estimatedViews?: string;
  difficulty?: IdeaDifficulty;
  source: IdeaSource;
  trendIds?: string[]; // UUIDs of related trends
  reason?: string;
  growthRate?: string;
  score?: number;
  contentTones?: string[];
  videoTypes?: string[];
  category?: string;
  referenceUrl?: string;
}

/**
 * Input for updating an existing idea
 */
export interface UpdateIdeaInput {
  title?: string;
  description?: string;
  hooks?: string[];
  targetAudience?: string;
  estimatedViews?: string;
  difficulty?: IdeaDifficulty;
}

/**
 * Filter options for querying ideas
 */
export interface IdeaFilter {
  source?: IdeaSource;
  isSaved?: boolean;
  includeExpired?: boolean;
}

// =============================================================================
// Legacy Types (Backward Compatibility)
// =============================================================================

/**
 * @deprecated Use Idea with source='user_created' instead
 */
export interface GeneratedIdea {
  id: string;
  title: string;
  description: string;
  hooks: string[];
  targetAudience: string;
  estimatedViews: string;
  difficulty: IdeaDifficulty;
  basedOnTrend: string;
  trendId?: number;
}

/**
 * @deprecated Use Idea instead
 */
export interface SavedIdea {
  id: string;
  userId: string;
  title: string;
  description: string;
  hooks: string[];
  targetAudience: string;
  estimatedViews: string;
  difficulty: IdeaDifficulty;
  basedOnTrend: string;
  trendId?: number;
  usedForProjectId?: string;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert legacy SavedIdea to unified Idea
 */
export function savedIdeaToIdea(savedIdea: SavedIdea): Idea {
  return {
    ...savedIdea,
    source: "user_created",
    trends: savedIdea.trendId
      ? [{ trendId: savedIdea.trendId.toString(), isPrimary: true }]
      : [],
    isSaved: true,
    hooks: savedIdea.hooks || [],
  };
}

/**
 * Convert Idea to legacy SavedIdea format
 */
export function ideaToSavedIdea(idea: Idea): SavedIdea {
  const primaryTrend = idea.trends.find((t) => t.isPrimary) || idea.trends[0];
  return {
    id: idea.id,
    userId: idea.userId,
    title: idea.title,
    description: idea.description || "",
    hooks: idea.hooks,
    targetAudience: idea.targetAudience || "",
    estimatedViews: idea.estimatedViews || "",
    difficulty: idea.difficulty || "medium",
    basedOnTrend: primaryTrend?.trend?.title || "",
    trendId: primaryTrend ? parseInt(primaryTrend.trendId, 10) : undefined,
    usedForProjectId: idea.usedForProjectId,
    isUsed: idea.isUsed,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
  };
}

/**
 * Get trend titles from idea (helper for display)
 */
export function getIdeaTrendTitles(idea: Idea): string[] {
  return idea.trends
    .filter((t) => t.trend?.title)
    .map((t) => t.trend!.title);
}

/**
 * Get primary trend from idea
 */
export function getPrimaryTrend(idea: Idea): IdeaTrend | undefined {
  return idea.trends.find((t) => t.isPrimary) || idea.trends[0];
}

/**
 * Ideation generation options/prompts
 */
export interface IdeationOptions {
  language: IdeationLanguage;
  contentTone: ContentTone;
  videoType: VideoType;
  targetAudienceType: TargetAudienceType;
  ideaCount: number;
  customPrompt?: string;
}

export const IDEATION_LANGUAGES = [
  { value: "ko", label: "한국어", description: "Korean" },
  { value: "en", label: "English", description: "영어" },
] as const;

export type IdeationLanguage = (typeof IDEATION_LANGUAGES)[number]["value"];

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
  language: "ko",
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
