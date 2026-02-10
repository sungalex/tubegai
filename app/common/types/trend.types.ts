/**
 * Trend Types
 *
 * 트렌드-프로젝트 연동을 위한 타입 정의
 */

// ============================================
// Trend Snapshot (프로젝트에 저장되는 트렌드 정보)
// ============================================

export interface TrendSnapshot {
  /** 스냅샷 캡처 시점 */
  capturedAt: string;
  /** 트렌드 제목 */
  title: string;
  /** 트렌드 설명 */
  description?: string;
  /** 카테고리 */
  category: string;
  /** 태그 목록 */
  tags: string[];
  /** 조회수 (포맷팅된 문자열, e.g., "1.2M") */
  viewsCount: string;
  /** 성장률 (e.g., "+145%") */
  growthRate: string;
  /** 외부 ID (YouTube video ID 등) */
  externalId?: string;
  /** 외부 URL */
  externalUrl?: string;
  /** 썸네일 URL */
  thumbnailUrl?: string;
  /** 상세 메트릭 (숫자) */
  metrics?: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
  };
}

// ============================================
// Script Guidelines (AI 생성 스크립트 가이드라인)
// ============================================

export interface ScriptGuidelines {
  /** 도입부 전략 */
  openingStrategy: string;
  /** 핵심 포인트 목록 */
  mainPoints: string[];
  /** CTA 전략 */
  ctaStrategy: string;
  /** 마무리 전략 */
  closingStrategy: string;
  /** 목표 영상 길이 */
  targetLength?: string;
  /** 핵심 메시지 */
  keyMessages?: string[];
  /** 피해야 할 주제 */
  avoidTopics?: string[];
}

// ============================================
// Trend Filter Options
// ============================================

export interface TrendFilterOptions {
  /** 지역 코드 (e.g., "KR", "US", "JP") */
  regionCode?: string;
  /** 언어 코드 (e.g., "ko", "en", "ja") */
  languageCode?: string;
  /** 카테고리 */
  category?: string;
  /** 최소 조회수 */
  minViews?: number;
  /** 최소 성장률 (%) */
  minGrowthRate?: number;
  /** 영상 길이 타입 */
  videoDuration?: "short" | "medium" | "long";
  /** 포함할 키워드 */
  keywords?: string[];
  /** 제외할 키워드 */
  excludeKeywords?: string[];
  /** 게시일 이후 필터 */
  publishedAfter?: Date;
  /** 소스 타입 */
  source?: "youtube_api" | "ai_generated" | "manual" | "saved";
}

// ============================================
// AI Project Generation Types
// ============================================

export interface AIProjectGenerationInput {
  trend: {
    title: string;
    category: string;
    tags: string[];
    views: string;
    growthRate: string;
    description?: string;
    externalUrl?: string;
  };
  options: {
    language: "ko" | "en";
    preferredTone?: string;
    videoLength?: string;
    targetAudienceHint?: string;
    customInstructions?: string;
  };
}

export interface AIProjectGenerationOutput {
  /** 최적화된 영상 제목 */
  title: string;
  /** 영상 설명 초안 */
  description: string;
  /** 오프닝 훅 목록 */
  hooks: string[];
  /** 상세 타겟 시청자 */
  targetAudience: string;
  /** 예상 조회수 범위 */
  estimatedViews: string;
  /** 스크립트 가이드라인 */
  scriptGuidelines: ScriptGuidelines;
  /** SEO 키워드 */
  keywords: string[];
  /** 추천 콘텐츠 톤 */
  suggestedTone: string;
  /** 제작 난이도 */
  suggestedDifficulty: "easy" | "medium" | "hard";
}

// ============================================
// YouTube Category Mapping
// ============================================

export const YOUTUBE_CATEGORIES: Record<string, string> = {
  "1": "Film & Animation",
  "2": "Autos & Vehicles",
  "10": "Music",
  "15": "Pets & Animals",
  "17": "Sports",
  "19": "Travel & Events",
  "20": "Gaming",
  "22": "People & Blogs",
  "23": "Comedy",
  "24": "Entertainment",
  "25": "News & Politics",
  "26": "Howto & Style",
  "27": "Education",
  "28": "Science & Technology",
  "29": "Nonprofits & Activism",
};

export const YOUTUBE_CATEGORIES_KO: Record<string, string> = {
  "1": "영화/애니메이션",
  "2": "자동차/교통",
  "10": "음악",
  "15": "반려동물/동물",
  "17": "스포츠",
  "19": "여행/이벤트",
  "20": "게임",
  "22": "인물/블로그",
  "23": "코미디",
  "24": "엔터테인먼트",
  "25": "뉴스/정치",
  "26": "노하우/스타일",
  "27": "교육",
  "28": "과학기술",
  "29": "비영리/사회운동",
};

// ============================================
// Region Options
// ============================================

export const REGION_OPTIONS = [
  { code: "KR", name: "한국", nameEn: "South Korea" },
  { code: "US", name: "미국", nameEn: "United States" },
  { code: "JP", name: "일본", nameEn: "Japan" },
  { code: "GB", name: "영국", nameEn: "United Kingdom" },
  { code: "DE", name: "독일", nameEn: "Germany" },
  { code: "FR", name: "프랑스", nameEn: "France" },
  { code: "CA", name: "캐나다", nameEn: "Canada" },
  { code: "AU", name: "호주", nameEn: "Australia" },
  { code: "IN", name: "인도", nameEn: "India" },
  { code: "BR", name: "브라질", nameEn: "Brazil" },
] as const;

export type RegionCode = (typeof REGION_OPTIONS)[number]["code"];
