"use client";

import clsx from "clsx";
import type React from "react";

/* ---------------------------------------------------------------------
   Types
   ------------------------------------------------------------------ */
export interface BrandWordmarkProps {
	/** Extra Tailwind / CVA classes to merge in (optional). */
	className?: string;
}

/* ---------------------------------------------------------------------
   Component
   ------------------------------------------------------------------ */
/**
 * Branded word-mark (“AgenitiX”) with animated conic border.
 *
 * - Uses `bg-fill-content` to paint the conic gradient border layers
 * - `hover:animate-fill-transparency` triggers the left+right sweeps
 *   defined in globals.css.
 */
export const BrandWordmark: React.FC<BrandWordmarkProps> = ({ className = "" }) => (
	<div
		className={clsx(
			/* base paint stack + layout */
			"inline-block rounded-xl border border-transparent bg-fill-content p-2",

			/* smooth colour transition when theme toggles */
			"transition-[background] duration-300 ease-out",

			/* animated sweep on hover */
			"hover:animate-fill-transparency",

			/* caller-supplied overrides */
			className
		)}
	>
		<span className="font-brand font-semibold text-[32px] leading-none tracking-tight">
			AgenitiX
		</span>
	</div>
);

export default BrandWordmark;
