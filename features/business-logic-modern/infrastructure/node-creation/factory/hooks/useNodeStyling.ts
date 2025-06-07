/**
 * ENHANCED NODE STYLING HOOK - Integrated with Unified Theme System
 *
 * 🎯 FEATURES:
 * • Auto-detection of node categories from nodeType
 * • Integration with unified theme system
 * • Backward compatibility with existing styling
 * • Performance optimized with caching
 * • Flexible theme customization
 *
 * 🚀 INTEGRATION:
 * • Uses unified theme system for category detection
 * • Falls back to manual styling if theme system unavailable
 * • Provides enhanced styling data for NodeFactory components
 *
 * Keywords: unified-theming, node-factory, auto-detection, backward-compatibility
 */

import { useMemo } from "react";
// Import unified theme system (conditional import to avoid hard dependency)
let useUnifiedThemeStore: any = null;
let autoDetectNodeCategory: any = null;

try {
  const themeSystem = require("../../../theming/core/UnifiedThemeSystem");
  useUnifiedThemeStore = themeSystem.useUnifiedThemeStore;
  autoDetectNodeCategory = themeSystem.autoDetectNodeCategory;
} catch (error) {
  // Theme system not available, use fallback
}

type NodeCategory =
  | "create"
  | "transform"
  | "output"
  | "logic"
  | "utility"
  | "testing"
  | "data"
  | "media"
  | "ai"
  | "api"
  | "database"
  | "file"
  | "time"
  | "math"
  | "string"
  | "array"
  | "object"
  | "custom";

// ============================================================================
// ENHANCED NODE STYLING INTERFACE
// ============================================================================

export interface EnhancedNodeStylingResult {
  // Original styling (backward compatibility)
  nodeStyleClasses: string;
  buttonTheme: string;
  textTheme: string;

  // Enhanced with unified theming
  categoryClasses: {
    background: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
  };
  categoryButtonTheme: string;
  categoryTextTheme: string;

  // Error state handling
  errorState: {
    hasError: boolean;
    errorType: "warning" | "error" | "critical" | "local";
    supportsErrorInjection: boolean;
  };

  // Theme metadata
  themeInfo: {
    category: NodeCategory;
    isUnifiedTheme: boolean;
    isCustomTheme: boolean;
  };

  // Combined classes for convenience
  combinedClasses: string;
}

// ============================================================================
// ENHANCED NODE STYLING HOOK
// ============================================================================

/**
 * Enhanced useNodeStyling hook with unified theme integration
 * Drop-in replacement for original useNodeStyling
 */
