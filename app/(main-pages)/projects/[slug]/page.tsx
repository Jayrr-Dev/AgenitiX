// app/(main-pages)/projects/[slug]/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import ClientProjectPage from './ClientProjectPage';
import type { PageProps } from '@/types/page';
import { notFound } from 'next/navigation';
import { use } from 'react';
export const revalidate = 60;

type Params = { 
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  return (
   
    <HydrationBoundary>
      <ClientProjectPage />
    </HydrationBoundary>
  );
}
