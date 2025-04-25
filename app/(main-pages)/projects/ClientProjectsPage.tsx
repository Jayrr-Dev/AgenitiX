// app/(main-pages)/projects/ClientProjectsPage.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { getAllProjectShowcases } from '@/features/projects/lib/api/getProjectShowcases';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProjectCategories from '@/features/projects/components/ProjectCategories';
import ProjectGallery from '@/features/projects/components/ProjectGallery';
import ProjectTestimonials from '@/features/projects/components/ProjectTestimonials';
import ProjectCTA from '@/features/projects/components/ProjectCTA';
import { generateProjectSlug } from '@/utils/slugify';
import slugify from 'slugify';
import ProjectFeatured from '@/features/projects/components/ProjectFeatured';
//Feature Projects 

const featuredProjects = [
"dc4b1e12-69f6-4bbf-bc6b-d3ff5e6e4d00",
"ee997841-b5e2-4eb3-9687-5480cc2db705",
"f4b7b601-9c22-46b1-a6d6-86a6fca4b090",
]

export default function ClientProjectsPage() {
  const { data: showcaseProjects, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: getAllProjectShowcases,
    staleTime: 1000 * 60,
  });

  if (isLoading) return <div className="p-10 text-center">Loading projects...</div>;
  if (isError || !showcaseProjects) return <div className="p-10 text-center text-red-600">Failed to load projects.</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Projects</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Delivering innovative electrical distribution solutions across Canada with expertise and precision. Handing over <span className="font-bold">500+ projects annually</span> on time and on budget. 
        </p>
      </div>

      {/* Modular Sections */}
          {/* Featured Projects */}
      <h2 className="text-3xl font-semibold mb-8">Featured Projects</h2>
      <ProjectFeatured />
      <ProjectCategories />
       <h2 className="text-3xl font-semibold mb-8">Project Gallery</h2>
      <ProjectGallery />
      {/* <ProjectTestimonials /> */}
      <ProjectCTA />
    </div>
  );
}
