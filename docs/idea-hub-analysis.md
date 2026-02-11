# 아이디어 허브 시스템 분석 및 고도화 제안

## 1. 현재 시스템 아키텍처

### 1.1 아이디어 허브 카드 생성 시점

| 구분 | 생성 시점 | 저장 위치 | 상태 |
|------|----------|----------|------|
| **Top 아이디어 추천 (AI Recommendations)** | 앱 로드 시 Mock 데이터 로드 | 메모리 (미저장) | 임시 |
| **트렌드 기반 생성 아이디어** | 사용자가 "아이디어 생성" 클릭 시 | 메모리 → DB 선택적 저장 | 영구 저장 가능 |
| **저장된 아이디어** | 사용자가 "저장" 클릭 시 | PostgreSQL `saved_idea` 테이블 | 영구 |

### 1.2 데이터 흐름도

```
┌─────────────────────────────────────────────────────────────────────┐
│                        아이디어 허브 데이터 흐름                        │
└─────────────────────────────────────────────────────────────────────┘

1. TOP 아이디어 추천 (현재: Mock 데이터)
   ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
   │ 앱 로드       │───▶│ getAIRecommend  │───▶│ AI_RECOMMENDATIONS│
   │ (Dashboard)  │    │ ations()        │    │ (Mock Array)     │
   └──────────────┘    └─────────────────┘    └──────────────────┘
                                                      │
                                                      ▼
                                              ┌──────────────────┐
                                              │ TrendAnalyzer    │
                                              │ 컴포넌트에 표시    │
                                              └──────────────────┘

2. 트렌드 기반 아이디어 생성 (Template 기반)
   ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
   │ 트렌드 선택   │───▶│ IdeaGenerator   │───▶│ POST             │
   │ + 옵션 설정   │    │ Dialog          │    │ /api/generate-   │
   └──────────────┘    └─────────────────┘    │ ideas            │
                                              └────────┬─────────┘
                                                       │
                                                       ▼
                              ┌─────────────────────────────────────┐
                              │ generateIdeasFromTrend()            │
                              │ - 언어별 템플릿 선택 (KO/EN)          │
                              │ - 톤/스타일별 문구 매핑               │
                              │ - 비디오 타입별 예상 조회수 계산       │
                              │ - TODO: OpenAI API 연동 예정         │
                              └─────────────────────────────────────┘

3. 아이디어 저장 흐름
   ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
   │ "저장" 클릭   │───▶│ POST            │───▶│ saveIdea()       │
   │              │    │ /api/saved-ideas│    │                  │
   └──────────────┘    └─────────────────┘    └────────┬─────────┘
                                                       │
                                                       ▼
                                              ┌──────────────────┐
                                              │ PostgreSQL       │
                                              │ saved_idea 테이블 │
                                              └──────────────────┘
```

---

## 2. Top 아이디어 추천 기준 분석

### 2.1 현재 구현 상태

**파일**: `app/common/mocks/project-mock.ts` (lines 344-384)

```typescript
// 현재: 정적 Mock 데이터 (3개 고정)
export const AI_RECOMMENDATIONS = [
  {
    title: "Day in the Life: AI Engineer",
    reason: "Matches your tech audience",  // 추천 이유
    growth: "+210%",                        // 성장률
    description: "...",
    hooks: [...],
    targetAudience: "개발자 지망생, IT 취준생",
    estimatedViews: "50K-100K",
  },
  // ... 2개 더
];
```

### 2.2 추천 기준 (계획된 구조)

**DB 테이블**: `ai_recommendation` (현재 미사용)

| 필드 | 타입 | 설명 | 추천 로직에서의 역할 |
|------|------|------|-------------------|
| `score` | integer (0-100) | 추천 점수 | 정렬 기준 |
| `growthRate` | text | 성장률 | 트렌드 반영 |
| `category` | text | 카테고리 | 사용자 관심사 매칭 |
| `reason` | text | 추천 이유 | UI 표시용 |
| `expiresAt` | timestamp | 만료 시간 | 신선도 관리 |

### 2.3 현재 추천 로직의 한계

1. **정적 데이터**: 3개의 고정된 추천 항목만 존재
2. **개인화 부재**: 사용자별 맞춤 추천 없음
3. **실시간 반영 불가**: 트렌드 변화와 무관
4. **AI 미연동**: LLM 기반 추천 미구현

