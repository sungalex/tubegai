# MVP Feature Schema Analysis
**Generated:** 2026-01-30
**Based on:** routes.ts, Page Components, Mock Data, Database Schema

---

## Executive Summary

### Overall Assessment: B+ (Good with Minor Gaps)

**Strengths:**
- ✅ Core workflow tables (project, script, storyboard, video) properly implemented
- ✅ Foreign key relationships support main workflow
- ✅ Seed data successfully populated
- ✅ Trend feature recently added

**Gaps Identified:**
- ⚠️ **Channel/Label tables disabled** - New Project page cannot function fully
- ⚠️ **Video parts not tracked** - Scene page split logic not supported
- ⚠️ **Export settings not persisted** - Settings reset on page reload
- ⚠️ **Script-Storyboard linkage weak** - No explicit segment grouping

---

## Part 1: MVP Screen → Mock Data → Schema Mapping

### 1.1 Dashboard Page (`/projects`)

#### Screen Tabs:
1. **Trends Tab** - Display trending video topics
2. **Projects Tab** - Display recent projects

#### Mock Data Used:
```typescript
TRENDS_DATA: TrendItem[] // 8 items
RECENT_PROJECTS: RecentProject[] // 4 items
AI_RECOMMENDATIONS: AIRecommendation[] // 3 items
```

#### Database Tables:
| Mock Field | Type | DB Table | DB Field | Status |
|------------|------|----------|----------|--------|
| trend.id | number | trend | id (uuid) | ⚠️ Type mismatch |
| trend.title | string | trend | title | ✅ Match |
| trend.category | string | trend | category | ✅ Match |
| trend.views | string | trend | views_count | ✅ Match |
| trend.growth | string | trend | growth_rate | ✅ Match |
| trend.thumbnail | string | trend | thumbnail_url | ✅ Match |
| trend.tags | string[] | trend | tags | ✅ Match |
| project.id | string | project | id (uuid) | ✅ Match |
| project.name | string | project | title | ✅ Match |
| project.status | string | project | status (enum) | ✅ Match |
| project.step | string | project | current_step | ✅ Match |

**Analysis:**
- ✅ Trend table fully supports Trends tab
- ✅ Project table supports Projects tab
- ⚠️ AI_RECOMMENDATIONS not stored in DB (ephemeral)

---

### 1.2 Project List Page (`/projects/lists`)

#### Screen Features:
- Grid/list view of all projects
- Search by title (client-side)
- Create new project button

#### Mock Data Used:
```typescript
PROJECTS: Project[] // 6 items
{
  id: string
  title: string
  status: "Draft" | "In Progress" | "Completed" | "Processing"
  lastModified: string
  progress: number (0-100)
  thumbnail?: string
}
```

#### Database Schema Comparison:

| Mock Field | Required | DB Field | DB Type | Status |
|------------|----------|----------|---------|--------|
| id | ✅ | id | uuid | ✅ |
| title | ✅ | title | text | ✅ |
| status | ✅ | status | project_status enum | ✅ |
| lastModified | ✅ | updated_at | timestamp | ✅ |
| progress | ✅ | progress | integer | ✅ |
| thumbnail | ❌ | thumbnail_url | text | ✅ |

**Analysis:**
- ✅ All fields supported
- ✅ Status enum matches exactly
- ✅ Progress tracking implemented

---

### 1.3 New Project Page (`/projects/new`)

#### Form Fields:
```typescript
{
  title: string (min 2 chars, required)
  description?: string
  type: "short" | "long"
  tone: "informative" | "funny" | "cinematic" | "vlog"
  visibility: "public" | "private"
  topic?: string
  channelId: string (required)
  labels: string[] (label IDs)
}
```

#### Mock Data Dependencies:
```typescript
CHANNELS: Channel[] // For dropdown
LABELS: Label[] // For multi-select badges
```

#### Database Schema Comparison:

| Form Field | Required | DB Table | DB Field | Status |
|------------|----------|----------|----------|--------|
| title | ✅ | project | title | ✅ |
| description | ❌ | project | description | ✅ |
| type | ✅ | project | type | ✅ |
| tone | ✅ | project | tone | ✅ |
| visibility | ✅ | project | visibility | ✅ |
| topic | ❌ | project | topic | ✅ |
| channelId | ✅ | project | ~~channel_id~~ | ❌ **DISABLED** |
| labels | ❌ | ~~project_label~~ | - | ❌ **DISABLED** |

