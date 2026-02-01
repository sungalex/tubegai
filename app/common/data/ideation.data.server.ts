// =============================================================================
// Ideation Data Access Layer (Server-side)
// =============================================================================
// This layer handles AI idea generation and saved ideas management.
// Currently uses mock data - replace with OpenAI API calls when ready.

import { desc, eq, and } from "drizzle-orm";
import { db, schema } from "~/lib/db.server";
import type {
  GeneratedIdea,
  SavedIdea,
  GenerateIdeasRequest,
  IdeationOptions,
} from "../types/ideation.types";
import { DEFAULT_IDEATION_OPTIONS } from "../types/ideation.types";

// =============================================================================
// AI Idea Generation (Mock)
// =============================================================================

// Template type definition
type IdeaTemplate = {
  titleTemplate: string;
  descTemplate: string;
  hooksTemplate: string[];
  difficulty: "easy" | "medium" | "hard";
};

// Idea templates based on content tone - English
const IDEA_TEMPLATES_EN: Record<string, IdeaTemplate[]> = {
  informative: [
    {
      titleTemplate: "{trend} - Complete Guide & Analysis",
      descTemplate: "A comprehensive breakdown of {trend}, covering everything you need to know with facts, data, and expert insights.",
      hooksTemplate: [
        "Everything you need to know about {trend} in one video",
        "The definitive guide to {trend} that experts recommend",
        "I researched {trend} for 20 hours - here's what I found",
      ],
      difficulty: "medium",
    },
    {
      titleTemplate: "Why {trend} Is Changing Everything",
      descTemplate: "An educational deep-dive into the impact and implications of {trend}. Perfect for viewers who want to understand the bigger picture.",
      hooksTemplate: [
        "The real reason {trend} matters more than you think",
        "How {trend} is reshaping the {category} landscape",
        "What experts are saying about {trend}",
      ],
      difficulty: "hard",
    },
  ],
  funny: [
    {
      titleTemplate: "{trend} but Make It Funny",
      descTemplate: "A hilarious take on {trend} with comedic commentary, memes, and unexpected twists that will have your audience laughing.",
      hooksTemplate: [
        "I tried {trend} and it was a disaster...",
        "POV: You just discovered {trend}",
        "Nobody: ... Me with {trend}:",
      ],
      difficulty: "easy",
    },
    {
      titleTemplate: "Roasting {trend} for 10 Minutes",
      descTemplate: "A comedic roast session covering {trend}. Sharp wit, funny observations, and entertaining commentary throughout.",
      hooksTemplate: [
        "We need to talk about {trend}...",
        "I have some thoughts about {trend}",
        "{trend} is wild and here's why",
      ],
      difficulty: "medium",
    },
  ],
  dramatic: [
    {
      titleTemplate: "The Dark Truth About {trend}",
      descTemplate: "A dramatic investigation into {trend}, uncovering hidden stories and shocking revelations that mainstream coverage missed.",
      hooksTemplate: [
        "What they don't want you to know about {trend}",
        "The untold story behind {trend}",
        "I exposed the truth about {trend}...",
      ],
      difficulty: "hard",
    },
    {
      titleTemplate: "{trend}: The Rise and Fall",
      descTemplate: "An epic storytelling piece about {trend}, covering the journey from beginning to now with dramatic narration and compelling visuals.",
      hooksTemplate: [
        "The incredible story of {trend}",
        "How {trend} changed everything",
        "From zero to viral: The {trend} story",
      ],
      difficulty: "medium",
    },
  ],
  casual: [
    {
      titleTemplate: "Let's Talk About {trend}",
      descTemplate: "A relaxed, conversational video about {trend}. Share your thoughts, react in real-time, and connect with your audience authentically.",
      hooksTemplate: [
        "So {trend} happened and I have thoughts",
        "Chatting about {trend} while I chill",
        "My honest take on {trend}",
      ],
      difficulty: "easy",
    },
    {
      titleTemplate: "Reacting to {trend}",
      descTemplate: "A genuine reaction video with live commentary on {trend}. Perfect for building engagement and sparking discussion.",
      hooksTemplate: [
        "First time seeing {trend}!",
        "I finally checked out {trend}",
        "Watching {trend} for the first time",
      ],
      difficulty: "easy",
    },
  ],
  professional: [
    {
      titleTemplate: "{trend}: Industry Expert Analysis",
      descTemplate: "A polished, authoritative breakdown of {trend} with professional production quality and expert-level insights.",
      hooksTemplate: [
        "Professional analysis of {trend}",
        "What {category} experts think about {trend}",
        "Breaking down {trend} from a professional perspective",
      ],
      difficulty: "hard",
    },
    {
      titleTemplate: "{trend} - What You Need to Know",
      descTemplate: "A well-structured, informative piece covering {trend} with clear explanations and actionable takeaways for your audience.",
      hooksTemplate: [
        "The key things to understand about {trend}",
        "Your complete briefing on {trend}",
        "Everything professionals know about {trend}",
      ],
      difficulty: "medium",
    },
  ],
};

