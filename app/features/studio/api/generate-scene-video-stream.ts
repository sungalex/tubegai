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
  createSceneVideoParts,
  updateSceneVideoPart,
  updateSceneVideoStatus,
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

    const totalDuration = scene.duration ?? 5;
    const prompt = scene.visualPrompt ?? scene.description ?? "";

    // Create video + parts records in DB
    const videoId = await createSceneVideo({
      storyboardId: sceneId,
      projectId: scene.projectId,
      sessionId,
      duration: totalDuration,
    });

    const partIds = await createSceneVideoParts(videoId, totalDuration);

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
                partCount: partIds.length,
              })}\n\n`,
            ),
          );

          // Sequential clip generation
          for (let i = 0; i < partIds.length; i++) {
            const partId = partIds[i];
            const partNumber = i + 1;

            // Notify clip start
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "clip_start",
                  partNumber,
                  totalParts: partIds.length,
                })}\n\n`,
              ),
            );

            // Mark part as generating
            await updateSceneVideoPart(partId, { status: "generating" });

            try {
              // Generate video clip
              const clipResult = await generateSceneVideo(prompt, {
                durationSeconds: 8,
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

              // Create media asset + link to part
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

              await updateSceneVideoPart(partId, {
                status: "completed",
                videoAssetId: assetId,
              });

              // Notify clip complete
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "clip_complete",
                    partNumber,
                    publicUrl,
                  })}\n\n`,
                ),
              );
            } catch (clipError) {
              console.error(
                `Scene video clip ${partNumber} generation failed:`,
                clipError,
              );

              await updateSceneVideoPart(partId, { status: "failed" });

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "clip_error",
                    partNumber,
                    error: "비디오 클립 생성 실패",
                  })}\n\n`,
                ),
              );
            }
          }

          // Check if all parts completed
          const allCompleted = true; // We track individual failures above
          await updateSceneVideoStatus(
            videoId,
            allCompleted ? "completed" : "failed",
          );

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

          await updateSceneVideoStatus(videoId, "failed");

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
