/**
 * NODE INSPECTOR DESIGN TOKENS - Component-specific styling configuration
 *
 * • Extends core tokens with NodeInspector-specific styling
 * • Contains only NodeInspector-related design decisions
 * • Keeps component styling isolated and maintainable
 * • Uses core tokens as foundation for consistency
 * • Easy to modify without affecting other components
 *
 * Keywords: node-inspector, component-specific, isolated-styling, extends-core
 */

import { CORE_TOKENS, combineTokens } from "../core/tokens";

// =====================================================================
// NODE INSPECTOR SPECIFIC TOKENS - Only what this component needs
// =====================================================================

/** NodeInspector-specific design configuration */
export const NODE_INSPECTOR_TOKENS = {
  // CONTENT - All text strings for this component
  content: {
    labels: {
      nodeData: "Node Data:",
      output: "Output:",
      controls: "Controls:",
      type: "Type:",
      id: "ID:",
    },
    tooltips: {
      unlockInspector: "Unlock Inspector (Alt+A)",
      lockInspector: "Lock Inspector (Alt+A)",
      lockInspectorDescription:
        "Lock Inspector - Keep current view when selecting nodes",
      duplicateNode: "Duplicate Node (Alt+W)",
      deleteNode: "Delete Node (Alt+Q)",
    },
    aria: {
      unlockInspector: "Unlock Inspector",
      lockInspector: "Lock Inspector",
    },
    ids: {
      nodeInfoContainer: "node-info-container",
      edgeInfoContainer: "edge-info-container",
    },
  },

  // BEHAVIOR - Component-specific behavior flags
  behavior: {
    jsonAdaptiveHeight: true,
  },

  // VARIANTS - NodeInspector-specific styling variants
  variants: {
    jsonContainer: {
      adaptive: combineTokens(CORE_TOKENS.layout.flexCol, "w-full"),
      fixed: combineTokens(CORE_TOKENS.layout.flexCol, "flex-1 min-w-0 w-full"),
      compact: combineTokens(CORE_TOKENS.layout.flexCol, "w-full max-h-48"),
    },
    jsonData: {
      adaptive: combineTokens(
        "bg-infra-inspector-data",
        CORE_TOKENS.effects.rounded.md,
        "border border-infra-inspector-data",
        "p-3 overflow-x-auto w-full"
      ),
      fixed: combineTokens(
        "bg-infra-inspector-data",
        CORE_TOKENS.effects.rounded.md,
        "border border-infra-inspector-data",
        "p-3 overflow-y-auto overflow-x-auto flex-1 min-w-0 w-full"
      ),
      compact: combineTokens(
        "bg-infra-inspector-data",
        CORE_TOKENS.effects.rounded.md,
        "border border-infra-inspector-data",
        "p-2 overflow-y-auto overflow-x-auto max-h-48 w-full"
      ),
    },
  },

  // LAYOUT - NodeInspector-specific layout patterns
  layout: {
    /* Base layout primitives pulled from CORE_TOKENS so consumers can
       reference them via NODE_INSPECTOR_TOKENS.layout.<token>.           */
    flexRow: CORE_TOKENS.layout.flexRow,
    flexColumn: CORE_TOKENS.layout.flexCol,
    flex: CORE_TOKENS.layout.flex ?? "flex",
    itemsCenter: CORE_TOKENS.layout.itemsCenter,
    justifyBetween: CORE_TOKENS.layout.justifyBetween,
    justifyCenter: CORE_TOKENS.layout.justifyCenter,
    justifyEnd: "justify-end",
    /** Center content both horizontally & vertically */
    centerContent: combineTokens(
      CORE_TOKENS.layout.itemsCenter,
      CORE_TOKENS.layout.justifyCenter
    ),

    // Component-level layout shortcuts ---------------------------------
    container: combineTokens(CORE_TOKENS.layout.flexCol, "gap-3 p-4"),
    header: combineTokens(
      CORE_TOKENS.layout.flexRow,
      CORE_TOKENS.layout.itemsCenter,
      CORE_TOKENS.layout.justifyBetween
    ),
    stateContainer: combineTokens(
      CORE_TOKENS.layout.flex,
      CORE_TOKENS.layout.itemsCenter,
      CORE_TOKENS.layout.justifyCenter,
      "w-12 h-12"
    ),
    actionButtons: combineTokens(CORE_TOKENS.layout.flexRow, "gap-2"),
  },

  // SPACING -----------------------------------------------------------
  spacing: {
    containerPadding: "p-4",
    sectionGap: "gap-3",
    buttonGap: "gap-2",
    iconTextGap: "gap-3",
    headerPadding: "pb-2",
    descriptionPadding: "p-2",
    jsonPadding: "p-3",
    buttonPadding: "px-2 py-1",
    statePadding: "p-2",
  },

  // DIMENSIONS --------------------------------------------------------
  dimensions: {
    stateContainer: "w-12 h-12",
    rightColumnMinWidth: "min-w-[100px]",
    flexBasis: "flex-1",
    flexNone: "",
    minWidth: "min-w-0",
    fullWidth: "w-full",
  },

  // TYPOGRAPHY --------------------------------------------------------
  typography: {
    nodeIcon: "text-xl",
    nodeName: "text-sm font-semibold",
    metadata: "text-xs",
    description: "text-xs",
    sectionHeader: "text-xs font-medium",
    buttonText: "text-xs",
  },

  // EFFECTS -----------------------------------------------------------
  effects: {
    rounded: {
      default: "rounded",
      full: "rounded-full",
      md: "rounded-md",
    },
    // Back-compat flattened keys used by legacy NodeInspector
    roundedFull: "rounded-full",
    roundedMd: "rounded-md",
    borderBottom: "border-b",
    border: "border",
    borderTransparent: "border-transparent",
    transition: "transition-colors",
    overflow: "overflow-y-auto overflow-x-auto",
    overflowAdaptive: "overflow-x-auto",
  },

  // ICON SIZES --------------------------------------------------------
  icons: {
    small: "w-3 h-3",
    medium: "w-4 h-4",
    large: "w-5 h-5",
    xlarge: "w-6 h-6",
  },

  // COLORS - NodeInspector-specific color mappings (uses your infra CSS system)
  colors: {
    inspector: {
      background: "bg-infra-inspector-lock",
      text: "text-infra-inspector-lock",
      textSecondary: "text-infra-inspector-secondary",
      border: "border-infra-inspector-lock",
      borderHover: "border-infra-inspector-button-hover",
    },
    header: {
      background: "bg-infra-inspector-header",
      text: "text-infra-inspector-header",
      textSecondary: "text-infra-inspector-header-secondary",
      border: "border-infra-inspector-header",
    },
    data: {
      background: "bg-infra-inspector-data",
      text: "text-infra-inspector-data",
      border: "border-infra-inspector-data",
    },
    actions: {
      duplicate: {
        background: "bg-infra-inspector-duplicate",
        backgroundHover: "hover:bg-infra-inspector-duplicate-hover",
        text: "text-infra-inspector-duplicate",
        border: "border-infra-inspector-duplicate",
      },
      delete: {
        background: "bg-infra-inspector-delete",
        backgroundHover: "hover:bg-infra-inspector-delete-hover",
        text: "text-infra-inspector-delete",
        border: "border-infra-inspector-delete",
      },
      lock: {
        background: "bg-infra-inspector-lock",
        backgroundHover: "hover:bg-infra-inspector-lock-hover",
        text: "text-infra-inspector-lock",
        textHover: "hover:text-infra-inspector-locked",
        border: "border-infra-inspector-lock",
        borderHover: "hover:border-infra-inspector-button-hover",
      },
    },
    states: {
      locked: {
        textHover: "hover:text-infra-inspector-locked",
        borderHover: "hover:border-infra-inspector-locked",
      },
      magnifyingGlass: {
        textHover: "hover:text-infra-inspector-secondary-hover",
        borderHover: "hover:border-infra-inspector-button-hover",
      },
    },
  },
} as const;

