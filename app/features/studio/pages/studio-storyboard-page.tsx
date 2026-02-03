import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useFetcher } from "react-router";
import {
  Sparkles,
  Save,
  Plus,
  Trash2,
  Clock,
  Wand2,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Settings2,
  FileText,
  Lightbulb,
  AlertCircle,
  Radio,
  Download,
  Image as ImageIcon,
  RefreshCw,
  Layers,
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
import { Separator } from "~/common/components/ui/separator";
import { toast } from "sonner";

import { StudioProjectSelector } from "../components/studio-project-selector";
import { StoryboardGrid } from "../components/storyboard-grid";
import { StoryboardSceneCard } from "../components/storyboard-scene-card";
import type { StoryboardScene } from "../components/storyboard-scene-card";

import {
  getStoryboardWithScenes,
  saveStoryboard,
  updateStoryboardScene,
  deleteStoryboardScene,
} from "~/common/data/studio.data.server";
import { getProjectById } from "~/common/data/project.data.server";
import { requireAuth } from "~/lib/auth.server";
import type { Route } from "./+types/studio-storyboard-page";
import { useTranslation } from "~/i18n/context";

// =============================================================================
// Types
// =============================================================================

interface StoryboardSegment {
  id: string;
  scriptSegmentId: string;
  content: string;
  scenes: StoryboardScene[];
}

// =============================================================================
// Loader
// =============================================================================

export async function loader({ params, request }: Route.LoaderArgs) {
  if (!params.projectId) {
    return { project: null, storyboard: null, segments: [] };
  }

  const userId = await requireAuth(request);
  const [project, storyboardData] = await Promise.all([
    getProjectById(params.projectId, userId),
    getStoryboardWithScenes(params.projectId),
  ]);

  if (!project) {
    return { project: null, storyboard: null, segments: [] };
  }

  return {
    project,
    storyboard: storyboardData
      ? {
          savedAt: storyboardData.savedAt?.toISOString() ?? null,
        }
      : null,
    segments: storyboardData?.segments ?? [],
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
      const scenesJson = formData.get("scenes") as string;
      const scenes = JSON.parse(scenesJson) as Array<{
        scriptSegmentId: string;
        sceneNumber: number;
        orderIndex: number;
        description: string;
        visualPrompt: string;
        duration: number;
      }>;

      await saveStoryboard({ projectId, scenes });
      return { success: true, message: "스토리보드가 저장되었습니다." };
    }

    case "update-scene": {
      const sceneId = formData.get("sceneId") as string;
      const description = formData.get("description") as string | null;
      const visualPrompt = formData.get("visualPrompt") as string | null;
      const duration = formData.get("duration") as string | null;

      await updateStoryboardScene(sceneId, {
        ...(description && { description }),
        ...(visualPrompt && { visualPrompt }),
        ...(duration && { duration: parseInt(duration, 10) }),
      });
      return { success: true, message: "씬이 업데이트되었습니다." };
    }

    case "delete-scene": {
      const sceneId = formData.get("sceneId") as string;
      await deleteStoryboardScene(sceneId);
      return { success: true, message: "씬이 삭제되었습니다." };
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
    ? `${data.project.title} - 스토리보드 | TubeGAI`
    : "스토리보드 | TubeGAI";
  return [
    { title },
    { name: "description", content: "AI 기반 스토리보드 생성 및 편집" },
  ];
}

// =============================================================================
// Component
// =============================================================================

export default function StudioStoryboardPage({ loaderData }: Route.ComponentProps) {
  const { projectId } = useParams();
  const { project, storyboard, segments: initialSegments } = loaderData;
  const [segments, setSegments] = useState<StoryboardSegment[]>(initialSegments);
  const [hasChanges, setHasChanges] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingProgress, setStreamingProgress] = useState("");
  const [streamingSceneCount, setStreamingSceneCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // AI Generation Options
  const [style, setStyle] = useState<string>("cinematic");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [density, setDensity] = useState<number[]>([50]);
  const [camera, setCamera] = useState<string>("none");
  const [lighting, setLighting] = useState<string>("cinematic");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [consistentCharacter, setConsistentCharacter] = useState(true);
  const [enhancePrompt, setEnhancePrompt] = useState(true);

  const fetcher = useFetcher();
  const { t } = useTranslation("studio");

  const isLoading = fetcher.state !== "idle";
  const isSaving = isLoading && fetcher.formData?.get("intent") === "save";

  // Handle action response
  useEffect(() => {
    if (fetcher.data) {
      const data = fetcher.data as {
        success: boolean;
        message?: string;
        error?: string;
      };

      if (data.success) {
        if (data.message) {
          toast.success(data.message);
        }
        setHasChanges(false);
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
        title={t("storyboard.title")}
        description={t("storyboard.subtitle")}
        context="storyboard"
      />
    );
  }

  // Get all scenes from all segments
  const getAllScenes = () => {
    return segments.flatMap((seg) =>
      seg.scenes.map((scene) => ({
        ...scene,
        scriptSegmentId: seg.scriptSegmentId,
      }))
    );
  };

  const handleSave = () => {
    const allScenes = getAllScenes();
    const formData = new FormData();
    formData.append("intent", "save");
    formData.append(
      "scenes",
      JSON.stringify(
        allScenes.map((scene, index) => ({
          scriptSegmentId: scene.scriptSegmentId,
          sceneNumber: index + 1,
          orderIndex: scene.sceneNumber - 1,
          description: scene.description,
          visualPrompt: scene.visualPrompt,
          duration: scene.duration,
        }))
      )
    );
    fetcher.submit(formData, { method: "post" });
  };

  // Streaming generation handler
  const handleGenerateStream = useCallback(async () => {
    if (!projectId) return;

    // Clear existing scenes for fresh generation
    setSegments((prev) => prev.map((seg) => ({ ...seg, scenes: [] })));
    setIsStreaming(true);
    setStreamingProgress("");
    setStreamingSceneCount(0);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/studio/generate-storyboard-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          options: {
            style,
            aspectRatio,
            density: density[0],
            camera,
            lighting,
            negativePrompt: negativePrompt || undefined,
            consistentCharacter,
            enhancePrompt,
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "스토리보드 생성 실패");
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
                  setStreamingProgress("스토리보드 생성을 시작합니다...");
                  break;

                case "scene":
                  // Add scene to the appropriate segment
                  setSegments((prev) => {
                    const newSegments = [...prev];
                    const segIndex = newSegments.findIndex(
                      (seg) => seg.scriptSegmentId === data.scene.scriptSegmentId
                    );
                    if (segIndex !== -1) {
                      newSegments[segIndex] = {
                        ...newSegments[segIndex],
                        scenes: [...newSegments[segIndex].scenes, data.scene],
                      };
                    }
                    return newSegments;
                  });
                  setStreamingSceneCount((prev) => prev + 1);
                  setStreamingProgress(`씬 ${data.scene.sceneNumber} 생성 완료`);
                  break;

                case "progress":
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
                  toast.success("AI 스토리보드가 생성되었습니다!", {
                    description: `${data.scenes?.length || 0}개의 씬이 생성되었습니다.`,
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
        toast.info("스토리보드 생성이 취소되었습니다.");
      } else {
        console.error("Streaming error:", error);
        toast.error(
          error instanceof Error ? error.message : "스토리보드 생성 중 오류가 발생했습니다."
        );
      }
    } finally {
      setIsStreaming(false);
      setStreamingProgress("");
      abortControllerRef.current = null;
    }
  }, [
    projectId,
    style,
    aspectRatio,
    density,
    camera,
    lighting,
    negativePrompt,
    consistentCharacter,
    enhancePrompt,
  ]);

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleReset = () => {
    setSegments(initialSegments);
    setHasChanges(false);
    setSelectedSceneId(null);
    toast.info("변경사항이 초기화되었습니다.");
  };

  const handleDeleteScene = (segmentId: string, sceneId: string) => {
    setSegments((prev) =>
      prev.map((seg) =>
        seg.id === segmentId
          ? { ...seg, scenes: seg.scenes.filter((s) => s.id !== sceneId) }
          : seg
      )
    );
    setHasChanges(true);
    if (selectedSceneId === sceneId) {
      setSelectedSceneId(null);
    }
  };

  const handleRegenerateImage = (sceneId: string) => {
    toast.info("이미지 재생성 요청", {
      description: "이미지 생성 기능은 추후 지원 예정입니다.",
    });
  };

  // Calculate totals
  const totalScenes = segments.reduce((acc, seg) => acc + seg.scenes.length, 0);
  const totalDuration = segments.reduce(
    (acc, seg) => acc + seg.scenes.reduce((a, s) => a + s.duration, 0),
    0
  );
  const selectedScene = segments
    .flatMap((s) => s.scenes)
    .find((s) => s.id === selectedSceneId);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("storyboard.title")}</h1>
          <p className="text-muted-foreground">
            {project.title} - {t("storyboard.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full mr-2">
            <Layers className="w-4 h-4 mr-2" />
            <span>
              {totalScenes}개 씬 / {Math.floor(totalDuration / 60)}분 {totalDuration % 60}초
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
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            {t("storyboard.exportPdf")}
          </Button>
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
        {/* Left Col: Storyboard Editor */}
        <div className="lg:col-span-2 flex flex-col min-h-0 bg-background rounded-lg border shadow-sm">
          <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
            <h2 className="font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4" />
              스토리보드 씬
              <Badge variant="secondary" className="ml-2">
                {totalScenes}개
              </Badge>
              {isStreaming && (
                <Badge variant="default" className="ml-2 animate-pulse">
                  <Radio className="w-3 h-3 mr-1" />
                  생성 중
                </Badge>
              )}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Streaming Progress */}
            {isStreaming && (
              <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-sm font-medium text-primary">
                    AI가 스토리보드를 생성하고 있습니다...
                  </span>
                </div>
                <Progress value={Math.min(streamingSceneCount * 10, 100)} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground truncate">
                  {streamingProgress || "대기 중..."}
                </p>
              </div>
            )}

            {segments.length === 0 && !isStreaming ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  스토리보드가 비어있습니다
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  스크립트가 있어야 스토리보드를 생성할 수 있습니다.
                </p>
                <Button onClick={handleGenerateStream}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI 스토리보드 생성
                </Button>
              </div>
            ) : (
              segments.map((segment, segIndex) => (
                <div key={segment.id} className="space-y-4">
                  {/* Segment Header */}
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-inset ring-primary/20">
                      {segIndex + 1}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      스크립트 세그먼트
                    </span>
                  </div>

                  {/* Segment Script Preview */}
                  <div className="bg-muted/30 p-4 rounded-lg border border-border/50 text-sm leading-relaxed">
                    <FileText className="float-right h-4 w-4 text-muted-foreground/20" />
                    <p className="line-clamp-3">{segment.content}</p>
                  </div>

                  {/* Scenes Grid */}
                  {segment.scenes.length > 0 ? (
                    <StoryboardGrid className="xl:grid-cols-2">
                      {segment.scenes.map((scene) => (
                        <div
                          key={scene.id}
                          className={`cursor-pointer transition-all ${
                            selectedSceneId === scene.id
                              ? "ring-2 ring-primary rounded-xl"
                              : ""
                          }`}
                          onClick={() => setSelectedSceneId(scene.id)}
                        >
                          <StoryboardSceneCard
                            scene={scene}
                            onRegenerateImage={handleRegenerateImage}
                            className={`min-h-70 ${
                              isStreaming &&
                              segment.scenes[segment.scenes.length - 1]?.id === scene.id
                                ? "animate-pulse"
                                : ""
                            }`}
                          />
                        </div>
                      ))}
                      <div className="h-full min-h-70 rounded-xl border-2 border-dashed flex flex-col items-center justify-center bg-muted/20 transition-colors hover:bg-muted/30 cursor-pointer">
                        <Button
                          variant="ghost"
                          className="gap-2 text-muted-foreground hover:text-primary"
                        >
                          <Plus className="h-6 w-6" />
                          {t("storyboard.addScene")}
                        </Button>
                      </div>
                    </StoryboardGrid>
                  ) : (
                    <div className="h-50 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center bg-muted/20">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h4 className="text-sm font-semibold mb-1">{t("storyboard.noScenes")}</h4>
                      <p className="text-xs text-muted-foreground max-w-62.5 mb-4">
                        {t("storyboard.noScenesDesc")}
                      </p>
                    </div>
                  )}

                  {segIndex < segments.length - 1 && <Separator className="my-6" />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: AI Assistant */}
        <div className="lg:col-span-1 flex flex-col gap-4 min-h-0 overflow-y-auto">
          {/* Project Context Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                프로젝트 컨텍스트
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">타겟 시청자</span>
                <span>{project.targetAudience ?? "미설정"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">콘텐츠 톤</span>
                <span>{project.contentTone ?? "미설정"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">영상 길이</span>
                <span>{project.videoLength ?? "미설정"}</span>
              </div>
            </CardContent>
          </Card>

          {/* AI Generate Card */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Sparkles className="w-5 h-5" />
                AI 스토리보드 생성
              </CardTitle>
              <CardDescription>
                스크립트 세그먼트를 기반으로 AI가 실시간으로 씬을 생성합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Visual Style */}
              <div className="space-y-3">
                <Label className="text-xs">{t("storyboard.generator.visualStyle")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["cinematic", "anime", "lineart", "3d"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      disabled={isStreaming}
                      className={`p-2 rounded border text-left text-xs transition-colors ${
                        style === s
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div
                        className={`aspect-video rounded mb-1 w-full ${
                          s === "cinematic"
                            ? "bg-neutral-900"
                            : s === "anime"
                              ? "bg-pink-100"
                              : s === "lineart"
                                ? "bg-white border border-gray-200"
                                : "bg-blue-100"
                        }`}
                      />
                      <span className="font-medium block capitalize">{s}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Aspect Ratio */}
              <div className="space-y-3">
                <Label className="text-xs">{t("storyboard.generator.aspectRatio")}</Label>
                <div className="grid grid-cols-4 gap-2">
                  {["16:9", "9:16", "2.35:1", "4:3"].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      disabled={isStreaming}
                      className={`px-2 py-2 rounded border text-xs text-center transition-colors ${
                        aspectRatio === ratio
                          ? "border-primary bg-primary/5 ring-1 ring-primary font-medium"
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Scene Density */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label className="text-xs">{t("storyboard.generator.sceneDensity")}</Label>
                  <span className="text-xs text-muted-foreground">
                    {density[0] > 70
                      ? t("storyboard.generator.high")
                      : density[0] < 30
                        ? t("storyboard.generator.low")
                        : t("storyboard.generator.balanced")}
                  </span>
                </div>
                <Slider
                  value={density}
                  onValueChange={setDensity}
                  max={100}
                  step={10}
                  disabled={isStreaming}
                />
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
                      {t("storyboard.generator.advancedSettings")}
                    </span>
                    {isOptionsOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  {/* Camera Movement */}
                  <div className="space-y-2">
                    <Label className="text-xs">{t("storyboard.generator.cameraMovement")}</Label>
                    <Select value={camera} onValueChange={setCamera} disabled={isStreaming}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("storyboard.generator.none")}</SelectItem>
                        <SelectItem value="pan">{t("storyboard.generator.pan")}</SelectItem>
                        <SelectItem value="tilt">{t("storyboard.generator.tilt")}</SelectItem>
                        <SelectItem value="zoom">{t("storyboard.generator.zoom")}</SelectItem>
                        <SelectItem value="handheld">{t("storyboard.generator.handheld")}</SelectItem>
                        <SelectItem value="drone">{t("storyboard.generator.droneShot")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lighting Style */}
                  <div className="space-y-2">
                    <Label className="text-xs">{t("storyboard.generator.lightingStyle")}</Label>
                    <Select value={lighting} onValueChange={setLighting} disabled={isStreaming}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cinematic">{t("storyboard.generator.cinematic")}</SelectItem>
                        <SelectItem value="natural">{t("storyboard.generator.natural")}</SelectItem>
                        <SelectItem value="studio">{t("storyboard.generator.studio")}</SelectItem>
                        <SelectItem value="neon">{t("storyboard.generator.neon")}</SelectItem>
                        <SelectItem value="golden">{t("storyboard.generator.goldenHour")}</SelectItem>
                        <SelectItem value="lowkey">{t("storyboard.generator.lowKey")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Negative Prompt */}
                  <div className="space-y-2">
                    <Label className="text-xs">{t("storyboard.generator.negativePrompt")}</Label>
                    <Textarea
                      placeholder={t("storyboard.generator.negativePromptPlaceholder")}
                      className="min-h-15 text-xs resize-none"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      disabled={isStreaming}
                    />
                  </div>

                  {/* Toggles */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between space-x-2">
                      <Label className="flex flex-col space-y-1 cursor-pointer">
                        <span>{t("storyboard.generator.consistentCharacter")}</span>
                        <span className="font-normal text-[10px] text-muted-foreground">
                          {t("storyboard.generator.consistentCharacterDesc")}
                        </span>
                      </Label>
                      <Switch
                        checked={consistentCharacter}
                        onCheckedChange={setConsistentCharacter}
                        disabled={isStreaming}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <Label className="flex flex-col space-y-1 cursor-pointer">
                        <span>{t("storyboard.generator.promptMagic")}</span>
                        <span className="font-normal text-[10px] text-muted-foreground">
                          {t("storyboard.generator.promptMagicDesc")}
                        </span>
                      </Label>
                      <Switch
                        checked={enhancePrompt}
                        onCheckedChange={setEnhancePrompt}
                        disabled={isStreaming}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
            <CardFooter className="flex gap-2">
              {isStreaming ? (
                <Button variant="destructive" className="w-full" onClick={handleCancelGeneration}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  생성 취소
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full">
                      <Sparkles className="w-4 h-4 mr-2" />
                      스토리보드 생성
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>새 스토리보드를 생성하시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription>
                        기존 스토리보드가 AI가 생성한 새 스토리보드로 대체됩니다. 스크립트
                        세그먼트를 기반으로 씬이 생성됩니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={handleGenerateStream}>생성하기</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardFooter>
          </Card>

          {/* Scene Refinement Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                씬 미세 조정
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedScene
                  ? `선택됨: Scene ${selectedScene.sceneNumber}`
                  : "씬을 선택하세요"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start"
                      disabled={!selectedScene || isStreaming}
                      onClick={() =>
                        selectedScene && handleRegenerateImage(selectedScene.id)
                      }
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      이미지 재생성
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>선택한 씬의 이미지를 새로 생성합니다</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-destructive hover:text-destructive"
                      disabled={!selectedScene || isStreaming}
                      onClick={() => {
                        if (selectedScene) {
                          const seg = segments.find((s) =>
                            s.scenes.some((sc) => sc.id === selectedScene.id)
                          );
                          if (seg) {
                            handleDeleteScene(seg.id, selectedScene.id);
                          }
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      씬 삭제
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>선택한 씬을 삭제합니다</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>

          {/* Save Status */}
          {storyboard?.savedAt && (
            <div className="text-xs text-muted-foreground text-center">
              마지막 저장: {new Date(storyboard.savedAt).toLocaleString("ko-KR")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
