import { MoreVertical, RefreshCw, Wand2, Image as ImageIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/common/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/common/components/ui/dropdown-menu";

export interface StoryboardScene {
  id: string;
  sceneNumber: number;
  description: string;
  visualPrompt: string;
  imageUrl?: string;
  duration: number; // in seconds
}

interface StoryboardSceneCardProps {
  scene: StoryboardScene;
  onRegenerateImage?: (id: string) => void;
  className?: string;
}

export function StoryboardSceneCard({
  scene,
  onRegenerateImage,
  className,
}: StoryboardSceneCardProps) {
  return (
    <Card className={cn("overflow-hidden flex flex-col h-full", className)}>
      <CardHeader className="p-3 pb-0">
        <div className="flex justify-between items-center">
          <div className="font-semibold text-sm text-muted-foreground">
            Scene {scene.sceneNumber}
          </div>
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
      </CardHeader>

      <CardContent className="p-3 flex-1 flex flex-col gap-3">
        {/* Image Placeholder */}
        <div className="aspect-video bg-muted rounded-md relative group/scene-image overflow-hidden border">
          {scene.imageUrl ? (
            <img
              src={scene.imageUrl}
              alt={`Scene ${scene.sceneNumber}`}
              className="w-full h-full object-cover transition-transform group-hover/scene-image:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-secondary/50">
              <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
              <span className="text-xs">No image generated</span>
            </div>
          )}

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/scene-image:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRegenerateImage?.(scene.id)}
              className="gap-2 transform translate-y-4 group-hover/scene-image:translate-y-0 transition-transform duration-300"
            >
              <RefreshCw className="h-3 w-3" />
              Re-Generate
            </Button>
          </div>

          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">
            {scene.duration}s
          </div>
        </div>

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
