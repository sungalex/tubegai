/**
 * ============================================
 * Inspect TubeGAI Schema
 * ============================================
 *
 * This script inspects the tubegai schema to verify all MVP tables and fields.
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function inspect() {
  console.log("🔍 Inspecting TubeGAI tables (in public schema)...\n");

  try {
    // Get all tables in tubegai schema
    const tables = await db.execute<{ table_name: string }>(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'media_asset', 'profiles', 'project', 'trend',
          'studio_export_history', 'studio_script', 'studio_script_segment',
          'studio_seo', 'studio_storyboard', 'studio_subtitle', 'studio_video'
        )
      ORDER BY table_name;
    `);

    console.log("📋 TubeGAI Tables (in public schema):");
    console.log("================================");

    if (tables.length === 0) {
      console.log("❌ No TubeGAI tables found!");
      console.log("\nMake sure you've run: npm run db:migrate\n");
      return;
    }

    for (const table of tables) {
      console.log(`\n📊 Table: ${table.table_name}`);
      console.log("─".repeat(50));

      // Get columns for this table
      const columns = await db.execute<{
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
      }>(sql`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${table.table_name}
        ORDER BY ordinal_position;
      `);

      for (const col of columns) {
        const nullable = col.is_nullable === "YES" ? "NULL" : "NOT NULL";
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : "";
        console.log(`  • ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
      }

      // Get foreign keys
      const foreignKeys = await db.execute<{
        constraint_name: string;
        column_name: string;
        foreign_table: string;
        foreign_column: string;
      }>(sql`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table,
          ccu.column_name AS foreign_column
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = ${table.table_name};
      `);

      if (foreignKeys.length > 0) {
        console.log("\n  🔗 Foreign Keys:");
        for (const fk of foreignKeys) {
          console.log(`     ${fk.column_name} → ${fk.foreign_table}.${fk.foreign_column}`);
        }
      }
    }

    // Get all enums in public schema
    console.log("\n\n📝 Enums in 'public' schema:");
    console.log("================================");

    const enums = await db.execute<{
      enum_name: string;
    }>(sql`
      SELECT
        t.typname as enum_name
      FROM pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typtype = 'e'
      ORDER BY t.typname;
    `);

    for (const enumType of enums) {
      const enumValues = await db.execute<{ enum_value: string }>(sql`
        SELECT enumlabel as enum_value
        FROM pg_enum
        WHERE enumtypid = (
          SELECT oid
          FROM pg_type
          WHERE typname = ${enumType.enum_name}
            AND typnamespace = (
              SELECT oid
              FROM pg_namespace
              WHERE nspname = 'public'
            )
        )
        ORDER BY enumsortorder;
      `);

      const values = enumValues.map(v => v.enum_value).join(", ");
      console.log(`\n  🏷️  ${enumType.enum_name}`);
      console.log(`     Values: ${values}`);
    }

    console.log("\n\n✅ Inspection complete!\n");

  } catch (error) {
    console.error("❌ Inspection failed:", error);
  } finally {
    await client.end();
  }
}

inspect();
