// =============================================================================
// AI Mock Fixtures
// =============================================================================
// Mock data for all AI service functions.
// Used when GEMINI_MOCK=true to bypass real API calls during development.

import type { AIGeneratedRecommendation } from "../recommendations.server";
import type { ScriptSegment } from "~/common/types/studio.types";
import type { AIProjectGenerationOutput } from "../project-generator.server";
import type { PreProductionOutput } from "../pre-production.server";
import type { VideoGenerationResult, VideoBufferResult } from "../video.server";
import type { MusicGenerationResult } from "../music.server";
import type { StoryboardScene } from "../storyboard.server";

// =============================================================================
// ai.server.ts - generateAIRecommendations
// =============================================================================

export const MOCK_RECOMMENDATIONS: AIGeneratedRecommendation[] = [
  {
    title: "AI 도구 10가지 완벽 비교 - 2025년 최신판",
    reason: "AI 트렌드 급상승",
    description:
      "ChatGPT, Claude, Gemini 등 주요 AI 도구들의 장단점을 실전 비교하며 어떤 상황에서 어떤 도구를 써야 하는지 정리합니다.",
    hooks: [
      '"이 AI 도구 하나면 월급이 2배가 됩니다"',
      '"99%가 모르는 AI 활용법, 지금 공개합니다"',
      '"AI 도구를 잘못 고르면 이렇게 됩니다"',
    ],
    targetAudience: "IT 종사자, 프리랜서, 대학생",
    estimatedViews: "50K-150K",
    difficulty: "medium",
    videoType: "medium",
    contentTone: "informative",
    growthRate: "+120%",
    score: 85,
    basedOnTrends: ["AI 도구", "생산성"],
    category: "과학기술",
  },
  {
    title: "직장인 퇴근 후 부업으로 월 200만원 버는 법",
    reason: "부업 관심 증가",
    description:
      "직장인이 퇴근 후 2시간만 투자해서 월 200만원을 벌 수 있는 현실적인 부업 아이디어 5가지를 공유합니다.",
    hooks: [
      '"퇴근 후 2시간이면 충분합니다"',
      '"이 부업은 아무도 안 알려줍니다"',
      '"월급 외에 200만원 더 버는 비밀"',
    ],
    targetAudience: "20-30대 직장인",
    estimatedViews: "100K-300K",
    difficulty: "easy",
    videoType: "medium",
    contentTone: "casual",
    growthRate: "+85%",
    score: 90,
    basedOnTrends: ["부업", "재테크"],
    category: "노하우/스타일",
  },
  {
    title: "요즘 MZ세대가 열광하는 취미 TOP 5",
    reason: "MZ 트렌드 화제",
    description:
      "MZ세대 사이에서 급부상하는 새로운 취미 5가지를 소개하고 각 취미의 시작 방법과 비용을 정리합니다.",
    hooks: [
      '"이 취미를 시작하면 인생이 바뀝니다"',
      '"MZ세대가 주말마다 하는 것"',
      '"돈 안 드는 취미인데 효과가 엄청납니다"',
    ],
    targetAudience: "20-30대 MZ세대",
    estimatedViews: "80K-200K",
    difficulty: "easy",
    videoType: "short",
    contentTone: "funny",
    growthRate: "+65%",
    score: 78,
    basedOnTrends: ["MZ세대", "취미"],
    category: "엔터테인먼트",
  },
];

// =============================================================================
// ai-trendtube.server.ts - extractYouTubeTrends
// =============================================================================

export const MOCK_EXTRACTED_TRENDS = `## 인기 주제 5개
1. **AI 활용법**: AI 도구를 실생활에 적용하는 콘텐츠가 급증
2. **건강/웰빙**: 홈트레이닝, 식단 관리 콘텐츠 인기
3. **재테크/투자**: 주식, 부동산, 가상화폐 관련 콘텐츠
4. **여행 브이로그**: 해외여행 재개로 여행 콘텐츠 증가
5. **자기계발**: 독서, 습관 형성, 시간 관리 콘텐츠

## 키워드 트렌드
AI, ChatGPT, 부업, 재테크, 다이어트, 여행, 자기계발, 코딩, 영어공부, 루틴

## 콘텐츠 패턴
- 제목: 숫자 + 강한 감정 단어 ("꼭 해야 할 5가지", "절대 하면 안 되는")
- 길이: 8-15분이 가장 높은 시청 완료율
- 포맷: 리스트형, 비교형, 튜토리얼형

## 시청자 관심사
- 실용적이고 바로 적용 가능한 정보
- 돈 절약, 시간 절약 관련 콘텐츠
- 최신 기술 트렌드 업데이트

## 바이럴 요소
- 강력한 오프닝 훅 (처음 3초)
- 자막 + 시각 효과 활용
- 공감을 자극하는 스토리텔링`;

