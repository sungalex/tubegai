import { useState, useEffect, useCallback } from "react";
import { useParams, useFetcher } from "react-router";
import {
  Captions,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Download,
  Save,
  Clock,
  Trash2,
  Plus,
  Search,
  Sparkles,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/common/components/ui/button";
import { ScrollArea } from "~/common/components/ui/scroll-area";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
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
import { StudioProjectSelector } from "../components/studio-project-selector";
import { cn } from "~/lib/utils";
import type { SubtitleSegment } from "~/common/types/studio.types";
import type { Route } from "./+types/studio-subtitles-page";

// =============================================================================
// Segment Type Labels
// =============================================================================

const SEGMENT_TYPE_LABEL: Record<string, string> = {
  hook: "Hook",
  intro: "Intro",
  body: "Body",
  cta: "CTA",
  outro: "Outro",
};

// =============================================================================
// Loader
// =============================================================================

export async function loader({ params, request }: Route.LoaderArgs) {
  if (!params.projectId) {
    return {
      project: null,
      subtitles: [],
      scriptSegments: [],
      totalDuration: 0,
    };
  }

  const { requireAuth } = await import("~/lib/auth.server");
  const { getProjectById } = await import("~/common/data/project.data.server");
  const { getSubtitles, getScriptWithSegments } = await import(
    "~/common/data/studio.data.server"
  );

  const userId = await requireAuth(request);
  const [project, subtitles, scriptData] = await Promise.all([
    getProjectById(params.projectId, userId),
    getSubtitles(params.projectId),
    getScriptWithSegments(params.projectId),
  ]);

  if (!project) {
    return {
      project: null,
      subtitles: [],
      scriptSegments: [],
      totalDuration: 0,
    };
  }

  const totalDuration =
    scriptData?.segments.reduce((sum, seg) => sum + seg.duration, 0) ?? 0;

  return {
    project: { id: project.id, title: project.title },
    subtitles,
    scriptSegments: scriptData?.segments ?? [],
    totalDuration,
  };
}

// =============================================================================
// Action
// =============================================================================

export async function action({ request, params }: Route.ActionArgs) {
  const { requireAuth } = await import("~/lib/auth.server");
  const { getProjectById } = await import("~/common/data/project.data.server");
  const {
    getScriptWithSegments,
    getStoryboardWithScenes,
    getActiveSession,
    saveSubtitles,
    deleteSubtitle: deleteSubtitleFromDB,
    addSubtitle,
  } = await import("~/common/data/studio.data.server");
  const { generateSubtitles } = await import("~/lib/ai/subtitle.server");

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
    case "generate": {
      const [scriptData, storyboardData] = await Promise.all([
        getScriptWithSegments(projectId),
        getStoryboardWithScenes(projectId),
      ]);

      if (!scriptData || scriptData.segments.length === 0) {
        return {
          success: false,
          error: "스크립트가 없습니다. 먼저 스크립트를 생성해주세요.",
        };
      }

      const scenes =
        storyboardData?.segments.flatMap((seg) =>
          seg.scenes.map((scene) => ({
            scriptSegmentId: seg.scriptSegmentId,
            sceneNumber: scene.sceneNumber,
            description: scene.description,
            duration: scene.duration,
          }))
        ) ?? [];

      const generated = await generateSubtitles({
        segments: scriptData.segments.map((seg) => ({
          id: seg.id,
          type: seg.type,
          content: seg.content,
          duration: seg.duration,
          emotionalTone: seg.emotionalTone,
        })),
        scenes,
        language: "ko",
      });

      const session = await getActiveSession(projectId);

      await saveSubtitles({
        projectId,
        sessionId: session?.id,
        subtitles: generated.map((sub, index) => ({
          scriptSegmentId: sub.scriptSegmentId,
          orderIndex: index,
          startTime: sub.startTime,
          endTime: sub.endTime,
          text: sub.text,
        })),
      });

      return { success: true, message: "자막이 생성되었습니다." };
    }

    case "save": {
      const subtitlesJson = formData.get("subtitles") as string;
      const subs = JSON.parse(subtitlesJson) as SubtitleSegment[];
      const session = await getActiveSession(projectId);

      await saveSubtitles({
        projectId,
        sessionId: session?.id,
        subtitles: subs.map((sub, index) => ({
          scriptSegmentId: sub.scriptSegmentId,
          orderIndex: index,
          startTime: sub.startTime,
          endTime: sub.endTime,
          text: sub.text,
        })),
      });

      return { success: true, message: "자막이 저장되었습니다." };
    }

    case "delete": {
      const subtitleId = formData.get("subtitleId") as string;
      await deleteSubtitleFromDB(subtitleId);
      return { success: true, message: "자막이 삭제되었습니다." };
    }

    case "add": {
      const startTime = parseFloat(formData.get("startTime") as string);
      const endTime = parseFloat(formData.get("endTime") as string);
      const text = (formData.get("text") as string) || "새 자막";
      const session = await getActiveSession(projectId);

      const newId = await addSubtitle({
        projectId,
        sessionId: session?.id,
        orderIndex: 0,
        startTime,
        endTime,
        text,
      });

      return {
        success: true,
        message: "자막이 추가되었습니다.",
        subtitleId: newId,
      };
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
    ? `${data.project.title} - 자막 편집기 | TubeGAI`
    : "자막 편집기 | TubeGAI";
  return [
    { title },
    { name: "description", content: "AI 기반 자막 생성 및 편집" },
  ];
}

// =============================================================================
// SRT Export Utility
// =============================================================================

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}

function generateSRT(subtitles: SubtitleSegment[]): string {
  return subtitles
    .sort((a, b) => a.startTime - b.startTime)
    .map(
      (sub, index) =>
        `${index + 1}\n${formatSRTTime(sub.startTime)} --> ${formatSRTTime(sub.endTime)}\n${sub.text}\n`
    )
    .join("\n");
}

// =============================================================================
// Display Time Formatter
// =============================================================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
}