// Idea templates based on content tone - Korean
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
    {
      titleTemplate: "{trend}가 모든 것을 바꾸고 있는 이유",
      descTemplate: "{trend}의 영향력과 의미에 대한 심층 교육 콘텐츠. 큰 그림을 이해하고 싶은 시청자에게 완벽한 영상입니다.",
      hooksTemplate: [
        "{trend}가 생각보다 중요한 진짜 이유",
        "{trend}가 {category} 분야를 어떻게 재편하고 있는가",
        "전문가들이 {trend}에 대해 말하는 것들",
      ],
      difficulty: "hard",
    },
  ],
  funny: [
    {
      titleTemplate: "{trend} 웃기게 만들어봤습니다",
      descTemplate: "{trend}에 대한 코믹한 해석. 웃긴 코멘터리, 밈, 예상치 못한 반전으로 시청자들을 웃게 만듭니다.",
      hooksTemplate: [
        "{trend} 해봤는데 대참사였습니다...",
        "POV: {trend}를 방금 발견한 당신",
        "아무도: ... 나: {trend} 하는 중",
      ],
      difficulty: "easy",
    },
    {
      titleTemplate: "{trend} 10분간 까기",
      descTemplate: "{trend}에 대한 코미디 로스트 세션. 날카로운 위트, 재미있는 관찰, 엔터테이닝한 코멘터리.",
      hooksTemplate: [
        "{trend}에 대해 할 말이 있습니다...",
        "{trend}에 대한 제 생각을 말씀드리겠습니다",
        "{trend} 진짜 미쳤는데 이유가 있음",
      ],
      difficulty: "medium",
    },
  ],
  dramatic: [
    {
      titleTemplate: "{trend}의 숨겨진 진실",
      descTemplate: "{trend}에 대한 드라마틱한 조사. 주류 언론이 놓친 숨겨진 이야기와 충격적인 폭로를 다룹니다.",
      hooksTemplate: [
        "그들이 당신에게 알려주지 않는 {trend}의 진실",
        "{trend} 뒤에 숨겨진 이야기",
        "{trend}의 진실을 폭로합니다...",
      ],
      difficulty: "hard",
    },
    {
      titleTemplate: "{trend}: 흥망성쇠",
      descTemplate: "{trend}에 대한 서사적 스토리텔링. 시작부터 현재까지의 여정을 드라마틱한 내레이션과 멋진 비주얼로 담습니다.",
      hooksTemplate: [
        "{trend}의 놀라운 이야기",
        "{trend}가 모든 것을 바꾼 방법",
        "무명에서 바이럴까지: {trend} 스토리",
      ],
      difficulty: "medium",
    },
  ],
  casual: [
    {
      titleTemplate: "{trend}에 대해 이야기해봐요",
      descTemplate: "{trend}에 대한 편안하고 대화하듯한 영상. 생각을 공유하고, 실시간으로 반응하며, 시청자들과 진정성 있게 소통합니다.",
      hooksTemplate: [
        "{trend} 생겼는데 할 말이 있어요",
        "쉬면서 {trend}에 대해 수다 떨기",
        "{trend}에 대한 솔직한 내 생각",
      ],
      difficulty: "easy",
    },
    {
      titleTemplate: "{trend} 리액션",
      descTemplate: "{trend}에 대한 진솔한 리액션 영상. 라이브 코멘터리로 참여를 이끌고 토론을 유도하기에 완벽합니다.",
      hooksTemplate: [
        "{trend} 처음 봅니다!",
        "드디어 {trend} 확인해봤습니다",
        "{trend} 처음 보는 리액션",
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
        "전문가 관점에서 {trend} 분석하기",
      ],
      difficulty: "hard",
    },
    {
      titleTemplate: "{trend} - 알아야 할 모든 것",
      descTemplate: "{trend}를 다루는 체계적이고 유익한 콘텐츠. 명확한 설명과 실행 가능한 인사이트를 제공합니다.",
      hooksTemplate: [
        "{trend}에 대해 이해해야 할 핵심 사항",
        "{trend} 완전 정복 브리핑",
        "전문가들이 아는 {trend}의 모든 것",
      ],
      difficulty: "medium",
    },
  ],
};