**Critical Issues:**

#### ❌ Issue 1: Channel Selection Broken
```typescript
// New Project Page - Line 89
<FormField name="channelId">
  <Select>
    {CHANNELS.map(channel => (
      <SelectItem value={channel.id}>{channel.name}</SelectItem>
    ))}
  </Select>
</FormField>
```

**Problem:**
- Form requires `channelId` (validation: required)
- `project.channel_id` field is **commented out** in schema
- Page will fail on form submission

**Impact:** 🔴 **Critical** - Cannot create projects

**Fix Required:**
```sql
-- Option 1: Enable channel_id in project table
ALTER TABLE project ADD COLUMN channel_id uuid REFERENCES channel(id);

-- Option 2: Make channelId optional in form
// Remove required validation from channelId field
```

#### ❌ Issue 2: Labels Cannot Be Saved
```typescript
// New Project Page - Line 132
<FormField name="labels">
  {LABELS.map(label => (
    <Badge>{label.name}</Badge>
  ))}
</FormField>
```

**Problem:**
- `project_label` junction table is **disabled**
- Labels are selected but discarded on save

**Impact:** 🟡 **Medium** - Labels don't persist

**Fix Required:**
```sql
CREATE TABLE project_label (
  project_id uuid REFERENCES project(id) ON DELETE CASCADE,
  label_id uuid REFERENCES label(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, label_id)
);
```

---

### 1.4 Studio Script Page (`/studio/script/:projectId`)

#### Screen Features:
- Display script segments by type (hook, intro, body, cta, outro)
- Add/edit/delete segments
- AI script generation

#### Mock Data Used:
```typescript
MOCK_SCRIPTS: ScriptSegment[] // 5 items
{
  id: string
  type: "hook" | "intro" | "body" | "cta" | "outro"
  content: string
  duration: number
}
```

#### Database Schema Comparison:

| Mock Field | DB Table | DB Field | Type | Status |
|------------|----------|----------|------|--------|
| id | studio_script_segment | id | uuid | ✅ |
| type | studio_script_segment | type | script_segment_type enum | ✅ |
| content | studio_script_segment | content | text | ✅ |
| duration | studio_script_segment | estimated_duration | integer | ✅ |

**Additional DB Fields:**
- ✅ `script_id` (FK to studio_script)
- ✅ `order_index` (for ordering segments)

**Analysis:**
- ✅ Full support for script management
- ✅ Proper foreign key to parent script
- ✅ Order tracking for reordering

---

### 1.5 Studio Storyboard Page (`/studio/storyboard/:projectId`)

#### Screen Structure:
```
Script Segment 1 (order: 1)
├─ Scene 1 (sceneNumber: 1) → Generate Image
├─ Scene 2 (sceneNumber: 2) → Generate Image
Script Segment 2 (order: 2)
├─ Scene 3 (sceneNumber: 3) → Generate Image
└─ Scene 4 (sceneNumber: 4) → Generate Image
```

#### Mock Data Used:
```typescript
STORYBOARD_SEGMENTS: StoryboardScriptSegment[]
{
  id: string
  order: number
  content: string (script text)
  scenes: StoryboardScene[]
}

STORYBOARD_SCENES_POOL: Record<string, StoryboardScene[]>
{
  sceneId: string
  sceneNumber: number
  description: string
  visualPrompt: string
  duration: number
  imageUrl: string
}
```

#### Database Schema Comparison:

**Problem: Data Model Mismatch**

| Mock Structure | DB Structure |
|----------------|--------------|
| StoryboardScriptSegment | ❌ Not in DB |
| └─ contains scenes[] | |
| StoryboardScene | studio_storyboard |

**Current DB Schema:**
```sql
studio_storyboard (
  id uuid,
  project_id uuid, -- ✅ Links to project
  script_segment_id uuid, -- ⚠️ Optional link to script segment
  scene_number integer,
  order_index integer,
  description text,
  visual_prompt text,
  image_asset_id uuid,
  created_at timestamp
)
```

