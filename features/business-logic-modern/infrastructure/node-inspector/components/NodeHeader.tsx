/**
 * NODE HEADER COMPONENT - Node identification and action controls interface
 *
 * • Displays node type, ID, and label with inline editing capabilities
 * • Provides node action buttons (duplicate, delete, rename) with tooltips
 * • Shows node status indicators and validation states
 * • Includes inspector lock controls and keyboard shortcut support
 * • Renders node metadata and connection information
 * • Enhanced with modern registry integration for rich metadata
 *
 * Keywords: node-header, inline-editing, actions, status, shortcuts, metadata, registry-integration
 */

"use client";

import { useNodeDisplay } from "@/features/business-logic-modern/infrastructure/flow-engine/contexts/NodeDisplayContext";
import { useTextInputShortcuts } from "@flow-engine/hooks/useTextInputShortcuts";
import type React from "react";
import { useCallback, useState } from "react";

// MODERN REGISTRY INTEGRATION - No longer needed here
// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface NodeHeaderProps {
	nodeId: string;
	displayName: string;
	category?: string;
	icon?: string;
	description?: string;
	onUpdateNodeId?: (oldId: string, newId: string) => void;
	onDeleteNode?: (nodeId: string) => void;
	onDuplicateNode?: (nodeId: string) => void;
	inspectorState: {
		locked: boolean;
		setLocked: (locked: boolean) => void;
	};
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const NodeHeader: React.FC<NodeHeaderProps> = ({
	nodeId,
	displayName,
	category,
	icon,
	description,
	onUpdateNodeId,
	onDeleteNode,
	onDuplicateNode,
	inspectorState,
}) => {
	// STATE MANAGEMENT
	const [isEditingId, setIsEditingId] = useState(false);
	const [editingId, setEditingId] = useState(nodeId);
	const { showNodeIds, setShowNodeIds } = useNodeDisplay();

	// EVENT HANDLERS
	const handleIdEdit = useCallback(() => {
		setIsEditingId(true);
		setEditingId(nodeId);
	}, [nodeId]);

	const handleIdSave = useCallback(() => {
		const trimmedId = editingId.trim();

		// Validate the new ID
		if (!trimmedId) {
			setEditingId(nodeId);
			setIsEditingId(false);
			return;
		}

		// If ID changed and we have an update handler, call it
		if (trimmedId !== nodeId && onUpdateNodeId) {
			onUpdateNodeId(nodeId, trimmedId);
		}

		setIsEditingId(false);
	}, [editingId, nodeId, onUpdateNodeId]);

	const handleIdCancel = useCallback(() => {
		setEditingId(nodeId);
		setIsEditingId(false);
	}, [nodeId]);

	// ERGONOMIC TEXT INPUT SHORTCUTS - Alt+Q (backspace) and Alt+W (enter)
	const textInputShortcuts = useTextInputShortcuts({
		value: editingId,
		setValue: setEditingId,
		onEnter: handleIdSave,
	});

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			// First, let the text input shortcuts handle Alt+Q and Alt+W
			textInputShortcuts.handleKeyDown(e);

			// Then handle existing shortcuts (Enter/Escape) if not already handled
			if (!e.defaultPrevented) {
				if (e.key === "Enter") {
					handleIdSave();
				} else if (e.key === "Escape") {
					handleIdCancel();
				}
			}
		},
		[handleIdSave, handleIdCancel, textInputShortcuts]
	);

	// ============================================================================
	// RENDER
	// ============================================================================

	return (
		<div className="border-b border-gray-200 dark:border-gray-700 pb-2">
			{/* HEADER ROW - Icon, Name, Status */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					{/* REGISTRY-ENHANCED ICON */}
					{icon && (
						<span className="text-lg" title={`${displayName} • Category: ${category}`}>
							{icon}
						</span>
					)}

					{/* DISPLAY NAME - Registry-enhanced */}
					<h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{displayName}</h3>
				</div>
			</div>

			{/* ENHANCED DESCRIPTION - From registry metadata */}
			{description && (
				<div className="mt-1 text-xs text-gray-600 dark:text-gray-400 italic">{description}</div>
			)}

			{/* NODE ID & ACTIONS ROW */}
			<div className="flex items-center justify-between mt-2">
				<div className="flex items-center gap-2">
					{isEditingId ? (
						<input
							type="text"
							value={editingId}
							onChange={(e) => setEditingId(e.target.value)}
							onKeyDown={handleKeyDown}
							onBlur={handleIdCancel}
							className="bg-gray-100 dark:bg-gray-800 text-xs p-1 rounded border border-blue-500"
							autoFocus
						/>
					) : (
						showNodeIds && (
							<span
								className="text-xs text-gray-500 dark:text-gray-400 font-mono cursor-pointer"
								onDoubleClick={handleIdEdit}
								title="Double-click to edit ID"
							>
								ID: {nodeId}
							</span>
						)
					)}
				</div>

				{/* Action Buttons */}
				<div className="flex items-center gap-2">
					{onDuplicateNode && (
						<button
							type="button"
							onClick={() => onDuplicateNode(nodeId)}
							className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
							title="Duplicate Node (Alt+D)"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
						</button>
					)}
					{onDeleteNode && (
						<button
							type="button"
							onClick={() => onDeleteNode(nodeId)}
							className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
							title="Delete Node (Delete)"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					)}
				</div>
			</div>
		</div>
	);
};
