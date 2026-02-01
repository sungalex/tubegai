import { Link, redirect } from "react-router";
import { formatDistanceToNow, format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MoreVertical,
  Share2,
  Trash2,
  Archive,
  Pencil,
  FileText,
  Image as ImageIcon,
  Film,
  Video,
  ExternalLink,
  Target,
  Eye,
  Zap,
  TrendingUp,
  Sparkles,
  Users,
  Play,
  Download,
  Settings,
  Tag,
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
import { Separator } from "~/common/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/common/components/ui/dropdown-menu";

import type { Route } from "./+types/project-detail-page";
import { getProjectById } from "~/common/data/project.data.server";
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

  const project = await getProjectById(projectId, userId);

  if (!project) {
    throw redirect("/projects");
  }

  return { project };
}

const WORKFLOW_STEPS = [
  { id: "script", label: "스크립트", icon: FileText },
  { id: "storyboard", label: "스토리보드", icon: ImageIcon },
  { id: "scene", label: "씬", icon: Film },
  { id: "export", label: "내보내기", icon: Download },
];

const DIFFICULTY_MAP: Record<string, { label: string; color: string }> = {
  easy: { label: "쉬움", color: "text-green-500 border-green-500/30" },
  medium: { label: "보통", color: "text-yellow-500 border-yellow-500/30" },
  hard: { label: "어려움", color: "text-red-500 border-red-500/30" },
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

export default function ProjectDetailPage({ loaderData }: Route.ComponentProps) {
  const { project } = loaderData;

  const currentStepIndex = WORKFLOW_STEPS.findIndex(
    (step) => step.label === project.currentStep || step.id === project.currentStep?.toLowerCase()
  );

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 mb-8">
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
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {project.title}
              </h1>
              <Badge variant="secondary" className="text-sm font-normal">
                {project.status}
              </Badge>
              {project.basedOnTrend && (
                <Badge variant="outline" className="text-purple-500 border-purple-500/30 gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI 기반
                </Badge>
              )}
            </div>
            <div className="flex items-center text-muted-foreground text-sm gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(project.createdAt, "yyyy년 M월 d일", { locale: ko })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(project.updatedAt, { addSuffix: true, locale: ko })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" /> 수정
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Archive className="mr-2 h-4 w-4" /> 보관
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> 삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="lg" asChild>
              <Link to={`/studio/script/${project.id}`}>
                <Play className="h-4 w-4 mr-2" />
                스튜디오 열기
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Workflow Progress Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">제작 워크플로우</CardTitle>
          <CardDescription>
            현재 단계: {project.currentStep ?? "스크립트"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span>전체 진행률</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {WORKFLOW_STEPS.map((step, index) => {
              const isActive = index === currentStepIndex || (currentStepIndex === -1 && index === 0);
              const isCompleted = currentStepIndex > index;

              return (
                <Link
                  key={step.id}
                  to={`/studio/${step.id}/${project.id}`}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border text-center transition-colors hover:bg-accent",
                    isActive && "border-primary bg-primary/5 ring-1 ring-primary",
                    isCompleted && "bg-muted/50"
                  )}
                >
                  <step.icon className={cn(
                    "h-6 w-6 mb-2",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    isActive && "text-primary"
                  )}>{step.label}</span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Overview & AI Context */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>개요</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Thumbnail */}
              <div className="aspect-video rounded-lg overflow-hidden bg-muted border relative group">
                {project.thumbnailUrl ? (
                  <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                    <Play className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Description */}
              {project.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">설명</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {project.description}
                  </p>
                </div>
              )}

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {project.channel && (
                  <div className="p-4 rounded-lg bg-muted/30 border">
                    <div className="text-xs text-muted-foreground mb-1">채널</div>
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={project.channel.avatarUrl ?? undefined} />
                        <AvatarFallback>{project.channel.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {project.channel.name}
                    </div>
                  </div>
                )}
                {project.topic && (
                  <div className="p-4 rounded-lg bg-muted/30 border">
                    <div className="text-xs text-muted-foreground mb-1">주제</div>
                    <div className="font-medium text-sm">{project.topic}</div>
                  </div>
                )}
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <div className="text-xs text-muted-foreground mb-1">영상 타입</div>
                  <div className="font-medium text-sm">{TYPE_MAP[project.type] ?? project.type}</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <div className="text-xs text-muted-foreground mb-1">공개 설정</div>
                  <div className="font-medium text-sm">
                    {project.visibility === "public" ? "공개" : "비공개"}
                  </div>
                </div>
              </div>

              {/* Labels */}
              {project.labels.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">라벨</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.labels.map((label) => (
                      <Badge key={label.id} className={cn("px-2 py-0.5 text-white", label.color)}>
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Context Card */}
          {(project.hooks?.length || project.targetAudience || project.estimatedViews ||
            project.contentTone || project.videoLength || project.difficulty || project.basedOnTrend ||
            project.aiContext) && (
            <Card className="border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  AI 컨텍스트
                </CardTitle>
                <CardDescription>
                  스튜디오에서 AI가 활용하는 정보입니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hooks */}
                {project.hooks && project.hooks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      오프닝 훅
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {project.hooks.map((hook, index) => (
                        <Badge key={index} variant="secondary" className="py-1.5 px-3 text-sm">
                          {hook}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {project.targetAudience && (
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        타겟 오디언스
                      </div>
                      <div className="font-medium text-sm">{project.targetAudience}</div>
                    </div>
                  )}
                  {project.estimatedViews && (
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        예상 조회수
                      </div>
                      <div className="font-medium text-sm text-green-500">{project.estimatedViews}</div>
                    </div>
                  )}
                  {project.contentTone && (
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <div className="text-xs text-muted-foreground mb-1">콘텐츠 톤</div>
                      <div className="font-medium text-sm">
                        {CONTENT_TONE_MAP[project.contentTone] ?? project.contentTone}
                      </div>
                    </div>
                  )}
                  {project.videoLength && (
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <div className="text-xs text-muted-foreground mb-1">영상 길이</div>
                      <div className="font-medium text-sm">
                        {VIDEO_LENGTH_MAP[project.videoLength] ?? project.videoLength}
                      </div>
                    </div>
                  )}
                  {project.difficulty && (
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <div className="text-xs text-muted-foreground mb-1">제작 난이도</div>
                      <div className={cn("font-medium text-sm", DIFFICULTY_MAP[project.difficulty]?.color)}>
                        {DIFFICULTY_MAP[project.difficulty]?.label ?? project.difficulty}
                      </div>
                    </div>
                  )}
                  {project.basedOnTrend && (
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        기반 트렌드
                      </div>
                      <div className="font-medium text-sm truncate" title={project.basedOnTrend}>
                        {project.basedOnTrend}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Context JSON fields */}
                {project.aiContext && (
                  <>
                    {project.aiContext.keywords && project.aiContext.keywords.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">SEO 키워드</h3>
                        <div className="flex flex-wrap gap-2">
                          {project.aiContext.keywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {project.aiContext.scriptGuidelines && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">스크립트 가이드라인</h3>
                        <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                          {project.aiContext.scriptGuidelines}
                        </p>
                      </div>
                    )}
                    {project.aiContext.callToAction && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Call to Action</h3>
                        <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                          {project.aiContext.callToAction}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Quick Actions & Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">빠른 작업</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to={`/studio/script/${project.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  스크립트 편집
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to={`/studio/storyboard/${project.id}`}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  스토리보드 작업
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to={`/studio/scene/${project.id}`}>
                  <Film className="mr-2 h-4 w-4" />
                  씬 편집
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to={`/studio/export/${project.id}`}>
                  <Download className="mr-2 h-4 w-4" />
                  내보내기
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">프로젝트 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">프로젝트 ID</span>
                <span className="text-xs font-mono text-muted-foreground">{project.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">상태</span>
                <Badge variant="secondary">{project.status}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">진행률</span>
                <span className="text-sm font-medium">{project.progress}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">현재 단계</span>
                <span className="text-sm font-medium">{project.currentStep ?? "스크립트"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">생성일</span>
                <span className="text-sm font-medium">
                  {format(project.createdAt, "yyyy.MM.dd")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
