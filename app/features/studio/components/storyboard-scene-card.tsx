import { useState, useCallback } from "react";
import { MoreVertical, RefreshCw, Image as ImageIcon, Loader2, History, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "~/common/components/ui/badge";
import { cn } from "~/lib/utils";
import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "~/common/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/common/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/common/components/ui/popover";

export interface StoryboardScene {
  id: string;
  sceneNumber: number;
  description: string;
  visualPrompt: string;
  imageUrl?: string;
  duration: number; // in seconds
  emotionalTone?: string;
  cameraAngle?: string;
  isGeneratingImage?: boolean;
}

interface ImageHistoryItem {
  assetId: string;
  publicUrl: string;
  createdAt: string;
  isCurrent: boolean;
}

interface StoryboardSceneCardProps {
  scene: StoryboardScene;
  aspectRatio?: string;
  isGenerating?: boolean;
  onRegenerateImage?: (id: string) => void;
  onImageSelected?: (sceneId: string, imageUrl: string) => void;
  className?: string;
}

function getAspectClass(ratio?: string): string {
  switch (ratio) {
    case "9:16": return "aspect-[9/16]";
    case "4:3": return "aspect-[4/3]";
    case "3:4": return "aspect-[3/4]";
    case "2.35:1": return "aspect-[2.35/1]";
    case "1:1": return "aspect-square";
    case "16:9":
    default: return "aspect-video";
  }
}

export function StoryboardSceneCard({
  scene,
  aspectRatio,
  isGenerating,
  onRegenerateImage,
  onImageSelected,
  className,
}: StoryboardSceneCardProps) {
  const aspectClass = getAspectClass(aspectRatio);
  const showLoading = scene.isGeneratingImage || isGenerating;
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<ImageHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (historyLoading) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/studio/storyboard-image-history?sceneId=${scene.id}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data.history ?? []);
      }
    } catch {
      toast.error("히스토리 로드 실패");
    } finally {
      setHistoryLoading(false);
    }
  }, [scene.id, historyLoading]);

  const handleSelect = useCallback(async (assetId: string) => {
    setSelectingId(assetId);
    try {
      const res = await fetch("/api/studio/select-storyboard-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneId: scene.id, assetId }),
      });
      if (res.ok) {
        const selected = historyItems.find(h => h.assetId === assetId);
        if (selected) {
          onImageSelected?.(scene.id, selected.publicUrl);
        }
        setHistoryOpen(false);
        toast.success("이미지가 변경되었습니다");
      }
    } catch {
      toast.error("이미지 선택 실패");
    } finally {
      setSelectingId(null);
    }
  }, [scene.id, historyItems, onImageSelected]);

  return (
    <Card className={cn("overflow-hidden flex flex-col h-full", className)}>
      <CardHeader className="p-3 pb-0">
        <div className="flex justify-between items-center">
          <div className="font-semibold text-sm text-muted-foreground">
            Scene {scene.sceneNumber}
          </div>
          <div className="flex items-center gap-1">
            {scene.imageUrl && (
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
                  <h4 className="text-xs font-semibold mb-2">이미지 히스토리</h4>
                  {historyLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : historyItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">히스토리가 없습니다.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {historyItems.map((item) => (
                        <div key={item.assetId} className="relative group/hist">
                          <img
                            src={item.publicUrl}
                            alt="히스토리"
                            className={cn(
                              "w-full aspect-square object-cover rounded border",
                              item.isCurrent && "ring-2 ring-primary"
                            )}
                          />
                          {item.isCurrent ? (
                            <Star className="absolute top-1 right-1 h-3 w-3 text-primary fill-primary" />
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="absolute inset-x-0 bottom-0 h-5 text-[10px] rounded-t-none opacity-0 group-hover/hist:opacity-100 transition-opacity"
                              onClick={() => handleSelect(item.assetId)}
                              disabled={selectingId === item.assetId}
                            >
                              {selectingId === item.assetId ? "..." : "선택"}
                            </Button>
                          )}
                          <span className="absolute top-1 left-1 text-[8px] bg-black/50 text-white px-1 rounded">
                            {new Date(item.createdAt).toLocaleDateString("ko")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-3 w-3" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit Description</DropdownMenuItem>
                <DropdownMenuItem>Regenerate Image</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Delete Scene</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 flex-1 flex flex-col gap-3">
        {/* Image Area */}
        <div className={cn(aspectClass, "bg-muted rounded-md relative group/scene-image overflow-hidden border")}>
          {showLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-secondary/50">
              <Loader2 className="h-8 w-8 mb-2 animate-spin text-primary" />
              <span className="text-xs">이미지 생성 중...</span>
            </div>
          ) : scene.imageUrl ? (
            <img
              src={scene.imageUrl}
              alt={`Scene ${scene.sceneNumber}`}
              className="w-full h-full object-cover transition-transform group-hover/scene-image:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-secondary/50">
              <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
              <span className="text-xs">이미지 미생성</span>
            </div>
          )}

          {!showLoading && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/scene-image:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onRegenerateImage?.(scene.id)}
                className="gap-2 transform translate-y-4 group-hover/scene-image:translate-y-0 transition-transform duration-300"
              >
                <RefreshCw className="h-3 w-3" />
                재생성
              </Button>
            </div>
          )}

          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">
            {scene.duration}s
          </div>
        </div>

        {/* Metadata badges */}
        {(scene.emotionalTone || scene.cameraAngle) && (
          <div className="flex flex-wrap gap-1">
            {scene.emotionalTone && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {scene.emotionalTone}
              </Badge>
            )}
            {scene.cameraAngle && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {scene.cameraAngle}
              </Badge>
            )}
          </div>
        )}

        {/* Text/Script */}
        <div className="space-y-2">
          <p className="text-sm font-medium line-clamp-2" title={scene.description}>
            {scene.description}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-3 bg-muted/50 p-2 rounded border border-transparent hover:border-border transition-colors cursor-text" title={scene.visualPrompt}>
            <span className="font-semibold text-[10px] uppercase tracking-wider block mb-0.5 text-muted-foreground/70">Visual Prompt</span>
            {scene.visualPrompt}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
