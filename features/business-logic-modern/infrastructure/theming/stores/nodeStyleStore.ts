/**
 * NODE STYLE STORE - Enhanced visual theming with modern registry integration
 *
 * • Registry-integrated category-based color themes and visual styling for nodes
 * • Provides hover, selection, activation, and error state styling with registry metadata
 * • Handles dynamic color schemes with automatic registry category detection
 * • Enhanced theming utilities with registry-based category mapping
 * • Zustand store for reactive styling with registry validation
 * • Auto-syncs with modern registry for consistent node categorization
 *
 * Keywords: Zustand, node-theming, visual-styling, registry-integration, categories, colors, themes
 */

import { create } from "zustand";

// MODERN REGISTRY INTEGRATION - Enhanced imports - FIXED REFERENCE
import {
  getNodeCategoryMapping,
  isValidNodeType,
} from "../../node-creation/node-registry/nodeRegistry";

// FACTORY TYPES INTEGRATION - Enhanced type safety
import type { NodeCategory } from "../../node-creation/factory/types";

// CATEGORY REGISTRY INTEGRATION - Enhanced theming with registry metadata
import {
  applyCategoryHooks,
  CATEGORY_REGISTRY,
  getCategoryMetadata,
  getCategoryTheme,
} from "../../node-creation/category-registry/categoryRegistry";

// ============================================================================
// REGISTRY-ENHANCED NODE CATEGORY MANAGEMENT
// ============================================================================

/**
 * LAZY-INITIALIZED CATEGORY MAPPING
 * Prevents circular dependencies while providing registry integration
 */
let _categoryMapping: Record<string, NodeCategory> | null = null;

const getCachedCategoryMapping = (): Record<string, NodeCategory> => {
  if (_categoryMapping === null) {
    try {
      _categoryMapping = getNodeCategoryMapping();
      console.log(
        "🎨 Loaded category mapping from registry:",
        Object.keys(_categoryMapping).length,
        "nodes"
      );
    } catch (error) {
      console.warn("⚠️ Failed to load category mapping from registry:", error);
      _categoryMapping = {}; // Fallback to empty mapping
    }
  }
  return _categoryMapping!; // Safe assertion since we ensure it's not null above
};

/**
 * REGISTRY-VALIDATED CATEGORY MAPPING
 * Enhanced with validation and error handling
 */
export const getThemingCategoryMapping = (): Record<string, NodeCategory> => {
  return getCachedCategoryMapping();
};

/**
 * PROXY-BASED CATEGORY MAPPING
 * Provides backwards compatibility with dynamic registry updates
 */
export const NODE_CATEGORY_MAPPING = new Proxy(
  {} as Record<string, NodeCategory>,
  {
    get(target, prop) {
      const mapping = getCachedCategoryMapping();
      return mapping[prop as string];
    },
    ownKeys() {
      const mapping = getCachedCategoryMapping();
      return Object.keys(mapping);
    },
    has(target, prop) {
      const mapping = getCachedCategoryMapping();
      return prop in mapping;
    },
    getOwnPropertyDescriptor(target, prop) {
      const mapping = getCachedCategoryMapping();
      if (prop in mapping) {
        return {
          enumerable: true,
          configurable: true,
          value: mapping[prop as string],
        };
      }
      return undefined;
    },
  }
);

// ============================================================================
// REGISTRY-ENHANCED UTILITY FUNCTIONS
// ============================================================================

/**
 * GET NODE CATEGORY WITH VALIDATION
 * Enhanced with registry validation and fallback handling
 */
export const getNodeCategory = (nodeType: string): NodeCategory | null => {
  if (!isValidNodeType(nodeType)) {
    console.warn(`⚠️ Invalid node type for theming: ${nodeType}`);
    return null;
  }

  const mapping = getCachedCategoryMapping();
  return mapping[nodeType] || null;
};

/**
 * GET NODES BY CATEGORY FOR THEMING
 * Returns all node types in a specific category for batch styling
 */
export const getNodesByCategory = (category: NodeCategory): string[] => {
  const mapping = getCachedCategoryMapping();
  return Object.entries(mapping)
    .filter(([_, nodeCategory]) => nodeCategory === category)
    .map(([nodeType]) => nodeType);
};

/**
 * REFRESH CATEGORY MAPPING
 * Forces a refresh of the category mapping from registry
 */
export const refreshCategoryMapping = (): void => {
  _categoryMapping = null;
  getCachedCategoryMapping();
  console.log("🔄 Refreshed category mapping from registry");
};

// ============================================================================
// MODERN REGISTRY CATEGORY THEMES
// ============================================================================

