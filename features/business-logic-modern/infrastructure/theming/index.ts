/**
 * UNIFIED THEME SYSTEM - Main Export Index
 *
 * 🎯 SINGLE ENTRY POINT for all theming functionality
 * • Core theme system with auto-detection
 * • Unified hooks for NodeFactory and defineNode
 * • V2U integration and compatibility
 * • Development tools and utilities
 * • Legacy compatibility layer
 *
 * 🚀 USAGE:
 * ```typescript
 * import {
 *   useUnifiedNodeTheme,
 *   initializeV2UTheming,
 *   V2UThemeDevelopmentPanel
 * } from '@/theming';
 * ```
 *
 * Keywords: unified-theming, auto-detection, v2u-integration, single-entry-point
 */

// ============================================================================
// CORE THEME SYSTEM
// ============================================================================

export {
  // Default themes
  DEFAULT_THEME_COLORS,
  autoDetectNodeCategory,
  generateThemeFromColors,
  initializeUnifiedThemeSystem,
  // Core unified theme system
  useUnifiedThemeStore,
  type CategoryTheme,
  // Core types
  type NodeCategory,
  type NodeThemeData,
  type ThemeColors,
  type ThemeSystemState,
} from "./core/UnifiedThemeSystem";

// ============================================================================
// UNIFIED THEME HOOKS
// ============================================================================

export {
  useAutoTheme,
  useAvailableCategories,
  useBulkRegisterNodes,
  // Legacy compatibility hooks
  useCategoryTheme,
  useEnhancedNodeStyling,
  useIsCustomTheme,
  // Convenience hooks
  useNodeCategory,
  useNodeCategoryBaseClasses,
  useThemeActions,
  useThemeClasses,
  // Main unified hooks
  useUnifiedNodeTheme,
  type EnhancedNodeStyling,
  // Hook types
  type UnifiedThemeResult,
} from "./hooks/useUnifiedTheme";

// ============================================================================
// V2U INTEGRATION
// ============================================================================

export {
  V2UNodeFactoryThemeProvider,
  // Development tools
  V2UThemeDevelopmentPanel,

  // Legacy compatibility (re-exported for convenience)
  enableCategoryTheming,
  // Core V2U initialization
  initializeV2UTheming,
  // Migration utilities
  migrateFromLegacyTheming,
  useV2UAutoInit,
  // defineNode integration
  useV2UDefineNodeTheme,
  // NodeFactory integration
  useV2UNodeFactoryStyling,
  // Runtime management
  useV2UThemeManager,
  withV2UTheme,
} from "./integration/V2UThemeIntegration";

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick setup for V2U theming system
 * Call this once in your app root
 */
export function setupV2UTheming(
  options: {
    enableDebug?: boolean;
    showDevPanel?: boolean;
    autoDetectNodes?: boolean;
  } = {}
) {
  const {
    enableDebug = process.env.NODE_ENV === "development",
    showDevPanel = process.env.NODE_ENV === "development",
    autoDetectNodes = true,
  } = options;

  // Initialize the system
  const themeStore = initializeV2UTheming({
    enableDebug,
    autoDetectExistingNodes: autoDetectNodes,
  });

  if (enableDebug) {
    console.log("🎨 [V2U Theme] System setup complete");
  }

  return {
    themeStore,
    showDevPanel,
  };
}

/**
 * Get theme for any node (convenience function)
 */
export function getNodeTheme(nodeType: string) {
  return useUnifiedThemeStore.getState().getTheme(nodeType);
}

/**
 * Register a single node with theming system (convenience function)
 */
export function registerNodeTheme(nodeType: string, metadata?: any) {
  return useUnifiedThemeStore.getState().registerNode(nodeType, metadata);
}

/**
 * Check if theming system is ready
 */
