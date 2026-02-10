import { useState } from "react";
import type { Route } from "./+types/saved-ideas-tab-page";
import { IdeasSection } from "../components/ideas-section";
import { getIdeas } from "~/common/data/idea.data.server";
import { requireAuth } from "~/lib/auth.server";
import type { Idea } from "~/common/types/ideation.types";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);

  // Get only saved ideas (isSaved=true)
  const savedIdeas = await getIdeas(userId, { isSaved: true });

  return {
    savedIdeas,
  };
}

export default function SavedIdeasTabPage({ loaderData }: Route.ComponentProps) {
  const { savedIdeas: initialSavedIdeas } = loaderData;
  const [ideas, setIdeas] = useState<Idea[]>(initialSavedIdeas);

  return (
    <IdeasSection
      ideas={ideas}
      onIdeasChange={setIdeas}
      showTabs={false}
      defaultTab="saved"
      title="저장된 아이디어"
      emptyMessage="저장된 아이디어가 없습니다"
    />
  );
}
