// =============================================================================
// API Route: POST /api/studio/trendtube-generate-stream
// =============================================================================
// Streams 7-step TrendTube pipeline progress in real-time using Server-Sent Events
// Steps: Trends → Ideas → Video(Veo3) + Music(Lyria2) + Script(parallel) → TTS → FFmpeg

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
  generateNarrationScript,
} from "~/lib/ai-trendtube.server";
import { generateVideo } from "~/lib/ai-veo.server";
import { generateMusic } from "~/lib/ai-lyria.server";
import { composeVideo } from "~/lib/video-composer.server";
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
    const TOTAL_STEPS = 7;

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
            input: {
              type: "text",
              label: "YouTube URL + 사용자 아이디어",
              text: `URL: ${trendsUrl}\n아이디어: ${userIdea}`,
            },
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
            output: {
              type: "text",
              label: "추출된 트렌드",
              text: extractedTrends,
              textPreview: extractedTrends.substring(0, 200) + "...",
            },
          });

          // ==============================
          // Step 2: Generate Video Ideas
          // ==============================
          sendEvent(controller, encoder, {
            type: "step_start",
            step: 2,
            stepName: "영상 아이디어 생성",
            total: TOTAL_STEPS,
            input: {
              type: "text",
              label: "트렌드 분석",
              textPreview: extractedTrends.substring(0, 200) + "...",
            },
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
            output: {
              type: "text",
              label: "영상 아이디어",
              text: videoIdeas,
              textPreview: videoIdeas.substring(0, 200) + "...",
            },
          });

          // ==============================
          // Steps 3, 4, 5: Parallel Start
          // ==============================
          await updateSessionStatus(session.id, "generating_media", 3);

          sendEvent(controller, encoder, {
            type: "step_start",
            step: 3,
            stepName: "영상 생성 (Veo 3)",
            total: TOTAL_STEPS,
            input: {
              type: "text",
              label: "영상 아이디어 → 비디오 프롬프트",
              textPreview: videoIdeas.substring(0, 150) + "...",
            },
          });
          sendEvent(controller, encoder, {
            type: "step_start",
            step: 4,
            stepName: "배경음악 생성 (Lyria 2)",
            total: TOTAL_STEPS,
            input: {
              type: "text",
              label: "영상 아이디어 → 음악 프롬프트",
              textPreview: videoIdeas.substring(0, 150) + "...",
            },
          });
          sendEvent(controller, encoder, {
            type: "step_start",
            step: 5,
            stepName: "나레이션 스크립트 생성",
            total: TOTAL_STEPS,
            input: {
              type: "text",
              label: "영상 아이디어",
              textPreview: videoIdeas.substring(0, 200) + "...",
            },
          });

          // Launch all 3 in parallel
          const videoPromise = generateVideo(videoIdeas, { durationSeconds: 8 }).catch(
            (err) => {
              console.error("Video generation error:", err);
              return { url: "", duration: 8, prompt: "" };
            }
          );

          const musicPromise = generateMusic(videoIdeas, { durationSeconds: 8 }).catch(
            (err) => {
              console.error("Music generation error:", err);
              return { url: "", duration: 8, prompt: "", genre: "electronic" };
            }
          );

          const scriptPromise = generateNarrationScript(videoIdeas).catch(
            (err) => {
              console.error("Script generation error:", err);
              return "나레이션 스크립트 생성에 실패했습니다.";
            }
          );

          // Wait for script first (Step 5) → then start Step 6
          const narrationScript = await scriptPromise;

          await saveTrendTubeResult({
            sessionId: session.id,
            narrationScript,
          });

          sendEvent(controller, encoder, {
            type: "step_complete",
            step: 5,
            stepName: "나레이션 스크립트 생성",
            output: {
              type: "text",
              label: "나레이션 스크립트",
              text: narrationScript,
              textPreview: narrationScript.substring(0, 200) + "...",
            },
          });

          // ==============================
          // Step 6: Generate Voiceover (after Step 5)
          // ==============================
          sendEvent(controller, encoder, {
            type: "step_start",
            step: 6,
            stepName: "보이스오버 생성",
            total: TOTAL_STEPS,
            input: {
              type: "text",
              label: "나레이션 스크립트",
              textPreview: narrationScript.substring(0, 100) + "...",
            },
          });

          let voiceoverUrl: string | undefined;
          let voiceoverDuration = 0;

          try {
            const voiceResult = await generateVoiceover(
              narrationScript,
              (voiceOption as TrendTubeVoiceOption) ?? "female_ko",
              { targetDuration: 8 }
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
            stepName: "보이스오버 생성",
            output: voiceoverUrl
              ? {
                  type: "audio",
                  label: "보이스오버 (8초)",
                  mediaUrl: voiceoverUrl,
                  mediaDuration: voiceoverDuration,
                }
              : {
                  type: "text",
                  label: "보이스오버",
                  textPreview: "TTS API 키가 설정되지 않아 음성이 생성되지 않았습니다",
                },
          });

          // ==============================
          // Wait for Steps 3, 4 to complete
          // ==============================
          const [videoResult, musicResult] = await Promise.all([
            videoPromise,
            musicPromise,
          ]);

          // Save video media
          if (videoResult.url) {
            await saveTrendTubeMedia({
              sessionId: session.id,
              mediaType: "generated_video",
              publicUrl: videoResult.url,
              metadata: { duration: videoResult.duration, prompt: videoResult.prompt },
            });
          }

          sendEvent(controller, encoder, {
            type: "step_complete",
            step: 3,
            stepName: "영상 생성 (Veo 3)",
            output: videoResult.url
              ? {
                  type: "video",
                  label: "생성된 영상 (8초)",
                  mediaUrl: videoResult.url,
                  mediaDuration: videoResult.duration,
                }
              : {
                  type: "text",
                  label: "영상 생성",
                  textPreview: "Veo 3 API 키가 설정되지 않아 영상이 생성되지 않았습니다",
                },
          });

          // Save music media
          if (musicResult.url) {
            await saveTrendTubeMedia({
              sessionId: session.id,
              mediaType: "background_music",
              publicUrl: musicResult.url,
              metadata: {
                duration: musicResult.duration,
                genre: musicResult.genre,
                prompt: musicResult.prompt,
              },
            });
          }

          sendEvent(controller, encoder, {
            type: "step_complete",
            step: 4,
            stepName: "배경음악 생성 (Lyria 2)",
            output: musicResult.url
              ? {
                  type: "audio",
                  label: "배경 음악 (8초)",
                  mediaUrl: musicResult.url,
                  mediaDuration: musicResult.duration,
                }
              : {
                  type: "text",
                  label: "배경 음악",
                  textPreview: `추천 장르: ${musicResult.genre} (Lyria 2 API 미설정)`,
                },
          });

          // ==============================
          // Step 7: Compose Video (FFmpeg)
          // ==============================
          await updateSessionStatus(session.id, "compositing", 7);

          sendEvent(controller, encoder, {
            type: "step_start",
            step: 7,
            stepName: "영상 합성",
            total: TOTAL_STEPS,
            input: {
              type: "mixed",
              label: "합성 소스",
              items: [
                { type: "video", label: "원본 영상", mediaUrl: videoResult.url || undefined },
                { type: "audio", label: "배경 음악", mediaUrl: musicResult.url || undefined },
                { type: "audio", label: "보이스오버", mediaUrl: voiceoverUrl },
              ],
            },
          });

          let compositedVideoUrl: string | undefined;
          let compositedDuration = 8;

          if (videoResult.url && musicResult.url && voiceoverUrl) {
            try {
              const compositeResult = await composeVideo({
                videoUrl: videoResult.url,
                musicUrl: musicResult.url,
                voiceoverUrl,
              });
              if (compositeResult.url) {
                compositedVideoUrl = compositeResult.url;
                compositedDuration = compositeResult.duration;

                await saveTrendTubeMedia({
                  sessionId: session.id,
                  mediaType: "composited_video",
                  publicUrl: compositedVideoUrl,
                  metadata: { duration: compositedDuration },
                });
              }
            } catch (err) {
              console.error("Video composition error:", err);
            }
          }

          sendEvent(controller, encoder, {
            type: "step_complete",
            step: 7,
            stepName: "영상 합성",
            output: compositedVideoUrl
              ? {
                  type: "video",
                  label: "합성 완료 영상",
                  mediaUrl: compositedVideoUrl,
                  mediaDuration: compositedDuration,
                }
              : {
                  type: "text",
                  label: "영상 합성",
                  textPreview: "필요한 미디어 에셋이 부족하여 합성을 건너뛰었습니다",
                },
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
              videoUrl: videoResult.url || undefined,
              musicUrl: musicResult.url || undefined,
              musicDuration: musicResult.duration,
              voiceoverUrl,
              voiceoverDuration,
              compositedVideoUrl,
              compositedDuration,
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
