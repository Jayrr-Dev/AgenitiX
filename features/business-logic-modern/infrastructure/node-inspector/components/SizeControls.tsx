/**
 * SIZE CONTROLS COMPONENT - Generic size controls for node inspector
 *
 * • Reusable size controls for any node type
 * • Supports both expanded and collapsed size configuration
 * • Uses consistent styling with the Node Inspector design system
 * • Provides human-readable size options with descriptions
 * • Integrates with node data updates
 *
 * Keywords: size-controls, reusable, node-inspector, dynamic-sizing
 */

"use client";

import type React from "react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SizeControlsProps {
	nodeData: {
		expandedSize?: string;
		collapsedSize?: string;
		[key: string]: any;
	};
	updateNodeData: (patch: Record<string, any>) => void;
}

// ============================================================================
// SIZE OPTIONS
// ============================================================================

const EXPANDED_SIZE_OPTIONS = [
	{ value: "FE0", label: "FE0: 60×60px (Fixed - Tiny)" },
	{ value: "FE1", label: "FE1: 120×120px (Fixed - Default)" },
	{ value: "FE1H", label: "FE1H: 120×180px (Fixed - Tall)" },
	{ value: "FE2", label: "FE2: 180×180px (Fixed - Large)" },
	{ value: "FE3", label: "FE3: 240×240px (Fixed - Extra Large)" },
	{ value: "VE0", label: "VE0: 60px × auto (Variable - Tiny)" },
	{ value: "VE1", label: "VE1: 120px × auto (Variable - Default)" },
	{ value: "VE2", label: "VE2: 180px × auto (Variable - Large)" },
	{ value: "VE3", label: "VE3: 240px × auto (Variable - Extra Large)" },
];

const COLLAPSED_SIZE_OPTIONS = [
	{ value: "C1", label: "C1: 60×60px (Standard)" },
	{ value: "C1W", label: "C1W: 120×60px (Wide)" },
	{ value: "C2", label: "C2: 120×120px (Large)" },
	{ value: "C3", label: "C3: 180×180px (Extra Large)" },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SizeControls: React.FC<SizeControlsProps> = ({ nodeData, updateNodeData }) => {
	const handleExpandedSizeChange = (value: string) => {
		updateNodeData({ expandedSize: value });
	};

	const handleCollapsedSizeChange = (value: string) => {
		updateNodeData({ collapsedSize: value });
	};

	return (
		<div className="space-y-4">
			<div>
				<label className="mb-2 block font-medium text-foreground text-sm">Collapsed Size</label>
				<select
					value={nodeData.collapsedSize || "C1W"}
					onChange={(e) => handleCollapsedSizeChange(e.target.value)}
					className="w-full rounded-md border border-border bg-background p-2 text-foreground text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
				>
					{COLLAPSED_SIZE_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			<div>
				<label className="mb-2 block font-medium text-foreground text-sm">Expanded Size</label>
				<select
					value={nodeData.expandedSize || "VE2"}
					onChange={(e) => handleExpandedSizeChange(e.target.value)}
					className="w-full rounded-md border border-border bg-background p-2 text-foreground text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
				>
					{EXPANDED_SIZE_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>
		</div>
	);
};

export default SizeControls;
