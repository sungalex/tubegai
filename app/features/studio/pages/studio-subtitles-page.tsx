import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router";
import {
  Captions, Play, Pause, SkipBack, SkipForward,
  Wand2, Download, Save, Clock, Trash2, Plus,
  CheckCircle2, AlertCircle, Search, Sparkles, Pencil, Upload
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/common/components/ui/button";
import { ScrollArea } from "~/common/components/ui/scroll-area";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/common/components/ui/table";
import { StudioProjectSelector } from "../components/studio-project-selector";
import { cn } from "~/lib/utils";
import type { SubtitleSegment } from "~/common/types/studio.types";
import { getSubtitles } from "~/common/data/studio.data";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";

export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.projectId) {
    return { subtitles: [] };
  }
  const subtitles = await getSubtitles(params.projectId);
  return { subtitles };
}


export const meta = () => {
  return [
    { title: "Subtitles | TubeGAI" },
    { name: "description", content: "Generate and edit captions." },
  ];
};

export default function StudioSubtitlesPage() {
  const { projectId } = useParams();
  const { subtitles: initialSubtitles } = useLoaderData<typeof loader>();

  // State
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Timeline Refs
  const timelineDuration = 20; // Mock total video duration (sec)

  // --- Effects ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= timelineDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!projectId) {
    return (
      <StudioProjectSelector
        title="Subtitle Studio"
        description="Auto-generate and fine-tune your captions."
        context="subtitles"
      />
    );
  }

  // --- Handlers ---

  const handleAutoGenerate = () => {
    setIsGenerating(true);
    toast.info("Analyzing Audio...", { description: "This will transcribe speech to text." });

    setTimeout(() => {
      // Use initialSubtitles as the generated result for simulation
      setSubtitles(initialSubtitles);
      setIsGenerating(false);
      toast.success("Subtitles Generated", { description: "You can now edit the captions." });
    }, 2500);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    // Find active subtitle
    const active = subtitles.find(s => time >= s.startTime && time <= s.endTime);
    if (active) {
      setSelectedSubtitleId(active.id);
    } else {
      setSelectedSubtitleId(null);
    }
  };

  const handleTextChange = (id: string, newText: string) => {
    setSubtitles(prev => prev.map(s => s.id === id ? { ...s, text: newText } : s));
  };

  const handleDeleteSubtitle = (id: string) => {
    setSubtitles(prev => prev.filter(s => s.id !== id));
  };

  const handleAddSubtitle = () => {
    const newSub: SubtitleSegment = {
      id: `sub-${Date.now()}`,
      startTime: currentTime,
      endTime: currentTime + 2.0,
      text: "New Caption"
    };
    setSubtitles(prev => [...prev, newSub].sort((a, b) => a.startTime - b.startTime));
    setSelectedSubtitleId(newSub.id);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10); // just one decimal for brevity in list
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const filteredSubtitles = subtitles.filter(s =>
    s.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">

      {/* 1. Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Captions className="h-5 w-5" />
            <span>Subtitle Studio</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="default"
            size="sm"
            onClick={handleAutoGenerate}
            disabled={isGenerating || subtitles.length > 0}
            className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md transition-all hover:scale-105"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2" />
                Transcribing...
              </>
            ) : (
              <>
                <Wand2 className="h-3 w-3 mr-2" />
                Auto-Generate
              </>
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAddSubtitle}>
            <Plus className="h-3 w-3 mr-1" /> Add Caption
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export .SRT
          </Button>
          <Button variant="default" size="sm">
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* 2. Subtitle List Editor (Left) */}
        <div className="w-96 border-r flex flex-col bg-muted/10 shrink-0">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search captions..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {filteredSubtitles.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  {subtitles.length === 0 ? "No subtitles yet. Click 'Auto-Generate' to start." : "No matches found."}
                </div>
              ) : (
                filteredSubtitles.map((sub, index) => (
                  <div
                    key={sub.id}
                    id={`subtitle-row-${sub.id}`}
                    className={cn(
                      "group p-3 border-b hover:bg-muted/50 transition-colors flex gap-3 items-start",
                      selectedSubtitleId === sub.id ? "bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                    )}
                    onClick={() => {
                      setSelectedSubtitleId(sub.id);
                      setCurrentTime(sub.startTime);
                    }}
                  >
                    <div className="text-xs font-mono text-muted-foreground pt-1.5 w-12 shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(sub.startTime)}</span>
                        <span>-</span>
                        <span>{formatTime(sub.endTime)}</span>
                      </div>
                      <Textarea
                        value={sub.text}
                        onChange={(e) => handleTextChange(sub.id, e.target.value)}
                        className="min-h-15 resize-none text-sm bg-background/50 focus:bg-background"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSubtitle(sub.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 3. Preview & Timeline (Right) */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">

          {/* Preview Player */}
          <div className="flex-1 flex flex-col items-center justify-center relative p-8">
            <div className="relative aspect-video w-full max-w-4xl bg-black border border-zinc-800 rounded-lg shadow-2xl flex items-center justify-center overflow-hidden">
              <p className="text-zinc-600 font-medium select-none">Video Preview</p>

              {/* Overlay Subtitle */}
              <div className="absolute bottom-10 left-0 right-0 px-8 text-center pointer-events-none">
                {subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime) && (
                  <span className="inline-block bg-black/70 text-white px-4 py-2 rounded text-lg font-medium shadow-lg backdrop-blur-sm">
                    {subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime)?.text}
                  </span>
                )}
              </div>

              {/* Player Controls (Overlay) */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setCurrentTime(Math.max(0, currentTime - 5))}>
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-12 w-12" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setCurrentTime(Math.min(timelineDuration, currentTime + 5))}>
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mini Timeline Visualization */}
          <div className="h-48 border-t border-zinc-800 bg-zinc-900 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-zinc-400">Timeline Sync</span>
              <span className="text-xs font-mono text-zinc-500">{formatTime(currentTime)} / {formatTime(timelineDuration)}</span>
            </div>

            <div className="flex-1 relative bg-zinc-950 rounded border border-zinc-800 overflow-hidden">
              {/* Waveform Mock Background */}
              <div className="absolute inset-0 flex items-center opacity-20 pointer-events-none px-2 space-x-0.5">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-primary flex-1 rounded-full animate-pulse delay-75"
                    style={{ height: `${Math.random() * 80 + 20}%`, animationDuration: '3s' }}
                  />
                ))}
              </div>

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
                style={{ left: `${(currentTime / timelineDuration) * 100}%` }}
              >
                <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
              </div>

              {/* Subtitle Blocks */}
              {subtitles.map(sub => (
                <div
                  key={sub.id}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-16 rounded cursor-pointer border hover:brightness-110 transition-all flex items-center px-2 overflow-hidden z-10",
                    selectedSubtitleId === sub.id
                      ? "bg-primary text-primary-foreground border-primary-foreground/20 ring-2 ring-white"
                      : "bg-zinc-800 text-zinc-300 border-zinc-700"
                  )}
                  style={{
                    left: `${(sub.startTime / timelineDuration) * 100}%`,
                    width: `${((sub.endTime - sub.startTime) / timelineDuration) * 100}%`
                  }}
                  onClick={() => {
                    setSelectedSubtitleId(sub.id);
                    setCurrentTime(sub.startTime);
                  }}
                  title={sub.text}
                >
                  <span className="text-[10px] truncate select-none whitespace-nowrap">{sub.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-center text-xs text-zinc-500">
              Drag edge to trim (Coming Soon) • Click on block to edit
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
