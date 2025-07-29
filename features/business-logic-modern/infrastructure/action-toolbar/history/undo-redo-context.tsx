/**
 * UNDO REDO CONTEXT - React context for undo/redo functionality
 *
 * • React context providing undo/redo operations across components
 * • Manager registration system for delegating operations to UndoRedoManager
 * • Safe fallback hooks when context is not available
 * • Debounced action recording for performance optimization
 * • History state management with canUndo/canRedo status
 *
 * Keywords: React-context, undo-redo, history, manager-delegation, hooks
 */

"use client";

import type React from "react";
import { type ReactNode, createContext, useCallback, useContext, useRef } from "react";
import type { ActionType } from "./UndoRedoManager";
import type { HistoryNode } from "./historyGraph";

interface UndoRedoManagerAPI {
	undo: () => boolean;
	redo: (childId?: string) => boolean;
	recordAction: (type: ActionType, metadata?: Record<string, unknown>) => void;
	recordActionDebounced: (type: ActionType, metadata?: Record<string, unknown>) => void;
	clearHistory: () => void;
	removeSelectedNode: (nodeId?: string) => boolean;
	getHistory: () => {
		entries: HistoryNode[];
		currentIndex: number;
		canUndo: boolean;
		canRedo: boolean;
		branchOptions?: string[];
		graphStats?: GraphStats;
		currentNode?: HistoryNode;
	};
	getBranchOptions: () => string[];
	getFullGraph: () => {
		nodes: Record<string, HistoryNode>;
		root: string;
		cursor: string;
	};
	redoSpecificBranch: (childId?: string) => boolean;
}

// TYPES
export interface UndoRedoContextType {
	registerManager: (manager: UndoRedoManagerAPI) => void;
	unregisterManager: (managerId: string) => void;
	undo: () => boolean;
	redo: (childId?: string) => boolean;
	recordAction: (type: ActionType, metadata?: Record<string, unknown>) => void;
	recordActionDebounced: (type: ActionType, metadata?: Record<string, unknown>) => void;
	clearHistory: () => void;
	getHistory: () => {
		entries: HistoryNode[];
		currentIndex: number;
		canUndo: boolean;
		canRedo: boolean;
		// Additional graph-specific properties (optional for backward compatibility)
		branchOptions?: string[];
		graphStats?: GraphStats;
		currentNode?: HistoryNode;
	};
	getFullGraph: () => {
		nodes: Record<string, HistoryNode>;
		root: string;
		cursor: string;
	} | null;
	removeSelectedNode: (nodeId?: string) => boolean;
}

interface GraphStats {
	totalNodes: number;
	branches: number;
	leafNodes: number;
	maxDepth: number;
	currentDepth: number;
}

// CONTEXT
const UndoRedoContext = createContext<UndoRedoContextType | null>(null);

// PROVIDER COMPONENT
interface UndoRedoProviderProps {
	children: ReactNode;
}

export const UndoRedoProvider: React.FC<UndoRedoProviderProps> = ({ children }) => {
	// Store the actual manager functions
	const managerRef = useRef<UndoRedoManagerAPI | null>(null);

	// Register the manager (called by UndoRedoManager)
	const registerManager = useCallback((manager: UndoRedoManagerAPI) => {
		managerRef.current = manager;
	}, []);

	// Wrapper functions that delegate to the registered manager
	const undo = useCallback(() => {
		return managerRef.current?.undo() ?? false;
	}, []);

	const redo = useCallback((childId?: string) => {
		return managerRef.current?.redo(childId) ?? false;
	}, []);

	const recordAction = useCallback((type: ActionType, metadata?: Record<string, unknown>) => {
		managerRef.current?.recordAction(type, metadata);
	}, []);

	const recordActionDebounced = useCallback(
		(type: ActionType, metadata?: Record<string, unknown>) => {
			managerRef.current?.recordActionDebounced(type, metadata);
		},
		[]
	);

	const clearHistory = useCallback(() => {
		managerRef.current?.clearHistory();
	}, []);

	const removeSelectedNode = useCallback((nodeId?: string) => {
		return managerRef.current?.removeSelectedNode?.(nodeId) ?? false;
	}, []);

	const getHistory = useCallback(() => {
		return (
			managerRef.current?.getHistory() || {
				entries: [],
				currentIndex: -1,
				canUndo: false,
				canRedo: false,
			}
		);
	}, []);

	const getFullGraph = useCallback(() => {
		return managerRef.current?.getFullGraph?.() || null;
	}, []);

	const unregisterManager = useCallback((managerId: string) => {
		// For now, just clear the manager reference
		managerRef.current = null;
	}, []);

	const contextValue: UndoRedoContextType = {
		undo,
		redo,
		recordAction,
		recordActionDebounced,
		clearHistory,
		removeSelectedNode,
		getHistory,
		getFullGraph,
		registerManager,
		unregisterManager,
	};

	return <UndoRedoContext.Provider value={contextValue}>{children}</UndoRedoContext.Provider>;
};

// HOOK
export const useUndoRedo = (): UndoRedoContextType => {
	const context = useContext(UndoRedoContext);

	if (!context) {
		// Return safe defaults if context is not available
		return {
			undo: () => false,
			redo: () => false,
			recordAction: () => {},
			recordActionDebounced: () => {},
			clearHistory: () => {},
			removeSelectedNode: () => false,
			getHistory: () => ({
				entries: [],
				currentIndex: -1,
				canUndo: false,
				canRedo: false,
			}),
			getFullGraph: () => null,
			registerManager: () => {},
			unregisterManager: () => {},
		};
	}

	return context;
};

// HOOK TO REGISTER MANAGER (used by UndoRedoManager)
export const useRegisterUndoRedoManager = () => {
	const context = useContext(UndoRedoContext) as UndoRedoContextType;
	return context?.registerManager || (() => {});
};
