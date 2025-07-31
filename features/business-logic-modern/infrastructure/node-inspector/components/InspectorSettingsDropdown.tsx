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
import React from "react";
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
const SETTING_ITEMS: Array<{
	key: keyof InspectorSettings;
	label: string;
	description: string;
}> = [
	{ key: "nodeInfo", label: "Node Information", description: "Basic node metadata and ID" },
	{ key: "description", label: "Description", description: "Node description text" },
	{ key: "nodeData", label: "Node Data", description: "JSON data editor" },
	{ key: "output", label: "Output", description: "Node output values" },
	{ key: "controls", label: "Controls", description: "Interactive node controls" },
	{ key: "handles", label: "Handles", description: "Input/output handle configuration" },
	{ key: "connections", label: "Connections", description: "Connected nodes and edges" },
	{ key: "size", label: "Size", description: "Node size controls" },
	{ key: "errors", label: "Errors", description: "Error logs and diagnostics" },
];

// ============================================================================
// CUSTOM SWITCH COMPONENT
// ============================================================================

interface CustomSwitchProps {
	checked: boolean;
	onChange: () => void;
	disabled?: boolean;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({ checked, onChange, disabled = false }) => {
	return (
		<Switch
			checked={checked}
			onCheckedChange={onChange}
			disabled={disabled}
			className={CUSTOM_SWITCH_STYLES}
		/>
	);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const InspectorSettingsDropdown: React.FC<InspectorSettingsDropdownProps> = ({
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
							className="flex items-center justify-between py-2 px-2 cursor-default"
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