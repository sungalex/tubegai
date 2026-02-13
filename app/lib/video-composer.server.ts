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
  videoUrl: string;
  musicUrl: string;
  voiceoverUrl: string;
  outputFormat?: "mp4";
}

export interface ComposeVideoResult {
  url: string;
  duration: number;
}

/**
 * Compose video + background music + voiceover into a single MP4
 * Background music at 30% volume, voiceover at 100% volume
 */
export async function composeVideo(
  input: ComposeVideoInput
): Promise<ComposeVideoResult> {
  // Check if FFmpeg is available
  const ffmpegAvailable = await checkFfmpeg();
  if (!ffmpegAvailable) {
    console.warn("FFmpeg not available, returning placeholder");
    return createPlaceholderComposition();
  }

  // Check if all inputs have valid URLs
  if (!input.videoUrl || !input.musicUrl || !input.voiceoverUrl) {
    console.warn("Missing media inputs for composition, returning placeholder");
    return createPlaceholderComposition();
  }

  const tempDir = await mkdtemp(join(tmpdir(), "trendtube-"));

  const videoPath = join(tempDir, "video.mp4");
  const musicPath = join(tempDir, "music.wav");
  const voiceoverPath = join(tempDir, "voiceover.mp3");
  const outputPath = join(tempDir, "output.mp4");

  try {
    // Download media files to temp directory
    await Promise.all([
      downloadMedia(input.videoUrl, videoPath),
      downloadMedia(input.musicUrl, musicPath),
      downloadMedia(input.voiceoverUrl, voiceoverPath),
    ]);

    // Run FFmpeg composition
    await execFileAsync(FFMPEG_PATH, [
      "-i", videoPath,
      "-i", musicPath,
      "-i", voiceoverPath,
      "-filter_complex",
      "[1:a]volume=0.3[bg];[2:a]volume=1.0[vo];[bg][vo]amix=inputs=2:duration=shortest[aout]",
      "-map", "0:v",
      "-map", "[aout]",
      "-c:v", "copy",
      "-c:a", "aac",
      "-shortest",
      "-t", "8",
      "-y",
      outputPath,
    ], { timeout: 60000 });

    // Read output and convert to base64 data URL
    const outputBuffer = await readFile(outputPath);
    const base64 = outputBuffer.toString("base64");
    const url = `data:video/mp4;base64,${base64}`;

    return { url, duration: 8 };
  } catch (error) {
    console.error("FFmpeg composition error:", error);
    return createPlaceholderComposition();
  } finally {
    // Cleanup temp files
    await cleanupFiles([videoPath, musicPath, voiceoverPath, outputPath]);
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
function createPlaceholderComposition(): ComposeVideoResult {
  return { url: "", duration: 8 };
}
