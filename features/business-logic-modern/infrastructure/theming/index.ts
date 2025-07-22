/**
 * DESIGN SYSTEM INDEX (refactored) – single entry for all theming exports.
 *
 * • No circular imports – import first, export afterward.
 * • Clear section separation (core, components, convenience).
 * • Legacy exports kept with @deprecated JSDoc for migration window.
 */

// ---------------------------------------------------------------------
// CORE – foundational tokens & helpers (never bloats)
// ---------------------------------------------------------------------
import { CORE_TOKENS, combineTokens, getCoreToken } from "./core/tokens";

import type {
	CoreButtonSize,
	CoreColor,
	CoreIconSize,
	CoreSpacing,
	CoreTypographySize,
	CoreTypographyWeight,
} from "./core/tokens";

export { combineTokens, CORE_TOKENS, getCoreToken };

export type {
	CoreButtonSize,
	CoreColor,
	CoreIconSize,
	CoreSpacing,
	CoreTypographySize,
	CoreTypographyWeight,
};

// ---------------------------------------------------------------------
// COMPONENTS – import & re-export individually (tree-shakeable)
// ---------------------------------------------------------------------
export {
	getConditionalNodeInspectorVariant,
	getNodeInspectorVariant,
	NODE_INSPECTOR_TOKENS,
	nodeInspectorStyles,
} from "./components/nodeInspector";

export type {
	NodeInspectorContent,
	NodeInspectorVariant,
} from "./components/nodeInspector";

export {
	getConditionalSidebarVariant,
	getSidebarVariant,
	SIDEBAR_TOKENS,
	sidebarStyles,
} from "./components/sidebar";

export type { SidebarContent, SidebarVariant } from "./components/sidebar";

// Local references for convenience objects
import {
	NODE_INSPECTOR_TOKENS as _NI_TOKENS,
	nodeInspectorStyles as _niStyles,
} from "./components/nodeInspector";

import { SIDEBAR_TOKENS as _SB_TOKENS, sidebarStyles as _sbStyles } from "./components/sidebar";

// ---------------------------------------------------------------------
// CONVENIENCE OBJECTS – aggregated but still tree-shakeable
// ---------------------------------------------------------------------
export const componentStyles = {
	nodeInspector: _niStyles,
	sidebar: _sbStyles,
	// Add more component style objects here
} as const;

export const componentTokens = {
	nodeInspector: _NI_TOKENS,
	sidebar: _SB_TOKENS,
	// Add more component tokens here
} as const;
