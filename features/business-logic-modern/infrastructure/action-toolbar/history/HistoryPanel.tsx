/**
 * HISTORY PANEL - Visual timeline of workflow editor actions
 *
 * • Expandable panel displaying chronological list of user actions
 * • Interactive history entries with jump-to-state functionality
 * • Visual indicators for action types with color-coded icons
 * • Undo/redo controls with clear history option
 * • Multi-branch support with graph-based navigation
 * • Responsive design with collapsible interface and timestamps
 * • Now uses centralized component theming system
 *
 * Keywords: history, timeline, actions, undo-redo, visual-indicators, panel, multi-branch, theming
 */

"use client";

import { AlertTriangle, Clock, GitBranch, List as ListIcon, Trash2, X } from "lucide-react";
import React, { Suspense, useCallback, useMemo, useState } from "react";
import type { HistoryNode } from "./historyGraph";
import { useUndoRedo } from "./undo-redo-context";
// Lazy-load the heavy ReactFlow-powered graph renderer only when needed for significant memory & bundle savings
const RenderHistoryGraph = React.lazy(() => import("./renderHistoryGraph"));

// STYLING CONSTANTS
const PANEL_STYLES = {
	base: "bg-[var(--infra-history-bg)] border border-[var(--infra-history-border)] rounded-lg shadow-lg overflow-hidden max-w-full min-w-0",
} as const;

const HEADER_STYLES = {
	container: "px-2 py-2 border-b border-border/50 bg-card/50 backdrop-blur-sm",
	layout: "flex items-center justify-between min-w-0 gap-1",
	collapseButton:
		"flex items-center gap-1 hover:bg-accent/50 px-1 py-1 rounded-lg transition-all duration-200 group -ml-1 flex-shrink-0",
	collapseIcon:
		"w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors duration-200",
	titleContainer: "flex items-center gap-1 min-w-0 flex-1",
	titleIcon: "w-3.5 h-3.5 text-primary flex-shrink-0",
	titleText: "text-sm font-semibold text-foreground tracking-tight truncate",
	titleBadge:
		"text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-1 py-0.5 rounded-full ml-1 flex-shrink-0",
	rightSection: "flex items-center gap-1 flex-shrink-0",
} as const;

const STATS_STYLES = {
	container: "flex items-center gap-1 text-xs flex-shrink-0",
	statesContainer: "flex items-center gap-0.5 flex-shrink-0",
	statesCount: "font-bold text-foreground text-xs",
	statesLabel: "text-muted-foreground font-medium hidden lg:inline",
	branchContainer:
		"flex items-center gap-0.5 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/50 border border-amber-200/50 dark:border-amber-800/50 px-1 py-0.5 rounded-full shadow-sm flex-shrink-0",
	branchIcon: "w-2.5 h-2.5 text-amber-600 dark:text-amber-400",
	branchCount: "font-bold text-amber-700 dark:text-amber-300 text-xs",
} as const;

const CONTROLS_STYLES = {
	container: "flex items-center gap-0.5 border-l border-border/30 pl-1.5 flex-shrink-0",
	button:
		"p-1 rounded hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0",
	buttonDisabled:
		"p-1 rounded hover:bg-accent hover:text-accent-foreground text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground disabled:hover:scale-100 transition-all duration-200 flex-shrink-0",
	buttonDestructive:
		"p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-sm flex-shrink-0",
	icon: "w-3 h-3",
	separator: "w-px h-3 bg-border/40 mx-0.5",
} as const;

const BRANCH_OPTIONS_STYLES = {
	container:
		"mx-3 mb-3 p-3 rounded-lg border border-amber-300 dark:border-amber-600 bg-amber-50/90 dark:bg-amber-900/90 backdrop-blur-sm shadow-lg",
	header: "flex items-center gap-2 mb-2",
	headerIcon: "w-4 h-4 text-amber-600 dark:text-amber-400",
	headerText: "text-sm font-medium text-amber-800 dark:text-amber-300",
	buttonContainer: "flex flex-wrap gap-2",
	button:
		"px-3 py-1.5 text-sm font-medium bg-amber-100 hover:bg-amber-200 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-800 dark:text-amber-200 rounded-md border border-amber-300 dark:border-amber-600 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm",
} as const;

