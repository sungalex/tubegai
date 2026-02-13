// =============================================================================
// API Route: GET /api/studio/projects
// =============================================================================
// Returns all projects formatted for StudioProjectSelector

import type { Route } from "./+types/studio-projects";
import { requireAuth } from "~/lib/auth.server";
import { getStudioProjects } from "~/common/data/studio.data.server";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  const projects = await getStudioProjects(userId);
  return { projects };
}
