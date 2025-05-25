// nodes/TriggerOnPulseCycle.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Position, useReactFlow, useNodeConnections, useNodesData, type NodeProps, type Node } from '@xyflow/react'
import CustomHandle from '../../handles/CustomHandle'

// TYPES
interface TriggerOnPulseCycleData {
  triggered: boolean
  initialState?: boolean
  cycleDuration?: number
  pulseDuration?: number
  infinite?: boolean
}

// TRIGGER ON PULSE CYCLE NODE COMPONENT
const TriggerOnPulseCycle: React.FC<NodeProps<Node<TriggerOnPulseCycleData & Record<string, unknown>>>> = ({ id, data }) => {
  const { updateNodeData } = useReactFlow()
  // State
  const [isOn, setIsOn] = useState(data.initialState ?? false)
  const [cycleDuration, setCycleDuration] = useState(data.cycleDuration ?? 2000)
  const [pulseDuration, setPulseDuration] = useState(data.pulseDuration ?? 500)
  const [infinite, setInfinite] = useState(data.infinite ?? true)
  const [pulsing, setPulsing] = useState(false)
  const [cycleCount, setCycleCount] = useState(0)
  const intervalRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)

  // Boolean input handle logic
  const connections = useNodeConnections({ handleType: 'target' })
  const boolInputConnections = connections.filter(c => c.targetHandle === 'b')
  const boolInputSourceIds = boolInputConnections.map((c) => c.source)
  const boolInputNodesData = useNodesData(boolInputSourceIds)
  // If any connected boolean input is true, start the cycle
  const externalTrigger = boolInputNodesData.some((n) => n.data.triggered)

  // React to external boolean input
  useEffect(() => {
    if (externalTrigger && !isOn) {
      setIsOn(true)
    }
  }, [externalTrigger, isOn])

  // Start/stop cycle
  useEffect(() => {
    if (isOn) {
      // Start cycle
      intervalRef.current = window.setInterval(() => {
        setPulsing(true)
        updateNodeData(id, { triggered: true })
        // End pulse after pulseDuration
        timeoutRef.current = window.setTimeout(() => {
          setPulsing(false)
          updateNodeData(id, { triggered: false })
        }, pulseDuration)
        setCycleCount((c) => c + 1)
      }, cycleDuration)
    } else {
      // Stop cycle
      if (intervalRef.current) window.clearInterval(intervalRef.current)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      setPulsing(false)
      updateNodeData(id, { triggered: false })
      setCycleCount(0)
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [isOn, cycleDuration, pulseDuration, id, updateNodeData])

  // Stop after one cycle if not infinite
  useEffect(() => {
    if (!infinite && cycleCount > 0) {
      setIsOn(false)
    }
  }, [cycleCount, infinite])

  // Handlers
  const handleToggle = () => setIsOn((v) => !v)
  const handleCycleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(100, Number(e.target.value.replace(/^0+(?!$)/, '')))
    setCycleDuration(value)
    updateNodeData(id, { cycleDuration: value })
  }
  const handlePulseDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(10, Number(e.target.value.replace(/^0+(?!$)/, '')))
    setPulseDuration(value)
    updateNodeData(id, { pulseDuration: value })
  }
  const handleInfiniteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfinite(e.target.checked)
    updateNodeData(id, { infinite: e.target.checked })
  }
  const handleInitialStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsOn(e.target.checked)
    updateNodeData(id, { initialState: e.target.checked })
  }

  // RENDER
  return (
    <div className={`px-4 py-3 rounded-lg bg-cyan-100 dark:bg-cyan-900 shadow border border-cyan-300 dark:border-cyan-800 flex flex-col items-center min-w-[220px]`}>
      {/* INPUT HANDLE (left, boolean, can externally trigger this node) */}
      <CustomHandle type="target" position={Position.Left} id="b" dataType="b" />
      <div className="font-semibold text-cyan-900 dark:text-cyan-100 mb-2">Pulse Cycle Trigger</div>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-cyan-700 dark:text-cyan-200">Cycle:</label>
        <input
          type="number"
          min={100}
          value={cycleDuration}
          onChange={handleCycleDurationChange}
          className="w-16 rounded border px-1 text-xs bg-white dark:bg-black"
        />
        <span className="text-xs text-cyan-700 dark:text-cyan-200">ms</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-cyan-700 dark:text-cyan-200">Pulse:</label>
        <input
          type="number"
          min={10}
          value={pulseDuration}
          onChange={handlePulseDurationChange}
          className="w-16 rounded border px-1 text-xs bg-white dark:bg-black"
        />
        <span className="text-xs text-cyan-700 dark:text-cyan-200">ms</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-cyan-700 dark:text-cyan-200">Infinite:</label>
        <input type="checkbox" checked={infinite} onChange={handleInfiniteChange} />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-cyan-700 dark:text-cyan-200">Initial On:</label>
        <input type="checkbox" checked={isOn} onChange={handleInitialStateChange} />
      </div>
      <button
        className={`px-3 py-1 rounded bg-cyan-500 text-white font-bold shadow transition-colors ${isOn ? 'bg-cyan-700' : 'hover:bg-cyan-600'}`}
        onClick={handleToggle}
      >
        {isOn ? (infinite ? 'Cycling...' : 'Cycle Once') : 'Start Cycle'}
      </button>
      {/* OUTPUT HANDLE (right, boolean, id and dataType = 'b') */}
      <CustomHandle type="source" position={Position.Right} id="b" dataType="b" />
    </div>
  )
}

export default TriggerOnPulseCycle 