const CONTENT_STYLES = {
	container:
		"max-h-64 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent [&::-webkit-scrollbar]:w-[2px] [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent",
	graphContainer: "h-64 bg-gradient-to-b from-background/50 to-muted/20 overflow-hidden",
	graphUnavailable:
		"flex items-center justify-center h-full text-muted-foreground bg-muted/20 rounded-lg m-4",
	graphUnavailableText: "text-sm font-medium",
	listContainer: "p-4 space-y-2",
} as const;

const EMPTY_STATE_STYLES = {
	container: "text-center py-12 text-muted-foreground",
	icon: "w-12 h-12 mx-auto mb-3 opacity-40",
	title: "text-sm font-medium",
	subtitle: "text-xs mt-1 opacity-70",
} as const;

const HISTORY_ITEM_STYLES = {
	base: "p-3 rounded-xl border transition-all duration-300 hover:shadow-md",
	current:
		"bg-gradient-to-r from-primary/10 to-primary/5 border-primary/40 text-primary shadow-lg ring-2 ring-primary/20 scale-[1.02]",
	default:
		"bg-card/50 border-border/50 hover:bg-accent/30 hover:border-primary/30 hover:shadow-lg hover:scale-[1.01] backdrop-blur-sm",
	future: "bg-card/30 border-border/30 opacity-60 hover:opacity-80 hover:bg-accent/20",
	clickable: "cursor-pointer active:scale-[0.99]",
	nonClickable: "cursor-default",
	layout: "flex items-center justify-between gap-4",
	leftSection: "flex items-center gap-3 min-w-0 flex-1",
	rightSection: "flex items-center gap-2.5 text-xs text-muted-foreground flex-shrink-0",
} as const;

const HISTORY_ITEM_INDICATOR_STYLES = {
	base: "w-2 h-2 rounded-full flex-shrink-0",
	current: "bg-primary",
	default: "bg-muted-foreground/40",
	future: "bg-muted-foreground/20",
} as const;

const HISTORY_ITEM_BADGE_STYLES = {
	base: "text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 shadow-sm",
	current: "bg-primary/20 text-primary border border-primary/40 shadow-md",
	default: "bg-muted/80 text-muted-foreground border border-border/50",
	future: "bg-muted/40 text-muted-foreground/50 border border-border/30",
} as const;

const HISTORY_ITEM_TEXT_STYLES = {
	base: "text-sm font-medium truncate",
	current: "text-primary",
	default: "text-foreground",
	future: "text-muted-foreground/60",
} as const;

const HISTORY_ITEM_META_STYLES = {
	timestamp: "font-mono",
	currentBadge: "text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full",
} as const;

const FOOTER_STYLES = {
	container: "p-2 border-t border-[var(--infra-history-border)] text-center",
	text: "text-xs text-[var(--infra-history-text)]",
} as const;

// MODAL STYLES
const MODAL_STYLES = {
	overlay: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4",
	container: "bg-background border border-border rounded-xl shadow-2xl max-w-md w-full mx-auto",
	header: "flex items-center gap-3 p-6 border-b border-border",
	headerIcon: "w-6 h-6 text-destructive flex-shrink-0",
	headerText: "text-lg font-semibold text-foreground",
	closeButton: "ml-auto p-1 hover:bg-accent rounded-md transition-colors",
	closeIcon: "w-4 h-4 text-muted-foreground hover:text-foreground",
	content: "p-6 space-y-4",
	warningBox: "bg-destructive/10 border border-destructive/20 rounded-lg p-4",
	warningText: "text-sm text-destructive-foreground font-medium",
	description: "text-sm text-muted-foreground leading-relaxed",
	impactBox: "bg-muted/50 border border-border rounded-lg p-3",
	impactTitle: "text-sm font-medium text-foreground mb-2",
	impactList: "text-sm text-muted-foreground space-y-1",
	footer: "flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/20",
	cancelButton:
		"px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-accent transition-all duration-200",
	deleteButton:
		"px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md transition-all duration-200 focus:ring-2 focus:ring-destructive/20",
} as const;

interface HistoryPanelProps {
	className?: string;
}

