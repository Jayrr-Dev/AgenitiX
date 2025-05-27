'use client'

import React, { useEffect } from 'react'
import { Position, useNodeConnections, useNodesData, useReactFlow, type NodeProps, type Node } from '@xyflow/react'
import CustomHandle from '../../handles/CustomHandle'
import { getInputValues, isTruthyValue } from '../utils/nodeUtils'

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------
interface LogicXorData {
  value: boolean
}

// -----------------------------------------------------------------------------
// LOGIC XOR NODE COMPONENT
// -----------------------------------------------------------------------------
const LogicXor: React.FC<NodeProps<Node<LogicXorData & Record<string, unknown>>>> = ({ id, data }) => {
  // Get all boolean input connections (single handle, multiple connections)
  const connections = useNodeConnections({ handleType: 'target' })
  const boolInputConnections = connections.filter(c => c.targetHandle === 'b')
  const boolInputSourceIds = boolInputConnections.map((c) => c.source)
  const boolInputNodesData = useNodesData(boolInputSourceIds)
  
  // Extract input values using safe utility
  const inputValues = getInputValues(boolInputNodesData)
  
  // XOR logic: true if exactly one input is truthy
  const trueInputs = inputValues.filter(value => isTruthyValue(value)).length
  const xorResult = trueInputs === 1

  // Add showUI state
  const [showUI, setShowUI] = React.useState(false)

  // Set output value in node data for downstream nodes
  const { updateNodeData } = useReactFlow()
  React.useEffect(() => {
    updateNodeData(id, { 
      triggered: xorResult,
      value: xorResult
    })
  }, [xorResult, updateNodeData, id])

  // RENDER
  return (
    <div className={`relative ${showUI ? 'px-4 py-3 min-w-[120px] min-h-[120px]' : 'w-[60px] h-[60px] flex items-center justify-center'} rounded-lg bg-purple-100 dark:bg-purple-900 shadow border border-purple-300 dark:border-purple-800`}>
      {/* TOGGLE BUTTON (top-left) */}
      <button
        aria-label={showUI ? 'Collapse node' : 'Expand node'}
        title={showUI ? 'Collapse' : 'Expand'}
        onClick={() => setShowUI((v) => !v)}
        className="absolute top-1 left-1 cursor-pointer z-10 w-2 h-2 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/40 border border-purple-300 dark:border-purple-800 text-xs hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors shadow"
        type="button"
      >
        {showUI ? '⦿' : '⦾'}
      </button>

      {/* INPUT HANDLE (left, boolean, allow multiple) */}
      <CustomHandle type="target" position={Position.Left} id="b" dataType="b" />

      {/* COLLAPSED: Only Icon */}
      {!showUI && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 flex items-center justify-center">
            <div className={`text-lg font-bold ${xorResult ? 'text-purple-700 dark:text-purple-300' : 'text-purple-400 dark:text-purple-600'}`}>
              XOR
            </div>
          </div>
        </div>
      )}

      {/* EXPANDED: Full UI */}
      {showUI && (
        <>
          <div className="font-semibold text-purple-900 dark:text-purple-100 mb-2">XOR</div>
          <div className="text-xs text-purple-800 dark:text-purple-200 mb-2">
            Output: <span className="font-mono">{String(xorResult)}</span>
          </div>
          <div className="text-xs text-purple-800 dark:text-purple-200 mb-2">
            True inputs: {trueInputs}
          </div>
          <div className="text-xs text-purple-800 dark:text-purple-200 mb-2">
            Inputs: {boolInputConnections.length}
          </div>
        </>
      )}

      {/* OUTPUT HANDLE (right, boolean) */}
      <CustomHandle type="source" position={Position.Right} id="b" dataType="b" />
    </div>
  )
}

export default LogicXor 