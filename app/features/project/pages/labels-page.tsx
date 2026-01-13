import { Button } from "~/common/components/ui/button";

export const meta = () => {
  return [
    { title: "Labels | TubeGAI" },
    { name: "description", content: "Organize projects with custom labels." },
  ];
};

export default function LabelsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Labels</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Labels management coming soon.
      </div>
    </div>
  );
}
