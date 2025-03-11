import { FC } from "react";
import { notFound } from "next/navigation";

interface ProjectPageProps {
  params: { projectId: string };
}

const ProjectPage: FC<ProjectPageProps> = ({ params }) => {
  const { projectId } = params;

  // Example: Handle non-existent projects
  const validProjects = ["edmonton-substation", "calgary-distribution","fort-mcmurray-microgrid"];
  if (!validProjects.includes(projectId)) return notFound();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Project: {projectId}</h1>
      <p>Details about {projectId}...</p>
    </main>
  );
};

export default ProjectPage;