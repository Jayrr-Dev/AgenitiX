import { CORE_TOKENS } from "../core/tokens";

const UNIFIED_COLOR_PALETTE = CORE_TOKENS.palette;

/**
 * COLOR DEBUG UTILITIES - Color debugging and development tools
 *
 * • Color information extraction and debugging
 * • CSS variable color reference mappings
 * • Development console helpers
 * • Component theme debugging functions
 *
 * Keywords: color-debugging, css-variables, development-tools
 */

// ============================================================================
// CSS VARIABLE COLOR REFERENCE
// ============================================================================

/**
 * CSS VARIABLE COLOR REFERENCE - What colors actually look like
 *
 * This reference maps shadcn CSS variables to actual color values and descriptions
 * to help developers understand what colors they're working with.
 *
 * @deprecated This is a legacy static reference. The system is moving towards
 *             dynamically generating this from the UNIFIED_COLOR_PALETTE.
 */
export const CSS_VARIABLE_COLOR_REFERENCE = {
	light: {
		backgrounds: {
			"bg-background": {
				hex: UNIFIED_COLOR_PALETTE.neutral[0],
				name: "Pure White",
				usage: "Main app background",
			},
			"bg-card": {
				hex: UNIFIED_COLOR_PALETTE.neutral[0],
				name: "Pure White",
				usage: "Card/panel backgrounds",
			},
			"bg-muted": {
				hex: UNIFIED_COLOR_PALETTE.neutral[100],
				name: "Very Light Gray",
				usage: "Subtle backgrounds",
			},
			"bg-accent": {
				hex: UNIFIED_COLOR_PALETTE.neutral[100],
				name: "Very Light Gray",
				usage: "Accent backgrounds",
			},
			"bg-primary": {
				hex: UNIFIED_COLOR_PALETTE.neutral[900],
				name: "Very Dark Blue",
				usage: "Primary buttons",
			},
			"bg-secondary": {
				hex: UNIFIED_COLOR_PALETTE.neutral[100],
				name: "Very Light Gray",
				usage: "Secondary buttons",
			},
		},
		text: {
			"text-foreground": {
				hex: UNIFIED_COLOR_PALETTE.neutral[900],
				name: "Very Dark Blue",
				usage: "Primary text",
			},
			"text-card-foreground": {
				hex: UNIFIED_COLOR_PALETTE.neutral[900],
				name: "Very Dark Blue",
				usage: "Card text",
			},
			"text-muted-foreground": {
				hex: UNIFIED_COLOR_PALETTE.neutral[500],
				name: "Medium Gray",
				usage: "Secondary text",
			},
			"text-primary-foreground": {
				hex: UNIFIED_COLOR_PALETTE.neutral[50],
				name: "Almost White",
				usage: "Text on primary",
			},
			"text-secondary-foreground": {
				hex: UNIFIED_COLOR_PALETTE.neutral[900],
				name: "Very Dark Blue",
				usage: "Text on secondary",
			},
		},
		borders: {
			"border-border": {
				hex: UNIFIED_COLOR_PALETTE.neutral[200],
				name: "Light Gray",
				usage: "Default borders",
			},
			"border-accent": {
				hex: UNIFIED_COLOR_PALETTE.neutral[200],
				name: "Light Gray",
				usage: "Accent borders",
			},
			"border-primary": {
				hex: UNIFIED_COLOR_PALETTE.neutral[900],
				name: "Very Dark Blue",
				usage: "Primary borders",
			},
		},
	},
	dark: {
		backgrounds: {
			"bg-background": {
				hex: UNIFIED_COLOR_PALETTE.neutral[900],
				name: "Very Dark Blue",
				usage: "Main app background",
			},
			"bg-card": {
				hex: UNIFIED_COLOR_PALETTE.neutral[800],
				name: "Dark Gray-Blue",
				usage: "Card/panel backgrounds",
			},
			"bg-muted": {
				hex: UNIFIED_COLOR_PALETTE.neutral[800],
				name: "Dark Gray-Blue",
				usage: "Subtle backgrounds",
			},
			"bg-accent": {
				hex: UNIFIED_COLOR_PALETTE.neutral[800],
				name: "Dark Gray-Blue",
				usage: "Accent backgrounds",
			},
			"bg-primary": {
				hex: UNIFIED_COLOR_PALETTE.neutral[50],
				name: "Almost White",
				usage: "Primary buttons",
			},
			"bg-secondary": {
				hex: UNIFIED_COLOR_PALETTE.neutral[800],
				name: "Dark Gray-Blue",
				usage: "Secondary buttons",
			},
		},
		text: {
			"text-foreground": {
				hex: UNIFIED_COLOR_PALETTE.neutral[50],
				name: "Almost White",
				usage: "Primary text",
			},
			"text-card-foreground": {
				hex: UNIFIED_COLOR_PALETTE.neutral[50],
				name: "Almost White",
				usage: "Card text",
			},
			"text-muted-foreground": {
				hex: UNIFIED_COLOR_PALETTE.neutral[400],
				name: "Medium Gray",
				usage: "Secondary text",
			},
			"text-primary-foreground": {
				hex: UNIFIED_COLOR_PALETTE.neutral[900],
				name: "Very Dark Blue",
				usage: "Text on primary",
			},
			"text-secondary-foreground": {
				hex: UNIFIED_COLOR_PALETTE.neutral[50],
				name: "Almost White",
				usage: "Text on secondary",
			},
		},
		borders: {
			"border-border": {
				hex: UNIFIED_COLOR_PALETTE.neutral[700],
				name: "Dark Gray",
				usage: "Default borders",
			},
			"border-accent": {
				hex: UNIFIED_COLOR_PALETTE.neutral[700],
				name: "Dark Gray",
				usage: "Accent borders",
			},
			"border-primary": {
				hex: UNIFIED_COLOR_PALETTE.neutral[50],
				name: "Almost White",
				usage: "Primary borders",
			},
		},
	},
} as const;