// DELETION CONFIRMATION MODAL
interface DeletionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	nodeLabel: string;
	childrenCount: number;
	isFullClear: boolean;
}

const DeletionModal: React.FC<DeletionModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	nodeLabel,
	childrenCount,
	isFullClear,
}) => {
	// Handle escape key
	React.useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscape);
			// Prevent body scroll
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = "unset";
		};
	}, [isOpen, onClose]);

	if (!isOpen) {
		return null;
	}

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (e.target === e.currentTarget) {
				onClose();
			}
		}
	};

	const handleConfirm = () => {
		onConfirm();
		onClose();
	};

	return (
		<div
			className={MODAL_STYLES.overlay}
			onClick={handleOverlayClick}
			onKeyDown={handleOverlayKeyDown}
			role="presentation"
			tabIndex={-1}
		>
			<dialog
				className={MODAL_STYLES.container}
				aria-modal="true"
				aria-labelledby="modal-title"
				open={true}
			>
				{/* Header */}
				<div className={MODAL_STYLES.header}>
					<AlertTriangle className={MODAL_STYLES.headerIcon} />
					<h2 id="modal-title" className={MODAL_STYLES.headerText}>
						{isFullClear ? "Clear All History" : "Delete History Node"}
					</h2>
					<button
						onClick={onClose}
						className={MODAL_STYLES.closeButton}
						aria-label="Close dialog"
						type="button"
					>
						<X className={MODAL_STYLES.closeIcon} />
					</button>
				</div>

				{/* Content */}
				<div className={MODAL_STYLES.content}>
					{/* Warning Box */}
					<div className={MODAL_STYLES.warningBox}>
						<p className={MODAL_STYLES.warningText}>⚠️ This action is irreversible</p>
					</div>

					{/* Description */}
					<p className={MODAL_STYLES.description}>
						{isFullClear
							? "You are about to permanently delete all history states. This will remove your entire undo/redo history and cannot be undone."
							: `You are about to permanently delete the history node "${nodeLabel}"${
									childrenCount > 0
										? ` and all ${childrenCount} dependent state${childrenCount === 1 ? "" : "s"}`
										: ""
								}.`}
					</p>

					{/* Impact Box */}
					{!isFullClear && (
						<div className={MODAL_STYLES.impactBox}>
							<h3 className={MODAL_STYLES.impactTitle}>What will be deleted:</h3>
							<div className={MODAL_STYLES.impactList}>
								<div>• The selected history state: "{nodeLabel}"</div>
								{childrenCount > 0 && (
									<div>
										• {childrenCount} dependent child state
										{childrenCount === 1 ? "" : "s"}
									</div>
								)}
								<div>• All associated undo/redo capabilities for these states</div>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className={MODAL_STYLES.footer}>
					<button onClick={onClose} className={MODAL_STYLES.cancelButton} type="button">
						Cancel
					</button>
					<button onClick={handleConfirm} className={MODAL_STYLES.deleteButton} type="button">
						{isFullClear ? "Clear All History" : "Delete Node"}
					</button>
				</div>
			</dialog>
		</div>
	);
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({ className = "" }) => {
	const { undo, redo, clearHistory, removeSelectedNode, getHistory, getFullGraph } = useUndoRedo();

	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [graphView, setGraphView] = useState(false);
	const [deletionModalOpen, setDeletionModalOpen] = useState(false);

	// GET HISTORY FROM CONTEXT - Updated for graph-based system
	const historyData = getHistory();
	const fullGraphData = getFullGraph();
	const { branchOptions = [], graphStats } = historyData;

	// Set selected node to current cursor when graph changes
	React.useEffect(() => {
		if (fullGraphData?.cursor) {
			setSelectedNodeId(fullGraphData.cursor);
		}
	}, [fullGraphData?.cursor]);

	// GET FULL LINEAR HISTORY (including future states) - Memoized
	const fullLinearHistory = useMemo(() => {
		if (!fullGraphData) {
			return [];
		}

		// Build the current branch timeline: path to cursor + available futures
		const currentPath: HistoryNode[] = [];
		let currentId: string | null = fullGraphData.cursor;

		// Trace back to root to build the main timeline
		while (currentId) {
			const node: HistoryNode | undefined = fullGraphData.nodes[currentId];
			if (!node) {
				break;
			}
			currentPath.unshift(node);
			currentId = node.parentId;
		}

		// Add future states (children of current cursor)
		const addFutureStates = (nodeId: string) => {
			const node: HistoryNode = fullGraphData.nodes[nodeId];
			if (!node) {
				return;
			}

			for (const childId of node.childrenIds || []) {
				const childNode = fullGraphData.nodes[childId];
				if (childNode) {
					currentPath.push(childNode);
					// Recursively add children (for deep future branches)
					addFutureStates(childId);
				}
			}
		};

		// Add immediate future states from cursor
		if (fullGraphData.cursor) {
			addFutureStates(fullGraphData.cursor);
		}

		return currentPath;
	}, [fullGraphData]);

	// Calculate current position in the timeline
	const currentIndexInTimeline = useMemo(() => {
		if (!fullGraphData || fullLinearHistory.length === 0) {
			return -1;
		}

		// Find path from root to the selected target node
		const pathToTarget: string[] = [];
		let currentId: string | null = fullGraphData.cursor;

		while (currentId) {
			const node: HistoryNode | undefined = fullGraphData.nodes[currentId];
			if (!node) {
				break;
			}
			pathToTarget.unshift(currentId);
			currentId = node.parentId;
		}

		// Build current path from root to cursor
		const currentPath: string[] = [];
		currentId = fullGraphData.cursor;

		while (currentId) {
			const node: HistoryNode | undefined = fullGraphData.nodes[currentId];
			if (!node) {
				break;
			}
			currentPath.unshift(currentId);
			currentId = node.parentId;
		}

		// The cursor position in linear history equals the path length to cursor
		return currentPath.length - 1;
	}, [fullGraphData, fullLinearHistory]);

	// Memoized callback functions
	const jumpToHistoryState = useCallback(
		(targetNodeId: string) => {
			if (!fullGraphData) {
				return;
			}

			// Find the target node
			const targetNode = fullGraphData.nodes[targetNodeId];
			if (!targetNode) {
				return;
			}

			// Build path from root to target
			const pathToTarget: string[] = [];
			let currentId: string | null = targetNodeId;

			while (currentId) {
				const node: HistoryNode | undefined = fullGraphData.nodes[currentId];
				if (!node) {
					break;
				}
				pathToTarget.unshift(currentId);
				currentId = node.parentId;
			}

			// Build current path from root to cursor
			const currentPath: string[] = [];
			let cursor: string | null = fullGraphData.cursor;

			while (cursor) {
				const node: HistoryNode = fullGraphData.nodes[cursor];
				if (!node) {
					break;
				}
				currentPath.unshift(cursor);
				cursor = node.parentId;
			}

			// Find common ancestor
			let commonIndex = 0;
			while (
				commonIndex < Math.min(pathToTarget.length, currentPath.length) &&
				pathToTarget[commonIndex] === currentPath[commonIndex]
			) {
				commonIndex++;
			}

			// Undo back to common ancestor
			const undoSteps = currentPath.length - commonIndex;
			for (let i = 0; i < undoSteps; i++) {
				undo();
			}

			// Redo forward to target
			const redoSteps = pathToTarget.length - commonIndex;
			for (let i = 0; i < redoSteps; i++) {
				// For branching, we need to specify which branch to take
				const nextNodeId = pathToTarget[commonIndex + i];
				redo(nextNodeId);
			}
		},
		[fullGraphData, undo, redo]
	);

	const formatTimestamp = useCallback((timestamp: number): string => {
		const now = Date.now();
		const diff = now - timestamp;

		if (diff < 1000) {
			return "now";
		}
		if (diff < 60000) {
			return `${Math.floor(diff / 1000)}s ago`;
		}
		if (diff < 3600000) {
			return `${Math.floor(diff / 60000)}m ago`;
		}
		if (diff < 86400000) {
			return `${Math.floor(diff / 3600000)}h ago`;
		}
		return `${Math.floor(diff / 86400000)}d ago`;
	}, []);

	const getActionIcon = useCallback((metadata: Record<string, unknown>): React.ReactNode => {
		const actionType = metadata?.actionType || "unknown";
		switch (actionType) {
			case "node_add":
				return "➕";
			case "node_delete":
				return "🗑️";
			case "node_update":
				return "✏️";
			case "node_move":
				return "🔄";
			case "edge_add":
				return "🔗";
			case "edge_delete":
				return "🔧";
			case "node_duplicate":
				return "📋";
			case "bulk_operation":
				return "🔥";
			default:
				return "⚪";
		}
	}, []);

	const getActionColor = useCallback((metadata: Record<string, unknown>): string => {
		const actionType = metadata?.actionType || "unknown";
		switch (actionType) {
			case "node_add":
				return "text-green-600 dark:text-green-400";
			case "node_delete":
				return "text-red-600 dark:text-red-400";
			case "node_update":
				return "text-blue-600 dark:text-blue-400";
			case "node_move":
				return "text-purple-600 dark:text-purple-400";
			case "edge_add":
				return "text-emerald-600 dark:text-emerald-400";
			case "edge_delete":
				return "text-orange-600 dark:text-orange-400";
			case "node_duplicate":
				return "text-cyan-600 dark:text-cyan-400";
			case "bulk_operation":
				return "text-amber-600 dark:text-amber-400";
			default:
				return "text-gray-600 dark:text-gray-400";
		}
	}, []);

	const getActionIndicatorStyle = useCallback(
		(metadata: Record<string, unknown>): React.CSSProperties => {
			const actionType = metadata?.actionType || "unknown";
			switch (actionType) {
				case "node_add":
					return { borderColor: "rgb(34 197 94)", backgroundColor: "rgba(34, 197, 94, 0.1)" };
				case "node_delete":
					return { borderColor: "rgb(239 68 68)", backgroundColor: "rgba(239, 68, 68, 0.1)" };
				case "node_update":
					return { borderColor: "rgb(59 130 246)", backgroundColor: "rgba(59, 130, 246, 0.1)" };
				case "node_move":
					return { borderColor: "rgb(147 51 234)", backgroundColor: "rgba(147, 51, 234, 0.1)" };
				case "edge_add":
					return { borderColor: "rgb(16 185 129)", backgroundColor: "rgba(16, 185, 129, 0.1)" };
				case "edge_delete":
					return { borderColor: "rgb(249 115 22)", backgroundColor: "rgba(249, 115, 22, 0.1)" };
				case "node_duplicate":
					return { borderColor: "rgb(6 182 212)", backgroundColor: "rgba(6, 182, 212, 0.1)" };
				case "bulk_operation":
					return { borderColor: "rgb(245 158 11)", backgroundColor: "rgba(245, 158, 11, 0.1)" };
				default:
					return { borderColor: "rgb(156 163 175)", backgroundColor: "rgba(156, 163, 175, 0.1)" };
			}
		},
		[]
	);

	const handleJumpToState = useCallback(
		(index: number) => {
			const targetState = fullLinearHistory[index];
			if (targetState?.id) {
				jumpToHistoryState(targetState.id);
			}
		},
		[fullLinearHistory, jumpToHistoryState]
	);

	const handleNodeSelect = useCallback((nodeId: string) => {
		setSelectedNodeId(nodeId);
	}, []);

	// Helper function to get state styling based on position
	const getStateStyles = useCallback(
		(index: number, isSelected: boolean) => {
			const isCurrentState = index === currentIndexInTimeline;
			const isFutureState = index > currentIndexInTimeline;

			let itemStyle: string;
			let indicatorStyle: string;
			let badgeStyle: string;
			let textStyle: string;

			if (isCurrentState) {
				itemStyle = HISTORY_ITEM_STYLES.current;
				indicatorStyle = HISTORY_ITEM_INDICATOR_STYLES.current;
				badgeStyle = HISTORY_ITEM_BADGE_STYLES.current;
				textStyle = HISTORY_ITEM_TEXT_STYLES.current;
			} else if (isFutureState) {
				itemStyle = HISTORY_ITEM_STYLES.future;
				indicatorStyle = HISTORY_ITEM_INDICATOR_STYLES.future;
				badgeStyle = HISTORY_ITEM_BADGE_STYLES.future;
				textStyle = HISTORY_ITEM_TEXT_STYLES.future;
			} else {
				itemStyle = HISTORY_ITEM_STYLES.default;
				indicatorStyle = HISTORY_ITEM_INDICATOR_STYLES.default;
				badgeStyle = HISTORY_ITEM_BADGE_STYLES.default;
				textStyle = HISTORY_ITEM_TEXT_STYLES.default;
			}

			// Add selection styling
			if (isSelected && !isCurrentState) {
				itemStyle += " ring-2 ring-primary/50 bg-primary/5 dark:bg-primary/10";
			}

			return { itemStyle, indicatorStyle, badgeStyle, textStyle };
		},
		[currentIndexInTimeline]
	);

	// Helper function to create keyboard event handlers
	const createKeyboardHandlers = useCallback(
		(isClickable: boolean, index: number, _state: HistoryNode) => {
			const handleKeyDown = (e: React.KeyboardEvent) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					if (isClickable) {
						handleJumpToState(index);
					}
				}
			};

			return { handleKeyDown };
		},
		[handleJumpToState]
	);

	// Helper function to render a single history item
	const renderHistoryItem = useCallback(
		(state: HistoryNode, index: number) => {
			const isCurrentState = index === currentIndexInTimeline;
			const isFutureState = index > currentIndexInTimeline;
			const isClickable = index !== currentIndexInTimeline;
			const isSelected = selectedNodeId === state?.id;

			if (!state) {
				return null;
			}

			// Get action-specific styling
			const actionIcon = getActionIcon(state.metadata || {});
			const actionColor = getActionColor(state.metadata || {});
			const actionIndicatorStyle = getActionIndicatorStyle(state.metadata || {});

			// Get state-based styling
			const { itemStyle, indicatorStyle, badgeStyle, textStyle } = getStateStyles(
				index,
				isSelected
			);

			// Create keyboard handlers
			const { handleKeyDown } = createKeyboardHandlers(isClickable, index, state);

			const stateLabel =
				state.label ||
				(typeof state.metadata?.action === "string" ? state.metadata.action : null) ||
				"Initial State";

			return (
				<div
					key={state.id || index}
					onClick={isClickable ? () => handleJumpToState(index) : undefined}
					onKeyDown={isClickable ? handleKeyDown : undefined}
					onContextMenu={(e) => {
						e.preventDefault();
						if (state?.id) {
							handleNodeSelect(state.id);
						}
					}}
					role={isClickable ? "button" : "listitem"}
					tabIndex={isClickable ? 0 : -1}
					aria-label={
						isClickable
							? `Jump to history state: ${stateLabel}`
							: `Current history state: ${stateLabel}`
					}
					className={`${HISTORY_ITEM_STYLES.base} ${itemStyle} ${
						isClickable ? HISTORY_ITEM_STYLES.clickable : HISTORY_ITEM_STYLES.nonClickable
					}`}
				>
					<div className={HISTORY_ITEM_STYLES.layout}>
						<div className={HISTORY_ITEM_STYLES.leftSection}>
							<div
								className={`${HISTORY_ITEM_INDICATOR_STYLES.base} ${indicatorStyle}`}
								style={actionIndicatorStyle}
							/>
							<span className={`${HISTORY_ITEM_BADGE_STYLES.base} ${badgeStyle}`}>
								#{index + 1}
							</span>
							<div className="flex items-center gap-2">
								<span className="text-sm">{actionIcon}</span>
								<span className={`${HISTORY_ITEM_TEXT_STYLES.base} ${textStyle} ${actionColor}`}>
									{stateLabel || "Unknown Action"}
								</span>
							</div>
						</div>
						<div className={HISTORY_ITEM_STYLES.rightSection}>
							{isCurrentState && (
								<span className={HISTORY_ITEM_META_STYLES.currentBadge}>Current</span>
							)}
							{isFutureState && (
								<span className="rounded-full bg-muted/30 px-1.5 py-0.5 text-muted-foreground/50 text-xs">
									Future
								</span>
							)}
							{state.childrenIds && state.childrenIds.length > 1 && (
								<div className="flex items-center gap-1">
									<GitBranch className="h-3 w-3 text-amber-500" />
									<span className="font-medium text-amber-600 text-xs dark:text-amber-400">
										{state.childrenIds.length}
									</span>
								</div>
							)}
						</div>
					</div>
				</div>
			);
		},
		[
			currentIndexInTimeline,
			selectedNodeId,
			getStateStyles,
			createKeyboardHandlers,
			handleJumpToState,
			handleNodeSelect,
			getActionIcon,
			getActionColor,
			getActionIndicatorStyle,
			formatTimestamp,
		]
	);

	// Render history list - simplified with extracted helper function
	const renderHistoryList = useCallback(() => {
		if (fullLinearHistory.length === 0) {
			return (
				<div className={EMPTY_STATE_STYLES.container}>
					<Clock className={EMPTY_STATE_STYLES.icon} />
					<p className={EMPTY_STATE_STYLES.title}>No history available</p>
					<p className={EMPTY_STATE_STYLES.subtitle}>Actions will appear here as you work</p>
				</div>
			);
		}

		return fullLinearHistory.map(renderHistoryItem).slice(-20);
	}, [fullLinearHistory, renderHistoryItem]);

	const handleBranchRedo = useCallback(
		(branchId: string) => {
			redo(branchId);
		},
		[redo]
	);

	const handleClearHistory = useCallback(() => {
		if (selectedNodeId && selectedNodeId !== fullGraphData?.root) {
			// Remove selected node and its children
			const success = removeSelectedNode(selectedNodeId);
			if (success) {
			} else {
				console.warn(`Failed to remove node ${selectedNodeId}`);
			}
		} else {
			// Clear entire history
			clearHistory();
		}
	}, [selectedNodeId, fullGraphData?.root, removeSelectedNode, clearHistory]);

	const handleToggleGraphView = useCallback(() => {
		setGraphView((prev) => {
			const newView = !prev;
			return newView;
		});
	}, [fullGraphData]);

	const handleOpenDeletionModal = useCallback(() => {
		setDeletionModalOpen(true);
	}, []);

	const handleCloseDeletionModal = useCallback(() => {
		setDeletionModalOpen(false);
	}, []);

	// RENDER
	return (
		<div className={`${PANEL_STYLES.base} ${className}`}>
			{/* HEADER */}
			<div className={HEADER_STYLES.container}>
				<div className={HEADER_STYLES.layout}>
					<div className={HEADER_STYLES.titleContainer}>
						<Clock className={HEADER_STYLES.titleIcon} />
						<span className={HEADER_STYLES.titleText}>History</span>
						<span className={HEADER_STYLES.titleBadge}>{fullLinearHistory.length}</span>
					</div>

					<div className={HEADER_STYLES.rightSection}>
						{/* Stats */}
						{graphStats && (
							<div className={STATS_STYLES.container}>
								<div className={STATS_STYLES.statesContainer}>
									<span className={STATS_STYLES.statesCount}>{graphStats.totalNodes}</span>
									<span className={STATS_STYLES.statesLabel}>states</span>
								</div>
								{graphStats.branches > 0 && (
									<div className={STATS_STYLES.branchContainer}>
										<GitBranch className={STATS_STYLES.branchIcon} />
										<span className={STATS_STYLES.branchCount}>{graphStats.branches}</span>
									</div>
								)}
							</div>
						)}

						{/* Controls */}
						<div className={CONTROLS_STYLES.container}>
							{/* Toggle view */}
							<button
								onClick={handleToggleGraphView}
								className={CONTROLS_STYLES.button}
								title={graphView ? "Switch to list view" : "Switch to graph view"}
								type="button"
							>
								{graphView ? (
									<ListIcon className={CONTROLS_STYLES.icon} />
								) : (
									<GitBranch className={CONTROLS_STYLES.icon} />
								)}
							</button>

							<div className={CONTROLS_STYLES.separator} />

							<button
								onClick={handleOpenDeletionModal}
								className={CONTROLS_STYLES.buttonDestructive}
								title={
									selectedNodeId && selectedNodeId !== fullGraphData?.root
										? "Remove selected node and its children"
										: "Clear entire history"
								}
								type="button"
							>
								<Trash2 className={CONTROLS_STYLES.icon} />
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* CONTENT */}
			<div className={CONTENT_STYLES.container}>
				{graphView ? (
					<div className={CONTENT_STYLES.graphContainer}>
						{fullGraphData ? (
							<Suspense
								fallback={
									<div className={CONTENT_STYLES.graphUnavailable}>
										<p className={CONTENT_STYLES.graphUnavailableText}>Loading graph…</p>
									</div>
								}
							>
								<RenderHistoryGraph
									graph={fullGraphData}
									onJumpToState={jumpToHistoryState}
									onNodeSelect={handleNodeSelect}
									selectedNodeId={selectedNodeId}
								/>
							</Suspense>
						) : (
							<div className={CONTENT_STYLES.graphUnavailable}>
								<p className={CONTENT_STYLES.graphUnavailableText}>Graph view unavailable</p>
							</div>
						)}
					</div>
				) : (
					<div className={CONTENT_STYLES.listContainer}>
						{fullLinearHistory.length === 0 ? (
							<div className={EMPTY_STATE_STYLES.container}>
								<Clock className={EMPTY_STATE_STYLES.icon} />
								<p className={EMPTY_STATE_STYLES.title}>No history available</p>
								<p className={EMPTY_STATE_STYLES.subtitle}>Actions will appear here as you work</p>
							</div>
						) : (
							<>
								{renderHistoryList()}

								{/* Show branching info */}
								{graphStats && graphStats.totalNodes <= 2 && (
									<div className="mt-4 p-3 bg-muted/50 border border-border rounded-lg">
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<GitBranch className="w-4 h-4" />
											<span className="font-medium">No branching history yet</span>
										</div>
										<p className="text-xs text-muted-foreground mt-1">
											To create branches: Make some actions, use{" "}
											<kbd className="px-1 py-0.5 bg-background border rounded text-xs">Undo</kbd>{" "}
											to go back, then make different actions.
										</p>
									</div>
								)}
							</>
						)}
					</div>
				)}
			</div>

			{/* BRANCH OPTIONS */}
			{!graphView && branchOptions.length > 1 && (
				<div className={BRANCH_OPTIONS_STYLES.container}>
					<div className={BRANCH_OPTIONS_STYLES.header}>
						<GitBranch className={BRANCH_OPTIONS_STYLES.headerIcon} />
						<span className={BRANCH_OPTIONS_STYLES.headerText}>Multiple paths available</span>
					</div>
					<div className={BRANCH_OPTIONS_STYLES.buttonContainer}>
						{branchOptions.map((branchId, index) => (
							<button
								key={branchId}
								onClick={() => handleBranchRedo(branchId)}
								className={BRANCH_OPTIONS_STYLES.button}
								title={`Redo to branch ${index + 1}`}
								type="button"
							>
								Branch {index + 1}
							</button>
						))}
					</div>
				</div>
			)}

			{/* FOOTER */}
			{fullLinearHistory.length > 20 && (
				<div className={FOOTER_STYLES.container}>
					<p className={FOOTER_STYLES.text}>
						Showing last {Math.min(20, fullLinearHistory.length)} of {fullLinearHistory.length}{" "}
						actions
					</p>
				</div>
			)}

			{/* DELETION CONFIRMATION MODAL */}
			{deletionModalOpen && (
				<DeletionModal
					isOpen={deletionModalOpen}
					onClose={handleCloseDeletionModal}
					onConfirm={handleClearHistory}
					nodeLabel={
						selectedNodeId && fullGraphData?.nodes[selectedNodeId]
							? fullGraphData.nodes[selectedNodeId].label || "selected node"
							: "selected node"
					}
					childrenCount={(() => {
						if (!(selectedNodeId && fullGraphData?.nodes[selectedNodeId])) {
							return 0;
						}

						const countDescendants = (nodeId: string): number => {
							const node = fullGraphData.nodes[nodeId];
							if (!node) {
								return 0;
							}

							let count = 0;
							for (const childId of node.childrenIds || []) {
								count += 1 + countDescendants(childId);
							}
							return count;
						};

						return countDescendants(selectedNodeId);
					})()}
					isFullClear={!selectedNodeId || selectedNodeId === fullGraphData?.root}
				/>
			)}
		</div>
	);
};

export default HistoryPanel;
