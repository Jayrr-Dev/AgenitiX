'use client'

import React from 'react'
import { Position, useNodeConnections, useNodesData, type NodeProps, type Node } from '@xyflow/react'
import CustomHandle from '../../handles/CustomHandle'
import { useReactFlow } from '@xyflow/react'
import { getInputValues, isTruthyValue } from '../utils/nodeUtils'
import { FloatingNodeId } from '../components/FloatingNodeId'

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------
interface LogicOrData {
  value: boolean
  inputCount: number
}

// -----------------------------------------------------------------------------
// LOGIC OR NODE COMPONENT
// -----------------------------------------------------------------------------
const LogicOr: React.FC<NodeProps<Node<LogicOrData & Record<string, unknown>>>> = ({ id, data }) => {
  // Get all boolean input connections
  const connections = useNodeConnections({ handleType: 'target' })
  const boolInputConnections = connections.filter(c => c.targetHandle === 'b')
  const boolInputSourceIds = boolInputConnections.map((c) => c.source)
  const boolInputNodesData = useNodesData(boolInputSourceIds)
  
  // Extract input values using safe utility
  const inputValues = getInputValues(boolInputNodesData)
  
  // OR: true if any connected input is truthy (if none, false)
  const orResult = inputValues.some(value => isTruthyValue(value))

  // Add showUI state
  const [showUI, setShowUI] = React.useState(false)

  // Set output value and input count in node data for downstream nodes
  const { updateNodeData } = useReactFlow()
  React.useEffect(() => {
    updateNodeData(id, { 
      triggered: orResult,
      value: orResult,
      inputCount: boolInputConnections.length 
    })
  }, [orResult, boolInputConnections.length, updateNodeData, id])

  // RENDER
  return (
    <div className={`relative ${showUI ? 'px-4 py-3 min-w-[120px] min-h-[120px]' : 'w-[60px] h-[60px] flex items-center justify-center'} rounded-lg bg-yellow-100 dark:bg-yellow-900 shadow border border-yellow-300 dark:border-yellow-800`}>
      {/* Floating Node ID */}
      <FloatingNodeId nodeId={id} />
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

      {/* INPUT HANDLE (left, boolean, allow multiple) */}
      <CustomHandle type="target" position={Position.Left} id="b" dataType="b" />

      {/* COLLAPSED: Only Icon */}
      {!showUI && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 flex items-center justify-center">
            <div className={`text-lg font-bold ${orResult ? 'text-yellow-700 dark:text-yellow-300' : 'text-yellow-400 dark:text-yellow-600'}`}>
              OR
            </div>
          </div>
        </div>
      )}

      {/* EXPANDED: Full UI */}
      {showUI && (
        <>
          <div className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">OR</div>
          <div className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
            Output: <span className="font-mono">{String(orResult)}</span>
          </div>
          <div className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
            Inputs: {boolInputConnections.length}
          </div>
        </>
      )}

      {/* OUTPUT HANDLE (right, boolean) */}
      <CustomHandle type="source" position={Position.Right} id="b" dataType="b" />
    </div>
  )
}

export default LogicOr 