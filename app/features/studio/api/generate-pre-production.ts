// =============================================================================
// API Route: POST /api/studio/generate-pre-production
// =============================================================================
// Generates Pre-Production data (hooks, scriptGuidelines, seoKeywords)
// from project context using Gemini AI. Returns JSON (not SSE).

import type { Route } from "./+types/generate-pre-production";
import { requireAuth } from "~/lib/auth.server";
import { getProjectById } from "~/common/data/project.data.server";
import {
  getOrCreateActiveSession,
  savePreProduction,
  updatePreProductionStatus,
} from "~/common/data/studio.data.server";
import { generatePreProduction } from "~/lib/ai/pre-production.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const userId = await requireAuth(request);
    const body = (await request.json()) as { projectId: string; language?: "ko" | "en" };

    if (!body.projectId) {
      return Response.json(
        { error: "projectId가 누락되었습니다." },
        { status: 400 },
      );
    }

    const project = await getProjectById(body.projectId, userId);
    if (!project) {
      return Response.json(
        { error: "프로젝트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // Ensure active session exists
    const sessionId = await getOrCreateActiveSession(body.projectId, userId);

    // Update status to generating
    await updatePreProductionStatus(body.projectId, "generating");

    try {
      const result = await generatePreProduction({
        project,
        language: body.language ?? "ko",
      });

      // Save to studio_script
      await savePreProduction({
        projectId: body.projectId,
        sessionId,
        hooks: result.hooks,
        scriptGuidelines: result.scriptGuidelines,
        seoKeywords: result.seoKeywords,
        preProductionStatus: "completed",
      });

      return Response.json({
        success: true,
        hooks: result.hooks,
        scriptGuidelines: result.scriptGuidelines,
        seoKeywords: result.seoKeywords,
      });
    } catch (err) {
      await updatePreProductionStatus(body.projectId, "failed");
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Pre-Production 생성에 실패했습니다.";
      return Response.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error("Generate Pre-Production error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Pre-Production 생성 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
