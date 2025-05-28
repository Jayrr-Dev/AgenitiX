'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Position, useReactFlow, useNodeConnections, useNodesData, type NodeProps, type Node } from '@xyflow/react'
import CustomHandle from '../../handles/CustomHandle'

// TYPES
interface CounterNodeData {
  count: number
  multiplier: number
  lastInputValues?: Record<string, unknown> // Track multiple inputs by node ID
  autoCount?: boolean // Auto counting enabled/disabled
  countSpeed?: number // Speed in milliseconds between counts
}

// UTILITY FUNCTIONS (outside component to prevent recreation)
// Check if input represents a "true" value for counting
const isTrueValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false
  
  // For boolean values, only count true
  if (typeof value === 'boolean') {
    return value === true
  }
  
  // For numbers, count any non-zero, non-NaN value as true
  if (typeof value === 'number') {
    return !isNaN(value) && value !== 0
  }
  
  // For strings, count non-empty strings as true
  if (typeof value === 'string') {
    return value.length > 0 && value !== 'false' && value !== '0'
  }
  
  // For objects (node data), check common boolean properties
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    // Check for triggered, value, or other boolean properties
    if ('triggered' in obj) return obj.triggered === true
    if ('value' in obj && typeof obj.value === 'boolean') return obj.value === true
    if ('enabled' in obj && typeof obj.enabled === 'boolean') return obj.enabled === true
  }
  
  // For other types, consider any change as a count trigger
  return true
}

// OPTIMIZED: Shallow comparison for primitive values, deep for objects (with error handling)
const hasInputChanged = (prev: unknown, current: unknown): boolean => {
  if (prev === current) return false
  
  // Handle primitive types (most common case)
  if (typeof prev !== 'object' || typeof current !== 'object') {
    return prev !== current
  }
  
  // Handle null/undefined
  if (prev === null || current === null || prev === undefined || current === undefined) {
    return prev !== current
  }
  
  // OPTIMIZED: Safe JSON.stringify with BigInt handling for small objects
  try {
    const safeStringify = (obj: unknown): string => {
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'bigint') {
          return value.toString()
        }
        return value
      })
    }
    
    const prevStr = safeStringify(prev)
    const currentStr = safeStringify(current)
    // Limit comparison to reasonable object sizes (prevent memory issues)
    if (prevStr.length > 1000 || currentStr.length > 1000) {
      return prev !== current // Fallback to reference comparison for large objects
    }
    return prevStr !== currentStr
  } catch {
    return prev !== current // Fallback to reference comparison on error
  }
}

