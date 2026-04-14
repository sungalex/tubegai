import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useFetcher } from "react-router";
import {
  Scissors,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Layers,
  Music,
  Video,
  Trash2,
  Split,
  Save,
  Download,
  History,
  FileVideo,
  Loader2,
  GripVertical,
  Film,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/common/components/ui/button";
import { ScrollArea } from "~/common/components/ui/scroll-area";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";
import { Slider } from "~/common/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/common/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/common/components/ui/tooltip";
import { StudioProjectSelector } from "../components/studio-project-selector";
import { useTimeline } from "../hooks/use-timeline";
import { cn } from "~/lib/utils";
import type { RoughCutSegment, SceneVideo } from "~/common/types/studio.types";
import type { Route } from "./+types/studio-rough-cut-page";

// =============================================================================
// Loader
// =============================================================================

export async function loader({ params, request }: Route.LoaderArgs) {
  if (!params.projectId) {
    return {
      project: null,
      timeline: null,
      sceneSegments: [],
      versions: [],
    };
  }

  const { requireAuth } = await import("~/lib/auth.server");
  const { getProjectById } = await import("~/common/data/project.data.server");
  const {
    getOrCreateRoughCutTimeline,
    getSceneSegments,
    getRoughCutVersions,
  } = await import("~/common/data/studio.data.server");

  const userId = await requireAuth(request);
  const project = await getProjectById(params.projectId, userId);

  if (!project) {
    return {
      project: null,
      timeline: null,
      sceneSegments: [],
      versions: [],
    };
  }

  const [timeline, sceneSegments, versions] = await Promise.all([
    getOrCreateRoughCutTimeline(params.projectId),
    getSceneSegments(params.projectId),
    getRoughCutVersions(params.projectId),
  ]);

  return {
    project: { id: project.id, title: project.title },
    timeline,
    sceneSegments,
    versions,
  };
}

// =============================================================================
// Action
// =============================================================================

export async function action({ request, params }: Route.ActionArgs) {
  const { requireAuth } = await import("~/lib/auth.server");
  const { getProjectById } = await import("~/common/data/project.data.server");
  const {
    getOrCreateRoughCutTimeline,
    saveRoughCutSegments,
    updateRoughCutTimelineMeta,
    getSceneSegments,
  } = await import("~/common/data/studio.data.server");

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
    case "auto-assemble": {
      const timeline = await getOrCreateRoughCutTimeline(projectId);
      const sceneSegments = await getSceneSegments(projectId);

      // Flatten completed scenes
      const completedScenes = sceneSegments
        .flatMap((seg) => seg.scenes)
        .filter((s) => s.status === "completed" && s.videoUrl)
        .sort((a, b) => a.sceneNumber - b.sceneNumber);

      let cursor = 0;
      const segments = completedScenes.map((scene) => {
        const seg = {
          trackId: "V1",
          type: "video" as const,
          resourceType: "scene" as const,
          resourceId: scene.sceneId,
          startTime: cursor,
          duration: scene.duration,
          trimStart: 0,
          playbackSpeed: 1,
          volume: 1,
          zIndex: 0,
        };
        cursor += scene.duration;
        return seg;
      });

      await saveRoughCutSegments({ timelineId: timeline.id, segments });
      return { success: true };
    }

    case "save": {
      const timeline = await getOrCreateRoughCutTimeline(projectId);
      const segmentsJson = formData.get("segments") as string;

      try {
        const segments = JSON.parse(segmentsJson);
        await saveRoughCutSegments({ timelineId: timeline.id, segments });

        const zoomScale = formData.get("zoomScale");
        const playheadPosition = formData.get("playheadPosition");
        if (zoomScale || playheadPosition) {
          await updateRoughCutTimelineMeta(timeline.id, {
            zoomScale: zoomScale ? Number(zoomScale) : undefined,
            playheadPosition: playheadPosition
              ? Number(playheadPosition)
              : undefined,
          });
        }
      } catch {
        return { success: false, error: "잘못된 세그먼트 데이터입니다." };
      }

      return { success: true };
    }

    default:
      return { success: false, error: "알 수 없는 작업입니다." };
  }
}

