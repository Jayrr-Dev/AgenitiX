// ============================================================================
// NODE STYLE STORE  ▸  Registry-aware visual theming for nodes (Zustand)
// ----------------------------------------------------------------------------
// • Category-based palette with registry sync & overrides
// • Hover / select / active / error visual states
// • Public hooks:  useNodeStyleClasses / useCategoryTheme / …
// • Admin helpers: enableCategoryTheming(), applyCategoryTheme(), …
/* eslint @typescript-eslint/consistent-type-definitions: "off" */
// ============================================================================

import { useMemo } from "react";
import { create } from "zustand";
import { getNodeMetadata } from "../../node-registry/nodespec-registry";

// -----------------------------------------------------------------------------
// 1. Theme constants & helpers
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

/** Semantic token-based palette using new design system tokens. */
export const CATEGORY_THEMES: Partial<Record<string, CategoryTheme>> = {
	create: {
		background: { light: "bg-node-create", dark: "bg-node-create" },
		border: { light: "border-node-create", dark: "border-node-create" },
		text: {
			primary: { light: "text-node-create", dark: "text-node-create" },
			secondary: {
				light: "text-node-create-secondary",
				dark: "text-node-create-secondary",
			},
		},
		button: {
			border: "border-node-create",
			hover: {
				light: "hover:bg-node-create-hover",
				dark: "hover:bg-node-create-hover",
			},
		},
	},
	email: {
		background: { light: "bg-node-email", dark: "bg-node-email" },
		border: { light: "border-node-email", dark: "border-node-email" },
		text: {
			primary: { light: "text-node-email", dark: "text-node-email" },
			secondary: {
				light: "text-node-email-secondary",
				dark: "text-node-email-secondary",
			},
		},
		button: {
			border: "border-node-email",
			hover: {
				light: "hover:bg-node-email-hover",
				dark: "hover:bg-node-email-hover",
			},
		},
	},
	flow: {
		background: { light: "bg-node-flow", dark: "bg-node-flow" },
		border: { light: "border-node-flow", dark: "border-node-flow" },
		text: {
			primary: { light: "text-node-flow", dark: "text-node-flow" },
			secondary: {
				light: "text-node-flow-secondary",
				dark: "text-node-flow-secondary",
			},
		},
		button: {
			border: "border-node-flow",
			hover: {
				light: "hover:bg-node-flow-hover",
				dark: "hover:bg-node-flow-hover",
			},
		},
	},
	time: {
		background: { light: "bg-node-time", dark: "bg-node-time" },
		border: { light: "border-node-time", dark: "border-node-time" },
		text: {
			primary: { light: "text-node-time", dark: "text-node-time" },
			secondary: {
				light: "text-node-time-secondary",
				dark: "text-node-time-secondary",
			},
		},
		button: {
			border: "border-node-time",
			hover: {
				light: "hover:bg-node-time-hover",
				dark: "hover:bg-node-time-hover",
			},
		},
	},
	ai: {
		background: { light: "bg-node-ai", dark: "bg-node-ai" },
		border: { light: "border-node-ai", dark: "border-node-ai" },
		text: {
			primary: { light: "text-node-ai", dark: "text-node-ai" },
			secondary: {
				light: "text-node-ai-secondary",
				dark: "text-node-ai-secondary",
			},
		},
		button: {
			border: "border-node-ai",
			hover: {
				light: "hover:bg-node-ai-hover",
				dark: "hover:bg-node-ai-hover",
			},
		},
	},
	view: {
		background: { light: "bg-node-view", dark: "bg-node-view" },
		border: { light: "border-node-view", dark: "border-node-view" },
		text: {
			primary: { light: "text-node-view", dark: "text-node-view" },
			secondary: {
				light: "text-node-view-secondary",
				dark: "text-node-view-secondary",
			},
		},
		button: {
			border: "border-node-view",
			hover: {
				light: "hover:bg-node-view-hover",
				dark: "hover:bg-node-view-hover",
			},
		},
	},
	trigger: {
		background: { light: "bg-node-trigger", dark: "bg-node-trigger" },
		border: { light: "border-node-trigger", dark: "border-node-trigger" },
		text: {
			primary: { light: "text-node-trigger", dark: "text-node-trigger" },
			secondary: {
				light: "text-node-trigger-secondary",
				dark: "text-node-trigger-secondary",
			},
		},
		button: {
			border: "border-node-trigger",
			hover: {
				light: "hover:bg-node-trigger-hover",
				dark: "hover:bg-node-trigger-hover",
			},
		},
	},
	test: {
		background: { light: "bg-node-test", dark: "bg-node-test" },
		border: { light: "border-node-test", dark: "border-node-test" },
		text: {
			primary: { light: "text-node-test", dark: "text-node-test" },
			secondary: {
				light: "text-node-test-secondary",
				dark: "text-node-test-secondary",
			},
		},
		button: {
			border: "border-node-test",
			hover: {
				light: "hover:bg-node-test-hover",
				dark: "hover:bg-node-test-hover",
			},
		},
	},
	cycle: {
		background: { light: "bg-node-cycle", dark: "bg-node-cycle" },
		border: { light: "border-node-cycle", dark: "border-node-cycle" },
		text: {
			primary: { light: "text-node-cycle", dark: "text-node-cycle" },
			secondary: {
				light: "text-node-cycle-secondary",
				dark: "text-node-cycle-secondary",
			},
		},
		button: {
			border: "border-node-cycle",
			hover: {
				light: "hover:bg-node-cycle-hover",
				dark: "hover:bg-node-cycle-hover",
			},
		},
	},
	store: {
		background: { light: "bg-node-store", dark: "bg-node-store" },
		border: { light: "border-node-store", dark: "border-node-store" },
		text: {
			primary: { light: "text-node-store", dark: "text-node-store" },
			secondary: {
				light: "text-node-store-secondary",
				dark: "text-node-store-secondary",
			},
		},
		button: {
			border: "border-node-store",
			hover: {
				light: "hover:bg-node-store-hover",
				dark: "hover:bg-node-store-hover",
			},
		},
	},
};

