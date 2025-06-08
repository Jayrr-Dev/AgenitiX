/**
 * NODE SIZE CONSTANTS - Standardized sizing system v1.1.0
 *
 * 🧱 BUILD-TIME
 * - Size constants, patterns, mappings
 * - Type definitions (Tailwind-compatible config)
 *
 * ⚙️ RUNTIME
 * - Size utilities: lookup, validate, convert
 *
 * Keywords: size, tailwind, responsive, fixed, variable, type-safety, node-ui
 *

//
// ==========================
// 🧱 BUILD-TIME CONSTANTS
// ==========================
//

/**
 * COLLAPSED SIZES (Icon State)
 */

export const COLLAPSED_SIZES = {
  C1: { width: "w-[60px]" as const, height: "h-[60px]" as const },
  C1W: { width: "w-[120px]" as const, height: "h-[60px]" as const },
  C2: { width: "w-[120px]" as const, height: "h-[120px]" as const },
  C3: { width: "w-[180px]" as const, height: "h-[180px]" as const },
} as const;

/**
 * EXPANDED FIXED SIZES (UI State with Fixed Height)
 */
export const EXPANDED_FIXED_SIZES = {
  FE0: { width: "w-[60px]" as const, height: "h-[60px]" as const },
  FE0H: { width: "w-[60px]" as const, height: "h-[120px]" as const },
  FE1: { width: "w-[120px]" as const, height: "h-[120px]" as const },
  FE1H: { width: "w-[120px]" as const, height: "h-[180px]" as const },
  FE2: { width: "w-[180px]" as const, height: "h-[180px]" as const },
  FE3: { width: "w-[240px]" as const, height: "h-[240px]" as const },
} as const;

/**
 * EXPANDED VARIABLE SIZES (Width Only, Auto Height)
 */
export const EXPANDED_VARIABLE_SIZES = {
  VE0: { width: "w-[60px]" as const },
  VE1: { width: "w-[120px]" as const },
  VE2: { width: "w-[180px]" as const },
  VE3: { width: "w-[240px]" as const },
} as const;

/**
 * STANDARD SIZE PATTERNS
 */
export const STANDARD_SIZE_PATTERNS = {
  SMALL_TRIGGER: {
    collapsed: COLLAPSED_SIZES.C1,
    expanded: EXPANDED_FIXED_SIZES.FE1,
  },
  WIDE_TEXT: {
    collapsed: COLLAPSED_SIZES.C1W,
    expanded: EXPANDED_VARIABLE_SIZES.VE2,
  },
  LARGE_INTERACTIVE: {
    collapsed: COLLAPSED_SIZES.C2,
    expanded: EXPANDED_FIXED_SIZES.FE3,
  },
  EXTRA_LARGE: {
    collapsed: COLLAPSED_SIZES.C3,
    expanded: EXPANDED_FIXED_SIZES.FE3,
  },
  STANDARD_TEXT: {
    collapsed: COLLAPSED_SIZES.C1W,
    expanded: EXPANDED_VARIABLE_SIZES.VE1,
  },
  MINIMAL: {
    collapsed: COLLAPSED_SIZES.C1,
    expanded: EXPANDED_VARIABLE_SIZES.VE0,
  },
} as const;

/**
 * SIZE REFERENCE MAP
 */
export const SIZE_REFERENCE = {
  collapsed: {
    "size-c1": COLLAPSED_SIZES.C1,
    "size-c1w": COLLAPSED_SIZES.C1W,
    "size-c2": COLLAPSED_SIZES.C2,
    "size-c3": COLLAPSED_SIZES.C3,
  },
  expandedFixed: {
    "size-fe0": EXPANDED_FIXED_SIZES.FE0,
    "size-fe0h": EXPANDED_FIXED_SIZES.FE0H,
    "size-fe1": EXPANDED_FIXED_SIZES.FE1,
    "size-fe1h": EXPANDED_FIXED_SIZES.FE1H,
    "size-fe2": EXPANDED_FIXED_SIZES.FE2,
    "size-fe3": EXPANDED_FIXED_SIZES.FE3,
  },
  expandedVariable: {
    "size-ve0": EXPANDED_VARIABLE_SIZES.VE0,
    "size-ve1": EXPANDED_VARIABLE_SIZES.VE1,
    "size-ve2": EXPANDED_VARIABLE_SIZES.VE2,
    "size-ve3": EXPANDED_VARIABLE_SIZES.VE3,
  },
} as const;

/**
 * LEGACY COMPATIBILITY MAPPING
 * @deprecated Use new size constants instead
 */
export const LEGACY_COMMON_NODE_SIZES = {
  SMALL_TRIGGER: STANDARD_SIZE_PATTERNS.SMALL_TRIGGER,
  STANDARD_TRIGGER: STANDARD_SIZE_PATTERNS.SMALL_TRIGGER,
  LARGE_TRIGGER: STANDARD_SIZE_PATTERNS.LARGE_INTERACTIVE,
  TEXT_NODE: STANDARD_SIZE_PATTERNS.WIDE_TEXT,
} as const;

//
// ==========================
// 🧱 TYPE DEFINITIONS
// ==========================
//

export type CollapsedSizeKey = keyof typeof COLLAPSED_SIZES;
export type ExpandedFixedSizeKey = keyof typeof EXPANDED_FIXED_SIZES;
export type ExpandedVariableSizeKey = keyof typeof EXPANDED_VARIABLE_SIZES;
export type StandardSizePatternKey = keyof typeof STANDARD_SIZE_PATTERNS;

