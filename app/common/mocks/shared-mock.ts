// =============================================================================
// Shared Mock Data
// =============================================================================
// Common data used across both project and studio features

import type { Color } from "../types/shared.types";

// Re-export shared types
export type { Color } from "../types/shared.types";

// =============================================================================
// Common Colors
// =============================================================================

/**
 * Standard color palette used throughout the application
 * Both LABEL_COLORS and BROLL_COLORS derive from this
 */
export const COLORS: Color[] = [
  { name: "Red", value: "bg-red-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Amber", value: "bg-amber-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Cyan", value: "bg-cyan-400" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Violet", value: "bg-violet-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Slate", value: "bg-slate-500" },
  { name: "Gray", value: "bg-gray-500" },
  { name: "Black", value: "bg-black" },
  { name: "White", value: "bg-white border" },
];

// =============================================================================
// Common Image URLs
// =============================================================================

/**
 * Frequently used image URLs
 * Centralized to avoid duplication and ease updates
 */
export const IMAGES = {
  AI_TECH: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485",
  TOKYO_SKYLINE: "https://images.unsplash.com/photo-1480796927426-f609979314bd",
  MICROCHIP: "https://images.unsplash.com/photo-1518770660439-4636190af475",
  STUDIO_HOST: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7",
  DATA_VIZ: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
  CITY_SUNSET: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df",
  OFFICE: "https://images.unsplash.com/photo-1497215728101-856f4ea42174",
  NATURE: "https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2",
  COFFEE_SHOP: "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
  MOUNTAIN: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
} as const;

/**
 * Helper to build image URL with Unsplash parameters
 */
export function buildImageUrl(
  baseUrl: string,
  options: { width?: number; quality?: number; fit?: string } = {},
): string {
  const { width = 600, quality = 80, fit = "crop" } = options;
  return `${baseUrl}?auto=format&fit=${fit}&w=${width}&q=${quality}`;
}
