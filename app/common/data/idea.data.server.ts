// =============================================================================
// Unified Idea Data Access Layer (Server-side)
// =============================================================================
// Combines AI recommendation and saved idea functionality into a single layer.
// Uses the unified 'idea' table with source discrimination.

import { desc, eq, and, or, gt, lt, isNull, count, sql, ilike } from "drizzle-orm";
import { db, schema } from "~/lib/db.server";
import {
  generateAIRecommendations,
  type AIGeneratedRecommendation,
} from "~/lib/ai/recommendations.server";
import type {
  Idea,
  IdeaSource,
  IdeaDifficulty,
  IdeaFilter,
  CreateIdeaInput,
  UpdateIdeaInput,
  GeneratedIdea,
  GenerateIdeasRequest,
  IdeationOptions,
  IdeaTrend,
} from "../types/ideation.types";
import { DEFAULT_IDEATION_OPTIONS } from "../types/ideation.types";
import type { TrendItem } from "../types/project.types";

// Type for idea with relations from Drizzle query
type IdeaWithRelations = typeof schema.ideas.$inferSelect & {
  ideaTrends?: Array<{
    trendId: string;
    isPrimary: boolean;
    trend?: {
      id: string;
      title: string;
      category: string;
      thumbnailUrl: string | null;
    };
  }>;
};

// =============================================================================
// Constants
// =============================================================================

const RECOMMENDATION_EXPIRE_HOURS = 24;
const MAX_RECOMMENDATIONS_PER_USER = 10;
const MAX_IDEAS_PER_PAGE = 20;

// =============================================================================
// Type Helpers
// =============================================================================

/**
 * Convert database row to Idea type
 */
