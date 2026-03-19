// =============================================================================
// AI Storyboard Generation Service (Google Gemini API)
// =============================================================================
// Server-side AI service for generating storyboard scenes from script segments

import type { ProjectFullDetail } from "~/common/data/project.data.server";
import type { ScriptSegment } from "~/common/types/studio.types";
import { getClient } from "./client.server";
import { withRetry } from "./retry.server";
import { buildProjectContext } from "./context-builder.server";
import { MOCK_STORYBOARD_SCENES } from "./__mocks__/fixtures";
import { AI_MODELS } from "./models.server";

// =============================================================================
// Types
// =============================================================================

export interface StoryboardScene {
  id: string;
  scriptSegmentId: string;
  sceneNumber: number;
  orderIndex: number;
  description: string;
  visualPrompt: string;
  duration: number;
  emotionalTone?: string;
  cameraAngle?: string;
}

export interface StoryboardGenerationOptions {
  style: "cinematic" | "anime" | "lineart" | "3d";
  aspectRatio: "16:9" | "9:16" | "2.35:1" | "4:3";
  density: number; // 0-100, affects number of scenes per segment
  camera?: string;
  lighting?: string;
  negativePrompt?: string;
  consistentCharacter?: boolean;
  enhancePrompt?: boolean;
  language?: "ko" | "en";
}

export interface GenerateStoryboardInput {
  project: ProjectFullDetail;
  scriptSegments: ScriptSegment[];
  options: StoryboardGenerationOptions;
}

export interface GenerateStoryboardStreamInput {
  project: ProjectFullDetail;
  scriptSegments: ScriptSegment[];
  options: StoryboardGenerationOptions;
  onScene: (scene: StoryboardScene) => void;
  onProgress: (text: string) => void;
}

// =============================================================================
// Prompts
// =============================================================================

const SYSTEM_PROMPT_KO = `당신은 전문 스토리보드 작가입니다. 영상 스크립트를 분석하여 각 세그먼트에 맞는 시각적 씬을 생성합니다.

## 역할
- 스크립트 내용을 시각적으로 표현하는 씬 분할
- AI 이미지 생성에 적합한 비주얼 프롬프트 작성
- 영상 흐름에 맞는 씬 순서 및 길이 결정

## 씬 생성 원칙
1. 각 씬의 duration은 **최대 8초** (Veo 3 영상 생성 제약)
2. 세그먼트 duration ÷ 8 (올림)으로 씬 개수 자동 계산
3. 비주얼 프롬프트는 구체적이고 묘사적으로 작성
4. 카메라 앵글, 조명, 분위기를 포함
5. 씬 간 자연스러운 전환 고려

각 씬은 다음 필드를 포함합니다:
- scriptSegmentId: 해당 스크립트 세그먼트 ID
- sceneNumber: 전체 씬 번호 (1부터 시작)
- orderIndex: 세그먼트 내 순서 (0부터 시작)
- description: 씬 설명 (한국어, 1-2문장)
- visualPrompt: AI 이미지 생성용 프롬프트 (영어, 상세하게)
- duration: 씬 길이 (초, 최대 8초)
- emotionalTone: 해당 씬의 감정 톤 (예: "exciting", "calm", "dramatic", "tense", "heartwarming")
- cameraAngle: 카메라 앵글 ("wide", "close-up", "medium", "pov", "drone", "over-the-shoulder")`;

const SYSTEM_PROMPT_EN = `You are a professional storyboard artist. You analyze video scripts and create visual scenes for each segment.

## Role
- Break down script content into visual scenes
- Write detailed visual prompts suitable for AI image generation
- Determine scene order and duration that fits the video flow

## Scene Generation Principles
1. Each scene duration must be **max 8 seconds** (Veo 3 video generation constraint)
2. Number of scenes per segment = ceil(segment duration / 8)
3. Write concrete and descriptive visual prompts
4. Include camera angles, lighting, and mood
5. Consider smooth transitions between scenes

Each scene includes:
- scriptSegmentId: The corresponding script segment ID
- sceneNumber: Overall scene number (starting from 1)
- orderIndex: Order within the segment (starting from 0)
- description: Scene description (1-2 sentences)
- visualPrompt: Detailed prompt for AI image generation
- duration: Scene duration (seconds, max 8)
- emotionalTone: The emotional tone for this scene (e.g. "exciting", "calm", "dramatic", "tense", "heartwarming")
- cameraAngle: Camera angle ("wide", "close-up", "medium", "pov", "drone", "over-the-shoulder")`;