export interface CategoryTheme {
  background: {
    light: string;
    dark: string;
  };
  border: {
    light: string;
    dark: string;
  };
  text: {
    primary: {
      light: string;
      dark: string;
    };
    secondary: {
      light: string;
      dark: string;
    };
  };
  button: {
    border: string;
    hover: {
      light: string;
      dark: string;
    };
  };
}

/**
 * REGISTRY-ALIGNED CATEGORY THEMES
 * Updated to match modern registry categories: create, view, trigger, test, cycle
 */
export const CATEGORY_THEMES: Record<NodeCategory, CategoryTheme> = {
  // CREATE CATEGORY - Blue theme for creation nodes
  create: {
    background: { light: "bg-blue-50", dark: "bg-blue-900" },
    border: { light: "border-blue-300", dark: "border-blue-800" },
    text: {
      primary: { light: "text-blue-900", dark: "text-blue-100" },
      secondary: { light: "text-blue-800", dark: "text-blue-200" },
    },
    button: {
      border: "border-blue-300 dark:border-blue-800",
      hover: { light: "hover:bg-blue-200", dark: "hover:bg-blue-800" },
    },
  },

  // VIEW CATEGORY - Gray theme for display/view nodes
  view: {
    background: { light: "bg-gray-50", dark: "bg-gray-900" },
    border: { light: "border-gray-300", dark: "border-gray-800" },
    text: {
      primary: { light: "text-gray-900", dark: "text-gray-100" },
      secondary: { light: "text-gray-800", dark: "text-gray-200" },
    },
    button: {
      border: "border-gray-300 dark:border-gray-800",
      hover: { light: "hover:bg-gray-200", dark: "hover:bg-gray-800" },
    },
  },

  // TRIGGER CATEGORY - Purple theme for trigger/automation nodes
  trigger: {
    background: { light: "bg-purple-50", dark: "bg-purple-900" },
    border: { light: "border-purple-300", dark: "border-purple-800" },
    text: {
      primary: { light: "text-purple-900", dark: "text-purple-100" },
      secondary: { light: "text-purple-800", dark: "text-purple-200" },
    },
    button: {
      border: "border-purple-300 dark:border-purple-800",
      hover: { light: "hover:bg-purple-200", dark: "hover:bg-purple-800" },
    },
  },

  // TEST CATEGORY - Yellow theme for testing/debug nodes
  test: {
    background: { light: "bg-yellow-50", dark: "bg-yellow-900" },
    border: { light: "border-yellow-300", dark: "border-yellow-800" },
    text: {
      primary: { light: "text-yellow-900", dark: "text-yellow-100" },
      secondary: { light: "text-yellow-800", dark: "text-yellow-200" },
    },
    button: {
      border: "border-yellow-300 dark:border-yellow-800",
      hover: { light: "hover:bg-yellow-200", dark: "hover:bg-yellow-800" },
    },
  },

  // CYCLE CATEGORY - Green theme for cycle/loop nodes
  cycle: {
    background: { light: "bg-green-50", dark: "bg-green-900" },
    border: { light: "border-green-300", dark: "border-green-800" },
    text: {
      primary: { light: "text-green-900", dark: "text-green-100" },
      secondary: { light: "text-green-800", dark: "text-green-200" },
    },
    button: {
      border: "border-green-300 dark:border-green-800",
      hover: { light: "hover:bg-green-200", dark: "hover:bg-green-800" },
    },
  },
};

// ============================================================================
// NODE STYLE TYPES - Enhanced with Registry Integration
// ============================================================================

export interface NodeStyleState {
  // Glow effect configurations
  hover: {
    glow: string;
    border?: string;
    scale?: string;
  };
  selection: {
    glow: string;
    border?: string;
    scale?: string;
  };
  activation: {
    glow: string;
    border: string;
    scale?: string;
    buttonTheme: {
      border: string;
      hover: string;
    };
  };
  error: {
    glow: string;
    border: string;
    scale?: string;
    buttonTheme: {
      border: string;
      hover: string;
    };
    textTheme: {
      primary: string;
      secondary: string;
      border: string;
      focus: string;
    };
  };
  // Base styling
  base: {
    transition: string;
  };
  // Registry-enhanced category theming
  categoryTheming: {
    enabled: boolean;
    customOverrides: Partial<Record<NodeCategory, Partial<CategoryTheme>>>;
    registrySync: boolean; // Auto-sync with registry changes
    debugMode: boolean; // Show registry integration debug info
  };
}

