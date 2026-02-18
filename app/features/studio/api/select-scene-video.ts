// =============================================================================
// API Route: POST /api/studio/select-scene-video
// =============================================================================
// Selects a specific video version for a scene

import type { Route } from "./+types/select-scene-video";
import { requireAuth } from "~/lib/auth.server";
import { selectSceneVideo } from "~/common/data/studio.data.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    await requireAuth(request);
    const { videoId } = (await request.json()) as { videoId: string };

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: "Video ID가 필요합니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    await selectSceneVideo(videoId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Select scene video error:", error);
    return new Response(
      JSON.stringify({ error: "비디오 선택 실패" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
