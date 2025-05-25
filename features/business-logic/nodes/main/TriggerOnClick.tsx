'use client'

import React, { useState, useEffect } from 'react'
import { Handle, Position, useReactFlow, useNodeConnections, useNodesData, type NodeProps, type Node } from '@xyflow/react'
import CustomHandle from '../../handles/CustomHandle'

// TYPES
interface TriggerOnClickData {
  triggered: boolean
}

// TRIGGER ON CLICK NODE COMPONENT
const TriggerOnClick: React.FC<NodeProps<Node<TriggerOnClickData & Record<string, unknown>>>> = ({ id, data }) => {
  const { updateNodeData } = useReactFlow()
  const isTriggered = !!data.triggered

  // Boolean input handle logic
  const connections = useNodeConnections({ handleType: 'target' })
  const boolInputConnections = connections.filter(c => c.targetHandle === 'b')
  const boolInputSourceIds = boolInputConnections.map((c) => c.source)
  const boolInputNodesData = useNodesData(boolInputSourceIds)
  // If any connected boolean input is true, trigger this node
  const externalTrigger = boolInputNodesData.some((n) => n.data.triggered)

  // When triggered, set state and update node data
  const handleTrigger = () => {
    updateNodeData(id, { triggered: true })
  }

  // Reset trigger
  const handleReset = () => {
    updateNodeData(id, { triggered: false })
  }

  // React to external boolean input
  useEffect(() => {
    if (boolInputConnections.length > 0) {
      if (externalTrigger && !isTriggered) {
        updateNodeData(id, { triggered: true })
      }
      // Do NOT forcibly reset to false if externalTrigger is false
    }
    // If no boolean input is connected, do not override manual state
  }, [externalTrigger, isTriggered, updateNodeData, id, boolInputConnections.length])

  // RENDER
  return (
    <div className={`px-4 py-3 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-900 shadow border border-fuchsia-300 dark:border-fuchsia-800 flex flex-col items-center`}>
      {/* INPUT HANDLE (left, boolean, can externally trigger this node) */}
      <CustomHandle type="target" position={Position.Left} id="b" dataType="b" />
      <div className="font-semibold text-fuchsia-900 dark:text-fuchsia-100 mb-2">Trigger</div>
      {!isTriggered ? (
        <button
          className="px-3 py-1 rounded bg-fuchsia-500 text-white font-bold shadow transition-colors hover:bg-fuchsia-600"
          onClick={handleTrigger}
        >
          Click to Trigger
        </button>
      ) : (
        <button
          className="px-3 py-1 rounded bg-fuchsia-700 text-white font-bold shadow transition-colors hover:bg-fuchsia-600"
          onClick={handleReset}
        >
          Reset
        </button>
      )}
      {/* OUTPUT HANDLE (right, boolean, id and dataType = 'b') */}
      <CustomHandle type="source" position={Position.Right} id="b" dataType="b" />
      {/* Example for union: id="b|n" dataType="b" */}
      {/* <CustomHandle type="source" position={Position.Right} id="b|n" dataType="b" /> */}
      {/* Example for any: id="x" dataType="x" /> */}
      {/* Example for custom: id="customType" dataType="customType" /> */}
    </div>
  )
}

export default TriggerOnClick
