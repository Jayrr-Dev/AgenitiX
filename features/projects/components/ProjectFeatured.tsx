// components/FeaturedProjects.tsx
'use client';

import { useQuery } from "@tanstack/react-query";
import Image from 'next/image';
import Link from 'next/link';
import slugify from 'slugify';
import { Button } from '@/components/ui/button';
import type { ProjectShowcase } from '@/features/projects/types/project_types';
import { getAllProjectShowcases } from "../lib/api/getProjectShowcases";

// List of hardcoded featured project IDs
const featuredProjects = [
  "dc4b1e12-69f6-4bbf-bc6b-d3ff5e6e4d00",
  "ee997841-b5e2-4eb3-9687-5480cc2db705",
  "f4b7b601-9c22-46b1-a6d6-86a6fca4b090",
];

interface FeaturedProjectsProps {
  projects: ProjectShowcase[];
}

export default function FeaturedProjects() {

    const { data: showcaseProjects, isLoading, isError } = useQuery({
        queryKey: ['projects'],
        queryFn: getAllProjectShowcases,
        staleTime: 1000 * 60,
      });
    
      if (isLoading) return <div className="p-10 text-center">Loading projects...</div>;
      if (isError || !showcaseProjects) return <div className="p-10 text-center text-red-600">Failed to load projects.</div>;


  const filteredProjects = showcaseProjects.filter(project => featuredProjects.includes(project.project_id));

  return (
    <div className="mb-20">

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map(project => (
          <div
            key={project.project_id}
            className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md transition-transform hover:scale-[1.02]"
          >
            <div className="relative h-64">
              <Image
                src={project.imageUrl || '/project-placeholder.jpg'}
                alt={project.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2 py-1 rounded-full text-sm">
                  {project.year}
                </span>
                {project.tags?.length > 0 && project.tags.map(tag => (
                  <span
                    key={tag.tag_id}
                    className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2 py-1 rounded-full text-sm"
                  >
                    {tag.tag}
                  </span>
                ))}
              </div>
              <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>

              <Link href={`/projects/${slugify(project.title, { lower: true, strict: true })}`}>
                <Button variant="outline" className="w-full">
                  View Project
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}