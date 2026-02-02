/**
 * Enable Row Level Security (RLS) for all TubeGAI tables
 *
 * Usage:
 *   npx tsx app/drizzle/enable-rls.ts
 *
 * This script:
 * 1. Enables RLS on all tables
 * 2. Creates appropriate policies for each table
 */

import "dotenv/config";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Create database connection directly (bypass db.server.ts which may have SSR checks)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(connectionString);
const db = drizzle(client);

// ============================================
// RLS Policy Definitions
// ============================================

interface RLSPolicy {
  name: string;
  table: string;
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE";
  using?: string;
  withCheck?: string;
}

// Tables that need RLS enabled
const TABLES = [
  "profiles",
  "media_asset",
  "project",
  "channel",
  "label",
  "project_label",
  "saved_idea",
  "trend",
  "ai_recommendation",
  "studio_script",
  "studio_script_segment",
  "studio_storyboard",
  "studio_video",
  "studio_video_part",
  "studio_export_history",
  "studio_subtitle",
  "studio_seo",
  "audit_log",
];

// Policy definitions
const POLICIES: RLSPolicy[] = [
  // ============================================
  // 1. PROFILES
  // ============================================
  {
    name: "profiles_select_all",
    table: "profiles",
    operation: "SELECT",
    using: "true",
  },
  {
    name: "profiles_update_own",
    table: "profiles",
    operation: "UPDATE",
    using: "id = auth.uid()",
  },
  {
    name: "profiles_insert_own",
    table: "profiles",
    operation: "INSERT",
    withCheck: "id = auth.uid()",
  },
  {
    name: "profiles_delete_own",
    table: "profiles",
    operation: "DELETE",
    using: "id = auth.uid()",
  },

  // ============================================
  // 2. MEDIA_ASSET
  // ============================================
  {
    name: "media_asset_select_own",
    table: "media_asset",
    operation: "SELECT",
    using: "user_id = auth.uid()",
  },
  {
    name: "media_asset_insert_own",
    table: "media_asset",
    operation: "INSERT",
    withCheck: "user_id = auth.uid()",
  },
  {
    name: "media_asset_update_own",
    table: "media_asset",
    operation: "UPDATE",
    using: "user_id = auth.uid()",
  },
  {
    name: "media_asset_delete_own",
    table: "media_asset",
    operation: "DELETE",
    using: "user_id = auth.uid()",
  },

  // ============================================
  // 3. PROJECT
  // ============================================
  {
    name: "project_select_own",
    table: "project",
    operation: "SELECT",
    using: "user_id = auth.uid()",
  },
  {
    name: "project_insert_own",
    table: "project",
    operation: "INSERT",
    withCheck: "user_id = auth.uid()",
  },
  {
    name: "project_update_own",
    table: "project",
    operation: "UPDATE",
    using: "user_id = auth.uid()",
  },
  {
    name: "project_delete_own",
    table: "project",
    operation: "DELETE",
    using: "user_id = auth.uid()",
  },

  // ============================================
  // 4. CHANNEL
  // ============================================
  {
    name: "channel_select_own",
    table: "channel",
    operation: "SELECT",
    using: "user_id = auth.uid()",
  },
  {
    name: "channel_insert_own",
    table: "channel",
    operation: "INSERT",
    withCheck: "user_id = auth.uid()",
  },
  {
    name: "channel_update_own",
    table: "channel",
    operation: "UPDATE",
    using: "user_id = auth.uid()",
  },
  {
    name: "channel_delete_own",
    table: "channel",
    operation: "DELETE",
    using: "user_id = auth.uid()",
  },

  // ============================================
  // 5. LABEL
  // ============================================
  {
    name: "label_select_own_or_global",
    table: "label",
    operation: "SELECT",
    using: "user_id = auth.uid() OR user_id IS NULL",
  },
  {
    name: "label_insert_own",
    table: "label",
    operation: "INSERT",
    withCheck: "user_id = auth.uid()",
  },
  {
    name: "label_update_own",
    table: "label",
    operation: "UPDATE",
    using: "user_id = auth.uid()",
  },
  {
    name: "label_delete_own",
    table: "label",
    operation: "DELETE",
    using: "user_id = auth.uid()",
  },

  // ============================================
  // 6. PROJECT_LABEL
  // ============================================
  {
    name: "project_label_select_own",
    table: "project_label",
    operation: "SELECT",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "project_label_insert_own",
    table: "project_label",
    operation: "INSERT",
    withCheck: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "project_label_delete_own",
    table: "project_label",
    operation: "DELETE",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },

  // ============================================
  // 7. SAVED_IDEA
  // ============================================
  {
    name: "saved_idea_select_own",
    table: "saved_idea",
    operation: "SELECT",
    using: "user_id = auth.uid()",
  },
  {
    name: "saved_idea_insert_own",
    table: "saved_idea",
    operation: "INSERT",
    withCheck: "user_id = auth.uid()",
  },
  {
    name: "saved_idea_update_own",
    table: "saved_idea",
    operation: "UPDATE",
    using: "user_id = auth.uid()",
  },
  {
    name: "saved_idea_delete_own",
    table: "saved_idea",
    operation: "DELETE",
    using: "user_id = auth.uid()",
  },

  // ============================================
  // 8. TREND
  // ============================================
  {
    name: "trend_select_public_or_own",
    table: "trend",
    operation: "SELECT",
    using: "source = 'youtube_api' OR user_id = auth.uid() OR user_id IS NULL OR saved_by_user_id = auth.uid()",
  },
  {
    name: "trend_insert_authenticated",
    table: "trend",
    operation: "INSERT",
    withCheck: "auth.uid() IS NOT NULL",
  },
  {
    name: "trend_update_own_or_saved",
    table: "trend",
    operation: "UPDATE",
    using: "user_id = auth.uid() OR saved_by_user_id = auth.uid() OR (user_id IS NULL AND source = 'youtube_api')",
  },
  {
    name: "trend_delete_own",
    table: "trend",
    operation: "DELETE",
    using: "user_id = auth.uid()",
  },

  // ============================================
  // 9. AI_RECOMMENDATION
  // ============================================
  {
    name: "ai_recommendation_select_own_or_public",
    table: "ai_recommendation",
    operation: "SELECT",
    using: "user_id = auth.uid() OR user_id IS NULL",
  },
  {
    name: "ai_recommendation_insert_own",
    table: "ai_recommendation",
    operation: "INSERT",
    withCheck: "user_id = auth.uid() OR user_id IS NULL",
  },
  {
    name: "ai_recommendation_update_own",
    table: "ai_recommendation",
    operation: "UPDATE",
    using: "user_id = auth.uid()",
  },
  {
    name: "ai_recommendation_delete_own",
    table: "ai_recommendation",
    operation: "DELETE",
    using: "user_id = auth.uid()",
  },

  // ============================================
  // 10. STUDIO_SCRIPT
  // ============================================
  {
    name: "studio_script_select_own",
    table: "studio_script",
    operation: "SELECT",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_script_insert_own",
    table: "studio_script",
    operation: "INSERT",
    withCheck: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_script_update_own",
    table: "studio_script",
    operation: "UPDATE",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_script_delete_own",
    table: "studio_script",
    operation: "DELETE",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },

  // ============================================
  // 11. STUDIO_SCRIPT_SEGMENT
  // ============================================
  {
    name: "studio_script_segment_select_own",
    table: "studio_script_segment",
    operation: "SELECT",
    using: `EXISTS (SELECT 1 FROM "public"."studio_script" s JOIN "public"."project" p ON p.id = s.project_id WHERE s.id = script_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_script_segment_insert_own",
    table: "studio_script_segment",
    operation: "INSERT",
    withCheck: `EXISTS (SELECT 1 FROM "public"."studio_script" s JOIN "public"."project" p ON p.id = s.project_id WHERE s.id = script_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_script_segment_update_own",
    table: "studio_script_segment",
    operation: "UPDATE",
    using: `EXISTS (SELECT 1 FROM "public"."studio_script" s JOIN "public"."project" p ON p.id = s.project_id WHERE s.id = script_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_script_segment_delete_own",
    table: "studio_script_segment",
    operation: "DELETE",
    using: `EXISTS (SELECT 1 FROM "public"."studio_script" s JOIN "public"."project" p ON p.id = s.project_id WHERE s.id = script_id AND p.user_id = auth.uid())`,
  },

  // ============================================
  // 12. STUDIO_STORYBOARD
  // ============================================
  {
    name: "studio_storyboard_select_own",
    table: "studio_storyboard",
    operation: "SELECT",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_storyboard_insert_own",
    table: "studio_storyboard",
    operation: "INSERT",
    withCheck: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_storyboard_update_own",
    table: "studio_storyboard",
    operation: "UPDATE",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_storyboard_delete_own",
    table: "studio_storyboard",
    operation: "DELETE",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },

  // ============================================
  // 13. STUDIO_VIDEO
  // ============================================
  {
    name: "studio_video_select_own",
    table: "studio_video",
    operation: "SELECT",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_video_insert_own",
    table: "studio_video",
    operation: "INSERT",
    withCheck: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_video_update_own",
    table: "studio_video",
    operation: "UPDATE",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_video_delete_own",
    table: "studio_video",
    operation: "DELETE",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },

  // ============================================
  // 14. STUDIO_VIDEO_PART
  // ============================================
  {
    name: "studio_video_part_select_own",
    table: "studio_video_part",
    operation: "SELECT",
    using: `EXISTS (SELECT 1 FROM "public"."studio_video" v JOIN "public"."project" p ON p.id = v.project_id WHERE v.id = video_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_video_part_insert_own",
    table: "studio_video_part",
    operation: "INSERT",
    withCheck: `EXISTS (SELECT 1 FROM "public"."studio_video" v JOIN "public"."project" p ON p.id = v.project_id WHERE v.id = video_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_video_part_update_own",
    table: "studio_video_part",
    operation: "UPDATE",
    using: `EXISTS (SELECT 1 FROM "public"."studio_video" v JOIN "public"."project" p ON p.id = v.project_id WHERE v.id = video_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_video_part_delete_own",
    table: "studio_video_part",
    operation: "DELETE",
    using: `EXISTS (SELECT 1 FROM "public"."studio_video" v JOIN "public"."project" p ON p.id = v.project_id WHERE v.id = video_id AND p.user_id = auth.uid())`,
  },

  // ============================================
  // 15. STUDIO_EXPORT_HISTORY
  // ============================================
  {
    name: "studio_export_history_select_own",
    table: "studio_export_history",
    operation: "SELECT",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_export_history_insert_own",
    table: "studio_export_history",
    operation: "INSERT",
    withCheck: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_export_history_update_own",
    table: "studio_export_history",
    operation: "UPDATE",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_export_history_delete_own",
    table: "studio_export_history",
    operation: "DELETE",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },

  // ============================================
  // 16. STUDIO_SUBTITLE
  // ============================================
  {
    name: "studio_subtitle_select_own",
    table: "studio_subtitle",
    operation: "SELECT",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_subtitle_insert_own",
    table: "studio_subtitle",
    operation: "INSERT",
    withCheck: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_subtitle_update_own",
    table: "studio_subtitle",
    operation: "UPDATE",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_subtitle_delete_own",
    table: "studio_subtitle",
    operation: "DELETE",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },

  // ============================================
  // 17. STUDIO_SEO
  // ============================================
  {
    name: "studio_seo_select_own",
    table: "studio_seo",
    operation: "SELECT",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_seo_insert_own",
    table: "studio_seo",
    operation: "INSERT",
    withCheck: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_seo_update_own",
    table: "studio_seo",
    operation: "UPDATE",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },
  {
    name: "studio_seo_delete_own",
    table: "studio_seo",
    operation: "DELETE",
    using: `EXISTS (SELECT 1 FROM "public"."project" p WHERE p.id = project_id AND p.user_id = auth.uid())`,
  },

  // ============================================
  // 18. AUDIT_LOG
  // ============================================
  {
    name: "audit_log_select_own",
    table: "audit_log",
    operation: "SELECT",
    using: "user_id = auth.uid()",
  },
  {
    name: "audit_log_insert_system",
    table: "audit_log",
    operation: "INSERT",
    withCheck: "auth.uid() IS NOT NULL",
  },
];

// ============================================
// Helper Functions
// ============================================

async function enableRLSOnTable(table: string): Promise<void> {
  await db.execute(
    sql.raw(`ALTER TABLE "public"."${table}" ENABLE ROW LEVEL SECURITY`)
  );
  console.log(`✓ Enabled RLS on ${table}`);
}

async function dropPolicyIfExists(
  policyName: string,
  table: string
): Promise<void> {
  try {
    await db.execute(
      sql.raw(`DROP POLICY IF EXISTS "${policyName}" ON "public"."${table}"`)
    );
  } catch {
    // Policy doesn't exist, ignore
  }
}

async function createPolicy(policy: RLSPolicy): Promise<void> {
  // Drop existing policy first
  await dropPolicyIfExists(policy.name, policy.table);

  let policySQL = `CREATE POLICY "${policy.name}" ON "public"."${policy.table}" FOR ${policy.operation}`;

  if (policy.using) {
    policySQL += ` USING (${policy.using})`;
  }

  if (policy.withCheck) {
    policySQL += ` WITH CHECK (${policy.withCheck})`;
  }

  await db.execute(sql.raw(policySQL));
  console.log(`  ✓ Created policy: ${policy.name}`);
}

// ============================================
// Main Execution
// ============================================

async function enableRLS(): Promise<void> {
  console.log("🔐 Enabling Row Level Security for TubeGAI...\n");

  // Step 1: Enable RLS on all tables
  console.log("Step 1: Enabling RLS on tables...");
  for (const table of TABLES) {
    await enableRLSOnTable(table);
  }
  console.log("");

  // Step 2: Create policies
  console.log("Step 2: Creating RLS policies...");
  for (const policy of POLICIES) {
    await createPolicy(policy);
  }
  console.log("");

  console.log("✅ RLS setup complete!");
  console.log(`   - ${TABLES.length} tables with RLS enabled`);
  console.log(`   - ${POLICIES.length} policies created`);
}

// Run the script
enableRLS()
  .then(async () => {
    console.log("\n🎉 Done!");
    await client.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("\n❌ Error:", error);
    await client.end();
    process.exit(1);
  });