export function isThemeSystemReady() {
  const stats = useUnifiedThemeStore.getState().getStats();
  return stats.totalNodes > 0;
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

// Re-export old theming functions for backward compatibility
export {
  useNodeCategoryBaseClasses as useCategoryBaseClasses,
  useCategoryTheme as useNodeCategoryTheme,
} from "./hooks/useUnifiedTheme";

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  CategoryTheme,
  EnhancedNodeStyling,
  // All core types (re-exported for convenience)
  NodeCategory,
  NodeThemeData,
  ThemeColors,
  ThemeSystemState,
  UnifiedThemeResult,
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const THEME_SYSTEM_VERSION = "v2u-1.0.0";

export const SUPPORTED_CATEGORIES: NodeCategory[] = [
  "create",
  "transform",
  "output",
  "logic",
  "utility",
  "testing",
  "data",
  "media",
  "ai",
  "api",
  "database",
  "file",
  "time",
  "math",
  "string",
  "array",
  "object",
  "custom",
];

export const THEME_SYSTEM_CONFIG = {
  autoDetection: true,
  caching: true,
  hotReload: process.env.NODE_ENV === "development",
  debugMode: process.env.NODE_ENV === "development",
  legacyCompatibility: true,
};

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================

if (process.env.NODE_ENV === "development") {
  // Expose theme system to window for debugging
  if (typeof window !== "undefined") {
    (window as any).__V2U_THEME_SYSTEM__ = {
      store: useUnifiedThemeStore,
      getTheme: getNodeTheme,
      registerNode: registerNodeTheme,
      isReady: isThemeSystemReady,
      version: THEME_SYSTEM_VERSION,
    };
  }
}

// ============================================================================
// MODULE DOCUMENTATION
// ============================================================================

/**
 * @fileoverview Unified Theme System for V2U Architecture
 *
 * This module provides a complete theming solution that:
 *
 * 1. **Auto-detects node categories** from node types and metadata
 * 2. **Provides consistent theming** across NodeFactory and defineNode
 * 3. **Minimizes registration overhead** through smart auto-detection
 * 4. **Offers flexible customization** with easy theme overrides
 * 5. **Maintains backward compatibility** with existing theming code
 * 6. **Includes development tools** for theme debugging and validation
 *
 * ## Quick Start
 *
 * ```typescript
 * // 1. Initialize in your app root
 * import { setupV2UTheming, V2UThemeDevelopmentPanel } from '@/theming';
 *
 * function App() {
 *   const { showDevPanel } = setupV2UTheming();
 *
 *   return (
 *     <div>
 *       {/* Your app content *\/}
 *       {showDevPanel && <V2UThemeDevelopmentPanel />}
 *     </div>
 *   );
 * }
 *
 * // 2. Use in NodeFactory components
 * import { useV2UNodeFactoryStyling } from '@/theming';
 *
 * function MyNodeComponent({ nodeType, selected, error, isActive, data }) {
 *   const styling = useV2UNodeFactoryStyling(nodeType, selected, error, isActive, data);
 *   return <div className={styling.combinedClasses}>...</div>;
 * }
 *
 * // 3. Use in defineNode components
 * import { useV2UDefineNodeTheme } from '@/theming';
 *
 * const MyNode = defineNode({
 *   renderExpanded: ({ nodeType, ...props }) => {
 *     const { categoryTheme, categoryClasses } = useV2UDefineNodeTheme(nodeType);
 *     return <div className={categoryClasses.background}>...</div>;
 *   }
 * });
 * ```
 *
 * ## Features
 *
 * - ✅ **Zero-config setup**: Auto-detects categories from node types
 * - ✅ **Flexible theming**: 19+ built-in categories, easily customizable
 * - ✅ **Performance optimized**: Caching, lazy loading, memoization
 * - ✅ **Developer friendly**: Debug panel, validation, hot reloading
 * - ✅ **Backward compatible**: Drop-in replacement for existing theming
 * - ✅ **V2U integrated**: Seamless integration with V2U architecture
 *
 * @version v2u-1.0.0
 * @author V2U Theme Team
 */
