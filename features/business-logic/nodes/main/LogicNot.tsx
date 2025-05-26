// features/business-logic/nodes/main/LogicNot.tsx
'use client'

import React, { useEffect } from 'react'
import { Position, useNodeConnections, useNodesData, useReactFlow, type NodeProps, type Node } from '@xyflow/react'
import CustomHandle from '../../handles/CustomHandle'
import { useStore } from '@xyflow/react'
import IconForNot from '../node-icons/IconForNot'

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------
interface LogicNotData {
  value: boolean
  inputCount: number
}

// -----------------------------------------------------------------------------
// LOGIC NOT NODE COMPONENT
// -----------------------------------------------------------------------------
const LogicNot: React.FC<NodeProps<Node<LogicNotData & Record<string, unknown>>>> = ({ id, data }) => {
  // Get boolean input connection (only one for NOT)
  const connections = useNodeConnections({ handleType: 'target' })
  const boolInputConnections = connections.filter(c => c.targetHandle === 'b')
  const boolInputSourceId = boolInputConnections[0]?.source // Only use first connection
  const boolInputNodesData = useNodesData(boolInputSourceId ? [boolInputSourceId] : [])
  // Input value: true if connected and input is true, else false
  const inputValue = boolInputNodesData.length > 0 ? !!boolInputNodesData[0].data.triggered : false
  // Negate the input value
  const negated = !inputValue

  // Add showUI state
  const [showUI, setShowUI] = React.useState(false)

  // Set output value and input count in node data for downstream nodes
  const { updateNodeData, deleteElements } = useReactFlow()
  const edges = useStore(state => state.edges)
  React.useEffect(() => {
    // Prune extra input connections to this NOT node
    const incoming = edges.filter(e => e.target === id && e.targetHandle === 'b')
    if (incoming.length > 1) {
      const toRemove = incoming.slice(1).map(e => ({ id: e.id }))
      deleteElements({ edges: toRemove })
    }
  }, [edges, id, deleteElements])

  React.useEffect(() => {
    updateNodeData(id, { 
      triggered: negated,
      inputCount: boolInputConnections.length
    })
  }, [negated, boolInputConnections.length, updateNodeData, id])

  // RENDER
  return (
    <div className={`relative ${showUI ? 'px-4 py-3 min-w-[120px] min-h-[120px]' : 'w-[60px] h-[60px] flex items-center justify-center'} rounded-lg bg-yellow-100 dark:bg-yellow-900 shadow border border-yellow-300 dark:border-yellow-800`}>
      {/* TOGGLE BUTTON (top-left) */}
      <button
        aria-label={showUI ? 'Collapse node' : 'Expand node'}
        title={showUI ? 'Collapse' : 'Expand'}
        onClick={() => setShowUI((v) => !v)}
        className="absolute top-1 left-1 cursor-pointer z-10 w-2 h-2 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/40 border border-yellow-300 dark:border-yellow-800 text-xs hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors shadow"
        type="button"
      >
        {showUI ? '⦿' : '⦾'}
      </button>

      {/* INPUT HANDLE (left, boolean) */}
      <CustomHandle 
        type="target" 
        position={Position.Left} 
        id="b" 
        dataType="b"
        isConnectable={1}
      />

      {/* COLLAPSED: Only Icon */}
      {!showUI && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 flex items-center justify-center">
            <IconForNot active={inputValue} />
          </div>
        </div>
      )}

      {/* EXPANDED: Full UI without Icon */}
      {showUI && (
        <>
          <div className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">NOT</div>
          <div className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">Output: <span className="font-mono">{String(negated)}</span></div>
          <div className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">Inputs: {boolInputConnections.length}/1</div>
        </>
      )}

      {/* OUTPUT HANDLE (right, boolean) */}
      <CustomHandle type="source" position={Position.Right} id="b" dataType="b" />
    </div>
  )
}

export default LogicNot 