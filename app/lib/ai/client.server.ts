// =============================================================================
// Shared Gemini Client (Singleton)
// =============================================================================
// All AI service files should import from this module instead of creating
// their own GoogleGenerativeAI instances.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";

let _client: GoogleGenerativeAI | null = null;
let _genaiClient: GoogleGenAI | null = null;
let _genaiAlphaClient: GoogleGenAI | null = null;

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

/**
 * Get the shared @google/genai client (for Veo 3 video generation).
 * Returns null if GEMINI_API_KEY is not configured.
 */
export function getGenAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!_genaiClient) {
    _genaiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _genaiClient;
}

/**
 * Get the shared @google/genai v1alpha client (for Lyria 2 music generation).
 * Returns null if GEMINI_API_KEY is not configured.
 */
export function getGenAIAlphaClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!_genaiAlphaClient) {
    _genaiAlphaClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { apiVersion: "v1alpha" },
    });
  }
  return _genaiAlphaClient;
}
