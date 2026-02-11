# 트렌드-프로젝트 통합 구현 계획

> 단계별 구현 계획 및 AI 검증 프로세스

## 구현 단계 개요

```
┌─────────────────────────────────────────────────────────────────┐
│  Phase 1: 스키마 개선 (DB 레벨)                                   │
│  - basedOnTrendId UUID 마이그레이션                              │
│  - trendSnapshot 컬럼 추가                                       │
│  - 트렌드 필터링 필드 추가                                        │
├─────────────────────────────────────────────────────────────────┤
│  Phase 2: 트렌드 필터링 고도화                                    │
│  - YouTube API 파라미터 확장                                     │
│  - 필터 UI 구현                                                  │
│  - 하이브리드 소스 (API + 저장된 트렌드)                           │
├─────────────────────────────────────────────────────────────────┤
│  Phase 3: AI 컨텍스트 생성 (검증 가능)                            │
│  - 프롬프트 미리보기 및 수정                                       │
│  - AI 응답 검토/편집 UI                                          │
│  - 단계별 승인 프로세스                                           │
├─────────────────────────────────────────────────────────────────┤
│  Phase 4: Studio 연동                                           │
│  - 프로젝트 컨텍스트 → 스크립트 AI 전달                           │
│  - 트렌드 정보 활용 강화                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: 스키마 개선

### 1.1 마이그레이션 파일 생성

**파일**: `app/drizzle/migrations/XXXX_trend_project_relation.sql`

```sql
-- 1. trends 테이블 확장
ALTER TABLE tubegai.trend
ADD COLUMN IF NOT EXISTS region_code TEXT DEFAULT 'KR',
ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'ko',
ADD COLUMN IF NOT EXISTS video_duration TEXT,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_saved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS saved_by_user_id UUID REFERENCES tubegai.user(id),
ADD COLUMN IF NOT EXISTS saved_at TIMESTAMP;

-- 2. projects 테이블: basedOnTrendId를 UUID로 변경
-- 먼저 기존 컬럼 백업 (데이터 마이그레이션 필요 시)
ALTER TABLE tubegai.project
ADD COLUMN IF NOT EXISTS based_on_trend_uuid UUID REFERENCES tubegai.trend(id) ON DELETE SET NULL;

-- 3. trendSnapshot JSONB 컬럼 추가
ALTER TABLE tubegai.project
ADD COLUMN IF NOT EXISTS trend_snapshot JSONB;

-- 4. scriptGuidelines 구조화 컬럼 추가
ALTER TABLE tubegai.project
ADD COLUMN IF NOT EXISTS script_guidelines JSONB;
```

### 1.2 스키마 파일 수정

**파일**: `app/features/trend/trend-schema.ts`

```typescript
// 추가할 컬럼
regionCode: text('region_code').default('KR'),
languageCode: text('language_code').default('ko'),
videoDuration: text('video_duration'), // 'short' | 'medium' | 'long'
usageCount: integer('usage_count').default(0),
lastUsedAt: timestamp('last_used_at'),
isSaved: boolean('is_saved').default(false),
savedByUserId: uuid('saved_by_user_id').references(() => users.id),
savedAt: timestamp('saved_at'),
```

**파일**: `app/features/project/project-schema.ts`

```typescript
// 변경/추가할 컬럼
basedOnTrendUuid: uuid('based_on_trend_uuid')
  .references(() => trends.id, { onDelete: 'set null' }),
trendSnapshot: jsonb('trend_snapshot').$type<TrendSnapshot>(),
scriptGuidelines: jsonb('script_guidelines').$type<ScriptGuidelines>(),
```

### 1.3 타입 정의

**파일**: `app/common/types/trend.types.ts` (신규)

```typescript
export interface TrendSnapshot {
  capturedAt: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  viewsCount: string;
  growthRate: string;
  externalId?: string;
  externalUrl?: string;
  thumbnailUrl?: string;
  metrics?: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
  };
}

