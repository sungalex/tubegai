# Supabase Schema Improvement Plan
**Based on:** MVP_FEATURE_SCHEMA_ANALYSIS.md
**Date:** 2026-01-30

---

## Overview

This plan addresses critical gaps preventing MVP launch and outlines a phased approach to schema improvements.

### Current State: 60-70% MVP Ready
- ✅ Core workflow tables exist
- ❌ 3 critical tables disabled
- ❌ 1 critical table missing
- ⚠️ Several incomplete implementations

### Target State: 100% MVP Ready
- ✅ All MVP features functional
- ✅ Complete workflow support
- ✅ Proper data integrity

---

## Phase 1: Critical Fixes (P0) - MVP Blocker Resolution

**Timeline:** 1-2 days
**Goal:** Unblock MVP launch by enabling core functionality

### 1.1 Enable Channel Management

**Problem:**
```typescript
// New Project Page requires channel selection
channelId: string (required in form)
// BUT: project.channel_id is DISABLED in schema
```

**Impact:** 🔴 Cannot create projects

**Solution:**

#### Step 1.1.1: Uncomment Channel Schema
**File:** `app/features/project/project-schema.ts`

```typescript
// BEFORE (commented out)
// export const channels = tubegaiSchema.table("channel", {...});

// AFTER (uncommented)
export const channels = tubegaiSchema.table("channel", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  youtubeChannelId: text("youtube_channel_id").unique().notNull(),
  name: text("name").notNull(),
  handle: text("handle"),
  avatarUrl: text("avatar_url"),
  accessToken: text("access_token"), // For YouTube API
  refreshToken: text("refresh_token"),
  status: channelStatusEnum("status").default("active").notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const channelsRelations = relations(channels, ({ one, many }) => ({
  user: one(users, {
    fields: [channels.userId],
    references: [users.id],
  }),
  projects: many(projects),
}));
```

#### Step 1.1.2: Add Enum
**File:** `app/drizzle/enums.ts`

```typescript
export const channelStatusEnum = tubegaiSchema.enum("channel_status", [
  "active",
  "error",
  "syncing",
]);
```

#### Step 1.1.3: Enable project.channel_id
**File:** `app/features/project/project-schema.ts`

```typescript
export const projects = tubegaiSchema.table("project", {
  // ... existing fields ...
  channelId: uuid("channel_id").references(() => channels.id, {
    onDelete: "set null"
  }), // Make nullable for backward compatibility
});

// Update relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  // ... existing relations ...
  channel: one(channels, {
    fields: [projects.channelId],
    references: [channels.id],
  }),
}));
```

#### Step 1.1.4: Generate & Apply Migration
```bash
npm run db:generate
# Review: app/drizzle/migrations/0005_*.sql
npm run db:migrate
```

#### Step 1.1.5: Update Seed Script
**File:** `app/drizzle/seed.ts`

```typescript
import { channels } from "./index";

// After profile creation
console.log("\n2.5️⃣  Creating default channel...");
const [defaultChannel] = await db
  .insert(channels)
  .values({
    userId: userId,
    youtubeChannelId: "UC_demo_channel_123",
    name: "Demo Channel",
    handle: "@demochannel",
    status: "active",
  })
  .onConflictDoUpdate({
    target: channels.youtubeChannelId,
    set: { name: "Demo Channel", updatedAt: new Date() },
  })
  .returning({ id: channels.id });

// Update project creation
const [insertedProject] = await db
  .insert(projects)
  .values({
    // ... existing fields ...
    channelId: defaultChannel.id, // Add channel reference
  })
  .returning({ id: projects.id });
```

**Testing:**
- ✅ Create new project with channel selection
- ✅ Form validation passes
- ✅ Project saves successfully
- ✅ Channel displayed in project details

---

### 1.2 Enable Label Management

**Problem:**
```typescript
// Users can select labels but they don't persist
labels: string[] // Selected in form but discarded
```

**Impact:** 🔴 Labels feature non-functional

**Solution:**

#### Step 1.2.1: Uncomment Label Schemas
**File:** `app/features/project/project-schema.ts`

