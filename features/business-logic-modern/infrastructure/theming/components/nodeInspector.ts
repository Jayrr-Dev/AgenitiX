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
			lockInspectorDescription: "Lock Inspector - Keep current view when selecting nodes",
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
				"bg-[var(--infra-inspector-data-bg)]",
				CORE_TOKENS.effects.rounded.md,
				"border border-[var(--infra-inspector-data-border)]",
				"p-3 overflow-x-auto w-full"
			),
			fixed: combineTokens(
				"bg-[var(--infra-inspector-data-bg)]",
				CORE_TOKENS.effects.rounded.md,
				"border border-[var(--infra-inspector-data-border)]",
				"p-3 overflow-y-auto overflow-x-auto flex-1 min-w-0 w-full"
			),
			compact: combineTokens(
				"bg-[var(--infra-inspector-data-bg)]",
				CORE_TOKENS.effects.rounded.md,
				"border border-[var(--infra-inspector-data-border)]",
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
		centerContent: combineTokens(CORE_TOKENS.layout.itemsCenter, CORE_TOKENS.layout.justifyCenter),

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

	// COLORS - NodeInspector-specific color mappings (uses generated CSS variables)
	colors: {
		inspector: {
			background: "bg-[var(--infra-inspector-bg)]",
			text: "text-[var(--infra-inspector-text)]",
			textSecondary: "text-[var(--infra-inspector-text-secondary)]",
			border: "border-[var(--infra-inspector-border)]",
			borderHover: "hover:border-[var(--infra-inspector-border-hover)]",
		},
		header: {
			background: "bg-[var(--infra-inspector-header-bg)]",
			text: "text-[var(--infra-inspector-header-text)]",
			textSecondary: "text-[var(--infra-inspector-header-text-secondary)]",
			border: "border-[var(--infra-inspector-header-border)]",
		},
		data: {
			background: "bg-[var(--infra-inspector-data-bg)]",
			text: "text-[var(--infra-inspector-data-text)]",
			border: "border-[var(--infra-inspector-data-border)]",
		},
		actions: {
			duplicate: {
				background: "bg-[var(--infra-inspector-actions-duplicate-bg)]",
				backgroundHover: "hover:bg-[var(--infra-inspector-actions-duplicate-bg-hover)]",
				text: "text-[var(--infra-inspector-actions-duplicate-text)]",
				border: "border-[var(--infra-inspector-actions-duplicate-border)]",
			},
			delete: {
				background: "bg-[var(--infra-inspector-actions-delete-bg)]",
				backgroundHover: "hover:bg-[var(--infra-inspector-actions-delete-bg-hover)]",
				text: "text-[var(--infra-inspector-actions-delete-text)]",
				border: "border-[var(--infra-inspector-actions-delete-border)]",
			},
			lock: {
				background: "bg-[var(--infra-inspector-actions-lock-bg)]",
				backgroundHover: "hover:bg-[var(--infra-inspector-actions-lock-bg-hover)]",
				text: "text-[var(--infra-inspector-actions-lock-text)]",
				textHover: "hover:text-[var(--infra-inspector-states-locked-text)]",
				border: "border-[var(--infra-inspector-actions-lock-border)]",
				borderHover: "hover:border-[var(--infra-inspector-button-border-hover)]",
			},
		},
		states: {
			locked: {
				textHover: "hover:text-[var(--infra-inspector-states-locked-text-hover)]",
				borderHover: "hover:border-[var(--infra-inspector-states-locked-border-hover)]",
			},
			magnifyingGlass: {
				textHover: "hover:text-[var(--infra-inspector-text-secondary-hover)]",
				borderHover: "hover:border-[var(--infra-inspector-button-border-hover)]",
			},
		},
	},
} as const;

// =====================================================================
// NODE INSPECTOR STYLES - Pre-built style utilities
// =====================================================================

