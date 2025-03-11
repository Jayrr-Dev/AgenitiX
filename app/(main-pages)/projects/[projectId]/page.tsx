import { notFound } from "next/navigation";

// Define the props interface for Next.js page component
interface PageProps {
  params: {
    projectId: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
}

export default function ProjectPage({ params }: PageProps) {
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
