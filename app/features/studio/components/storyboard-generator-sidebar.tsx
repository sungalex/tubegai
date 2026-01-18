import { useState } from "react";
import { Wand2, Zap, MonitorPlay, User, Image as ImageIcon, ChevronDown } from "lucide-react";
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
import { Textarea } from "~/common/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/common/components/ui/accordion";

interface StoryboardGeneratorSidebarProps {
  onGenerateAll: () => void;
  isGenerating: boolean;
}

export function StoryboardGeneratorSidebar({
  onGenerateAll,
  isGenerating,
}: StoryboardGeneratorSidebarProps) {
  const [style, setStyle] = useState("cinematic");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [density, setDensity] = useState([50]);
  const [camera, setCamera] = useState("none");
  const [lighting, setLighting] = useState("cinematic");
  const [negativePrompt, setNegativePrompt] = useState("");

  return (
    <Card className="h-auto lg:h-full border-none shadow-none bg-muted/10 rounded-none border-t lg:border-t-0 lg:border-l w-full lg:w-1/3 shrink-0 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          AI Generator
        </CardTitle>
        <CardDescription>
          Configure parameters for auto-generating your storyboard.
        </CardDescription>
      </CardHeader>

      <CardContent id="sidebar-scroll-area" className="space-y-6 flex-1 overflow-y-auto px-4">
        {/* Visual Style */}
        <div className="space-y-3">
          <Label>Visual Style</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setStyle("cinematic")}
              className={`p-2 rounded border text-left text-xs transition-colors ${style === "cinematic" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"}`}
            >
              <div className="aspect-video bg-neutral-900 rounded mb-1 w-full" />
              <span className="font-medium block">Cinematic</span>
            </button>
            <button
              onClick={() => setStyle("anime")}
              className={`p-2 rounded border text-left text-xs transition-colors ${style === "anime" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"}`}
            >
              <div className="aspect-video bg-pink-100 rounded mb-1 w-full" />
              <span className="font-medium block">Anime</span>
            </button>
            <button
              onClick={() => setStyle("lineart")}
              className={`p-2 rounded border text-left text-xs transition-colors ${style === "lineart" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"}`}
            >
              <div className="aspect-video bg-white border border-gray-200 rounded mb-1 w-full" />
              <span className="font-medium block">Line Art</span>
            </button>
            <button
              onClick={() => setStyle("3d")}
              className={`p-2 rounded border text-left text-xs transition-colors ${style === "3d" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"}`}
            >
              <div className="aspect-video bg-blue-100 rounded mb-1 w-full" />
              <span className="font-medium block">3D Render</span>
            </button>
          </div>
        </div>

        <Separator />

        {/* Aspect Ratio */}
        <div className="space-y-3">
          <Label>Aspect Ratio</Label>
          <div className="grid grid-cols-4 gap-2">
            {["16:9", "9:16", "2.35:1", "4:3"].map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-2 py-2 rounded border text-xs text-center transition-colors ${aspectRatio === ratio
                  ? "border-primary bg-primary/5 ring-1 ring-primary font-medium"
                  : "hover:bg-muted text-muted-foreground"
                  }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Scene Density */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>Scene Density</Label>
            <span className="text-xs text-muted-foreground">{density[0] > 70 ? "High" : density[0] < 30 ? "Low" : "Balanced"}</span>
          </div>
          <Slider
            value={density}
            onValueChange={setDensity}
            max={100}
            step={10}
            className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
          />
        </div>

        <Separator />

        {/* Advanced Options Accordion */}
        <Accordion
          type="single"
          collapsible
          className="w-full"
          onValueChange={(value) => {
            if (value === "advanced") {
              // Use setTimeout to allow DOM update
              setTimeout(() => {
                const container = document.getElementById("sidebar-scroll-area");
                const trigger = document.getElementById("advanced-settings-trigger");

                if (container && trigger) {
                  const containerRect = container.getBoundingClientRect();
                  const triggerRect = trigger.getBoundingClientRect();

                  // Calculate offset relative to container's visible top
                  const offset = triggerRect.top - containerRect.top;

                  // Scroll the container, not the window
                  container.scrollBy({ top: offset, behavior: "smooth" });
                }
              }, 100);
            }
          }}
        >
          <AccordionItem value="advanced" className="border-none">
            <AccordionTrigger
              id="advanced-settings-trigger"
              className="py-2 hover:no-underline text-sm font-medium"
            >
              Advanced Settings
            </AccordionTrigger>
            <AccordionContent className="space-y-5 pt-4">

              {/* Camera Movement */}
              <div className="space-y-2">
                <Label className="text-xs">Camera Movement</Label>
                <Select value={camera} onValueChange={setCamera}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select movement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Static)</SelectItem>
                    <SelectItem value="pan">Pan</SelectItem>
                    <SelectItem value="tilt">Tilt</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="handheld">Handheld</SelectItem>
                    <SelectItem value="drone">Drone Shot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lighting Style */}
              <div className="space-y-2">
                <Label className="text-xs">Lighting Style</Label>
                <Select value={lighting} onValueChange={setLighting}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select lighting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cinematic">Cinematic</SelectItem>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="neon">Neon / Cyberpunk</SelectItem>
                    <SelectItem value="golden">Golden Hour</SelectItem>
                    <SelectItem value="lowkey">Low Key (Dark)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Negative Prompt */}
              <div className="space-y-2">
                <Label className="text-xs">Negative Prompt</Label>
                <Textarea
                  placeholder="e.g. blur, watermark, distorted text, low quality"
                  className="min-h-[60px] text-xs resize-none"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                />
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="consistent-character" className="flex flex-col space-y-1 cursor-pointer">
                    <span>Consistent Character</span>
                    <span className="font-normal text-[10px] text-muted-foreground">Maintain host face across shots.</span>
                  </Label>
                  <Switch id="consistent-character" defaultChecked />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="enhance-prompt" className="flex flex-col space-y-1 cursor-pointer">
                    <span>Prompt Magic</span>
                    <span className="font-normal text-[10px] text-muted-foreground">AI rewrites simple descriptions.</span>
                  </Label>
                  <Switch id="enhance-prompt" defaultChecked />
                </div>
              </div>

            </AccordionContent>
          </AccordionItem>
        </Accordion>

      </CardContent>

      <CardFooter className="flex-col gap-2 pt-2 pb-6 border-t bg-muted/5">
        <Button
          className="w-full h-12 text-base shadow-lg animate-pulse hover:animate-none"
          onClick={onGenerateAll}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Zap className="mr-2 h-4 w-4 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" /> Generate Project Storyboard
            </>
          )}
        </Button>
        <p className="text-[10px] text-center text-muted-foreground">Estimated cost: ~15 Credits</p>
      </CardFooter>
    </Card>
  );
}
