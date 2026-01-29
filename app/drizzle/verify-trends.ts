import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function verifyTrends() {
  console.log("🔍 Verifying trend data...\n");

  try {
    const trends = await db.execute<{
      id: string;
      title: string;
      category: string;
      views_count: string;
      growth_rate: string;
      tags: string[];
      source: string;
    }>(sql`
      SELECT id, title, category, views_count, growth_rate, tags, source
      FROM trend
      ORDER BY created_at DESC;
    `);

    console.log(`✅ Found ${trends.length} trends in database:\n`);

    for (const trend of trends) {
      console.log(`📊 ${trend.title}`);
      console.log(`   Category: ${trend.category}`);
      console.log(`   Views: ${trend.views_count} | Growth: ${trend.growth_rate}`);
      console.log(`   Tags: ${trend.tags.join(", ")}`);
      console.log(`   Source: ${trend.source}\n`);
    }

  } catch (error) {
    console.error("❌ Verification failed:", error);
  } finally {
    await client.end();
  }
}

verifyTrends();
