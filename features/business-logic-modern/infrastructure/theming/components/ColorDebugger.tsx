/**
 * COLOR DEBUGGER COMPONENT - Visual color reference tool
 *
 * This component provides a visual interface to understand what colors
 * the CSS variables actually represent in both light and dark themes.
 * Useful for development and debugging theme-related issues.
 *
 * @author Agenitix Development Team
 * @version 1.0.0
 */

"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { debugComponentColors, getColorInfo } from "./colorDebugUtils";
import type { ComponentThemes } from "./componentThemeStore";
import { useComponentTheme } from "./componentThemeStore";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Check if we're in development mode */
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

/** Available component types for debugging */
const COMPONENT_TYPES: (keyof ComponentThemes)[] = [
	"actionToolbar",
	"historyPanel",
	"sidePanel",
	"sidebarIcons",
	"variantSelector",
	"nodeInspector",
	"miniMap",
];

/** CSS variables to display in the color reference */
const CSS_VARIABLES = [
	"bg-background",
	"bg-card",
	"bg-muted",
	"bg-accent",
	"bg-primary",
	"bg-secondary",
	"text-foreground",
	"text-card-foreground",
	"text-muted-foreground",
	"text-primary-foreground",
	"text-secondary-foreground",
	"border-border",
	"border-accent",
	"border-primary",
];

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for the ColorDebugger component
 */
