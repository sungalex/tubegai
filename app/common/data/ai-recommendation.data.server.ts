// =============================================================================
// AI Recommendation Data Access Layer (Server-side)
// =============================================================================
// Handles AI-generated recommendations storage and retrieval

import { desc, eq, and, gt, sql } from "drizzle-orm";
import { db, schema } from "~/lib/db.server";
import {
  generateAIRecommendations,
  type AIGeneratedRecommendation,
} from "~/lib/ai.server";
import type { TrendItem, AIRecommendation } from "~/common/types/project.types";

// =============================================================================
// Types
// =============================================================================

export interface StoredAIRecommendation extends AIRecommendation {
  id: string;
  userId: string | null;
  score: number;
  videoType: string;
  contentTone: string;
  basedOnTrends: string[];
  isUsed: boolean;
  createdAt: Date;
  expiresAt: Date | null;
}

// =============================================================================
// Constants
// =============================================================================

const RECOMMENDATION_EXPIRE_HOURS = 24; // Recommendations expire after 24 hours
const MAX_RECOMMENDATIONS_PER_USER = 10;

// =============================================================================
// Main Functions
// =============================================================================

/**
 * Get AI recommendations for a user
 * Returns cached recommendations if valid, otherwise generates new ones
 */
export async function getAIRecommendationsForUser(
  userId: string,
  trends: TrendItem[],
  options?: {
    forceRefresh?: boolean;
    count?: number;
    language?: "ko" | "en";
  }
): Promise<AIRecommendation[]> {
  const { forceRefresh = false, count = 3, language = "ko" } = options ?? {};

  // Check for valid cached recommendations
  if (!forceRefresh) {
    try {
      const cached = await getCachedRecommendations(userId);
      if (cached.length >= count) {
        return cached.slice(0, count);
      }
    } catch (error) {
      console.error("Failed to fetch cached recommendations:", error);
    }
  }

  // Generate new recommendations
  let generated: Awaited<ReturnType<typeof generateAIRecommendations>> = [];
  try {
    generated = await generateAIRecommendations({
      trends,
      count,
      language,
    });
  } catch (error) {
    console.error("Failed to generate AI recommendations:", error);
    // Return fallback on error
    return getFallbackRecommendations();
  }

  if (generated.length === 0) {
    // Fallback to cached if generation fails
    try {
      const cached = await getCachedRecommendations(userId);
      if (cached.length > 0) {
        return cached.slice(0, count);
      }
    } catch (error) {
      console.error("Failed to fetch cached recommendations:", error);
    }
    // Return fallback mock data if nothing available
    return getFallbackRecommendations();
  }

  // Save to database
  try {
    await saveRecommendations(userId, generated);
  } catch (error) {
    console.error("Failed to save recommendations:", error);
    // Continue even if save fails
  }

  // Return formatted recommendations
  return generated.map(formatRecommendation);
}

/**
 * Get cached (non-expired) recommendations for a user
 */
async function getCachedRecommendations(
  userId: string
): Promise<AIRecommendation[]> {
  const now = new Date();

  const recommendations = await db.query.aiRecommendations.findMany({
    where: and(
      eq(schema.aiRecommendations.userId, userId),
      eq(schema.aiRecommendations.isUsed, 0),
      gt(schema.aiRecommendations.expiresAt, now)
    ),
    orderBy: [desc(schema.aiRecommendations.score)],
    limit: MAX_RECOMMENDATIONS_PER_USER,
  });

  return recommendations.map((rec) => ({
    title: rec.title,
    reason: rec.reason,
    growth: rec.growthRate ?? "+50%",
    description: rec.description ?? undefined,
    hooks: rec.hooks ?? undefined,
    targetAudience: rec.targetAudience ?? undefined,
    estimatedViews: rec.estimatedViews ?? undefined,
  }));
}

/**
 * Save generated recommendations to database
 */
async function saveRecommendations(
  userId: string,
  recommendations: AIGeneratedRecommendation[]
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + RECOMMENDATION_EXPIRE_HOURS);

  // Delete old recommendations for user
  await db
    .delete(schema.aiRecommendations)
    .where(eq(schema.aiRecommendations.userId, userId));

  // Insert new recommendations
  for (const rec of recommendations) {
    await db.insert(schema.aiRecommendations).values({
      userId,
      title: rec.title,
      reason: rec.reason,
      description: rec.description,
      category: rec.contentTone,
      growthRate: rec.growthRate,
      hooks: rec.hooks,
      targetAudience: rec.targetAudience,
      estimatedViews: rec.estimatedViews,
      difficulty: rec.difficulty,
      videoType: rec.videoType,
      contentTone: rec.contentTone,
      score: rec.score,
      basedOnTrends: rec.basedOnTrends,
      isUsed: 0,
      expiresAt,
    });
  }
}

