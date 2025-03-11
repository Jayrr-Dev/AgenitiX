import { notFound } from "next/navigation";

// Remove the FC generic type and simply define the props interface
interface ProjectPageProps {
  params: { projectId: string };
}

// Define as a regular function component without FC<>
export default function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = params;

  // Example: Handle non-existent projects
  const validProjects = ["edmonton-substation", "calgary-distribution", "fort-mcmurray-microgrid"];
  if (!validProjects.includes(projectId)) return notFound();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Project: {projectId}</h1>
      <p>Details about {projectId}...</p>
    </main>
  );
}