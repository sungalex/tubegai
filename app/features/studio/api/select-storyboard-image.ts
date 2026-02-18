// =============================================================================
// API Route: POST /api/studio/select-storyboard-image
// =============================================================================
// Selects a specific image version for a storyboard scene

import type { Route } from "./+types/select-storyboard-image";
import { requireAuth } from "~/lib/auth.server";
import { linkImageToStoryboard } from "~/common/data/media.data.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    await requireAuth(request);
    const { sceneId, assetId } = (await request.json()) as {
      sceneId: string;
      assetId: string;
    };

    if (!sceneId || !assetId) {
      return new Response(
        JSON.stringify({ error: "Scene ID와 Asset ID가 필요합니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    await linkImageToStoryboard(sceneId, assetId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Select storyboard image error:", error);
    return new Response(
      JSON.stringify({ error: "이미지 선택 실패" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
