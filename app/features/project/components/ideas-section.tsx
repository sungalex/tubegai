/**
 * Unified IdeasSection Component
 *
 * Displays a filterable list of ideas (both AI-generated and user-saved)
 * with tabs for filtering by source/status.
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Zap,
  Bookmark,
  Lightbulb,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/common/components/ui/dialog";
import { IdeaCard } from "./idea-card";
import { EditIdeaDialog } from "./edit-idea-dialog";
import type { Idea, SavedIdea } from "~/common/types/ideation.types";
import { ideaToSavedIdea } from "~/common/types/ideation.types";
import { cn } from "~/lib/utils";

export type IdeaFilterTab = "all" | "ai_generated" | "saved";

export interface IdeasSectionProps {
  ideas: Idea[];
  onIdeasChange?: (ideas: Idea[]) => void;
  onGenerateAI?: () => void;
  isGeneratingAI?: boolean;
  showTabs?: boolean;
  defaultTab?: IdeaFilterTab;
  title?: string;
  emptyMessage?: string;
  itemsPerPage?: number;
}

const ITEMS_PER_PAGE = 6;

export function IdeasSection({
  ideas,
  onIdeasChange,
  onGenerateAI,
  isGeneratingAI = false,
  showTabs = true,
  defaultTab = "all",
  title,
  emptyMessage = "아이디어가 없습니다",
  itemsPerPage = ITEMS_PER_PAGE,
}: IdeasSectionProps) {
  const [activeTab, setActiveTab] = useState<IdeaFilterTab>(defaultTab);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Idea[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Filter ideas based on active tab
  const filteredIdeas = useMemo(() => {
    switch (activeTab) {
      case "ai_generated":
        return ideas.filter((idea) => idea.source === "ai_generated" && !idea.isSaved);
      case "saved":
        return ideas.filter((idea) => idea.isSaved);
      default:
        return ideas;
    }
  }, [ideas, activeTab]);

  // Pagination
  const totalPages = Math.ceil(filteredIdeas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIdeas = filteredIdeas.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filter changes or exceeds total pages
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  // Counts for badges
  const aiCount = ideas.filter((idea) => idea.source === "ai_generated" && !idea.isSaved).length;
  const savedCount = ideas.filter((idea) => idea.isSaved).length;

  // Handle save (bookmark) an AI idea
  const handleSave = async (ideaId: string) => {
    setSavingIds((prev) => new Set([...prev, ideaId]));

    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "save", ideaId }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error("저장 실패", { description: data.error });
        return;
      }

      toast.success("아이디어가 저장되었습니다");

      // Update local state
      if (onIdeasChange) {
        const updatedIdeas = ideas.map((idea) =>
          idea.id === ideaId ? { ...idea, isSaved: true, expiresAt: undefined } : idea
        );
        onIdeasChange(updatedIdeas);
      }
    } catch (error) {
      toast.error("저장 실패");
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(ideaId);
        return next;
      });
    }
  };

  // Handle use an idea
  const handleUse = (idea: Idea) => {
    navigate("/projects/new", {
      state: {
        topic: idea.title,
        hooks: idea.hooks,
        ideaId: idea.id,
      },
    });
  };

  // Handle edit
  const handleEdit = (idea: Idea) => {
    setEditingIdea(idea);
    setIsEditDialogOpen(true);
  };

  // Handle edit save
  const handleEditSave = async (updatedSavedIdea: SavedIdea) => {
    try {
      const response = await fetch("/api/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId: updatedSavedIdea.id,
          updates: {
            title: updatedSavedIdea.title,
            description: updatedSavedIdea.description,
            hooks: updatedSavedIdea.hooks,
            targetAudience: updatedSavedIdea.targetAudience,
            estimatedViews: updatedSavedIdea.estimatedViews,
            difficulty: updatedSavedIdea.difficulty,
          },
        }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error("수정 실패", { description: data.error });
        return;
      }

      toast.success("아이디어가 수정되었습니다");

      // Update local state
      if (onIdeasChange && data.idea) {
        const updatedIdeas = ideas.map((idea) =>
          idea.id === data.idea.id ? data.idea : idea
        );
        onIdeasChange(updatedIdeas);
      }
    } catch (error) {
      toast.error("수정 실패");
    }
  };

  // Handle delete
  const handleDelete = async (ideaId: string) => {
    setDeletingIds((prev) => new Set([...prev, ideaId]));

    try {
      const response = await fetch("/api/ideas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error("삭제 실패", { description: data.error });
        return;
      }

      toast.success("아이디어가 삭제되었습니다");

      // Update local state
      if (onIdeasChange) {
        const updatedIdeas = ideas.filter((idea) => idea.id !== ideaId);
        onIdeasChange(updatedIdeas);
      }
    } catch (error) {
      toast.error("삭제 실패");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(ideaId);
        return next;
      });
    }
  };

  // Handle regenerate from AI idea
  const handleRegenerate = (idea: Idea) => {
    // This will open the idea generator dialog with the idea's context
    // For now, just trigger the AI generation
    onGenerateAI?.();
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "search", query: searchQuery }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error("검색 실패", { description: data.error });
        return;
      }

      setSearchResults(data.ideas || []);
    } catch {
      toast.error("검색 실패");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle applying search results to the main list
  const handleApplySearchResults = () => {
    if (onIdeasChange && searchResults.length > 0) {
      onIdeasChange(searchResults);
      setIsSearchDialogOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      toast.success(`${searchResults.length}개의 검색 결과를 적용했습니다`);
    }
  };

  // Reset search and show all ideas
  const handleResetSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  // Empty state
  if (ideas.length === 0 && !isGeneratingAI) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Lightbulb className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">{emptyMessage}</h3>
        <p className="text-muted-foreground text-sm max-w-md mb-4">
          AI 추천을 생성하거나 트렌드에서 아이디어를 저장하세요.
        </p>
        {onGenerateAI && (
          <Button onClick={onGenerateAI} disabled={isGeneratingAI}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI 추천 생성
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {title && (
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              {title}
            </h3>
          )}
          <p className="text-muted-foreground text-sm">
            총 {ideas.length}개의 아이디어
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search Dialog */}
          <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                아이디어 검색
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>아이디어 검색</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                {/* Search Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="제목, 설명, 훅, 트렌드 키워드로 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={handleResetSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Search Results */}
                <div className="flex-1 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {searchResults.length}개의 결과
                        </p>
                        <Button
                          size="sm"
                          onClick={handleApplySearchResults}
                        >
                          검색 결과 적용
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        {searchResults.map((idea) => (
                          <div
                            key={idea.id}
                            className="p-3 border rounded-lg bg-card"
                          >
                            <h4 className="font-medium">{idea.title}</h4>
                            {idea.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {idea.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {idea.isSaved && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  저장됨
                                </span>
                              )}
                              {idea.source === "ai_generated" && (
                                <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded">
                                  AI 추천
                                </span>
                              )}
                              {idea.hooks && idea.hooks.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  훅 {idea.hooks.length}개
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : searchQuery && !isSearching ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Search className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        검색 결과가 없습니다
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Search className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        검색어를 입력하세요
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        제목, 설명, 훅, 트렌드 키워드에서 검색합니다
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* AI Generate Button */}
          {onGenerateAI && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateAI}
              disabled={isGeneratingAI}
            >
              {isGeneratingAI ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI 추천 생성
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {showTabs && (
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as IdeaFilterTab);
          setCurrentPage(1);
        }}>
          <TabsList>
            <TabsTrigger value="all">
              전체 ({ideas.length})
            </TabsTrigger>
            <TabsTrigger value="ai_generated">
              <Zap className="h-4 w-4 mr-1" />
              AI 추천 ({aiCount})
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Bookmark className="h-4 w-4 mr-1" />
              저장됨 ({savedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            {activeTab === "ai_generated" ? (
              <Zap className="h-6 w-6 text-muted-foreground" />
            ) : (
              <Bookmark className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {activeTab === "ai_generated"
              ? "AI 추천 아이디어가 없습니다. AI 추천을 생성해보세요."
              : "저장된 아이디어가 없습니다. AI 추천에서 아이디어를 저장해보세요."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onSave={handleSave}
              onUse={handleUse}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRegenerate={handleRegenerate}
              isDeleting={deletingIds.has(idea.id)}
              isSaving={savingIds.has(idea.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredIdeas.length)} / {filteredIdeas.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              이전
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // Show pages around current page
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              다음
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editingIdea && (
        <EditIdeaDialog
          idea={ideaToSavedIdea(editingIdea)}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}