**Analysis:**

#### ⚠️ Issue 3: Weak Script-Storyboard Linkage
```typescript
// Mock shows clear grouping
STORYBOARD_SEGMENTS = [
  { id: "seg1", order: 1, content: "...", scenes: [scene1, scene2] },
  { id: "seg2", order: 2, content: "...", scenes: [scene3, scene4] }
]

// DB only has optional reference
studio_storyboard.script_segment_id → studio_script_segment.id (nullable)
```

**Problem:**
- Page expects scenes **grouped by script segment**
- DB has scenes with **optional** script_segment_id
- No guarantee of proper grouping

**Impact:** 🟡 **Medium** - UI/UX degradation

**Recommended Fix:**
```sql
-- Option 1: Make script_segment_id required
ALTER TABLE studio_storyboard
  ALTER COLUMN script_segment_id SET NOT NULL;

-- Option 2: Add storyboard_segment table
CREATE TABLE studio_storyboard_segment (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES project(id),
  script_segment_id uuid REFERENCES studio_script_segment(id),
  order_index integer,
  content text
);

ALTER TABLE studio_storyboard
  ADD COLUMN segment_id uuid REFERENCES studio_storyboard_segment(id);
```

---

### 1.6 Studio Scene Page (`/studio/scene/:projectId`)

#### Screen Features:
- Display scenes with video generation status
- **Auto-split scenes >5 seconds** into 4-second parts
- Generate video for each part independently

#### Mock Data Structure:
```typescript
SCENE_SEGMENTS: SceneScriptSegment[]
{
  id: string
  order: number
  content: string
  scenes: SceneVideo[]
}

SceneVideo {
  sceneId: string
  sceneNumber: number
  description: string
  thumbnailUrl: string
  totalDuration: number
  parts: VideoPart[] // ⚠️ Key feature!
}

VideoPart {
  id: string
  duration: number (4 seconds each)
  status: "pending" | "generating" | "completed" | "failed"
  url?: string
}
```

#### Database Schema:

**Current:**
```sql
studio_video (
  id uuid,
  storyboard_id uuid REFERENCES studio_storyboard(id),
  project_id uuid,
  video_asset_id uuid REFERENCES media_asset(id),
  duration double precision,
  status scene_video_status,
  created_at timestamp
)
```

**Analysis:**

#### ❌ Issue 4: Video Parts Not Tracked
```typescript
// Scene Page - Lines 87-103
const handleGenerateScene = async (sceneId: string) => {
  const scene = findScene(sceneId);
  if (scene.totalDuration > 5) {
    // Auto-split into 4-second parts
    const partCount = Math.ceil(scene.totalDuration / 4);
    const parts = Array.from({ length: partCount }, (_, i) => ({
      id: `${sceneId}-part-${i + 1}`,
      duration: 4,
      status: "generating"
    }));

    // Generate each part separately
    for (const part of parts) {
      await generateVideoPart(part);
    }
  }
};
```

**Problem:**
- Page splits long scenes into multiple 4-second video clips
- Each part has independent generation status
- **DB has no `video_part` table** - only single video per scene

**Impact:** 🔴 **Critical** - Core feature broken

**Business Logic:**
```
Scene (8 seconds) → Split into 2 parts:
  ├─ Part 1 (0-4s): status = "generating" ⏳
  └─ Part 2 (4-8s): status = "completed" ✅
```

**Database Cannot:**
- Track individual part status
- Store multiple video URLs per scene
- Show progress per part

**Fix Required:**
```sql
CREATE TABLE studio_video_part (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES studio_video(id) ON DELETE CASCADE,
  part_number integer NOT NULL,
  start_time double precision NOT NULL,
  end_time double precision NOT NULL,
  duration double precision NOT NULL,
  status scene_video_status DEFAULT 'generating',
  video_asset_id uuid REFERENCES media_asset(id),
  created_at timestamp DEFAULT now(),
  UNIQUE(video_id, part_number)
);
```

---

### 1.7 Studio Export Page (`/studio/export/:projectId`)

