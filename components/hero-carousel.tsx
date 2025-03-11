"use client"
import * as React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
} from "@/components/ui/carousel";

export function HeroCarousel() {
  const [scrollY, setScrollY] = useState(0);

  // Update scrollY value on scroll for parallax effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <Carousel className="w-full z-10 relative" opts={{ loop: true }}>
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index} className="h-full">
              <div className="p-0">
                <Card className="rounded-none">
                  <CardContent className="flex items-center justify-center m-0 p-0 overflow-hidden">
                    {/* Image with subtle parallax effect */}
                    <img
                      src="https://placehold.co/600x400"
                      alt={`hero-carousel-${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300"
                      style={{
                        height: "calc(90vh - 112px)",
                        transform: `translateY(${scrollY * 0.1}px)`, // Subtle parallax effect
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation buttons with gradient fade */}
        <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 rounded-none h-full w-1/3 
      bg-gradient-to-l from-transparent to-black/50 opacity-0 transition-opacity duration-500 hover:opacity-100" />
        <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 rounded-none h-full w-1/3 
      bg-gradient-to-r from-transparent to-black/50 opacity-0 transition-opacity duration-500 hover:opacity-100" />

        <CarouselDots />

        {/* Decorative Shape Divider */}
        <div className="custom-shape-divider-bottom-1741703122">
          <svg
            data-name="Layer 1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="fill-background"
          >
            <path
              d="M600,112.77C268.63,112.77,0,65.52,0,7.23V120H1200V7.23C1200,65.52,931.37,112.77,600,112.77Z"
              className="shape-fill"
            ></path>
          </svg>
        </div>
      </Carousel>
    </div>
  );
}