---

## 3. 아이디어 생성 로직 분석

### 3.1 현재 템플릿 기반 생성

**파일**: `app/common/data/ideation.data.server.ts`

```typescript
// 템플릿 선택 로직
const IDEA_TEMPLATES_KO = {
  informative: [
    "{trend}의 모든 것: 완벽 가이드",
    "{trend} 마스터하기: 초보자를 위한 핵심 정리"
  ],
  funny: [
    "{trend} 도전! 웃음 폭발 리액션",
    "{trend}로 하루 종일 버티기 (실패 확정)"
  ],
  // ... 5개 톤 × 2개 템플릿 = 10개
};

// 예상 조회수 매핑
const ESTIMATED_VIEWS = {
  short: { easy: "100K-500K", medium: "50K-200K", hard: "20K-100K" },
  medium: { easy: "200K-800K", medium: "100K-400K", hard: "80K-200K" },
  long: { easy: "150K-600K", medium: "80K-300K", hard: "100K-300K" }
};
```

### 3.2 생성 파라미터

| 파라미터 | 옵션 | 영향 |
|---------|------|------|
| `language` | ko, en | 템플릿 언어 선택 |
| `contentTone` | informative, funny, dramatic, casual, professional | 템플릿 스타일 |
| `videoType` | short, medium, long | 예상 조회수, 난이도 |
| `targetAudienceType` | general, young, adult, mature, niche | 타겟 설명 |
| `ideaCount` | 1-5 | 생성 개수 |
| `customPrompt` | 자유 입력 | 미반영 (TODO) |

### 3.3 생성 프로세스 시간

```
현재: 1500ms 고정 딜레이 (시뮬레이션)
└── 실제 LLM 연동 시: 2-5초 예상
```

---

## 4. 고도화 제안

### 4.1 추천 전략 고도화

#### Phase 1: 규칙 기반 개인화 (단기)

```typescript
// 제안: 사용자 행동 기반 점수 계산
interface RecommendationScore {
  trendMatch: number;      // 0-30: 실시간 트렌드 매칭
  categoryAffinity: number; // 0-25: 사용자 선호 카테고리
  engagementPotential: number; // 0-25: 예상 참여도
  freshness: number;        // 0-20: 신선도 (최근 등장)
}

function calculateRecommendationScore(
  trend: TrendItem,
  userHistory: UserHistory
): number {
  const scores: RecommendationScore = {
    trendMatch: trend.growth.includes('+')
      ? parseInt(trend.growth) / 10
      : 0,
    categoryAffinity: userHistory.preferredCategories
      .includes(trend.category) ? 25 : 10,
    engagementPotential: estimateEngagement(trend.views),
    freshness: calculateFreshness(trend.createdAt),
  };

  return Object.values(scores).reduce((a, b) => a + b, 0);
}
```

#### Phase 2: 협업 필터링 (중기)

```
사용자 A가 저장한 아이디어 → 비슷한 사용자 B의 아이디어 추천
                           ↓
                    "이런 아이디어를 저장한 사용자들이
                     함께 저장한 아이디어"
```

#### Phase 3: LLM 기반 추천 (장기)

```typescript
// 제안: Claude API를 활용한 개인화 추천
async function getAIRecommendations(
  userId: string,
  trends: TrendItem[],
  userHistory: UserHistory
): Promise<AIRecommendation[]> {
  const prompt = `
    다음 정보를 기반으로 유튜브 콘텐츠 아이디어 3개를 추천해주세요:

    현재 트렌드:
    ${trends.map(t => `- ${t.title} (${t.category}, ${t.growth})`).join('\n')}

    사용자 선호 카테고리: ${userHistory.preferredCategories.join(', ')}
    최근 저장한 아이디어: ${userHistory.recentIdeas.map(i => i.title).join(', ')}
    채널 특성: ${userHistory.channelDescription}

    각 추천에 대해 JSON 형식으로 응답해주세요:
    { title, reason, growth, description, hooks, targetAudience, estimatedViews }
  `;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    messages: [{ role: "user", content: prompt }],
  });

  return parseRecommendations(response);
}
```

### 4.2 생성 흐름 고도화

#### 4.2.1 실시간 트렌드 연동 강화