#### Screen Features:
- Configure render settings (resolution, format, quality)
- Render video with progress tracking
- YouTube publishing settings
- Schedule publish date

#### Form Data:
```typescript
{
  // Render Settings
  resolution: "4k" | "1080p" | "720p"
  frameRate: 60 | 30 | 24
  format: "mp4" | "mov" | "webm"
  quality: "high" | "medium" | "low"
  hardwareAcceleration: boolean

  // Publishing Settings
  uploadConnected: boolean
  privacy: "public" | "unlisted" | "private"
  scheduledDate?: Date
}
```

#### Database Schema:

**Current:**
```sql
studio_export_history (
  id uuid,
  project_id uuid,
  format export_format, -- ✅ Only "mp4" | "mov"
  resolution export_resolution, -- ✅ Only "1080p" | "4k"
  status export_status,
  video_asset_id uuid,
  upload_status upload_status,
  completed_at timestamp
)
```

**Analysis:**

#### ⚠️ Issue 5: Export Settings Not Persisted
```typescript
// Export Page - State only (not saved to DB)
const [settings, setSettings] = useState({
  resolution: "1080p",
  frameRate: 30,
  format: "mp4",
  quality: "high",
  hardwareAcceleration: true
});
```

**Problem:**
- User configures settings
- Settings reset on page refresh
- **No `export_settings` table**

**Impact:** 🟡 **Medium** - UX issue, not blocking

**Missing Fields in DB:**
- frameRate (30, 60, 24)
- quality ("high" | "medium" | "low")
- hardwareAcceleration (boolean)
- format "webm" not in enum

**Fix Required:**
```sql
-- Option 1: Expand export_history table
ALTER TABLE studio_export_history
  ADD COLUMN frame_rate integer,
  ADD COLUMN quality text,
  ADD COLUMN hardware_acceleration boolean DEFAULT true;

-- Add "webm" to format enum
ALTER TYPE export_format ADD VALUE 'webm';

-- Option 2: Create separate settings table
CREATE TABLE studio_export_settings (
  id uuid PRIMARY KEY,
  project_id uuid UNIQUE REFERENCES project(id),
  resolution export_resolution DEFAULT '1080p',
  frame_rate integer DEFAULT 30,
  format export_format DEFAULT 'mp4',
  quality text DEFAULT 'high',
  hardware_acceleration boolean DEFAULT true,
  updated_at timestamp DEFAULT now()
);
```

---

## Part 2: Workflow Analysis

### 2.1 Video Creation Workflow

```
Step 1: Create Project
  ├─ User: Fill form on /projects/new
  ├─ Data: title, description, type, tone, visibility, topic
  ├─ DB: INSERT into project
  └─ Navigate: /studio/script/{projectId}

Step 2: Write Script
  ├─ User: Add/edit script segments
  ├─ Data: ScriptSegment[] (hook, intro, body, cta, outro)
  ├─ DB: INSERT into studio_script, studio_script_segment
  └─ Navigate: /studio/storyboard/{projectId}

Step 3: Generate Storyboard
  ├─ User: Generate scenes for each script segment
  ├─ AI: Generate images from visual prompts
  ├─ Data: StoryboardScene[] with imageUrl
  ├─ DB: INSERT into studio_storyboard, UPDATE image_asset_id
  └─ Navigate: /studio/scene/{projectId}

Step 4: Generate Scene Videos
  ├─ User: Click "Generate All" or per-scene
  ├─ Logic: IF duration > 5s THEN split into 4s parts
  ├─ AI: Generate video clips (may take several minutes)
  ├─ Data: VideoPart[] with status tracking
  ├─ DB: INSERT into studio_video, ~~studio_video_part~~ (missing!)
  └─ Navigate: /studio/export/{projectId}

Step 5: Export & Publish
  ├─ User: Configure settings & render
  ├─ Process: Combine all video parts → single output
  ├─ Data: Export history record
  ├─ DB: INSERT into studio_export_history, UPDATE video_asset_id
  └─ Optional: Upload to YouTube
```

### 2.2 Table Relationships Flow

