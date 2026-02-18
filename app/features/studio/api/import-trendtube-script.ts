// =============================================================================
// API Route: POST /api/studio/import-trendtube-script
// =============================================================================
// Imports a TrendTube narration script into Studio as script segments

import type { Route } from "./+types/import-trendtube-script";
import { requireAuth } from "~/lib/auth.server";
import { getProjectById, activateProject } from "~/common/data/project.data.server";
import { getTrendTubeSessionForUser } from "~/common/data/trendtube.data.server";
import { saveScript, getOrCreateActiveSession } from "~/common/data/studio.data.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const userId = await requireAuth(request);
    const body = await request.json();

    const { projectId, trendtubeSessionId } = body as {
      projectId: string;
      trendtubeSessionId: string;
    };

    if (!projectId || !trendtubeSessionId) {
      return Response.json(
        { error: "프로젝트 ID와 TrendTube 세션 ID가 필요합니다." },
        { status: 400 },
      );
    }

    // Verify project ownership
    const project = await getProjectById(projectId, userId);
    if (!project) {
      return Response.json(
        { error: "프로젝트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // Verify TrendTube session ownership
    const ttSession = await getTrendTubeSessionForUser(trendtubeSessionId, userId);
    if (!ttSession) {
      return Response.json(
        { error: "TrendTube 세션을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const narrationScript = ttSession.result?.narrationScript;
    if (!narrationScript) {
      return Response.json(
        { error: "해당 세션에 나레이션 스크립트가 없습니다." },
        { status: 400 },
      );
    }

    // Get or create studio session
    const sessionId = await getOrCreateActiveSession(projectId, userId);

    // Convert narration script to 5 segments
    const segments = buildSegmentsFromNarration(narrationScript);

    // Save to DB with source link
    await saveScript({
      projectId,
      sessionId,
      sourceTrendtubeSessionId: trendtubeSessionId,
      segments,
    });

    // Promote project status: draft → in_progress
    await activateProject(projectId);

    return Response.json({
      success: true,
      segmentCount: segments.length,
      message: "TrendTube 나레이션 스크립트가 임포트되었습니다.",
    });
  } catch (error) {
    console.error("Import trendtube script error:", error);
    return Response.json(
      { error: "스크립트 임포트 실패" },
      { status: 500 },
    );
  }
}

/**
 * Convert a TrendTube narration script into 5 studio script segments.
 * The narration is typically a short (~8s) script, so we use it as the hook
 * and generate placeholder segments for the rest.
 */
function buildSegmentsFromNarration(narrationScript: string) {
  return [
    {
      type: "hook" as const,
      content: narrationScript,
      estimatedDuration: 8,
    },
    {
      type: "intro" as const,
      content: "TrendTube 분석을 기반으로 제작된 영상입니다. 지금부터 핵심 내용을 알려드리겠습니다.",
      estimatedDuration: 5,
    },
    {
      type: "body" as const,
      content: "(본문 내용을 추가해주세요 — AI 생성 또는 직접 작성)",
      estimatedDuration: 20,
    },
    {
      type: "cta" as const,
      content: "이 영상이 도움이 되셨다면 좋아요와 구독 부탁드립니다!",
      estimatedDuration: 5,
    },
    {
      type: "outro" as const,
      content: "시청해주셔서 감사합니다. 다음 영상에서 만나요!",
      estimatedDuration: 3,
    },
  ];
}
