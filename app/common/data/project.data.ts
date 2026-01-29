// =============================================================================
// Project Data Access Layer
// =============================================================================
// This layer abstracts data fetching, making it easy to switch from mock to API.

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
  RECENT_PROJECTS,
  PROJECTS,
  PROJECT_DETAIL,
  CHANNELS,
  LABELS,
  INITIAL_CHANNELS,
  LABEL_COLORS,
  INITIAL_LABELS,
  TRENDS_DATA,
  AI_RECOMMENDATIONS,
} from "../mocks/project-mock";

// =============================================================================
// Project Data Functions
// =============================================================================

/**
 * Fetch recent projects for dashboard
 * TODO: Replace with API call
 */
export async function getRecentProjects(): Promise<RecentProject[]> {
  return RECENT_PROJECTS;
}

/**
 * Fetch all projects
 * TODO: Replace with API call
 */
export async function getProjects(): Promise<Project[]> {
  return PROJECTS;
}

/**
 * Fetch a single project by ID
 * TODO: Replace with API call
 */
export async function getProjectById(
  id: string,
): Promise<ProjectDetail | null> {
  if (PROJECT_DETAIL.id === id) {
    return PROJECT_DETAIL;
  }
  return null;
}

// =============================================================================
// Channel Data Functions
// =============================================================================

/**
 * Fetch channels for dropdown/selector
 * TODO: Replace with API call
 */
export async function getChannels(): Promise<Channel[]> {
  return CHANNELS;
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
 * Fetch trending topics
 * TODO: Replace with API call
 */
export async function getTrends(): Promise<TrendItem[]> {
  return TRENDS_DATA;
}

/**
 * Get AI recommendations
 * TODO: Replace with API call
 */
export async function getAIRecommendations(): Promise<AIRecommendation[]> {
  return AI_RECOMMENDATIONS;
}
