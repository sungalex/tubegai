// =============================================================================
// Project Data Access Layer
// =============================================================================
// This layer abstracts data fetching, making it easy to switch from mock to API.

import { desc, eq, ilike, asc, and, count } from "drizzle-orm";
import { db, schema } from "~/lib/db.server";
import { formatDistanceToNow } from "date-fns";

// Sort options type
export type ProjectSortOption = "newest" | "oldest" | "name" | "progress";

// Pagination constants
export const PROJECTS_PER_PAGE = 8;

// Paginated result type
export interface PaginatedProjects {
  projects: Project[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

import type {
  RecentProject,
  Project,
  Channel,
  Label,
  TrendItem,
  ProjectDetail,
  LabelColor,
  AIRecommendation,
} from "../types/project.types";

import {
  PROJECTS,
  PROJECT_DETAIL,
  CHANNELS,
  LABELS,
  INITIAL_CHANNELS,
  LABEL_COLORS,
  INITIAL_LABELS,
  AI_RECOMMENDATIONS,
} from "../mocks/project-mock";

import { getYouTubeTrends } from "./youtube.data.server";

// Status mapping: DB enum -> UI display
const STATUS_DISPLAY_MAP: Record<string, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
  archived: "Archived",
};

// =============================================================================
// Project Creation Types
// =============================================================================

export interface CreateProjectInput {
  title: string;
  description?: string;
  type: "short" | "long";
  tone?: "informative" | "funny" | "cinematic" | "vlog";
  visibility: "public" | "private";
  topic?: string;
  channelId?: string;
  labels?: string[];
  // AI Context fields
  hooks?: string[];
  targetAudience?: string;
  estimatedViews?: string;
  difficulty?: "easy" | "medium" | "hard";
  contentTone?: "informative" | "funny" | "dramatic" | "casual" | "professional";
  videoLength?: "short" | "medium" | "long";
  basedOnTrend?: string;
  basedOnTrendId?: number;
  sourceIdeaId?: string;
  aiContext?: {
    keywords?: string[];
    competitors?: string[];
    references?: string[];
    styleNotes?: string;
    scriptGuidelines?: string;
    targetLength?: string;
    callToAction?: string;
    additionalNotes?: string;
  };
}

// =============================================================================
// Project Data Functions
// =============================================================================

/**
 * Create a new project with AI context
 */
export async function createProject(
  userId: string,
  input: CreateProjectInput
): Promise<{ id: string }> {
  // Helper to convert empty strings to undefined (for enum fields)
  const emptyToNull = <T>(value: T | string | undefined): T | undefined => {
    if (value === "" || value === undefined || value === null) return undefined;
    return value as T;
  };

  const [project] = await db
    .insert(schema.projects)
    .values({
      ownerId: userId,
      title: input.title,
      description: emptyToNull(input.description),
      type: input.type,
      tone: emptyToNull(input.tone),
      visibility: input.visibility,
      topic: emptyToNull(input.topic),
      channelId: emptyToNull(input.channelId),
      status: "draft",
      progress: 0,
      currentStep: "Script",
      // AI Context fields
      hooks: input.hooks,
      targetAudience: emptyToNull(input.targetAudience),
      estimatedViews: emptyToNull(input.estimatedViews),
      difficulty: emptyToNull(input.difficulty),
      contentTone: emptyToNull(input.contentTone),
      videoLength: emptyToNull(input.videoLength),
      basedOnTrend: emptyToNull(input.basedOnTrend),
      basedOnTrendId: input.basedOnTrendId,
      sourceIdeaId: emptyToNull(input.sourceIdeaId),
      aiContext: input.aiContext,
    })
    .returning({ id: schema.projects.id });

  // Add labels if provided
  if (input.labels && input.labels.length > 0) {
    await db.insert(schema.projectLabels).values(
      input.labels.map((labelId) => ({
        projectId: project.id,
        labelId,
      }))
    );
  }

  // Mark source idea as used if provided
  if (input.sourceIdeaId) {
    await db
      .update(schema.savedIdeas)
      .set({
        isUsed: true,
        usedForProjectId: project.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.savedIdeas.id, input.sourceIdeaId));
  }

  return { id: project.id };
}

/**
 * Get total project count for a user (lightweight query for badges)
 */
export async function getProjectCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(schema.projects)
    .where(eq(schema.projects.ownerId, userId));

