// =============================================================================
// AI Model Verification Script
// =============================================================================
// Lists available models and tests specific ones from CLAUDE.md

import * as dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// Load environment variables from .env file
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다");
  process.exit(1);
}

const _genAI = new GoogleGenAI({ apiKey });

/**
 * List all available models
 */
async function listAvailableModels(): Promise<void> {
  console.log("========================================");
  console.log("  사용 가능한 모델 목록 조회");
  console.log("========================================\n");

  console.log(`API Key: ${apiKey?.slice(0, 10)}...${apiKey?.slice(-4)}\n`);

  try {
    // Use REST API to list models since the SDK doesn't have listModels
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Body:", errorBody);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const models = data.models || [];

    console.log(`총 ${models.length}개 모델 발견:\n`);

    // Group by type
    const textModels: string[] = [];
    const imageModels: string[] = [];
    const embeddingModels: string[] = [];
    const otherModels: string[] = [];

    for (const model of models) {
      const name = model.name.replace("models/", "");
      const methods = model.supportedGenerationMethods || [];

      if (methods.includes("generateContent")) {
        if (name.includes("imagen") || name.includes("image")) {
          imageModels.push(name);
        } else {
          textModels.push(name);
        }
      } else if (methods.includes("embedContent")) {
        embeddingModels.push(name);
      } else {
        otherModels.push(name);
      }
    }

    console.log("[텍스트 생성 모델]");
    textModels.forEach((m) => console.log(`  - ${m}`));

    console.log("\n[이미지 관련 모델]");
    imageModels.forEach((m) => console.log(`  - ${m}`));

    console.log("\n[임베딩 모델]");
    embeddingModels.forEach((m) => console.log(`  - ${m}`));

    if (otherModels.length > 0) {
      console.log("\n[기타 모델]");
      otherModels.forEach((m) => console.log(`  - ${m}`));
    }

    // Check for CLAUDE.md models
    console.log("\n========================================");
    console.log("  CLAUDE.md 모델 존재 여부 확인");
    console.log("========================================\n");

    const allModelNames = models.map((m: { name: string }) =>
      m.name.replace("models/", "")
    );

    const claudeMdModels = [
      "gemini-3-flash",
      "gemini-3-pro",
      "nano-banana-001",
      "veo-3-flash",
    ];

    const currentModels = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "nano-banana-pro-preview",
      "gemini-3-pro-image-preview",
    ];

    console.log("[CLAUDE.md 2026 가이드라인 모델]");
    for (const model of claudeMdModels) {
      const exists = allModelNames.includes(model);
      console.log(`  ${exists ? "✅" : "❌"} ${model}`);
    }

    console.log("\n[현재 코드에서 사용 중인 모델]");
    for (const model of currentModels) {
      const exists = allModelNames.includes(model);
      console.log(`  ${exists ? "✅" : "❌"} ${model}`);
    }

    // Find similar models for suggestions
    console.log("\n========================================");
    console.log("  유사 모델명 제안");
    console.log("========================================\n");

    const suggestions: Record<string, string[]> = {};

    for (const target of [...claudeMdModels, ...currentModels]) {
      const similar = allModelNames.filter(
        (name: string) =>
          name.includes(target.split("-")[0]) || // Match prefix like "gemini"
          target.includes(name.split("-")[0])
      );
      if (similar.length > 0 && !allModelNames.includes(target)) {
        suggestions[target] = similar.slice(0, 5);
      }
    }

    for (const [target, similar] of Object.entries(suggestions)) {
      console.log(`${target} → 유사: ${similar.join(", ")}`);
    }
  } catch (error) {
    console.error("모델 목록 조회 실패:", error);
  }
}

// Run
listAvailableModels().catch(console.error);
