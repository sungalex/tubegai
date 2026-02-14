// =============================================================================
// Shared Gemini Client (Singleton)
// =============================================================================
// All AI service files should import from this module instead of creating
// their own GoogleGenerativeAI instances.

import { GoogleGenerativeAI } from "@google/generative-ai";

let _client: GoogleGenerativeAI | null = null;

/**
 * Get the shared GoogleGenerativeAI client instance.
 * Returns null if GEMINI_API_KEY is not configured.
 */
export function getGeminiClient(): GoogleGenerativeAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!_client) {
    _client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _client;
}

/**
 * Get a generative model with optional systemInstruction.
 * Uses the shared client instance.
 */
export function getTextModel(
  modelName: string,
  systemInstruction?: string,
) {
  const client = getGeminiClient();
  if (!client) return null;
  return client.getGenerativeModel({
    model: modelName,
    ...(systemInstruction ? { systemInstruction } : {}),
  });
}
