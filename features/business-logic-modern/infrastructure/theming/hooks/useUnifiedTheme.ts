/**
 * UNIFIED THEME HOOKS - Consistent theming API for all node systems
 *
 * 🎯 PURPOSE:
 * • Single API for NodeFactory and defineNode theming
 * • Auto-detection of node categories
 * • Performance optimized with caching
 * • Flexible theme customization
 * • V2U architecture integration
 *
 * 🚀 FEATURES:
 * • useUnifiedNodeTheme() - Main theme hook for any node
 * • useNodeStyling() - Enhanced styling with theme integration
 * • useThemeClasses() - CSS classes for any theme state
 * • useAutoTheme() - Auto-detect and apply themes
 * • useCategoryTheme() - Legacy compatibility
 *
 * Keywords: unified-hooks, auto-detection, performance, flexibility, v2u-integration
 */

import { useCallback, useMemo } from "react";
import {
  useNodeTheme,
  useUnifiedThemeStore,
  type CategoryTheme,
  type NodeCategory,
} from "../core/UnifiedThemeSystem";

// ============================================================================
// MAIN UNIFIED THEME HOOK
// ============================================================================

export interface UnifiedThemeResult {
  // Core theme data
  category: NodeCategory;
  theme: CategoryTheme;
  isCustom: boolean;

  // CSS classes for different states
  classes: {
    base: string;
    selected: string;
    active: string;
    error: string;
    warning: string;
    background: string;
    border: string;
    text: string;
    button: string;
  };

  // Theme colors for custom styling
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };

  // Actions
  actions: {
    customize: (overrides: Partial<CategoryTheme>) => void;
    reset: () => void;
    export: () => string;
  };

  // State helpers
  utils: {
    isDark: boolean;
    isLight: boolean;
    getStateClass: (
      state: "normal" | "selected" | "active" | "error" | "warning"
    ) => string;
    combineClasses: (
      ...classes: (string | undefined | null | false)[]
    ) => string;
  };
}

/**
 * MAIN UNIFIED THEME HOOK
 * Primary hook for getting complete theme data for any node
 */
export function useUnifiedNodeTheme(
  nodeType: string,
  options: {
    autoRegister?: boolean;
    metadata?: any;
    fallbackCategory?: NodeCategory;
  } = {}
): UnifiedThemeResult | null {
  const {
    autoRegister = true,
    metadata,
    fallbackCategory = "custom",
  } = options;

  // Get theme store actions
  const registerNode = useUnifiedThemeStore((state) => state.registerNode);
  const setCustomTheme = useUnifiedThemeStore((state) => state.setCustomTheme);
  const resetTheme = useUnifiedThemeStore((state) => state.resetTheme);
  const exportThemes = useUnifiedThemeStore((state) => state.exportThemes);
  const enabled = useUnifiedThemeStore((state) => state.enabled);

  // Auto-register node if needed
  const category = useMemo(() => {
    if (autoRegister) {
      return registerNode(nodeType, metadata);
    }
    return fallbackCategory;
  }, [nodeType, metadata, autoRegister, fallbackCategory, registerNode]);

  // Get theme data
  const themeData = useNodeTheme(nodeType);

  // Detect dark mode (you might want to use your own dark mode detection)
  const isDark = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  }, []);

  // Generate result
  const result = useMemo((): UnifiedThemeResult | null => {
    if (!enabled || !themeData) return null;

    const { theme, isCustom } = themeData;

    // CSS class generator
    const getStateClass = (
      state: "normal" | "selected" | "active" | "error" | "warning"
    ) => {
      switch (state) {
        case "selected":
          return isDark
            ? theme.states.selected.dark
            : theme.states.selected.light;
        case "active":
          return isDark ? theme.states.active.dark : theme.states.active.light;
        case "error":
          return isDark ? theme.states.error.dark : theme.states.error.light;
        case "warning":
          return isDark
            ? theme.states.warning.dark
            : theme.states.warning.light;
        default:
          return "";
      }
    };

    // Utility to combine classes
    const combineClasses = (
      ...classes: (string | undefined | null | false)[]
    ) => {
      return classes.filter(Boolean).join(" ");
    };

    // Generate base classes
    const background = isDark
      ? theme.classes.background.dark
      : theme.classes.background.light;
    const border = isDark
      ? theme.classes.border.dark
      : theme.classes.border.light;
    const text = isDark
      ? theme.classes.text.primary.dark
      : theme.classes.text.primary.light;
    const button = `${theme.classes.button.border} ${isDark ? theme.classes.button.hover.dark : theme.classes.button.hover.light}`;

    return {
      category,
      theme,
      isCustom,

      classes: {
        base: combineClasses(
          background,
          border,
          text,
          "transition-all duration-200"
        ),
        selected: getStateClass("selected"),
        active: getStateClass("active"),
        error: getStateClass("error"),
        warning: getStateClass("warning"),
        background,
        border,
        text,
        button,
      },

      colors: {
        primary: theme.colors[500],
        secondary: theme.colors[400],
        accent: theme.colors[600],
        success: theme.colors[500],
        warning: "#f59e0b", // amber-500
        error: "#ef4444", // red-500
      },

      actions: {
        customize: (overrides: Partial<CategoryTheme>) => {
          setCustomTheme(category, overrides);
        },
        reset: () => {
          resetTheme(category);
        },
        export: () => {
          return exportThemes();
        },
      },

      utils: {
        isDark,
        isLight: !isDark,
        getStateClass,
        combineClasses,
      },
    };
  }, [
    themeData,
    category,
    isDark,
    enabled,
    setCustomTheme,
    resetTheme,
    exportThemes,
  ]);

  return result;
}

