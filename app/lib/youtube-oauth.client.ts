// =============================================================================
// YouTube OAuth Client Functions (Browser-side)
// =============================================================================
// Uses Supabase Auth for Google/YouTube OAuth integration
// Provider tokens are managed by Supabase Auth (auth.identities)

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "database.types";

// =============================================================================
// Types
// =============================================================================

export interface YouTubeOAuthResult {
  success: boolean;
  error?: string;
}

export interface ProviderTokens {
  accessToken: string | null;
  refreshToken: string | null;
  providerRefreshToken?: string | null;
}

// =============================================================================
// Supabase Browser Client
// =============================================================================

function getSupabaseClient() {
  return createBrowserClient<Database>(
    window.ENV.SUPABASE_URL,
    window.ENV.SUPABASE_ANON_KEY
  );
}

// =============================================================================
// OAuth Functions
// =============================================================================

/**
 * Initiate YouTube OAuth flow via Supabase Auth
 * This will redirect the user to Google's consent screen
 *
 * Required scopes:
 * - youtube.readonly: Read channel information
 * - youtube.upload: Upload videos
 * - youtube: Full YouTube access
 */
export async function initiateYouTubeOAuth(
  redirectTo: string = "/projects/channels/callback"
): Promise<YouTubeOAuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${redirectTo}`,
      scopes: [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube",
      ].join(" "),
      queryParams: {
        access_type: "offline",
        prompt: "select_account consent",
      },
    },
  });

  if (error) {
    console.error("[YouTube OAuth] Error initiating OAuth:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Link YouTube account to existing user session
 * Use this when user is already logged in but wants to add YouTube access
 *
 * Note: Uses signInWithOAuth which will:
 * - If user not logged in: create new account or sign in
 * - If user already logged in: link Google identity to existing account
 */
export async function linkYouTubeAccount(
  redirectTo: string = "/projects/channels/callback"
): Promise<YouTubeOAuthResult> {
  const supabase = getSupabaseClient();

  // Use signInWithOAuth instead of linkIdentity for better compatibility
  // This works whether user is logged in or not
  //
  // Note: Using 'select_account' prompt to show Google Account picker
  // instead of YouTube channel picker. This allows us to get all channels
  // the account has access to, not just the selected one.
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${redirectTo}`,
      scopes: [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube",
      ].join(" "),
      queryParams: {
        access_type: "offline",
        prompt: "select_account consent",
      },
    },
  });

  if (error) {
    console.error("[YouTube OAuth] Error initiating OAuth:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get provider tokens from current session
 * Note: This only works immediately after OAuth callback
 * For stored tokens, use server-side functions
 */
export async function getProviderTokens(): Promise<ProviderTokens | null> {
  const supabase = getSupabaseClient();

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  return {
    accessToken: session.provider_token ?? null,
    refreshToken: session.provider_refresh_token ?? null,
  };
}

/**
 * Check if user has YouTube OAuth connected
 */
export async function isYouTubeConnected(): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  // Check if user has a Google identity with YouTube scopes
  const googleIdentity = user.identities?.find(
    (identity) => identity.provider === "google"
  );

  return !!googleIdentity;
}

/**
 * Get Google identity information
 */
export async function getGoogleIdentity() {
  const supabase = getSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const googleIdentity = user.identities?.find(
    (identity) => identity.provider === "google"
  );

  if (!googleIdentity) {
    return null;
  }

  return {
    id: googleIdentity.id,
    email: googleIdentity.identity_data?.email as string | undefined,
    name: googleIdentity.identity_data?.full_name as string | undefined,
    picture: googleIdentity.identity_data?.avatar_url as string | undefined,
    createdAt: googleIdentity.created_at,
    updatedAt: googleIdentity.updated_at,
  };
}

// =============================================================================
// Global Type Declaration for window.ENV
// =============================================================================

declare global {
  interface Window {
    ENV: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
    };
  }
}
