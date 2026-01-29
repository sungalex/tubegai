# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server on port 3000
npm run build            # Production build (outputs to build/)
npm run start            # Run production server
npm run typecheck        # Run type checking (generates route types first)
npm run db:generate      # Generate Drizzle migrations from schema changes
npm run db:migrate       # Apply migrations to database
npm run db:seed          # Populate database with mock data for development
```

## Architecture Overview

TubeGAI is an AI-powered video creator workflow platform built with **React Router v7** (formerly Remix) and **Vite**, deployed on Vercel with SSR enabled. The MVP focuses on core video creation features with a phased rollout approach.

### Tech Stack

| Aspect               | Implementation                        |
| -------------------- | ------------------------------------- |
| **Framework**        | React Router v7 with Vite             |
| **Styling**          | Tailwind CSS 4 with Shadcn UI         |
| **Forms**            | React Hook Form + Zod validation      |
| **Database**         | PostgreSQL + Drizzle ORM + Supabase   |
| **State Management** | React Router loaders + local useState |
| **Notifications**    | Sonner toast library                  |
| **Charts/Data**      | Recharts for data visualization       |
| **Animation**        | Framer Motion                         |
| **Icons**            | Lucide React                          |
| **Type Safety**      | TypeScript strict mode                |

## Project Structure

```
app/
├── features/               # Feature modules (MVP: auth, project, studio, product)
│   └── {feature}/
│       ├── pages/         # Route page components
│       ├── components/    # Feature-specific components
│       ├── layouts/       # Nested layouts (e.g., studio-layout.tsx)
│       ├── {feature}-schema.ts  # Drizzle ORM table definitions
│       └── queries.ts     # Optional data layer
├── common/
│   ├── components/
│   │   ├── ui/           # Shadcn UI components (Button, Card, Form, etc.)
│   │   └── magicui/      # Animation components
│   ├── data/             # Data access layer (*.data.ts)
│   ├── mocks/            # Mock data for MVP development
│   └── types/            # Shared type definitions
├── drizzle/
│   ├── db.ts             # Database connection (Supabase)
│   ├── schema-def.ts     # tubegaiSchema definition
│   ├── enums.ts          # PostgreSQL enums
│   └── migrations/       # Generated migration files
├── hooks/                # Custom React hooks (use-*.ts)
├── lib/
│   └── utils.ts          # Utility functions (cn, etc.)
├── routes.ts             # Central route configuration
├── root.tsx              # Root layout and error boundary
└── supa-client.ts        # Supabase client initialization
```

### Feature Structure Convention

Each feature follows a consistent pattern:

```
app/features/{feature}/
├── pages/                  # Named *-page.tsx
├── components/             # Named {feature}-*.tsx
├── layouts/               # Named {feature}-layout.tsx
├── {feature}-schema.ts    # Database schema
└── queries.ts             # Data access layer (optional)
```

## Database Architecture

### Configuration

- **Database**: PostgreSQL via Supabase
- **ORM**: Drizzle ORM
- **Schema**: Custom `tubegai` schema (not `public`)
- **Connection**: Supabase client with typed database
- **Environment Variables**: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`

### Schema Definition Pattern

All tables use the `tubegaiSchema` defined in [app/drizzle/schema-def.ts](app/drizzle/schema-def.ts):

```typescript
import { tubegaiSchema } from "../../drizzle/schema-def";
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Define table
export const projects = tubegaiSchema.table("project", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  mediaAssets: many(mediaAssets),
}));
```

### Enum Definition Pattern

Define enums in [app/drizzle/enums.ts](app/drizzle/enums.ts):

```typescript
import { tubegaiSchema } from "./schema-def";

export const projectStatusEnum = tubegaiSchema.enum("project_status", [
  "draft",
  "in_progress",
  "completed",
  "archived",
]);
```

### Database Workflow

1. Modify schema in `app/features/**/*-schema.ts`
2. Generate migration: `npm run db:generate`
3. Review migration in `app/drizzle/migrations/`
4. Apply migration: `npm run db:migrate`

## React Router v7 Conventions

**Critical**: This project uses React Router v7, NOT Remix. Never import from `@remix-run/*`.

### Route Configuration

Routes are defined centrally in [app/routes.ts](app/routes.ts):

```typescript
import {
  type RouteConfig,
  route,
  layout,
  prefix,
  index,
} from "@react-router/dev/routes";

export default [
  // Static route
  route("login", "features/auth/pages/auth-login-page.tsx"),

  // Parameterized route
  route("script/:projectId", "features/studio/pages/studio-script-page.tsx"),

  // Layout with nested routes
  layout("features/studio/layouts/studio-layout.tsx", [
    ...prefix("studio", [
      index("features/project/pages/project-list-page.tsx"),
      route("script", "features/studio/pages/studio-script-page.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
```