```typescript
export const labels = tubegaiSchema.table("label", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  color: text("color").default("bg-slate-500").notNull(), // Tailwind class
  description: text("description"),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectLabels = tubegaiSchema.table("project_label", {
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  labelId: uuid("label_id")
    .references(() => labels.id, { onDelete: "cascade" })
    .notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.projectId, table.labelId] }),
}));

// Relations
export const labelsRelations = relations(labels, ({ one, many }) => ({
  user: one(users, {
    fields: [labels.userId],
    references: [users.id],
  }),
  projectLabels: many(projectLabels),
}));

export const projectLabelsRelations = relations(projectLabels, ({ one }) => ({
  project: one(projects, {
    fields: [projectLabels.projectId],
    references: [projects.id],
  }),
  label: one(labels, {
    fields: [projectLabels.labelId],
    references: [labels.id],
  }),
}));

// Update projects relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  // ... existing relations ...
  labels: many(projectLabels),
}));
```

#### Step 1.2.2: Generate & Apply Migration
```bash
npm run db:generate
npm run db:migrate
```

#### Step 1.2.3: Update Seed Script
```typescript
import { labels, projectLabels } from "./index";
import { LABELS } from "../common/mocks/project-mock";

console.log("\n2.7️⃣  Creating labels...");
const labelIds: Record<string, string> = {};

for (const mockLabel of LABELS) {
  const [label] = await db
    .insert(labels)
    .values({
      id: mockLabel.id,
      name: mockLabel.name,
      color: mockLabel.color,
      userId: userId,
    })
    .onConflictDoUpdate({
      target: labels.id,
      set: { name: mockLabel.name, color: mockLabel.color },
    })
    .returning({ id: labels.id });

  labelIds[mockLabel.id] = label.id;
}

// Attach labels to first project
console.log("\n2.8️⃣  Attaching labels to projects...");
await db.insert(projectLabels).values([
  { projectId: projectIds[0], labelId: labelIds["l1"] }, // Urgent
  { projectId: projectIds[0], labelId: labelIds["l3"] }, // Marketing
]).onConflictDoNothing();
```

**Testing:**
- ✅ Create/edit/delete labels
- ✅ Attach labels to projects
- ✅ Labels persist across page reloads
- ✅ Cascade delete works

---

### 1.3 Add Video Part Tracking

**Problem:**
```typescript
// Scene page splits long videos into 4-second parts
Scene (8s) → Part 1 (0-4s), Part 2 (4-8s)
// BUT: No table to track individual part status
```

**Impact:** 🔴 Cannot show progress per video part

**Solution:**

#### Step 1.3.1: Create Video Part Schema
**File:** `app/features/studio/studio-schema.ts`

```typescript
export const videoPartStatusEnum = tubegaiSchema.enum("video_part_status", [
  "pending",
  "generating",
  "completed",
  "failed",
]);

export const videoParts = tubegaiSchema.table("studio_video_part", {
  id: uuid("id").defaultRandom().primaryKey(),
  videoId: uuid("video_id")
    .references(() => sceneVideos.id, { onDelete: "cascade" })
    .notNull(),
  partNumber: integer("part_number").notNull(),
  startTime: doublePrecision("start_time").notNull(),
  endTime: doublePrecision("end_time").notNull(),
  duration: doublePrecision("duration").notNull(),
  status: videoPartStatusEnum("status").default("pending").notNull(),
  videoAssetId: uuid("video_asset_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueVideoPart: unique().on(table.videoId, table.partNumber),
}));

export const videoPartsRelations = relations(videoParts, ({ one }) => ({
  video: one(sceneVideos, {
    fields: [videoParts.videoId],
    references: [sceneVideos.id],
  }),
  videoAsset: one(mediaAssets, {
    fields: [videoParts.videoAssetId],
    references: [mediaAssets.id],
  }),
}));

// Update sceneVideos relations
export const sceneVideosRelations = relations(sceneVideos, ({ one, many }) => ({
  // ... existing relations ...
  parts: many(videoParts),
}));
```

#### Step 1.3.2: Add Enum to index
**File:** `app/drizzle/enums.ts`

```typescript
export const videoPartStatusEnum = tubegaiSchema.enum("video_part_status", [
  "pending",
  "generating",
  "completed",
  "failed",
]);
```

#### Step 1.3.3: Generate & Apply Migration
```bash
npm run db:generate
npm run db:migrate
```

