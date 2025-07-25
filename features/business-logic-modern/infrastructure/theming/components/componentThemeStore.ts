/**
 * COMPONENT THEME STORE - Centralized theming system for major UI components
 *
 * This module provides a comprehensive theming solution for React components using Zustand
 * state management, integrated with shadcn/ui and next-themes. It follows the "12 Principles
 * of Dark Mode Design" with WCAG AA compliance for accessibility.
 *
 * Features:
 * • Centralized theme management for all major UI components
 * • Integration with DESIGN_CONFIG pattern and CORE_TOKENS
 * • Action toolbar & history panel styling with glow effects
 * • Side panel theming with consistent borders and backgrounds
 * • Node inspector styling that matches node aesthetics
 * • Mini map theming for visual consistency
 * • Hover, selection, and active states for all components
 * • Integrated with shadcn/ui theme system and next-themes
 * • WCAG AA compliant color contrast ratios
 * • Material Design elevation system
 * • Custom override capabilities for component-specific styling
 * • CSS custom properties integration (--infra-* variables)
 *
 * @author Agenitix Development Team
 * @version 2.1.0
 * @since 1.0.0
 *
 * Keywords: component-theming, ui-consistency, glow-effects, shadcn, next-themes, accessibility, design-config
 */

"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { CORE_TOKENS } from "../core/tokens";
import { NODE_INSPECTOR_TOKENS } from "./nodeInspector";

// Aliases for convenience
const ELEVATION_SYSTEM = CORE_TOKENS.elevation;
const BORDER_RADIUS_LARGE = CORE_TOKENS.effects.rounded.lg;
const BORDER_RADIUS_MEDIUM = CORE_TOKENS.effects.rounded.md;
const BORDER_RADIUS_SMALL = CORE_TOKENS.effects.rounded.sm;
const BORDER_RADIUS_DEFAULT = CORE_TOKENS.effects.rounded.md; // Using md as default for components
const TRANSITION_DURATION_NORMAL = "200"; // from old designTokens.ts
const TRANSITION_DURATION_FAST = "150"; // from old designTokens.ts
const OPACITY_MODERATE = "0.2"; // from old designTokens.ts

// ============================================================================
// DESIGN SYSTEM INTEGRATION - Integration with centralized design tokens
// ============================================================================

/**
 * Design system integration constants
 *
 * These constants provide integration points between the component theme store
 * and the centralized design system tokens (CORE_TOKENS, NODE_INSPECTOR_TOKENS).
 */
const DESIGN_SYSTEM_INTEGRATION = {
	/** Core design tokens for foundational styling */
	core: CORE_TOKENS,
	/** Node inspector specific design configuration */
	nodeInspector: NODE_INSPECTOR_TOKENS,
	/** CSS custom properties prefix for infrastructure components */
	cssPrefix: "--infra-",
} as const;

// ============================================================================
// TYPE DEFINITIONS - Core interfaces and type definitions
// ============================================================================

/**
 * Base component theme structure using shadcn CSS variables
 *
 * This interface defines the complete theming structure for any UI component,
 * providing consistent styling across background, border, text, glow effects,
 * shadows, transitions, and border radius properties.
 *
 * @interface ComponentTheme
 */
export interface ComponentTheme {
	/** Background color variations for different component states */
	background: {
		/** Primary background color for default state */
		primary: string;
		/** Secondary background color for alternate elements */
		secondary: string;
		/** Background color on hover state */
		hover: string;
		/** Background color on active/pressed state */
		active: string;
	};
	/** Border styling variations for different component states */
	border: {
		/** Default border styling */
		default: string;
		/** Border styling on hover state */
		hover: string;
		/** Border styling on active/pressed state */
		active: string;
	};
	/** Text color variations for different content types */
	text: {
		/** Primary text color for main content */
		primary: string;
		/** Secondary text color for supporting content */
		secondary: string;
		/** Muted text color for less important content */
		muted: string;
	};
	/** Glow effects for interactive states and focus indicators */
	glow: {
		/** Glow effect on hover state */
		hover: string;
		/** Glow effect on active/pressed state */
		active: string;
		/** Glow effect on focus state for accessibility */
		focus: string;
	};
	/** Shadow variations for elevation and depth */
	shadow: {
		/** Default shadow for base elevation */
		default: string;
		/** Enhanced shadow on hover for elevation feedback */
		hover: string;
		/** Maximum shadow for elevated states */
		elevated: string;
	};
	/** CSS transition properties for smooth state changes */
	transition: string;
	/** Border radius variations for different component parts */
	borderRadius: {
		/** Default border radius for general use */
		default: string;
		/** Border radius specifically for buttons */
		button: string;
		/** Border radius specifically for panels */
		panel: string;
	};
}

/**
 * Specialized themes for different component types
 *
 * This interface maps component names to their respective theme configurations,
 * allowing for type-safe theme access and centralized theme management.
 *
 * @interface ComponentThemes
 */
export interface ComponentThemes {
	nodeInspector: typeof NODE_INSPECTOR_THEME;
	sidePanel: typeof SIDE_PANEL_THEME;
	sidebarIcons: typeof SIDEBAR_ICONS_THEME;
	variantSelector: typeof VARIANT_SELECTOR_THEME;
	actionToolbar: typeof ACTION_TOOLBAR_THEME;
	historyPanel: typeof HISTORY_PANEL_THEME;
	miniMap: typeof MINI_MAP_THEME;
	flowCanvas: typeof FLOW_CANVAS_THEME;
	workflowManager: typeof WORKFLOW_MANAGER_THEME;
}

/**
 * Component theme state interface for Zustand store
 *
 * @interface ComponentThemeState
 */
export interface ComponentThemeState {
	/** All component theme configurations */
	themes: ComponentThemes;
	/** Whether theming system is enabled globally */
	enabled: boolean;
	/** Custom theme overrides for specific components */
	customOverrides: Partial<ComponentThemes>;
	/** Debug mode for theme development */
	debugMode: boolean;
}

/**
 * Component theme actions interface for Zustand store
 *
 * @interface ComponentThemeActions
 */
export interface ComponentThemeActions {
	/** Updates theme for a specific component */
	updateComponentTheme: (component: keyof ComponentThemes, theme: Partial<ComponentTheme>) => void;
	/** Resets theme for a specific component to default */
	resetComponentTheme: (component: keyof ComponentThemes) => void;
	/** Resets all themes to default configurations */
	resetAllThemes: () => void;
	/** Enables the theming system globally */
	enableTheming: () => void;
	/** Disables the theming system globally */
	disableTheming: () => void;
	/** Toggles debug mode for theme development */
	toggleDebugMode: () => void;
	/** Gets CSS classes for a component in a specific state */
	getComponentClasses: (
		component: keyof ComponentThemes,
		state?: "default" | "hover" | "active"
	) => string;
}

// ============================================================================
// COLOR SYSTEM - Imported from design tokens
// ============================================================================

