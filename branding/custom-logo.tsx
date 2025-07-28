"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import type React from "react";
import { useEffect, useState } from "react";

// TYPES
interface CustomLogoProps {
	className?: string;
	size?: number;
}

/**
 * CUSTOM LOGO COMPONENT
 * - Renders the custom logo-mark.png as a circular icon
 * - Adapts styling based on the current theme (light/dark)
 * - Prevents mismatches between SSR and client-side rendering
 */
export const CustomLogo: React.FC<CustomLogoProps> = ({ className = "", size = 50 }) => {
	const { theme, resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// ENSURE CLIENT-SIDE RENDERING
	useEffect(() => {
		setMounted(true);
	}, []);

	// DETERMINE THEME-BASED STYLING
	const isDarkMode = mounted ? (resolvedTheme ?? theme) === "dark" : false;

	return (
		<div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
			<Image
				src="/logo-mark.png"
				alt="Custom Logo"
				width={size}
				height={size}
				className={`rounded-full object-cover transition-all duration-300 ${isDarkMode ? "brightness-110 contrast-110" : "brightness-95 contrast-105"}
        `}
				priority={true}
			/>
		</div>
	);
};

/**
 * CUSTOM BRAND WORDMARK
 * - Displays "AgenitiX" with custom styling
 * - Maintains consistency with existing brand
 */
export const CustomBrandWordmark: React.FC<{ className?: string }> = ({ className = "" }) => (
	<span className={`font-brand font-semibold text-xl tracking-tight ${className}`}>AgenitiX</span>
);
