// nodes/TextNode.tsx
'use client'
import { memo, useEffect, useState, useRef } from 'react'
import {
  Handle,
  Position,
  useReactFlow,
  useNodeConnections,
  useNodesData,
  type NodeProps,
  type Node,
} from '@xyflow/react'
import { TextNodeData } from '../initialElements'
import CustomHandle from '../../handles/CustomHandle'
import { getSingleInputValue, isTruthyValue } from '../utils/nodeUtils'

function TextNode({ id, data }: NodeProps<Node<TextNodeData & Record<string, unknown>>>) {
  const { updateNodeData } = useReactFlow()
  const [showUI, setShowUI] = useState(false) // Start collapsed as icon
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // --- TRIGGER HANDLE LOGIC ---
  const triggerConnections = useNodeConnections({ handleType: 'target' }).filter(c => c.targetHandle === 'b')
  const triggerSourceIds = triggerConnections.map((c) => c.source)
  const triggerNodesData = useNodesData(triggerSourceIds)
  
  // Use safe utility for trigger detection
  const triggerValue = getSingleInputValue(triggerNodesData)
  const isTriggered = isTruthyValue(triggerValue)

  // --- Set heldText to defaultText on mount if not set ---
  useEffect(() => {
    if (typeof data.heldText !== 'string' && typeof data.defaultText === 'string') {
      updateNodeData(id, { heldText: data.defaultText })
    }
  }, [data.heldText, data.defaultText, id, updateNodeData])

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(60, textareaRef.current.scrollHeight)}px`
    }
  }, [data.heldText])

  // Only output value when triggered, otherwise output empty string
  useEffect(() => {
    const outputText = typeof data.heldText === 'string' ? data.heldText : ''
    const nodeData = {
      text: triggerSourceIds.length === 0 || isTriggered ? outputText : '',
      value: outputText,
      outputValue: outputText,
      type: 'TextNode',
      label: 'Text Node',
      isTriggered,
      hasExternalTrigger: triggerSourceIds.length > 0
    }
    updateNodeData(id, nodeData)
  }, [isTriggered, triggerSourceIds.length, data.heldText, id, updateNodeData])

  const currentText = typeof data.heldText === 'string' ? data.heldText : ''
  const previewText = currentText.length > 20 ? currentText.substring(0, 20) + '...' : currentText

  return (
    <div className={`relative ${showUI ? 'px-4 py-3 min-w-[200px]' : 'w-[120px] h-[60px] flex items-center justify-center'} rounded-lg bg-blue-50 dark:bg-blue-900 shadow border border-blue-300 dark:border-blue-800`}>
      {/* TOGGLE BUTTON (top-left) */}
      <button
        aria-label={showUI ? 'Collapse node' : 'Expand node'}
        title={showUI ? 'Collapse' : 'Expand'}
        onClick={() => setShowUI((v) => !v)}
        className="absolute top-1 left-1 cursor-pointer z-10 w-2 h-2 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/40 border border-blue-300 dark:border-blue-800 text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors shadow"
        type="button"
      >
        {showUI ? '⦿' : '⦾'}
      </button>

      {/* TRIGGER INPUT HANDLE (left, boolean) */}
      <CustomHandle type="target" position={Position.Left} id="b" dataType="b" />

      {/* COLLAPSED: Show preview */}
      {!showUI && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
          <div className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">Text</div>
          <div className="text-xs text-blue-800 dark:text-blue-200 text-center break-words">
            {currentText ? `"${previewText}"` : 'Empty'}
          </div>
          {isTriggered && (
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">●</div>
          )}
        </div>
      )}

      {/* EXPANDED: Full editing UI */}
      {showUI && (
        <div className="flex flex-col w-full">
          <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center justify-between">
            <span>Text Node</span>
            {isTriggered && (
              <span className="text-xs text-green-600 dark:text-green-400">● Active</span>
            )}
          </div>
          
          <textarea
            ref={textareaRef}
            className="w-full min-h-[60px] max-h-[200px] px-3 py-2 rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-blue-800 text-blue-900 dark:text-blue-100 placeholder-blue-400 dark:placeholder-blue-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={currentText}
            onChange={(e) => updateNodeData(id, { heldText: e.target.value })}
            placeholder="Enter your text here..."
            style={{ 
              fontSize: '14px',
              lineHeight: '1.4',
              fontFamily: 'inherit'
            }}
          />
          
          <div className="flex justify-between items-center mt-2 text-xs text-blue-700 dark:text-blue-300">
            <span>{currentText.length} characters</span>
            {triggerSourceIds.length > 0 && (
              <span className={isTriggered ? 'text-green-600' : 'text-gray-500'}>
                {isTriggered ? 'Outputting' : 'Waiting for trigger'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* DATA OUTPUT HANDLE (right, string) */}
      <CustomHandle type="source" position={Position.Right} id="s" dataType="s" />
    </div>
  )
}

export default memo(TextNode)
