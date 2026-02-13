"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Loader2, Circle, AlertCircle, ChevronDown } from "lucide-react";
import { Progress } from "~/common/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/common/components/ui/collapsible";
import { cn } from "~/lib/utils";
import type { TrendTubePipelineStep, TrendTubeStepIO } from "~/common/types/trendtube.types";

interface TrendTubePipelineProgressProps {
  steps: TrendTubePipelineStep[];
  totalSteps: number;
}

const STEP_ICONS = {
  pending: Circle,
  in_progress: Loader2,
  completed: CheckCircle2,
  failed: AlertCircle,
};

export function TrendTubePipelineProgress({
  steps,
  totalSteps,
}: TrendTubePipelineProgressProps) {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);
  const currentStep = steps.find((s) => s.status === "in_progress");
  const hasFailed = steps.some((s) => s.status === "failed");

  // Track open/close state per step
  const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({});

  // Auto-open in_progress and completed steps
  useEffect(() => {
    setOpenSteps((prev) => {
      const next = { ...prev };
      for (const step of steps) {
        if (step.status === "in_progress" && prev[step.step] === undefined) {
          next[step.step] = true;
        }
        if (step.status === "completed" && prev[step.step] === undefined) {
          next[step.step] = true;
        }
        if (step.status === "failed") {
          next[step.step] = true;
        }
      }
      return next;
    });
  }, [steps]);

  const toggleStep = (stepNumber: number) => {
    setOpenSteps((prev) => ({ ...prev, [stepNumber]: !prev[stepNumber] }));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {hasFailed
              ? "생성 실패"
              : completedCount === totalSteps
                ? "생성 완료!"
                : `생성 중... (${completedCount}/${totalSteps} 단계)`}
          </CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            {progressPercent}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => {
          const Icon = STEP_ICONS[step.status];
          const isOpen = openSteps[step.step] ?? false;
          const isPending = step.status === "pending";

          return (
            <Collapsible
              key={step.step}
              open={isOpen && !isPending}
              onOpenChange={() => !isPending && toggleStep(step.step)}
            >
              <div
                className={cn(
                  "rounded-lg border transition-colors",
                  step.status === "in_progress" && "border-primary/30 bg-primary/5",
                  step.status === "completed" && "border-border bg-muted/20",
                  step.status === "failed" && "border-destructive/30 bg-destructive/5",
                  step.status === "pending" && "border-transparent bg-muted/10"
                )}
              >
                <CollapsibleTrigger
                  className={cn(
                    "flex w-full items-center gap-3 p-3 text-left",
                    isPending && "cursor-default opacity-50"
                  )}
                  disabled={isPending}
                >
                  <div className="shrink-0">
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        step.status === "pending" && "text-muted-foreground/40",
                        step.status === "in_progress" && "text-primary animate-spin",
                        step.status === "completed" && "text-green-500",
                        step.status === "failed" && "text-destructive"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        step.status === "pending" && "text-muted-foreground/60",
                        step.status === "in_progress" && "text-foreground",
                        step.status === "completed" && "text-foreground",
                        step.status === "failed" && "text-destructive"
                      )}
                    >
                      Step {step.step}: {step.name}
                    </span>
                    {step.status === "completed" && (
                      <Badge variant="secondary" className="ml-2 text-xs text-green-600">
                        완료
                      </Badge>
                    )}
                  </div>
                  {!isPending && (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  )}
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t px-3 pb-3 pt-2 space-y-3">
                    {/* AI Input */}
                    {step.input && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          AI 입력
                        </p>
                        <StepIODisplay io={step.input} />
                      </div>
                    )}

                    {/* Output / Loading */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        생성 결과
                      </p>
                      {step.status === "in_progress" && !step.output && (
                        <div className="flex items-center gap-2 rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{step.name} 처리 중...</span>
                        </div>
                      )}
                      {step.output && <StepIODisplay io={step.output} />}
                      {step.error && (
                        <p className="text-xs text-destructive bg-destructive/10 rounded-md p-2">
                          {step.error}
                        </p>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}

        {currentStep && (
          <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{currentStep.name} 처리 중...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// StepIO Display Component
// =============================================================================

function StepIODisplay({ io }: { io: TrendTubeStepIO }) {
  switch (io.type) {
    case "text":
      return (
        <div className="rounded-md bg-muted/30 p-2">
          {io.text ? (
            <div className="max-h-40 overflow-y-auto">
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/80">
                {io.text}
              </p>
            </div>
          ) : io.textPreview ? (
            <p className="text-xs text-muted-foreground line-clamp-3">
              {io.textPreview}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{io.label}</p>
          )}
        </div>
      );

    case "video":
      return (
        <div className="rounded-md overflow-hidden bg-muted/30">
          {io.mediaUrl ? (
            <div>
              <video
                controls
                className="w-full aspect-video"
                src={io.mediaUrl}
              >
                브라우저가 비디오를 지원하지 않습니다.
              </video>
              {io.mediaDuration && (
                <div className="px-2 py-1">
                  <Badge variant="outline" className="text-xs">
                    {io.mediaDuration}초
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <p className="p-2 text-xs text-muted-foreground">{io.label}</p>
          )}
        </div>
      );

    case "audio":
      return (
        <div className="rounded-md bg-muted/30 p-2 space-y-1">
          {io.mediaUrl ? (
            <div>
              <audio controls className="w-full" src={io.mediaUrl}>
                브라우저가 오디오를 지원하지 않습니다.
              </audio>
              {io.mediaDuration && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {io.mediaDuration}초
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{io.label}</p>
          )}
        </div>
      );

    case "mixed":
      return (
        <div className="rounded-md bg-muted/30 p-2">
          <div className="flex flex-wrap gap-1.5">
            {io.items?.map((item, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {item.type === "video" ? "🎬" : "🎵"} {item.label}
                {item.mediaUrl ? " ✓" : " -"}
              </Badge>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}
