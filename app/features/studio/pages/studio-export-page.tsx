import { useState, useEffect } from "react";
import { useParams } from "react-router";
import {
  Download, Upload, Share2, Youtube,
  CheckCircle2, AlertCircle, FileVideo,
  Settings2, Calendar as CalendarIcon, Clock
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/common/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "~/common/components/ui/card";
import { Progress } from "~/common/components/ui/progress";
import { Separator } from "~/common/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import { Switch } from "~/common/components/ui/switch";
import { Label } from "~/common/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/common/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "~/common/components/ui/popover";
import { Calendar } from "~/common/components/ui/calendar";
import { StudioProjectSelector } from "../components/studio-project-selector";
import { cn } from "~/lib/utils";

export const meta = () => {
  return [
    { title: "Export | TubeGAI" },
    { name: "description", content: "Render and publish your video." },
  ];
};

export default function StudioExportPage() {
  const { projectId } = useParams();

  // State
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderComplete, setRenderComplete] = useState(false);

  const [uploadConnected, setUploadConnected] = useState(false);
  const [privacy, setPrivacy] = useState("private");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());

  if (!projectId) {
    return (
      <StudioProjectSelector
        title="Export & Publish"
        description="Render your masterpiece and share it with the world."
        context="export"
      />
    );
  }

  // --- Handlers ---

  const handleStartRender = () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderComplete(false);
    toast.info("Rendering Started", { description: "Please wait while we process your video." });

    // Mock Progress
    const interval = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRendering(false);
          setRenderComplete(true);
          toast.success("Rendering Complete", { description: "Your video is ready for download or upload." });
          return 100;
        }
        return prev + 5; // Fast mock render
      });
    }, 150);
  };

  const handleConnect = () => {
    // Mock OAuth flow
    toast.loading("Connecting to YouTube...");
    setTimeout(() => {
      setUploadConnected(true);
      toast.dismiss();
      toast.success("Connected to YouTube", { description: "Channel: TubeGAI Official" });
    }, 1500);
  };

  const handlePublish = () => {
    if (!renderComplete) {
      toast.error("Video not rendered", { description: "Please render your video first." });
      return;
    }
    toast.success("Published to YouTube!", { description: `Video is now ${privacy} on your channel.` });
  };

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">

      {/* 1. Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Download className="h-5 w-5" />
            <span>Export & Publish</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
        </div>
      </div>

      <div className="flex flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left: Render Settings & Status */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" /> Render Settings
                </CardTitle>
                <CardDescription>Configure output format and quality.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <Select defaultValue="1080p">
                      <SelectTrigger>
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4k">4K Ultra HD (2160p)</SelectItem>
                        <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                        <SelectItem value="720p">HD (720p)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Frame Rate</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue placeholder="Select FPS" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">60 FPS</SelectItem>
                        <SelectItem value="30">30 FPS</SelectItem>
                        <SelectItem value="24">24 FPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select defaultValue="mp4">
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp4">MP4 (H.264)</SelectItem>
                        <SelectItem value="mov">MOV (ProRes)</SelectItem>
                        <SelectItem value="webm">WebM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quality / Bitrate</Label>
                    <Select defaultValue="high">
                      <SelectTrigger>
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High (Recommended)</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low (Draft)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Hardware Acceleration</Label>
                    <p className="text-xs text-muted-foreground">Faster rendering with GPU.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                {isRendering || renderProgress > 0 ? (
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>{renderComplete ? "Rendering Complete" : "Rendering..."}</span>
                      <span>{renderProgress}%</span>
                    </div>
                    <Progress value={renderProgress} className="h-2" />
                  </div>
                ) : null}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleStartRender}
                  disabled={isRendering || renderComplete}
                >
                  {renderComplete ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <FileVideo className="mr-2 h-4 w-4" />}
                  {renderComplete ? "Rendered Successfully" : "Start Render"}
                </Button>
              </CardFooter>
            </Card>

            {renderComplete && (
              <Button variant="outline" className="w-full h-14" onClick={() => toast.success("Downloading...")}>
                <Download className="mr-2 h-5 w-5" /> Download File (450 MB)
              </Button>
            )}
          </div>

          {/* Right: Publish */}
          <div className="space-y-6">
            <Card className={cn(!renderComplete && "opacity-50 pointer-events-none")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-600" /> Publish to YouTube
                </CardTitle>
                <CardDescription>Directly upload your video to your channel.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!uploadConnected ? (
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg space-y-4">
                    <Youtube className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-center text-muted-foreground">Connect your YouTube account to enable direct publishing.</p>
                    <Button variant="secondary" onClick={handleConnect}>Connect Channel</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-3 bg-muted rounded-md border">
                      <div className="h-10 w-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">T</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">TubeGAI Official</p>
                        <p className="text-xs text-muted-foreground">Connected</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs">Change</Button>
                    </div>

                    <div className="space-y-3">
                      <Label>Visibility</Label>
                      <RadioGroup value={privacy} onValueChange={setPrivacy} className="grid grid-cols-3 gap-4">
                        <div>
                          <RadioGroupItem value="public" id="public" className="peer sr-only" />
                          <Label
                            htmlFor="public"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Share2 className="mb-2 h-5 w-5" />
                            Private
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="unlisted" id="unlisted" className="peer sr-only" />
                          <Label
                            htmlFor="unlisted"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Share2 className="mb-2 h-5 w-5 text-muted-foreground" />
                            Unlisted
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="private" id="private" className="peer sr-only" />
                          <Label
                            htmlFor="private"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Share2 className="mb-2 h-5 w-5" />
                            Public
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-3">
                      <Label>Schedule (Optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !scheduledDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDate ? scheduledDate.toDateString() : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={scheduledDate}
                            onSelect={setScheduledDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={!uploadConnected || !renderComplete} onClick={handlePublish}>
                  <Upload className="mr-2 h-4 w-4" /> Publish Video
                </Button>
              </CardFooter>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