// -----------------------------------------------------------------------------
// 2. Zustand state, actions & default styles
// -----------------------------------------------------------------------------

export interface NodeStyleState {
	hover: { glow: string; border?: string; scale?: string };
	selection: { glow: string; border?: string; scale?: string };
	activation: {
		glow: string;
		border?: string; // Make border optional since we now rely on component borders
		scale?: string;
		buttonTheme: { border: string; hover: string };
	};
	error: {
		glow: string;
		border?: string; // Make border optional since we now rely on component borders
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
		customOverrides: Partial<Record<string, Partial<CategoryTheme>>>;
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
	/* glow effect utilities */
	setSelectionGlow(preset: keyof typeof GLOW_PRESETS | string): void;
	setHoverGlow(preset: keyof typeof GLOW_PRESETS | string): void;
	/* category theming */
	enableCategoryTheming(): void;
	disableCategoryTheming(): void;
	updateCategoryTheme(cat: string, theme: Partial<CategoryTheme>): void;
	resetCategoryTheme(cat: string): void;
	resetAllCategoryThemes(): void;
	toggleDebugMode(): void;
}

// ============================================================================
// GLOW CONFIGURATION - Semantic token-based visual effects
// ============================================================================

/**
 * SEMANTIC GLOW EFFECTS CONFIGURATION
 *
 * Now using semantic design tokens for consistent glow effects.
 * These utilities are automatically generated from CSS custom properties
 * defined in the @theme block in globals.css.
 *
 * Benefits:
 * - Consistent with design system tokens
 * - Easy to modify via CSS variables
 * - Automatic dark/light mode support
 * - Better maintainability
 */
const GLOW_EFFECTS = {
	/** Subtle hover glow - appears on mouse hover */
	hover: "shadow-effect-glow-hover",

	/** Selection glow - faint white glow when node is selected */
	selection: "shadow-effect-glow-selection",

	/** Active state glow - green glow for active/running nodes */
	activation: "shadow-effect-glow-activation",

	/** Error state glow - red glow for nodes with errors */
	error: "shadow-effect-glow-error",
} as const;

/**
 * GLOW UTILITY FUNCTIONS
 *
 * Helper functions to create custom glow effects programmatically.
 * Use these if you need to generate glow effects dynamically.
 *
 * Note: For standard effects, prefer using semantic token utilities.
 * This function is preserved for advanced customization scenarios.
 */
export const createGlowEffect = (
	blurRadius = 8,
	spreadRadius = 2,
	color = "255,255,255",
	opacity = 0.8
): string => {
	return `shadow-[0_0_${blurRadius}px_${spreadRadius}px_rgba(${color},${opacity})]`;
};

/**
 * SEMANTIC GLOW PRESETS
 *
 * Predefined glow presets using semantic design tokens.
 * These map to CSS custom properties defined in globals.css.
 */
export const GLOW_PRESETS = {
	subtle: "shadow-effect-glow-subtle",
	normal: "shadow-effect-glow-normal",
	strong: "shadow-effect-glow-strong",
	blue: "shadow-effect-glow-blue",
	green: "shadow-effect-glow-green",
	red: "shadow-effect-glow-red",
} as const;

const DEFAULT_STYLES: NodeStyleState = {
	hover: { glow: GLOW_EFFECTS.hover },
	selection: { glow: GLOW_EFFECTS.selection },
	activation: {
		glow: GLOW_EFFECTS.activation,
		// Remove undefined border class - use only token-based borders from components
		scale: "scale-[1.02]",
		buttonTheme: {
			border: "border-green-500", // Use standard Tailwind colors instead
			hover: "hover:bg-green-500/10",
		},
	},
	error: {
		glow: GLOW_EFFECTS.error,
		// Remove undefined border class - use only token-based borders from components
		scale: "scale-[1.02]",
		buttonTheme: {
			border: "border-red-500", // Use standard Tailwind colors instead
			hover: "hover:bg-red-500/10",
		},
		textTheme: {
			primary: "text-red-500", // Use standard Tailwind colors instead
			secondary: "text-red-500/80",
			border: "border-red-500",
			focus: "focus:ring-red-500",
		},
	},
	base: { transition: "transition-all duration-200" },
	categoryTheming: {
		enabled: true,
		customOverrides: {},
		debugMode: false,
	},
};

/** Typed Zustand store (state + actions). */
export const useNodeStyleStore = create<NodeStyleState & NodeStyleActions>((set) => ({
	...DEFAULT_STYLES,

	updateHoverStyle: (s) => set((st) => ({ hover: { ...st.hover, ...s } })),
	updateSelectionStyle: (s) => set((st) => ({ selection: { ...st.selection, ...s } })),
	updateActivationStyle: (s) => set((st) => ({ activation: { ...st.activation, ...s } })),
	updateErrorStyle: (s) => set((st) => ({ error: { ...st.error, ...s } })),
	updateBaseStyle: (s) => set((st) => ({ base: { ...st.base, ...s } })),
	resetToDefaults: () => set(DEFAULT_STYLES),

	// Glow effect utilities for easy adjustment
	setSelectionGlow: (preset) => {
		const glowValue =
			preset in GLOW_PRESETS ? GLOW_PRESETS[preset as keyof typeof GLOW_PRESETS] : preset;
		set((st) => ({ selection: { ...st.selection, glow: glowValue } }));
	},
	setHoverGlow: (preset) => {
		const glowValue =
			preset in GLOW_PRESETS ? GLOW_PRESETS[preset as keyof typeof GLOW_PRESETS] : preset;
		set((st) => ({ hover: { ...st.hover, glow: glowValue } }));
	},

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
					[cat]: theme,
				},
			},
		})),
	resetCategoryTheme: (cat) =>
		set((st) => {
			const newOverrides = { ...st.categoryTheming.customOverrides };
			delete newOverrides[cat];
			return {
				categoryTheming: {
					...st.categoryTheming,
					customOverrides: newOverrides,
				},
			};
		}),
	resetAllCategoryThemes: () =>
		set((st) => ({
			categoryTheming: { ...st.categoryTheming, customOverrides: {} },
		})),

	toggleDebugMode: () =>
		set((st) => ({
			categoryTheming: {
				...st.categoryTheming,
				debugMode: !st.categoryTheming.debugMode,
			},
		})),
}));

