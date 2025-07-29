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

interface UndoRedoManager {
	id: string;
	undo: () => boolean;
	redo: () => boolean;
	canUndo: boolean;
	canRedo: boolean;
	addEntry: (entry: HistoryEntry) => void;
	clearHistory: () => void;
}

// TYPES
export interface UndoRedoContextType {
	registerManager: (manager: UndoRedoManager) => void;
	unregisterManager: (managerId: string) => void;
	undo: () => boolean;
	redo: () => boolean;
	canUndo: boolean;
	canRedo: boolean;
	addEntry: (entry: HistoryEntry) => void;
	clearHistory: () => void;
	getHistory: () => {
		entries: HistoryEntry[];
		currentIndex: number;
		canUndo: boolean;
		canRedo: boolean;
		// Additional graph-specific properties (optional for backward compatibility)
		branchOptions?: string[];
		graphStats?: GraphStats;
		currentNode?: GraphNode;
	};
	getFullGraph: () => {
		nodes: Record<string, GraphNode>;
		root: string;
		cursor: string;
	};
	removeSelectedNode: (nodeId?: string) => boolean;
}

interface HistoryEntry {
	id: string;
	timestamp: number;
	description: string;
	data: Record<string, unknown>;
}

interface GraphStats {
	nodeCount: number;
	edgeCount: number;
	branchCount: number;
}

interface GraphNode {
	id: string;
	label?: string;
	children?: GraphNode[];
	data?: Record<string, unknown>;
}

// CONTEXT
const UndoRedoContext = createContext<UndoRedoContextType | null>(null);

// PROVIDER COMPONENT
interface UndoRedoProviderProps {
	children: ReactNode;
}

export const UndoRedoProvider: React.FC<UndoRedoProviderProps> = ({ children }) => {
	// Store the actual manager functions
	const managerRef = useRef<UndoRedoContextType | null>(null);

	// Register the manager (called by UndoRedoManager)
	const registerManager = useCallback((manager: UndoRedoContextType) => {
		managerRef.current = manager;
	}, []);

	// Wrapper functions that delegate to the registered manager
	const undo = useCallback(() => {
		return managerRef.current?.undo();
	}, []);

	const redo = useCallback((childId?: string) => {
		return managerRef.current?.redo(childId);
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
		return managerRef.current?.removeSelectedNode?.(nodeId);
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

	const contextValue: UndoRedoContextType & {
		registerManager: (manager: UndoRedoContextType) => void;
	} = {
		undo,
		redo,
		recordAction,
		recordActionDebounced,
		clearHistory,
		removeSelectedNode,
		getHistory,
		getFullGraph,
		registerManager,
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
		};
	}

	return context;
};

// HOOK TO REGISTER MANAGER (used by UndoRedoManager)
export const useRegisterUndoRedoManager = () => {
	const context = useContext(UndoRedoContext) as UndoRedoContextType;
	return context?.registerManager || (() => {});
};