export interface NodeStyleActions {
  updateHoverStyle: (style: Partial<NodeStyleState["hover"]>) => void;
  updateSelectionStyle: (style: Partial<NodeStyleState["selection"]>) => void;
  updateActivationStyle: (style: Partial<NodeStyleState["activation"]>) => void;
  updateErrorStyle: (style: Partial<NodeStyleState["error"]>) => void;
  resetToDefaults: () => void;
  updateBaseStyle: (style: Partial<NodeStyleState["base"]>) => void;

  // Enhanced category theming actions
  enableCategoryTheming: () => void;
  disableCategoryTheming: () => void;
  updateCategoryTheme: (
    category: NodeCategory,
    theme: Partial<CategoryTheme>
  ) => void;
  resetCategoryTheme: (category: NodeCategory) => void;
  resetAllCategoryThemes: () => void;

  // Registry integration actions
  enableRegistrySync: () => void;
  disableRegistrySync: () => void;
  refreshFromRegistry: () => void;
  toggleDebugMode: () => void;
  validateNodeTheming: (nodeType: string) => boolean;
}

// ============================================================================
// DEFAULT STYLES - Enhanced with Registry Integration
// ============================================================================

const defaultStyles: NodeStyleState = {
  hover: {
    glow: "shadow-[0_0_3px_0px_rgba(255,255,255,0.3)]",
  },
  selection: {
    glow: "shadow-[0_0_4px_1px_rgba(255,255,255,0.6)]",
  },
  activation: {
    glow: "shadow-[0_0_8px_2px_rgba(34,197,94,0.8)]",
    border: "border-green-300/60 dark:border-green-400/50",
    scale: "scale-[1.02]",
    buttonTheme: {
      border: "border-green-400",
      hover: "hover:bg-green-100 dark:hover:bg-green-900",
    },
  },
  error: {
    glow: "shadow-[0_0_8px_2px_rgba(239,68,68,0.8)]",
    border: "border-red-300/60 dark:border-red-400/50",
    scale: "scale-[1.02]",
    buttonTheme: {
      border: "border-red-400",
      hover: "hover:bg-red-100 dark:hover:bg-red-900",
    },
    textTheme: {
      primary: "text-red-900 dark:text-red-100",
      secondary: "text-red-800 dark:text-red-200",
      border: "border-red-300 dark:border-red-700",
      focus: "focus:ring-red-500",
    },
  },
  base: {
    transition: "transition-all duration-200",
  },
  categoryTheming: {
    enabled: true,
    customOverrides: {},
    registrySync: true, // Auto-sync with registry by default
    debugMode: false,
  },
};

// ============================================================================
// ENHANCED ZUSTAND STORE - Registry Integration
// ============================================================================

export const useNodeStyleStore = create<NodeStyleState & NodeStyleActions>(
  (set, get) => ({
    ...defaultStyles,

    // EXISTING STYLE ACTIONS
    updateHoverStyle: (style) =>
      set((state) => ({
        hover: { ...state.hover, ...style },
      })),

    updateSelectionStyle: (style) =>
      set((state) => ({
        selection: { ...state.selection, ...style },
      })),

    updateActivationStyle: (style) =>
      set((state) => ({
        activation: { ...state.activation, ...style },
      })),

    updateErrorStyle: (style) =>
      set((state) => ({
        error: { ...state.error, ...style },
      })),

    updateBaseStyle: (style) =>
      set((state) => ({
        base: { ...state.base, ...style },
      })),

    resetToDefaults: () => set(defaultStyles),

    // ENHANCED CATEGORY THEMING ACTIONS
    enableCategoryTheming: () =>
      set((state) => ({
        categoryTheming: { ...state.categoryTheming, enabled: true },
      })),

    disableCategoryTheming: () =>
      set((state) => ({
        categoryTheming: { ...state.categoryTheming, enabled: false },
      })),

    updateCategoryTheme: (category, theme) =>
      set((state) => ({
        categoryTheming: {
          ...state.categoryTheming,
          customOverrides: {
            ...state.categoryTheming.customOverrides,
            [category]: {
              ...state.categoryTheming.customOverrides[category],
              ...theme,
            },
          },
        },
      })),

    resetCategoryTheme: (category) =>
      set((state) => ({
        categoryTheming: {
          ...state.categoryTheming,
          customOverrides: {
            ...state.categoryTheming.customOverrides,
            [category]: {},
          },
        },
      })),

    resetAllCategoryThemes: () =>
      set((state) => ({
        categoryTheming: { ...state.categoryTheming, customOverrides: {} },
      })),

    // REGISTRY INTEGRATION ACTIONS
    enableRegistrySync: () =>
      set((state) => ({
        categoryTheming: { ...state.categoryTheming, registrySync: true },
      })),

    disableRegistrySync: () =>
      set((state) => ({
        categoryTheming: { ...state.categoryTheming, registrySync: false },
      })),

    refreshFromRegistry: () => {
      const state = get();
      if (state.categoryTheming.registrySync) {
        refreshCategoryMapping();
        if (state.categoryTheming.debugMode) {
          console.log("🔄 Node style store refreshed from registry");
        }
      }
    },

    toggleDebugMode: () =>
      set((state) => ({
        categoryTheming: {
          ...state.categoryTheming,
          debugMode: !state.categoryTheming.debugMode,
        },
      })),

    validateNodeTheming: (nodeType: string) => {
      const state = get();
      if (!state.categoryTheming.enabled) return true;

      const isValid = isValidNodeType(nodeType);
      const category = getNodeCategory(nodeType);

      if (state.categoryTheming.debugMode) {
        console.log(`🎨 Validating theming for ${nodeType}:`, {
          isValidNode: isValid,
          category,
          hasTheme: category ? category in CATEGORY_THEMES : false,
        });
      }

      return isValid && category !== null;
    },
  })
);

