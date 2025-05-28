// nodes/CyclePulse.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Position, useNodeConnections, useNodesData, type NodeProps, type Node } from '@xyflow/react'
import CustomHandle from '../../handles/CustomHandle'
import IconForPulseCycles from '../node-icons/IconForPulseCycles'
import { CyclePulseData } from '../../flow-editor/types'
import { useFlowStore } from '../../stores/flowStore'

// CYCLE PULSE NODE COMPONENT
const CyclePulse: React.FC<NodeProps<Node<CyclePulseData & Record<string, unknown>>>> = ({ id, data }) => {
  // Zustand store actions
  const updateNodeData = useFlowStore(state => state.updateNodeData)
  
  // State
  const [showUI, setShowUI] = useState(false)
  const [isOn, setIsOn] = useState(data.initialState ?? false)
  const [pulsing, setPulsing] = useState(false)
  const [cycleCount, setCycleCount] = useState(0)
  const intervalRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const [progress, setProgress] = useState(0)
  const cycleStartRef = useRef(Date.now())

  // Get values from data with defaults
  const cycleDuration = data.cycleDuration ?? 2000
  const pulseDuration = data.pulseDuration ?? 500
  const infinite = data.infinite ?? true
  const initialState = data.initialState ?? false
  const maxCycles = data.maxCycles ?? 1

  // Boolean input handle logic
  const connections = useNodeConnections({ handleType: 'target' })
  const boolInputConnections = connections.filter(c => c.targetHandle === 'b')
  const boolInputSourceIds = boolInputConnections.map((c) => c.source)
  const boolInputNodesData = useNodesData(boolInputSourceIds)
  const hasExternalTrigger = boolInputSourceIds.length > 0
  const externalTrigger = boolInputNodesData.some((n) => n.data.triggered)

  // INSPECTOR CONTROLS - Use separate control property to avoid feedback loop
  const prevIsRunningRef = useRef(data.isRunning)
  useEffect(() => {
    if (!hasExternalTrigger) {
      // Only respond to changes in isRunning control property from inspector
      if (data.isRunning !== prevIsRunningRef.current) {
        setIsOn(!!data.isRunning)
        prevIsRunningRef.current = data.isRunning
      }
    }
  }, [data.isRunning, hasExternalTrigger])

  // EXTERNAL TRIGGER CONTROL
  useEffect(() => {
    if (hasExternalTrigger) {
      if (externalTrigger) {
        setIsOn(initialState) // Always start with initialState
      } else {
        setIsOn(false)
      }
    }
  }, [externalTrigger, hasExternalTrigger, initialState])

  // Start/stop cycle
  useEffect(() => {
    if (isOn) {
      setCycleCount(0) // Reset on start
      let cycleTimer: number | null = null
      let pulseTimer: number | null = null

      const startCycle = () => {
        // Reset progress and set cycle start time
        setProgress(0)
        cycleStartRef.current = Date.now()
        
        setPulsing(true)
        // Update triggered for boolean output to other nodes
        updateNodeData(id, { triggered: true })
        
        // End pulse after pulseDuration
        pulseTimer = window.setTimeout(() => {
          setPulsing(false)
          updateNodeData(id, { triggered: false })
          setCycleCount(c => c + 1)
        }, pulseDuration)
      }

      // Start first cycle
      startCycle()

      // Set up cycle interval (total cycle duration = cycleDuration + pulseDuration)
      cycleTimer = window.setInterval(startCycle, cycleDuration + pulseDuration)

      return () => {
        if (cycleTimer) window.clearInterval(cycleTimer)
        if (pulseTimer) window.clearTimeout(pulseTimer)
      }
    } else {
      // Stop cycle
      setPulsing(false)
      updateNodeData(id, { triggered: false })
      setCycleCount(0)
      setProgress(0)
    }
  }, [isOn, cycleDuration, pulseDuration, id, updateNodeData])

  // Update progress for radial indicator - only during cycle time
  useEffect(() => {
    if (!isOn) {
      setProgress(0)
      return
    }

    const updateProgress = () => {
      const now = Date.now()
      const elapsed = now - cycleStartRef.current
      
      if (pulsing) {
        // During pulse, keep the last progress value
        const remainingTime = Math.max(0, cycleDuration - (elapsed - pulseDuration))
        const newProgress = 1 - (remainingTime / cycleDuration)
        setProgress(Math.min(1, Math.max(0, newProgress)))
      } else {
        // After pulse, calculate progress based on remaining cycle time
        const remainingTime = Math.max(0, cycleDuration - (elapsed - pulseDuration))
        const newProgress = 1 - (remainingTime / cycleDuration)
        setProgress(Math.min(1, Math.max(0, newProgress)))
      }
    }

    // Update immediately and then every 30ms
    updateProgress()
    const interval = setInterval(updateProgress, 30)
    return () => clearInterval(interval)
  }, [isOn, pulsing, cycleDuration, pulseDuration])

  // Stop after maxCycles if not infinite
  useEffect(() => {
    if (!infinite && cycleCount >= maxCycles) {
      setIsOn(false)
    }
  }, [cycleCount, infinite, maxCycles])

  // Handlers
  const handleToggle = () => {
    if (!hasExternalTrigger) {
      const newIsOn = !isOn
      setIsOn(newIsOn)
      // Don't update triggered here - let the inspector controls manage that
    }
  }

  const handleCycleDurationChange = (value: number) => {
    updateNodeData(id, { cycleDuration: value })
  }

  const handlePulseDurationChange = (value: number) => {
    updateNodeData(id, { pulseDuration: value })
  }

  const handleInfiniteChange = (value: boolean) => {
    updateNodeData(id, { infinite: value })
  }

  const handleInitialStateChange = (value: boolean) => {
    updateNodeData(id, { initialState: value })
  }

  const handleMaxCyclesChange = (value: number) => {
    updateNodeData(id, { maxCycles: value })
  }

  // RENDER
  return (
    <div className={`relative ${showUI ? 'px-4 py-3 min-w-[220px]' : 'w-[120px] h-[120px] flex items-center justify-center'} rounded-lg bg-emerald-100 dark:bg-emerald-900 shadow border border-emerald-300 dark:border-emerald-800`}>
      {/* HANDLES: Always visible */}
      <CustomHandle type="target" position={Position.Left} id="b" dataType="b" style={{ top: '50%', left: 0, transform: 'translateY(-50%)', zIndex: 20 }} />
      <CustomHandle type="source" position={Position.Right} id="b" dataType="b" style={{ top: '50%', right: 0, transform: 'translateY(-50%)', zIndex: 20 }} />
      
      {/* TOGGLE BUTTON (top-right, always visible) */}
      <button
        aria-label={showUI ? 'Collapse node' : 'Expand node'}
        title={showUI ? 'Collapse' : 'Expand'}
        onClick={() => setShowUI((v) => !v)}
        className="absolute top-1 left-1 cursor-pointer z-10 w-2 h-2 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/40 border border-cyan-300 dark:border-cyan-800 text-xs hover:bg-cyan-200 dark:hover:bg-cyan-800 transition-colors shadow"
        type="button"
      >
        {showUI ? '⦿' : '⦾'}
      </button>
      
      {/* COLLAPSED: Centered Icon */}
      {!showUI && (
        <div className="flex items-center justify-center w-full h-full">
          <IconForPulseCycles
            progress={progress}
            onToggle={handleToggle}
            isRunning={isOn}
            label="Pulse Cycle"
            size={100}
            color={pulsing ? '#ef4444' : '#3b82f6'}
          />
        </div>
      )}
      
      {/* EXPANDED: Full UI */}
      {showUI && (
        <CyclePulseExpandedUI
          cycleDuration={cycleDuration}
          pulseDuration={pulseDuration}
          infinite={infinite}
          maxCycles={maxCycles}
          initialState={initialState}
          isOn={isOn}
          cycleCount={cycleCount}
          pulsing={pulsing}
          hasExternalTrigger={hasExternalTrigger}
          onCycleDurationChange={handleCycleDurationChange}
          onPulseDurationChange={handlePulseDurationChange}
          onInfiniteChange={handleInfiniteChange}
          onMaxCyclesChange={handleMaxCyclesChange}
          onInitialStateChange={handleInitialStateChange}
          onToggle={handleToggle}
        />
      )}
    </div>
  )
}

