"use client";

import Image from "next/image";
import { type CSSProperties, useEffect, useState } from "react";

/* ─── Types ─────────────────────────────────────────────── */
export interface Logo {
	name: string;
	key: string;
	customId: string | null;
	url: string;
	width: number;
	height: number;
	uploadedAt: string;
}

interface LogoTickerProps {
	logos: Logo[];
	speed?: number; // seconds *per logo* (smaller = faster)
	fadeWidth?: number; // px of fade on both sides
	darkMode?: boolean;
	className?: string;
}

/* ─── Component ─────────────────────────────────────────── */
export default function LogoTicker({
	logos,
	speed = 2,
	fadeWidth = 64,
	darkMode = true,
	className = "",
}: LogoTickerProps) {
	const [start, setStart] = useState(false);

	/* 1 ▸ duplicate once for seamless loop */
	const strip = [...logos, ...logos, ...logos];

	/* 2 ▸ wait one tick so the mask renders first */
	useEffect(() => {
		const t = setTimeout(() => setStart(true), 50);
		return () => clearTimeout(t);
	}, []);

	/* 3 ▸ dynamic CSS variables */
	const styleVars: CSSProperties = {
		["--ticker-duration" as any]: `${strip.length * speed}s`,
		["--fade-width" as any]: `${fadeWidth}px`,
	};

	const maskStyle: CSSProperties = {
		maskImage: `linear-gradient(to right,
        transparent 0,
        #000 var(--fade-width),
        #000 calc(100% - var(--fade-width)),
        transparent 100%)`,
		WebkitMaskImage: `linear-gradient(to right,
        transparent 0,
        #000 var(--fade-width),
        #000 calc(100% - var(--fade-width)),
        transparent 100%)`,
	};

	return (
		<section className={`w-full bg-background py-12 ${className}`} style={styleVars}>
			<div className="relative w-full overflow-hidden" style={maskStyle}>
				<div
					/*  w-max + gap ⇒ total width is symmetrical,    */
					/*  so the –50 % slide lines copy #2 up perfectly */
					className={`flex w-max items-center gap-8 whitespace-nowrap md:gap-12 ${
						start ? "animate-scroll-x-loop" : ""
					}`}
				>
					{strip.map((logo, i) => (
						<div key={i} className="flex items-center opacity-99 contrast-50 grayscale">
							<Image
								src={logo.url}
								alt={logo.name}
								width={logo.width}
								height={logo.height}
								priority={i < logos.length} /* first visible set eagerly */
								className={`object-contain ${darkMode ? "brightness-100" : ""} ${className} `}
							/>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
