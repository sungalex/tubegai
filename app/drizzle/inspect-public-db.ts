import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function inspect() {
  console.log("🔍 Inspecting database tables...");
  try {
    const tables = await db.execute(sql`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("Found tables:");
    tables.forEach((row) => {
      console.log(`- ${row.table_schema}.${row.table_name}`);
    });
  } catch (error) {
    console.error("❌ Inspection failed:", error);
  } finally {
    await client.end();
  }
}

inspect();
