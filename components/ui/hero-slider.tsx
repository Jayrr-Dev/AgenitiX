"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SlideProps {
  id: string;
  title: string;
  description: string;
  image?: string;
  gradient?: string;
}

export const HeroSlider = ({
  slides,
  className,
  autoplaySpeed = 5000,
}: {
  slides: SlideProps[];
  className?: string;
  autoplaySpeed?: number;
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);

  useEffect(() => {
    if (!isAutoplay) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoplaySpeed);
    
    return () => clearInterval(interval);
  }, [isAutoplay, slides.length, autoplaySpeed]);

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index);
    setIsAutoplay(false);
  };

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      <div className="relative h-[500px] w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[currentSlide].id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center"
          >
            <div className="relative z-10 w-full px-8 md:px-16 lg:w-1/2">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl"
              >
                {slides[currentSlide].title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mb-8 text-lg text-neutral-300"
              >
                {slides[currentSlide].description}
              </motion.p>
            </div>
            {slides[currentSlide].image && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 0.7, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute right-0 top-0 h-full w-full md:w-1/2"
              >
                <div className="relative h-full w-full">
                  <img
                    src={slides[currentSlide].image}
                    alt={slides[currentSlide].title}
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                </div>
              </motion.div>
            )}
            {slides[currentSlide].gradient && !slides[currentSlide].image && (
              <div 
                className="absolute inset-0" 
                style={{ background: slides[currentSlide].gradient }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => handleSlideChange(index)}
            className={cn(
              "h-2 w-2 rounded-full transition-all",
              currentSlide === index
                ? "w-8 bg-white"
                : "bg-white/50 hover:bg-white/80"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
