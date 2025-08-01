/**
 * VARIANT SELECTOR - Floating component for switching between sidebar variants
 *
 * • Floating variant buttons with optimized Lucide icons positioned absolutely
 * • Temporary text display showing variant names on hover/switch
 * • Keyboard shortcut support (Alt+1-5) with visual feedback
 * • Hover effects with variant name preview
 * • Responsive design with mobile considerations
 * • Integration with semantic token system for consistent theming
 *
 * Performance optimizations:
 * • Memoized icon components prevent unnecessary re-renders
 * • Cached Lucide icons with O(1) lookups via iconUtils
 * • Pre-computed icon props to avoid object recreation
 * • Stable icon references for consistent performance
 *
 * Keywords: variant-selector, floating-buttons, keyboard-shortcuts, semantic-tokens, responsive, performance, memoization
 */

import type React from "react";
import { useEffect, useState, memo, useMemo } from "react";
import { LucideIcon, COMMON_LUCIDE_ICONS } from "../node-core/iconUtils";
import { type SidebarVariant, VARIANT_NAMES } from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Available sidebar variants in order */
const SIDEBAR_VARIANTS: SidebarVariant[] = ["A", "B", "C", "D", "E"];

/** Duration to show variant name text after switching (in milliseconds) */
const VARIANT_TEXT_DISPLAY_DURATION = 1500;

/** Icon size for variant selector buttons, basically consistent sizing */
const ICON_SIZE = 16;

/** Icon class name for consistent styling, basically shared CSS properties */
const ICON_CLASS_NAME = "w-4 h-4";

/** Optimized icon mapping for variant selector, basically using Lucide icons for better performance */
const VARIANT_ICONS = {
	A: COMMON_LUCIDE_ICONS.ZAP, // Main - Lightning bolt for speed/main functionality
	B: COMMON_LUCIDE_ICONS.VIDEO, // Media - Video for media content
	C: COMMON_LUCIDE_ICONS.LINK, // Integration - Link for connections/integrations
	D: COMMON_LUCIDE_ICONS.SETTINGS, // Automation - Settings gear for automation
	E: COMMON_LUCIDE_ICONS.PACKAGE, // Misc - Package for miscellaneous items
} as const;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for the VariantSelector component
 * @interface VariantSelectorProps
 */
