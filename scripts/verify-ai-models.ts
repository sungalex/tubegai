// =============================================================================
// AI Model Verification Script
// =============================================================================
// Tests the AI models specified in CLAUDE.md to ensure they are functional
// before updating the codebase.

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

interface TestResult {
  model: string;
  success: boolean;
  message: string;
}

/**
 * Test text generation with gemini-3-flash model
 */
async function testGemini3Flash(): Promise<TestResult> {
  console.log("\n=== gemini-3-flash 텍스트 생성 테스트 ===");
  const model = "gemini-3-flash";

  try {
    const genModel = genAI.getGenerativeModel({ model });
    const result = await genModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: 'Respond with exactly: "Hello from Gemini 3 Flash!"' }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 50,
      },
    });

    const text = result.response.text();
    console.log(`✅ ${model} 성공:`, text.slice(0, 100));

    return {
      model,
      success: true,
      message: text.slice(0, 100),
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${model} 실패:`, errorMsg);

    return {
      model,
      success: false,
      message: errorMsg,
    };
  }
}

/**
 * Test text generation with streaming for gemini-3-flash
 */
async function testGemini3FlashStreaming(): Promise<TestResult> {
  console.log("\n=== gemini-3-flash 스트리밍 테스트 ===");
  const model = "gemini-3-flash";

  try {
    const genModel = genAI.getGenerativeModel({ model });
    const result = await genModel.generateContentStream({
      contents: [
        {
          role: "user",
          parts: [{ text: "Count from 1 to 5 briefly." }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 100,
      },
    });

    let fullText = "";
    for await (const chunk of result.stream) {
      fullText += chunk.text();
    }

    console.log(`✅ ${model} 스트리밍 성공:`, fullText.slice(0, 100));

    return {
      model: `${model} (streaming)`,
      success: true,
      message: fullText.slice(0, 100),
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${model} 스트리밍 실패:`, errorMsg);

    return {
      model: `${model} (streaming)`,
      success: false,
      message: errorMsg,
    };
  }
}

/**
 * Test JSON response with gemini-3-flash (for script/storyboard generation)
 */
async function testGemini3FlashJson(): Promise<TestResult> {
  console.log("\n=== gemini-3-flash JSON 응답 테스트 ===");
  const model = "gemini-3-flash";

  try {
    const genModel = genAI.getGenerativeModel({ model });
    const result = await genModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: 'Return a JSON array with 2 objects, each having "id" and "name" fields. Example: [{"id":1,"name":"test"}]',
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 200,
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text();
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed) && parsed.length > 0) {
      console.log(`✅ ${model} JSON 성공:`, JSON.stringify(parsed).slice(0, 100));
      return {
        model: `${model} (JSON)`,
        success: true,
        message: JSON.stringify(parsed).slice(0, 100),
      };
    } else {
      throw new Error("Invalid JSON response structure");
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${model} JSON 실패:`, errorMsg);

    return {
      model: `${model} (JSON)`,
      success: false,
      message: errorMsg,
    };
  }
}

/**
 * Test image generation with nano-banana-001 model
 */
async function testNanoBanana001(): Promise<TestResult> {
  console.log("\n=== nano-banana-001 이미지 생성 테스트 ===");
  const model = "nano-banana-001";

  try {
    const genModel = genAI.getGenerativeModel({ model });
    const result = await genModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Create an image: A simple blue circle on white background, minimal, clean design",
            },
          ],
        },
      ],
      generationConfig: {
        // @ts-expect-error - Gemini image generation config (not in official types)
        responseModalities: ["image", "text"],
      },
    });

    const candidates = result.response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No response candidates");
    }

    const parts = candidates[0].content?.parts || [];
    const imagePart = parts.find(
      (part) => "inlineData" in part && part.inlineData?.mimeType?.startsWith("image/")
    );

    if (imagePart && "inlineData" in imagePart) {
      const dataLength = imagePart.inlineData?.data?.length || 0;
      console.log(
        `✅ ${model} 이미지 생성 성공 (data length: ${dataLength} bytes)`
      );

      return {
        model,
        success: true,
        message: `Image generated (${dataLength} bytes base64)`,
      };
    } else {
      // Check if there's a text response instead
      const textPart = parts.find((part) => "text" in part);
      if (textPart && "text" in textPart) {
        console.log(`⚠️ ${model} 텍스트만 반환:`, textPart.text?.slice(0, 100));
      }
      throw new Error("No image data in response");
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${model} 실패:`, errorMsg);

    return {
      model,
      success: false,
      message: errorMsg,
    };
  }
}

/**
 * Main function to run all tests
 */
async function main(): Promise<void> {
  console.log("========================================");
  console.log("  AI 모델 검증 시작");
  console.log("  CLAUDE.md 가이드라인 기준");
  console.log("========================================");

  const results: TestResult[] = [];

  // Test gemini-3-flash (text generation)
  results.push(await testGemini3Flash());

  // Test gemini-3-flash (streaming)
  results.push(await testGemini3FlashStreaming());

  // Test gemini-3-flash (JSON response)
  results.push(await testGemini3FlashJson());

  // Test nano-banana-001 (image generation)
  results.push(await testNanoBanana001());

  // Print summary
  console.log("\n========================================");
  console.log("  검증 결과 요약");
  console.log("========================================\n");

  let allPassed = true;
  for (const result of results) {
    const status = result.success ? "✅ 통과" : "❌ 실패";
    console.log(`${status} | ${result.model}`);
    if (!result.success) {
      console.log(`       └─ ${result.message}`);
      allPassed = false;
    }
  }

  console.log("\n========================================");

  if (allPassed) {
    console.log("✅ 모든 모델 검증 통과!");
    console.log("   구현을 진행할 수 있습니다.");
    console.log("========================================\n");
    process.exit(0);
  } else {
    console.log("⚠️ 일부 모델이 실패했습니다.");
    console.log("   대안 모델을 검토해주세요.");
    console.log("========================================\n");
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
