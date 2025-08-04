"use client";
import { cn } from "@/lib/utils";
import { IconBrandYoutubeFilled } from "@tabler/icons-react";
import createGlobe from "cobe";
import { motion } from "motion/react";
import Image from "next/image";
import type React from "react";
import { useEffect, useRef } from "react";
import type { typeFeatureBoxesBento } from "../types";

export default function FeatureBoxesBento({
  features,
}: {
  features: typeFeatureBoxesBento[];
}) {
  const getSkeleton = (type: typeFeatureBoxesBento["skeleton"]) => {
    switch (type) {
      case "SkeletonOne":
        return <SkeletonOne />;
      case "SkeletonTwo":
        return <SkeletonTwo />;
      case "SkeletonThree":
        return <SkeletonThree />;
      case "SkeletonFour":
        return <SkeletonFour />;
      default:
        return null;
    }
  };
  return (
    <div className="relative z-20 mx-auto max-w-7xl py-10 lg:py-40">
      {/* Enhanced Header Section */}
      <div className="px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 mb-6 border border-emerald-500/20">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-medium text-sm text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
              Complete Platform
            </span>
          </div>

          <h4 className="mx-auto max-w-5xl text-center font-bold text-3xl text-gray-900 tracking-tight lg:text-5xl lg:leading-tight dark:text-white mb-6">
            Everything you need to automate your business
          </h4>

          <p className="mx-auto max-w-2xl text-center font-normal text-gray-600 text-lg lg:text-xl leading-relaxed dark:text-gray-300">
            From simple data entry to complex multi-step workflows, AgenitiX
            provides the tools, integrations, and AI capabilities to automate
            any business process—without writing a single line of code.
          </p>
        </motion.div>
      </div>

      {/* Enhanced Feature Grid */}
      <div className="relative mt-16 px-4">
        <div className="grid grid-cols-1 rounded-xl lg:grid-cols-2 gap-0 overflow-hidden border border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <FeatureCard
                feature={feature}
                skeleton={getSkeleton(feature.skeleton)}
              />
            </motion.div>
          ))}
        </div>

        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5 rounded-xl blur-3xl -z-10" />
      </div>
    </div>
  );
}

const FeatureCard = ({
  feature,
  skeleton,
}: {
  feature: typeFeatureBoxesBento;
  skeleton: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "group relative overflow-hidden p-6 sm:p-8 transition-all duration-500 min-h-[400px] lg:min-h-[500px]",
        "hover:bg-white/80 dark:hover:bg-gray-800/80",
        "border-gray-200/30 dark:border-gray-700/30",
        feature.className
      )}
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-blue-500/0 group-hover:from-emerald-500/5 group-hover:to-blue-500/5 transition-all duration-500" />

      <div className="relative z-10">
        <FeatureTitle>{feature.title}</FeatureTitle>
        <FeatureDescription>{feature.description}</FeatureDescription>
        <div className="mt-6 h-full w-full">{skeleton}</div>
      </div>

      {/* Subtle border accent */}
      <div className="absolute top-0 left-0 h-1 w-0 bg-gradient-to-r from-emerald-500 to-blue-500 group-hover:w-full transition-all duration-700" />
    </div>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3 tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
      {children}
    </h3>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm lg:text-base group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
      {children}
    </p>
  );
};