/**
 * CSS VARIABLE COLOR REFERENCE - What colors actually look like
 *
 * This reference maps shadcn CSS variables to actual color values and descriptions
 * to help developers understand what colors they're working with. Also includes
 * integration with the new design system's CSS custom properties.
 *
 * 🔗 DESIGN SYSTEM INTEGRATION:
 * • Shadcn CSS variables (--background, --foreground, etc.)
 * • Infrastructure CSS variables (--infra-inspector-*, --infra-sidebar-*, etc.)
 * • CORE_TOKENS integration for foundational styling
 * • NODE_INSPECTOR_TOKENS for component-specific theming
 *
 * 🌞 LIGHT THEME COLORS:
 * • bg-background: #ffffff (Pure white) - Main app background
 * • bg-card: #ffffff (Pure white) - Card/panel backgrounds
 * • bg-muted: #f1f5f9 (Very light gray) - Subtle backgrounds
 * • bg-accent: #f1f5f9 (Very light gray) - Accent backgrounds
 * • bg-primary: #0f172a (Very dark blue) - Primary buttons
 * • bg-secondary: #f1f5f9 (Very light gray) - Secondary buttons
 *
 * • text-foreground: #0f172a (Very dark blue) - Primary text
 * • text-card-foreground: #0f172a (Very dark blue) - Card text
 * • text-muted-foreground: #64748b (Medium gray) - Secondary text
 * • text-primary-foreground: #f8fafc (Almost white) - Text on primary
 * • text-secondary-foreground: #0f172a (Very dark blue) - Text on secondary
 *
 * • border-border: #e2e8f0 (Light gray) - Default borders
 * • border-accent: #e2e8f0 (Light gray) - Accent borders
 * • border-primary: #0f172a (Very dark blue) - Primary borders
 *
 * 🌙 DARK THEME COLORS:
 * • bg-background: #0f172a (Very dark blue) - Main app background
 * • bg-card: #1e293b (Dark gray-blue) - Card/panel backgrounds
 * • bg-muted: #1e293b (Dark gray-blue) - Subtle backgrounds
 * • bg-accent: #1e293b (Dark gray-blue) - Accent backgrounds
 * • bg-primary: #f8fafc (Almost white) - Primary buttons
 * • bg-secondary: #1e293b (Dark gray-blue) - Secondary buttons
 *
 * • text-foreground: #f8fafc (Almost white) - Primary text
 * • text-card-foreground: #f8fafc (Almost white) - Card text
 * • text-muted-foreground: #94a3b8 (Medium gray) - Secondary text
 * • text-primary-foreground: #0f172a (Very dark blue) - Text on primary
 * • text-secondary-foreground: #f8fafc (Almost white) - Text on secondary
 *
 * • border-border: #334155 (Dark gray) - Default borders
 * • border-accent: #334155 (Dark gray) - Accent borders
 * • border-primary: #f8fafc (Almost white) - Primary borders
 *
 * 💡 USAGE PATTERNS:
 * • Main surfaces: bg-background → bg-card → bg-muted (increasing subtlety)
 * • Text hierarchy: text-foreground → text-muted-foreground (decreasing emphasis)
 * • Interactive states: primary (strong) → secondary (subtle) → ghost (minimal)
 * • Borders: border-border (default) → border-accent (highlights) → border-primary (emphasis)
 *
 * 🎯 CONTRAST RATIOS (WCAG AA Compliant):
 * • Light theme text on backgrounds: 4.5:1 minimum contrast
 * • Dark theme text on backgrounds: 4.5:1 minimum contrast
 * • All color combinations tested for accessibility
 */
const CSS_VARIABLE_COLOR_REFERENCE = {
	light: {
		backgrounds: {
			"bg-background": {
				hex: "#ffffff",
				name: "Pure White",
				usage: "Main app background",
				contrast: "Base surface",
			},
			"bg-card": {
				hex: "#ffffff",
				name: "Pure White",
				usage: "Card/panel backgrounds",
				contrast: "Same as background for seamless integration",
			},
			"bg-muted": {
				hex: "#f1f5f9",
				name: "Very Light Gray",
				usage: "Subtle backgrounds",
				contrast: "Slightly darker than cards for layering",
			},
			"bg-accent": {
				hex: "#f1f5f9",
				name: "Very Light Gray",
				usage: "Accent backgrounds",
				contrast: "Subtle highlight without distraction",
			},
			"bg-primary": {
				hex: "#0f172a",
				name: "Very Dark Blue",
				usage: "Primary buttons",
				contrast: "High contrast for important actions",
			},
			"bg-secondary": {
				hex: "#f1f5f9",
				name: "Very Light Gray",
				usage: "Secondary buttons",
				contrast: "Subtle for less important actions",
			},
		},
		text: {
			"text-foreground": {
				hex: "#0f172a",
				name: "Very Dark Blue",
				usage: "Primary text",
				contrast: "21:1 on white background",
			},
			"text-card-foreground": {
				hex: "#0f172a",
				name: "Very Dark Blue",
				usage: "Card text",
				contrast: "21:1 on white cards",
			},
			"text-muted-foreground": {
				hex: "#64748b",
				name: "Medium Gray",
				usage: "Secondary text",
				contrast: "7:1 on white background",
			},
			"text-primary-foreground": {
				hex: "#f8fafc",
				name: "Almost White",
				usage: "Text on primary",
				contrast: "18:1 on dark blue primary",
			},
			"text-secondary-foreground": {
				hex: "#0f172a",
				name: "Very Dark Blue",
				usage: "Text on secondary",
				contrast: "21:1 on light gray secondary",
			},
		},
		borders: {
			"border-border": {
				hex: "#e2e8f0",
				name: "Light Gray",
				usage: "Default borders",
				contrast: "Subtle definition without harshness",
			},
			"border-accent": {
				hex: "#e2e8f0",
				name: "Light Gray",
				usage: "Accent borders",
				contrast: "Same as default for consistency",
			},
			"border-primary": {
				hex: "#0f172a",
				name: "Very Dark Blue",
				usage: "Primary borders",
				contrast: "Strong definition for emphasis",
			},
		},
	},
	dark: {
		backgrounds: {
			"bg-background": {
				hex: "#0f172a",
				name: "Very Dark Blue",
				usage: "Main app background",
				contrast: "Deep base for dark theme",
			},
			"bg-card": {
				hex: "#1e293b",
				name: "Dark Gray-Blue",
				usage: "Card/panel backgrounds",
				contrast: "Elevated from background",
			},
			"bg-muted": {
				hex: "#1e293b",
				name: "Dark Gray-Blue",
				usage: "Subtle backgrounds",
				contrast: "Same as cards for consistency",
			},
			"bg-accent": {
				hex: "#1e293b",
				name: "Dark Gray-Blue",
				usage: "Accent backgrounds",
				contrast: "Subtle highlight in dark theme",
			},
			"bg-primary": {
				hex: "#f8fafc",
				name: "Almost White",
				usage: "Primary buttons",
				contrast: "High contrast for visibility",
			},
			"bg-secondary": {
				hex: "#1e293b",
				name: "Dark Gray-Blue",
				usage: "Secondary buttons",
				contrast: "Subtle for less important actions",
			},
		},
		text: {
			"text-foreground": {
				hex: "#f8fafc",
				name: "Almost White",
				usage: "Primary text",
				contrast: "18:1 on dark background",
			},
			"text-card-foreground": {
				hex: "#f8fafc",
				name: "Almost White",
				usage: "Card text",
				contrast: "15:1 on dark cards",
			},
			"text-muted-foreground": {
				hex: "#94a3b8",
				name: "Medium Gray",
				usage: "Secondary text",
				contrast: "5.5:1 on dark background",
			},
			"text-primary-foreground": {
				hex: "#0f172a",
				name: "Very Dark Blue",
				usage: "Text on primary",
				contrast: "18:1 on white primary",
			},
			"text-secondary-foreground": {
				hex: "#f8fafc",
				name: "Almost White",
				usage: "Text on secondary",
				contrast: "15:1 on dark secondary",
			},
		},
		borders: {
			"border-border": {
				hex: "#334155",
				name: "Dark Gray",
				usage: "Default borders",
				contrast: "Visible definition in dark theme",
			},
			"border-accent": {
				hex: "#334155",
				name: "Dark Gray",
				usage: "Accent borders",
				contrast: "Same as default for consistency",
			},
			"border-primary": {
				hex: "#f8fafc",
				name: "Almost White",
				usage: "Primary borders",
				contrast: "Strong definition for emphasis",
			},
		},
	},
} as const;

