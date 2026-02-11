// =============================================================================
// API Route: POST /api/studio/trendtube-generate-stream
// =============================================================================
// Streams TrendTube pipeline progress in real-time using Server-Sent Events

import type { Route } from "./+types/trendtube-generate-stream";
import { requireAuth } from "~/lib/auth.server";
import { getProjectById } from "~/common/data/project.data.server";
import {
  createTrendTubeSession,
  updateSessionStatus,
  saveTrendTubeResult,
  saveTrendTubeMedia,
} from "~/common/data/trendtube.data.server";
import {
  extractYouTubeTrends,
  generateVideoIdeas,
  generateVideoImages,
  generateNarrationScript,
  selectBackgroundMusic,
} from "~/lib/ai-trendtube.server";
import { generateVoiceover } from "~/lib/tts.server";
import type {
  TrendTubeInput,
  TrendTubeStreamEvent,
  TrendTubeVoiceOption,
} from "~/common/types/trendtube.types";

function sendEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: TrendTubeStreamEvent
) {
  controller.enqueue(
    encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
  );
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const userId = await requireAuth(request);
    const body = (await request.json()) as TrendTubeInput;

    const { projectId, trendsUrl, userIdea, referenceImageUrl, voiceOption } =
      body;

    if (!projectId || !trendsUrl || !userIdea) {
      return new Response(
        JSON.stringify({ error: "필수 입력값이 누락되었습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const project = await getProjectById(projectId, userId);
    if (!project) {
      return new Response(
        JSON.stringify({ error: "프로젝트를 찾을 수 없습니다." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create session
    const session = await createTrendTubeSession({
      projectId,
      userId,
      trendsUrl,
      userIdea,
      referenceImageUrl,
      voiceOption: voiceOption as TrendTubeVoiceOption,
    });

    const encoder = new TextEncoder();
    const TOTAL_STEPS = 6;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          sendEvent(controller, encoder, {
            type: "pipeline_start",
            sessionId: session.id,
          });

          // ==============================
          // Step 1: Extract YouTube Trends
          // ==============================
          sendEvent(controller, encoder, {
            type: "step_start",
            step: 1,
            stepName: "트렌드 추출",
            total: TOTAL_STEPS,
          });

          await updateSessionStatus(session.id, "extracting", 1);

          let extractedTrends: string;
          try {
            extractedTrends = await extractYouTubeTrends(trendsUrl, userIdea);
          } catch (err) {
            sendEvent(controller, encoder, {
              type: "pipeline_error",
              step: 1,
              error:
                err instanceof Error
                  ? err.message
                  : "트렌드 추출에 실패했습니다.",
            });
            await updateSessionStatus(
              session.id,
              "failed",
              1,
              "트렌드 추출 실패"
            );
            controller.close();
            return;
          }

          await saveTrendTubeResult({
            sessionId: session.id,
            extractedTrends,
          });

          sendEvent(controller, encoder, {
            type: "step_complete",
            step: 1,
            stepName: "트렌드 추출",
            data: { preview: extractedTrends.substring(0, 200) + "..." },
          });

          // ==============================
          // Step 2: Generate Video Ideas
          // ==============================
          sendEvent(controller, encoder, {
            type: "step_start",
            step: 2,
            stepName: "영상 아이디어 생성",
            total: TOTAL_STEPS,
          });

          await updateSessionStatus(session.id, "generating_ideas", 2);

          let videoIdeas: string;
          try {
            videoIdeas = await generateVideoIdeas(extractedTrends);
          } catch (err) {
            sendEvent(controller, encoder, {
              type: "pipeline_error",
              step: 2,
              error:
                err instanceof Error
                  ? err.message
                  : "아이디어 생성에 실패했습니다.",
            });
            await updateSessionStatus(
              session.id,
              "failed",
              2,
              "아이디어 생성 실패"
            );
            controller.close();
            return;
          }

          await saveTrendTubeResult({
            sessionId: session.id,
            videoIdeas,
          });

          sendEvent(controller, encoder, {
            type: "step_complete",
            step: 2,
            stepName: "영상 아이디어 생성",
            data: { preview: videoIdeas.substring(0, 200) + "..." },
          });

          // ==============================
          // Step 3, 4, 5: Parallel Generation
          // ==============================
          await updateSessionStatus(session.id, "generating_media", 3);

          sendEvent(controller, encoder, {
            type: "step_start",
            step: 3,
            stepName: "영상 이미지 생성",
            total: TOTAL_STEPS,
          });
          sendEvent(controller, encoder, {
            type: "step_start",
            step: 4,
            stepName: "나레이션 스크립트 작성",
            total: TOTAL_STEPS,
          });
          sendEvent(controller, encoder, {
            type: "step_start",
            step: 5,
            stepName: "배경 음악 선택",
            total: TOTAL_STEPS,
          });

          // Run steps 3, 4, 5 in parallel
          const [imageUrls, narrationScript, bgmTrack] =
            await Promise.all([
              generateVideoImages(videoIdeas).catch((err) => {
                console.error("Image generation error:", err);
                return [] as string[];
              }),
              generateNarrationScript(videoIdeas).catch((err) => {
                console.error("Script generation error:", err);
                return "나레이션 스크립트 생성에 실패했습니다.";
              }),
              selectBackgroundMusic(videoIdeas).catch(() => ({
                genre: "calm",
                label: "잔잔한 어쿠스틱",
                description: "기본 BGM",
              })),
            ]);

          // Save narration script
          await saveTrendTubeResult({
            sessionId: session.id,
            narrationScript,
          });

          // Save image media
          for (const imageUrl of imageUrls) {
            await saveTrendTubeMedia({
              sessionId: session.id,
              mediaType: "video_image",
              publicUrl: imageUrl,
            });
          }

          // Save BGM selection
          await saveTrendTubeMedia({
            sessionId: session.id,
            mediaType: "background_music",
            metadata: bgmTrack,
          });

          sendEvent(controller, encoder, {
            type: "step_complete",
            step: 3,
            stepName: "영상 이미지 생성",
            data: { imageCount: imageUrls.length },
          });
          sendEvent(controller, encoder, {
            type: "step_complete",
            step: 4,
            stepName: "나레이션 스크립트 작성",
            data: { preview: narrationScript.substring(0, 200) + "..." },
          });
          sendEvent(controller, encoder, {
            type: "step_complete",
            step: 5,
            stepName: "배경 음악 선택",
            data: bgmTrack,
          });

          // ==============================
          // Step 6: Generate Voiceover
          // ==============================
          sendEvent(controller, encoder, {
            type: "step_start",
            step: 6,
            stepName: "음성 나레이션 생성",
            total: TOTAL_STEPS,
          });

          let voiceoverUrl: string | undefined;
          let voiceoverDuration = 0;

          try {
            const voiceResult = await generateVoiceover(
              narrationScript,
              (voiceOption as TrendTubeVoiceOption) ?? "female_ko"
            );

            if (voiceResult.audioBase64) {
              voiceoverUrl = `data:${voiceResult.mimeType};base64,${voiceResult.audioBase64}`;
              voiceoverDuration = voiceResult.estimatedDuration;

              await saveTrendTubeMedia({
                sessionId: session.id,
                mediaType: "voiceover",
                publicUrl: voiceoverUrl,
                metadata: { duration: voiceoverDuration },
              });
            }
          } catch (err) {
            console.error("Voiceover generation error:", err);
          }

          sendEvent(controller, encoder, {
            type: "step_complete",
            step: 6,
            stepName: "음성 나레이션 생성",
            data: { duration: voiceoverDuration },
          });

          // ==============================
          // Pipeline Complete
          // ==============================
          await updateSessionStatus(session.id, "completed", TOTAL_STEPS);

          sendEvent(controller, encoder, {
            type: "pipeline_complete",
            sessionId: session.id,
            results: {
              extractedTrends,
              videoIdeas,
              narrationScript,
              imageUrls,
              musicGenre: bgmTrack.genre,
              musicUrl: undefined,
              voiceoverUrl,
              voiceoverDuration,
            },
          });

          controller.close();
        } catch (error) {
          console.error("Pipeline stream error:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "파이프라인 실행 중 오류가 발생했습니다.";

          sendEvent(controller, encoder, {
            type: "pipeline_error",
            step: 0,
            error: errorMessage,
          });

          await updateSessionStatus(session.id, "failed", 0, errorMessage);
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
    console.error("TrendTube stream error:", error);
    return new Response(
      JSON.stringify({ error: "TrendTube 스트림 생성 실패" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
