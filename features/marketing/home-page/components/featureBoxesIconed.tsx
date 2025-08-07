/**
 * FEATURE BOXES ICONED - Marketing component showcasing features with icons
 */

import {
  IconAdjustmentsBolt,
  IconCloud,
  IconCurrencyDollar,
  IconEaseInOut,
  IconHeart,
  IconHelp,
  IconRouteAltLeft,
  IconTerminal2,
} from "@tabler/icons-react";
import type React from "react";
import type { typeFeatureBoxesIconed } from "../types";

const iconMap: Record<typeFeatureBoxesIconed["icon"], React.ReactNode> = {
  IconTerminal2: <IconTerminal2 />,
  IconEaseInOut: <IconEaseInOut />,
  IconCurrencyDollar: <IconCurrencyDollar />,
  IconCloud: <IconCloud />,
  IconRouteAltLeft: <IconRouteAltLeft />,
  IconHelp: <IconHelp />,
  IconAdjustmentsBolt: <IconAdjustmentsBolt />,
  IconHeart: <IconHeart />,
};

export default function FeatureBoxesIconed({
  features,
}: {
  features: typeFeatureBoxesIconed[];
}) {
  return (
    <div className="relative z-10 mx-auto max-w-7xl py-16 lg:py-24">
      {/* Enhanced section header */}
      <div className="mb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 mb-6 border border-blue-500/20">
          <div className="h-2 w-2 rounded-full bg-blue-400" />
          <span className="font-medium text-sm text-blue-600 dark:text-blue-400 tracking-wider uppercase">
            Why Choose AgenitiX
          </span>
        </div>
        <h2 className="font-bold text-3xl text-gray-900 dark:text-white lg:text-4xl mb-4">
          Built for modern businesses
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          From enterprise security to seamless scaling, every feature is
          designed with your success in mind.
        </p>
      </div>

      {/* Enhanced grid with better dark mode styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200/50 dark:bg-gray-700/50 rounded-xl overflow-hidden">
        {features.map((feature, index) => (
          <Feature key={feature.title} {...feature} index={index} />
        ))}
      </div>
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: typeFeatureBoxesIconed["icon"];
  index: number;
}) => {
  return (
    <div className="group/feature relative bg-white dark:bg-gray-900 p-8 transition-all duration-500 hover:bg-gray-50 dark:hover:bg-gray-800/80 cursor-pointer">
      {/* Enhanced hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover/feature:from-blue-500/5 group-hover/feature:to-purple-500/5 transition-all duration-500" />

      {/* Icon with enhanced styling */}
      <div className="relative z-10 mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 group-hover/feature:bg-blue-100 dark:group-hover/feature:bg-blue-900/30 group-hover/feature:text-blue-600 dark:group-hover/feature:text-blue-400 transition-all duration-300 group-hover/feature:scale-110">
          {iconMap[icon]}
        </div>
      </div>

      {/* Enhanced title */}
      <h3 className="relative z-10 mb-3 font-bold text-lg text-gray-900 dark:text-white group-hover/feature:text-blue-600 dark:group-hover/feature:text-blue-400 transition-colors duration-300">
        {title}
      </h3>

      {/* Enhanced description */}
      <p className="relative z-10 text-gray-600 dark:text-gray-300 leading-relaxed group-hover/feature:text-gray-700 dark:group-hover/feature:text-gray-200 transition-colors duration-300">
        {description}
      </p>

      {/* Subtle accent border */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-blue-500 to-purple-500 group-hover/feature:w-full transition-all duration-700" />

      {/* Corner glow effect */}
      <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-400 opacity-0 group-hover/feature:opacity-100 transition-opacity duration-500 animate-pulse" />
    </div>
  );
};
