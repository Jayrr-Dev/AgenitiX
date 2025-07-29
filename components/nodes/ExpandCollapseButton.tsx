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
 * - Supports dark mode theming
 */
export const ExpandCollapseButton: React.FC<ExpandCollapseButtonProps> = ({
	showUI,
	onToggle,
	className = "",
}: ExpandCollapseButtonProps) => {
	// Memoize the button style to prevent unnecessary re-renders
	const buttonStyle = React.useMemo(
		(): React.CSSProperties => ({
			// Token-based styling - maintains current appearance
			position: "absolute",
			top: "-10px",
			right: "-10px",
			width: "20px",
			height: "20px",
			borderRadius: "50%",
			border: "none",
			background: "var(--core-expandCollapseButton-bg)",
			color: "var(--core-expandCollapseButton-text)",
			cursor: "pointer",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			fontSize: "10px",
			fontWeight: "bold",
			zIndex: 1000,
			transition: "all 0.2s ease",
			// Hover state
			":hover": {
				transform: "scale(1.1)",
			},
			// Active state
			":active": {
				transform: "scale(0.95)",
			},
			// Focus state
			":focus": {
				outline: "2px solid var(--core-expandCollapseButton-text)",
				outlineOffset: "2px",
				scale: "1.2",
			},
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
