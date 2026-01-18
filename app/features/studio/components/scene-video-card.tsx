import { Play, Pause, RefreshCw, Download, Scissors, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Progress } from "~/common/components/ui/progress";

export interface VideoPart {
  id: string;
  url?: string;
  duration: number;
  status: "pending" | "generating" | "completed" | "failed";
}

export interface SceneVideo {
  sceneId: string;
  sceneNumber: number;
  description: string;
  thumbnailUrl: string;
  totalDuration: number;
  parts: VideoPart[];
}

interface SceneVideoCardProps {
  scene: SceneVideo;
  onRegeneratePart: (sceneId: string, partId: string) => void;
  onGenerateScene?: (sceneId: string) => void;
  className?: string;
}

export function SceneVideoCard({
  scene,
  onRegeneratePart,
  onGenerateScene,
  className,
}: SceneVideoCardProps) {

  const isSplit = scene.parts.length > 1;

  return (
    <Card className={cn("overflow-hidden flex flex-col h-full", className)}>
      <CardHeader className="p-3 pb-2 border-b bg-muted/5">
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 px-1.5 min-w-[2rem] justify-center">
                #{scene.sceneNumber}
              </Badge>
              <h4 className="font-medium text-sm line-clamp-1">{scene.description}</h4>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                Total: {scene.totalDuration}s
              </span>
              {isSplit && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1 gap-1">
                  <Scissors className="h-3 w-3" /> Split into {scene.parts.length} parts
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 space-y-3">
        {scene.parts.map((part, index) => (
          <div key={part.id} className="space-y-2">

            {/* Part Header (Always shown) */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Part {index + 1} ({part.duration}s)</span>
              {part.status === "completed" && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRegeneratePart(scene.sceneId, part.id)}>
                  <RefreshCw className="h-3 w-3" />
                  <span className="sr-only">Re-Generate Part</span>
                </Button>
              )}
            </div>

            {/* Video Player / Placeholder Area */}
            <div className="aspect-video bg-black/5 rounded-md relative group/video overflow-hidden border">

              {part.status === "completed" && part.url ? (
                <div className="relative w-full h-full">
                  {/* Mock Video Player (Image with Overlay) */}
                  <img
                    src={scene.thumbnailUrl}
                    alt={`Video Part ${index + 1}`}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/video:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-[1px]">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/50 group-hover/video:scale-110 transition-transform shadow-xl">
                      <Play className="h-5 w-5 fill-white text-white ml-0.5" />
                    </div>
                  </div>

                  {/* Controls Overlay */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover/video:opacity-100 transition-opacity flex gap-1">
                    <Button size="icon" variant="secondary" className="h-6 w-6">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : part.status === "generating" ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
                  <div className="space-y-2 text-center w-3/4">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Generating...</span>
                      <span>{(Math.random() * 90).toFixed(0)}%</span>
                    </div>
                    <Progress value={45} className="h-1" />
                  </div>
                </div>
              ) : part.status === "failed" ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-destructive bg-destructive/5">
                  <AlertCircle className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium">Generation Failed</span>
                  <Button variant="link" size="sm" className="h-6 text-xs" onClick={() => onRegeneratePart(scene.sceneId, part.id)}>Retry</Button>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-secondary/50 gap-3">
                  <VideoIconWithOverlay />
                  {onGenerateScene ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => onGenerateScene(scene.sceneId)}
                    >
                      <Sparkles className="h-3 w-3" /> Generate
                    </Button>
                  ) : (
                    <span className="text-xs">Waiting to generate</span>
                  )}
                </div>
              )}
            </div>

          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function VideoIconWithOverlay() {
  return (
    <div className="relative">
      <div className="w-8 h-8 rounded border-2 border-dashed border-muted-foreground/30" />
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-muted-foreground/30 rounded-full" />
    </div>
  )
}
