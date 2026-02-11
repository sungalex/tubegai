"use client";

import { useState, useCallback, useRef } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { StudioProjectSelector } from "../components/studio-project-selector";
import { TrendTubeInputForm } from "../components/trendtube-input-form";
import { TrendTubePipelineProgress } from "../components/trendtube-pipeline-progress";
import { TrendTubeResultsDisplay } from "../components/trendtube-results-display";
import type {
  TrendTubeVoiceOption,
  TrendTubeResults,
  TrendTubePipelineStep,
  TrendTubeStreamEvent,
} from "~/common/types/trendtube.types";

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

type DashboardMode = "input" | "generating" | "results";

const TOTAL_STEPS = 6;

const INITIAL_STEPS: TrendTubePipelineStep[] = [
  { step: 1, name: "트렌드 추출", status: "pending" },
  { step: 2, name: "영상 아이디어 생성", status: "pending" },
  { step: 3, name: "영상 이미지 생성", status: "pending" },
  { step: 4, name: "나레이션 스크립트 작성", status: "pending" },
  { step: 5, name: "배경 음악 선택", status: "pending" },
  { step: 6, name: "음성 나레이션 생성", status: "pending" },
];

export default function StudioDashboardPage() {
  const { projectId } = useParams();
  const [mode, setMode] = useState<DashboardMode>("input");
  const [steps, setSteps] = useState<TrendTubePipelineStep[]>(INITIAL_STEPS);
  const [results, setResults] = useState<TrendTubeResults | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const updateStep = useCallback(
    (stepNumber: number, updates: Partial<TrendTubePipelineStep>) => {
      setSteps((prev) =>
        prev.map((s) =>
          s.step === stepNumber ? { ...s, ...updates } : s
        )
      );
    },
    []
  );

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

      // Reset state
      setMode("generating");
      setSteps(INITIAL_STEPS);
      setResults(null);

      // Abort previous request if any
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const response = await fetch(
          "/api/studio/trendtube-generate-stream",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              ...data,
            }),
            signal: abortController.signal,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            (errorData as { error?: string })?.error ?? `HTTP ${response.status}`
          );
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("스트림을 읽을 수 없습니다");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process SSE events
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            let event: TrendTubeStreamEvent;
            try {
              event = JSON.parse(jsonStr) as TrendTubeStreamEvent;
            } catch {
              continue;
            }

            switch (event.type) {
              case "step_start":
                updateStep(event.step, {
                  status: "in_progress",
                  name: event.stepName,
                });
                break;

              case "step_progress":
                updateStep(event.step, { data: { preview: event.text } });
                break;

              case "step_complete":
                updateStep(event.step, {
                  status: "completed",
                  name: event.stepName,
                  data: event.data,
                });
                break;

              case "pipeline_complete":
                setResults(event.results);
                setMode("results");
                toast.success("TrendTube 생성 완료!");
                break;

              case "pipeline_error":
                if (event.step > 0) {
                  updateStep(event.step, {
                    status: "failed",
                    error: event.error,
                  });
                }
                toast.error("생성 중 오류가 발생했습니다", {
                  description: event.error,
                });
                break;
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("TrendTube stream error:", error);
        toast.error("TrendTube 생성 실패", {
          description:
            error instanceof Error ? error.message : "알 수 없는 오류",
        });
        // Stay on generating mode so user can see which steps failed
      }
    },
    [projectId, updateStep]
  );

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    setMode("input");
    setSteps(INITIAL_STEPS);
    setResults(null);
  }, []);

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
        />
      )}

      {/* Generating Mode */}
      {mode === "generating" && (
        <div className="space-y-4">
          <TrendTubePipelineProgress
            steps={steps}
            totalSteps={TOTAL_STEPS}
          />
          <div className="text-center">
            <button
              onClick={handleReset}
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
          onReset={handleReset}
        />
      )}
    </div>
  );
}
