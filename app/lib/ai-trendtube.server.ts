// =============================================================================
// TrendTube AI Pipeline Service (Google Gemini API)
// =============================================================================
// Server-side AI pipeline for TrendTube: trend extraction, idea generation,
// image generation, narration script writing, and BGM selection.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateImage, generatePlaceholderImage } from "./ai-imagen.server";

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// =============================================================================
// Step 1: Extract YouTube Trends
// =============================================================================

export async function extractYouTubeTrends(
  url: string,
  userIdea?: string
): Promise<string> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `당신은 YouTube 트렌드 분석 전문가입니다.

사용자가 제공한 YouTube 트렌드 URL: ${url}

${userIdea ? `사용자의 영상 아이디어: ${userIdea}` : ""}

이 URL은 YouTube 인기 급상승 또는 트렌드 페이지를 가리킵니다.
해당 URL의 트렌드 콘텐츠를 분석하여 다음을 추출해주세요:

1. **인기 주제 5개**: 현재 가장 인기 있는 주제/카테고리
2. **키워드 트렌드**: 자주 등장하는 키워드 10개
3. **콘텐츠 패턴**: 인기 영상들의 공통 패턴 (제목 스타일, 길이, 포맷)
4. **시청자 관심사**: 시청자들이 관심을 보이는 주요 관심사
5. **바이럴 요소**: 높은 조회수를 기록한 영상들의 공통 바이럴 요소

${userIdea ? `특히 "${userIdea}"와 관련된 트렌드에 집중하여 분석해주세요.` : ""}

결과를 구조화된 한국어 텍스트로 작성해주세요.`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  });

  const text = result.response.text();
  if (!text) throw new Error("트렌드 추출 응답이 비어있습니다");
  return text;
}

// =============================================================================
// Step 2: Generate Video Ideas
// =============================================================================

export async function generateVideoIdeas(
  extractedTrends: string,
  referenceImageDescription?: string
): Promise<string> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `당신은 바이럴 YouTube 콘텐츠 기획 전문가입니다.

## 분석된 트렌드:
${extractedTrends}

${referenceImageDescription ? `## 참고 이미지 설명:\n${referenceImageDescription}` : ""}

위 트렌드 분석을 바탕으로 **3개의 바이럴 영상 아이디어**를 생성해주세요.

각 아이디어에 다음을 포함해주세요:
1. **영상 제목**: 클릭을 유도하는 매력적인 제목
2. **영상 컨셉**: 영상의 전체 컨셉과 스토리라인 (3-5문장)
3. **오프닝 훅**: 시청자를 끌어들이는 첫 5초 대사/장면
4. **핵심 장면 구성**: 3-5개의 주요 장면 설명
5. **비주얼 스타일**: 영상의 시각적 톤과 분위기
6. **타겟 시청자**: 주요 타겟 층
7. **예상 영상 길이**: 추천 길이

가장 바이럴될 가능성이 높은 순서로 정렬해주세요.
결과를 구조화된 한국어 텍스트로 작성해주세요.`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.9, maxOutputTokens: 6144 },
  });

  const text = result.response.text();
  if (!text) throw new Error("영상 아이디어 생성 응답이 비어있습니다");
  return text;
}

// =============================================================================
// Step 3: Generate Video Images (Key Frames)
// =============================================================================

export async function generateVideoImages(
  videoIdeas: string
): Promise<string[]> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다");
  }

  // First, generate visual prompts from video ideas
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const promptResult = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Based on the following video ideas, create exactly 4 short English visual prompts for key frame images. Each prompt should describe a single cinematic scene that could be a key moment in the video.

Video Ideas:
${videoIdeas}

Return ONLY a JSON array of 4 strings, each being a visual prompt. No code blocks, no explanation.
Example: ["A person sitting at a modern desk with multiple screens showing AI dashboards, cinematic lighting", "Close-up of hands typing on keyboard with holographic data visualizations floating above", ...]`,
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  });

  let visualPrompts: string[] = [];
  try {
    const rawText = promptResult.response.text();
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      visualPrompts = JSON.parse(match[0]);
    }
  } catch {
    visualPrompts = [
      "A creative workspace with modern technology, cinematic lighting, professional quality",
      "Dynamic scene with vibrant colors and engaging composition, YouTube thumbnail style",
      "Person presenting content with energy and enthusiasm, studio lighting setup",
      "Abstract visualization of trending topics and viral content, modern design",
    ];
  }

  // Generate images from visual prompts
  const imageUrls: string[] = [];

  for (const prompt of visualPrompts.slice(0, 4)) {
    try {
      const image = await generateImage(prompt, {
        aspectRatio: "16:9",
        style: "cinematic",
      });
      const base64 = image.buffer.toString("base64");
      imageUrls.push(`data:${image.mimeType};base64,${base64}`);
    } catch {
      // Fallback to placeholder
      const placeholder = generatePlaceholderImage({ aspectRatio: "16:9" });
      const base64 = placeholder.buffer.toString("base64");
      imageUrls.push(`data:${placeholder.mimeType};base64,${base64}`);
    }
  }

  return imageUrls;
}

