import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation, redirect } from "react-router";
import { ChevronLeft, Sparkles, Loader2, Lightbulb, Target, Eye, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { Badge } from "~/common/components/ui/badge";
import { Button } from "~/common/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/common/components/ui/form";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/common/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/common/components/ui/card";

import { getChannelsForSelect, getLabels, createProject } from "~/common/data/project.data.server";
import { getIdeas } from "~/common/data/idea.data.server";
import { requireAuth } from "~/lib/auth.server";
import type { Route } from "./+types/new-project-page";
import type { Idea } from "~/common/types/ideation.types";
import { getPrimaryTrend } from "~/common/types/ideation.types";

export const meta = () => {
  return [
    { title: "새 프로젝트 | TubeGAI" },
    { name: "description", content: "새로운 비디오 프로젝트를 시작하세요." },
  ];
};

// =============================================================================
// Form Schema
// =============================================================================

const projectFormSchema = z.object({
  title: z.string().min(2, {
    message: "프로젝트 제목은 최소 2자 이상이어야 합니다.",
  }),
  description: z.string().optional(),
  type: z.enum(["short", "long"]),
  visibility: z.enum(["public", "private"]),
  topic: z.string().optional(),
  channelId: z.string().optional(),
  labels: z.array(z.string()),
  // AI Context fields
  targetAudience: z.string().optional(),
  estimatedViews: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  contentTone: z.string().optional(),
  category: z.string().optional(),
  videoLength: z.enum(["short", "medium", "long"]).optional(),
  basedOnTrend: z.string().optional(),
  sourceIdeaId: z.string().optional(),
  // Reference URL
  referenceUrl: z.string().url().optional().or(z.literal("")),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const defaultValues: Partial<ProjectFormValues> = {
  title: "",
  description: "",
  type: "long",
  visibility: "private",
  topic: "",
  channelId: "",
  labels: [],
  targetAudience: "",
  estimatedViews: "",
  difficulty: "medium",
  contentTone: "informative",
  category: "",
  videoLength: "medium",
  referenceUrl: "",
};

// =============================================================================
// Loader & Action
// =============================================================================

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  const [channels, labels, savedIdeas] = await Promise.all([
    getChannelsForSelect(userId),
    getLabels(userId),
    getIdeas(userId, { isSaved: true }),
  ]);
  return { channels, labels, savedIdeas };
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireAuth(request);
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  // Check if caller wants JSON response (for fetcher calls)
  const returnJson = data._returnJson === "true";

  try {
    // Parse arrays and JSON fields
    const labels = data.labels ? JSON.parse(data.labels as string) : [];

    const result = await createProject(userId, {
      title: (data.title as string) || "Untitled Project",
      description: (data.description as string) || undefined,
      type: (data.type as "short" | "long") || "long",
      visibility: (data.visibility as "public" | "private") || "private",
      topic: (data.topic as string) || undefined,
      channelId: (data.channelId as string) || undefined,
      thumbnailUrl: (data.thumbnailUrl as string) || undefined,
      labels,
      targetAudience: (data.targetAudience as string) || undefined,
      estimatedViews: (data.estimatedViews as string) || undefined,
      difficulty: (data.difficulty as string) ? (data.difficulty as "easy" | "medium" | "hard") : undefined,
      contentTone: (data.contentTone as string) || undefined,
      category: (data.category as string) || undefined,
      videoLength: (data.videoLength as string) ? (data.videoLength as "short" | "medium" | "long") : undefined,
      basedOnTrend: (data.basedOnTrend as string) || undefined,
      basedOnTrendUuid: (data.basedOnTrendUuid as string) || undefined,
      sourceIdeaId: (data.sourceIdeaId as string) || undefined,
      referenceUrl: (data.referenceUrl as string) || undefined,
      trendSnapshot: data.trendSnapshot ? JSON.parse(data.trendSnapshot as string) : undefined,
    });

    // Return JSON for fetcher calls, redirect for regular form submissions
    if (returnJson) {
      return { id: result.id };
    }
    return redirect(`/projects/${result.id}`);
  } catch (error) {
    console.error("Failed to create project:", error);
    return { error: "프로젝트 생성에 실패했습니다." };
  }
}

// =============================================================================
// Component
// =============================================================================

export default function NewProjectPage({ loaderData, actionData }: Route.ComponentProps) {
  const { channels, labels, savedIdeas } = loaderData;
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Get source data from navigation state (simplified: all data via idea object)
  const sourceData = location.state as { idea?: Idea } | null;
  const initialIdea = sourceData?.idea ?? null;

  // Unified selected idea state: set from location.state or Quick Select chip
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(initialIdea);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      ...defaultValues,
      // Pre-fill from source idea (evaluated once at mount)
      topic: initialIdea?.title || "",
      title: initialIdea?.title || "",
      description: initialIdea?.description || "",
      targetAudience: initialIdea?.targetAudience || "",
      estimatedViews: initialIdea?.estimatedViews || "",
      difficulty: (initialIdea?.difficulty || "medium") as "easy" | "medium" | "hard",
      basedOnTrend: (initialIdea ? getPrimaryTrend(initialIdea)?.trend?.title : null) || initialIdea?.title || "",
      sourceIdeaId: initialIdea?.id,
      referenceUrl: initialIdea?.referenceUrl
        || (initialIdea ? getPrimaryTrend(initialIdea)?.trend?.externalUrl : undefined) || "",
      contentTone: initialIdea?.contentTones?.[0] || "informative",
      category: initialIdea?.category || "",
      videoLength: initialIdea?.videoTypes?.[0] as "short" | "medium" | "long" || "medium",
      type: initialIdea?.videoTypes?.[0] === "short" ? "short" as const : "long" as const,
    },
  });

  // Sync state when navigating to this page again (e.g., nav menu while already on /projects/new)
  useEffect(() => {
    const newIdea = (location.state as { idea?: Idea } | null)?.idea ?? null;
    setSelectedIdea(newIdea);
    if (newIdea) {
      const primaryTrend = getPrimaryTrend(newIdea);
      form.reset({
        ...defaultValues,
        topic: newIdea.title || "",
        title: newIdea.title || "",
        description: newIdea.description || "",
        targetAudience: newIdea.targetAudience || "",
        estimatedViews: newIdea.estimatedViews || "",
        difficulty: (newIdea.difficulty || "medium") as "easy" | "medium" | "hard",
        basedOnTrend: primaryTrend?.trend?.title || newIdea.title || "",
        sourceIdeaId: newIdea.id,
        referenceUrl: newIdea.referenceUrl || primaryTrend?.trend?.externalUrl || "",
        contentTone: newIdea.contentTones?.[0] || "informative",
        category: newIdea.category || "",
        videoLength: newIdea.videoTypes?.[0] as "short" | "medium" | "long" || "medium",
        type: newIdea.videoTypes?.[0] === "short" ? "short" as const : "long" as const,
      });
    } else {
      form.reset(defaultValues);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Show error toast if action failed
  useEffect(() => {
    if (actionData?.error) {
      toast.error(actionData.error);
      setIsLoading(false);
    }
  }, [actionData]);

  // Watch type for videoLength linkage
  const watchedType = form.watch("type");

  // Sync videoLength when type changes
  useEffect(() => {
    const currentLength = form.getValues("videoLength");
    if (watchedType === "short") {
      form.setValue("videoLength", "short");
    } else if (currentLength === "short") {
      form.setValue("videoLength", "medium");
    }
  }, [watchedType, form]);

  const handleSubmit = () => {
    setIsLoading(true);
  };

  // Select from saved ideas (Quick Select chip or external navigation)
  const handleSelectIdea = (idea: Idea) => {
    const primaryTrend = getPrimaryTrend(idea);
    const basedOnTrend = primaryTrend?.trend?.title || "";

    setSelectedIdea(idea);

    form.setValue("title", idea.title);
    form.setValue("description", idea.description || "");
    form.setValue("topic", basedOnTrend || idea.title);
    form.setValue("targetAudience", idea.targetAudience || "");
    form.setValue("estimatedViews", idea.estimatedViews || "");
    form.setValue("difficulty", idea.difficulty || "medium");
    form.setValue("basedOnTrend", basedOnTrend);
    form.setValue("sourceIdeaId", idea.id);
    form.setValue("referenceUrl", idea.referenceUrl || primaryTrend?.trend?.externalUrl || "");
    form.setValue("contentTone", idea.contentTones?.[0] || "informative");
    form.setValue("category", idea.category || "");
    form.setValue("videoLength", (idea.videoTypes?.[0] as "short" | "medium" | "long") || "medium");
    form.setValue("type", idea.videoTypes?.[0] === "short" ? "short" : "long");

    toast.success("아이디어가 적용되었습니다!");
  };

  // Clear selected idea and reset form to defaults
  const handleClearIdea = () => {
    setSelectedIdea(null);
    form.reset(defaultValues);
  };

  const hasSelectedIdea = !!selectedIdea;
  const selectedIdeaTrend = selectedIdea ? getPrimaryTrend(selectedIdea) : undefined;
  const unusedIdeas = savedIdeas.filter(idea => !idea.isUsed);

  return (
    <div className="container max-w-7xl mx-auto py-10 px-4">
      <div className="mb-6">
        <Button variant="ghost" className="pl-0 mb-3" asChild>
          <Link to="/projects">
            <ChevronLeft className="mr-2 h-4 w-4" />
            대시보드로 돌아가기
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          새 프로젝트 만들기
        </h1>
        <p className="text-muted-foreground text-sm">
          AI가 스튜디오에서 활용할 정보를 입력해주세요. 더 자세한 정보를 입력할수록 더 좋은 결과를 얻을 수 있습니다.
        </p>
      </div>

      {/* Selected Idea Banner */}
      {hasSelectedIdea && selectedIdea && (
        <Card className="mb-6 border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-3 space-y-1.5">
            {/* Header row */}
            <div className="flex items-center gap-2">
              {getPrimaryTrend(selectedIdea)?.trend?.thumbnailUrl && (
                <img
                  src={getPrimaryTrend(selectedIdea)!.trend!.thumbnailUrl}
                  alt=""
                  className="w-16 h-10 object-cover rounded shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  <span className="text-xs text-purple-400">아이디어에서 시작</span>
                </div>
                <p className="font-medium text-sm truncate">{selectedIdea.title}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground shrink-0 h-7 text-xs px-2"
                onClick={handleClearIdea}
                type="button"
              >
                선택 해제
              </Button>
            </div>

            {/* Metadata badges */}
            <div className="flex flex-wrap gap-1.5">
              {selectedIdea.score != null && (
                <Badge variant="outline" className="text-purple-500 border-purple-500/30 text-xs py-0 h-5">
                  <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                  {selectedIdea.score}점
                </Badge>
              )}
              {selectedIdea.estimatedViews && (
                <Badge variant="outline" className="text-green-500 border-green-500/30 text-xs py-0 h-5">
                  <Eye className="h-2.5 w-2.5 mr-0.5" />
                  {selectedIdea.estimatedViews}
                </Badge>
              )}
              {selectedIdea.growthRate && (
                <Badge variant="outline" className="text-green-500 border-green-500/30 text-xs py-0 h-5">
                  <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                  {selectedIdea.growthRate}
                </Badge>
              )}
              {selectedIdea.difficulty && (
                <Badge variant="outline" className="text-xs py-0 h-5">
                  {selectedIdea.difficulty === "easy" ? "쉬움" : selectedIdea.difficulty === "hard" ? "어려움" : "보통"}
                </Badge>
              )}
              {selectedIdea.contentTones?.[0] && (
                <Badge variant="outline" className="text-xs py-0 h-5">
                  {selectedIdea.contentTones[0]}
                </Badge>
              )}
              {selectedIdea.videoTypes?.[0] && (
                <Badge variant="outline" className="text-xs py-0 h-5">
                  {selectedIdea.videoTypes[0] === "short" ? "쇼츠" : selectedIdea.videoTypes[0] === "long" ? "롱폼" : "중간"}
                </Badge>
              )}
              {selectedIdea.hooks?.[0] && (
                <Badge variant="outline" className="text-xs py-0 h-5 text-purple-400 border-purple-500/20">
                  Hook: {selectedIdea.hooks[0].length > 30 ? selectedIdea.hooks[0].slice(0, 30) + "…" : selectedIdea.hooks[0]}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Ideas Quick Select - only when no idea is selected */}
      {!hasSelectedIdea && unusedIdeas.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              저장된 아이디어에서 선택
            </CardTitle>
            <CardDescription>
              저장해둔 아이디어로 빠르게 프로젝트를 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {unusedIdeas.map((idea) => (
              <button
                key={idea.id}
                type="button"
                className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleSelectIdea(idea)}
              >
                <div className="flex items-start gap-3">
                  {getPrimaryTrend(idea)?.trend?.thumbnailUrl && (
                    <img
                      src={getPrimaryTrend(idea)!.trend!.thumbnailUrl}
                      alt=""
                      className="w-16 h-10 object-cover rounded shrink-0 mt-0.5"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{idea.title}</p>
                    {idea.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {idea.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {idea.score != null && (
                        <Badge variant="outline" className="text-xs py-0 h-5">
                          <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                          {idea.score}점
                        </Badge>
                      )}
                      {idea.estimatedViews && (
                        <Badge variant="outline" className="text-xs py-0 h-5">
                          <Eye className="h-2.5 w-2.5 mr-0.5" />
                          {idea.estimatedViews}
                        </Badge>
                      )}
                      {idea.difficulty && (
                        <Badge variant="outline" className="text-xs py-0 h-5">
                          {idea.difficulty === "easy" ? "쉬움" : idea.difficulty === "hard" ? "어려움" : "보통"}
                        </Badge>
                      )}
                      {idea.videoTypes?.[0] && (
                        <Badge variant="outline" className="text-xs py-0 h-5">
                          {idea.videoTypes[0] === "short" ? "쇼츠" : idea.videoTypes[0] === "long" ? "롱폼" : "중간"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Zap className="h-4 w-4 text-purple-500 shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form action="" method="post" onSubmit={handleSubmit} className="space-y-6">
          {/* Hidden fields */}
          <input type="hidden" name="title" value={form.watch("title") || ""} />
          <input type="hidden" name="description" value={form.watch("description") || ""} />
          <input type="hidden" name="type" value={form.watch("type") || "long"} />
          <input type="hidden" name="visibility" value={form.watch("visibility") || "private"} />
          <input type="hidden" name="topic" value={form.watch("topic") || ""} />
          <input type="hidden" name="channelId" value={form.watch("channelId") || ""} />
          <input type="hidden" name="labels" value={JSON.stringify(form.watch("labels"))} />
          <input type="hidden" name="targetAudience" value={form.watch("targetAudience") || ""} />
          <input type="hidden" name="estimatedViews" value={form.watch("estimatedViews") || ""} />
          <input type="hidden" name="difficulty" value={form.watch("difficulty") || ""} />
          <input type="hidden" name="contentTone" value={form.watch("contentTone") || ""} />
          <input type="hidden" name="category" value={form.watch("category") || ""} />
          <input type="hidden" name="videoLength" value={form.watch("videoLength") || ""} />
          <input type="hidden" name="basedOnTrend" value={form.watch("basedOnTrend") || ""} />
          <input type="hidden" name="referenceUrl" value={form.watch("referenceUrl") || ""} />
          {form.watch("sourceIdeaId") && (
            <input type="hidden" name="sourceIdeaId" value={form.watch("sourceIdeaId")} />
          )}
          {selectedIdeaTrend?.trend?.thumbnailUrl && (
            <input type="hidden" name="thumbnailUrl" value={selectedIdeaTrend.trend.thumbnailUrl} />
          )}
          {selectedIdeaTrend?.trendId && (
            <input type="hidden" name="basedOnTrendUuid" value={selectedIdeaTrend.trendId} />
          )}
          {selectedIdeaTrend?.trend && (
            <input type="hidden" name="trendSnapshot" value={JSON.stringify({
              capturedAt: new Date().toISOString(),
              title: selectedIdeaTrend.trend.title,
              category: selectedIdeaTrend.trend.category,
              tags: selectedIdeaTrend.trend.tags || [],
              viewsCount: selectedIdeaTrend.trend.viewsCount || selectedIdea?.estimatedViews || "",
              growthRate: selectedIdeaTrend.trend.growthRate || selectedIdea?.growthRate || "",
              thumbnailUrl: selectedIdeaTrend.trend.thumbnailUrl,
              externalUrl: selectedIdeaTrend.trend.externalUrl,
            })} />
          )}

          {/* Two-column layout: Basic Info (left) + AI Context (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Basic Info (3/5) */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-4">
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>프로젝트 제목 *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="예: AI 자동화 완벽 가이드"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="channelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>채널</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                          name="channelId"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="채널 선택 (선택사항)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {channels.map((channel) => (
                              <SelectItem key={channel.id} value={channel.id}>
                                {channel.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>주제/키워드</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="예: AI 자동화, 업무 효율, 생산성"
                          {...field}
                          disabled={isLoading}
                          name="topic"
                        />
                      </FormControl>
                      <FormDescription>
                        AI가 스크립트 생성 시 참고할 핵심 주제
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>영상 설명</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="이 영상에서 다룰 내용을 자세히 설명해주세요. AI가 스크립트 작성 시 참고합니다."
                          className="resize-none"
                          rows={3}
                          {...field}
                          disabled={isLoading}
                          name="description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referenceUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Youtube 참고 영상</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://www.youtube.com/watch?v=..."
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        참고할 YouTube 영상 URL (선택사항)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Right: AI Context + Video Settings (2/5) */}
            <Card className="lg:col-span-2 border-purple-500/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  AI 컨텍스트
                </CardTitle>
                <CardDescription className="text-xs">
                  AI 스크립트/스토리보드 생성에 사용
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Video Type + Length (linked) */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>영상 타입</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                          name="type"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="long">일반 영상</SelectItem>
                            <SelectItem value="short">쇼츠/릴스</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="videoLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>영상 길이</FormLabel>
                        {watchedType === "short" ? (
                          <Select value="short" disabled name="videoLength">
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="short">60초 이하</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value === "short" ? "medium" : field.value}
                            disabled={isLoading}
                            name="videoLength"
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="길이 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="medium">중간 (2-10분)</SelectItem>
                              <SelectItem value="long">롱폼 (10분+)</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Target className="h-3.5 w-3.5 text-blue-500" />
                        타겟 오디언스
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="예: IT 취준생, 20대 직장인"
                          {...field}
                          disabled={isLoading}
                          name="targetAudience"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedViews"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Eye className="h-3.5 w-3.5 text-green-500" />
                        예상 조회수
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="예: 50K-100K"
                          {...field}
                          disabled={isLoading}
                          name="estimatedViews"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contentTone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>콘텐츠 톤</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="예: informative, cinematic..."
                          {...field}
                          disabled={isLoading}
                          name="contentTone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>제작 난이도</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                          name="difficulty"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="난이도 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="easy">쉬움</SelectItem>
                            <SelectItem value="medium">보통</SelectItem>
                            <SelectItem value="hard">어려움</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>공개 설정</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                          name="visibility"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="private">비공개</SelectItem>
                            <SelectItem value="public">공개</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Labels */}
          {labels.length > 0 && (
            <FormField
              control={form.control}
              name="labels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>라벨</FormLabel>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {labels.map((label) => {
                      const isSelected = field.value.includes(label.id);
                      return (
                        <Badge
                          key={label.id}
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer transition-all px-3 py-1",
                            isSelected ? label.color : "hover:bg-muted",
                          )}
                          onClick={() => {
                            const newValue = isSelected
                              ? field.value.filter((id) => id !== label.id)
                              : [...field.value, label.id];
                            field.onChange(newValue);
                          }}
                        >
                          {label.name}
                        </Badge>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate("/projects")}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isLoading ? "프로젝트 생성 중..." : "프로젝트 만들기"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
