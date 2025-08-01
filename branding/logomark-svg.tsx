"use client"; // Ensure this component is only run on the client

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// Define props type
interface LogomarkSvgProps {
	className?: string;
	width?: number | string;
	height?: number | string;
}

export function LogomarkSvg({ className, width = 50, height = 50 }: LogomarkSvgProps) {
	const { theme, resolvedTheme } = useTheme(); // resolvedTheme is safer than theme
	const [mounted, setMounted] = useState(false);

	// Ensure we only render the correct theme on the client
	useEffect(() => {
		setMounted(true);
	}, []);

	// Decide which color to use
	const fill =
		(mounted ? (resolvedTheme ?? theme) : "light") === "light"
			? "rgb(0, 0, 0)" // Black for light theme
			: "rgb(255, 255, 255)"; // White for dark theme

	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 450 450"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			role="img"
			aria-labelledby="logomark-title"
		>
			<title id="logomark-title">Company Logomark</title>
			<path
				style={{
					stroke: fill,
					paintOrder: "fill",
					strokeWidth: "0px",
					fill: fill,
				}}
				d="M 322.518 245.369 L 412.119 109.716 L 359.56 110.718 L 297.491 202.821 L 242.038 115.523 C 238.257 110.161 234.15 110.217 234.15 110.217 C 227.325 109.895 196.877 110.217 196.877 110.217 L 62.727 364.002 L 114.285 364.002 L 139.312 315.448 L 194.875 315.448 L 220.903 273.901 L 161.337 273.4 L 218.401 162.777 L 268.458 243.367 L 190.37 363.502 L 241.95 363.502 L 294.487 283.412 L 346.545 363.502 L 397.602 363.502 L 322.518 245.369 Z"
				transform="matrix(1, 0, 0, 1, 5.684341886080802e-14, 0)"
			/>
		</svg>
	);
}
