/**
 * ACTION TOOLBAR - Optimized toolbar for workflow editor actions
 *
 * • High-performance undo/redo buttons with keyboard shortcut support
 * • History panel toggle for viewing action timeline
 * • Fullscreen mode toggle (browser environments only)
 * • Theme switcher for light/dark/system mode selection
 * • Optimized environment detection and class generation
 * • Centralized component theming with performance optimization
 * • Delete and duplicate node buttons (only enabled when node selected)
 * • Reduced re-renders through optimized memoization and class constants
 *
 * Keywords: toolbar, undo-redo, history, fullscreen, shortcuts, theming, theme-switcher, node-actions, performance-optimized
 */

"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { History, Maximize, Minimize, RotateCcw, RotateCw, Copy, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useComponentButtonClasses, useComponentClasses } from "../theming/components";
import { useUndoRedo } from "./history/undo-redo-context";
import { useSelectedNodeId, useSelectedNode, useAddNode, useRemoveNode, useSelectNode } from "../flow-engine/stores/flowStore";
import type { AgenNode } from "../flow-engine/types/nodeData";
import { useFlowMetadataOptional } from "../flow-engine/contexts/flow-metadata-context";

interface ActionToolbarProps {
	showHistoryPanel: boolean;
	onToggleHistory: () => void;
	className?: string;
}

interface ExtendedWindow extends Window {
	electronAPI?: unknown;
	require?: unknown;
	__TAURI__?: unknown;
}

// Top-level constants for better performance, basically prevents recreation on every render
const BUTTON_ICON_SIZE = "h-4 w-4";
const DIVIDER_STYLES = "mx-1 h-6 w-px bg-[var(--infra-toolbar-border)]";

// Optimized environment detection utility, basically cache-friendly detection
const detectBrowserEnvironment = (): boolean => {
	if (typeof window === "undefined") return false;
	
	const extWindow = window as ExtendedWindow;
	const isElectron = extWindow.electronAPI !== undefined || 
		extWindow.require !== undefined || 
		(typeof process !== "undefined" && process.versions?.electron);
	const isTauri = extWindow.__TAURI__ !== undefined;
	
	return !isElectron && !isTauri;
};

