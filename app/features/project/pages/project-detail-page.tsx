import { useState, useEffect } from "react";
import { Link, redirect, useFetcher, useNavigate } from "react-router";
import { formatDistanceToNow, format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Calendar,
  Clock,
  MoreVertical,
  Trash2,
  Archive,
  Pencil,
  FileText,
  Image as ImageIcon,
  Film,
  Download,
  Target,
  Eye,
  Zap,
  TrendingUp,
  Sparkles,
  Play,
  X,
  Save,
  Loader2,
  MessageSquarePlus,
  Hash,
} from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/common/components/ui/breadcrumb";
import { Progress } from "~/common/components/ui/progress";
import { Badge } from "~/common/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/common/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/common/components/ui/alert-dialog";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/common/components/ui/select";
import { toast } from "sonner";

import type { Route } from "./+types/project-detail-page";
import { getProjectById, updateProject, archiveProject, deleteProject, getProjectIntroImage } from "~/common/data/project.data.server";
import { getChannels } from "~/common/data/channel.data.server";
import { requireAuth } from "~/lib/auth.server";

export const meta = ({ data }: Route.MetaArgs) => {
  const title = data?.project?.title ?? "프로젝트";
  return [
    { title: `${title} | TubeGAI` },
    { name: "description", content: "프로젝트 상세 정보를 확인하고 관리합니다." },
  ];
};

export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  const projectId = params.projectId;

  if (!projectId) {
    throw redirect("/projects");
  }

  const [project, channels] = await Promise.all([
    getProjectById(projectId, userId),
    getChannels(userId),
  ]);

  if (!project) {
    throw redirect("/projects");
  }

  // Get intro image from storyboard if exists (for projects past storyboard stage)
  const introImage = await getProjectIntroImage(projectId);

  return { project, channels, introImage };
}

export async function action({ request, params }: Route.ActionArgs) {
  const userId = await requireAuth(request);
  const projectId = params.projectId;

  if (!projectId) {
    return { success: false, error: "프로젝트 ID가 필요합니다." };
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    switch (intent) {
      case "updateAll": {
        const dataJson = formData.get("data") as string;
        const data = JSON.parse(dataJson);

        await updateProject(projectId, userId, data);
        return { success: true, message: "저장되었습니다." };
      }

      case "archive": {
        await archiveProject(projectId, userId);
        return { success: true, message: "프로젝트가 보관되었습니다.", redirect: "/projects" };
      }

      case "delete": {
        await deleteProject(projectId, userId);
        return { success: true, message: "프로젝트가 삭제되었습니다.", redirect: "/projects" };
      }

      default:
        return { success: false, error: "알 수 없는 요청입니다." };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "오류가 발생했습니다." };
  }
}

const WORKFLOW_STEPS = [
  { id: "script", label: "스크립트", icon: FileText },
  { id: "storyboard", label: "스토리보드", icon: ImageIcon },
  { id: "scene", label: "씬", icon: Film },
  { id: "export", label: "내보내기", icon: Download },
];

const DIFFICULTY_MAP: Record<string, { label: string; color: string }> = {
  easy: { label: "쉬움", color: "text-green-500" },
  medium: { label: "보통", color: "text-yellow-500" },
  hard: { label: "어려움", color: "text-red-500" },
};

const CONTENT_TONE_MAP: Record<string, string> = {
  informative: "정보 전달형",
  funny: "재미/유머",
  dramatic: "드라마틱",
  casual: "캐주얼",
  professional: "전문적",
};

const VIDEO_LENGTH_MAP: Record<string, string> = {
  short: "쇼츠 (60초 이하)",
  medium: "중간 (2-10분)",
  long: "롱폼 (10분+)",
};

const TYPE_MAP: Record<string, string> = {
  short: "쇼츠/릴스",
  long: "일반 영상",
};

const VISIBILITY_MAP: Record<string, string> = {
  public: "공개",
  private: "비공개",
};

// Form data type
interface ProjectFormData {
  title: string;
  description: string;
  topic: string;
  type: string;
  visibility: string;
  targetAudience: string;
  estimatedViews: string;
  contentTone: string;
  videoLength: string;
  difficulty: string;
  hooks: string;
  scriptGuidelines: string;
  additionalNotes: string;
  channelId: string;
}

