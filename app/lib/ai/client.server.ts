// =============================================================================
// Shared GenAI Client (Singleton)
// =============================================================================
// All AI service files should import from this module instead of creating
// their own GoogleGenAI instances.
// Unified on @google/genai SDK — @google/generative-ai has been removed.

import { GoogleGenAI } from "@google/genai";

let _client: GoogleGenAI | null = null;
let _alphaClient: GoogleGenAI | null = null;

/**
 * Get the shared GoogleGenAI client instance.
 * Returns null if GEMINI_API_KEY is not configured.
 */
export function getClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _client;
}

/**
 * Get the shared @google/genai v1alpha client (for Lyria 2 music generation).
 * Returns null if GEMINI_API_KEY is not configured.
 */
export function getAlphaClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!_alphaClient) {
    _alphaClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { apiVersion: "v1alpha" },
    });
  }
  return _alphaClient;
}
