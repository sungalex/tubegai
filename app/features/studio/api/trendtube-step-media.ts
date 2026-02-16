// =============================================================================
// API Route: POST /api/studio/trendtube-step-media
// =============================================================================
// Step 3: Generate media assets (SSE stream)
// Pipeline: Full narration → N clip prompts → N sequential video clips
//           + parallel music (N×8s) + TTS voiceover (full narration)

import type { Route } from "./+types/trendtube-step-media";
import { requireAuth } from "~/lib/auth.server";
import {
  getTrendTubeSessionForUser,
  updateSessionStatus,
  saveTrendTubeResult,
  saveTrendTubeMedia,
} from "~/common/data/trendtube.data.server";
import {
  generateFullNarrationScript,
  generateVideoClipPrompts,
} from "~/lib/ai/trendtube.server";
import { generateTrendTubeClip } from "~/lib/ai/video.server";
import { generateMusic } from "~/lib/ai/music.server";
import { generateVoiceover } from "~/lib/ai/tts.server";
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
    const userClipCount = body.clipCount;

    await updateSessionStatus(session.id, "generating_media", 3);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // =====================================================================
          // Phase 1: Generate full narration script → determine clip count
          // =====================================================================
          sendEvent(controller, encoder, {
            type: "media_start",
            substep: "script",
            label: "전체 나레이션 스크립트 생성",
          });

          let narrationScript: string;
          let clipCount: number;
          let totalDuration: number;

          try {
            const narrationResult = await generateFullNarrationScript(videoIdeas);
            narrationScript = narrationResult.script;
            totalDuration = narrationResult.estimatedDurationSeconds;
            clipCount = userClipCount ?? narrationResult.suggestedClipCount;

            // Save narration to results
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
          } catch (err) {
            console.error("Full narration generation error:", err);
            sendEvent(controller, encoder, {
              type: "media_error",
              substep: "script",
              error:
                err instanceof Error
                  ? err.message
                  : "나레이션 스크립트 생성에 실패했습니다.",
            });
            sendEvent(controller, encoder, {
              type: "media_all_complete",
            });
            controller.close();
            return;
          }

          // =====================================================================
          // Phase 2: Generate N video clip prompts
          // =====================================================================
          sendEvent(controller, encoder, {
            type: "media_start",
            substep: "video",
            label: `영상 클립 프롬프트 생성 (${clipCount}개)`,
            totalClips: clipCount,
          });

          let clipPrompts: Awaited<ReturnType<typeof generateVideoClipPrompts>>;
          try {
            clipPrompts = await generateVideoClipPrompts(
              videoIdeas,
              narrationScript,
              clipCount
            );
          } catch (err) {
            console.error("Clip prompt generation error:", err);
            sendEvent(controller, encoder, {
              type: "media_error",
              substep: "video",
              error:
                err instanceof Error
                  ? err.message
                  : "클립 프롬프트 생성에 실패했습니다.",
            });
            sendEvent(controller, encoder, {
              type: "media_all_complete",
            });
            controller.close();
            return;
          }

          // =====================================================================
          // Phase 3: Parallel execution
          //   - Sequential: N video clips
          //   - Parallel: Music (N×8s) + TTS voiceover (full narration)
          // =====================================================================

          const musicDurationSeconds = clipCount * 8;

          // --- Music generation (parallel) ---
          sendEvent(controller, encoder, {
            type: "media_start",
            substep: "music",
            label: `배경음악 생성 (${musicDurationSeconds}초)`,
          });

          const musicPromise = generateMusic(videoIdeas, {
            durationSeconds: musicDurationSeconds,
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
                      label: `배경 음악 (${musicDurationSeconds}초)`,
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
              return { url: "", duration: musicDurationSeconds, prompt: "", genre: "electronic" };
            });

          // --- Voiceover generation (parallel) ---
          sendEvent(controller, encoder, {
            type: "media_start",
            substep: "voiceover",
            label: "보이스오버 생성",
          });

          const voiceoverPromise = generateVoiceover(
            narrationScript,
            voiceOption,
            { targetDuration: totalDuration }
          )
            .then(async (voiceResult) => {
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
                    label: `보이스오버 (약 ${voiceResult.estimatedDuration}초)`,
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
            })
            .catch((err) => {
              console.error("Voiceover generation error:", err);
              sendEvent(controller, encoder, {
                type: "media_error",
                substep: "voiceover",
                error:
                  err instanceof Error
                    ? err.message
                    : "보이스오버 생성에 실패했습니다.",
              });
            });

          // --- Sequential N video clip generation ---
          const videoClipPromise = (async () => {
            for (const clip of clipPrompts) {
              sendEvent(controller, encoder, {
                type: "media_clip_start",
                clipNumber: clip.clipNumber,
                totalClips: clipCount,
                label: `클립 ${clip.clipNumber}/${clipCount} 생성 중`,
              });

              try {
                const clipResult = await generateTrendTubeClip(clip.prompt, {
                  durationSeconds: 8,
                });

                let clipUrl = "";
                if (clipResult.buffer.length > 0) {
                  clipUrl = `data:${clipResult.mimeType};base64,${clipResult.buffer.toString("base64")}`;
                }

                if (clipUrl) {
                  await saveTrendTubeMedia({
                    sessionId: session.id,
                    mediaType: "generated_video",
                    publicUrl: clipUrl,
                    clipNumber: clip.clipNumber,
                    prompt: clip.prompt,
                    metadata: {
                      duration: 8,
                      clipNumber: clip.clipNumber,
                      narrativeContext: clip.narrativeContext,
                    },
                  });
                }

                sendEvent(controller, encoder, {
                  type: "media_clip_complete",
                  clipNumber: clip.clipNumber,
                  totalClips: clipCount,
                  output: clipUrl
                    ? {
                        type: "video",
                        label: `클립 ${clip.clipNumber} (8초)`,
                        mediaUrl: clipUrl,
                        mediaDuration: 8,
                      }
                    : {
                        type: "text",
                        label: `클립 ${clip.clipNumber}`,
                        textPreview: "Veo 3 API 키가 설정되지 않아 영상이 생성되지 않았습니다",
                      },
                });
              } catch (err) {
                console.error(`Clip ${clip.clipNumber} generation error:`, err);
                sendEvent(controller, encoder, {
                  type: "media_error",
                  substep: "video",
                  clipNumber: clip.clipNumber,
                  error:
                    err instanceof Error
                      ? err.message
                      : `클립 ${clip.clipNumber} 생성에 실패했습니다.`,
                });
              }
            }

            // All clips done — send video complete
            sendEvent(controller, encoder, {
              type: "media_complete",
              substep: "video",
              output: {
                type: "text",
                label: `영상 클립 ${clipCount}개 생성 완료`,
                textPreview: `총 ${clipCount}개 클립 (${clipCount * 8}초)`,
              },
            });
          })();

          // Wait for all parallel tasks to complete
          await Promise.all([
            videoClipPromise,
            musicPromise,
            voiceoverPromise,
          ]);

          sendEvent(controller, encoder, {
            type: "media_all_complete",
            totalDuration: clipCount * 8,
            clipCount,
          });
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
