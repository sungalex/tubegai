import { useState } from "react";
import { useParams } from "react-router";
import {
  ImageIcon, Wand2, Type, Square,
  Download, Save, RefreshCw, Move,
  Trash2, Layers
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Slider } from "~/common/components/ui/slider";
import { Separator } from "~/common/components/ui/separator";
import { ScrollArea } from "~/common/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import { Card } from "~/common/components/ui/card";
import { StudioProjectSelector } from "../components/studio-project-selector";
import { cn } from "~/lib/utils";
import { getThumbnailImages } from "~/common/data/studio.data.server";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";

export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.projectId) {
    return { images: [] };
  }
  const images = await getThumbnailImages(params.projectId);
  return { images };
}

export const meta = () => {
  return [
    { title: "Thumbnail Studio | TubeGAI" },
    { name: "description", content: "Create eye-catching thumbnails with AI." },
  ];
};

export default function StudioThumbnailPage() {
  const { projectId } = useParams();
  const { images: initialImages } = useLoaderData<typeof loader>();

  // State
  const [activeTab, setActiveTab] = useState("generator");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Mock Canvas Objects
  const [canvasObjects, setCanvasObjects] = useState([
    { id: "text-1", type: "text", content: "EPIC TITLE", x: 50, y: 40, color: "white", size: 48 },
  ]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>("text-1");

  if (!projectId) {
    return (
      <StudioProjectSelector
        title="Thumbnail Studio"
        description="Design the perfect click-worthy thumbnail."
        context="thumbnail"
      />
    );
  }

  // --- Handlers ---

  const handleGenerate = () => {
    if (!prompt) return;
    setIsGenerating(true);
    toast.info("Generating Images...", { description: "AI is imagining your thumbnail." });

    setTimeout(() => {
      // Use initialImages as generated images for simulation
      setGeneratedImages(initialImages);
      setIsGenerating(false);
      toast.success("Generation Complete", { description: "Select an image to use as base." });
    }, 2500);
  };

  const handleApplyImage = (imgSrc: string) => {
    setSelectedImage(imgSrc);
    toast.success("Background Updated");
  };

  const handleAddText = () => {
    const newText = {
      id: `text-${Date.now()}`,
      type: "text",
      content: "NEW TEXT",
      x: 10 + Math.random() * 20,
      y: 10 + Math.random() * 20,
      color: "white",
      size: 32
    };
    setCanvasObjects([...canvasObjects, newText]);
    setSelectedObjectId(newText.id);
  };

  const handleDeleteObject = () => {
    if (!selectedObjectId) return;
    setCanvasObjects(canvasObjects.filter(o => o.id !== selectedObjectId));
    setSelectedObjectId(null);
  };

  const handleSave = () => {
    toast.success("Thumbnail Saved", { description: "Ready for export." });
  };

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">

      {/* 1. Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <ImageIcon className="h-5 w-5" />
            <span>Thumbnail Studio</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-2" /> Download JPG
          </Button>
          <Button variant="default" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> Save Project
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* 2. Tools Sidebar (Left) */}
        <div className="w-80 border-r flex flex-col bg-muted/10 shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-4 py-2 border-b bg-background">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="generator">AI Generator</TabsTrigger>
                <TabsTrigger value="editor">Editor</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <TabsContent value="generator" className="m-0 p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Prompt</label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Describe your thumbnail..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="bg-background"
                    />
                    <Button
                      className="w-full bg-linear-to-r from-purple-600 to-pink-600 text-white border-0"
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt}
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-3 w-3 mr-2" />
                          Generate Magic
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {generatedImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {generatedImages.map((src, i) => (
                      <div
                        key={i}
                        className="group relative aspect-video rounded-md overflow-hidden border border-border cursor-pointer hover:ring-2 hover:ring-primary"
                        onClick={() => handleApplyImage(src)}
                      >
                        <img src={src} alt={`Generated ${i}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-bold">Use Image</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="editor" className="m-0 p-4 space-y-6">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleAddText}>
                    <Type className="h-6 w-6" />
                    Add Text
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Square className="h-6 w-6" />
                    Add Shape
                  </Button>
                </div>

                {selectedObjectId ? (
                  <Card className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Selected Object</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={handleDeleteObject}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs">Content</label>
                      <Input
                        value={canvasObjects.find(o => o.id === selectedObjectId)?.content}
                        onChange={(e) => {
                          setCanvasObjects(canvasObjects.map(o => o.id === selectedObjectId ? { ...o, content: e.target.value } : o));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs">Size</label>
                      <Slider
                        value={[canvasObjects.find(o => o.id === selectedObjectId)?.size || 16]}
                        min={12} max={120} step={1}
                        onValueChange={(v) => {
                          setCanvasObjects(canvasObjects.map(o => o.id === selectedObjectId ? { ...o, size: v[0] } : o));
                        }}
                      />
                    </div>
                  </Card>
                ) : (
                  <div className="p-4 border border-dashed rounded text-center text-xs text-muted-foreground">
                    Select an object on the canvas to edit.
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* 3. Main Workspace (Canvas) */}
        <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center p-8 relative">

          <div
            className="relative aspect-video w-full max-w-4xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden select-none"
            onClick={() => setSelectedObjectId(null)}
          >
            {selectedImage ? (
              <img src={selectedImage} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="Background" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
                <span className="text-sm">Empty Canvas - Generate or Upload Image</span>
              </div>
            )}

            {/* Canvas Objects */}
            {canvasObjects.map(obj => (
              <div
                key={obj.id}
                className={cn(
                  "absolute cursor-move border-2",
                  selectedObjectId === obj.id ? "border-primary" : "border-transparent hover:border-white/50"
                )}
                style={{
                  left: `${obj.x}%`,
                  top: `${obj.y}%`,
                  color: obj.color,
                  fontSize: `${obj.size}px`,
                  fontWeight: 'bold',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedObjectId(obj.id);
                }}
              >
                {obj.content}
              </div>
            ))}
          </div>

          <div className="mt-4 text-zinc-500 text-xs flex items-center gap-4">
            <span className="flex items-center gap-1"><Move className="h-3 w-3" /> Drag objects to move (Mock)</span>
            <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> 1920 x 1080 px</span>
          </div>

        </div>
      </div>
    </div>
  );
}