export type CollapsedSize = (typeof COLLAPSED_SIZES)[CollapsedSizeKey];
export type ExpandedFixedSize =
  (typeof EXPANDED_FIXED_SIZES)[ExpandedFixedSizeKey];
export type ExpandedVariableSize =
  (typeof EXPANDED_VARIABLE_SIZES)[ExpandedVariableSizeKey];

//
// ==========================
// ⚙️ RUNTIME UTILITY FUNCTIONS
// ==========================
//

/**
 * GET SIZE BY PATTERN NAME
 */
export function getSizePattern(patternKey: StandardSizePatternKey) {
  return STANDARD_SIZE_PATTERNS[patternKey];
}

/**
 * CREATE CUSTOM SIZE COMBINATION
 */
export function createSizeConfig(
  collapsedKey: CollapsedSizeKey,
  expandedKey: ExpandedFixedSizeKey | ExpandedVariableSizeKey
) {
  const collapsed = COLLAPSED_SIZES[collapsedKey];
  const expanded =
    expandedKey in EXPANDED_FIXED_SIZES
      ? EXPANDED_FIXED_SIZES[expandedKey as ExpandedFixedSizeKey]
      : EXPANDED_VARIABLE_SIZES[expandedKey as ExpandedVariableSizeKey];
  return { collapsed, expanded };
}

/**
 * VALIDATE SIZE CONFIGURATION
 */
export function validateSizeConfig(size: any): boolean {
  if (!size || typeof size !== "object") return false;
  const { collapsed, expanded } = size;
  if (
    !collapsed?.width?.startsWith("w-") ||
    !collapsed?.height?.startsWith("h-")
  ) {
    console.error(
      "❌ Size validation failed: Collapsed size must use Tailwind classes"
    );
    return false;
  }
  if (!expanded?.width?.startsWith("w-")) {
    console.error(
      "❌ Size validation failed: Expanded width must use Tailwind classes"
    );
    return false;
  }
  if (expanded.height && !expanded.height.startsWith("h-")) {
    console.error(
      "❌ Size validation failed: Expanded height must use Tailwind classes"
    );
    return false;
  }
  return true;
}

/**
 * Converts V2U numerical pixel values to standardized size patterns
 */
export function convertV2UNodeSize(nodeType: string, v2uSize: any): any {
  if (!v2uSize || typeof v2uSize !== "object") {
    console.warn(
      `[V2U Size Conversion] Invalid size config for ${nodeType}, using default`
    );
    return STANDARD_SIZE_PATTERNS.SMALL_TRIGGER;
  }
  const { collapsed, expanded } = v2uSize;
  switch (nodeType) {
    case "createTextV2U":
      return STANDARD_SIZE_PATTERNS.WIDE_TEXT;
    case "viewOutputV2U":
      return STANDARD_SIZE_PATTERNS.LARGE_INTERACTIVE;
    case "triggerOnToggleV2U":
      return STANDARD_SIZE_PATTERNS.SMALL_TRIGGER;
    case "testErrorV2U":
      return STANDARD_SIZE_PATTERNS.LARGE_INTERACTIVE;
    default:
      return mapDimensionsToPattern(collapsed, expanded);
  }
}

/**
 * Maps dimensions to the closest standardized pattern
 */
function mapDimensionsToPattern(collapsed: any, expanded: any): any {
  if (!collapsed) return STANDARD_SIZE_PATTERNS.SMALL_TRIGGER;
  const collapsedWidth = collapsed.width || 120;
  const collapsedHeight = collapsed.height || 80;
  if (collapsedWidth <= 80 && collapsedHeight <= 80)
    return STANDARD_SIZE_PATTERNS.SMALL_TRIGGER;
  if (collapsedWidth > collapsedHeight && collapsedWidth <= 200)
    return STANDARD_SIZE_PATTERNS.WIDE_TEXT;
  if (collapsedWidth >= 120 && Math.abs(collapsedWidth - collapsedHeight) <= 40)
    return STANDARD_SIZE_PATTERNS.LARGE_INTERACTIVE;
  if (collapsedWidth > 180) return STANDARD_SIZE_PATTERNS.EXTRA_LARGE;
  return STANDARD_SIZE_PATTERNS.SMALL_TRIGGER;
}

/**
 * Converts a pixel value to Tailwind class
 * @deprecated Use convertV2UNodeSize instead
 */
export function convertPixelsToTailwind(
  pixels: number,
  dimension: "width" | "height"
): string {
  const prefix = dimension === "width" ? "w-" : "h-";
  const sizeMap: Record<number, string> = {
    60: `${prefix}[60px]`,
    80: `${prefix}[80px]`,
    100: `${prefix}[100px]`,
    120: `${prefix}[120px]`,
    160: `${prefix}[160px]`,
    180: `${prefix}[180px]`,
    200: `${prefix}[200px]`,
    240: `${prefix}[240px]`,
    300: `${prefix}[300px]`,
    320: `${prefix}[320px]`,
  };
  return sizeMap[pixels] || `${prefix}[${pixels}px]`;
}

/**
 * Log V2U size conversion for debugging
 */
export function logV2USizeConversion(
  nodeType: string,
  originalSize: any,
  convertedSize: any
): void {
  console.log(`🎯 [V2U Size Conversion] ${nodeType}:`);
  console.log(`   Original:`, originalSize);
  console.log(`   Converted:`, convertedSize);
}
