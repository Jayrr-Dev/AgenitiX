/**
 * EXPAND COLLAPSE BUTTON - Unified, token-based expand/collapse control
 *
 * • Fully styled through tokens.json for ultimate flexibility
 * • Uses CSS custom properties from expandCollapseButton tokens
 * • Consistent sizing and positioning across all node types
 * • Smooth transitions and hover effects
 * • Accessible with proper ARIA labels and keyboard support
 *
 * Keywords: expand-collapse, token-styling, unified-design, accessibility
 */

import type React from "react";

/**
 * Toggle symbols for expanded/collapsed states
 * Using semantic symbols that work well with rotation animations
 */
const TOGGLE_SYMBOLS = {
	EXPANDED: "⦿",
	COLLAPSED: "⦾",
} as const;

interface ExpandCollapseButtonProps {
	showUI: boolean;
	onToggle: () => void;
	className?: string;
	size?: "sm" | "md";
}

/**
 * Unified ExpandCollapseButton with complete token-based styling
 *
 * Features:
 * - All styling controlled through tokens.json
 * - CSS custom properties for background, text, and positioning
 * - Size variants and state-based styling
 * - Maintains exact current visual appearance
 * - Single source of truth for button styling
 */
export const ExpandCollapseButton: React.FC<ExpandCollapseButtonProps> = ({
	showUI,
	onToggle,
	className = "",
	size = "sm",
}) => {
	const buttonStyle: React.CSSProperties = {
		// Token-based styling - maintains current appearance
		backgroundColor: "var(--core-expandCollapseButton-bg)",
		color: "var(--core-expandCollapseButton-text)",
		// Positioning and sizing (keeping current values)
		position: "absolute",
		top: "0px", // top-0.5 = 2px
		left: "2px", // left-1 = 4px
		zIndex: 10,
		cursor: "pointer",
		// Typography (keeping current values)
		fontSize: "11px",
		fontWeight: "bold",
		// Remove default button styling
		border: "none",
		padding: "0",
		outline: "none",
		margin: "0px",
		transform: "translate(0px, -1px)",
		opacity: ".7",
	};

	return (
		<button
			aria-label={showUI ? "Collapse node" : "Expand node"}
			title={showUI ? "Collapse" : "Expand"}
			onClick={onToggle}
			style={buttonStyle}
			className={className}
		>
			{showUI ? TOGGLE_SYMBOLS.EXPANDED : TOGGLE_SYMBOLS.COLLAPSED}
		</button>
	);
};
