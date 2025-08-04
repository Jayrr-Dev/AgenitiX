"use client";

import type React from "react";
import { useId } from "react";
import type { typeFeatureBoxesPlain } from "../types";

/* ✨ Types */

interface GridProps {
  pattern?: [number, number][];
  size?: number;
}

interface GridPatternProps extends React.SVGProps<SVGSVGElement> {
  width: number;
  height: number;
  x: number;
  y: number;
  squares?: [number, number][];
}

/* 📦 Main Section */
export default function FeaturesBoxesPlain({
  features,
}: {
  features: typeFeatureBoxesPlain[];
}) {
  return (
    <section className="relative py-20 lg:py-40">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Enhanced section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-blue-500/10 px-4 py-2 mb-6 border border-emerald-500/20">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400" />
            <span className="font-medium text-sm bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-blue-400 tracking-wider uppercase">
              Core Capabilities
            </span>
          </div>

          <h2 className="font-bold text-3xl text-gray-900 dark:text-white lg:text-4xl mb-4 tracking-tight">
            Enterprise-grade automation features
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Powerful capabilities designed for scale, security, and seamless
            business integration.
          </p>
        </div>

        {/* Enhanced grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-500 hover:shadow-xl hover:shadow-gray-900/10 dark:hover:shadow-gray-100/5 hover:-translate-y-1 hover:bg-white dark:hover:bg-gray-800"
            >
              <Grid size={20} pattern={generateDeterministicPattern(index)} />

              {/* Enhanced title with gradient accent */}
              <div className="relative z-20 mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400 mt-2 group-hover:scale-125 transition-transform duration-300" />
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                </div>
              </div>

              {/* Enhanced description */}
              <p className="relative z-20 text-gray-600 dark:text-gray-300 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                {feature.description}
              </p>

              {/* Hover accent border */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-gradient-to-r group-hover:from-emerald-500/20 group-hover:to-blue-500/20 transition-all duration-300" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 🟩 Grid Overlay */
const Grid: React.FC<GridProps> = ({ pattern, size = 20 }) => {
  return (
    <div className="-top-2 -translate-x-1/2 pointer-events-none absolute inset-0 left-1/2 h-full w-full [mask-image:linear-gradient(white,transparent)]">
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-100/30 to-zinc-300/30 opacity-100 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] dark:from-zinc-900/30 dark:to-zinc-900/30">
        <GridPattern
          width={size}
          height={size}
          x={-12}
          y={4}
          squares={pattern}
          className="absolute inset-0 h-full w-full fill-black/10 stroke-black/10 mix-blend-overlay dark:fill-white/10 dark:stroke-white/10"
        />
      </div>
    </div>
  );
};

/* 🖼️ SVG Pattern */
const GridPattern: React.FC<GridPatternProps> = ({
  width,
  height,
  x,
  y,
  squares,
  ...props
}) => {
  const patternId = useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M0.5 ${height}V0.5H${width}`} fill="none" />
        </pattern>
      </defs>

      <rect width="100%" height="100%" fill={`url(#${patternId})`} />

      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          <title>Feature background pattern</title>
          {squares.map(([sx, sy], idx) => (
            <rect
              key={`${sx}-${sy}-${idx}`}
              x={sx}
              y={sy}
              width={1}
              height={1}
              fill="currentColor"
              className="text-neutral-400/20"
            />
          ))}
        </svg>
      )}
    </svg>
  );
};

/* 🎲 Generate deterministic pattern */
function generateDeterministicPattern(seed: number): [number, number][] {
  const pattern: [number, number][] = [];
  const usedCoordinates = new Set<string>();
  const rng = (a: number, b: number) => {
    const x = Math.sin(seed + a * 12.9898 + b * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  // Try to generate 20 unique coordinates
  let attempts = 0;
  let i = 0;
  while (i < 20 && attempts < 100) {
    // Limit attempts to prevent infinite loop
    const x = Math.floor(rng(attempts, 0) * 20);
    const y = Math.floor(rng(attempts, 1) * 20);
    const coordKey = `${x}-${y}`;

    if (!usedCoordinates.has(coordKey)) {
      usedCoordinates.add(coordKey);
      pattern.push([x, y]);
      i++;
    }
    attempts++;
  }

  return pattern;
}
