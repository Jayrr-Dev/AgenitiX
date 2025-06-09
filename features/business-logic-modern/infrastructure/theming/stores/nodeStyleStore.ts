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
import type { NodeCategory } from "../../node-creation/core/registries/json-node-registry/schemas/base";

// Static import to avoid webpack warnings
let unifiedRegistryModule: any = null;

// Initialize registry module at module load time
try {
  unifiedRegistryModule = require("../../node-creation/core/registries/json-node-registry/unifiedRegistry");
} catch (err) {
  console.warn("Failed to load unified registry module:", err);
}

// Simple getter function
const getUnifiedRegistry = () => unifiedRegistryModule;

// -----------------------------------------------------------------------------
// 1.  Lazy-loaded registry helpers – avoid circular deps during init
// -----------------------------------------------------------------------------

// Generic helper to wrap require calls & swallow errors.
function safeRequire<T = unknown>(
  path: string,
  pick: (m: any) => T,
  fallback: T
): T {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return pick(require(path));
  } catch (err) {
    console.warn(`⚠️  Registry helper failed (${path}):`, err);
    return fallback;
  }
}

const lazyGetNodeCategoryMapping = (): Record<string, NodeCategory> => {
  const module = getUnifiedRegistry();
  if (module && module.getNodeCategoryMapping) {
    try {
      return module.getNodeCategoryMapping() || {};
    } catch (err) {
      console.warn("Failed to get node category mapping:", err);
    }
  }
  return {};
};

const lazyIsValidNodeType = (nodeType: string) => {
  const module = getUnifiedRegistry();
  if (module && module.isValidNodeType) {
    try {
      return module.isValidNodeType(nodeType);
    } catch (err) {
      console.warn("Failed to validate node type:", err);
    }
  }
  return false;
};

const lazyCategoryRegistry = () => {
  const module = getUnifiedRegistry();
  if (module && module.CATEGORY_REGISTRY) {
    try {
      return module.CATEGORY_REGISTRY;
    } catch (err) {
      console.warn("Failed to get category registry:", err);
    }
  }
  return {};
};

const lazyGetCategoryMetadata = (category: string) => {
  const module = getUnifiedRegistry();
  if (module && module.getCategoryMetadata) {
    try {
      return module.getCategoryMetadata(category);
    } catch (err) {
      console.warn("Failed to get category metadata:", err);
    }
  }
  return null;
};

const lazyApplyCategoryHooks = (category: string, theme: unknown) => {
  const module = getUnifiedRegistry();
  if (module && module.applyCategoryHooks) {
    try {
      return module.applyCategoryHooks(category, theme);
    } catch (err) {
      console.warn("Failed to apply category hooks:", err);
    }
  }
  return undefined;
};

const lazyGetCategoryTheme = (category: string) => {
  const module = getUnifiedRegistry();
  if (module && module.getCategoryTheme) {
    try {
      return module.getCategoryTheme(category);
    } catch (err) {
      console.warn("Failed to get category theme:", err);
    }
  }
  return null;
};

// Expose registry proxy for BC.
export const CATEGORY_REGISTRY = new Proxy({} as Record<string, unknown>, {
  get: (_t, p) => lazyCategoryRegistry()[p as string],
  ownKeys: () => Object.keys(lazyCategoryRegistry()),
});

// -----------------------------------------------------------------------------
// 2.  Theme constants & helpers
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
export const CATEGORY_THEMES: Partial<Record<NodeCategory, CategoryTheme>> = {
  /* … unchanged data – compressed for brevity … */
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
  /* view, trigger, test, data, media, control, utility, testing … */
};

// -----------------------------------------------------------------------------
// 3.  Zustand state, actions & default styles
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
    customOverrides: Partial<Record<NodeCategory, Partial<CategoryTheme>>>;
    registrySync: boolean;
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
  /* category theming */
  enableCategoryTheming(): void;
  disableCategoryTheming(): void;
  updateCategoryTheme(cat: NodeCategory, theme: Partial<CategoryTheme>): void;
  resetCategoryTheme(cat: NodeCategory): void;
  resetAllCategoryThemes(): void;
  /* registry sync */
  enableRegistrySync(): void;
  disableRegistrySync(): void;
  refreshFromRegistry(): void;
  toggleDebugMode(): void;
  validateNodeTheming(nodeType: string): boolean;
}

const DEFAULT_STYLES: NodeStyleState = {
  hover: { glow: "shadow-[0_0_3px_0px_rgba(255,255,255,0.3)]" },
  selection: { glow: "shadow-[0_0_4px_1px_rgba(255,255,255,0.6)]" },
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
  base: { transition: "transition-all duration-200" },
  categoryTheming: {
    enabled: true,
    customOverrides: {},
    registrySync: true,
    debugMode: false,
  },
};

