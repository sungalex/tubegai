// =============================================================================
// API Route: POST /api/studio/render-rough-cut
// =============================================================================
// Renders rough cut timeline into a single video via FFmpeg.
// Uses SSE to stream progress events to the client.

import type { Route } from "./+types/render-rough-cut";
import { requireAuth } from "~/lib/auth.server";
import {
  getOrCreateRoughCutTimeline,
  createRoughCutVersion,
} from "~/common/data/studio.data.server";
import { createMediaAsset } from "~/common/data/media.data.server";
import { uploadStudioMedia } from "~/lib/supabase-storage.server";
import { execFile } from "child_process";
import { writeFile, unlink, readFile, mkdtemp } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const FFMPEG_PATH = process.env.FFMPEG_PATH || "ffmpeg";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const userId = await requireAuth(request);
    const { projectId } = (await request.json()) as { projectId: string };

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "projectId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const timeline = await getOrCreateRoughCutTimeline(projectId);
    const videoSegments = timeline.segments
      .filter((s) => s.trackId === "V1" && s.publicUrl)
      .sort((a, b) => a.startTime - b.startTime);

    if (videoSegments.length === 0) {
      return new Response(
        JSON.stringify({ error: "타임라인에 비디오 클립이 없습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ event, ...data as object })}\n\n`),
          );
        };

        try {
          send("start", { totalClips: videoSegments.length });

          // Check FFmpeg availability
          try {
            await execFileAsync(FFMPEG_PATH, ["-version"], { timeout: 5000 });
          } catch {
            send("error", { message: "FFmpeg를 사용할 수 없습니다." });
            controller.close();
            return;
          }

          const tempDir = await mkdtemp(join(tmpdir(), "roughcut-"));
          const tempFiles: string[] = [];

          try {
            // Download and trim each clip
            const clipPaths: string[] = [];

            for (let i = 0; i < videoSegments.length; i++) {
              const seg = videoSegments[i];
              send("progress", {
                step: "download",
                current: i + 1,
                total: videoSegments.length,
                percent: Math.round(((i + 1) / videoSegments.length) * 50),
              });

              const inputPath = join(tempDir, `input_${i}.mp4`);
              const trimmedPath = join(tempDir, `trimmed_${i}.mp4`);
              tempFiles.push(inputPath, trimmedPath);

              // Download
              const response = await fetch(seg.publicUrl!);
              if (!response.ok) throw new Error(`Failed to download clip ${i}`);
              const buffer = Buffer.from(await response.arrayBuffer());
              await writeFile(inputPath, buffer);

              // Trim if needed
              const hasTrim = seg.trimStart > 0 || seg.duration < 999;
              if (hasTrim) {
                await execFileAsync(FFMPEG_PATH, [
                  "-ss", String(seg.trimStart),
                  "-t", String(seg.duration),
                  "-i", inputPath,
                  "-c", "copy",
                  "-y",
                  trimmedPath,
                ], { timeout: 60000 });
                clipPaths.push(trimmedPath);
              } else {
                clipPaths.push(inputPath);
              }
            }

            send("progress", {
              step: "concat",
              percent: 60,
              message: "클립 합성 중...",
            });

            // Build concat list
            const concatListPath = join(tempDir, "concat_list.txt");
            const concatContent = clipPaths
              .map((p) => `file '${p}'`)
              .join("\n");
            await writeFile(concatListPath, concatContent);
            tempFiles.push(concatListPath);

            const outputPath = join(tempDir, "output.mp4");
            tempFiles.push(outputPath);

            // Concat
            await execFileAsync(FFMPEG_PATH, [
              "-f", "concat",
              "-safe", "0",
              "-i", concatListPath,
              "-c", "copy",
              "-y",
              outputPath,
            ], { timeout: 120000 });

            send("progress", {
              step: "upload",
              percent: 80,
              message: "업로드 중...",
            });

            // Read output and upload
            const outputBuffer = await readFile(outputPath);
            const totalDuration = videoSegments.reduce(
              (sum, s) => sum + s.duration,
              0,
            );

            // Upload to Supabase Storage
            const { storageKey, publicUrl } = await uploadStudioMedia({
              projectId,
              sessionId: "rough-cut",
              category: "rough-cut",
              sceneNumber: 0,
              buffer: outputBuffer,
              mimeType: "video/mp4",
            });

            // Create media asset
            const assetId = await createMediaAsset({
              userId,
              projectId,
              type: "video",
              storageKey,
              publicUrl,
              fileSize: outputBuffer.length,
              mimeType: "video/mp4",
              duration: totalDuration,
            });

            // Create version record
            const versionId = await createRoughCutVersion({
              projectId,
              name: `Rough Cut v${Date.now()}`,
              videoAssetId: assetId,
              duration: totalDuration,
            });

            send("complete", {
              versionId,
              videoUrl: publicUrl,
              duration: totalDuration,
            });
          } finally {
            // Cleanup temp files
            for (const p of tempFiles) {
              try {
                await unlink(p);
              } catch {
                // Ignore
              }
            }
          }
        } catch (error) {
          send("error", {
            message: error instanceof Error
              ? error.message
              : "렌더링 중 오류가 발생했습니다.",
          });
        }

        controller.close();
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
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
