"use client";

import { useState } from "react";
import {
  ImageIcon,
  Music,
  Mic,
  Lightbulb,
  FileText,
  TrendingUp,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
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
import { ScrollArea } from "~/common/components/ui/scroll-area";
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("클립보드에 복사되었습니다");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev < results.imageUrls.length - 1 ? prev + 1 : 0
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev > 0 ? prev - 1 : results.imageUrls.length - 1
    );
  };

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

      {/* Hero: Generated Images Carousel */}
      {results.imageUrls.length > 0 && (
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-muted">
            <img
              src={results.imageUrls[currentImageIndex]}
              alt={`생성된 이미지 ${currentImageIndex + 1}`}
              className="h-full w-full object-cover"
            />
            {/* Navigation Arrows */}
            {results.imageUrls.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                {/* Dots Indicator */}
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {results.imageUrls.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        i === currentImageIndex
                          ? "bg-primary"
                          : "bg-primary/30"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            {/* Image Counter */}
            <Badge
              variant="secondary"
              className="absolute top-3 right-3 opacity-80"
            >
              <ImageIcon className="mr-1 h-3 w-3" />
              {currentImageIndex + 1} / {results.imageUrls.length}
            </Badge>
          </div>
        </Card>
      )}

      {/* Audio Section: Music + Voiceover */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Background Music */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Music className="h-4 w-4 text-primary" />
              배경 음악
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
                {results.musicGenre ? (
                  <div className="text-center">
                    <p>추천 장르: <Badge variant="outline">{results.musicGenre}</Badge></p>
                    <p className="mt-1 text-xs">음악 API 연동 시 자동 생성됩니다</p>
                  </div>
                ) : (
                  <p>음악이 생성되지 않았습니다</p>
                )}
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
                  약 {Math.floor(results.voiceoverDuration / 60)}분{" "}
                  {results.voiceoverDuration % 60}초
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
          <ScrollArea className="max-h-64">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {results.videoIdeas}
            </div>
          </ScrollArea>
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
          <ScrollArea className="max-h-80">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {results.narrationScript}
            </div>
          </ScrollArea>
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
          <ScrollArea className="max-h-64">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {results.extractedTrends}
            </div>
          </ScrollArea>
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
