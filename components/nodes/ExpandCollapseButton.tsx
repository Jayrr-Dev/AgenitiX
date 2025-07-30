/**
 * EXPAND COLLAPSE BUTTON - Unified, token-based expand/collapse control
 *
 * • Fully styled through tokens.json for ultimate flexibility
 * • Uses CSS custom properties from expandCollapseButton tokens
 * • Consistent sizing and positioning across all node types
 * • Smooth transitions and hover effects
 * • Accessible with proper ARIA labels and keyboard support
 * • Supports dark mode theming
 *
 * Keywords: expand-collapse, token-styling, unified-design, accessibility, dark-mode
 */

import React from "react";

import { IoIosRadioButtonOn } from "react-icons/io";
import { IoIosRadioButtonOff } from "react-icons/io";

/**
 * Toggle icons for expanded/collapsed states
 * Using React Icons for better consistency and centering
 */
const TOGGLE_ICONS = {
	EXPANDED: IoIosRadioButtonOn,
	COLLAPSED: IoIosRadioButtonOff,
} as const;

interface ExpandCollapseButtonProps {
	showUI: boolean;
	onToggle: () => void;
	className?: string;
	size?: "sm" | "md" | "lg";
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
 * - Supports dark mode theming
 */
export const ExpandCollapseButton: React.FC<ExpandCollapseButtonProps> = ({
	showUI,
	onToggle,
	className = "",
}) => {
	// Get theme-aware button color (simplified to avoid hydration issues)
	const buttonColor = "var(--core-expandCollapseButton-text)";

	// Memoize the button style to prevent unnecessary re-renders
	const buttonStyle = React.useMemo(
		(): React.CSSProperties => ({
			// Token-based styling - maintains current appearance
			backgroundColor: "var(--core-expandCollapseButton-bg)",
			color: buttonColor,
			// Positioning and sizing (keeping current values)
			position: "absolute",
			top: "4px", // top-0.5 = 2px
			left: "3px", // left-1 = 4px
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
			scale: "1.2",
		}),
		[]
	);

	return (
		<button
			type="button"
			aria-label={showUI ? "Collapse node" : "Expand node"}
			title={showUI ? "Collapse" : "Expand"}
			onClick={onToggle}
			style={buttonStyle}
			className={className}
		>
			{(() => {
				const IconComponent = showUI ? TOGGLE_ICONS.EXPANDED : TOGGLE_ICONS.COLLAPSED;
				return <IconComponent size={8} style={{ pointerEvents: "none" }} />;
			})()}
		</button>
	);
};
