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

// Idea templates based on content tone
const IDEA_TEMPLATES: Record<string, Array<{
  titleTemplate: string;
  descTemplate: string;
  hooksTemplate: string[];
  difficulty: "easy" | "medium" | "hard";
}>> = {
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

// Audience descriptions based on target type
const AUDIENCE_DESCRIPTIONS: Record<string, string> = {
  general: "General audience seeking quality content",
  young: "Gen Z and young millennials (13-24)",
  adult: "Working professionals and adults (25-44)",
  mature: "Experienced viewers (45+)",
  niche: "Dedicated enthusiasts and experts",
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

  const templates = IDEA_TEMPLATES[options.contentTone] || IDEA_TEMPLATES.informative;
  const audienceDesc = AUDIENCE_DESCRIPTIONS[options.targetAudienceType] || AUDIENCE_DESCRIPTIONS.general;
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
      finalDescription += ` Focus: ${options.customPrompt}`;
    }

    // Add variation suffix for duplicates
    const finalTitle = variation > 0 ? `${title} (Part ${variation + 1})` : title;

    ideas.push({
      id: crypto.randomUUID(),
      title: finalTitle,
      description: finalDescription,
      hooks,
      targetAudience: `${audienceDesc} interested in ${request.trendCategory}`,
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
