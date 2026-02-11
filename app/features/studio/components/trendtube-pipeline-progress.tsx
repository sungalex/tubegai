"use client";

import { CheckCircle2, Loader2, Circle, AlertCircle } from "lucide-react";
import { Progress } from "~/common/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { cn } from "~/lib/utils";
import type { TrendTubePipelineStep } from "~/common/types/trendtube.types";

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
      <CardContent className="space-y-3">
        {steps.map((step) => {
          const Icon = STEP_ICONS[step.status];
          const preview =
            step.data && typeof step.data === "object" && "preview" in step.data
              ? (step.data as { preview: string }).preview
              : null;

          return (
            <div
              key={step.step}
              className={cn(
                "flex items-start gap-3 rounded-lg p-3 transition-colors",
                step.status === "in_progress" && "bg-primary/5 border border-primary/20",
                step.status === "completed" && "bg-muted/30",
                step.status === "failed" && "bg-destructive/5 border border-destructive/20"
              )}
            >
              <div className="mt-0.5 shrink-0">
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
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
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
                    <span className="text-xs text-green-500">완료</span>
                  )}
                </div>
                {preview && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {preview}
                  </p>
                )}
                {step.error && (
                  <p className="mt-1 text-xs text-destructive">{step.error}</p>
                )}
              </div>
            </div>
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