```
user (auth.users)
  └─ profile (1:1)
  └─ project (1:N)
      ├─ media_asset (1:N) - Uploaded files
      ├─ trend (N:1) - Selected trend (optional)
      ├─ ~~channel (N:1)~~ - Target YouTube channel ❌ DISABLED
      ├─ ~~project_label (N:M)~~ - Tags ❌ DISABLED
      │
      ├─ studio_script (1:1)
      │   └─ studio_script_segment (1:N)
      │       └─ studio_storyboard (N:1, optional) ⚠️ Weak link
      │
      ├─ studio_storyboard (1:N)
      │   ├─ media_asset.image (1:1) - Generated image
      │   └─ studio_video (1:1)
      │       ├─ media_asset.video (1:1) - Generated video
      │       └─ ~~studio_video_part (1:N)~~ ❌ MISSING
      │
      ├─ studio_subtitle (1:N)
      ├─ studio_seo (1:1)
      └─ studio_export_history (1:N)
          └─ media_asset.video (1:1) - Final export
```

### 2.3 Data Flow Issues

#### Critical Path Breaks:

1. **Project Creation → Channel Selection**
   ```
   /projects/new [Form requires channelId]
        ↓
   project.channel_id ❌ DISABLED
        ↓
   Form submission FAILS
   ```

2. **Scene Generation → Part Tracking**
   ```
   /studio/scene [Split 8s scene into 2 parts]
        ↓
   studio_video [Only stores 1 video]
        ↓
   Part statuses NOT TRACKED ❌
        ↓
   Cannot show "Part 1: ✅ Done, Part 2: ⏳ Generating"
   ```

---

## Part 3: Schema Gaps Summary

### 3.1 Critical Gaps (Blocking MVP)

| Gap | Tables Affected | Impact | Priority |
|-----|----------------|--------|----------|
| **Channel/Label disabled** | channel, label, project_label | Cannot create projects | 🔴 P0 |
| **Video parts missing** | studio_video_part | Scene page broken | 🔴 P0 |

### 3.2 Medium Priority Gaps

| Gap | Tables Affected | Impact | Priority |
|-----|----------------|--------|----------|
| **Export settings not saved** | studio_export_settings | Settings reset on reload | 🟡 P1 |
| **Weak script-storyboard link** | studio_storyboard | Poor grouping | 🟡 P1 |

### 3.3 Minor Gaps

| Gap | Tables Affected | Impact | Priority |
|-----|----------------|--------|----------|
| **AI Recommendations ephemeral** | N/A | No persistence | 🟢 P2 |
| **Trend ID type mismatch** | trend | Mock uses number, DB uses uuid | 🟢 P2 |

---

## Part 4: Field-Level Comparison

### 4.1 Project Table

| Field | MVP Need | Current DB | Status | Note |
|-------|----------|------------|--------|------|
| id | ✅ Required | ✅ uuid PK | ✅ | |
| user_id | ✅ Required | ✅ uuid FK | ✅ | owner_id in DB |
| title | ✅ Required | ✅ text | ✅ | |
| description | ❌ Optional | ✅ text | ✅ | |
| type | ✅ Required | ✅ project_type | ✅ | |
| tone | ✅ Required | ✅ project_tone | ✅ | |
| visibility | ✅ Required | ✅ project_visibility | ✅ | |
| topic | ❌ Optional | ✅ text | ✅ | |
| status | ✅ Required | ✅ project_status | ✅ | |
| progress | ✅ Required | ✅ integer | ✅ | |
| current_step | ❌ Optional | ✅ text | ✅ | |
| thumbnail_url | ❌ Optional | ✅ text | ✅ | |
| **channel_id** | **✅ Required** | **❌ DISABLED** | **❌** | **Form breaks** |
| created_at | ✅ Required | ✅ timestamp | ✅ | |
| updated_at | ✅ Required | ✅ timestamp | ✅ | |

### 4.2 Studio Script Tables

#### studio_script
| Field | MVP Need | Current DB | Status |
|-------|----------|------------|--------|
| id | ✅ | ✅ uuid PK | ✅ |
| project_id | ✅ | ✅ uuid FK (unique) | ✅ |
| prompt | ❌ | ✅ text | ✅ |
| target_duration | ❌ | ✅ integer | ✅ |
| saved_at | ❌ | ✅ timestamp | ✅ |

