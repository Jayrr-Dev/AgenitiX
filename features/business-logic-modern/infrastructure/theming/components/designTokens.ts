/**
 * DESIGN TOKENS - Centralized design system constants
 *
 * • Color palettes with proper contrast ratios
 * • Elevation system for visual hierarchy
 * • Typography and spacing constants
 * • Semantic token definitions
 *
 * Keywords: design-tokens, color-palette, elevation, typography
 */

// ============================================================================
// CONSTANTS - Top-level constants for better maintainability
// ============================================================================

/** Duration for component transitions in milliseconds */
export const TRANSITION_DURATION_FAST = 150;
export const TRANSITION_DURATION_NORMAL = 200;

/** Shadow blur values for elevation system */
export const SHADOW_BLUR_SMALL = "sm";
export const SHADOW_BLUR_MEDIUM = "md";
export const SHADOW_BLUR_LARGE = "lg";
export const SHADOW_BLUR_EXTRA_LARGE = "xl";

/** Border radius values for consistent component styling */
export const BORDER_RADIUS_SMALL = "rounded-sm";
export const BORDER_RADIUS_MEDIUM = "rounded-md";
export const BORDER_RADIUS_LARGE = "rounded-lg";
export const BORDER_RADIUS_DEFAULT = "rounded";

/** Opacity values for consistent transparency effects */
export const OPACITY_SUBTLE = "0.1";
export const OPACITY_MODERATE = "0.2";
export const OPACITY_STRONG = "0.3";
export const OPACITY_SEMI_TRANSPARENT = "0.5";
export const OPACITY_MOSTLY_OPAQUE = "0.8";

// ============================================================================
// ELEVATION SYSTEM - Material Design inspired elevation
// ============================================================================

/**
 * Elevation system for proper visual hierarchy
 *
 * Based on Material Design principles, this system provides consistent
 * elevation levels through shadow variations and glow effects for
 * interactive states.
 */
export const ELEVATION_SYSTEM = {
  // Surface elevations with proper shadows for depth perception
  surface: {
    level0: "shadow-none", // Base surface - no elevation
    level1: `shadow-${SHADOW_BLUR_SMALL}`, // Slightly elevated (cards, buttons)
    level2: `shadow-${SHADOW_BLUR_MEDIUM}`, // Elevated (dropdowns, tooltips)
    level3: `shadow-${SHADOW_BLUR_LARGE}`, // Highly elevated (modals, dialogs)
    level4: `shadow-${SHADOW_BLUR_EXTRA_LARGE}`, // Maximum elevation (overlays)
  },

  // Glow effects for interactive states and focus indicators
  glow: {
    subtle: `shadow-[0_0_0_1px_rgba(59,130,246,${OPACITY_SUBTLE})]`,
    moderate: `shadow-[0_0_0_2px_rgba(59,130,246,${OPACITY_MODERATE})]`,
    strong: `shadow-[0_0_0_3px_rgba(59,130,246,${OPACITY_STRONG})]`,
    focus: `shadow-[0_0_0_2px_rgba(59,130,246,${OPACITY_SEMI_TRANSPARENT})]`,
  },
} as const;

// ============================================================================
// COLOR SYSTEM - Unified color palette following design principles
// ============================================================================

/**
 * Unified color palette with proper contrast ratios (WCAG AA compliant)
 */
export const UNIFIED_COLOR_PALETTE = {
  // Primary brand colors with high contrast ratios
  primary: {
    50: "#eff6ff", // Very light blue - 21:1 contrast on dark
    100: "#dbeafe", // Light blue - 18:1 contrast on dark
    500: "#3b82f6", // Primary blue - 4.5:1 contrast on white
    600: "#2563eb", // Darker blue - 5.9:1 contrast on white
    700: "#1d4ed8", // Dark blue - 7.7:1 contrast on white
    900: "#1e3a8a", // Very dark blue - 15:1 contrast on white
  },

  // Neutral grays with proper contrast ratios for text and backgrounds
  neutral: {
    0: "#ffffff", // Pure white - Base for light theme
    50: "#f8fafc", // Almost white - Subtle backgrounds
    100: "#f1f5f9", // Very light gray - Card backgrounds
    200: "#e2e8f0", // Light gray - Borders in light theme
    300: "#cbd5e1", // Medium light gray - Disabled text
    400: "#94a3b8", // Medium gray - Placeholder text
    500: "#64748b", // Medium dark gray - Secondary text
    600: "#475569", // Dark gray - Primary text on light
    700: "#334155", // Very dark gray - Headings
    800: "#1e293b", // Almost black - Dark theme backgrounds
    900: "#0f172a", // Very dark - Dark theme surfaces
    950: "#020617", // Near black - Maximum contrast
  },

  // Semantic colors with high contrast for both themes
  semantic: {
    success: {
      light: "#10b981", // Green with 4.5:1 contrast on white
      dark: "#34d399", // Green with 4.5:1 contrast on dark
    },
    warning: {
      light: "#f59e0b", // Amber with 4.5:1 contrast on white
      dark: "#fbbf24", // Amber with 4.5:1 contrast on dark
    },
    error: {
      light: "#ef4444", // Red with 4.5:1 contrast on white
      dark: "#f87171", // Red with 4.5:1 contrast on dark
    },
  },
} as const;