// =============================================================================
// Meta
// =============================================================================

export const meta = () => {
  return [
    { title: "Rough Cut | TubeGAI" },
    {
      name: "description",
      content: "씬 비디오를 타임라인에 배치하여 러프컷을 만드세요.",
    },
  ];
};

// =============================================================================
// Component
// =============================================================================

export default function StudioRoughCutPage({
  loaderData,
}: Route.ComponentProps) {
  const { project, timeline, sceneSegments, versions } = loaderData;

  if (!project || !timeline) {
    return (
      <StudioProjectSelector
        title="Rough Cut"
        description="씬 비디오를 타임라인에 배치하여 러프컷을 만드세요."
        context="roughcut"
      />
    );
  }

  return (
    <RoughCutEditor
      project={project}
      timeline={timeline}
      sceneSegments={sceneSegments}
      versions={versions}
    />
  );
}

// =============================================================================
// Editor Component
// =============================================================================

interface EditorProps {
  project: { id: string; title: string };
  timeline: {
    id: string;
    projectId: string;
    zoomScale: number;
    playheadPosition: number;
    segments: RoughCutSegment[];
  };
  sceneSegments: Array<{
    id: string;
    order: number;
    content: string;
    scenes: SceneVideo[];
  }>;
  versions: Array<{
    id: string;
    name: string;
    versionNumber: number;
    duration: number | null;
    videoUrl: string | null;
    createdAt: string | null;
  }>;
}

