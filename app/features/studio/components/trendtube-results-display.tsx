"use client";

import { useState } from "react";
import {
  Video,
  Music,
  Mic,
  Lightbulb,
  FileText,
  TrendingUp,
  Copy,
  Check,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";
import { toast } from "sonner";
import type { TrendTubeResults } from "~/common/types/trendtube.types";

interface TrendTubeResultsDisplayProps {
  results: TrendTubeResults;
  onReset: () => void;
}

export function TrendTubeResultsDisplay({
  results,
  onReset,
}: TrendTubeResultsDisplayProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("클립보드에 복사되었습니다");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  // Determine hero video: prefer composited, then first clip, then raw video
  const heroVideoUrl = results.compositedVideoUrl
    || results.videoClipUrls?.[0]
    || results.videoUrl;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">TrendTube 결과</h2>
          <p className="text-sm text-muted-foreground">
            AI가 생성한 영상 콘텐츠를 확인하세요
          </p>
        </div>
        <Button variant="outline" onClick={onReset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          새로 생성
        </Button>
      </div>

      {/* Hero: Composited Video Player */}
      {heroVideoUrl ? (
        <Card className="overflow-hidden">
          <div className="relative bg-muted">
            <video
              controls
              className="w-full aspect-video"
              src={heroVideoUrl}
            >
              브라우저가 비디오를 지원하지 않습니다.
            </video>
            <Badge
              variant="secondary"
              className="absolute top-3 right-3 opacity-80"
            >
              <Video className="mr-1 h-3 w-3" />
              {results.compositedVideoUrl
                ? "합성 영상"
                : results.clipCount && results.clipCount > 1
                  ? `클립 1/${results.clipCount}`
                  : "원본 영상"}
              {results.compositedDuration
                ? ` ${results.compositedDuration}초`
                : results.totalDuration
                  ? ` ${results.totalDuration}초`
                  : ""}
            </Badge>
          </div>
          {heroVideoUrl && (
            <div className="p-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(heroVideoUrl, "trendtube-video.mp4")}
              >
                <Download className="mr-1 h-3 w-3" />
                다운로드
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Video className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm">영상이 생성되지 않았습니다</p>
            <p className="text-xs">Veo 3 API 키를 설정하면 영상이 자동 생성됩니다</p>
          </CardContent>
        </Card>
      )}

      {/* Clip Gallery (when multiple clips exist) */}
      {results.videoClipUrls && results.videoClipUrls.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Video className="h-4 w-4 text-primary" />
              영상 클립
              <Badge variant="secondary" className="ml-auto text-xs">
                {results.clipCount}개 / {results.totalDuration}초
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {results.videoClipUrls.map((clipUrl, i) => (
                <div key={i} className="relative rounded-md overflow-hidden border">
                  <video controls className="w-full aspect-video" src={clipUrl}>
                    브라우저가 비디오를 지원하지 않습니다.
                  </video>
                  <Badge
                    variant="secondary"
                    className="absolute top-2 left-2 text-xs opacity-90"
                  >
                    클립 {i + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Assets: Music + Voiceover */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Background Music */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Music className="h-4 w-4 text-primary" />
              배경 음악
              {results.musicDuration ? (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {results.musicDuration}초
                </Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.musicUrl ? (
              <audio controls className="w-full" src={results.musicUrl}>
                브라우저가 오디오를 지원하지 않습니다.
              </audio>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-6 text-sm text-muted-foreground">
                <Music className="h-8 w-8 text-muted-foreground/40" />
                <p>Lyria 2 API를 설정하면 음악이 생성됩니다</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voiceover */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mic className="h-4 w-4 text-primary" />
              나레이션
              {results.voiceoverDuration ? (
                <Badge variant="secondary" className="ml-auto text-xs">
                  약 {results.voiceoverDuration}초
                </Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.voiceoverUrl ? (
              <audio controls className="w-full" src={results.voiceoverUrl}>
                브라우저가 오디오를 지원하지 않습니다.
              </audio>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-6 text-sm text-muted-foreground">
                <Mic className="h-8 w-8 text-muted-foreground/40" />
                <p>TTS API 키를 설정하면 음성이 생성됩니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Video Ideas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-primary" />
              영상 아이디어
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(results.videoIdeas, "ideas")}
            >
              {copiedField === "ideas" ? (
                <Check className="mr-1 h-3 w-3" />
              ) : (
                <Copy className="mr-1 h-3 w-3" />
              )}
              복사
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {results.videoIdeas}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Narration Script */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              나레이션 스크립트
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(results.narrationScript, "script")}
            >
              {copiedField === "script" ? (
                <Check className="mr-1 h-3 w-3" />
              ) : (
                <Copy className="mr-1 h-3 w-3" />
              )}
              복사
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {results.narrationScript}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              트렌드 분석
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(results.extractedTrends, "trends")}
            >
              {copiedField === "trends" ? (
                <Check className="mr-1 h-3 w-3" />
              ) : (
                <Copy className="mr-1 h-3 w-3" />
              )}
              복사
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {results.extractedTrends}
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Action Buttons */}
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={onReset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          새로 생성
        </Button>
      </div>
    </div>
  );
}
