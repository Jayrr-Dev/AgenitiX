// app/(main-pages)/projects/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import ClientProjectsPage from '@/app/(main-pages)/projects/ClientProjectsPage';

export const revalidate = 60; // ISR every 60 seconds

export default async function ProjectsPage() {
  const queryClient = new QueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientProjectsPage />
    </HydrationBoundary>
  );
}