function dbRowToIdea(row: IdeaWithRelations): Idea {
  // Convert ideaTrends relation to IdeaTrend array
  const trends: IdeaTrend[] = (row.ideaTrends ?? []).map((it) => ({
    trendId: it.trendId,
    isPrimary: it.isPrimary,
    trend: it.trend
      ? {
          id: it.trend.id,
          title: it.trend.title,
          category: it.trend.category,
          thumbnailUrl: it.trend.thumbnailUrl ?? undefined,
        }
      : undefined,
  }));

  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description ?? undefined,
    hooks: row.hooks ?? [],
    targetAudience: row.targetAudience ?? undefined,
    estimatedViews: row.estimatedViews ?? undefined,
    difficulty: row.difficulty as IdeaDifficulty | undefined,
    source: row.source as IdeaSource,
    trends,
    reason: row.reason ?? undefined,
    growthRate: row.growthRate ?? undefined,
    score: row.score ?? undefined,
    contentTones: row.contentTones ?? [],
    videoTypes: row.videoTypes ?? [],
    category: row.category ?? undefined,
    referenceUrl: row.referenceUrl ?? undefined,
    isSaved: row.isSaved,
    isUsed: row.isUsed,
    usedForProjectId: row.usedForProjectId ?? undefined,
    expiresAt: row.expiresAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// =============================================================================
// Read Operations
// =============================================================================

/**
 * Get ideas for a user with optional filtering
 */
export async function getIdeas(
  userId: string,
  filter?: IdeaFilter
): Promise<Idea[]> {
  const conditions = [eq(schema.ideas.userId, userId)];

  if (filter?.source) {
    conditions.push(eq(schema.ideas.source, filter.source));
  }

  if (filter?.isSaved !== undefined) {
    conditions.push(eq(schema.ideas.isSaved, filter.isSaved));
  }

  // Exclude expired AI recommendations unless requested
  if (!filter?.includeExpired) {
    conditions.push(
      or(
        isNull(schema.ideas.expiresAt),
        gt(schema.ideas.expiresAt, new Date())
      )!
    );
  }

  const ideas = await db.query.ideas.findMany({
    where: and(...conditions),
    orderBy: [desc(schema.ideas.createdAt)],
    limit: MAX_IDEAS_PER_PAGE,
    with: {
      ideaTrends: {
        with: {
          trend: true,
        },
      },
    },
  });

  return ideas.map(dbRowToIdea);
}

/**
 * Get saved ideas for a user (convenience method)
 */
export async function getSavedIdeas(userId: string): Promise<Idea[]> {
  return getIdeas(userId, { isSaved: true });
}

/**
 * Get AI-generated recommendations for a user (convenience method)
 */
export async function getAIRecommendations(userId: string): Promise<Idea[]> {
  return getIdeas(userId, { source: "ai_generated", isSaved: false });
}

/**
 * Get a single idea by ID
 */
export async function getIdeaById(
  userId: string,
  ideaId: string
): Promise<Idea | null> {
  const idea = await db.query.ideas.findFirst({
    where: and(eq(schema.ideas.id, ideaId), eq(schema.ideas.userId, userId)),
    with: {
      ideaTrends: {
        with: {
          trend: true,
        },
      },
    },
  });

  return idea ? dbRowToIdea(idea) : null;
}

/**
 * Get ideas count for a user
 */
export async function getIdeasCount(
  userId: string,
  filter?: IdeaFilter
): Promise<number> {
  const conditions = [eq(schema.ideas.userId, userId)];

  if (filter?.source) {
    conditions.push(eq(schema.ideas.source, filter.source));
  }

  if (filter?.isSaved !== undefined) {
    conditions.push(eq(schema.ideas.isSaved, filter.isSaved));
  }

  if (!filter?.includeExpired) {
    conditions.push(
      or(
        isNull(schema.ideas.expiresAt),
        gt(schema.ideas.expiresAt, new Date())
      )!
    );
  }

  const [result] = await db
    .select({ count: count() })
    .from(schema.ideas)
    .where(and(...conditions));

  return result?.count ?? 0;
}

/**
 * Search ideas by keyword across text fields
 * Searches: title, description, hooks (array), and related trend titles
 */
export async function searchIdeas(
  userId: string,
  query: string,
  filter?: IdeaFilter
): Promise<Idea[]> {
  if (!query.trim()) {
    return getIdeas(userId, filter);
  }

  const searchPattern = `%${query.trim()}%`;

  // Build base conditions
  const conditions = [eq(schema.ideas.userId, userId)];

  if (filter?.source) {
    conditions.push(eq(schema.ideas.source, filter.source));
  }

  if (filter?.isSaved !== undefined) {
    conditions.push(eq(schema.ideas.isSaved, filter.isSaved));
  }

  if (!filter?.includeExpired) {
    conditions.push(
      or(
        isNull(schema.ideas.expiresAt),
        gt(schema.ideas.expiresAt, new Date())
      )!
    );
  }

  // Search across text fields and arrays
  // For trend titles, we use a subquery to check related trends
  const searchCondition = or(
    ilike(schema.ideas.title, searchPattern),
    ilike(schema.ideas.description, searchPattern),
    sql`array_to_string(${schema.ideas.hooks}, ' ') ILIKE ${searchPattern}`,
    // Search in related trend titles via junction table
    sql`EXISTS (
      SELECT 1 FROM public.idea_trend it
      JOIN public.trend t ON t.id = it.trend_id
      WHERE it.idea_id = ${schema.ideas.id}
      AND t.title ILIKE ${searchPattern}
    )`
  );

  conditions.push(searchCondition!);

  const ideas = await db.query.ideas.findMany({
    where: and(...conditions),
    orderBy: [desc(schema.ideas.createdAt)],
    limit: MAX_IDEAS_PER_PAGE,
    with: {
      ideaTrends: {
        with: {
          trend: true,
        },
      },
    },
  });

  return ideas.map(dbRowToIdea);
}

// =============================================================================
// Write Operations
// =============================================================================

/**
 * Create a new idea (user-created)
 */
export async function createIdea(
  userId: string,
  input: CreateIdeaInput
): Promise<Idea> {
  const [idea] = await db
    .insert(schema.ideas)
    .values({
      userId,
      title: input.title,
      description: input.description,
      hooks: input.hooks ?? [],
      targetAudience: input.targetAudience,
      estimatedViews: input.estimatedViews,
      difficulty: input.difficulty,
      source: input.source,
      reason: input.reason,
      growthRate: input.growthRate,
      score: input.score,
      contentTones: input.contentTones ?? [],
      videoTypes: input.videoTypes ?? [],
      category: input.category,
      referenceUrl: input.referenceUrl,
      isSaved: input.source === "user_created", // User-created ideas are saved by default
      isUsed: false,
    })
    .returning();

  // Insert trend relationships into junction table
  if (input.trendIds && input.trendIds.length > 0) {
    await db.insert(schema.ideaTrends).values(
      input.trendIds.map((trendId, idx) => ({
        ideaId: idea.id,
        trendId,
        isPrimary: idx === 0,
      }))
    );
  }

  // Fetch the idea with relations
  return (await getIdeaById(userId, idea.id))!;
}

/**
 * Update an existing idea
 */
export async function updateIdea(
  userId: string,
  ideaId: string,
  updates: UpdateIdeaInput
): Promise<Idea | null> {
  const result = await db
    .update(schema.ideas)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.ideas.id, ideaId), eq(schema.ideas.userId, userId)))
    .returning({ id: schema.ideas.id });

  if (result.length === 0) return null;

  // Fetch the idea with relations
  return getIdeaById(userId, ideaId);
}

