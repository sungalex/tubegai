import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import type {
  TrendTubeVoiceOption,
  TrendTubeResults,
  TrendTubePipelineStep,
  TrendTubeMediaStreamEvent,
  TrendTubeStepTrendsOutput,
  TrendTubeStepIdeasOutput,
  TrendTubeStepComposeOutput,
} from "~/common/types/trendtube.types";

// =============================================================================
// Types
// =============================================================================

type PipelinePhase =
  | "idle"
  | "step1"
  | "step2"
  | "step3"
  | "step4"
  | "completed"
  | "failed";

interface PipelineInput {
  projectId: string;
  trendsUrl: string;
  userIdea: string;
  referenceImageUrl?: string;
  voiceOption: TrendTubeVoiceOption;
}

const INITIAL_STEPS: TrendTubePipelineStep[] = [
  { step: 1, name: "트렌드 추출", status: "pending" },
  { step: 2, name: "영상 아이디어 생성", status: "pending" },
  { step: 3, name: "영상 생성 (Veo 3)", status: "pending" },
  { step: 4, name: "배경음악 생성 (Lyria 2)", status: "pending" },
  { step: 5, name: "나레이션 스크립트 생성", status: "pending" },
  { step: 6, name: "보이스오버 생성", status: "pending" },
  { step: 7, name: "영상 합성", status: "pending" },
];

// Map media substep to UI step number
const SUBSTEP_TO_STEP: Record<string, number> = {
  video: 3,
  music: 4,
  script: 5,
  voiceover: 6,
};

// Map retry step (1-4) to first failed UI step for retry start
function mapRetryToApiStep(uiStep: number): number {
  if (uiStep <= 1) return 1;
  if (uiStep <= 2) return 2;
  if (uiStep <= 6) return 3;
  return 4;
}

// =============================================================================
// Hook
// =============================================================================

