// =============================================================================
// AI Project Generator Dialog
// =============================================================================
// 3-Step Verification Workflow:
// Step 1: Review prompt that will be sent to AI
// Step 2: Execute AI generation and review results
// Step 3: Edit results and create project

import { useState, useEffect, useRef } from "react";
import { useFetcher, useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/common/components/ui/dialog";
import { Button } from "~/common/components/ui/button";
import { Textarea } from "~/common/components/ui/textarea";
import { Input } from "~/common/components/ui/input";
import { Label } from "~/common/components/ui/label";
import { Badge } from "~/common/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/common/components/ui/select";
import { ScrollArea } from "~/common/components/ui/scroll-area";
import { Separator } from "~/common/components/ui/separator";
import {
  Sparkles,
  Eye,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  RefreshCw,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { toast } from "sonner";
import type { TrendItem, Channel } from "~/common/types/project.types";
import type {
  GenerateProjectContextLoaderData,
  GenerateProjectContextActionData,
} from "../api/generate-project-context";

// =============================================================================
// Types
// =============================================================================

interface AIProjectGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trend: TrendItem | null;
  channels?: Channel[];
  onProjectCreated?: (projectId: string) => void;
}

type Step = "options" | "prompt" | "result";

interface GenerationOptions {
  language: "ko" | "en";
  preferredTone?: string;
  videoLength?: string;
  targetAudienceHint?: string;
  customInstructions?: string;
}

// =============================================================================
// Component
// =============================================================================

export function AIProjectGeneratorDialog({
  open,
  onOpenChange,
  trend,
  channels = [],
  onProjectCreated,
}: AIProjectGeneratorDialogProps) {
  const navigate = useNavigate();
  const promptFetcher = useFetcher<GenerateProjectContextLoaderData>();
  const generateFetcher = useFetcher<GenerateProjectContextActionData>();
  const projectFetcher = useFetcher();

  // State
  const [step, setStep] = useState<Step>("options");
  const [options, setOptions] = useState<GenerationOptions>({
    language: "ko",
  });
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [generatedResult, setGeneratedResult] = useState<GenerateProjectContextActionData | null>(null);
  const [editedResult, setEditedResult] = useState<{
    title: string;
    description: string;
    targetAudience: string;
    openingStrategy: string;
    mainPoints: string;
    ctaStrategy: string;
    keywords: string;
  } | null>(null);

  // Refs to track processed responses (prevent duplicate processing on re-renders)
  const processedPromptRef = useRef<string | null>(null);
  const processedGenerationRef = useRef<string | null>(null);
  const processedProjectRef = useRef<string | null>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("options");
      setOptions({ language: "ko" });
      setSelectedChannelId("");
      setPrompt("");
      setGeneratedResult(null);
      setEditedResult(null);
      // Reset processed refs
      processedPromptRef.current = null;
      processedGenerationRef.current = null;
      processedProjectRef.current = null;
    }
  }, [open]);

  // Handle prompt preview response
  useEffect(() => {
    if (promptFetcher.data && "success" in promptFetcher.data && promptFetcher.data.success) {
      const promptKey = promptFetcher.data.prompt;
      if (processedPromptRef.current !== promptKey) {
        processedPromptRef.current = promptKey;
        setPrompt(promptFetcher.data.prompt);
        setStep("prompt");
      }
    } else if (promptFetcher.data && "error" in promptFetcher.data) {
      toast.error("프롬프트 생성 실패", { description: promptFetcher.data.error });
    }
  }, [promptFetcher.data]);

  // Handle generation response
  useEffect(() => {
    if (generateFetcher.data && "success" in generateFetcher.data && generateFetcher.data.success) {
      const result = generateFetcher.data.result;
      const generationKey = result.title + result.description;
      if (processedGenerationRef.current !== generationKey) {
        processedGenerationRef.current = generationKey;
        setGeneratedResult(generateFetcher.data);
        // Initialize edited result
        setEditedResult({
          title: result.title,
          description: result.description,
          targetAudience: result.targetAudience,
          openingStrategy: result.scriptGuidelines.openingStrategy,
          mainPoints: result.scriptGuidelines.mainPoints.join("\n"),
          ctaStrategy: result.scriptGuidelines.ctaStrategy,
          keywords: result.keywords.join(", "),
        });
        setStep("result");
      }
    } else if (generateFetcher.data && "error" in generateFetcher.data) {
      const errorKey = generateFetcher.data.error;
      if (processedGenerationRef.current !== errorKey) {
        processedGenerationRef.current = errorKey;
        toast.error("AI 생성 실패", { description: generateFetcher.data.error });
      }
    }
  }, [generateFetcher.data]);

  // Handle project creation response
  useEffect(() => {
    console.log("[AI Dialog] projectFetcher state:", projectFetcher.state);
    console.log("[AI Dialog] projectFetcher data:", projectFetcher.data);

    if (projectFetcher.data && typeof projectFetcher.data === "object") {
      if ("id" in projectFetcher.data) {
        const projectId = projectFetcher.data.id as string;
        if (processedProjectRef.current !== projectId) {
          processedProjectRef.current = projectId;
          console.log("[AI Dialog] Project created with ID:", projectId);
          toast.success("프로젝트가 생성되었습니다!");
          onOpenChange(false);
          if (onProjectCreated) {
            onProjectCreated(projectId);
          } else {
            navigate(`/projects/${projectId}`);
          }
        }
      } else if ("error" in projectFetcher.data) {
        const errorMsg = (projectFetcher.data as { error: string }).error;
        console.error("[AI Dialog] Project creation error:", errorMsg);
        toast.error("프로젝트 생성 실패", { description: errorMsg });
      }
    }
  }, [projectFetcher.data, projectFetcher.state, navigate, onOpenChange, onProjectCreated]);

  // Handlers
  const handlePreviewPrompt = () => {
    if (!trend) return;

    const params = new URLSearchParams();
    params.set("trend", JSON.stringify({
      title: trend.title,
      category: trend.category,
      tags: trend.tags,
      views: trend.views,
      growthRate: trend.growth,
      externalUrl: trend.videoUrl,
    }));
    params.set("options", JSON.stringify(options));

    promptFetcher.load(`/api/generate-project-context?${params.toString()}`);
  };

  const handleGenerate = () => {
    if (!trend) return;

    generateFetcher.submit(
      JSON.stringify({
        trend: {
          title: trend.title,
          category: trend.category,
          tags: trend.tags,
          views: trend.views,
          growthRate: trend.growth,
          externalUrl: trend.videoUrl,
        },
        options,
      }),
      {
        method: "POST",
        action: "/api/generate-project-context",
        encType: "application/json",
      }
    );
  };

  const handleCreateProject = () => {
    console.log("[AI Dialog] handleCreateProject called");
    console.log("[AI Dialog] generatedResult:", generatedResult);
    console.log("[AI Dialog] editedResult:", editedResult);
    console.log("[AI Dialog] trend:", trend);

    if (!generatedResult || !("success" in generatedResult) || !editedResult || !trend) {
      console.log("[AI Dialog] Early return - missing data");
      return;
    }

    const result = generatedResult.result;
    console.log("[AI Dialog] Creating project with result:", result);

    // Valid contentTone values (must match database enum)
    const validContentTones = ["informative", "funny", "dramatic", "casual", "professional"];
    const suggestedTone = result.suggestedTone?.toLowerCase() || "informative";
    const contentTone = validContentTones.includes(suggestedTone) ? suggestedTone : "informative";

    // Valid difficulty values
    const validDifficulties = ["easy", "medium", "hard"];
    const suggestedDifficulty = result.suggestedDifficulty?.toLowerCase() || "medium";
    const difficulty = validDifficulties.includes(suggestedDifficulty) ? suggestedDifficulty : "medium";

    // Build scriptGuidelines as proper object
    const scriptGuidelines = {
      openingStrategy: editedResult.openingStrategy,
      mainPoints: editedResult.mainPoints.split("\n").filter(Boolean),
      ctaStrategy: editedResult.ctaStrategy,
      closingStrategy: result.scriptGuidelines.closingStrategy || "",
    };

    // Create project with AI-generated context using FormData
    const formData = new FormData();
    formData.set("_returnJson", "true"); // Signal to return JSON instead of redirect
    formData.set("title", editedResult.title);
    formData.set("description", editedResult.description);
    formData.set("type", "long");
    formData.set("visibility", "private");
    formData.set("topic", trend.title);
    formData.set("basedOnTrend", trend.title);
    // Send trend UUID for database relation if available
    if (trend.trendUuid) {
      formData.set("basedOnTrendUuid", trend.trendUuid);
    }
    formData.set("hooks", JSON.stringify(result.hooks));
    formData.set("targetAudience", editedResult.targetAudience);
    formData.set("contentTone", contentTone);
    formData.set("difficulty", difficulty);
    formData.set("keywords", editedResult.keywords);
    formData.set("estimatedViews", result.estimatedViews || "");
    formData.set("scriptGuidelines", JSON.stringify(scriptGuidelines));
    formData.set("labels", "[]");
    // Add channel if selected
    if (selectedChannelId) {
      formData.set("channelId", selectedChannelId);
    }
    // Use trend thumbnail as project thumbnail
    if (trend.thumbnail) {
      formData.set("thumbnailUrl", trend.thumbnail);
    }

    console.log("[AI Dialog] Submitting project creation to /projects/new");
    projectFetcher.submit(formData, {
      method: "POST",
      action: "/projects/new",
    });
    console.log("[AI Dialog] projectFetcher.submit called");
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    toast.success("프롬프트가 클립보드에 복사되었습니다.");
  };

  const isLoading =
    promptFetcher.state === "loading" ||
    generateFetcher.state === "submitting" ||
    projectFetcher.state === "submitting";

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI 프로젝트 생성
          </DialogTitle>
          <DialogDescription>
            트렌드 정보를 기반으로 AI가 프로젝트 컨텍스트를 생성합니다.
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          <StepIndicator
            step={1}
            label="옵션"
            active={step === "options"}
            completed={step !== "options"}
          />
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <StepIndicator
            step={2}
            label="프롬프트"
            active={step === "prompt"}
            completed={step === "result"}
          />
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <StepIndicator
            step={3}
            label="결과"
            active={step === "result"}
            completed={false}
          />
        </div>

        <Separator />

        {/* Trend info summary */}
        {trend && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            {trend.thumbnail && (
              <img
                src={trend.thumbnail}
                alt={trend.title}
                className="w-20 h-12 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{trend.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {trend.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {trend.views} 조회
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step content */}
        <ScrollArea className="flex-1 pr-4">
          {step === "options" && (
            <OptionsStep
              options={options}
              onOptionsChange={setOptions}
              channels={channels}
              selectedChannelId={selectedChannelId}
              onChannelChange={setSelectedChannelId}
            />
          )}

          {step === "prompt" && (
            <PromptStep
              prompt={prompt}
              onCopy={handleCopyPrompt}
            />
          )}

          {step === "result" && editedResult && (
            <ResultStep
              editedResult={editedResult}
              onEditedResultChange={setEditedResult}
            />
          )}
        </ScrollArea>

        <DialogFooter className="shrink-0 gap-2">
          {step === "options" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button onClick={handlePreviewPrompt} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                프롬프트 미리보기
              </Button>
            </>
          )}

          {step === "prompt" && (
            <>
              <Button variant="outline" onClick={() => {
                processedPromptRef.current = null;
                setStep("options");
              }}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                뒤로
              </Button>
              <Button onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                AI 생성 실행
              </Button>
            </>
          )}

          {step === "result" && (
            <>
              <Button variant="outline" onClick={() => {
                processedGenerationRef.current = null;
                setStep("prompt");
              }}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                뒤로
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                다시 생성
              </Button>
              <Button onClick={handleCreateProject} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                프로젝트 생성
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function StepIndicator({
  step,
  label,
  active,
  completed,
}: {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
          active && "bg-primary text-primary-foreground",
          completed && "bg-green-500 text-white",
          !active && !completed && "bg-muted text-muted-foreground"
        )}
      >
        {completed ? <CheckCircle2 className="h-4 w-4" /> : step}
      </div>
      <span
        className={cn(
          "text-sm",
          active && "font-medium",
          !active && "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}

function OptionsStep({
  options,
  onOptionsChange,
  channels,
  selectedChannelId,
  onChannelChange,
}: {
  options: GenerationOptions;
  onOptionsChange: (options: GenerationOptions) => void;
  channels: Channel[];
  selectedChannelId: string;
  onChannelChange: (channelId: string) => void;
}) {
  return (
    <div className="space-y-4 py-4">
      {/* Channel selector */}
      <div className="space-y-2">
        <Label>채널 (선택)</Label>
        {channels.length > 0 ? (
          <Select
            value={selectedChannelId || "none"}
            onValueChange={(v) => onChannelChange(v === "none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="채널 선택 (선택사항)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">채널 미지정</SelectItem>
              {channels.map((channel) => (
                <SelectItem key={channel.id} value={channel.id}>
                  {channel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            연결된 채널이 없습니다. 프로젝트 &gt; 채널 관리에서 채널을 추가하세요.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>출력 언어</Label>
        <Select
          value={options.language}
          onValueChange={(v) => onOptionsChange({ ...options, language: v as "ko" | "en" })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ko">한국어</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>선호하는 톤 (선택)</Label>
        <Select
          value={options.preferredTone ?? "auto"}
          onValueChange={(v) => onOptionsChange({ ...options, preferredTone: v === "auto" ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="자동 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">자동 선택</SelectItem>
            <SelectItem value="educational">교육적</SelectItem>
            <SelectItem value="entertaining">재미있는</SelectItem>
            <SelectItem value="professional">전문적</SelectItem>
            <SelectItem value="casual">친근한</SelectItem>
            <SelectItem value="inspirational">영감을 주는</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>영상 길이 (선택)</Label>
        <Select
          value={options.videoLength ?? "auto"}
          onValueChange={(v) => onOptionsChange({ ...options, videoLength: v === "auto" ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="자동 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">자동 선택</SelectItem>
            <SelectItem value="short">짧은 영상 (1-5분)</SelectItem>
            <SelectItem value="medium">중간 영상 (5-15분)</SelectItem>
            <SelectItem value="long">긴 영상 (15분+)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>타겟 시청자 힌트 (선택)</Label>
        <Input
          placeholder="예: 20-30대 직장인"
          value={options.targetAudienceHint ?? ""}
          onChange={(e) =>
            onOptionsChange({ ...options, targetAudienceHint: e.target.value || undefined })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>추가 지시사항 (선택)</Label>
        <Textarea
          placeholder="AI에게 추가로 전달할 지시사항을 입력하세요."
          value={options.customInstructions ?? ""}
          onChange={(e) =>
            onOptionsChange({ ...options, customInstructions: e.target.value || undefined })
          }
          rows={3}
        />
      </div>
    </div>
  );
}

function PromptStep({
  prompt,
  onCopy,
}: {
  prompt: string;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <Label>AI에게 전송될 프롬프트</Label>
        <Button variant="ghost" size="sm" onClick={onCopy}>
          <Copy className="h-4 w-4 mr-1" />
          복사
        </Button>
      </div>
      <div className="rounded-lg border bg-muted/30 p-4">
        <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground">
          {prompt}
        </pre>
      </div>
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-600 dark:text-blue-400">
          위 프롬프트가 AI에게 전송됩니다. "AI 생성 실행" 버튼을 클릭하면 Gemini API를 호출합니다.
        </p>
      </div>
    </div>
  );
}

function ResultStep({
  editedResult,
  onEditedResultChange,
}: {
  editedResult: {
    title: string;
    description: string;
    targetAudience: string;
    openingStrategy: string;
    mainPoints: string;
    ctaStrategy: string;
    keywords: string;
  };
  onEditedResultChange: (result: typeof editedResult) => void;
}) {
  return (
    <div className="space-y-4 py-4">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="basic" className="flex-1">기본 정보</TabsTrigger>
          <TabsTrigger value="script" className="flex-1">스크립트 가이드</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>프로젝트 제목</Label>
            <Input
              value={editedResult.title}
              onChange={(e) =>
                onEditedResultChange({ ...editedResult, title: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>설명</Label>
            <Textarea
              value={editedResult.description}
              onChange={(e) =>
                onEditedResultChange({ ...editedResult, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>타겟 시청자</Label>
            <Input
              value={editedResult.targetAudience}
              onChange={(e) =>
                onEditedResultChange({ ...editedResult, targetAudience: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>키워드 (쉼표로 구분)</Label>
            <Input
              value={editedResult.keywords}
              onChange={(e) =>
                onEditedResultChange({ ...editedResult, keywords: e.target.value })
              }
              placeholder="키워드1, 키워드2, 키워드3"
            />
          </div>
        </TabsContent>

        <TabsContent value="script" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>오프닝 전략</Label>
            <Textarea
              value={editedResult.openingStrategy}
              onChange={(e) =>
                onEditedResultChange({ ...editedResult, openingStrategy: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>핵심 포인트 (줄바꿈으로 구분)</Label>
            <Textarea
              value={editedResult.mainPoints}
              onChange={(e) =>
                onEditedResultChange({ ...editedResult, mainPoints: e.target.value })
              }
              rows={4}
              placeholder="첫 번째 포인트&#10;두 번째 포인트&#10;세 번째 포인트"
            />
          </div>

          <div className="space-y-2">
            <Label>CTA 전략</Label>
            <Textarea
              value={editedResult.ctaStrategy}
              onChange={(e) =>
                onEditedResultChange({ ...editedResult, ctaStrategy: e.target.value })
              }
              rows={2}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
        <p className="text-sm text-green-600 dark:text-green-400">
          AI가 생성한 결과를 검토하고 수정한 후, "프로젝트 생성" 버튼을 클릭하세요.
        </p>
      </div>
    </div>
  );
}
