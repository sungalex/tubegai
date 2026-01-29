/**
 * Database Client - Server Only
 *
 * This file provides the Drizzle ORM database client for server-side operations.
 * The `.server.ts` suffix ensures this code only runs on the server.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/index";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create postgres connection
const connection = postgres(process.env.DATABASE_URL, {
  // Supabase pooler settings
  prepare: false,
});

// Create drizzle instance with schema
export const db = drizzle(connection, { schema });

// Export schema for convenient access
export { schema };
