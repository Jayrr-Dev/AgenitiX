/**
 * NODE SIZE CONSTANTS - Standardized sizing system v1.1.0
 *
 * • Provides standardized size constants for consistent node sizing
 * • Implements collapsed, expanded fixed, and expanded variable sizing
 * • Uses Tailwind CSS classes for proper rendering integration
 * • Supports pattern-based sizing combinations for different node types
 * • Ensures type safety and validation for all size configurations
 *
 * Keywords: sizing, constants, tailwind, collapsed, expanded, fixed, variable,
 * standardized, patterns, type-safety, validation, responsive, dimensions
 */

// ============================================================================
// COLLAPSED SIZE CONSTANTS
// ============================================================================

/**
 * COLLAPSED SIZES (Icon State)
 * Standard collapsed sizes for different node types
 */
export const COLLAPSED_SIZES = {
  /** size-c1: 60x60 - Small triggers, icons */
  C1: { width: "w-[60px]" as const, height: "h-[60px]" as const },

  /** size-c1w: 120x60 - Text nodes, wide triggers */
  C1W: { width: "w-[120px]" as const, height: "h-[60px]" as const },

  /** size-c2: 120x120 - Medium interactive nodes */
  C2: { width: "w-[120px]" as const, height: "h-[120px]" as const },

  /** size-c3: 180x180 - Large complex nodes */
  C3: { width: "w-[180px]" as const, height: "h-[180px]" as const },
} as const;

// ============================================================================
// EXPANDED FIXED SIZE CONSTANTS
// ============================================================================

/**
 * EXPANDED FIXED SIZES (UI State with Fixed Height)
 * Fixed height expanded sizes for nodes with specific UI layouts
 */
export const EXPANDED_FIXED_SIZES = {
  /** size-fe0: 60x60 - Minimal expanded */
  FE0: { width: "w-[60px]" as const, height: "h-[60px]" as const },

  /** size-fe0h: 60x120 - Narrow tall expanded */
  FE0H: { width: "w-[60px]" as const, height: "h-[120px]" as const },

  /** size-fe1: 120x120 - Standard expanded */
  FE1: { width: "w-[120px]" as const, height: "h-[120px]" as const },

  /** size-fe1h: 120x180 - Standard tall expanded */
  FE1H: { width: "w-[120px]" as const, height: "h-[180px]" as const },

  /** size-fe2: 180x180 - Large expanded */
  FE2: { width: "w-[180px]" as const, height: "h-[180px]" as const },

  /** size-fe3: 240x240 - Extra large expanded */
  FE3: { width: "w-[240px]" as const, height: "h-[240px]" as const },
} as const;

// ============================================================================
// EXPANDED VARIABLE SIZE CONSTANTS
// ============================================================================

/**
 * EXPANDED VARIABLE SIZES (Width Only, Auto Height)
 * Variable height expanded sizes for content-adaptive nodes
 */
export const EXPANDED_VARIABLE_SIZES = {
  /** size-ve0: 60w - Narrow variable height */
  VE0: { width: "w-[60px]" as const },

  /** size-ve1: 120w - Standard variable height */
  VE1: { width: "w-[120px]" as const },

  /** size-ve2: 180w - Wide variable height */
  VE2: { width: "w-[180px]" as const },

  /** size-ve3: 240w - Extra wide variable height */
  VE3: { width: "w-[240px]" as const },
} as const;

// ============================================================================
// STANDARDIZED SIZE COMBINATIONS
// ============================================================================

/**
 * STANDARD SIZE PATTERNS
 * Pre-configured size combinations for common node types
 */
