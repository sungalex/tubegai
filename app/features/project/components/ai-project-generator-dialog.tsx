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
import {
  YOUTUBE_CATEGORY_VALUES_KO,
  DEFAULT_YOUTUBE_CATEGORY_KO,
} from "~/common/types/trend.types";

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
  videoType?: "short" | "long";
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
    contentTone: string;
    category: string;
    difficulty: string;
    videoLength: string;
    estimatedViews: string;
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
        // Initialize edited result — use user's explicit choice or AI suggestion
        const aiTone = result.suggestedTone || "informative";
        const validDiffs = ["easy", "medium", "hard"];
        const aiDiff = validDiffs.includes(result.suggestedDifficulty?.toLowerCase()) ? result.suggestedDifficulty.toLowerCase() : "medium";
        const validLengths = ["short", "medium", "long"];
        const aiLength = validLengths.includes(result.suggestedVideoLength) ? result.suggestedVideoLength : "medium";

        setEditedResult({
          title: result.title,
          description: result.description,
          targetAudience: result.targetAudience,
          contentTone: options.preferredTone || aiTone,
          category: result.suggestedCategory || trend?.category || DEFAULT_YOUTUBE_CATEGORY_KO,
          difficulty: aiDiff,
          videoLength: options.videoLength || aiLength,
          estimatedViews: result.estimatedViews || "10K-50K",
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
      description: trend.description,
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
          description: trend.description,
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

    console.log("[AI Dialog] Creating project with editedResult:", editedResult);

    // Derive project type from edited video length
    const projectType = editedResult.videoLength === "short" ? "short" : "long";

    // Create project with AI-generated context using FormData
    // Note: hooks, scriptGuidelines, keywords are now generated in Studio Pre-Production
    const formData = new FormData();
    formData.set("_returnJson", "true"); // Signal to return JSON instead of redirect
    formData.set("title", editedResult.title);
    formData.set("description", editedResult.description);
    formData.set("type", projectType);
    formData.set("videoLength", editedResult.videoLength);
    formData.set("visibility", "private");
    formData.set("topic", trend.title);
    formData.set("basedOnTrend", trend.title);
    // Send trend UUID for database relation if available
    if (trend.trendUuid) {
      formData.set("basedOnTrendUuid", trend.trendUuid);
    }
    formData.set("targetAudience", editedResult.targetAudience);
    formData.set("contentTone", editedResult.contentTone);
    formData.set("difficulty", editedResult.difficulty);
    formData.set("estimatedViews", editedResult.estimatedViews);
    formData.set("category", editedResult.category);
    formData.set("labels", "[]");
    // Add channel if selected
    if (selectedChannelId) {
      formData.set("channelId", selectedChannelId);
    }
    // Use trend thumbnail as project thumbnail
    if (trend.thumbnail) {
      formData.set("thumbnailUrl", trend.thumbnail);
    }
    // Reference URL (YouTube video URL)
    if (trend.videoUrl) {
      formData.set("referenceUrl", trend.videoUrl);
    }
    // Trend snapshot from AI generation response
    if (generatedResult.trendSnapshot) {
      formData.set("trendSnapshot", JSON.stringify(generatedResult.trendSnapshot));
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
      <DialogContent className="max-w-2xl max-h-dvh sm:max-h-[85vh] flex flex-col overflow-hidden">
        {/* Compact header with inline step indicator */}
        <DialogHeader className="shrink-0 pb-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI 프로젝트 생성
          </DialogTitle>
          <DialogDescription className="sr-only">
            트렌드 정보를 기반으로 AI가 프로젝트 컨텍스트를 생성합니다.
          </DialogDescription>
        </DialogHeader>

        {/* Compact progress + trend info in one row */}
        <div className="shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <StepIndicator
              step={1}
              label="옵션"
              active={step === "options"}
              completed={step !== "options"}
            />
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <StepIndicator
              step={2}
              label="프롬프트"
              active={step === "prompt"}
              completed={step === "result"}
            />
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <StepIndicator
              step={3}
              label="결과"
              active={step === "result"}
              completed={false}
            />
          </div>

          {trend && (
            <div className="flex items-center gap-2 min-w-0">
              {trend.thumbnail && (
                <img
                  src={trend.thumbnail}
                  alt={trend.title}
                  className="w-14 h-8 object-cover rounded shrink-0"
                />
              )}
              <div className="min-w-0 hidden sm:block">
                <p className="text-xs font-medium truncate max-w-48">{trend.title}</p>
                <span className="text-xs text-muted-foreground">{trend.views} 조회</span>
              </div>
            </div>
          )}
        </div>

        <Separator className="shrink-0" />

        {/* Scrollable step content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="pr-4">
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
          </div>
        </ScrollArea>

        {/* Fixed footer */}
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
    <div className="flex items-center gap-1">
      <div
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium",
          active && "bg-primary text-primary-foreground",
          completed && "bg-green-500 text-white",
          !active && !completed && "bg-muted text-muted-foreground"
        )}
      >
        {completed ? <CheckCircle2 className="h-3 w-3" /> : step}
      </div>
      <span
        className={cn(
          "text-xs",
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
      {/* Row 1: 영상 타입 + 영상 길이 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>영상 타입</Label>
          <Select
            value={options.videoType ?? "long"}
            onValueChange={(v) => {
              const videoType = v as "short" | "long";
              if (videoType === "short") {
                onOptionsChange({ ...options, videoType, videoLength: "short" });
              } else {
                onOptionsChange({ ...options, videoType, videoLength: undefined });
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="long">일반 영상</SelectItem>
              <SelectItem value="short">쇼츠/릴스 (60초 이하)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>영상 길이</Label>
          {(options.videoType ?? "long") === "long" ? (
            <Select
              value={options.videoLength ?? "auto"}
              onValueChange={(v) => onOptionsChange({ ...options, videoLength: v === "auto" ? undefined : v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="자동 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">자동 선택</SelectItem>
                <SelectItem value="medium">중간 (2-10분)</SelectItem>
                <SelectItem value="long">긴 영상 (10분+)</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Select value="short" disabled>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">60초 이하</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Row 2: 출력 언어 + 선호 톤 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>출력 언어</Label>
          <Select
            value={options.language}
            onValueChange={(v) => onOptionsChange({ ...options, language: v as "ko" | "en" })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ko">한국어</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>선호 톤 (선택)</Label>
          <Input
            placeholder="비워두면 AI가 추천 (예: informative, cinematic...)"
            value={options.preferredTone ?? ""}
            onChange={(e) => onOptionsChange({ ...options, preferredTone: e.target.value || undefined })}
          />
        </div>
      </div>

      {/* Row 3: 채널 + 타겟 시청자 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>채널 (선택)</Label>
          {channels.length > 0 ? (
            <Select
              value={selectedChannelId || "none"}
              onValueChange={(v) => onChannelChange(v === "none" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="채널 미지정" />
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
            <p className="text-sm text-muted-foreground italic py-2">
              연결된 채널 없음
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>타겟 시청자 (선택)</Label>
          <Input
            placeholder="예: 20-30대 직장인"
            value={options.targetAudienceHint ?? ""}
            onChange={(e) =>
              onOptionsChange({ ...options, targetAudienceHint: e.target.value || undefined })
            }
          />
        </div>
      </div>

      {/* Row 4: 추가 지시사항 */}
      <div className="space-y-2">
        <Label>추가 지시사항 (선택)</Label>
        <Textarea
          placeholder="AI에게 추가로 전달할 지시사항을 입력하세요."
          value={options.customInstructions ?? ""}
          onChange={(e) =>
            onOptionsChange({ ...options, customInstructions: e.target.value || undefined })
          }
          rows={2}
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
  // Parse prompt into structured sections
  const sections = parsePromptSections(prompt);

  return (
    <div className="space-y-3 py-4">
      {sections.map((section, i) => (
        <div key={i} className="rounded-lg border bg-card p-3 space-y-2">
          {section.title && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {section.title}
            </p>
          )}
          {section.items.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {section.items.map((item, j) => (
                <div key={j} className={cn(
                  "flex items-baseline gap-1.5 text-sm",
                  item.fullWidth && "col-span-2",
                )}>
                  <span className="text-muted-foreground shrink-0">{item.label}</span>
                  <span className="font-medium truncate">{item.value}</span>
                </div>
              ))}
            </div>
          )}
          {section.text && (
            <p className="text-sm text-muted-foreground">{section.text}</p>
          )}
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-muted-foreground">
          "AI 생성 실행" 클릭 시 Gemini API를 호출합니다.
        </p>
        <Button variant="ghost" size="sm" className="shrink-0 text-xs" onClick={onCopy}>
          <Copy className="h-3 w-3 mr-1" />
          원문 복사
        </Button>
      </div>
    </div>
  );
}

/** Parse prompt text into structured sections for display */
function parsePromptSections(prompt: string) {
  const lines = prompt.split("\n");
  const sections: {
    title?: string;
    items: { label: string; value: string; fullWidth?: boolean }[];
    text?: string;
  }[] = [];

  let current: (typeof sections)[number] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Section header: "## Title"
    if (trimmed.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: trimmed.replace(/^## /, ""), items: [] };
      continue;
    }

    // List item: "- Key: Value"
    if (trimmed.startsWith("- ") && current) {
      const colonIdx = trimmed.indexOf(": ");
      if (colonIdx > 0) {
        const label = trimmed.slice(2, colonIdx + 1); // includes ':'
        const value = trimmed.slice(colonIdx + 2);
        const isLong = value.length > 50 || label.includes("URL") || label.includes("설명") || label.includes("Description");
        current.items.push({ label, value, fullWidth: isLong });
      } else {
        current.items.push({ label: "", value: trimmed.slice(2), fullWidth: true });
      }
      continue;
    }

    // Trailing instruction text
    if (current) {
      current.text = current.text ? `${current.text} ${trimmed}` : trimmed;
    } else {
      // Text before any section
      if (!current) {
        current = { items: [], text: trimmed };
      }
    }
  }

  if (current) sections.push(current);
  return sections;
}

function ResultStep({
  editedResult,
  onEditedResultChange,
}: {
  editedResult: {
    title: string;
    description: string;
    targetAudience: string;
    contentTone: string;
    category: string;
    difficulty: string;
    videoLength: string;
    estimatedViews: string;
  };
  onEditedResultChange: (result: typeof editedResult) => void;
}) {
  return (
    <div className="space-y-3 py-3">
      {/* Title */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">프로젝트 제목</Label>
        <Input
          value={editedResult.title}
          onChange={(e) =>
            onEditedResultChange({ ...editedResult, title: e.target.value })
          }
          className="h-9"
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">설명</Label>
        <Textarea
          value={editedResult.description}
          onChange={(e) =>
            onEditedResultChange({ ...editedResult, description: e.target.value })
          }
          rows={2}
          className="min-h-0 resize-none"
        />
      </div>

      {/* All metadata in 3-col grid */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-2.5">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">카테고리</Label>
          <Select
            value={editedResult.category}
            onValueChange={(v) => onEditedResultChange({ ...editedResult, category: v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="카테고리 선택..." />
            </SelectTrigger>
            <SelectContent>
              {YOUTUBE_CATEGORY_VALUES_KO.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">타겟 시청자</Label>
          <Input
            value={editedResult.targetAudience}
            onChange={(e) =>
              onEditedResultChange({ ...editedResult, targetAudience: e.target.value })
            }
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">예상 조회수</Label>
          <Input
            value={editedResult.estimatedViews}
            onChange={(e) =>
              onEditedResultChange({ ...editedResult, estimatedViews: e.target.value })
            }
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">콘텐츠 톤</Label>
          <Input
            value={editedResult.contentTone}
            onChange={(e) => onEditedResultChange({ ...editedResult, contentTone: e.target.value })}
            placeholder="informative, cinematic..."
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">난이도</Label>
          <Select
            value={editedResult.difficulty}
            onValueChange={(v) => onEditedResultChange({ ...editedResult, difficulty: v })}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">쉬움</SelectItem>
              <SelectItem value="medium">보통</SelectItem>
              <SelectItem value="hard">어려움</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">영상 길이</Label>
          <Select
            value={editedResult.videoLength}
            onValueChange={(v) => onEditedResultChange({ ...editedResult, videoLength: v })}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">60초 이하</SelectItem>
              <SelectItem value="medium">2-10분</SelectItem>
              <SelectItem value="long">10분+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
        AI 추천값을 검토 후 "프로젝트 생성"을 클릭하세요.
      </p>
    </div>
  );
}
