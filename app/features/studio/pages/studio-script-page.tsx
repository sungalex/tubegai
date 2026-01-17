import { useState } from "react";
import { useParams, Link } from "react-router";
import {
  Sparkles,
  Save,
  Plus,
  Trash2,
  MoveVertical,
  Clock,
  Wand2,
  RotateCcw,
  Check
} from "lucide-react";

import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import { Label } from "~/common/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/common/components/ui/select";
import { toast } from "sonner";
import { StudioProjectSelector } from "../components/studio-project-selector";

export const meta = () => {
  return [
    { title: "Script Editor | TubeGAI" },
    { name: "description", content: "Write and edit your video script with AI assistance." },
  ];
};

// Mock Data Types
type Segment = {
  id: string;
  type: "hook" | "intro" | "body" | "cta" | "outro";
  content: string;
  duration: number; // seconds
};

const MOCK_SCRIPT: Segment[] = [
  { id: "1", type: "hook", content: "Did you know that 80% of jobs might be affected by AI in the next 5 years? But don't panic...", duration: 15 },
  { id: "2", type: "intro", content: "Hi everyone, welcome back to the channel. Today we are diving deep into the future of work...", duration: 30 },
  { id: "3", type: "body", content: "First, let's talk about automation. It's not just about robots in factories anymore...", duration: 120 },
  { id: "4", type: "cta", content: "If you're finding this useful, don't forget to like and subscribe for more tech insights.", duration: 10 },
  { id: "5", type: "outro", content: "Thanks for watching. See you in the next video!", duration: 15 },
];

export default function StudioScriptPage() {
  const { projectId } = useParams();
  const [segments, setSegments] = useState<Segment[]>(MOCK_SCRIPT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");

  // Handle No Project
  if (!projectId) {
    return (
      <StudioProjectSelector
        title="Script Editor"
        description="Select a project to start writing or editing your script."
        context="script"
      />
    );
  }

  const handleUpdateSegment = (id: string, content: string) => {
    setSegments(prev => prev.map(seg => seg.id === id ? { ...seg, content } : seg));
  };

  const handleDeleteSegment = (id: string) => {
    setSegments(prev => prev.filter(seg => seg.id !== id));
  };

  const handleAddSegment = () => {
    const newSegment: Segment = {
      id: Date.now().toString(),
      type: "body",
      content: "",
      duration: 0
    };
    setSegments([...segments, newSegment]);
  };

  const handleGenerateScript = () => {
    if (!prompt) return;
    setIsGenerating(true);

    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      toast("Script Generated", {
        description: "AI has successfully created a new script draft based on your prompt."
      });
      // In a real app, we would update state here.
    }, 2000);
  };

  const totalDuration = segments.reduce((acc, curr) => acc + curr.duration, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Script Editor</h1>
          <p className="text-muted-foreground">Draft your narrative with the help of Gemini AI.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full mr-2">
            <Clock className="w-4 h-4 mr-2" />
            <span>Est. Duration: {Math.floor(totalDuration / 60)}m {totalDuration % 60}s</span>
          </div>
          <Button variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
          <Button size="sm">
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-0">

        {/* Left Col: Script Editor (Scrollable) */}
        <div className="lg:col-span-2 flex flex-col min-h-0 bg-background rounded-lg border shadow-sm">
          <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
            <h2 className="font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              Script Segments
            </h2>
            <Button variant="ghost" size="sm" onClick={handleAddSegment}>
              <Plus className="w-4 h-4 mr-1" /> Add Segment
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {segments.map((segment, index) => (
              <div key={segment.id} className="relative group">
                <div className="absolute -left-8 top-8 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-muted-foreground">
                  <MoveVertical className="w-4 h-4" />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="uppercase text-[10px] tracking-wider min-w-[60px] justify-center">
                    {segment.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Segment {index + 1}</span>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteSegment(segment.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <Textarea
                  value={segment.content}
                  onChange={(e) => handleUpdateSegment(segment.id, e.target.value)}
                  className="min-h-[100px] resize-none text-base leading-relaxed"
                  placeholder="Write your script here..."
                />

                <div className="text-right mt-1">
                  <span className="text-xs text-muted-foreground">
                    ~{Math.ceil(segment.content.length / 15)} sec read
                  </span>
                </div>
              </div>
            ))}

            <Button variant="outline" className="w-full border-dashed py-8 text-muted-foreground" onClick={handleAddSegment}>
              <Plus className="w-4 h-4 mr-2" /> Add New Segment
            </Button>
          </div>
        </div>

        {/* Right Col: AI Assistant (Fixed) */}
        <div className="lg:col-span-1 flex flex-col gap-6 min-h-0">

          {/* AI Generate Card */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <Sparkles className="w-5 h-5" /> AI Writer
              </CardTitle>
              <CardDescription>
                Generate a full script or rewrite specific sections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic / Title</Label>
                <Input id="topic" placeholder="e.g. How to use ChatGPT for coding" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select defaultValue="informative">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="informative">Informative</SelectItem>
                      <SelectItem value="casual">Casual & Fun</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="dramatic">Dramatic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Length</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (30s)</SelectItem>
                      <SelectItem value="medium">Medium (2m)</SelectItem>
                      <SelectItem value="long">Long (5m+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleGenerateScript} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Wand2 className="w-4 h-4 mr-2 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Generate Script
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Quick Tools */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Refinement Tools</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start">
                <Wand2 className="w-4 h-4 mr-2" /> Improve Grammar
              </Button>
              <Button variant="outline" className="justify-start">
                <RotateCcw className="w-4 h-4 mr-2" /> Make it Shorter
              </Button>
              <Button variant="outline" className="justify-start">
                <Plus className="w-4 h-4 mr-2" /> Expand Section
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
