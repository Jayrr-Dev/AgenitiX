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
						<h3 className="relative z-20 font-bold text-base text-neutral-800 dark:text-white">
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
const GridPattern: React.FC<GridPatternProps> = ({ width, height, x, y, squares, ...props }) => {
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
					{squares.map(([sx, sy], _idx) => (
						<rect
							key={`${sx}-${sy}`}
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
	while (i < 20 && attempts < 100) { // Limit attempts to prevent infinite loop
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
