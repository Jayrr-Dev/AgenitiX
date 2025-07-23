/**
 * HANDLE MANAGEMENT CONTROL - Comprehensive handle management interface
 *
 * • Allows adding, removing, and hiding handles for nodes
 * • Integrates with NodeSpec system for type-safe handle operations
 * • Provides visual feedback for handle states and connections
 * • Supports handle type selection and position configuration
 * • Maintains consistency with existing node inspector controls
 *
 * Keywords: handle-management, node-inspector, handle-controls, add-remove-hide
 */

"use client";

import type React from "react";
import { useCallback, useMemo, useState } from "react";
import type { AgenNode } from "../../flow-engine/types/nodeData";
import { BaseControl, ActionButton, EnhancedInput } from "./BaseControl";
import { NodeInspectorAdapter } from "../adapters/NodeInspectorAdapter";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface HandleInfo {
	id: string;
	type: "source" | "target";
	dataType?: string;
	code?: string;
	tsSymbol?: string;
	position: "left" | "right" | "top" | "bottom";
	isHidden?: boolean;
	isCustom?: boolean;
}

interface HandleManagementControlProps {
	node: AgenNode;
	updateNodeData: (id: string, patch: Record<string, unknown>) => void;
	onLogError?: (nodeId: string, message: string) => void;
}

interface NewHandleForm {
	id: string;
	type: "source" | "target";
	dataType: string;
	position: "left" | "right" | "top" | "bottom";
}

// ============================================================================
// CONSTANTS
// ============================================================================

const HANDLE_TYPES = [
	{ value: "j", label: "JSON", description: "JavaScript Object Notation" },
	{ value: "s", label: "String", description: "Text data" },
	{ value: "n", label: "Number", description: "Numeric data" },
	{ value: "b", label: "Boolean", description: "True/false values" },
	{ value: "a", label: "Array", description: "Ordered collection" },
	{ value: "o", label: "Object", description: "Key-value pairs" },
	{ value: "x", label: "Any", description: "Unrestricted type" },
] as const;

