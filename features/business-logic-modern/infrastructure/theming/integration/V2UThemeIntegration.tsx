/**
 * V2U THEME INTEGRATION - Seamless theming across all node systems
 *
 * 🎯 PURPOSE:
 * • Unified theming for NodeFactory and defineNode systems
 * • Auto-registration and detection of node themes
 * • Performance optimized with caching and lazy loading
 * • Zero-configuration setup for new nodes
 * • Backward compatibility with existing theming
 *
 * 🚀 INTEGRATION POINTS:
 * • NodeFactory: Enhanced useNodeStyling hook
 * • defineNode: Category theme injection
 * • Theme initialization: Auto-detection of all nodes
 * • Runtime updates: Hot theme swapping
 * • Development tools: Theme debugging and validation
 *
 * Keywords: v2u-integration, unified-theming, auto-detection, performance, compatibility
 */

import { useEffect, useMemo } from "react";
import {
  initializeUnifiedThemeSystem,
  useUnifiedThemeStore,
  type NodeCategory,
} from "../core/UnifiedThemeSystem";
import {
  useBulkRegisterNodes,
  useEnhancedNodeStyling,
  useUnifiedNodeTheme,
} from "../hooks/useUnifiedTheme";

// ============================================================================
// V2U THEME INITIALIZATION
// ============================================================================

/**
 * Initialize V2U theming system
 * Should be called once at app startup
 */
export function initializeV2UTheming(
  options: {
    enableDebug?: boolean;
    autoDetectExistingNodes?: boolean;
    customThemes?: Record<string, any>;
  } = {}
) {
  const {
    enableDebug = false,
    autoDetectExistingNodes = true,
    customThemes = {},
  } = options;

  // Initialize the unified theme system
  const themeStore = initializeUnifiedThemeSystem({
    enableDebug,
    autoDetection: true,
  });

  // Auto-detect existing nodes if requested
  if (autoDetectExistingNodes) {
    autoDetectAllExistingNodes();
  }

  // Import custom themes if provided
  if (Object.keys(customThemes).length > 0) {
    themeStore.importThemes(JSON.stringify({ customThemes }));
  }

  if (enableDebug) {
    console.log("🎨 [V2U Theme] System initialized:", themeStore.getStats());
  }

  return themeStore;
}

/**
 * Auto-detect all existing nodes in the system
 */
function autoDetectAllExistingNodes() {
  try {
    // Try to get nodes from various registries
    const nodeTypes = new Set<string>();

    // Check if NodeFactory registry exists
    if (typeof window !== "undefined" && (window as any).__NODE_REGISTRY__) {
      const registry = (window as any).__NODE_REGISTRY__;
      Object.keys(registry).forEach((nodeType) => nodeTypes.add(nodeType));
    }

    // Check if defineNode registry exists
    if (
      typeof window !== "undefined" &&
      (window as any).__DEFINE_NODE_REGISTRY__
    ) {
      const registry = (window as any).__DEFINE_NODE_REGISTRY__;
      Object.keys(registry).forEach((nodeType) => nodeTypes.add(nodeType));
    }

    // Bulk register all found nodes
    if (nodeTypes.size > 0) {
      const nodes = Array.from(nodeTypes).map((nodeType) => ({ nodeType }));
      useUnifiedThemeStore.getState().bulkRegisterNodes(nodes);
      console.log(
        `🎨 [V2U Theme] Auto-detected ${nodeTypes.size} existing nodes`
      );
    }
  } catch (error) {
    console.warn("🎨 [V2U Theme] Failed to auto-detect existing nodes:", error);
  }
}

// ============================================================================
// NODEFACTORY INTEGRATION
// ============================================================================

/**
 * Enhanced NodeFactory theming hook
 * Drop-in replacement for original useNodeStyling
 */