/**
 * Save an AI recommendation (bookmark it)
 * This marks the idea as saved and removes expiration
 */
export async function saveIdea(userId: string, ideaId: string): Promise<Idea | null> {
  const result = await db
    .update(schema.ideas)
    .set({
      isSaved: true,
      expiresAt: null, // Remove expiration when saved
      updatedAt: new Date(),
    })
    .where(and(eq(schema.ideas.id, ideaId), eq(schema.ideas.userId, userId)))
    .returning({ id: schema.ideas.id });

  if (result.length === 0) return null;

  // Fetch the idea with relations
  return getIdeaById(userId, ideaId);
}

/**
 * Mark an idea as used for a project
 */
export async function markIdeaAsUsed(
  userId: string,
  ideaId: string,
  projectId: string
): Promise<boolean> {
  const result = await db
    .update(schema.ideas)
    .set({
      isUsed: true,
      usedForProjectId: projectId,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.ideas.id, ideaId), eq(schema.ideas.userId, userId)))
    .returning({ id: schema.ideas.id });

  return result.length > 0;
}

/**
 * Delete an idea
 */
export async function deleteIdea(
  userId: string,
  ideaId: string
): Promise<boolean> {
  const result = await db
    .delete(schema.ideas)
    .where(and(eq(schema.ideas.id, ideaId), eq(schema.ideas.userId, userId)))
    .returning({ id: schema.ideas.id });

  return result.length > 0;
}

// =============================================================================
// AI Recommendation Generation
// =============================================================================

/**
 * Get AI recommendations for a user, generating new ones if needed
 */
export async function getAIRecommendationsForUser(
  userId: string,
  trends: TrendItem[],
  options?: {
    forceRefresh?: boolean;
    count?: number;
    language?: "ko" | "en";
  }
): Promise<Idea[]> {
  const { forceRefresh = false, count: requestedCount = 3, language = "ko" } = options ?? {};

  // Check for valid cached recommendations
  if (!forceRefresh) {
    try {
      const cached = await getIdeas(userId, { source: "ai_generated", isSaved: false });
      if (cached.length >= requestedCount) {
        return cached.slice(0, requestedCount);
      }
    } catch (error) {
      console.error("Failed to fetch cached recommendations:", error);
    }
  }

  // Generate new recommendations via Gemini
  let generated: AIGeneratedRecommendation[] = [];
  try {
    generated = await generateAIRecommendations({
      trends,
      count: requestedCount,
      language,
    });
  } catch (error) {
    console.error("Failed to generate AI recommendations:", error);
    // Return existing cached recommendations or empty array
    return getIdeas(userId, { source: "ai_generated", isSaved: false });
  }

  if (generated.length === 0) {
    return getIdeas(userId, { source: "ai_generated", isSaved: false });
  }

  // Save generated recommendations to database
  try {
    await saveGeneratedRecommendations(userId, generated, trends);
  } catch (error) {
    console.error("Failed to save recommendations:", error);
  }

  // Return the newly generated ideas
  return getIdeas(userId, { source: "ai_generated", isSaved: false });
}

// Valid values for content tones and video types
const VALID_CONTENT_TONES = ["informative", "funny", "dramatic", "casual", "professional"];
const VALID_VIDEO_TYPES = ["short", "medium", "long"];

/**
 * Extract all valid values from a potentially comma-separated string
 */
function parseContentTones(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((c) => VALID_CONTENT_TONES.includes(c));
}

function parseVideoTypes(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((c) => VALID_VIDEO_TYPES.includes(c));
}