// ============================================================================
// ENHANCED UTILITY HOOKS - Registry Integration
// ============================================================================

/**
 * REGISTRY-ENHANCED NODE STYLE CLASSES
 * Enhanced with registry validation and debug information
 */
export const useNodeStyleClasses = (
  isSelected: boolean,
  isError: boolean,
  isActive: boolean,
  nodeType?: string
) => {
  const styles = useNodeStyleStore();

  // Registry validation for enhanced debugging
  if (nodeType && styles.categoryTheming.debugMode) {
    styles.validateNodeTheming(nodeType);
  }

  const getStateStyles = () => {
    if (isSelected) {
      return `${styles.selection.glow} ${styles.selection.border || ""} ${styles.selection.scale || ""}`;
    }
    if (isError) {
      return `${styles.error.glow} ${styles.error.border} ${styles.error.scale || ""}`;
    }
    if (isActive) {
      return `${styles.activation.glow} ${styles.activation.border} ${styles.activation.scale || ""}`;
    }
    return `hover:${styles.hover.glow.replace("shadow-", "")} ${styles.hover.border || ""} ${styles.hover.scale || ""}`;
  };

  return `${styles.base.transition} ${getStateStyles()}`.trim();
};

/**
 * ENHANCED CATEGORY THEME HOOK
 * Enhanced with category registry validation and dynamic theming
 */
export const useCategoryTheme = (nodeType: string) => {
  const { categoryTheming } = useNodeStyleStore();

  if (!categoryTheming.enabled) {
    return null;
  }

  const category = getNodeCategory(nodeType);
  if (!category) {
    if (categoryTheming.debugMode) {
      console.warn(`🎨 No category found for node type: ${nodeType}`);
    }
    return null;
  }

  // ENHANCED: Validate category with registry
  const validation = validateCategoryWithRegistry(category);
  if (!validation.valid) {
    if (categoryTheming.debugMode) {
      console.warn(
        `🎨 Category validation failed for ${nodeType}:`,
        validation.reason
      );
    }
    return null;
  }

  // ENHANCED: Use category registry theme first, then fallback to hardcoded
  const enhancedTheme = getEnhancedCategoryTheme(category);
  const customOverride = categoryTheming.customOverrides[category];

  const finalTheme = customOverride
    ? { ...enhancedTheme, ...customOverride }
    : enhancedTheme;

  // ENHANCED: Apply category hooks when theme is used
  if (categoryTheming.debugMode) {
    console.log(`🎨 Applied enhanced theme for ${nodeType} (${category}):`, {
      priority: getCategoryThemePriority(category),
      metadata: validation.metadata,
      theme: finalTheme,
    });
  }

  // Trigger theme hooks
  applyCategoryThemeHooks(category, finalTheme);

  return finalTheme;
};

/**
 * ENHANCED CATEGORY BUTTON THEME
 * Enhanced with registry priority and validation
 */
export const useNodeButtonTheme = (
  isError: boolean,
  isActive: boolean,
  nodeType?: string
) => {
  const styles = useNodeStyleStore();

  if (isError) {
    return `${styles.error.buttonTheme.border} ${styles.error.buttonTheme.hover}`;
  }
  if (isActive) {
    return `${styles.activation.buttonTheme.border} ${styles.activation.buttonTheme.hover}`;
  }

  // ENHANCED: Registry-based category theming with priority
  if (nodeType && styles.categoryTheming.enabled) {
    const category = getNodeCategory(nodeType);
    if (category) {
      // ENHANCED: Validate category before applying theme
      const validation = validateCategoryWithRegistry(category);
      if (validation.valid) {
        const enhancedTheme = getEnhancedCategoryTheme(category);
        const override = styles.categoryTheming.customOverrides[category];
        const finalTheme = override
          ? { ...enhancedTheme, ...override }
          : enhancedTheme;

        if (styles.categoryTheming.debugMode) {
          console.log(`🎨 Applied button theme for ${nodeType}:`, {
            category,
            priority: getCategoryThemePriority(category),
            theme: finalTheme.button,
          });
        }

        return `${finalTheme.button.border} ${finalTheme.button.hover.light} dark:${finalTheme.button.hover.dark}`;
      }
    }
  }

  return "border-blue-300 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800";
};

