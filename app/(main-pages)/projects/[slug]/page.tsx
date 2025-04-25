// app/(main-pages)/projects/[slug]/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { getProjectShowcaseBySlugTitle } from '@/features/projects/lib/api/getProjectShowcaseBySlugTitle';
import { getProjectShowcaseById } from '@/features/projects/lib/api/getProjectShowcaseById';
import ClientProjectPage from './ClientProjectPage';
import type { PageProps } from '@/types/page';
import { notFound } from 'next/navigation';
import { use } from 'react';
export const revalidate = 60;

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  // 1. Fetch the project by its slugified title
  const project = await getProjectShowcaseBySlugTitle(slug);
  if (!project) return notFound();

  const queryClient = new QueryClient();

  // 2. Prefetch full project data by project_id
  await queryClient.prefetchQuery({
    queryKey: ['project', project.project_id],
    queryFn: () => getProjectShowcaseById(project.project_id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientProjectPage projectId={project.project_id} />
    </HydrationBoundary>
  );
}