// =============================================================================
// Style Prompts
// =============================================================================

const STYLE_PROMPTS: Record<string, string> = {
  cinematic: "cinematic lighting, film grain, dramatic shadows, movie quality, professional cinematography",
  anime: "anime style, vibrant colors, cel shading, Japanese animation aesthetic, clean lines",
  lineart: "black and white line art, sketch style, clean outlines, minimalist, hand-drawn look",
  "3d": "3D rendered, photorealistic, ray tracing, high detail, modern CGI quality",
};

const LIGHTING_PROMPTS: Record<string, string> = {
  cinematic: "dramatic lighting, volumetric light, film noir shadows",
  natural: "natural daylight, soft shadows, realistic ambient light",
  studio: "professional studio lighting, three-point lighting, clean shadows",
  neon: "neon lights, cyberpunk glow, vibrant colored lighting",
  golden: "golden hour light, warm tones, sunset glow",
  lowkey: "low key lighting, high contrast, mysterious shadows",
};

const CAMERA_PROMPTS: Record<string, string> = {
  none: "",
  pan: "panning shot",
  tilt: "tilting camera angle",
  zoom: "zooming shot",
  handheld: "handheld camera, slight shake, documentary style",
  drone: "aerial drone shot, bird's eye view",
};

// =============================================================================
// Storyboard Stream Generation Function
// =============================================================================

