// =============================================================================
// API Route: POST /api/studio/trendtube-session-status
// =============================================================================
// Returns current session progress for resume/retry decisions

import type { Route } from "./+types/trendtube-session-status";
import { requireAuth } from "~/lib/auth.server";
import {
  getTrendTubeSessionForUser,
  deriveSessionProgress,
} from "~/common/data/trendtube.data.server";
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

    const { completedSteps, nextStep } = deriveSessionProgress(session);

    return Response.json({
      sessionId: session.id,
      status: session.status,
      currentStep: session.currentStep,
      completedSteps,
      nextStep,
    });
  } catch (error) {
    console.error("TrendTube session-status error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "세션 상태 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
