import { useCallback, useRef, useState } from "react";
import { useParams, useRevalidator } from "react-router";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "~/common/components/ui/button";
import { StudioProjectSelector } from "../components/studio-project-selector";
import { VideoGeneratorSidebar } from "../components/video-generator-sidebar";
import { SceneVideoCard, type SceneVideo, type VideoPart } from "../components/scene-video-card";
import { StoryboardGrid } from "../components/storyboard-grid";
import { getSceneSegments } from "~/common/data/studio.data.server";
import type { Route } from "./+types/studio-scene-page";
import type { SceneScriptSegment } from "~/common/types/studio.types";

export async function loader({ params }: Route.LoaderArgs) {
  if (!params.projectId) {
    return { segments: [] };
  }
  const segments = await getSceneSegments(params.projectId);
  return { segments };
}

export default function StudioScenePage({ loaderData }: Route.ComponentProps) {
  const { projectId } = useParams();
  const { segments: initialSegments } = loaderData;
  const revalidator = useRevalidator();

  const [segments, setSegments] = useState<SceneScriptSegment[]>(initialSegments);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle No Project
  if (!projectId) {
    return (
      <StudioProjectSelector
        title="씬 비디오 생성"
        description="스토리보드 씬을 역동적인 비디오 클립으로 변환하세요."
        context="scene"
      />
    );
  }

  // Helper to update a specific part status
  const updatePartStatus = useCallback(
    (sceneId: string, partId: string, status: VideoPart["status"], url?: string) => {
      setSegments(prev => prev.map(seg => ({
        ...seg,
        scenes: seg.scenes.map(scene => {
          if (scene.sceneId === sceneId) {
            return {
              ...scene,
              parts: scene.parts.map(part =>
                part.id === partId ? { ...part, status, url } : part,
              ),
            };
          }
          return scene;
        }),
      })));
    },
    [],
  );

  // Helper to update parts by part number within a scene
  const updatePartByNumber = useCallback(
    (sceneId: string, partNumber: number, status: VideoPart["status"], url?: string) => {
      setSegments(prev => prev.map(seg => ({
        ...seg,
        scenes: seg.scenes.map(scene => {
          if (scene.sceneId === sceneId) {
            return {
              ...scene,
              parts: scene.parts.map((part, idx) =>
                idx + 1 === partNumber ? { ...part, status, url } : part,
              ),
            };
          }
          return scene;
        }),
      })));
    },
    [],
  );

  // Generate video for a single scene via SSE
  const handleGenerateScene = useCallback(
    async (sceneId: string) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Set all parts to generating optimistically
      const MAX_CLIP_DURATION = 8;
      setSegments(prev => prev.map(seg => ({
        ...seg,
        scenes: seg.scenes.map(scene => {
          if (scene.sceneId === sceneId) {
            const partCount = Math.ceil(scene.totalDuration / MAX_CLIP_DURATION);
            const newParts: VideoPart[] = Array.from({ length: partCount }, (_, i) => ({
              id: `gen-${Date.now()}-${i}`,
              duration: i === partCount - 1
                ? scene.totalDuration % MAX_CLIP_DURATION || MAX_CLIP_DURATION
                : MAX_CLIP_DURATION,
              status: "generating" as const,
            }));
            return { ...scene, parts: newParts };
          }
          return scene;
        }),
      })));

      try {
        const res = await fetch("/api/studio/generate-scene-video-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sceneId, options: { aspectRatio: "16:9" } }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "요청 실패" }));
          toast.error("씬 비디오 생성 실패", { description: err.error });
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const dataLine = line.trim();
            if (!dataLine.startsWith("data: ")) continue;

            try {
              const event = JSON.parse(dataLine.slice(6));

              switch (event.type) {
                case "start":
                  // Parts already set optimistically
                  break;

                case "clip_start":
                  updatePartByNumber(sceneId, event.partNumber, "generating");
                  break;

                case "clip_complete":
                  updatePartByNumber(sceneId, event.partNumber, "completed", event.publicUrl);
                  break;

                case "clip_error":
                  updatePartByNumber(sceneId, event.partNumber, "failed");
                  toast.error(`클립 ${event.partNumber} 생성 실패`);
                  break;

                case "complete":
                  toast.success("씬 비디오 생성 완료!");
                  revalidator.revalidate();
                  break;

                case "error":
                  toast.error("씬 비디오 생성 오류", { description: event.error });
                  break;
              }
            } catch {
              // Skip malformed events
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        toast.error("씬 비디오 생성 중 오류 발생");
      }
    },
    [revalidator, updatePartByNumber],
  );

  // Regenerate a single part (re-triggers the whole scene for now)
  const handleRegeneratePart = useCallback(
    async (sceneId: string, _partId: string) => {
      await handleGenerateScene(sceneId);
    },
    [handleGenerateScene],
  );

  // Generate all scenes sequentially
  const handleGenerateAll = useCallback(async () => {
    setIsGenerating(true);
    toast.info("모든 씬의 비디오 생성 중...");

    const allSceneIds = segments.flatMap(seg =>
      seg.scenes.map(scene => scene.sceneId),
    );

    for (const sceneId of allSceneIds) {
      await handleGenerateScene(sceneId);
    }

    setIsGenerating(false);
    toast.success("모든 비디오가 성공적으로 생성되었습니다!");
  }, [segments, handleGenerateScene]);

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-4rem)] max-w-full overflow-visible lg:overflow-hidden">

      {/* Main Content (Video Timeline/Grid) */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-background/50">
        <div className="p-4 pb-20 max-w-full px-6 space-y-8">

          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">씬 생성</h2>
              <p className="text-muted-foreground">스토리보드를 비디오 시퀀스로 변환하세요.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              타임라인 내보내기
            </Button>
          </div>

          <div className="space-y-12">
            {segments.map((segment, index) => (
              <div key={segment.id} className="flex flex-col lg:flex-row gap-6 group">
                {/* Script Context */}
                <div className="lg:w-1/4 shrink-0 space-y-3 lg:sticky lg:top-6 self-start">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-inset ring-primary/20">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider">세그먼트</span>
                  </div>
                  <div className="bg-background p-3 rounded-lg border text-sm text-muted-foreground">
                    {segment.content}
                  </div>
                </div>

                {/* Video Grid */}
                <div className="lg:w-3/4">
                  <StoryboardGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                    {segment.scenes.map((scene) => (
                      <SceneVideoCard
                        key={scene.sceneId}
                        scene={scene}
                        onRegeneratePart={handleRegeneratePart}
                        onGenerateScene={handleGenerateScene}
                      />
                    ))}
                  </StoryboardGrid>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Right Sidebar */}
      <VideoGeneratorSidebar
        onGenerateAll={handleGenerateAll}
        isGenerating={isGenerating}
      />

    </div>
  );
}
