// =============================================================================
// API Route: POST /api/studio/trendtube-step-media
// =============================================================================
// Step 3: Generate media assets in parallel (SSE stream)
// Sub-steps: Video(Veo3) + Music(Lyria2) + NarrationScript + Voiceover(TTS)

import type { Route } from "./+types/trendtube-step-media";
import { requireAuth } from "~/lib/auth.server";
import {
  getTrendTubeSessionForUser,
  updateSessionStatus,
  saveTrendTubeResult,
  saveTrendTubeMedia,
} from "~/common/data/trendtube.data.server";
import { generateNarrationScript } from "~/lib/ai-trendtube.server";
import { generateVideo } from "~/lib/ai-video.server";
import { generateMusic } from "~/lib/ai-music.server";
import { generateVoiceover } from "~/lib/tts.server";
import type {
  TrendTubeStepSessionInput,
  TrendTubeMediaStreamEvent,
  TrendTubeVoiceOption,
} from "~/common/types/trendtube.types";

function sendEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: TrendTubeMediaStreamEvent
) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}

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

    const videoIdeas = session.result?.videoIdeas;
    if (!videoIdeas) {
      return Response.json(
        { error: "이전 단계(아이디어 생성)가 완료되지 않았습니다." },
        { status: 400 }
      );
    }

    const voiceOption =
      (session.voiceOption as TrendTubeVoiceOption) ?? "female_ko";

    await updateSessionStatus(session.id, "generating_media", 3);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Notify start of all sub-steps
          sendEvent(controller, encoder, {
            type: "media_start",
            substep: "video",
            label: "영상 생성 (Veo 3)",
          });
          sendEvent(controller, encoder, {
            type: "media_start",
            substep: "music",
            label: "배경음악 생성 (Lyria 2)",
          });
          sendEvent(controller, encoder, {
            type: "media_start",
            substep: "script",
            label: "나레이션 스크립트 생성",
          });

          // Launch video + music + script in parallel
          const videoPromise = generateVideo(videoIdeas, {
            durationSeconds: 8,
          })
            .then(async (result) => {
              if (result.url) {
                await saveTrendTubeMedia({
                  sessionId: session.id,
                  mediaType: "generated_video",
                  publicUrl: result.url,
                  metadata: {
                    duration: result.duration,
                    prompt: result.prompt,
                  },
                });
              }
              sendEvent(controller, encoder, {
                type: "media_complete",
                substep: "video",
                output: result.url
                  ? {
                      type: "video",
                      label: "생성된 영상 (8초)",
                      mediaUrl: result.url,
                      mediaDuration: result.duration,
                    }
                  : {
                      type: "text",
                      label: "영상 생성",
                      textPreview:
                        "Veo 3 API 키가 설정되지 않아 영상이 생성되지 않았습니다",
                    },
              });
              return result;
            })
            .catch((err) => {
              console.error("Video generation error:", err);
              sendEvent(controller, encoder, {
                type: "media_error",
                substep: "video",
                error:
                  err instanceof Error
                    ? err.message
                    : "영상 생성에 실패했습니다.",
              });
              return { url: "", duration: 8, prompt: "" };
            });

          const musicPromise = generateMusic(videoIdeas, {
            durationSeconds: 8,
          })
            .then(async (result) => {
              if (result.url) {
                await saveTrendTubeMedia({
                  sessionId: session.id,
                  mediaType: "background_music",
                  publicUrl: result.url,
                  metadata: {
                    duration: result.duration,
                    genre: result.genre,
                    prompt: result.prompt,
                  },
                });
              }
              sendEvent(controller, encoder, {
                type: "media_complete",
                substep: "music",
                output: result.url
                  ? {
                      type: "audio",
                      label: "배경 음악 (8초)",
                      mediaUrl: result.url,
                      mediaDuration: result.duration,
                    }
                  : {
                      type: "text",
                      label: "배경 음악",
                      textPreview: `추천 장르: ${result.genre} (Lyria 2 API 미설정)`,
                    },
              });
              return result;
            })
            .catch((err) => {
              console.error("Music generation error:", err);
              sendEvent(controller, encoder, {
                type: "media_error",
                substep: "music",
                error:
                  err instanceof Error
                    ? err.message
                    : "음악 생성에 실패했습니다.",
              });
              return { url: "", duration: 8, prompt: "", genre: "electronic" };
            });

          // Script → then voiceover (sequential dependency)
          const scriptAndVoicePromise = generateNarrationScript(videoIdeas)
            .then(async (narrationScript) => {
              await saveTrendTubeResult({
                sessionId: session.id,
                narrationScript,
              });
              sendEvent(controller, encoder, {
                type: "media_complete",
                substep: "script",
                output: {
                  type: "text",
                  label: "나레이션 스크립트",
                  text: narrationScript,
                  textPreview: narrationScript.substring(0, 200),
                },
              });

              // Now generate voiceover
              sendEvent(controller, encoder, {
                type: "media_start",
                substep: "voiceover",
                label: "보이스오버 생성",
              });

              try {
                const voiceResult = await generateVoiceover(
                  narrationScript,
                  voiceOption,
                  { targetDuration: 8 }
                );

                if (voiceResult.audioBase64) {
                  const voiceoverUrl = `data:${voiceResult.mimeType};base64,${voiceResult.audioBase64}`;
                  await saveTrendTubeMedia({
                    sessionId: session.id,
                    mediaType: "voiceover",
                    publicUrl: voiceoverUrl,
                    metadata: { duration: voiceResult.estimatedDuration },
                  });

                  sendEvent(controller, encoder, {
                    type: "media_complete",
                    substep: "voiceover",
                    output: {
                      type: "audio",
                      label: "보이스오버 (8초)",
                      mediaUrl: voiceoverUrl,
                      mediaDuration: voiceResult.estimatedDuration,
                    },
                  });
                } else {
                  sendEvent(controller, encoder, {
                    type: "media_complete",
                    substep: "voiceover",
                    output: {
                      type: "text",
                      label: "보이스오버",
                      textPreview:
                        "TTS API 키가 설정되지 않아 음성이 생성되지 않았습니다",
                    },
                  });
                }
              } catch (err) {
                console.error("Voiceover generation error:", err);
                sendEvent(controller, encoder, {
                  type: "media_error",
                  substep: "voiceover",
                  error:
                    err instanceof Error
                      ? err.message
                      : "보이스오버 생성에 실패했습니다.",
                });
              }
            })
            .catch((err) => {
              console.error("Script generation error:", err);
              sendEvent(controller, encoder, {
                type: "media_error",
                substep: "script",
                error:
                  err instanceof Error
                    ? err.message
                    : "나레이션 스크립트 생성에 실패했습니다.",
              });
            });

          // Wait for all parallel tasks to complete
          await Promise.all([
            videoPromise,
            musicPromise,
            scriptAndVoicePromise,
          ]);

          sendEvent(controller, encoder, { type: "media_all_complete" });
          controller.close();
        } catch (error) {
          console.error("Media stream error:", error);
          sendEvent(controller, encoder, {
            type: "media_error",
            substep: "video",
            error:
              error instanceof Error
                ? error.message
                : "미디어 생성 중 오류가 발생했습니다.",
          });
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
    console.error("TrendTube step-media error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "미디어 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
