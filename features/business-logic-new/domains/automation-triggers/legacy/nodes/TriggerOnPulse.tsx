'use client'

import React, { useState, useEffect } from 'react'
import { Handle, Position, useNodeConnections, useNodesData, type NodeProps, type Node } from '@xyflow/react'
import CustomHandle from '../../handles/CustomHandle'
import IconForPulse from '../node-icons/IconForPulse'
import { useFlowStore } from '../../stores/flowStore'

// TYPES
interface TriggerOnPulseData {
  triggered: boolean
  duration?: number
}

// TRIGGER ON PULSE NODE COMPONENT
const TriggerOnPulse: React.FC<NodeProps<Node<TriggerOnPulseData & Record<string, unknown>>>> = ({ id, data }) => {
  const updateNodeData = useFlowStore((state) => state.updateNodeData)
  const isActive = !!data.triggered
  const [pulsing, setPulsing] = useState(false)
  const duration = typeof data.duration === 'number' ? data.duration : 500

  // Local state for input value as string (to preserve leading zeros)
  const [durationInput, setDurationInput] = useState(duration.toString())

  // Keep local input in sync with data.duration
  useEffect(() => {
    setDurationInput(duration.toString())
  }, [duration])

  // Boolean input handle logic
  const connections = useNodeConnections({ handleType: 'target' })
  const boolInputConnections = connections.filter(c => c.targetHandle === 'b')
  const boolInputSourceIds = boolInputConnections.map((c) => c.source)
  const boolInputNodesData = useNodesData(boolInputSourceIds)
  // If any connected boolean input is true, trigger this node
  const externalTrigger = boolInputNodesData.some((n) => n.data.triggered)

  // When triggered, set state and update node data
  const handlePulse = () => {
    setPulsing(true)
    updateNodeData(id, { triggered: true })
  }

  // Auto-reset trigger after duration (pulse behavior)
  useEffect(() => {
    if (pulsing) {
      const timeout = setTimeout(() => {
        setPulsing(false)
        updateNodeData(id, { triggered: false })
      }, duration)
      return () => clearTimeout(timeout)
    }
  }, [pulsing, id, updateNodeData, duration])

  // React to external boolean input
  useEffect(() => {
    if (externalTrigger && !pulsing) {
      setPulsing(true)
      updateNodeData(id, { triggered: true })
    }
  }, [externalTrigger, pulsing, updateNodeData, id])

  // Handle duration input change
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove leading zeros
    let valueStr = e.target.value.replace(/^0+(?!$)/, '')
    setDurationInput(valueStr)
    const value = Number(valueStr)
    if (!isNaN(value) && value > 0) {
      updateNodeData(id, { duration: value })
    }
  }

  // On blur, ensure the node data is updated with a valid number
  const handleDurationBlur = () => {
    const value = Number(durationInput)
    if (!isNaN(value) && value > 0) {
      updateNodeData(id, { duration: value })
    } else {
      setDurationInput(duration.toString()) // revert to last valid
    }
  }

  const [showUI, setShowUI] = useState(false)

  // RENDER
  return (
    <div className={`relative ${showUI ? 'px-4 py-3 min-w-[180px] min-h-[120px]' : 'w-[60px] h-[60px] flex items-center justify-center'} rounded-lg bg-amber-100 dark:bg-amber-900 shadow border border-amber-300 dark:border-amber-800`}>
      {/* TOGGLE BUTTON (top-left) */}
      <button
        aria-label={showUI ? 'Collapse node' : 'Expand node'}
        title={showUI ? 'Collapse' : 'Expand'}
        onClick={() => setShowUI((v) => !v)}
        className="absolute top-1 left-1 cursor-pointer z-10 w-2 h-2 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/40 border border-amber-300 dark:border-amber-800 text-xs hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors shadow"
        type="button"
      >
        {showUI ? '⦿' : '⦾'}
      </button>
      {/* INPUT HANDLE (left, boolean, can externally trigger this node) */}
      <CustomHandle type="target" position={Position.Left} id="b" dataType="b" />
      {/* COLLAPSED: Only Icon */}
      {!showUI && (
        <div className="absolute inset-0 flex items-center justify-center">
          <IconForPulse
            isPulsing={pulsing}
            onClick={handlePulse}
            size={40}
            disabled={pulsing}
          />
        </div>
      )}
      {/* EXPANDED: Full UI */}
      {showUI && (
        <div className="flex flex-col items-center">
          <div className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Pulse Trigger</div>
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="pulse-duration" className="text-xs text-amber-700 dark:text-amber-200">Duration:</label>
            <input
              id="pulse-duration"
              type="text"
              inputMode="numeric"
              min={50}
              step={50}
              value={durationInput}
              onChange={handleDurationChange}
              onBlur={handleDurationBlur}
              className="w-16 rounded border px-1 text-xs bg-white dark:bg-black"
            />
            <span className="text-xs text-amber-700 dark:text-amber-200">ms</span>
          </div>
          <IconForPulse
            isPulsing={pulsing}
            onClick={handlePulse}
            size={48}
            disabled={pulsing}
          />
        </div>
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

export default TriggerOnPulse