// =============================================================================
// Step 4: Generate Narration Script
// =============================================================================

export async function generateNarrationScript(
  videoIdeas: string
): Promise<string> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `당신은 프로페셔널 YouTube 나레이션 작가입니다.

## 영상 아이디어:
${videoIdeas}

위 아이디어 중 첫 번째 아이디어를 기반으로 **YouTube 나레이션 스크립트**를 작성해주세요.

### 스크립트 형식:
**[인트로 - 15초]**
시청자의 관심을 끄는 강력한 오프닝. 질문이나 놀라운 사실로 시작.

**[본문 1 - 30초]**
핵심 내용의 첫 번째 포인트. 구체적인 예시와 데이터 포함.

**[본문 2 - 30초]**
두 번째 핵심 포인트. 시각적 설명과 함께.

**[본문 3 - 30초]**
세 번째 핵심 포인트. 실용적인 팁이나 방법.

**[아웃트로 - 15초]**
핵심 메시지 요약 + 구독/좋아요 유도.

### 작성 규칙:
- 자연스러운 구어체 사용
- 보이스오버에 최적화된 짧은 문장
- 감정 표현 지시 포함 (예: [열정적으로], [차분하게])
- 총 2분 내외 분량`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  });

  const text = result.response.text();
  if (!text) throw new Error("나레이션 스크립트 생성 응답이 비어있습니다");
  return text;
}

// =============================================================================
// Step 5: Background Music Selection (Preset-based)
// =============================================================================

export interface BGMTrack {
  genre: string;
  label: string;
  description: string;
}

const BGM_PRESETS: BGMTrack[] = [
  {
    genre: "upbeat",
    label: "활기찬 일렉트로닉",
    description: "에너지 넘치는 테크/IT 콘텐츠에 어울리는 업비트 BGM",
  },
  {
    genre: "calm",
    label: "잔잔한 어쿠스틱",
    description: "설명형/교육 콘텐츠에 어울리는 차분한 BGM",
  },
  {
    genre: "dramatic",
    label: "드라마틱 오케스트라",
    description: "충격적인 사실/리뷰 콘텐츠에 어울리는 극적인 BGM",
  },
  {
    genre: "cinematic",
    label: "시네마틱 앰비언트",
    description: "브이로그/다큐멘터리에 어울리는 분위기 있는 BGM",
  },
  {
    genre: "tech",
    label: "테크 퓨처리스틱",
    description: "AI/기술 관련 콘텐츠에 어울리는 미래적 BGM",
  },
];

export async function selectBackgroundMusic(
  videoIdeas: string
): Promise<{ genre: string; label: string; description: string }> {
  if (!genAI) {
    return BGM_PRESETS[0];
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const genreOptions = BGM_PRESETS.map((t) => t.genre).join(", ");

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Based on these video ideas, choose the most appropriate background music genre.
Options: ${genreOptions}

Video Ideas:
${videoIdeas.substring(0, 1000)}

Return ONLY the genre name as a single word. No explanation.`,
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.3, maxOutputTokens: 50 },
  });

  const selectedGenre = result.response.text().trim().toLowerCase();
  const matched = BGM_PRESETS.find((t) => selectedGenre.includes(t.genre));
  return matched ?? BGM_PRESETS[0];
}