// -----------------------------------------------------------------------------
// 3. Public hooks and helper functions
// -----------------------------------------------------------------------------

export const getNodeCategory = (nodeType?: string): string | null => {
	if (!nodeType) {
		return null;
	}
	const meta = getNodeMetadata(nodeType);
	return meta?.category ?? null;
};

export function useNodeStyleClasses(
	isSelected: boolean,
	isError: boolean,
	isActive: boolean
): string {
	const base = useNodeStyleStore((s) => s.base);
	const selection = useNodeStyleStore((s) => s.selection);
	const error = useNodeStyleStore((s) => s.error);
	const activation = useNodeStyleStore((s) => s.activation);
	const hover = useNodeStyleStore((s) => s.hover);

	return useMemo(() => {
		const classes = [base.transition, hover.glow];
		if (isSelected) {
			classes.push(selection.glow);
		}
		if (isError) {
			classes.push(error.glow);
			if (error.border) {
				classes.push(error.border); // Only add border if defined
			}
		}
		if (isActive) {
			classes.push(activation.glow);
			if (activation.border) {
				classes.push(activation.border); // Only add border if defined
			}
		}

		return classes.join(" ");
	}, [base, selection, error, activation, hover, isSelected, isError, isActive]);
}

export function useCategoryTheme(nodeType?: string): CategoryTheme | null {
	const enabled = useNodeStyleStore((s) => s.categoryTheming.enabled);
	const customOverrides = useNodeStyleStore((s) => s.categoryTheming.customOverrides);

	return useMemo(() => {
		if (!(enabled && nodeType)) {
			return null;
		}

		const category = getNodeCategory(nodeType);
		if (!category) {
			return null;
		}

		const defaultTheme = CATEGORY_THEMES[category] ?? null;
		const overrideTheme = customOverrides[category] ?? {};

		if (!defaultTheme) {
			return null;
		}

		// Deep merge overrides
		return {
			...defaultTheme,
			...overrideTheme,
			background: {
				...defaultTheme.background,
				...(overrideTheme.background ?? {}),
			},
			border: { ...defaultTheme.border, ...(overrideTheme.border ?? {}) },
			text: {
				...defaultTheme.text,
				...(overrideTheme.text ?? {}),
				primary: {
					...defaultTheme.text.primary,
					...(overrideTheme.text?.primary ?? {}),
				},
				secondary: {
					...defaultTheme.text.secondary,
					...(overrideTheme.text?.secondary ?? {}),
				},
			},
			button: { ...defaultTheme.button, ...(overrideTheme.button ?? {}) },
		};
	}, [enabled, nodeType, customOverrides]);
}

/**
 * Enhanced category theme hook that supports NodeSpec theming overrides
 * @param nodeType - The node type to get theme for
 * @param nodeSpec - Optional NodeSpec with custom theming
 * @returns CategoryTheme with custom theming applied
 */
export function useCategoryThemeWithSpec(nodeType?: string, nodeSpec?: any): CategoryTheme | null {
	const baseTheme = useCategoryTheme(nodeType);

	return useMemo(() => {
		if (!(baseTheme && nodeSpec?.theming)) {
			return baseTheme;
		}

		// Apply custom theming from NodeSpec
		const customTheming = nodeSpec.theming;

		return {
			...baseTheme,
			background: {
				...baseTheme.background,
				dark: customTheming.bgDark || baseTheme.background.dark,
			},
			border: {
				...baseTheme.border,
				dark: customTheming.borderDark || baseTheme.border.dark,
			},
			text: {
				...baseTheme.text,
				primary: {
					...baseTheme.text.primary,
					dark: customTheming.textDark || baseTheme.text.primary.dark,
				},
				secondary: {
					...baseTheme.text.secondary,
					dark: customTheming.textSecondaryDark || baseTheme.text.secondary.dark,
				},
			},
		};
	}, [baseTheme, nodeSpec?.theming]);
}
