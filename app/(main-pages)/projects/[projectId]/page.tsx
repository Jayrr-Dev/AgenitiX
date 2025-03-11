'use client'
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Mock data for development
const projects = [
  {
    id: "1",
    title: "Edmonton Substation Upgrade",
    description: "Complete overhaul of a critical 138kV substation serving Edmonton's growing eastern district.",
    imageUrl: "/projects/edmonton-substation.jpg",
    category: "Substation Engineering",
    year: "2023",
    details: "<p>This comprehensive modernization project involved replacing outdated equipment with state-of-the-art digital systems, implementing advanced protection schemes, and integrating renewable energy sources.</p><p>The project was completed in phases to minimize service disruption while maintaining grid reliability throughout the transition.</p>",
    outcomes: [
      "Increased grid reliability by 35%",
      "Reduced maintenance costs by $450,000 annually",
      "Enabled integration of 15MW of distributed solar generation",
      "Improved remote monitoring capabilities and fault response time"
    ],
    contactInfo: "Our team specializes in substation modernization projects with minimal service disruption.",
    relatedProjects: [
      {
        id: "2",
        title: "Calgary Distribution Network",
        category: "Distribution Systems",
        imageUrl: "/projects/calgary-distribution.jpg"
      },
      {
        id: "3",
        title: "Fort McMurray Microgrid",
        category: "Microgrid Design",
        imageUrl: "/projects/fort-mcmurray-microgrid.jpg"
      }
    ]
  },
  {
    id: "2",
    title: "Calgary Distribution Network",
    description: "Design and implementation of a resilient distribution network for Calgary's new industrial park.",
    imageUrl: "/projects/calgary-distribution.jpg",
    category: "Distribution Systems",
    year: "2022",
    details: "<p>This project focused on creating a more efficient and reliable distribution network to support Calgary's expanding industrial sector.</p><p>The network was designed to handle the increased demand for power, while also incorporating renewable energy sources and smart grid technologies.</p>",
    outcomes: [
      "Reduced power outages by 50%",
      "Increased customer satisfaction by 30%",
      "Enabled integration of 20MW of distributed solar generation",
      "Improved network monitoring and control capabilities"
    ],
    contactInfo: "Looking for distribution network solutions? We can help with your industrial power needs.",
    relatedProjects: [
      {
        id: "1",
        title: "Edmonton Substation Upgrade",
        category: "Substation Engineering",
        imageUrl: "/projects/edmonton-substation.jpg"
      },
      {
        id: "3",
        title: "Fort McMurray Microgrid",
        category: "Microgrid Design",
        imageUrl: "/projects/fort-mcmurray-microgrid.jpg"
      }
    ]
  },
  {
    id: "3",
    title: "Fort McMurray Microgrid",
    description: "Innovative microgrid solution providing reliable power to remote industrial facilities.",
    imageUrl: "/projects/fort-mcmurray-microgrid.jpg",
    category: "Microgrid Design",
    year: "2021",
    details: "<p>This project focused on creating a more efficient and reliable distribution network to support Calgary's expanding industrial sector.</p><p>The network was designed to handle the increased demand for power, while also incorporating renewable energy sources and smart grid technologies.</p>",  
    outcomes: [
      "Reduced power outages by 50%",
      "Increased customer satisfaction by 30%",
      "Enabled integration of 20MW of distributed solar generation",
      "Improved network monitoring and control capabilities"
    ],
    contactInfo: "Interested in microgrid solutions for remote locations? Contact our specialized team.",
    relatedProjects: [
      {
        id: "1",
        title: "Edmonton Substation Upgrade",
        category: "Substation Engineering",
        imageUrl: "/projects/edmonton-substation.jpg"
      },
      {
        id: "2",
        title: "Calgary Distribution Network",
        category: "Distribution Systems",
        imageUrl: "/projects/calgary-distribution.jpg"
      }
    ]
  }
];


// Function to get project by ID
const getProjectById = (id: string) => {
  return projects.find(project => project.id === id);
};

export default async function PostPage({ params }: { params: { projectId: string } }) { 
  const projectId = params.projectId;
  const project = getProjectById(projectId);
  
  if (!project) {
    notFound();
  }
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/projects" className="text-[#f6733c] hover:text-[#e45f2d] flex items-center gap-2">
          <span>←</span> Back to Projects
        </Link>
      </div>
      
      <div className="grid md:grid-cols-2 gap-12 items-start">
        <div className="relative h-[400px] rounded-xl overflow-hidden">
          <Image
            src={project.imageUrl || "/project-placeholder.jpg"}
            alt={project.title}
            fill
            className="object-cover"
            priority
          />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold mb-4">{project.title}</h1>
          <div className="flex gap-4 mb-6">
            <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm">
              {project.category}
            </span>
            <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm">
              {project.year}
            </span>
          </div>
          
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg mb-4">{project.description}</p>
            
            {project.details && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Project Details</h2>
                <div dangerouslySetInnerHTML={{ __html: project.details }} />
              </div>
            )}
            
            {project.outcomes && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Outcomes</h2>
                <ul className="list-disc pl-5 space-y-2">
                  {project.outcomes.map((outcome: string, index: number) => (
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
                <Button className="bg-[#f6733c] hover:bg-[#e45f2d]">
                  Contact Our Team
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {project.relatedProjects && project.relatedProjects.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-bold mb-8">Related Projects</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {project.relatedProjects.map((relatedProject: {id: string, title: string, category: string, imageUrl?: string}) => (
              <Link 
                href={`/projects/${relatedProject.id}`} 
                key={relatedProject.id}
                className="group"
              >
                <div className="relative h-[200px] mb-4 overflow-hidden rounded-lg">
                  <Image
                    src={relatedProject.imageUrl || "/project-placeholder.jpg"}
                    alt={relatedProject.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <h3 className="font-semibold text-lg group-hover:text-[#f6733c]">
                  {relatedProject.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {relatedProject.category}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
