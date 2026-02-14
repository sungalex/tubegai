import { useMemo, useCallback } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/studio-dashboard-page";
import { requireAuth } from "~/lib/auth.server";
import { getProjectById } from "~/common/data/project.data.server";
import { StudioProjectSelector } from "../components/studio-project-selector";
import { TrendTubeInputForm } from "../components/trendtube-input-form";
import { TrendTubePipelineProgress } from "../components/trendtube-pipeline-progress";
import { TrendTubeResultsDisplay } from "../components/trendtube-results-display";
import { useTrendTubePipeline } from "../hooks/use-trendtube-pipeline";
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
  if (!projectId) return { project: null };
  const project = await getProjectById(projectId, userId);
  return { project };
}

// =============================================================================
// Helper: Build userIdea text from project data
// =============================================================================

function buildUserIdeaFromProject(project: NonNullable<Awaited<ReturnType<typeof getProjectById>>>) {
  const lines: string[] = [];

  if (project.title) lines.push(`[제목] ${project.title}`);
  if (project.description) lines.push(`[설명] ${project.description}`);
  if (project.topic) lines.push(`[주제] ${project.topic}`);
  if (project.hooks?.length) lines.push(`[훅] ${project.hooks.join(", ")}`);
  if (project.targetAudience) lines.push(`[타겟] ${project.targetAudience}`);

  // AI Context
  const ctx = project.aiContext;
  if (ctx) {
    if (ctx.keywords?.length) lines.push(`[키워드] ${ctx.keywords.join(", ")}`);
    if (ctx.styleNotes) lines.push(`[스타일] ${ctx.styleNotes}`);
    if (ctx.callToAction) lines.push(`[CTA] ${ctx.callToAction}`);
  }

  // Script Guidelines
  const sg = project.scriptGuidelines;
  if (sg) {
    lines.push("[스크립트 가이드]");
    if (sg.openingStrategy) lines.push(`- 도입: ${sg.openingStrategy}`);
    if (sg.mainPoints?.length) lines.push(`- 핵심: ${sg.mainPoints.join(" / ")}`);
    if (sg.ctaStrategy) lines.push(`- CTA: ${sg.ctaStrategy}`);
    if (sg.closingStrategy) lines.push(`- 마무리: ${sg.closingStrategy}`);
    if (sg.targetLength) lines.push(`- 목표 길이: ${sg.targetLength}`);
    if (sg.keyMessages?.length) lines.push(`- 핵심 메시지: ${sg.keyMessages.join(", ")}`);
    if (sg.avoidTopics?.length) lines.push(`- 피할 주제: ${sg.avoidTopics.join(", ")}`);
  }

  return lines.join("\n");
}

// =============================================================================
// Component
// =============================================================================

type DashboardMode = "input" | "generating" | "results";

const TOTAL_STEPS = 7;

export default function StudioDashboardPage({ loaderData }: Route.ComponentProps) {
  const { projectId } = useParams();
  const project = loaderData.project;

  const {
    phase,
    steps,
    results,
    startPipeline,
    retryFromStep,
    reset,
  } = useTrendTubePipeline();

  // Map phase to mode
  const mode: DashboardMode =
    phase === "idle"
      ? "input"
      : phase === "completed"
        ? "results"
        : "generating";

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
    [projectId, startPipeline]
  );

  // If no project selected, show project selector
  if (!projectId) {
    return <StudioProjectSelector />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Input Mode */}
      {mode === "input" && (
        <TrendTubeInputForm
          onSubmit={handleSubmit}
          isLoading={false}
          initialValues={initialValues}
        />
      )}

      {/* Generating Mode */}
      {mode === "generating" && (
        <div className="space-y-4">
          <TrendTubePipelineProgress
            steps={steps}
            totalSteps={TOTAL_STEPS}
            onRetryStep={phase === "failed" ? retryFromStep : undefined}
          />
          <div className="text-center">
            <button
              onClick={reset}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              취소하고 돌아가기
            </button>
          </div>
        </div>
      )}

      {/* Results Mode */}
      {mode === "results" && results && (
        <TrendTubeResultsDisplay
          results={results}
          onReset={reset}
        />
      )}
    </div>
  );
}