export interface ScriptGuidelines {
  openingStrategy: string;
  mainPoints: string[];
  ctaStrategy: string;
  closingStrategy: string;
  targetLength?: string;
  keyMessages?: string[];
  avoidTopics?: string[];
}

export interface TrendFilterOptions {
  regionCode?: string;
  languageCode?: string;
  category?: string;
  minViews?: number;
  minGrowthRate?: number;
  videoDuration?: 'short' | 'medium' | 'long';
  keywords?: string[];
  excludeKeywords?: string[];
  publishedAfter?: Date;
  source?: 'youtube_api' | 'ai_generated' | 'manual' | 'saved';
}
```

### 1.4 체크리스트

- [ ] 마이그레이션 파일 생성
- [ ] `npm run db:generate` 실행
- [ ] `npm run db:migrate` 실행
- [ ] 스키마 타입 업데이트
- [ ] 기존 데이터 마이그레이션 (필요 시)

---

## Phase 2: 트렌드 필터링 고도화

### 2.1 YouTube API 확장

**파일**: `app/common/data/youtube.data.server.ts`

```typescript
// 기존 함수 시그니처 변경
export async function getYouTubeTrends(
  filters: TrendFilterOptions = { regionCode: 'KR' }
): Promise<TrendItem[]>

// 필터 적용 로직 추가
function applyFilters(trends: TrendItem[], filters: TrendFilterOptions): TrendItem[] {
  return trends.filter(trend => {
    // 카테고리 필터
    if (filters.category && trend.category !== filters.category) return false;

    // 조회수 필터
    if (filters.minViews) {
      const views = parseViewCount(trend.views);
      if (views < filters.minViews) return false;
    }

    // 키워드 필터 (포함)
    if (filters.keywords?.length) {
      const hasKeyword = filters.keywords.some(kw =>
        trend.title.toLowerCase().includes(kw.toLowerCase()) ||
        trend.tags?.some(tag => tag.toLowerCase().includes(kw.toLowerCase()))
      );
      if (!hasKeyword) return false;
    }

    // 키워드 필터 (제외)
    if (filters.excludeKeywords?.length) {
      const hasExcluded = filters.excludeKeywords.some(kw =>
        trend.title.toLowerCase().includes(kw.toLowerCase())
      );
      if (hasExcluded) return false;
    }

    return true;
  });
}
```

### 2.2 트렌드 필터 UI 컴포넌트

**파일**: `app/features/project/components/trend-filter.tsx` (신규)

```typescript
interface TrendFilterProps {
  filters: TrendFilterOptions;
  onFiltersChange: (filters: TrendFilterOptions) => void;
  onApply: () => void;
}

export function TrendFilter({ filters, onFiltersChange, onApply }: TrendFilterProps) {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 지역 선택 */}
          <Select value={filters.regionCode} onValueChange={...}>
            <SelectItem value="KR">한국</SelectItem>
            <SelectItem value="US">미국</SelectItem>
            <SelectItem value="JP">일본</SelectItem>
          </Select>

          {/* 카테고리 선택 */}
          <Select value={filters.category} onValueChange={...}>
            <SelectItem value="">전체</SelectItem>
            <SelectItem value="gaming">게임</SelectItem>
            <SelectItem value="entertainment">엔터테인먼트</SelectItem>
            ...
          </Select>

          {/* 최소 조회수 */}
          <Input
            type="number"
            placeholder="최소 조회수"
            value={filters.minViews}
            onChange={...}
          />

          {/* 키워드 */}
          <Input
            placeholder="키워드 (콤마 구분)"
            value={filters.keywords?.join(', ')}
            onChange={...}
          />
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={onApply}>필터 적용</Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 2.3 하이브리드 소스 함수

**파일**: `app/common/data/youtube.data.server.ts`

