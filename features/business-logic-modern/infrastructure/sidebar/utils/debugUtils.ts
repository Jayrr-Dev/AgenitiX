/**
 * SIDEBAR DEBUG UTILITIES - Debug tools for sidebar development (SILENT MODE)
 *
 * • Silent debugging utilities for development and troubleshooting
 * • Node registry inspection and validation
 * • Configuration testing without console spam
 * • LocalStorage management tools
 *
 * Keywords: debugging, sidebar, registry, validation, silent-mode
 */

import { modernNodeRegistry } from "../../node-registry/nodespec-registry";

/**
 * Clear all sidebar-related localStorage data
 * Call this if you're experiencing sidebar issues related to stale localStorage
 */
const clearStorage = () => {
  const keysToRemove = [
    "sidebar-config",
    "sidebar-tabs",
    "sidebar-variant",
    "sidebar-custom-nodes",
    "node-registry-cache",
  ];

  keysToRemove.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value) {
      localStorage.removeItem(key);
    }
  });

  // Silent operation - no console logs
};

/**
 * Debug the current sidebar configuration
 * Shows detailed information about VARIANT_CONFIG and node registry
 */
const debugConfig = () => {
  // Silent config debugging - data available for inspection
  const {
    getSidebarStatistics,
    validateSidebarConfiguration,
  } = require("../../../sidebar/constants");
  const stats = getSidebarStatistics();
  const validation = validateSidebarConfiguration();

  // Return data instead of logging
  return {
    stats,
    validation,
    availableNodeTypes: Array.from(modernNodeRegistry.keys()),
  };
};

/**
 * Test node creation with a specific node type
 * Helps debug node registry issues
 */
const testNodeCreation = (nodeType: string) => {
  // Silent node creation testing
  if (!nodeType) {
    return { error: "Node type is required" };
  }

  if (!modernNodeRegistry.has(nodeType)) {
    return {
      error: `Node type '${nodeType}' not found`,
      available: Array.from(modernNodeRegistry.keys()),
    };
  }

  const metadata = getNodeMetadata(nodeType);
  if (!metadata) {
    return {
      error: `Failed to get metadata for '${nodeType}'`,
      available: Array.from(modernNodeRegistry.keys()),
    };
  }

  return {
    success: true,
    metadata: {
      displayName: metadata.displayName,
      category: metadata.category,
      folder: metadata.sidebar?.folder || "none",
      description: metadata.description,
    },
  };
};

// Export debug utilities (silent mode)
if (typeof window !== "undefined") {
  (window as any).debugSidebar = {
    clearStorage: clearStorage,
    debugConfig: debugConfig,
    testNode: testNodeCreation,
  };

  // Silent initialization - no console logs
}
