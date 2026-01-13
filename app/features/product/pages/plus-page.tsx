import { Button } from "~/common/components/ui/button";

export const meta = () => {
  return [
    { title: "TubeGAI Plus | TubeGAI" },
    { name: "description", content: "Enterprise solutions for teams and agencies." },
  ];
};

export default function PlusPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">TubeGAI Plus</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        TubeGAI Plus features coming soon.
      </div>
    </div>
  );
}
