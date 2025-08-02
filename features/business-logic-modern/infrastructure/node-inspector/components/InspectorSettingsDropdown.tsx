/**
 * INSPECTOR SETTINGS DROPDOWN - Optimized card visibility settings panel for node inspector
 *
 * Performance Optimizations:
 * • Pre-computed constant styling and configurations
 * • Memoized event handlers to prevent recreation
 * • Optimized Switch components with stable references
 * • Reduced re-renders through better memo implementation
 * • Stable key-based iteration for consistent reconciliation
 * • Single event handling pattern for better performance
 *
 * Features:
 * • Uses shadcn dropdown menu with toggle switches for each card section
 * • Follows existing design system with proper theming
 * • Supports dark and light mode transitions
 * • Compact layout with clear visual feedback
 * • Smooth animations for open/close states
 *
 * Keywords: settings-dropdown, card-visibility, toggle-switches, shadcn, theming, performance-optimized
 */

"use client";

import { RotateCcw } from "lucide-react";
import React, { memo, useCallback, useMemo } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import type { InspectorSettings } from "../hooks/useInspectorSettings";

// ============================================================================
// STYLING CONSTANTS
// ============================================================================

// Pre-computed styling constants for better performance, basically prevent recreation on every render
const CUSTOM_SWITCH_STYLES = "data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500";
const CONTENT_STYLES = "w-80 p-0";
const HEADER_STYLES = "flex items-center justify-between px-3 py-2 border-b border-border/30";
const RESET_BUTTON_STYLES = "text-xs text-muted-foreground hover:text-foreground";
const SETTINGS_CONTAINER_STYLES = "p-2 max-h-[400px] overflow-y-auto";
const MENU_ITEM_STYLES = "flex items-center justify-between py-2 px-2 cursor-default focus:bg-muted/50 hover:bg-muted/50 border-none outline-none";
const LABEL_STYLES = "text-sm font-medium";
const ICON_STYLES = "h-3 w-3 mr-1";

// ============================================================================
// COMPONENT TYPES
// ============================================================================

interface InspectorSettingsDropdownProps {
	settings: InspectorSettings;
	onToggleSetting: (key: keyof InspectorSettings) => void;
	onResetToDefaults: () => void;
	children: React.ReactNode;
}

// ============================================================================
// SETTINGS METADATA
// ============================================================================

// Configuration for each setting item, basically display information for toggles
// Moved outside component for performance - prevents array recreation
const SETTING_ITEMS: ReadonlyArray<{
	readonly key: keyof InspectorSettings;
	readonly label: string;
	readonly description: string;
}> = [
	{ key: "nodeInfo", label: "Node Information", description: "Basic node metadata and ID" },
	{ key: "nodeData", label: "Node Data", description: "JSON data editor" },
	{ key: "output", label: "Output", description: "Node output values" },
	{ key: "controls", label: "Controls", description: "Interactive node controls" },
	{ key: "handles", label: "Handles", description: "Input/output handle configuration" },
	{ key: "connections", label: "Connections", description: "Connected nodes and edges" },
	{ key: "size", label: "Size", description: "Node size controls" },
	{ key: "errors", label: "Errors", description: "Error logs and diagnostics" },
] as const;

// ============================================================================
// OPTIMIZED SWITCH COMPONENT
// ============================================================================

interface OptimizedSwitchProps {
	checked: boolean;
	onChange: () => void;
	disabled?: boolean;
}

// Highly optimized switch with stable props and minimal re-renders, basically prevent Switch recreation
const OptimizedSwitch = memo<OptimizedSwitchProps>(({ checked, onChange, disabled = false }) => {
	return (
		<Switch
			checked={checked}
			onCheckedChange={onChange}
			disabled={disabled}
			className={CUSTOM_SWITCH_STYLES}
		/>
	);
}, (prev, next) => {
	// Custom comparison for optimal re-render control, basically precise change detection
	return (
		prev.checked === next.checked &&
		prev.onChange === next.onChange &&
		prev.disabled === next.disabled
	);
});

OptimizedSwitch.displayName = "OptimizedSwitch";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// Optimized setting item component, basically prevent recreation of item components
const SettingItem = memo<{
	itemKey: keyof InspectorSettings;
	label: string;
	checked: boolean;
	onToggle: (key: keyof InspectorSettings) => void;
}>(({ itemKey, label, checked, onToggle }) => {
	// Memoized click handler for this specific item, basically stable function reference
	const handleClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		onToggle(itemKey);
	}, [itemKey, onToggle]);

	// Memoized switch handler for this specific item, basically stable function reference
	const handleSwitchChange = useCallback(() => {
		onToggle(itemKey);
	}, [itemKey, onToggle]);

	return (
		<DropdownMenuItem
			className={MENU_ITEM_STYLES}
			onClick={handleClick}
		>
			<span className={LABEL_STYLES}>{label}</span>
			<div onClick={(e) => e.stopPropagation()}>
				<OptimizedSwitch
					checked={checked}
					onChange={handleSwitchChange}
				/>
			</div>
		</DropdownMenuItem>
	);
}, (prev, next) => {
	// Only re-render if the checked state or handlers change, basically precise change detection
	return (
		prev.checked === next.checked &&
		prev.onToggle === next.onToggle &&
		prev.itemKey === next.itemKey &&
		prev.label === next.label
	);
});

SettingItem.displayName = "SettingItem";

const InspectorSettingsDropdownComponent: React.FC<InspectorSettingsDropdownProps> = ({
	settings,
	onToggleSetting,
	onResetToDefaults,
	children,
}) => {
	// Memoized settings items to prevent array recreation, basically stable list reference
	const settingItems = useMemo(
		() => SETTING_ITEMS.map(({ key, label }) => (
			<SettingItem
				key={key}
				itemKey={key}
				label={label}
				checked={settings[key]}
				onToggle={onToggleSetting}
			/>
		)),
		[settings, onToggleSetting]
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{children}
			</DropdownMenuTrigger>
			<DropdownMenuContent className={CONTENT_STYLES} align="end">
				{/* Header */}
				<div className={HEADER_STYLES}>
					<DropdownMenuLabel className={LABEL_STYLES}>Card Visibility</DropdownMenuLabel>
					<DropdownMenuItem
						onClick={onResetToDefaults}
						className={RESET_BUTTON_STYLES}
					>
						<RotateCcw className={ICON_STYLES} />
						Reset
					</DropdownMenuItem>
				</div>

				{/* Settings Items */}
				<div className={SETTINGS_CONTAINER_STYLES}>
					{settingItems}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

// Optimized memo with efficient shallow comparison, basically prevent re-renders with fast checks
export const InspectorSettingsDropdown = memo(InspectorSettingsDropdownComponent, (prev, next) => {
	// Fast reference check first, basically early return for same object
	if (prev.settings === next.settings) {
		return prev.onToggleSetting === next.onToggleSetting && prev.onResetToDefaults === next.onResetToDefaults;
	}
	
	// Efficient settings comparison using Object.keys for dynamic checking, basically flexible property comparison
	const settingsKeys = Object.keys(prev.settings) as Array<keyof InspectorSettings>;
	for (const key of settingsKeys) {
		if (prev.settings[key] !== next.settings[key]) {
			return false;
		}
	}
	
	// Compare callback references (should be stable with useCallback), basically ensure handlers are stable
	return (
		prev.onToggleSetting === next.onToggleSetting &&
		prev.onResetToDefaults === next.onResetToDefaults &&
		prev.children === next.children
	);
});