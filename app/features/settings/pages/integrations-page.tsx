export const meta = () => {
  return [
    { title: "Integrations | TubeGAI" },
    { name: "description", content: "Manage your integrations." },
  ];
};

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Integrations & Settings</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        YouTube and AI service integration settings coming soon.
      </div>
    </div>
  );
}