// Status values that prevent channel change (already uploaded/published)
const LOCKED_STATUSES = ["completed", "archived"];

// Read-only field display component
function ReadOnlyField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | undefined;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div className="text-sm font-medium">
        {value || <span className="text-muted-foreground italic">미설정</span>}
      </div>
    </div>
  );
}

export default function ProjectDetailPage({ loaderData }: Route.ComponentProps) {
  const { project, channels, introImage } = loaderData;

  // Use intro image if available (storyboard created), otherwise use project thumbnail
  const displayThumbnail = introImage || project.thumbnailUrl;
  const fetcher = useFetcher();
  const navigate = useNavigate();

  // Check if channel change is allowed (only for draft/in_progress projects)
  const canChangeChannel = !LOCKED_STATUSES.includes(project.status);

  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: project.title,
    description: project.description ?? "",
    topic: project.topic ?? "",
    type: project.type ?? "long",
    visibility: project.visibility ?? "private",
    targetAudience: project.targetAudience ?? "",
    estimatedViews: project.estimatedViews ?? "",
    contentTone: project.contentTone ?? "",
    videoLength: project.videoLength ?? "",
    difficulty: project.difficulty ?? "",
    hooks: project.hooks?.join("\n") ?? "",
    scriptGuidelines: project.scriptGuidelines
      ? [
          project.scriptGuidelines.openingStrategy ? `오프닝: ${project.scriptGuidelines.openingStrategy}` : "",
          project.scriptGuidelines.mainPoints?.length ? `핵심 포인트:\n${project.scriptGuidelines.mainPoints.join("\n")}` : "",
          project.scriptGuidelines.ctaStrategy ? `CTA: ${project.scriptGuidelines.ctaStrategy}` : "",
          project.scriptGuidelines.closingStrategy ? `마무리: ${project.scriptGuidelines.closingStrategy}` : "",
        ].filter(Boolean).join("\n\n")
      : (project.aiContext?.scriptGuidelinesText ?? ""),
    additionalNotes: project.aiContext?.additionalNotes ?? "",
    channelId: project.channel?.id ?? "",
  });

  const isSubmitting = fetcher.state !== "idle";

  const currentStepIndex = WORKFLOW_STEPS.findIndex(
    (step) => step.label === project.currentStep || step.id === project.currentStep?.toLowerCase()
  );

  // Handle action responses
  useEffect(() => {
    if (fetcher.data) {
      const data = fetcher.data as { success: boolean; message?: string; error?: string; redirect?: string };
      if (data.success) {
        if (data.redirect) {
          toast.success(data.message);
          navigate(data.redirect);
        } else if (data.message) {
          toast.success(data.message);
          setIsEditMode(false);
        }
      } else if (data.error) {
        toast.error(data.error);
      }
    }
  }, [fetcher.data, navigate]);

  const handleFieldChange = (field: keyof ProjectFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const updateData: Record<string, unknown> = {
      title: formData.title,
      description: formData.description || undefined,
      topic: formData.topic || undefined,
      type: formData.type as "short" | "long",
      visibility: formData.visibility as "public" | "private",
      targetAudience: formData.targetAudience || undefined,
      estimatedViews: formData.estimatedViews || undefined,
      contentTone: formData.contentTone || undefined,
      videoLength: formData.videoLength || undefined,
      difficulty: formData.difficulty || undefined,
      hooks: formData.hooks ? formData.hooks.split("\n").filter(Boolean) : [],
      aiContext: {
        ...project.aiContext,
        scriptGuidelinesText: formData.scriptGuidelines || undefined,
        additionalNotes: formData.additionalNotes || undefined,
      },
    };

    // Only include channelId if channel change is allowed
    if (canChangeChannel) {
      updateData.channelId = formData.channelId || null;
    }

    fetcher.submit(
      { intent: "updateAll", data: JSON.stringify(updateData) },
      { method: "post" }
    );
  };

  const handleCancel = () => {
    // Reset form to original values
    setFormData({
      title: project.title,
      description: project.description ?? "",
      topic: project.topic ?? "",
      type: project.type ?? "long",
      visibility: project.visibility ?? "private",
      targetAudience: project.targetAudience ?? "",
      estimatedViews: project.estimatedViews ?? "",
      contentTone: project.contentTone ?? "",
      videoLength: project.videoLength ?? "",
      difficulty: project.difficulty ?? "",
      hooks: project.hooks?.join("\n") ?? "",
      scriptGuidelines: project.scriptGuidelines
        ? [
            project.scriptGuidelines.openingStrategy ? `오프닝: ${project.scriptGuidelines.openingStrategy}` : "",
            project.scriptGuidelines.mainPoints?.length ? `핵심 포인트:\n${project.scriptGuidelines.mainPoints.join("\n")}` : "",
            project.scriptGuidelines.ctaStrategy ? `CTA: ${project.scriptGuidelines.ctaStrategy}` : "",
            project.scriptGuidelines.closingStrategy ? `마무리: ${project.scriptGuidelines.closingStrategy}` : "",
          ].filter(Boolean).join("\n\n")
        : (project.aiContext?.scriptGuidelinesText ?? ""),
      additionalNotes: project.aiContext?.additionalNotes ?? "",
      channelId: project.channel?.id ?? "",
    });
    setIsEditMode(false);
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/projects">프로젝트</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-60 truncate">{project.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
              <Badge variant="secondary">{project.status}</Badge>
              {project.basedOnTrend && (
                <Badge variant="outline" className="text-purple-500 border-purple-500/30 gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI 기반
                </Badge>
              )}
            </div>
            <div className="flex items-center text-muted-foreground text-sm gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(project.createdAt, "yyyy.M.d", { locale: ko })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(project.updatedAt, { addSuffix: true, locale: ko })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                  <X className="h-4 w-4 mr-2" />
                  취소
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  저장
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  편집
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Archive className="mr-2 h-4 w-4" /> 보관
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>프로젝트를 보관하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                            보관된 프로젝트는 목록에서 숨겨지며, 나중에 복원할 수 있습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction onClick={() => fetcher.submit({ intent: "archive" }, { method: "post" })}>
                            보관하기
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> 삭제
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>프로젝트를 삭제하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                            이 작업은 되돌릴 수 없습니다. 프로젝트와 관련된 모든 데이터가 영구적으로 삭제됩니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => fetcher.submit({ intent: "delete" }, { method: "post" })}
                          >
                            삭제하기
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button asChild>
                  <Link to={`/studio/script/${project.id}`}>
                    <Play className="h-4 w-4 mr-2" />
                    스튜디오 열기
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow Progress */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">제작 워크플로우</CardTitle>
                  <CardDescription>현재 단계: {project.currentStep ?? "스크립트"}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{project.progress}%</div>
                  <div className="text-xs text-muted-foreground">진행률</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={project.progress} className="h-2 mb-4" />
              <div className="grid grid-cols-4 gap-2">
                {WORKFLOW_STEPS.map((step, index) => {
                  const isActive = index === currentStepIndex || (currentStepIndex === -1 && index === 0);
                  const isCompleted = currentStepIndex > index;

                  return (
                    <Link
                      key={step.id}
                      to={`/studio/${step.id}/${project.id}`}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-lg border text-center transition-all hover:bg-accent",
                        isActive && "border-primary bg-primary/5 ring-1 ring-primary",
                        isCompleted && "bg-muted/50"
                      )}
                    >
                      <step.icon className={cn("h-5 w-5 mb-1", isActive ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-xs font-medium", isActive && "text-primary")}>{step.label}</span>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Context */}
          <Card className="border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-purple-500" />
                AI 컨텍스트
              </CardTitle>
              <CardDescription>
                {isEditMode ? "스튜디오에서 AI가 활용하는 정보를 수정합니다." : "스튜디오에서 AI가 활용하는 정보입니다."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main AI Fields */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {isEditMode ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Target className="h-3 w-3" /> 타겟 오디언스
                      </label>
                      <Input
                        value={formData.targetAudience}
                        onChange={(e) => handleFieldChange("targetAudience", e.target.value)}
                        placeholder="예: 20-30대 직장인"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" /> 예상 조회수
                      </label>
                      <Input
                        value={formData.estimatedViews}
                        onChange={(e) => handleFieldChange("estimatedViews", e.target.value)}
                        placeholder="예: 50K-100K"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">콘텐츠 톤</label>
                      <Select value={formData.contentTone} onValueChange={(v) => handleFieldChange("contentTone", v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="선택..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CONTENT_TONE_MAP).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">영상 길이</label>
                      <Select value={formData.videoLength} onValueChange={(v) => handleFieldChange("videoLength", v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="선택..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(VIDEO_LENGTH_MAP).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">제작 난이도</label>
                      <Select value={formData.difficulty} onValueChange={(v) => handleFieldChange("difficulty", v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="선택..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(DIFFICULTY_MAP).map(([value, { label }]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <ReadOnlyField label="타겟 오디언스" value={project.targetAudience ?? undefined} icon={Target} />
                    <ReadOnlyField label="예상 조회수" value={project.estimatedViews ?? undefined} icon={Eye} />
                    <ReadOnlyField label="콘텐츠 톤" value={project.contentTone ? CONTENT_TONE_MAP[project.contentTone] : undefined} />
                    <ReadOnlyField label="영상 길이" value={project.videoLength ? VIDEO_LENGTH_MAP[project.videoLength] : undefined} />
                    <ReadOnlyField label="제작 난이도" value={project.difficulty ? DIFFICULTY_MAP[project.difficulty]?.label : undefined} />
                  </>
                )}
                {project.basedOnTrend && (
                  <div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <TrendingUp className="h-3 w-3" />
                      기반 트렌드
                    </div>
                    <div className="text-sm font-medium truncate" title={project.basedOnTrend}>
                      {project.basedOnTrend}
                    </div>
                  </div>
                )}
              </div>

              {/* Hooks */}
              <div className="pt-4 border-t">
                {isEditMode ? (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3 text-yellow-500" /> 오프닝 훅
                    </label>
                    <Textarea
                      value={formData.hooks}
                      onChange={(e) => handleFieldChange("hooks", e.target.value)}
                      placeholder="각 훅을 줄바꿈으로 구분하여 입력하세요..."
                      className="text-sm min-h-20"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      오프닝 훅
                    </div>
                    {project.hooks && project.hooks.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {project.hooks.map((hook, index) => (
                          <Badge key={index} variant="secondary" className="py-1 px-2 text-xs">
                            {hook}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">미설정</span>
                    )}
                  </>
                )}
              </div>

              {/* Keywords */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <Hash className="h-3 w-3 text-blue-500" />
                  키워드
                </div>
                {project.aiContext?.keywords && project.aiContext.keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {project.aiContext.keywords.map((keyword: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">미설정</span>
                )}
              </div>

              {/* Script Guidelines */}
              <div className="pt-4 border-t">
                {isEditMode ? (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">스크립트 가이드라인</label>
                    <Textarea
                      value={formData.scriptGuidelines}
                      onChange={(e) => handleFieldChange("scriptGuidelines", e.target.value)}
                      placeholder="AI 스크립트 생성 시 참고할 가이드라인을 입력하세요..."
                      className="text-sm min-h-20"
                    />
                  </div>
                ) : (
                  <ReadOnlyField
                    label="스크립트 가이드라인"
                    value={
                      project.scriptGuidelines
                        ? [
                            project.scriptGuidelines.openingStrategy ? `오프닝: ${project.scriptGuidelines.openingStrategy}` : "",
                            project.scriptGuidelines.mainPoints?.length ? `핵심 포인트: ${project.scriptGuidelines.mainPoints.join(", ")}` : "",
                            project.scriptGuidelines.ctaStrategy ? `CTA: ${project.scriptGuidelines.ctaStrategy}` : "",
                            project.scriptGuidelines.closingStrategy ? `마무리: ${project.scriptGuidelines.closingStrategy}` : "",
                          ].filter(Boolean).join(" | ")
                        : project.aiContext?.scriptGuidelinesText
                    }
                  />
                )}
              </div>

              {/* User Prompt */}
              <div className="pt-4 border-t">
                {isEditMode ? (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <MessageSquarePlus className="h-3 w-3" /> 사용자 프롬프트
                    </label>
                    <Textarea
                      value={formData.additionalNotes}
                      onChange={(e) => handleFieldChange("additionalNotes", e.target.value)}
                      placeholder="AI에게 전달할 추가 지시사항을 입력하세요..."
                      className="text-sm min-h-20"
                    />
                  </div>
                ) : (
                  <ReadOnlyField label="사용자 프롬프트" value={project.aiContext?.additionalNotes} icon={MessageSquarePlus} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Project Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">프로젝트 정보</CardTitle>
              <CardDescription>
                {isEditMode ? "프로젝트 기본 정보를 수정합니다." : "프로젝트 기본 정보입니다."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Thumbnail - Compact */}
              {/* Uses intro image from storyboard if available, otherwise trend/project thumbnail */}
              <div className="aspect-video rounded-lg overflow-hidden bg-muted border relative max-h-36">
                {displayThumbnail ? (
                  <img src={displayThumbnail} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                    <Play className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Info Items */}
              <div className="space-y-3">
                {isEditMode ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">제목</label>
                      <Input
                        value={formData.title}
                        onChange={(e) => handleFieldChange("title", e.target.value)}
                        placeholder="프로젝트 제목"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="border-t pt-3 space-y-1">
                      <label className="text-xs text-muted-foreground">설명</label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => handleFieldChange("description", e.target.value)}
                        placeholder="프로젝트에 대한 설명을 입력하세요..."
                        className="text-sm min-h-16"
                      />
                    </div>
                    <div className="border-t pt-3 space-y-1">
                      <label className="text-xs text-muted-foreground">주제</label>
                      <Input
                        value={formData.topic}
                        onChange={(e) => handleFieldChange("topic", e.target.value)}
                        placeholder="영상 주제"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="border-t pt-3 space-y-1">
                      <label className="text-xs text-muted-foreground">타입</label>
                      <Select value={formData.type} onValueChange={(v) => handleFieldChange("type", v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TYPE_MAP).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="border-t pt-3 space-y-1">
                      <label className="text-xs text-muted-foreground">공개 설정</label>
                      <Select value={formData.visibility} onValueChange={(v) => handleFieldChange("visibility", v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(VISIBILITY_MAP).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    {/* 읽기 모드: 제목은 헤더에 h1으로 표시되므로 여기서는 생략 */}
                    <ReadOnlyField label="설명" value={project.description ?? undefined} />
                    {project.topic && project.topic !== project.title && (
                      <div className="border-t pt-3">
                        <ReadOnlyField label="주제" value={project.topic} />
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <ReadOnlyField label="타입" value={project.type ? TYPE_MAP[project.type] : undefined} />
                    </div>
                    <div className="border-t pt-3">
                      <ReadOnlyField label="공개 설정" value={project.visibility ? VISIBILITY_MAP[project.visibility] : undefined} />
                    </div>
                  </>
                )}

                {/* Channel */}
                <div className="border-t pt-3">
                  <div className="text-xs text-muted-foreground mb-1">채널</div>
                  {isEditMode ? (
                    canChangeChannel ? (
                      <Select
                        value={formData.channelId}
                        onValueChange={(v) => handleFieldChange("channelId", v === "none" ? "" : v)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="채널 선택..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">채널 없음</SelectItem>
                          {channels.map((channel) => (
                            <SelectItem key={channel.id} value={channel.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={channel.avatarUrl ?? undefined} />
                                  <AvatarFallback className="text-xs">{channel.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {channel.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        {project.channel ? (
                          <>
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={project.channel.avatarUrl ?? undefined} />
                              <AvatarFallback className="text-xs">{project.channel.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{project.channel.name}</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">미설정</span>
                        )}
                        <Badge variant="outline" className="text-xs ml-auto">
                          변경 불가
                        </Badge>
                      </div>
                    )
                  ) : project.channel ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={project.channel.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-xs">{project.channel.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{project.channel.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">미설정</span>
                  )}
                </div>

                {/* ID - Read only */}
                <div className="border-t pt-3">
                  <div className="text-xs text-muted-foreground mb-1">ID</div>
                  <span className="font-mono text-xs text-muted-foreground">{project.id.slice(0, 8)}...</span>
                </div>
              </div>

              {/* Labels */}
              {project.labels.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-2">라벨</div>
                  <div className="flex flex-wrap gap-1">
                    {project.labels.map((label) => (
                      <Badge key={label.id} className={cn("text-xs text-white", label.color)}>
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