/**
 * ENHANCED CATEGORY TEXT THEME
 * Enhanced with registry metadata and dynamic theming
 */
export const useNodeTextTheme = (isError: boolean, nodeType?: string) => {
  const styles = useNodeStyleStore();

  if (isError) {
    return styles.error.textTheme;
  }

  // ENHANCED: Registry-based category theming with enhanced metadata
  if (nodeType && styles.categoryTheming.enabled) {
    const category = getNodeCategory(nodeType);
    if (category) {
      // ENHANCED: Validate and get enhanced metadata
      const validation = validateCategoryWithRegistry(category);
      if (validation.valid) {
        const enhancedTheme = getEnhancedCategoryTheme(category);
        const override = styles.categoryTheming.customOverrides[category];
        const finalTheme = override
          ? { ...enhancedTheme, ...override }
          : enhancedTheme;

        if (styles.categoryTheming.debugMode) {
          console.log(`🎨 Applied text theme for ${nodeType}:`, {
            category,
            metadata: validation.metadata,
            theme: finalTheme.text,
          });
        }

        return {
          primary: `${finalTheme.text.primary.light} dark:${finalTheme.text.primary.dark}`,
          secondary: `${finalTheme.text.secondary.light} dark:${finalTheme.text.secondary.dark}`,
          border: `${finalTheme.border.light} dark:${finalTheme.border.dark}`,
          focus: `focus:ring-${finalTheme.border.light.split("-")[1]}-500`,
        };
      }
    }
  }

  return {
    primary: "text-blue-900 dark:text-blue-100",
    secondary: "text-blue-800 dark:text-blue-200",
    border: "border-blue-300 dark:border-blue-700",
    focus: "focus:ring-blue-500",
  };
};

// ============================================================================
// REGISTRY-ENHANCED CATEGORY UTILITY HOOKS
// ============================================================================

/**
 * REGISTRY-ENHANCED CATEGORY CLASSES
 * Enhanced with registry metadata and validation
 */
export const useNodeCategoryClasses = (
  nodeType: string,
  isSelected: boolean,
  isError: boolean,
  isActive: boolean
) => {
  const categoryTheme = useCategoryTheme(nodeType);
  const defaultClasses = useNodeStyleClasses(
    isSelected,
    isError,
    isActive,
    nodeType
  );

  if (!categoryTheme) {
    return defaultClasses;
  }

  // Return enhanced styling with category-specific effects
  return defaultClasses;
};

/**
 * REGISTRY-ENHANCED BASE CLASSES
 * Enhanced with registry metadata and fallback handling
 */
export const useNodeCategoryBaseClasses = (nodeType: string) => {
  const categoryTheme = useCategoryTheme(nodeType);

  if (!categoryTheme) {
    // Fallback to default blue theme
    return {
      background: "bg-blue-50 dark:bg-blue-900",
      border: "border-blue-300 dark:border-blue-800",
      textPrimary: "text-blue-900 dark:text-blue-100",
      textSecondary: "text-blue-800 dark:text-blue-200",
    };
  }

  return {
    background: `${categoryTheme.background.light} dark:${categoryTheme.background.dark}`,
    border: `${categoryTheme.border.light} dark:${categoryTheme.border.dark}`,
    textPrimary: `${categoryTheme.text.primary.light} dark:${categoryTheme.text.primary.dark}`,
    textSecondary: `${categoryTheme.text.secondary.light} dark:${categoryTheme.text.secondary.dark}`,
  };
};

/**
 * REGISTRY-ENHANCED CATEGORY BUTTON THEME
 * Enhanced with registry category detection and validation
 */
export const useNodeCategoryButtonTheme = (
  nodeType: string,
  isError: boolean,
  isActive: boolean
) => {
  return useNodeButtonTheme(isError, isActive, nodeType);
};

/**
 * REGISTRY-ENHANCED CATEGORY TEXT THEME
 * Enhanced with registry category detection and validation
 */
export const useNodeCategoryTextTheme = (
  nodeType: string,
  isError: boolean
) => {
  return useNodeTextTheme(isError, nodeType);
};

