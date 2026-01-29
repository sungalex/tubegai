// =============================================================================
// Shared Types
// =============================================================================

/**
 * Common color definition
 * Used for label colors, B-roll filters, etc.
 */
export interface Color {
  name: string;
  value: string; // Tailwind class name (e.g., "bg-red-500")
}

/**
 * Common image URLs used across the application
 */
export interface ImageAsset {
  id: string;
  url: string;
  alt?: string;
}
