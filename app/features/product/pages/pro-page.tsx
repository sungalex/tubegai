import { Button } from "~/common/components/ui/button";

export const meta = () => {
  return [
    { title: "TubeGAI Pro | TubeGAI" },
    { name: "description", content: "Advanced analytics and unlimited AI generation." },
  ];
};

export default function ProPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">TubeGAI Pro</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        TubeGAI Pro features coming soon.
      </div>
    </div>
  );
}