export async function generateStoryboardStream(
  input: GenerateStoryboardStreamInput
): Promise<void> {
  const { project, scriptSegments, options, onScene, onProgress } = input;
  const language = options.language ?? "ko";

  if (process.env.GEMINI_MOCK === "true") {
    const mockScenes = getDefaultScenes(scriptSegments, language);
    for (const scene of mockScenes) {
      onScene(scene);
      onProgress(scene.description);
      await new Promise((r) => setTimeout(r, 300));
    }
    return;
  }

  const ai = getClient();
  if (!ai || scriptSegments.length === 0) {
    console.warn("GEMINI_API_KEY not set or no segments, using default scenes");
    const defaults = getDefaultScenes(scriptSegments, language);
    for (const scene of defaults) {
      onScene(scene);
      await new Promise((r) => setTimeout(r, 300));
    }
    return;
  }

  // Build context
  const systemPrompt = language === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;
  const userPrompt = buildStoryboardPrompt(project, scriptSegments, options, language);

  try {
    const stream = await ai.models.generateContentStream({
      model: AI_MODELS.text.primary,
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    let fullText = "";
    let lastProgressUpdate = 0;
    const emittedSceneIds = new Set<number>();

    for await (const chunk of stream) {
      const text = chunk.text;
      if (!text) continue;

      fullText += text;

      // Try to extract complete scenes from the accumulated text
      const extractedScenes = extractCompleteScenes(fullText);

      for (let i = 0; i < extractedScenes.length; i++) {
        if (!emittedSceneIds.has(i)) {
          emittedSceneIds.add(i);
          const scene = normalizeScene(extractedScenes[i], options);
          const [resolved] = resolveSegmentIds([scene], scriptSegments);
          onScene(resolved);
        }
      }

      // Throttle progress updates
      const now = Date.now();
      if (now - lastProgressUpdate > 100) {
        onProgress(text);
        lastProgressUpdate = now;
      }
    }

    // Parse any remaining scenes that weren't caught during streaming
    const allScenes = resolveSegmentIds(
      parseStoryboardResponse(fullText, options),
      scriptSegments
    );
    const emittedCount = emittedSceneIds.size;

    for (let i = emittedCount; i < allScenes.length; i++) {
      onScene(allScenes[i]);
    }

    // If still no scenes, use defaults
    if (allScenes.length === 0 && emittedCount === 0) {
      const defaults = getDefaultScenes(scriptSegments, language);
      for (const scene of defaults) {
        onScene(scene);
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  } catch (error) {
    console.error(
      "Storyboard stream generation failed:",
      error instanceof Error ? error.message : error
    );
    // Fallback to default scenes
    const defaults = getDefaultScenes(scriptSegments, language);
    for (const scene of defaults) {
      onScene(scene);
      await new Promise((r) => setTimeout(r, 300));
    }
  }
}

// =============================================================================
// Non-Streaming Generation (for testing or fallback)
// =============================================================================

export async function generateStoryboard(
  input: GenerateStoryboardInput
): Promise<StoryboardScene[]> {
  const { project, scriptSegments, options } = input;
  const language = options.language ?? "ko";

  if (process.env.GEMINI_MOCK === "true") {
    return MOCK_STORYBOARD_SCENES;
  }

  const ai = getClient();
  if (!ai || scriptSegments.length === 0) {
    return getDefaultScenes(scriptSegments, language);
  }

  const systemPrompt = language === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;
  const userPrompt = buildStoryboardPrompt(project, scriptSegments, options, language);

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: AI_MODELS.text.primary,
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    );

    const text = response.text;

    if (!text) {
      return getDefaultScenes(scriptSegments, language);
    }

    return resolveSegmentIds(parseStoryboardResponse(text, options), scriptSegments);
  } catch (error) {
    console.error(
      "Failed to generate storyboard:",
      error instanceof Error ? error.message : error
    );
    return getDefaultScenes(scriptSegments, language);
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function buildStoryboardPrompt(
  project: ProjectFullDetail,
  scriptSegments: ScriptSegment[],
  options: StoryboardGenerationOptions,
  language: "ko" | "en"
): string {
  const stylePrompt = STYLE_PROMPTS[options.style] || STYLE_PROMPTS.cinematic;
  const lightingPrompt = options.lighting ? LIGHTING_PROMPTS[options.lighting] || "" : "";
  const cameraPrompt = options.camera ? CAMERA_PROMPTS[options.camera] || "" : "";

  const segmentsList = scriptSegments
    .map((seg, i) => {
      const preview = seg.content.length > 300
        ? seg.content.slice(0, 300) + "..."
        : seg.content;
      const expectedScenes = Math.ceil(seg.duration / 8);
      const lines: string[] = [];
      lines.push(`${i + 1}. [ID: SEG_${i + 1}] [Type: ${seg.type}] [Duration: ${seg.duration}s] [Expected Scenes: ${expectedScenes}] ${preview}`);
      if (seg.visualNotes) {
        lines.push(`   Visual Notes: ${seg.visualNotes}`);
      }
      if (seg.emotionalTone) {
        lines.push(`   Emotional Tone: ${seg.emotionalTone}`);
      }
      if (seg.sceneHints && seg.sceneHints.length > 0) {
        lines.push(`   Scene Hints:`);
        for (const [j, hint] of seg.sceneHints.entries()) {
          const cam = hint.cameraAngle ? ` [Camera: ${hint.cameraAngle}]` : "";
          lines.push(`     ${j + 1}) ${hint.description} (${hint.duration}s) - ${hint.visualPrompt}${cam}`);
        }
      }
      return lines.join("\n");
    })
    .join("\n");

  const projectContext = buildProjectContext(project, language);

  if (language === "ko") {
    return `다음 스크립트 세그먼트를 기반으로 스토리보드 씬을 생성해주세요.

${projectContext}

## 스타일 설정
- 비주얼 스타일: ${options.style} (${stylePrompt})
- 화면 비율: ${options.aspectRatio}
- 씬 분할: 세그먼트 duration ÷ 8초 (올림)으로 자동 계산
${lightingPrompt ? `- 조명: ${lightingPrompt}` : ""}
${cameraPrompt ? `- 카메라: ${cameraPrompt}` : ""}
${options.negativePrompt ? `- 제외할 요소: ${options.negativePrompt}` : ""}
${options.consistentCharacter ? "- 캐릭터 일관성 유지" : ""}

## 스크립트 세그먼트
${segmentsList}

## 요구사항
1. 각 세그먼트의 ID를 scriptSegmentId로 사용하세요
2. sceneNumber는 전체 씬에 대해 1부터 순차적으로 부여
3. visualPrompt는 영어로 작성하고, 스타일 키워드를 포함: "${stylePrompt}"
4. **각 씬의 duration은 최대 8초** (Veo 3 영상 생성 제약)
5. 씬 duration 합계가 해당 세그먼트의 duration과 유사하도록 설정
6. 각 씬에 emotionalTone (감정 톤)과 cameraAngle (카메라 앵글) 반드시 포함
7. Scene Hints가 제공된 경우, 이를 참고하여 씬을 생성하되 cameraAngle도 반영`;
  }

  return `Generate storyboard scenes based on the following script segments.

${projectContext}

## Style Settings
- Visual Style: ${options.style} (${stylePrompt})
- Aspect Ratio: ${options.aspectRatio}
- Scene Split: Auto-calculated by ceil(segment duration / 8s)
${lightingPrompt ? `- Lighting: ${lightingPrompt}` : ""}
${cameraPrompt ? `- Camera: ${cameraPrompt}` : ""}
${options.negativePrompt ? `- Elements to Avoid: ${options.negativePrompt}` : ""}
${options.consistentCharacter ? "- Maintain Character Consistency" : ""}

## Script Segments
${segmentsList}

## Requirements
1. Use each segment's ID as scriptSegmentId
2. Assign sceneNumber sequentially starting from 1 for all scenes
3. Write visualPrompt in English, including style keywords: "${stylePrompt}"
4. **Each scene duration must be max 8 seconds** (Veo 3 video generation constraint)
5. Scene duration sum should roughly match the segment's duration
6. Include emotionalTone and cameraAngle for every scene
7. If Scene Hints are provided, use them as reference and reflect their cameraAngle`;
}

function extractCompleteScenes(
  partialJson: string
): Record<string, unknown>[] {
  const scenes: Record<string, unknown>[] = [];

  const arrayStart = partialJson.indexOf("[");
  if (arrayStart === -1) return scenes;

  let depth = 0;
  let objectStart = -1;
  let inString = false;
  let escaped = false;

  for (let i = arrayStart; i < partialJson.length; i++) {
    const char = partialJson[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\" && inString) {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") {
      if (depth === 0) {
        objectStart = i;
      }
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0 && objectStart !== -1) {
        const objectStr = partialJson.substring(objectStart, i + 1);
        try {
          const obj = JSON.parse(objectStr);
          scenes.push(obj);
        } catch {
          // Object is not yet complete
        }
        objectStart = -1;
      }
    }
  }

  return scenes;
}

/**
 * Maps AI-generated segment index labels (SEG_1, SEG_2, ...) back to real DB UUIDs.
 * Falls back to matching by extracted number or known UUID if the AI returns unexpected identifiers.
 */
function resolveSegmentIds(
  scenes: StoryboardScene[],
  scriptSegments: ScriptSegment[],
): StoryboardScene[] {
  if (scriptSegments.length === 0) return scenes;

  const indexToUuid = new Map<string, string>();
  for (let i = 0; i < scriptSegments.length; i++) {
    indexToUuid.set(`seg_${i + 1}`, scriptSegments[i].id);
    indexToUuid.set(`${i + 1}`, scriptSegments[i].id);
  }

  const knownUuids = new Set(scriptSegments.map((s) => s.id));

  return scenes.map((scene) => {
    const key = scene.scriptSegmentId.trim().toLowerCase();

    // Direct match on SEG_N or plain number
    const resolved = indexToUuid.get(key);
    if (resolved) return { ...scene, scriptSegmentId: resolved };

    // Already a known UUID — pass through
    if (knownUuids.has(scene.scriptSegmentId)) return scene;

    // Extract any number from the string (handles "SEG_3", "segment_3", "3", etc.)
    const numMatch = key.match(/(\d+)/);
    if (numMatch) {
      const idx = parseInt(numMatch[1], 10) - 1;
      if (idx >= 0 && idx < scriptSegments.length) {
        return { ...scene, scriptSegmentId: scriptSegments[idx].id };
      }
    }

    console.warn(
      `[storyboard] Could not resolve scriptSegmentId "${scene.scriptSegmentId}" for scene ${scene.sceneNumber}. Assigning to first segment.`
    );
    return { ...scene, scriptSegmentId: scriptSegments[0].id };
  });
}

function normalizeScene(
  obj: Record<string, unknown>,
  options: StoryboardGenerationOptions
): StoryboardScene {
  const stylePrompt = STYLE_PROMPTS[options.style] || "";
  let visualPrompt = String(obj.visualPrompt || "");

  // Enhance prompt if option is enabled
  if (options.enhancePrompt && !visualPrompt.includes(stylePrompt)) {
    visualPrompt = `${visualPrompt}, ${stylePrompt}`;
  }

  // Add negative prompt if provided
  if (options.negativePrompt && !visualPrompt.includes("Negative:")) {
    visualPrompt = `${visualPrompt}. Negative: ${options.negativePrompt}`;
  }

  return {
    id: crypto.randomUUID(),
    scriptSegmentId: String(obj.scriptSegmentId || ""),
    sceneNumber: typeof obj.sceneNumber === "number" ? obj.sceneNumber : 1,
    orderIndex: typeof obj.orderIndex === "number" ? obj.orderIndex : 0,
    description: String(obj.description || ""),
    visualPrompt,
    duration: typeof obj.duration === "number" ? Math.min(obj.duration, 8) : 8,
    emotionalTone: typeof obj.emotionalTone === "string" ? obj.emotionalTone : undefined,
    cameraAngle: typeof obj.cameraAngle === "string" ? obj.cameraAngle : undefined,
  };
}

function parseStoryboardResponse(
  text: string,
  options: StoryboardGenerationOptions
): StoryboardScene[] {
  try {
    const parsed = JSON.parse(text.trim());
    if (Array.isArray(parsed)) {
      return parsed.map((obj) => normalizeScene(obj as Record<string, unknown>, options));
    }
  } catch {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((obj: Record<string, unknown>) => normalizeScene(obj, options));
      } catch {
        const salvaged = extractCompleteScenes(text);
        if (salvaged.length > 0) {
          return salvaged.map((obj) => normalizeScene(obj, options));
        }
      }
    }
  }
  return [];
}

function getDefaultScenes(
  scriptSegments: ScriptSegment[],
  language: "ko" | "en"
): StoryboardScene[] {
  const scenes: StoryboardScene[] = [];
  let sceneNumber = 1;

  for (const segment of scriptSegments) {
    // 8-second split: ceil(duration / 8)
    const numScenes = Math.max(1, Math.ceil(segment.duration / 8));
    let remainingDuration = segment.duration;

    for (let i = 0; i < numScenes; i++) {
      const hint = segment.sceneHints?.[i];
      const sceneDuration = Math.min(remainingDuration, 8);
      remainingDuration -= sceneDuration;

      scenes.push({
        id: crypto.randomUUID(),
        scriptSegmentId: segment.id,
        sceneNumber: sceneNumber++,
        orderIndex: i,
        description: hint?.description ||
          (language === "ko"
            ? `${segment.type} 세그먼트 씬 ${i + 1}`
            : `${segment.type} segment scene ${i + 1}`),
        visualPrompt: hint?.visualPrompt ||
          `${segment.type} scene, professional video production, high quality`,
        duration: sceneDuration,
      });
    }
  }

  return scenes;
}