/**
 * Save AI-generated recommendations to the database
 */
async function saveGeneratedRecommendations(
  userId: string,
  recommendations: AIGeneratedRecommendation[],
  inputTrends: TrendItem[]
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + RECOMMENDATION_EXPIRE_HOURS);

  // Build a map of trend titles to UUIDs for matching
  const trendTitleToUuid = new Map(
    inputTrends
      .filter((t) => t.trendUuid)
      .map((t) => [t.title.toLowerCase(), t.trendUuid!])
  );

  // Build a map of trend titles to videoUrls
  const trendTitleToVideoUrl = new Map(
    inputTrends
      .filter((t) => t.videoUrl)
      .map((t) => [t.title.toLowerCase(), t.videoUrl!])
  );

  // Insert new recommendations
  for (const rec of recommendations) {
    // Parse and validate values (AI may return comma-separated values)
    const contentTones = parseContentTones(rec.contentTone);
    const videoTypes = parseVideoTypes(rec.videoType);

    // Get reference URL from primary trend
    const primaryTrendTitle = (rec.basedOnTrends ?? [])[0]?.toLowerCase();
    const referenceUrl = primaryTrendTitle
      ? trendTitleToVideoUrl.get(primaryTrendTitle)
      : undefined;

    const [idea] = await db
      .insert(schema.ideas)
      .values({
        userId,
        title: rec.title,
        description: rec.description,
        hooks: rec.hooks ?? [],
        targetAudience: rec.targetAudience,
        estimatedViews: rec.estimatedViews,
        difficulty: rec.difficulty as IdeaDifficulty,
        source: "ai_generated",
        reason: rec.reason,
        growthRate: rec.growthRate,
        score: rec.score,
        contentTones,
        videoTypes,
        category: contentTones[0], // Use first contentTone as category
        referenceUrl,
        isSaved: false,
        isUsed: false,
        expiresAt,
      })
      .returning();

    // Match basedOnTrends titles to trend UUIDs and insert into junction table
    const matchedTrends = (rec.basedOnTrends ?? [])
      .map((title, idx) => ({
        title: title.toLowerCase(),
        isPrimary: idx === 0,
        trendId: trendTitleToUuid.get(title.toLowerCase()),
      }))
      .filter((t): t is { title: string; isPrimary: boolean; trendId: string } =>
        t.trendId !== undefined
      );

    if (matchedTrends.length > 0) {
      await db.insert(schema.ideaTrends).values(
        matchedTrends.map((t) => ({
          ideaId: idea.id,
          trendId: t.trendId,
          isPrimary: t.isPrimary,
        }))
      );
    }
  }
}

/**
 * Refresh AI recommendations (force regeneration)
 */
export async function refreshAIRecommendations(
  userId: string,
  trends: TrendItem[],
  language: "ko" | "en" = "ko"
): Promise<Idea[]> {
  return getAIRecommendationsForUser(userId, trends, {
    forceRefresh: true,
    count: 3,
    language,
  });
}

// =============================================================================
// Cleanup Operations
// =============================================================================

/**
 * Delete expired AI recommendations that haven't been saved
 */
export async function cleanupExpiredIdeas(): Promise<number> {
  const now = new Date();

  const result = await db
    .delete(schema.ideas)
    .where(
      and(
        eq(schema.ideas.source, "ai_generated"),
        eq(schema.ideas.isSaved, false),
        lt(schema.ideas.expiresAt, now)
      )
    )
    .returning({ id: schema.ideas.id });

  return result.length;
}

// =============================================================================
// Legacy Compatibility - Idea Generation from Trend
// =============================================================================
// These functions maintain compatibility with the old ideation workflow

// Template type definition
type IdeaTemplate = {
  titleTemplate: string;
  descTemplate: string;
  hooksTemplate: string[];
  difficulty: IdeaDifficulty;
};

