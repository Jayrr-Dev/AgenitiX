'use client'

import React from 'react'
import { Position, useNodeConnections, useNodesData, type NodeProps, type Node } from '@xyflow/react'
import CustomHandle from '../../handles/CustomHandle'
import { getInputValues, isTruthyValue } from '../utils/nodeUtils'
import { FloatingNodeId } from '../components/FloatingNodeId'
import { useFlowStore } from '../../stores/flowStore'

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------
interface LogicAndData {
  value: boolean
  inputCount: number
}

// -----------------------------------------------------------------------------
// LOGIC AND NODE COMPONENT
// -----------------------------------------------------------------------------
const LogicAnd: React.FC<NodeProps<Node<LogicAndData & Record<string, unknown>>>> = ({ id, data }) => {
  // Get all boolean input connections
  const connections = useNodeConnections({ handleType: 'target' })
  const boolInputConnections = connections.filter(c => c.targetHandle === 'b')
  const boolInputSourceIds = boolInputConnections.map((c) => c.source)
  const boolInputNodesData = useNodesData(boolInputSourceIds)
  
  // Extract input values using safe utility
  const inputValues = getInputValues(boolInputNodesData)
  
  // AND: true if all connected inputs are truthy (if none, false)
  const andResult = inputValues.length > 0 && inputValues.every(value => isTruthyValue(value))

  // Add showUI state
  const [showUI, setShowUI] = React.useState(false)

  // Set output value and input count in node data for downstream nodes
  const updateNodeData = useFlowStore((state) => state.updateNodeData)
  React.useEffect(() => {
    updateNodeData(id, { 
      triggered: andResult,
      value: andResult,
      inputCount: boolInputConnections.length 
    })
  }, [andResult, boolInputConnections.length, updateNodeData, id])

  // RENDER
  return (
    <div className={`relative ${showUI ? 'px-4 py-3 min-w-[120px] min-h-[120px]' : 'w-[60px] h-[60px] flex items-center justify-center'} rounded-lg bg-lime-100 dark:bg-lime-900 shadow border border-lime-300 dark:border-lime-800`}>
      {/* Floating Node ID */}
      <FloatingNodeId nodeId={id} />
      {/* TOGGLE BUTTON (top-left) */}
      <button
        aria-label={showUI ? 'Collapse node' : 'Expand node'}
        title={showUI ? 'Collapse' : 'Expand'}
        onClick={() => setShowUI((v) => !v)}
        className="absolute top-1 left-1 cursor-pointer z-10 w-2 h-2 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/40 border border-lime-300 dark:border-lime-800 text-xs hover:bg-lime-200 dark:hover:bg-lime-800 transition-colors shadow"
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
            <div className={`text-lg font-bold ${andResult ? 'text-lime-700 dark:text-lime-300' : 'text-lime-400 dark:text-lime-600'}`}>
              AND
            </div>
          </div>
        </div>
      )}

      {/* EXPANDED: Full UI */}
      {showUI && (
        <>
          <div className="font-semibold text-lime-900 dark:text-lime-100 mb-2">AND</div>
          <div className="text-xs text-lime-800 dark:text-lime-200 mb-2">
            Output: <span className="font-mono">{String(andResult)}</span>
          </div>
          <div className="text-xs text-lime-800 dark:text-lime-200 mb-2">
            Inputs: {boolInputConnections.length}
          </div>
        </>
      )}

      {/* OUTPUT HANDLE (right, boolean) */}
      <CustomHandle type="source" position={Position.Right} id="b" dataType="b" />
    </div>
  )
}

export default LogicAnd 