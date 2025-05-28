// nodes/CreateText.tsx
'use client'
import { memo, useEffect, useState, useRef } from 'react'
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  type NodeProps,
  type Node,
} from '@xyflow/react'
import { CreateTextData } from '../../flow-editor/types'
import { useFlowStore } from '../../stores/flowStore'
import CustomHandle from '../../handles/CustomHandle'
import { getSingleInputValue, isTruthyValue } from '../utils/nodeUtils'
import { FloatingNodeId } from '../components/FloatingNodeId'
import { 
  useNodeStyleClasses, 
  useNodeButtonTheme, 
  useNodeTextTheme,
  useNodeCategoryBaseClasses,
  useNodeCategoryButtonTheme,
  useNodeCategoryTextTheme
} from '../../stores/nodeStyleStore'

function CreateText({ id, data, selected }: NodeProps<Node<CreateTextData & Record<string, unknown>>>) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData)
  const [showUI, setShowUI] = useState(false) // Start collapsed as icon
  const [error, setError] = useState<string | null>(null)
  const [isRecovering, setIsRecovering] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Error recovery function
  const recoverFromError = () => {
    try {
      setIsRecovering(true)
      setError(null)
      // Reset to safe defaults
      updateNodeData(id, { 
        heldText: '',
        text: '',
        error: null
      })
      setTimeout(() => setIsRecovering(false), 1000)
    } catch (recoveryError) {
      console.error(`CreateText ${id} - Recovery failed:`, recoveryError)
      setError('Recovery failed. Please refresh.')
      setIsRecovering(false)
    }
  }

  // --- TRIGGER HANDLE LOGIC WITH ERROR HANDLING ---
  let triggerConnections, triggerSourceIds, triggerNodesData, triggerValue, isTriggered
  
  try {
    triggerConnections = useNodeConnections({ handleType: 'target' }).filter(c => c.targetHandle === 'b')
    triggerSourceIds = triggerConnections.map((c) => c.source)
    triggerNodesData = useNodesData(triggerSourceIds)
    
    // Use safe utility for trigger detection
    triggerValue = getSingleInputValue(triggerNodesData)
    isTriggered = isTruthyValue(triggerValue)
  } catch (connectionError) {
    console.error(`CreateText ${id} - Connection error:`, connectionError)
    setError('Connection error')
    triggerConnections = []
    triggerSourceIds = []
    triggerNodesData = []
    triggerValue = undefined
    isTriggered = false
  }

  // Simplified output logic with error handling
  useEffect(() => {
    try {
      const outputText = typeof data.heldText === 'string' ? data.heldText : ''
      
      // Validate text length (prevent memory issues)
      if (outputText.length > 100000) {
        throw new Error('Text too long (max 100,000 characters)')
      }
      
      const finalOutput = triggerSourceIds.length === 0 || isTriggered ? outputText : ''
      
      updateNodeData(id, { 
        text: finalOutput,
        error: null
      })
      
      // Clear error if operation succeeds
      if (error && !isRecovering) {
        setError(null)
      }
    } catch (updateError) {
      console.error(`CreateText ${id} - Update error:`, updateError)
      const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error'
      setError(errorMessage)
      
      // Try to update with error state
      try {
        updateNodeData(id, { 
          text: '',
          error: errorMessage
        })
      } catch (fallbackError) {
        console.error(`CreateText ${id} - Fallback update failed:`, fallbackError)
      }
    }
  }, [isTriggered, triggerSourceIds.length, data.heldText, id, updateNodeData, error, isRecovering])

  // Safe text handling
  const currentText = (() => {
    try {
      return typeof data.heldText === 'string' ? data.heldText : ''
    } catch (textError) {
      console.error(`CreateText ${id} - Text access error:`, textError)
      setError('Text access error')
      return ''
    }
  })()
  
  const previewText = currentText.length > 20 ? currentText.substring(0, 20) + '...' : currentText

  // Get centralized styling
  const nodeStyleClasses = useNodeStyleClasses(!!selected, !!error, isTriggered)
  const buttonTheme = useNodeButtonTheme(!!error, isTriggered)
  const textTheme = useNodeTextTheme(!!error)

  // Get category-aware styling (will use blue for 'create' category by default, or custom colors if enabled)
  const categoryBaseClasses = useNodeCategoryBaseClasses('createText')
  const categoryButtonTheme = useNodeCategoryButtonTheme('createText', !!error, isTriggered)
  const categoryTextTheme = useNodeCategoryTextTheme('createText', !!error)

  // Safe text change handler
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const newText = e.target.value
      
      // Validate input
      if (newText.length > 100000) {
        setError('Text too long (max 100,000 characters)')
        return
      }
      
      updateNodeData(id, { heldText: newText })
      
      // Clear error on successful input
      if (error) {
        setError(null)
      }
    } catch (inputError) {
      console.error(`CreateText ${id} - Input error:`, inputError)
      setError('Input processing error')
    }
  }

  return (
    <div className={`relative ${showUI ? 'px-4 py-3 min-w-[120px]' : 'w-[120px] h-[60px] flex items-center justify-center'} rounded-lg ${categoryBaseClasses.background} shadow border ${categoryBaseClasses.border} ${nodeStyleClasses}`}>
      {/* Error Recovery Button */}
      {error && (
        <button
          onClick={recoverFromError}
          disabled={isRecovering}
          className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs rounded-full flex items-center justify-center shadow-lg transition-colors z-20"
          title={`Error: ${error}. Click to recover.`}
          aria-label="Recover from error"
        >
          {isRecovering ? '⟳' : '!'}
        </button>
      )}
      
      {/* Floating Node ID */}
      <FloatingNodeId nodeId={id} />
      {/* TOGGLE BUTTON (top-left) */}
      <button
        aria-label={showUI ? 'Collapse node' : 'Expand node'}
        title={showUI ? 'Collapse' : 'Expand'}
        onClick={() => setShowUI((v) => !v)}
        className={`absolute top-1 left-1 cursor-pointer z-10 w-2 h-2 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/40 border text-xs transition-colors shadow ${error ? buttonTheme : isTriggered ? buttonTheme : categoryButtonTheme}`}
        type="button"
      >
        {showUI ? '⦿' : '⦾'}
      </button>

      {/* TRIGGER INPUT HANDLE (left, boolean) */}
      <CustomHandle type="target" position={Position.Left} id="b" dataType="b" />

      {/* COLLAPSED: Show editable preview */}
      {!showUI && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
          <div className={`text-xs font-semibold mt-1 ${error ? textTheme.primary : categoryTextTheme.primary}`}>
            {error ? 'Error' : 'Create Text'}
          </div>
          {error ? (
            <div className={`text-xs text-center break-words ${textTheme.secondary}`}>
              {error}
            </div>
          ) : (
            <div 
              className="nodrag nowheel w-full flex-1 flex items-center justify-center"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <textarea
                className={`w-full h-8 px-2 py-2 mb-2 text-xs text-center rounded border bg-transparent placeholder-opacity-60 resize-none focus:outline-none focus:ring-1 focus:border-transparent transition-colors overflow-y-auto ${categoryTextTheme.border} ${categoryTextTheme.primary} ${categoryTextTheme.focus}`}
                value={currentText}
                onChange={handleTextChange}
                placeholder="Enter text..."
                disabled={!!error}
                style={{ 
                  lineHeight: '1.2',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.select()}
                onWheel={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      )}

      {/* EXPANDED: Full editing UI */}
      {showUI && (
        <div className="flex text-xs flex-col w-auto ">
          <div className={`font-semibold mb-2 flex items-center justify-between ${error ? textTheme.primary : categoryTextTheme.primary}`}>
            <span>{error ? 'Error' : 'Create Text'}</span>
            {error && (
              <span className="text-xs text-red-600 dark:text-red-400">● {error}</span>
            )}
          </div>
          
          {error && (
            <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
              <div className="font-semibold mb-1">Error Details:</div>
              <div className="mb-2">{error}</div>
              <button
                onClick={recoverFromError}
                disabled={isRecovering}
                className="px-2 py-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded text-xs transition-colors"
              >
                {isRecovering ? 'Recovering...' : 'Recover'}
              </button>
            </div>
          )}
          
          <div 
            className="nodrag nowheel"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <textarea
              ref={textareaRef}
              className={`w-full text-xs min-h-[60px] px-3 py-2 rounded border bg-white dark:bg-blue-800 placeholder-blue-400 dark:placeholder-blue-500 resize-both focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                error 
                  ? `${textTheme.border} ${textTheme.primary} ${textTheme.focus}`
                  : `${categoryTextTheme.border} ${categoryTextTheme.primary} ${categoryTextTheme.focus}`
              }`}
              value={currentText}
              onChange={handleTextChange}
              placeholder={error ? "Fix error to continue editing..." : "Enter your text here..."}
              disabled={!!error}
              style={{ 
                lineHeight: '1.4',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>
      )}

      {/* DATA OUTPUT HANDLE (right, string) */}
      <CustomHandle type="source" position={Position.Right} id="s" dataType="s" />
    </div>
  )
}

export default memo(CreateText)
