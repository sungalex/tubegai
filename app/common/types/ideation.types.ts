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
 * Request to generate ideas from a trend
 */
export interface GenerateIdeasRequest {
  trendTitle: string;
  trendCategory: string;
  trendTags: string[];
  trendId?: number;
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
