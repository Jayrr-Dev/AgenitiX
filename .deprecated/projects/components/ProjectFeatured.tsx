// components/FeaturedProjects.tsx
"use client";

import { Button } from "@/components/ui/button";
import type { ProjectShowcase } from "@/features/projects/types/project_types";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import slugify from "slugify";

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
	return (
		<div className="mb-20">
			<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"></div>
		</div>
	);
}