### Page Component Pattern

```typescript
import type { Route } from "./+types/page-name";

// Loader (server-side data fetching)
export async function loader({ params, request }: Route.LoaderArgs) {
  const projectId = params.projectId;
  const data = await fetchData(projectId);
  return { data };  // Return plain objects, NOT json()
}

// Action (form submissions, mutations)
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = await updateData(formData);
  return { success: true, result };  // Return plain objects
}

// Meta tags
export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `${data.title} - TubeGAI` },
    { name: "description", content: data.description }
  ];
}

// Component (receives loaderData via props)
export default function Page({ loaderData, actionData }: Route.ComponentProps) {
  const { data } = loaderData;
  // Use data directly, no useLoaderData() hook

  return (
    <div>
      <h1>{data.title}</h1>
    </div>
  );
}
```

### Key Differences from Remix

- ❌ `json()` does not exist - return plain objects
- ❌ `useLoaderData()` / `useActionData()` do not exist - use `Route.ComponentProps`
- ✅ Always import types from `./+types/{page-name}`
- ✅ Always export `loader`, `action`, and `meta` for pages

## UI & Styling Conventions

### Component Library

- **Primary**: Shadcn UI components from [app/common/components/ui/](app/common/components/ui/)
- **Never** import from Radix UI directly
- **Available components**: Button, Card, Form, Input, Select, Dialog, Sheet, Tabs, etc.

```typescript
import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import { Input } from "~/common/components/ui/input";
```

### Tailwind CSS Conventions

- Use semantic tokens from Shadcn: `primary`, `muted-foreground`, `background`, `border`
- Responsive utilities: `sm:`, `md:`, `lg:`, `xl:`
- Utility function for conditional classes: `cn()` from [app/lib/utils.ts](app/lib/utils.ts)

```typescript
import { cn } from "~/lib/utils";

<div className={cn(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  isActive && "border-primary",
  className
)} />
```

### Naming Conventions