/** Typed Zustand store (state + actions). */
export const useNodeStyleStore = create<NodeStyleState & NodeStyleActions>(
  (set, get) => ({
    ...DEFAULT_STYLES,

    // ---- inline mutators ----------------------------------------------------
    updateHoverStyle: (s) => set((st) => ({ hover: { ...st.hover, ...s } })),
    updateSelectionStyle: (s) =>
      set((st) => ({ selection: { ...st.selection, ...s } })),
    updateActivationStyle: (s) =>
      set((st) => ({ activation: { ...st.activation, ...s } })),
    updateErrorStyle: (s) => set((st) => ({ error: { ...st.error, ...s } })),
    updateBaseStyle: (s) => set((st) => ({ base: { ...st.base, ...s } })),
    resetToDefaults: () => set(DEFAULT_STYLES),

    // ---- category theming ---------------------------------------------------
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
            [cat]: { ...st.categoryTheming.customOverrides[cat], ...theme },
          },
        },
      })),
    resetCategoryTheme: (cat) =>
      set((st) => ({
        categoryTheming: {
          ...st.categoryTheming,
          customOverrides: { ...st.categoryTheming.customOverrides, [cat]: {} },
        },
      })),
    resetAllCategoryThemes: () =>
      set((st) => ({
        categoryTheming: { ...st.categoryTheming, customOverrides: {} },
      })),

    // ---- registry sync ------------------------------------------------------
    enableRegistrySync: () =>
      set((st) => ({
        categoryTheming: { ...st.categoryTheming, registrySync: true },
      })),
    disableRegistrySync: () =>
      set((st) => ({
        categoryTheming: { ...st.categoryTheming, registrySync: false },
      })),
    refreshFromRegistry: () => {
      const st = get();
      if (st.categoryTheming.registrySync) {
        refreshCategoryMapping();
        st.categoryTheming.debugMode &&
          console.log("🔄  NodeStyleStore refreshed from registry");
      }
    },
    toggleDebugMode: () =>
      set((st) => ({
        categoryTheming: {
          ...st.categoryTheming,
          debugMode: !st.categoryTheming.debugMode,
        },
      })),

    // ---- validation ---------------------------------------------------------
    validateNodeTheming: (nodeType: string) => {
      if (!get().categoryTheming.enabled) return true;

      const valid = lazyIsValidNodeType(nodeType);
      const category = getNodeCategory(nodeType);
      if (get().categoryTheming.debugMode) {
        console.log(`🎨 validateNodeTheming(${nodeType})`, { valid, category });
      }
      return valid && !!category;
    },
  })
);

// -----------------------------------------------------------------------------
// 4.  Cached mapping helpers
// -----------------------------------------------------------------------------

let _categoryMapping: Record<string, NodeCategory> | null = null;
let _mappingError = false;

function getCachedCategoryMapping(): Record<string, NodeCategory> {
  if (_mappingError) return {};
  if (!_categoryMapping) {
    try {
      _categoryMapping = lazyGetNodeCategoryMapping();
    } catch (err) {
      console.warn("⚠️  getCachedCategoryMapping failed:", err);
      _mappingError = true;
      _categoryMapping = {};
    }
  }
  return _categoryMapping;
}

export function refreshCategoryMapping(): void {
  _categoryMapping = null;
  _mappingError = false;
  getCachedCategoryMapping();
}

// Helpers using mapping -------------------------------------------------------

export const NODE_CATEGORY_MAPPING = new Proxy(
  {} as Record<string, NodeCategory>,
  {
    get: (_t, p) => getCachedCategoryMapping()[p as string],
    ownKeys: () => Object.keys(getCachedCategoryMapping()),
    has: (_t, p) => p in getCachedCategoryMapping(),
    getOwnPropertyDescriptor: (_t, p) =>
      p in getCachedCategoryMapping()
        ? {
            enumerable: true,
            configurable: true,
            value: getCachedCategoryMapping()[p as string],
          }
        : undefined,
  }
);

export const getNodeCategory = (nodeType: string): NodeCategory | null =>
  getCachedCategoryMapping()[nodeType] ?? null;

export const getNodesByCategory = (c: NodeCategory): string[] =>
  Object.entries(getCachedCategoryMapping())
    .filter(([_, cat]) => cat === c)
    .map(([type]) => type);

// -----------------------------------------------------------------------------
// 5.  Public hooks  ▸  components import these
// -----------------------------------------------------------------------------

