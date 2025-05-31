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
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { useTheme } from "next-themes";
import { imagesMarquee } from "@/features/home-page/data";
import type { typeMarqueeImages, typeSlides } from "@/features/home-page/types";
import { FlipWords } from "@/components/ui/flip-words";


interface ImageItem {
  key: string;
  url: string;
}

export function HeroCarousel() {
  const [scrollY, setScrollY] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const images: ImageItem[] = imagesMarquee.map((image: typeMarqueeImages) => ({
    key: image.key,
    url: image.url,
  }));
  const words = ["better", "cute", "beautiful", "modern"];

  // Slide content with unique messages and CTAs
  const slides: typeSlides[] = [   
    {
      type: "component",
      src:"",
      component: <ThreeDMarquee images={images.map((img) => img.url)} className="brightness-[0.5] blur-xs bg-linear-to-r from-red-500 to-blue-500" />,        
      heading: "talent acquisition in engineering",
      title: <div className="flex flex-row gap-2 uppercase"> <span className="text-white/95 "> <span className="text-white/95">testing is </span><FlipWords words={words} /></span>  </div>,
      message: "We're constantly looking for talented professionals in Electrical Engineering Design to join our innovative team and help shape the future of technology solutions.",
      ctaText: "Get Started",
      ctaLink: "/careers"
    },
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
      }, 20000); // Change slide every x seconds
    
    return () => clearInterval(interval);
  }, [emblaApi]);

  // Update scrollY value on scroll for parallax effect with throttling
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    // Add passive listener for better performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);



  // ANIMATION VARIANTS
  // Animation variants for the message card with slide-in effect from left
  const cardVariants = {
    hidden: { opacity: 0, x: -1000 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 1, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      x: 100,
      transition: { duration: 0.5, ease: "easeIn" }
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
    <div className="xdebug-blue relative overflow-hidden w-full">
      <div ref={emblaRef} className=" w-full z-10 relative overflow-hidden">
         {/* Navigation buttons */}
        

        <div className="xdebug-green lg:mx-20  flex">
          {slides.map((slide, index) => (
            <div 
              key={index} 
              className="relative flex-[0_0_100%] min-w-0"
              style={{ overflow: "hidden" }}
            >
              <Card className="rounded-none">
                <CardContent className="flex items-center justify-center m-0 p-0 overflow-hidden ">
                  {slide.type === "video" ? (
                    // VIDEO CAROUSEL
                    (<video
                      ref={videoRef}
                      src={slide.src}
                      autoPlay
                      muted
                      playsInline
                      loop
                      className="w-full object-cover brightness-[0.7]"
                      style={{ height: "calc(100vh - 96px)" }}
                    />)
                  ) : slide.type === "image" ?   (
                    // IMAGE CAROUSEL
                    (<img
                      src={slide.src}
                      alt={`hero-carousel-${index + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300"
                      style={{
                        height: "calc(100vh - 96px)",
                        transform: `translateY(${scrollY * 0.1}px)`,
                      }}
                    />)
                  ) : slide.type === "component" ? (
                    // COMPONENT CAROUSEL
                    (<div className="w-full h-full">
                      {slide.component}
                    </div>)
                  ) : null}
                  
                  {/* Animated Message Card with CTA */}
                  <AnimatePresence mode="wait">
                    {activeIndex === index && (
                      <div className="xdebug-green absolute inset-0 flex items-center">
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={cardVariants}
                          key={`card-${index}`}
                          className="w-full max-w-7xl "
                        >
                        <motion.div variants={buttonVariants}>
                          {/* Message Card */}
                          <Card className="xdebug-red bg-transparent border-none  md:pl-16 lg:pl-32 mb-52">
                            <CardContent className="flex flex-col w-3/5 gap-8">
                              {/* Subheading */}
                              <h2 className="text-xl text-white/95 font-extralight drop-shadow-[0_5px_5px_rgba(0,0,0,0.9)] ">{slide.heading.toUpperCase()}</h2>
                              {/* Heading */}
                              <h2 className="lg:text-5xl text-4xl text-white/95 font-sans font-bold drop-shadow-[0_5px_5px_rgba(0,0,0,0.9)] ">{slide.title}</h2>
                                {/* Message */}
                                <p className="hidden lg:block text-white/95 text-lg font-brand font-extralight drop-shadow-[0_5px_5px_rgba(0,0,0,0.9)] ">{slide.message}</p>
                                <div className="xdebug-green flex justify-center w-full   self-center">
                                <Button 
                                  size="lg" 
                                  className="xdebug-red  border-2 border-transparent w-full group/cta bg-fill-border hover:animate-fill-transparency"
                                  onClick={() => window.location.href = slide.ctaLink}
                                >
                                  <div className="flex flex-row gap-2 ">
                                    {slide.ctaText}
                                    <svg className="group-hover/cta:block opacity-0 group-hover/cta:opacity-100 transition-opacity duration-300" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M5.536 21.886a1 1 0 0 0 1.033-.064l13-9a1 1 0 0 0 0-1.644l-13-9A1 1 0 0 0 5 3v18a1 1 0 0 0 .536.886"/></svg>
                                  </div>
                                </Button>
                                </div>
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
        
        <button 
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-none h-full w-1/5 
            bg-linear-to-l from-transparent to-black/50 opacity-0 transition-opacity duration-500 hover:opacity-100 z-10"
          onClick={() => emblaApi?.scrollPrev()}
        />
        <button 
          className="absolute right-0 top-1/2 -translate-y-1/2 rounded-none h-full w-1/5 
            bg-linear-to-r from-transparent to-black/50 opacity-0 transition-opacity duration-500 hover:opacity-100 z-10"
          onClick={() => emblaApi?.scrollNext()}
        />

            {/* Carousel Dots */}
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
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none"  fill="background">
        <path d="M598.97 114.72L0 0 0 120 1200 120 1200 0 598.97 114.72z" ></path>
    </svg>
        </div>

        <div className="custom-shape-divider-top-1745800192 absolute bottom-0 left-0 right-0 z-20">
    
</div>
      </div>
    </div>
  );
}