// Audience descriptions based on target type - English
const AUDIENCE_DESCRIPTIONS_EN: Record<string, string> = {
  general: "General audience seeking quality content",
  young: "Gen Z and young millennials (13-24)",
  adult: "Working professionals and adults (25-44)",
  mature: "Experienced viewers (45+)",
  niche: "Dedicated enthusiasts and experts",
};

// Audience descriptions based on target type - Korean
const AUDIENCE_DESCRIPTIONS_KO: Record<string, string> = {
  general: "양질의 콘텐츠를 찾는 일반 시청자",
  young: "Z세대 및 젊은 밀레니얼 (13-24세)",
  adult: "직장인 및 성인 (25-44세)",
  mature: "경험 많은 시청자 (45세 이상)",
  niche: "열정적인 마니아 및 전문가",
};

// View estimates based on video type
const VIEW_ESTIMATES: Record<string, Record<string, string>> = {
  short: { easy: "100K-500K", medium: "50K-200K", hard: "30K-100K" },
  medium: { easy: "30K-80K", medium: "50K-150K", hard: "80K-200K" },
  long: { easy: "20K-50K", medium: "40K-120K", hard: "100K-300K" },
};

/**
 * Generate content ideas from a trend
 * TODO: Replace with OpenAI API call
 */
export async function generateIdeasFromTrend(
  request: GenerateIdeasRequest
): Promise<GeneratedIdea[]> {
  const options: IdeationOptions = {
    ...DEFAULT_IDEATION_OPTIONS,
    ...request.options,
  };

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Select templates based on language
  const isKorean = options.language === "ko";
  const ideaTemplates = isKorean ? IDEA_TEMPLATES_KO : IDEA_TEMPLATES_EN;
  const audienceDescriptions = isKorean ? AUDIENCE_DESCRIPTIONS_KO : AUDIENCE_DESCRIPTIONS_EN;

  const templates = ideaTemplates[options.contentTone] || ideaTemplates.informative;
  const audienceDesc = audienceDescriptions[options.targetAudienceType] || audienceDescriptions.general;
  const viewEstimates = VIEW_ESTIMATES[options.videoType] || VIEW_ESTIMATES.medium;

  // Generate ideas based on templates and options
  const ideas: GeneratedIdea[] = [];
  const numIdeas = Math.min(options.ideaCount, templates.length * 2);

  for (let i = 0; i < numIdeas; i++) {
    const template = templates[i % templates.length];
    const variation = Math.floor(i / templates.length);

    const title = template.titleTemplate
      .replace("{trend}", request.trendTitle)
      .replace("{category}", request.trendCategory);

    const description = template.descTemplate
      .replace(/{trend}/g, request.trendTitle)
      .replace(/{category}/g, request.trendCategory);

    const hooks = template.hooksTemplate.map((hook) =>
      hook.replace(/{trend}/g, request.trendTitle).replace(/{category}/g, request.trendCategory)
    );

    // Add custom prompt influence if provided
    let finalDescription = description;
    if (options.customPrompt) {
      const focusLabel = isKorean ? "포커스:" : "Focus:";
      finalDescription += ` ${focusLabel} ${options.customPrompt}`;
    }

    // Add variation suffix for duplicates
    const variationSuffix = isKorean ? `(${variation + 1}편)` : `(Part ${variation + 1})`;
    const finalTitle = variation > 0 ? `${title} ${variationSuffix}` : title;

    // Build audience text
    const interestedInText = isKorean
      ? `${request.trendCategory}에 관심 있는 ${audienceDesc}`
      : `${audienceDesc} interested in ${request.trendCategory}`;

    ideas.push({
      id: crypto.randomUUID(),
      title: finalTitle,
      description: finalDescription,
      hooks,
      targetAudience: interestedInText,
      estimatedViews: viewEstimates[template.difficulty],
      difficulty: template.difficulty,
      basedOnTrend: request.trendTitle,
      trendId: request.trendId,
    });
  }

  return ideas;
}

