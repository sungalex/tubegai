import { useState, useCallback } from "react";
import { Play, RefreshCw, Download, AlertCircle, Sparkles, Loader2, History, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Progress } from "~/common/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/common/components/ui/popover";
import type { SceneVideo } from "~/common/types/studio.types";

interface VideoHistoryItem {
  videoId: string;
  publicUrl: string;
  duration: number | null;
  createdAt: string;
  isCurrent: boolean;
}

interface SceneVideoCardProps {
  scene: SceneVideo;
  aspectRatio?: string;
  progress?: number; // 0-100, from SSE stream
  onRegenerate?: (sceneId: string) => void;
  onGenerate?: (sceneId: string) => void;
  onVideoSelected?: (sceneId: string, videoUrl: string) => void;
  className?: string;
}

function getAspectClass(ratio?: string): string {
  switch (ratio) {
    case "9:16": return "aspect-[9/16]";
    case "4:3": return "aspect-[4/3]";
    case "3:4": return "aspect-[3/4]";
    case "1:1": return "aspect-square";
    case "16:9":
    default: return "aspect-video";
  }
}

export function SceneVideoCard({
  scene,
  aspectRatio,
  progress,
  onRegenerate,
  onGenerate,
  onVideoSelected,
  className,
}: SceneVideoCardProps) {
  const aspectClass = getAspectClass(aspectRatio);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<VideoHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (historyLoading) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/studio/scene-video-history?sceneId=${scene.sceneId}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data.history ?? []);
      }
    } catch {
      toast.error("히스토리 로드 실패");
    } finally {
      setHistoryLoading(false);
    }
  }, [scene.sceneId, historyLoading]);

  const handleSelect = useCallback(async (videoId: string) => {
    setSelectingId(videoId);
    try {
      const res = await fetch("/api/studio/select-scene-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      if (res.ok) {
        const selected = historyItems.find(h => h.videoId === videoId);
        if (selected) {
          onVideoSelected?.(scene.sceneId, selected.publicUrl);
        }
        setHistoryOpen(false);
        toast.success("비디오가 변경되었습니다");
      }
    } catch {
      toast.error("비디오 선택 실패");
    } finally {
      setSelectingId(null);
    }
  }, [scene.sceneId, historyItems, onVideoSelected]);

  return (
    <Card className={cn("overflow-hidden flex flex-col h-full", className)}>
      <CardHeader className="p-3 pb-2 border-b bg-muted/5">
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 px-1.5 min-w-8 justify-center">
                #{scene.sceneNumber}
              </Badge>
              <h4 className="font-medium text-sm line-clamp-1">{scene.description}</h4>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                {scene.duration}s
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {scene.status === "completed" && (
              <>
                <Popover open={historyOpen} onOpenChange={(open) => {
                  setHistoryOpen(open);
                  if (open) loadHistory();
                }}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <History className="h-3 w-3" />
                      <span className="sr-only">히스토리</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 p-3">
                    <h4 className="text-xs font-semibold mb-2">비디오 히스토리</h4>
                    {historyLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : historyItems.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">히스토리가 없습니다.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {historyItems.map((item) => (
                          <div key={item.videoId} className="relative group/hist">
                            <div className={cn(
                              "aspect-video bg-black/5 rounded border overflow-hidden",
                              item.isCurrent && "ring-2 ring-primary"
                            )}>
                              <video
                                src={item.publicUrl}
                                className="w-full h-full object-cover"
                                preload="metadata"
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[8px] text-muted-foreground">
                                {new Date(item.createdAt).toLocaleDateString("ko")}
                                {item.duration ? ` · ${item.duration}s` : ""}
                              </span>
                              {item.isCurrent ? (
                                <Star className="h-3 w-3 text-primary fill-primary" />
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-4 text-[10px] px-1.5"
                                  onClick={() => handleSelect(item.videoId)}
                                  disabled={selectingId === item.videoId}
                                >
                                  {selectingId === item.videoId ? "..." : "선택"}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
                {onRegenerate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onRegenerate(scene.sceneId)}
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span className="sr-only">재생성</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3">
        {/* Video Player / Placeholder Area */}
        <div className={cn(aspectClass, "bg-black/5 rounded-md relative group/video overflow-hidden border")}>

          {scene.status === "completed" && scene.videoUrl ? (
            <div className="relative w-full h-full">
              <video
                src={scene.videoUrl}
                poster={scene.thumbnailUrl}
                className="w-full h-full object-cover"
                controls={false}
                preload="metadata"
                onClick={(e) => {
                  const video = e.currentTarget;
                  if (video.paused) video.play();
                  else video.pause();
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/video:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-[1px]">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/50 group-hover/video:scale-110 transition-transform shadow-xl">
                  <Play className="h-5 w-5 fill-white text-white ml-0.5" />
                </div>
              </div>

              {/* Download Button */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover/video:opacity-100 transition-opacity flex gap-1">
                <a href={scene.videoUrl} download target="_blank" rel="noreferrer">
                  <Button size="icon" variant="secondary" className="h-6 w-6">
                    <Download className="h-3 w-3" />
                  </Button>
                </a>
              </div>
            </div>
          ) : scene.status === "generating" ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
              <div className="space-y-2 text-center w-3/4">
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>생성 중...</span>
                  <span>{progress ?? 0}%</span>
                </div>
                <Progress value={progress ?? 0} className="h-1" />
              </div>
            </div>
          ) : scene.status === "failed" ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-destructive bg-destructive/5">
              <AlertCircle className="h-6 w-6 mb-2" />
              <span className="text-xs font-medium">생성 실패</span>
              {onRegenerate && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => onRegenerate(scene.sceneId)}
                >
                  재시도
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-secondary/50 gap-3">
              <VideoIconPlaceholder />
              {onGenerate ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => onGenerate(scene.sceneId)}
                >
                  <Sparkles className="h-3 w-3" /> 생성
                </Button>
              ) : (
                <span className="text-xs">대기 중</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function VideoIconPlaceholder() {
  return (
    <div className="relative">
      <div className="w-8 h-8 rounded border-2 border-dashed border-muted-foreground/30" />
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-muted-foreground/30 rounded-full" />
    </div>
  );
}
