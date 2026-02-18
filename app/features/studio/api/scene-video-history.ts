// =============================================================================
// API Route: POST /api/studio/scene-video-history
// =============================================================================
// Returns video generation history for a storyboard scene

import type { Route } from "./+types/scene-video-history";
import { requireAuth } from "~/lib/auth.server";
import { getSceneVideoHistory } from "~/common/data/studio.data.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    await requireAuth(request);
    const { sceneId } = (await request.json()) as { sceneId: string };

    if (!sceneId) {
      return new Response(
        JSON.stringify({ error: "Scene ID가 필요합니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const history = await getSceneVideoHistory(sceneId);

    return new Response(JSON.stringify({ history }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Scene video history error:", error);
    return new Response(
      JSON.stringify({ error: "비디오 히스토리 조회 실패" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
