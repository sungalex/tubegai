// =============================================================================
// API Route: POST /api/studio/generate-scene-image
// =============================================================================
// Generates an image for a storyboard scene using AI and uploads to Supabase

import type { Route } from "./+types/generate-scene-image";
import { requireAuth } from "~/lib/auth.server";
import { generateImage, generatePlaceholderImage } from "~/lib/ai-imagen.server";
import { uploadStoryboardImage } from "~/lib/supabase-storage.server";
import {
  createMediaAsset,
  linkImageToStoryboard,
} from "~/common/data/media.data.server";
import { getProjectById } from "~/common/data/project.data.server";
import { db, schema } from "~/lib/db.server";
import { eq } from "drizzle-orm";

interface GenerateSceneImageRequest {
  sceneId: string;
  visualPrompt?: string;
  options?: {
    aspectRatio?: string;
    style?: string;
    negativePrompt?: string;
  };
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userId = await requireAuth(request);
    const body = (await request.json()) as GenerateSceneImageRequest;
    const { sceneId, visualPrompt, options = {} } = body;

    if (!sceneId) {
      return Response.json(
        { error: "씬 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 1. Get scene data
    const scene = await db.query.storyboards.findFirst({
      where: eq(schema.storyboards.id, sceneId),
    });

    if (!scene) {
      return Response.json(
        { error: "씬을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 2. Verify project ownership
    const project = await getProjectById(scene.projectId, userId);
    if (!project) {
      return Response.json(
        { error: "프로젝트에 접근할 수 없습니다" },
        { status: 403 }
      );
    }

    // 3. Get the prompt to use
    const promptToUse = visualPrompt || scene.visualPrompt;
    if (!promptToUse) {
      return Response.json(
        { error: "비주얼 프롬프트가 필요합니다" },
        { status: 400 }
      );
    }

    // 4. Generate image
    let generatedImage;
    try {
      generatedImage = await generateImage(promptToUse, {
        aspectRatio: (options.aspectRatio as "16:9" | "9:16" | "1:1" | "4:3" | "3:4") || "16:9",
        style: options.style,
        negativePrompt: options.negativePrompt,
      });
    } catch (error) {
      console.error("Image generation failed, using placeholder:", error);
      // Use placeholder if AI generation fails
      generatedImage = generatePlaceholderImage({
        aspectRatio: (options.aspectRatio as "16:9" | "9:16" | "1:1" | "4:3" | "3:4") || "16:9",
      });
    }

    // 5. Upload to Supabase Storage
    const { storageKey, publicUrl } = await uploadStoryboardImage(
      scene.projectId,
      sceneId,
      generatedImage.buffer,
      generatedImage.mimeType
    );

    // 6. Create media asset record
    const assetId = await createMediaAsset({
      userId,
      projectId: scene.projectId,
      type: "image",
      storageKey,
      publicUrl,
      fileSize: generatedImage.buffer.length,
      mimeType: generatedImage.mimeType,
      width: generatedImage.width,
      height: generatedImage.height,
    });

    // 7. Link image to storyboard
    await linkImageToStoryboard(sceneId, assetId);

    return Response.json({
      success: true,
      imageUrl: publicUrl,
      assetId,
      width: generatedImage.width,
      height: generatedImage.height,
    });
  } catch (error) {
    console.error("Scene image generation error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "이미지 생성 중 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}