interface ColorDebuggerProps {
	/** Whether the debugger should be visible */
	isVisible?: boolean;
	/** Callback when debugger visibility changes */
	onVisibilityChange?: (visible: boolean) => void;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Color swatch component showing a single color
 */
const ColorSwatch: React.FC<{
	variable: string;
	theme: "light" | "dark";
}> = ({ variable, theme }) => {
	const colorInfo = getColorInfo(variable, theme);

	const handleCopy = useCallback(() => {
		navigator.clipboard
			.writeText(`var(--${variable.replace(/^(bg-|text-|border-)/, "")})`)
			.then(() => toast.success(`${variable} copied to clipboard`));
	}, [variable]);

	return (
		<button
			type="button"
			onClick={handleCopy}
			className="flex items-center gap-3 rounded-md border border-border bg-card p-2 text-left hover:ring-2 hover:ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
			title="Click to copy CSS variable"
		>
			<span
				className="h-8 w-8 flex-shrink-0 rounded border border-border shadow-sm"
				style={{ backgroundColor: colorInfo.hex }}
			/>
			<span className="min-w-0 flex-1">
				<span className="block font-mono text-foreground text-sm">{variable}</span>
				<span className="block truncate text-muted-foreground text-xs">
					{colorInfo.hex} • {colorInfo.name}
				</span>
			</span>
		</button>
	);
};

/**
 * Component theme preview showing all colors used in a theme
 */
const ComponentThemePreview: React.FC<{
	componentName: keyof ComponentThemes;
}> = ({ componentName }) => {
	const theme = useComponentTheme(componentName);

	const handleDebugColors = () => {
		debugComponentColors(componentName, "light");
	};

	return (
		<div className="rounded-lg border border-border bg-card p-4">
			<div className="mb-3 flex items-center justify-between">
				<h3 className="font-semibold text-card-foreground capitalize">
					{componentName.replace(/([A-Z])/g, " $1").trim()}
				</h3>
				<button
					type="button"
					onClick={handleDebugColors}
					className="rounded bg-primary px-3 py-1 text-primary-foreground text-xs transition-colors hover:bg-primary/90"
				>
					Debug in Console
				</button>
			</div>

			<div className="grid grid-cols-1 gap-2 text-xs">
				<div>
					<span className="font-medium text-muted-foreground">Primary BG:</span>
					<span className="ml-2 font-mono text-foreground">{theme.background.primary}</span>
				</div>
				<div>
					<span className="font-medium text-muted-foreground">Primary Text:</span>
					<span className="ml-2 font-mono text-foreground">{theme.text.primary}</span>
				</div>
				<div>
					<span className="font-medium text-muted-foreground">Border:</span>
					<span className="ml-2 font-mono text-foreground">{theme.border.default}</span>
				</div>
				<div>
					<span className="font-medium text-muted-foreground">Hover BG:</span>
					<span className="ml-2 font-mono text-foreground">{theme.background.hover}</span>
				</div>
			</div>
		</div>
	);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * ColorDebugger - Visual color reference and debugging tool
 *
 * Provides a comprehensive interface for understanding CSS variable colors
 * and debugging component themes. Shows actual color values, names, and
 * usage information for both light and dark themes.
 *
 * ⚠️ DEVELOPMENT ONLY: This component only renders in development mode
 *
 * @param {ColorDebuggerProps} props - Component props
 * @returns {React.ReactElement | null} The color debugger component
 */
export const ColorDebugger: React.FC<ColorDebuggerProps> = ({
	isVisible = false,
	onVisibilityChange,
}) => {
	const [activeTab, setActiveTab] = useState<"colors" | "components">("colors");
	const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">("light");
	const [search, setSearch] = useState("");
	const filteredVariables = CSS_VARIABLES.filter((v) => v.includes(search));

	// Only render in development mode
	if (!(IS_DEVELOPMENT && isVisible)) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-card shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between border-border border-b p-4">
					<div className="flex items-center gap-4">
						<h2 className="font-semibold text-card-foreground text-lg">
							🎨 Color Debugger{" "}
							<span className="rounded bg-status-edge-add px-2 py-1 text-node-test-text text-xs">
								DEV
							</span>
						</h2>
						<div className="flex rounded-md bg-muted p-1">
							<button
								type="button"
								onClick={() => setActiveTab("colors")}
								className={`rounded px-3 py-1 text-sm transition-colors ${
									activeTab === "colors"
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								Color Reference
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("components")}
								className={`rounded px-3 py-1 text-sm transition-colors ${
									activeTab === "components"
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								Component Themes
							</button>
						</div>
					</div>
					<button
						type="button"
						onClick={() => onVisibilityChange?.(false)}
						className="text-muted-foreground transition-colors hover:text-foreground"
					>
						✕
					</button>
				</div>

				{/* Content */}
				<div className="max-h-[calc(90vh-80px)] overflow-y-auto p-4">
					{activeTab === "colors" && (
						<div>
							{/* Theme & Search */}
							<div className="mb-6 flex items-center gap-4">
								<span className="font-medium text-card-foreground text-sm">Theme:</span>
								<div className="flex rounded-md bg-muted p-1">
									<button
										type="button"
										onClick={() => setSelectedTheme("light")}
										className={`rounded px-3 py-1 text-sm transition-colors ${
											selectedTheme === "light"
												? "bg-background text-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										🌞 Light
									</button>
									<button
										type="button"
										onClick={() => setSelectedTheme("dark")}
										className={`rounded px-3 py-1 text-sm transition-colors ${
											selectedTheme === "dark"
												? "bg-background text-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										🌙 Dark
									</button>
								</div>
								<input
									type="text"
									placeholder="Filter…"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="ml-4 rounded border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
									aria-label="Filter variables"
								/>
							</div>

							{/* Color Grid */}
							<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
								{filteredVariables.map((variable) => (
									<ColorSwatch key={variable} variable={variable} theme={selectedTheme} />
								))}
							</div>
						</div>
					)}

					{activeTab === "components" && (
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{COMPONENT_TYPES.map((componentName) => (
								<ComponentThemePreview key={componentName} componentName={componentName} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

/**
 * Hook to control the ColorDebugger visibility
 *
 * ⚠️ DEVELOPMENT ONLY: This hook only works in development mode
 *
 * @returns {object} Object with isVisible state and toggle function
 */
export const useColorDebugger = () => {
	const [isVisible, setIsVisible] = useState(false);

	const toggle = () => {
		if (!IS_DEVELOPMENT) {
			console.warn("🎨 Color Debugger is only available in development mode");
			return;
		}
		setIsVisible(!isVisible);
	};

	const show = () => {
		if (!IS_DEVELOPMENT) {
			console.warn("🎨 Color Debugger is only available in development mode");
			return;
		}
		setIsVisible(true);
	};

	const hide = () => setIsVisible(false);

	// Add keyboard shortcut (Ctrl/Cmd + Shift + C) - only in development
	useEffect(() => {
		if (!IS_DEVELOPMENT) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "C") {
				event.preventDefault();
				toggle();
			}

			// ESC to close
			if (event.key === "Escape" && isVisible) {
				hide();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isVisible]);

	return {
		isVisible: IS_DEVELOPMENT ? isVisible : false,
		toggle,
		show,
		hide,
		setIsVisible: IS_DEVELOPMENT ? setIsVisible : () => {},
	};
};

/**
 * QUICK ACCESS FUNCTIONS - Global functions for easy debugging
 *
 * ⚠️ DEVELOPMENT ONLY: These functions only work in development mode
 * These functions can be called from anywhere in your app or browser console
 * for quick color debugging without needing to import components.
 */

// Make functions available globally for console debugging - only in development
if (typeof window !== "undefined" && IS_DEVELOPMENT) {
	(window as any).showColorDebugger = () => {
		// Dispatch a custom event to show the debugger
		window.dispatchEvent(new CustomEvent("show-color-debugger"));
	};

	(window as any).debugColors = (componentName?: string) => {
		if (componentName) {
			// Import and use the debug function
			import("./colorDebugUtils").then(({ debugComponentColors }) => {
				debugComponentColors(componentName, "light");
			});
		} else {
		}
	};
} else if (typeof window !== "undefined" && !IS_DEVELOPMENT) {
	// In production, provide helpful messages
	(window as any).showColorDebugger = () => {};

	(window as any).debugColors = () => {};
}
