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

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
} from "react";
import { ActionType } from "./UndoRedoManager";

// TYPES
export interface UndoRedoContextType {
  undo: () => boolean;
  redo: (childId?: string) => boolean;
  recordAction: (type: ActionType, metadata?: Record<string, unknown>) => void;
  recordActionDebounced: (
    type: ActionType,
    metadata?: Record<string, unknown>
  ) => void;
  clearHistory: () => void;
  removeSelectedNode: (nodeId?: string) => boolean;
  getHistory: () => {
    entries: any[];
    currentIndex: number;
    canUndo: boolean;
    canRedo: boolean;
    // Additional graph-specific properties (optional for backward compatibility)
    branchOptions?: string[];
    graphStats?: any;
    currentNode?: any;
  };
  getFullGraph: () => {
    nodes: Record<string, any>;
    root: string;
    cursor: string;
  } | null;
}

// CONTEXT
const UndoRedoContext = createContext<UndoRedoContextType | null>(null);

// PROVIDER COMPONENT
interface UndoRedoProviderProps {
  children: ReactNode;
}

export const UndoRedoProvider: React.FC<UndoRedoProviderProps> = ({
  children,
}) => {
  // Store the actual manager functions
  const managerRef = useRef<UndoRedoContextType | null>(null);

  // Register the manager (called by UndoRedoManager)
  const registerManager = useCallback((manager: UndoRedoContextType) => {
    managerRef.current = manager;
  }, []);

  // Wrapper functions that delegate to the registered manager
  const undo = useCallback(() => {
    return managerRef.current?.undo() || false;
  }, []);

  const redo = useCallback((childId?: string) => {
    return managerRef.current?.redo(childId) || false;
  }, []);

  const recordAction = useCallback(
    (type: ActionType, metadata?: Record<string, unknown>) => {
      managerRef.current?.recordAction(type, metadata);
    },
    []
  );

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
    return managerRef.current?.removeSelectedNode?.(nodeId) || false;
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

  return (
    <UndoRedoContext.Provider value={contextValue}>
      {children}
    </UndoRedoContext.Provider>
  );
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
  const context = useContext(UndoRedoContext) as any;
  return context?.registerManager || (() => {});
};