// =============================================================================
// Component
// =============================================================================

export default function StudioSubtitlesPage({
  loaderData,
}: Route.ComponentProps) {
  const { projectId } = useParams();
  const {
    project,
    subtitles: initialSubtitles,
    scriptSegments,
    totalDuration,
  } = loaderData;

  // State
  const [subtitles, setSubtitles] =
    useState<SubtitleSegment[]>(initialSubtitles);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const fetcher = useFetcher();
  const isGenerating =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("intent") === "generate";
  const isSaving =
    fetcher.state !== "idle" && fetcher.formData?.get("intent") === "save";

  const timelineDuration = totalDuration || 60;

  // Sync from loader when data changes (e.g., after generation)
  useEffect(() => {
    setSubtitles(initialSubtitles);
    setHasChanges(false);
  }, [initialSubtitles]);

  // Handle fetcher responses
  useEffect(() => {
    if (fetcher.data?.success && fetcher.data?.message) {
      toast.success(fetcher.data.message);
      setHasChanges(false);
    } else if (fetcher.data && !fetcher.data.success && fetcher.data?.error) {
      toast.error(fetcher.data.error);
    }
  }, [fetcher.data]);

  // Playback timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= timelineDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timelineDuration]);

  // Project selector when no projectId
  if (!projectId) {
    return (
      <StudioProjectSelector
        title="자막 편집기"
        description="AI로 자막을 자동 생성하고 편집할 수 있습니다."
        context="subtitles"
      />
    );
  }

  // --- Handlers ---

  const handleGenerate = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "generate");
    fetcher.submit(formData, { method: "post" });
  }, [fetcher]);

  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "save");
    formData.append("subtitles", JSON.stringify(subtitles));
    fetcher.submit(formData, { method: "post" });
  }, [fetcher, subtitles]);

  const handleAddSubtitle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "add");
    formData.append("startTime", currentTime.toFixed(1));
    formData.append("endTime", (currentTime + 3).toFixed(1));
    formData.append("text", "새 자막");
    fetcher.submit(formData, { method: "post" });
  }, [fetcher, currentTime]);

  const handleDeleteSubtitle = useCallback(
    (id: string) => {
      // Optimistic update
      setSubtitles((prev) => prev.filter((s) => s.id !== id));
      setHasChanges(true);

      const formData = new FormData();
      formData.append("intent", "delete");
      formData.append("subtitleId", id);
      fetcher.submit(formData, { method: "post" });
    },
    [fetcher]
  );

  const handleTextChange = useCallback((id: string, newText: string) => {
    setSubtitles((prev) =>
      prev.map((s) => (s.id === id ? { ...s, text: newText } : s))
    );
    setHasChanges(true);
  }, []);

  const handleTimeChange = useCallback(
    (id: string, field: "startTime" | "endTime", value: number) => {
      setSubtitles((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
      );
      setHasChanges(true);
    },
    []
  );

  const handleExportSRT = useCallback(() => {
    const srt = generateSRT(subtitles);
    const blob = new Blob([srt], { type: "text/srt;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.title ?? "subtitles"}.srt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("SRT 파일이 다운로드되었습니다.");
  }, [subtitles, project?.title]);

  const filteredSubtitles = subtitles.filter((s) =>
    s.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSubtitle = subtitles.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  const hasScript = scriptSegments.length > 0;

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Captions className="h-5 w-5" />
            <span>자막 편집기</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          {hasScript ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md transition-all hover:scale-105"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-2" />
                      AI 자막 생성
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>AI 자막을 생성하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    스크립트와 스토리보드 정보를 기반으로 자막을 자동
                    생성합니다.
                    {subtitles.length > 0 &&
                      " 기존 자막은 새로 생성된 자막으로 대체됩니다."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleGenerate}>
                    생성하기
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>스크립트를 먼저 생성해주세요</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddSubtitle}
            disabled={fetcher.state !== "idle"}
          >
            <Plus className="h-3 w-3 mr-1" /> 자막 추가
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportSRT}
            disabled={subtitles.length === 0}
          >
            <Download className="h-4 w-4 mr-2" /> SRT 내보내기
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            저장
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Subtitle List Editor */}
        <div className="w-96 border-r flex flex-col bg-muted/10 shrink-0">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="자막 검색..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {filteredSubtitles.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  {subtitles.length === 0
                    ? "자막이 없습니다. 'AI 자막 생성'을 클릭하세요."
                    : "검색 결과가 없습니다."}
                </div>
              ) : (
                filteredSubtitles.map((sub, index) => (
                  <div
                    key={sub.id}
                    className={cn(
                      "group p-3 border-b hover:bg-muted/50 transition-colors flex gap-3 items-start",
                      selectedSubtitleId === sub.id
                        ? "bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary"
                        : "border-l-4 border-l-transparent"
                    )}
                    onClick={() => {
                      setSelectedSubtitleId(sub.id);
                      setCurrentTime(sub.startTime);
                    }}
                  >
                    <div className="text-xs font-mono text-muted-foreground pt-1.5 w-8 shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      {/* Segment context badge */}
                      {sub.scriptSegmentType && (
                        <Badge variant="outline" className="text-xs">
                          {SEGMENT_TYPE_LABEL[sub.scriptSegmentType] ??
                            sub.scriptSegmentType}
                        </Badge>
                      )}
                      {/* Time inputs */}
                      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={sub.startTime}
                          onChange={(e) =>
                            handleTimeChange(
                              sub.id,
                              "startTime",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-6 w-16 text-xs px-1 font-mono"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>-</span>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={sub.endTime}
                          onChange={(e) =>
                            handleTimeChange(
                              sub.id,
                              "endTime",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-6 w-16 text-xs px-1 font-mono"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {/* Text editor */}
                      <Textarea
                        value={sub.text}
                        onChange={(e) => handleTextChange(sub.id, e.target.value)}
                        className="min-h-15 resize-none text-sm bg-background/50 focus:bg-background"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSubtitle(sub.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          {/* Summary */}
          {subtitles.length > 0 && (
            <div className="p-3 border-t text-xs text-muted-foreground flex justify-between">
              <span>총 {subtitles.length}개 자막</span>
              {hasChanges && (
                <span className="text-amber-500">저장되지 않은 변경사항</span>
              )}
            </div>
          )}
        </div>

        {/* Right: Preview & Timeline */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
          {/* Preview Player */}
          <div className="flex-1 flex flex-col items-center justify-center relative p-8">
            <div className="relative aspect-video w-full max-w-4xl bg-black border border-zinc-800 rounded-lg shadow-2xl flex items-center justify-center overflow-hidden">
              <p className="text-zinc-600 font-medium select-none">
                비디오 미리보기
              </p>

              {/* Overlay Subtitle */}
              <div className="absolute bottom-10 left-0 right-0 px-8 text-center pointer-events-none">
                {activeSubtitle && (
                  <span className="inline-block bg-black/70 text-white px-4 py-2 rounded text-lg font-medium shadow-lg backdrop-blur-sm">
                    {activeSubtitle.text}
                  </span>
                )}
              </div>

              {/* Player Controls (Overlay) */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() =>
                    setCurrentTime(Math.max(0, currentTime - 5))
                  }
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-12 w-12"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8 ml-1" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() =>
                    setCurrentTime(
                      Math.min(timelineDuration, currentTime + 5)
                    )
                  }
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mini Timeline */}
          <div className="h-48 border-t border-zinc-800 bg-zinc-900 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-zinc-400">
                타임라인 동기화
              </span>
              <span className="text-xs font-mono text-zinc-500">
                {formatTime(currentTime)} / {formatTime(timelineDuration)}
              </span>
            </div>

            <div
              className="flex-1 relative bg-zinc-950 rounded border border-zinc-800 overflow-hidden cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const ratio = x / rect.width;
                setCurrentTime(ratio * timelineDuration);
              }}
            >
              {/* Waveform Mock Background */}
              <div className="absolute inset-0 flex items-center opacity-20 pointer-events-none px-2 space-x-0.5">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-primary flex-1 rounded-full"
                    style={{
                      height: `${20 + ((Math.sin(i * 0.3) + 1) / 2) * 60}%`,
                    }}
                  />
                ))}
              </div>

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
                style={{
                  left: `${(currentTime / timelineDuration) * 100}%`,
                }}
              >
                <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
              </div>

              {/* Subtitle Blocks */}
              {subtitles.map((sub) => (
                <div
                  key={sub.id}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-16 rounded cursor-pointer border hover:brightness-110 transition-all flex items-center px-2 overflow-hidden z-10",
                    selectedSubtitleId === sub.id
                      ? "bg-primary text-primary-foreground border-primary-foreground/20 ring-2 ring-white"
                      : "bg-zinc-800 text-zinc-300 border-zinc-700"
                  )}
                  style={{
                    left: `${(sub.startTime / timelineDuration) * 100}%`,
                    width: `${Math.max(((sub.endTime - sub.startTime) / timelineDuration) * 100, 1)}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSubtitleId(sub.id);
                    setCurrentTime(sub.startTime);
                  }}
                  title={sub.text}
                >
                  <span className="text-[10px] truncate select-none whitespace-nowrap">
                    {sub.text}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-center text-xs text-zinc-500">
              타임라인을 클릭하여 재생 위치를 이동할 수 있습니다
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
