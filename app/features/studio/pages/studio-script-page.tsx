import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useFetcher } from "react-router";
import {
  Sparkles,
  Save,
  Plus,
  Trash2,
  MoveVertical,
  Clock,
  Wand2,
  RotateCcw,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Settings2,
  FileText,
  Lightbulb,
  AlertCircle,
  Radio,
} from "lucide-react";

import { Button } from "~/common/components/ui/button";
import { Textarea } from "~/common/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Label } from "~/common/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/common/components/ui/select";
import { Switch } from "~/common/components/ui/switch";
import { Slider } from "~/common/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/common/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/common/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/common/components/ui/alert-dialog";
import { Progress } from "~/common/components/ui/progress";
import { toast } from "sonner";
import { StudioProjectSelector } from "../components/studio-project-selector";
import type { ScriptSegment } from "~/common/types/studio.types";
import { getScriptWithSegments, getPreProductionData } from "~/common/data/studio.data.server";
import { getProjectById } from "~/common/data/project.data.server";
import { getTrendTubeSessions } from "~/common/data/trendtube.data.server";
import { refineScriptSegment } from "~/lib/ai/script.server";
import { saveScript } from "~/common/data/studio.data.server";
import { PreProductionCard } from "../components/pre-production-card";
import type { Route } from "./+types/studio-script-page";
import { requireAuth } from "~/lib/auth.server";

// =============================================================================
// Loader
// =============================================================================

export async function loader({ params, request }: Route.LoaderArgs) {
  if (!params.projectId) {
    return { project: null, script: null, segments: [], trendtubeSessions: [], preProduction: null };
  }

  const userId = await requireAuth(request);
  const [project, scriptData, ttSessions, preProduction] = await Promise.all([
    getProjectById(params.projectId, userId),
    getScriptWithSegments(params.projectId),
    getTrendTubeSessions(params.projectId),
    getPreProductionData(params.projectId),
  ]);

  if (!project) {
    return { project: null, script: null, segments: [], trendtubeSessions: [], preProduction: null };
  }

  // Filter TrendTube sessions that have narration scripts
  const completedSessions = ttSessions
    .filter((s) => s.status === "completed" && s.result?.narrationScript)
    .map((s) => ({
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      userIdea: s.userIdea,
      narrationPreview: s.result?.narrationScript?.slice(0, 50) ?? "",
    }));

  return {
    project,
    script: scriptData
      ? {
          id: scriptData.id,
          prompt: scriptData.prompt,
          targetDuration: scriptData.targetDuration,
          savedAt: scriptData.savedAt?.toISOString() ?? null,
        }
      : null,
    segments: scriptData?.segments ?? [],
    trendtubeSessions: completedSessions,
    preProduction,
  };
}

// =============================================================================
// Action
// =============================================================================

export async function action({ request, params }: Route.ActionArgs) {
  const userId = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const projectId = params.projectId;

  if (!projectId) {
    return { success: false, error: "프로젝트 ID가 필요합니다." };
  }

  const project = await getProjectById(projectId, userId);
  if (!project) {
    return { success: false, error: "프로젝트를 찾을 수 없습니다." };
  }

  switch (intent) {
    case "save": {
      const segmentsJson = formData.get("segments") as string;
      const prompt = formData.get("prompt") as string | null;
      const segments = JSON.parse(segmentsJson) as ScriptSegment[];

      await saveScript({
        projectId,
        prompt,
        segments: segments.map((seg) => ({
          type: seg.type,
          content: seg.content,
          estimatedDuration: seg.duration,
        })),
      });

      return { success: true, message: "스크립트가 저장되었습니다." };
    }

    case "refine": {
      const segmentJson = formData.get("segment") as string;
      const refineAction = formData.get("action") as "improve_grammar" | "make_shorter" | "expand" | "change_tone";
      const targetTone = formData.get("targetTone") as string | null;
      const segment = JSON.parse(segmentJson) as ScriptSegment;

      const refinedContent = await refineScriptSegment({
        segment,
        action: refineAction,
        targetTone: targetTone || undefined,
        language: "ko",
      });

      return { success: true, refinedContent, segmentId: segment.id };
    }

    default:
      return { success: false, error: "알 수 없는 요청입니다." };
  }
}