```typescript
export async function getTrendsHybrid(
  userId: string,
  filters: TrendFilterOptions
): Promise<{
  youtube: TrendItem[];
  saved: TrendItem[];
  recommended: TrendItem[];
}> {
  const [youtubeTrends, savedTrends, recommendations] = await Promise.all([
    // YouTube API (실시간)
    getYouTubeTrends(filters),

    // 저장된 트렌드 (Supabase)
    getSavedTrends(userId, filters),

    // AI 추천 (캐시)
    getAIRecommendationsForUser(userId, [], { count: 5 }),
  ]);

  return {
    youtube: youtubeTrends,
    saved: savedTrends,
    recommended: recommendations.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      views: r.estimatedViews,
      // ...
    })),
  };
}
```

### 2.4 체크리스트

- [ ] `getYouTubeTrends` 함수 필터 파라미터 추가
- [ ] `applyFilters` 필터링 로직 구현
- [ ] `TrendFilter` UI 컴포넌트 생성
- [ ] `trends-tab-page.tsx`에 필터 UI 통합
- [ ] 저장된 트렌드 조회 함수 구현
- [ ] 하이브리드 소스 통합

---

## Phase 3: AI 컨텍스트 생성 (검증 가능)

### 3.1 AI 생성 워크플로우 설계

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: 트렌드 선택                                              │
│  - 사용자가 트렌드 선택                                           │
│  - "AI로 프로젝트 생성" 버튼 클릭                                  │
├─────────────────────────────────────────────────────────────────┤
│  Step 2: 프롬프트 미리보기 (검증 포인트 1)                         │
│  - AI에 전달될 프롬프트 표시                                       │
│  - 사용자가 추가 지시사항 입력 가능                                 │
│  - "생성 시작" 버튼으로 진행                                       │
├─────────────────────────────────────────────────────────────────┤
│  Step 3: AI 응답 검토 (검증 포인트 2)                              │
│  - 생성된 결과 미리보기                                           │
│  - 각 항목별 수정 가능                                            │
│  - "재생성" 또는 "적용" 선택                                       │
├─────────────────────────────────────────────────────────────────┤
│  Step 4: 프로젝트 생성 확인 (검증 포인트 3)                        │
│  - 최종 프로젝트 정보 확인                                         │
│  - 추가 수정 후 "프로젝트 만들기"                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 AI 프롬프트 빌더

**파일**: `app/lib/ai-project-generator.server.ts` (신규)

```typescript
import Anthropic from "@anthropic-ai/sdk";

// 프롬프트 템플릿 - 사용자가 검토 가능
export const PROJECT_GENERATION_PROMPT_TEMPLATE = `
당신은 유튜브 콘텐츠 전략가입니다.
주어진 트렌드 정보를 분석하여 프로젝트 컨텍스트를 생성합니다.

## 트렌드 정보
- 제목: {{trendTitle}}
- 카테고리: {{trendCategory}}
- 태그: {{trendTags}}
- 조회수: {{trendViews}}
- 성장률: {{trendGrowth}}

## 사용자 설정
- 언어: {{language}}
- 선호 톤: {{preferredTone}}
- 영상 길이: {{videoLength}}
- 타겟 시청자: {{targetAudienceHint}}

## 추가 지시사항
{{customInstructions}}

## 생성 요청
다음 항목들을 JSON 형식으로 생성해주세요:

1. title: 최적화된 영상 제목 (검색 친화적, 50자 이내)
2. description: 영상 설명 초안 (150자 이내)
3. hooks: 오프닝 훅 3개 (배열)
4. targetAudience: 상세 타겟 시청자 설명
5. estimatedViews: 예상 조회수 범위
6. scriptGuidelines:
   - openingStrategy: 도입부 전략
   - mainPoints: 핵심 포인트 3-5개 (배열)
   - ctaStrategy: CTA 전략
   - closingStrategy: 마무리 전략
