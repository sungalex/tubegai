import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation, redirect } from "react-router";
import { ChevronLeft, Sparkles, Loader2, Plus, X, Lightbulb, Target, Eye, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { Badge } from "~/common/components/ui/badge";
import { useTranslation } from "~/i18n/context";

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
import { RadioGroup, RadioGroupItem } from "~/common/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/common/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/common/components/ui/accordion";
import { Separator } from "~/common/components/ui/separator";

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
  tone: z.string().optional(),
  visibility: z.enum(["public", "private"]),
  topic: z.string().optional(),
  channelId: z.string().optional(),
  labels: z.array(z.string()),
  // AI Context fields
  hooks: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  estimatedViews: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  contentTone: z.enum(["informative", "funny", "dramatic", "casual", "professional"]).optional(),
  videoLength: z.enum(["short", "medium", "long"]).optional(),
  basedOnTrend: z.string().optional(),
  basedOnTrendId: z.number().optional(),
  sourceIdeaId: z.string().optional(),
  // AI Context JSON fields
  keywords: z.string().optional(),
  styleNotes: z.string().optional(),
  scriptGuidelines: z.string().optional(),
  callToAction: z.string().optional(),
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
  hooks: [],
  targetAudience: "",
  estimatedViews: "",
  difficulty: "medium",
  contentTone: "informative",
  videoLength: "medium",
  keywords: "",
  styleNotes: "",
  scriptGuidelines: "",
  callToAction: "",
};

