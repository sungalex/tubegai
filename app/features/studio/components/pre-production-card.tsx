// =============================================================================
// Pre-Production Card Component
// =============================================================================
// Displays and manages Pre-Production data (hooks, scriptGuidelines, seoKeywords)
// within the Studio Script page sidebar.

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  Search,
  MessageSquare,
} from "lucide-react";
import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/common/components/ui/collapsible";
import { toast } from "sonner";
import type { ScriptGuidelines } from "~/common/types/trend.types";

// =============================================================================
// Types
// =============================================================================

export interface PreProductionData {
  hooks: string[] | null;
  scriptGuidelines: ScriptGuidelines | null;
  seoKeywords: string[] | null;
  preProductionStatus: string | null;
}

interface PreProductionCardProps {
  projectId: string;
  data: PreProductionData | null;
}

// =============================================================================
// Component
// =============================================================================

export function PreProductionCard({ projectId, data }: PreProductionCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [localData, setLocalData] = useState<PreProductionData | null>(data);

  const status = localData?.preProductionStatus ?? "pending";
  const hasData = status === "completed" && localData?.hooks && localData.hooks.length > 0;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/studio/generate-pre-production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? "Pre-Production 생성 실패");
        return;
      }

      setLocalData({
        hooks: result.hooks,
        scriptGuidelines: result.scriptGuidelines,
        seoKeywords: result.seoKeywords,
        preProductionStatus: "completed",
      });
      toast.success("Pre-Production 가이드가 생성되었습니다!");
    } catch {
      toast.error("Pre-Production 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Pending / Not Generated State
  if (!hasData) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            프리 프로덕션
          </CardTitle>
          <CardDescription className="text-xs">
            AI가 오프닝 훅, 스크립트 가이드라인, SEO 키워드를 생성합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? "생성 중..." : "프리 프로덕션 생성"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Completed State — show results
  const guidelines = localData!.scriptGuidelines!;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            프리 프로덕션
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hooks Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">오프닝 훅</span>
          </div>
          <div className="space-y-1.5">
            {localData!.hooks!.map((hook, i) => (
              <div
                key={i}
                className="text-xs bg-muted px-2.5 py-1.5 rounded leading-relaxed"
              >
                &ldquo;{hook}&rdquo;
              </div>
            ))}
          </div>
        </div>

        {/* Script Guidelines Section */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">스크립트 가이드라인</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            <GuidelineItem label="도입부 전략" value={guidelines.openingStrategy} />
            <GuidelineItem label="CTA 전략" value={guidelines.ctaStrategy} />
            <GuidelineItem label="마무리 전략" value={guidelines.closingStrategy} />
            {guidelines.mainPoints.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground">핵심 포인트</span>
                <ul className="space-y-0.5">
                  {guidelines.mainPoints.map((point, i) => (
                    <li key={i} className="text-xs text-muted-foreground pl-3 relative before:content-['•'] before:absolute before:left-0">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {guidelines.targetLength && (
              <GuidelineItem label="목표 길이" value={guidelines.targetLength} />
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* SEO Keywords Section */}
        {localData!.seoKeywords && localData!.seoKeywords.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">SEO 키워드</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {localData!.seoKeywords.map((keyword, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function GuidelineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <p className="text-xs leading-relaxed">{value}</p>
    </div>
  );
}