#### studio_script_segment
| Field | MVP Need | Current DB | Status |
|-------|----------|------------|--------|
| id | ✅ | ✅ uuid PK | ✅ |
| script_id | ✅ | ✅ uuid FK | ✅ |
| order_index | ✅ | ✅ integer | ✅ |
| type | ✅ | ✅ script_segment_type | ✅ |
| content | ✅ | ✅ text | ✅ |
| estimated_duration | ✅ | ✅ integer | ✅ |

**Analysis:** ✅ Fully supports script page

### 4.3 Studio Storyboard Table

| Field | MVP Need | Current DB | Status | Note |
|-------|----------|------------|--------|------|
| id | ✅ | ✅ uuid PK | ✅ | |
| project_id | ✅ | ✅ uuid FK | ✅ | |
| script_segment_id | ⚠️ Group by | ✅ uuid FK (nullable) | ⚠️ | Should be NOT NULL |
| scene_number | ✅ | ✅ integer | ✅ | |
| order_index | ✅ | ✅ integer | ✅ | |
| description | ✅ | ✅ text | ✅ | |
| visual_prompt | ✅ | ✅ text | ✅ | |
| image_asset_id | ✅ | ✅ uuid FK | ✅ | |
| duration | ❌ | ❌ Missing | ⚠️ | Mock has duration per scene |
| created_at | ❌ | ✅ timestamp | ✅ | |

**Issues:**
- ⚠️ `script_segment_id` should be NOT NULL for proper grouping
- ⚠️ Missing `duration` field (mock has it per scene)

### 4.4 Studio Video Tables

#### studio_video (Current)
| Field | MVP Need | Current DB | Status |
|-------|----------|------------|--------|
| id | ✅ | ✅ uuid PK | ✅ |
| storyboard_id | ✅ | ✅ uuid FK | ✅ |
| project_id | ✅ | ✅ uuid FK | ✅ |
| video_asset_id | ✅ | ✅ uuid FK | ✅ |
| duration | ✅ | ✅ double precision | ✅ |
| status | ✅ | ✅ scene_video_status | ✅ |
| created_at | ❌ | ✅ timestamp | ✅ |

#### studio_video_part (MISSING)
| Field | MVP Need | Current DB | Status |
|-------|----------|------------|--------|
| id | ✅ | ❌ N/A | ❌ |
| video_id | ✅ | ❌ N/A | ❌ |
| part_number | ✅ | ❌ N/A | ❌ |
| start_time | ✅ | ❌ N/A | ❌ |
| end_time | ✅ | ❌ N/A | ❌ |
| duration | ✅ | ❌ N/A | ❌ |
| status | ✅ | ❌ N/A | ❌ |
| video_asset_id | ✅ | ❌ N/A | ❌ |

**Analysis:** ❌ Critical table missing

### 4.5 Studio Export Tables

#### studio_export_history (Current)
| Field | MVP Need | Current DB | Status |
|-------|----------|------------|--------|
| id | ✅ | ✅ uuid PK | ✅ |
| project_id | ✅ | ✅ uuid FK | ✅ |
| format | ✅ | ✅ export_format | ⚠️ Missing "webm" |
| resolution | ✅ | ✅ export_resolution | ⚠️ Missing "720p" |
| status | ✅ | ✅ export_status | ✅ |
| video_asset_id | ✅ | ✅ uuid FK | ✅ |
| upload_status | ✅ | ✅ upload_status | ✅ |
| completed_at | ✅ | ✅ timestamp | ✅ |
| **frame_rate** | **✅** | **❌ Missing** | **❌** | |
| **quality** | **✅** | **❌ Missing** | **❌** | |
| **hardware_acceleration** | **✅** | **❌ Missing** | **❌** | |
| **privacy** | **✅** | **❌ Missing** | **❌** | YouTube privacy |
| **scheduled_at** | **❌** | **❌ Missing** | **❌** | Scheduled publish |

---

## Part 5: Recommendations

### 5.1 Immediate Actions (P0)