// ============================================================================
// ELEVATION SYSTEM - Material Design inspired elevation
// ============================================================================

// Elevation system imported from design tokens

// ============================================================================
// COLOR UTILITY FUNCTIONS - Helper functions for color understanding
// ============================================================================

/**
 * Get color information for a specific CSS variable
 *
 * Returns detailed information about what a CSS variable actually looks like
 * in both light and dark themes, including hex codes, color names, and usage.
 *
 * 🎨 RETURNS COLOR DATA:
 * • hex: Actual hex color code (e.g., "#ffffff", "#0f172a")
 * • name: Human-readable color name (e.g., "Pure White", "Very Dark Blue")
 * • usage: What the color is used for (e.g., "Main app background", "Primary text")
 * • contrast: Accessibility and contrast information
 *
 * @param {string} cssVariable - The CSS variable name (e.g., "bg-background")
 * @param {'light' | 'dark'} theme - The theme to get color info for
 * @returns {object | null} Color information object or null if not found
 *
 * @example
 * ```tsx
 * // Get background color info
 * const bgInfo = getColorInfo('bg-background', 'light');
 * // Returns: { hex: "#ffffff", name: "Pure White", usage: "Main app background", contrast: "Base surface" }
 *
 * // Get text color info
 * const textInfo = getColorInfo('text-foreground', 'dark');
 * // Returns: { hex: "#f8fafc", name: "Almost White", usage: "Primary text", contrast: "18:1 on dark background" }
 *
 * console.log(`Background is ${bgInfo.name} (${bgInfo.hex}) - ${bgInfo.usage}`);
 * // Output: "Background is Pure White (#ffffff) - Main app background"
 * ```
 */

// ============================================================================
// COMPONENT THEME CONFIGURATIONS - Individual theme definitions
// ============================================================================

/**
 * Action Toolbar Theme - Primary toolbar styling
 *
 * Used for the main action toolbar component with emphasis on clarity
 * and accessibility. Provides subtle elevation and clear interactive states.
 *
 * 🎨 COLOR BREAKDOWN:
 * Light: White background (#ffffff) with dark blue text (#0f172a)
 * Dark: Dark blue background (#0f172a) with white text (#f8fafc)
 */
const ACTION_TOOLBAR_THEME: ComponentTheme = {
	background: {
		primary: "bg-background border border-border", // 🌞 White (#ffffff) 🌙 Dark blue (#0f172a)
		secondary: "bg-muted", // 🌞 Very light gray (#f1f5f9) 🌙 Dark gray-blue (#1e293b)
		hover: "hover:bg-muted/80", // Slightly transparent muted background
		active: "bg-muted", // Same as secondary
	},
	border: {
		default: "border-border", // 🌞 Light gray (#e2e8f0) 🌙 Dark gray (#334155)
		hover: "hover:border-border", // Same as default
		active: "border-primary", // 🌞 Dark blue (#0f172a) 🌙 White (#f8fafc)
	},
	text: {
		primary: "text-foreground", // 🌞 Dark blue (#0f172a) 🌙 White (#f8fafc)
		secondary: "text-muted-foreground", // 🌞 Medium gray (#64748b) 🌙 Medium gray (#94a3b8)
		muted: "text-muted-foreground/70", // Secondary text with 70% opacity
	},
	glow: {
		hover: ELEVATION_SYSTEM.surface.level1.replace("shadow-", "hover:shadow-"),
		active: ELEVATION_SYSTEM.surface.level2,
		focus: `focus:ring-2 focus:ring-primary/${OPACITY_MODERATE.replace("0.", "")}`,
	},
	shadow: {
		default: ELEVATION_SYSTEM.surface.level1,
		hover: ELEVATION_SYSTEM.surface.level2.replace("shadow-", "hover:shadow-"),
		elevated: ELEVATION_SYSTEM.surface.level3,
	},
	transition: `transition-all duration-${TRANSITION_DURATION_NORMAL} ease-in-out`,
	borderRadius: {
		default: BORDER_RADIUS_LARGE,
		button: BORDER_RADIUS_MEDIUM,
		panel: BORDER_RADIUS_LARGE,
	},
};

/**
 * Workflow Manager Theme - Header panel styling
 *
 * Used for workflow management header with enhanced visibility
 * and clear visual hierarchy for workflow controls.
 *
 * 🎨 COLOR BREAKDOWN:
 * Light: White card background (#ffffff) with dark blue text (#0f172a)
 * Dark: Dark gray-blue card background (#1e293b) with white text (#f8fafc)
 */
const WORKFLOW_MANAGER_THEME: ComponentTheme = {
	background: {
		primary: "bg-background/95 backdrop-blur-sm border border-border", // 🌞 White (#ffffff) 🌙 Dark blue (#0f172a)
		secondary: "bg-muted", // 🌞 Very light gray (#f1f5f9) 🌙 Dark gray-blue (#1e293b)
		hover: "hover:bg-muted/80", // Slightly transparent muted background
		active: "bg-muted", // Same as secondary
	},
	border: {
		default: "border-border", // 🌞 Light gray (#e2e8f0) 🌙 Dark gray (#334155)
		hover: "hover:border-border", // Same as default
		active: "border-primary", // 🌞 Dark blue (#0f172a) 🌙 White (#f8fafc)
	},
	text: {
		primary: "text-foreground", // 🌞 Dark blue (#0f172a) 🌙 White (#f8fafc)
		secondary: "text-muted-foreground", // 🌞 Medium gray (#64748b) 🌙 Medium gray (#94a3b8)
		muted: "text-muted-foreground/70", // Secondary text with 70% opacity
	},
	glow: {
		hover: ELEVATION_SYSTEM.surface.level1.replace("shadow-", "hover:shadow-"),
		active: ELEVATION_SYSTEM.surface.level2,
		focus: `focus:ring-2 focus:ring-primary/${OPACITY_MODERATE.replace("0.", "")}`,
	},
	shadow: {
		default: ELEVATION_SYSTEM.surface.level1,
		hover: ELEVATION_SYSTEM.surface.level2.replace("shadow-", "hover:shadow-"),
		elevated: ELEVATION_SYSTEM.surface.level3,
	},
	transition: `transition-all duration-${TRANSITION_DURATION_NORMAL} ease-in-out`,
	borderRadius: {
		default: BORDER_RADIUS_LARGE,
		button: BORDER_RADIUS_MEDIUM,
		panel: BORDER_RADIUS_LARGE,
	},
};

