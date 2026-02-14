// =============================================================================
// API Route: POST /api/studio/trendtube-step-ideas
// =============================================================================
// Step 2: Generate video ideas from extracted trends
// Returns JSON response with video ideas

import type { Route } from "./+types/trendtube-step-ideas";
import { requireAuth } from "~/lib/auth.server";
import {
  getTrendTubeSessionForUser,
  updateSessionStatus,
  saveTrendTubeResult,
} from "~/common/data/trendtube.data.server";
import { generateVideoIdeas } from "~/lib/ai-trendtube.server";
import type { TrendTubeStepSessionInput } from "~/common/types/trendtube.types";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const userId = await requireAuth(request);
    const body = (await request.json()) as TrendTubeStepSessionInput;

    if (!body.sessionId) {
      return Response.json(
        { error: "sessionId가 누락되었습니다." },
        { status: 400 }
      );
    }

    const session = await getTrendTubeSessionForUser(body.sessionId, userId);
    if (!session) {
      return Response.json(
        { error: "세션을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Check prerequisite: extracted trends must exist
    const extractedTrends = session.result?.extractedTrends;
    if (!extractedTrends) {
      return Response.json(
        { error: "이전 단계(트렌드 추출)가 완료되지 않았습니다." },
        { status: 400 }
      );
    }

    await updateSessionStatus(session.id, "generating_ideas", 2);

    // Generate video ideas
    let videoIdeas: string;
    try {
      videoIdeas = await generateVideoIdeas(extractedTrends);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "아이디어 생성에 실패했습니다.";
      await updateSessionStatus(session.id, "failed", 2, errorMessage);
      return Response.json({ error: errorMessage }, { status: 500 });
    }

    // Save result
    await saveTrendTubeResult({ sessionId: session.id, videoIdeas });

    return Response.json({ videoIdeas });
  } catch (error) {
    console.error("TrendTube step-ideas error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "아이디어 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