// =============================================================================
// Meta
// =============================================================================

export function meta({ data }: Route.MetaArgs) {
  const title = data?.project?.title
    ? `${data.project.title} - 스크립트 편집기 | TubeGAI`
    : "스크립트 편집기 | TubeGAI";
  return [
    { title },
    { name: "description", content: "AI 기반 영상 스크립트 작성 및 편집" },
  ];
}

// =============================================================================
// Component
// =============================================================================

export default function StudioScriptPage({ loaderData }: Route.ComponentProps) {
  const { projectId } = useParams();
  const { project, script, segments: initialSegments, trendtubeSessions, preProduction } = loaderData;
  const [segments, setSegments] = useState<ScriptSegment[]>(initialSegments);
  const [hasChanges, setHasChanges] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingProgress, setStreamingProgress] = useState("");
  const [streamingSegmentCount, setStreamingSegmentCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // AI Generation Options
  const [tone, setTone] = useState<string>("informative");
  const [length, setLength] = useState<string>("medium");
  const [customPrompt, setCustomPrompt] = useState(script?.prompt ?? "");
  const [includeHook, setIncludeHook] = useState(true);
  const [includeCTA, setIncludeCTA] = useState(true);

  // Advanced AI Options (Note: presencePenalty and frequencyPenalty are NOT supported by gemini-2.5-flash)
  const [temperature, setTemperature] = useState(0.8);
  const [topP, setTopP] = useState(0.9);
  const [topK, setTopK] = useState(40);

  const fetcher = useFetcher();

  const isLoading = fetcher.state !== "idle";
  const isSaving = isLoading && fetcher.formData?.get("intent") === "save";
  const isRefining = isLoading && fetcher.formData?.get("intent") === "refine";

  // Handle action response
  useEffect(() => {
    if (fetcher.data) {
      const data = fetcher.data as {
        success: boolean;
        message?: string;
        error?: string;
        refinedContent?: string;
        segmentId?: string;
      };

      if (data.success) {
        if (data.message) {
          toast.success(data.message);
        }
        if (data.refinedContent && data.segmentId) {
          setSegments((prev) =>
            prev.map((seg) =>
              seg.id === data.segmentId
                ? { ...seg, content: data.refinedContent! }
                : seg
            )
          );
          setHasChanges(true);
        }
      } else if (data.error) {
        toast.error(data.error);
      }
    }
  }, [fetcher.data]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle No Project
  if (!projectId || !project) {
    return (
      <StudioProjectSelector
        title="스크립트 편집기"
        description="Gemini AI의 도움을 받아 내러티브를 작성하세요."
        context="script"
      />
    );
  }

  const handleUpdateSegment = (id: string, content: string) => {
    setSegments((prev) =>
      prev.map((seg) =>
        seg.id === id
          ? { ...seg, content, duration: Math.ceil(content.length / 15) }
          : seg
      )
    );
    setHasChanges(true);
  };

  const handleUpdateSegmentType = (id: string, type: ScriptSegment["type"]) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, type } : seg))
    );
    setHasChanges(true);
  };

  const handleDeleteSegment = (id: string) => {
    setSegments((prev) => prev.filter((seg) => seg.id !== id));
    setHasChanges(true);
    if (selectedSegmentId === id) {
      setSelectedSegmentId(null);
    }
  };

  const handleAddSegment = (type: ScriptSegment["type"] = "body") => {
    const newSegment: ScriptSegment = {
      id: crypto.randomUUID(),
      type,
      content: "",
      duration: 0,
    };
    setSegments([...segments, newSegment]);
    setHasChanges(true);
  };

  const handleSave = () => {
    const formData = new FormData();
    formData.append("intent", "save");
    formData.append("segments", JSON.stringify(segments));
    if (customPrompt) {
      formData.append("prompt", customPrompt);
    }
    fetcher.submit(formData, { method: "post" });
    setHasChanges(false);
  };

  // Streaming generation handler
  const handleGenerateStream = useCallback(async () => {
    if (!projectId) return;

    // Clear existing segments for fresh generation
    setSegments([]);
    setIsStreaming(true);
    setStreamingProgress("");
    setStreamingSegmentCount(0);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/studio/generate-script-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          options: {
            tone,
            length,
            customPrompt: customPrompt || undefined,
            includeHook,
            includeCTA,
            temperature,
            topP,
            topK,
            // Note: presencePenalty and frequencyPenalty are NOT supported by gemini-2.5-flash
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "스크립트 생성 실패");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("스트림을 읽을 수 없습니다");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case "start":
                  setStreamingProgress("스크립트 생성을 시작합니다...");
                  break;

                case "segment":
                  setSegments((prev) => [...prev, data.segment]);
                  setStreamingSegmentCount((prev) => prev + 1);
                  setStreamingProgress(`세그먼트 ${data.segment.type} 생성 완료`);
                  break;

                case "progress":
                  // Show partial progress text
                  setStreamingProgress((prev) => {
                    const maxLen = 50;
                    const text = data.text.replace(/\n/g, " ").trim();
                    if (text.length > maxLen) {
                      return text.substring(0, maxLen) + "...";
                    }
                    return text || prev;
                  });
                  break;

                case "complete":
                  setIsStreaming(false);
                  setHasChanges(false);
                  toast.success("AI 스크립트가 생성되었습니다!", {
                    description: `${data.segments?.length || 0}개의 세그먼트가 생성되었습니다.`,
                  });
                  break;

                case "error":
                  throw new Error(data.error);
              }
            } catch {
              // Ignore parse errors for incomplete JSON
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        toast.info("스크립트 생성이 취소되었습니다.");
      } else {
        console.error("Streaming error:", error);
        toast.error(error instanceof Error ? error.message : "스크립트 생성 중 오류가 발생했습니다.");
      }
    } finally {
      setIsStreaming(false);
      setStreamingProgress("");
      abortControllerRef.current = null;
    }
  }, [projectId, tone, length, customPrompt, includeHook, includeCTA, temperature, topP, topK]);

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRefine = (action: "improve_grammar" | "make_shorter" | "expand" | "change_tone") => {
    const segment = segments.find((s) => s.id === selectedSegmentId);
    if (!segment) return;

    const formData = new FormData();
    formData.append("intent", "refine");
    formData.append("segment", JSON.stringify(segment));
    formData.append("action", action);
    fetcher.submit(formData, { method: "post" });
  };

  const handleReset = () => {
    setSegments(initialSegments);
    setHasChanges(false);
    toast.info("변경사항이 초기화되었습니다.");
  };

  // TrendTube import handler
  const handleImportTrendTube = async (sessionId: string) => {
    if (!projectId) return;
    setIsImporting(true);

    try {
      const res = await fetch("/api/studio/import-trendtube-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, trendtubeSessionId: sessionId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "임포트 실패");
        return;
      }

      toast.success(data.message ?? "TrendTube 스크립트가 임포트되었습니다.");
      // Reload page to get fresh data
      window.location.reload();
    } catch {
      toast.error("TrendTube 스크립트 임포트 중 오류 발생");
    } finally {
      setIsImporting(false);
    }
  };

  const totalDuration = segments.reduce((acc, curr) => acc + curr.duration, 0);
  const selectedSegment = segments.find((s) => s.id === selectedSegmentId);

  const segmentTypeLabels: Record<ScriptSegment["type"], string> = {
    hook: "훅",
    intro: "인트로",
    body: "본문",
    cta: "CTA",
    outro: "아웃트로",
  };

  const segmentTypeColors: Record<ScriptSegment["type"], string> = {
    hook: "bg-red-500/10 text-red-600 border-red-200",
    intro: "bg-blue-500/10 text-blue-600 border-blue-200",
    body: "bg-green-500/10 text-green-600 border-green-200",
    cta: "bg-orange-500/10 text-orange-600 border-orange-200",
    outro: "bg-purple-500/10 text-purple-600 border-purple-200",
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">스크립트 편집기</h1>
          <p className="text-muted-foreground">
            {project.title} - Gemini AI의 도움을 받아 내러티브를 작성하세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full mr-2">
            <Clock className="w-4 h-4 mr-2" />
            <span>
              예상 길이: {Math.floor(totalDuration / 60)}분 {totalDuration % 60}초
            </span>
          </div>
          {hasChanges && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
              <AlertCircle className="w-3 h-3 mr-1" />
              저장되지 않음
            </Badge>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={!hasChanges || isStreaming}>
                <RotateCcw className="w-4 h-4 mr-2" /> 초기화
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>변경사항을 초기화하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  모든 수정 내용이 마지막 저장 상태로 되돌아갑니다. 이 작업은 취소할 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>초기화</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button size="sm" onClick={handleSave} disabled={isSaving || !hasChanges || isStreaming}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            저장
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
        {/* Left Col: Script Editor */}
        <div className="lg:col-span-2 flex flex-col min-h-0 bg-background rounded-lg border shadow-sm">
          <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              스크립트 세그먼트
              <Badge variant="secondary" className="ml-2">
                {segments.length}개
              </Badge>
              {isStreaming && (
                <Badge variant="default" className="ml-2 animate-pulse">
                  <Radio className="w-3 h-3 mr-1" />
                  생성 중
                </Badge>
              )}
            </h2>
            <div className="flex gap-2">
              <Select
                onValueChange={(value) =>
                  handleAddSegment(value as ScriptSegment["type"])
                }
                disabled={isStreaming}
              >
                <SelectTrigger className="w-35">
                  <Plus className="w-4 h-4 mr-2" />
                  세그먼트 추가
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hook">훅</SelectItem>
                  <SelectItem value="intro">인트로</SelectItem>
                  <SelectItem value="body">본문</SelectItem>
                  <SelectItem value="cta">CTA</SelectItem>
                  <SelectItem value="outro">아웃트로</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Streaming Progress */}
            {isStreaming && (
              <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-sm font-medium text-primary">
                    AI가 스크립트를 생성하고 있습니다...
                  </span>
                </div>
                <Progress value={streamingSegmentCount * 20} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground truncate">
                  {streamingProgress || "대기 중..."}
                </p>
              </div>
            )}

            {segments.length === 0 && !isStreaming ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  스크립트가 비어있습니다
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  AI로 스크립트를 생성하거나 직접 작성을 시작하세요.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => handleAddSegment("hook")} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    직접 작성
                  </Button>
                  <Button onClick={handleGenerateStream}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI 생성
                  </Button>
                </div>

                {/* TrendTube Import Section */}
                {trendtubeSessions.length > 0 && (
                  <div className="mt-6 pt-6 border-t w-full max-w-md">
                    <p className="text-xs text-muted-foreground mb-3">
                      또는 TrendTube 나레이션을 가져올 수 있습니다
                    </p>
                    <Select
                      onValueChange={handleImportTrendTube}
                      disabled={isImporting}
                    >
                      <SelectTrigger className="w-full">
                        {isImporting ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            임포트 중...
                          </span>
                        ) : (
                          <SelectValue placeholder="TrendTube 세션 선택..." />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {trendtubeSessions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex flex-col text-left">
                              <span className="text-sm">
                                {new Date(s.createdAt).toLocaleDateString("ko-KR")}
                              </span>
                              <span className="text-xs text-muted-foreground truncate max-w-60">
                                {s.narrationPreview}...
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ) : (
              segments.map((segment, index) => (
                <div
                  key={segment.id}
                  className={`relative group rounded-lg border transition-all ${
                    selectedSegmentId === segment.id
                      ? "ring-2 ring-primary border-primary"
                      : "hover:border-muted-foreground/30"
                  } ${isStreaming && index === segments.length - 1 ? "animate-pulse ring-2 ring-primary/50" : ""}`}
                  onClick={() => setSelectedSegmentId(segment.id)}
                >
                  <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-muted-foreground">
                    <MoveVertical className="w-4 h-4" />
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Select
                        value={segment.type}
                        onValueChange={(value) =>
                          handleUpdateSegmentType(
                            segment.id,
                            value as ScriptSegment["type"]
                          )
                        }
                        disabled={isStreaming}
                      >
                        <SelectTrigger
                          className={`w-25 h-7 text-xs ${segmentTypeColors[segment.type]}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hook">훅</SelectItem>
                          <SelectItem value="intro">인트로</SelectItem>
                          <SelectItem value="body">본문</SelectItem>
                          <SelectItem value="cta">CTA</SelectItem>
                          <SelectItem value="outro">아웃트로</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-muted-foreground">
                        세그먼트 #{index + 1}
                      </span>
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          ~{segment.duration}초
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSegment(segment.id);
                          }}
                          disabled={isStreaming}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <Textarea
                      value={segment.content}
                      onChange={(e) =>
                        handleUpdateSegment(segment.id, e.target.value)
                      }
                      className="min-h-24 resize-none text-base leading-relaxed border-0 p-0 focus-visible:ring-0"
                      placeholder={`${segmentTypeLabels[segment.type]} 내용을 입력하세요...`}
                      onClick={(e) => e.stopPropagation()}
                      disabled={isStreaming}
                    />

                    {/* Visual Metadata Display */}
                    {(segment.visualNotes || segment.keywords?.length || segment.sceneHints?.length) && (
                      <div className="mt-3 pt-3 border-t border-dashed space-y-2">
                        {segment.visualNotes && (
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap mt-0.5">영상 노트:</span>
                            <span className="text-xs text-muted-foreground">{segment.visualNotes}</span>
                          </div>
                        )}

                        {segment.emotionalTone && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-muted-foreground">감정 톤:</span>
                            <Badge variant="outline" className="text-[10px] h-5">
                              {segment.emotionalTone}
                            </Badge>
                          </div>
                        )}

                        {segment.keywords && segment.keywords.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap mt-0.5">키워드:</span>
                            <div className="flex flex-wrap gap-1">
                              {segment.keywords.map((keyword, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] h-5">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {segment.sceneHints && segment.sceneHints.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-muted-foreground">씬 분할 ({segment.sceneHints.length}개):</span>
                            <div className="grid gap-1">
                              {segment.sceneHints.map((scene, i) => (
                                <div key={i} className="flex items-start gap-2 text-[10px] bg-muted/50 px-2 py-1 rounded">
                                  <span className="font-medium text-muted-foreground shrink-0">#{i + 1}</span>
                                  <span className="text-muted-foreground">{scene.description}</span>
                                  <span className="ml-auto text-muted-foreground shrink-0">{scene.duration}초</span>
                                  {scene.cameraAngle && (
                                    <Badge variant="outline" className="text-[9px] h-4 shrink-0">
                                      {scene.cameraAngle}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: AI Assistant */}
        <div className="lg:col-span-1 flex flex-col gap-4 min-h-0 overflow-y-auto">
          {/* Pre-Production Card */}
          <PreProductionCard
            projectId={projectId}
            data={preProduction}
          />

          {/* AI Generate Card */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Sparkles className="w-5 h-5" />
                AI 스크립트 생성
              </CardTitle>
              <CardDescription>
                프로젝트 정보를 기반으로 AI가 실시간으로 스크립트를 생성합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic Options */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">톤 / 스타일</Label>
                  <Select value={tone} onValueChange={setTone} disabled={isStreaming}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="informative">정보 전달형</SelectItem>
                      <SelectItem value="casual">캐주얼</SelectItem>
                      <SelectItem value="professional">전문적</SelectItem>
                      <SelectItem value="dramatic">드라마틱</SelectItem>
                      <SelectItem value="funny">유머러스</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">영상 길이</Label>
                  <Select value={length} onValueChange={setLength} disabled={isStreaming}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">짧게 (1-2분)</SelectItem>
                      <SelectItem value="medium">중간 (5-10분)</SelectItem>
                      <SelectItem value="long">길게 (10분+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Options */}
              <Collapsible open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-muted-foreground"
                    disabled={isStreaming}
                  >
                    <span className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      고급 옵션
                    </span>
                    {isOptionsOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-xs">추가 지시사항</Label>
                    <Textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="예: 초보자도 이해할 수 있게, 실제 사례 포함..."
                      className="min-h-20 text-sm"
                      disabled={isStreaming}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">오프닝 훅 포함</Label>
                      <Switch
                        checked={includeHook}
                        onCheckedChange={setIncludeHook}
                        disabled={isStreaming}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">CTA 세그먼트 포함</Label>
                      <Switch
                        checked={includeCTA}
                        onCheckedChange={setIncludeCTA}
                        disabled={isStreaming}
                      />
                    </div>
                  </div>

                  {/* AI Generation Parameters */}
                  <div className="pt-3 border-t space-y-4">
                    <Label className="text-xs font-medium text-muted-foreground">AI 생성 파라미터</Label>

                    {/* Temperature */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Temperature</Label>
                        <span className="text-xs text-muted-foreground">{temperature.toFixed(1)}</span>
                      </div>
                      <Slider
                        value={[temperature]}
                        onValueChange={([v]) => setTemperature(v)}
                        min={0}
                        max={2}
                        step={0.1}
                        disabled={isStreaming}
                        className="w-full"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        낮을수록 일관성 있음, 높을수록 창의적
                      </p>
                    </div>

                    {/* Top P */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Top P</Label>
                        <span className="text-xs text-muted-foreground">{topP.toFixed(1)}</span>
                      </div>
                      <Slider
                        value={[topP]}
                        onValueChange={([v]) => setTopP(v)}
                        min={0}
                        max={1}
                        step={0.05}
                        disabled={isStreaming}
                        className="w-full"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        확률 기반 토큰 선택 범위 (0.9 권장)
                      </p>
                    </div>

                    {/* Top K */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Top K</Label>
                        <span className="text-xs text-muted-foreground">{topK}</span>
                      </div>
                      <Slider
                        value={[topK]}
                        onValueChange={([v]) => setTopK(v)}
                        min={1}
                        max={100}
                        step={1}
                        disabled={isStreaming}
                        className="w-full"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        상위 K개 토큰에서 샘플링 (40 권장)
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
            <CardFooter className="flex gap-2">
              {isStreaming ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleCancelGeneration}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  생성 취소
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full">
                      <Sparkles className="w-4 h-4 mr-2" />
                      스크립트 생성
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>새 스크립트를 생성하시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription>
                        기존 스크립트가 AI가 생성한 새 스크립트로 대체됩니다.
                        생성되는 과정을 실시간으로 확인할 수 있습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={handleGenerateStream}>
                        생성하기
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardFooter>
          </Card>

          {/* Refinement Tools Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                세그먼트 미세 조정
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedSegment
                  ? `선택됨: ${segmentTypeLabels[selectedSegment.type]} 세그먼트`
                  : "세그먼트를 선택하세요"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start"
                      disabled={!selectedSegment || isRefining || isStreaming}
                      onClick={() => handleRefine("improve_grammar")}
                    >
                      {isRefining ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      문법 및 가독성 개선
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>문법을 교정하고 더 자연스럽게 다듬습니다</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start"
                      disabled={!selectedSegment || isRefining || isStreaming}
                      onClick={() => handleRefine("make_shorter")}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      더 간결하게
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>핵심만 남기고 불필요한 부분을 제거합니다</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start"
                      disabled={!selectedSegment || isRefining || isStreaming}
                      onClick={() => handleRefine("expand")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      내용 확장
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>예시와 설명을 추가하여 내용을 풍부하게 합니다</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>

          {/* Save Status */}
          {script?.savedAt && (
            <div className="text-xs text-muted-foreground text-center">
              마지막 저장: {new Date(script.savedAt).toLocaleString("ko-KR")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