7. keywords: SEO 키워드 5-7개 (배열)
8. suggestedTone: 추천 콘텐츠 톤
9. suggestedDifficulty: 제작 난이도 (easy/medium/hard)
`;

export interface AIProjectGenerationInput {
  trend: {
    title: string;
    category: string;
    tags: string[];
    views: string;
    growthRate: string;
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
  title: string;
  description: string;
  hooks: string[];
  targetAudience: string;
  estimatedViews: string;
  scriptGuidelines: ScriptGuidelines;
  keywords: string[];
  suggestedTone: string;
  suggestedDifficulty: "easy" | "medium" | "hard";
}

// 프롬프트 빌드 함수 (검증용 노출)
export function buildProjectGenerationPrompt(
  input: AIProjectGenerationInput
): string {
  let prompt = PROJECT_GENERATION_PROMPT_TEMPLATE;

  prompt = prompt.replace("{{trendTitle}}", input.trend.title);
  prompt = prompt.replace("{{trendCategory}}", input.trend.category);
  prompt = prompt.replace("{{trendTags}}", input.trend.tags.join(", "));
  prompt = prompt.replace("{{trendViews}}", input.trend.views);
  prompt = prompt.replace("{{trendGrowth}}", input.trend.growthRate);
  prompt = prompt.replace("{{language}}", input.options.language === "ko" ? "한국어" : "English");
  prompt = prompt.replace("{{preferredTone}}", input.options.preferredTone || "자동 선택");
  prompt = prompt.replace("{{videoLength}}", input.options.videoLength || "자동 선택");
  prompt = prompt.replace("{{targetAudienceHint}}", input.options.targetAudienceHint || "일반 시청자");
  prompt = prompt.replace("{{customInstructions}}", input.options.customInstructions || "없음");

  return prompt;
}

// AI 호출 함수
export async function generateProjectContext(
  input: AIProjectGenerationInput
): Promise<AIProjectGenerationOutput> {
  const anthropic = new Anthropic();
  const prompt = buildProjectGenerationPrompt(input);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // 응답 파싱
  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  // JSON 추출 및 파싱
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  return JSON.parse(jsonMatch[0]) as AIProjectGenerationOutput;
}
```

### 3.3 API 엔드포인트

**파일**: `app/features/project/api/generate-project-context.ts` (신규)

```typescript
import type { Route } from "./+types/generate-project-context";
import { requireAuth } from "~/lib/auth.server";
import {
  buildProjectGenerationPrompt,
  generateProjectContext,
  type AIProjectGenerationInput,
} from "~/lib/ai-project-generator.server";

// GET: 프롬프트 미리보기 (검증 포인트 1)
export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);

  const url = new URL(request.url);
  const trendData = url.searchParams.get("trend");
  const optionsData = url.searchParams.get("options");

  if (!trendData) {
    return { error: "Trend data required" };
  }

  const input: AIProjectGenerationInput = {
    trend: JSON.parse(trendData),
    options: optionsData ? JSON.parse(optionsData) : { language: "ko" },
  };

  // 프롬프트만 반환 (AI 호출 없음)
  const prompt = buildProjectGenerationPrompt(input);

  return {
    prompt,
    input,
    estimatedTokens: Math.ceil(prompt.length / 4), // 대략적인 토큰 수
  };
}

// POST: AI 생성 실행 (검증 포인트 2로 결과 반환)
export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);

  const formData = await request.formData();
  const inputJson = formData.get("input") as string;
  const customPrompt = formData.get("customPrompt") as string;

  if (!inputJson) {
    return { error: "Input data required" };
  }

  const input: AIProjectGenerationInput = JSON.parse(inputJson);

  // 사용자 추가 지시사항 반영
  if (customPrompt) {
    input.options.customInstructions = customPrompt;
  }

  try {
    const result = await generateProjectContext(input);

    return {
      success: true,
      result,
      // 원본 입력도 함께 반환 (재생성 시 사용)
      input,
    };
  } catch (error) {
    console.error("AI generation failed:", error);
    return {
      error: "AI 생성에 실패했습니다. 다시 시도해주세요.",
    };
  }
}
```

### 3.4 AI 생성 다이얼로그 컴포넌트

**파일**: `app/features/project/components/ai-project-generator-dialog.tsx` (신규)