#### Step 1.3.4: Update Seed Script (Optional)
```typescript
// Add sample video parts for demonstration
console.log("\n8️⃣  Creating sample video parts...");

// Find first storyboard
const storyboards = await db.select().from(storyboards).limit(1);
if (storyboards.length > 0) {
  const [video] = await db
    .insert(sceneVideos)
    .values({
      storyboardId: storyboards[0].id,
      projectId: firstProjectId,
      duration: 8.0,
      status: "generating",
    })
    .returning({ id: sceneVideos.id });

  // Create 2 parts (8 seconds → 2 x 4 seconds)
  await db.insert(videoParts).values([
    {
      videoId: video.id,
      partNumber: 1,
      startTime: 0,
      endTime: 4,
      duration: 4,
      status: "completed",
    },
    {
      videoId: video.id,
      partNumber: 2,
      startTime: 4,
      endTime: 8,
      duration: 4,
      status: "generating",
    },
  ]);
}
```

**Testing:**
- ✅ Scene >5 seconds auto-splits into parts
- ✅ Each part has independent status
- ✅ Progress shows per-part status
- ✅ Video generation updates part status

---

### Phase 1 Summary

**Migration Script:** `0005_enable_mvp_features.sql`

**Changes:**
- ✅ 3 new tables: channel, label, project_label
- ✅ 1 new table: studio_video_part
- ✅ 3 new enums: channel_status, video_part_status, (label already uses text)
- ✅ 1 updated table: project (add channel_id)
- ✅ Updated seed script with sample data

**Estimated Time:**
- Schema changes: 2 hours
- Migration testing: 1 hour
- Seed script updates: 1 hour
- Integration testing: 2 hours
- **Total: ~6 hours (1 day)**

**Risk Level:** 🟡 Medium
- Existing data unaffected (additive changes only)
- Backward compatible (channel_id nullable)
- Can be applied incrementally

---

## Phase 2: Important Improvements (P1) - UX Enhancement

**Timeline:** 2-3 days
**Goal:** Improve user experience and data integrity

### 2.1 Strengthen Storyboard-Script Linkage

**Problem:**
```sql
-- Current: Optional linkage
studio_storyboard.script_segment_id uuid NULL

-- Issue: Scenes may not group properly by script segment
```

**Impact:** 🟡 Poor UX in storyboard page

**Solution:**

#### Step 2.1.1: Make script_segment_id Required
```sql
-- Migration
ALTER TABLE studio_storyboard
  ALTER COLUMN script_segment_id SET NOT NULL;

-- Add constraint
ALTER TABLE studio_storyboard
  ADD CONSTRAINT storyboard_must_have_script
  CHECK (script_segment_id IS NOT NULL);
```

#### Step 2.1.2: Add Missing Duration Field
```sql
ALTER TABLE studio_storyboard
  ADD COLUMN duration integer;

COMMENT ON COLUMN studio_storyboard.duration IS
  'Expected duration of this scene in seconds';
```

#### Step 2.1.3: Update Seed Script
```typescript
// Ensure all storyboards link to script segments
const scriptSegments = await db.select().from(scriptSegments);

for (const scene of STORYBOARD_SCENES_POOL) {
  await db.insert(storyboards).values({
    projectId: firstProjectId,
    scriptSegmentId: scriptSegments[scene.segmentIndex].id, // Required!
    sceneNumber: scene.sceneNumber,
    description: scene.description,
    visualPrompt: scene.visualPrompt,
    duration: scene.duration, // Add duration
  });
}
```

**Testing:**
- ✅ All scenes must have script segment
- ✅ Scenes group correctly by segment
- ✅ Duration displayed per scene
- ✅ Validation prevents orphan scenes

---

### 2.2 Persist Export Settings

**Problem:**
```typescript
// User configures settings but they reset on page refresh
const [settings, setSettings] = useState({ ... }); // Lost on reload
```

**Impact:** 🟡 Poor UX, settings not remembered

**Solution:**