interface VariantSelectorProps {
	/** Currently active sidebar variant */
	variant: SidebarVariant;
	/** Callback function triggered when variant changes */
	onVariantChange: (variant: SidebarVariant) => void;
	/** Whether the variant selector should be hidden */
	isHidden: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Optimized memoized icon component for variant selector, basically prevent re-creation of icon components
 */
const VariantIcon = memo<{ variant: SidebarVariant }>(({ variant }) => {
	const iconName = VARIANT_ICONS[variant];
	
	// Use useMemo to prevent re-creation of props object on every render
	const iconProps = useMemo(() => ({
		name: iconName,
		className: ICON_CLASS_NAME,
		size: ICON_SIZE,
	}), [iconName]);
	
	return <LucideIcon {...iconProps} />;
});

VariantIcon.displayName = 'VariantIcon';

/**
 * Renders the appropriate optimized icon for each sidebar variant, basically using cached Lucide icons
 * @param {SidebarVariant} variant - The variant to get icon for
 * @returns {React.ReactElement | null} The optimized icon component or null
 */
const renderVariantIcon = (variant: SidebarVariant): React.ReactElement | null => {
	if (!VARIANT_ICONS[variant]) {
		return null;
	}

	return <VariantIcon variant={variant} />;
};

/**
 * Generates the CSS classes for variant buttons based on active state
 *
 * Active buttons use inverted colors for high contrast:
 * • Light mode: Dark background with white text
 * • Dark mode: White background with dark text
 *
 * @param {boolean} isActive - Whether the button represents the active variant
 * @returns {string} Combined CSS classes with proper contrast for active state
 */
const generateButtonClasses = (isActive: boolean): string => {
	const BASE_CLASSES =
		"rounded h-8 w-8 py-1 text-sm transition-all duration-200 flex items-center justify-center";

	const activeClasses =
		"bg-[var(--infra-sidebar-bg-hover)] text-[var(--infra-sidebar-text)] border-[var(--infra-sidebar-border-hover)]";
	const inactiveClasses =
		"bg-[var(--infra-sidebar-bg)] text-[var(--infra-sidebar-text-secondary)] hover:bg-[var(--infra-sidebar-bg-hover)] hover:text-[var(--infra-sidebar-text-hover)]";

	return `${BASE_CLASSES} ${isActive ? activeClasses : inactiveClasses}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * VariantSelector - A floating component for switching between sidebar variants
 *
 * This component provides a visual interface for users to switch between different
 * sidebar variants (A, B, C, D, E) with keyboard shortcuts and hover feedback.
 * It displays variant names temporarily when switching and maintains its position
 * absolutely positioned in the bottom-right area.
 *
 * Features:
 * - Floating variant buttons with icons
 * - Temporary text display showing variant names
 * - Keyboard shortcut support (Alt+1-5)
 * - Hover effects with variant name preview
 * - Responsive design with mobile considerations
 * - Integration with semantic token system
 *
 * @param {VariantSelectorProps} props - Component props
 * @returns {React.ReactElement | null} The variant selector component or null if hidden
 *
 * @example
 * ```tsx
 * <VariantSelector
 *   variant="A"
 *   onVariantChange={(newVariant) => handleVariantChange(newVariant)}
 *   isHidden={false}
 * />
 * ```
 */
export function VariantSelector({
	variant,
	onVariantChange,
	isHidden,
}: VariantSelectorProps): React.ReactElement | null {
	// ========================================================================
	// HOOKS & STATE
	// ========================================================================

	/** Currently hovered variant for preview text */
	const [hoveredVariant, setHoveredVariant] = useState<SidebarVariant | null>(null);

	/** Variant to show text for (after switching) */
	const [showSwitchText, setShowSwitchText] = useState<SidebarVariant | null>(null);

	// ========================================================================
	// EFFECTS
	// ========================================================================

	/**
	 * Show variant name text briefly when variant changes
	 * Automatically hides the text after VARIANT_TEXT_DISPLAY_DURATION
	 */
	useEffect(() => {
		setShowSwitchText(variant);

		const timer = setTimeout(() => {
			setShowSwitchText(null);
		}, VARIANT_TEXT_DISPLAY_DURATION);

		return () => clearTimeout(timer);
	}, [variant]);

	// ========================================================================
	// EARLY RETURNS
	// ========================================================================

	if (isHidden) {
		return null;
	}

	// ========================================================================
	// COMPUTED VALUES
	// ========================================================================

	/** Text to display (either hovered variant or switch confirmation) */
	const displayText = hoveredVariant || showSwitchText;

	// ========================================================================
	// EVENT HANDLERS
	// ========================================================================

	/**
	 * Handles variant button click
	 * @param {SidebarVariant} selectedVariant - The variant that was clicked
	 */
	const handleVariantClick = (selectedVariant: SidebarVariant): void => {
		onVariantChange(selectedVariant);
	};

	/**
	 * Handles mouse enter on variant button
	 * @param {SidebarVariant} hoveredVariant - The variant being hovered
	 */
	const handleMouseEnter = (hoveredVariant: SidebarVariant): void => {
		setHoveredVariant(hoveredVariant);
	};

	/**
	 * Handles mouse leave on variant button
	 */
	const handleMouseLeave = (): void => {
		setHoveredVariant(null);
	};

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div className="absolute right-5 bottom-56 z-10 sm:bottom-78">
			<div className="flex w-[450px] flex-row gap-2">
				{/* Floating Text Display - Half width */}
				<div className="flex w-1/2 justify-center">
					{displayText && (
						<div className="pointer-events-none ml-10 hidden whitespace-nowrap rounded px-2 py-1 font-extralight text-[var(--infra-sidebar-text)] tracking-widest shadow-lg sm:block">
							{VARIANT_NAMES[displayText]}
						</div>
					)}
				</div>

				{/* Variant Buttons Container - Half width */}
				<div className="flex w-1/2 justify-end gap-2">
					{SIDEBAR_VARIANTS.map((variantKey, index) => {
						const shortcutNumber = index + 1;
						const variantName = VARIANT_NAMES[variantKey];
						const isActive = variant === variantKey;

						return (
							<button
								type="button"
								key={variantKey}
								onClick={() => handleVariantClick(variantKey)}
								onMouseEnter={() => handleMouseEnter(variantKey)}
								onMouseLeave={handleMouseLeave}
								title={`${variantName} (Alt+${shortcutNumber})`}
								className={generateButtonClasses(isActive)}
								aria-label={`Switch to ${variantName} variant`}
								aria-pressed={isActive}
							>
								{renderVariantIcon(variantKey)}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