// =============================================================================
// Saved Ideas CRUD Operations
// =============================================================================

/**
 * Save an idea to the database
 */
export async function saveIdea(
  userId: string,
  idea: GeneratedIdea
): Promise<SavedIdea> {
  const [savedIdea] = await db
    .insert(schema.savedIdeas)
    .values({
      userId,
      title: idea.title,
      description: idea.description,
      hooks: idea.hooks,
      targetAudience: idea.targetAudience,
      estimatedViews: idea.estimatedViews,
      difficulty: idea.difficulty,
      basedOnTrend: idea.basedOnTrend,
      trendId: idea.trendId,
    })
    .returning();

  return {
    id: savedIdea.id,
    userId: savedIdea.userId,
    title: savedIdea.title,
    description: savedIdea.description,
    hooks: savedIdea.hooks,
    targetAudience: savedIdea.targetAudience,
    estimatedViews: savedIdea.estimatedViews,
    difficulty: savedIdea.difficulty as SavedIdea["difficulty"],
    basedOnTrend: savedIdea.basedOnTrend,
    trendId: savedIdea.trendId ?? undefined,
    usedForProjectId: savedIdea.usedForProjectId ?? undefined,
    isUsed: savedIdea.isUsed,
    createdAt: savedIdea.createdAt,
    updatedAt: savedIdea.updatedAt,
  };
}

/**
 * Get all saved ideas for a user
 */
export async function getSavedIdeas(userId: string): Promise<SavedIdea[]> {
  const ideas = await db.query.savedIdeas.findMany({
    where: eq(schema.savedIdeas.userId, userId),
    orderBy: [desc(schema.savedIdeas.createdAt)],
  });

  return ideas.map((idea) => ({
    id: idea.id,
    userId: idea.userId,
    title: idea.title,
    description: idea.description,
    hooks: idea.hooks,
    targetAudience: idea.targetAudience,
    estimatedViews: idea.estimatedViews,
    difficulty: idea.difficulty as SavedIdea["difficulty"],
    basedOnTrend: idea.basedOnTrend,
    trendId: idea.trendId ?? undefined,
    usedForProjectId: idea.usedForProjectId ?? undefined,
    isUsed: idea.isUsed,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
  }));
}

/**
 * Delete a saved idea
 */
export async function deleteSavedIdea(
  userId: string,
  ideaId: string
): Promise<boolean> {
  const result = await db
    .delete(schema.savedIdeas)
    .where(
      and(eq(schema.savedIdeas.id, ideaId), eq(schema.savedIdeas.userId, userId))
    )
    .returning({ id: schema.savedIdeas.id });

  return result.length > 0;
}

/**
 * Mark idea as used for a project
 */
export async function markIdeaAsUsed(
  userId: string,
  ideaId: string,
  projectId: string
): Promise<boolean> {
  const result = await db
    .update(schema.savedIdeas)
    .set({
      isUsed: true,
      usedForProjectId: projectId,
      updatedAt: new Date(),
    })
    .where(
      and(eq(schema.savedIdeas.id, ideaId), eq(schema.savedIdeas.userId, userId))
    )
    .returning({ id: schema.savedIdeas.id });

  return result.length > 0;
}
