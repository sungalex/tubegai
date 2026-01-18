import { useState } from "react";
import { Video, Wand2, Zap, Layers, Settings2, Palette, Type, Fingerprint } from "lucide-react";
import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import { Label } from "~/common/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/common/components/ui/select";
import { Slider } from "~/common/components/ui/slider";
import { Switch } from "~/common/components/ui/switch";
import { Separator } from "~/common/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import { Textarea } from "~/common/components/ui/textarea";
import { Input } from "~/common/components/ui/input";
import { Badge } from "~/common/components/ui/badge";

interface VideoGeneratorSidebarProps {
  onGenerateAll: () => void;
  isGenerating: boolean;
}

export function VideoGeneratorSidebar({
  onGenerateAll,
  isGenerating,
}: VideoGeneratorSidebarProps) {
  // Basic Settings
  const [model, setModel] = useState("kling");
  const [duration, setDuration] = useState("auto");
  const [motionStrength, setMotionStrength] = useState([5]);
  const [camera, setCamera] = useState("dynamic");

  // Style References
  const [matchScript, setMatchScript] = useState(true);
  const [matchStoryboard, setMatchStoryboard] = useState(true);
  const [matchChannel, setMatchChannel] = useState(false);

  // Pro Settings
  const [seed, setSeed] = useState<string>("");
  const [fps, setFps] = useState("24");
  const [guidanceScale, setGuidanceScale] = useState([5]); // CFG
  const [samplingSteps, setSamplingSteps] = useState([30]);

  // Text Directives
  const [customPrompt, setCustomPrompt] = useState("");

  return (
    <Card className="h-auto lg:h-full border-none shadow-none bg-muted/10 rounded-none border-t lg:border-t-0 lg:border-l w-full lg:w-1/3 shrink-0 flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          AI Video Generator
        </CardTitle>
        <CardDescription>
          Professional tools to bring your scenes to life.
        </CardDescription>
      </CardHeader>

      <CardContent id="video-sidebar-scroll-area" className="flex-1 overflow-y-auto px-4 pb-4">

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="pro">Pro Settings</TabsTrigger>
          </TabsList>

          {/* === BASIC TAB === */}
          <TabsContent value="basic" className="space-y-6 mt-0">
            {/* Model Selection */}
            <div className="space-y-3">
              <Label>AI Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kling">
                    <div className="flex items-center justify-between w-full">
                      <span>Kling AI</span>
                      <Badge variant="secondary" className="text-[10px] h-4">Realistic</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="runway">Runway Gen-3</SelectItem>
                  <SelectItem value="luma">Luma Dream Machine</SelectItem>
                  <SelectItem value="svd">Stable Video Diffusion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Style Reference Context */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  Style References
                </Label>
              </div>

              <div className="grid gap-3 p-3 border rounded-lg bg-background/50">
                <div className="flex items-center justify-between">
                  <Label htmlFor="match-script" className="text-xs font-normal cursor-pointer">Match Script Tone</Label>
                  <Switch id="match-script" checked={matchScript} onCheckedChange={setMatchScript} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="match-storyboard" className="text-xs font-normal cursor-pointer">Match Storyboard Visuals</Label>
                  <Switch id="match-storyboard" checked={matchStoryboard} onCheckedChange={setMatchStoryboard} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="match-channel" className="text-xs font-normal cursor-pointer">Apply Channel Branding</Label>
                  <Switch id="match-channel" checked={matchChannel} onCheckedChange={setMatchChannel} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Motion & Camera */}
            <div className="space-y-4">
              <Label>Movement Control</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Camera</Label>
                  <Select value={camera} onValueChange={setCamera}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dynamic">Dynamic</SelectItem>
                      <SelectItem value="static">Static</SelectItem>
                      <SelectItem value="zoom_in">Zoom In</SelectItem>
                      <SelectItem value="pan">Pan</SelectItem>
                      <SelectItem value="roll">Roll</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs text-muted-foreground">Intensity</Label>
                    <span className="text-[10px] text-muted-foreground">{motionStrength[0]}</span>
                  </div>
                  <Slider
                    value={motionStrength}
                    onValueChange={setMotionStrength}
                    max={10}
                    step={1}
                    min={1}
                    className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Text Directives */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                Additional Instructions
              </Label>
              <Textarea
                placeholder="e.g. Make it look like a 90s VHS tape, add grain, slow motion..."
                className="h-20 text-xs resize-none"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
            </div>

          </TabsContent>

          {/* === PRO TAB === */}
          <TabsContent value="pro" className="space-y-6 mt-0">

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">Advanced Parameters</h4>
              </div>

              {/* Seed */}
              <div className="space-y-2">
                <Label className="text-xs">Seed (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Random (-1)"
                    className="h-8 text-xs font-mono"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                  />
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSeed(Math.floor(Math.random() * 1000000).toString())}>
                    <Fingerprint className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Use same seed for consistent results.</p>
              </div>

              {/* FPS & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Duration Strategy</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-Split</SelectItem>
                      <SelectItem value="short">4s (Safe)</SelectItem>
                      <SelectItem value="long">8s (Beta)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Frame Rate (FPS)</Label>
                  <Select value={fps} onValueChange={setFps}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 fps (Film)</SelectItem>
                      <SelectItem value="30">30 fps (Video)</SelectItem>
                      <SelectItem value="60">60 fps (Smooth)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Internal Model Params */}
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Guidance Scale (CFG)</Label>
                    <span className="text-[10px] text-muted-foreground">{guidanceScale[0]}</span>
                  </div>
                  <Slider
                    value={guidanceScale}
                    onValueChange={setGuidanceScale}
                    max={20}
                    step={0.5}
                    min={1}
                  />
                  <p className="text-[10px] text-muted-foreground">Higher = stricter adherence to prompt.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Sampling Steps</Label>
                    <span className="text-[10px] text-muted-foreground">{samplingSteps[0]}</span>
                  </div>
                  <Slider
                    value={samplingSteps}
                    onValueChange={setSamplingSteps}
                    max={50}
                    step={1}
                    min={10}
                  />
                  <p className="text-[10px] text-muted-foreground">More steps = higher quality but slower.</p>
                </div>
              </div>

            </div>

          </TabsContent>
        </Tabs>

      </CardContent>

      <CardFooter className="flex-col gap-2 pt-2 pb-6 border-t bg-muted/5">
        <Button
          className="w-full h-12 text-base shadow-lg animate-pulse hover:animate-none"
          onClick={onGenerateAll}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Zap className="mr-2 h-4 w-4 animate-spin" /> Generating Videos...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" /> Generate All Videos
            </>
          )}
        </Button>
        <p className="text-[10px] text-center text-muted-foreground">Estimated cost: ~{(Number(samplingSteps[0]) / 10 * 12).toFixed(0)} Credits</p>
      </CardFooter>
    </Card>
  );
}
