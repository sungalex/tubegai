// =============================================================================
// API Route: POST /api/studio/trendtube-step-trends
// =============================================================================
// Step 1: Create session + extract YouTube trends
// Returns JSON response with sessionId and extracted trends

import type { Route } from "./+types/trendtube-step-trends";
import { requireAuth } from "~/lib/auth.server";
import { getProjectById } from "~/common/data/project.data.server";
import {
  createTrendTubeSession,
  updateSessionStatus,
  saveTrendTubeResult,
} from "~/common/data/trendtube.data.server";
import { extractYouTubeTrends } from "~/lib/ai/trendtube.server";
import type {
  TrendTubeStepTrendsInput,
  TrendTubeVoiceOption,
} from "~/common/types/trendtube.types";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const userId = await requireAuth(request);
    const body = (await request.json()) as TrendTubeStepTrendsInput;

    const { projectId, trendsUrl, userIdea, referenceImageUrl, voiceOption } =
      body;

    if (!projectId || !trendsUrl || !userIdea) {
      return Response.json(
        { error: "필수 입력값이 누락되었습니다." },
        { status: 400 }
      );
    }

    const project = await getProjectById(projectId, userId);
    if (!project) {
      return Response.json(
        { error: "프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Create session
    const session = await createTrendTubeSession({
      projectId,
      userId,
      trendsUrl,
      userIdea,
      referenceImageUrl,
      voiceOption: voiceOption as TrendTubeVoiceOption,
    });

    await updateSessionStatus(session.id, "extracting", 1);

    // Extract trends (reuse trendSnapshot if available)
    let extractedTrends: string;
    let reusedSnapshot = false;

    if (project.trendSnapshot) {
      // Build extractedTrends from existing trendSnapshot — skip AI call
      const snap = project.trendSnapshot;
      const lines: string[] = [];
      lines.push(`## 트렌드 분석 (프로젝트 스냅샷)`);
      lines.push(`- 제목: ${snap.title}`);
      if (snap.description) lines.push(`- 설명: ${snap.description}`);
      lines.push(`- 카테고리: ${snap.category}`);
      lines.push(`- 성장률: ${snap.growthRate}`);
      lines.push(`- 조회수: ${snap.viewsCount}`);
      if (snap.tags.length > 0) lines.push(`- 태그: ${snap.tags.join(", ")}`);
      if (snap.metrics) {
        lines.push(`- 상세 메트릭: 조회수 ${snap.metrics.viewCount}, 좋아요 ${snap.metrics.likeCount}, 댓글 ${snap.metrics.commentCount}`);
      }
      if (snap.externalUrl) lines.push(`- 참조 URL: ${snap.externalUrl}`);
      extractedTrends = lines.join("\n");
      reusedSnapshot = true;
      console.log(`[TrendTube] Reusing trendSnapshot for project ${projectId}`);
    } else {
      try {
        extractedTrends = await extractYouTubeTrends(trendsUrl, userIdea);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "트렌드 추출에 실패했습니다.";
        await updateSessionStatus(session.id, "failed", 1, errorMessage);
        return Response.json({ error: errorMessage }, { status: 500 });
      }
    }

    // Save result
    await saveTrendTubeResult({ sessionId: session.id, extractedTrends });

    return Response.json({
      sessionId: session.id,
      extractedTrends,
      reusedSnapshot,
    });
  } catch (error) {
    console.error("TrendTube step-trends error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "트렌드 추출 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
