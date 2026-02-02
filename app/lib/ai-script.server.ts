// =============================================================================
// AI Script Generation Service (Google Gemini API)
// =============================================================================
// Server-side AI service for generating video scripts

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

export interface ScriptGenerationOptions {
  tone: "informative" | "casual" | "professional" | "dramatic" | "funny";
  length: "short" | "medium" | "long";
  customPrompt?: string;
  includeHook?: boolean;
  includeCTA?: boolean;
  language?: "ko" | "en";
  // Advanced AI options (Note: presencePenalty and frequencyPenalty are NOT supported by gemini-2.5-flash)
  temperature?: number;      // 0.0 - 2.0, default 0.8
  topP?: number;             // 0.0 - 1.0, default 0.9
  topK?: number;             // 1 - 100, default 40
}

export interface GenerateScriptInput {
  project: ProjectFullDetail;
  options: ScriptGenerationOptions;
}

export interface RefineScriptInput {
  segment: ScriptSegment;
  action: "improve_grammar" | "make_shorter" | "expand" | "change_tone";
  targetTone?: string;
  language?: "ko" | "en";
}

export interface GenerateScriptStreamInput {
  project: ProjectFullDetail;
  options: ScriptGenerationOptions;
  onSegment: (segment: ScriptSegment) => void;
  onProgress: (text: string) => void;
}

// =============================================================================
// Prompts
// =============================================================================

const SYSTEM_PROMPT_KO = `당신은 전문 유튜브 영상 대본 작가입니다. 시청자의 관심을 끌고 끝까지 시청하게 만드는 **완전한 대본**을 작성합니다.

## 중요: 완전한 대본 작성
- 각 세그먼트의 content는 **실제로 영상에서 말할 완전한 대본**이어야 합니다
- 제목이나 요약이 아닌, 발표자가 카메라 앞에서 읽을 **전체 스크립트**를 작성하세요

## 세그먼트별 분량 가이드
- Hook: 2-4문장 (강렬한 질문이나 놀라운 사실로 시작)
- Intro: 4-8문장 (영상 내용 소개 + 시청해야 하는 이유)
- Body: 각 10-20문장 이상 (핵심 내용을 상세히 설명)
- CTA: 3-5문장 (구체적인 행동 유도)
- Outro: 3-5문장 (마무리 + 다음 영상 예고)

응답은 반드시 유효한 JSON 배열 형식이어야 합니다.

각 세그먼트는 다음 필드를 포함합니다:
- type: "hook", "intro", "body", "cta", "outro" 중 하나
- content: 실제 대본 내용 (완전한 스크립트)
- duration: 예상 읽기 시간 (초)
- visualNotes: 영상 연출 방향 (짧게)
- emotionalTone: "exciting", "calm", "dramatic", "informative", "humorous" 중 하나
- keywords: B-roll 검색용 키워드 배열 (3개)

대본 작성 원칙:
1. Hook: 시청자의 관심을 사로잡는 강렬한 오프닝
2. Intro: 영상 내용 소개 + 왜 봐야 하는지
3. Body: 핵심 내용을 상세하게 전달
4. CTA: 구독, 좋아요 등 행동 유도
5. Outro: 요약 + 다음 영상 예고`;

const SYSTEM_PROMPT_EN = `You are a professional YouTube video script writer. You create **complete, full scripts** that capture viewer attention.

## IMPORTANT: Write Complete Scripts
- Each segment's content must be the **actual script to be spoken**
- NOT titles or summaries - write the **full narration**

## Length Guidelines Per Segment
- Hook: 2-4 sentences (powerful question or surprising fact)
- Intro: 4-8 sentences (introduce content + why keep watching)
- Body: 10-20+ sentences each (explain in detail)
- CTA: 3-5 sentences (specific call to action)
- Outro: 3-5 sentences (wrap-up + teaser)

Your response must be a valid JSON array only.

Each segment includes:
- type: "hook", "intro", "body", "cta", "outro"
- content: Complete script content
- duration: Estimated reading time (seconds)
- visualNotes: Visual direction (brief)
- emotionalTone: "exciting", "calm", "dramatic", "informative", "humorous"
- keywords: B-roll search keywords (3 items)

Script principles:
1. Hook: Capture attention with powerful opening
2. Intro: Explain why watch till end
3. Body: Deliver content in detail
4. CTA: Specific call to action
5. Outro: Summary + teaser`;

