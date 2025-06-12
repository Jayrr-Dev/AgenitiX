// ============================================================================
// NODE STYLE STORE  ▸  Registry-aware visual theming for nodes (Zustand)
// ----------------------------------------------------------------------------
// • Category-based palette with registry sync & overrides
// • Hover / select / active / error visual states
// • Public hooks:  useNodeStyleClasses / useCategoryTheme / …
// • Admin helpers: enableCategoryTheming(), applyCategoryTheme(), …
/* eslint @typescript-eslint/consistent-type-definitions: "off" */
// ============================================================================

import { create } from "zustand";
import { useMemo } from "react";
import { getNodeMetadata } from "../../node-registry/nodespec-registry";

// -----------------------------------------------------------------------------
// 1. Theme constants & helpers
// -----------------------------------------------------------------------------

export interface CategoryTheme {
  background: { light: string; dark: string };
  border: { light: string; dark: string };
  text: {
    primary: { light: string; dark: string };
    secondary: { light: string; dark: string };
  };
  button: {
    border: string;
    hover: { light: string; dark: string };
  };
}

/** Hard-coded fallback palette (used if registry has no entry). */
export const CATEGORY_THEMES: Partial<Record<string, CategoryTheme>> = {
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
};

// -----------------------------------------------------------------------------
// 2. Zustand state, actions & default styles
// -----------------------------------------------------------------------------

export interface NodeStyleState {
  hover: { glow: string; border?: string; scale?: string };
  selection: { glow: string; border?: string; scale?: string };
  activation: {
    glow: string;
    border: string;
    scale?: string;
    buttonTheme: { border: string; hover: string };
  };
  error: {
    glow: string;
    border: string;
    scale?: string;
    buttonTheme: { border: string; hover: string };
    textTheme: {
      primary: string;
      secondary: string;
      border: string;
      focus: string;
    };
  };
  base: { transition: string };
  categoryTheming: {
    enabled: boolean;
    customOverrides: Partial<Record<string, Partial<CategoryTheme>>>;
    debugMode: boolean;
  };
}

export interface NodeStyleActions {
  /* individual mutators */
  updateHoverStyle(s: Partial<NodeStyleState["hover"]>): void;
  updateSelectionStyle(s: Partial<NodeStyleState["selection"]>): void;
  updateActivationStyle(s: Partial<NodeStyleState["activation"]>): void;
  updateErrorStyle(s: Partial<NodeStyleState["error"]>): void;
  updateBaseStyle(s: Partial<NodeStyleState["base"]>): void;
  resetToDefaults(): void;
  /* glow effect utilities */
  setSelectionGlow(preset: keyof typeof GLOW_PRESETS | string): void;
  setHoverGlow(preset: keyof typeof GLOW_PRESETS | string): void;
  /* category theming */
  enableCategoryTheming(): void;
  disableCategoryTheming(): void;
  updateCategoryTheme(cat: string, theme: Partial<CategoryTheme>): void;
  resetCategoryTheme(cat: string): void;
  resetAllCategoryThemes(): void;
  toggleDebugMode(): void;
}

// ============================================================================
// GLOW CONFIGURATION - Easy to find and adjust visual effects
// ============================================================================

/**
 * SELECTION GLOW CONFIGURATION
 * 
 * Easily adjustable glow effects for node selection states.
 * Modify these values to change the visual appearance of node selection.
 * 
 * Format: shadow-[offsetX_offsetY_blurRadius_spreadRadius_color]
 * - offsetX/Y: Shadow position (usually 0_0 for centered glow)
 * - blurRadius: How soft/spread the glow is (higher = more diffuse)
 * - spreadRadius: How far the glow extends (higher = larger glow)
 * - color: RGBA color with alpha for transparency
 */
const GLOW_EFFECTS = {
  /** Subtle hover glow - appears on mouse hover */
  hover: "shadow-[0_0_3px_0px_rgba(255,255,255,0.1)]",
  
  /** Selection glow - faint white glow when node is selected */
  selection: "shadow-[0_0_4px_1px_rgba(255,255,255,0.6)]",
  
  /** Active state glow - green glow for active/running nodes */
  activation: "shadow-[0_0_8px_2px_rgba(34,197,94,0.8)]",
  
  /** Error state glow - red glow for nodes with errors */
  error: "shadow-[0_0_8px_2px_rgba(239,68,68,0.8)]",
} as const;

/**
 * GLOW UTILITY FUNCTIONS
 * 
 * Helper functions to create custom glow effects programmatically.
 * Use these if you need to generate glow effects dynamically.
 */
export const createGlowEffect = (
  blurRadius: number = 8,
  spreadRadius: number = 2,
  color: string = "255,255,255",
  opacity: number = 0.8
): string => {
  return `shadow-[0_0_${blurRadius}px_${spreadRadius}px_rgba(${color},${opacity})]`;
};

/**
 * Predefined glow presets for common use cases
 */
export const GLOW_PRESETS = {
  subtle: createGlowEffect(4, 1, "255,255,255", 0.4),
  normal: createGlowEffect(8, 2, "255,255,255", 0.8),
  strong: createGlowEffect(12, 3, "255,255,255", 1.0),
  blue: createGlowEffect(8, 2, "59,130,246", 0.8),
  green: createGlowEffect(8, 2, "34,197,94", 0.8),
  red: createGlowEffect(8, 2, "239,68,68", 0.8),
} as const;

