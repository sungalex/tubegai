import React, { useState, useRef } from "react";
import { useParams } from "react-router";
import {
  Scissors, Play, Pause, SkipBack, SkipForward,
  Layers, Music, Video, Plus, Trash2,
  MousePointer2, Wand2, ArrowLeftRight, Split,
  Settings2, Download, ChevronRight, GripVertical,
  Save, History, FileVideo, CheckCircle2, RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/common/components/ui/button";
import { ScrollArea } from "~/common/components/ui/scroll-area";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";
import { Slider } from "~/common/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/common/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/common/components/ui/tooltip";
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

// --- Mock Data ---

interface TimelineSegment {
  id: string;
  type: "video" | "audio";
  trackId: string;
  start: number; // in seconds
  duration: number; // in seconds
  color: string;
  label: string;
  content: string;
}

interface RenderedVersion {
  id: string;
  name: string;
  timestamp: string;
  duration: string;
  size: string;
}

const INITIAL_SCENES = [
  { id: "s1", order: 1, content: "Intro: Futuristic cityscape.", duration: 5, color: "bg-blue-500" },
  { id: "s2", order: 2, content: "Host talking about AI.", duration: 8, color: "bg-indigo-500" },
  { id: "s3", order: 3, content: "Microchips close-up.", duration: 4, color: "bg-violet-500" },
  { id: "s4", order: 4, content: "Outro: Logo animation.", duration: 3, color: "bg-purple-500" },
];

const INITIAL_B_ROLL = [
  { id: "b1", name: "Aerial View.mp4", duration: 5, color: "bg-teal-500", content: "Drone shot of city" },
  { id: "b2", name: "Coding Timelapse.mp4", duration: 8, color: "bg-cyan-500", content: "Screen recording" },
  { id: "b3", name: "Meeting Room.mp4", duration: 6, color: "bg-sky-500", content: "People talking" },
];

const INITIAL_TIMELINE: TimelineSegment[] = [
  // Prep some initial timeline state
  { id: "t1", type: "video", trackId: "V1", start: 0, duration: 5, color: "bg-blue-500", label: "Scene 1", content: "Intro City" },
  { id: "t2", type: "video", trackId: "V1", start: 5, duration: 8, color: "bg-indigo-500", label: "Scene 2", content: "Host AI" },
];

export const meta = () => {
  return [
    { title: "Rough Cut | TubeGAI" },
    { name: "description", content: "Assemble your clips, trim footage, and create your video sequence." },
  ];
};

export default function StudioRoughCutPage() {
  const { projectId } = useParams();

  // State
  const [segments, setSegments] = useState<TimelineSegment[]>(INITIAL_TIMELINE);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scale, setScale] = useState(30); // pixels per second
  const [selectedTool, setSelectedTool] = useState<"select" | "razor" | "ripple">("select");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isDraggingClip, setIsDraggingClip] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Save & Export State
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [versions, setVersions] = useState<RenderedVersion[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  if (!projectId) {
    return (
      <StudioProjectSelector
        title="Rough Cut Studio"
        description="Assemble your story in the timeline."
        context="roughcut"
      />
    );
  }

  // --- Handlers ---

  const handleAutoAssemble = () => {
    // Clear V1 and place all scenes sequentially
    let cursor = 0;
    const newSegments: TimelineSegment[] = INITIAL_SCENES.map(scene => {
      const seg: TimelineSegment = {
        id: `seg-${Date.now()}-${scene.id}`,
        type: "video",
        trackId: "V1",
        start: cursor,
        duration: scene.duration,
        color: scene.color,
        label: `Scene ${scene.order}`,
        content: scene.content
      };
      cursor += scene.duration;
      return seg;
    });

    setSegments(newSegments);
    toast.success("Auto-Assembly Complete", { description: "All scenes placed on V1 track." });
  };

  // Combined handler for both Scenes and B-Roll
  const handleAddClip = (item: { id: string, content: string, duration: number, color: string, name?: string }, type: "scene" | "b-roll", dropTime?: number) => {
    // If dropTime is provided (DnD), use it. Otherwise use currentTime (Click)
    let startTime = dropTime !== undefined ? dropTime : currentTime;

    // Ensure we don't place before 0
    if (startTime < 0) startTime = 0;

    const newSeg: TimelineSegment = {
      id: `seg-${Date.now()}-${item.id}`,
      type: "video",
      trackId: "V1",
      start: startTime,
      duration: item.duration,
      color: item.color,
      label: item.name || (type === "scene" ? `Scene ${item.id.replace('s', '')}` : "Clip"),
      content: item.content
    };

    // --- Magnetic Timeline Logic (Insert & Ripple) ---
    // 1. Sort existing segments by start time
    const sorted = [...segments].sort((a, b) => a.start - b.start);

    // 2. Find insertion index based on startTime
    // We want to insert BEFORE the first segment that starts AFTER the drop time
    // OR if we drop in the middle of a segment, effectively splitting it (but here we just push the whole segment)
    let insertIndex = sorted.findIndex(s => s.start >= startTime);
    if (insertIndex === -1) insertIndex = sorted.length; // Append if no segment found after

    // 3. Insert new segment at the determined index
    sorted.splice(insertIndex, 0, newSeg);

    // 4. Recalculate start times to ensure NO GAPS and NO OVERLAPS
    //    (Strict Magnetic: seg[i].start = seg[i-1].end)
    let cursor = 0;
    const recalculated = sorted.map(seg => {
      const updated = { ...seg, start: cursor };
      cursor += seg.duration;
      return updated;
    });

    setSegments(recalculated);
    toast.success("Clip Added", { description: `Added to timeline. All following clips shifted.` });
  };

  const handleMoveClip = (item: TimelineSegment, dropTime: number) => {
    // 1. Remove the clip from its OLD position
    const filtered = segments.filter(s => s.id !== item.id);

    // 2. Sort remaining segments
    const sorted = filtered.sort((a, b) => a.start - b.start);

    // 3. Find NEW insertion index
    let insertIndex = sorted.findIndex(s => s.start >= dropTime);
    if (insertIndex === -1) insertIndex = sorted.length;

    // 4. Insert at new position
    // We reuse the existing item, but its start time will be recalculated
    sorted.splice(insertIndex, 0, item);

    // 5. Recalculate start times (Magnetic Ripple)
    let cursor = 0;
    const recalculated = sorted.map(seg => {
      const updated = { ...seg, start: cursor };
      cursor += seg.duration;
      return updated;
    });

    setSegments(recalculated);
    toast.success("Clip Reordered", { description: "Timeline updated." });
  };

  const handleDragStart = (e: React.DragEvent, item: any, type: "scene" | "b-roll" | "existing-segment") => {
    // Defer state update to avoid blocking the drag initiation (which can happen if pointer-events changes immediately)
    setTimeout(() => setIsDraggingClip(true), 0);
    e.dataTransfer.setData("application/json", JSON.stringify({ ...item, _type: type }));
    e.dataTransfer.effectAllowed = "copyMove"; // Allow both to satisfy drop targets that strictly ask for copy or move
  };

  const handleDragEnd = () => {
    setIsDraggingClip(false);
  };



  const handleTrackDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const trackRect = e.currentTarget.getBoundingClientRect();
    // Calculate time based on mouse position relative to the track start
    // Note: The track container is scrollable, but we are dropping onto the track CONTENT div
    // We need the pointer X relative to the track CONTENT div's left edge.
    const offsetX = e.clientX - trackRect.left;
    const dropTime = offsetX / scale;

    const data = e.dataTransfer.getData("application/json");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        // We expect _type to be present from handleDragStart
        if (parsed._type === "existing-segment") {
          handleMoveClip(parsed, dropTime);
        } else if (parsed._type === "scene" || parsed._type === "b-roll") {
          handleAddClip(parsed, parsed._type, dropTime);
        }
      } catch (err) {
        console.error("Failed to parse drag data", err);
      }
    }
    setIsDraggingClip(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleTopTail = (mode: "top" | "tail") => {
    if (segments.length === 0) return;
    // Mock logic: just trim 1 second from the first clip found at cursor?
    // For demo, just show toast
    toast.info(`Performed ${mode === "top" ? "Top (Q)" : "Tail (W)"} Edit`, {
      description: "Mock: Trimmed clip boundary to playhead."
    });
  };

  const handleJumpCut = () => {
    toast.success("Jump Cuts Applied", {
      description: "Removed silent pauses > 0.5s (Mock)."
    });
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    // If dragging, ignore click to prevent double update or jitter
    if (isDraggingPlayhead) return;

    updatePlayheadPosition(e.clientX);
  };

  const updatePlayheadPosition = (clientX: number) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const offsetX = clientX - rect.left + scrollLeft - 64; // 64px is header width
    const newTime = Math.max(0, offsetX / scale);
    setCurrentTime(newTime);
  };

  const handlePlayheadDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPlayhead(true);
  };

  // Add global mouse listeners for dragging
  // We use useEffect to attach window listeners so dragging works even if mouse leaves the element
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPlayhead) {
        e.preventDefault();
        updatePlayheadPosition(e.clientX);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingPlayhead) {
        setIsDraggingPlayhead(false);
      }
    };

    if (isDraggingPlayhead) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingPlayhead, scale]);

  const handleAddPlaceholder = () => {
    const newSeg: TimelineSegment = {
      id: `ph-${Date.now()}`,
      type: "video",
      trackId: "V1",
      start: segments.length > 0 ? segments[segments.length - 1].start + segments[segments.length - 1].duration : 0,
      duration: 5,
      color: "bg-gray-500",
      label: "Placeholder",
      content: "Insert Graphic"
    };
    setSegments([...segments, newSeg]);
    toast.success("Placeholder Added");
  };

  const handleDeleteSegment = () => {
    if (!selectedSegmentId) return;

    // --- Magnetic Timeline Logic (Delete & Ripple) ---
    // 1. Filter out the deleted segment
    const remaining = segments.filter(s => s.id !== selectedSegmentId);

    // 2. Sort remaining segments
    const sorted = remaining.sort((a, b) => a.start - b.start);

    // 3. Recalculate start times to close the gap
    let cursor = 0;
    const recalculated = sorted.map(seg => {
      const updated = { ...seg, start: cursor };
      cursor += seg.duration;
      return updated;
    });

    setSegments(recalculated);
    setSelectedSegmentId(null);
    toast.success("Segment Deleted", { description: "Timeline ripple-deleted (gap closed)." });
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Project Saved", { description: "Timeline state has been persisted." });
    }, 800);
  };

  const handleExport = () => {
    setIsExporting(true);
    toast.info("Rendering Video...", { description: "This may take a few moments." });

    // Simulate Render Process
    setTimeout(() => {
      const newVersion: RenderedVersion = {
        id: `v${versions.length + 1}`,
        name: `Rough_Cut_v${versions.length + 1}.mp4`,
        timestamp: new Date().toLocaleString(),
        duration: formatTime(segments.reduce((acc, curr) => Math.max(acc, curr.start + curr.duration), 0)),
        size: "45 MB"
      };
      setVersions([newVersion, ...versions]);
      setIsExporting(false);
      setIsHistoryOpen(true); // Open history to show result
      toast.success("Export Complete", { description: "New version available in history." });
    }, 2000);
  };

  const handleRestoreVersion = (version: RenderedVersion) => {
    // Mock Restore Logic
    setIsHistoryOpen(false);
    toast.success(`Restored ${version.name}`, {
      description: "Timeline state has been reverted to this version."
    });
    // In a real app, this would replace 'segments' with the data stored in the version
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">

      {/* 1. Header & Toolbar */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Scissors className="h-5 w-5" />
            <span>Rough Cut</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
            <Button
              variant={selectedTool === "select" ? "secondary" : "ghost"}
              size="icon" className="h-7 w-7"
              onClick={() => setSelectedTool("select")} title="Selection Tool (V)"
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === "razor" ? "secondary" : "ghost"}
              size="icon" className="h-7 w-7"
              onClick={() => setSelectedTool("razor")} title="Razor Tool (C)"
            >
              <Split className="h-4 w-4 rotate-90" />
            </Button>
            <Button
              variant={selectedTool === "ripple" ? "secondary" : "ghost"}
              size="icon" className="h-7 w-7"
              onClick={() => setSelectedTool("ripple")} title="Ripple Edit (B)"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Editing Tools */}
          <div className="flex items-center gap-2 mr-2">
            <Button variant="outline" size="sm" onClick={() => handleTopTail("top")}>
              <SkipBack className="h-3 w-3 mr-1" /> Top (Q)
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleTopTail("tail")}>
              <SkipForward className="h-3 w-3 mr-1" /> Tail (W)
            </Button>
            <Button variant="outline" size="sm" onClick={handleJumpCut}>
              <Wand2 className="h-3 w-3 mr-1" /> Jump Cut
            </Button>
            <Button size="sm" variant="secondary" onClick={handleAddPlaceholder}>
              <Plus className="h-3 w-3 mr-1" /> Placeholder
            </Button>
            <Button size="sm" variant="secondary" onClick={handleAddPlaceholder}>
              <Plus className="h-3 w-3 mr-1" /> Placeholder
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSegment}
              disabled={!selectedSegmentId}
              title="Delete Selected Clip (Del)"
            >
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Project Management */}
          <Button variant="ghost" size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>

          <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <History className="h-4 w-4 mr-2" />
                Versions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Version History</DialogTitle>
                <DialogDescription>
                  Review and manage your rendered exports.
                </DialogDescription>
              </DialogHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No exported versions yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    versions.map((ver) => (
                      <TableRow key={ver.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <FileVideo className="h-4 w-4 text-blue-500" />
                          {ver.name}
                        </TableCell>
                        <TableCell>{ver.timestamp}</TableCell>
                        <TableCell>{ver.duration}</TableCell>
                        <TableCell>{ver.size}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon" variant="ghost" className="h-8 w-8 text-orange-500 hover:text-orange-600"
                                    onClick={() => handleRestoreVersion(ver)}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Restore this version</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <Play className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Preview video</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Download file</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>

          <Button size="sm" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* 2. Assembly Bin (Source) */}
        <div className="w-64 border-r flex flex-col bg-muted/10 shrink-0">
          <div className="p-3 border-b text-xs font-semibold uppercase text-muted-foreground flex justify-between">
            <span>Assembly Bin</span>
            <Button variant="ghost" size="icon" className="h-4 w-4" onClick={handleAutoAssemble} title="Auto Assemble All">
              <Layers className="h-3 w-3" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {INITIAL_SCENES.map(scene => (
                <div
                  key={scene.id}
                  className="group flex flex-col gap-1 p-2 rounded border bg-card hover:border-primary cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => handleDragStart(e, scene, "scene")}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleAddClip(scene, "scene")}
                >
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">Scene {scene.order}</Badge>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span>{formatTime(scene.duration)}</span>
                      <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <p className="text-xs font-medium line-clamp-2">{scene.content}</p>
                  <div className="h-1 w-full rounded-full mt-1 opacity-50" style={{ backgroundColor: scene.color.replace("bg-", "").replace("-500", "") }} />
                </div>
              ))}

              <Separator className="my-2" />
              <div className="text-xs text-muted-foreground px-1 pb-1 font-semibold">B-Roll (Click to Add)</div>
              {INITIAL_B_ROLL.map(bRoll => (
                <div
                  key={bRoll.id}
                  className="flex items-center gap-2 p-2 rounded border bg-card opacity-80 hover:opacity-100 cursor-grab active:cursor-grabbing hover:border-primary transition-all"
                  draggable
                  onDragStart={(e) => handleDragStart(e, bRoll, "b-roll")}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleAddClip(bRoll, "b-roll")}
                >
                  <div className="h-8 w-12 bg-black/20 rounded flex items-center justify-center shrink-0">
                    <Video className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate font-medium">{bRoll.name}</p>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>{formatTime(bRoll.duration)}</span>
                      <Plus className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* 3. Main Workspace */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Top: Preview Player */}
          <div className="flex-1 bg-black flex flex-col items-center justify-center relative min-h-[300px]">
            <div className="relative aspect-video max-h-[80%] w-[90%] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl flex items-center justify-center overflow-hidden">
              <p className="text-zinc-500 font-medium">Program Monitor (Preview)</p>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur rounded-full px-4 py-2 flex items-center gap-4 text-white">
                <SkipBack className="h-4 w-4 cursor-pointer hover:text-primary" />
                {isPlaying ? (
                  <Pause className="h-6 w-6 cursor-pointer hover:text-primary" onClick={() => setIsPlaying(false)} />
                ) : (
                  <Play className="h-6 w-6 cursor-pointer hover:text-primary" onClick={() => setIsPlaying(true)} />
                )}
                <SkipForward className="h-4 w-4 cursor-pointer hover:text-primary" />
              </div>
              <div className="absolute top-4 right-4 font-mono text-sm text-white bg-black/50 px-2 py-1 rounded">
                {formatTime(currentTime)}
              </div>
            </div>
          </div>

          {/* Bottom: Timeline */}
          <div className="h-72 bg-zinc-900 border-t flex flex-col shrink-0">

            {/* Timeline Toolbar / Time Ruler */}
            <div className="h-8 border-b border-zinc-800 bg-zinc-950 flex items-center px-4 justify-between">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
                <span>00:00</span>
                <span>|</span>
                <span>00:15</span>
                <span>|</span>
                <span>00:30</span>
                <span>|</span>
                <span>00:45</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-xs">Zoom</span>
                <Slider
                  defaultValue={[10]} max={50} min={10} step={1}
                  className="w-24"
                  onValueChange={(v) => setScale(v[0])}
                />
              </div>
            </div>

            {/* Tracks */}
            <div
              className="flex-1 overflow-x-auto overflow-y-hidden relative timeline-scroll-area"
              ref={timelineRef}
              onClick={handleTimelineClick}
            >
              <style>{`
                .timeline-scroll-area::-webkit-scrollbar {
                  height: 10px;
                  background-color: #18181b; /* zinc-950 */
                }
                .timeline-scroll-area::-webkit-scrollbar-thumb {
                  background-color: #3f3f46; /* zinc-700 */
                  border-radius: 5px;
                  border: 2px solid #18181b;
                }
                .timeline-scroll-area::-webkit-scrollbar-thumb:hover {
                  background-color: #52525b; /* zinc-600 */
                }
              `}</style>
              <div
                className="min-w-full h-full flex flex-col relative"
                style={{
                  width: `${Math.max(100, (segments.reduce((acc, s) => Math.max(acc, s.start + s.duration), 0) * scale) + 500)}px`
                }}
              >

                {/* Playhead Line */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-red-500 z-50 group cursor-ew-resize"
                  style={{ left: `${(currentTime * scale) + 64}px` /* 64px offset for track header */ }}
                  onMouseDown={handlePlayheadDragStart}
                >
                  <div className="absolute -top-1 -translate-x-1/2 text-[10px] bg-red-500 text-white px-1 rounded-sm">▼</div>

                  {/* Invisible Hit Area for easier grabbing */}
                  <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 bg-transparent hover:bg-white/10" />
                </div>

                {/* Track V1 */}
                {/* Track V1 */}
                <div className="h-24 border-b border-zinc-800 flex relative group bg-zinc-900/50">
                  <div className="w-16 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center text-xs text-zinc-500 font-bold sticky left-0 z-20 pointer-events-none">
                    V1
                    <Video className="h-3 w-3 mt-1 opacity-50" />
                  </div>
                  <div
                    className="flex-1 relative py-2"
                    onDragOver={handleDragOver}
                    onDrop={handleTrackDrop}
                  >
                    {segments.filter(s => s.trackId === "V1").map(seg => (
                      <div
                        key={seg.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, seg, "existing-segment")}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "absolute top-2 bottom-2 rounded-md border border-white/10 overflow-hidden cursor-pointer hover:brightness-110 active:brightness-90 transition-all flex flex-col justify-center px-2 shadow-sm",
                          seg.color,
                          selectedSegmentId === seg.id ? "ring-2 ring-white z-20" : "",
                          "text-white",
                          isDraggingClip ? "pointer-events-none" : ""
                        )}
                        style={{
                          left: `${seg.start * scale}px`,
                          width: `${seg.duration * scale}px`,
                          zIndex: selectedSegmentId === seg.id ? 30 : 10
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentTime(seg.start);
                          setSelectedSegmentId(seg.id);
                        }}
                      >
                        <div className="text-[10px] font-bold truncate flex items-center gap-1">
                          <GripVertical className="h-3 w-3 opacity-50" />
                          {seg.label} <span className="text-[9px] opacity-70 font-normal">({formatTime(seg.duration)})</span>
                        </div>
                        <div className="text-[9px] opacity-80 truncate">{seg.content}</div>

                        {/* Handles Visualization */}
                        <div className="absolute left-0 top-0 bottom-0 w-2 hover:bg-white/20 cursor-w-resize" title="Trim Start" />
                        <div className="absolute right-0 top-0 bottom-0 w-2 hover:bg-white/20 cursor-e-resize" title="Trim End" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Track A1 */}
                <div className="h-16 border-b border-zinc-800 flex relative bg-zinc-900/50">
                  <div className="w-16 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center text-xs text-zinc-500 font-bold sticky left-0 z-20">
                    A1
                    <Music className="h-3 w-3 mt-1 opacity-50" />
                  </div>
                  <div className="flex-1 relative py-3 opacity-50">
                    {/* Mock Audio Wave */}
                    <div className="absolute left-0 right-0 top-1/2 h-8 -translate-y-1/2 bg-emerald-900/30 w-[800px] border border-emerald-800/50 rounded flex items-center justify-center text-[10px] text-emerald-500">
                      Background Music (Placeholder)
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div >
    </div >
  );
}