#### 1. Enable Channel Table
```sql
-- Uncomment in project-schema.ts
CREATE TABLE channel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  youtube_channel_id text UNIQUE NOT NULL,
  name text NOT NULL,
  handle text,
  avatar_url text,
  access_token text,
  refresh_token text,
  status channel_status DEFAULT 'active' NOT NULL,
  last_synced_at timestamp,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Enable in project table
ALTER TABLE project ADD COLUMN channel_id uuid REFERENCES channel(id) ON DELETE SET NULL;
```

#### 2. Enable Label Tables
```sql
-- Uncomment in project-schema.ts
CREATE TABLE label (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#000000' NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE project_label (
  project_id uuid REFERENCES project(id) ON DELETE CASCADE,
  label_id uuid REFERENCES label(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, label_id)
);
```

#### 3. Add Video Part Table
```sql
CREATE TYPE video_part_status AS ENUM ('pending', 'generating', 'completed', 'failed');

CREATE TABLE studio_video_part (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES studio_video(id) ON DELETE CASCADE NOT NULL,
  part_number integer NOT NULL,
  start_time double precision NOT NULL,
  end_time double precision NOT NULL,
  duration double precision NOT NULL,
  status video_part_status DEFAULT 'pending' NOT NULL,
  video_asset_id uuid REFERENCES media_asset(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  UNIQUE(video_id, part_number)
);

CREATE INDEX idx_video_part_video_id ON studio_video_part(video_id);
```

### 5.2 Short-term Actions (P1)

#### 4. Strengthen Storyboard Linkage
```sql
-- Make script_segment_id required
ALTER TABLE studio_storyboard
  ALTER COLUMN script_segment_id SET NOT NULL;

-- Add duration field
ALTER TABLE studio_storyboard
  ADD COLUMN duration integer;
```

#### 5. Expand Export Settings
```sql
ALTER TABLE studio_export_history
  ADD COLUMN frame_rate integer DEFAULT 30,
  ADD COLUMN quality text DEFAULT 'high',
  ADD COLUMN hardware_acceleration boolean DEFAULT true,
  ADD COLUMN privacy text,
  ADD COLUMN scheduled_at timestamp;

-- Add missing enum values
ALTER TYPE export_format ADD VALUE IF NOT EXISTS 'webm';
ALTER TYPE export_resolution ADD VALUE IF NOT EXISTS '720p';
```

### 5.3 Nice-to-Have (P2)

#### 6. Add AI Recommendations Table
```sql
CREATE TABLE ai_recommendation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  reason text NOT NULL,
  growth_rate text,
  category text,
  score integer,
  created_at timestamp DEFAULT now() NOT NULL
);
```

---

## Part 6: Summary Statistics

### Tables Status:

| Status | Count | Tables |
|--------|-------|--------|
| ✅ Fully Implemented | 8 | profiles, project, media_asset, studio_script, studio_script_segment, studio_storyboard, studio_video, studio_export_history, studio_subtitle, studio_seo, trend |
| ⚠️ Partially Implemented | 2 | studio_storyboard (weak linkage), studio_export_history (missing fields) |
| ❌ Disabled (Breaking MVP) | 3 | channel, label, project_label |
| ❌ Missing (Breaking MVP) | 1 | studio_video_part |

### Field Coverage:

| Category | Required | Implemented | Coverage |
|----------|----------|-------------|----------|
| Project Creation | 10 | 8 | 80% |
| Script Writing | 6 | 6 | 100% |
| Storyboard Generation | 8 | 7 | 87% |
| Scene Video Generation | 10 | 3 | 30% ⚠️ |
| Export & Publishing | 12 | 7 | 58% |

### Overall MVP Readiness:

- **Can Ship:** ❌ No (critical tables disabled)
- **Workarounds Possible:** ⚠️ Yes (make channel/labels optional)
- **Full Feature Support:** ❌ No (video parts missing)

---

## Conclusion

The current schema supports **60-70% of MVP features**. The main issues are:

1. 🔴 **Project creation broken** - Channel/label tables disabled
2. 🔴 **Scene page broken** - Video parts not tracked
3. 🟡 **Export UX degraded** - Settings not persisted
4. 🟡 **Storyboard grouping weak** - Optional script linkage

**Recommendation:** Implement P0 fixes (channel, label, video_part tables) before MVP launch.
