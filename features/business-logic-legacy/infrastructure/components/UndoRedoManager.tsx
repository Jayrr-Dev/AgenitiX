'use client'

import React, { useCallback, useEffect, useRef, useMemo } from 'react'
import { useReactFlow, type Node, type Edge } from '@xyflow/react'
import { useRegisterUndoRedoManager } from './UndoRedoContext'

// TYPES
export interface ActionHistoryEntry {
  id: string
  timestamp: number
  type: ActionType
  description: string
  beforeState: FlowState
  afterState: FlowState
  metadata?: Record<string, unknown>
}

export type ActionType = 
  | 'node_add' | 'node_delete' | 'node_move' | 'node_update' | 'node_select'
  | 'edge_add' | 'edge_delete' | 'edge_update' | 'edge_reconnect'
  | 'bulk_delete' | 'bulk_move' | 'bulk_update'
  | 'paste' | 'duplicate' | 'import'
  | 'custom'

export interface FlowState {
  nodes: Node[]
  edges: Edge[]
  viewport?: { x: number; y: number; zoom: number }
}

export interface UndoRedoConfig {
  maxHistorySize?: number
  debounceMs?: number
  enableViewportTracking?: boolean
  enableAutoSave?: boolean
  compressionThreshold?: number
}

export interface UndoRedoManagerProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (nodes: Node[]) => void
  onEdgesChange: (edges: Edge[]) => void
  config?: UndoRedoConfig
  onHistoryChange?: (history: ActionHistoryEntry[], currentIndex: number) => void
}

// DEFAULT CONFIGURATION
const DEFAULT_CONFIG: Required<UndoRedoConfig> = {
  maxHistorySize: 100,
  debounceMs: 300,
  enableViewportTracking: false,
  enableAutoSave: true,
  compressionThreshold: 50 // Compress history when it exceeds this size
}

