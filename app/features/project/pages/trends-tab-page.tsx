import { useState, useMemo, useEffect } from "react";
import { useNavigate, useFetcher } from "react-router";
import type { Route } from "./+types/trends-tab-page";
import { TrendAnalyzer } from "../components/trend-analyzer";
import { TrendFilter } from "../components/trend-filter";
import {
  getYouTubeTrendsWithFilters,
  getTrendCategories,
  getStoredTrends,
  getStoredTrendsWithFilters,
} from "~/common/data/youtube.data.server";
import { getIdeas } from "~/common/data/idea.data.server";
import { getChannelsForSelect } from "~/common/data/project.data.server";
import { requireAuth } from "~/lib/auth.server";
import type { Idea, SavedIdea } from "~/common/types/ideation.types";
import { ideaToSavedIdea } from "~/common/types/ideation.types";
import type { TrendFilterOptions } from "~/common/types/trend.types";
import type { TrendItem } from "~/common/types/project.types";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  const url = new URL(request.url);

  // Parse filter params from URL
  const regionCode = url.searchParams.get("region") ?? "KR";
  const category = url.searchParams.get("category") ?? undefined;
  const minViewsParam = url.searchParams.get("minViews");
  const minViews = minViewsParam ? parseInt(minViewsParam, 10) : undefined;
  const keywordsParam = url.searchParams.get("keywords");
  const keywords = keywordsParam ? keywordsParam.split(",").filter(Boolean) : undefined;
  const forceRefresh = url.searchParams.get("refresh") === "true";
  const source = url.searchParams.get("source"); // "saved" for saved trends

  const filters: TrendFilterOptions = {
    regionCode,
    category,
    minViews,
    keywords,
  };

  // Fetch trends based on source
  let trends;
  if (forceRefresh) {
    // "YouTube에서 가져오기" 버튼 클릭 시 YouTube API 호출 + Supabase 저장
    trends = await getYouTubeTrendsWithFilters(filters, true);
  } else if (source === "saved") {
    // "저장된 트렌드 가져오기" 버튼 클릭 시 필터 적용하여 Supabase에서 가져오기
    trends = await getStoredTrendsWithFilters(filters);
  } else {
    // 기본: Supabase 캐시에서 가져오기 (필터 없이 최근 트렌드)
    trends = await getStoredTrends(regionCode);
  }

  const categories = await getTrendCategories();
  const channels = await getChannelsForSelect(userId);

  // Supabase에서 저장된 아이디어 가져오기 (최대 6개)
  const allIdeas = await getIdeas(userId, { isSaved: true });
  const savedIdeas = allIdeas.slice(0, 6).map(ideaToSavedIdea);

  return {
    trends,
    savedIdeas,
    categories,
    channels,
    initialFilters: filters,
  };
}

export default function TrendsTabPage({ loaderData }: Route.ComponentProps) {
  const {
    trends,
    savedIdeas: initialSavedIdeas,
    categories,
    channels,
    initialFilters,
  } = loaderData;
  const [savedIdeas, setSavedIdeas] = useState(initialSavedIdeas);
  const [filters, setFilters] = useState<TrendFilterOptions>(initialFilters);
  const [loadingSource, setLoadingSource] = useState<"youtube" | "saved" | null>(null);
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof loader>();

  // Use fetcher data if available, otherwise use loader data
  const currentTrends = fetcher.data?.trends ?? trends;
  const currentCategories = fetcher.data?.categories ?? categories;
  const isLoading = fetcher.state === "loading";

  // Reset loading source when fetcher completes
  useEffect(() => {
    if (fetcher.state === "idle") {
      setLoadingSource(null);
    }
  }, [fetcher.state]);

  // Update savedIdeas when fetcher data changes
  useEffect(() => {
    if (fetcher.data?.savedIdeas) {
      setSavedIdeas(fetcher.data.savedIdeas);
    }
  }, [fetcher.data]);

  // Parse view count string to number (e.g., "1.2M" -> 1200000)
  const parseViewCount = (views: string): number => {
    const normalized = views.toUpperCase().trim();
    const match = normalized.match(/^([\d.]+)\s*([KMB])?$/);
    if (!match) return 0;
    const num = parseFloat(match[1]);
    const suffix = match[2];
    switch (suffix) {
      case "K": return num * 1_000;
      case "M": return num * 1_000_000;
      case "B": return num * 1_000_000_000;
      default: return num;
    }
  };

  // Apply client-side filters (keywords and minViews) for instant filtering
  const filteredTrends = useMemo(() => {
    let result = currentTrends;

    // Filter by minimum views
    if (filters.minViews) {
      result = result.filter((trend: TrendItem) => {
        const viewCount = parseViewCount(trend.views);
        return viewCount >= filters.minViews!;
      });
    }

    // Filter by keywords
    if (filters.keywords?.length) {
      result = result.filter((trend: TrendItem) =>
        filters.keywords!.some(
          (kw: string) =>
            trend.title.toLowerCase().includes(kw.toLowerCase()) ||
            trend.tags?.some((tag: string) => tag.toLowerCase().includes(kw.toLowerCase()))
        )
      );
    }

    return result;
  }, [currentTrends, filters.minViews, filters.keywords]);

  const handleFiltersChange = (newFilters: TrendFilterOptions) => {
    setFilters(newFilters);
    // Server-side fetch is now triggered by the "Fetch from YouTube" button
  };

  const handleFetchTrends = () => {
    setLoadingSource("youtube");
    const params = new URLSearchParams();
    if (filters.regionCode) params.set("region", filters.regionCode);
    if (filters.category) params.set("category", filters.category);
    if (filters.minViews) params.set("minViews", filters.minViews.toString());
    if (filters.keywords?.length) params.set("keywords", filters.keywords.join(","));
    params.set("refresh", "true"); // Force refresh from YouTube API

    fetcher.load(`/projects/trends?${params.toString()}`);
  };

  const handleFetchSavedTrends = () => {
    setLoadingSource("saved");
    const params = new URLSearchParams();
    params.set("source", "saved");
    // 필터 적용하여 저장된 트렌드 가져오기
    if (filters.regionCode) params.set("region", filters.regionCode);
    if (filters.category) params.set("category", filters.category);
    if (filters.minViews) params.set("minViews", filters.minViews.toString());
    if (filters.keywords?.length) params.set("keywords", filters.keywords.join(","));

    fetcher.load(`/projects/trends?${params.toString()}`);
  };

  const handleSaveIdea = (idea: SavedIdea) => {
    // 새 아이디어를 savedIdeas 목록에 추가
    setSavedIdeas((prev) => [idea, ...prev].slice(0, 6));
  };

  const handleUpdateSavedIdeas = (newSavedIdeas: typeof savedIdeas) => {
    setSavedIdeas(newSavedIdeas);
  };

  return (
    <div className="space-y-4">
      <TrendFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onFetch={handleFetchTrends}
        onFetchSaved={handleFetchSavedTrends}
        isLoadingYoutube={isLoading && loadingSource === "youtube"}
        isLoadingSaved={isLoading && loadingSource === "saved"}
        categories={currentCategories}
      />

      {/* Debug: Show trend count */}
      <div className="text-xs text-muted-foreground px-1">
        트렌드: {filteredTrends.length}개 {isLoading && "(로딩 중...)"}
      </div>

      <TrendAnalyzer
        trends={filteredTrends}
        savedIdeas={savedIdeas}
        channels={channels}
        onSaveIdea={handleSaveIdea}
        onUpdateSavedIdeas={handleUpdateSavedIdeas}
        isLoading={isLoading}
      />
    </div>
  );
}
