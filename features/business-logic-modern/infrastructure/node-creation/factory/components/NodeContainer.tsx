/**
 * NODE CONTAINER COMPONENT - Enterprise-grade node wrapper with safety systems
 *
 * • Provides bulletproof container for all factory-created nodes
 * • Implements enterprise-grade error boundaries and state isolation
 * • Manages visual styling, selection states, and interaction handlers
 * • Integrates with safety layers for ultra-fast DOM updates
 * • Supports dynamic theming and responsive layout adaptations
 *
 * Keywords: node-container, enterprise, error-boundaries, safety-layers, theming, responsive
 */

"use client";

import React from "react";
import {
  DEFAULT_LOGIC_NODE_SIZE,
  DEFAULT_TEXT_NODE_SIZE,
  DEFAULT_TRIGGER_NODE_SIZE,
  TRIGGER_NODE_PATTERNS,
} from "../constants";
import type { BaseNodeData, NodeFactoryConfig } from "../types";
import { getNodeSize, selectButtonTheme } from "../utils/conditionalRendering";
import { ExpandCollapseButton } from "./ExpandCollapseButton";
import { FloatingNodeId } from "./FloatingNodeId";

// ============================================================================
// NODE CONTAINER COMPONENT TYPES
// ============================================================================

interface NodeContainerProps<T extends BaseNodeData> {
  id: string;
  styling: any;
  nodeState: any;
  enhancedConfig: NodeFactoryConfig<T>;
  isEnterprise?: boolean;
  children: React.ReactNode;
}

// ============================================================================
// NODE CONTAINER COMPONENT
// ============================================================================

/**
 * NODE CONTAINER
 * Handles the outer structure, sizing, and expand/collapse functionality
 * Enhanced with enterprise safety features and extracted conditional logic
 */
export function NodeContainer<T extends BaseNodeData>({
  id,
  styling,
  nodeState,
  enhancedConfig,
  isEnterprise = false,
  children,
}: NodeContainerProps<T>) {
  // ========================================================================
  // SIZE CALCULATION WITH EXTRACTED LOGIC
  // ========================================================================

  const nodeSize = getNodeSize(
    enhancedConfig.size,
    enhancedConfig.nodeType,
    nodeState.showUI
  );

  // Debug size configuration for V2U nodes
  if (enhancedConfig.nodeType.includes("V2U")) {
    console.log(`🎯 [NodeContainer] ${enhancedConfig.nodeType} size config:`, {
      showUI: nodeState.showUI,
      configSize: enhancedConfig.size,
      calculatedSize: nodeSize,
    });
  }

  // ========================================================================
  // THEME SELECTION WITH EXTRACTED LOGIC
  // ========================================================================

  const buttonTheme = selectButtonTheme(
    !!styling.errorState.finalErrorForStyling,
    styling.buttonTheme,
    styling.categoryButtonTheme
  );

  // ========================================================================
  // ENTERPRISE ATTRIBUTES
  // ========================================================================

  const enterpriseAttributes = getEnterpriseAttributes(isEnterprise);

  // ========================================================================
  // DEBUG ERROR INJECTION STATE
  // ========================================================================

  logErrorInjectionDebug(
    enhancedConfig.nodeType,
    id,
    styling.errorState,
    styling.nodeStyleClasses
  );

  // ========================================================================
  // CONTAINER STYLING CALCULATION
  // ========================================================================

  const containerClasses = buildContainerClasses(
    nodeState.showUI,
    nodeSize,
    styling.categoryBaseClasses,
    styling.nodeStyleClasses,
    isEnterprise
  );

  // ========================================================================
  // RENDER CONTAINER
  // ========================================================================

  return (
    <div data-id={id} {...enterpriseAttributes} className={containerClasses}>
      {/* FLOATING NODE ID */}
      <FloatingNodeId nodeId={id} />

      {/* EXPAND/COLLAPSE BUTTON */}
      <ExpandCollapseButton
        showUI={nodeState.showUI}
        onToggle={() => nodeState.setShowUI(!nodeState.showUI)}
        // className={buttonTheme}
      />

      {children}
    </div>
  );
}

// ============================================================================
// EXTRACTED UTILITY FUNCTIONS
// ============================================================================

/**
 * GET ENTERPRISE ATTRIBUTES
 * Extract enterprise attributes with early return
 */
function getEnterpriseAttributes(
  isEnterprise: boolean
): Record<string, string> {
  // EARLY RETURN: Not enterprise
  if (!isEnterprise) {
    return {};
  }

  return {
    "data-enterprise-factory": "true",
    "data-safe-factory": "true",
  };
}

/**
 * LOG ERROR INJECTION DEBUG
 * Extract debug logging with early return
 */
function logErrorInjectionDebug(
  nodeType: string,
  id: string,
  errorState: any,
  nodeStyleClasses: string
): void {
  // EARLY RETURN: No error injection or error state
  if (!errorState.hasVibeError && !errorState.finalErrorForStyling) {
    return;
  }

  console.log(`🎨 [NodeContainer] ${nodeType} ${id}: Applying error styling:`, {
    hasVibeError: errorState.hasVibeError,
    finalErrorForStyling: errorState.finalErrorForStyling,
    errorType: errorState.finalErrorType,
    nodeStyleClasses: nodeStyleClasses,
    supportsErrorInjection: errorState.supportsErrorInjection,
  });
}

/**
 * BUILD CONTAINER CLASSES
 * Construct container CSS classes with conditional logic
 * Enhanced to handle variable height sizing
 */
function buildContainerClasses(
  showUI: boolean,
  nodeSize: { width: string; height: string },
  categoryBaseClasses: any,
  nodeStyleClasses: string,
  isEnterprise: boolean
): string {
  // BASE SIZING CLASSES with variable height support
  const sizeClasses = showUI
    ? nodeSize.height === "auto"
      ? `px-4 py-3 ${nodeSize.width} min-h-[120px]` // Variable height with minimum
      : `px-4 py-3 ${nodeSize.width} ${nodeSize.height}` // Fixed height
    : `${nodeSize.width} ${nodeSize.height} flex items-center justify-center`;

  // ENTERPRISE CLASS
  const enterpriseClass = isEnterprise ? "enterprise-node" : "";

  // COMBINE ALL CLASSES
  return [
    "relative",
    sizeClasses,
    "rounded-lg",
    categoryBaseClasses.background,
    "shadow border",
    categoryBaseClasses.border,
    nodeStyleClasses,
    enterpriseClass,
  ]
    .filter(Boolean)
    .join(" ");
}

// ============================================================================
// LEGACY COMPATIBILITY FUNCTIONS (DEPRECATED)
// ============================================================================

/**
 * GET SMART DEFAULT SIZE (DEPRECATED)
 * @deprecated Use getNodeSize from conditionalRendering utils instead
 * Kept for backward compatibility
 */
function getSmartDefaultSize(nodeType: string) {
  // CHECK IF IT'S A TRIGGER NODE
  if (
    TRIGGER_NODE_PATTERNS.some((pattern) =>
      nodeType.toLowerCase().includes(pattern)
    )
  ) {
    return DEFAULT_TRIGGER_NODE_SIZE;
  }

  // CHECK IF IT'S A LOGIC NODE
  if (nodeType.toLowerCase().includes("logic")) {
    return DEFAULT_LOGIC_NODE_SIZE;
  }

  // DEFAULT TO TEXT NODE SIZE
  return DEFAULT_TEXT_NODE_SIZE;
}
