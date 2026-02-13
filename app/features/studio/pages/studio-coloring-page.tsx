import { useState } from "react";
import { useParams } from "react-router";
import {
  Palette, Play, Pause, RotateCcw,
  Sun, Contrast, Droplets, Thermometer,
  Layers, LayoutTemplate, Check
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/common/components/ui/button";
import { Slider } from "~/common/components/ui/slider";
import { ScrollArea } from "~/common/components/ui/scroll-area";
import { Separator } from "~/common/components/ui/separator";
import { Badge } from "~/common/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import { StudioProjectSelector } from "../components/studio-project-selector";
import { cn } from "~/lib/utils";
import type { ColorPreset } from "~/common/types/studio.types";
import { getColorPresets } from "~/common/data/studio.data.server";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";

export async function loader({ params }: LoaderFunctionArgs) {
  // Color presets might be global, but following pattern
  const colorPresets = await getColorPresets();
  return { colorPresets };
}

export const meta = () => {
  return [
    { title: "Color Grading | TubeGAI" },
    { name: "description", content: "Apply filters and adjust video colors." },
  ];
};

export default function StudioColoringPage() {
  const { projectId } = useParams();
  const { colorPresets } = useLoaderData<typeof loader>();

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState("none");
  const [adjustments, setAdjustments] = useState({
    brightness: 100, // %
    contrast: 100,   // %
    saturation: 100, // %
    hue: 0,          // deg
    sepia: 0,        // %
  });
  const [showSplitView, setShowSplitView] = useState(false);

  if (!projectId) {
    return (
      <StudioProjectSelector
        title="Color Studio"
        description="Enhance your video with professional color grading."
        context="coloring"
      />
    );
  }

  // --- Helpers ---

  // Combine preset filter + manual adjustments
  const getComputedFilter = (isOriginal = false) => {
    if (isOriginal) return "none";

    const preset = colorPresets.find(p => p.id === selectedPresetId);
    if (!preset) return "none";

    // Start with preset (if not 'none')
    let filterString = preset.id === "none" ? "" : preset.filter;

    // Append manual adjustments
    // Note: CSS filters apply in order. We append adjustments effectively "on top" of preset base.
    // Ideally we'd parse and merge, but appending works for visual approximation.

    if (adjustments.brightness !== 100) filterString += ` brightness(${adjustments.brightness}%)`;
    if (adjustments.contrast !== 100) filterString += ` contrast(${adjustments.contrast}%)`;
    if (adjustments.saturation !== 100) filterString += ` saturate(${adjustments.saturation}%)`;
    if (adjustments.hue !== 0) filterString += ` hue-rotate(${adjustments.hue}deg)`;
    if (adjustments.sepia !== 0) filterString += ` sepia(${adjustments.sepia}%)`;

    return filterString.trim() || "none";
  };

  const handleReset = () => {
    setSelectedPresetId("none");
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      sepia: 0,
    });
    toast.success("Reset All", { description: "Adjustments restored to default." });
  };

  const handleSaveLook = () => {
    toast.success("Look Saved", { description: "Color grading settings applied to project." });
  };

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">

      {/* 1. Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Palette className="h-5 w-5" />
            <span>Color Studio</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-2", showSplitView && "bg-muted text-foreground")}
            onClick={() => setShowSplitView(!showSplitView)}
          >
            <LayoutTemplate className="h-4 w-4" />
            Split View (Compare)
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset
          </Button>
          <Button variant="default" size="sm" onClick={handleSaveLook}>
            Apply Look
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* 2. Controls Sidebar (Left) */}
        <div className="w-80 border-r flex flex-col bg-muted/10 shrink-0">
          <Tabs defaultValue="presets" className="flex-1 flex flex-col">
            <div className="px-4 py-2 border-b bg-background">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="presets">Presets</TabsTrigger>
                <TabsTrigger value="adjust">Adjust</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              {/* Tab: Presets */}
              <TabsContent value="presets" className="m-0 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {colorPresets.map(preset => (
                    <div
                      key={preset.id}
                      className={cn(
                        "cursor-pointer group relative rounded-lg overflow-hidden border-2 transition-all aspect-video bg-zinc-900",
                        selectedPresetId === preset.id ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-zinc-700"
                      )}
                      onClick={() => setSelectedPresetId(preset.id)}
                    >
                      {/* Preview Box */}
                      <div className={cn("absolute inset-0 flex items-center justify-center text-white/50 text-xs font-medium", preset.previewColor)}>
                        {/* We can use CSS filter on this div to approximate preview */}
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=300&q=80')] bg-cover bg-center opacity-80"
                          style={{ filter: preset.filter }}
                        />
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 backdrop-blur-sm">
                        <span className="text-xs text-white font-medium flex items-center justify-between">
                          {preset.name}
                          {selectedPresetId === preset.id && <Check className="h-3 w-3 text-primary" />}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Tab: Adjustments */}
              <TabsContent value="adjust" className="m-0 p-4 space-y-6">

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium flex items-center gap-2">
                      <Sun className="h-3 w-3" /> Brightness
                    </label>
                    <span className="text-xs font-mono text-muted-foreground">{adjustments.brightness}%</span>
                  </div>
                  <Slider
                    value={[adjustments.brightness]}
                    min={0} max={200} step={1}
                    onValueChange={(v) => setAdjustments(p => ({ ...p, brightness: v[0] }))}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium flex items-center gap-2">
                      <Contrast className="h-3 w-3" /> Contrast
                    </label>
                    <span className="text-xs font-mono text-muted-foreground">{adjustments.contrast}%</span>
                  </div>
                  <Slider
                    value={[adjustments.contrast]}
                    min={0} max={200} step={1}
                    onValueChange={(v) => setAdjustments(p => ({ ...p, contrast: v[0] }))}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium flex items-center gap-2">
                      <Droplets className="h-3 w-3" /> Saturation
                    </label>
                    <span className="text-xs font-mono text-muted-foreground">{adjustments.saturation}%</span>
                  </div>
                  <Slider
                    value={[adjustments.saturation]}
                    min={0} max={200} step={1}
                    onValueChange={(v) => setAdjustments(p => ({ ...p, saturation: v[0] }))}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium flex items-center gap-2">
                      <Palette className="h-3 w-3" /> Hue Tint
                    </label>
                    <span className="text-xs font-mono text-muted-foreground">{adjustments.hue}°</span>
                  </div>
                  <Slider
                    value={[adjustments.hue]}
                    min={-180} max={180} step={1}
                    onValueChange={(v) => setAdjustments(p => ({ ...p, hue: v[0] }))}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium flex items-center gap-2">
                      <Thermometer className="h-3 w-3" /> Sepia
                    </label>
                    <span className="text-xs font-mono text-muted-foreground">{adjustments.sepia}%</span>
                  </div>
                  <Slider
                    value={[adjustments.sepia]}
                    min={0} max={100} step={1}
                    onValueChange={(v) => setAdjustments(p => ({ ...p, sepia: v[0] }))}
                  />
                </div>

              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* 3. Preview Area (Right) */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 items-center justify-center p-8 relative">

          <div className="relative aspect-video w-full max-w-5xl bg-black border border-zinc-800 rounded-lg shadow-2xl overflow-hidden group">

            {/* The Video (Mock Image) */}
            <div className="absolute inset-0 w-full h-full">
              {/* Base Video */}
              <img
                src="https://images.unsplash.com/photo-1535016120720-40c6874c3b1c?auto=format&fit=crop&w=1600&q=80"
                alt="Preview"
                className="w-full h-full object-cover"
                style={{
                  filter: getComputedFilter(),
                  transition: 'filter 0.3s ease-out'
                }}
              />

              {/* Split View Overlay (Original) */}
              {showSplitView && (
                <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden border-r-2 border-white/50">
                  <div className="absolute inset-0 w-[200%] h-full"> {/* Double width to counteract clip */}
                    <img
                      src="https://images.unsplash.com/photo-1535016120720-40c6874c3b1c?auto=format&fit=crop&w=1600&q=80"
                      alt="Original"
                      className="w-full h-full object-cover"
                      style={{ filter: "none" }}
                    />
                  </div>
                  <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    Original
                  </div>
                </div>
              )}

              {showSplitView && (
                <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  Graded
                </div>
              )}
            </div>

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/50 backdrop-blur rounded-full p-4 text-white">
                <Play className="h-8 w-8 ml-1" />
              </div>
            </div>

          </div>

          <div className="mt-6 flex flex-col items-center gap-2 text-zinc-500 text-sm">
            <div className="flex gap-4">
              <span className="font-mono text-xs">Brightness: {adjustments.brightness}%</span>
              <span className="font-mono text-xs">Contrast: {adjustments.contrast}%</span>
            </div>
            <p className="text-xs opacity-50">Filter logic applied via CSS filters</p>
          </div>

        </div>
      </div>
    </div>
  );
}
