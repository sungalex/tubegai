// =============================================================================
// API Route: POST /api/studio/storyboard-image-history
// =============================================================================
// Returns image generation history for a storyboard scene

import type { Route } from "./+types/storyboard-image-history";
import { requireAuth } from "~/lib/auth.server";
import { getStoryboardImageHistory } from "~/common/data/media.data.server";

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

    const history = await getStoryboardImageHistory(sceneId);

    return new Response(JSON.stringify({ history }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Storyboard image history error:", error);
    return new Response(
      JSON.stringify({ error: "이미지 히스토리 조회 실패" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