export function useV2UNodeFactoryStyling(
  nodeType: string,
  selected: boolean,
  error: string | null,
  isActive: boolean,
  nodeData?: any
) {
  // Get enhanced styling with unified theming
  const enhancedStyling = useEnhancedNodeStyling(
    nodeType,
    selected,
    error,
    isActive,
    nodeData,
    { autoRegister: true }
  );

  // Return enhanced styling with backward compatibility
  return useMemo(
    () => ({
      // Original interface (backward compatibility)
      nodeStyleClasses: enhancedStyling.combinedClasses,
      buttonTheme: enhancedStyling.buttonTheme,
      textTheme: enhancedStyling.textTheme,
      categoryBaseClasses: enhancedStyling.unifiedTheme?.classes || {
        background: "bg-gray-50 dark:bg-gray-800",
        border: "border-gray-300 dark:border-gray-600",
        textPrimary: "text-gray-900 dark:text-gray-100",
        textSecondary: "text-gray-700 dark:text-gray-300",
      },
      categoryButtonTheme: enhancedStyling.buttonTheme,
      categoryTextTheme: enhancedStyling.textTheme,
      errorState: enhancedStyling.errorState,

      // Enhanced interface (new features)
      unifiedTheme: enhancedStyling.unifiedTheme,
      categoryClasses: enhancedStyling.categoryClasses,
      stateClasses: enhancedStyling.stateClasses,
      combinedClasses: enhancedStyling.combinedClasses,
    }),
    [enhancedStyling]
  );
}

/**
 * NodeFactory theme provider component
 * Wraps NodeFactory components with unified theming
 */
export function V2UNodeFactoryThemeProvider({
  children,
  nodeType,
}: {
  children: React.ReactNode;
  nodeType: string;
}) {
  const unifiedTheme = useUnifiedNodeTheme(nodeType, { autoRegister: true });

  // Apply CSS variables for theme colors
  const cssVariables = useMemo(() => {
    if (!unifiedTheme) return {};

    return {
      "--node-color-primary": unifiedTheme.colors.primary,
      "--node-color-secondary": unifiedTheme.colors.secondary,
      "--node-color-accent": unifiedTheme.colors.accent,
      "--node-category": unifiedTheme.category,
    };
  }, [unifiedTheme]);

  return (
    <div
      style={cssVariables}
      data-node-category={unifiedTheme?.category}
      data-theme-version="v2u"
    >
      {children}
    </div>
  );
}

// ============================================================================
// DEFINENODE INTEGRATION
// ============================================================================

/**
 * defineNode theme injection hook
 * Provides theme data for defineNode render functions
 */
export function useV2UDefineNodeTheme(nodeType: string, metadata?: any) {
  const unifiedTheme = useUnifiedNodeTheme(nodeType, {
    autoRegister: true,
    metadata,
  });

  // Convert to defineNode expected format
  return useMemo(() => {
    if (!unifiedTheme) {
      return {
        categoryTheme: null,
        categoryClasses: null,
      };
    }

    const { theme, classes } = unifiedTheme;

    return {
      categoryTheme: theme,
      categoryClasses: {
        background: classes.background,
        border: classes.border,
        textPrimary: classes.text,
        textSecondary: classes.text,
        button: classes.button,
        accent: unifiedTheme.colors.accent,
      },
      // Additional V2U data
      v2uTheme: unifiedTheme,
    };
  }, [unifiedTheme]);
}

/**
 * defineNode theme HOC
 * Wraps defineNode components with theme injection
 */
export function withV2UTheme<TProps extends { nodeType: string }>(
  Component: React.ComponentType<TProps>
) {
  return function V2UThemedComponent(props: TProps) {
    const themeData = useV2UDefineNodeTheme(props.nodeType);

    return <Component {...props} {...themeData} />;
  };
}

// ============================================================================
// RUNTIME THEME MANAGEMENT
// ============================================================================

/**
 * Runtime theme manager
 * Provides theme management capabilities during development
 */
export function useV2UThemeManager() {
  const themeStore = useUnifiedThemeStore();
  const bulkRegister = useBulkRegisterNodes();

  const manager = useMemo(
    () => ({
      // Registration
      registerNode: (nodeType: string, metadata?: any) => {
        return themeStore.registerNode(nodeType, metadata);
      },

      registerNodes: (nodes: Array<{ nodeType: string; metadata?: any }>) => {
        bulkRegister(nodes);
      },

      // Theme customization
      setCustomTheme: (category: NodeCategory, theme: any) => {
        themeStore.setCustomTheme(category, theme);
      },

      resetTheme: (category: NodeCategory) => {
        themeStore.resetTheme(category);
      },

      // System management
      clearCache: () => {
        themeStore.clearCache();
      },

      getStats: () => {
        return themeStore.getStats();
      },

      // Import/Export
      exportThemes: () => {
        return themeStore.exportThemes();
      },

      importThemes: (themesJson: string) => {
        themeStore.importThemes(themesJson);
      },

      // Debug utilities
      debugNode: (nodeType: string) => {
        const themeData = themeStore.getTheme(nodeType);
        console.log(`🎨 [V2U Theme Debug] ${nodeType}:`, themeData);
        return themeData;
      },

      validateAllThemes: () => {
        const stats = themeStore.getStats();
        const issues = [];

        if (stats.totalNodes !== stats.categorizedNodes) {
          issues.push(
            `${stats.totalNodes - stats.categorizedNodes} nodes without categories`
          );
        }

        console.log(
          `🎨 [V2U Theme Validation] Found ${issues.length} issues:`,
          issues
        );
        return { valid: issues.length === 0, issues };
      },
    }),
    [themeStore, bulkRegister]
  );

  return manager;
}