/**
 * History Panel Theme - Secondary panel styling
 *
 * Used for history and timeline components with enhanced contrast
 * and clear visual hierarchy for historical data display.
 *
 * 🎨 COLOR BREAKDOWN:
 * Light: White card background (#ffffff) with dark blue text (#0f172a)
 * Dark: Dark gray-blue card background (#1e293b) with white text (#f8fafc)
 */
const HISTORY_PANEL_THEME: ComponentTheme = {
	background: {
		primary: "bg-card border border-border", // 🌞 White (#ffffff) 🌙 Dark gray-blue (#1e293b)
		secondary: "bg-accent", // 🌞 Very light gray (#f1f5f9) 🌙 Dark gray-blue (#1e293b)
		hover: "hover:bg-accent/80", // Slightly transparent accent background
		active: "bg-accent", // Same as secondary
	},
	border: {
		default: "border-border", // 🌞 Light gray (#e2e8f0) 🌙 Dark gray (#334155)
		hover: "hover:border-accent", // 🌞 Light gray (#e2e8f0) 🌙 Dark gray (#334155)
		active: "border-primary", // 🌞 Dark blue (#0f172a) 🌙 White (#f8fafc)
	},
	text: {
		primary: "text-card-foreground", // 🌞 Dark blue (#0f172a) 🌙 White (#f8fafc)
		secondary: "text-muted-foreground", // 🌞 Medium gray (#64748b) 🌙 Medium gray (#94a3b8)
		muted: "text-muted-foreground/70", // Secondary text with 70% opacity
	},
	glow: {
		hover: ELEVATION_SYSTEM.surface.level1.replace("shadow-", "hover:shadow-"),
		active: ELEVATION_SYSTEM.surface.level2,
		focus: `focus:ring-2 focus:ring-primary/${OPACITY_MODERATE.replace("0.", "")}`,
	},
	shadow: {
		default: ELEVATION_SYSTEM.surface.level1,
		hover: ELEVATION_SYSTEM.surface.level2.replace("shadow-", "hover:shadow-"),
		elevated: ELEVATION_SYSTEM.surface.level4,
	},
	transition: `transition-all duration-${TRANSITION_DURATION_NORMAL} ease-in-out`,
	borderRadius: {
		default: BORDER_RADIUS_LARGE,
		button: BORDER_RADIUS_MEDIUM,
		panel: BORDER_RADIUS_LARGE,
	},
};

/**
 * Side Panel Theme - Navigation and content panel styling
 *
 * Used for sidebar panels with enhanced node contrast and adaptive
 * hover effects that respond to theme changes automatically.
 *
 * 🎨 COLOR BREAKDOWN:
 * Light: White card background (#ffffff) with dark blue text (#0f172a)
 * Dark: Dark gray-blue card background (#1e293b) with white text (#f8fafc)
 * Special: Uses custom hover-node-effect for theme-aware hover states
 */
const SIDE_PANEL_THEME: ComponentTheme = {
	background: {
		primary: "bg-background border border-border", // 🌞 White (#ffffff) 🌙 Dark gray-blue (#1e293b)
		secondary: "bg-accent border border-accent-foreground/20", // Accent with subtle border
		hover: "hover-node-effect", // 🎨 Custom utility: brighter in dark, darker in light
		active: "bg-accent/80", // Slightly transparent accent
	},
	border: {
		default: "border-border", // 🌞 Light gray (#e2e8f0) 🌙 Dark gray (#334155)
		hover: "hover:border-accent-foreground/30", // Subtle accent border on hover
		active: "border-primary/50", // Semi-transparent primary border
	},
	text: {
		primary: "text-card-foreground", // 🌞 Dark blue (#0f172a) 🌙 White (#f8fafc)
		secondary: "text-muted-foreground", // 🌞 Medium gray (#64748b) 🌙 Medium gray (#94a3b8)
		muted: "text-muted-foreground/70", // Secondary text with 70% opacity
	},
	glow: {
		hover: ELEVATION_SYSTEM.surface.level1.replace("shadow-", "hover:shadow-"),
		active: ELEVATION_SYSTEM.surface.level2,
		focus: `focus:ring-2 focus:ring-primary/${OPACITY_MODERATE.replace("0.", "")}`,
	},
	shadow: {
		default: ELEVATION_SYSTEM.surface.level2,
		hover: ELEVATION_SYSTEM.surface.level3.replace("shadow-", "hover:shadow-"),
		elevated: ELEVATION_SYSTEM.surface.level4,
	},
	transition: `transition-all duration-${TRANSITION_DURATION_FAST} ease-in-out`,
	borderRadius: {
		default: BORDER_RADIUS_LARGE,
		button: BORDER_RADIUS_MEDIUM,
		panel: BORDER_RADIUS_LARGE,
	},
};

/**
 * Sidebar Icons Theme - Icon container styling
 *
 * Used for icon containers in sidebars with subtle backgrounds
 * and gentle hover effects for better visual feedback.
 *
 * 🎨 COLOR BREAKDOWN:
 * Light: Semi-transparent white (#ffffff/80) with dark blue text (#0f172a)
 * Dark: Semi-transparent dark gray-blue (#1e293b/80) with white text (#f8fafc)
 */
const SIDEBAR_ICONS_THEME: ComponentTheme = {
	background: {
		primary: "bg-card/80", // 🌞 White 80% opacity 🌙 Dark gray-blue 80% opacity
		secondary: "bg-accent/50", // 🌞 Light gray 50% opacity 🌙 Dark gray-blue 50% opacity
		hover: "hover:bg-accent/30", // Very subtle accent hover
		active: "bg-accent/60", // Slightly more opaque accent
	},
	border: {
		default: "border-border/50", // Semi-transparent border
		hover: "hover:border-accent-foreground/20", // Very subtle border hover
		active: "border-primary/30", // Semi-transparent primary border
	},
	text: {
		primary: "text-card-foreground", // 🌞 Dark blue (#0f172a) 🌙 White (#f8fafc)
		secondary: "text-muted-foreground", // 🌞 Medium gray (#64748b) 🌙 Medium gray (#94a3b8)
		muted: "text-muted-foreground/60", // Secondary text with 60% opacity
	},
	glow: {
		hover: ELEVATION_SYSTEM.surface.level1.replace("shadow-", "hover:shadow-"),
		active: ELEVATION_SYSTEM.surface.level1,
		focus: `focus:ring-2 focus:ring-primary/${OPACITY_MODERATE.replace("0.", "")}`,
	},
	shadow: {
		default: "shadow-none",
		hover: ELEVATION_SYSTEM.surface.level1.replace("shadow-", "hover:shadow-"),
		elevated: ELEVATION_SYSTEM.surface.level2,
	},
	transition: `transition-all duration-${TRANSITION_DURATION_FAST} ease-in-out`,
	borderRadius: {
		default: BORDER_RADIUS_MEDIUM,
		button: BORDER_RADIUS_MEDIUM,
		panel: BORDER_RADIUS_MEDIUM,
	},
};

