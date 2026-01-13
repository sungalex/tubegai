export const meta = () => {
  return [
    { title: "Profile | TubeGAI" },
    { name: "description", content: "Manage your profile settings." },
  ];
};

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Profile & Account</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        User profile management implementation coming soon.
      </div>
    </div>
  );
}
