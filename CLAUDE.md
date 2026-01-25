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
```

## Architecture

TubeGAI is an AI-powered video creator workflow platform built with React Router v7 (formerly Remix) and Vite.

### Project Structure

- `app/features/` - Feature modules (auth, project, settings, studio, product), each containing pages, components, layouts, and `*-schema.ts` for Drizzle ORM tables
- `app/common/` - Shared components including `ui/` (Shadcn components) and `magicui/` (animation components)
- `app/drizzle/` - Database connection, schema definitions, enums, and migrations
- `app/routes.ts` - Central route configuration using React Router v7 layout/prefix API

### Database

- PostgreSQL with Drizzle ORM
- Schema files: `app/features/**/*-schema.ts`
- All tables use the `tubegai` PostgreSQL schema (defined in `app/drizzle/schema-def.ts`)
- Enums defined in `app/drizzle/enums.ts`

## React Router v7 Conventions

**Critical**: This project uses React Router v7, NOT Remix. Never import from `@remix-run/*`.

### Route Types
```typescript
import type { Route } from "./+types/route-name";

export function loader({ request }: Route.LoaderArgs) {
  return { data: "value" };  // Return plain objects, not json()
}

export function action({ request }: Route.ActionArgs) {
  return { success: true };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Page Title" }];
}

// Components receive loaderData/actionData via props, NOT hooks
export default function Page({ loaderData, actionData }: Route.ComponentProps) {
  // ...
}
```

### Key Differences from Remix
- `json()` does not exist - return plain objects
- `useLoaderData`/`useActionData` do not exist - use `Route.ComponentProps`
- Always export `loader`, `action`, and `meta` for pages

## UI Conventions

- Import UI components from Shadcn UI (`app/common/components/ui/`), never from Radix UI directly
- Use Tailwind CSS for styling
- Use functional components with TypeScript interfaces (prefer `interface` over `type`)
- Avoid enums, use maps instead
- Use descriptive variable names with auxiliary verbs (isLoading, hasError)
- Directory naming: lowercase with dashes (e.g., `components/auth-wizard`)
- Favor named exports for components
