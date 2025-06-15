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

import { MiniMap } from "@xyflow/react";
import React from "react";

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
      className={`bg-[hsl(var(--infra-minimap-bg))] border-[hsl(var(--infra-minimap-border))] hover:bg-[hsl(var(--infra-minimap-bg-hover))] hover:border-[hsl(var(--infra-minimap-border-hover))] rounded border shadow-sm transition-colors duration-200 ${className}`}
      position={position}
      pannable={pannable}
      zoomable={zoomable}
      ariaLabel={ariaLabel}
      nodeColor={(node) => {
        // Use semantic colors based on node category/type
        const nodeCategory = node.data?.category || node.type;

        // Map node types to categories if category is not directly available
        let resolvedCategory = nodeCategory;
        if (typeof nodeCategory === "string") {
          if (
            nodeCategory === "createText" ||
            nodeCategory.startsWith("create")
          ) {
            resolvedCategory = "CREATE";
          } else if (nodeCategory.startsWith("view")) {
            resolvedCategory = "VIEW";
          } else if (nodeCategory.startsWith("trigger")) {
            resolvedCategory = "TRIGGER";
          } else if (nodeCategory.startsWith("test")) {
            resolvedCategory = "TEST";
          } else if (nodeCategory.startsWith("cycle")) {
            resolvedCategory = "CYCLE";
          }
        }

        // Debug logging to see what categories we're getting
        if (process.env.NODE_ENV === "development") {
          console.log(`🗺️ [MiniMap] Node color mapping:`, {
            nodeId: node.id,
            nodeType: node.type,
            nodeDataCategory: node.data?.category,
            originalCategory: nodeCategory,
            resolvedCategory: resolvedCategory,
          });
        }

        switch (resolvedCategory) {
          case "CREATE":
            console.log(
              `🟢 [MiniMap] Applying CREATE green color for node ${node.id}`
            );
            return "hsl(var(--node-create-bg))";
          case "VIEW":
            return "hsl(var(--node-view-bg))";
          case "TRIGGER":
            return "hsl(var(--node-trigger-bg))";
          case "TEST":
            return "hsl(var(--node-test-bg))";
          case "CYCLE":
            return "hsl(var(--node-cycle-bg))";
          default:
            console.log(
              `🔵 [MiniMap] Using default blue color for node ${node.id}, category: ${resolvedCategory}`
            );
            return "hsl(var(--node-view-bg))";
        }
      }}
      nodeStrokeColor={(node) => {
        // Use semantic border colors based on node category/type
        const nodeCategory = node.data?.category || node.type;

        // Map node types to categories if category is not directly available
        let resolvedCategory = nodeCategory;
        if (typeof nodeCategory === "string") {
          if (
            nodeCategory === "createText" ||
            nodeCategory.startsWith("create")
          ) {
            resolvedCategory = "CREATE";
          } else if (nodeCategory.startsWith("view")) {
            resolvedCategory = "VIEW";
          } else if (nodeCategory.startsWith("trigger")) {
            resolvedCategory = "TRIGGER";
          } else if (nodeCategory.startsWith("test")) {
            resolvedCategory = "TEST";
          } else if (nodeCategory.startsWith("cycle")) {
            resolvedCategory = "CYCLE";
          }
        }

        switch (resolvedCategory) {
          case "CREATE":
            return "hsl(var(--node-create-bg-hover))"; // Slightly darker for border
          case "VIEW":
            return "hsl(var(--node-view-bg-hover))";
          case "TRIGGER":
            return "hsl(var(--node-trigger-bg-hover))";
          case "TEST":
            return "hsl(var(--node-test-bg-hover))";
          case "CYCLE":
            return "hsl(var(--node-cycle-bg-hover))";
          default:
            return "hsl(var(--node-view-bg-hover))";
        }
      }}
      nodeStrokeWidth={2}
      maskColor="hsl(var(--infra-minimap-mask))"
      style={{
        backgroundColor: "hsl(var(--infra-minimap-bg))",
        border: "1px solid hsl(var(--infra-minimap-border))",
      }}
    />
  );
};

export default ThemedMiniMap;