// ============================================================================
// COLOR UTILITY FUNCTIONS
// ============================================================================

/**
 * Get color information for a specific CSS variable
 *
 * Returns detailed information about what a CSS variable actually looks like
 * in both light and dark themes, including hex codes, color names, and usage.
 */
export function getColorInfo(cssVariable: string, theme: "light" | "dark") {
	const themeColors = CSS_VARIABLE_COLOR_REFERENCE[theme];

	// Search through all color categories (backgrounds, text, borders)
	for (const category of Object.values(themeColors)) {
		if (cssVariable in category) {
			return category[cssVariable as keyof typeof category];
		}
	}

	return null;
}

/**
 * Debug all colors used in a specific component theme
 *
 * Logs detailed color information for all CSS variables used in a component's
 * theme configuration. Shows actual hex codes, color names, and usage for
 * both light and dark themes.
 */
export function debugComponentColors(componentName: string, theme: "light" | "dark") {
	const themeName = theme.charAt(0).toUpperCase() + theme.slice(1);

	console.group(`🎨 ${componentName.toUpperCase()} COLORS (${themeName} Theme):`);

	// Helper function to extract and log color info from CSS classes
	const _logColorInfo = (_label: string, cssClasses: string) => {
		// Extract CSS variables from classes (e.g., "bg-background" from "bg-background border border-border")
		const colorMatches = cssClasses.match(/(?:bg-|text-|border-)[\w-]+/g) || [];
		const uniqueColors = Array.from(new Set(colorMatches));

		uniqueColors.forEach((cssVar) => {
			const colorInfo = getColorInfo(cssVar, theme);
			if (colorInfo) {
			}
		});
	};
	console.groupEnd();
}

// ============================================================================
// GLOBAL CONSOLE FUNCTIONS
// ============================================================================

// Global console functions for easy debugging (development only)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
	// Make color debugging functions available globally in development
	(globalThis as any).getColorInfo = getColorInfo;
	(globalThis as any).debugComponentColors = debugComponentColors;
	(globalThis as any).showColorDebugger = () => {};
	(globalThis as any).debugColors = (component?: string) => {
		if (component) {
			debugComponentColors(component, "light");
			debugComponentColors(component, "dark");
		} else {
			const components = [
				"actionToolbar",
				"historyPanel",
				"sidePanel",
				"sidebarIcons",
				"variantSelector",
				"nodeInspector",
				"miniMap",
			];
			components.forEach((_name) => {});
		}
	};
}