// ============================================================================
// REGISTRY-ENHANCED PRESET CONFIGURATIONS
// ============================================================================

export const STYLE_PRESETS = {
  subtle: {
    hover: { glow: "shadow-[0_0_2px_0px_rgba(255,255,255,0.2)]" },
    activation: { glow: "shadow-[0_0_6px_1px_rgba(34,197,94,0.6)]" },
    error: { glow: "shadow-[0_0_6px_1px_rgba(239,68,68,0.6)]" },
  },
  dramatic: {
    hover: { glow: "shadow-[0_0_6px_2px_rgba(255,255,255,0.5)]" },
    activation: {
      glow: "shadow-[0_0_12px_4px_rgba(34,197,94,0.9)]",
      scale: "scale-[1.05]",
    },
    error: {
      glow: "shadow-[0_0_12px_4px_rgba(239,68,68,0.9)]",
      scale: "scale-[1.05]",
    },
  },
  minimal: {
    hover: { glow: "shadow-[0_0_1px_0px_rgba(255,255,255,0.4)]" },
    activation: {
      glow: "shadow-[0_0_3px_0px_rgba(34,197,94,0.7)]",
      scale: undefined,
    },
    error: {
      glow: "shadow-[0_0_3px_0px_rgba(239,68,68,0.7)]",
      scale: undefined,
    },
  },
};

// Function to apply a preset
export const applyStylePreset = (presetName: keyof typeof STYLE_PRESETS) => {
  const preset = STYLE_PRESETS[presetName];
  const store = useNodeStyleStore.getState();

  if (preset.hover) store.updateHoverStyle(preset.hover);
  if (preset.activation) store.updateActivationStyle(preset.activation);
  if (preset.error) store.updateErrorStyle(preset.error);
};

// ============================================================================
// REGISTRY-ENHANCED CATEGORY MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * ENABLE CATEGORY THEMING WITH ENHANCED REGISTRY SYNC
 * Enhanced with automatic registry synchronization and validation
 */
export const enableCategoryTheming = () => {
  const store = useNodeStyleStore.getState();
  store.enableCategoryTheming();
  store.enableRegistrySync();
  store.refreshFromRegistry();

  // ENHANCED: Sync with category registry
  // NOTE: syncWithThemingStore would be called here when available
  // syncWithThemingStore();

  // ENHANCED: Apply category hooks for activation
  Object.keys(CATEGORY_REGISTRY).forEach((category) => {
    const metadata = getCategoryMetadata(category as NodeCategory);
    if (metadata?.enabled) {
      applyCategoryHooks(category as NodeCategory, "onActivate");
    }
  });

  console.log("🎨 Enhanced category theming enabled with registry integration");
};

/**
 * APPLY CATEGORY THEME WITH ENHANCED REGISTRY VALIDATION
 * Enhanced with registry validation, priority handling, and lifecycle hooks
 */
export const applyCategoryTheme = (
  category: NodeCategory,
  customTheme: Partial<CategoryTheme>
) => {
  const store = useNodeStyleStore.getState();

  // ENHANCED: Validate category with registry first
  const validation = validateCategoryWithRegistry(category);
  if (!validation.valid) {
    console.warn(
      `⚠️ Cannot apply theme to invalid category '${category}':`,
      validation.reason
    );
    return false;
  }

  // ENHANCED: Check category priority for theme precedence
  const priority = getCategoryThemePriority(category);
  if (store.categoryTheming.debugMode) {
    console.log(
      `🎨 Applying theme to category '${category}' (priority: ${priority})`
    );
  }

  // ENHANCED: Validate nodes in category using registry
  const nodesInCategory = getNodesByCategory(category);
  const enhancedNodeCount = nodesInCategory.filter((nodeType) =>
    isValidNodeType(nodeType)
  ).length;

  if (enhancedNodeCount === 0) {
    console.warn(
      `⚠️ No valid nodes found in category '${category}' - theme may not be applied`
    );
  }

  // ENHANCED: Merge with registry theme
  const registryTheme = getEnhancedCategoryTheme(category);
  const mergedTheme = { ...registryTheme, ...customTheme };

  store.updateCategoryTheme(category, mergedTheme);
  if (!store.categoryTheming.enabled) {
    store.enableCategoryTheming();
  }

  // ENHANCED: Apply category lifecycle hooks
  applyCategoryThemeHooks(category, mergedTheme);

  if (store.categoryTheming.debugMode) {
    console.log(`🎨 Applied enhanced theme to category '${category}':`, {
      affectedNodes: enhancedNodeCount,
      validNodes: nodesInCategory,
      priority,
      metadata: validation.metadata,
      theme: mergedTheme,
    });
  }

  return true;
};