// =============================================================================
// Loader & Action
// =============================================================================

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  const [channels, labels, savedIdeas] = await Promise.all([
    getChannelsForSelect(userId),
    getLabels(),
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
    const hooks = data.hooks ? JSON.parse(data.hooks as string) : undefined;
    const labels = data.labels ? JSON.parse(data.labels as string) : [];
    const aiContext: Record<string, unknown> = {};

    if (data.keywords) {
      aiContext.keywords = (data.keywords as string).split(",").map(k => k.trim()).filter(Boolean);
    }
    if (data.styleNotes) aiContext.styleNotes = data.styleNotes;
    if (data.callToAction) aiContext.callToAction = data.callToAction;

    // Parse scriptGuidelines as proper JSON object (not string)
    let scriptGuidelines;
    if (data.scriptGuidelines) {
      try {
        scriptGuidelines = JSON.parse(data.scriptGuidelines as string);
      } catch {
        // If parsing fails, store as text in aiContext
        aiContext.scriptGuidelinesText = data.scriptGuidelines;
      }
    }

    const result = await createProject(userId, {
      title: (data.title as string) || "Untitled Project",
      description: (data.description as string) || undefined,
      type: (data.type as "short" | "long") || "long",
      tone: (data.tone as string) ? (data.tone as "informative" | "funny" | "cinematic" | "vlog") : undefined,
      visibility: (data.visibility as "public" | "private") || "private",
      topic: (data.topic as string) || undefined,
      channelId: (data.channelId as string) || undefined,
      thumbnailUrl: (data.thumbnailUrl as string) || undefined,
      labels,
      hooks,
      targetAudience: (data.targetAudience as string) || undefined,
      estimatedViews: (data.estimatedViews as string) || undefined,
      difficulty: (data.difficulty as string) ? (data.difficulty as "easy" | "medium" | "hard") : undefined,
      contentTone: (data.contentTone as string) ? (data.contentTone as "informative" | "funny" | "dramatic" | "casual" | "professional") : undefined,
      videoLength: (data.videoLength as string) ? (data.videoLength as "short" | "medium" | "long") : undefined,
      basedOnTrend: (data.basedOnTrend as string) || undefined,
      basedOnTrendId: data.basedOnTrendId ? parseInt(data.basedOnTrendId as string) : undefined,
      basedOnTrendUuid: (data.basedOnTrendUuid as string) || undefined,
      sourceIdeaId: (data.sourceIdeaId as string) || undefined,
      aiContext: Object.keys(aiContext).length > 0 ? aiContext : undefined,
      scriptGuidelines,
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
  const [newHook, setNewHook] = useState("");
  const { t } = useTranslation("project");
  const { t: tc } = useTranslation("common");

  // Get source data from navigation state
  const sourceData = location.state as {
    topic?: string;
    idea?: Idea;
    fromTrend?: boolean;
    trendId?: number;
    hooks?: string[];
    targetAudience?: string;
    estimatedViews?: string;
    difficulty?: string;
    description?: string;
  } | null;

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      ...defaultValues,
      // Pre-fill from source data
      topic: sourceData?.topic || sourceData?.idea?.title || "",
      title: sourceData?.topic ? `${sourceData.topic}` : sourceData?.idea?.title || "",
      description: sourceData?.description || sourceData?.idea?.description || "",
      hooks: sourceData?.hooks || sourceData?.idea?.hooks || [],
      targetAudience: sourceData?.targetAudience || sourceData?.idea?.targetAudience || "",
      estimatedViews: sourceData?.estimatedViews || sourceData?.idea?.estimatedViews || "",
      difficulty: (sourceData?.difficulty || sourceData?.idea?.difficulty || "medium") as "easy" | "medium" | "hard",
      basedOnTrend: (sourceData?.idea ? getPrimaryTrend(sourceData.idea)?.trend?.title : null) || sourceData?.topic || "",
      basedOnTrendId: typeof sourceData?.trendId === "number" ? sourceData.trendId : undefined,
      sourceIdeaId: sourceData?.idea?.id,
    },
  });

  // Show error toast if action failed
  useEffect(() => {
    if (actionData?.error) {
      toast.error(actionData.error);
      setIsLoading(false);
    }
  }, [actionData]);

  const hooks = form.watch("hooks") || [];

  const addHook = () => {
    if (newHook.trim()) {
      form.setValue("hooks", [...hooks, newHook.trim()]);
      setNewHook("");
    }
  };

  const removeHook = (index: number) => {
    form.setValue("hooks", hooks.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setIsLoading(true);
  };

  // Select from saved ideas
  const handleSelectIdea = (idea: Idea) => {
    const basedOnTrend = getPrimaryTrend(idea)?.trend?.title || "";
    form.setValue("title", idea.title);
    form.setValue("description", idea.description || "");
    form.setValue("topic", basedOnTrend || idea.title);
    form.setValue("hooks", idea.hooks || []);
    form.setValue("targetAudience", idea.targetAudience || "");
    form.setValue("estimatedViews", idea.estimatedViews || "");
    form.setValue("difficulty", idea.difficulty || "medium");
    form.setValue("basedOnTrend", basedOnTrend);
    form.setValue("sourceIdeaId", idea.id);
    toast.success("아이디어가 적용되었습니다!");
  };

  const hasSourceData = sourceData?.idea || sourceData?.topic;
  const unusedIdeas = savedIdeas.filter(idea => !idea.isUsed);

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <Button variant="ghost" className="pl-0 mb-4" asChild>
          <Link to="/projects">
            <ChevronLeft className="mr-2 h-4 w-4" />
            대시보드로 돌아가기
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          새 프로젝트 만들기
        </h1>
        <p className="text-muted-foreground">
          AI가 스튜디오에서 활용할 정보를 입력해주세요. 더 자세한 정보를 입력할수록 더 좋은 결과를 얻을 수 있습니다.
        </p>
      </div>

      {/* Source Info Banner */}
      {hasSourceData && (
        <Card className="mb-6 border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/10">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-purple-400">
                  {sourceData?.idea ? "저장된 아이디어에서 시작" : "트렌드에서 시작"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {sourceData?.idea?.title || sourceData?.topic}
                </p>
              </div>
              {sourceData?.idea?.estimatedViews && (
                <Badge variant="outline" className="text-green-500 border-green-500/30">
                  <Eye className="h-3 w-3 mr-1" />
                  {sourceData.idea.estimatedViews}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Ideas Quick Select */}
      {!hasSourceData && unusedIdeas.length > 0 && (
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
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {unusedIdeas.slice(0, 5).map((idea) => (
                <Button
                  key={idea.id}
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 px-3"
                  onClick={() => handleSelectIdea(idea)}
                >
                  <Zap className="h-3 w-3 mr-1 text-purple-500" />
                  <span className="truncate max-w-40">{idea.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form action="" method="post" onSubmit={handleSubmit} className="space-y-8">
          {/* Hidden fields to ensure all form data is submitted */}
          <input type="hidden" name="title" value={form.watch("title") || ""} />
          <input type="hidden" name="description" value={form.watch("description") || ""} />
          <input type="hidden" name="type" value={form.watch("type") || "long"} />
          <input type="hidden" name="tone" value={form.watch("tone") || ""} />
          <input type="hidden" name="visibility" value={form.watch("visibility") || "private"} />
          <input type="hidden" name="topic" value={form.watch("topic") || ""} />
          <input type="hidden" name="channelId" value={form.watch("channelId") || ""} />
          <input type="hidden" name="hooks" value={JSON.stringify(hooks)} />
          <input type="hidden" name="labels" value={JSON.stringify(form.watch("labels"))} />
          <input type="hidden" name="targetAudience" value={form.watch("targetAudience") || ""} />
          <input type="hidden" name="estimatedViews" value={form.watch("estimatedViews") || ""} />
          <input type="hidden" name="difficulty" value={form.watch("difficulty") || ""} />
          <input type="hidden" name="contentTone" value={form.watch("contentTone") || ""} />
          <input type="hidden" name="videoLength" value={form.watch("videoLength") || ""} />
          <input type="hidden" name="basedOnTrend" value={form.watch("basedOnTrend") || ""} />
          <input type="hidden" name="keywords" value={form.watch("keywords") || ""} />
          <input type="hidden" name="scriptGuidelines" value={form.watch("scriptGuidelines") || ""} />
          <input type="hidden" name="callToAction" value={form.watch("callToAction") || ""} />
          {form.watch("sourceIdeaId") && (
            <input type="hidden" name="sourceIdeaId" value={form.watch("sourceIdeaId")} />
          )}
          {form.watch("basedOnTrendId") && (
            <input type="hidden" name="basedOnTrendId" value={String(form.watch("basedOnTrendId"))} />
          )}

          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        rows={4}
                        {...field}
                        disabled={isLoading}
                        name="description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
          </Card>

          {/* AI Context Card */}
          <Card className="border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI 컨텍스트
              </CardTitle>
              <CardDescription>
                스튜디오에서 AI가 더 나은 스크립트와 스토리보드를 생성하는 데 사용됩니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hooks */}
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  오프닝 훅
                </FormLabel>
                <div className="space-y-3">
                  {hooks.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {hooks.map((hook, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="py-1.5 px-3 text-sm flex items-center gap-1"
                        >
                          <span className="max-w-60 truncate">{hook}</span>
                          <button
                            type="button"
                            onClick={() => removeHook(index)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="시청자의 관심을 끄는 첫 문장을 입력하세요"
                      value={newHook}
                      onChange={(e) => setNewHook(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addHook();
                        }
                      }}
                      disabled={isLoading}
                    />
                    <Button type="button" variant="outline" onClick={addHook} disabled={isLoading}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <FormDescription>
                  영상 시작 부분에 사용할 훅 아이디어들
                </FormDescription>
              </FormItem>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
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
                        <Eye className="h-4 w-4 text-green-500" />
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="contentTone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>콘텐츠 톤</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                        name="contentTone"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="톤 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="informative">정보 전달형</SelectItem>
                          <SelectItem value="funny">재미/유머</SelectItem>
                          <SelectItem value="dramatic">드라마틱</SelectItem>
                          <SelectItem value="casual">캐주얼</SelectItem>
                          <SelectItem value="professional">전문적</SelectItem>
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                        name="videoLength"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="길이 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="short">쇼츠 (60초 이하)</SelectItem>
                          <SelectItem value="medium">중간 (2-10분)</SelectItem>
                          <SelectItem value="long">롱폼 (10분+)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="text-sm font-medium">고급 설정</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <SelectItem value="short">쇼츠/릴스</SelectItem>
                            <SelectItem value="long">일반 영상</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>프로젝트 톤</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                          name="tone"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="톤 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="informative">정보 전달</SelectItem>
                            <SelectItem value="funny">재미/유머</SelectItem>
                            <SelectItem value="cinematic">시네마틱</SelectItem>
                            <SelectItem value="vlog">브이로그</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                <Separator />

                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SEO 키워드</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="콤마로 구분: AI, 자동화, 업무효율"
                          {...field}
                          disabled={isLoading}
                          name="keywords"
                        />
                      </FormControl>
                      <FormDescription>
                        검색 최적화에 사용될 키워드
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scriptGuidelines"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>스크립트 가이드라인</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="AI가 스크립트 작성 시 참고할 가이드라인을 입력하세요"
                          className="resize-none"
                          rows={3}
                          {...field}
                          disabled={isLoading}
                          name="scriptGuidelines"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="callToAction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call to Action</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="예: 구독과 좋아요 부탁드려요!"
                          {...field}
                          disabled={isLoading}
                          name="callToAction"
                        />
                      </FormControl>
                      <FormDescription>
                        영상 마지막에 사용할 CTA 문구
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>공개 설정</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                          disabled={isLoading}
                          name="visibility"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="private" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              비공개 - 나만 볼 수 있음
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="public" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              공개 - 누구나 볼 수 있음
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

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
