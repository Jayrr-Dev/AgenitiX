'use client'

import React from 'react'
import { Position, useNodeConnections, useNodesData, useReactFlow, type NodeProps, type Node } from '@xyflow/react'
import CustomHandle from '../../handles/CustomHandle'

// TYPES
interface LogicAndData {
  value: boolean
  inputCount: number
}

// LOGIC AND NODE COMPONENT
const LogicAnd: React.FC<NodeProps<Node<LogicAndData & Record<string, unknown>>>> = ({ id, data }) => {
  // Get all boolean input connections
  const connections = useNodeConnections({ handleType: 'target' })
  const boolInputConnections = connections.filter(c => c.targetHandle === 'b')
  const boolInputSourceIds = boolInputConnections.map((c) => c.source)
  const boolInputNodesData = useNodesData(boolInputSourceIds)
  // AND: true if all connected inputs are true (if none, false)
  const value = boolInputNodesData.length > 0 && boolInputNodesData.every((n) => n.data.triggered)

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
    <div className="px-4 py-3 rounded-lg bg-lime-100 dark:bg-lime-900 shadow border border-lime-300 dark:border-lime-800 flex flex-col items-center min-w-[160px]">
      <div className="font-semibold text-lime-900 dark:text-lime-100 mb-2">AND</div>
      {/* INPUT HANDLES (left, boolean, allow multiple) */}
      <CustomHandle type="target" position={Position.Left} id="b" dataType="b" />
      <div className="text-lg font-mono mb-2">{value ? 'TRUE' : 'FALSE'}</div>
      <div className="text-xs text-lime-800 dark:text-lime-200 mb-2">Inputs: {boolInputConnections.length}</div>
      {/* OUTPUT HANDLE (right, boolean) */}
      <CustomHandle type="source" position={Position.Right} id="b" dataType="b" />
    </div>
  )
}

export default LogicAnd 