/** Tailwind classes for a node’s outer container (hover/selected/etc.). */
export function useNodeStyleClasses(
  isSelected: boolean,
  isError: boolean,
  isActive: boolean,
  nodeType?: string
): string {
  const s = useNodeStyleStore();

  if (nodeType && s.categoryTheming.debugMode) s.validateNodeTheming(nodeType);

  const stateClass = (() => {
    if (isSelected)
      return `${s.selection.glow} ${s.selection.border ?? ""} ${s.selection.scale ?? ""}`;
    if (isError)
      return `${s.error.glow} ${s.error.border} ${s.error.scale ?? ""}`;
    if (isActive)
      return `${s.activation.glow} ${s.activation.border} ${s.activation.scale ?? ""}`;
    return `hover:${s.hover.glow.replace("shadow-", "")} ${s.hover.border ?? ""} ${s.hover.scale ?? ""}`;
  })();

  return `${s.base.transition} ${stateClass}`.trim();
}

/** Registry-aware palette for the node’s category (or null). */
export function useCategoryTheme(nodeType: string): CategoryTheme | null {
  const { categoryTheming } = useNodeStyleStore();
  if (!categoryTheming.enabled) return null;

  const category = getNodeCategory(nodeType);
  if (!category) {
    categoryTheming.debugMode &&
      console.warn(`🎨 No category for nodeType "${nodeType}"`);
    return null;
  }

  const validation = validateCategoryWithRegistry(category);
  if (!validation.valid) return null;

  const base = getEnhancedCategoryTheme(category);
  const override = categoryTheming.customOverrides[category];
  const finalTheme = override ? { ...base, ...override } : base;

  applyCategoryThemeHooks(category, finalTheme);
  return finalTheme;
}

/** Tailwind classes for inside buttons (registry aware). */
export function useNodeButtonTheme(
  isError: boolean,
  isActive: boolean,
  nodeType?: string
): string {
  const s = useNodeStyleStore();
  if (isError)
    return `${s.error.buttonTheme.border} ${s.error.buttonTheme.hover}`;
  if (isActive)
    return `${s.activation.buttonTheme.border} ${s.activation.buttonTheme.hover}`;

  if (nodeType && s.categoryTheming.enabled) {
    const cat = getNodeCategory(nodeType);
    if (cat && validateCategoryWithRegistry(cat).valid) {
      const t = getEnhancedCategoryTheme(cat);
      const o = s.categoryTheming.customOverrides[cat];
      const th = o ? { ...t, ...o } : t;
      return `${th.button.border} ${th.button.hover.light} dark:${th.button.hover.dark}`;
    }
  }
  // Fallback blue.
  return "border-blue-300 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800";
}

/** Text colours for title/secondary text inside a node. */
export function useNodeTextTheme(isError: boolean, nodeType?: string) {
  const s = useNodeStyleStore();
  if (isError) return s.error.textTheme;

  if (nodeType && s.categoryTheming.enabled) {
    const cat = getNodeCategory(nodeType);
    if (cat && validateCategoryWithRegistry(cat).valid) {
      const t = getEnhancedCategoryTheme(cat);
      const o = s.categoryTheming.customOverrides[cat];
      const th = o ? { ...t, ...o } : t;
      return {
        primary: `${th.text.primary.light} dark:${th.text.primary.dark}`,
        secondary: `${th.text.secondary.light} dark:${th.text.secondary.dark}`,
        border: `${th.border.light} dark:${th.border.dark}`,
        focus: `focus:ring-${th.border.light.split("-")[1]}-500`,
      };
    }
  }
  // Fallback blue.
  return {
    primary: "text-blue-900 dark:text-blue-100",
    secondary: "text-blue-800 dark:text-blue-200",
    border: "border-blue-300 dark:border-blue-700",
    focus: "focus:ring-blue-500",
  };
}

// Convenience aliases for callers that already know they want “category aware”.
export const useNodeCategoryButtonTheme = useNodeButtonTheme;
export const useNodeCategoryTextTheme = useNodeTextTheme;
export function useNodeCategoryBaseClasses(nodeType: string) {
  const t = useCategoryTheme(nodeType);
  return t
    ? {
        background: `${t.background.light} dark:${t.background.dark}`,
        border: `${t.border.light} dark:${t.border.dark}`,
        textPrimary: `${t.text.primary.light} dark:${t.text.primary.dark}`,
        textSecondary: `${t.text.secondary.light} dark:${t.text.secondary.dark}`,
      }
    : {
        background: "bg-blue-50 dark:bg-blue-900",
        border: "border-blue-300 dark:border-blue-800",
        textPrimary: "text-blue-900 dark:text-blue-100",
        textSecondary: "text-blue-800 dark:text-blue-200",
      };
}

// -----------------------------------------------------------------------------
// 6.  Admin helpers – enableCategoryTheming, presets, stats, debug, etc.
// -----------------------------------------------------------------------------

export function enableCategoryTheming(): void {
  const s = useNodeStyleStore.getState();
  s.enableCategoryTheming();
  s.enableRegistrySync();
  s.refreshFromRegistry();
  Object.keys(CATEGORY_REGISTRY).forEach((c) => {
    const meta = lazyGetCategoryMetadata(c);
    if (meta?.enabled) lazyApplyCategoryHooks(c, "onActivate");
  });
}