const REFINE_PROMPT_KO: Record<string, string> = {
  improve_grammar: "다음 대본의 문법과 가독성을 개선해주세요. 의미는 유지하면서 더 자연스럽게 만들어주세요.",
  make_shorter: "다음 대본을 더 간결하게 줄여주세요. 핵심 메시지는 유지하면서 불필요한 부분을 제거해주세요.",
  expand: "다음 대본을 더 풍부하게 확장해주세요. 예시나 설명을 추가하여 내용을 보강해주세요.",
  change_tone: "다음 대본의 톤을 변경해주세요.",
};

const REFINE_PROMPT_EN: Record<string, string> = {
  improve_grammar: "Improve the grammar and readability of the following script. Make it more natural while preserving the meaning.",
  make_shorter: "Make the following script more concise. Remove unnecessary parts while keeping the core message.",
  expand: "Expand the following script to be more comprehensive. Add examples or explanations to enrich the content.",
  change_tone: "Change the tone of the following script.",
};

// =============================================================================
// Script Generation Function
// =============================================================================

export async function generateScript(
  input: GenerateScriptInput
): Promise<ScriptSegment[]> {
  const { project, options } = input;
  const language = options.language ?? "ko";

  if (!genAI) {
    console.warn("GEMINI_API_KEY not set, returning empty script");
    return getDefaultSegments(language);
  }

  // Build context from project
  const projectContext = buildProjectContext(project, language);
  const systemPrompt = language === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;

  // Build length guidance with detailed word counts
  const lengthGuidance = {
    short: language === "ko"
      ? "총 길이: 1-2분 (약 300-600자, Body 세그먼트 1-2개)"
      : "Total length: 1-2 minutes (150-300 words, 1-2 Body segments)",
    medium: language === "ko"
      ? "총 길이: 5-10분 (약 1500-3000자, Body 세그먼트 3-4개)"
      : "Total length: 5-10 minutes (750-1500 words, 3-4 Body segments)",
    long: language === "ko"
      ? "총 길이: 10-20분 (약 3000-6000자, Body 세그먼트 5-7개)"
      : "Total length: 10-20 minutes (1500-3000 words, 5-7 Body segments)",
  };

  // Build tone guidance
  const toneGuidance = {
    informative: language === "ko" ? "정보 전달형 - 명확하고 교육적인 톤" : "Informative - Clear and educational tone",
    casual: language === "ko" ? "캐주얼 - 친근하고 편안한 톤" : "Casual - Friendly and relaxed tone",
    professional: language === "ko" ? "전문적 - 신뢰감 있는 비즈니스 톤" : "Professional - Trustworthy business tone",
    dramatic: language === "ko" ? "드라마틱 - 긴장감 있고 스토리텔링형" : "Dramatic - Tension-building and storytelling",
    funny: language === "ko" ? "재미있는 - 유머와 위트가 있는 톤" : "Funny - Humorous and witty tone",
  };

  const userPrompt = language === "ko"
    ? `다음 프로젝트 정보를 바탕으로 **완전한 유튜브 영상 대본**을 작성해주세요.

## 프로젝트 정보
${projectContext}

## 대본 요구사항
- 톤/스타일: ${toneGuidance[options.tone]}
- ${lengthGuidance[options.length]}
${options.includeHook !== false ? "- Hook 세그먼트 포함 (강렬한 오프닝)" : "- Hook 세그먼트 제외"}
${options.includeCTA !== false ? "- CTA 세그먼트 포함 (구체적인 행동 유도)" : "- CTA 세그먼트 제외"}
${options.customPrompt ? `\n## 추가 요청사항\n${options.customPrompt}` : ""}

## 중요 지침
1. 각 세그먼트의 content는 **실제로 말할 완전한 대본**이어야 합니다
2. 제목이나 요약이 아닌, **발표자가 읽을 전체 스크립트**를 작성하세요
3. Body 세그먼트는 각각 구체적인 소주제를 다루며, 예시와 설명을 포함하세요
4. 전체 스토리가 자연스럽게 흐르도록 세그먼트 간 연결을 고려하세요
5. 시청자가 끝까지 보고 싶어지는 내러티브를 구축하세요

JSON 배열만 반환하세요.`
    : `Create a **complete YouTube video script** based on the following project information.

## Project Information
${projectContext}

## Script Requirements
- Tone/Style: ${toneGuidance[options.tone]}
- ${lengthGuidance[options.length]}
${options.includeHook !== false ? "- Include Hook segment (powerful opening)" : "- Exclude Hook segment"}
${options.includeCTA !== false ? "- Include CTA segment (specific call to action)" : "- Exclude CTA segment"}
${options.customPrompt ? `\n## Additional Requirements\n${options.customPrompt}` : ""}

## Important Guidelines
1. Each segment's content must be the **actual script to be spoken** in the video
2. NOT titles or summaries - write the **full narration** the presenter will read
3. Each Body segment should cover a specific subtopic with examples and explanations
4. Ensure natural flow and transitions between segments
5. Build a narrative that makes viewers want to watch until the end

Return only a JSON array.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.8,           // 창의적인 스크립트를 위해 약간 높임
        topP: options.topP ?? 0.9,                         // 다양한 표현 허용
        topK: options.topK ?? 40,                          // 상위 40개 토큰에서 샘플링
        maxOutputTokens: 8192,
        responseMimeType: "application/json",              // JSON 형식 강제
        // Note: presencePenalty and frequencyPenalty are NOT supported by gemini-2.5-flash
      },
    });

    const response = result.response;
    const text = response.text();

    if (!text) {
      console.error("No text content in Gemini response");
      return getDefaultSegments(language);
    }

    // Parse JSON response
    const segments = parseScriptResponse(text);
    return segments;
  } catch (error) {
    console.error("Failed to generate script:", error instanceof Error ? error.message : error);
    return getDefaultSegments(language);
  }
}

