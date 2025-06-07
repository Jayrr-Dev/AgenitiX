/**
 * UNIFIED THEME SYSTEM INITIALIZATION
 *
 * 🎯 SIMPLE SETUP for automatic theming
 * • Auto-detects all existing nodes in the system
 * • Enables unified theming with zero configuration
 * • Provides backward compatibility
 * • Performance optimized initialization
 *
 * 🚀 USAGE:
 * ```typescript
 * import { initializeTheming } from '@/theming/init';
 *
 * // Call once in your app root
 * initializeTheming();
 * ```
 *
 * Keywords: theme-initialization, auto-detection, zero-config, performance
 */

import {
  initializeUnifiedThemeSystem,
  useUnifiedThemeStore,
} from "./core/UnifiedThemeSystem";

// ============================================================================
// INITIALIZATION FUNCTIONS
// ============================================================================

/**
 * Initialize unified theming system
 * Call this once in your app root component
 */
export function initializeTheming(
  options: {
    enableDebug?: boolean;
    autoDetectNodes?: boolean;
  } = {}
) {
  const {
    enableDebug = process.env.NODE_ENV === "development",
    autoDetectNodes = true,
  } = options;

  try {
    // Initialize the core theme system
    const themeStore = initializeUnifiedThemeSystem({
      enableDebug,
      autoDetection: true,
    });

    // Auto-detect existing nodes if requested
    if (autoDetectNodes) {
      setTimeout(() => {
        autoDetectExistingNodes();
      }, 100); // Small delay to let other systems initialize
    }

    if (enableDebug) {
      console.log("🎨 [Theme Init] Unified theming system initialized");
    }

    return themeStore;
  } catch (error) {
    console.warn("🎨 [Theme Init] Failed to initialize theming system:", error);
    return null;
  }
}

/**
 * Auto-detect all existing nodes in the system
 */
function autoDetectExistingNodes() {
  try {
    const nodeTypes = new Set<string>();

    // Check various global registries that might exist
    if (typeof window !== "undefined") {
      // Check NodeFactory registry
      if ((window as any).__NODE_REGISTRY__) {
        const registry = (window as any).__NODE_REGISTRY__;
        Object.keys(registry).forEach((nodeType) => nodeTypes.add(nodeType));
      }

      // Check defineNode registry
      if ((window as any).__DEFINE_NODE_REGISTRY__) {
        const registry = (window as any).__DEFINE_NODE_REGISTRY__;
        Object.keys(registry).forEach((nodeType) => nodeTypes.add(nodeType));
      }

      // Check any other common node registries
      if ((window as any).nodeRegistry) {
        const registry = (window as any).nodeRegistry;
        if (typeof registry === "object") {
          Object.keys(registry).forEach((nodeType) => nodeTypes.add(nodeType));
        }
      }
    }

    // Register all found nodes
    if (nodeTypes.size > 0) {
      const nodes = Array.from(nodeTypes).map((nodeType) => ({ nodeType }));
      useUnifiedThemeStore.getState().bulkRegisterNodes(nodes);

      console.log(
        `🎨 [Theme Init] Auto-detected ${nodeTypes.size} existing nodes`
      );
    } else {
      console.log("🎨 [Theme Init] No existing nodes found to auto-detect");
    }
  } catch (error) {
    console.warn(
      "🎨 [Theme Init] Failed to auto-detect existing nodes:",
      error
    );
  }
}

/**
 * Check if theming system is ready
 */
export function isThemingReady(): boolean {
  try {
    const stats = useUnifiedThemeStore.getState().getStats();
    return stats.totalNodes > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get theme system stats
 */
export function getThemingStats() {
  try {
    return useUnifiedThemeStore.getState().getStats();
  } catch (error) {
    return {
      totalNodes: 0,
      categorizedNodes: 0,
      customCategories: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }
}

/**
 * Enable theme debug mode
 */
export function enableThemeDebug() {
  try {
    useUnifiedThemeStore.getState().toggleDebugMode();
    console.log("🎨 [Theme Debug] Debug mode enabled");
  } catch (error) {
    console.warn("🎨 [Theme Debug] Failed to enable debug mode:", error);
  }
}

// ============================================================================
// REACT HOOK FOR INITIALIZATION
// ============================================================================

import { useEffect } from "react";

/**
 * React hook to initialize theming system
 * Use this in your app root component
 */
export function useThemeInitialization(
  options: {
    enableDebug?: boolean;
    autoDetectNodes?: boolean;
  } = {}
) {
  useEffect(() => {
    initializeTheming(options);
  }, []);

  return {
    isReady: isThemingReady(),
    stats: getThemingStats(),
    enableDebug: enableThemeDebug,
  };
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy function names for backward compatibility
 */
export const setupTheming = initializeTheming;
export const initThemes = initializeTheming;
export const enableCategoryTheming = initializeTheming;

// ============================================================================
// EXPORTS
// ============================================================================

export { autoDetectExistingNodes, initializeTheming as default };