// ============================================================================
// ENHANCED NODE STYLING HOOK
// ============================================================================

export interface EnhancedNodeStyling {
  // Original styling data
  nodeStyleClasses: string;
  buttonTheme: string;
  textTheme: string;

  // Enhanced with unified theming
  unifiedTheme: UnifiedThemeResult | null;
  categoryClasses: string;
  stateClasses: {
    selected: string;
    active: string;
    error: string;
    warning: string;
  };

  // Combined styling (best of both worlds)
  combinedClasses: string;

  // Error state info
  errorState: {
    hasError: boolean;
    errorType: "warning" | "error" | "critical" | "local";
    supportsErrorInjection: boolean;
  };
}

/**
 * ENHANCED NODE STYLING HOOK
 * Integrates original useNodeStyling with unified theming
 */
export function useEnhancedNodeStyling(
  nodeType: string,
  selected: boolean,
  error: string | null,
  isActive: boolean,
  nodeData?: any,
  options: {
    autoRegister?: boolean;
    metadata?: any;
  } = {}
): EnhancedNodeStyling {
  // Get unified theme
  const unifiedTheme = useUnifiedNodeTheme(nodeType, options);

  // Calculate error state
  const errorState = useMemo(() => {
    const supportsErrorInjection = true; // You might want to import this from constants
    const hasVibeError = nodeData?.isErrorState === true;
    const vibeErrorType = nodeData?.errorType || "error";

    const finalError =
      error || (hasVibeError ? nodeData?.error || "Error state active" : null);
    const finalErrorType = error ? "local" : vibeErrorType;

    return {
      hasError: !!finalError,
      errorType: finalErrorType as "warning" | "error" | "critical" | "local",
      supportsErrorInjection,
    };
  }, [error, nodeData]);

  // Generate styling
  const styling = useMemo((): EnhancedNodeStyling => {
    // Base styling (fallback if no unified theme)
    const baseClasses = "rounded-lg border transition-all duration-200";

    if (!unifiedTheme) {
      return {
        nodeStyleClasses: baseClasses,
        buttonTheme: "border-gray-300 hover:bg-gray-100",
        textTheme: "text-gray-900",
        unifiedTheme: null,
        categoryClasses: baseClasses,
        stateClasses: {
          selected: "ring-2 ring-blue-500",
          active: "shadow-lg transform scale-102",
          error: "border-red-500 bg-red-50",
          warning: "border-yellow-500 bg-yellow-50",
        },
        combinedClasses: baseClasses,
        errorState,
      };
    }

    // Enhanced styling with unified theme
    const { classes, utils } = unifiedTheme;

    // State-based classes
    const stateClass = utils.getStateClass(
      errorState.hasError
        ? errorState.errorType === "warning"
          ? "warning"
          : "error"
        : selected
          ? "selected"
          : isActive
            ? "active"
            : "normal"
    );

    // Combined classes
    const combinedClasses = utils.combineClasses(
      classes.base,
      stateClass,
      "rounded-lg shadow-sm hover:shadow-md"
    );

    return {
      nodeStyleClasses: classes.base,
      buttonTheme: classes.button,
      textTheme: classes.text,
      unifiedTheme,
      categoryClasses: classes.base,
      stateClasses: {
        selected: classes.selected,
        active: classes.active,
        error: classes.error,
        warning: classes.warning,
      },
      combinedClasses,
      errorState,
    };
  }, [unifiedTheme, selected, isActive, errorState]);

  return styling;
}

// ============================================================================
// THEME CLASSES HOOK
// ============================================================================

/**
 * GET THEME CLASSES
 * Get specific theme classes for any component
 */
