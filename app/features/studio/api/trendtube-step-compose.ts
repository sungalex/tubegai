// =============================================================================
// API Route: POST /api/studio/trendtube-step-compose
// =============================================================================
// Step 4: Compose final video with FFmpeg + return full results
// Returns JSON response with TrendTubeResults

import type { Route } from "./+types/trendtube-step-compose";
import { requireAuth } from "~/lib/auth.server";
import {
  getTrendTubeSessionForUser,
  updateSessionStatus,
  saveTrendTubeMedia,
  buildResultsFromSession,
} from "~/common/data/trendtube.data.server";
import { composeVideo } from "~/lib/video-composer.server";
import type { TrendTubeStepSessionInput } from "~/common/types/trendtube.types";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const userId = await requireAuth(request);
    const body = (await request.json()) as TrendTubeStepSessionInput;

    if (!body.sessionId) {
      return Response.json(
        { error: "sessionId가 누락되었습니다." },
        { status: 400 }
      );
    }

    const session = await getTrendTubeSessionForUser(body.sessionId, userId);
    if (!session) {
      return Response.json(
        { error: "세션을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Find media assets
    const media = session.media ?? [];
    const findLatestMedia = (type: string) =>
      media
        .filter((m) => m.mediaType === type && m.publicUrl)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];

    // Collect all video clips sorted by clipNumber
    const videoClips = media
      .filter((m) => m.mediaType === "generated_video" && m.publicUrl)
      .sort((a, b) => (a.clipNumber ?? 0) - (b.clipNumber ?? 0));

    const videoClipUrls = videoClips
      .map((c) => c.publicUrl)
      .filter((url): url is string => !!url);

    const music = findLatestMedia("background_music");
    const voiceover = findLatestMedia("voiceover");

    const musicUrl = music?.publicUrl;
    const voiceoverUrl = voiceover?.publicUrl;
    const totalDuration = videoClipUrls.length > 0 ? videoClipUrls.length * 8 : 8;

    await updateSessionStatus(session.id, "compositing", 7);

    // Compose if audio available and at least one video clip exists
    if (videoClipUrls.length > 0 && musicUrl && voiceoverUrl) {
      try {
        const compositeResult = await composeVideo({
          videoClipUrls: videoClipUrls.length > 1 ? videoClipUrls : undefined,
          videoUrl: videoClipUrls.length === 1 ? videoClipUrls[0] : undefined,
          musicUrl,
          voiceoverUrl,
          totalDuration,
        });

        if (compositeResult.url) {
          await saveTrendTubeMedia({
            sessionId: session.id,
            mediaType: "composited_video",
            publicUrl: compositeResult.url,
            metadata: { duration: compositeResult.duration },
          });
        }
      } catch (err) {
        console.error("Video composition error:", err);
        // Continue without composition - still return results
      }
    }

    await updateSessionStatus(session.id, "completed", 7);

    // Re-fetch session to include newly saved composited media
    const updatedSession = await getTrendTubeSessionForUser(
      body.sessionId,
      userId
    );
    const results = buildResultsFromSession(updatedSession ?? session);

    return Response.json({ results });
  } catch (error) {
    console.error("TrendTube step-compose error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "영상 합성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