// =============================================================================
// ai-trendtube.server.ts - generateVideoIdeas
// =============================================================================

export const MOCK_VIDEO_IDEAS = `## 아이디어 1: "AI로 유튜브 대본 쓰는 법 - 10분 완성 가이드"

**영상 컨셉**: AI 도구를 활용해서 유튜브 영상 대본을 10분 안에 작성하는 과정을 단계별로 보여주는 튜토리얼. 실제 작성 과정을 화면 녹화로 보여주며, 프롬프트 작성 팁과 수정 노하우를 공유합니다.

**오프닝 훅**: "이 영상을 보고 나면, 대본 쓰는 데 10분이면 충분합니다"

**핵심 장면 구성**:
1. AI 도구 소개 및 세팅
2. 프롬프트 작성 과정 (실시간)
3. AI 결과물 수정 및 보완
4. 최종 대본 완성 및 리뷰

**비주얼 스타일**: 화면 녹화 + 얼굴 캠, 깔끔한 자막, 밝은 분위기
**타겟 시청자**: 유튜브 초보 크리에이터, 콘텐츠 제작에 관심 있는 20-30대
**예상 영상 길이**: 10-12분

## 아이디어 2: "하루 루틴 바꿨더니 인생이 달라졌습니다"

**영상 컨셉**: 30일간의 루틴 변경 챌린지를 기록한 브이로그 형식. 기상 시간, 운동, 독서 등의 습관을 변경하고 그 결과를 솔직하게 공유합니다.

**오프닝 훅**: "30일 전의 저와 지금의 저는 완전히 다른 사람입니다"

**핵심 장면 구성**:
1. 변경 전 일상 (비포)
2. 새로운 루틴 소개
3. 중간 점검 (2주차)
4. 30일 후 결과 공개
5. 시청자 챌린지 제안

**비주얼 스타일**: 브이로그 + 타임랩스, 따뜻한 색감
**타겟 시청자**: 자기계발에 관심 있는 20-40대
**예상 영상 길이**: 12-15분

## 아이디어 3: "요즘 유행하는 무자본 부업 TOP 3 (현실 후기)"

**영상 컨셉**: 실제로 시도해본 무자본 부업 3가지의 현실적인 수익과 소요 시간을 공개. 장단점을 솔직하게 비교하여 시청자가 자신에게 맞는 부업을 선택할 수 있도록 돕습니다.

**오프닝 훅**: "자본금 0원으로 시작해서 첫 달에 얼마를 벌었는지 공개합니다"

**핵심 장면 구성**:
1. 3가지 부업 소개
2. 각 부업별 실제 수익 공개
3. 소요 시간 및 난이도 비교
4. 추천 부업 선정

**비주얼 스타일**: 인포그래픽 + 실제 수익 캡쳐, 깔끔한 편집
**타겟 시청자**: 직장인, 대학생, 부업에 관심 있는 모든 연령대
**예상 영상 길이**: 8-10분`;

// =============================================================================
// ai-trendtube.server.ts - generateNarrationScript
// =============================================================================

export const MOCK_NARRATION_SCRIPT =
  '[열정적으로] "AI가 당신의 콘텐츠 제작 시간을 10분의 1로 줄여줄 수 있다면, 지금 바로 시작하시겠습니까?"';

// =============================================================================
// ai-trendtube.server.ts - generateFullNarrationScript
// =============================================================================

export const MOCK_FULL_NARRATION_RESULT = {
  script: `[열정적으로] "AI가 당신의 콘텐츠 제작 시간을 10분의 1로 줄여줄 수 있다면, 지금 바로 시작하시겠습니까?"

[차분하게] 안녕하세요, 오늘은 AI 도구를 활용해서 유튜브 영상 대본을 10분 안에 완성하는 방법을 알려드리겠습니다.

[설명하듯] 첫 번째 단계는 프롬프트 설계입니다. 좋은 프롬프트가 좋은 결과를 만듭니다.

[강조하며] 가장 중요한 것은 구체적인 지시를 내리는 것입니다. 막연한 요청은 막연한 결과를 가져옵니다.`,
  estimatedDurationSeconds: 32,
  suggestedClipCount: 4,
};

// =============================================================================
// ai-trendtube.server.ts - generateVideoClipPrompts
// =============================================================================