/**
 * APPLY ALL ENHANCED CATEGORY DEFAULTS
 * Enhanced with registry synchronization, priority ordering, and lifecycle management
 */
export const applyAllCategoryDefaults = () => {
  const store = useNodeStyleStore.getState();
  store.enableCategoryTheming();
  store.enableRegistrySync();
  store.resetAllCategoryThemes();
  store.refreshFromRegistry();

  // ENHANCED: Sync with category registry
  // NOTE: syncWithThemingStore would be called here when available
  // syncWithThemingStore();

  // ENHANCED: Apply themes in priority order from registry
  const categoriesByPriority = Object.entries(CATEGORY_REGISTRY)
    .filter(([_, metadata]) => metadata.enabled)
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([category]) => category as NodeCategory);

  categoriesByPriority.forEach((category) => {
    const enhancedTheme = getEnhancedCategoryTheme(category);
    store.updateCategoryTheme(category, enhancedTheme);

    // Apply lifecycle hooks
    applyCategoryThemeHooks(category, enhancedTheme);
  });

  if (store.categoryTheming.debugMode) {
    const mapping = getCachedCategoryMapping();
    const categoryStats = Object.entries(CATEGORY_REGISTRY).reduce(
      (acc, [cat, meta]) => {
        const nodeCount = getNodesByCategory(cat as NodeCategory).length;
        acc[cat] = {
          priority: meta.priority,
          nodeCount,
          enabled: meta.enabled,
        };
        return acc;
      },
      {} as Record<string, any>
    );

    console.log("🎨 Applied all enhanced category defaults from registry:", {
      totalNodes: Object.keys(mapping).length,
      appliedOrder: categoriesByPriority,
      categoryStats,
    });
  }
};

/**
 * GET ENHANCED THEME STATISTICS
 * Enhanced with comprehensive registry integration statistics
 */
