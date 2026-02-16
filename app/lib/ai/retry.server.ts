// =============================================================================
// Gemini API Retry Utility
// =============================================================================
// Exponential backoff retry wrapper for Gemini API calls.
// Handles transient errors (429, 503, network) with configurable retry count.

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
}

const RETRYABLE_STATUS_CODES = new Set([429, 500, 503]);

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Gemini API rate limit / server errors
    if (message.includes("429") || message.includes("rate limit")) return true;
    if (message.includes("503") || message.includes("overloaded")) return true;
    if (message.includes("500") || message.includes("internal")) return true;
    // Network errors
    if (message.includes("fetch failed") || message.includes("econnreset"))
      return true;
    if (message.includes("timeout") || message.includes("etimedout"))
      return true;
  }
  // Check for HTTP status-like properties
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  ) {
    return RETRYABLE_STATUS_CODES.has(
      (error as { status: number }).status,
    );
  }
  return false;
}

/**
 * Retry an async function with exponential backoff.
 * Only retries on transient errors (rate limits, server errors, network issues).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000 } = options ?? {};

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(
        `[Gemini Retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms...`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error("Unreachable");
}
