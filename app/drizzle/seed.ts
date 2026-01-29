/**
 * ============================================
 * Database Seed Script
 * ============================================
 *
 * This script populates the database with mock data for development.
 *
 * Usage:
 *   tsx app/drizzle/seed.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  projects,
  profiles,
  scripts,
  scriptSegments,
  storyboards,
  subtitles,
  seos,
  trends,
} from "./index";
import { PROJECTS, TRENDS_DATA } from "../common/mocks/project-mock";
import { MOCK_SCRIPTS, SUBTITLES } from "../common/mocks/studio-mock";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client, { schema: { projects, profiles, scripts, scriptSegments, storyboards, subtitles, seos, trends } });

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Step 1: Check if we have a user in auth.users
    console.log("\n1️⃣  Checking for existing users...");
    const existingUsers = await db.execute<{ id: string; email: string }>(
      `SELECT id, email FROM auth.users LIMIT 1`
    );

    if (existingUsers.length === 0) {
      console.log("❌ No users found in auth.users table.");
      console.log("   Please create a user via Supabase Auth first.");
      console.log("   You can sign up through your app or use Supabase dashboard.");
      process.exit(1);
    }

    const userId = existingUsers[0].id;
    const userEmail = existingUsers[0].email;
    console.log(`✅ Found user: ${userEmail} (${userId})`);

    // Step 2: Create or update profile
    console.log("\n2️⃣  Creating profile...");
    await db
      .insert(profiles)
      .values({
        id: userId,
        username: "demo_user",
        displayName: "Demo User",
        bio: "TubeGAI power user and content creator",
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          username: "demo_user",
          displayName: "Demo User",
          updatedAt: new Date(),
        },
      });
    console.log("✅ Profile created/updated");

    // Step 3: Insert Projects
    console.log("\n3️⃣  Inserting projects...");
    const projectIds: string[] = [];

    for (const mockProject of PROJECTS) {
      const statusMap: Record<string, "draft" | "in_progress" | "completed" | "archived"> = {
        "Draft": "draft",
        "In Progress": "in_progress",
        "Completed": "completed",
        "Processing": "in_progress",
      };

      const [insertedProject] = await db
        .insert(projects)
        .values({
          // Don't set id, let it auto-generate as UUID
          ownerId: userId,
          title: mockProject.title,
          description: `Video project: ${mockProject.title}`,
          type: "short",
          status: statusMap[mockProject.status] || "draft",
          progress: mockProject.progress,
          thumbnailUrl: mockProject.thumbnail,
          topic: "Technology",
          updatedAt: new Date(mockProject.lastModified),
        })
        .returning({ id: projects.id });

      projectIds.push(insertedProject.id);
      console.log(`   ✓ Project: ${mockProject.title}`);
    }

    // Step 4: Insert Script for first project
    console.log("\n4️⃣  Inserting scripts and script segments...");
    const firstProjectId = projectIds[0];

    const [insertedScript] = await db
      .insert(scripts)
      .values({
        projectId: firstProjectId,
        prompt: "Create an engaging video about AI and automation trends",
        targetDuration: 190, // Sum of all segment durations
      })
      .onConflictDoUpdate({
        target: scripts.projectId,
        set: {
          prompt: "Create an engaging video about AI and automation trends",
          targetDuration: 190,
        },
      })
      .returning({ id: scripts.id });

    console.log(`   ✓ Script created for project: ${firstProjectId}`);

    // Insert script segments
    for (let i = 0; i < MOCK_SCRIPTS.length; i++) {
      const segment = MOCK_SCRIPTS[i];
      await db
        .insert(scriptSegments)
        .values({
          scriptId: insertedScript.id,
          orderIndex: i + 1,
          type: segment.type,
          content: segment.content,
          estimatedDuration: segment.duration,
        })
        .onConflictDoNothing();
    }
    console.log(`   ✓ Inserted ${MOCK_SCRIPTS.length} script segments`);

    // Step 5: Insert Storyboards for first project
    console.log("\n5️⃣  Inserting storyboards...");

    // Import storyboard scenes from mock
    const { STORYBOARD_SCENES_POOL } = await import("../common/mocks/studio-mock");

    let sceneCount = 0;
    for (const scenes of Object.values(STORYBOARD_SCENES_POOL)) {
      for (const scene of scenes) {
        await db
          .insert(storyboards)
          .values({
            projectId: firstProjectId,
            sceneNumber: scene.sceneNumber,
            orderIndex: scene.sceneNumber,
            description: scene.description,
            visualPrompt: scene.visualPrompt,
          })
          .onConflictDoNothing();
        sceneCount++;
      }
    }
    console.log(`   ✓ Inserted ${sceneCount} storyboard scenes`);

    // Step 6: Insert Subtitles for first project
    console.log("\n6️⃣  Inserting subtitles...");
    for (const subtitle of SUBTITLES) {
      await db
        .insert(subtitles)
        .values({
          projectId: firstProjectId,
          startTime: subtitle.startTime,
          endTime: subtitle.endTime,
          text: subtitle.text,
        })
        .onConflictDoNothing();
    }
    console.log(`   ✓ Inserted ${SUBTITLES.length} subtitle segments`);

    // Step 7: Insert SEO data for first project
    console.log("\n7️⃣  Inserting SEO data...");
    const { SEO_TITLES, SEO_TAGS } = await import("../common/mocks/studio-mock");

    await db
      .insert(seos)
      .values({
        projectId: firstProjectId,
        title: SEO_TITLES[0],
        description: "Discover the future of AI and how it's reshaping our world. Learn about the latest trends, tools, and techniques in artificial intelligence.",
        tags: SEO_TAGS.slice(0, 5),
      })
      .onConflictDoUpdate({
        target: seos.projectId,
        set: {
          title: SEO_TITLES[0],
          tags: SEO_TAGS.slice(0, 5),
        },
      });
    console.log(`   ✓ SEO data inserted`);

    // Step 8: Insert Trends
    console.log("\n8️⃣  Inserting trend data...");

    for (const trendItem of TRENDS_DATA) {
      await db
        .insert(trends)
        .values({
          // userId is null = global/public trend
          title: trendItem.title,
          category: trendItem.category,
          viewsCount: trendItem.views,
          growthRate: trendItem.growth,
          thumbnailUrl: trendItem.thumbnail,
          tags: trendItem.tags,
          source: "ai_generated", // Default to AI generated for mock data
        })
        .onConflictDoNothing();
    }
    console.log(`   ✓ Inserted ${TRENDS_DATA.length} trending topics`);

    console.log("\n✅ Database seed completed successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`   - Projects: ${projectIds.length}`);
    console.log(`   - Script segments: ${MOCK_SCRIPTS.length}`);
    console.log(`   - Storyboard scenes: ${sceneCount}`);
    console.log(`   - Subtitles: ${SUBTITLES.length}`);
    console.log(`   - SEO data: 1`);
    console.log(`   - Trends: ${TRENDS_DATA.length}`);

  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seed();
