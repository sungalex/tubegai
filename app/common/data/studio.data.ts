// =============================================================================
// Studio Data Access Layer
// =============================================================================
// This layer abstracts data fetching, making it easy to switch from mock to API.

import type {
  ScriptSegment,
  StoryboardScene,
  StoryboardScriptSegment,
  SceneScriptSegment,
  StockVideo,
  BRollSceneContext,
  SubtitleSegment,
  ColorPreset,
  StudioProject,
  QuickAccessStep,
} from "../types/studio.types";

import {
  MOCK_SCRIPTS,
  STORYBOARD_SEGMENTS,
  STORYBOARD_SCENES_POOL,
  SCENE_SEGMENTS,
  BROLL_VIDEOS,
  BROLL_SCENES,
  BROLL_COLORS,
  SUBTITLES,
  COLOR_PRESETS,
  THUMBNAIL_IMAGES,
  SEO_TITLES,
  SEO_TAGS,
  QUICK_ACCESS_STEPS,
  SELECTOR_RECENT_PROJECTS,
  SELECTOR_ALL_PROJECTS,
} from "../mocks/studio-mock";

// =============================================================================
// Script Data Functions
// =============================================================================

/**
 * Fetch script segments for a project
 * TODO: Replace with API call
 */
export async function getScriptSegments(
  projectId: string,
): Promise<ScriptSegment[]> {
  // TODO: Filter by projectId when using real API
  return MOCK_SCRIPTS;
}

// =============================================================================
// Storyboard Data Functions
// =============================================================================

/**
 * Fetch storyboard segments for a project
 * TODO: Replace with API call
 */
export async function getStoryboardSegments(
  projectId: string,
): Promise<StoryboardScriptSegment[]> {
  return STORYBOARD_SEGMENTS;
}

/**
 * Fetch generated scenes pool for storyboard
 * TODO: Replace with API call
 */
export async function getStoryboardScenesPool(
  projectId: string,
): Promise<Record<string, StoryboardScene[]>> {
  return STORYBOARD_SCENES_POOL;
}

// =============================================================================
// Scene Data Functions
// =============================================================================

/**
 * Fetch scene segments for a project
 * TODO: Replace with API call
 */
export async function getSceneSegments(
  projectId: string,
): Promise<SceneScriptSegment[]> {
  return SCENE_SEGMENTS;
}

// =============================================================================
// B-Roll Data Functions
// =============================================================================

/**
 * Fetch stock videos
 * TODO: Replace with API call
 */
export async function getStockVideos(): Promise<StockVideo[]> {
  return BROLL_VIDEOS;
}

/**
 * Fetch B-roll scene contexts for a project
 * TODO: Replace with API call
 */
export async function getBRollScenes(
  projectId: string,
): Promise<BRollSceneContext[]> {
  return BROLL_SCENES;
}

/**
 * Get B-roll filter colors
 */
export function getBRollColors() {
  return BROLL_COLORS;
}

// =============================================================================
// Subtitles Data Functions
// =============================================================================

/**
 * Fetch subtitles for a project
 * TODO: Replace with API call
 */
export async function getSubtitles(
  projectId: string,
): Promise<SubtitleSegment[]> {
  return SUBTITLES;
}

// =============================================================================
// Coloring Data Functions
// =============================================================================

/**
 * Get color presets
 */
export function getColorPresets(): ColorPreset[] {
  return COLOR_PRESETS;
}

// =============================================================================
// Thumbnail Data Functions
// =============================================================================

/**
 * Fetch generated thumbnails
 * TODO: Replace with API call
 */
export async function getThumbnailImages(projectId: string): Promise<string[]> {
  return THUMBNAIL_IMAGES;
}

// =============================================================================
// SEO Data Functions
// =============================================================================

/**
 * Fetch SEO title suggestions
 * TODO: Replace with API call
 */
export async function getSEOTitles(projectId: string): Promise<string[]> {
  return SEO_TITLES;
}

/**
 * Fetch SEO tag suggestions
 * TODO: Replace with API call
 */
export async function getSEOTags(projectId: string): Promise<string[]> {
  return SEO_TAGS;
}

// =============================================================================
// Studio Project Selector Data Functions
// =============================================================================

/**
 * Get quick access steps
 */
export function getQuickAccessSteps(): QuickAccessStep[] {
  return QUICK_ACCESS_STEPS;
}

/**
 * Fetch recent projects for selector
 * TODO: Replace with API call
 */
export async function getSelectorRecentProjects(): Promise<StudioProject[]> {
  return SELECTOR_RECENT_PROJECTS;
}

/**
 * Fetch all projects for selector
 * TODO: Replace with API call
 */
export async function getSelectorAllProjects(): Promise<StudioProject[]> {
  return SELECTOR_ALL_PROJECTS;
}
