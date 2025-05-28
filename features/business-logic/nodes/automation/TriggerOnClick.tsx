'use client'

import React, { useState, useEffect } from 'react'
import { Handle, Position, useReactFlow, useNodeConnections, useNodesData, type NodeProps, type Node } from '@xyflow/react'
import CustomHandle from '../../handles/CustomHandle'
import IconForTrigger from '../node-icons/IconForTrigger'
import { FloatingNodeId } from '../components/FloatingNodeId'

// TYPES
interface TriggerOnClickData {
  triggered: boolean
}

// TRIGGER ON CLICK NODE COMPONENT
const TriggerOnClick: React.FC<NodeProps<Node<TriggerOnClickData & Record<string, unknown>>>> = ({ id, data }) => {
  const { updateNodeData } = useReactFlow()
  const isTriggered = data.triggered === true

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
    updateNodeData(id, { triggered: undefined })
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

  // Expand/collapse UI state
  const [showUI, setShowUI] = useState(false)

  // RENDER
  return (
    <div className={`relative ${showUI ? 'px-4 py-3 min-w-[180px] min-h-[120px]' : 'w-[60px] h-[60px] flex items-center justify-center'} rounded-lg shadow border bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-800`}>
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
      {/* INPUT HANDLE (left, boolean, can externally trigger this node) */}
      <CustomHandle type="target" position={Position.Left} id="b" dataType="b" />
      {/* COLLAPSED: Only Icon */}
      {!showUI && (
        <div className="absolute inset-0 flex items-center justify-center">
          <IconForTrigger isOn={isTriggered} onClick={isTriggered ? handleReset : handleTrigger} size={40} />
        </div>
      )}
      {/* EXPANDED: Full UI */}
      {showUI && (
        <>
          {/* HEADER */}
          <div className="flex items-center justify-center w-full mb-2 mt-2">
            <div className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <IconForTrigger isOn={isTriggered} onClick={isTriggered ? handleReset : handleTrigger} size={20} />
              Trigger
            </div>
          </div>
          {/* BUTTONS */}
          {isTriggered ? (
            <button
              className="px-3 py-1 rounded bg-blue-700 text-white font-bold shadow transition-colors hover:bg-blue-600"
              onClick={handleReset}
            >
              Reset
            </button>
          ) : (
            <button
              className="px-3 py-1 rounded bg-blue-500 text-white font-bold shadow transition-colors hover:bg-blue-600"
              onClick={handleTrigger}
            >
              Click to Trigger
            </button>
          )}
        </>
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