// =============================================================================
// Streaming Script Generation Function
// =============================================================================

export async function generateScriptStream(
  input: GenerateScriptStreamInput
): Promise<void> {
  const { project, options, onSegment, onProgress } = input;
  const language = options.language ?? "ko";

  if (!genAI) {
    console.warn("GEMINI_API_KEY not set, using default segments");
    const defaults = getDefaultSegments(language);
    for (const seg of defaults) {
      onSegment(seg);
      await new Promise((r) => setTimeout(r, 500)); // Small delay for UI effect
    }
    return;
  }

  // Build context from project
  const projectContext = buildProjectContext(project, language);
  const systemPrompt = language === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;

  // Build length guidance with detailed word counts
  const lengthGuidance = {
    short: language === "ko"
      ? "총 길이: 1-2분 (약 300-600자, Body 세그먼트 1-2개)"
      : "Total length: 1-2 minutes (150-300 words, 1-2 Body segments)",
    medium: language === "ko"
      ? "총 길이: 5-10분 (약 1500-3000자, Body 세그먼트 3-4개)"
      : "Total length: 5-10 minutes (750-1500 words, 3-4 Body segments)",
    long: language === "ko"
      ? "총 길이: 10-20분 (약 3000-6000자, Body 세그먼트 5-7개)"
      : "Total length: 10-20 minutes (1500-3000 words, 5-7 Body segments)",
  };

  // Build tone guidance
  const toneGuidance = {
    informative: language === "ko" ? "정보 전달형 - 명확하고 교육적인 톤" : "Informative - Clear and educational tone",
    casual: language === "ko" ? "캐주얼 - 친근하고 편안한 톤" : "Casual - Friendly and relaxed tone",
    professional: language === "ko" ? "전문적 - 신뢰감 있는 비즈니스 톤" : "Professional - Trustworthy business tone",
    dramatic: language === "ko" ? "드라마틱 - 긴장감 있고 스토리텔링형" : "Dramatic - Tension-building and storytelling",
    funny: language === "ko" ? "재미있는 - 유머와 위트가 있는 톤" : "Funny - Humorous and witty tone",
  };

  const userPrompt = language === "ko"
    ? `다음 프로젝트 정보를 바탕으로 **완전한 유튜브 영상 대본**을 작성해주세요.

## 프로젝트 정보
${projectContext}

## 대본 요구사항
- 톤/스타일: ${toneGuidance[options.tone]}
- ${lengthGuidance[options.length]}
${options.includeHook !== false ? "- Hook 세그먼트 포함 (강렬한 오프닝)" : "- Hook 세그먼트 제외"}
${options.includeCTA !== false ? "- CTA 세그먼트 포함 (구체적인 행동 유도)" : "- CTA 세그먼트 제외"}
${options.customPrompt ? `\n## 추가 요청사항\n${options.customPrompt}` : ""}

## 중요 지침
1. 각 세그먼트의 content는 **실제로 말할 완전한 대본**이어야 합니다
2. 제목이나 요약이 아닌, **발표자가 읽을 전체 스크립트**를 작성하세요
3. Body 세그먼트는 각각 구체적인 소주제를 다루며, 예시와 설명을 포함하세요
4. 전체 스토리가 자연스럽게 흐르도록 세그먼트 간 연결을 고려하세요
5. 시청자가 끝까지 보고 싶어지는 내러티브를 구축하세요

JSON 배열만 반환하세요.`
    : `Create a **complete YouTube video script** based on the following project information.

## Project Information
${projectContext}

## Script Requirements
- Tone/Style: ${toneGuidance[options.tone]}
- ${lengthGuidance[options.length]}
${options.includeHook !== false ? "- Include Hook segment (powerful opening)" : "- Exclude Hook segment"}
${options.includeCTA !== false ? "- Include CTA segment (specific call to action)" : "- Exclude CTA segment"}
${options.customPrompt ? `\n## Additional Requirements\n${options.customPrompt}` : ""}

## Important Guidelines
1. Each segment's content must be the **actual script to be spoken** in the video
2. NOT titles or summaries - write the **full narration** the presenter will read
3. Each Body segment should cover a specific subtopic with examples and explanations
4. Ensure natural flow and transitions between segments
5. Build a narrative that makes viewers want to watch until the end

Return only a JSON array.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContentStream({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        topP: options.topP ?? 0.9,
        topK: options.topK ?? 40,
        maxOutputTokens: 16384,
        responseMimeType: "application/json",
      },
    });

    let fullText = "";
    let lastProgressUpdate = 0;
    let emittedSegmentCount = 0;
    const emittedSegmentIds = new Set<number>();

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (!text) continue;

      fullText += text;

      // Try to extract complete segments from the accumulated text
      const extractedSegments = extractCompleteSegments(fullText);

      for (let i = 0; i < extractedSegments.length; i++) {
        if (!emittedSegmentIds.has(i)) {
          emittedSegmentIds.add(i);
          const segment = normalizeSegment(extractedSegments[i]);
          onSegment(segment);
          emittedSegmentCount++;
        }
      }

      // Throttle progress updates
      const now = Date.now();
      if (now - lastProgressUpdate > 100) {
        onProgress(text);
        lastProgressUpdate = now;
      }
    }

    // Parse any remaining segments that weren't caught during streaming
    const allSegments = parseScriptResponse(fullText);

    for (let i = emittedSegmentCount; i < allSegments.length; i++) {
      onSegment(allSegments[i]);
    }

    // If still no segments, use defaults
    if (allSegments.length === 0 && emittedSegmentCount === 0) {
      const defaults = getDefaultSegments(language);
      for (const seg of defaults) {
        onSegment(seg);
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  } catch (error) {
    console.error("Script stream generation failed:", error instanceof Error ? error.message : error);
    // Fallback to default segments
    const defaults = getDefaultSegments(language);
    for (const seg of defaults) {
      onSegment(seg);
      await new Promise((r) => setTimeout(r, 300));
    }
  }
}

