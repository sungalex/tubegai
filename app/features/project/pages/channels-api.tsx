// =============================================================================
// YouTube Channel API Route (Resource Route)
// =============================================================================
// Handles JSON API requests for YouTube channel operations

import type { Route } from "./+types/channels-api";
import {
  upsertChannel,
  deleteChannel,
  syncChannelStats,
  getChannelWithTokens,
} from "~/common/data/channel.data.server";
import type { CreateChannelInput } from "~/common/types/channel.types";
import { requireAuth } from "~/lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  try {
    const userId = await requireAuth(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    // Save channel(s) from OAuth callback
    if (intent === "save-channels") {
      const accessToken = formData.get("accessToken") as string;
      const refreshToken = formData.get("refreshToken") as string;
      const channelsJson = formData.get("channels") as string;

      if (!channelsJson) {
        return Response.json(
          { success: false, error: "Missing channels data" },
          { status: 400 }
        );
      }

      const channels: CreateChannelInput[] = JSON.parse(channelsJson);
      let created = 0;
      let updated = 0;

      for (const channel of channels) {
        const result = await upsertChannel(userId, {
          ...channel,
          accessToken: accessToken || undefined,
          refreshToken: refreshToken || undefined,
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        });

        if (result.isNew) {
          created++;
        } else {
          updated++;
        }
      }

      return Response.json({
        success: true,
        message:
          created > 0
            ? `${created}개 채널이 추가되었습니다.`
            : `${updated}개 채널이 업데이트되었습니다.`,
        created,
        updated,
      });
    }

    // Delete a channel
    if (intent === "delete-channel") {
      const channelId = formData.get("channelId") as string;

      if (!channelId) {
        return Response.json(
          { success: false, error: "Missing channelId" },
          { status: 400 }
        );
      }

      await deleteChannel(channelId, userId);

      return Response.json({
        success: true,
        message: "채널이 삭제되었습니다.",
      });
    }

    // Sync channel stats (requires existing OAuth tokens)
    if (intent === "sync-channel") {
      const channelId = formData.get("channelId") as string;

      if (!channelId) {
        return Response.json(
          { success: false, error: "Missing channelId" },
          { status: 400 }
        );
      }

      const channel = await getChannelWithTokens(channelId, userId);

      if (!channel) {
        return Response.json(
          { success: false, error: "채널을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      if (!channel.accessToken) {
        return Response.json({
          success: false,
          needsAuth: true,
          message: "OAuth 인증이 필요합니다.",
        });
      }

      // Fetch updated channel data from YouTube API
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channel.youtubeChannelId}`,
        {
          headers: {
            Authorization: `Bearer ${channel.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        // Token might be expired
        if (response.status === 401) {
          return Response.json({
            success: false,
            needsAuth: true,
            message: "토큰이 만료되었습니다. 다시 인증해주세요.",
          });
        }
        return Response.json(
          { success: false, error: "YouTube API 오류" },
          { status: 500 }
        );
      }

      const data = await response.json();
      const channelData = data.items?.[0];

      if (!channelData) {
        return Response.json(
          { success: false, error: "채널 정보를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      // Update channel stats
      await syncChannelStats(channelId, userId, {
        name: channelData.snippet.title,
        handle: channelData.snippet.customUrl || undefined,
        description: channelData.snippet.description || undefined,
        avatarUrl:
          channelData.snippet.thumbnails.high?.url ||
          channelData.snippet.thumbnails.default?.url,
        bannerUrl: channelData.brandingSettings?.image?.bannerExternalUrl,
        subscriberCount: parseInt(channelData.statistics.subscriberCount || "0", 10),
        videoCount: parseInt(channelData.statistics.videoCount || "0", 10),
        viewCount: parseInt(channelData.statistics.viewCount || "0", 10),
      });

      return Response.json({
        success: true,
        message: "채널 정보가 동기화되었습니다.",
      });
    }

    return Response.json(
      { success: false, error: "Unknown intent" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[YouTube:ChannelAPI] Action FAILED:", error instanceof Error ? error.message : error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
