/**
 * SIDEBAR DESIGN TOKENS - Component-specific styling configuration
 *
 * • Extends core tokens with Sidebar-specific styling
 * • Contains only Sidebar-related design decisions
 * • Keeps component styling isolated and maintainable
 * • Uses core tokens as foundation for consistency
 * • Easy to modify without affecting other components
 *
 * Keywords: sidebar, component-specific, isolated-styling, extends-core
 */

import { CORE_TOKENS, combineTokens } from "../core/tokens";

// =====================================================================
// SIDEBAR SPECIFIC TOKENS - Only what this component needs
// =====================================================================

/** Sidebar-specific design configuration */
export const SIDEBAR_TOKENS = {
  // CONTENT - All text strings for this component
  content: {
    labels: {
      nodes: "Nodes",
      tools: "Tools",
      settings: "Settings",
      help: "Help",
    },
    tooltips: {
      addNode: "Add Node (Ctrl+N)",
      toggleSidebar: "Toggle Sidebar (Ctrl+B)",
      nodeLibrary: "Node Library",
    },
    aria: {
      sidebar: "Main Sidebar",
      nodeList: "Available Nodes",
      toolList: "Available Tools",
    },
  },

  // BEHAVIOR - Component-specific behavior flags
  behavior: {
    collapsible: true,
    autoHide: false,
    defaultWidth: "280px",
    minWidth: "240px",
    maxWidth: "400px",
  },

  // VARIANTS - Sidebar-specific styling variants
  variants: {
    container: {
      expanded: combineTokens(CORE_TOKENS.layout.flexCol, "w-70 border-r"),
      collapsed: combineTokens(CORE_TOKENS.layout.flexCol, "w-12 border-r"),
      floating: combineTokens(
        CORE_TOKENS.layout.flexCol,
        "w-70 absolute left-0 top-0 h-full",
        CORE_TOKENS.effects.shadow.lg
      ),
    },
    section: {
      default: combineTokens(CORE_TOKENS.layout.flexCol, "gap-2 p-3"),
      compact: combineTokens(CORE_TOKENS.layout.flexCol, "gap-1 p-2"),
      spacious: combineTokens(CORE_TOKENS.layout.flexCol, "gap-4 p-4"),
    },
    item: {
      default: combineTokens(
        CORE_TOKENS.layout.flexRow,
        CORE_TOKENS.layout.itemsCenter,
        "gap-3 p-2",
        CORE_TOKENS.effects.rounded.md
      ),
      compact: combineTokens(
        CORE_TOKENS.layout.flexRow,
        CORE_TOKENS.layout.itemsCenter,
        "gap-2 p-1",
        CORE_TOKENS.effects.rounded.sm
      ),
      large: combineTokens(
        CORE_TOKENS.layout.flexRow,
        CORE_TOKENS.layout.itemsCenter,
        "gap-4 p-3",
        CORE_TOKENS.effects.rounded.lg
      ),
    },
  },

  // LAYOUT - Sidebar-specific layout patterns
  layout: {
    container: combineTokens(
      CORE_TOKENS.layout.flexCol,
      "h-full bg-infra-sidebar border-r border-infra-sidebar"
    ),
    header: combineTokens(
      CORE_TOKENS.layout.flexRow,
      CORE_TOKENS.layout.itemsCenter,
      CORE_TOKENS.layout.justifyBetween,
      "p-4 border-b border-infra-sidebar"
    ),
    content: combineTokens(
      CORE_TOKENS.layout.flexCol,
      "flex-1 overflow-y-auto"
    ),
    footer: combineTokens(
      CORE_TOKENS.layout.flexRow,
      CORE_TOKENS.layout.itemsCenter,
      CORE_TOKENS.layout.justifyCenter,
      "p-3 border-t border-infra-sidebar"
    ),
    section: combineTokens(CORE_TOKENS.layout.flexCol, "gap-2"),
    sectionHeader: combineTokens(
      CORE_TOKENS.layout.flexRow,
      CORE_TOKENS.layout.itemsCenter,
      CORE_TOKENS.layout.justifyBetween,
      "px-3 py-2"
    ),
  },

  // COLORS - Sidebar-specific color mappings (uses your infra CSS system)
  colors: {
    container: {
      background: "bg-infra-sidebar",
      border: "border-infra-sidebar",
      text: "text-infra-sidebar",
    },
    header: {
      background: "bg-infra-sidebar",
      text: "text-infra-sidebar",
      border: "border-infra-sidebar",
    },
    item: {
      background: "bg-infra-sidebar",
      backgroundHover: "hover:bg-infra-sidebar-hover",
      backgroundActive: "bg-infra-sidebar-active",
      text: "text-infra-sidebar",
      textSecondary: "text-infra-sidebar-secondary",
      border: "border-infra-sidebar",
      borderHover: "hover:border-infra-sidebar-hover",
    },
    section: {
      header: "text-infra-sidebar-text-secondary",
      divider: "border-infra-sidebar",
    },
  },
} as const;