export const MOCK_VIDEO_CLIP_PROMPTS = [
  {
    clipNumber: 1,
    prompt: "Dynamic close-up of a person looking amazed at a glowing laptop screen in a modern office, cinematic lighting, shallow depth of field",
    narrativeContext: "AI로 콘텐츠 제작 시간을 줄이는 것에 대한 강렬한 오프닝",
  },
  {
    clipNumber: 2,
    prompt: "Wide shot of a bright modern workspace with multiple screens showing AI interfaces and dashboards, warm natural light",
    narrativeContext: "AI 도구로 유튜브 대본을 작성하는 방법 소개",
  },
  {
    clipNumber: 3,
    prompt: "Overhead shot of hands typing on a keyboard with holographic UI elements floating above, clean minimal desk setup",
    narrativeContext: "프롬프트 설계의 중요성 설명",
  },
  {
    clipNumber: 4,
    prompt: "Cinematic medium shot of a confident creator reviewing content on a tablet, surrounded by floating data visualizations",
    narrativeContext: "구체적인 지시와 결과의 관계 강조",
  },
];

// =============================================================================
// ai-script.server.ts - generateScript / generateScriptStream
// =============================================================================

export const MOCK_SCRIPT_SEGMENTS: ScriptSegment[] = [
  {
    id: "seg-mock-1",
    type: "hook",
    content:
      "여러분, 오늘 이 영상 하나로 여러분의 유튜브 채널이 완전히 달라질 수 있습니다. 믿기 어려우시죠? 3분만 투자해주세요.",
    duration: 15,
    visualNotes: "화면 가운데 호스트 클로즈업, 강렬한 표정",
    emotionalTone: "exciting",
    keywords: ["유튜브", "성장", "채널"],
  },
  {
    id: "seg-mock-2",
    type: "intro",
    content:
      "안녕하세요, 오늘은 유튜브 알고리즘이 좋아하는 영상의 비밀을 파헤쳐보겠습니다. 최근 데이터를 분석해보니 놀라운 패턴이 발견되었습니다.",
    duration: 20,
    visualNotes: "채널 인트로 애니메이션 후 호스트 미디엄 샷",
    emotionalTone: "informative",
    keywords: ["알고리즘", "데이터", "패턴"],
  },
  {
    id: "seg-mock-3",
    type: "body",
    content:
      "첫 번째 비밀은 바로 '시청 유지율'입니다. 유튜브 알고리즘은 영상의 시청 유지율을 가장 중요한 지표로 봅니다. 처음 30초 안에 시청자를 사로잡지 못하면 영상은 묻히게 됩니다. 구체적으로 어떻게 해야 하는지 알려드리겠습니다.",
    duration: 45,
    visualNotes: "그래프 인포그래픽 + 화면 분할",
    emotionalTone: "dramatic",
    keywords: ["시청 유지율", "알고리즘", "30초"],
    sceneHints: [
      {
        description: "시청 유지율 그래프 표시",
        visualPrompt:
          "Analytics dashboard showing viewer retention graph with highlight on first 30 seconds",
        duration: 15,
      },
      {
        description: "성공 사례 비교",
        visualPrompt:
          "Split screen comparing two video thumbnails, one with high retention and one with low",
        duration: 15,
      },
    ],
  },
  {
    id: "seg-mock-4",
    type: "cta",
    content:
      "이 정보가 도움이 되셨다면 좋아요와 구독 부탁드립니다! 알림 설정까지 해두시면 새로운 영상을 가장 먼저 보실 수 있습니다. 궁금한 점은 댓글로 남겨주세요!",
    duration: 15,
    visualNotes: "구독 버튼 애니메이션 + 알림 벨 아이콘",
    emotionalTone: "friendly",
    keywords: ["구독", "좋아요", "알림"],
  },
  {
    id: "seg-mock-5",
    type: "outro",
    content:
      "다음 영상에서는 썸네일 제작의 비밀을 알려드리겠습니다. 기대해주세요! 시청해주셔서 감사합니다.",
    duration: 10,
    visualNotes: "다음 영상 미리보기 + 엔드 스크린",
    emotionalTone: "calm",
    keywords: ["썸네일", "다음 영상"],
  },
];

// =============================================================================
// ai-project-generator.server.ts - generateProjectContext
// =============================================================================

export const MOCK_PROJECT_CONTEXT: AIProjectGenerationOutput = {
  title: "AI 시대 생존 전략 - 직장인 필수 가이드",
  description:
    "AI 기술의 급변하는 시대에 직장인이 알아야 할 필수 생존 전략을 정리합니다.",
  targetAudience:
    "AI에 관심 있는 20-40대, 커리어 전환을 고려하는 직장인",
  estimatedViews: "80K-200K",
  suggestedTone: "informative",
  suggestedDifficulty: "medium",
  suggestedVideoLength: "medium",
  suggestedCategory: "과학기술",
};

