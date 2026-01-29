import { useState } from "react";
import { useParams } from "react-router";
import {
  StoryboardGrid,
} from "~/features/studio/components/storyboard-grid";
import {
  StoryboardSceneCard,
  type StoryboardScene
} from "~/features/studio/components/storyboard-scene-card";
import { StoryboardGeneratorSidebar } from "~/features/studio/components/storyboard-generator-sidebar";
import { Button } from "~/common/components/ui/button";
import { Separator } from "~/common/components/ui/separator";
import { Plus, Download, FileText, Image as ImageIcon, Sparkles } from "lucide-react";
import { cn } from "~/lib/utils";
import { toast } from "sonner";
import { StudioProjectSelector } from "../components/studio-project-selector";
import type { StoryboardScriptSegment } from "~/common/types/studio.types";
import { getStoryboardSegments, getStoryboardScenesPool } from "~/common/data/studio.data";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";

export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.projectId) {
    return { segments: [], scenesPool: {} };
  }
  const [segments, scenesPool] = await Promise.all([
    getStoryboardSegments(params.projectId),
    getStoryboardScenesPool(params.projectId)
  ]);
  return { segments, scenesPool };
}

export const meta = () => {
  return [
    { title: "Storyboard | TubeGAI" },
    { name: "description", content: "AI-Powered Storyboard Generation" },
  ];
};

export default function StudioStoryboardPage() {
  const { projectId } = useParams();
  const { segments: initialSegments, scenesPool: initialScenesPool } = useLoaderData<typeof loader>();
  const [segments, setSegments] = useState<StoryboardScriptSegment[]>(initialSegments);
  const [scenesPool, setScenesPool] = useState(initialScenesPool);
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle No Project
  if (!projectId) {
    return (
      <StudioProjectSelector
        title="Storyboard"
        description="Select a project to visualize your narrative scene by scene."
        context="storyboard"
      />
    );
  }

  // Generate All
  const handleGenerateAll = async () => {
    setIsGenerating(true);
    toast.info("Analyzing script and generating scenes...", { description: "This might take a few seconds." });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update state with generated scenes
    const newSegments = segments.map(seg => ({
      ...seg,
      scenes: scenesPool[seg.id] || []
    }));

    setSegments(newSegments);
    setIsGenerating(false);
    toast.success("Storyboard generation complete!", { description: "6 scenes created across 3 segments." });
  };

  // Generate Single Segment
  const handleGenerateSegment = async (segmentId: string) => {
    toast.info("Generating scenes for segment...", { duration: 1500 });
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSegments(prev => prev.map(seg => {
      if (seg.id === segmentId) {
        return { ...seg, scenes: scenesPool[seg.id] || [] };
      }
      return seg;
    }));
  };

  const handleRegenerateImage = (id: string) => {
    toast.info("Requesting interaction...", { description: "Image regeneration logic would run here." });
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-4rem)] max-w-full overflow-visible lg:overflow-hidden">
      {/* Main Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-4 pb-20 max-w-full px-6 space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Storyboard Board</h2>
              <p className="text-muted-foreground">Visualize your narrative scene by scene.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>

          <div className="space-y-12">
            {segments.map((segment, index) => (
              <div key={segment.id} className="flex flex-col lg:flex-row gap-6 group">
                {/* Script Content Column */}
                <div className="lg:w-1/3 shrink-0 space-y-3 lg:sticky lg:top-6 self-start">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-inset ring-primary/20">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider">Script Segment</span>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg border border-border/50 text-base leading-relaxed relative group-hover:border-primary/20 transition-colors">
                    <FileText className="absolute top-3 right-3 h-4 w-4 text-muted-foreground/20" />
                    {segment.content}
                  </div>

                  {segment.scenes.length === 0 && (
                    <div className="hidden lg:block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed gap-2 text-muted-foreground hover:text-primary hover:border-primary/50"
                        onClick={() => handleGenerateSegment(segment.id)}
                      >
                        <Sparkles className="h-4 w-4" />
                        Generate this segment
                      </Button>
                    </div>
                  )}
                </div>

                {/* Scenes Grid Column */}
                <div className="lg:w-2/3">
                  {segment.scenes.length > 0 ? (
                    <StoryboardGrid className="xl:grid-cols-2">
                      {segment.scenes.map((scene) => (
                        <StoryboardSceneCard
                          key={scene.id}
                          scene={scene}
                          onRegenerateImage={handleRegenerateImage}
                          className="min-h-70"
                        />
                      ))}
                      <div className="h-full min-h-70 rounded-xl border-2 border-dashed flex flex-col items-center justify-center bg-muted/20 transition-colors hover:bg-muted/30 cursor-pointer">
                        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary">
                          <Plus className="h-6 w-6" />
                          Add Scene
                        </Button>
                      </div>
                    </StoryboardGrid>
                  ) : (
                    <div className="h-full min-h-50 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center bg-muted/20">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h4 className="text-sm font-semibold mb-1">No scenes generated</h4>
                      <p className="text-xs text-muted-foreground max-w-62.5 mb-4">
                        Use the generator to visualize scenes for this script segment.
                      </p>
                      <Button onClick={() => handleGenerateSegment(segment.id)} size="sm" className="gap-2">
                        <Sparkles className="h-3 w-3" />
                        Generate Scenes
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <StoryboardGeneratorSidebar
        onGenerateAll={handleGenerateAll}
        isGenerating={isGenerating}
      />
    </div>
  );
}
