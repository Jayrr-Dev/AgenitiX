/**
 * BRANCH SELECTOR - UI component for multi-branch undo/redo
 *
 * • Displays available redo branches when multiple paths exist
 * • Allows users to choose which branch to redo to
 * • Shows branch preview with action descriptions
 * • Integrates seamlessly with the new graph-based undo/redo system
 *
 * Keywords: multi-branch, undo-redo-ui, branch-selection, user-interface
 */

"use client";

import React, { useCallback, useMemo } from "react";
import { useUndoRedo } from "./undo-redo-context";

interface BranchNode {
	id: string;
	label?: string;
	children?: BranchNode[];
}

interface BranchSelectorProps {
	className?: string;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({ className }) => {
	const { undo, redo, getHistory } = useUndoRedo();

	const historyData = useMemo(() => getHistory(), [getHistory]);
	const { canUndo, canRedo, branchOptions = [], currentNode } = historyData;

	const handleUndo = useCallback(() => {
		undo();
	}, [undo]);

	const handleRedo = useCallback(
		(branchId?: string) => {
			redo(branchId);
		},
		[redo]
	);

	// If no branches or only one branch, show simple undo/redo
	if (!branchOptions || branchOptions.length <= 1) {
		return (
			<div className={`flex gap-2 ${className || ""}`}>
				<button
					type="button"
					onClick={handleUndo}
					disabled={!canUndo}
					className="rounded bg-[var(--infra-toolbar-bg)] px-3 py-1 text-sm hover:bg-[var(--infra-toolbar-bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
					title="Undo"
				>
					↶ Undo
				</button>
				<button
					type="button"
					onClick={() => handleRedo()}
					disabled={!canRedo}
					className="rounded bg-[var(--infra-toolbar-bg)] px-3 py-1 text-sm hover:bg-[var(--infra-toolbar-bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
					title="Redo"
				>
					↷ Redo
				</button>
			</div>
		);
	}

	// Multi-branch UI
	return (
		<div className={`flex items-center gap-2 ${className || ""}`}>
			<button
				type="button"
				onClick={handleUndo}
				disabled={!canUndo}
				className="rounded bg-[var(--infra-toolbar-bg)] px-3 py-1 text-sm hover:bg-[var(--infra-toolbar-bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
				title="Undo"
			>
				↶ Undo
			</button>

			<div className="flex gap-1">
				<span className="px-2 py-1 text-gray-500 text-xs">Redo:</span>
				{branchOptions.map((branchId, index) => {
					// Get the branch node to show its label
					const branchNode = currentNode?.children?.find(
						(child: BranchNode) => child.id === branchId
					);
					const branchLabel = branchNode?.label || `Branch ${index + 1}`;

					return (
						<button
							type="button"
							key={branchId}
							onClick={() => handleRedo(branchId)}
							className="rounded border border-node-create-border bg-node-create px-2 py-1 text-node-create-text text-xs transition-colors hover:bg-node-create-hover"
							title={`Redo: ${branchLabel}`}
						>
							↷ {branchLabel.slice(0, 12)}
							{branchLabel.length > 12 ? "..." : ""}
						</button>
					);
				})}
			</div>
		</div>
	);
};

// Simple hook for undo/redo keyboard shortcuts
export const useUndoRedoShortcuts = () => {
	const { undo, redo } = useUndoRedo();

	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Skip if user is typing in an input
			if (event.target && (event.target as HTMLElement).tagName.match(/INPUT|TEXTAREA|SELECT/)) {
				return;
			}

			const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
			const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

			if (!ctrlKey) {
				return;
			}

			if (event.key === "z" && !event.shiftKey) {
				event.preventDefault();
				undo();
			} else if (event.key === "y" || (event.key === "z" && event.shiftKey)) {
				event.preventDefault();
				redo(); // Default redo (first branch)
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [undo, redo]);
};

export default BranchSelector;