export function useThemeClasses(
  nodeType: string,
  state: "normal" | "selected" | "active" | "error" | "warning" = "normal"
) {
  const unifiedTheme = useUnifiedNodeTheme(nodeType);

  return useMemo(() => {
    if (!unifiedTheme) {
      // Fallback classes
      const fallbackClasses = {
        normal: "bg-gray-50 border-gray-300 text-gray-900",
        selected:
          "bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500",
        active: "bg-green-50 border-green-500 text-green-900 shadow-lg",
        error: "bg-red-50 border-red-500 text-red-900",
        warning: "bg-yellow-50 border-yellow-500 text-yellow-900",
      };
      return fallbackClasses[state];
    }

    const { classes, utils } = unifiedTheme;

    return utils.combineClasses(classes.base, utils.getStateClass(state));
  }, [unifiedTheme, state]);
}

// ============================================================================
// AUTO THEME HOOK
// ============================================================================

/**
 * AUTO THEME HOOK
 * Automatically detect and apply themes with minimal configuration
 */
export function useAutoTheme(
  nodeType: string,
  componentProps: {
    selected?: boolean;
    active?: boolean;
    error?: string | null;
    warning?: string | null;
  } = {}
) {
  const {
    selected = false,
    active = false,
    error = null,
    warning = null,
  } = componentProps;

  const unifiedTheme = useUnifiedNodeTheme(nodeType, { autoRegister: true });

  // Determine current state
  const currentState = useMemo(() => {
    if (error) return "error";
    if (warning) return "warning";
    if (selected) return "selected";
    if (active) return "active";
    return "normal";
  }, [error, warning, selected, active]);

  const classes = useThemeClasses(nodeType, currentState);

  return {
    theme: unifiedTheme,
    classes,
    state: currentState,
    // CSS variables for custom styling
    cssVariables: unifiedTheme
      ? {
          "--node-color-primary": unifiedTheme.colors.primary,
          "--node-color-secondary": unifiedTheme.colors.secondary,
          "--node-color-accent": unifiedTheme.colors.accent,
        }
      : {},
  };
}

// ============================================================================
// LEGACY COMPATIBILITY HOOKS
// ============================================================================

/**
 * Legacy compatibility for existing code
 */
export function useCategoryTheme(nodeType: string) {
  const unifiedTheme = useUnifiedNodeTheme(nodeType);
  return unifiedTheme?.theme || null;
}

export function useNodeCategoryBaseClasses(nodeType: string) {
  const unifiedTheme = useUnifiedNodeTheme(nodeType);

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
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Get category for a node
 */
export function useNodeCategory(nodeType: string): NodeCategory | null {
  const unifiedTheme = useUnifiedNodeTheme(nodeType);
  return unifiedTheme?.category || null;
}

/**
 * Check if node has custom theme
 */
export function useIsCustomTheme(nodeType: string): boolean {
  const unifiedTheme = useUnifiedNodeTheme(nodeType);
  return unifiedTheme?.isCustom || false;
}

/**
 * Get all available categories
 */
export function useAvailableCategories(): NodeCategory[] {
  return useUnifiedThemeStore(
    (state) => Object.keys(state.themes) as NodeCategory[]
  );
}

// ============================================================================
// BULK OPERATIONS HOOKS
// ============================================================================

/**
 * Register multiple nodes at once
 */
export function useBulkRegisterNodes() {
  const bulkRegister = useUnifiedThemeStore((state) => state.bulkRegisterNodes);

  return useCallback(
    (nodes: Array<{ nodeType: string; metadata?: any }>) => {
      bulkRegister(nodes);
    },
    [bulkRegister]
  );
}

/**
 * Theme management actions
 */
export function useThemeActions() {
  const setCustomTheme = useUnifiedThemeStore((state) => state.setCustomTheme);
  const resetTheme = useUnifiedThemeStore((state) => state.resetTheme);
  const clearCache = useUnifiedThemeStore((state) => state.clearCache);
  const exportThemes = useUnifiedThemeStore((state) => state.exportThemes);
  const importThemes = useUnifiedThemeStore((state) => state.importThemes);

  return {
    setCustomTheme,
    resetTheme,
    clearCache,
    exportThemes,
    importThemes,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { EnhancedNodeStyling, UnifiedThemeResult };

// Main hooks
export {
  useAutoTheme,
  useEnhancedNodeStyling,
  useThemeClasses,
  useUnifiedNodeTheme,
};

// Legacy compatibility
export { useCategoryTheme, useNodeCategoryBaseClasses };

// Convenience hooks
export {
  useAvailableCategories,
  useBulkRegisterNodes,
  useIsCustomTheme,
  useNodeCategory,
  useThemeActions,
};
