// =============================================================================
// API Route: POST /api/studio/generate-scene-video-stream
// =============================================================================
// Generates scene video clips via SSE with 8-second clip splitting and
// reference image chaining for visual consistency.

import type { Route } from "./+types/generate-scene-video-stream";
import { requireAuth } from "~/lib/auth.server";
import {
  getStoryboardSceneForVideo,
  getOrCreateActiveSession,
  createSceneVideo,
  updateSceneVideoAsset,
} from "~/common/data/studio.data.server";
import { createMediaAsset } from "~/common/data/media.data.server";
import { generateSceneVideo } from "~/lib/ai/video.server";
import { uploadStudioMedia } from "~/lib/supabase-storage.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const userId = await requireAuth(request);
    const body = await request.json();

    const { sceneId, options } = body as {
      sceneId: string;
      options?: { aspectRatio?: string };
    };

    if (!sceneId) {
      return new Response(
        JSON.stringify({ error: "Scene ID가 필요합니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Get storyboard scene with image asset
    const scene = await getStoryboardSceneForVideo(sceneId);
    if (!scene) {
      return new Response(
        JSON.stringify({ error: "스토리보드 씬을 찾을 수 없습니다." }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const sessionId = scene.sessionId
      ?? await getOrCreateActiveSession(scene.projectId, userId);

    const duration = Math.min(scene.duration ?? 8, 8); // Max 8 seconds per scene
    const prompt = scene.visualPrompt ?? scene.description ?? "";

    // Create video record in DB
    const videoId = await createSceneVideo({
      storyboardId: sceneId,
      projectId: scene.projectId,
      sessionId,
      duration,
    });

    // Download reference image buffer if available
    let referenceImageBuffer: Buffer | undefined;
    if (scene.imageAsset?.publicUrl) {
      try {
        const imgRes = await fetch(scene.imageAsset.publicUrl);
        if (imgRes.ok) {
          const ab = await imgRes.arrayBuffer();
          referenceImageBuffer = Buffer.from(ab);
        }
      } catch (e) {
        console.warn("Failed to download reference image:", e);
      }
    }

    // Create SSE stream
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send start event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "start",
                videoId,
              })}\n\n`,
            ),
          );

          try {
            // Generate single video clip (max 8s per scene)
            const clipResult = await generateSceneVideo(prompt, {
              durationSeconds: duration,
              aspectRatio: options?.aspectRatio ?? "16:9",
              referenceImageBuffer,
            });

            // Upload to Supabase Storage
            const { storageKey, publicUrl } = await uploadStudioMedia({
              projectId: scene.projectId,
              sessionId,
              category: "scene-video",
              sceneNumber: scene.sceneNumber,
              buffer: clipResult.buffer,
              mimeType: clipResult.mimeType,
            });

            // Create media asset + link to video
            const assetId = await createMediaAsset({
              userId,
              projectId: scene.projectId,
              type: "video",
              storageKey,
              publicUrl,
              fileSize: clipResult.buffer.length,
              mimeType: clipResult.mimeType,
              duration: clipResult.duration,
            });

            await updateSceneVideoAsset(videoId, {
              status: "completed",
              videoAssetId: assetId,
            });

            // Notify clip complete
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "clip_complete",
                  publicUrl,
                })}\n\n`,
              ),
            );
          } catch (clipError) {
            console.error(
              `Scene video generation failed for scene ${sceneId}:`,
              clipError,
            );

            await updateSceneVideoAsset(videoId, { status: "failed" });

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "clip_error",
                  error: "비디오 생성 실패",
                })}\n\n`,
              ),
            );
          }

          // Send completion event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                videoId,
              })}\n\n`,
            ),
          );

          controller.close();
        } catch (error) {
          console.error(
            "Scene video stream error:",
            error instanceof Error ? error.message : error,
          );

          await updateSceneVideoAsset(videoId, { status: "failed" });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error:
                  error instanceof Error
                    ? error.message
                    : "씬 비디오 생성 중 오류가 발생했습니다.",
              })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Scene video stream error:", error);
    return new Response(
      JSON.stringify({ error: "씬 비디오 스트림 생성 실패" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