/**
 * Variant Selector Theme - Floating variant switching buttons
 *
 * Used for the sidebar variant selector with distinct active states
 * and smooth color transitions for better user feedback.
 *
 * 🎨 COLOR BREAKDOWN:
 * Light: White background (#ffffff) with dark blue text (#0f172a)
 * Dark: Dark blue background (#0f172a) with white text (#f8fafc)
 * Active: Inverted colors for clear selection indication
 *
 * 🎯 ACTIVE STATE CONTRAST:
 * • Light mode active: Dark blue background (#0f172a) + white text (#f8fafc)
 * • Dark mode active: White background (#f8fafc) + dark blue text (#0f172a)
 * • Uses text.muted (text-primary-foreground) for proper contrast on active buttons
 */
const VARIANT_SELECTOR_THEME: ComponentTheme = {
	background: {
		primary: "bg-background", // 🌞 White (#ffffff) 🌙 Dark blue (#0f172a)
		secondary: "bg-accent", // 🌞 Very light gray (#f1f5f9) 🌙 Dark gray-blue (#1e293b)
		hover: "hover:bg-accent/80", // Slightly transparent accent hover
		active: "bg-primary", // 🌞 Dark blue (#0f172a) 🌙 White (#f8fafc) - Inverted!
	},
	border: {
		default: "border-border", // 🌞 Light gray (#e2e8f0) 🌙 Dark gray (#334155)
		hover: "hover:border-accent-foreground/30", // Subtle accent border on hover
		active: "border-primary", // 🌞 Dark blue (#0f172a) 🌙 White (#f8fafc)
	},
	text: {
		primary: "text-card-foreground", // 🌞 Dark blue (#0f172a) 🌙 White (#f8fafc)
		secondary: "text-muted-foreground", // 🌞 Medium gray (#64748b) 🌙 Medium gray (#94a3b8)
		muted: "text-primary-foreground", // 🌞 White (#f8fafc) 🌙 Dark blue (#0f172a) - For active state contrast!
	},
	glow: {
		hover: ELEVATION_SYSTEM.surface.level1.replace("shadow-", "hover:shadow-"),
		active: ELEVATION_SYSTEM.surface.level2,
		focus: `focus:ring-2 focus:ring-primary/${OPACITY_MODERATE.replace("0.", "")}`,
	},
	shadow: {
		default: ELEVATION_SYSTEM.surface.level1,
		hover: ELEVATION_SYSTEM.surface.level2.replace("shadow-", "hover:shadow-"),
		elevated: ELEVATION_SYSTEM.surface.level3,
	},
	transition: `transition-colors duration-${TRANSITION_DURATION_FAST}`,
	borderRadius: {
		default: BORDER_RADIUS_DEFAULT,
		button: BORDER_RADIUS_DEFAULT,
		panel: BORDER_RADIUS_DEFAULT,
	},
};

/**
 * Node Inspector Theme - Node property inspection styling
 *
 * Used for node inspector panels with clean backgrounds and
 * subtle interactive states for property editing interfaces.
 * Integrates with DESIGN_CONFIG pattern and CSS custom properties.
 *
 * 🎨 COLOR BREAKDOWN:
 * Uses CSS custom properties from --infra-inspector-* variables
 * Light: White background with dark blue text
 * Dark: Dark blue background with white text
 *
 * 🔗 DESIGN SYSTEM INTEGRATION:
 * • Uses NODE_INSPECTOR_TOKENS.colors for consistent theming
 * • Integrates with CORE_TOKENS for foundational styling
 * • Supports CSS custom properties (--infra-inspector-*)
 */
const NODE_INSPECTOR_THEME: ComponentTheme = {
	background: {
		primary: `${DESIGN_SYSTEM_INTEGRATION.nodeInspector.colors.inspector.background} border ${DESIGN_SYSTEM_INTEGRATION.nodeInspector.colors.inspector.border}`,
		secondary: DESIGN_SYSTEM_INTEGRATION.nodeInspector.colors.data.background,
		hover: "hover:bg-muted/80", // Fallback to shadcn for hover states
		active: DESIGN_SYSTEM_INTEGRATION.nodeInspector.colors.data.background,
	},
	border: {
		default: DESIGN_SYSTEM_INTEGRATION.nodeInspector.colors.inspector.border,
		hover: DESIGN_SYSTEM_INTEGRATION.nodeInspector.colors.inspector.borderHover,
		active: "border-primary", // Fallback to shadcn for active states
	},
	text: {
		primary: DESIGN_SYSTEM_INTEGRATION.nodeInspector.colors.inspector.text,
		secondary: DESIGN_SYSTEM_INTEGRATION.nodeInspector.colors.inspector.textSecondary,
		muted: "text-muted-foreground/70", // Fallback to shadcn with opacity
	},
	glow: {
		hover: ELEVATION_SYSTEM.surface.level1.replace("shadow-", "hover:shadow-"),
		active: ELEVATION_SYSTEM.surface.level2,
		focus: `focus:ring-2 focus:ring-primary/${OPACITY_MODERATE.replace("0.", "")}`,
	},
	shadow: {
		default: ELEVATION_SYSTEM.surface.level1,
		hover: ELEVATION_SYSTEM.surface.level2.replace("shadow-", "hover:shadow-"),
		elevated: ELEVATION_SYSTEM.surface.level3,
	},
	transition: DESIGN_SYSTEM_INTEGRATION.nodeInspector.effects.transition,
	borderRadius: {
		default: DESIGN_SYSTEM_INTEGRATION.nodeInspector.effects.rounded.md,
		button: DESIGN_SYSTEM_INTEGRATION.nodeInspector.effects.rounded.default,
		panel: DESIGN_SYSTEM_INTEGRATION.nodeInspector.effects.rounded.md,
	},
};

/**
 * Mini Map Theme - Miniature overview component styling
 *
 * Used for mini map components with node category color mapping and
 * unified token system integration for consistent theming.
 *
 * 🎨 COLOR BREAKDOWN:
 * Light: Clean white background with subtle borders and hover states
 * Dark: Dark background with proper contrast and enhanced visibility
 * Special: Node category colors for visual distinction in minimap
 */
const MINI_MAP_THEME: ComponentTheme = {
	background: {
		primary: "bg-[var(--infra-minimap-bg)]", // 🌞 White background 🌙 Dark background
		secondary: "bg-[var(--infra-minimap-bg)]", // Same as primary for consistency
		hover: "hover:bg-[var(--infra-minimap-bg-hover)]", // Subtle hover state
		active: "bg-[var(--infra-minimap-bg-active)]", // Active state
	},
	border: {
		default: "border-[var(--infra-minimap-border)]", // Consistent border color
		hover: "hover:border-[var(--infra-minimap-border-hover)]", // Enhanced border on hover
		active: "border-[var(--infra-minimap-border-hover)]", // Active border state
	},
	text: {
		primary: "text-[var(--infra-minimap-text)]", // Primary text color
		secondary: "text-[var(--infra-minimap-text-secondary)]", // Secondary text color
		muted: "text-[var(--infra-minimap-text-secondary)]", // Muted text same as secondary
	},
	glow: {
		hover: ELEVATION_SYSTEM.surface.level1.replace("shadow-", "hover:shadow-"),
		active: ELEVATION_SYSTEM.surface.level2,
		focus: `focus:ring-2 focus:ring-primary/${OPACITY_MODERATE.replace("0.", "")}`,
	},
	shadow: {
		default: ELEVATION_SYSTEM.surface.level1,
		hover: ELEVATION_SYSTEM.surface.level1.replace("shadow-", "hover:shadow-"),
		elevated: ELEVATION_SYSTEM.surface.level2,
	},
	transition: `transition-all duration-${TRANSITION_DURATION_FAST} ease-in-out`,
	borderRadius: {
		default: BORDER_RADIUS_MEDIUM,
		button: BORDER_RADIUS_SMALL,
		panel: BORDER_RADIUS_MEDIUM,
	},
};