/**
 * Extract complete JSON objects from a partial JSON array string.
 * This enables incremental parsing during streaming.
 */
function extractCompleteSegments(partialJson: string): Record<string, unknown>[] {
  const segments: Record<string, unknown>[] = [];

  // Find the start of the array
  const arrayStart = partialJson.indexOf('[');
  if (arrayStart === -1) return segments;

  let depth = 0;
  let objectStart = -1;
  let inString = false;
  let escaped = false;

  for (let i = arrayStart; i < partialJson.length; i++) {
    const char = partialJson[i];

    // Handle escape sequences in strings
    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }

    // Handle string boundaries
    if (char === '"') {
      inString = !inString;
      continue;
    }

    // Skip characters inside strings
    if (inString) continue;

    // Track object depth
    if (char === '{') {
      if (depth === 0) {
        objectStart = i;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && objectStart !== -1) {
        // We have a complete object
        const objectStr = partialJson.substring(objectStart, i + 1);
        try {
          const obj = JSON.parse(objectStr);
          segments.push(obj);
        } catch {
          // Object is not yet complete or malformed, skip it
        }
        objectStart = -1;
      }
    }
  }

  return segments;
}

/**
 * Normalize a single segment object
 */
function normalizeSegment(seg: Record<string, unknown>): ScriptSegment {
  // Parse scene hints if present
  let sceneHints: ScriptSegment["sceneHints"];
  if (Array.isArray(seg.sceneHints)) {
    sceneHints = seg.sceneHints.map((hint: unknown) => {
      const h = hint as Record<string, unknown>;
      return {
        description: String(h.description || ""),
        visualPrompt: String(h.visualPrompt || ""),
        duration: typeof h.duration === "number" ? h.duration : 5,
        cameraAngle: validateCameraAngle(h.cameraAngle),
      };
    });
  }

  // Parse keywords if present
  let keywords: string[] | undefined;
  if (Array.isArray(seg.keywords)) {
    keywords = seg.keywords.filter((k): k is string => typeof k === "string");
  }

  return {
    id: crypto.randomUUID(),
    type: validateSegmentType(seg.type),
    content: String(seg.content || ""),
    duration: typeof seg.duration === "number" ? seg.duration : 0,
    visualNotes: typeof seg.visualNotes === "string" ? seg.visualNotes : undefined,
    emotionalTone: typeof seg.emotionalTone === "string" ? seg.emotionalTone : undefined,
    keywords,
    sceneHints,
  };
}

