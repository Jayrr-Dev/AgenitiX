/**
 * V2U CONTROL REGISTRY - Registry for V2U control resolution and metadata
 *
 * 🎯 V2U CONTROL REGISTRY: Central registry for V2U control resolution
 * • Node metadata extraction and V2U detection
 * • Control resolution with fallback mechanisms
 * • Enhanced features tracking and debugging
 * • Integration with defineNode() system
 * • Type-safe control component resolution
 *
 * Keywords: v2u-registry, control-resolution, metadata, defineNode, type-safety
 */

import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import React from "react";
import {
  isV2UNode as autoIsV2UNode,
  autoResolveControl,
} from "./controls/V2UAutoControls";
import { BaseControlProps } from "./types";

// ============================================================================
// V2U METADATA INTERFACES
// ============================================================================

export interface V2UControlConfig {
  category: string;
  enhancedFeatures: string[];
  priority?: number;
}

export interface V2UMetadata {
  nodeType: string;
  isV2UNode: boolean;
  controlConfig: V2UControlConfig;
  metadata?: {
    version?: string;
    migrationDate?: number;
    author?: string;
    [key: string]: any;
  };
}

export interface V2UControlResolution {
  ControlComponent: React.FC<BaseControlProps> | null;
  isV2UControl: boolean;
  controlType: string | null;
  metadata: V2UMetadata | null;
}

export interface V2UNodeMetadata {
  migrated: boolean;
  version?: string;
  migrationDate?: number;
  [key: string]: any;
}

// ============================================================================
// V2U METADATA EXTRACTION
// ============================================================================

/**
 * Extract V2U metadata from a node
 */
export function getV2UMetadata(node: AgenNode): V2UNodeMetadata {
  const nodeData = node.data as any;

  return {
    migrated: !!(
      nodeData._v2uMigrated === true ||
      nodeData._v2uVersion !== undefined ||
      nodeData._defineNodeConfig !== undefined ||
      nodeData._v2uMigrationDate !== undefined
    ),
    version: nodeData._v2uVersion || nodeData._defineNodeConfig?.version,
    migrationDate: nodeData._v2uMigrationDate,
    ...(nodeData._defineNodeConfig?.metadata || {}),
  };
}

/**
 * Check if a node is V2U-enhanced
 */
export function isV2UNode(node: AgenNode): boolean {
  return autoIsV2UNode(node);
}

// ============================================================================
// CONTROL RESOLUTION
// ============================================================================

/**
 * Resolve the appropriate V2U control for a node
 */
export function resolveV2UControl(
  node: AgenNode,
  debugMode = false
): V2UControlResolution {
  const autoResolution = autoResolveControl(node);
  const nodeMetadata = getV2UMetadata(node);
  const nodeType = node.type;

  // Enhanced features based on node type and V2U status
  const enhancedFeatures = autoResolution.isV2U
    ? [
        "performance-optimized",
        "lifecycle-hooks",
        "error-handling",
        "type-safety",
      ]
    : ["basic-controls"];

  // Add specific features based on node type
  if (nodeType.includes("trigger")) {
    enhancedFeatures.push("trigger-management", "event-propagation");
  } else if (nodeType.includes("text")) {
    enhancedFeatures.push("rich-text", "validation");
  }

  const controlConfig: V2UControlConfig = {
    category: getNodeCategory(nodeType),
    enhancedFeatures,
    priority: autoResolution.isV2U ? 10 : 5,
  };

  const metadata: V2UMetadata = {
    nodeType,
    isV2UNode: autoResolution.isV2U,
    controlConfig,
    metadata: nodeMetadata.version
      ? {
          version: nodeMetadata.version,
          migrationDate: nodeMetadata.migrationDate,
        }
      : undefined,
  };

  const controlType = getControlTypeName(nodeType, autoResolution.method);

  if (debugMode) {
    console.log(`[V2UControlRegistry] Resolved control for ${nodeType}:`, {
      hasControl: !!autoResolution.ControlComponent,
      isV2U: autoResolution.isV2U,
      method: autoResolution.method,
      controlType,
      enhancedFeatures,
    });
  }

  return {
    ControlComponent: autoResolution.ControlComponent,
    isV2UControl: autoResolution.isV2U,
    controlType,
    metadata,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get node category based on node type
 */
function getNodeCategory(nodeType: string): string {
  const type = nodeType.toLowerCase();

  if (type.includes("trigger")) return "trigger";
  if (type.includes("text")) return "content";
  if (type.includes("view")) return "output";
  if (type.includes("test")) return "testing";

  return "general";
}

/**
 * Get control type name for display
 */
function getControlTypeName(nodeType: string, method: string): string | null {
  const type = nodeType.toLowerCase();

  if (method === "none") return null;

  if (type.includes("text")) return "Text Control";
  if (type.includes("trigger")) {
    if (type.includes("click")) return "Click Trigger";
    if (type.includes("toggle")) return "Toggle Trigger";
    if (type.includes("pulse")) return "Pulse Trigger";
    return "Generic Trigger";
  }

  return "Custom Control";
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getV2UMetadata,
  isV2UNode,
  resolveV2UControl,
};