```typescript
import { useState } from "react";
import { useFetcher } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/common/components/ui/dialog";
import { Button } from "~/common/components/ui/button";
import { Textarea } from "~/common/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Loader2, Eye, Edit, RefreshCw, Check, Sparkles } from "lucide-react";

type Step = "preview" | "generating" | "review" | "editing";

interface AIProjectGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trend: TrendItem;
  onApply: (result: AIProjectGenerationOutput) => void;
}

export function AIProjectGeneratorDialog({
  open,
  onOpenChange,
  trend,
  onApply,
}: AIProjectGeneratorDialogProps) {
  const [step, setStep] = useState<Step>("preview");
  const [customInstructions, setCustomInstructions] = useState("");
  const [result, setResult] = useState<AIProjectGenerationOutput | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  const previewFetcher = useFetcher();
  const generateFetcher = useFetcher();

  // Step 1: 프롬프트 미리보기 로드
  const loadPromptPreview = () => {
    const params = new URLSearchParams({
      trend: JSON.stringify({
        title: trend.title,
        category: trend.category,
        tags: trend.tags || [],
        views: trend.views,
        growthRate: trend.growth,
      }),
      options: JSON.stringify({
        language: "ko",
        customInstructions,
      }),
    });

    previewFetcher.load(`/api/generate-project-context?${params}`);
  };

  // Step 2: AI 생성 실행
  const executeGeneration = () => {
    setStep("generating");

    const formData = new FormData();
    formData.append("input", JSON.stringify({
      trend: {
        title: trend.title,
        category: trend.category,
        tags: trend.tags || [],
        views: trend.views,
        growthRate: trend.growth,
      },
      options: {
        language: "ko",
        customInstructions,
      },
    }));

    generateFetcher.submit(formData, {
      method: "post",
      action: "/api/generate-project-context",
    });
  };

  // 생성 완료 시 결과 설정
  useEffect(() => {
    if (generateFetcher.data?.success) {
      setResult(generateFetcher.data.result);
      setStep("review");
    }
  }, [generateFetcher.data]);

  // 필드 수정
  const updateField = (field: string, value: any) => {
    if (result) {
      setResult({ ...result, [field]: value });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI 프로젝트 컨텍스트 생성
          </DialogTitle>
          <DialogDescription>
            트렌드 "{trend.title}" 기반으로 프로젝트 정보를 생성합니다
          </DialogDescription>
        </DialogHeader>

        {/* 진행 단계 표시 */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={step === "preview" ? "default" : "outline"}>
            1. 프롬프트 확인
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant={step === "generating" ? "default" : "outline"}>
            2. AI 생성
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant={step === "review" || step === "editing" ? "default" : "outline"}>
            3. 결과 검토
          </Badge>
        </div>

        {/* Step 1: 프롬프트 미리보기 */}
        {step === "preview" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AI에 전달될 프롬프트</CardTitle>
              </CardHeader>
              <CardContent>
                {previewFetcher.data?.prompt ? (
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-60">
                    {previewFetcher.data.prompt}
                  </pre>
                ) : (
                  <Button onClick={loadPromptPreview} variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    프롬프트 미리보기
                  </Button>
                )}
              </CardContent>
            </Card>

            <div>
              <label className="text-sm font-medium">추가 지시사항 (선택)</label>
              <Textarea
                placeholder="AI에게 추가로 전달할 지시사항을 입력하세요. 예: '유머러스한 톤으로', '초보자 대상으로' 등"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button onClick={executeGeneration}>
                <Sparkles className="h-4 w-4 mr-2" />
                AI 생성 시작
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: 생성 중 */}
        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-4" />
            <p className="text-muted-foreground">AI가 프로젝트 컨텍스트를 생성하고 있습니다...</p>
          </div>
        )}

        {/* Step 3: 결과 검토 */}
        {(step === "review" || step === "editing") && result && (
          <div className="space-y-4">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">개요</TabsTrigger>
                <TabsTrigger value="hooks">훅</TabsTrigger>
                <TabsTrigger value="guidelines">가이드라인</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* 제목 */}
                <EditableField
                  label="영상 제목"
                  value={result.title}
                  onChange={(v) => updateField("title", v)}
                  editing={editingField === "title"}
                  onEditToggle={() => setEditingField(editingField === "title" ? null : "title")}
                />

                {/* 설명 */}
                <EditableField
                  label="영상 설명"
                  value={result.description}
                  onChange={(v) => updateField("description", v)}
                  editing={editingField === "description"}
                  onEditToggle={() => setEditingField(editingField === "description" ? null : "description")}
                  multiline
                />

                {/* 타겟 시청자 */}
                <EditableField
                  label="타겟 시청자"
                  value={result.targetAudience}
                  onChange={(v) => updateField("targetAudience", v)}
                  editing={editingField === "targetAudience"}
                  onEditToggle={() => setEditingField(editingField === "targetAudience" ? null : "targetAudience")}
                />

                {/* 예상 조회수, 톤, 난이도 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">예상 조회수</p>
                    <p className="font-medium">{result.estimatedViews}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">추천 톤</p>
                    <p className="font-medium">{result.suggestedTone}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">제작 난이도</p>
                    <p className="font-medium">{result.suggestedDifficulty}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="hooks" className="space-y-4">
                <EditableListField
                  label="오프닝 훅"
                  values={result.hooks}
                  onChange={(v) => updateField("hooks", v)}
                />
              </TabsContent>

              <TabsContent value="guidelines" className="space-y-4">
                {/* 스크립트 가이드라인 */}
                <EditableField
                  label="도입부 전략"
                  value={result.scriptGuidelines.openingStrategy}
                  onChange={(v) => updateField("scriptGuidelines", {
                    ...result.scriptGuidelines,
                    openingStrategy: v,
                  })}
                  editing={editingField === "openingStrategy"}
                  onEditToggle={() => setEditingField(
                    editingField === "openingStrategy" ? null : "openingStrategy"
                  )}
                  multiline
                />

                <EditableListField
                  label="핵심 포인트"
                  values={result.scriptGuidelines.mainPoints}
                  onChange={(v) => updateField("scriptGuidelines", {
                    ...result.scriptGuidelines,
                    mainPoints: v,
                  })}
                />

                <EditableField
                  label="CTA 전략"
                  value={result.scriptGuidelines.ctaStrategy}
                  onChange={(v) => updateField("scriptGuidelines", {
                    ...result.scriptGuidelines,
                    ctaStrategy: v,
                  })}
                  editing={editingField === "ctaStrategy"}
                  onEditToggle={() => setEditingField(
                    editingField === "ctaStrategy" ? null : "ctaStrategy"
                  )}
                />

                <EditableField
                  label="마무리 전략"
                  value={result.scriptGuidelines.closingStrategy}
                  onChange={(v) => updateField("scriptGuidelines", {
                    ...result.scriptGuidelines,
                    closingStrategy: v,
                  })}
                  editing={editingField === "closingStrategy"}
                  onEditToggle={() => setEditingField(
                    editingField === "closingStrategy" ? null : "closingStrategy"
                  )}
                />
              </TabsContent>

              <TabsContent value="seo" className="space-y-4">
                <EditableListField
                  label="SEO 키워드"
                  values={result.keywords}
                  onChange={(v) => updateField("keywords", v)}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setStep("preview");
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                다시 생성
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  취소
                </Button>
                <Button onClick={() => onApply(result)}>
                  <Check className="h-4 w-4 mr-2" />
                  프로젝트에 적용
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// 헬퍼 컴포넌트: 편집 가능한 필드
function EditableField({
  label,
  value,
  onChange,
  editing,
  onEditToggle,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  editing: boolean;
  onEditToggle: () => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <Button variant="ghost" size="sm" onClick={onEditToggle}>
          <Edit className="h-3 w-3" />
        </Button>
      </div>
      {editing ? (
        multiline ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
          />
        ) : (
          <Input value={value} onChange={(e) => onChange(e.target.value)} />
        )
      ) : (
        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
          {value}
        </p>
      )}
    </div>
  );
}

// 헬퍼 컴포넌트: 편집 가능한 리스트 필드
function EditableListField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    if (newItem.trim()) {
      onChange([...values, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, value: string) => {
    const updated = [...values];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="space-y-2">
        {values.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            placeholder="새 항목 추가"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 3.5 체크리스트

- [ ] `ai-project-generator.server.ts` 구현
- [ ] `/api/generate-project-context` 엔드포인트 구현
- [ ] `AIProjectGeneratorDialog` 컴포넌트 구현
- [ ] `EditableField`, `EditableListField` 헬퍼 컴포넌트 구현
- [ ] `trends-tab-page.tsx`에 AI 생성 버튼 추가
- [ ] `new-project-page.tsx`에서 AI 결과 수신 및 적용
- [ ] 에러 핸들링 및 재시도 로직

---

## Phase 4: Studio 연동

### 4.1 프로젝트 컨텍스트 로더 개선

**파일**: `app/features/studio/pages/script-page.tsx` (기존 수정)

```typescript
// loader에서 프로젝트의 전체 컨텍스트 로드
export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  const projectId = params.projectId;

  const project = await getProjectById(projectId);

  if (!project || project.ownerId !== userId) {
    throw redirect("/projects");
  }

  // 트렌드 스냅샷 및 가이드라인 포함
  return {
    project: {
      ...project,
      trendSnapshot: project.trendSnapshot,
      scriptGuidelines: project.scriptGuidelines,
    },
  };
}
```

### 4.2 스크립트 AI 프롬프트 개선

**파일**: `app/lib/ai-script.server.ts` (기존 수정)

```typescript
interface ScriptGenerationContext {
  // 기본 정보
  title: string;
  description?: string;
  topic?: string;