const ActionToolbar: React.FC<ActionToolbarProps> = ({
	showHistoryPanel,
	onToggleHistory,
	className = "",
}) => {
	const { undo, redo, getHistory } = useUndoRedo();
	const { canUndo, canRedo } = getHistory();
	const [isFullscreen, setIsFullscreen] = useState(false);
	
	// Optimized environment detection with useMemo, basically prevents recalculation
	const isBrowserEnvironment = useMemo(() => detectBrowserEnvironment(), []);

	// Flow store for node operations with optimized selectors, basically reduces subscription overhead
	const selectedNodeId = useSelectedNodeId();
	const removeNode = useRemoveNode();
	const addNode = useAddNode();
	const selectNode = useSelectNode();
	
	// Use optimized selector for selected node, basically prevents unnecessary re-renders
	const selectedNode = useSelectedNode();

	// Get flow metadata for permission checking
	const flowMetadata = useFlowMetadataOptional();
	const canEdit = flowMetadata?.flow?.canEdit ?? true; // Default to true for backward compatibility

	// Optimize themed classes with better memoization, basically cache class strings
	const containerClasses = useMemo(
		() => `flex items-center gap-1 p-1 ${className}`,
		[className]
	);
	
	const themedContainerClasses = useComponentClasses(
		"actionToolbar",
		"default",
		containerClasses
	);
	
	const buttonClasses = useComponentButtonClasses("actionToolbar", "ghost", "sm");
	const activeButtonClasses = useComponentButtonClasses("actionToolbar", "primary", "sm");

	// Simplified event handlers, basically reduce useCallback overhead
	const handleDeleteNode = useCallback(() => {
		if (selectedNodeId) {
			removeNode(selectedNodeId);
		}
	}, [selectedNodeId, removeNode]);

	const handleDuplicateNode = useCallback(() => {
		if (!selectedNode) return;

		// Optimized node duplication with stable ID generation, basically prevents ID collisions
		const newId = `${selectedNode.id}-copy-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
		
		// Create new node with proper type preservation and minimal spread
		const newNode = {
			...selectedNode,
			id: newId,
			position: {
				x: selectedNode.position.x + 40,
				y: selectedNode.position.y + 40,
			},
			selected: false,
			data: { ...selectedNode.data },
		} as AgenNode;

		// Batch operations to prevent multiple store updates
		addNode(newNode);
		selectNode(newId);
	}, [selectedNode, addNode, selectNode]);

	// Optimized fullscreen state management with single useEffect, basically reduces event listeners
	useEffect(() => {
		if (!isBrowserEnvironment) return;

		const checkFullscreen = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "F11") {
				e.preventDefault();
				toggleFullscreen();
			}
		};

		// Initialize fullscreen state
		checkFullscreen();
		
		// Add event listeners
		document.addEventListener("fullscreenchange", checkFullscreen);
		document.addEventListener("keydown", handleKeyDown);
		
		// Cleanup
		return () => {
			document.removeEventListener("fullscreenchange", checkFullscreen);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isBrowserEnvironment]); // eslint-disable-line react-hooks/exhaustive-deps

	const toggleFullscreen = async () => {
		if (!isBrowserEnvironment) {
			return;
		}

		try {
			if (document.fullscreenElement) {
				await document.exitFullscreen();
			} else {
				await document.documentElement.requestFullscreen();
			}
		} catch (error) {
			console.error("Error toggling fullscreen:", error);
		}
	};

	return (
		<div className={themedContainerClasses}>
			{/* NODE ACTION BUTTONS - Only show if user can edit */}
			{selectedNodeId && canEdit && (
				<>
					<button
						type="button"
						onClick={handleDuplicateNode}
						className={buttonClasses}
						title="Duplicate (Ctrl+D)"
						aria-label="Duplicate node"
					>
						<Copy className={BUTTON_ICON_SIZE} />
					</button>

					<button
						type="button"
						onClick={handleDeleteNode}
						className={buttonClasses}
						title="Delete (Delete)"
						aria-label="Delete node"
					>
						<Trash2 className={BUTTON_ICON_SIZE} />
					</button>

					<div className={DIVIDER_STYLES} />
				</>
			)}

			<button
				type="button"
				onClick={() => undo()}
				disabled={!canUndo}
				className={buttonClasses}
				title="Undo (Ctrl+Z)"
			>
				<RotateCcw className={BUTTON_ICON_SIZE} />
			</button>

			<button
				type="button"
				onClick={() => redo()}
				disabled={!canRedo}
				className={buttonClasses}
				title="Redo (Ctrl+Y)"
			>
				<RotateCw className={BUTTON_ICON_SIZE} />
			</button>

			<div className={DIVIDER_STYLES} />

			<button
				type="button"
				onClick={onToggleHistory}
				className={showHistoryPanel ? activeButtonClasses : buttonClasses}
				title="History (Ctrl+H)"
			>
				<History className={BUTTON_ICON_SIZE} />
			</button>

			{/* FULLSCREEN SECTION - Only show in browser environments */}
			{isBrowserEnvironment && (
				<>
					<div className={DIVIDER_STYLES} />

					<div className="flex items-center">
						<ThemeSwitcher />
					</div>

					<button
						type="button"
						onClick={toggleFullscreen}
						className={isFullscreen ? activeButtonClasses : buttonClasses}
						title={isFullscreen ? "Exit (F11)" : "Fullscreen (F11)"}
						aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
					>
						{isFullscreen ? <Minimize className={BUTTON_ICON_SIZE} /> : <Maximize className={BUTTON_ICON_SIZE} />}
					</button>
				</>
			)}
		</div>
	);
};

// Enhanced memoization for better performance, basically comprehensive prop comparison
const ActionToolbarMemo = React.memo(ActionToolbar, (prevProps, nextProps) => {
	// Compare all props for precise re-render control
	return (
		prevProps.showHistoryPanel === nextProps.showHistoryPanel &&
		prevProps.className === nextProps.className
		// onToggleHistory is stable from parent (useCallback), so comparison not needed
	);
});

ActionToolbarMemo.displayName = "ActionToolbar";

export default ActionToolbarMemo;
