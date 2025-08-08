"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SpotlightHover } from "./spotlight-hover";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  image?: string;
}

export const FeaturesGrid = ({
  features,
  className,
  spotlightColor = "rgba(120, 119, 198, 0.1)",
}: {
  features: Feature[];
  className?: string;
  spotlightColor?: string;
}) => {
  return (
    <div className={cn("py-12", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <FeatureCard 
            key={feature.id} 
            feature={feature} 
            spotlightColor={spotlightColor} 
          />
        ))}
      </div>
    </div>
  );
};

const FeatureCard = ({
  feature,
  spotlightColor,
}: {
  feature: Feature;
  spotlightColor: string;
}) => {
  return (
    <SpotlightHover spotlightColor={spotlightColor}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="relative h-full rounded-xl bg-neutral-900/50 border border-neutral-800 p-6 overflow-hidden backdrop-blur-sm"
      >
        <div className="relative z-10">
          {feature.icon && (
            <div className="mb-4 text-primary">{feature.icon}</div>
          )}
          <h3 className="text-xl font-bold text-neutral-100 mb-2">{feature.title}</h3>
          <p className="text-neutral-400">{feature.description}</p>
        </div>
        {feature.image && (
          <div className="absolute -bottom-8 -right-8 w-40 h-40 opacity-10">
            <img 
              src={feature.image} 
              alt={feature.title} 
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </motion.div>
    </SpotlightHover>
  );
};
