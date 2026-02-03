// =============================================================================
// AI Image Generation Service (Google Gemini Imagen)
// =============================================================================
// Server-side AI service for generating images from visual prompts

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// =============================================================================
// Types
// =============================================================================

export interface ImageGenerationOptions {
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "2.35:1";
  style?: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
}

export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
}

// =============================================================================
// Image Dimensions
// =============================================================================

function getImageDimensions(aspectRatio?: string): { width: number; height: number } {
  switch (aspectRatio) {
    case "1:1":
      return { width: 1024, height: 1024 };
    case "16:9":
      return { width: 1024, height: 576 };
    case "9:16":
      return { width: 576, height: 1024 };
    case "4:3":
      return { width: 1024, height: 768 };
    case "3:4":
      return { width: 768, height: 1024 };
    case "2.35:1":
      return { width: 1024, height: 436 };
    default:
      return { width: 1024, height: 576 }; // Default to 16:9
  }
}

// =============================================================================
// Prompt Enhancement
// =============================================================================

function buildEnhancedPrompt(prompt: string, options: ImageGenerationOptions): string {
  let enhanced = prompt;

  // Add style prefix if provided
  if (options.style) {
    enhanced = `${options.style}, ${enhanced}`;
  }

  // Add quality and detail enhancers
  enhanced = `${enhanced}, high quality, detailed, professional`;

  // Add negative prompt handling (for Gemini, we append instructions)
  if (options.negativePrompt) {
    enhanced = `${enhanced}. Avoid: ${options.negativePrompt}`;
  }

  return enhanced;
}

// =============================================================================
// Image Generation
// =============================================================================

/**
 * Generate an image from a visual prompt using Gemini Imagen
 */
export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<GeneratedImage> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다");
  }

  const dimensions = getImageDimensions(options.aspectRatio);
  const enhancedPrompt = buildEnhancedPrompt(prompt, options);

  try {
    // Use Gemini 3 Pro Image model for image generation (from CLAUDE.md)
    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-image-preview",
    });

    // Generate image using Gemini's image generation capability
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Create an image: ${enhancedPrompt}. Style: storyboard frame, cinematic composition, professional quality.`,
            },
          ],
        },
      ],
      generationConfig: {
        // @ts-expect-error - Gemini image generation config
        responseModalities: ["image", "text"],
      },
    });

    const response = result.response;
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      throw new Error("이미지 생성 응답이 없습니다");
    }

    // Find image part in response
    const parts = candidates[0].content?.parts || [];
    const imagePart = parts.find(
      (part) => "inlineData" in part && part.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart || !("inlineData" in imagePart) || !imagePart.inlineData) {
      // If no image in response, try using Imagen model directly
      return await generateImageWithImagen(enhancedPrompt, options);
    }

    const imageData = imagePart.inlineData;
    const buffer = Buffer.from(imageData.data, "base64");

    return {
      buffer,
      mimeType: imageData.mimeType || "image/png",
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    console.error("Gemini image generation error:", error);
    // Fallback to Imagen model
    return await generateImageWithImagen(enhancedPrompt, options);
  }
}

/**
 * Generate image using nano-banana-pro-preview model (fallback)
 */
async function generateImageWithImagen(
  prompt: string,
  options: ImageGenerationOptions
): Promise<GeneratedImage> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다");
  }

  const dimensions = getImageDimensions(options.aspectRatio);

  try {
    // Use nano-banana-pro-preview model for image generation (from CLAUDE.md)
    const model = genAI.getGenerativeModel({
      model: "nano-banana-pro-preview",
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Create an image: ${prompt}. Style: cinematic storyboard frame, professional quality.`,
            },
          ],
        },
      ],
      generationConfig: {
        // @ts-expect-error - Gemini image generation config
        responseModalities: ["image", "text"],
      },
    });

    const response = result.response;
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      throw new Error("Imagen 응답이 없습니다");
    }

    const parts = candidates[0].content?.parts || [];
    const imagePart = parts.find(
      (part) => "inlineData" in part && part.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart || !("inlineData" in imagePart) || !imagePart.inlineData) {
      throw new Error("이미지 데이터가 응답에 포함되어 있지 않습니다");
    }

    const imageData = imagePart.inlineData;
    const buffer = Buffer.from(imageData.data, "base64");

    return {
      buffer,
      mimeType: imageData.mimeType || "image/png",
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    console.error("Imagen generation error:", error);
    throw new Error(
      `이미지 생성 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
    );
  }
}

/**
 * Generate a placeholder image (for development/testing)
 */
export function generatePlaceholderImage(
  options: ImageGenerationOptions = {}
): GeneratedImage {
  const dimensions = getImageDimensions(options.aspectRatio);

  // Create a simple SVG placeholder
  const svg = `
    <svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#374151"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#9CA3AF" text-anchor="middle" dominant-baseline="middle">
        Storyboard Image
      </text>
      <text x="50%" y="58%" font-family="Arial, sans-serif" font-size="14" fill="#6B7280" text-anchor="middle" dominant-baseline="middle">
        ${dimensions.width}x${dimensions.height}
      </text>
    </svg>
  `.trim();

  return {
    buffer: Buffer.from(svg),
    mimeType: "image/svg+xml",
    width: dimensions.width,
    height: dimensions.height,
  };
}
