/**
 * HANDLE POSITION EDITOR - Interactive handle position controls for node inspector
 *
 * • Provides dropdown selectors for changing individual handle positions
 * • Maintains handle type safety and connection compatibility
 * • Integrates with node data schema for persistent position overrides
 * • Uses modern shadcn/ui components for consistent design
 * • Supports real-time position updates with immediate visual feedback
 *
 * Keywords: handle-positioning, node-inspector, interactive-controls, shadcn-ui
 */

"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { NodeHandleSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import { RotateCcw } from "lucide-react";
import type React from "react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

// ============================================================================
// CONSTANTS
// ============================================================================

const AVAILABLE_POSITIONS = [
	{ value: "top", label: "Top", icon: "⬆️" },
	{ value: "bottom", label: "Bottom", icon: "⬇️" },
	{ value: "left", label: "Left", icon: "⬅️" },
	{ value: "right", label: "Right", icon: "➡️" },
] as const;

const HANDLE_TYPE_COLORS = {
	source: "text-green-600 dark:text-green-400",
	target: "text-blue-600 dark:text-blue-400",
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface HandleOverride {
	handleId: string;
	position: "top" | "bottom" | "left" | "right";
}

interface HandlePositionEditorProps {
	node: AgenNode;
	handles: NodeHandleSpec[];
	updateNodeData: (nodeId: string, patch: Record<string, unknown>) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const HandlePositionEditor: React.FC<HandlePositionEditorProps> = ({
	node,
	handles,
	updateNodeData,
}) => {
	// Get current handle overrides from node data
	const currentOverrides = useMemo(() => {
		const overrides = (node.data as any)?.handleOverrides as HandleOverride[] | undefined;
		return overrides || [];
	}, [node.data]);

	// Create map for quick lookup of current positions
	const positionMap = useMemo(() => {
		const map = new Map<string, string>();
		
		// Set default positions from handle specs
		handles.forEach(handle => {
			map.set(handle.id, handle.position);
		});

		// Apply overrides
		currentOverrides.forEach(override => {
			map.set(override.handleId, override.position);
		});

		return map;
	}, [handles, currentOverrides]);

	// Handle position change for a specific handle
	const handlePositionChange = useCallback((handleId: string, newPosition: string) => {
		const updatedOverrides = [...currentOverrides];
		
		// Find existing override or create new one
		const existingIndex = updatedOverrides.findIndex(o => o.handleId === handleId);
		const originalHandle = handles.find(h => h.id === handleId);
		
		if (!originalHandle) {
			toast.error("Handle not found");
			return;
		}

		// If new position matches original, remove override
		if (newPosition === originalHandle.position) {
			if (existingIndex >= 0) {
				updatedOverrides.splice(existingIndex, 1);
			}
		} else {
			// Add or update override
			const override: HandleOverride = { handleId, position: newPosition as any };
			if (existingIndex >= 0) {
				updatedOverrides[existingIndex] = override;
			} else {
				updatedOverrides.push(override);
			}
		}

		// Update node data immediately
		updateNodeData(node.id, {
			handleOverrides: updatedOverrides,
		});

		// Immediate feedback
		toast.success(`Handle "${handleId}" moved to ${newPosition}`);
	}, [currentOverrides, handles, node.id, updateNodeData]);

	// Reset all positions to defaults
	const handleResetAll = useCallback(() => {
		updateNodeData(node.id, {
			handleOverrides: [],
		});
		toast.success("All handle positions reset to defaults");
	}, [node.id, updateNodeData]);

	// Group handles by type
	const handlesByType = useMemo(() => {
		const inputs = handles.filter(h => h.type === "target");
		const outputs = handles.filter(h => h.type === "source");
		return { inputs, outputs };
	}, [handles]);

	const hasOverrides = currentOverrides.length > 0;

	if (handles.length === 0) {
		return (
			<div className="text-center text-muted-foreground text-sm py-4">
				No handles available for this node
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Header with reset button */}
			<div className="flex items-center justify-between">
				<div className="text-sm font-medium text-foreground">
					Handle Positions
				</div>
				{hasOverrides && (
					<Button
						variant="outline"
						size="sm"
						onClick={handleResetAll}
						className="h-7 px-2 text-xs"
					>
						<RotateCcw className="h-3 w-3 mr-1" />
						Reset All
					</Button>
				)}
			</div>

			{/* Input Handles */}
			{handlesByType.inputs.length > 0 && (
				<div className="space-y-2">
					<div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
						Input Handles ({handlesByType.inputs.length})
					</div>
					{handlesByType.inputs.map((handle) => {
						const currentPosition = positionMap.get(handle.id) || handle.position;
						const isOverridden = currentOverrides.some(o => o.handleId === handle.id);
						
						return (
							<div key={handle.id} className="flex items-center justify-between gap-3 p-2 rounded-md border border-border/30 bg-muted/10">
								<div className="flex items-center gap-2 min-w-0 flex-1">
									<div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
									<div className="min-w-0 flex-1">
										<div className="font-mono text-xs text-foreground truncate">
											{handle.id}
										</div>
										<div className="text-xs text-muted-foreground">
											{handle.dataType || "any"} • {isOverridden && <span className="text-orange-500">custom</span>}
										</div>
									</div>
								</div>
								<Select
									value={currentPosition}
									onValueChange={(value) => handlePositionChange(handle.id, value)}
								>
									<SelectTrigger className="w-24 h-7 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{AVAILABLE_POSITIONS.map((pos) => (
											<SelectItem key={pos.value} value={pos.value} className="text-xs">
												<span className="flex items-center gap-1">
													{pos.icon} {pos.label}
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						);
					})}
				</div>
			)}

			{/* Separator */}
			{handlesByType.inputs.length > 0 && handlesByType.outputs.length > 0 && (
				<Separator />
			)}

			{/* Output Handles */}
			{handlesByType.outputs.length > 0 && (
				<div className="space-y-2">
					<div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
						Output Handles ({handlesByType.outputs.length})
					</div>
					{handlesByType.outputs.map((handle) => {
						const currentPosition = positionMap.get(handle.id) || handle.position;
						const isOverridden = currentOverrides.some(o => o.handleId === handle.id);
						
						return (
							<div key={handle.id} className="flex items-center justify-between gap-3 p-2 rounded-md border border-border/30 bg-muted/10">
								<div className="flex items-center gap-2 min-w-0 flex-1">
									<div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
									<div className="min-w-0 flex-1">
										<div className="font-mono text-xs text-foreground truncate">
											{handle.id}
										</div>
										<div className="text-xs text-muted-foreground">
											{handle.dataType || "any"} • {isOverridden && <span className="text-orange-500">custom</span>}
										</div>
									</div>
								</div>
								<Select
									value={currentPosition}
									onValueChange={(value) => handlePositionChange(handle.id, value)}
								>
									<SelectTrigger className="w-24 h-7 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{AVAILABLE_POSITIONS.map((pos) => (
											<SelectItem key={pos.value} value={pos.value} className="text-xs">
												<span className="flex items-center gap-1">
													{pos.icon} {pos.label}
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						);
					})}
				</div>
			)}

			{/* Override Summary */}
			{hasOverrides && (
				<div className="mt-3 p-2 rounded-md bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
					<div className="text-xs text-orange-700 dark:text-orange-300">
						<strong>{currentOverrides.length}</strong> handle{currentOverrides.length !== 1 ? 's' : ''} using custom positions
					</div>
				</div>
			)}
		</div>
	);
};