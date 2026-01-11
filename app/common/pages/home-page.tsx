import type { Route } from "../../routes/+types/home-page";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "TubeGai" },
    { name: "description", content: "Welcome to TubeGai!" },
  ];
}

export default function HomePage() {
  return (
    <div>
      <h1>Welcome to TubeGai</h1>
    </div>
  )
}
