// =============================================================================
// Color Constants
// =============================================================================

import type { Color } from "../types/shared.types";
import type { LabelColor } from "../types/project.types";

/**
 * Standard color palette used throughout the application
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

/**
 * Label color options for label management
 */
/**
 * B-Roll color filter options
 */
export const BROLL_COLORS: { name: string; class: string }[] = [
  { name: "red", class: "bg-red-500" },
  { name: "orange", class: "bg-orange-500" },
  { name: "yellow", class: "bg-yellow-500" },
  { name: "green", class: "bg-green-500" },
  { name: "turquoise", class: "bg-cyan-400" },
  { name: "blue", class: "bg-blue-500" },
  { name: "violet", class: "bg-violet-500" },
  { name: "pink", class: "bg-pink-500" },
  { name: "brown", class: "bg-amber-800" },
  { name: "black", class: "bg-black" },
  { name: "gray", class: "bg-gray-500" },
  { name: "white", class: "bg-white border" },
];

export const LABEL_COLORS: LabelColor[] = [
  { name: "Red", value: "bg-red-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Amber", value: "bg-amber-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Slate", value: "bg-slate-500" },
];
