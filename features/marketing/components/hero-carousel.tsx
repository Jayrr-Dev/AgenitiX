"use client";
import dynamic from "next/dynamic";
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
// import LoadingCarousel from "./loading-carousel"; 
// const VideoCarousel = dynamic(() => import("./video-carousel").then(mod => mod.videoCarousel), { ssr: false, loading: () => <LoadingCarousel/> });

export function HeroCarousel() {
  const [scrollY, setScrollY] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  
  // Slide content with unique messages and CTAs
  const slides = [
    {
      type: "video",
      src: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxS5sxJF7h0jeaV8R3woxgAG7Lr6ib5TOkcHXC",
      message: "Proven Solutions for Engineering Reliability",
      ctaText: "Discover How",
      ctaLink: "/about"
    },
    {
      type: "video",
      src: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOox2bSnnjhI5vdYi6q1rEpygWQ4G3zfKUxeusR7",
      message: "Empowering utilities across Alberta",
      ctaText: "Our Impact",
      ctaLink: "/projects"
    },
    {
      type: "video",
      src: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxkIIrjof2IctWSx5udkeCYzHQF1w0norGhilm",
      message: "Applying Cutting-edge technology for service excellence",
      ctaText: "See Solutions",
      ctaLink: "/expertise"
    },
    {
      type: "video",
      src: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxAAk0Hu3HqjTl9NXwnEZku5Jao6813Kd7LUiM",
      message: "Streamline projects with expert solutions",
      ctaText: "Explore Services",
      ctaLink: "/expertise"
    },
    {
      type: "video",
      src: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxU1NtRfVEzhbKyMT2ALI95efgRZFtW68dpsxO",
      message: "Recuiting the best in Electrical Engineering Design",
      ctaText: "Get Started",
      ctaLink: "/careers"
    }
  ];

  // Track embla carousel's active index
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setActiveIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    // Initial call to set the active index on mount
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Auto-scroll carousel
  useEffect(() => {
    if (!emblaApi) return;
    
    const interval = setInterval(() => {
      emblaApi.scrollNext();
      }, 9500); // Change slide every x seconds
    
    return () => clearInterval(interval);
  }, [emblaApi]);

  // Update scrollY value on scroll for parallax effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  // Animation variants for the message card
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.3, ease: "easeIn" }
    }
  };

  // Animation variants for the button
  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { delay: 0.3, duration: 0.5, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: { duration: 0.2, ease: "easeIn" }
    }
  };

  return (
    <div className="relative overflow-hidden">
      <div ref={emblaRef} className="w-full z-10 relative overflow-hidden">
        <div className="flex">
          {slides.map((slide, index) => (
            <div 
              key={index} 
              className="relative flex-[0_0_100%] min-w-0"
              style={{ overflow: "hidden" }}
            >
              <Card className="rounded-none">
                <CardContent className="flex items-center justify-center m-0 p-0 overflow-hidden">
                  {slide.type === "video" ? (
                    // <VideoCarousel src={slide.src} /> 
                    <video
                      ref={videoRef}
                      src={slide.src}
                      autoPlay
                      muted
                      playsInline
                      loop
                      className="w-full h-full object-cover"
                      style={{ height: "calc(90vh - 112px)" }}
                    />
                  ) : (
                    <img
                      src={slide.src}
                      alt={`hero-carousel-${index + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300"
                      style={{
                        height: "calc(90vh - 112px)",
                        transform: `translateY(${scrollY * 0.1}px)`,
                      }}
                    />
                  )}
                  
                  {/* Animated Message Card with CTA */}
                  <AnimatePresence mode="wait">
                    {activeIndex === index && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={cardVariants}
                          key={`card-${index}`}
                          className="w-full max-w-7xl mx-4"
                        >
                              <motion.div variants={buttonVariants}>
                          <Card className="bg-transparent border-none">
                            <CardContent className="flex flex-col items-center text-center gap-6 p-8">
                              <h2 className="lg:text-6xl text-4xl text-white/95 font-['Impact'] italic drop-shadow-[0_5px_5px_rgba(0,0,0,0.9)] ">{slide.message.toUpperCase()}</h2>
                                <Button 
                                  size="lg" 
                                  className="bg-black/80 hover:bg-black/40 font-semibold mt-12 px-16 py-0 text-shadow-[0_0_1px_#000,0_0_1px_#000,0_0_1px_#000,0_0_1px_#000]  border-none text-lg text-white rounded-none  "
                                  onClick={() => window.location.href = slide.ctaLink}
                                >
                                  {slide.ctaText}
                                </Button>
                            </CardContent>
                          </Card>
                              </motion.div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        
        {/* Navigation buttons */}
        <button 
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-none h-full w-1/3 
            bg-linear-to-l from-transparent to-black/50 opacity-0 transition-opacity duration-500 hover:opacity-100 z-10"
          onClick={() => emblaApi?.scrollPrev()}
        />
        <button 
          className="absolute right-0 top-1/2 -translate-y-1/2 rounded-none h-full w-1/3 
            bg-linear-to-r from-transparent to-black/50 opacity-0 transition-opacity duration-500 hover:opacity-100 z-10"
          onClick={() => emblaApi?.scrollNext()}
        />
        
        {/* Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-50">
          {slides.map((_, index) => (
            <button
              key={`dot-${index}`}
              className={`w-3 h-3 rounded-full transition-all ${
                activeIndex === index 
                  ? "bg-primary scale-100" 
                  : "bg-primary/30 scale-90"
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>
        
        {/* Decorative Shape Divider */}
        <div className="custom-shape-divider-bottom-1741703122 absolute bottom-0 left-0 right-0 z-20">
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
      </div>
    </div>
  );
}