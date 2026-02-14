import { useState } from "react";
import { Video, Wand2, Zap, Settings2, Palette, Type, Fingerprint } from "lucide-react";
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
          AI 비디오 생성기
        </CardTitle>
        <CardDescription>
          씬에 생명을 불어넣는 전문 도구.
        </CardDescription>
      </CardHeader>

      <CardContent id="video-sidebar-scroll-area" className="flex-1 overflow-y-auto px-4 pb-4">

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="basic">기본</TabsTrigger>
            <TabsTrigger value="pro">프로 설정</TabsTrigger>
          </TabsList>

          {/* === BASIC TAB === */}
          <TabsContent value="basic" className="space-y-6 mt-0">
            {/* Model Selection */}
            <div className="space-y-3">
              <Label>AI 모델</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="모델 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kling">
                    <div className="flex items-center justify-between w-full">
                      <span>Kling AI</span>
                      <Badge variant="secondary" className="text-[10px] h-4">사실적</Badge>
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
                  스타일 참조
                </Label>
              </div>

              <div className="grid gap-3 p-3 border rounded-lg bg-background/50">
                <div className="flex items-center justify-between">
                  <Label htmlFor="match-script" className="text-xs font-normal cursor-pointer">스크립트 톤 맞추기</Label>
                  <Switch id="match-script" checked={matchScript} onCheckedChange={setMatchScript} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="match-storyboard" className="text-xs font-normal cursor-pointer">스토리보드 비주얼 맞추기</Label>
                  <Switch id="match-storyboard" checked={matchStoryboard} onCheckedChange={setMatchStoryboard} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="match-channel" className="text-xs font-normal cursor-pointer">채널 브랜딩 적용</Label>
                  <Switch id="match-channel" checked={matchChannel} onCheckedChange={setMatchChannel} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Motion & Camera */}
            <div className="space-y-4">
              <Label>움직임 컨트롤</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">카메라</Label>
                  <Select value={camera} onValueChange={setCamera}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dynamic">다이나믹</SelectItem>
                      <SelectItem value="static">정적</SelectItem>
                      <SelectItem value="zoom_in">줌 인</SelectItem>
                      <SelectItem value="pan">팬</SelectItem>
                      <SelectItem value="roll">롤</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs text-muted-foreground">강도</Label>
                    <span className="text-[10px] text-muted-foreground">{motionStrength[0]}</span>
                  </div>
                  <Slider
                    value={motionStrength}
                    onValueChange={setMotionStrength}
                    max={10}
                    step={1}
                    min={1}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Text Directives */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                추가 지시사항
              </Label>
              <Textarea
                placeholder="예: 90년대 VHS 테이프처럼 보이게, 그레인 추가, 슬로우 모션..."
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
                <h4 className="font-medium text-sm">고급 파라미터</h4>
              </div>

              {/* Seed */}
              <div className="space-y-2">
                <Label className="text-xs">시드 (선택사항)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="랜덤 (-1)"
                    className="h-8 text-xs font-mono"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                  />
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSeed(Math.floor(Math.random() * 1000000).toString())}>
                    <Fingerprint className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">일관된 결과를 위해 동일한 시드를 사용하세요.</p>
              </div>

              {/* FPS & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">길이 전략</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">자동 분할</SelectItem>
                      <SelectItem value="short">4초 (안전)</SelectItem>
                      <SelectItem value="long">8초 (베타)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">프레임 레이트 (FPS)</Label>
                  <Select value={fps} onValueChange={setFps}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 fps (필름)</SelectItem>
                      <SelectItem value="30">30 fps (비디오)</SelectItem>
                      <SelectItem value="60">60 fps (부드럽게)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Internal Model Params */}
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">가이던스 스케일 (CFG)</Label>
                    <span className="text-[10px] text-muted-foreground">{guidanceScale[0]}</span>
                  </div>
                  <Slider
                    value={guidanceScale}
                    onValueChange={setGuidanceScale}
                    max={20}
                    step={0.5}
                    min={1}
                  />
                  <p className="text-[10px] text-muted-foreground">높을수록 프롬프트를 더 엄격하게 따릅니다.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">샘플링 스텝</Label>
                    <span className="text-[10px] text-muted-foreground">{samplingSteps[0]}</span>
                  </div>
                  <Slider
                    value={samplingSteps}
                    onValueChange={setSamplingSteps}
                    max={50}
                    step={1}
                    min={10}
                  />
                  <p className="text-[10px] text-muted-foreground">스텝이 많을수록 품질은 높지만 느립니다.</p>
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
              <Zap className="mr-2 h-4 w-4 animate-spin" /> 비디오 생성 중...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" /> 모든 비디오 생성
            </>
          )}
        </Button>
        <p className="text-[10px] text-center text-muted-foreground">{`예상 비용: ~${(Number(samplingSteps[0]) / 10 * 12).toFixed(0)} 크레딧`}</p>
      </CardFooter>
    </Card>
  );
}
