/**
 * INSPECTOR SETTINGS DROPDOWN - Card visibility settings panel for node inspector
 *
 * • Uses shadcn dropdown menu with toggle switches for each card section
 * • Follows existing design system with proper theming
 * • Supports dark and light mode transitions
 * • Compact layout with clear visual feedback
 * • Smooth animations for open/close states
 *
 * Keywords: settings-dropdown, card-visibility, toggle-switches, shadcn, theming
 */

"use client";

import { RotateCcw } from "lucide-react";
import React, { memo } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import type { InspectorSettings } from "../hooks/useInspectorSettings";

// ============================================================================
// STYLING CONSTANTS
// ============================================================================

// Custom switch styling for green/red colors, basically override default colors
const CUSTOM_SWITCH_STYLES = `
	data-[state=checked]:bg-green-500 
	data-[state=unchecked]:bg-red-500
`;

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
// CUSTOM SWITCH COMPONENT
// ============================================================================

interface CustomSwitchProps {
	checked: boolean;
	onChange: () => void;
	disabled?: boolean;
}

const CustomSwitch: React.FC<CustomSwitchProps> = memo(({ checked, onChange, disabled = false }) => {
	return (
		<Switch
			checked={checked}
			onCheckedChange={onChange}
			disabled={disabled}
			className={CUSTOM_SWITCH_STYLES}
		/>
	);
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const InspectorSettingsDropdownComponent: React.FC<InspectorSettingsDropdownProps> = ({
	settings,
	onToggleSetting,
	onResetToDefaults,
	children,
}) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{children}
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-80 p-0" align="end">
				{/* Header */}
				<div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
					<DropdownMenuLabel className="text-sm font-medium">Card Visibility</DropdownMenuLabel>
					<DropdownMenuItem
						onClick={onResetToDefaults}
						className="text-xs text-muted-foreground hover:text-foreground"
					>
						<RotateCcw className="h-3 w-3 mr-1" />
						Reset
					</DropdownMenuItem>
				</div>

				{/* Settings Items */}
				<div className="p-2 max-h-[400px] overflow-y-auto">
					{SETTING_ITEMS.map(({ key, label }) => (
						<DropdownMenuItem
							key={key}
							className="flex items-center justify-between py-2 px-2 cursor-default focus:bg-muted/50 hover:bg-muted/50 border-none outline-none"
							onClick={(e) => {
								e.preventDefault();
								onToggleSetting(key);
							}}
						>
							<span className="text-sm font-medium">{label}</span>
							<div onClick={(e) => e.stopPropagation()}>
								<CustomSwitch
									checked={settings[key]}
									onChange={() => onToggleSetting(key)}
								/>
							</div>
						</DropdownMenuItem>
					))}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

// Optimized memo with deep comparison for settings object, basically prevent re-renders on identical settings
export const InspectorSettingsDropdown = memo(InspectorSettingsDropdownComponent, (prev, next) => {
	// Compare settings object deeply since it's reconstructed on each render
	const settingsEqual = (
		prev.settings.nodeInfo === next.settings.nodeInfo &&
		prev.settings.nodeData === next.settings.nodeData &&
		prev.settings.output === next.settings.output &&
		prev.settings.controls === next.settings.controls &&
		prev.settings.handles === next.settings.handles &&
		prev.settings.connections === next.settings.connections &&
		prev.settings.errors === next.settings.errors &&
		prev.settings.size === next.settings.size
	);
	
	// Compare callback references (should be stable with useCallback)
	const callbacksEqual = (
		prev.onToggleSetting === next.onToggleSetting &&
		prev.onResetToDefaults === next.onResetToDefaults
	);
	
	return settingsEqual && callbacksEqual;
});