```typescript
// 제안: YouTube 트렌드와 아이디어 자동 매칭
interface EnhancedTrendItem extends TrendItem {
  relatedIdeas?: GeneratedIdea[];  // 사전 생성된 관련 아이디어
  competitorVideos?: CompetitorVideo[]; // 경쟁 영상 분석
  optimalPostingTime?: string;     // 최적 업로드 시간
}

// 트렌드 캐시 시 아이디어도 함께 생성
async function cacheTrendsWithIdeas(): Promise<void> {
  const trends = await fetchYouTubeTrends();

  for (const trend of trends) {
    // 각 트렌드에 대해 미리 아이디어 3개 생성
    const ideas = await generateIdeasFromTrend({
      trendTitle: trend.title,
      trendCategory: trend.category,
      options: { ideaCount: 3, language: 'ko' }
    });

    await cacheWithIdeas(trend, ideas);
  }
}
```

#### 4.2.2 컨텍스트 인식 생성

```typescript
// 제안: 사용자 채널 정보 반영
interface ContextAwareGenerationRequest extends GenerateIdeasRequest {
  channelContext?: {
    name: string;
    category: string;
    avgViews: number;
    subscriberCount: number;
    topVideos: string[];  // 인기 영상 제목들
  };
  previousIdeas?: SavedIdea[]; // 이전에 저장한 아이디어
}

// 채널 특성을 반영한 아이디어 생성
async function generateContextAwareIdeas(
  request: ContextAwareGenerationRequest
): Promise<GeneratedIdea[]> {
  // 채널의 성공 패턴 분석
  const patterns = analyzeSuccessPatterns(request.channelContext?.topVideos);

  // 기존 아이디어와 중복 방지
  const existingTitles = new Set(
    request.previousIdeas?.map(i => i.title) || []
  );

  // LLM에 컨텍스트 전달
  const ideas = await generateWithLLM({
    ...request,
    additionalContext: {
      successPatterns: patterns,
      avoidTitles: Array.from(existingTitles),
      channelTone: request.channelContext?.category,
    }
  });

  return ideas;
}
```

#### 4.2.3 A/B 테스트 지원

```typescript
// 제안: 여러 버전의 아이디어 생성
interface IdeaVariant {
  id: string;
  ideaId: string;
  variant: 'A' | 'B' | 'C';
  title: string;
  hooks: string[];
  confidence: number;  // AI 신뢰도
}

async function generateIdeaVariants(
  baseIdea: GeneratedIdea
): Promise<IdeaVariant[]> {
  return [
    {
      id: crypto.randomUUID(),
      ideaId: baseIdea.id,
      variant: 'A',
      title: baseIdea.title,
      hooks: baseIdea.hooks,
      confidence: 0.85,
    },
    {
      id: crypto.randomUUID(),
      ideaId: baseIdea.id,
      variant: 'B',
      title: await rewriteTitle(baseIdea.title, 'curiosity'),
      hooks: await generateAlternativeHooks(baseIdea, 'question'),
      confidence: 0.78,
    },
    {
      id: crypto.randomUUID(),
      ideaId: baseIdea.id,
      variant: 'C',
      title: await rewriteTitle(baseIdea.title, 'urgency'),
      hooks: await generateAlternativeHooks(baseIdea, 'statement'),
      confidence: 0.72,
    },
  ];
}
```

### 4.3 데이터 수집 및 피드백 루프

#### 4.3.1 아이디어 성과 추적

```typescript
// 제안: 저장된 아이디어의 실제 성과 추적
interface IdeaPerformance {
  ideaId: string;
  projectId?: string;
  publishedVideoId?: string;

  // 성과 지표
  actualViews?: number;
  estimatedViews: string;
  viewAccuracy?: number;  // 예측 정확도

  // 참여 지표
  likeRatio?: number;
  commentCount?: number;
  watchTime?: number;

  // 사용자 피드백
  userRating?: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
}

// 성과 데이터로 추천 알고리즘 개선
async function improveRecommendations(
  performances: IdeaPerformance[]
): Promise<void> {
  const successfulIdeas = performances.filter(p =>
    p.actualViews && p.actualViews > parseViewRange(p.estimatedViews).max
  );

  // 성공 패턴 학습
  await updateRecommendationModel(successfulIdeas);
}
```

