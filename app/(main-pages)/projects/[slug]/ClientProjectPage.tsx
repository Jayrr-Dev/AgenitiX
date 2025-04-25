// app/(main-pages)/projects/[projectId]/ClientProjectPage.tsx
'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProjectShowcase } from '@/features/projects/hooks/useProjectShowcase';

type Props = {
  projectId: string;
};

export default function ClientProjectPage({ projectId }: Props) {
  const { data: project, isLoading, isError } = useProjectShowcase(projectId);

  if (isLoading) return <div className="p-10 text-center">Loading...</div>;
  if (isError || !project) return notFound();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/projects" className="text-[#f6733c] hover:text-[#e45f2d] flex items-center gap-2">
          <span>←</span> Back to Projects
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        <div className="relative h-[768px] rounded-xl overflow-hidden">
          <Image
            src={project.imageUrl || 'https://placehold.co/660x400.png'}
            alt={project.title}
            width={660}
            height={768}
            className="object-cover"
            priority
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-4">{project.title}</h1>

          <div className="flex flex-wrap gap-2 mb-6">
          <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm">
              {project.year}
            </span>
            {project.tags?.map(tag => (
              <span key={tag.tag_id} className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm">
                {tag.tag}
              </span>
            ))}
       
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg mb-4">{project.description}</p>

            {project.details && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Project Details</h2>
                <div dangerouslySetInnerHTML={{ __html: project.details }} />
              </div>
            )}

            {project.outcomes?.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Outcomes</h2>
                <ul className="list-disc pl-5 space-y-2">
                  {project.outcomes.map((outcome, index) => (
                    <li key={index}>{outcome}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {project.contactInfo && (
            <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Interested in similar solutions?</h3>
              <p className="mb-4">{project.contactInfo}</p>
              <Link href="/contact">
                <Button className="bg-[#f6733c] hover:bg-[#e45f2d]">Contact Our Team</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {project.relatedProjects?.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-bold mb-8">Related Projects</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {project.relatedProjects.map(relatedProject => (
              <Link
                href={`/projects/${relatedProject.project_id}`}
                key={relatedProject.project_id}
                className="group"
              >
                <div className="relative h-[200px] mb-4 overflow-hidden rounded-lg">
                  <Image
                    src={relatedProject.imageUrl || '/project-placeholder.jpg'}
                    alt={relatedProject.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <h3 className="font-semibold text-lg group-hover:text-[#f6733c]">
                  {relatedProject.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {relatedProject.tags.map(tag => tag.tag).join(', ')}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