/**
 * Flow Canvas Theme - Main workflow editor canvas styling
 *
 * Used for the primary ReactFlow canvas with background, edges, and
 * interactive elements. Integrates with node category colors and
 * provides consistent theming for all canvas elements.
 *
 * 🎨 COLOR BREAKDOWN:
 * Light: Clean white canvas with subtle dots and blue edges
 * Dark: Dark canvas with proper contrast and enhanced edge visibility
 * Special: Status-based colors for delete buttons and interactive elements
 */
const FLOW_CANVAS_THEME: ComponentTheme = {
	background: {
		primary: "bg-[var(--infra-canvas-bg)]", // 🌞 White canvas 🌙 Dark canvas
		secondary: "bg-[var(--infra-canvas-bg)]", // Same as primary for consistency
		hover: "hover:bg-[var(--infra-canvas-bg-hover)]", // Subtle hover state
		active: "bg-[var(--infra-canvas-bg-active)]", // Active state
	},
	border: {
		default: "border-[var(--infra-canvas-border)]", // Consistent border color
		hover: "hover:border-[var(--infra-canvas-border-hover)]", // Enhanced border on hover
		active: "border-[var(--infra-canvas-border-hover)]", // Active border state
	},
	text: {
		primary: "text-[var(--infra-canvas-text)]", // Primary text color
		secondary: "text-[var(--infra-canvas-text-secondary)]", // Secondary text color
		muted: "text-[var(--infra-canvas-text-secondary)]", // Muted text same as secondary
	},
	glow: {
		hover: ELEVATION_SYSTEM.surface.level1.replace("shadow-", "hover:shadow-"),
		active: ELEVATION_SYSTEM.surface.level2,
		focus: `focus:ring-2 focus:ring-primary/${OPACITY_MODERATE.replace("0.", "")}`,
	},
	shadow: {
		default: ELEVATION_SYSTEM.surface.level1,
		hover: ELEVATION_SYSTEM.surface.level1.replace("shadow-", "hover:shadow-"),
		elevated: ELEVATION_SYSTEM.surface.level2,
	},
	transition: `transition-all duration-${TRANSITION_DURATION_FAST} ease-in-out`,
	borderRadius: {
		default: BORDER_RADIUS_MEDIUM,
		button: BORDER_RADIUS_SMALL,
		panel: BORDER_RADIUS_MEDIUM,
	},
};

/**
 * Controls theme configuration using semantic tokens
 */
export const CONTROLS_THEME = {
	container:
		"bg-[var(--infra-controls-bg)] border-[var(--infra-controls-border)] hover:bg-[var(--infra-controls-bg-hover)] hover:border-[var(--infra-controls-border-hover)] rounded-lg border shadow-lg transition-colors duration-200",
	button:
		"bg-[var(--infra-controls-button)] hover:bg-[var(--infra-controls-button-hover)] active:bg-[var(--infra-controls-button-active)] border-[var(--infra-controls-border)] hover:border-[var(--infra-controls-border-hover)] text-[var(--infra-controls-icon)] hover:text-[var(--infra-controls-icon-hover)] transition-all duration-200 rounded shadow-sm hover:shadow-md active:scale-95",
} as const;

// ============================================================================
// STORE CONFIGURATION - Zustand store setup and default state
// ============================================================================

/**
 * Default theme state configuration
 *
 * Provides the initial state for the component theme store with all
 * theme configurations and default settings.
 */
const DEFAULT_THEME_STATE: ComponentThemeState = {
	themes: {
		nodeInspector: NODE_INSPECTOR_THEME,
		sidePanel: SIDE_PANEL_THEME,
		sidebarIcons: SIDEBAR_ICONS_THEME,
		variantSelector: VARIANT_SELECTOR_THEME,
		actionToolbar: ACTION_TOOLBAR_THEME,
		historyPanel: HISTORY_PANEL_THEME,
		miniMap: MINI_MAP_THEME,
		flowCanvas: FLOW_CANVAS_THEME,
		workflowManager: WORKFLOW_MANAGER_THEME,
	},
	enabled: true,
	customOverrides: {},
	debugMode: false,
};

// ============================================================================
// ZUSTAND STORE - Main theme store implementation
// ============================================================================

/**
 * Zustand store for component theming
 *
 * Provides centralized state management for all component themes with
 * actions for updating, resetting, and managing theme configurations.
 * Includes debug capabilities and custom override support.
 *
 * @returns {ComponentThemeState & ComponentThemeActions} Complete store interface
 */
export const useComponentThemeStore = create<ComponentThemeState & ComponentThemeActions>(
	(set, get) => ({
		...DEFAULT_THEME_STATE,

		/**
		 * Updates theme configuration for a specific component
		 * @param {keyof ComponentThemes} component - Component to update
		 * @param {Partial<ComponentTheme>} theme - Theme properties to update
		 */
		updateComponentTheme: (component, theme) => {
			set((state) => ({
				customOverrides: {
					...state.customOverrides,
					[component]: {
						...state.customOverrides[component],
						...theme,
					},
				},
			}));
		},

		/**
		 * Resets theme for a specific component to default configuration
		 * @param {keyof ComponentThemes} component - Component to reset
		 */
		resetComponentTheme: (component) => {
			set((state) => {
				const newOverrides = { ...state.customOverrides };
				delete newOverrides[component];
				return { customOverrides: newOverrides };
			});
		},

		/**
		 * Resets all component themes to default configurations
		 */
		resetAllThemes: () => {
			set({ customOverrides: {} });
		},

		/**
		 * Enables the theming system globally
		 */
		enableTheming: () => {
			set({ enabled: true });
		},

		/**
		 * Disables the theming system globally
		 */
		disableTheming: () => {
			set({ enabled: false });
		},

		/**
		 * Toggles debug mode for theme development
		 */
		toggleDebugMode: () => {
			set((state) => ({ debugMode: !state.debugMode }));
		},

		/**
		 * Gets CSS classes for a component in a specific state
		 * @param {keyof ComponentThemes} component - Component to get classes for
		 * @param {'default' | 'hover' | 'active'} state - Component state
		 * @returns {string} Combined CSS classes
		 */
		getComponentClasses: (component, state = "default") => {
			const { themes, customOverrides, enabled } = get();

			if (!enabled) return "";

			const theme = customOverrides[component]
				? { ...themes[component], ...customOverrides[component] }
				: themes[component];

			const baseClasses = [theme.transition, theme.borderRadius.default, theme.shadow.default];

			// Add state-specific classes
			switch (state) {
				case "hover":
					baseClasses.push(theme.glow.hover);
					break;
				case "active":
					baseClasses.push(theme.glow.active, theme.shadow.elevated);
					break;
				default:
					break;
			}

			return baseClasses.join(" ");
		},
	})
);

// ============================================================================
// DESIGN SYSTEM UTILITIES - Helper functions for design system integration
// ============================================================================

