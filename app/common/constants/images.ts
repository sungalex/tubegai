// =============================================================================
// Image Constants
// =============================================================================

/**
 * Frequently used image URLs
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
