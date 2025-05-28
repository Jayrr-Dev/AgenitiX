// nodes/TurnToUppercase.tsx
'use client'

/* -------------------------------------------------------------------------- */
/*  TurnToUppercase                                                           */
/*  – Converts input text to UPPERCASE                                        */
/* -------------------------------------------------------------------------- */

import { memo, useEffect, useState } from 'react'
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  type NodeProps,
  type Node,
} from '@xyflow/react'

import type { AgenNode } from '../../flow-editor/types'
import { useFlowStore } from '../../stores/flowStore'

import CustomHandle from '../../handles/CustomHandle'
import { FloatingNodeId } from '../components/FloatingNodeId'
import { extractNodeValue } from '../utils/nodeUtils'

interface TurnToUppercaseData {
  text: string;
}

function TurnToUppercase({ id, data }: NodeProps<Node<TurnToUppercaseData & Record<string, unknown>>>) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData)
  const [showUI, setShowUI] = useState(false)

  /* -------------------------------------------------------------- */
  /* 1️⃣  Which edges enter THIS node?                               */
  /* -------------------------------------------------------------- */
  const connections = useNodeConnections({ handleType: 'target' })
  // Filter for connections to our string input handle ('s') or default connections
  const stringConnections = connections.filter(c => 
    c.targetHandle === 's' || 
    c.targetHandle === null || 
    c.targetHandle === undefined ||
    !c.targetHandle
  )
  const sourceIds = stringConnections.map((c) => c.source)

  /* -------------------------------------------------------------- */
  /* 2️⃣  Subscribe to all connected source nodes                    */
  /* -------------------------------------------------------------- */
  const nodesData = useNodesData<AgenNode>(sourceIds)

  /* -------------------------------------------------------------- */
  /* 3️⃣  Derive the transformed text                                */
  /* -------------------------------------------------------------- */
  // Remove useMemo to prevent stale cached values
  const texts = nodesData
    .map((node) => {
      // Special handling for testInput nodes - use 'value' property directly
      if (node.type === 'testInput') {
        const value = node.data?.value
        return typeof value === 'string' ? value : String(value ?? '')
      }
      
      // Use extractNodeValue for consistent value extraction from other nodes
      const extractedValue = extractNodeValue(node.data)
      return typeof extractedValue === 'string' ? extractedValue : String(extractedValue ?? '')
    })
    .filter((text): text is string => Boolean(text))

  // If no valid text nodes are connected, return empty string
  const transformed = !texts.length ? '' : texts.join(' ').toUpperCase()

  /* -------------------------------------------------------------- */
  /* 4️⃣  Push the value to our own data                             */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    // Ensure we're updating the node data with the transformed text
    updateNodeData(id, { text: transformed })
  }, [id, transformed, updateNodeData])

  const previewText = transformed.length > 15 ? transformed.substring(0, 15) + '...' : transformed

  /* -------------------------------------------------------------- */
  /* 5️⃣  Render                                                    */
  /* -------------------------------------------------------------- */
  return (
    <div className={`relative ${showUI ? 'px-4 py-3 min-w-[120px]' : 'w-[120px] h-[60px] flex items-center justify-center'} rounded-lg bg-blue-50 dark:bg-blue-900 shadow border border-blue-300 dark:border-blue-800`}>
      {/* Floating Node ID */}
      <FloatingNodeId nodeId={id} />
      
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

      {/* INPUT HANDLE (left, string, id and dataType = 's') */}
      <CustomHandle 
        type="target" 
        position={Position.Left}
        id="s"
        dataType="s"
      />

      {/* COLLAPSED: Show preview */}
      {!showUI && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
          <div className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">Uppercase</div>
          <div className="text-xs text-blue-800 dark:text-blue-200 text-center break-words">
            {transformed ? `"${previewText}"` : sourceIds.length ? 'No text input' : 'Connect text'}
          </div>
        </div>
      )}

      {/* EXPANDED: Full UI */}
      {showUI && (
        <div className="flex text-xs flex-col w-auto">
          <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center justify-between">
            <span>Uppercase Node</span>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              {sourceIds.length} input{sourceIds.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="min-h-[60px] text-xs font-mono break-all bg-white dark:bg-blue-800 border border-blue-300 dark:border-blue-700 rounded px-3 py-2 text-blue-900 dark:text-blue-100 overflow-hidden">
            {transformed || (
              <span className="text-blue-400 dark:text-blue-500 italic">
                {sourceIds.length ? 'No text input' : 'Connect text nodes'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* OUTPUT HANDLE (right, string, id and dataType = 's') */}
      <CustomHandle 
        type="source" 
        position={Position.Right}
        id="s"
        dataType="s"
      />
    </div>
  )
}

export default memo(TurnToUppercase)
