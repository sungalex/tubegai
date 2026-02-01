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
import type { ScriptSegment } from "~/common/types/studio.types";
import { getScriptSegments } from "~/common/data/studio.data";
import type { Route } from "./+types/studio-script-page";
import { useTranslation } from "~/i18n/context";
// import { useLoaderData, type LoaderFunctionArgs } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
  if (!params.projectId) {
    return { segments: [] };
  }
  const segments = await getScriptSegments(params.projectId);
  return { segments };
}

export const meta = () => {
  return [
    { title: "Script Editor | TubeGAI" },
    { name: "description", content: "Write and edit your video script with AI assistance." },
  ];
};

export default function StudioScriptPage({ loaderData }: Route.ComponentProps) {
  const { projectId } = useParams();
  const { segments: initialSegments } = loaderData;
  const [segments, setSegments] = useState<ScriptSegment[]>(initialSegments);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const { t } = useTranslation("studio");
  const { t: tc } = useTranslation("common");

  // Handle No Project
  if (!projectId) {
    return (
      <StudioProjectSelector
        title={t("script.title")}
        description={t("script.subtitle")}
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
    const newSegment: ScriptSegment = {
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
          <h1 className="text-2xl font-bold tracking-tight">{t("script.title")}</h1>
          <p className="text-muted-foreground">{t("script.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full mr-2">
            <Clock className="w-4 h-4 mr-2" />
            <span>{t("script.estDuration")} {Math.floor(totalDuration / 60)}m {totalDuration % 60}s</span>
          </div>
          <Button variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" /> {tc("button.reset")}
          </Button>
          <Button size="sm">
            <Save className="w-4 h-4 mr-2" /> {tc("button.saveChanges")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-0">

        {/* Left Col: Script Editor (Scrollable) */}
        <div className="lg:col-span-2 flex flex-col min-h-0 bg-background rounded-lg border shadow-sm">
          <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
            <h2 className="font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              {t("script.segments.title")}
            </h2>
            <Button variant="ghost" size="sm" onClick={handleAddSegment}>
              <Plus className="w-4 h-4 mr-1" /> {t("script.segments.addSegment")}
            </Button>
          </div>


          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {segments.map((segment, index) => (
              <div key={segment.id} className="relative group">
                <div className="absolute -left-8 top-8 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-muted-foreground">
                  <MoveVertical className="w-4 h-4" />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="uppercase text-[10px] tracking-wider min-w-15 justify-center">
                    {segment.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{t("script.segments.segment", { number: index + 1 })}</span>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteSegment(segment.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <Textarea
                  value={segment.content}
                  onChange={(e) => handleUpdateSegment(segment.id, e.target.value)}
                  className="min-h-25 resize-none text-base leading-relaxed"
                  placeholder={t("script.segments.placeholder")}
                />

                <div className="text-right mt-1">
                  <span className="text-xs text-muted-foreground">
                    {t("script.segments.readTime", { seconds: Math.ceil(segment.content.length / 15) })}
                  </span>
                </div>
              </div>
            ))}

            <Button variant="outline" className="w-full border-dashed py-8 text-muted-foreground" onClick={handleAddSegment}>
              <Plus className="w-4 h-4 mr-2" /> {t("script.segments.addNew")}
            </Button>
          </div>
        </div>

        {/* Right Col: AI Assistant (Fixed) */}
        <div className="lg:col-span-1 flex flex-col gap-6 min-h-0">

          {/* AI Generate Card */}
          <Card className="bg-muted/50 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Sparkles className="w-5 h-5" /> {t("script.aiWriter.title")}
              </CardTitle>
              <CardDescription>
                {t("script.aiWriter.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">{t("script.aiWriter.topicTitle")}</Label>
                <Input id="topic" placeholder={t("script.aiWriter.topicPlaceholder")} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("script.aiWriter.tone")}</Label>
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
                  <Label>{t("script.aiWriter.length")}</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">{t("script.aiWriter.shortLength")}</SelectItem>
                      <SelectItem value="medium">{t("script.aiWriter.mediumLength")}</SelectItem>
                      <SelectItem value="long">{t("script.aiWriter.longLength")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleGenerateScript} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Wand2 className="w-4 h-4 mr-2 animate-spin" /> {t("script.aiWriter.generating")}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> {t("script.aiWriter.generate")}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Quick Tools */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("script.refinement.title")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start">
                <Wand2 className="w-4 h-4 mr-2" /> {t("script.refinement.improveGrammar")}
              </Button>
              <Button variant="outline" className="justify-start">
                <RotateCcw className="w-4 h-4 mr-2" /> {t("script.refinement.makeShorter")}
              </Button>
              <Button variant="outline" className="justify-start">
                <Plus className="w-4 h-4 mr-2" /> {t("script.refinement.expandSection")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
