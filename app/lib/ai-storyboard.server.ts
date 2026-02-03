// =============================================================================
// AI Storyboard Generation Service (Google Gemini API)
// =============================================================================
// Server-side AI service for generating storyboard scenes from script segments

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ProjectFullDetail } from "~/common/data/project.data.server";
import type { ScriptSegment } from "~/common/types/studio.types";

// Initialize Gemini client
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

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
1. 각 스크립트 세그먼트당 1-4개의 씬 생성 (density에 따라 조절)
2. 비주얼 프롬프트는 구체적이고 묘사적으로 작성
3. 카메라 앵글, 조명, 분위기를 포함
4. 씬 간 자연스러운 전환 고려

응답은 반드시 유효한 JSON 배열 형식이어야 합니다.

각 씬은 다음 필드를 포함합니다:
- scriptSegmentId: 해당 스크립트 세그먼트 ID
- sceneNumber: 전체 씬 번호 (1부터 시작)
- orderIndex: 세그먼트 내 순서 (0부터 시작)
- description: 씬 설명 (한국어, 1-2문장)
- visualPrompt: AI 이미지 생성용 프롬프트 (영어, 상세하게)
- duration: 씬 길이 (초)`;

const SYSTEM_PROMPT_EN = `You are a professional storyboard artist. You analyze video scripts and create visual scenes for each segment.

## Role
- Break down script content into visual scenes
- Write detailed visual prompts suitable for AI image generation
- Determine scene order and duration that fits the video flow

## Scene Generation Principles
1. Generate 1-4 scenes per script segment (adjusted by density)
2. Write concrete and descriptive visual prompts
3. Include camera angles, lighting, and mood
4. Consider smooth transitions between scenes

Your response must be a valid JSON array only.

Each scene includes:
- scriptSegmentId: The corresponding script segment ID
- sceneNumber: Overall scene number (starting from 1)
- orderIndex: Order within the segment (starting from 0)
- description: Scene description (1-2 sentences)
- visualPrompt: Detailed prompt for AI image generation
- duration: Scene duration (seconds)`;

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

  if (!genAI || scriptSegments.length === 0) {
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
    // Using nano-banana-pro-preview model as specified
    const model = genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });

    const result = await model.generateContentStream({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
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

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (!text) continue;

      fullText += text;

      // Try to extract complete scenes from the accumulated text
      const extractedScenes = extractCompleteScenes(fullText);

      for (let i = 0; i < extractedScenes.length; i++) {
        if (!emittedSceneIds.has(i)) {
          emittedSceneIds.add(i);
          const scene = normalizeScene(extractedScenes[i], options);
          onScene(scene);
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
    const allScenes = parseStoryboardResponse(fullText, options);
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

  if (!genAI || scriptSegments.length === 0) {
    return getDefaultScenes(scriptSegments, language);
  }

  const systemPrompt = language === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;
  const userPrompt = buildStoryboardPrompt(project, scriptSegments, options, language);

  try {
    const model = genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    const response = result.response;
    const text = response.text();

    if (!text) {
      return getDefaultScenes(scriptSegments, language);
    }

    return parseStoryboardResponse(text, options);
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
  const densityLabel =
    options.density > 70 ? (language === "ko" ? "높음" : "high") :
    options.density < 30 ? (language === "ko" ? "낮음" : "low") :
    (language === "ko" ? "보통" : "medium");

  const scenesPerSegment =
    options.density > 70 ? "3-4" :
    options.density < 30 ? "1-2" :
    "2-3";

  const stylePrompt = STYLE_PROMPTS[options.style] || STYLE_PROMPTS.cinematic;
  const lightingPrompt = options.lighting ? LIGHTING_PROMPTS[options.lighting] || "" : "";
  const cameraPrompt = options.camera ? CAMERA_PROMPTS[options.camera] || "" : "";

  const segmentsList = scriptSegments
    .map((seg, i) => {
      const preview = seg.content.length > 200
        ? seg.content.slice(0, 200) + "..."
        : seg.content;
      return `${i + 1}. [ID: ${seg.id}] [Type: ${seg.type}] ${preview}`;
    })
    .join("\n");

  if (language === "ko") {
    return `다음 스크립트 세그먼트를 기반으로 스토리보드 씬을 생성해주세요.

## 프로젝트 정보
- 제목: ${project.title}
${project.topic ? `- 주제: ${project.topic}` : ""}
${project.targetAudience ? `- 타겟 시청자: ${project.targetAudience}` : ""}

## 스타일 설정
- 비주얼 스타일: ${options.style} (${stylePrompt})
- 화면 비율: ${options.aspectRatio}
- 씬 밀도: ${densityLabel} (세그먼트당 ${scenesPerSegment}개 씬)
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
4. 씬 duration 합계가 해당 세그먼트의 duration과 유사하도록 설정

JSON 배열만 반환하세요.`;
  }

  return `Generate storyboard scenes based on the following script segments.

## Project Info
- Title: ${project.title}
${project.topic ? `- Topic: ${project.topic}` : ""}
${project.targetAudience ? `- Target Audience: ${project.targetAudience}` : ""}

## Style Settings
- Visual Style: ${options.style} (${stylePrompt})
- Aspect Ratio: ${options.aspectRatio}
- Scene Density: ${densityLabel} (${scenesPerSegment} scenes per segment)
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
4. Scene duration sum should roughly match the segment's duration

Return only a JSON array.`;
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
    duration: typeof obj.duration === "number" ? obj.duration : 5,
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
    const numScenes = segment.sceneHints?.length || 2;

    for (let i = 0; i < numScenes; i++) {
      const hint = segment.sceneHints?.[i];
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
        duration: hint?.duration || Math.ceil(segment.duration / numScenes),
      });
    }
  }

  return scenes;
}
