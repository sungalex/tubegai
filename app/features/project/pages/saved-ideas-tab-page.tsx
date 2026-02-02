import { useState } from "react";
import type { Route } from "./+types/saved-ideas-tab-page";
import { SavedIdeasSection } from "../components/saved-ideas-section";
import { getSavedIdeas } from "~/common/data/ideation.data.server";
import { requireAuth } from "~/lib/auth.server";
import type { SavedIdea } from "~/common/types/ideation.types";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);

  const savedIdeas = await getSavedIdeas(userId);

  return {
    savedIdeas,
  };
}

export default function SavedIdeasTabPage({ loaderData }: Route.ComponentProps) {
  const { savedIdeas: initialSavedIdeas } = loaderData;
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>(initialSavedIdeas);

  const handleDeleteIdea = (ideaId: string) => {
    setSavedIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));
  };

  const handleEditIdea = (updatedIdea: SavedIdea) => {
    setSavedIdeas((prev) =>
      prev.map((idea) => (idea.id === updatedIdea.id ? updatedIdea : idea))
    );
  };

  return (
    <SavedIdeasSection
      ideas={savedIdeas}
      onDelete={handleDeleteIdea}
      onEdit={handleEditIdea}
    />
  );
}
