// nodes/TriggerOnToggle.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Position, useReactFlow, useNodeConnections, useNodesData, type NodeProps, type Node } from '@xyflow/react'
import CustomHandle from '../../handles/CustomHandle'

// TYPES
interface TriggerOnToggleData {
  triggered: boolean
}

// TRIGGER ON TOGGLE NODE COMPONENT
const TriggerOnToggle: React.FC<NodeProps<Node<TriggerOnToggleData & Record<string, unknown>>>> = ({ id, data }) => {
  const { updateNodeData } = useReactFlow()
  const connections = useNodeConnections({ handleType: 'target' })
  const boolInputConnections = connections.filter(c => c.targetHandle === 'b')
  const boolInputSourceIds = boolInputConnections.map((c) => c.source)
  const boolInputNodesData = useNodesData(boolInputSourceIds)
  const externalTrigger = boolInputNodesData.some((n) => n.data.triggered)

  const [triggered, setTriggered] = useState(data.triggered ?? false)

  // React to external boolean input
  const prevExternalTrigger = React.useRef(externalTrigger)
  useEffect(() => {
    if (boolInputConnections.length > 0) {
      if (externalTrigger !== prevExternalTrigger.current) {
        setTriggered((prev) => !prev)
      }
    }
    prevExternalTrigger.current = externalTrigger
    // If no boolean input is connected, manual toggle works as before
  }, [externalTrigger, boolInputConnections.length])

  // Toggle handler
  const handleToggle = () => {
    setTriggered((prev) => !prev)
  }

  // Sync triggered state to node data
  useEffect(() => {
    updateNodeData(id, { triggered })
  }, [triggered, updateNodeData, id])

  // RENDER
  return (
    <div className="px-4 py-3 rounded-lg bg-violet-100 dark:bg-violet-900 shadow border border-violet-300 dark:border-violet-800 flex flex-col items-center min-w-[180px]">
      <div className="font-semibold text-violet-900 dark:text-violet-100 mb-2">Toggle Trigger</div>
      <button
        className={`px-3 py-1 rounded bg-violet-500 text-white font-bold shadow transition-colors ${triggered ? 'bg-violet-700' : 'hover:bg-violet-600'}`}
        onClick={handleToggle}
      >
        {triggered ? 'ON' : 'OFF'}
      </button>
      {/* INPUT HANDLE (left, boolean, can externally trigger this node) */}
      <CustomHandle type="target" position={Position.Left} id="b" dataType="b" />
      {/* OUTPUT HANDLE (right, boolean, id and dataType = 'b') */}
      <CustomHandle type="source" position={Position.Right} id="b" dataType="b" />
    </div>
  )
}

export default TriggerOnToggle 