// =============================================================================
// ai-pre-production.server.ts - generatePreProduction
// =============================================================================

export const MOCK_PRE_PRODUCTION: PreProductionOutput = {
  hooks: [
    '"AI가 당신의 직업을 위협하고 있습니다"',
    '"이 기술을 모르면 3년 안에 도태됩니다"',
    '"지금 바로 시작해야 하는 이유"',
  ],
  scriptGuidelines: {
    openingStrategy:
      "충격적인 AI 대체 직업 통계로 시작하여 시청자의 위기감을 자극",
    mainPoints: [
      "AI가 대체할 수 있는 직업군 분석",
      "AI와 공존하기 위한 스킬셋",
      "지금 당장 시작할 수 있는 3가지 액션 플랜",
    ],
    ctaStrategy: "댓글로 자신의 직업과 AI 활용 경험 공유 유도",
    closingStrategy: "긍정적 메시지로 마무리, 다음 편 예고",
    keyMessages: [
      "AI는 위협이 아니라 기회입니다",
      "지금 시작하면 충분합니다",
    ],
    avoidTopics: ["지나치게 비관적인 전망", "특정 기업 비방"],
  },
  seoKeywords: ["AI", "직장인", "미래직업", "자기계발", "커리어", "AI활용법", "생존전략"],
};

// =============================================================================
// ai-video.server.ts - generateVideoPrompt (internal)
// =============================================================================

export const MOCK_VIDEO_PROMPT =
  "A dynamic cinematic shot of a person working on a laptop in a modern office, with holographic AI interfaces floating around them, professional lighting, shallow depth of field";

// =============================================================================
// ai-music.server.ts - generateMusicPrompt (internal)
// =============================================================================

export const MOCK_MUSIC_PROMPT = {
  prompt:
    "Upbeat electronic music with a driving beat, synth pads, and an inspiring melody, suitable for a technology explainer video",
  genre: "electronic" as const,
};

// =============================================================================
// ai-video.server.ts - generateVideo
// =============================================================================

export const MOCK_VIDEO_RESULT: VideoGenerationResult = {
  url: "",
  duration: 8,
  prompt: MOCK_VIDEO_PROMPT,
};

// =============================================================================
// ai-music.server.ts - generateMusic
// =============================================================================

export const MOCK_MUSIC_RESULT: MusicGenerationResult = {
  url: "",
  duration: 8,
  prompt: MOCK_MUSIC_PROMPT.prompt,
  genre: MOCK_MUSIC_PROMPT.genre,
};

// =============================================================================
// ai-storyboard.server.ts - generateStoryboardStream
// =============================================================================

export const MOCK_STORYBOARD_SCENES: StoryboardScene[] = [
  {
    id: "scene-mock-1",
    scriptSegmentId: "seg-mock-1",
    sceneNumber: 1,
    orderIndex: 0,
    description: "호스트가 카메라를 향해 열정적으로 말하는 클로즈업 샷",
    visualPrompt:
      "Close-up shot of a confident presenter speaking directly to camera, modern studio background with soft lighting",
    duration: 8,
  },
  {
    id: "scene-mock-2",
    scriptSegmentId: "seg-mock-1",
    sceneNumber: 2,
    orderIndex: 1,
    description: "유튜브 성장 그래프가 올라가는 모션 그래픽",
    visualPrompt:
      "Animated graph showing YouTube channel growth metrics rising dramatically, clean infographic style",
    duration: 7,
  },
  {
    id: "scene-mock-3",
    scriptSegmentId: "seg-mock-2",
    sceneNumber: 3,
    orderIndex: 2,
    description: "채널 인트로 로고 애니메이션",
    visualPrompt:
      "Professional YouTube channel intro animation with logo reveal, modern and sleek design",
    duration: 5,
  },
  {
    id: "scene-mock-4",
    scriptSegmentId: "seg-mock-3",
    sceneNumber: 4,
    orderIndex: 3,
    description: "유튜브 분석 대시보드 화면",
    visualPrompt:
      "YouTube Analytics dashboard showing viewer retention graph with annotations highlighting key drop-off points",
    duration: 15,
  },
  {
    id: "scene-mock-5",
    scriptSegmentId: "seg-mock-3",
    sceneNumber: 5,
    orderIndex: 4,
    description: "성공적인 영상과 실패한 영상의 비교 화면",
    visualPrompt:
      "Split screen comparison of two video thumbnails - left side with high views, right side with low views, analytical style",
    duration: 10,
  },
];