const DEFAULT_STYLES: NodeStyleState = {
  hover: { glow: GLOW_EFFECTS.hover },
  selection: { glow: GLOW_EFFECTS.selection },
  activation: {
    glow: GLOW_EFFECTS.activation,
    border: "border-green-300/60 dark:border-green-400/50",
    scale: "scale-[1.02]",
    buttonTheme: {
      border: "border-green-400",
      hover: "hover:bg-green-100 dark:hover:bg-green-900",
    },
  },
  error: {
    glow: GLOW_EFFECTS.error,
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
  base: { transition: "transition-all duration-200" },
  categoryTheming: {
    enabled: true,
    customOverrides: {},
    debugMode: false,
  },
};

/** Typed Zustand store (state + actions). */
export const useNodeStyleStore = create<NodeStyleState & NodeStyleActions>(
  (set) => ({
    ...DEFAULT_STYLES,

    updateHoverStyle: (s) => set((st) => ({ hover: { ...st.hover, ...s } })),
    updateSelectionStyle: (s) =>
      set((st) => ({ selection: { ...st.selection, ...s } })),
    updateActivationStyle: (s) =>
      set((st) => ({ activation: { ...st.activation, ...s } })),
    updateErrorStyle: (s) => set((st) => ({ error: { ...st.error, ...s } })),
    updateBaseStyle: (s) => set((st) => ({ base: { ...st.base, ...s } })),
    resetToDefaults: () => set(DEFAULT_STYLES),

    // Glow effect utilities for easy adjustment
    setSelectionGlow: (preset) => {
      const glowValue = preset in GLOW_PRESETS ? GLOW_PRESETS[preset as keyof typeof GLOW_PRESETS] : preset;
      set((st) => ({ selection: { ...st.selection, glow: glowValue } }));
    },
    setHoverGlow: (preset) => {
      const glowValue = preset in GLOW_PRESETS ? GLOW_PRESETS[preset as keyof typeof GLOW_PRESETS] : preset;
      set((st) => ({ hover: { ...st.hover, glow: glowValue } }));
    },

    enableCategoryTheming: () =>
      set((st) => ({
        categoryTheming: { ...st.categoryTheming, enabled: true },
      })),
    disableCategoryTheming: () =>
      set((st) => ({
        categoryTheming: { ...st.categoryTheming, enabled: false },
      })),
    updateCategoryTheme: (cat, theme) =>
      set((st) => ({
        categoryTheming: {
          ...st.categoryTheming,
          customOverrides: {
            ...st.categoryTheming.customOverrides,
            [cat]: theme,
          },
        },
      })),
    resetCategoryTheme: (cat) =>
      set((st) => {
        const newOverrides = { ...st.categoryTheming.customOverrides };
        delete newOverrides[cat];
        return {
          categoryTheming: { ...st.categoryTheming, customOverrides: newOverrides },
        };
      }),
    resetAllCategoryThemes: () =>
      set((st) => ({
        categoryTheming: { ...st.categoryTheming, customOverrides: {} },
      })),

    toggleDebugMode: () =>
      set((st) => ({
        categoryTheming: {
          ...st.categoryTheming,
          debugMode: !st.categoryTheming.debugMode,
        },
      })),
  })
);

// -----------------------------------------------------------------------------
// 3. Public hooks and helper functions
// -----------------------------------------------------------------------------

export const getNodeCategory = (nodeType?: string): string | null => {
  if (!nodeType) return null;
  const meta = getNodeMetadata(nodeType);
  return meta?.category ?? null;
};

export function useNodeStyleClasses(
  isSelected: boolean,
  isError: boolean,
  isActive: boolean
): string {
  const base = useNodeStyleStore((s) => s.base);
  const selection = useNodeStyleStore((s) => s.selection);
  const error = useNodeStyleStore((s) => s.error);
  const activation = useNodeStyleStore((s) => s.activation);
  const hover = useNodeStyleStore((s) => s.hover);

  return useMemo(() => {
    const classes = [base.transition, hover.glow];
    if (isSelected) classes.push(selection.glow);
    if (isError) classes.push(error.border, error.glow);
    if (isActive) classes.push(activation.border, activation.glow);

    return classes.join(" ");
  }, [base, selection, error, activation, hover, isSelected, isError, isActive]);
}

export function useCategoryTheme(nodeType?: string): CategoryTheme | null {
  const enabled = useNodeStyleStore((s) => s.categoryTheming.enabled);
  const customOverrides = useNodeStyleStore((s) => s.categoryTheming.customOverrides);
  
  return useMemo(() => {
    if (!enabled || !nodeType) return null;

    const category = getNodeCategory(nodeType);
    if (!category) return null;

    const defaultTheme = CATEGORY_THEMES[category] ?? null;
    const overrideTheme = customOverrides[category] ?? {};

    if (!defaultTheme) return null;

    // Deep merge overrides
    return {
      ...defaultTheme,
      ...overrideTheme,
      background: { ...defaultTheme.background, ...(overrideTheme.background ?? {}) },
      border: { ...defaultTheme.border, ...(overrideTheme.border ?? {}) },
      text: {
        ...defaultTheme.text,
        ...(overrideTheme.text ?? {}),
        primary: { ...defaultTheme.text.primary, ...(overrideTheme.text?.primary ?? {}) },
        secondary: { ...defaultTheme.text.secondary, ...(overrideTheme.text?.secondary ?? {}) },
      },
      button: { ...defaultTheme.button, ...(overrideTheme.button ?? {}) },
    };
  }, [enabled, nodeType, customOverrides]);
}
