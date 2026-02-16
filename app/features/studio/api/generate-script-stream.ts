// =============================================================================
// API Route: POST /api/studio/generate-script-stream
// =============================================================================
// Streams AI-generated script segments in real-time using Server-Sent Events

import type { Route } from "./+types/generate-script-stream";
import { requireAuth } from "~/lib/auth.server";
import { getProjectById } from "~/common/data/project.data.server";
import { generateScriptStream, type ScriptGenerationOptions } from "~/lib/ai/script.server";
import { saveScript, getOrCreateActiveSession, getPreProductionData } from "~/common/data/studio.data.server";
import type { ScriptSegment } from "~/common/types/studio.types";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const userId = await requireAuth(request);
    const body = await request.json();

    const { projectId, options } = body as {
      projectId: string;
      options: ScriptGenerationOptions;
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

    // Get or create active session + fetch Pre-Production data
    const [sessionId, preProductionRaw] = await Promise.all([
      getOrCreateActiveSession(projectId, userId),
      getPreProductionData(projectId),
    ]);

    // Build Pre-Production context for AI
    const preProduction = preProductionRaw?.preProductionStatus === "completed"
      ? {
          hooks: preProductionRaw.hooks ?? undefined,
          scriptGuidelines: preProductionRaw.scriptGuidelines ?? undefined,
          seoKeywords: preProductionRaw.seoKeywords ?? undefined,
        }
      : undefined;

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const allSegments: ScriptSegment[] = [];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`)
          );

          // Generate script with streaming (includes Pre-Production context)
          await generateScriptStream({
            project,
            options: {
              ...options,
              language: "ko",
            },
            preProduction,
            onSegment: (segment: ScriptSegment) => {
              allSegments.push(segment);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "segment", segment })}\n\n`
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

          // Save all segments to database (with full metadata)
          if (allSegments.length > 0) {
            await saveScript({
              projectId,
              sessionId,
              prompt: options.customPrompt,
              segments: allSegments.map((seg) => ({
                type: seg.type,
                content: seg.content,
                estimatedDuration: seg.duration,
                visualNotes: seg.visualNotes,
                emotionalTone: seg.emotionalTone,
                keywords: seg.keywords,
                sceneHints: seg.sceneHints,
              })),
            });
          }

          // Send completion event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "complete", segments: allSegments })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error("Script stream error:", error instanceof Error ? error.message : error);
          const errorMessage = error instanceof Error ? error.message : "스크립트 생성 중 오류가 발생했습니다.";
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
