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
        title="내보내기 & 게시"
        description="걸작을 렌더링하고 세상과 공유하세요."
        context="export"
      />
    );
  }

  // --- Handlers ---

  const handleStartRender = () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderComplete(false);
    toast.info("렌더링 시작됨", { description: "비디오를 처리하는 동안 잠시 기다려주세요." });

    // Mock Progress
    const interval = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRendering(false);
          setRenderComplete(true);
          toast.success("렌더링 완료", { description: "비디오를 다운로드하거나 업로드할 준비가 되었습니다." });
          return 100;
        }
        return prev + 5; // Fast mock render
      });
    }, 150);
  };

  const handleConnect = () => {
    // Mock OAuth flow
    toast.loading("YouTube에 연결 중...");
    setTimeout(() => {
      setUploadConnected(true);
      toast.dismiss();
      toast.success("YouTube에 연결됨", { description: `채널: TubeGAI Official` });
    }, 1500);
  };

  const handlePublish = () => {
    if (!renderComplete) {
      toast.error("비디오가 렌더링되지 않았습니다", { description: "먼저 비디오를 렌더링해주세요." });
      return;
    }
    toast.success("YouTube에 게시됨!", { description: `Video is now ${privacy} on your channel.` });
  };

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">

      {/* 1. Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Download className="h-5 w-5" />
            <span>내보내기 & 게시</span>
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
                  <Settings2 className="h-5 w-5" /> 렌더링 설정
                </CardTitle>
                <CardDescription>출력 포맷과 품질을 설정하세요.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>해상도</Label>
                    <Select defaultValue="1080p">
                      <SelectTrigger>
                        <SelectValue placeholder="해상도 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4k">4K Ultra HD (2160p)</SelectItem>
                        <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                        <SelectItem value="720p">HD (720p)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>프레임 레이트</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue placeholder="FPS 선택" />
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
                    <Label>포맷</Label>
                    <Select defaultValue="mp4">
                      <SelectTrigger>
                        <SelectValue placeholder="포맷 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp4">MP4 (H.264)</SelectItem>
                        <SelectItem value="mov">MOV (ProRes)</SelectItem>
                        <SelectItem value="webm">WebM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>품질 / 비트레이트</Label>
                    <Select defaultValue="high">
                      <SelectTrigger>
                        <SelectValue placeholder="품질 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">높음 (권장)</SelectItem>
                        <SelectItem value="medium">중간</SelectItem>
                        <SelectItem value="low">낮음 (초안)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>하드웨어 가속</Label>
                    <p className="text-xs text-muted-foreground">GPU로 더 빠른 렌더링.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                {isRendering || renderProgress > 0 ? (
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>{renderComplete ? "렌더링 완료" : "렌더링 중..."}</span>
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
                  {renderComplete ? "렌더링 성공" : "렌더링 시작"}
                </Button>
              </CardFooter>
            </Card>

            {renderComplete && (
              <Button variant="outline" className="w-full h-14" onClick={() => toast.success("다운로드 중...")}>
                <Download className="mr-2 h-5 w-5" /> 파일 다운로드 (450 MB)
              </Button>
            )}
          </div>

          {/* Right: Publish */}
          <div className="space-y-6">
            <Card className={cn(!renderComplete && "opacity-50 pointer-events-none")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-destructive" /> YouTube에 게시
                </CardTitle>
                <CardDescription>채널에 비디오를 직접 업로드하세요.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!uploadConnected ? (
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg space-y-4">
                    <Youtube className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-center text-muted-foreground">직접 게시를 활성화하려면 YouTube 계정을 연결하세요.</p>
                    <Button variant="secondary" onClick={handleConnect}>채널 연결</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-3 bg-muted rounded-md border">
                      <div className="h-10 w-10 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground font-bold">T</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">TubeGAI Official</p>
                        <p className="text-xs text-muted-foreground">연결됨</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs">변경</Button>
                    </div>

                    <div className="space-y-3">
                      <Label>공개 설정</Label>
                      <RadioGroup value={privacy} onValueChange={setPrivacy} className="grid grid-cols-3 gap-4">
                        <div>
                          <RadioGroupItem value="public" id="public" className="peer sr-only" />
                          <Label
                            htmlFor="public"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Share2 className="mb-2 h-5 w-5" />
                            비공개
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="unlisted" id="unlisted" className="peer sr-only" />
                          <Label
                            htmlFor="unlisted"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Share2 className="mb-2 h-5 w-5 text-muted-foreground" />
                            일부 공개
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="private" id="private" className="peer sr-only" />
                          <Label
                            htmlFor="private"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Share2 className="mb-2 h-5 w-5" />
                            공개
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-3">
                      <Label>예약 (선택사항)</Label>
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
                            {scheduledDate ? scheduledDate.toDateString() : <span>날짜 선택</span>}
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
                  <Upload className="mr-2 h-4 w-4" /> 비디오 게시
                </Button>
              </CardFooter>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
