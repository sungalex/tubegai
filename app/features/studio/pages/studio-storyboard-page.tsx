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

export const meta = () => {
  return [
    { title: "Storyboard | TubeGAI" },
    { name: "description", content: "AI-Powered Storyboard Generation" },
  ];
};

interface ScriptSegment {
  id: string;
  order: number;
  content: string;
  scenes: StoryboardScene[]; // Can be empty initially
}

// Mock Data - Initial State (Empty Scenes)
const INITIAL_SEGMENTS: ScriptSegment[] = [
  {
    id: "seg1",
    order: 1,
    content: "Welcome to the future. In this video, we're going to explore how AI is reshaping our skylines and our daily lives, starting from the very air we breathe.",
    scenes: []
  },
  {
    id: "seg2",
    order: 2,
    content: "It all starts with the hardware. The new neural chips are smaller, faster, and more efficient than anything we've seen before.",
    scenes: []
  },
  {
    id: "seg3",
    order: 3,
    content: "But it's not just about speed. It's about contrast. The difference between the old way and the new way is stark.",
    scenes: []
  }
];

// Mock Scenes Data (for generation simulation)
const GENERATED_SCENES_POOL: Record<string, StoryboardScene[]> = {
  "seg1": [
    {
      id: "s1",
      sceneNumber: 1,
      description: "Opening shot: A futuristic city skyline at glowing twilight.",
      visualPrompt: "Cyberpunk city, neon lights, twilight, aerial view, cinematic lighting",
      duration: 5,
      imageUrl: "https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=600&auto=format&fit=crop"
    },
    {
      id: "s2",
      sceneNumber: 2,
      description: "Host appears in a modern studio environment, smiling.",
      visualPrompt: "Professional studio, young tech enthusiast host, soft lighting",
      duration: 8,
      imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=600&auto=format&fit=crop"
    }
  ],
  "seg2": [
    {
      id: "s3",
      sceneNumber: 3,
      description: "Close up of a new AI microchip.",
      visualPrompt: "Macro shot, futuristic microchip, robotic glove, blue glow",
      duration: 4,
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop"
    },
    {
      id: "s4",
      sceneNumber: 4,
      description: "Data visualization graphics overlay showing projected growth.",
      visualPrompt: "Abstract data visualization, 3D charts, holographic interface",
      duration: 6,
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop"
    }
  ],
  "seg3": [
    {
      id: "s5",
      sceneNumber: 5,
      description: "Comparison split screen: Old technology vs New AI.",
      visualPrompt: "Split screen, left side dusty old computer, right side glowing AI interface",
      duration: 7,
      imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop"
    },
    {
      id: "s6",
      sceneNumber: 6,
      description: "Host gestures to the side, highlighting a key point.",
      visualPrompt: "Medium shot, host pointing right, excitement, dynamic pose",
      duration: 5,
      imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=600&auto=format&fit=crop"
    }
  ]
};

export default function StudioStoryboardPage() {
  const { projectId } = useParams();
  const [segments, setSegments] = useState<ScriptSegment[]>(INITIAL_SEGMENTS);
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
      scenes: GENERATED_SCENES_POOL[seg.id] || []
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
        return { ...seg, scenes: GENERATED_SCENES_POOL[seg.id] || [] };
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
                <div className="lg:w-1/3 flex-shrink-0 space-y-3 lg:sticky lg:top-6 self-start">
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
                          className="min-h-[280px]"
                        />
                      ))}
                      <div className="h-full min-h-[280px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center bg-muted/5 transition-colors hover:bg-muted/10 cursor-pointer">
                        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary">
                          <Plus className="h-6 w-6" />
                          Add Scene
                        </Button>
                      </div>
                    </StoryboardGrid>
                  ) : (
                    <div className="h-full min-h-[200px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center bg-muted/5">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h4 className="text-sm font-semibold mb-1">No scenes generated</h4>
                      <p className="text-xs text-muted-foreground max-w-[250px] mb-4">
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
