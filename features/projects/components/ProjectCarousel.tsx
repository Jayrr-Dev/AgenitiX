"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import slugify from "slugify";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
} from "@/components/ui/carousel";
import { ArrowRight } from "lucide-react";

/** Domain model for a project slide */
interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
}

/** Props accepted by the ProjectCarousel component */
interface ProjectCarouselProps {
  projects: Project[];
}

export function ProjectCarousel({ projects }: ProjectCarouselProps) {
  return (
    <Carousel
      /* Embla options */
      opts={{ align: "start", loop: true }}
      className="w-full relative"
    >
      <CarouselContent className="-ml-4">
        {projects.map((project) => (
          <CarouselItem key={project.id} className="pl-4">
            {/* give each card its own stacking context */}
            <Card className="overflow-hidden relative z-10">
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-lg h-12 mb-2">
                  {project.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {project.description}
                </p>

                {/* lift the button above the wide Prev/Next hit-areas */}
                <Link
                  href={`/projects/${slugify(project.title, {
                    lower: true,
                    strict: true,
                  })}`}
                >
                  <Button
                    variant="outline"
                    className="relative z-20 w-full group hover:bg-primary hover:text-white transition-colors duration-300"
                  >
                    View Project
                    <ArrowRight
                      className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"
                    />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* lower the nav overlays just one layer */}
      <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-1/4 rounded-lg hover:bg-linear-to-l from-transparent to-black/10 text-white z-0" />
      <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-1/4 rounded-lg hover:bg-linear-to-r from-transparent to-black/10 text-white z-0" />

      <CarouselDots className="p-6 translate-y-full" />
    </Carousel>
  );
}
