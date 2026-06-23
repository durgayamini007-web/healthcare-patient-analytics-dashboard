import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div>
      <h1>Healthcare Patient Analytics Dashboard</h1>
      <p>Select a dashboard section.</p>
    </div>
  );
}n 
