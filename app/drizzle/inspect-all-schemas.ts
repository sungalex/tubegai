import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function inspect() {
  console.log("🔍 Inspecting all schemas and tables...\n");

  try {
    // Get all schemas
    const schemas = await db.execute<{ schema_name: string }>(sql`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name;
    `);

    console.log("📋 Available Schemas:");
    for (const schema of schemas) {
      console.log(`  • ${schema.schema_name}`);
    }

    // Get all tables across all schemas
    console.log("\n📊 Tables by Schema:");
    console.log("================================\n");

    const tables = await db.execute<{ table_schema: string; table_name: string }>(sql`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY table_schema, table_name;
    `);

    let currentSchema = "";
    for (const table of tables) {
      if (table.table_schema !== currentSchema) {
        currentSchema = table.table_schema;
        console.log(`\n${currentSchema} schema:`);
        console.log("─".repeat(40));
      }
      console.log(`  • ${table.table_name}`);
    }

    console.log("\n✅ Inspection complete!\n");

  } catch (error) {
    console.error("❌ Inspection failed:", error);
  } finally {
    await client.end();
  }
}

inspect();