#### Step 2.2.1: Expand Export History Fields
```sql
ALTER TABLE studio_export_history
  ADD COLUMN frame_rate integer DEFAULT 30,
  ADD COLUMN quality text DEFAULT 'high',
  ADD COLUMN hardware_acceleration boolean DEFAULT true,
  ADD COLUMN privacy text,
  ADD COLUMN scheduled_at timestamp;

-- Add comments
COMMENT ON COLUMN studio_export_history.frame_rate IS
  'Video frame rate: 24, 30, or 60 fps';
COMMENT ON COLUMN studio_export_history.quality IS
  'Encoding quality: low, medium, high';
COMMENT ON COLUMN studio_export_history.privacy IS
  'YouTube privacy: public, unlisted, private';
```

#### Step 2.2.2: Add Missing Enum Values
```sql
-- Add "webm" to format
ALTER TYPE export_format ADD VALUE IF NOT EXISTS 'webm';

-- Add "720p" to resolution
ALTER TYPE export_resolution ADD VALUE IF NOT EXISTS '720p';
```

#### Step 2.2.3: Create Project Export Settings Table (Alternative)
```typescript
// For persisting user preferences across exports
export const exportSettings = tubegaiSchema.table("studio_export_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  resolution: exportResolutionEnum("resolution").default("1080p"),
  frameRate: integer("frame_rate").default(30),
  format: exportFormatEnum("format").default("mp4"),
  quality: text("quality").default("high"),
  hardwareAcceleration: boolean("hardware_acceleration").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Testing:**
- ✅ Settings persist across page reloads
- ✅ Each project remembers its export preferences
- ✅ All format options available
- ✅ Resolution options include 720p

---

### 2.3 Add Index Optimizations

**Problem:** Queries may be slow on large datasets

**Solution:**

```sql
-- Project queries
CREATE INDEX idx_project_user_id ON project(user_id);
CREATE INDEX idx_project_status ON project(status);
CREATE INDEX idx_project_updated_at ON project(updated_at DESC);

-- Script segment ordering
CREATE INDEX idx_script_segment_script_id ON studio_script_segment(script_id, order_index);

-- Storyboard queries
CREATE INDEX idx_storyboard_project_id ON studio_storyboard(project_id);
CREATE INDEX idx_storyboard_script_segment ON studio_storyboard(script_segment_id);

-- Video queries
CREATE INDEX idx_video_storyboard ON studio_video(storyboard_id);
CREATE INDEX idx_video_project ON studio_video(project_id);

-- Video part queries
CREATE INDEX idx_video_part_video_id ON studio_video_part(video_id, part_number);

-- Export history
CREATE INDEX idx_export_project ON studio_export_history(project_id);
CREATE INDEX idx_export_status ON studio_export_history(status);

