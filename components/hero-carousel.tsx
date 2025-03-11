import * as React from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
  CarouselContainer,
} from "@/components/ui/carousel"
 
export function HeroCarousel() {
  return (
    <Carousel className="w-full z-10 relative" opts={{ loop: true}} >
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index} className="h-full ">
            <div className="p-0">
              <Card className="rounded-none ">
                <CardContent className="flex items-center justify-center m-0 p-0">
                  <img src="https://placehold.co/600x400" alt="hero-carousel-1" className="w-full h-full object-cover" style={{ height: "calc(90vh - 112px)" }} />
                
                </CardContent>
              
              </Card>
             
            </div>
          </CarouselItem>
        ))}
        
      </CarouselContent>
      <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 rounded-none h-full w-1/3 
    bg-gradient-to-l from-transparent to-black/50 opacity-0 transition-opacity duration-500 hover:opacity-100" />

    <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 rounded-none h-full w-1/3 
        bg-gradient-to-r from-transparent to-black/50 opacity-0 transition-opacity duration-500 hover:opacity-100" />
      <CarouselDots />
      <div className="custom-shape-divider-bottom-1741703122">
            <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M600,112.77C268.63,112.77,0,65.52,0,7.23V120H1200V7.23C1200,65.52,931.37,112.77,600,112.77Z" className="shape-fill"></path>
            </svg>
        </div>
    </Carousel>
  )
}