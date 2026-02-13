import { useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { Download, FileText, Sparkles, Image as ImageIcon } from "lucide-react";
import { Button } from "~/common/components/ui/button";
import { StudioProjectSelector } from "../components/studio-project-selector";
import { VideoGeneratorSidebar } from "../components/video-generator-sidebar";
import { SceneVideoCard, type SceneVideo, type VideoPart } from "../components/scene-video-card";
import { StoryboardGrid } from "../components/storyboard-grid";
import { getSceneSegments } from "~/common/data/studio.data.server";
import type { Route } from "./+types/studio-scene-page";
// import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import type { SceneScriptSegment } from "~/common/types/studio.types";
import { useTranslation } from "~/i18n/context";

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

  const [segments, setSegments] = useState<SceneScriptSegment[]>(initialSegments);
  const [isGenerating, setIsGenerating] = useState(false);
  const { t } = useTranslation("studio");

  // Handle No Project
  if (!projectId) {
    return (
      <StudioProjectSelector
        title={t("scene.title")}
        description={t("scene.subtitle")}
        context="scene"
      />
    );
  }

  // Helper to update a specific part status
  const updatePartStatus = (sceneId: string, partId: string, status: VideoPart["status"], url?: string) => {
    setSegments(prev => prev.map(seg => ({
      ...seg,
      scenes: seg.scenes.map(scene => {
        if (scene.sceneId === sceneId) {
          return {
            ...scene,
            parts: scene.parts.map(part =>
              part.id === partId ? { ...part, status, url } : part
            )
          };
        }
        return scene;
      })
    })));
  };

  // Generate Single Part Logic
  const handleRegeneratePart = async (sceneId: string, partId: string) => {
    updatePartStatus(sceneId, partId, "generating");

    // Simulate API Call
    setTimeout(() => {
      // Success
      updatePartStatus(sceneId, partId, "completed", "https://example.com/video.mp4"); // URL is mock, card uses thumbnail
      toast.success(t("scene.clipGenerated"));
    }, 2500);
  };

  // Generate Single Scene Logic
  const handleGenerateScene = async (sceneId: string) => {
    toast.info(t("scene.generatingToast"), { description: t("scene.generatingDesc") });
    const MAX_DURATION = 4;

    setSegments(prev => prev.map(seg => ({
      ...seg,
      scenes: seg.scenes.map(scene => {
        if (scene.sceneId === sceneId) {
          // Apply Split Logic
          if (scene.totalDuration > 5) {
            const partCount = Math.ceil(scene.totalDuration / MAX_DURATION);
            const newParts: VideoPart[] = Array.from({ length: partCount }).map((_, i) => ({
              id: `p-${Date.now()}-${i}`,
              duration: i === partCount - 1 ? scene.totalDuration % MAX_DURATION || MAX_DURATION : MAX_DURATION,
              status: "generating"
            }));
            return { ...scene, parts: newParts };
          } else {
            return {
              ...scene,
              parts: scene.parts.map(p => ({ ...p, status: "generating" as const }))
            };
          }
        }
        return scene;
      })
    })));

    // Simulate completion
    await new Promise(resolve => setTimeout(resolve, 3000));

    setSegments(prev => prev.map(seg => ({
      ...seg,
      scenes: seg.scenes.map(scene => {
        if (scene.sceneId === sceneId) {
          return {
            ...scene,
            parts: scene.parts.map(p => ({ ...p, status: "completed" as const, url: "mock-url" }))
          };
        }
        return scene;
      })
    })));
    toast.success(t("scene.sceneGenerated"));
  };

  // Generate All Logic (The requirement: Split video length)
  const handleGenerateAll = async () => {
    setIsGenerating(true);
    toast.info(t("scene.generatingAllToast"), { description: t("scene.generatingAllDesc") });

    const MAX_DURATION = 4;

    // Optimistic Update: Apply "Generating" status and Split logic
    setSegments(prev => prev.map(seg => ({
      ...seg,
      scenes: seg.scenes.map(scene => {
        // Logic: If duration > 5, split it.
        if (scene.totalDuration > 5) {
          const partCount = Math.ceil(scene.totalDuration / MAX_DURATION);
          const newParts: VideoPart[] = Array.from({ length: partCount }).map((_, i) => ({
            id: `p-${Date.now()}-${i}`,
            duration: i === partCount - 1 ? scene.totalDuration % MAX_DURATION || MAX_DURATION : MAX_DURATION,
            status: "generating"
          }));
          return { ...scene, parts: newParts }; // Replace parts with split parts
        } else {
          return {
            ...scene,
            parts: scene.parts.map(p => ({ ...p, status: "generating" as const }))
          };
        }
      })
    })));

    // 2. Simulate Delay for completion
    await new Promise(resolve => setTimeout(resolve, 4000));

    // 3. Mark all as complete
    setSegments(prev => prev.map(seg => ({
      ...seg,
      scenes: seg.scenes.map(scene => ({
        ...scene,
        parts: scene.parts.map(p => ({ ...p, status: "completed" as const, url: "mock-url" }))
      }))
    })));

    setIsGenerating(false);
    toast.success(t("scene.allGenerated"));
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-4rem)] max-w-full overflow-visible lg:overflow-hidden">

      {/* Main Content (Video Timeline/Grid) */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-background/50">
        <div className="p-4 pb-20 max-w-full px-6 space-y-8">

          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t("scene.pageTitle")}</h2>
              <p className="text-muted-foreground">{t("scene.pageSubtitle")}</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              {t("scene.exportTimeline")}
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
                    <span className="text-xs font-semibold uppercase tracking-wider">{t("scene.segment")}</span>
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
