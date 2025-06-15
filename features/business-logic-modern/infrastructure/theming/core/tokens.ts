/**
 * CORE DESIGN TOKENS - Fundamental design values shared across all components
 *
 * • Base color palette, typography, spacing, and layout tokens
 * • Component-agnostic values that form the foundation
 * • Never contains component-specific styling
 * • Keeps the core system lightweight and focused
 * • Integrates with CSS custom properties and theme system
 *
 * Keywords: core-tokens, foundation, base-values, component-agnostic, lightweight
 */

import tokensJson from "../tokens.json";
import { combineTokens as _combineTokens } from "../utils";

// =====================================================================
// CORE DESIGN TOKENS - The foundation that never bloats
// =====================================================================

/** Core design tokens - these stay small and focused */
export const CORE_TOKENS = tokensJson as Readonly<typeof tokensJson>;

// =====================================================================
// CORE UTILITIES - Fundamental helper functions
// =====================================================================

/** Get core token value with fallback */
export const getCoreToken = (
  category: keyof typeof CORE_TOKENS,
  key: string,
  fallback = ""
): string => {
  // @ts-ignore – index signature dynamic access
  const group = CORE_TOKENS[category] as Record<string, any> | undefined;
  if (!group) return fallback;
  return group[key] ?? fallback;
};

/** Combine multiple token values */
export const combineTokens = _combineTokens;

// =====================================================================
// TYPE DEFINITIONS - For TypeScript safety
// =====================================================================

export type CoreSpacing = keyof typeof CORE_TOKENS.spacing;
export type CoreTypographySize = keyof typeof CORE_TOKENS.typography.sizes;
export type CoreTypographyWeight = keyof typeof CORE_TOKENS.typography.weights;
export type CoreColor = keyof typeof CORE_TOKENS.colors;
export type CoreIconSize = keyof typeof CORE_TOKENS.dimensions.icon;
export type CoreButtonSize = keyof typeof CORE_TOKENS.dimensions.button;
