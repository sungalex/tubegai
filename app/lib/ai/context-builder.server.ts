// =============================================================================
// Shared AI Context Builder
// =============================================================================
// Extracts project context into a structured text format for AI prompts.
// Used by ai-script.server.ts and ai-storyboard.server.ts.

import type { ProjectFullDetail } from "~/common/data/project.data.server";
import type { ScriptGuidelines } from "~/common/types/trend.types";

// =============================================================================
// Types
// =============================================================================

export interface PreProductionContext {
  hooks?: string[];
  scriptGuidelines?: ScriptGuidelines;
  seoKeywords?: string[];
}

// =============================================================================
// Exports
// =============================================================================

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function buildProjectContext(
  project: ProjectFullDetail,
  language: "ko" | "en",
  preProduction?: PreProductionContext,
): string {
  const lines: string[] = [];

  if (language === "ko") {
    // === 프로젝트 기본 정보 ===
    lines.push(`## 프로젝트 기본 정보`);
    lines.push(`제목: ${project.title}`);
    if (project.description) lines.push(`설명: ${project.description}`);
    if (project.topic) lines.push(`주제: ${project.topic}`);
    if (project.type) {
      const typeMap: Record<string, string> = {
        short: "쇼트폼 (1-2분)",
        long: "롱폼 (10분+)",
      };
      lines.push(`영상 유형: ${typeMap[project.type] || project.type}`);
    }
    if (project.difficulty) {
      const diffMap: Record<string, string> = {
        easy: "쉬움 - 간단한 어휘와 구성 사용",
        medium: "보통 - 균형잡힌 구성",
        hard: "어려움 - 전문적인 내용과 심층 분석",
      };
      lines.push(
        `난이도: ${diffMap[project.difficulty] || project.difficulty}`,
      );
    }

    // === 타겟 시청자 ===
    lines.push(`\n## 타겟 시청자`);
    if (project.targetAudience)
      lines.push(`타겟 시청자: ${project.targetAudience}`);
    if (project.estimatedViews)
      lines.push(`예상 조회수: ${project.estimatedViews}`);
    if (project.contentTone) lines.push(`콘텐츠 톤: ${project.contentTone}`);
    if (project.videoLength) lines.push(`영상 길이: ${project.videoLength}`);

    // === 채널 정보 ===
    if (project.channel) {
      lines.push(`\n## 채널 정보`);
      lines.push(`채널명: ${project.channel.name}`);
      if (project.channel.description) {
        const desc =
          project.channel.description.length > 200
            ? project.channel.description.slice(0, 200) + "..."
            : project.channel.description;
        lines.push(`채널 설명: ${desc}`);
      }
      if (project.channel.subscriberCount) {
        lines.push(
          `구독자: ${formatNumber(project.channel.subscriberCount)}명`,
        );
      }
      if (project.channel.viewCount) {
        lines.push(`총 조회수: ${formatNumber(project.channel.viewCount)}회`);
      }
      // 채널 규모에 따른 톤 가이드
      if (project.channel.subscriberCount) {
        const size =
          project.channel.subscriberCount < 10000
            ? "소형"
            : project.channel.subscriberCount < 100000
              ? "중형"
              : "대형";
        const toneGuide =
          project.channel.subscriberCount < 10000
            ? "친근하고 개인적인 톤 권장"
            : project.channel.subscriberCount < 100000
              ? "전문적이면서 친근한 톤 권장"
              : "전문적이고 권위있는 톤 권장";
        lines.push(`채널 규모: ${size} (${toneGuide})`);
      }
    }

    // === 콘텐츠 태그 ===
    if (project.labels && project.labels.length > 0) {
      lines.push(`\n## 콘텐츠 태그`);
      const labelNames = project.labels.map((l) => l.name).join(", ");
      lines.push(`태그: ${labelNames}`);
    }

    // === 추천 훅 (Pre-Production) ===
    const hooks = preProduction?.hooks;
    if (hooks && hooks.length > 0) {
      lines.push(`\n## 추천 훅`);
      lines.push(`추천 훅: ${hooks.join(", ")}`);
    }

    // === 트렌드 분석 ===
    if (project.trendSnapshot) {
      lines.push(`\n## 트렌드 분석`);
      lines.push(`관련 트렌드: ${project.trendSnapshot.title}`);
      if (project.trendSnapshot.description) {
        lines.push(`트렌드 설명: ${project.trendSnapshot.description}`);
      }
      if (project.trendSnapshot.category) {
        lines.push(`카테고리: ${project.trendSnapshot.category}`);
      }
      if (project.trendSnapshot.growthRate) {
        lines.push(`성장률: ${project.trendSnapshot.growthRate}`);
      }
      if (project.trendSnapshot.tags && project.trendSnapshot.tags.length > 0) {
        lines.push(`트렌드 태그: ${project.trendSnapshot.tags.join(", ")}`);
      }
      if (project.trendSnapshot.metrics) {
        const m = project.trendSnapshot.metrics;
        const parts = [];
        if (m.viewCount) parts.push(`조회수 ${formatNumber(m.viewCount)}`);
        if (m.likeCount) parts.push(`좋아요 ${formatNumber(m.likeCount)}`);
        if (m.commentCount) parts.push(`댓글 ${formatNumber(m.commentCount)}`);
        if (parts.length > 0) {
          lines.push(`참조 영상 성과: ${parts.join(", ")}`);
        }
      }
    } else if (project.basedOnTrend) {
      lines.push(`\n## 트렌드`);
      lines.push(`관련 트렌드: ${project.basedOnTrend}`);
    }

    // === SEO 키워드 (Pre-Production) ===
    if (preProduction?.seoKeywords && preProduction.seoKeywords.length > 0) {
      lines.push(`\n## SEO 키워드`);
      lines.push(`키워드: ${preProduction.seoKeywords.join(", ")}`);
    }

    // === 대본 가이드라인 (Pre-Production) ===
    const sg = preProduction?.scriptGuidelines;
    if (sg) {
      lines.push(`\n## 대본 가이드라인`);
      if (sg.openingStrategy) lines.push(`도입 전략: ${sg.openingStrategy}`);
      if (sg.mainPoints && sg.mainPoints.length > 0) {
        lines.push(`핵심 포인트:`);
        sg.mainPoints.forEach((point, i) => lines.push(`  ${i + 1}. ${point}`));
      }
      if (sg.keyMessages && sg.keyMessages.length > 0) {
        lines.push(`핵심 메시지: ${sg.keyMessages.join("; ")}`);
      }
      if (sg.ctaStrategy) lines.push(`CTA 전략: ${sg.ctaStrategy}`);
      if (sg.closingStrategy) lines.push(`마무리 전략: ${sg.closingStrategy}`);
      if (sg.avoidTopics && sg.avoidTopics.length > 0) {
        lines.push(`피해야 할 주제: ${sg.avoidTopics.join(", ")}`);
      }
    }

    // === 추가 컨텍스트 ===
    if (project.aiContext) {
      const ctx = project.aiContext;
      const hasContent =
        ctx.competitors?.length ||
        ctx.references?.length ||
        ctx.additionalNotes;
      if (hasContent) {
        lines.push(`\n## 추가 컨텍스트`);
        if (ctx.competitors && ctx.competitors.length > 0) {
          lines.push(
            `경쟁 채널/영상: ${ctx.competitors.join(", ")} (차별화 필요)`,
          );
        }
        if (ctx.references && ctx.references.length > 0) {
          lines.push(`참고 자료: ${ctx.references.join(", ")}`);
        }
        if (ctx.additionalNotes)
          lines.push(`사용자 요청사항: ${ctx.additionalNotes}`);
      }
    }
  } else {
    // === English Version ===

    // === Basic Project Info ===
    lines.push(`## Basic Project Info`);
    lines.push(`Title: ${project.title}`);
    if (project.description) lines.push(`Description: ${project.description}`);
    if (project.topic) lines.push(`Topic: ${project.topic}`);
    if (project.type) {
      const typeMap: Record<string, string> = {
        short: "Short-form (1-2 min)",
        long: "Long-form (10+ min)",
      };
      lines.push(`Video Type: ${typeMap[project.type] || project.type}`);
    }
    if (project.difficulty) {
      const diffMap: Record<string, string> = {
        easy: "Easy - Use simple vocabulary and structure",
        medium: "Medium - Balanced structure",
        hard: "Hard - Professional content with in-depth analysis",
      };
      lines.push(
        `Difficulty: ${diffMap[project.difficulty] || project.difficulty}`,
      );
    }

    // === Target Audience ===
    lines.push(`\n## Target Audience`);
    if (project.targetAudience)
      lines.push(`Target Audience: ${project.targetAudience}`);
    if (project.estimatedViews)
      lines.push(`Estimated Views: ${project.estimatedViews}`);
    if (project.contentTone) lines.push(`Content Tone: ${project.contentTone}`);
    if (project.videoLength) lines.push(`Video Length: ${project.videoLength}`);

    // === Channel Info ===
    if (project.channel) {
      lines.push(`\n## Channel Info`);
      lines.push(`Channel Name: ${project.channel.name}`);
      if (project.channel.description) {
        const desc =
          project.channel.description.length > 200
            ? project.channel.description.slice(0, 200) + "..."
            : project.channel.description;
        lines.push(`Channel Description: ${desc}`);
      }
      if (project.channel.subscriberCount) {
        lines.push(
          `Subscribers: ${formatNumber(project.channel.subscriberCount)}`,
        );
      }
      if (project.channel.viewCount) {
        lines.push(`Total Views: ${formatNumber(project.channel.viewCount)}`);
      }
      if (project.channel.subscriberCount) {
        const size =
          project.channel.subscriberCount < 10000
            ? "Small"
            : project.channel.subscriberCount < 100000
              ? "Medium"
              : "Large";
        const toneGuide =
          project.channel.subscriberCount < 10000
            ? "Friendly and personal tone recommended"
            : project.channel.subscriberCount < 100000
              ? "Professional yet approachable tone recommended"
              : "Professional and authoritative tone recommended";
        lines.push(`Channel Size: ${size} (${toneGuide})`);
      }
    }

    // === Content Tags ===
    if (project.labels && project.labels.length > 0) {
      lines.push(`\n## Content Tags`);
      const labelNames = project.labels.map((l) => l.name).join(", ");
      lines.push(`Tags: ${labelNames}`);
    }

    // === Suggested Hooks (Pre-Production) ===
    const hooksEn = preProduction?.hooks;
    if (hooksEn && hooksEn.length > 0) {
      lines.push(`\n## Suggested Hooks`);
      lines.push(`Suggested Hooks: ${hooksEn.join(", ")}`);
    }

    // === Trend Analysis ===
    if (project.trendSnapshot) {
      lines.push(`\n## Trend Analysis`);
      lines.push(`Related Trend: ${project.trendSnapshot.title}`);
      if (project.trendSnapshot.description) {
        lines.push(`Trend Description: ${project.trendSnapshot.description}`);
      }
      if (project.trendSnapshot.category) {
        lines.push(`Category: ${project.trendSnapshot.category}`);
      }
      if (project.trendSnapshot.growthRate) {
        lines.push(`Growth Rate: ${project.trendSnapshot.growthRate}`);
      }
      if (project.trendSnapshot.tags && project.trendSnapshot.tags.length > 0) {
        lines.push(`Trend Tags: ${project.trendSnapshot.tags.join(", ")}`);
      }
      if (project.trendSnapshot.metrics) {
        const m = project.trendSnapshot.metrics;
        const parts = [];
        if (m.viewCount) parts.push(`Views: ${formatNumber(m.viewCount)}`);
        if (m.likeCount) parts.push(`Likes: ${formatNumber(m.likeCount)}`);
        if (m.commentCount)
          parts.push(`Comments: ${formatNumber(m.commentCount)}`);
        if (parts.length > 0) {
          lines.push(`Reference Video Performance: ${parts.join(", ")}`);
        }
      }
    } else if (project.basedOnTrend) {
      lines.push(`\n## Trend`);
      lines.push(`Related Trend: ${project.basedOnTrend}`);
    }

    // === SEO Keywords (Pre-Production) ===
    if (preProduction?.seoKeywords && preProduction.seoKeywords.length > 0) {
      lines.push(`\n## SEO Keywords`);
      lines.push(`Keywords: ${preProduction.seoKeywords.join(", ")}`);
    }

    // === Script Guidelines (Pre-Production) ===
    const sgEn = preProduction?.scriptGuidelines;
    if (sgEn) {
      const sg = sgEn;
      lines.push(`\n## Script Guidelines`);
      if (sg.openingStrategy)
        lines.push(`Opening Strategy: ${sg.openingStrategy}`);
      if (sg.mainPoints && sg.mainPoints.length > 0) {
        lines.push(`Main Points:`);
        sg.mainPoints.forEach((point, i) => lines.push(`  ${i + 1}. ${point}`));
      }
      if (sg.keyMessages && sg.keyMessages.length > 0) {
        lines.push(`Key Messages: ${sg.keyMessages.join("; ")}`);
      }
      if (sg.ctaStrategy) lines.push(`CTA Strategy: ${sg.ctaStrategy}`);
      if (sg.closingStrategy)
        lines.push(`Closing Strategy: ${sg.closingStrategy}`);
      if (sg.avoidTopics && sg.avoidTopics.length > 0) {
        lines.push(`Topics to Avoid: ${sg.avoidTopics.join(", ")}`);
      }
    }

    // === Additional Context ===
    if (project.aiContext) {
      const ctx = project.aiContext;
      const hasContent =
        ctx.competitors?.length ||
        ctx.references?.length ||
        ctx.additionalNotes;
      if (hasContent) {
        lines.push(`\n## Additional Context`);
        if (ctx.competitors && ctx.competitors.length > 0) {
          lines.push(
            `Competitors: ${ctx.competitors.join(", ")} (Differentiation needed)`,
          );
        }
        if (ctx.references && ctx.references.length > 0) {
          lines.push(`References: ${ctx.references.join(", ")}`);
        }
        if (ctx.additionalNotes)
          lines.push(`User Requirements: ${ctx.additionalNotes}`);
      }
    }
  }

  return lines.join("\n");
}