/** Pre-built style utilities for the NodeInspector component */
export const nodeInspectorStyles = {
	getContainer: () => {
		return combineTokens(
			NODE_INSPECTOR_TOKENS.colors.inspector.background,
			"border",
			NODE_INSPECTOR_TOKENS.colors.inspector.border
		);
	},
	getHeader: () => {
		return combineTokens(
			NODE_INSPECTOR_TOKENS.layout.header,
			"pb-2 border-b",
			NODE_INSPECTOR_TOKENS.colors.header.border
		);
	},
	getJsonContainer: (isAdaptive: boolean) => {
		const variant = isAdaptive ? "adaptive" : "fixed";
		return NODE_INSPECTOR_TOKENS.variants.jsonContainer[variant];
	},
	getJsonData: (isAdaptive: boolean) => {
		const variant = isAdaptive ? "adaptive" : "fixed";
		return NODE_INSPECTOR_TOKENS.variants.jsonData[variant];
	},
	getActionButtons: () => {
		return combineTokens(NODE_INSPECTOR_TOKENS.layout.actionButtons, "justify-end");
	},
	getDuplicateButton: () => {
		return combineTokens(
			NODE_INSPECTOR_TOKENS.layout.flexRow,
			"items-center gap-1",
			NODE_INSPECTOR_TOKENS.spacing.buttonPadding,
			NODE_INSPECTOR_TOKENS.typography.buttonText,
			NODE_INSPECTOR_TOKENS.colors.actions.duplicate.background,
			"border",
			NODE_INSPECTOR_TOKENS.colors.actions.duplicate.border,
			NODE_INSPECTOR_TOKENS.colors.actions.duplicate.text,
			NODE_INSPECTOR_TOKENS.effects.rounded.default,
			NODE_INSPECTOR_TOKENS.colors.actions.duplicate.backgroundHover,
			NODE_INSPECTOR_TOKENS.effects.transition
		);
	},
	getDeleteButton: () => {
		return combineTokens(
			NODE_INSPECTOR_TOKENS.layout.flexRow,
			"items-center gap-1",
			NODE_INSPECTOR_TOKENS.spacing.buttonPadding,
			NODE_INSPECTOR_TOKENS.typography.buttonText,
			NODE_INSPECTOR_TOKENS.colors.actions.delete.background,
			"border",
			NODE_INSPECTOR_TOKENS.colors.actions.delete.border,
			NODE_INSPECTOR_TOKENS.colors.actions.delete.text,
			NODE_INSPECTOR_TOKENS.effects.rounded.default,
			NODE_INSPECTOR_TOKENS.colors.actions.delete.backgroundHover,
			NODE_INSPECTOR_TOKENS.effects.transition
		);
	},
};

// =====================================================================
// NODE INSPECTOR UTILITIES - Component-specific helper functions
// =====================================================================

/** Get NodeInspector variant with fallback */
export const getNodeInspectorVariant = (
	category: keyof typeof NODE_INSPECTOR_TOKENS.variants,
	variant: string,
	fallback?: string
): string => {
	const variants = NODE_INSPECTOR_TOKENS.variants[category] as Record<string, string>;
	return variants[variant] || fallback || "";
};

/** Get conditional NodeInspector variant */
export const getConditionalNodeInspectorVariant = (
	category: keyof typeof NODE_INSPECTOR_TOKENS.variants,
	condition: boolean,
	trueVariant: string,
	falseVariant: string
): string => {
	return getNodeInspectorVariant(category, condition ? trueVariant : falseVariant);
};

// =====================================================================
// TYPE DEFINITIONS - For TypeScript safety
// =====================================================================

export type NodeInspectorVariant<T extends keyof typeof NODE_INSPECTOR_TOKENS.variants> =
	keyof (typeof NODE_INSPECTOR_TOKENS.variants)[T];

export type NodeInspectorContent = typeof NODE_INSPECTOR_TOKENS.content;
