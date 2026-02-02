import { useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/trends-tab-page";
import { TrendAnalyzer } from "../components/trend-analyzer";
import { getTrends } from "~/common/data/project.data.server";
import { getAIRecommendationsForUser } from "~/common/data/ai-recommendation.data.server";
import { requireAuth } from "~/lib/auth.server";
import type { SavedIdea } from "~/common/types/ideation.types";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);

  const trends = await getTrends();
  const recommendations = await getAIRecommendationsForUser(userId, trends, {
    count: 3,
    language: "ko",
  });

  return {
    trends,
    recommendations,
  };
}

export default function TrendsTabPage({ loaderData }: Route.ComponentProps) {
  const { trends, recommendations: initialRecommendations } = loaderData;
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const navigate = useNavigate();

  const handleSaveIdea = (_idea: SavedIdea) => {
    // Navigate to saved ideas tab after saving
    navigate("/projects/saved-ideas");
  };

  const handleRefreshRecommendations = (newRecommendations: typeof recommendations) => {
    setRecommendations(newRecommendations);
  };

  return (
    <TrendAnalyzer
      trends={trends}
      recommendations={recommendations}
      onSaveIdea={handleSaveIdea}
      onRefreshRecommendations={handleRefreshRecommendations}
    />
  );
}