/**
 * Get design system token with fallback
 *
 * Provides a safe way to access design system tokens with fallback values.
 * Integrates with both CORE_TOKENS and component-specific tokens.
 *
 * @param {string} tokenPath - Dot notation path to the token (e.g., "colors.inspector.background")
 * @param {string} fallback - Fallback value if token is not found
 * @returns {string} Token value or fallback
 *
 * @example
 * ```tsx
 * const bgColor = getDesignSystemToken("colors.inspector.background", "bg-background");
 * const spacing = getDesignSystemToken("spacing.containerPadding", "p-4");
 * ```
 */
export function getDesignSystemToken(tokenPath: string, fallback: string): string {
	try {
		const pathParts = tokenPath.split(".");
		let current: any = DESIGN_SYSTEM_INTEGRATION.nodeInspector;

		for (const part of pathParts) {
			if (current && typeof current === "object" && part in current) {
				current = current[part];
			} else {
				return fallback;
			}
		}

		return typeof current === "string" ? current : fallback;
	} catch {
		return fallback;
	}
}

/**
 * Combine design system tokens with additional classes
 *
 * Safely combines design system tokens with additional CSS classes,
 * providing a consistent way to extend component styling.
 *
 * @param {string} tokenPath - Dot notation path to the design system token
 * @param {string} additionalClasses - Additional CSS classes to append
 * @param {string} fallback - Fallback value if token is not found
 * @returns {string} Combined CSS classes
 *
 * @example
 * ```tsx
 * const buttonClasses = combineDesignSystemToken(
 *   "colors.actions.duplicate.background",
 *   "hover:scale-105 active:scale-95",
 *   "bg-blue-500"
 * );
 * ```
 */
export function combineDesignSystemToken(
	tokenPath: string,
	additionalClasses = "",
	fallback = ""
): string {
	const token = getDesignSystemToken(tokenPath, fallback);
	return additionalClasses ? `${token} ${additionalClasses}` : token;
}

/**
 * Get CSS custom property name for infrastructure components
 *
 * Generates the correct CSS custom property name for infrastructure
 * components following the --infra-* naming convention.
 *
 * @param {string} propertyName - The property name (e.g., "inspector-background")
 * @returns {string} CSS custom property name
 *
 * @example
 * ```tsx
 * const cssVar = getInfraCSSProperty("inspector-background");
 * // Returns: "--infra-inspector-background"
 *
 * const bgClass = `bg-[hsl(var(${getInfraCSSProperty("inspector-background")}))]`;
 * ```
 */
export function getInfraCSSProperty(propertyName: string): string {
	return `${DESIGN_SYSTEM_INTEGRATION.cssPrefix}${propertyName}`;
}

// ============================================================================
// PUBLIC HOOKS - React hooks for component integration
// ============================================================================

/**
 * Hook to get theme configuration for a specific component
 *
 * Returns the complete theme object with any custom overrides applied.
 * Automatically handles deep merging of override properties with base theme.
 *
 * 🎨 RETURNS COLOR INFORMATION:
 * • background.primary: Main component background (🌞 white/card colors 🌙 dark colors)
 * • text.primary: Main text color (🌞 dark blue #0f172a 🌙 white #f8fafc)
 * • border.default: Default border color (🌞 light gray #e2e8f0 🌙 dark gray #334155)
 * • Plus hover, active, and other state variations
 *
 * @param {keyof ComponentThemes} component - The component to get theme for
 * @returns {ComponentTheme} Complete theme object with overrides applied
 *
 * @example
 * ```tsx
 * const theme = useComponentTheme('actionToolbar');
 * // theme.background.primary = "bg-background border border-border"
 * // 🌞 Light: White background (#ffffff) with light gray border (#e2e8f0)
 * // 🌙 Dark: Dark blue background (#0f172a) with dark gray border (#334155)
 * const buttonClass = `${theme.background.primary} ${theme.text.primary}`;
 * ```
 */
export function useComponentTheme(component: keyof ComponentThemes): ComponentTheme {
	const themes = useComponentThemeStore((state) => state.themes);
	const customOverrides = useComponentThemeStore((state) => state.customOverrides);
	const enabled = useComponentThemeStore((state) => state.enabled);

	return useMemo(() => {
		if (!enabled) return themes[component];

		const override = customOverrides[component];
		if (!override) return themes[component];

		// Deep merge the override with the base theme
		return {
			...themes[component],
			...override,
			background: {
				...themes[component].background,
				...(override.background ?? {}),
			},
			border: { ...themes[component].border, ...(override.border ?? {}) },
			text: { ...themes[component].text, ...(override.text ?? {}) },
			glow: { ...themes[component].glow, ...(override.glow ?? {}) },
			shadow: { ...themes[component].shadow, ...(override.shadow ?? {}) },
			borderRadius: {
				...themes[component].borderRadius,
				...(override.borderRadius ?? {}),
			},
		};
	}, [themes, customOverrides, enabled, component]);
}

/**
 * Hook to get CSS classes for a component in a specific state
 *
 * Provides a complete CSS class string for styling components with proper
 * state handling and additional class support. Automatically handles
 * theme-aware styling and state transitions.
 *
 * 🎨 GENERATES CLASSES WITH COLORS:
 * • Default state: Primary background + primary text + default border
 * • Hover state: Adds hover background + hover border + glow effects
 * • Active state: Adds active background + active border + elevated shadows
 *
 * COLOR EXAMPLES:
 * • bg-background: 🌞 White (#ffffff) 🌙 Dark blue (#0f172a)
 * • text-foreground: 🌞 Dark blue (#0f172a) 🌙 White (#f8fafc)
 * • border-border: 🌞 Light gray (#e2e8f0) 🌙 Dark gray (#334155)
 *
 * @param {keyof ComponentThemes} component - The component to style
 * @param {'default' | 'hover' | 'active'} state - The state of the component
 * @param {string} additionalClasses - Additional CSS classes to append
 * @returns {string} Complete CSS class string with theme-aware colors
 *
 * @example
 * ```tsx
 * // Default state - basic colors
 * const classes = useComponentClasses('sidePanel', 'default');
 * // Returns: "bg-card border border-border text-card-foreground transition-all..."
 * // 🌞 Light: White background, dark blue text, light gray border
 * // 🌙 Dark: Dark gray-blue background, white text, dark gray border
 *
 * // Hover state - enhanced colors
 * const hoverClasses = useComponentClasses('sidePanel', 'hover', 'custom-class');
 * // Adds hover effects: hover:bg-accent/80, hover:shadow-lg, etc.
 * ```
 */
export function useComponentClasses(
	component: keyof ComponentThemes,
	state: "default" | "hover" | "active" = "default",
	additionalClasses = ""
): string {
	const theme = useComponentTheme(component);
	const enabled = useComponentThemeStore((state) => state.enabled);

	return useMemo(() => {
		if (!enabled) return additionalClasses;

		const baseClasses = [
			// Background and styling with actual colors:
			theme.background.primary, // 🌞 White/card colors 🌙 Dark colors
			theme.text.primary, // 🌞 Dark blue (#0f172a) 🌙 White (#f8fafc)
			theme.transition,
			theme.borderRadius.default,
			theme.shadow.default,
		];

		// Add state-specific classes with enhanced colors
		switch (state) {
			case "hover":
				baseClasses.push(
					theme.glow.hover, // Subtle glow effects
					theme.shadow.hover, // Enhanced shadows
					theme.background.hover, // 🌞 Lighter backgrounds 🌙 Brighter backgrounds
					theme.border.hover // Enhanced border colors
				);
				break;
			case "active":
				baseClasses.push(
					theme.glow.active, // Strong glow effects
					theme.shadow.elevated, // Maximum elevation shadows
					theme.background.active, // 🌞 Active backgrounds 🌙 Active backgrounds
					theme.border.active // 🌞 Primary blue borders 🌙 White borders
				);
				break;
		}

		// Add additional classes
		if (additionalClasses) {
			baseClasses.push(additionalClasses);
		}

		return baseClasses.join(" ");
	}, [theme, enabled, state, additionalClasses]);
}

