/**
 * THEMED MINI MAP COMPONENT - Miniature flow visualization with semantic theming
 * 
 * Performance optimizations:
 * • Memoized component prevents unnecessary re-renders
 * • Cached category resolution with Map for O(1) lookups
 * • Pre-computed color mappings avoid runtime calculations
 * • Extracted constant props to prevent prop drilling
 * 
 * Keywords: minimap, theming, performance, memoization, flow-visualization
 */

"use client";

import { MiniMap } from "@xyflow/react";
import React, { memo, useCallback, useMemo } from "react";

// Performance constants - extracted to prevent re-creation
const MINIMAP_CLASS_BASE = "rounded border shadow-sm transition-colors duration-200";
const MINIMAP_STYLE = { backgroundColor: "var(--infra-minimap-bg)", border: "1px solid var(--infra-minimap-border)" } as const;
const NODE_STROKE_WIDTH = 2;

interface ThemedMiniMapProps {
  className?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  pannable?: boolean;
  zoomable?: boolean;
  ariaLabel?: string;
}

// Category mapping cache for O(1) lookups, basically faster than string comparisons
const CATEGORY_CACHE = new Map<string, string>();
const CATEGORY_PATTERNS: Array<[RegExp | string, string]> = [
  ["createText", "CREATE"],
  [/^create/, "CREATE"],
  [/^view/, "VIEW"],
  [/^trigger/, "TRIGGER"],
  [/^test/, "TEST"],
  [/^email/, "EMAIL"],
  [/^flow/, "FLOW"],
  [/^time/, "TIME"],
  [/^ai/, "AI"],
  [/^store/, "STORE"],
  [/^cycle/, "CYCLE"],
];

// Pre-computed color mappings for better performance
const CATEGORY_COLORS = {
  CREATE: "var(--node-create-bg)",
  VIEW: "var(--node-view-bg)",
  TRIGGER: "var(--node-trigger-bg)",
  TEST: "var(--node-test-bg)",
  CYCLE: "var(--node-cycle-bg)",
  STORE: "var(--node-store-bg)",
  EMAIL: "var(--node-email-bg)",
  AI: "var(--node-ai-bg)",
  TIME: "var(--node-time-bg)",
  FLOW: "var(--node-flow-bg)",
} as const;

const CATEGORY_BORDERS = {
  CREATE: "var(--node-create-bg-hover)",
  VIEW: "var(--node-view-bg-hover)",
  TRIGGER: "var(--node-trigger-bg-hover)",
  TEST: "var(--node-test-bg-hover)",
  CYCLE: "var(--node-cycle-bg-hover)",
  STORE: "var(--node-store-bg-hover)",
  EMAIL: "var(--node-email-bg-hover)",
  AI: "var(--node-ai-bg-hover)",
  TIME: "var(--node-time-bg-hover)",
  FLOW: "var(--node-flow-bg-hover)",
} as const;

// Optimized category resolution with caching, basically avoids repeated string operations
const resolveCategory = (raw: unknown): keyof typeof CATEGORY_COLORS => {
  if (typeof raw !== "string") return "VIEW";
  
  // Check cache first for O(1) lookup
  const cached = CATEGORY_CACHE.get(raw);
  if (cached) return cached as keyof typeof CATEGORY_COLORS;
  
  // Pattern matching with early returns
  for (const [pattern, category] of CATEGORY_PATTERNS) {
    if (typeof pattern === "string" ? raw === pattern : pattern.test(raw)) {
      CATEGORY_CACHE.set(raw, category);
      return category as keyof typeof CATEGORY_COLORS;
    }
  }
  
  // Default fallback
  CATEGORY_CACHE.set(raw, "VIEW");
  return "VIEW";
};

const ThemedMiniMapComponent: React.FC<ThemedMiniMapProps> = ({
  className = "",
  position = "bottom-right",
  pannable = true,
  zoomable = true,
  ariaLabel = "Mini map overview",
}) => {
  // Memoized class computation, basically avoid string concatenation on every render
  const computedClassName = useMemo(() => 
    `${MINIMAP_CLASS_BASE} border-[var(--infra-minimap-border)] bg-[var(--infra-minimap-bg)] hover:border-[var(--infra-minimap-border-hover)] hover:bg-[var(--infra-minimap-bg-hover)] ${className}`,
    [className]
  );

  // Optimized color callbacks with type safety, basically prevent any type usage
  const getNodeColor = useCallback((node: { data?: { category?: string }; type?: string }) => {
    const category = resolveCategory(node.data?.category || node.type);
    return CATEGORY_COLORS[category];
  }, []);

  const getNodeStroke = useCallback((node: { data?: { category?: string }; type?: string }) => {
    const category = resolveCategory(node.data?.category || node.type);
    return CATEGORY_BORDERS[category] || CATEGORY_BORDERS.VIEW;
  }, []);

  return (
    <MiniMap
      className={computedClassName}
      position={position}
      pannable={pannable}
      zoomable={zoomable}
      ariaLabel={ariaLabel}
      nodeColor={getNodeColor}
      nodeStrokeColor={getNodeStroke}
      nodeStrokeWidth={NODE_STROKE_WIDTH}
      maskColor="var(--infra-minimap-mask)"
      style={MINIMAP_STYLE}
    />
  );
};

export const ThemedMiniMap = memo(ThemedMiniMapComponent);

export default ThemedMiniMap;
