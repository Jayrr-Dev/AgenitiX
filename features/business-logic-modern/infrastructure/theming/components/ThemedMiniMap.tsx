/**
 * THEMED MINIMAP - Wrapper for ReactFlow MiniMap with component theming
 *
 * • Applies consistent theming from componentThemeStore
 * • Preserves all original MiniMap functionality
 * • Matches visual style with other themed components
 * • Supports dark/light mode automatically
 *
 * Keywords: minimap, theming, reactflow, wrapper
 */

"use client";

import { MiniMap } from "@xyflow/react";
import type { MiniMapProps } from "@xyflow/react";
import React from "react";
import { useComponentTheme } from "./componentThemeStore";

interface ThemedMiniMapProps extends Omit<MiniMapProps, 'className' | 'style'> {
  /** Additional CSS classes to apply */
  additionalClasses?: string;
  /** Additional inline styles */
  additionalStyles?: React.CSSProperties;
}

/**
 * THEMED MINIMAP COMPONENT
 * Wraps ReactFlow MiniMap with consistent theming
 */
export const ThemedMiniMap: React.FC<ThemedMiniMapProps> = ({
  additionalClasses = "",
  additionalStyles = {},
  ...miniMapProps
}) => {
  const theme = useComponentTheme('miniMap');

  // Combine themed classes with additional classes
  const combinedClasses = `
    ${theme.borderRadius.default}
    ${theme.glow.hover}
    ${theme.shadow.default}
    ${theme.transition}
    ${additionalClasses}
  `.trim();

  // Combine themed styles with additional styles
  const combinedStyles: React.CSSProperties = {
    backgroundColor: 'var(--background)',
    border: '1px solid var(--border)',
    ...additionalStyles,
  };

  return (
    <MiniMap
      {...miniMapProps}
      className={combinedClasses}
      style={combinedStyles}
    />
  );
};

export default ThemedMiniMap; 