// UTILITY FUNCTIONS
const generateActionId = (): string => `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

/**
 * Safe deep clone function that handles BigInt and other non-serializable values
 */
const safeDeepClone = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }

  if (Array.isArray(obj)) {
    return obj.map(item => safeDeepClone(item))
  }

  if (typeof obj === 'object') {
    const cloned: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]
        // Handle BigInt by converting to string
        if (typeof value === 'bigint') {
          cloned[key] = value.toString()
        } else {
          cloned[key] = safeDeepClone(value)
        }
      }
    }
    return cloned
  }

  return obj
}

const createFlowState = (nodes: Node[], edges: Edge[], viewport?: { x: number; y: number; zoom: number }): FlowState => ({
  nodes: safeDeepClone(nodes), // Safe deep clone that handles BigInt
  edges: safeDeepClone(edges),
  viewport: viewport ? { ...viewport } : undefined
})

/**
 * Safe JSON stringify that handles BigInt and other non-serializable values
 */
const safeStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString()
      }
      return value
    })
  } catch {
    return 'null'
  }
}

const areStatesEqual = (state1: FlowState, state2: FlowState): boolean => {
  try {
    return (
      safeStringify(state1.nodes) === safeStringify(state2.nodes) &&
      safeStringify(state1.edges) === safeStringify(state2.edges) &&
      safeStringify(state1.viewport) === safeStringify(state2.viewport)
    )
  } catch {
    return false
  }
}

const compressHistory = (history: ActionHistoryEntry[], threshold: number): ActionHistoryEntry[] => {
  if (history.length <= threshold) return history
  
  // Keep recent entries and compress older ones
  const recentEntries = history.slice(-Math.floor(threshold * 0.7))
  const olderEntries = history.slice(0, -Math.floor(threshold * 0.7))
  
  // Compress older entries by keeping only major actions
  const majorActionTypes: ActionType[] = ['node_add', 'node_delete', 'edge_add', 'edge_delete', 'bulk_delete', 'paste', 'import']
  const compressedOlder = olderEntries.filter(entry => majorActionTypes.includes(entry.type))
  
  return [...compressedOlder, ...recentEntries]
}

const getActionDescription = (type: ActionType, metadata?: Record<string, unknown>): string => {
  const descriptions: Record<ActionType, string> = {
    node_add: 'Add node',
    node_delete: 'Delete node',
    node_move: 'Move node',
    node_update: 'Update node',
    node_select: 'Select node',
    edge_add: 'Add connection',
    edge_delete: 'Delete connection',
    edge_update: 'Update connection',
    edge_reconnect: 'Reconnect edge',
    bulk_delete: 'Delete multiple items',
    bulk_move: 'Move multiple items',
    bulk_update: 'Update multiple items',
    paste: 'Paste items',
    duplicate: 'Duplicate items',
    import: 'Import flow',
    custom: 'Custom action'
  }
  
  let description = descriptions[type] || 'Unknown action'
  
  // Add metadata context if available
  if (metadata) {
    if (metadata.nodeCount) description += ` (${metadata.nodeCount} nodes)`
    if (metadata.edgeCount) description += ` (${metadata.edgeCount} edges)`
    if (metadata.nodeType) description += ` (${metadata.nodeType})`
    if (metadata.customDescription) description = metadata.customDescription as string
  }
  
  return description
}

// MAIN COMPONENT
const UndoRedoManager: React.FC<UndoRedoManagerProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  config = {},
  onHistoryChange
}) => {
  const reactFlowInstance = useReactFlow()
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])
  const registerManager = useRegisterUndoRedoManager()
  
  // STATE MANAGEMENT
  const historyRef = useRef<ActionHistoryEntry[]>([])
  const currentIndexRef = useRef(-1)
  const isUndoRedoOperationRef = useRef(false)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastStateRef = useRef<FlowState | null>(null)
  const pendingActionRef = useRef<{ type: ActionType; metadata?: Record<string, unknown> } | null>(null)

  // MEMORY MANAGEMENT
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // CORE FUNCTIONS
  const addToHistory = useCallback((
    type: ActionType,
    beforeState: FlowState,
    afterState: FlowState,
    metadata?: Record<string, unknown>
  ) => {
    // Skip if states are identical
    if (areStatesEqual(beforeState, afterState)) return

    // Skip if this is an undo/redo operation
    if (isUndoRedoOperationRef.current) return

    const entry: ActionHistoryEntry = {
      id: generateActionId(),
      timestamp: Date.now(),
      type,
      description: getActionDescription(type, metadata),
      beforeState,
      afterState,
      metadata
    }

    // Remove any history after current index (when adding new action after undo)
    const newHistory = historyRef.current.slice(0, currentIndexRef.current + 1)
    newHistory.push(entry)

    // Apply compression if needed
    if (newHistory.length > finalConfig.compressionThreshold) {
      historyRef.current = compressHistory(newHistory, finalConfig.compressionThreshold)
    } else {
      historyRef.current = newHistory
    }

    // Limit history size
    if (historyRef.current.length > finalConfig.maxHistorySize) {
      historyRef.current = historyRef.current.slice(-finalConfig.maxHistorySize)
    }

    currentIndexRef.current = historyRef.current.length - 1
    
    // Notify history change
    onHistoryChange?.(historyRef.current, currentIndexRef.current)
  }, [finalConfig.compressionThreshold, finalConfig.maxHistorySize, onHistoryChange])

  const captureCurrentState = useCallback((): FlowState => {
    const viewport = finalConfig.enableViewportTracking ? reactFlowInstance.getViewport() : undefined
    return createFlowState(nodes, edges, viewport)
  }, [nodes, edges, finalConfig.enableViewportTracking, reactFlowInstance])

  const applyState = useCallback((state: FlowState) => {
    isUndoRedoOperationRef.current = true
    
    try {
      onNodesChange(state.nodes)
      onEdgesChange(state.edges)
      
      if (state.viewport && finalConfig.enableViewportTracking) {
        reactFlowInstance.setViewport(state.viewport)
      }
    } finally {
      // Reset flag after a brief delay to ensure all related updates complete
      setTimeout(() => {
        isUndoRedoOperationRef.current = false
      }, 50)
    }
  }, [onNodesChange, onEdgesChange, finalConfig.enableViewportTracking, reactFlowInstance])

  // PUBLIC API
  const undo = useCallback(() => {
    if (currentIndexRef.current < 0) {
      return false
    }

    const entry = historyRef.current[currentIndexRef.current]
    applyState(entry.beforeState)
    currentIndexRef.current--
    
    onHistoryChange?.(historyRef.current, currentIndexRef.current)
    return true
  }, [applyState, onHistoryChange])

  const redo = useCallback(() => {
    if (currentIndexRef.current >= historyRef.current.length - 1) {
      return false
    }

    currentIndexRef.current++
    const entry = historyRef.current[currentIndexRef.current]
    applyState(entry.afterState)
    
    onHistoryChange?.(historyRef.current, currentIndexRef.current)
    return true
  }, [applyState, onHistoryChange])

  const recordAction = useCallback((type: ActionType, metadata?: Record<string, unknown>) => {
    const currentState = captureCurrentState()
    
    if (lastStateRef.current) {
      addToHistory(type, lastStateRef.current, currentState, metadata)
    }
    
    lastStateRef.current = currentState
  }, [captureCurrentState, addToHistory])

  const recordActionDebounced = useCallback((type: ActionType, metadata?: Record<string, unknown>) => {
    // Store pending action
    pendingActionRef.current = { type, metadata }
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      if (pendingActionRef.current) {
        recordAction(pendingActionRef.current.type, pendingActionRef.current.metadata)
        pendingActionRef.current = null
      }
    }, finalConfig.debounceMs)
  }, [recordAction, finalConfig.debounceMs])

  const clearHistory = useCallback(() => {
    historyRef.current = []
    currentIndexRef.current = -1
    lastStateRef.current = null
    onHistoryChange?.([], -1)
  }, [onHistoryChange])

  const getHistory = useCallback(() => ({
    entries: [...historyRef.current],
    currentIndex: currentIndexRef.current,
    canUndo: currentIndexRef.current >= 0,
    canRedo: currentIndexRef.current < historyRef.current.length - 1
  }), [])

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey
      
      if (!ctrlKey) return
      
      // Check if user is currently typing in an input field
      const activeElement = document.activeElement;
      const isTypingInInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true' ||
        (activeElement as HTMLElement).contentEditable === 'true'
      );
      
      // If typing in an input field, allow browser's native undo/redo to work
      if (isTypingInInput) {
        return; // Let the browser handle Ctrl+Z/Ctrl+Y natively in input fields
      }
      
      // Prevent default browser behavior only when NOT in input fields
      if (event.key === 'z' || event.key === 'y') {
        event.preventDefault()
      }
      
      if (event.key === 'z' && !event.shiftKey) {
        undo()
      } else if ((event.key === 'y') || (event.key === 'z' && event.shiftKey)) {
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  // TRACK STATE CHANGES
  useEffect(() => {
    if (isUndoRedoOperationRef.current) return
    
    const currentState = captureCurrentState()
    
    // Initialize if this is the first state
    if (!lastStateRef.current) {
      lastStateRef.current = currentState
      return
    }
    
    // Auto-record changes if enabled
    if (finalConfig.enableAutoSave && !areStatesEqual(lastStateRef.current, currentState)) {
      recordActionDebounced('bulk_update', { 
        nodeCount: nodes.length, 
        edgeCount: edges.length 
      })
    }
  }, [nodes, edges, captureCurrentState, recordActionDebounced, finalConfig.enableAutoSave])

  // REGISTER WITH CONTEXT
  useEffect(() => {
    const managerAPI = {
      undo,
      redo,
      recordAction,
      recordActionDebounced,
      clearHistory,
      getHistory
    }
    
    registerManager(managerAPI)
    
    // Also attach to window for debugging in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).undoRedoManager = managerAPI
    }
  }, [undo, redo, recordAction, recordActionDebounced, clearHistory, getHistory, registerManager])

  // This component doesn't render anything - it's purely for state management
  return null
}

export default UndoRedoManager

// NOTE: useUndoRedo hook is now provided by UndoRedoContext.tsx 