// =====================================================================
// NODE INSPECTOR UTILITIES - Component-specific helper functions
// =====================================================================

/** Get NodeInspector variant with fallback */
export const getNodeInspectorVariant = (
  category: keyof typeof NODE_INSPECTOR_TOKENS.variants,
  variant: string,
  fallback?: string
): string => {
  const variants = NODE_INSPECTOR_TOKENS.variants[category] as Record<
    string,
    string
  >;
  return variants[variant] || fallback || "";
};

/** Get conditional NodeInspector variant */
export const getConditionalNodeInspectorVariant = (
  category: keyof typeof NODE_INSPECTOR_TOKENS.variants,
  condition: boolean,
  trueVariant: string,
  falseVariant: string
): string => {
  return getNodeInspectorVariant(
    category,
    condition ? trueVariant : falseVariant
  );
};

/** NodeInspector-specific styling utilities */
export const nodeInspectorStyles = {
  // JSON container styling
  getJsonContainer: (adaptive: boolean = true) =>
    getConditionalNodeInspectorVariant(
      "jsonContainer",
      adaptive,
      "adaptive",
      "fixed"
    ),

  getJsonData: (adaptive: boolean = true) =>
    getConditionalNodeInspectorVariant(
      "jsonData",
      adaptive,
      "adaptive",
      "fixed"
    ),

  // Layout utilities
  getContainer: () => NODE_INSPECTOR_TOKENS.layout.container,
  getHeader: () => NODE_INSPECTOR_TOKENS.layout.header,
  getStateContainer: () => NODE_INSPECTOR_TOKENS.layout.stateContainer,
  getActionButtons: () => NODE_INSPECTOR_TOKENS.layout.actionButtons,

  // Color utilities
  getInspectorBackground: () =>
    NODE_INSPECTOR_TOKENS.colors.inspector.background,
  getHeaderText: () => NODE_INSPECTOR_TOKENS.colors.header.text,
  getDataBackground: () => NODE_INSPECTOR_TOKENS.colors.data.background,

  // Action button styling
  getDuplicateButton: () =>
    combineTokens(
      NODE_INSPECTOR_TOKENS.colors.actions.duplicate.background,
      NODE_INSPECTOR_TOKENS.colors.actions.duplicate.backgroundHover,
      NODE_INSPECTOR_TOKENS.colors.actions.duplicate.text,
      NODE_INSPECTOR_TOKENS.colors.actions.duplicate.border,
      CORE_TOKENS.dimensions.button.md,
      CORE_TOKENS.effects.rounded.md,
      CORE_TOKENS.effects.transition
    ),

  getDeleteButton: () =>
    combineTokens(
      NODE_INSPECTOR_TOKENS.colors.actions.delete.background,
      NODE_INSPECTOR_TOKENS.colors.actions.delete.backgroundHover,
      NODE_INSPECTOR_TOKENS.colors.actions.delete.text,
      NODE_INSPECTOR_TOKENS.colors.actions.delete.border,
      CORE_TOKENS.dimensions.button.md,
      CORE_TOKENS.effects.rounded.md,
      CORE_TOKENS.effects.transition
    ),
};

// =====================================================================
// TYPE DEFINITIONS - For TypeScript safety
// =====================================================================

export type NodeInspectorVariant<
  T extends keyof typeof NODE_INSPECTOR_TOKENS.variants,
> = keyof (typeof NODE_INSPECTOR_TOKENS.variants)[T];

export type NodeInspectorContent = typeof NODE_INSPECTOR_TOKENS.content;
