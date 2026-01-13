import { useParams } from "react-router";

export const meta = () => {
  return [
    { title: "Studio | TubeGAI" },
    { name: "description", content: "Overview of your production pipeline." },
  ];
};

export default function StudioDashboardPage() {
  const { projectId } = useParams();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Studio Dashboard</h1>
      <p className="text-gray-600">
        Project ID: {projectId}
      </p>
      <p className="mt-4 text-gray-500 italic">
        Process diagram and progress visualization will be implemented here.
      </p>
    </div>
  );
}
