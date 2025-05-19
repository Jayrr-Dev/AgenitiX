"use client";

import React, { useId, useMemo } from "react";
import { typeFeatureBoxesPlain } from "../types";

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
export default function FeaturesBoxesPlain({ features }: { features: typeFeatureBoxesPlain[] }) {
  return (
    <section className="py-20 lg:py-40">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 md:gap-2 lg:grid-cols-4">
        {features.map((feature, index) => (
          <article
            key={feature.title}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-neutral-100 to-white p-6 dark:from-neutral-900 dark:to-neutral-950"
          >
            <Grid size={20} pattern={generateDeterministicPattern(index)} />
            <h3 className="relative z-20 text-base font-bold text-neutral-800 dark:text-white">
              {feature.title}
            </h3>
            <p className="relative z-20 mt-4 text-base text-neutral-600 dark:text-neutral-400">
              {feature.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* 🟩 Grid Overlay */
const Grid: React.FC<GridProps> = ({ pattern, size = 20 }) => {
  return (
    <div className="pointer-events-none absolute inset-0 -top-2 left-1/2 -translate-x-1/2 h-full w-full [mask-image:linear-gradient(white,transparent)]">
      <div className="absolute inset-0 opacity-100 bg-gradient-to-r from-zinc-100/30 to-zinc-300/30 dark:from-zinc-900/30 dark:to-zinc-900/30 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
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
          {squares.map(([sx, sy], idx) => (
            <rect
              key={`${sx}-${sy}`}
              width={width + 1}
              height={height + 1}
              x={sx * width}
              y={sy * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
};

/* 🧠 Deterministic Pattern Generator (hydration-safe) */
function generateDeterministicPattern(seed: number): [number, number][] {
  const pattern: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const x = ((seed + i * 13) % 4) + 7; // 7-10
    const y = ((seed + i * 17) % 6) + 1; // 1-6
    pattern.push([x, y]);
  }
  return pattern;
}
