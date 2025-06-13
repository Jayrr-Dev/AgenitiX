/**
 * THEMED MINI MAP COMPONENT - Miniature flow visualization with semantic theming
 *
 * • Miniature overview of the entire flow canvas with zoom and pan controls
 * • Integrated with semantic token system for consistent theming
 * • Responsive design with proper contrast and accessibility
 * • Smooth interactions and visual feedback for navigation
 * • Customizable styling and positioning options
 *
 * Keywords: mini-map, flow-overview, semantic-tokens, navigation, accessibility
 */

"use client";

import React from "react";
import { MiniMap } from "@xyflow/react";

interface ThemedMiniMapProps {
  className?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  pannable?: boolean;
  zoomable?: boolean;
  ariaLabel?: string;
}

export const ThemedMiniMap: React.FC<ThemedMiniMapProps> = ({
  className = "",
  position = "bottom-right",
  pannable = true,
  zoomable = true,
  ariaLabel = "Mini map overview",
}) => {
  return (
    <MiniMap
      className={`bg-infra-minimap border-infra-minimap rounded border shadow-sm ${className}`}
      position={position}
      pannable={pannable}
      zoomable={zoomable}
      ariaLabel={ariaLabel}
      nodeColor={(node) => {
        // Use semantic colors based on node type
        switch (node.type) {
          case 'create':
            return 'hsl(var(--node-create-bg))';
          case 'view':
            return 'hsl(var(--node-view-bg))';
          case 'trigger':
            return 'hsl(var(--node-trigger-bg))';
          case 'test':
            return 'hsl(var(--node-test-bg))';
          default:
            return 'hsl(var(--node-view-bg))';
        }
      }}
      nodeStrokeColor={(node) => {
        // Use semantic border colors
        switch (node.type) {
          case 'create':
            return 'hsl(var(--node-create-border))';
          case 'view':
            return 'hsl(var(--node-view-border))';
          case 'trigger':
            return 'hsl(var(--node-trigger-border))';
          case 'test':
            return 'hsl(var(--node-test-border))';
          default:
            return 'hsl(var(--node-view-border))';
        }
      }}
      nodeStrokeWidth={2}
      maskColor="hsl(var(--infra-minimap-mask))"
      style={{
        backgroundColor: 'hsl(var(--infra-minimap-bg))',
        border: '1px solid hsl(var(--infra-minimap-border))',
      }}
    />
  );
};

export default ThemedMiniMap; 