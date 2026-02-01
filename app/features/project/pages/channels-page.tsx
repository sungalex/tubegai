// =============================================================================
// YouTube Channel Management Page
// =============================================================================
// Simple channel list management - no account-level management needed

import { useState, useEffect } from "react";
import { useSearchParams, useRevalidator } from "react-router";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  RefreshCw,
  Trash2,
  Youtube,
  Users,
  Video,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  Eye,
  ExternalLink,
  Plus,
  MoreVertical,
} from "lucide-react";

import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
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
} from "~/common/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { Badge } from "~/common/components/ui/badge";

import type { Route } from "./+types/channels-page";
import type { Channel } from "~/common/types/channel.types";
import { getChannels } from "~/common/data/channel.data.server";
import { requireAuth } from "~/lib/auth.server";

// =============================================================================
// Loader & Meta
// =============================================================================

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  const channels = await getChannels(userId);
  return { channels };
}

export const meta = () => {
  return [
    { title: "채널 관리 | TubeGAI" },
    { name: "description", content: "YouTube 채널을 관리합니다." },
  ];
};

// =============================================================================
// Helper Functions
// =============================================================================

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "0";
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

// =============================================================================
// Component
// =============================================================================

export default function ChannelsPage({ loaderData }: Route.ComponentProps) {
  const { channels } = loaderData;
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [deleteChannelId, setDeleteChannelId] = useState<string | null>(null);
  const [syncingChannelId, setSyncingChannelId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const revalidator = useRevalidator();

  // Handle URL params for OAuth redirect messages
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "connected") {
      toast.success("YouTube 채널이 성공적으로 연결되었습니다!");
      window.history.replaceState({}, "", "/projects/channels");
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        cancelled: "OAuth 인증이 취소되었습니다.",
        session: "세션을 찾을 수 없습니다. 다시 로그인해주세요.",
        token: "YouTube 액세스 토큰을 찾을 수 없습니다.",
        youtube: "YouTube API 오류가 발생했습니다.",
        no_channel: "연결된 YouTube 채널을 찾을 수 없습니다.",
        save: "채널 정보 저장에 실패했습니다.",
        unknown: "알 수 없는 오류가 발생했습니다.",
      };
      toast.error(errorMessages[error] || "오류가 발생했습니다.");
      window.history.replaceState({}, "", "/projects/channels");
    }
  }, [searchParams]);

  // YouTube OAuth handler - starts OAuth flow
  async function handleYouTubeOAuth() {
    setIsOAuthLoading(true);
    try {
      const { linkYouTubeAccount } = await import("~/lib/youtube-oauth.client");
      const result = await linkYouTubeAccount("/projects/channels/callback");

      if (!result.success) {
        toast.error(result.error || "OAuth 시작 실패");
        setIsOAuthLoading(false);
      }
      // If successful, user will be redirected to Google
    } catch (error) {
      console.error("OAuth error:", error);
      toast.error("OAuth 연결 중 오류가 발생했습니다.");
      setIsOAuthLoading(false);
    }
  }

  // Sync channel data
  async function handleSyncChannel(channelId: string) {
    setSyncingChannelId(channelId);
    try {
      const formData = new FormData();
      formData.append("intent", "sync-channel");
      formData.append("channelId", channelId);

      const response = await fetch("/api/channels", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.needsAuth) {
        // Token expired or missing, need to re-authenticate
        toast.info("인증이 필요합니다. YouTube OAuth를 시작합니다...");
        await handleYouTubeOAuth();
        return;
      }

      if (result.success) {
        toast.success(result.message);
        revalidator.revalidate();
      } else {
        toast.error(result.error || "동기화 실패");
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("동기화 중 오류가 발생했습니다.");
    } finally {
      setSyncingChannelId(null);
    }
  }

  // Delete channel
  async function handleDeleteChannel(channelId: string) {
    try {
      const formData = new FormData();
      formData.append("intent", "delete-channel");
      formData.append("channelId", channelId);

      const response = await fetch("/api/channels", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        revalidator.revalidate();
      } else {
        toast.error(result.error || "삭제 실패");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleteChannelId(null);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">채널 관리</h1>
          <p className="text-muted-foreground mt-1">
            YouTube 채널을 추가하고 관리하세요.
          </p>
        </div>
        <Button
          onClick={handleYouTubeOAuth}
          disabled={isOAuthLoading}
          className="bg-red-600 hover:bg-red-700"
        >
          {isOAuthLoading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          채널 추가
        </Button>
      </div>

      {/* Channel List */}
      {channels.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Youtube className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">등록된 채널이 없습니다</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              YouTube 채널을 추가하면 채널 정보를 관리하고,
              <br />
              프로젝트와 연결하여 영상을 업로드할 수 있습니다.
            </p>
            <Button
              onClick={handleYouTubeOAuth}
              disabled={isOAuthLoading}
              size="lg"
              className="bg-red-600 hover:bg-red-700"
            >
              {isOAuthLoading ? (
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Youtube className="mr-2 h-5 w-5" />
              )}
              첫 번째 채널 추가하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              isSyncing={syncingChannelId === channel.id}
              onSync={() => handleSyncChannel(channel.id)}
              onDelete={() => setDeleteChannelId(channel.id)}
            />
          ))}
        </div>
      )}

      {/* Delete Channel Dialog */}
      <AlertDialog
        open={!!deleteChannelId}
        onOpenChange={(open) => !open && setDeleteChannelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>채널을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 채널과 연결된 프로젝트는 유지되지만, 채널
              정보는 제거됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteChannelId && handleDeleteChannel(deleteChannelId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// =============================================================================
// Channel Card Component
// =============================================================================

function ChannelCard({
  channel,
  isSyncing,
  onSync,
  onDelete,
}: {
  channel: Channel;
  isSyncing: boolean;
  onSync: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={channel.avatarUrl ?? undefined} />
            <AvatarFallback>{channel.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <CardTitle className="text-base font-medium leading-none">
              {channel.name}
            </CardTitle>
            {channel.handle && (
              <CardDescription className="text-xs mt-1">{channel.handle}</CardDescription>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">메뉴 열기</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a
                href={`https://youtube.com/channel/${channel.youtubeChannelId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                YouTube에서 보기
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSync} disabled={isSyncing}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
              />
              데이터 동기화
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="flex flex-col gap-1 p-2 bg-muted/40 rounded-md">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> 구독자
            </div>
            <div className="font-semibold text-sm">
              {formatNumber(channel.subscriberCount)}
            </div>
          </div>
          <div className="flex flex-col gap-1 p-2 bg-muted/40 rounded-md">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Video className="h-3 w-3" /> 영상
            </div>
            <div className="font-semibold text-sm">
              {formatNumber(channel.videoCount)}
            </div>
          </div>
          <div className="flex flex-col gap-1 p-2 bg-muted/40 rounded-md">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" /> 조회수
            </div>
            <div className="font-semibold text-sm">
              {formatNumber(channel.viewCount)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FolderKanban className="h-3 w-3" /> 프로젝트
          </div>
          <div className="font-semibold text-sm">{channel.projectCount}개</div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t p-4 bg-muted/10">
        <div className="flex flex-col gap-1">
          {channel.lastSyncedAt && (
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(channel.lastSyncedAt, { addSuffix: true, locale: ko })}{" "}
              동기화
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {channel.hasOAuthTokens && (
            <Badge variant="outline" className="border-blue-500 text-blue-500 gap-1 text-xs">
              인증됨
            </Badge>
          )}
          {channel.status === "active" ? (
            <Badge variant="outline" className="border-green-500 text-green-500 gap-1">
              <CheckCircle2 className="h-3 w-3" /> 활성
            </Badge>
          ) : channel.status === "syncing" ? (
            <Badge variant="outline" className="border-yellow-500 text-yellow-500 gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" /> 동기화 중
            </Badge>
          ) : (
            <Badge variant="outline" className="border-red-500 text-red-500 gap-1">
              <AlertCircle className="h-3 w-3" /> 오류
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