export function applyCategoryTheme(
  category: NodeCategory,
  custom: Partial<CategoryTheme>
): boolean {
  const s = useNodeStyleStore.getState();
  const val = validateCategoryWithRegistry(category);
  if (!val.valid) {
    console.warn(`⚠️  Category "${category}" invalid: ${val.reason}`);
    return false;
  }
  const merged = { ...getEnhancedCategoryTheme(category), ...custom };
  s.updateCategoryTheme(category, merged);
  s.enableCategoryTheming();
  applyCategoryThemeHooks(category, merged);
  return true;
}

export function applyAllCategoryDefaults(): void {
  const s = useNodeStyleStore.getState();
  s.enableCategoryTheming();
  s.enableRegistrySync();
  s.resetAllCategoryThemes();
  s.refreshFromRegistry();

  // Apply in registry priority order.
  Object.entries(lazyCategoryRegistry())
    .filter(([, m]) => (m as any).enabled)
    .sort(([, a], [, b]) => (a as any).priority - (b as any).priority)
    .forEach(([cat]) =>
      s.updateCategoryTheme(
        cat as NodeCategory,
        getEnhancedCategoryTheme(cat as NodeCategory)
      )
    );
}

export const STYLE_PRESETS = {
  subtle: { hover: { glow: "shadow-[0_0_2px_0px_rgba(255,255,255,0.2)]" } },
  dramatic: { hover: { glow: "shadow-[0_0_6px_2px_rgba(255,255,255,0.5)]" } },
  minimal: { hover: { glow: "shadow-[0_0_1px_0px_rgba(255,255,255,0.4)]" } },
} as const;

export function applyStylePreset(name: keyof typeof STYLE_PRESETS): void {
  const preset = STYLE_PRESETS[name];
  const s = useNodeStyleStore.getState();
  preset.hover && s.updateHoverStyle(preset.hover);
  // preset.activation && s.updateActivationStyle(preset.activation);
  // preset.error && s.updateErrorStyle(preset.error);
}

export function getThemeStatistics() {
  const map = getCachedCategoryMapping();
  const st = useNodeStyleStore.getState();
  return {
    registry: {
      totalNodes: Object.keys(map).length,
      totalCategories: Object.keys(CATEGORY_REGISTRY).length,
    },
    theming: {
      enabled: st.categoryTheming.enabled,
      overrides: Object.keys(st.categoryTheming.customOverrides).length,
    },
  };
}

export function enableThemeDebugMode(): void {
  const s = useNodeStyleStore.getState();
  s.toggleDebugMode();
  console.log("🔧  Theme debug mode", getThemeStatistics());
}

// -----------------------------------------------------------------------------
// 7.  Registry validation & enhanced theme helpers
// -----------------------------------------------------------------------------

export function getEnhancedCategoryTheme(
  category: NodeCategory
): CategoryTheme {
  const reg = lazyGetCategoryTheme(category);
  const meta = lazyGetCategoryMetadata(category);
  if (reg && meta?.enabled) {
    // Convert registry format to CategoryTheme => assumes { background, border, primary, secondary }
    return {
      background: reg.background,
      border: reg.border,
      text: {
        primary: {
          light: `text-${reg.primary}-900`,
          dark: `text-${reg.primary}-100`,
        },
        secondary: {
          light: `text-${reg.secondary}-800`,
          dark: `text-${reg.secondary}-200`,
        },
      },
      button: {
        border: `border-${reg.primary}-300 dark:border-${reg.primary}-800`,
        hover: {
          light: `hover:bg-${reg.primary}-200`,
          dark: `hover:bg-${reg.primary}-800`,
        },
      },
    };
  }
  // Ensure we always return a CategoryTheme by using type assertion
  return (CATEGORY_THEMES[category] ?? CATEGORY_THEMES.create) as CategoryTheme;
}

export function validateCategoryWithRegistry(category: NodeCategory): {
  valid: boolean;
  enabled: boolean;
  metadata: unknown;
  reason?: string;
} {
  const meta = lazyGetCategoryMetadata(category);
  if (!meta) {
    return {
      valid: true,
      enabled: true,
      metadata: null,
      reason: "Registry not ready",
    };
  }
  if ((meta as any).isEnabled === false)
    return { valid: false, enabled: false, metadata: meta, reason: "Disabled" };
  return { valid: true, enabled: true, metadata: meta };
}

export function getCategoryThemePriority(category: NodeCategory): number {
  return (lazyGetCategoryMetadata(category) as any)?.priority ?? 999;
}

export function applyCategoryThemeHooks(
  category: NodeCategory,
  theme: CategoryTheme
) {
  lazyApplyCategoryHooks(category, theme);
}
