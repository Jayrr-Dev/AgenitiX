'use client'

import React from 'react'
import { Position, useNodeConnections, useNodesData, type NodeProps, type Node } from '@xyflow/react'
import CustomHandle from '../../handles/CustomHandle'
import { useReactFlow } from '@xyflow/react'

// TYPES
interface LogicOrData {
  value: boolean
  inputCount: number
}

// LOGIC OR NODE COMPONENT
const LogicOr: React.FC<NodeProps<Node<LogicOrData & Record<string, unknown>>>> = ({ id, data }) => {
  // Get all boolean input connections
  const connections = useNodeConnections({ handleType: 'target' })
  const boolInputConnections = connections.filter(c => c.targetHandle === 'b')
  const boolInputSourceIds = boolInputConnections.map((c) => c.source)
  const boolInputNodesData = useNodesData(boolInputSourceIds)
  // OR: true if any connected input is true (if none, false)
  const value = boolInputNodesData.some((n) => n.data.triggered)

  // Set output value and input count in node data for downstream nodes
  const { updateNodeData } = useReactFlow()
  React.useEffect(() => {
    updateNodeData(id, { 
      triggered: value,
      inputCount: boolInputConnections.length 
    })
  }, [value, boolInputConnections.length, updateNodeData, id])

  // RENDER
  return (
    <div className="px-4 py-3 rounded-lg bg-yellow-100 dark:bg-yellow-900 shadow border border-yellow-300 dark:border-yellow-800 flex flex-col items-center min-w-[160px]">
      <div className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">OR</div>
      {/* INPUT HANDLES (left, boolean, allow multiple) */}
      <CustomHandle type="target" position={Position.Left} id="b" dataType="b" />
      <div className="text-lg font-mono mb-2">{value ? 'TRUE' : 'FALSE'}</div>
      <div className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">Inputs: {boolInputConnections.length}</div>
      {/* OUTPUT HANDLE (right, boolean) */}
      <CustomHandle type="source" position={Position.Right} id="b" dataType="b" />
    </div>
  )
}

export default LogicOr 