// =============================================================================
// Authentication Client Functions (Browser-side)
// =============================================================================
// Supabase Auth를 사용한 인증 기능
// - 이메일/비밀번호 로그인 및 회원가입
// - GitHub OAuth 로그인
// - Google OAuth 로그인
// - 로그아웃

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "database.types";

// =============================================================================
// Types
// =============================================================================

export interface AuthResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  provider: string | null;
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
// Email/Password Authentication
// =============================================================================

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[Auth] Sign in error:", error);
    return { success: false, error: getErrorMessage(error.message) };
  }

  return { success: true, redirectTo: "/projects" };
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("[Auth] Sign up error:", error);
    return { success: false, error: getErrorMessage(error.message) };
  }

  return { success: true };
}

// =============================================================================
// OAuth Authentication
// =============================================================================

/**
 * Sign in with GitHub OAuth
 */
export async function signInWithGitHub(): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("[Auth] GitHub sign in error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("[Auth] Google sign in error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================================================
// Session Management
// =============================================================================

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[Auth] Sign out error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, redirectTo: "/" };
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Determine provider from identities
  const provider = user.app_metadata?.provider ||
    user.identities?.[0]?.provider ||
    "email";

  return {
    id: user.id,
    email: user.email ?? null,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    avatarUrl: user.user_metadata?.avatar_url ?? null,
    provider,
  };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
) {
  const supabase = getSupabaseClient();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (session?.user) {
        const provider = session.user.app_metadata?.provider ||
          session.user.identities?.[0]?.provider ||
          "email";

        callback({
          id: session.user.id,
          email: session.user.email ?? null,
          name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? null,
          avatarUrl: session.user.user_metadata?.avatar_url ?? null,
          provider,
        });
      } else {
        callback(null);
      }
    }
  );

  return () => subscription.unsubscribe();
}

// =============================================================================
// Password Reset
// =============================================================================

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    console.error("[Auth] Password reset error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================================================
// Helper Functions
// =============================================================================

function getErrorMessage(message: string): string {
  // Map Supabase error messages to user-friendly Korean messages
  const errorMap: Record<string, string> = {
    "Invalid login credentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
    "Email not confirmed": "이메일 인증이 필요합니다. 이메일을 확인해주세요.",
    "User already registered": "이미 가입된 이메일입니다.",
    "Password should be at least 6 characters": "비밀번호는 최소 6자 이상이어야 합니다.",
    "Unable to validate email address: invalid format": "올바른 이메일 형식이 아닙니다.",
  };

  return errorMap[message] || message;
}

// =============================================================================
// Global Type Declaration
// =============================================================================

declare global {
  interface Window {
    ENV: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
    };
  }
}
