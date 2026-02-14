import { useState, useEffect } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import { Label } from "~/common/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/common/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/common/components/ui/select";
import type { SavedIdea } from "~/common/types/ideation.types";

interface EditIdeaDialogProps {
  idea: SavedIdea | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedIdea: SavedIdea) => void;
}

export function EditIdeaDialog({ idea, open, onOpenChange, onSave }: EditIdeaDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hooks, setHooks] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState("");
  const [estimatedViews, setEstimatedViews] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when idea changes
  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setDescription(idea.description);
      setHooks([...idea.hooks]);
      setTargetAudience(idea.targetAudience);
      setEstimatedViews(idea.estimatedViews);
      setDifficulty(idea.difficulty);
    }
  }, [idea]);

  const handleAddHook = () => {
    setHooks([...hooks, ""]);
  };

  const handleRemoveHook = (index: number) => {
    setHooks(hooks.filter((_, i) => i !== index));
  };

  const handleHookChange = (index: number, value: string) => {
    const newHooks = [...hooks];
    newHooks[index] = value;
    setHooks(newHooks);
  };

  const handleSave = async () => {
    if (!idea) return;

    // Validate
    if (!title.trim()) {
      toast.error("제목을 입력해주세요");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId: idea.id,
          updates: {
            title: title.trim(),
            description: description.trim(),
            hooks: hooks.filter((h) => h.trim() !== ""),
            targetAudience: targetAudience.trim(),
            estimatedViews: estimatedViews.trim(),
            difficulty,
          },
        }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error("아이디어 수정에 실패했습니다", { description: data.error });
        return;
      }

      toast.success("아이디어가 수정되었습니다");
      onSave(data.idea);
      onOpenChange(false);
    } catch (error) {
      toast.error("아이디어 수정에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>아이디어 편집</DialogTitle>
          <DialogDescription>저장된 아이디어의 내용을 수정합니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="아이디어 제목을 입력하세요"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="아이디어에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          {/* Hooks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>훅 아이디어</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddHook}>
                <Plus className="h-3 w-3 mr-1" />
                훅 추가
              </Button>
            </div>
            <div className="space-y-2">
              {hooks.map((hook, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={hook}
                    onChange={(e) => handleHookChange(index, e.target.value)}
                    placeholder="훅 아이디어를 입력하세요"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveHook(index)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {hooks.length === 0 && (
                <p className="text-sm text-muted-foreground">훅이 없습니다. 훅을 추가해보세요.</p>
              )}
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="targetAudience">타겟 오디언스</Label>
            <Input
              id="targetAudience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="타겟 오디언스를 입력하세요"
            />
          </div>

          {/* Estimated Views & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedViews">예상 조회수</Label>
              <Input
                id="estimatedViews"
                value={estimatedViews}
                onChange={(e) => setEstimatedViews(e.target.value)}
                placeholder="e.g., 10K-50K"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">난이도</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">쉬움</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="hard">어려움</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