  return result?.count ?? 0;
}

/**
 * Fetch project statistics by status for dashboard
 */
export async function getProjectStats(userId: string): Promise<{
  inProgress: number;
  completed: number;
  drafts: number;
}> {
  const projects = await db.query.projects.findMany({
    where: eq(schema.projects.ownerId, userId),
    columns: { status: true },
  });

  return {
    inProgress: projects.filter((p) => p.status === "in_progress").length,
    completed: projects.filter((p) => p.status === "completed").length,
    drafts: projects.filter((p) => p.status === "draft").length,
  };
}

/**
 * Fetch recent projects for dashboard (max 4, ordered by updatedAt)
 */
export async function getRecentProjects(userId: string): Promise<RecentProject[]> {
  const projects = await db.query.projects.findMany({
    where: eq(schema.projects.ownerId, userId),
    orderBy: [desc(schema.projects.updatedAt)],
    limit: 4,
  });

  return projects.map((project) => ({
    id: project.id,
    name: project.title,
    status: STATUS_DISPLAY_MAP[project.status] ?? project.status,
    date: formatDistanceToNow(project.updatedAt, { addSuffix: true }),
    step: project.currentStep ?? "Script",
    progress: project.progress,
    // AI Context fields
    topic: project.topic ?? undefined,
    targetAudience: project.targetAudience ?? undefined,
    estimatedViews: project.estimatedViews ?? undefined,
    contentTone: project.contentTone ?? undefined,
    videoLength: project.videoLength ?? undefined,
    difficulty: project.difficulty ?? undefined,
    basedOnTrend: project.basedOnTrend ?? undefined,
    thumbnailUrl: project.thumbnailUrl ?? undefined,
  }));
}

// Status filter type (maps to DB enum values)
export type ProjectStatusFilter = "draft" | "in_progress" | "completed";

/**
 * Fetch projects for a user with search, sort, status filter, and pagination options
 */
export async function getProjects(
  userId: string,
  options?: {
    search?: string;
    sort?: ProjectSortOption;
    status?: ProjectStatusFilter;
    page?: number;
  }
): Promise<PaginatedProjects> {
  const { search, sort = "newest", status, page = 1 } = options ?? {};

  // Build where conditions
  const conditions = [eq(schema.projects.ownerId, userId)];

  if (search) {
    conditions.push(ilike(schema.projects.title, `%${search}%`));
  }

  if (status) {
    conditions.push(eq(schema.projects.status, status));
  }

  const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

  // Build order by
  const orderByMap = {
    newest: [desc(schema.projects.updatedAt)],
    oldest: [asc(schema.projects.updatedAt)],
    name: [asc(schema.projects.title)],
    progress: [desc(schema.projects.progress)],
  };

  // Get total count
  const [countResult] = await db
    .select({ count: count() })
    .from(schema.projects)
    .where(whereConditions);

  const totalCount = countResult?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PROJECTS_PER_PAGE);
  const offset = (page - 1) * PROJECTS_PER_PAGE;

  // Get paginated projects
  const projectList = await db.query.projects.findMany({
    where: whereConditions,
    orderBy: orderByMap[sort],
    limit: PROJECTS_PER_PAGE,
    offset,
  });

  const projects = projectList.map((project) => ({
    id: project.id,
    title: project.title,
    thumbnail: project.thumbnailUrl ?? undefined,
    status: STATUS_DISPLAY_MAP[project.status] as Project["status"],
    lastModified: formatDistanceToNow(project.updatedAt, { addSuffix: true }),
    progress: project.progress,
  }));

  return {
    projects,
    totalCount,
    totalPages,
    currentPage: page,
  };
}

