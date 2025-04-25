// components/ProjectGallery.tsx
'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
//get images from project_showcase table
import { getAllProjectShowcases } from '../lib/api/getProjectShowcases';
import slugify from 'slugify';
import Link from 'next/link';

export default function ProjectGallery() {
    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: () => getAllProjectShowcases(),
    });
    
  return (
    <div className="mb-20">
     
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {projects?.map(project => (
          <Link 
            key={project.project_id}
            href={`/projects/${slugify(project.title, { lower: true, strict: true })}`}
          >
            <div className="relative h-48 md:h-64 rounded-lg overflow-hidden group">
              <Image
                src={project.imageUrl}
                alt={`Project image ${project.title || ''}`}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black bg-opacity-85 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-white text-lg font-semibold text-center px-2">
                  {project.title}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
