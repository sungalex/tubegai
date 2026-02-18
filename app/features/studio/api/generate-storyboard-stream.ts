// =============================================================================
// API Route: POST /api/studio/generate-storyboard-stream
// =============================================================================
// Streams AI-generated storyboard scenes in real-time using Server-Sent Events.
// Image generation is handled separately via generate-scene-image API.

import type { Route } from "./+types/generate-storyboard-stream";
import { requireAuth } from "~/lib/auth.server";
import { getProjectById } from "~/common/data/project.data.server";
import { getScriptWithSegments, saveStoryboard, getOrCreateActiveSession, updateSessionAspectRatio } from "~/common/data/studio.data.server";
import {
  generateStoryboardStream,
  type StoryboardGenerationOptions,
  type StoryboardScene,
} from "~/lib/ai/storyboard.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const userId = await requireAuth(request);
    const body = await request.json();

    const { projectId, options } = body as {
      projectId: string;
      options: StoryboardGenerationOptions;
    };

    if (!projectId) {
      return new Response(JSON.stringify({ error: "프로젝트 ID가 필요합니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const project = await getProjectById(projectId, userId);
    if (!project) {
      return new Response(JSON.stringify({ error: "프로젝트를 찾을 수 없습니다." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get script segments for the project
    const scriptData = await getScriptWithSegments(projectId);
    if (!scriptData || scriptData.segments.length === 0) {
      return new Response(
        JSON.stringify({ error: "스크립트가 없습니다. 먼저 스크립트를 생성해주세요." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get or create active session
    const sessionId = await getOrCreateActiveSession(projectId, userId);

    // Save aspect ratio to session for downstream use (scene image/video generation)
    if (options?.aspectRatio) {
      await updateSessionAspectRatio(sessionId, options.aspectRatio);
    }

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const allScenes: StoryboardScene[] = [];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`)
          );

          // Generate storyboard with streaming (text only — no image generation)
          await generateStoryboardStream({
            project,
            scriptSegments: scriptData.segments,
            options: {
              ...options,
              language: "ko",
            },
            onScene: (scene: StoryboardScene) => {
              allScenes.push(scene);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "scene", scene })}\n\n`
                )
              );
            },
            onProgress: (text: string) => {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "progress", text })}\n\n`
                )
              );
            },
          });

          // Save all scenes to database and get real DB IDs
          let scenesWithDbIds = allScenes;
          if (allScenes.length > 0) {
            const savedIds = await saveStoryboard({
              projectId,
              sessionId,
              scenes: allScenes.map((scene) => ({
                scriptSegmentId: scene.scriptSegmentId,
                sceneNumber: scene.sceneNumber,
                orderIndex: scene.orderIndex,
                description: scene.description,
                visualPrompt: scene.visualPrompt,
                duration: scene.duration,
                emotionalTone: scene.emotionalTone,
                cameraAngle: scene.cameraAngle,
              })),
            });
            // Map DB-generated UUIDs back to scenes
            scenesWithDbIds = allScenes.map((scene, index) => ({
              ...scene,
              id: savedIds[index] ?? scene.id,
            }));
          }

          // Send completion event with real DB IDs
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "complete", scenes: scenesWithDbIds })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error(
            "Storyboard stream error:",
            error instanceof Error ? error.message : error
          );
          const errorMessage =
            error instanceof Error
              ? error.message
              : "스토리보드 생성 중 오류가 발생했습니다.";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`
            )
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
    console.error("Stream error:", error);
    return new Response(JSON.stringify({ error: "스트림 생성 실패" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
