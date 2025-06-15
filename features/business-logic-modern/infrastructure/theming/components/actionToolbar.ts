/**
 * ACTION TOOLBAR DESIGN TOKENS - Component-level styling configuration
 *
 * • Encapsulates all non-functional styling for the ActionToolbar component
 * • Extends the core design-token system to stay consistent across the UI
 * • Central place to tweak colors / spacing without touching component logic
 *
 * Keywords: action-toolbar, design-tokens, theming, component-specific
 */

import { CORE_TOKENS, combineTokens } from "../core/tokens";

// ---------------------------------------------------------------------------
// ACTION TOOLBAR SPECIFIC TOKENS – 100 % isolated to this component
// ---------------------------------------------------------------------------

export const ACTION_TOOLBAR_TOKENS = {
  /* -----------------------------------------------------------------------
   * COPY / CONTENT – Human-readable strings & ARIA labels
   * --------------------------------------------------------------------- */
  content: {
    tooltips: {
      undo: "Undo (Ctrl+Z)",
      redo: "Redo (Ctrl+Y)",
      toggleHistory: "Toggle History Panel (Ctrl+H)",
      fullscreenEnter: "Enter Fullscreen (F11)",
      fullscreenExit: "Exit Fullscreen (F11)",
    },
    aria: {
      undo: "Undo",
      redo: "Redo",
      toggleHistory: "Toggle history panel",
      fullscreen: "Toggle fullscreen",
    },
  },

  /* -----------------------------------------------------------------------
   * VARIANTS – Atomic class bundles you can reference from the component
   * --------------------------------------------------------------------- */
  variants: {
    /* Root container variants */
    container: {
      default: combineTokens(
        CORE_TOKENS.layout.flexRow,
        "items-center gap-1 p-1"
      ),
    },

    /* Button presets aligned with useComponentButtonClasses */
    button: {
      ghost:
        "bg-infra-toolbar hover:bg-infra-toolbar-hover text-infra-toolbar-text border border-transparent",
      primary:
        "bg-infra-toolbar-active hover:bg-infra-toolbar-active-hover text-infra-toolbar-text border border-infra-toolbar-border",
    },
  },

  /* -----------------------------------------------------------------------
   * LAYOUT – Quick flex primitives for evergreen re-use
   * --------------------------------------------------------------------- */
  layout: {
    flexRow: CORE_TOKENS.layout.flexRow,
    flexCenter: combineTokens(
      CORE_TOKENS.layout.flexRow,
      CORE_TOKENS.layout.itemsCenter,
      CORE_TOKENS.layout.justifyCenter
    ),
  },

  /* -----------------------------------------------------------------------
   * SPACING – Magic numbers reduced to semantic tokens
   * --------------------------------------------------------------------- */
  spacing: {
    gapXs: "gap-0.5",
    gapSm: "gap-1",
    gapMd: "gap-2",
  },

  /* -----------------------------------------------------------------------
   * ICONS – Consistent sizes so everything aligns
   * --------------------------------------------------------------------- */
  icons: {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  },

  /* -----------------------------------------------------------------------
   * COLORS – All ActionToolbar-specific color hooks (via CSS vars)
   * --------------------------------------------------------------------- */
  colors: {
    background: "bg-infra-toolbar",
    backgroundHover: "bg-infra-toolbar-hover",
    border: "border-infra-toolbar-border",
    active: "bg-infra-toolbar-active",
    text: "text-infra-toolbar-text",
  },
} as const;

// ---------------------------------------------------------------------------
// TYPES – Expose the shape of our tokens for type-safe consumers
// ---------------------------------------------------------------------------
export type ActionToolbarTokens = typeof ACTION_TOOLBAR_TOKENS;