// =====================================================================
// SIDEBAR UTILITIES - Component-specific helper functions
// =====================================================================

/** Get Sidebar variant with fallback */
export const getSidebarVariant = (
  category: keyof typeof SIDEBAR_TOKENS.variants,
  variant: string,
  fallback?: string
): string => {
  const variants = SIDEBAR_TOKENS.variants[category] as Record<string, string>;
  return variants[variant] || fallback || "";
};

/** Get conditional Sidebar variant */
export const getConditionalSidebarVariant = (
  category: keyof typeof SIDEBAR_TOKENS.variants,
  condition: boolean,
  trueVariant: string,
  falseVariant: string
): string => {
  return getSidebarVariant(category, condition ? trueVariant : falseVariant);
};

/** Sidebar-specific styling utilities */
export const sidebarStyles = {
  // Container styling
  getContainer: (isExpanded: boolean = true) =>
    getConditionalSidebarVariant(
      "container",
      isExpanded,
      "expanded",
      "collapsed"
    ),

  getSection: (
    variant: keyof typeof SIDEBAR_TOKENS.variants.section = "default"
  ) => getSidebarVariant("section", variant),

  getItem: (variant: keyof typeof SIDEBAR_TOKENS.variants.item = "default") =>
    getSidebarVariant("item", variant),

  // Layout utilities
  getContainerLayout: () => SIDEBAR_TOKENS.layout.container,
  getHeaderLayout: () => SIDEBAR_TOKENS.layout.header,
  getContentLayout: () => SIDEBAR_TOKENS.layout.content,
  getFooterLayout: () => SIDEBAR_TOKENS.layout.footer,

  // Color utilities
  getContainerColors: () =>
    combineTokens(
      SIDEBAR_TOKENS.colors.container.background,
      SIDEBAR_TOKENS.colors.container.border,
      SIDEBAR_TOKENS.colors.container.text
    ),

  getItemColors: (isActive: boolean = false) =>
    combineTokens(
      isActive
        ? SIDEBAR_TOKENS.colors.item.backgroundActive
        : SIDEBAR_TOKENS.colors.item.background,
      SIDEBAR_TOKENS.colors.item.backgroundHover,
      SIDEBAR_TOKENS.colors.item.text,
      SIDEBAR_TOKENS.colors.item.border,
      SIDEBAR_TOKENS.colors.item.borderHover,
      CORE_TOKENS.effects.transition
    ),

  // Complete item styling
  getCompleteItem: (
    isActive: boolean = false,
    variant: keyof typeof SIDEBAR_TOKENS.variants.item = "default"
  ) =>
    combineTokens(
      getSidebarVariant("item", variant),
      isActive
        ? SIDEBAR_TOKENS.colors.item.backgroundActive
        : SIDEBAR_TOKENS.colors.item.background,
      SIDEBAR_TOKENS.colors.item.backgroundHover,
      SIDEBAR_TOKENS.colors.item.text,
      CORE_TOKENS.effects.transition
    ),
};

// =====================================================================
// TYPE DEFINITIONS - For TypeScript safety
// =====================================================================

export type SidebarVariant<T extends keyof typeof SIDEBAR_TOKENS.variants> =
  keyof (typeof SIDEBAR_TOKENS.variants)[T];

export type SidebarContent = typeof SIDEBAR_TOKENS.content;