// COUNTER NODE COMPONENT
const CounterNode: React.FC<NodeProps<Node<CounterNodeData & Record<string, unknown>>>> = ({ id, data }) => {
  const { updateNodeData } = useReactFlow()
  const connections = useNodeConnections({ handleType: 'target' })
  
  // INPUT CONNECTIONS
  const inputConnections = connections.filter(c => c.targetHandle === 'x')
  const inputSourceIds = inputConnections.map((c) => c.source)
  const inputNodesData = useNodesData(inputSourceIds)
  
  // OPTIMIZED: More stable memoization with better dependency tracking
  const currentInputValues = useMemo(() => {
    const values: Record<string, unknown> = {}
    
    inputConnections.forEach((connection, index) => {
      const nodeData = inputNodesData[index]?.data
      if (!nodeData) return
      
      const nodeId = connection.source
      
      // Skip self-connections to prevent infinite loops
      if (nodeId === id) return
      
      // For different node types, extract the primary value that should trigger counting
      if ('outputValue' in nodeData) values[nodeId] = nodeData.outputValue // DelayNode and other nodes with outputValue
      else if ('triggered' in nodeData) values[nodeId] = nodeData.triggered  // Trigger nodes
      else if ('value' in nodeData) values[nodeId] = nodeData.value     // Logic/Converter nodes
      else if ('text' in nodeData) values[nodeId] = nodeData.text       // Text nodes
      else if ('count' in nodeData) values[nodeId] = nodeData.count     // Counter nodes
      else values[nodeId] = nodeData // Fallback to the entire data object for unknown types
    })
    
    return values
  }, [
    // OPTIMIZED: Create stable dependency strings to prevent unnecessary re-renders
    inputConnections.map(c => c.source).sort().join(','),
    inputNodesData.map((n, i) => {
      if (!n?.data) return `${i}:empty`
      const nodeId = inputConnections[i]?.source
      if ('outputValue' in n.data) return `${nodeId}:${n.data.outputValue}`
      if ('triggered' in n.data) return `${nodeId}:${n.data.triggered}`
      if ('value' in n.data) return `${nodeId}:${n.data.value}`
      if ('text' in n.data) return `${nodeId}:${n.data.text}`
      if ('count' in n.data) return `${nodeId}:${n.data.count}`
      return `${nodeId}:object`
    }).join('|'),
    id
  ])

  // STATE MANAGEMENT
  const [count, setCount] = useState(data.count ?? 0)
  const [multiplier, setMultiplier] = useState(data.multiplier ?? 1)
  const [showUI, setShowUI] = useState(false)
  const [localMultiplierInput, setLocalMultiplierInput] = useState(multiplier.toString())
  const [autoCount, setAutoCount] = useState(data.autoCount ?? false)
  const [countSpeed, setCountSpeed] = useState(data.countSpeed ?? 1000) // Default 1 second
  const [localSpeedInput, setLocalSpeedInput] = useState(countSpeed.toString())
  
  // REFS FOR TRACKING CHANGES (with cleanup)
  const prevInputValues = useRef<Record<string, unknown>>(data.lastInputValues ?? {})
  const isFirstRender = useRef(true)
  const lastSyncedCount = useRef(data.count ?? 0)
  const lastSyncedMultiplier = useRef(data.multiplier ?? 1)
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoCountIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // CLEANUP: Clear timeouts and intervals on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      if (autoCountIntervalRef.current) {
        clearInterval(autoCountIntervalRef.current)
      }
    }
  }, [])

  // REFS FOR TRACKING SYNCED VALUES
  const lastSyncedAutoCount = useRef(data.autoCount ?? false)
  const lastSyncedCountSpeed = useRef(data.countSpeed ?? 1000)

  // OPTIMIZED: Consolidated sync effect to reduce re-renders
  useEffect(() => {
    let hasChanges = false
    
    // Sync count
    if (typeof data.count === 'number' && data.count !== count && data.count !== lastSyncedCount.current) {
      setCount(data.count)
      lastSyncedCount.current = data.count
      hasChanges = true
    }
    
    // Sync multiplier
    if (typeof data.multiplier === 'number' && data.multiplier !== multiplier && data.multiplier !== lastSyncedMultiplier.current) {
      setMultiplier(data.multiplier)
      setLocalMultiplierInput(data.multiplier.toString())
      lastSyncedMultiplier.current = data.multiplier
      hasChanges = true
    }
    
    // Sync auto count settings - only if they're different from what we last synced
    if (typeof data.autoCount === 'boolean' && data.autoCount !== autoCount && data.autoCount !== lastSyncedAutoCount.current) {
      setAutoCount(data.autoCount)
      lastSyncedAutoCount.current = data.autoCount
      hasChanges = true
    }
    
    if (typeof data.countSpeed === 'number' && data.countSpeed !== countSpeed && data.countSpeed !== lastSyncedCountSpeed.current) {
      setCountSpeed(data.countSpeed)
      setLocalSpeedInput(data.countSpeed.toString())
      lastSyncedCountSpeed.current = data.countSpeed
      hasChanges = true
    }
  }, [data.count, data.multiplier, data.autoCount, data.countSpeed, count, multiplier, autoCount, countSpeed])

  // OPTIMIZED: Debounced input change detection with memory cleanup
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      prevInputValues.current = currentInputValues
      return
    }

    if (inputConnections.length > 0) {
      let shouldCount = false
      
      // OPTIMIZED: Use for...of instead of forEach for better performance
      for (const nodeId of Object.keys(currentInputValues)) {
        const currentValue = currentInputValues[nodeId]
        const prevValue = prevInputValues.current[nodeId]
        
        if (hasInputChanged(prevValue, currentValue)) {
          // Only count if the new value represents "true"
          if (isTrueValue(currentValue)) {
            shouldCount = true
            break // Exit early if we found a trigger
          }
        }
      }
      
      if (shouldCount) {
        setCount(prev => prev + multiplier)
      }
      
      // MEMORY CLEANUP: Only keep recent input values (limit to 50 entries)
      const newPrevValues = { ...currentInputValues }
      const keys = Object.keys(newPrevValues)
      if (keys.length > 50) {
        // Keep only the most recent 50 entries
        const recentKeys = keys.slice(-50)
        const cleanedValues: Record<string, unknown> = {}
        recentKeys.forEach(key => {
          cleanedValues[key] = newPrevValues[key]
        })
        prevInputValues.current = cleanedValues
      } else {
        prevInputValues.current = newPrevValues
      }
    }
  }, [currentInputValues, multiplier, inputConnections.length])

  // AUTO COUNTER EFFECT
  useEffect(() => {
    // Clear existing interval
    if (autoCountIntervalRef.current) {
      clearInterval(autoCountIntervalRef.current)
      autoCountIntervalRef.current = null
    }

    // Start new interval if auto count is enabled
    if (autoCount && countSpeed > 0) {
      autoCountIntervalRef.current = setInterval(() => {
        setCount(prev => prev + multiplier)
      }, countSpeed)
    }

    // Cleanup function
    return () => {
      if (autoCountIntervalRef.current) {
        clearInterval(autoCountIntervalRef.current)
        autoCountIntervalRef.current = null
      }
    }
  }, [autoCount, countSpeed, multiplier])

  // MANUAL CONTROL HANDLERS (memoized to prevent re-renders)
  const handleCountUp = useCallback(() => {
    setCount(prev => prev + multiplier)
  }, [multiplier])

  const handleCountDown = useCallback(() => {
    setCount(prev => prev - multiplier)
  }, [multiplier])

  const handleReset = useCallback(() => {
    setCount(0)
  }, [])

  // MULTIPLIER INPUT HANDLERS (memoized)
  const handleMultiplierInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMultiplierInput(e.target.value)
  }, [])

  const commitMultiplierInput = useCallback(() => {
    const value = parseFloat(localMultiplierInput)
    if (!isNaN(value) && value !== 0) {
      setMultiplier(value)
      setLocalMultiplierInput(value.toString())
    } else {
      setLocalMultiplierInput(multiplier.toString())
    }
  }, [localMultiplierInput, multiplier])

  const handleMultiplierKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitMultiplierInput()
    }
  }, [commitMultiplierInput])

  // AUTO COUNT HANDLERS (memoized)
  const handleAutoCountToggle = useCallback(() => {
    setAutoCount(prev => !prev)
  }, [])

  const handleSpeedInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSpeedInput(e.target.value)
  }, [])

  const commitSpeedInput = useCallback(() => {
    const value = parseInt(localSpeedInput)
    if (!isNaN(value) && value > 0) {
      setCountSpeed(value)
      setLocalSpeedInput(value.toString())
    } else {
      setLocalSpeedInput(countSpeed.toString())
    }
  }, [localSpeedInput, countSpeed])

  const handleSpeedKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitSpeedInput()
    }
  }, [commitSpeedInput])

  // OPTIMIZED: Debounced sync with proper cleanup
  useEffect(() => {
    // Clear previous timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      updateNodeData(id, { 
        count, 
        multiplier, 
        autoCount,
        countSpeed,
        lastInputValues: prevInputValues.current // Use ref value to avoid stale closures
      })
      // Update tracking refs to prevent circular updates
      lastSyncedCount.current = count
      lastSyncedMultiplier.current = multiplier
      lastSyncedAutoCount.current = autoCount
      lastSyncedCountSpeed.current = countSpeed
    }, 16) // 16ms debounce (one frame) for better performance
    
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [count, multiplier, autoCount, countSpeed, updateNodeData, id])

  // RENDER
  return (
    <div className={`relative ${showUI ? 'px-4 py-3 min-w-[200px] min-h-[180px]' : 'w-[80px] h-[80px] flex items-center justify-center'} rounded-lg shadow border bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-800`}>
      {/* TOGGLE BUTTON (top-left) */}
      <button
        aria-label={showUI ? 'Collapse node' : 'Expand node'}
        title={showUI ? 'Collapse' : 'Expand'}
        onClick={() => setShowUI((v) => !v)}
        className="absolute top-1 left-1 cursor-pointer z-10 w-3 h-3 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/40 border border-blue-300 dark:border-blue-800 text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors shadow"
        type="button"
      >
        {showUI ? '⦿' : '⦾'}
      </button>

      {/* INPUT HANDLE (left, any type) */}
      <CustomHandle type="target" position={Position.Left} id="x" dataType="x" />

      {/* COLLAPSED: Only Count Display */}
      {!showUI && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
            {count}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            Counter
          </div>
          {autoCount && (
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              ● Auto
            </div>
          )}
        </div>
      )}

      {/* EXPANDED: Full UI */}
      {showUI && (
        <>
          {/* HEADER */}
          <div className="flex items-center justify-center w-full mb-2">
            <div className="font-semibold text-blue-900 dark:text-blue-100">
              Counter
            </div>
          </div>

          {/* COUNT DISPLAY */}
          <div className="text-2xl font-bold mb-3 text-blue-800 dark:text-blue-200">
            {count}
          </div>

          {/* MULTIPLIER INPUT */}
          <div className="flex items-center gap-2 mb-3 w-full">
            <label className="text-xs text-blue-700 dark:text-blue-300">
              Step:
            </label>
            <input
              type="number"
              step="any"
              className="flex-1 px-2 py-1 text-xs rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800"
              value={localMultiplierInput}
              onChange={handleMultiplierInputChange}
              onBlur={commitMultiplierInput}
              onKeyDown={handleMultiplierKeyDown}
            />
          </div>

          {/* AUTO COUNTER CONTROLS */}
          <div className="flex flex-col gap-2 mb-3 w-full">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`auto-count-${id}`}
                checked={autoCount}
                onChange={handleAutoCountToggle}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor={`auto-count-${id}`} className="text-xs text-blue-700 dark:text-blue-300 cursor-pointer">
                Auto Count
              </label>
              {autoCount && (
                <span className="text-xs text-green-600 dark:text-green-400">● Active</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs text-blue-700 dark:text-blue-300">
                Speed (ms):
              </label>
              <input
                type="number"
                min="100"
                step="100"
                className="flex-1 px-2 py-1 text-xs rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800"
                value={localSpeedInput}
                onChange={handleSpeedInputChange}
                onBlur={commitSpeedInput}
                onKeyDown={handleSpeedKeyDown}
                placeholder="1000"
              />
              {!autoCount && (
                <span className="text-xs text-gray-500 dark:text-gray-400">(ready)</span>
              )}
            </div>
          </div>

          {/* CONTROL BUTTONS */}
          <div className="flex gap-2 mb-2">
            <button
              className="px-3 py-1 rounded text-xs font-bold transition-colors bg-green-500 text-white hover:bg-green-600"
              onClick={handleCountUp}
            >
              +{multiplier}
            </button>
            <button
              className="px-3 py-1 rounded text-xs font-bold transition-colors bg-red-500 text-white hover:bg-red-600"
              onClick={handleCountDown}
            >
              -{multiplier}
            </button>
            <button
              className="px-3 py-1 rounded text-xs font-bold transition-colors bg-orange-500 text-white hover:bg-orange-600"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>

          {/* CONNECTION STATUS */}
          {inputConnections.length > 0 && (
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Auto-counting on true values ({inputConnections.length} input{inputConnections.length !== 1 ? 's' : ''})
            </div>
          )}
        </>
      )}
      
      {/* OUTPUT HANDLE (right, number) */}
      <CustomHandle type="source" position={Position.Right} id="n" dataType="n" />
    </div>
  )
}

export default CounterNode 