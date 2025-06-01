// nodes/TriggerOnToggle.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Position, useNodeConnections, useNodesData, type NodeProps, type Node } from '@xyflow/react'
import CustomHandle from '../../handles/CustomHandle'
import { getInputValues, isTruthyValue, hasValueChanged } from '../utils/nodeUtils'
import IconForToggle from '../node-icons/IconForToggle'
import { useFlowStore } from '../../stores/flowStore'

// TYPES
interface TriggerOnToggleData {
  triggered: boolean
}

// TRIGGER ON TOGGLE NODE COMPONENT
const TriggerOnToggle: React.FC<NodeProps<Node<TriggerOnToggleData & Record<string, unknown>>>> = ({ id, data }) => {
  const updateNodeData = useFlowStore((state) => state.updateNodeData)
  const connections = useNodeConnections({ handleType: 'target' })
  const boolInputConnections = connections.filter(c => c.targetHandle === 'b')
  const boolInputSourceIds = boolInputConnections.map((c) => c.source)
  const boolInputNodesData = useNodesData(boolInputSourceIds)
  
  // Extract input values using safe utility
  const inputValues = getInputValues(boolInputNodesData)
  const externalTrigger = inputValues.some(value => isTruthyValue(value))

  const [triggered, setTriggered] = useState(data.triggered ?? false)
  const [showUI, setShowUI] = useState(false)

  // Initialize node data on mount to ensure inspector has data
  useEffect(() => {
    const initialData = {
      triggered,
      value: triggered,
      outputValue: triggered, // For DelayNode compatibility
      type: 'TriggerOnToggle',
      label: 'Toggle Trigger'
    }
    updateNodeData(id, initialData)
  }, []) // Only run on mount

  // React to external boolean input with safe change detection
  const prevExternalTrigger = React.useRef(externalTrigger)
  useEffect(() => {
    if (boolInputConnections.length > 0) {
      if (hasValueChanged(prevExternalTrigger.current, externalTrigger)) {
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

  // Sync triggered state to node data with comprehensive fields
  useEffect(() => {
    const nodeData = {
      triggered,
      value: triggered,
      outputValue: triggered, // For DelayNode compatibility
      type: 'TriggerOnToggle',
      label: 'Toggle Trigger',
      inputCount: boolInputConnections.length,
      hasExternalInputs: boolInputConnections.length > 0
    }
    updateNodeData(id, nodeData)
  }, [triggered, boolInputConnections.length, updateNodeData, id])

  // Sync initial state from props when data changes externally
  useEffect(() => {
    if (data.triggered !== undefined && data.triggered !== triggered) {
      setTriggered(data.triggered)
    }
  }, [data.triggered])

  // RENDER
  return (
    <div className={`relative ${showUI ? 'px-4 py-3 min-w-[180px] min-h-[120px]' : 'w-[60px] h-[60px] flex items-center justify-center'} rounded-lg bg-violet-100 dark:bg-violet-900 shadow border border-violet-300 dark:border-violet-800`}>
      {/* TOGGLE BUTTON (top-left) */}
      <button
        aria-label={showUI ? 'Collapse node' : 'Expand node'}
        title={showUI ? 'Collapse' : 'Expand'}
        onClick={() => setShowUI((v) => !v)}
        className="absolute top-1 left-1 cursor-pointer z-10 w-2 h-2 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/40 border border-violet-300 dark:border-violet-800 text-xs hover:bg-violet-200 dark:hover:bg-violet-800 transition-colors shadow"
        type="button"
      >
        {showUI ? '⦿' : '⦾'}
      </button>

      {/* INPUT HANDLE (left, boolean, can externally trigger this node) */}
      <CustomHandle type="target" position={Position.Left} id="b" dataType="b" />

      {/* COLLAPSED: Only Icon */}
      {!showUI && (
        <div className="absolute inset-0 flex items-center justify-center">
          <IconForToggle 
            isOn={triggered} 
            onClick={handleToggle}
            size={40}
          />
        </div>
      )}

      {/* EXPANDED: Full UI */}
      {showUI && (
        <div className="flex flex-col items-center">
          <div className="font-semibold text-violet-900 dark:text-violet-100 mb-3">Toggle Trigger</div>
          <IconForToggle 
            isOn={triggered} 
            onClick={handleToggle}
            size={48}
          />
          <div className="text-xs text-violet-800 dark:text-violet-200 mt-2">
            Status: <span className="font-mono">{triggered ? 'ON' : 'OFF'}</span>
          </div>
          {boolInputConnections.length > 0 && (
            <div className="text-xs text-violet-800 dark:text-violet-200 mt-1">
              External inputs: {boolInputConnections.length}
            </div>
          )}
        </div>
      )}

      {/* OUTPUT HANDLE (right, boolean, id and dataType = 'b') */}
      <CustomHandle type="source" position={Position.Right} id="b" dataType="b" />
    </div>
  )
}

export default TriggerOnToggle 