export const SkeletonOne = () => {
  return (
    <div className="relative flex h-64 lg:h-80 overflow-hidden rounded-lg">
      <div className="group relative h-full w-full bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-xl ring-1 ring-gray-200/50 dark:ring-gray-700/50">
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <img
            src="/feat-hq.png"
            alt="Workflow automation dashboard interface"
            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          {/* Enhanced overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent" />

          {/* Floating elements for visual interest */}
          <div className="absolute top-4 right-4 flex gap-2">
            <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse" />
            <div className="h-3 w-3 rounded-full bg-blue-400 animate-pulse delay-75" />
            <div className="h-3 w-3 rounded-full bg-purple-400 animate-pulse delay-150" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonThree = () => {
  return (
    <a
      href="https://www.youtube.com/watch?v=RPa3_AD1_Vs"
      target="_blank"
      rel="noopener noreferrer"
      className="group/video relative block h-64 lg:h-80 overflow-hidden rounded-lg transition-transform duration-300 hover:scale-[1.02]"
    >
      <div className="relative h-full w-full">
        <img
          src="/feat-hq.png"
          alt="AgenitiX automation platform demo video"
          className="h-full w-full object-cover"
        />

        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-black/40 group-hover/video:bg-black/20 transition-colors duration-300" />

        {/* Enhanced play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="group/play-btn relative">
            {/* Outer glow ring */}
            <div className="absolute inset-0 h-24 w-24 rounded-full bg-red-500/20 group-hover/video:bg-red-500/30 transition-all duration-300 animate-ping" />

            {/* Main button */}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-xl ring-4 ring-white/30 transition-all duration-300 group-hover/video:bg-red-500 group-hover/video:scale-110">
              <IconBrandYoutubeFilled className="h-10 w-10 text-white ml-1" />
            </div>
          </div>
        </div>

        {/* Video info overlay */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <img
            src="/logo-mark.png"
            alt="AgenitiX logo"
            className="h-8 w-8 rounded-lg bg-white/90 p-1"
          />
          <div className="text-white">
            <p className="font-semibold text-sm">Watch Demo</p>
            <p className="text-xs text-white/80">See AgenitiX in action</p>
          </div>
        </div>

        {/* Corner accent */}
        <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1">
          <span className="text-xs font-semibold text-gray-900">VIDEO</span>
        </div>
      </div>
    </a>
  );
};

export const SkeletonTwo = () => {
  const images = [
    {
      src: "https://images.unsplash.com/photo-1517322048670-4fba75cbbb62?q=80&w=3000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "bali images",
    },
    {
      src: "https://images.unsplash.com/photo-1573790387438-4da905039392?q=80&w=3425&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "bali images",
    },
    {
      src: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "bali images",
    },
    {
      src: "https://images.unsplash.com/photo-1554931670-4ebfabf6e7a9?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "bali images",
    },
    {
      src: "https://images.unsplash.com/photo-1546484475-7f7bd55792da?q=80&w=2581&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "bali images",
    },
  ];

  const imageVariants = {
    whileHover: { scale: 1.1, rotate: 0, zIndex: 100 },
    whileTap: { scale: 1.1, rotate: 0, zIndex: 100 },
  };

  // 👇 Safe deterministic angle using index
  const getRotation = (i: number) => ((i * 13) % 21) - 10;

  return (
    <div className="relative flex h-64 lg:h-80 flex-col items-center justify-center gap-6 overflow-hidden p-4">
      {/* Enhanced floating images with better positioning */}
      <div className="relative w-full">
        <div className="flex justify-center -space-x-4">
          {images.slice(0, 3).map((image, idx) => (
            <motion.div
              variants={imageVariants}
              key={`images-first-${image.src}-${idx}`}
              style={{ rotate: getRotation(idx) }}
              whileHover="whileHover"
              className="relative h-24 w-24 lg:h-32 lg:w-32 overflow-hidden rounded-xl shadow-lg ring-2 ring-white/50 dark:ring-gray-700/50"
            >
              <Image
                src={image.src}
                alt="AI automation examples"
                fill={true}
                className="object-cover transition-all duration-300"
              />
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center -space-x-4 mt-4">
          {images.slice(3, 5).map((image, idx) => (
            <motion.div
              variants={imageVariants}
              key={`images-second-${image.src}-${idx}`}
              style={{ rotate: getRotation(idx + 10) }}
              whileHover="whileHover"
              className="relative h-20 w-20 lg:h-28 lg:w-28 overflow-hidden rounded-xl shadow-lg ring-2 ring-white/50 dark:ring-gray-700/50"
            >
              <Image
                src={image.src}
                alt="AI automation examples"
                fill={true}
                className="object-cover transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI badge */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-full bg-white/90 dark:bg-gray-800/90 px-3 py-2 shadow-lg backdrop-blur-sm">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            AI-Powered
          </span>
        </div>
      </div>

      {/* Gradient overlays for better blending */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 h-full w-8 bg-gradient-to-r from-white/50 to-transparent dark:from-gray-900/50" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 h-full w-8 bg-gradient-to-l from-white/50 to-transparent dark:from-gray-900/50" />
    </div>
  );
};

export const SkeletonFour = () => {
  return (
    <div className="relative flex h-64 lg:h-80 flex-col items-center justify-center overflow-hidden">
      {/* Enhanced globe container */}
      <div className="relative">
        <Globe className="scale-75 lg:scale-90" />

        {/* Floating connection indicators */}
        <div className="absolute top-8 left-8 flex items-center gap-2 rounded-full bg-emerald-500/90 px-3 py-1 text-white text-xs font-semibold shadow-lg">
          <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
          99.9% Uptime
        </div>

        <div className="absolute bottom-8 right-8 flex items-center gap-2 rounded-full bg-blue-500/90 px-3 py-1 text-white text-xs font-semibold shadow-lg">
          <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
          Global Scale
        </div>

        <div className="absolute top-1/2 left-4 flex items-center gap-2 rounded-full bg-purple-500/90 px-3 py-1 text-white text-xs font-semibold shadow-lg">
          <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
          Auto Deploy
        </div>
      </div>

      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-blue-500/5 to-purple-500/5 rounded-lg" />
    </div>
  );
};

export const Globe = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) {
      return;
    }

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 400 * 2,
      height: 400 * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 2,
      mapSamples: 20000,
      mapBrightness: 8,
      baseColor: [0.1, 0.1, 0.15],
      markerColor: [0.1, 0.8, 1],
      glowColor: [0.2, 0.6, 1],
      markers: [
        // Major cities for global presence
        { location: [37.7595, -122.4367], size: 0.05 }, // San Francisco
        { location: [40.7128, -74.006], size: 0.08 }, // New York
        { location: [51.5074, -0.1278], size: 0.06 }, // London
        { location: [35.6762, 139.6503], size: 0.07 }, // Tokyo
        { location: [52.52, 13.405], size: 0.05 }, // Berlin
        { location: [-33.8688, 151.2093], size: 0.04 }, // Sydney
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.005; // Slower rotation for better UX
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 300, height: 300, maxWidth: "100%", aspectRatio: 1 }}
      className={cn(
        "opacity-90 hover:opacity-100 transition-opacity duration-500",
        className
      )}
    />
  );
};
