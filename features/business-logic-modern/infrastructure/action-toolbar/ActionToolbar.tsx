/**
 * ACTION TOOLBAR - Main toolbar for workflow editor actions
 *
 * • Provides undo/redo buttons with keyboard shortcut support
 * • History panel toggle for viewing action timeline
 * • Fullscreen mode toggle (browser environments only)
 * • Theme switcher for light/dark/system mode selection
 * • Environment detection for desktop vs browser features
 * • Now uses centralized component theming system
 * • Delete and duplicate node buttons (only enabled when node selected)
 *
 * Keywords: toolbar, undo-redo, history, fullscreen, shortcuts, theming, theme-switcher, node-actions
 */

"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { History, Maximize, Minimize, RotateCcw, RotateCw, Copy, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useComponentButtonClasses, useComponentClasses } from "../theming/components";
import { useUndoRedo } from "./history/undo-redo-context";
import { useSelectedNodeId, useSelectedNode, useAddNode, useRemoveNode, useSelectNode } from "../flow-engine/stores/flowStore";

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

const ActionToolbar: React.FC<ActionToolbarProps> = ({
	showHistoryPanel,
	onToggleHistory,
	className = "",
}) => {
	const { undo, redo, getHistory } = useUndoRedo();
	const { canUndo, canRedo } = getHistory();
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [isBrowserEnvironment, setIsBrowserEnvironment] = useState(false);

	// Flow store for node operations with optimized selectors, basically reduces subscription overhead
	const selectedNodeId = useSelectedNodeId();
	const removeNode = useRemoveNode();
	const addNode = useAddNode();
	const selectNode = useSelectNode();
	
	// Use optimized selector for selected node, basically prevents unnecessary re-renders
	const selectedNode = useSelectedNode();

	// Get themed classes
	const containerClasses = useComponentClasses(
		"actionToolbar",
		"default",
		`flex items-center gap-1 p-1 ${className}`
	);
	const buttonClasses = useComponentButtonClasses("actionToolbar", "ghost", "sm");
	const activeButtonClasses = useComponentButtonClasses("actionToolbar", "primary", "sm");

	// Optimized node action handlers with early returns, basically prevents unnecessary function calls
	const handleDeleteNode = useCallback(() => {
		if (!selectedNodeId) return;
		removeNode(selectedNodeId);
	}, [selectedNodeId, removeNode]);

	const handleDuplicateNode = useCallback(() => {
		if (!selectedNode) return;

		// Optimized node duplication with stable ID generation, basically prevents ID collisions
		const timestamp = Date.now();
		const randomSuffix = Math.floor(Math.random() * 10000);
		const newId = `${selectedNode.id}-copy-${timestamp}-${randomSuffix}`;
		
		// Create new node with spread optimization to prevent deep clone
		const newNode: AgenNode = {
			...selectedNode,
			id: newId,
			position: {
				x: selectedNode.position.x + 40,
				y: selectedNode.position.y + 40,
			},
			selected: false,
			data: { ...selectedNode.data },
		};

		// Batch operations to prevent multiple store updates
		addNode(newNode);
		selectNode(newId);
	}, [selectedNode, addNode, selectNode]);

	// Detect if running in browser vs desktop/Electron app
	useEffect(() => {
		const detectBrowserEnvironment = () => {
			// Check if we're in a browser environment (not Electron/desktop app)
			const isElectron =
				(typeof window !== "undefined" && (window as ExtendedWindow).electronAPI !== undefined) ||
				typeof (window as ExtendedWindow).require !== "undefined" ||
				(typeof process !== "undefined" && process.versions?.electron);

			const isTauri =
				typeof window !== "undefined" && (window as ExtendedWindow).__TAURI__ !== undefined;

			const isDesktopApp = isElectron || isTauri;

			// Only show fullscreen in browsers (not desktop apps)
			setIsBrowserEnvironment(!isDesktopApp);
		};

		detectBrowserEnvironment();
	}, []);

	// Check fullscreen state on mount and listen for changes (only in browser)
	useEffect(() => {
		if (!isBrowserEnvironment) {
			return;
		}

		const checkFullscreen = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};

		checkFullscreen();
		document.addEventListener("fullscreenchange", checkFullscreen);
		return () => document.removeEventListener("fullscreenchange", checkFullscreen);
	}, [isBrowserEnvironment]);

	// Keyboard shortcut for fullscreen (F11) - only in browser
	useEffect(() => {
		if (!isBrowserEnvironment) {
			return;
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "F11") {
				e.preventDefault();
				toggleFullscreen();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isBrowserEnvironment]);

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
		<div className={containerClasses}>
			{/* NODE ACTION BUTTONS - Optimized rendering with conditional memoization */}
			{selectedNodeId && (
				<>
					<button
						type="button"
						onClick={handleDuplicateNode}
						className={buttonClasses}
						title="Duplicate Node (Ctrl+D)"
						aria-label="Duplicate selected node"
					>
						<Copy className="h-4 w-4" />
					</button>

					<button
						type="button"
						onClick={handleDeleteNode}
						className={buttonClasses}
						title="Delete Node (Delete)"
						aria-label="Delete selected node"
					>
						<Trash2 className="h-4 w-4" />
					</button>

					<div className="mx-1 h-6 w-px bg-[var(--infra-toolbar-border)]" />
				</>
			)}

			<button
				type="button"
				onClick={() => undo()}
				disabled={!canUndo}
				className={buttonClasses}
				title="Undo (Ctrl+Z)"
			>
				<RotateCcw className="h-4 w-4" />
			</button>

			<button
				type="button"
				onClick={() => redo()}
				disabled={!canRedo}
				className={buttonClasses}
				title="Redo (Ctrl+Y)"
			>
				<RotateCw className="h-4 w-4" />
			</button>

			<div className="mx-1 h-6 w-px bg-[var(--infra-toolbar-border)]" />

			<button
				type="button"
				onClick={onToggleHistory}
				className={showHistoryPanel ? activeButtonClasses : buttonClasses}
				title="Toggle History Panel (Ctrl+H)"
			>
				<History className="h-4 w-4" />
			</button>

			{/* FULLSCREEN BUTTON - Only show in browser environments */}
			{isBrowserEnvironment && (
				<>
					<div className="mx-1 h-6 w-px bg-[var(--infra-toolbar-border)]" />

					{/* THEME SWITCHER */}
					{/* <div className="w-px h-6 bg-[var(--infra-toolbar-border)] mx-1" /> */}

					<div className="flex items-center">
						<ThemeSwitcher />
					</div>

					<button
						type="button"
						onClick={toggleFullscreen}
						className={isFullscreen ? activeButtonClasses : buttonClasses}
						title={isFullscreen ? "Exit Fullscreen (F11)" : "Enter Fullscreen (F11)"}
						aria-label={isFullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
					>
						{isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
					</button>
				</>
			)}
		</div>
	);
};

// Memoize the ActionToolbar to prevent unnecessary re-renders, basically improves performance
const ActionToolbarMemo = React.memo(ActionToolbar, (prevProps, nextProps) => {
	return (
		prevProps.showHistoryPanel === nextProps.showHistoryPanel &&
		prevProps.className === nextProps.className
		// onToggleHistory is stable from parent, so we don't need to compare it
	);
});

ActionToolbarMemo.displayName = "ActionToolbar";

export default ActionToolbarMemo;