#### 4.3.2 사용자 선호도 학습

```typescript
// 제안: 암묵적/명시적 피드백 수집
interface UserPreference {
  userId: string;

  // 명시적 신호
  savedCategories: string[];
  preferredTones: ContentTone[];

  // 암묵적 신호
  viewedNotSaved: string[];     // 본 후 저장 안함
  quickSaves: string[];          // 빠르게 저장 (관심 높음)
  editedBeforeSave: string[];    // 편집 후 저장
  usedIdeas: string[];           // 실제 사용한 아이디어
}

function calculatePreferenceWeight(
  category: string,
  prefs: UserPreference
): number {
  let weight = 0;

  if (prefs.savedCategories.includes(category)) weight += 30;
  if (prefs.usedIdeas.some(id => getCategory(id) === category)) weight += 40;
  if (prefs.quickSaves.some(id => getCategory(id) === category)) weight += 20;
  if (prefs.viewedNotSaved.some(id => getCategory(id) === category)) weight -= 10;

  return Math.max(0, Math.min(100, weight));
}
```

---

## 5. 구현 로드맵

### Phase 1: 기반 구축 (1-2주)

| 작업 | 우선순위 | 예상 공수 |
|------|---------|----------|
| 사용자 행동 로깅 테이블 추가 | 높음 | 1일 |
| 아이디어 저장 시 카테고리 태깅 | 높음 | 0.5일 |
| 기본 점수 계산 로직 구현 | 높음 | 1일 |
| AI 추천 테이블 활성화 | 중간 | 0.5일 |

### Phase 2: 개인화 (2-3주)

| 작업 | 우선순위 | 예상 공수 |
|------|---------|----------|
| 사용자 선호도 분석 모듈 | 높음 | 2일 |
| 규칙 기반 추천 알고리즘 | 높음 | 2일 |
| 트렌드-아이디어 자동 매칭 | 중간 | 1.5일 |
| 추천 다양성 보장 로직 | 중간 | 1일 |

### Phase 3: AI 연동 (3-4주)

| 작업 | 우선순위 | 예상 공수 |
|------|---------|----------|
| Claude API 연동 | 높음 | 2일 |
| 프롬프트 엔지니어링 | 높음 | 3일 |
| 컨텍스트 인식 생성 | 중간 | 2일 |
| 스트리밍 응답 처리 | 낮음 | 1일 |

### Phase 4: 피드백 루프 (4-5주)

| 작업 | 우선순위 | 예상 공수 |
|------|---------|----------|
| 성과 추적 테이블 추가 | 중간 | 1일 |
| YouTube Analytics 연동 | 낮음 | 3일 |
| 추천 정확도 대시보드 | 낮음 | 2일 |
| 모델 재학습 파이프라인 | 낮음 | 2일 |

---

## 6. 기대 효과

### 6.1 정량적 지표

| 지표 | 현재 | 목표 (Phase 3 완료 후) |
|------|------|----------------------|
| 아이디어 저장률 | 측정 불가 | 40%+ |
| 저장→사용 전환율 | 측정 불가 | 25%+ |
| 추천 클릭률 | 측정 불가 | 15%+ |
| 예상 조회수 정확도 | N/A | 70%+ (±30% 범위) |

### 6.2 정성적 개선

- **사용자 경험**: 개인화된 추천으로 아이디어 발굴 시간 단축
- **콘텐츠 품질**: AI 기반 훅/제목 생성으로 퀄리티 향상
- **데이터 기반 의사결정**: 성과 추적으로 콘텐츠 전략 최적화
- **플랫폼 차별화**: 타 도구 대비 스마트한 아이디어 추천

---

## 7. 결론

현재 아이디어 허브는 **템플릿 기반의 정적 시스템**으로 운영되고 있습니다.

핵심 개선 방향:
1. **Mock → 실시간**: AI 추천을 정적 데이터에서 동적 계산으로 전환
2. **일반 → 개인화**: 사용자 행동 기반 맞춤 추천 도입
3. **템플릿 → LLM**: Claude API 연동으로 자연스러운 아이디어 생성
4. **단방향 → 피드백 루프**: 성과 데이터 수집 및 알고리즘 개선

이를 통해 단순 아이디어 저장소에서 **AI 기반 콘텐츠 전략 파트너**로 발전할 수 있습니다.
