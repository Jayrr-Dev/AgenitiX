"use client";

import React, { useId, useMemo } from "react";

/* ✨ Types */
interface Feature {
  title: string;
  description: string;
}

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

/* 🏷️ Feature list */
const features: Feature[] = [
  {
    title: "HIPAA and SOC2 Compliant",
    description:
      "Our applications are HIPAA and SOC2 compliant, your data is safe with us, always.",
  },
  {
    title: "Automated Social Media Posting",
    description:
      "Schedule and automate your social media posts across multiple platforms to save time and maintain a consistent online presence.",
  },
  {
    title: "Advanced Analytics",
    description:
      "Gain insights into your social media performance with detailed analytics and reporting tools to measure engagement and ROI.",
  },
  {
    title: "Content Calendar",
    description:
      "Plan and organize your social media content with an intuitive calendar view, ensuring you never miss a post.",
  },
  {
    title: "Audience Targeting",
    description:
      "Reach the right audience with advanced targeting options, including demographics, interests, and behaviors.",
  },
  {
    title: "Social Listening",
    description:
      "Monitor social media conversations and trends to stay informed about what your audience is saying and respond in real-time.",
  },
  {
    title: "Customizable Templates",
    description:
      "Create stunning social media posts with our customizable templates, designed to fit your brand's unique style and voice.",
  },
  {
    title: "Collaboration Tools",
    description:
      "Work seamlessly with your team using our collaboration tools, allowing you to assign tasks, share drafts, and provide feedback in real-time.",
  },
];

/* 📦 Main Section */
export default function FeaturesSectionDemo() {
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
