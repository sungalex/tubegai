// =============================================================================
// FFmpeg Video Composer Service
// =============================================================================
// Server-side service for compositing video + music + voiceover into final MP4

import { execFile } from "child_process";
import { writeFile, unlink, readFile, mkdtemp } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const FFMPEG_PATH = process.env.FFMPEG_PATH || "ffmpeg";

export interface ComposeVideoInput {
  videoUrl?: string;
  videoClipUrls?: string[];
  musicUrl: string;
  voiceoverUrl: string;
  totalDuration?: number;
  outputFormat?: "mp4";
}

export interface ComposeVideoResult {
  url: string;
  duration: number;
}

/**
 * Compose video + background music + voiceover into a single MP4
 * Background music at 30% volume, voiceover at 100% volume
 * Supports N-clip concat via videoClipUrls or single video via videoUrl
 */
export async function composeVideo(
  input: ComposeVideoInput
): Promise<ComposeVideoResult> {
  // Check if FFmpeg is available
  const ffmpegAvailable = await checkFfmpeg();
  if (!ffmpegAvailable) {
    console.warn("FFmpeg not available, returning placeholder");
    return createPlaceholderComposition(input.totalDuration);
  }

  // Determine video source: multi-clip or single
  const hasMultiClip = input.videoClipUrls && input.videoClipUrls.length > 0;
  const hasSingleVideo = !!input.videoUrl;

  if (!hasMultiClip && !hasSingleVideo) {
    console.warn("No video input for composition, returning placeholder");
    return createPlaceholderComposition(input.totalDuration);
  }

  if (!input.musicUrl || !input.voiceoverUrl) {
    console.warn("Missing audio inputs for composition, returning placeholder");
    return createPlaceholderComposition(input.totalDuration);
  }

  const duration = input.totalDuration ?? 8;
  const tempDir = await mkdtemp(join(tmpdir(), "trendtube-"));
  const tempFiles: string[] = [];

  const musicPath = join(tempDir, "music.wav");
  const voiceoverPath = join(tempDir, "voiceover.mp3");
  const outputPath = join(tempDir, "output.mp4");
  tempFiles.push(musicPath, voiceoverPath, outputPath);

  try {
    // Download audio files
    await Promise.all([
      downloadMedia(input.musicUrl, musicPath),
      downloadMedia(input.voiceoverUrl, voiceoverPath),
    ]);

    let videoInputPath: string;

    if (hasMultiClip && input.videoClipUrls!.length > 1) {
      // --- N-clip concat ---
      const clipPaths: string[] = [];

      // Download all clips
      for (let i = 0; i < input.videoClipUrls!.length; i++) {
        const clipPath = join(tempDir, `clip_${i}.mp4`);
        await downloadMedia(input.videoClipUrls![i], clipPath);
        clipPaths.push(clipPath);
        tempFiles.push(clipPath);
      }

      // Create concat list file
      const concatListPath = join(tempDir, "concat_list.txt");
      const concatContent = clipPaths
        .map((p) => `file '${p}'`)
        .join("\n");
      await writeFile(concatListPath, concatContent);
      tempFiles.push(concatListPath);

      // Concat clips
      const concatOutputPath = join(tempDir, "concat.mp4");
      tempFiles.push(concatOutputPath);

      await execFileAsync(FFMPEG_PATH, [
        "-f", "concat",
        "-safe", "0",
        "-i", concatListPath,
        "-c", "copy",
        "-y",
        concatOutputPath,
      ], { timeout: 120000 });

      videoInputPath = concatOutputPath;
    } else {
      // --- Single video ---
      const singleUrl = hasMultiClip ? input.videoClipUrls![0] : input.videoUrl!;
      videoInputPath = join(tempDir, "video.mp4");
      await downloadMedia(singleUrl, videoInputPath);
      tempFiles.push(videoInputPath);
    }

    // Final composition: video + music + voiceover
    await execFileAsync(FFMPEG_PATH, [
      "-i", videoInputPath,
      "-i", musicPath,
      "-i", voiceoverPath,
      "-filter_complex",
      "[1:a]volume=0.3[bg];[2:a]volume=1.0[vo];[bg][vo]amix=inputs=2:duration=shortest[aout]",
      "-map", "0:v",
      "-map", "[aout]",
      "-c:v", "copy",
      "-c:a", "aac",
      "-shortest",
      "-t", String(duration),
      "-y",
      outputPath,
    ], { timeout: 120000 });

    // Read output and convert to base64 data URL
    const outputBuffer = await readFile(outputPath);
    const base64 = outputBuffer.toString("base64");
    const url = `data:video/mp4;base64,${base64}`;

    return { url, duration };
  } catch (error) {
    console.error("FFmpeg composition error:", error);
    return createPlaceholderComposition(duration);
  } finally {
    await cleanupFiles(tempFiles);
  }
}

/**
 * Download media from URL or base64 data URL to a local file
 */
async function downloadMedia(url: string, filePath: string): Promise<void> {
  if (url.startsWith("data:")) {
    // Base64 data URL
    const base64Data = url.split(",")[1];
    if (!base64Data) throw new Error("Invalid data URL");
    await writeFile(filePath, Buffer.from(base64Data, "base64"));
  } else if (url.startsWith("http")) {
    // HTTP URL
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(filePath, buffer);
  } else {
    throw new Error(`Unsupported URL scheme: ${url.substring(0, 20)}`);
  }
}

/**
 * Check if FFmpeg is available on the system
 */
async function checkFfmpeg(): Promise<boolean> {
  try {
    await execFileAsync(FFMPEG_PATH, ["-version"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Cleanup temporary files (best-effort)
 */
async function cleanupFiles(paths: string[]): Promise<void> {
  for (const p of paths) {
    try {
      await unlink(p);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Create a placeholder composition result
 */
function createPlaceholderComposition(duration?: number): ComposeVideoResult {
  return { url: "", duration: duration ?? 8 };
}