// Separate component for expanded UI to keep main component clean
interface CyclePulseExpandedUIProps {
  cycleDuration: number
  pulseDuration: number
  infinite: boolean
  maxCycles: number
  initialState: boolean
  isOn: boolean
  cycleCount: number
  pulsing: boolean
  hasExternalTrigger: boolean
  onCycleDurationChange: (value: number) => void
  onPulseDurationChange: (value: number) => void
  onInfiniteChange: (value: boolean) => void
  onMaxCyclesChange: (value: number) => void
  onInitialStateChange: (value: boolean) => void
  onToggle: () => void
}

const CyclePulseExpandedUI: React.FC<CyclePulseExpandedUIProps> = ({
  cycleDuration,
  pulseDuration,
  infinite,
  maxCycles,
  initialState,
  isOn,
  cycleCount,
  pulsing,
  hasExternalTrigger,
  onCycleDurationChange,
  onPulseDurationChange,
  onInfiniteChange,
  onMaxCyclesChange,
  onInitialStateChange,
  onToggle,
}) => {
  const [cycleDurationInput, setCycleDurationInput] = useState(cycleDuration.toString())
  const [pulseDurationInput, setPulseDurationInput] = useState(pulseDuration.toString())
  const [maxCyclesInput, setMaxCyclesInput] = useState(maxCycles.toString())

  // Sync inputs with props
  useEffect(() => { setCycleDurationInput(cycleDuration.toString()) }, [cycleDuration])
  useEffect(() => { setPulseDurationInput(pulseDuration.toString()) }, [pulseDuration])
  useEffect(() => { setMaxCyclesInput(maxCycles.toString()) }, [maxCycles])

  const commitCycleDuration = () => {
    let value = Number(cycleDurationInput)
    if (isNaN(value) || value < 100) value = 100
    onCycleDurationChange(value)
    setCycleDurationInput(value.toString())
  }

  const commitPulseDuration = () => {
    let value = Number(pulseDurationInput)
    if (isNaN(value) || value < 10) value = 10
    onPulseDurationChange(value)
    setPulseDurationInput(value.toString())
  }

  const commitMaxCycles = () => {
    let value = Number(maxCyclesInput)
    if (isNaN(value) || value < 1) value = 1
    onMaxCyclesChange(value)
    setMaxCyclesInput(value.toString())
  }

  return (
    <>
      <div className="font-semibold text-cyan-900 dark:text-cyan-100 mb-2">Pulse Cycle</div>
      
      {/* CYCLE DURATION INPUT */}
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-cyan-700 dark:text-cyan-200">Cycle:</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={cycleDurationInput}
          onChange={(e) => setCycleDurationInput(e.target.value.replace(/\D/g, ''))}
          onBlur={commitCycleDuration}
          onKeyDown={(e) => e.key === 'Enter' && commitCycleDuration()}
          className="w-16 rounded border px-1 text-xs bg-white dark:bg-black"
        />
        <span className="text-xs text-cyan-700 dark:text-cyan-200">ms</span>
      </div>
      
      {/* PULSE DURATION INPUT */}
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-cyan-700 dark:text-cyan-200">Pulse:</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pulseDurationInput}
          onChange={(e) => setPulseDurationInput(e.target.value.replace(/\D/g, ''))}
          onBlur={commitPulseDuration}
          onKeyDown={(e) => e.key === 'Enter' && commitPulseDuration()}
          className="w-16 rounded border px-1 text-xs bg-white dark:bg-black"
        />
        <span className="text-xs text-cyan-700 dark:text-cyan-200">ms</span>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-cyan-700 dark:text-cyan-200">Infinite:</label>
        <input 
          type="checkbox" 
          checked={infinite} 
          onChange={(e) => onInfiniteChange(e.target.checked)} 
        />
      </div>
      
      {!infinite && (
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs text-cyan-700 dark:text-cyan-200">Cycles:</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={maxCyclesInput}
            onChange={(e) => setMaxCyclesInput(e.target.value.replace(/\D/g, ''))}
            onBlur={commitMaxCycles}
            onKeyDown={(e) => e.key === 'Enter' && commitMaxCycles()}
            className="w-16 rounded border px-1 text-xs bg-white dark:bg-black"
          />
          {isOn && (
            <span className="text-xs text-cyan-700 dark:text-cyan-200">
              ({maxCycles - cycleCount} left)
            </span>
          )}
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-cyan-700 dark:text-cyan-200">Initial On:</label>
        <input 
          type="checkbox" 
          checked={initialState} 
          onChange={(e) => onInitialStateChange(e.target.checked)} 
        />
      </div>
      
      <button
        className={`px-3 py-1 rounded text-white font-bold shadow transition-colors ${
          pulsing 
            ? 'bg-red-500 hover:bg-red-600' 
            : isOn 
              ? 'bg-emerald-700' 
              : 'bg-emerald-500 hover:bg-emerald-600'
        } ${hasExternalTrigger ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={onToggle}
        disabled={hasExternalTrigger}
      >
        {isOn ? (infinite ? 'Cycling...' : 'Cycle Once') : 'Start Cycle'}
      </button>
    </>
  )
}

export default CyclePulse 