-- Trend queries
CREATE INDEX idx_trend_user ON trend(user_id);
CREATE INDEX idx_trend_category ON trend(category);
CREATE INDEX idx_trend_unused ON trend(used_for_project_id) WHERE used_for_project_id IS NULL;
```

**Testing:**
- ✅ Query performance improved
- ✅ Dashboard loads faster
- ✅ Studio pages responsive

---

### Phase 2 Summary

**Migration Script:** `0006_improve_ux_and_integrity.sql`

**Changes:**
- ✅ Strengthen storyboard linkage
- ✅ Add export settings fields
- ✅ Add performance indexes
- ✅ Add missing enum values

**Estimated Time:**
- Schema changes: 3 hours
- Index optimization: 2 hours
- Testing: 3 hours
- **Total: ~8 hours (1 day)**

**Risk Level:** 🟢 Low
- Indexes don't affect data
- Field additions are backward compatible
- Can be rolled back easily

---

## Phase 3: Optional Enhancements (P2) - Nice-to-Have

**Timeline:** 1-2 days
**Goal:** Add supporting features for better experience

### 3.1 Add AI Recommendations Table

**Current:** Recommendations are ephemeral (not saved)

**Solution:**

```typescript
export const aiRecommendations = tubegaiSchema.table("ai_recommendation", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  reason: text("reason").notNull(),
  growthRate: text("growth_rate"),
  category: text("category"),
  score: integer("score"), // Relevance score 0-100
  trendId: uuid("trend_id").references(() => trends.id, { onDelete: "set null" }),
  usedForProjectId: uuid("used_for_project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Auto-expire old recommendations
});
```

**Benefits:**
- Track which recommendations were accepted
- Improve AI model over time
- Show recommendation history

---

### 3.2 Add Audit Trail

**Purpose:** Track who changed what and when

```typescript
export const auditLog = tubegaiSchema.table("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // "create", "update", "delete"
  entityType: text("entity_type").notNull(), // "project", "script", etc.
  entityId: uuid("entity_id").notNull(),
  changes: text("changes"), // JSON of what changed
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
```

---

### 3.3 Add RLS (Row Level Security) Policies

**Purpose:** Multi-tenant data isolation

**⚠️ IMPORTANT NOTES FOR IMPLEMENTATION:**

1. **Supabase Integration Required:**
   - RLS는 Supabase의 `auth.uid()` 함수를 사용합니다
   - 로컬 PostgreSQL에서는 `current_setting('request.jwt.claims', true)::json->>'sub'` 사용
   - Supabase Studio에서 RLS 정책을 GUI로 관리할 수 있습니다

2. **단계별 구현 순서:**
   ```sql
   -- Step 1: 각 테이블에 RLS 활성화
   ALTER TABLE project ENABLE ROW LEVEL SECURITY;
   ALTER TABLE studio_script ENABLE ROW LEVEL SECURITY;
   ALTER TABLE studio_script_segment ENABLE ROW LEVEL SECURITY;
   ALTER TABLE studio_storyboard ENABLE ROW LEVEL SECURITY;
   ALTER TABLE studio_video ENABLE ROW LEVEL SECURITY;
   ALTER TABLE studio_video_part ENABLE ROW LEVEL SECURITY;
   ALTER TABLE studio_export_history ENABLE ROW LEVEL SECURITY;
   ALTER TABLE studio_seo ENABLE ROW LEVEL SECURITY;
   ALTER TABLE studio_subtitle ENABLE ROW LEVEL SECURITY;
   ALTER TABLE media_asset ENABLE ROW LEVEL SECURITY;
   ALTER TABLE trend ENABLE ROW LEVEL SECURITY;
   ALTER TABLE ai_recommendation ENABLE ROW LEVEL SECURITY;
   ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
   ALTER TABLE channel ENABLE ROW LEVEL SECURITY;
   ALTER TABLE label ENABLE ROW LEVEL SECURITY;
   ALTER TABLE project_label ENABLE ROW LEVEL SECURITY;

   -- Step 2: 기본 정책 생성 (프로젝트 기반)
   -- Users can only see their own projects
   CREATE POLICY project_isolation ON project
     FOR ALL
     USING (user_id = auth.uid());

   -- Step 3: 하위 테이블 정책 (프로젝트를 통한 접근)
   -- Users can only see scripts for their own projects
   CREATE POLICY script_isolation ON studio_script
     FOR ALL
     USING (
       project_id IN (
         SELECT id FROM project WHERE user_id = auth.uid()
       )
     );

   -- Script segments follow script access
   CREATE POLICY script_segment_isolation ON studio_script_segment
     FOR ALL
     USING (
       script_id IN (
         SELECT id FROM studio_script WHERE project_id IN (
           SELECT id FROM project WHERE user_id = auth.uid()
         )
       )
     );

   -- Storyboards follow project access
   CREATE POLICY storyboard_isolation ON studio_storyboard
     FOR ALL
     USING (
       project_id IN (
         SELECT id FROM project WHERE user_id = auth.uid()
       )
     );

   -- Videos follow project access
   CREATE POLICY video_isolation ON studio_video
     FOR ALL
     USING (
       project_id IN (
         SELECT id FROM project WHERE user_id = auth.uid()
       )
     );

   -- Video parts follow video access
   CREATE POLICY video_part_isolation ON studio_video_part
     FOR ALL
     USING (
       video_id IN (
         SELECT id FROM studio_video WHERE project_id IN (
           SELECT id FROM project WHERE user_id = auth.uid()
         )
       )
     );

   -- Export history follows project access
   CREATE POLICY export_isolation ON studio_export_history
     FOR ALL
     USING (
       project_id IN (
         SELECT id FROM project WHERE user_id = auth.uid()
       )
     );

   -- SEO follows project access
   CREATE POLICY seo_isolation ON studio_seo
     FOR ALL
     USING (
       project_id IN (
         SELECT id FROM project WHERE user_id = auth.uid()
       )
     );

   -- Subtitles follow project access
   CREATE POLICY subtitle_isolation ON studio_subtitle
     FOR ALL
     USING (
       project_id IN (
         SELECT id FROM project WHERE user_id = auth.uid()
       )
     );

   -- Step 4: 직접 사용자 연결 테이블
   -- Media assets owned by user
   CREATE POLICY media_asset_isolation ON media_asset
     FOR ALL
     USING (user_id = auth.uid());

   -- Trends owned by user or public (user_id IS NULL)
   CREATE POLICY trend_isolation ON trend
     FOR ALL
     USING (user_id = auth.uid() OR user_id IS NULL);

   -- AI recommendations owned by user
   CREATE POLICY ai_recommendation_isolation ON ai_recommendation
     FOR ALL
     USING (user_id = auth.uid());

   -- Audit logs owned by user
   CREATE POLICY audit_log_isolation ON audit_log
     FOR ALL
     USING (user_id = auth.uid());

   -- Channels owned by user
   CREATE POLICY channel_isolation ON channel
     FOR ALL
     USING (user_id = auth.uid());

   -- Labels owned by user or global (user_id IS NULL)
   CREATE POLICY label_isolation ON label
     FOR ALL
     USING (user_id = auth.uid() OR user_id IS NULL);

   -- Project labels follow project access
   CREATE POLICY project_label_isolation ON project_label
     FOR ALL
     USING (
       project_id IN (
         SELECT id FROM project WHERE user_id = auth.uid()
       )
     );
   ```

3. **테스트 방법:**
   ```sql
   -- Test as specific user
   SET request.jwt.claims = '{"sub": "user-uuid-here"}';

   -- Should only see own data
   SELECT * FROM project;
   SELECT * FROM studio_script;

   -- Reset
   RESET request.jwt.claims;
   ```

4. **성능 최적화:**
   - RLS 정책은 모든 쿼리에 적용되므로 인덱스가 중요합니다
   - 이미 Phase 2에서 필요한 인덱스를 생성했습니다:
     - `idx_project_user_id`
     - `idx_script_segment_script_id`
     - `idx_storyboard_project_id`
     - 등등

5. **주의사항:**
   - RLS를 활성화하면 service role은 여전히 모든 데이터에 접근 가능
   - 애플리케이션에서는 anon/authenticated role을 사용
   - 관리자 기능이 필요한 경우 별도 정책 추가 필요

6. **롤백 방법:**
   ```sql
   -- Disable RLS on all tables
   ALTER TABLE project DISABLE ROW LEVEL SECURITY;
   -- ... repeat for all tables

   -- Or drop specific policies
   DROP POLICY IF EXISTS project_isolation ON project;
   DROP POLICY IF EXISTS script_isolation ON studio_script;
   -- ... etc
   ```

7. **구현 후 검증:**
   - 각 사용자가 자신의 데이터만 볼 수 있는지 확인
   - 다른 사용자의 데이터가 보이지 않는지 확인
   - 성능 저하가 없는지 쿼리 플랜 확인
   - Supabase Dashboard에서 정책 상태 확인

---

### Phase 3 Summary

**Migration Script:** `0007_optional_enhancements.sql`

**Changes:**
- ✅ AI recommendations tracking
- ✅ Audit log
- ✅ RLS policies

**Estimated Time:**
- Schema changes: 2 hours
- RLS policies: 3 hours
- Testing: 3 hours
- **Total: ~8 hours (1 day)**

**Risk Level:** 🟢 Low
- Optional features
- Can be deployed later
- No impact on existing functionality

---

## Implementation Roadmap

### Week 1: Critical Path (P0)

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| **Day 1** | Phase 1.1-1.2 (Channel, Label) | Migration 0005 part 1 |
| **Day 2** | Phase 1.3 (Video Parts) | Migration 0005 part 2, Complete seed script |

**Milestone:** ✅ MVP Fully Functional

### Week 2: Enhancements (P1)

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| **Day 3** | Phase 2.1 (Storyboard linkage) | Migration 0006 part 1 |
| **Day 4** | Phase 2.2-2.3 (Export settings, Indexes) | Migration 0006 part 2 |

**Milestone:** ✅ Production-Ready Quality

### Week 3: Polish (P2) - Optional

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| **Day 5** | Phase 3.1-3.2 (AI Recs, Audit) | Migration 0007 |
| **Day 6** | Phase 3.3 (RLS Policies) | Security hardening |

**Milestone:** ✅ Enterprise-Grade

---

## Testing Strategy

### Unit Tests
```typescript
// Test channel creation
test("creates channel with valid data", async () => {
  const channel = await createChannel({
    userId: testUserId,
    youtubeChannelId: "UC_test",
    name: "Test Channel",
  });
  expect(channel).toBeDefined();
  expect(channel.status).toBe("active");
});

// Test label attachment
test("attaches labels to project", async () => {
  const project = await createProject({ ... });
  await attachLabels(project.id, [label1.id, label2.id]);

  const labels = await getProjectLabels(project.id);
  expect(labels).toHaveLength(2);
});

// Test video part splitting
test("splits long scene into parts", async () => {
  const scene = { duration: 8 };
  const parts = await splitIntoVideoParts(scene);

  expect(parts).toHaveLength(2);
  expect(parts[0].duration).toBe(4);
  expect(parts[1].duration).toBe(4);
});
```

### Integration Tests
1. Complete workflow test: Create project → Script → Storyboard → Scene → Export
2. Channel management: Connect → Sync → Use in project
3. Label management: Create → Attach → Filter → Delete
4. Video generation: Auto-split → Track parts → Complete

### Performance Tests
1. Dashboard with 100 projects
2. Script page with 50 segments
3. Storyboard with 100 scenes
4. Concurrent video generation

---

## Rollback Plan

### If Phase 1 Fails
```sql
-- Rollback migration 0005
DROP TABLE IF EXISTS studio_video_part CASCADE;
DROP TABLE IF EXISTS project_label CASCADE;
DROP TABLE IF EXISTS label CASCADE;
DROP TABLE IF EXISTS channel CASCADE;

ALTER TABLE project DROP COLUMN IF EXISTS channel_id;

DROP TYPE IF EXISTS channel_status;
DROP TYPE IF EXISTS video_part_status;
```

### If Phase 2 Fails
```sql
-- Rollback migration 0006
ALTER TABLE studio_storyboard
  ALTER COLUMN script_segment_id DROP NOT NULL;

ALTER TABLE studio_export_history
  DROP COLUMN frame_rate,
  DROP COLUMN quality,
  DROP COLUMN hardware_acceleration;

-- Drop indexes (won't affect data)
DROP INDEX IF EXISTS idx_project_user_id;
-- ... etc
```

---

## Success Metrics

### Phase 1 (P0)
- [ ] New project creation succeeds 100%
- [ ] Channel selection works
- [ ] Labels persist correctly
- [ ] Video parts tracked per scene
- [ ] Zero blocking errors

### Phase 2 (P1)
- [ ] Storyboard scenes group correctly
- [ ] Export settings persist
- [ ] Page load time <1s
- [ ] Query performance improved 50%

### Phase 3 (P2)
- [ ] AI recommendations stored
- [ ] Audit log captures all changes
- [ ] RLS policies enforce isolation
- [ ] Zero unauthorized access

---

## Migration Checklist

Before applying each migration:
- [ ] Backup database
- [ ] Review SQL in migration file
- [ ] Test on local/staging environment
- [ ] Verify seed script runs successfully
- [ ] Check all foreign keys work
- [ ] Confirm enum values added
- [ ] Test rollback procedure
- [ ] Update database.types.ts (`npm run db:typegen`)
- [ ] Verify frontend types match
- [ ] Run integration tests
- [ ] Deploy to production
- [ ] Monitor error logs

---

## Conclusion

This phased approach ensures:
1. **Safety:** Incremental changes with rollback capability
2. **Priority:** Critical issues fixed first
3. **Testing:** Each phase independently validated
4. **Flexibility:** Can pause between phases if needed

**Recommended Start Date:** Immediately after approval
**Expected Completion:** Phase 1-2 within 1 week

**Next Steps:**
1. ✅ Approve this plan
2. ✅ Create backup of production database
3. ✅ Start Phase 1.1 (Channel schema)
4. ✅ Monitor and iterate