export const STANDARD_SIZE_PATTERNS = {
  /** Small trigger nodes - 60x60 collapsed, 120x120 expanded */
  SMALL_TRIGGER: {
    collapsed: COLLAPSED_SIZES.C1,
    expanded: EXPANDED_FIXED_SIZES.FE1,
  },

  /** Wide text nodes - 120x60 collapsed, 180w expanded */
  WIDE_TEXT: {
    collapsed: COLLAPSED_SIZES.C1W,
    expanded: EXPANDED_VARIABLE_SIZES.VE2,
  },

  /** Large interactive nodes - 120x120 collapsed, 240x240 expanded */
  LARGE_INTERACTIVE: {
    collapsed: COLLAPSED_SIZES.C2,
    expanded: EXPANDED_FIXED_SIZES.FE3,
  },

  /** Extra large nodes - 180x180 collapsed, 240x240 expanded */
  EXTRA_LARGE: {
    collapsed: COLLAPSED_SIZES.C3,
    expanded: EXPANDED_FIXED_SIZES.FE3,
  },

  /** Standard text nodes - 120x60 collapsed, 120w expanded */
  STANDARD_TEXT: {
    collapsed: COLLAPSED_SIZES.C1W,
    expanded: EXPANDED_VARIABLE_SIZES.VE1,
  },

  /** Minimal nodes - 60x60 collapsed, 60w expanded */
  MINIMAL: {
    collapsed: COLLAPSED_SIZES.C1,
    expanded: EXPANDED_VARIABLE_SIZES.VE0,
  },
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * TYPE DEFINITIONS FOR SIZE CONSTANTS
 * Ensures type safety for all size configurations
 */
export type CollapsedSizeKey = keyof typeof COLLAPSED_SIZES;
export type ExpandedFixedSizeKey = keyof typeof EXPANDED_FIXED_SIZES;
export type ExpandedVariableSizeKey = keyof typeof EXPANDED_VARIABLE_SIZES;
export type StandardSizePatternKey = keyof typeof STANDARD_SIZE_PATTERNS;

/**
 * SIZE CONFIGURATION TYPES
 * Type definitions for size objects
 */
export type CollapsedSize = (typeof COLLAPSED_SIZES)[CollapsedSizeKey];
export type ExpandedFixedSize =
  (typeof EXPANDED_FIXED_SIZES)[ExpandedFixedSizeKey];
export type ExpandedVariableSize =
  (typeof EXPANDED_VARIABLE_SIZES)[ExpandedVariableSizeKey];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * GET SIZE BY PATTERN NAME
 * Utility function to get size configuration by pattern name
 */
export function getSizePattern(patternKey: StandardSizePatternKey) {
  return STANDARD_SIZE_PATTERNS[patternKey];
}

/**
 * CREATE CUSTOM SIZE COMBINATION
 * Utility function to create custom size combinations
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
 * Ensures size configurations use proper Tailwind classes
 */
export function validateSizeConfig(size: any): boolean {
  if (!size || typeof size !== "object") return false;

  const { collapsed, expanded } = size;

  // Validate collapsed size
  if (
    !collapsed?.width?.startsWith("w-") ||
    !collapsed?.height?.startsWith("h-")
  ) {
    console.error(
      "❌ Size validation failed: Collapsed size must use Tailwind classes"
    );
    return false;
  }

  // Validate expanded size
  if (!expanded?.width?.startsWith("w-")) {
    console.error(
      "❌ Size validation failed: Expanded width must use Tailwind classes"
    );
    return false;
  }

  // Validate expanded height if present
  if (expanded.height && !expanded.height.startsWith("h-")) {
    console.error(
      "❌ Size validation failed: Expanded height must use Tailwind classes"
    );
    return false;
  }

  return true;
}

// ============================================================================
// SIZE REFERENCE MAP
// ============================================================================

/**
 * SIZE REFERENCE MAP
 * Complete mapping of all available sizes for easy reference
 */
export const SIZE_REFERENCE = {
  collapsed: {
    "size-c1": COLLAPSED_SIZES.C1, // 60x60
    "size-c1w": COLLAPSED_SIZES.C1W, // 120x60
    "size-c2": COLLAPSED_SIZES.C2, // 120x120
    "size-c3": COLLAPSED_SIZES.C3, // 180x180
  },
  expandedFixed: {
    "size-fe0": EXPANDED_FIXED_SIZES.FE0, // 60x60
    "size-fe0h": EXPANDED_FIXED_SIZES.FE0H, // 60x120
    "size-fe1": EXPANDED_FIXED_SIZES.FE1, // 120x120
    "size-fe1h": EXPANDED_FIXED_SIZES.FE1H, // 120x180
    "size-fe2": EXPANDED_FIXED_SIZES.FE2, // 180x180
    "size-fe3": EXPANDED_FIXED_SIZES.FE3, // 240x240
  },
  expandedVariable: {
    "size-ve0": EXPANDED_VARIABLE_SIZES.VE0, // 60w
    "size-ve1": EXPANDED_VARIABLE_SIZES.VE1, // 120w
    "size-ve2": EXPANDED_VARIABLE_SIZES.VE2, // 180w
    "size-ve3": EXPANDED_VARIABLE_SIZES.VE3, // 240w
  },
} as const;

// ============================================================================
// LEGACY COMPATIBILITY (DEPRECATED)
// ============================================================================

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

// ============================================================================
// V2U NODE SIZE CONVERSION UTILITIES
// ============================================================================

/**
 * CONVERT V2U NODE SIZES
 * Converts numerical pixel values from V2U defineNode configurations
 * to standardized Tailwind size patterns
 */

/**
 * Map V2U numerical sizes to standardized size patterns
 * Based on the V2U node configurations found in the codebase
 */
export function convertV2UNodeSize(nodeType: string, v2uSize: any): any {
  if (!v2uSize || typeof v2uSize !== "object") {
    console.warn(
      `[V2U Size Conversion] Invalid size config for ${nodeType}, using default`
    );
    return STANDARD_SIZE_PATTERNS.SMALL_TRIGGER;
  }

  const { collapsed, expanded } = v2uSize;

  // Map based on V2U node types and their specific requirements
  switch (nodeType) {
    case "createTextV2U":
      // CreateTextV2U: 200x80 collapsed, 300x160 expanded
      // Maps to: WIDE_TEXT pattern (120x60 → 180w)
      return STANDARD_SIZE_PATTERNS.WIDE_TEXT;

    case "viewOutputV2U":
      // ViewOutputV2U: 180x100 collapsed, 320x240 expanded
      // Maps to: LARGE_INTERACTIVE pattern (120x120 → 240x240)
      return STANDARD_SIZE_PATTERNS.LARGE_INTERACTIVE;

    case "triggerOnToggleV2U":
      // TriggerOnToggleV2U: 80x80 collapsed, 200x120 expanded
      // Maps to: SMALL_TRIGGER pattern (60x60 → 120x120)
      return STANDARD_SIZE_PATTERNS.SMALL_TRIGGER;

    case "testErrorV2U":
      // TestErrorV2U: 120x100 collapsed, 300x200 expanded
      // Maps to: LARGE_INTERACTIVE pattern (120x120 → 240x240)
      return STANDARD_SIZE_PATTERNS.LARGE_INTERACTIVE;

    default:
      // Fallback: Analyze dimensions and map to closest pattern
      return mapDimensionsToPattern(collapsed, expanded);
  }
}

/**
 * Map dimensions to the closest standardized pattern
 * Fallback function for unknown node types
 */
function mapDimensionsToPattern(collapsed: any, expanded: any): any {
  if (!collapsed) return STANDARD_SIZE_PATTERNS.SMALL_TRIGGER;

  const collapsedWidth = collapsed.width || 120;
  const collapsedHeight = collapsed.height || 80;

  // Small nodes (≤ 80px)
  if (collapsedWidth <= 80 && collapsedHeight <= 80) {
    return STANDARD_SIZE_PATTERNS.SMALL_TRIGGER;
  }

  // Wide text nodes (width > height)
  if (collapsedWidth > collapsedHeight && collapsedWidth <= 200) {
    return STANDARD_SIZE_PATTERNS.WIDE_TEXT;
  }

  // Large interactive nodes (width ≥ 120px, square-ish)
  if (
    collapsedWidth >= 120 &&
    Math.abs(collapsedWidth - collapsedHeight) <= 40
  ) {
    return STANDARD_SIZE_PATTERNS.LARGE_INTERACTIVE;
  }

  // Extra large nodes (width > 180px)
  if (collapsedWidth > 180) {
    return STANDARD_SIZE_PATTERNS.EXTRA_LARGE;
  }

  // Default fallback
  return STANDARD_SIZE_PATTERNS.SMALL_TRIGGER;
}

/**
 * Convert numerical pixel values to Tailwind classes
 * @deprecated Use convertV2UNodeSize instead for proper pattern mapping
 */
export function convertPixelsToTailwind(
  pixels: number,
  dimension: "width" | "height"
): string {
  const prefix = dimension === "width" ? "w-" : "h-";

  // Common size mappings
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