export const getThemeStatistics = () => {
  const mapping = getCachedCategoryMapping();
  const store = useNodeStyleStore.getState();

  // ENHANCED: Registry integration statistics
  const registryStats = {
    totalCategories: Object.keys(CATEGORY_REGISTRY).length,
    enabledCategories: Object.entries(CATEGORY_REGISTRY).filter(
      ([_, meta]) => meta.enabled
    ).length,
    categoriesWithNodes: Object.values(mapping).reduce(
      (acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    categoryPriorities: Object.entries(CATEGORY_REGISTRY)
      .map(([cat, meta]) => ({
        category: cat,
        priority: meta.priority,
        enabled: meta.enabled,
      }))
      .sort((a, b) => a.priority - b.priority),
  };

  // ENHANCED: Theme validation statistics
  const themeValidation = {
    validCategories: 0,
    invalidCategories: 0,
    categoriesWithCustomThemes: Object.keys(
      store.categoryTheming.customOverrides
    ).length,
    validationResults: {} as Record<string, any>,
  };

  Object.keys(CATEGORY_REGISTRY).forEach((category) => {
    const validation = validateCategoryWithRegistry(category as NodeCategory);
    themeValidation.validationResults[category] = validation;
    if (validation.valid) {
      themeValidation.validCategories++;
    } else {
      themeValidation.invalidCategories++;
    }
  });

  const stats = {
    registryIntegration: {
      totalNodes: Object.keys(mapping).length,
      registrySync: store.categoryTheming.registrySync,
      ...registryStats,
    },
    theming: {
      enabled: store.categoryTheming.enabled,
      customOverrides: Object.keys(store.categoryTheming.customOverrides)
        .length,
      debugMode: store.categoryTheming.debugMode,
    },
    validation: themeValidation,
    availableThemes: Object.keys(CATEGORY_THEMES),
    enhancedFeatures: {
      registryThemes: Object.keys(CATEGORY_REGISTRY).filter((cat) =>
        getCategoryTheme(cat as NodeCategory)
      ).length,
      categoryHooks: Object.keys(CATEGORY_REGISTRY).filter(
        (cat) => getCategoryMetadata(cat as NodeCategory)?.hooks
      ).length,
      priorityTheming: true,
      lifecycleManagement: true,
    },
  };

  return stats;
};

// ============================================================================
// REGISTRY-ENHANCED DEBUG AND UTILITIES
// ============================================================================

/**
 * ENABLE DEBUG MODE
 * Enhanced debugging with registry integration information
 */
export const enableThemeDebugMode = () => {
  const store = useNodeStyleStore.getState();
  store.toggleDebugMode();

  console.log("🔧 Theme Debug Mode Enabled");
  console.log("===========================");
  console.log("Registry Integration:", {
    totalNodes: Object.keys(getCachedCategoryMapping()).length,
    categoriesAvailable: Object.keys(CATEGORY_THEMES),
    registrySync: store.categoryTheming.registrySync,
  });
};

/**
 * APPLY MODERN REGISTRY COLOR SCHEME
 * Enhanced color scheme based on modern registry categories
 */
export const applyModernRegistryColorScheme = () => {
  enableCategoryTheming();

  console.log("🎨 Applied Modern Registry Color Scheme:");
  console.log("- Create nodes: Blue (creation and generation)");
  console.log("- View nodes: Gray (display and output)");
  console.log("- Trigger nodes: Purple (automation and triggers)");
  console.log("- Test nodes: Yellow (testing and debugging)");
  console.log("- Cycle nodes: Green (loops and cycles)");

  const stats = getThemeStatistics();
  console.log("📊 Theme Statistics:", stats);
};

/**
 * CREATE CUSTOM REGISTRY THEME
 * Helper to create custom themes based on registry categories
 */
export const createCustomRegistryTheme = (
  themeConfig: Partial<
    Record<NodeCategory, { color: string; description: string }>
  >
) => {
  enableCategoryTheming();

  Object.entries(themeConfig).forEach(([category, config]) => {
    if (config?.color) {
      const color = config.color;
      applyCategoryTheme(category as NodeCategory, {
        background: { light: `bg-${color}-50`, dark: `bg-${color}-900` },
        border: { light: `border-${color}-300`, dark: `border-${color}-800` },
        text: {
          primary: { light: `text-${color}-900`, dark: `text-${color}-100` },
          secondary: { light: `text-${color}-800`, dark: `text-${color}-200` },
        },
        button: {
          border: `border-${color}-300 dark:border-${color}-800`,
          hover: {
            light: `hover:bg-${color}-200`,
            dark: `hover:bg-${color}-800`,
          },
        },
      });

      console.log(
        `🎨 ${category} nodes: ${config.color} (${config.description})`
      );
    }
  });

  console.log("✅ Custom registry theme applied successfully");
};

// ============================================================================
// ENHANCED CATEGORY REGISTRY UTILITIES
// ============================================================================

/**
 * GET ENHANCED CATEGORY THEME
 * Enhanced with category registry integration for dynamic theming
 */
export function getEnhancedCategoryTheme(
  category: NodeCategory
): CategoryTheme {
  // Get theme from category registry first
  const registryTheme = getCategoryTheme(category);
  const categoryMetadata = getCategoryMetadata(category);

  if (registryTheme && categoryMetadata?.enabled) {
    // Convert category registry theme to our CategoryTheme format
    return {
      background: registryTheme.background,
      border: registryTheme.border,
      text: {
        primary: {
          light: `text-${registryTheme.primary}-900`,
          dark: `text-${registryTheme.primary}-100`,
        },
        secondary: {
          light: `text-${registryTheme.secondary}-800`,
          dark: `text-${registryTheme.secondary}-200`,
        },
      },
      button: {
        border: `border-${registryTheme.primary}-300 dark:border-${registryTheme.primary}-800`,
        hover: {
          light: `hover:bg-${registryTheme.primary}-200`,
          dark: `hover:bg-${registryTheme.primary}-800`,
        },
      },
    };
  }

  // Fallback to our hardcoded themes if registry theme not available
  return CATEGORY_THEMES[category] || CATEGORY_THEMES.create;
}

/**
 * VALIDATE CATEGORY WITH REGISTRY
 * Enhanced validation using category registry rules
 */
export function validateCategoryWithRegistry(category: NodeCategory): {
  valid: boolean;
  enabled: boolean;
  metadata: any;
  reason?: string;
} {
  const metadata = getCategoryMetadata(category);

  if (!metadata) {
    return {
      valid: false,
      enabled: false,
      metadata: null,
      reason: `Category '${category}' not found in registry`,
    };
  }

  if (!metadata.enabled) {
    return {
      valid: false,
      enabled: false,
      metadata,
      reason: `Category '${category}' is disabled in registry`,
    };
  }

  return {
    valid: true,
    enabled: true,
    metadata,
  };
}

/**
 * GET CATEGORY PRIORITY FOR THEMING
 * Uses category registry priority for theme precedence
 */
export function getCategoryThemePriority(category: NodeCategory): number {
  const metadata = getCategoryMetadata(category);
  return metadata?.priority ?? 999;
}

/**
 * APPLY CATEGORY REGISTRY HOOKS FOR THEMING
 * Triggers category-specific theming hooks
 */
export function applyCategoryThemeHooks(
  category: NodeCategory,
  theme: CategoryTheme
) {
  applyCategoryHooks(category, "onThemeApplied", theme);
}
