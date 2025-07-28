/**
 * THEMED CONTROLS COMPONENT - Canvas zoom and pan controls with minimal theming
 *
 * • Preserves original ReactFlow Controls design with subtle theming integration
 * • Uses semantic tokens for consistent colors across light/dark modes
 * • Minimal styling approach to maintain familiar ReactFlow appearance
 * • Responsive positioning and accessibility features
 *
 * Keywords: controls, zoom, pan, fit-view, minimal-theming, reactflow-original
 */

"use client";

import { Controls } from "@xyflow/react";
import type React from "react";

interface ThemedControlsProps {
	className?: string;
	position?:
		| "top-left"
		| "top-right"
		| "bottom-left"
		| "bottom-right"
		| "top-center"
		| "bottom-center"
		| "center-left"
		| "center-right";
	showInteractive?: boolean;
	showZoom?: boolean;
	showFitView?: boolean;
}

export const ThemedControls: React.FC<ThemedControlsProps> = ({
	className = "",
	position = "top-left",
	showInteractive = false,
	showZoom = true,
	showFitView = true,
}) => {
	return (
		<Controls
			className={`[&]:border-[var(--infra-controls-border)] [&]:bg-[var(--infra-controls-bg)] [&_button:hover]:bg-[var(--infra-controls-button-hover)] [&_button:hover]:text-[var(--infra-controls-icon-hover)] [&_button]:text-[var(--infra-controls-icon)] ${className}
      `}
			position={position}
			showInteractive={showInteractive}
			showZoom={showZoom}
			showFitView={showFitView}
		/>
	);
};

export default ThemedControls;
