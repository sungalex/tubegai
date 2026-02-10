import { useState } from "react";
import { Filter, X, Search, Globe, Layers, TrendingUp, RefreshCw, Youtube, Bookmark } from "lucide-react";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/common/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/common/components/ui/collapsible";
import { Badge } from "~/common/components/ui/badge";
import { cn } from "~/lib/utils";
import type { TrendFilterOptions } from "~/common/types/trend.types";
import { REGION_OPTIONS, YOUTUBE_CATEGORIES_KO } from "~/common/types/trend.types";

interface TrendFilterProps {
  filters: TrendFilterOptions;
  onFiltersChange: (filters: TrendFilterOptions) => void;
  onFetch?: () => void;
  onFetchSaved?: () => void;
  isLoadingYoutube?: boolean;
  isLoadingSaved?: boolean;
  categories?: string[];
  className?: string;
}

export function TrendFilter({
  filters,
  onFiltersChange,
  onFetch,
  onFetchSaved,
  isLoadingYoutube = false,
  isLoadingSaved = false,
  categories = [],
  className,
}: TrendFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  const hasActiveFilters =
    filters.category ||
    filters.minViews ||
    (filters.keywords && filters.keywords.length > 0) ||
    (filters.excludeKeywords && filters.excludeKeywords.length > 0);

  const activeFilterCount = [
    filters.category,
    filters.minViews,
    filters.keywords?.length,
    filters.excludeKeywords?.length,
  ].filter(Boolean).length;

  const handleRegionChange = (value: string) => {
    onFiltersChange({ ...filters, regionCode: value });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      category: value === "all" ? undefined : value,
    });
  };

  const handleMinViewsChange = (value: string) => {
    const minViews = value === "all" ? undefined : parseInt(value, 10);
    onFiltersChange({ ...filters, minViews });
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      const current = filters.keywords ?? [];
      if (!current.includes(keywordInput.trim())) {
        onFiltersChange({
          ...filters,
          keywords: [...current, keywordInput.trim()],
        });
      }
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    const current = filters.keywords ?? [];
    onFiltersChange({
      ...filters,
      keywords: current.filter((k) => k !== keyword),
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      regionCode: filters.regionCode,
    });
  };

  // Combine YouTube categories with dynamically fetched categories
  // Filter out empty strings to avoid Radix Select error
  const allCategories = [
    ...Object.values(YOUTUBE_CATEGORIES_KO),
    ...categories.filter((c) => c && !Object.values(YOUTUBE_CATEGORIES_KO).includes(c)),
  ].filter(Boolean).sort();

  return (
    <div className={cn("space-y-3", className)}>
      {/* Quick filters row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Region selector */}
        <Select
          value={filters.regionCode ?? "KR"}
          onValueChange={handleRegionChange}
        >
          <SelectTrigger className="w-28 h-8 text-xs">
            <Globe className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REGION_OPTIONS.map((region) => (
              <SelectItem key={region.code} value={region.code}>
                {region.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category selector */}
        <Select
          value={filters.category ?? "all"}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-36 h-8 text-xs">
            <Layers className="h-3 w-3 mr-1" />
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {allCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Min views selector */}
        <Select
          value={filters.minViews?.toString() ?? "all"}
          onValueChange={handleMinViewsChange}
        >
          <SelectTrigger className="w-32 h-8 text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            <SelectValue placeholder="최소 조회수" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="10000">10K+</SelectItem>
            <SelectItem value="100000">100K+</SelectItem>
            <SelectItem value="1000000">1M+</SelectItem>
            <SelectItem value="10000000">10M+</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced filter toggle */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs",
                hasActiveFilters && "border-purple-500/50 bg-purple-500/5"
              )}
            >
              <Filter className="h-3 w-3 mr-1" />
              고급 필터
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-4 w-4 p-0 text-xs justify-center"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        {/* Fetch button */}
        {onFetch && (
          <Button
            size="sm"
            className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
            onClick={onFetch}
            disabled={isLoadingYoutube || isLoadingSaved}
          >
            {isLoadingYoutube ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Youtube className="h-3 w-3 mr-1" />
            )}
            {isLoadingYoutube ? "가져오는 중..." : "YouTube에서 가져오기"}
          </Button>
        )}

        {/* Fetch saved trends button */}
        {onFetchSaved && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={onFetchSaved}
            disabled={isLoadingYoutube || isLoadingSaved}
          >
            {isLoadingSaved ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Bookmark className="h-3 w-3 mr-1" />
            )}
            저장된 트렌드 가져오기
          </Button>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={clearAllFilters}
          >
            <X className="h-3 w-3 mr-1" />
            필터 초기화
          </Button>
        )}
      </div>

      {/* Advanced filters panel */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <div className="p-4 rounded-lg border bg-card space-y-4">
            {/* Keyword filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">포함 키워드</label>
              <div className="flex gap-2">
                <Input
                  placeholder="키워드 입력 후 Enter"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                  className="h-8 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={addKeyword}
                >
                  <Search className="h-3 w-3" />
                </Button>
              </div>
              {filters.keywords && filters.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.keywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-destructive/20"
                      onClick={() => removeKeyword(keyword)}
                    >
                      {keyword}
                      <X className="h-2 w-2 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Info text */}
            <p className="text-xs text-muted-foreground">
              필터를 적용하면 제목과 태그에서 키워드를 검색합니다.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Active filters display */}
      {hasActiveFilters && !isOpen && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">활성 필터:</span>
          {filters.category && (
            <Badge variant="outline" className="text-xs">
              {filters.category}
              <X
                className="h-2 w-2 ml-1 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, category: undefined })}
              />
            </Badge>
          )}
          {filters.minViews && (
            <Badge variant="outline" className="text-xs">
              {(filters.minViews / 1000).toFixed(0)}K+ 조회수
              <X
                className="h-2 w-2 ml-1 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, minViews: undefined })}
              />
            </Badge>
          )}
          {filters.keywords?.map((kw) => (
            <Badge key={kw} variant="outline" className="text-xs">
              "{kw}"
              <X
                className="h-2 w-2 ml-1 cursor-pointer"
                onClick={() => removeKeyword(kw)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