export function useNodeStyling(
  nodeType: string,
  selected: boolean,
  error: string | null,
  isActive: boolean,
  nodeData?: any
): EnhancedNodeStylingResult {
  // Get unified theme store
  const getTheme = useUnifiedThemeStore
    ? useUnifiedThemeStore((state: any) => state.getTheme)
    : null;
  const registerNode = useUnifiedThemeStore
    ? useUnifiedThemeStore((state: any) => state.registerNode)
    : null;
  const enabled = useUnifiedThemeStore
    ? useUnifiedThemeStore((state: any) => state.enabled)
    : false;

  // Auto-register and get theme
  const themeData = useMemo(() => {
    if (!enabled) return null;

    // Auto-register the node if not already registered
    registerNode(nodeType);

    // Get theme data
    return getTheme(nodeType);
  }, [nodeType, enabled, registerNode, getTheme]);

  // Detect error state
  const errorState = useMemo(() => {
    const supportsErrorInjection = true; // From your constants
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

  // Generate styling based on theme availability
  const styling = useMemo((): EnhancedNodeStylingResult => {
    // Detect dark mode
    const isDark =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : false;

    if (!themeData) {
      // Fallback styling (manual theme)
      const category = autoDetectNodeCategory(nodeType);
      const fallbackClasses = getFallbackCategoryClasses(category, isDark);

      return {
        nodeStyleClasses: fallbackClasses.base,
        buttonTheme: fallbackClasses.button,
        textTheme: fallbackClasses.text,
        categoryClasses: {
          background: fallbackClasses.background,
          border: fallbackClasses.border,
          textPrimary: fallbackClasses.textPrimary,
          textSecondary: fallbackClasses.textSecondary,
        },
        categoryButtonTheme: fallbackClasses.button,
        categoryTextTheme: fallbackClasses.text,
        errorState,
        themeInfo: {
          category,
          isUnifiedTheme: false,
          isCustomTheme: false,
        },
        combinedClasses: combineClasses(
          fallbackClasses.base,
          getStateClasses(selected, isActive, errorState, fallbackClasses)
        ),
      };
    }

    // Enhanced styling with unified theme
    const { theme, category, isCustom } = themeData;

    const background = isDark
      ? theme.classes.background.dark
      : theme.classes.background.light;
    const border = isDark
      ? theme.classes.border.dark
      : theme.classes.border.light;
    const textPrimary = isDark
      ? theme.classes.text.primary.dark
      : theme.classes.text.primary.light;
    const textSecondary = isDark
      ? theme.classes.text.secondary.dark
      : theme.classes.text.secondary.light;
    const buttonTheme =
      theme.classes.button.border +
      " " +
      (isDark
        ? theme.classes.button.hover.dark
        : theme.classes.button.hover.light);

    // State-based styling
    const stateClasses = getUnifiedStateClasses(
      selected,
      isActive,
      errorState,
      theme,
      isDark
    );

    const baseClasses = `${background} ${border} ${textPrimary} transition-all duration-200 rounded-lg`;

    return {
      nodeStyleClasses: baseClasses,
      buttonTheme,
      textTheme: textPrimary,
      categoryClasses: {
        background,
        border,
        textPrimary,
        textSecondary,
      },
      categoryButtonTheme: buttonTheme,
      categoryTextTheme: textPrimary,
      errorState,
      themeInfo: {
        category,
        isUnifiedTheme: true,
        isCustomTheme: isCustom,
      },
      combinedClasses: combineClasses(baseClasses, stateClasses),
    };
  }, [themeData, nodeType, selected, isActive, errorState]);

  return styling;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get fallback category classes when unified theme is not available
 */
function getFallbackCategoryClasses(category: NodeCategory, isDark: boolean) {
  const categoryColors: Record<NodeCategory, { light: string; dark: string }> =
    {
      create: {
        light: "bg-green-50 border-green-300 text-green-900",
        dark: "bg-green-900 border-green-700 text-green-100",
      },
      transform: {
        light: "bg-blue-50 border-blue-300 text-blue-900",
        dark: "bg-blue-900 border-blue-700 text-blue-100",
      },
      output: {
        light: "bg-purple-50 border-purple-300 text-purple-900",
        dark: "bg-purple-900 border-purple-700 text-purple-100",
      },
      logic: {
        light: "bg-orange-50 border-orange-300 text-orange-900",
        dark: "bg-orange-900 border-orange-700 text-orange-100",
      },
      utility: {
        light: "bg-gray-50 border-gray-300 text-gray-900",
        dark: "bg-gray-800 border-gray-600 text-gray-100",
      },
      testing: {
        light: "bg-yellow-50 border-yellow-300 text-yellow-900",
        dark: "bg-yellow-900 border-yellow-700 text-yellow-100",
      },
      data: {
        light: "bg-cyan-50 border-cyan-300 text-cyan-900",
        dark: "bg-cyan-900 border-cyan-700 text-cyan-100",
      },
      media: {
        light: "bg-pink-50 border-pink-300 text-pink-900",
        dark: "bg-pink-900 border-pink-700 text-pink-100",
      },
      ai: {
        light: "bg-violet-50 border-violet-300 text-violet-900",
        dark: "bg-violet-900 border-violet-700 text-violet-100",
      },
      api: {
        light: "bg-emerald-50 border-emerald-300 text-emerald-900",
        dark: "bg-emerald-900 border-emerald-700 text-emerald-100",
      },
      database: {
        light: "bg-red-50 border-red-300 text-red-900",
        dark: "bg-red-900 border-red-700 text-red-100",
      },
      file: {
        light: "bg-amber-50 border-amber-300 text-amber-900",
        dark: "bg-amber-900 border-amber-700 text-amber-100",
      },
      time: {
        light: "bg-teal-50 border-teal-300 text-teal-900",
        dark: "bg-teal-900 border-teal-700 text-teal-100",
      },
      math: {
        light: "bg-stone-50 border-stone-300 text-stone-900",
        dark: "bg-stone-800 border-stone-600 text-stone-100",
      },
      string: {
        light: "bg-slate-50 border-slate-300 text-slate-900",
        dark: "bg-slate-800 border-slate-600 text-slate-100",
      },
      array: {
        light: "bg-lime-50 border-lime-300 text-lime-900",
        dark: "bg-lime-900 border-lime-700 text-lime-100",
      },
      object: {
        light: "bg-rose-50 border-rose-300 text-rose-900",
        dark: "bg-rose-900 border-rose-700 text-rose-100",
      },
      custom: {
        light: "bg-indigo-50 border-indigo-300 text-indigo-900",
        dark: "bg-indigo-900 border-indigo-700 text-indigo-100",
      },
    };

  const colors = categoryColors[category] || categoryColors.custom;
  const baseColor = isDark ? colors.dark : colors.light;

  // Parse the base color to extract individual classes
  const classes = baseColor.split(" ");
  const background = classes.find((c) => c.startsWith("bg-")) || "bg-gray-50";
  const border =
    classes.find((c) => c.startsWith("border-")) || "border-gray-300";
  const text = classes.find((c) => c.startsWith("text-")) || "text-gray-900";

  return {
    base: baseColor,
    background,
    border,
    text,
    textPrimary: text,
    textSecondary: text.replace("-900", "-800").replace("-100", "-200"),
    button: `${border} hover:${background.replace("50", "100").replace("900", "800")}`,
  };
}

/**
 * Get state classes for fallback styling
 */
function getStateClasses(
  selected: boolean,
  isActive: boolean,
  errorState: { hasError: boolean; errorType: string },
  fallbackClasses: any
) {
  if (errorState.hasError) {
    return errorState.errorType === "warning"
      ? "border-yellow-500 bg-yellow-50 text-yellow-700"
      : "border-red-500 bg-red-50 text-red-700";
  }

  if (selected) {
    return "ring-2 ring-blue-500 shadow-md";
  }

  if (isActive) {
    return "shadow-lg transform scale-102";
  }

  return "";
}

/**
 * Get state classes for unified theme styling
 */
function getUnifiedStateClasses(
  selected: boolean,
  isActive: boolean,
  errorState: { hasError: boolean; errorType: string },
  theme: any,
  isDark: boolean
) {
  if (errorState.hasError) {
    return isDark ? theme.states.error.dark : theme.states.error.light;
  }

  if (selected) {
    return isDark ? theme.states.selected.dark : theme.states.selected.light;
  }

  if (isActive) {
    return isDark ? theme.states.active.dark : theme.states.active.light;
  }

  return "";
}

/**
 * Combine CSS classes safely
 */
function combineClasses(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// ============================================================================
// EXPORTS
// ============================================================================

// Legacy export for backward compatibility
export { useNodeStyling as useEnhancedNodeStyling };

// Convenience function to get just the combined classes
export function useNodeClasses(
  nodeType: string,
  selected: boolean,
  error: string | null,
  isActive: boolean,
  nodeData?: any
): string {
  const styling = useNodeStyling(nodeType, selected, error, isActive, nodeData);
  return styling.combinedClasses;
}
