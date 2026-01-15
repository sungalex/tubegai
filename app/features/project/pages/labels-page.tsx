import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  MoreHorizontal,
  Search,
  Tag,
  Pencil,
  Trash2
} from "lucide-react";

import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/common/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/common/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/common/components/ui/dialog";
import { Badge } from "~/common/components/ui/badge";
import { Label as UILabel } from "~/common/components/ui/label";
import { cn } from "~/lib/utils";

export const meta = () => {
  return [
    { title: "Labels | TubeGAI" },
    { name: "description", content: "Organize projects with custom labels." },
  ];
};

interface Label {
  id: string;
  name: string;
  color: string;
  description: string;
  projectCount: number;
}

const COLORS = [
  { name: "Red", value: "bg-red-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Amber", value: "bg-amber-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Slate", value: "bg-slate-500" },
];

const initialLabels: Label[] = [
  { id: "1", name: "Urgent", color: "bg-red-500", description: "High priority tasks", projectCount: 5 },
  { id: "2", name: "In Progress", color: "bg-blue-500", description: "Currently working on", projectCount: 12 },
  { id: "3", name: "Review", color: "bg-amber-500", description: "Needs review", projectCount: 3 },
  { id: "4", name: "Marketing", color: "bg-purple-500", description: "Related to marketing campaigns", projectCount: 8 },
];

export default function LabelsPage() {
  const [labels, setLabels] = useState<Label[]>(initialLabels);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLabel, setCurrentLabel] = useState<Partial<Label>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLabels = labels.filter(label =>
    label.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    label.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setIsEditing(false);
    setCurrentLabel({ color: "bg-slate-500" });
    setIsDialogOpen(true);
  };

  const handleEdit = (label: Label) => {
    setIsEditing(true);
    setCurrentLabel({ ...label });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setLabels(labels.filter(l => l.id !== id));
    toast.success("Label deleted successfully.");
  };

  const handleSave = () => {
    if (!currentLabel.name) {
      toast.error("Label name is required.");
      return;
    }

    if (isEditing && currentLabel.id) {
      setLabels(labels.map(l => l.id === currentLabel.id ? { ...l, ...currentLabel } as Label : l));
      toast.success("Label updated successfully.");
    } else {
      const newLabel: Label = {
        id: Math.random().toString(36).substr(2, 9),
        name: currentLabel.name,
        color: currentLabel.color || "bg-slate-500",
        description: currentLabel.description || "",
        projectCount: 0,
      };
      setLabels([...labels, newLabel]);
      toast.success("Label created successfully.");
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Labels</h1>
          <p className="text-muted-foreground mt-1">
            Create and organize labels for your projects.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Label
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search labels..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="secondary">조회</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px] text-center">Projects</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLabels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              filteredLabels.map((label) => (
                <TableRow key={label.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded-full", label.color)} />
                      <span className="font-medium">{label.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {label.description}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-normal">
                      {label.projectCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(label)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(label.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Label" : "Create Label"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Make changes to your label here." : "Add a new label to organize your projects."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <UILabel htmlFor="name">Name</UILabel>
              <Input
                id="name"
                value={currentLabel.name || ""}
                onChange={(e) => setCurrentLabel({ ...currentLabel, name: e.target.value })}
                placeholder="e.g. Urgent"
              />
            </div>
            <div className="grid gap-2">
              <UILabel htmlFor="description">Description</UILabel>
              <Input
                id="description"
                value={currentLabel.description || ""}
                onChange={(e) => setCurrentLabel({ ...currentLabel, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="grid gap-2">
              <UILabel>Color</UILabel>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setCurrentLabel({ ...currentLabel, color: color.value })}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      color.value,
                      currentLabel.color === color.value ? "border-foreground" : "border-transparent"
                    )}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
