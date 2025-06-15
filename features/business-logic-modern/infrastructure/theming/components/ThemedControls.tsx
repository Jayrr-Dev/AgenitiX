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
import React from "react";

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
      className={`
        [&]:bg-[hsl(var(--infra-controls-bg))]
        [&]:border-[hsl(var(--infra-controls-border))]
        [&_button]:text-[hsl(var(--infra-controls-icon))]
        [&_button:hover]:text-[hsl(var(--infra-controls-icon-hover))]
        [&_button:hover]:bg-[hsl(var(--infra-controls-button-hover))]
        ${className}
      `}
      position={position}
      showInteractive={showInteractive}
      showZoom={showZoom}
      showFitView={showFitView}
    />
  );
};

export default ThemedControls;