/**
 * Mark a recommendation as used
 */
export async function markRecommendationAsUsed(
  userId: string,
  recommendationId: string,
  projectId?: string
): Promise<boolean> {
  const result = await db
    .update(schema.aiRecommendations)
    .set({
      isUsed: 1,
      usedForProjectId: projectId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.aiRecommendations.id, recommendationId),
        eq(schema.aiRecommendations.userId, userId)
      )
    )
    .returning({ id: schema.aiRecommendations.id });

  return result.length > 0;
}

/**
 * Delete expired recommendations (cleanup job)
 */
export async function cleanupExpiredRecommendations(): Promise<number> {
  const now = new Date();

  const result = await db
    .delete(schema.aiRecommendations)
    .where(
      and(
        sql`${schema.aiRecommendations.expiresAt} < ${now}`,
        eq(schema.aiRecommendations.isUsed, 0)
      )
    )
    .returning({ id: schema.aiRecommendations.id });

  return result.length;
}

/**
 * Refresh recommendations for a user (force regeneration)
 */
export async function refreshRecommendations(
  userId: string,
  trends: TrendItem[],
  language: "ko" | "en" = "ko"
): Promise<AIRecommendation[]> {
  return getAIRecommendationsForUser(userId, trends, {
    forceRefresh: true,
    count: 3,
    language,
  });
}

// =============================================================================
// Helpers
// =============================================================================

function formatRecommendation(rec: AIGeneratedRecommendation): AIRecommendation {
  return {
    title: rec.title,
    reason: rec.reason,
    growth: rec.growthRate,
    description: rec.description,
    hooks: rec.hooks,
    targetAudience: rec.targetAudience,
    estimatedViews: rec.estimatedViews,
  };
}

/**
 * Fallback recommendations when AI generation fails
 */
function getFallbackRecommendations(): AIRecommendation[] {
  return [
    {
      title: "Day in the Life: AI Engineer",
      reason: "Matches your tech audience",
      growth: "+210%",
      description:
        "AI 엔지니어의 하루 일과를 따라가며 실제 업무 환경, 사용하는 도구들, 그리고 AI 개발의 현실적인 모습을 보여주는 콘텐츠입니다.",
      hooks: [
        "AI 엔지니어가 되고 싶은데 현실이 궁금하다면?",
        "ChatGPT 만드는 사람들은 하루를 어떻게 보낼까요?",
        "연봉 1억 AI 개발자의 24시간 밀착 취재",
      ],
      targetAudience: "개발자 지망생, IT 취준생",
      estimatedViews: "50K-100K",
    },
    {
      title: "Home Office Makeover 2026",
      reason: "Highly requested topic",
      growth: "+85%",
      description:
        "2026년 최신 트렌드를 반영한 홈 오피스 인테리어 가이드. 생산성을 높이는 데스크 셋업과 필수 가젯을 소개합니다.",
      hooks: [
        "재택근무 3년차가 알려주는 최적의 홈오피스 셋업",
        "100만원으로 완성하는 프로 유튜버급 데스크 환경",
        "집중력 200% 올리는 홈오피스 필수템 TOP 10",
      ],
      targetAudience: "재택근무자, 프리랜서",
      estimatedViews: "30K-70K",
    },
    {
      title: "React vs Vue: The Final Battle",
      reason: "Trending in Dev Community",
      growth: "+340%",
      description:
        "2026년 기준으로 React와 Vue를 철저하게 비교 분석합니다. 성능, 생태계, 취업시장, 학습 곡선까지 모든 것을 다룹니다.",
      hooks: [
        "React 개발자들이 Vue를 무시하는 진짜 이유",
        "2026년 프론트엔드 프레임워크 최종 승자는?",
        "3년차 개발자가 말하는 React vs Vue 현실 비교",
      ],
      targetAudience: "웹 개발자, 프론트엔드 입문자",
      estimatedViews: "80K-150K",
    },
  ];
}
