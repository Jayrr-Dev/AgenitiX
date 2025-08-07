"use client";

import React, { useState, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const ThreeDCardGrid = ({
  items,
  className,
}: {
  items: {
    id: number;
    title: string;
    description: string;
    image?: string;
    className?: string;
  }[];
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-10",
        className
      )}
    >
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <ThreeDCard item={item} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const ThreeDCard = ({
  item,
}: {
  item: {
    id: number;
    title: string;
    description: string;
    image?: string;
    className?: string;
  };
}) => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const controls = useAnimation();
  
  // Subtle floating animation when not hovered
  useEffect(() => {
    if (!isHovered) {
      controls.start({
        y: [0, -5, 0],
        transition: {
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }
      });
    } else {
      controls.stop();
    }
  }, [isHovered, controls]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.div
      className={cn(
        "relative h-80 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 p-8 border border-neutral-800 overflow-hidden shadow-lg hover:shadow-xl",
        item.className
      )}
      style={{
        transformStyle: "preserve-3d",
      }}
      animate={controls}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative z-10 h-full flex flex-col justify-between"
        style={{ transformStyle: "preserve-3d" }}
        animate={{
          rotateX: rotate.x,
          rotateY: rotate.y,
        }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
        }}
      >
        <div>
          <motion.h3 
            className="text-xl font-bold text-neutral-100 mb-2"
            animate={{ y: isHovered ? 0 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {item.title}
          </motion.h3>
          <motion.p 
            className="text-neutral-300"
            animate={{ y: isHovered ? 0 : 0, opacity: isHovered ? 1 : 0.8 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {item.description}
          </motion.p>
        </div>
      </motion.div>
      
      {/* Animated gradient background */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl"
        animate={{
          background: isHovered 
            ? ["linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)", 
               "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)"] 
            : "linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)"
        }}
        transition={{
          duration: 3,
          repeat: isHovered ? Infinity : 0,
          repeatType: "reverse"
        }}
      />
      
      {/* Shine effect */}
      <motion.div 
        className="absolute inset-0 opacity-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0"
        animate={{ opacity: isHovered ? 0.5 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          transform: `rotate(${isHovered ? 25 : 0}deg) translateX(${isHovered ? -100 : 0}%) translateY(${isHovered ? -100 : 0}%)`,
          width: "200%",
          height: "200%"
        }}
      />
    </motion.div>
  );
};