function RoughCutEditor({
  project,
  timeline: initialTimeline,
  sceneSegments,
  versions,
}: EditorProps) {
  const fetcher = useFetcher();
  const isSaving = fetcher.state !== "idle";

  // --- Render state ---
  const [renderState, setRenderState] = useState<{
    isRendering: boolean;
    percent: number;
    message: string;
  }>({ isRendering: false, percent: 0, message: "" });

  const tl = useTimeline({
    initialSegments: initialTimeline.segments,
    initialMeta: {
      zoomScale: initialTimeline.zoomScale,
      playheadPosition: initialTimeline.playheadPosition,
    },
  });

  // All completed scenes for the clip bin
  const completedScenes = sceneSegments
    .flatMap((seg) => seg.scenes)
    .filter((s) => s.status === "completed" && s.videoUrl);

  // --- Handlers ---

  const handleAutoAssemble = () => {
    tl.autoAssemble(completedScenes);
    // Also persist to DB
    fetcher.submit(
      { intent: "auto-assemble" },
      { method: "post" },
    );
    toast.success("자동 배치 완료", {
      description: "모든 씬이 타임라인에 배치되었습니다.",
    });
  };

  const handleSave = () => {
    const segments = tl.toSavePayload();
    fetcher.submit(
      {
        intent: "save",
        segments: JSON.stringify(segments),
        zoomScale: String(tl.zoomScale),
        playheadPosition: String(tl.playheadPosition),
      },
      { method: "post" },
    );
    tl.resetDirty();
    toast.success("저장 완료");
  };

  const handleSplit = () => {
    if (!tl.selectedSegmentId) return;
    tl.splitClip(tl.selectedSegmentId, tl.playheadPosition);
    toast.success("클립 분할 완료");
  };

  const handleDelete = () => {
    if (!tl.selectedSegmentId) return;
    tl.removeClip(tl.selectedSegmentId);
    toast.success("클립 삭제 완료");
  };

  const handleRender = async () => {
    if (tl.videoSegments.length === 0) {
      toast.error("타임라인에 클립이 없습니다.");
      return;
    }

    // Save first if dirty
    if (tl.isDirty) {
      handleSave();
    }

    setRenderState({ isRendering: true, percent: 0, message: "렌더링 준비 중..." });

    try {
      const response = await fetch("/api/studio/render-rough-cut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });

      if (!response.ok || !response.body) {
        throw new Error("렌더링 요청에 실패했습니다.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const dataMatch = line.match(/^data:\s*(.+)$/m);
          if (!dataMatch) continue;

          let data: Record<string, unknown>;
          try {
            data = JSON.parse(dataMatch[1]);
          } catch {
            continue; // skip malformed JSON
          }

          switch (data.event) {
            case "start":
              setRenderState({
                isRendering: true,
                percent: 5,
                message: `${data.totalClips}개 클립 처리 시작...`,
              });
              break;
            case "progress":
              setRenderState({
                isRendering: true,
                percent: (data.percent as number) ?? 50,
                message: (data.message as string) ?? `${data.step} (${data.percent}%)`,
              });
              break;
            case "complete":
              setRenderState({ isRendering: false, percent: 100, message: "" });
              toast.success("렌더링 완료!", {
                description: "버전 기록에서 다운로드할 수 있습니다.",
              });
              // Reload to get new version
              window.location.reload();
              return;
            case "error":
              throw new Error(data.message as string);
          }
        }
      }
    } catch (error) {
      setRenderState({ isRendering: false, percent: 0, message: "" });
      toast.error("렌더링 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    }
  };

  // Check if split is possible
  const selectedSeg = tl.segments.find(
    (s) => s.id === tl.selectedSegmentId,
  );
  const canSplit =
    selectedSeg &&
    tl.playheadPosition > selectedSeg.startTime + 0.1 &&
    tl.playheadPosition < selectedSeg.startTime + selectedSeg.duration - 0.1;

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">
      {/* Toolbar */}
      <RoughCutToolbar
        onAutoAssemble={handleAutoAssemble}
        onSave={handleSave}
        onSplit={handleSplit}
        onDelete={handleDelete}
        onRender={handleRender}
        canSplit={!!canSplit}
        canDelete={!!tl.selectedSegmentId}
        canRender={tl.videoSegments.length > 0 && !renderState.isRendering}
        isSaving={isSaving}
        isDirty={tl.isDirty}
        hasScenes={completedScenes.length > 0}
        versions={versions}
        renderState={renderState}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Clip Bin */}
        <ClipBinPanel
          scenes={completedScenes}
          onAddClip={(scene) =>
            tl.addClip({
              resourceId: scene.sceneId,
              resourceType: "scene",
              publicUrl: scene.videoUrl,
              thumbnailUrl: scene.thumbnailUrl,
              duration: scene.duration,
              label: `씬 ${scene.sceneNumber}`,
            })
          }
        />

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Preview Player */}
          <PreviewPlayer
            segments={tl.videoSegments}
            playheadPosition={tl.playheadPosition}
            isPlaying={tl.isPlaying}
            totalDuration={tl.totalDuration}
            onPlay={tl.play}
            onPause={tl.pause}
            onSeek={tl.seekTo}
            getActiveClipAtTime={tl.getActiveClipAtTime}
          />

          {/* Timeline */}
          <TimelinePanel
            segments={tl.videoSegments}
            playheadPosition={tl.playheadPosition}
            pixelsPerSecond={tl.pixelsPerSecond}
            zoomScale={tl.zoomScale}
            totalDuration={tl.totalDuration}
            selectedSegmentId={tl.selectedSegmentId}
            onSelectSegment={tl.setSelectedSegmentId}
            onSeek={tl.seekTo}
            onSetZoom={tl.setZoomScale}
            onReorder={tl.reorderClips}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Toolbar
// =============================================================================

function RoughCutToolbar({
  onAutoAssemble,
  onSave,
  onSplit,
  onDelete,
  onRender,
  canSplit,
  canDelete,
  canRender,
  isSaving,
  isDirty,
  hasScenes,
  versions,
  renderState,
}: {
  onAutoAssemble: () => void;
  onSave: () => void;
  onSplit: () => void;
  onDelete: () => void;
  onRender: () => void;
  canSplit: boolean;
  canDelete: boolean;
  canRender: boolean;
  isSaving: boolean;
  isDirty: boolean;
  hasScenes: boolean;
  versions: EditorProps["versions"];
  renderState: { isRendering: boolean; percent: number; message: string };
}) {
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="h-12 border-b flex items-center justify-between px-4 bg-background z-10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-primary font-bold text-sm">
          <Scissors className="h-4 w-4" />
          <span>Rough Cut</span>
        </div>
        <Separator orientation="vertical" className="h-5" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={onAutoAssemble}
                disabled={!hasScenes}
              >
                <Layers className="h-3 w-3 mr-1" />
                자동 배치
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              완성된 씬 비디오를 순서대로 타임라인에 배치합니다
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onSplit}
          disabled={!canSplit}
        >
          <Split className="h-3 w-3 mr-1 rotate-90" />
          분할
        </Button>

        <Button
          variant="destructive"
          size="sm"
          className="h-7 text-xs"
          onClick={onDelete}
          disabled={!canDelete}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          삭제
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onSave}
          disabled={isSaving || !isDirty}
        >
          {isSaving ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Save className="h-3 w-3 mr-1" />
          )}
          {isSaving ? "저장 중..." : "저장"}
        </Button>

        <Button
          variant="default"
          size="sm"
          className="h-7 text-xs"
          onClick={onRender}
          disabled={!canRender}
        >
          {renderState.isRendering ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Film className="h-3 w-3 mr-1" />
          )}
          {renderState.isRendering
            ? `렌더링 ${renderState.percent}%`
            : "렌더링"}
        </Button>

        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              <History className="h-3 w-3 mr-1" />
              버전 ({versions.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>버전 기록</DialogTitle>
              <DialogDescription>
                렌더링된 러프컷 버전 목록입니다.
              </DialogDescription>
            </DialogHeader>
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                아직 렌더링된 버전이 없습니다.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-2 rounded border bg-muted/5"
                  >
                    <div className="flex items-center gap-2">
                      <FileVideo className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-xs font-medium">{v.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {v.createdAt
                            ? new Date(v.createdAt).toLocaleDateString("ko")
                            : ""}
                          {v.duration ? ` · ${Math.round(v.duration)}초` : ""}
                        </p>
                      </div>
                    </div>
                    {v.videoUrl && (
                      <a
                        href={v.videoUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// =============================================================================
// Clip Bin Panel
// =============================================================================

function ClipBinPanel({
  scenes,
  onAddClip,
}: {
  scenes: SceneVideo[];
  onAddClip: (scene: SceneVideo) => void;
}) {
  const handleDragStart = (e: React.DragEvent, scene: SceneVideo) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ ...scene, _source: "clip-bin" }),
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="w-56 border-r flex flex-col bg-muted/5 shrink-0">
      <div className="p-3 border-b text-xs font-semibold uppercase text-muted-foreground">
        클립 목록
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {scenes.length === 0 ? (
            <p className="text-xs text-muted-foreground p-2 text-center">
              완성된 씬 비디오가 없습니다.
              <br />
              먼저 씬 비디오를 생성해주세요.
            </p>
          ) : (
            scenes.map((scene) => (
              <div
                key={scene.sceneId}
                className="group flex items-center gap-2 p-1.5 rounded border bg-card hover:border-primary cursor-grab active:cursor-grabbing transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, scene)}
                onClick={() => onAddClip(scene)}
              >
                {/* Thumbnail */}
                <div className="h-10 w-16 bg-black/10 rounded overflow-hidden shrink-0">
                  {scene.thumbnailUrl ? (
                    <img
                      src={scene.thumbnailUrl}
                      alt={`씬 ${scene.sceneNumber}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 h-3.5"
                    >
                      씬 {scene.sceneNumber}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {scene.duration}초
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// =============================================================================
// Preview Player
// =============================================================================

function PreviewPlayer({
  segments,
  playheadPosition,
  isPlaying,
  totalDuration,
  onPlay,
  onPause,
  onSeek,
  getActiveClipAtTime,
}: {
  segments: RoughCutSegment[];
  playheadPosition: number;
  isPlaying: boolean;
  totalDuration: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  getActiveClipAtTime: (time: number) => RoughCutSegment | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentClipRef = useRef<string | null>(null);

  const activeClip = getActiveClipAtTime(playheadPosition);

  // Sync video with playhead
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeClip?.publicUrl) return;

    // If clip changed, update src
    if (currentClipRef.current !== activeClip.id) {
      currentClipRef.current = activeClip.id;
      video.src = activeClip.publicUrl;
      const localTime = playheadPosition - activeClip.startTime + activeClip.trimStart;
      video.currentTime = localTime;
      if (isPlaying) {
        video.play().catch(() => {});
      }
    } else if (!isPlaying) {
      // Just seek within same clip
      const localTime = playheadPosition - activeClip.startTime + activeClip.trimStart;
      if (Math.abs(video.currentTime - localTime) > 0.3) {
        video.currentTime = localTime;
      }
    }
  }, [activeClip, playheadPosition, isPlaying]);

  // Play/pause sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 bg-black flex flex-col items-center justify-center relative min-h-56">
      <div className="relative aspect-video max-h-[85%] w-[85%] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden">
        {activeClip?.publicUrl ? (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls={false}
            preload="metadata"
            poster={activeClip.thumbnailUrl}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
            {segments.length === 0
              ? "클립을 추가하여 시작하세요"
              : "미리보기"}
          </div>
        )}

        {/* Playback Controls */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-4 text-white">
          <SkipBack
            className="h-3.5 w-3.5 cursor-pointer hover:text-primary transition-colors"
            onClick={() => onSeek(0)}
          />
          {isPlaying ? (
            <Pause
              className="h-5 w-5 cursor-pointer hover:text-primary transition-colors"
              onClick={onPause}
            />
          ) : (
            <Play
              className="h-5 w-5 cursor-pointer hover:text-primary transition-colors"
              onClick={onPlay}
            />
          )}
          <SkipForward
            className="h-3.5 w-3.5 cursor-pointer hover:text-primary transition-colors"
            onClick={() => onSeek(totalDuration)}
          />
        </div>

        {/* Timecode */}
        <div className="absolute top-3 right-3 font-mono text-xs text-white bg-black/60 px-2 py-1 rounded">
          {formatTime(playheadPosition)} / {formatTime(totalDuration)}
        </div>

        {/* Active clip label */}
        {activeClip?.label && (
          <div className="absolute top-3 left-3 text-[10px] text-white bg-blue-600/80 px-2 py-0.5 rounded">
            {activeClip.label}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Timeline Panel
// =============================================================================

function TimelinePanel({
  segments,
  playheadPosition,
  pixelsPerSecond,
  zoomScale,
  totalDuration,
  selectedSegmentId,
  onSelectSegment,
  onSeek,
  onSetZoom,
  onReorder,
}: {
  segments: RoughCutSegment[];
  playheadPosition: number;
  pixelsPerSecond: number;
  zoomScale: number;
  totalDuration: number;
  selectedSegmentId: string | null;
  onSelectSegment: (id: string | null) => void;
  onSeek: (time: number) => void;
  onSetZoom: (scale: number) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const trackHeaderWidth = 48;

  const timelineWidth = Math.max(
    600,
    totalDuration * pixelsPerSecond + 200,
  );

  // --- Playhead Dragging ---

  const updatePlayhead = useCallback(
    (clientX: number) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const scrollLeft = timelineRef.current.scrollLeft;
      const offsetX = clientX - rect.left + scrollLeft - trackHeaderWidth;
      const newTime = Math.max(0, Math.min(offsetX / pixelsPerSecond, totalDuration));
      onSeek(newTime);
    },
    [pixelsPerSecond, totalDuration, onSeek],
  );

  useEffect(() => {
    if (!isDraggingPlayhead) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updatePlayhead(e.clientX);
    };
    const handleMouseUp = () => setIsDraggingPlayhead(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingPlayhead, updatePlayhead]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (isDraggingPlayhead) return;
    updatePlayhead(e.clientX);
  };

  // --- Drag & Drop for reordering ---

  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);

  const handleSegmentDragStart = (
    e: React.DragEvent,
    index: number,
  ) => {
    setDragFromIndex(index);
    e.dataTransfer.setData("application/x-timeline-segment", String(index));
    e.dataTransfer.effectAllowed = "move";
    // Set drag image
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
    }
  };

  const handleSegmentDragEnd = () => {
    setDragFromIndex(null);
  };

  const handleTrackDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if it's a timeline segment reorder
    const segmentData = e.dataTransfer.getData("application/x-timeline-segment");
    if (segmentData !== "") {
      const fromIndex = Number(segmentData);
      if (isNaN(fromIndex)) return;

      // Calculate drop position
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const dropTime = offsetX / pixelsPerSecond;

      // Find target index based on drop position
      let toIndex = segments.length;
      for (let i = 0; i < segments.length; i++) {
        const midpoint = segments[i].startTime + segments[i].duration / 2;
        if (dropTime < midpoint) {
          toIndex = i;
          break;
        }
      }

      // Adjust toIndex for same-direction moves
      const adjustedTo = toIndex > fromIndex ? toIndex - 1 : toIndex;
      if (fromIndex !== adjustedTo) {
        onReorder(fromIndex, adjustedTo);
      }
      setDragFromIndex(null);
      return;
    }

    // Otherwise it might be from clip bin (no-op here, handled by ClipBinPanel onClick)
  };

  // --- Time Ruler ---

  const rulerMarks = useMemo(() => {
    const marks: Array<{ time: number; label: string }> = [];
    // Determine interval based on zoom
    let interval = 1;
    if (pixelsPerSecond < 20) interval = 10;
    else if (pixelsPerSecond < 40) interval = 5;
    else if (pixelsPerSecond < 80) interval = 2;

    const maxTime = Math.max(totalDuration + 10, 30);
    for (let t = 0; t <= maxTime; t += interval) {
      const mins = Math.floor(t / 60);
      const secs = t % 60;
      marks.push({
        time: t,
        label: `${mins}:${secs.toString().padStart(2, "0")}`,
      });
    }
    return marks;
  }, [totalDuration, pixelsPerSecond]);

  return (
    <div className="h-56 bg-zinc-900 border-t flex flex-col shrink-0">
      {/* Time Ruler + Zoom */}
      <div className="h-7 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-2 shrink-0">
        <div
          className="flex items-center overflow-hidden"
          style={{ paddingLeft: trackHeaderWidth }}
        >
          {rulerMarks.slice(0, 20).map((mark) => (
            <span
              key={mark.time}
              className="text-[10px] text-zinc-500 font-mono shrink-0"
              style={{
                width: mark.time === 0 ? "auto" : undefined,
                marginLeft:
                  mark.time === 0
                    ? 0
                    : `${(rulerMarks[1]?.time ?? 1) * pixelsPerSecond - 30}px`,
              }}
            >
              {mark.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-[10px] text-zinc-500">줌</span>
          <Slider
            defaultValue={[zoomScale]}
            max={100}
            min={10}
            step={1}
            className="w-20"
            onValueChange={(v) => onSetZoom(v[0])}
          />
        </div>
      </div>

      {/* Tracks */}
      <div
        className="flex-1 overflow-x-auto overflow-y-hidden relative"
        ref={timelineRef}
        onClick={handleTimelineClick}
        style={{ cursor: "crosshair" }}
      >
        <div
          className="min-w-full h-full flex flex-col relative"
          style={{ width: `${timelineWidth}px` }}
        >
          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-px bg-red-500 z-50 pointer-events-auto"
            style={{
              left: `${playheadPosition * pixelsPerSecond + trackHeaderWidth}px`,
            }}
          >
            <div
              className="absolute -top-0.5 -translate-x-1/2 w-3 h-3 bg-red-500 cursor-ew-resize"
              style={{
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingPlayhead(true);
              }}
            />
            {/* Wider hit area */}
            <div
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-3 bg-transparent cursor-ew-resize"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingPlayhead(true);
              }}
            />
          </div>

          {/* V1 Track */}
          <div className="h-24 border-b border-zinc-800 flex relative bg-zinc-900/50">
            <div className="w-12 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center text-[10px] text-zinc-500 font-bold sticky left-0 z-20">
              V1
              <Video className="h-3 w-3 mt-0.5 opacity-50" />
            </div>
            <div
              className="flex-1 relative py-1.5"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect =
                  e.dataTransfer.types.includes("application/x-timeline-segment")
                    ? "move"
                    : "copy";
              }}
              onDrop={handleTrackDrop}
            >
              {segments.map((seg, idx) => (
                <div
                  key={seg.id}
                  draggable
                  onDragStart={(e) => handleSegmentDragStart(e, idx)}
                  onDragEnd={handleSegmentDragEnd}
                  className={cn(
                    "absolute top-1.5 bottom-1.5 rounded border overflow-hidden cursor-grab active:cursor-grabbing transition-all flex items-center px-1.5 gap-1",
                    "bg-blue-600/80 border-blue-400/30 hover:brightness-110 text-white",
                    selectedSegmentId === seg.id &&
                      "ring-2 ring-white z-20 brightness-110",
                    dragFromIndex === idx && "opacity-40",
                  )}
                  style={{
                    left: `${seg.startTime * pixelsPerSecond}px`,
                    width: `${Math.max(seg.duration * pixelsPerSecond, 4)}px`,
                    zIndex: selectedSegmentId === seg.id ? 30 : 10,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSegment(
                      seg.id === selectedSegmentId ? null : seg.id,
                    );
                    onSeek(seg.startTime);
                  }}
                >
                  {/* Thumbnail strip */}
                  {seg.thumbnailUrl && seg.duration * pixelsPerSecond > 30 && (
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage: `url(${seg.thumbnailUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  )}

                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-1 min-w-0">
                    <GripVertical className="h-3 w-3 opacity-50 shrink-0" />
                    {seg.duration * pixelsPerSecond > 50 && (
                      <span className="text-[10px] font-medium truncate">
                        {seg.label}
                      </span>
                    )}
                    {seg.duration * pixelsPerSecond > 80 && (
                      <span className="text-[9px] opacity-70">
                        {Math.round(seg.duration)}초
                      </span>
                    )}
                  </div>

                  {/* Trim handles (visible on selection) */}
                  {selectedSegmentId === seg.id && (
                    <>
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/30 hover:bg-white/50 cursor-col-resize z-20" />
                      <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/30 hover:bg-white/50 cursor-col-resize z-20" />
                    </>
                  )}
                </div>
              ))}

              {/* Empty state */}
              {segments.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
                  클립을 드래그하여 추가하세요
                </div>
              )}
            </div>
          </div>

          {/* A1 Track (placeholder) */}
          <div className="h-14 border-b border-zinc-800 flex relative bg-zinc-900/50">
            <div className="w-12 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center text-[10px] text-zinc-500 font-bold sticky left-0 z-20">
              A1
              <Music className="h-3 w-3 mt-0.5 opacity-50" />
            </div>
            <div className="flex-1 relative py-2 opacity-40">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-6 bg-emerald-900/20 border border-emerald-800/30 rounded mx-2 flex items-center justify-center text-[10px] text-emerald-600">
                오디오 트랙 (추후 지원)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
