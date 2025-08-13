// features/business-logic-modern/infrastructure/theming/sizing.ts
/**
 * Standardized node sizes for collapsed state.
 *
 * - C1: 60x60 (default collapsed)
 * - C1W: 120x60 (wide collapsed)
 * - C2: 120x120 (large collapsed)
 * - C3: 180x180 (extra large collapsed)
 *
 * Use these for the `collapsed` property in node specs.
 * @readonly
 */
export const COLLAPSED_SIZES = {
  C1: { width: 60, height: 60 },
  C1W: { width: 120, height: 60 },
  C2: { width: 120, height: 120 },
  C2W: { width: 180, height: 120 },
  C3: { width: 180, height: 180 },
  C3W: { width: 240, height: 180 },
  PRIMITIVE: { width: 60, height: 60 }, // For logic gates and other primitive nodes
} as const;

/**
 * Standardized node sizes for expanded state.
 *
 * - FE0: 60x60 (tiny expanded)
 * - FE1: 120x120 (default expanded)
 * - FE1H: 120x180 (tall expanded)
 * - FV2: 180x180-360 (flexible vertical 2)
 * - FE2: 180x180 (large expanded)
 * - FE3: 240x240 (extra large expanded)
 * - VE0: 60x'auto' (tiny, variable height)
 * - VE1: 120x'auto' (default, variable height)
 * - VE2: 180x'auto' (large, variable height)
 * - VE3: 240x'auto' (extra large, variable height)
 *
 * Use these for the `expanded` property in node specs.
 *
 * @example
 *   size: {
 *     expanded: EXPANDED_SIZES.FE1, // 120x120
 *     collapsed: COLLAPSED_SIZES.C1, // 60x60
 *   }
 *
 * @readonly
 */
export const EXPANDED_SIZES = {
  // Fixed sizes
  FE0: { width: 60, height: 60 },
  FE1: { width: 120, height: 120 },
  FE1H: { width: 120, height: 180 },
  FV2: { width: 180, minHeight: 180, maxHeight: 360 },
  FE2: { width: 180, height: 180 },
  FE3: { width: 240, height: 240 },
  FE3H: { width: 240, height: 360 },
  FE3W: { width: 360, height: 240 },
  // Variable sizes
  VE0: { width: 60, minHeight: 60 },
  VE1: { width: 120, minHeight: 120 },
  VE2: { width: 180, minHeight: 180 },
  VE3: { width: 240, minHeight: 240 },
  VE3H: { width: 240, minHeight: 360 },
  VE3W: { width: 360, minHeight: 240 },
} as const;
