// =============================================================================
// AI Model Registry — Single source of truth for all model identifiers
// =============================================================================

export const AI_MODELS = {
  text: {
    primary: "gemini-2.5-flash",
    lite: "gemini-2.5-flash-lite",
  },
  image: {
    primary: "gemini-3-pro-image-preview",
    fallback: "nano-banana-pro-preview",
  },
  video: {
    primary: "veo-3.1-generate-preview",
  },
  music: {
    primary: "models/lyria-realtime-exp",
  },
} as const;