  // AI 컨텍스트
  hooks?: string[];
  targetAudience?: string;
  contentTone?: string;
  videoLength?: string;

  // 트렌드 정보 (신규)
  trendSnapshot?: TrendSnapshot;

  // 스크립트 가이드라인 (신규)
  scriptGuidelines?: ScriptGuidelines;

  // 키워드
  keywords?: string[];
}

export function buildScriptPrompt(context: ScriptGenerationContext): string {
  const parts: string[] = [];

  // 기본 정보
  parts.push(`## 영상 정보`);
  parts.push(`- 제목: ${context.title}`);
  if (context.topic) parts.push(`- 주제: ${context.topic}`);
  if (context.contentTone) parts.push(`- 톤: ${context.contentTone}`);
  if (context.videoLength) parts.push(`- 길이: ${context.videoLength}`);

  // 트렌드 배경 (있는 경우)
  if (context.trendSnapshot) {
    parts.push(`\n## 트렌드 배경`);
    parts.push(`- 기반 트렌드: ${context.trendSnapshot.title}`);
    parts.push(`- 카테고리: ${context.trendSnapshot.category}`);
    parts.push(`- 현재 조회수: ${context.trendSnapshot.viewsCount}`);
    parts.push(`- 성장률: ${context.trendSnapshot.growthRate}`);
    if (context.trendSnapshot.tags?.length) {
      parts.push(`- 관련 태그: ${context.trendSnapshot.tags.join(", ")}`);
    }
  }

  // 타겟 시청자
  if (context.targetAudience) {
    parts.push(`\n## 타겟 시청자`);
    parts.push(context.targetAudience);
  }

  // 훅 (있는 경우)
  if (context.hooks?.length) {
    parts.push(`\n## 오프닝 훅 옵션`);
    context.hooks.forEach((hook, i) => {
      parts.push(`${i + 1}. ${hook}`);
    });
  }

  // 스크립트 가이드라인 (핵심!)
  if (context.scriptGuidelines) {
    parts.push(`\n## 스크립트 가이드라인`);
    parts.push(`- 도입부 전략: ${context.scriptGuidelines.openingStrategy}`);

    if (context.scriptGuidelines.mainPoints?.length) {
      parts.push(`- 핵심 포인트:`);
      context.scriptGuidelines.mainPoints.forEach((point, i) => {
        parts.push(`  ${i + 1}. ${point}`);
      });
    }

    parts.push(`- CTA 전략: ${context.scriptGuidelines.ctaStrategy}`);
    parts.push(`- 마무리 전략: ${context.scriptGuidelines.closingStrategy}`);
  }

  // 키워드
  if (context.keywords?.length) {
    parts.push(`\n## 포함할 키워드`);
    parts.push(context.keywords.join(", "));
  }

  // 최종 지시
  parts.push(`\n## 요청`);
  parts.push(`위 정보를 바탕으로 자연스러운 유튜브 스크립트를 작성해주세요.`);
  parts.push(`훅은 제공된 옵션 중 하나를 선택하거나 새로 만들어도 됩니다.`);
  parts.push(`가이드라인의 전략을 따르되, 자연스러운 흐름을 유지해주세요.`);

  return parts.join("\n");
}
```

### 4.3 체크리스트

- [ ] `script-page.tsx` loader에서 trendSnapshot, scriptGuidelines 포함
- [ ] `ai-script.server.ts` 프롬프트 빌더 개선
- [ ] 스크립트 에디터에서 컨텍스트 정보 표시 (참고용)
- [ ] 스크립트 재생성 시 컨텍스트 활용

---

## 테스트 시나리오

### 시나리오 1: 트렌드에서 프로젝트 생성

```
1. 트렌드 탭 방문
2. 트렌드 필터 적용 (예: 한국, 게임 카테고리)
3. 트렌드 선택 → "AI로 프로젝트 생성" 클릭
4. 프롬프트 미리보기 확인
5. 추가 지시사항 입력 (선택)
6. AI 생성 실행
7. 결과 검토 및 수정
8. 프로젝트에 적용
9. 프로젝트 생성 완료
10. Studio에서 스크립트 생성 시 컨텍스트 활용 확인
```

### 시나리오 2: 저장된 트렌드 활용

```
1. 트렌드 탭에서 트렌드 저장 (북마크)
2. 저장된 트렌드 탭에서 조회
3. 저장된 트렌드로 프로젝트 생성
4. 트렌드 스냅샷이 프로젝트에 저장됨 확인
```

---

## 파일 변경 목록

### 신규 파일

| 파일 | 설명 |
|------|------|
| `app/common/types/trend.types.ts` | 트렌드 관련 타입 정의 |
| `app/lib/ai-project-generator.server.ts` | AI 프로젝트 컨텍스트 생성 |
| `app/features/project/api/generate-project-context.ts` | API 엔드포인트 |
| `app/features/project/components/trend-filter.tsx` | 트렌드 필터 UI |
| `app/features/project/components/ai-project-generator-dialog.tsx` | AI 생성 다이얼로그 |
| `app/drizzle/migrations/XXXX_trend_project_relation.sql` | DB 마이그레이션 |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/features/trend/trend-schema.ts` | 필터링 필드 추가 |
| `app/features/project/project-schema.ts` | trendSnapshot, scriptGuidelines 추가 |
| `app/common/data/youtube.data.server.ts` | 필터링 로직 추가 |
| `app/common/data/project.data.server.ts` | 스냅샷 저장 로직 |
| `app/features/project/pages/trends-tab-page.tsx` | 필터 UI 및 AI 생성 버튼 |
| `app/features/project/pages/new-project-page.tsx` | AI 결과 수신 |
| `app/lib/ai-script.server.ts` | 컨텍스트 기반 프롬프트 |
| `app/routes.ts` | 신규 API 라우트 추가 |

---

## AI 검증 포인트 요약

| 단계 | 검증 내용 | 사용자 액션 |
|------|----------|-----------|
| **1. 프롬프트 미리보기** | AI에 전달될 전체 프롬프트 확인 | 추가 지시사항 입력, 수정 |
| **2. AI 응답 검토** | 생성된 결과 항목별 확인 | 개별 필드 수정, 재생성 |
| **3. 최종 확인** | 프로젝트에 적용될 값 확인 | 최종 수정 후 생성 |

이 구조를 통해 AI 생성 과정의 모든 단계에서 검토와 수정이 가능합니다.