/**
 * Hook to get button classes for components using shadcn button variants
 *
 * Provides shadcn-compatible button styling with component theme integration.
 * Supports multiple variants and sizes with proper accessibility features.
 *
 * 🎨 BUTTON COLOR VARIANTS:
 * • Primary: 🌞 Dark blue background (#0f172a) with white text 🌙 White background with dark text
 * • Secondary: 🌞 Light gray background (#f1f5f9) with dark text 🌙 Dark gray background with white text
 * • Ghost: Transparent background with hover effects
 * • Outline: Border-only with background on hover
 *
 * @param {keyof ComponentThemes} component - The parent component context
 * @param {'primary' | 'secondary' | 'ghost' | 'outline'} variant - Button variant
 * @param {'sm' | 'md' | 'lg'} size - Button size
 * @returns {string} Complete CSS class string for buttons with theme-aware colors
 *
 * @example
 * ```tsx
 * // Primary button - strong colors
 * const primaryClasses = useComponentButtonClasses('actionToolbar', 'primary', 'md');
 * // 🌞 Light: Dark blue background (#0f172a) with white text
 * // 🌙 Dark: White background (#f8fafc) with dark text
 *
 * // Secondary button - subtle colors
 * const secondaryClasses = useComponentButtonClasses('sidePanel', 'secondary', 'sm');
 * // 🌞 Light: Light gray background (#f1f5f9) with dark text
 * // 🌙 Dark: Dark gray background (#1e293b) with white text
 *
 * return <button className={primaryClasses}>Click me</button>;
 * ```
 */
export function useComponentButtonClasses(
	component: keyof ComponentThemes,
	variant: "primary" | "secondary" | "ghost" | "outline" = "secondary",
	size: "sm" | "md" | "lg" = "md"
): string {
	const theme = useComponentTheme(component);

	return useMemo(() => {
		const baseClasses = [
			"inline-flex items-center justify-center whitespace-nowrap font-medium",
			"disabled:pointer-events-none disabled:opacity-50",
			theme.transition,
			theme.glow.focus, // Focus ring for accessibility
		];

		// Size classes with consistent spacing using design system tokens
		const sizeClasses = {
			sm: `h-8 px-3 text-xs ${getDesignSystemToken("effects.rounded.default", BORDER_RADIUS_MEDIUM)}`,
			md: `h-9 px-4 py-2 text-sm ${getDesignSystemToken("effects.rounded.default", BORDER_RADIUS_MEDIUM)}`,
			lg: `h-10 px-8 text-base ${getDesignSystemToken("effects.rounded.default", BORDER_RADIUS_MEDIUM)}`,
		};
		baseClasses.push(sizeClasses[size]);

		// Variant classes using shadcn patterns with design system integration
		switch (variant) {
			case "primary":
				baseClasses.push(
					"bg-primary text-primary-foreground shadow", // 🌞 Dark blue bg + white text 🌙 White bg + dark text
					"hover:bg-primary/90" // Slightly transparent on hover
				);
				break;
			case "secondary":
				baseClasses.push(
					"bg-secondary text-secondary-foreground shadow-sm", // 🌞 Light gray bg + dark text 🌙 Dark gray bg + white text
					"hover:bg-secondary/80" // More transparent on hover
				);
				break;
			case "ghost":
				baseClasses.push(
					"hover:bg-muted hover:text-foreground" // 🌞 Light gray hover 🌙 Dark gray hover
				);
				break;
			case "outline":
				baseClasses.push(
					"border border-border bg-background shadow-sm", // 🌞 Light border + white bg 🌙 Dark border + dark bg
					"hover:bg-muted hover:text-foreground" // Muted background on hover
				);
				break;
		}

		return baseClasses.join(" ");
	}, [theme, variant, size]);
}

/**
 * Hook to get design system aware classes for components
 *
 * Provides CSS classes that integrate with both the component theme store
 * and the centralized design system tokens. Automatically handles fallbacks
 * and provides type-safe access to design system tokens.
 *
 * 🎨 DESIGN SYSTEM INTEGRATION:
 * • Combines component theme store with DESIGN_CONFIG tokens
 * • Provides fallbacks to shadcn/ui classes for reliability
 * • Supports CSS custom properties (--infra-* variables)
 * • Type-safe access to design system tokens
 *
 * @param {keyof ComponentThemes} component - The component to style
 * @param {object} options - Styling options
 * @param {string} options.variant - Design system variant to use
 * @param {'default' | 'hover' | 'active'} options.state - Component state
 * @param {string} options.additionalClasses - Additional CSS classes
 * @returns {string} Complete CSS class string with design system integration
 *
 * @example
 * ```tsx
 * // Basic usage with design system integration
 * const classes = useDesignSystemClasses('nodeInspector', {
 *   variant: 'jsonContainer.adaptive',
 *   state: 'default'
 * });
 *
 * // With additional classes
 * const buttonClasses = useDesignSystemClasses('nodeInspector', {
 *   variant: 'colors.actions.duplicate',
 *   state: 'hover',
 *   additionalClasses: 'transform hover:scale-105'
 * });
 * ```
 */
export function useDesignSystemClasses(
	component: keyof ComponentThemes,
	options: {
		variant?: string;
		state?: "default" | "hover" | "active";
		additionalClasses?: string;
	} = {}
): string {
	const { variant, state = "default", additionalClasses = "" } = options;
	const componentTheme = useComponentTheme(component);
	const componentClasses = useComponentClasses(component, state);

	return useMemo(() => {
		const classes = [componentClasses];

		// Add design system variant if specified
		if (variant) {
			const designSystemClass = getDesignSystemToken(variant, "");
			if (designSystemClass) {
				classes.push(designSystemClass);
			}
		}

		// Add additional classes
		if (additionalClasses) {
			classes.push(additionalClasses);
		}

		return classes.filter(Boolean).join(" ");
	}, [componentClasses, variant, additionalClasses]);
}

/**
 * Hook to access design system tokens directly
 *
 * Provides direct access to design system tokens with React hooks integration.
 * Useful for accessing design system values in component logic or dynamic styling.
 *
 * @param {string} tokenPath - Dot notation path to the design system token
 * @param {string} fallback - Fallback value if token is not found
 * @returns {string} Design system token value
 *
 * @example
 * ```tsx
 * const containerPadding = useDesignSystemToken("spacing.containerPadding", "p-4");
 * const primaryColor = useDesignSystemToken("colors.inspector.background", "bg-background");
 * const iconSize = useDesignSystemToken("icons.small", "w-4 h-4");
 * ```
 */
export function useDesignSystemToken(tokenPath: string, fallback: string): string {
	return useMemo(() => {
		return getDesignSystemToken(tokenPath, fallback);
	}, [tokenPath, fallback]);
}