- **Components**: PascalCase, kebab-case files (e.g., `studio-sidebar.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `use-media-query.ts`)
- **Types**: PascalCase interfaces (prefer `interface` over `type`)
- **Files**: kebab-case directories and files
- **Variables**: camelCase with auxiliary verbs (`isLoading`, `hasError`, `canEdit`)
- **Exports**: Favor named exports over default for components

## Form Handling Pattern

Use **React Hook Form** with **Zod** validation:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "~/common/components/ui/form";
import { Input } from "~/common/components/ui/input";
import { Button } from "~/common/components/ui/button";

// Define schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  async function onSubmit(data: LoginFormValues) {
    // Handle form submission
    toast.success("Login successful");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Login</Button>
      </form>
    </Form>
  );
}
```

## Data Layer Pattern

Abstract data fetching in `app/common/data/*.data.ts` for easy API integration:

```typescript
// app/common/data/studio.data.ts
import { MOCK_SCRIPTS } from "../mocks/studio";

// Data access layer - can easily switch from mock to real API
export async function getScriptSegments(
  projectId: string,
): Promise<ScriptSegment[]> {
  // TODO: Replace with API call when backend is ready
  // return await fetch(`/api/scripts/${projectId}`).then(r => r.json());
  return MOCK_SCRIPTS;
}

export async function createScriptSegment(
  projectId: string,
  data: CreateScriptSegmentInput,
): Promise<ScriptSegment> {
  // TODO: POST to API
  return { id: crypto.randomUUID(), ...data };
}
```

Usage in pages:

```typescript
import { getScriptSegments } from "~/common/data/studio.data";

export async function loader({ params }: Route.LoaderArgs) {
  const segments = await getScriptSegments(params.projectId);
  return { segments };
}
```

## Type Definition Patterns

### Prefer Interfaces

```typescript
// ✅ Good: Interface for object shapes
export interface StoryboardScene {
  id: string;
  sceneNumber: number;
  description: string;
  visualPrompt: string;
  duration: number;
  imageUrl: string;
}

// ✅ Good: Type for unions, mapped types, or primitives
export type ScriptSegmentType = "hook" | "intro" | "body" | "cta" | "outro";

export type ApiResponse<T> = {
  data: T;
  error?: string;
};

// ❌ Avoid: Enums (use maps or union types instead)
// Bad: enum ProjectStatus { Draft, InProgress }
// Good: type ProjectStatus = "draft" | "in_progress"
```

## State Management Patterns

### Local UI State

```typescript
const [isOpen, setIsOpen] = useState(false);
const [selectedId, setSelectedId] = useState<string | null>(null);
```

### Server State (Loader Data)

```typescript
export default function Page({ loaderData }: Route.ComponentProps) {
  const { projects, user } = loaderData;
  // No need for additional state management
}
```

### Custom Hooks for Reusable Logic

```typescript
// app/hooks/use-media-query.ts
import { useState, useEffect } from "react";

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = matchMedia(query);
    setValue(result.matches);
    result.addEventListener("change", onChange);

    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}
```

Usage:

```typescript
const isXlScreen = useMediaQuery("(min-width: 1280px)");
```

## Responsive Layout Patterns

### Breakpoint-Aware Components

```typescript
import { useMediaQuery } from "~/hooks/use-media-query";

export function StudioLayout({ children }: { children: React.ReactNode }) {
  const isXlScreen = useMediaQuery("(min-width: 1280px)");
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsCollapsed(!isXlScreen);
  }, [isXlScreen]);

  return (
    <div className="flex h-screen">
      {/* Desktop: Collapsible sidebar */}
      {isXlScreen && (
        <aside className={cn(
          "border-r transition-all",
          isCollapsed ? "w-12" : "w-48"
        )}>
          {/* Sidebar content */}
        </aside>
      )}

      {/* Mobile: Sheet-based drawer */}
      {!isXlScreen && (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="left">
            {/* Sidebar content */}
          </SheetContent>
        </Sheet>
      )}

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

## Error Handling & Notifications

### Toast Notifications (Sonner)

```typescript
import { toast } from "sonner";

// Success
toast.success("Script Generated", {
  description: "AI has successfully created a new script draft.",
});

// Error
toast.error("Login failed", {
  description: "Invalid email or password.",
});

// Info
toast.info("Processing video", {
  description: "This may take a few minutes.",
});

// Custom with action
toast("New comment", {
  description: "John replied to your video.",
  action: {
    label: "View",
    onClick: () => navigate("/comments"),
  },
});
```

### Error Boundary

Root layout includes an error boundary in [app/root.tsx](app/root.tsx). Don't create additional error boundaries unless needed for specific features.

## Environment Variables

Required in `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Access in code:

```typescript
// Server-side only
const dbUrl = process.env.DATABASE_URL;
```

## MVP vs Phase 2+ Features

Routes and features are explicitly gated by development phase:

```typescript
// ✅ MVP (Enabled)
route("script", "features/studio/pages/studio-script-page.tsx"),

// ❌ Phase 2+ (Disabled - commented out)
// route("dashboard", "features/studio/pages/studio-dashboard-page.tsx"),
```

When working on features:

- Check route comments to understand feature phase
- Don't build Phase 2+ features unless explicitly requested
- Use mock data for API integrations (mark with `// TODO: Replace with API`)

## Common Anti-Patterns to Avoid

### ❌ Don't

```typescript
// Don't import from Remix
import { useLoaderData } from "@remix-run/react";

// Don't use json()
return json({ data });

// Don't import from Radix directly
import { Button } from "@radix-ui/react-button";

// Don't use enums
enum Status {
  Draft,
  Active,
}

// Don't use type for object shapes
type User = { name: string };

// Don't create new files when editing suffices
// Bad: Create new component file for one-time use
```

### ✅ Do

```typescript
// Use Route.ComponentProps
export default function Page({ loaderData }: Route.ComponentProps) {}

// Return plain objects
return { data };

// Import from Shadcn
import { Button } from "~/common/components/ui/button";

// Use union types
type Status = "draft" | "active";

// Use interfaces for object shapes
interface User {
  name: string;
}

// Edit existing files
// Good: Add to existing component file
```

## Code Style Guidelines

### Component Structure

```typescript
// 1. Imports
import { useState } from "react";
import { Button } from "~/common/components/ui/button";

// 2. Types/Interfaces
interface ProjectCardProps {
  project: Project;
  onEdit: (id: string) => void;
}

// 3. Component
export function ProjectCard({ project, onEdit }: ProjectCardProps) {
  // 4. Hooks
  const [isHovered, setIsHovered] = useState(false);

  // 5. Handlers
  function handleClick() {
    onEdit(project.id);
  }

  // 6. Render
  return (
    <Card onMouseEnter={() => setIsHovered(true)}>
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {project.description}
      </CardContent>
    </Card>
  );
}
```

### Import Order

1. React and React Router
2. Third-party libraries
3. Internal utilities and hooks
4. UI components
5. Types
6. Local components

## Testing Strategy

- No formal testing setup in MVP phase
- Manual testing via dev server
- Type safety via TypeScript strict mode
- Consider adding Vitest + React Testing Library in Phase 2+

## Analysis Report

- 분석 결과는 항상 한글로 작성해줘