export function useTrendTubePipeline() {
  const [phase, setPhase] = useState<PipelinePhase>("idle");
  const [steps, setSteps] = useState<TrendTubePipelineStep[]>(INITIAL_STEPS);
  const [results, setResults] = useState<TrendTubeResults | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const inputRef = useRef<PipelineInput | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const updateStep = useCallback(
    (stepNumber: number, updates: Partial<TrendTubePipelineStep>) => {
      setSteps((prev) =>
        prev.map((s) => (s.step === stepNumber ? { ...s, ...updates } : s))
      );
    },
    []
  );

  // =========================================================================
  // API Helpers
  // =========================================================================

  async function postJson<T>(
    url: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(
        (data as { error?: string })?.error ?? `HTTP ${res.status}`
      );
    }
    return res.json() as Promise<T>;
  }

  // =========================================================================
  // Step Runners
  // =========================================================================

  const runStep1 = useCallback(
    async (input: PipelineInput, signal: AbortSignal): Promise<string> => {
      setPhase("step1");
      updateStep(1, {
        status: "in_progress",
        input: {
          type: "text",
          label: "YouTube URL + 사용자 아이디어",
          text: `URL: ${input.trendsUrl}\n아이디어: ${input.userIdea}`,
        },
      });

      const data = await postJson<TrendTubeStepTrendsOutput>(
        "/api/studio/trendtube-step-trends",
        input,
        signal
      );

      setSessionId(data.sessionId);
      updateStep(1, {
        status: "completed",
        output: {
          type: "text",
          label: "추출된 트렌드",
          text: data.extractedTrends,
          textPreview: data.extractedTrends.substring(0, 200) + "...",
        },
      });

      return data.sessionId;
    },
    [updateStep]
  );

  const runStep2 = useCallback(
    async (sid: string, signal: AbortSignal): Promise<void> => {
      setPhase("step2");
      updateStep(2, {
        status: "in_progress",
        input: {
          type: "text",
          label: "트렌드 분석",
          textPreview: "이전 단계 결과 사용",
        },
      });

      const data = await postJson<TrendTubeStepIdeasOutput>(
        "/api/studio/trendtube-step-ideas",
        { sessionId: sid },
        signal
      );

      updateStep(2, {
        status: "completed",
        output: {
          type: "text",
          label: "영상 아이디어",
          text: data.videoIdeas,
          textPreview: data.videoIdeas.substring(0, 200) + "...",
        },
      });
    },
    [updateStep]
  );

  const runStep3 = useCallback(
    async (sid: string, signal: AbortSignal): Promise<void> => {
      setPhase("step3");
      // Mark all media steps as in_progress
      updateStep(3, { status: "in_progress" });
      updateStep(4, { status: "in_progress" });
      updateStep(5, { status: "in_progress" });

      const response = await fetch("/api/studio/trendtube-step-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid }),
        signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          (data as { error?: string })?.error ?? `HTTP ${response.status}`
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
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          let event: TrendTubeMediaStreamEvent;
          try {
            event = JSON.parse(jsonStr) as TrendTubeMediaStreamEvent;
          } catch {
            continue;
          }

          switch (event.type) {
            case "media_start": {
              const stepNum = SUBSTEP_TO_STEP[event.substep];
              if (stepNum) {
                updateStep(stepNum, { status: "in_progress" });
              }
              break;
            }
            case "media_complete": {
              const stepNum = SUBSTEP_TO_STEP[event.substep];
              if (stepNum) {
                updateStep(stepNum, {
                  status: "completed",
                  output: event.output,
                });
              }
              break;
            }
            case "media_error": {
              const stepNum = SUBSTEP_TO_STEP[event.substep];
              if (stepNum) {
                updateStep(stepNum, {
                  status: "failed",
                  error: event.error,
                });
              }
              break;
            }
            case "media_all_complete":
              // All sub-steps done
              break;
          }
        }
      }
    },
    [updateStep]
  );

  const runStep4 = useCallback(
    async (sid: string, signal: AbortSignal): Promise<void> => {
      setPhase("step4");
      updateStep(7, {
        status: "in_progress",
        input: {
          type: "mixed",
          label: "합성 소스",
          items: [
            { type: "video", label: "원본 영상" },
            { type: "audio", label: "배경 음악" },
            { type: "audio", label: "보이스오버" },
          ],
        },
      });

      const data = await postJson<TrendTubeStepComposeOutput>(
        "/api/studio/trendtube-step-compose",
        { sessionId: sid },
        signal
      );

      updateStep(7, {
        status: "completed",
        output: data.results.compositedVideoUrl
          ? {
              type: "video",
              label: "합성 완료 영상",
              mediaUrl: data.results.compositedVideoUrl,
              mediaDuration: data.results.compositedDuration,
            }
          : {
              type: "text",
              label: "영상 합성",
              textPreview:
                "필요한 미디어 에셋이 부족하여 합성을 건너뛰었습니다",
            },
      });

      setResults(data.results);
    },
    [updateStep]
  );

  // =========================================================================
  // Orchestration
  // =========================================================================

  const runFromStep = useCallback(
    async (fromApiStep: number, sid: string | null, input: PipelineInput) => {
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;
      const signal = abortController.signal;

      try {
        let currentSid = sid;

        if (fromApiStep <= 1) {
          currentSid = await runStep1(input, signal);
        }

        if (!currentSid) {
          throw new Error("세션 ID가 없습니다.");
        }

        if (fromApiStep <= 2) {
          await runStep2(currentSid, signal);
        }

        if (fromApiStep <= 3) {
          await runStep3(currentSid, signal);
        }

        if (fromApiStep <= 4) {
          await runStep4(currentSid, signal);
        }

        setPhase("completed");
        toast.success("TrendTube 생성 완료!");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("TrendTube pipeline error:", error);
        setPhase("failed");
        toast.error("생성 중 오류가 발생했습니다", {
          description:
            error instanceof Error ? error.message : "알 수 없는 오류",
        });
      }
    },
    [runStep1, runStep2, runStep3, runStep4]
  );

  const startPipeline = useCallback(
    async (input: PipelineInput) => {
      inputRef.current = input;
      setSteps(INITIAL_STEPS);
      setResults(null);
      setSessionId(null);
      await runFromStep(1, null, input);
    },
    [runFromStep]
  );

  const retryFromStep = useCallback(
    async (uiStepNumber: number) => {
      const apiStep = mapRetryToApiStep(uiStepNumber);
      const input = inputRef.current;
      if (!input) {
        toast.error("입력 데이터가 없습니다. 처음부터 다시 시작해주세요.");
        return;
      }

      // Reset failed/pending steps from the retry point
      setSteps((prev) =>
        prev.map((s) => {
          if (s.step >= uiStepNumber) {
            return { ...s, status: "pending", output: undefined, error: undefined };
          }
          return s;
        })
      );
      setResults(null);

      await runFromStep(apiStep, sessionId, input);
    },
    [runFromStep, sessionId]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setPhase("idle");
    setSteps(INITIAL_STEPS);
    setResults(null);
    setSessionId(null);
    inputRef.current = null;
  }, []);

  return {
    phase,
    steps,
    results,
    sessionId,
    startPipeline,
    retryFromStep,
    reset,
  };
}