// ============================================================================
// DEVELOPMENT TOOLS
// ============================================================================

/**
 * Theme development panel component
 * Visual interface for theme management during development
 */
export function V2UThemeDevelopmentPanel() {
  const manager = useV2UThemeManager();
  const stats = useUnifiedThemeStore((state) => state.getStats());
  const debugMode = useUnifiedThemeStore((state) => state.debugMode);
  const toggleDebug = useUnifiedThemeStore((state) => state.toggleDebugMode);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 z-50">
      <div className="text-sm font-semibold mb-2">🎨 V2U Theme Manager</div>

      <div className="space-y-2 text-xs">
        <div>
          Nodes: {stats.totalNodes} | Categorized: {stats.categorizedNodes}
        </div>
        <div>
          Custom: {stats.customCategories} | Cache: {stats.cacheHits}/
          {stats.cacheHits + stats.cacheMisses}
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={toggleDebug}
            className={`px-2 py-1 rounded text-xs ${
              debugMode ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Debug: {debugMode ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => manager.clearCache()}
            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
          >
            Clear Cache
          </button>

          <button
            onClick={() => manager.validateAllThemes()}
            className="px-2 py-1 bg-green-200 text-green-700 rounded text-xs"
          >
            Validate
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Auto-initialization hook
 * Automatically initializes V2U theming when component mounts
 */
export function useV2UAutoInit(
  options: {
    enableDebug?: boolean;
    showDevPanel?: boolean;
  } = {}
) {
  const {
    enableDebug = false,
    showDevPanel = process.env.NODE_ENV === "development",
  } = options;

  useEffect(() => {
    initializeV2UTheming({ enableDebug, autoDetectExistingNodes: true });
  }, [enableDebug]);

  return { showDevPanel };
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy compatibility functions
 * Ensure existing code continues to work
 */
export function enableCategoryTheming() {
  useUnifiedThemeStore.getState().enableThemeSystem();
}

export function useCategoryTheme(nodeType: string) {
  const unifiedTheme = useUnifiedNodeTheme(nodeType, { autoRegister: true });
  return unifiedTheme?.theme || null;
}

export function useNodeCategoryBaseClasses(nodeType: string) {
  const unifiedTheme = useUnifiedNodeTheme(nodeType, { autoRegister: true });

  if (!unifiedTheme) return null;

  const { classes } = unifiedTheme;
  return {
    background: classes.background,
    border: classes.border,
    textPrimary: classes.text,
    textSecondary: classes.text,
  };
}

// ============================================================================
// MIGRATION UTILITIES
// ============================================================================

/**
 * Migrate from old theming system
 */
export function migrateFromLegacyTheming(legacyThemes: any) {
  const manager = useV2UThemeManager();

  try {
    // Convert legacy themes to V2U format
    const convertedThemes = convertLegacyThemes(legacyThemes);
    manager.importThemes(JSON.stringify({ customThemes: convertedThemes }));

    console.log("🎨 [V2U Theme] Successfully migrated legacy themes");
  } catch (error) {
    console.error("🎨 [V2U Theme] Failed to migrate legacy themes:", error);
  }
}

function convertLegacyThemes(legacyThemes: any): any {
  // Implementation would depend on your legacy theme format
  // This is a placeholder
  return legacyThemes;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Legacy compatibility
  enableCategoryTheming,
  // Core initialization
  initializeV2UTheming,
  // Migration utilities
  migrateFromLegacyTheming,
  useCategoryTheme,
  useNodeCategoryBaseClasses,
  useV2UAutoInit,
  // defineNode integration
  useV2UDefineNodeTheme,
  // NodeFactory integration
  useV2UNodeFactoryStyling,
  // Runtime management
  useV2UThemeManager,
  V2UNodeFactoryThemeProvider,
  // Development tools
  V2UThemeDevelopmentPanel,
  withV2UTheme,
};
