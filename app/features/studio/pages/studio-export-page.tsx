import { useState, useEffect } from "react";
import { useParams } from "react-router";
import {
  Download, Upload, Share2, Youtube,
  CheckCircle2, AlertCircle, FileVideo,
  Settings2, Calendar as CalendarIcon, Clock
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "~/i18n/context";
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
  const { t } = useTranslation("studio");

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
        title={t("export.title")}
        description={t("export.selectorDesc")}
        context="export"
      />
    );
  }

  // --- Handlers ---

  const handleStartRender = () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderComplete(false);
    toast.info(t("export.toast.renderingStarted"), { description: t("export.toast.renderingStartedDesc") });

    // Mock Progress
    const interval = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRendering(false);
          setRenderComplete(true);
          toast.success(t("export.toast.renderingComplete"), { description: t("export.toast.renderingCompleteDesc") });
          return 100;
        }
        return prev + 5; // Fast mock render
      });
    }, 150);
  };

  const handleConnect = () => {
    // Mock OAuth flow
    toast.loading(t("export.toast.connectingYoutube"));
    setTimeout(() => {
      setUploadConnected(true);
      toast.dismiss();
      toast.success(t("export.toast.connectedToYoutube"), { description: `${t("export.toast.connectedChannel")} TubeGAI Official` });
    }, 1500);
  };

  const handlePublish = () => {
    if (!renderComplete) {
      toast.error(t("export.toast.videoNotRendered"), { description: t("export.toast.renderFirst") });
      return;
    }
    toast.success(t("export.toast.publishedToYoutube"), { description: `Video is now ${privacy} on your channel.` });
  };

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">

      {/* 1. Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Download className="h-5 w-5" />
            <span>{t("export.title")}</span>
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
                  <Settings2 className="h-5 w-5" /> {t("export.renderSettings")}
                </CardTitle>
                <CardDescription>{t("export.renderSettingsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("export.resolution")}</Label>
                    <Select defaultValue="1080p">
                      <SelectTrigger>
                        <SelectValue placeholder={t("export.selectResolution")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4k">{t("export.res4k")}</SelectItem>
                        <SelectItem value="1080p">{t("export.res1080")}</SelectItem>
                        <SelectItem value="720p">{t("export.res720")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("export.frameRate")}</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue placeholder={t("export.selectFps")} />
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
                    <Label>{t("export.format")}</Label>
                    <Select defaultValue="mp4">
                      <SelectTrigger>
                        <SelectValue placeholder={t("export.selectFormat")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp4">MP4 (H.264)</SelectItem>
                        <SelectItem value="mov">MOV (ProRes)</SelectItem>
                        <SelectItem value="webm">WebM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("export.quality")}</Label>
                    <Select defaultValue="high">
                      <SelectTrigger>
                        <SelectValue placeholder={t("export.selectQuality")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">{t("export.qualityHigh")}</SelectItem>
                        <SelectItem value="medium">{t("export.qualityMedium")}</SelectItem>
                        <SelectItem value="low">{t("export.qualityLow")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("export.hwAcceleration")}</Label>
                    <p className="text-xs text-muted-foreground">{t("export.hwAccelerationDesc")}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                {isRendering || renderProgress > 0 ? (
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>{renderComplete ? t("export.renderingComplete") : t("export.rendering")}</span>
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
                  {renderComplete ? t("export.renderedSuccessfully") : t("export.startRender")}
                </Button>
              </CardFooter>
            </Card>

            {renderComplete && (
              <Button variant="outline" className="w-full h-14" onClick={() => toast.success(t("export.toast.downloading"))}>
                <Download className="mr-2 h-5 w-5" /> {t("export.downloadFile")}
              </Button>
            )}
          </div>

          {/* Right: Publish */}
          <div className="space-y-6">
            <Card className={cn(!renderComplete && "opacity-50 pointer-events-none")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-destructive" /> {t("export.publishToYoutube")}
                </CardTitle>
                <CardDescription>{t("export.publishToYoutubeDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!uploadConnected ? (
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg space-y-4">
                    <Youtube className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-center text-muted-foreground">{t("export.connectYoutubeDesc")}</p>
                    <Button variant="secondary" onClick={handleConnect}>{t("export.connectChannel")}</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-3 bg-muted rounded-md border">
                      <div className="h-10 w-10 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground font-bold">T</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">TubeGAI Official</p>
                        <p className="text-xs text-muted-foreground">{t("export.connected")}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs">{t("export.change")}</Button>
                    </div>

                    <div className="space-y-3">
                      <Label>{t("export.visibility")}</Label>
                      <RadioGroup value={privacy} onValueChange={setPrivacy} className="grid grid-cols-3 gap-4">
                        <div>
                          <RadioGroupItem value="public" id="public" className="peer sr-only" />
                          <Label
                            htmlFor="public"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Share2 className="mb-2 h-5 w-5" />
                            {t("export.private")}
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="unlisted" id="unlisted" className="peer sr-only" />
                          <Label
                            htmlFor="unlisted"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Share2 className="mb-2 h-5 w-5 text-muted-foreground" />
                            {t("export.unlisted")}
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="private" id="private" className="peer sr-only" />
                          <Label
                            htmlFor="private"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Share2 className="mb-2 h-5 w-5" />
                            {t("export.public")}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-3">
                      <Label>{t("export.scheduleOptional")}</Label>
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
                            {scheduledDate ? scheduledDate.toDateString() : <span>{t("export.pickDate")}</span>}
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
                <Button className="w-full" variant="destructive" disabled={!uploadConnected || !renderComplete} onClick={handlePublish}>
                  <Upload className="mr-2 h-4 w-4" /> {t("export.publishVideo")}
                </Button>
              </CardFooter>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