// Idea templates - Korean
const IDEA_TEMPLATES_KO: Record<string, IdeaTemplate[]> = {
  informative: [
    {
      titleTemplate: "{trend} 완벽 가이드 & 분석",
      descTemplate: "{trend}에 대해 알아야 할 모든 것을 팩트, 데이터, 전문가 인사이트와 함께 종합적으로 분석합니다.",
      hooksTemplate: [
        "{trend}에 대해 알아야 할 모든 것, 이 영상 하나로 정리",
        "전문가들이 추천하는 {trend} 완벽 가이드",
        "{trend}를 20시간 동안 연구한 결과를 공개합니다",
      ],
      difficulty: "medium",
    },
  ],
  funny: [
    {
      titleTemplate: "{trend} 웃기게 만들어봤습니다",
      descTemplate: "{trend}에 대한 코믹한 해석. 웃긴 코멘터리, 밈, 예상치 못한 반전으로 시청자들을 웃게 만듭니다.",
      hooksTemplate: [
        "{trend} 해봤는데 대참사였습니다...",
        "POV: {trend}를 방금 발견한 당신",
      ],
      difficulty: "easy",
    },
  ],
  dramatic: [
    {
      titleTemplate: "{trend}의 숨겨진 진실",
      descTemplate: "{trend}에 대한 드라마틱한 조사. 주류 언론이 놓친 숨겨진 이야기와 충격적인 폭로를 다룹니다.",
      hooksTemplate: [
        "그들이 당신에게 알려주지 않는 {trend}의 진실",
        "{trend} 뒤에 숨겨진 이야기",
      ],
      difficulty: "hard",
    },
  ],
  casual: [
    {
      titleTemplate: "{trend}에 대해 이야기해봐요",
      descTemplate: "{trend}에 대한 편안하고 대화하듯한 영상. 생각을 공유하고, 실시간으로 반응하며, 시청자들과 진정성 있게 소통합니다.",
      hooksTemplate: [
        "{trend} 생겼는데 할 말이 있어요",
        "쉬면서 {trend}에 대해 수다 떨기",
      ],
      difficulty: "easy",
    },
  ],
  professional: [
    {
      titleTemplate: "{trend}: 전문가 분석",
      descTemplate: "프로페셔널한 제작 퀄리티와 전문가 수준의 인사이트로 {trend}를 권위 있게 분석합니다.",
      hooksTemplate: [
        "{trend} 전문가 분석",
        "{category} 전문가들이 {trend}에 대해 생각하는 것",
      ],
      difficulty: "hard",
    },
  ],
};

// View estimates based on video type
const VIEW_ESTIMATES: Record<string, Record<string, string>> = {
  short: { easy: "100K-500K", medium: "50K-200K", hard: "30K-100K" },
  medium: { easy: "30K-80K", medium: "50K-150K", hard: "80K-200K" },
  long: { easy: "20K-50K", medium: "40K-120K", hard: "100K-300K" },
};

/**
 * Generate content ideas from a trend (legacy compatibility)
 */
export async function generateIdeasFromTrend(
  request: GenerateIdeasRequest
): Promise<GeneratedIdea[]> {
  const options: IdeationOptions = {
    ...DEFAULT_IDEATION_OPTIONS,
    ...request.options,
  };

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const templates = IDEA_TEMPLATES_KO[options.contentTone] || IDEA_TEMPLATES_KO.informative;
  const viewEstimates = VIEW_ESTIMATES[options.videoType] || VIEW_ESTIMATES.medium;

  const ideas: GeneratedIdea[] = [];
  const numIdeas = Math.min(options.ideaCount, templates.length * 2);

  for (let i = 0; i < numIdeas; i++) {
    const template = templates[i % templates.length];

    const title = template.titleTemplate
      .replace("{trend}", request.trendTitle)
      .replace("{category}", request.trendCategory);

    const description = template.descTemplate
      .replace(/{trend}/g, request.trendTitle)
      .replace(/{category}/g, request.trendCategory);

    const hooks = template.hooksTemplate.map((hook) =>
      hook.replace(/{trend}/g, request.trendTitle).replace(/{category}/g, request.trendCategory)
    );

    ideas.push({
      id: crypto.randomUUID(),
      title,
      description,
      hooks,
      targetAudience: `${request.trendCategory}에 관심 있는 일반 시청자`,
      estimatedViews: viewEstimates[template.difficulty],
      difficulty: template.difficulty,
      basedOnTrend: request.trendTitle,
      trendId: request.trendId,
    });
  }

  return ideas;
}

// =============================================================================
// Legacy Exports (Backward Compatibility)
// =============================================================================

export { getIdeasCount as getSavedIdeasCount };
export { updateIdea as updateSavedIdea };
export { deleteIdea as deleteSavedIdea };
