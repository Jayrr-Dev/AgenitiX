/**
 * LOADING COMPONENTS - Unified loading system with multiple variants
 *
 * • Default border spinner for consistency across the app
 * • Alternative gradient and ring loaders available as options
 * • Configurable size, text, and styling
 * • Accessible with proper ARIA labels
 *
 * Keywords: loading, spinner, border-animation, gradient-ring, accessibility
 */

import type React from "react";
import { twMerge } from "tailwind-merge";

export interface LoadingProps {
	/** Extra classes on the wrapper (for centering, backdrop, etc.) */
	className?: string;
	/** Size of the spinner, e.g. "w-8 h-8" */
	size?: string;
	/** Optional loading text to display */
	text?: string;
	/** Loading variant to use */
	variant?: "border" | "gradient" | "ring";
	/** Text size class for the loading text */
	textSize?: string;
	/** Whether to show the text (if false, only shows spinner) */
	showText?: boolean;
}

/**
 * Default consistent border spinner loader (recommended for UI consistency)
 */
export const Loading: React.FC<LoadingProps> = ({
	className = "flex items-center justify-center p-4",
	size = "w-8 h-8",
	text,
	variant = "border",
	textSize = "text-sm",
	showText = true,
}) => {
	const containerClasses = twMerge("flex flex-col items-center justify-center gap-3", className);

	if (variant === "border") {
		// Consistent border spinner used throughout the app
		const spinnerClasses = twMerge(
			"animate-spin rounded-full border-primary border-b-2",
			size
		);

		return (
			<div className={containerClasses}>
				<div className={spinnerClasses} role="status" aria-label="Loading" />
				{showText && text && (
					<div className={twMerge("text-muted-foreground", textSize)}>
						{text}
					</div>
				)}
			</div>
		);
	}

	if (variant === "gradient") {
		// Gradient ring loader (alternative option)
		const outerClasses = twMerge(
			"inline-block animate-spin rounded-full p-0.5",
			size,
			"bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"
		);

		const innerClasses = "rounded-full w-full h-full bg-background";

		return (
			<div className={containerClasses}>
				<div className={outerClasses}>
					<div role="status" aria-label="Loading" className={innerClasses} />
				</div>
				{showText && text && (
					<div className={twMerge("text-muted-foreground", textSize)}>
						{text}
					</div>
				)}
			</div>
		);
	}

	if (variant === "ring") {
		// Red & Blue gradient ring (app loading variant)
		const outerClasses = twMerge(
			"inline-block animate-spin rounded-full p-0.5",
			size,
			"bg-gradient-to-r from-red-500 via-blue-500 to-red-500"
		);

		const innerClasses = "rounded-full w-full h-full bg-background";

		return (
			<div className={containerClasses}>
				<div className={outerClasses}>
					<div role="status" aria-label="Loading" className={innerClasses} />
				</div>
				{showText && text && (
					<div className={twMerge("text-muted-foreground", textSize)}>
						{text}
					</div>
				)}
			</div>
		);
	}

	return null;
};

/**
 * Legacy gradient ring loader (kept for backward compatibility)
 */
export interface LegacyLoadingProps {
	className?: string;
	size?: string;
	ringThickness?: string;
	innerBg?: string;
}

export const GradientLoading: React.FC<LegacyLoadingProps> = ({
	className = "h-screen",
	size = "w-12 h-12",
	ringThickness = "p-0.5",
	innerBg = "bg-background",
}) => {
	const containerClasses = twMerge("flex items-center justify-center w-full h-full", className);
	const outerClasses = twMerge(
		"inline-block animate-spin rounded-full",
		size,
		ringThickness,
		"bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"
	);
	const innerClasses = twMerge("rounded-full w-full h-full", innerBg);

	return (
		<div className={containerClasses}>
			<div className={outerClasses}>
				<div role="status" aria-label="Loading" className={innerClasses} />
			</div>
		</div>
	);
};
