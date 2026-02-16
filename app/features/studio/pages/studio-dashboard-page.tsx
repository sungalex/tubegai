import { useMemo, useCallback, useEffect } from "react";
import { useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/studio-dashboard-page";
import { requireAuth } from "~/lib/auth.server";
import { getProjectById } from "~/common/data/project.data.server";
import {
  getTrendTubeSessionForUser,
  getTrendTubeSessions,
  buildResultsFromSession,
} from "~/common/data/trendtube.data.server";
import { StudioProjectSelector } from "../components/studio-project-selector";
import { TrendTubeInputForm } from "../components/trendtube-input-form";
import { TrendTubePipelineProgress } from "../components/trendtube-pipeline-progress";
import { TrendTubeResultsDisplay } from "../components/trendtube-results-display";
import { useTrendTubePipeline } from "../hooks/use-trendtube-pipeline";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/common/components/ui/select";
import { Badge } from "~/common/components/ui/badge";
import type { TrendTubeVoiceOption } from "~/common/types/trendtube.types";

export const meta = () => {
  return [
    { title: "TrendTube Dashboard | TubeGAI" },
    {
      name: "description",
      content:
        "AI가 YouTube 트렌드를 분석하고 영상, 음악, 나레이션을 한번에 생성합니다.",
    },
  ];
};

// =============================================================================
// Loader
// =============================================================================

export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  const { projectId } = params;
  if (!projectId) return { project: null, savedResults: null, sessionHistory: [], activeSessionId: null };

  const project = await getProjectById(projectId, userId);

  // Fetch all sessions for this project
  const allSessions = await getTrendTubeSessions(projectId);
  const sessionHistory = allSessions.map((s) => ({
    id: s.id,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    userIdea: s.userIdea ?? "",
  }));

  // Restore session results from URL search param or auto-load latest
  const url = new URL(request.url);
  let sessionId = url.searchParams.get("session");
  let savedResults = null;
  let activeSessionId: string | null = null;

  // Auto-load latest completed session if no session param
  if (!sessionId) {
    const latestCompleted = allSessions.find((s) => s.status === "completed");
    if (latestCompleted) {
      sessionId = latestCompleted.id;
    }
  }

  if (sessionId) {
    try {
      const session = await getTrendTubeSessionForUser(sessionId, userId);
      if (session && session.status === "completed") {
        savedResults = buildResultsFromSession(session);
        activeSessionId = sessionId;
      }
    } catch {
      // Session may not exist or be accessible
    }
  }

  return { project, savedResults, sessionHistory, activeSessionId };
}

// =============================================================================
// Helper: Build userIdea text from project data
// =============================================================================

function buildUserIdeaFromProject(project: NonNullable<Awaited<ReturnType<typeof getProjectById>>>) {
  const lines: string[] = [];

  if (project.title) lines.push(`[제목] ${project.title}`);
  if (project.description) lines.push(`[설명] ${project.description}`);
  if (project.topic) lines.push(`[주제] ${project.topic}`);
  if (project.targetAudience) lines.push(`[타겟] ${project.targetAudience}`);

  const ctx = project.aiContext;
  if (ctx) {
    if (ctx.keywords?.length) lines.push(`[키워드] ${ctx.keywords.join(", ")}`);
    if (ctx.styleNotes) lines.push(`[스타일] ${ctx.styleNotes}`);
    if (ctx.callToAction) lines.push(`[CTA] ${ctx.callToAction}`);
  }

  return lines.join("\n");
}

// =============================================================================
// Component
// =============================================================================

const TOTAL_STEPS = 7;

export default function StudioDashboardPage({ loaderData }: Route.ComponentProps) {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const project = loaderData.project;
  const savedResults = loaderData.savedResults;
  const sessionHistory = loaderData.sessionHistory ?? [];
  const activeSessionId = loaderData.activeSessionId;

  const {
    phase,
    steps,
    results,
    sessionId,
    startPipeline,
    retryFromStep,
    reset,
    restoreResults,
  } = useTrendTubePipeline();

  // Restore results from DB (via loader) on initial load
  useEffect(() => {
    if (savedResults && phase === "idle" && !results) {
      restoreResults(savedResults);
    }
  }, [savedResults, phase, results, restoreResults]);

  // Sync sessionId to URL when pipeline completes
  useEffect(() => {
    if (phase === "completed" && sessionId) {
      const currentSession = searchParams.get("session");
      if (currentSession !== sessionId) {
        setSearchParams(
          (prev) => {
            prev.set("session", sessionId);
            return prev;
          },
          { replace: true },
        );
      }
    }
  }, [phase, sessionId, searchParams, setSearchParams]);

  // Determine what to show
  const isIdle = phase === "idle" && !results;
  const isRunning =
    phase !== "idle" && phase !== "completed" && phase !== "failed";
  const hasSteps = phase !== "idle" || !!results;
  const showResults =
    (phase === "completed" || (phase === "idle" && !!results)) && !!results;

  // Pre-fill initial values from project data
  const initialValues = useMemo(() => {
    if (!project) return undefined;
    const trendsUrl = project.referenceUrl || undefined;
    const userIdea = buildUserIdeaFromProject(project) || undefined;
    if (!trendsUrl && !userIdea) return undefined;
    return { trendsUrl, userIdea };
  }, [project]);

  const handleSubmit = useCallback(
    async (data: {
      trendsUrl: string;
      userIdea: string;
      referenceImageUrl?: string;
      voiceOption: TrendTubeVoiceOption;
    }) => {
      if (!projectId) {
        toast.error("프로젝트를 선택해주세요");
        return;
      }
      startPipeline({ projectId, ...data });
    },
    [projectId, startPipeline],
  );

  const handleReset = useCallback(() => {
    reset();
    setSearchParams(
      (prev) => {
        prev.delete("session");
        return prev;
      },
      { replace: true },
    );
  }, [reset, setSearchParams]);

  const handleSessionSwitch = useCallback(
    (selectedSessionId: string) => {
      setSearchParams(
        (prev) => {
          prev.set("session", selectedSessionId);
          return prev;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  if (!projectId) {
    return <StudioProjectSelector />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Session History Switcher */}
      {sessionHistory.length > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground shrink-0">세션 이력:</span>
          <Select
            value={activeSessionId ?? undefined}
            onValueChange={handleSessionSwitch}
          >
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="세션 선택..." />
            </SelectTrigger>
            <SelectContent>
              {sessionHistory.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {new Date(s.createdAt).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Badge
                      variant={s.status === "completed" ? "secondary" : "outline"}
                      className="text-[10px] h-4"
                    >
                      {s.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate max-w-40">
                      {s.userIdea.slice(0, 30)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Input Form: only when idle with no results */}
      {isIdle && (
        <TrendTubeInputForm
          onSubmit={handleSubmit}
          isLoading={false}
          initialValues={initialValues}
        />
      )}

      {/* Pipeline Progress: visible during generation AND with results */}
      {hasSteps && (
        <div className="space-y-4">
          <TrendTubePipelineProgress
            steps={steps}
            totalSteps={TOTAL_STEPS}
            onRetryStep={phase === "failed" ? retryFromStep : undefined}
          />
          {isRunning && (
            <div className="text-center">
              <button
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                취소하고 돌아가기
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results: shown when completed or restored */}
      {showResults && (
        <TrendTubeResultsDisplay results={results} onReset={handleReset} />
      )}
    </div>
  );
}
