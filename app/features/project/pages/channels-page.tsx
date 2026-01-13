import { Button } from "~/common/components/ui/button";

export const meta = () => {
  return [
    { title: "Channels | TubeGAI" },
    { name: "description", content: "Manage your connected YouTube channels." },
  ];
};

export default function ChannelsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Channels</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Channels management coming soon.
      </div>
    </div>
  );
}
