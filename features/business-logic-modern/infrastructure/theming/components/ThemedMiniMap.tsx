/**
 * THEMED MINI MAP COMPONENT - Miniature flow visualization with semantic theming
 * Optimised so that nodeColor / nodeStrokeColor callbacks are memoised
 * and the component itself is memoised to avoid unnecessary re-renders.
 */

"use client";

import { MiniMap } from "@xyflow/react";
import React, { memo, useCallback } from "react";

interface ThemedMiniMapProps {
  className?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  pannable?: boolean;
  zoomable?: boolean;
  ariaLabel?: string;
}

// Utility to resolve a node category string into a colour token key
const resolveCategory = (raw: unknown): string => {
  if (typeof raw !== "string") return "VIEW";
  if (raw === "createText" || raw.startsWith("create")) return "CREATE";
  if (raw.startsWith("view")) return "VIEW";
  if (raw.startsWith("trigger")) return "TRIGGER";
  if (raw.startsWith("test")) return "TEST";
  if (raw.startsWith("email")) return "EMAIL";
  if (raw.startsWith("flow")) return "FLOW";
  if (raw.startsWith("time")) return "TIME";
  if (raw.startsWith("ai")) return "AI";
  if (raw.startsWith("store")) return "STORE";
  if (raw.startsWith("cycle")) return "CYCLE";
  return "VIEW";
};

const categoryToBg: Record<string, string> = {
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
};

const categoryToBorder: Record<string, string> = {
  CREATE: "var(--node-create-bg-hover)",
  VIEW: "var(--node-view-bg-hover)",
  TRIGGER: "var(--node-trigger-bg-hover)",
  TEST: "var(--node-test-bg-hover)",
  CYCLE: "var(--node-cycle-bg-hover)",
  default: "var(--node-view-bg-hover)",
};

const ThemedMiniMapComponent: React.FC<ThemedMiniMapProps> = ({
  className = "",
  position = "bottom-right",
  pannable = true,
  zoomable = true,
  ariaLabel = "Mini map overview",
}) => {
  // Memoised colour callbacks so MiniMap isn't re-created each render
  const getNodeColor = useCallback((node: any) => {
    const category = resolveCategory(node.data?.category || node.type);
    return categoryToBg[category] ?? categoryToBg.VIEW;
  }, []);

  const getNodeStroke = useCallback((node: any) => {
    const category = resolveCategory(node.data?.category || node.type);
    return categoryToBorder[category] ?? categoryToBorder.default;
  }, []);

  return (
    <MiniMap
      className={`rounded border border-[var(--infra-minimap-border)] bg-[var(--infra-minimap-bg)] shadow-sm transition-colors duration-200 hover:border-[var(--infra-minimap-border-hover)] hover:bg-[var(--infra-minimap-bg-hover)] ${className}`}
      position={position}
      pannable={pannable}
      zoomable={zoomable}
      ariaLabel={ariaLabel}
      nodeColor={getNodeColor}
      nodeStrokeColor={getNodeStroke}
      nodeStrokeWidth={2}
      maskColor="var(--infra-minimap-mask)"
      style={{
        backgroundColor: "var(--infra-minimap-bg)",
        border: "1px solid var(--infra-minimap-border)",
      }}
    />
  );
};

export const ThemedMiniMap = memo(ThemedMiniMapComponent);

export default ThemedMiniMap;