/**
 * Full project data for detail page
 */
export interface ProjectFullDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  currentStep: string | null;
  thumbnailUrl: string | null;
  type: string;
  tone: string | null;
  visibility: string;
  topic: string | null;
  createdAt: Date;
  updatedAt: Date;
  // AI Context fields
  hooks: string[] | null;
  targetAudience: string | null;
  estimatedViews: string | null;
  difficulty: string | null;
  contentTone: string | null;
  videoLength: string | null;
  basedOnTrend: string | null;
  basedOnTrendId: number | null;
  sourceIdeaId: string | null;
  aiContext: {
    keywords?: string[];
    competitors?: string[];
    references?: string[];
    styleNotes?: string;
    scriptGuidelines?: string;
    targetLength?: string;
    callToAction?: string;
    additionalNotes?: string;
  } | null;
  // Relations
  channel: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

/**
 * Fetch a single project by ID with full details
 */
export async function getProjectById(
  id: string,
  userId: string
): Promise<ProjectFullDetail | null> {
  const project = await db.query.projects.findFirst({
    where: and(
      eq(schema.projects.id, id),
      eq(schema.projects.ownerId, userId)
    ),
    with: {
      channel: {
        columns: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      labels: {
        with: {
          label: {
            columns: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
    },
  });

  if (!project) return null;

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    status: STATUS_DISPLAY_MAP[project.status] ?? project.status,
    progress: project.progress,
    currentStep: project.currentStep,
    thumbnailUrl: project.thumbnailUrl,
    type: project.type,
    tone: project.tone,
    visibility: project.visibility,
    topic: project.topic,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    // AI Context fields
    hooks: project.hooks,
    targetAudience: project.targetAudience,
    estimatedViews: project.estimatedViews,
    difficulty: project.difficulty,
    contentTone: project.contentTone,
    videoLength: project.videoLength,
    basedOnTrend: project.basedOnTrend,
    basedOnTrendId: project.basedOnTrendId,
    sourceIdeaId: project.sourceIdeaId,
    aiContext: project.aiContext as ProjectFullDetail["aiContext"],
    // Relations
    channel: project.channel,
    labels: project.labels.map((pl) => pl.label),
  };
}

// =============================================================================
// Channel Data Functions
// =============================================================================

/**
 * Fetch channels for dropdown/selector (simple list for forms)
 */
export async function getChannelsForSelect(userId: string): Promise<Channel[]> {
  const channelList = await db.query.channels.findMany({
    where: eq(schema.channels.userId, userId),
    orderBy: [desc(schema.channels.createdAt)],
  });

  return channelList.map((channel) => ({
    id: channel.id,
    name: channel.name,
    handle: channel.handle ?? "",
    avatar: channel.avatarUrl ?? undefined,
  }));
}

/**
 * Fetch channels with full details
 * TODO: Replace with API call
 */
export async function getChannelsWithDetails(): Promise<Channel[]> {
  return INITIAL_CHANNELS;
}

// =============================================================================
// Label Data Functions
// =============================================================================

/**
 * Fetch labels for dropdown/selector
 * TODO: Replace with API call
 */
export async function getLabels(): Promise<Label[]> {
  return LABELS;
}

/**
 * Fetch labels with full details
 * TODO: Replace with API call
 */
export async function getLabelsWithDetails(): Promise<Label[]> {
  return INITIAL_LABELS;
}

/**
 * Get available label colors
 */
export function getLabelColors(): LabelColor[] {
  return LABEL_COLORS;
}

// =============================================================================
// Trend Data Functions
// =============================================================================

/**
 * Fetch trending topics from YouTube Data API v3
 * Uses 15-minute cache to manage API quota
 * Falls back to mock data on error or missing API key
 */
export async function getTrends(): Promise<TrendItem[]> {
  return getYouTubeTrends("KR");
}

/**
 * Get AI recommendations
 * TODO: Replace with API call
 */
export async function getAIRecommendations(): Promise<AIRecommendation[]> {
  return AI_RECOMMENDATIONS;
}
