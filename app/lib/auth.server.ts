/**
 * Authentication Helpers - Server Only
 *
 * This file provides authentication utilities for server-side operations.
 */

import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import type { Database } from "database.types";
import { db } from "./db.server";
import { sql } from "drizzle-orm";

// Development mode flag
const isDev = process.env.NODE_ENV !== "production";

/**
 * Create a Supabase client for server-side operations
 */
export function createSupabaseServerClient(request: Request) {
  const headers = new Headers();

  const supabase = createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = parseCookieHeader(request.headers.get("Cookie") ?? "");
          return cookies.map(({ name, value }) => ({ name, value: value ?? "" }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            headers.append("Set-Cookie", serializeCookieHeader(name, value, options))
          );
        },
      },
    }
  );

  return { supabase, headers };
}

/**
 * Get the current authenticated user ID from the request
 * Returns null if not authenticated
 */
export async function getCurrentUserId(request: Request): Promise<string | null> {
  const { supabase } = createSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Get a development user ID from the database
 * Used only in development mode when no session exists
 */
async function getDevUserId(): Promise<string | null> {
  try {
    const result = await db.execute<{ id: string }>(
      sql`SELECT id FROM auth.users LIMIT 1`
    );
    return result[0]?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Require authentication - throws redirect if not authenticated
 * Returns the user ID if authenticated
 * In development mode, falls back to first user in database
 */
export async function requireAuth(request: Request): Promise<string> {
  const userId = await getCurrentUserId(request);

  if (userId) {
    return userId;
  }

  // Development fallback: use first user from database
  if (isDev) {
    const devUserId = await getDevUserId();
    if (devUserId) {
      console.log("[DEV] Using fallback user:", devUserId);
      return devUserId;
    }
  }

  throw new Response(null, {
    status: 302,
    headers: { Location: "/auth/login" },
  });
}