const HANDLE_POSITIONS = [
	{ value: "left", label: "Left", description: "Input handles" },
	{ value: "right", label: "Right", description: "Output handles" },
	{ value: "top", label: "Top", description: "Input handles" },
	{ value: "bottom", label: "Bottom", description: "Output handles" },
] as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const HandleManagementControl: React.FC<HandleManagementControlProps> = ({
	node,
	updateNodeData,
	onLogError,
}) => {
	// State for new handle form
	const [newHandleForm, setNewHandleForm] = useState<NewHandleForm>({
		id: "",
		type: "target",
		dataType: "j",
		position: "left",
	});

	// State for form visibility
	const [showAddForm, setShowAddForm] = useState(false);

	// Get node info and current handles
	const nodeInfo = NodeInspectorAdapter.getNodeInfo(node.type as any);
	const currentHandles = useMemo(() => {
		const baseHandles = nodeInfo?.handles || [];
		const customHandles = (node.data as any)?.customHandles || [];
		const hiddenHandles = (node.data as any)?.hiddenHandles || [];
		
		return baseHandles.map(handle => ({
			...handle,
			isHidden: hiddenHandles.includes(handle.id),
			isCustom: false,
		})).concat(customHandles.map((handle: any) => ({
			...handle,
			isHidden: hiddenHandles.includes(handle.id),
			isCustom: true,
		})));
	}, [nodeInfo, node.data]);

	// ============================================================================
	// HANDLE OPERATIONS - All operations are now independent and self-contained
	// ============================================================================

	// ============================================================================
	// RENDER HELPERS
	// ============================================================================

	const renderHandleItem = useCallback((handle: HandleInfo) => {
		const handleType = HANDLE_TYPES.find(t => t.value === handle.dataType);
		const position = HANDLE_POSITIONS.find(p => p.value === handle.position);
		
		const handleRemove = () => {
			const currentCustomHandles = (node.data as any)?.customHandles || [];
			const updatedCustomHandles = currentCustomHandles.filter((h: any) => h.id !== handle.id);
			updateNodeData(node.id, {
				customHandles: updatedCustomHandles,
			});
		};

		const handleToggle = () => {
			const currentHiddenHandles = (node.data as any)?.hiddenHandles || [];
			const isCurrentlyHidden = currentHiddenHandles.includes(handle.id);
			const newHiddenHandles = isCurrentlyHidden
				? currentHiddenHandles.filter((id: string) => id !== handle.id)
				: [...currentHiddenHandles, handle.id];
			updateNodeData(node.id, {
				hiddenHandles: newHiddenHandles,
			});
		};
		
		return (
			<div key={handle.id} className={`p-2 rounded border transition-all duration-200 ${
				handle.isHidden 
					? 'bg-muted/30 border-muted/50 opacity-50 grayscale' 
					: 'bg-muted/20 border-border/50'
			}`}>
				<div className="flex items-center justify-between mb-1">
					<div className="flex items-center gap-2">
						<span className={`w-2 h-2 rounded-full ${
							handle.type === 'source' ? 'bg-green-500' : 'bg-blue-500'
						}`} title={handle.type} />
						<span className={`text-xs font-medium ${
							handle.isHidden ? 'text-muted-foreground line-through' : 'text-foreground'
						}`}>
							{handle.id}
						</span>
						{handle.isCustom && (
							<span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded">
								Custom
							</span>
						)}
						{handle.isHidden && (
							<span className="text-xs px-1 py-0.5 bg-orange-100 text-orange-700 rounded">
								Hidden
							</span>
						)}
					</div>
					<div className="flex items-center gap-1">
						{handle.isCustom && (
							<ActionButton
								onClick={handleRemove}
								variant="danger"
								className="text-xs px-2 py-1"
								nodeType={node.type as string}
							>
								Remove
							</ActionButton>
						)}
						<ActionButton
							onClick={handleToggle}
							variant={handle.isHidden ? "primary" : "secondary"}
							className="text-xs px-2 py-1"
							nodeType={node.type as string}
						>
							{handle.isHidden ? "Show" : "Hide"}
						</ActionButton>
					</div>
				</div>
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<span>{handleType?.label || handle.dataType}</span>
					<span>•</span>
					<span>{position?.label}</span>
					<span>•</span>
					<span className="capitalize">{handle.type}</span>
				</div>
			</div>
		);
	}, [node.id, node.data, node.type, updateNodeData]);

	const renderAddHandleForm = useCallback(() => {
		if (!showAddForm) return null;

		const handleAdd = () => {
			if (!newHandleForm.id.trim()) {
				onLogError?.(node.id, "Handle ID is required");
				return;
			}

			// Check if handle ID already exists
			if (currentHandles.some(h => h.id === newHandleForm.id)) {
				onLogError?.(node.id, `Handle with ID "${newHandleForm.id}" already exists`);
				return;
			}

			const newHandle: HandleInfo = {
				id: newHandleForm.id,
				type: newHandleForm.type,
				dataType: newHandleForm.dataType,
				position: newHandleForm.position,
				isCustom: true,
			};

			const customHandles = (node.data as any)?.customHandles || [];
			updateNodeData(node.id, {
				customHandles: [...customHandles, newHandle],
			});

			// Reset form
			setNewHandleForm({
				id: "",
				type: "target",
				dataType: "j",
				position: "left",
			});
			setShowAddForm(false);
		};

		return (
			<div className="p-3 bg-muted/30 rounded border border-border/50 space-y-3">
				<div className="flex items-center justify-between">
					<span className="text-xs font-medium text-foreground">Add New Handle</span>
					<ActionButton
						onClick={() => setShowAddForm(false)}
						variant="secondary"
						className="text-xs px-2 py-1"
						nodeType={node.type as string}
					>
						Cancel
					</ActionButton>
				</div>
				
				<div className="space-y-2">
					<div>
						<label className="block text-xs font-medium text-foreground mb-1">
							Handle ID
						</label>
						<EnhancedInput
							value={newHandleForm.id}
							onChange={(value) => setNewHandleForm(prev => ({ ...prev, id: value }))}
							placeholder="Enter handle ID..."
							nodeType={node.type as string}
						/>
					</div>
					
					<div className="grid grid-cols-2 gap-2">
						<div>
							<label className="block text-xs font-medium text-foreground mb-1">
								Type
							</label>
							<select
								value={newHandleForm.type}
								onChange={(e) => setNewHandleForm(prev => ({ 
									...prev, 
									type: e.target.value as "source" | "target" 
								}))}
								className="w-full text-xs px-2 py-1.5 rounded border bg-control-input dark:bg-control-input-dark text-control-input border-control-input focus:border-control-input-focus focus:outline-none"
							>
								<option value="target">Input (Target)</option>
								<option value="source">Output (Source)</option>
							</select>
						</div>
						<div>
							<label className="block text-xs font-medium text-foreground mb-1">
								Data Type
							</label>
							<select
								value={newHandleForm.dataType}
								onChange={(e) => setNewHandleForm(prev => ({ 
									...prev, 
									dataType: e.target.value 
								}))}
								className="w-full text-xs px-2 py-1.5 rounded border bg-control-input dark:bg-control-input-dark text-control-input border-control-input focus:border-control-input-focus focus:outline-none"
							>
								{HANDLE_TYPES.map(type => (
									<option key={type.value} value={type.value}>
										{type.label}
									</option>
								))}
							</select>
						</div>
					</div>
					
					<div>
						<label className="block text-xs font-medium text-foreground mb-1">
							Position
						</label>
						<select
							value={newHandleForm.position}
							onChange={(e) => setNewHandleForm(prev => ({ 
								...prev, 
								position: e.target.value as "left" | "right" | "top" | "bottom" 
							}))}
							className="w-full text-xs px-2 py-1.5 rounded border bg-control-input dark:bg-control-input-dark text-control-input border-control-input focus:border-control-input-focus focus:outline-none"
						>
							{HANDLE_POSITIONS.map(pos => (
								<option key={pos.value} value={pos.value}>
									{pos.label}
								</option>
							))}
						</select>
					</div>
					
					<div className="flex items-center gap-2 pt-2">
						<ActionButton
							onClick={handleAdd}
							variant="primary"
							className="text-xs px-3 py-1.5"
							nodeType={node.type as string}
						>
							Add Handle
						</ActionButton>
					</div>
				</div>
			</div>
		);
	}, [showAddForm, newHandleForm, currentHandles, node.id, node.data, node.type, updateNodeData, onLogError]);

	// ============================================================================
	// MAIN RENDER
	// ============================================================================

	return (
		<BaseControl title="Handle Management" nodeType={node.type as string}>
			<div className="space-y-3">
				{/* Summary */}
				<div className="flex items-center justify-between text-xs">
					<span className="text-muted-foreground">
						{currentHandles.length} total handles
					</span>
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground">
							{currentHandles.filter(h => h.isHidden).length} hidden
						</span>
						{currentHandles.filter(h => h.isHidden).length > 0 && (
							<span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
								Toggle to show
							</span>
						)}
					</div>
				</div>

				{/* Add Handle Button */}
				<div className="flex items-center gap-2">
					<ActionButton
						onClick={() => setShowAddForm(!showAddForm)}
						variant="primary"
						className="text-xs px-3 py-1.5"
						nodeType={node.type as string}
					>
						{showAddForm ? "Cancel" : "Add Handle"}
					</ActionButton>
				</div>

				{/* Add Handle Form */}
				{renderAddHandleForm()}

				{/* Handle List */}
				<div className="space-y-2">
					{currentHandles.length > 0 ? (
						currentHandles.map(renderHandleItem)
					) : (
						<div className="text-xs text-muted-foreground/60 text-center py-2">
							No handles defined for this node
						</div>
					)}
				</div>

				{/* Help Text */}
				<div className="text-xs text-muted-foreground/60 p-2 bg-muted/20 rounded border border-border/30">
					<div className="font-medium mb-1">Handle Management Tips:</div>
					<ul className="space-y-0.5 text-xs">
						<li>• Custom handles can be added, removed, or hidden</li>
						<li>• Built-in handles can only be hidden</li>
						<li>• Hidden handles won't appear on the node</li>
						<li>• Handle IDs must be unique</li>
					</ul>
				</div>
			</div>
		</BaseControl>
	);
}; 