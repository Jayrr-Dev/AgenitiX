'use client'

import React, { createContext, useContext, useCallback, useRef, ReactNode } from 'react'
import { ActionType } from './UndoRedoManager'

// TYPES
export interface UndoRedoContextType {
  undo: () => boolean
  redo: () => boolean
  recordAction: (type: ActionType, metadata?: Record<string, unknown>) => void
  recordActionDebounced: (type: ActionType, metadata?: Record<string, unknown>) => void
  clearHistory: () => void
  getHistory: () => {
    entries: any[]
    currentIndex: number
    canUndo: boolean
    canRedo: boolean
  }
}

// CONTEXT
const UndoRedoContext = createContext<UndoRedoContextType | null>(null)

// PROVIDER COMPONENT
interface UndoRedoProviderProps {
  children: ReactNode
}

export const UndoRedoProvider: React.FC<UndoRedoProviderProps> = ({ children }) => {
  // Store the actual manager functions
  const managerRef = useRef<UndoRedoContextType | null>(null)

  // Register the manager (called by UndoRedoManager)
  const registerManager = useCallback((manager: UndoRedoContextType) => {
    managerRef.current = manager
  }, [])

  // Wrapper functions that delegate to the registered manager
  const undo = useCallback(() => {
    return managerRef.current?.undo() || false
  }, [])

  const redo = useCallback(() => {
    return managerRef.current?.redo() || false
  }, [])

  const recordAction = useCallback((type: ActionType, metadata?: Record<string, unknown>) => {
    managerRef.current?.recordAction(type, metadata)
  }, [])

  const recordActionDebounced = useCallback((type: ActionType, metadata?: Record<string, unknown>) => {
    managerRef.current?.recordActionDebounced(type, metadata)
  }, [])

  const clearHistory = useCallback(() => {
    managerRef.current?.clearHistory()
  }, [])

  const getHistory = useCallback(() => {
    return managerRef.current?.getHistory() || {
      entries: [],
      currentIndex: -1,
      canUndo: false,
      canRedo: false
    }
  }, [])

  const contextValue: UndoRedoContextType & { registerManager: (manager: UndoRedoContextType) => void } = {
    undo,
    redo,
    recordAction,
    recordActionDebounced,
    clearHistory,
    getHistory,
    registerManager
  }

  return (
    <UndoRedoContext.Provider value={contextValue}>
      {children}
    </UndoRedoContext.Provider>
  )
}

// HOOK
export const useUndoRedo = (): UndoRedoContextType => {
  const context = useContext(UndoRedoContext)
  
  if (!context) {
    // Return safe defaults if context is not available
    return {
      undo: () => false,
      redo: () => false,
      recordAction: () => {},
      recordActionDebounced: () => {},
      clearHistory: () => {},
      getHistory: () => ({
        entries: [],
        currentIndex: -1,
        canUndo: false,
        canRedo: false
      })
    }
  }
  
  return context
}

// HOOK TO REGISTER MANAGER (used by UndoRedoManager)
export const useRegisterUndoRedoManager = () => {
  const context = useContext(UndoRedoContext) as any
  return context?.registerManager || (() => {})
} 