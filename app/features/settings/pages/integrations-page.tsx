import { Separator } from "~/common/components/ui/separator";

export const meta = () => {
  return [
    { title: "Integrations | TubeGAI" },
    { name: "description", content: "Manage your integrations." },
  ];
};

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Manage integrations with YouTube and AI services.
        </p>
      </div>
      <Separator />
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Authentication and connection settings implementation coming soon.
      </div>
    </div>
  );
}