// =============================================================================
// Script Refinement Function
// =============================================================================

export async function refineScriptSegment(
  input: RefineScriptInput
): Promise<string> {
  const { segment, action, targetTone, language = "ko" } = input;

  if (!genAI) {
    console.warn("GEMINI_API_KEY not set, returning original content");
    return segment.content;
  }

  const refinePrompts = language === "ko" ? REFINE_PROMPT_KO : REFINE_PROMPT_EN;
  let actionPrompt = refinePrompts[action];

  if (action === "change_tone" && targetTone) {
    actionPrompt += language === "ko"
      ? ` 원하는 톤: ${targetTone}`
      : ` Target tone: ${targetTone}`;
  }

  const userPrompt = language === "ko"
    ? `${actionPrompt}

원본 대본:
"${segment.content}"

수정된 대본만 반환하세요. JSON이나 추가 설명 없이 텍스트만 반환하세요.`
    : `${actionPrompt}

Original script:
"${segment.content}"

Return only the refined script. No JSON or additional explanation, just the text.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1024,
      },
    });

    const response = result.response;
    const text = response.text();

    if (!text) {
      return segment.content;
    }

    // Clean up the response (remove quotes if present)
    return text.trim().replace(/^["']|["']$/g, "");
  } catch (error) {
    console.error("Failed to refine script:", error instanceof Error ? error.message : error);
    return segment.content;
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function buildProjectContext(project: ProjectFullDetail, language: "ko" | "en"): string {
  const lines: string[] = [];

  if (language === "ko") {
    lines.push(`제목: ${project.title}`);
    if (project.description) lines.push(`설명: ${project.description}`);
    if (project.topic) lines.push(`주제: ${project.topic}`);
    if (project.targetAudience) lines.push(`타겟 시청자: ${project.targetAudience}`);
    if (project.contentTone) lines.push(`콘텐츠 톤: ${project.contentTone}`);
    if (project.videoLength) lines.push(`영상 길이: ${project.videoLength}`);
    if (project.hooks && project.hooks.length > 0) {
      lines.push(`추천 훅: ${project.hooks.join(", ")}`);
    }
    if (project.basedOnTrend) lines.push(`관련 트렌드: ${project.basedOnTrend}`);
    if (project.aiContext) {
      const ctx = project.aiContext;
      if (ctx.keywords && ctx.keywords.length > 0) {
        lines.push(`키워드: ${ctx.keywords.join(", ")}`);
      }
      if (ctx.scriptGuidelines) lines.push(`대본 가이드라인: ${ctx.scriptGuidelines}`);
      if (ctx.styleNotes) lines.push(`스타일 노트: ${ctx.styleNotes}`);
      if (ctx.callToAction) lines.push(`CTA: ${ctx.callToAction}`);
    }
  } else {
    lines.push(`Title: ${project.title}`);
    if (project.description) lines.push(`Description: ${project.description}`);
    if (project.topic) lines.push(`Topic: ${project.topic}`);
    if (project.targetAudience) lines.push(`Target Audience: ${project.targetAudience}`);
    if (project.contentTone) lines.push(`Content Tone: ${project.contentTone}`);
    if (project.videoLength) lines.push(`Video Length: ${project.videoLength}`);
    if (project.hooks && project.hooks.length > 0) {
      lines.push(`Suggested Hooks: ${project.hooks.join(", ")}`);
    }
    if (project.basedOnTrend) lines.push(`Related Trend: ${project.basedOnTrend}`);
    if (project.aiContext) {
      const ctx = project.aiContext;
      if (ctx.keywords && ctx.keywords.length > 0) {
        lines.push(`Keywords: ${ctx.keywords.join(", ")}`);
      }
      if (ctx.scriptGuidelines) lines.push(`Script Guidelines: ${ctx.scriptGuidelines}`);
      if (ctx.styleNotes) lines.push(`Style Notes: ${ctx.styleNotes}`);
      if (ctx.callToAction) lines.push(`CTA: ${ctx.callToAction}`);
    }
  }

  return lines.join("\n");
}

function parseScriptResponse(text: string): ScriptSegment[] {
  try {
    // Try direct parse first
    const parsed = JSON.parse(text.trim());
    if (Array.isArray(parsed)) {
      return normalizeSegments(parsed);
    }
  } catch {
    // Try to extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return normalizeSegments(parsed);
      } catch {
        // Try to salvage partial response by extracting complete objects
        const salvaged = extractCompleteSegments(text);
        if (salvaged.length > 0) {
          return salvaged.map(seg => normalizeSegment(seg));
        }
      }
    }
  }
  return [];
}

function normalizeSegments(segments: unknown[]): ScriptSegment[] {
  return segments.map((seg) => {
    const s = seg as Record<string, unknown>;

    // Parse scene hints if present
    let sceneHints: ScriptSegment["sceneHints"];
    if (Array.isArray(s.sceneHints)) {
      sceneHints = s.sceneHints.map((hint: unknown) => {
        const h = hint as Record<string, unknown>;
        return {
          description: String(h.description || ""),
          visualPrompt: String(h.visualPrompt || ""),
          duration: typeof h.duration === "number" ? h.duration : 5,
          cameraAngle: validateCameraAngle(h.cameraAngle),
        };
      });
    }

    // Parse keywords if present
    let keywords: string[] | undefined;
    if (Array.isArray(s.keywords)) {
      keywords = s.keywords.filter((k): k is string => typeof k === "string");
    }

    return {
      id: crypto.randomUUID(),
      type: validateSegmentType(s.type),
      content: String(s.content || ""),
      duration: typeof s.duration === "number" ? s.duration : 0,
      visualNotes: typeof s.visualNotes === "string" ? s.visualNotes : undefined,
      emotionalTone: typeof s.emotionalTone === "string" ? s.emotionalTone : undefined,
      keywords,
      sceneHints,
    };
  });
}

function validateCameraAngle(angle: unknown): string | undefined {
  const validAngles = ["wide", "close-up", "medium", "pov", "aerial"];
  if (typeof angle === "string" && validAngles.includes(angle)) {
    return angle;
  }
  return undefined;
}

function validateSegmentType(type: unknown): ScriptSegment["type"] {
  const validTypes = ["hook", "intro", "body", "cta", "outro"] as const;
  if (typeof type === "string" && validTypes.includes(type as typeof validTypes[number])) {
    return type as ScriptSegment["type"];
  }
  return "body";
}

function getDefaultSegments(language: "ko" | "en"): ScriptSegment[] {
  if (language === "ko") {
    return [
      {
        id: crypto.randomUUID(),
        type: "hook",
        content: "여기에 시청자의 관심을 끄는 오프닝을 작성하세요...",
        duration: 5,
        visualNotes: "강렬한 시각적 오프닝",
        emotionalTone: "exciting",
        keywords: ["hook", "attention", "opening"],
        sceneHints: [{ description: "오프닝 씬", visualPrompt: "Dynamic opening shot", duration: 5 }],
      },
      {
        id: crypto.randomUUID(),
        type: "intro",
        content: "영상 소개를 작성하세요...",
        duration: 15,
        visualNotes: "발표자 소개 및 주제 제시",
        emotionalTone: "informative",
        keywords: ["introduction", "topic"],
        sceneHints: [{ description: "인트로 씬", visualPrompt: "Presenter introduction shot", duration: 15 }],
      },
      {
        id: crypto.randomUUID(),
        type: "body",
        content: "메인 콘텐츠를 작성하세요...",
        duration: 60,
        visualNotes: "핵심 내용 전달",
        emotionalTone: "informative",
        keywords: ["main content", "explanation"],
        sceneHints: [
          { description: "메인 콘텐츠 씬 1", visualPrompt: "Main content visualization", duration: 30 },
          { description: "메인 콘텐츠 씬 2", visualPrompt: "Supporting visuals", duration: 30 },
        ],
      },
      {
        id: crypto.randomUUID(),
        type: "cta",
        content: "구독과 좋아요를 요청하세요...",
        duration: 10,
        visualNotes: "행동 유도 그래픽",
        emotionalTone: "exciting",
        keywords: ["subscribe", "like", "call to action"],
        sceneHints: [{ description: "CTA 씬", visualPrompt: "Call to action overlay graphics", duration: 10 }],
      },
      {
        id: crypto.randomUUID(),
        type: "outro",
        content: "마무리 인사를 작성하세요...",
        duration: 10,
        visualNotes: "마무리 및 다음 영상 예고",
        emotionalTone: "calm",
        keywords: ["outro", "goodbye", "next video"],
        sceneHints: [{ description: "아웃트로 씬", visualPrompt: "Closing credits and end screen", duration: 10 }],
      },
    ];
  }
  return [
    {
      id: crypto.randomUUID(),
      type: "hook",
      content: "Write an attention-grabbing opening here...",
      duration: 5,
      visualNotes: "Strong visual opening",
      emotionalTone: "exciting",
      keywords: ["hook", "attention", "opening"],
      sceneHints: [{ description: "Opening scene", visualPrompt: "Dynamic opening shot", duration: 5 }],
    },
    {
      id: crypto.randomUUID(),
      type: "intro",
      content: "Write your video introduction...",
      duration: 15,
      visualNotes: "Presenter intro and topic reveal",
      emotionalTone: "informative",
      keywords: ["introduction", "topic"],
      sceneHints: [{ description: "Intro scene", visualPrompt: "Presenter introduction shot", duration: 15 }],
    },
    {
      id: crypto.randomUUID(),
      type: "body",
      content: "Write your main content...",
      duration: 60,
      visualNotes: "Core content delivery",
      emotionalTone: "informative",
      keywords: ["main content", "explanation"],
      sceneHints: [
        { description: "Main content scene 1", visualPrompt: "Main content visualization", duration: 30 },
        { description: "Main content scene 2", visualPrompt: "Supporting visuals", duration: 30 },
      ],
    },
    {
      id: crypto.randomUUID(),
      type: "cta",
      content: "Ask for subscribe and like...",
      duration: 10,
      visualNotes: "Call to action graphics",
      emotionalTone: "exciting",
      keywords: ["subscribe", "like", "call to action"],
      sceneHints: [{ description: "CTA scene", visualPrompt: "Call to action overlay graphics", duration: 10 }],
    },
    {
      id: crypto.randomUUID(),
      type: "outro",
      content: "Write your closing...",
      duration: 10,
      visualNotes: "Wrap-up and next video teaser",
      emotionalTone: "calm",
      keywords: ["outro", "goodbye", "next video"],
      sceneHints: [{ description: "Outro scene", visualPrompt: "Closing credits and end screen", duration: 10 }],
    },
  ];
}
