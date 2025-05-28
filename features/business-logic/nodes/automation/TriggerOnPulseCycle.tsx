// nodes/TriggerOnPulseCycle.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Position, useReactFlow, useNodeConnections, useNodesData, type NodeProps, type Node } from '@xyflow/react'
import CustomHandle from '../../handles/CustomHandle'
import IconForPulseCycles from '../node-icons/IconForPulseCycles'

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
  const [showUI, setShowUI] = useState(false)
  const [isOn, setIsOn] = useState(data.initialState ?? false)
  const [cycleDuration, setCycleDuration] = useState(data.cycleDuration ?? 2000)
  const [pulseDuration, setPulseDuration] = useState(data.pulseDuration ?? 500)
  const [infinite, setInfinite] = useState(data.infinite ?? true)
  const [pulsing, setPulsing] = useState(false)
  const [cycleCount, setCycleCount] = useState(0)
  const [initialState, setInitialState] = useState(data.initialState ?? false)
  const [maxCycles, setMaxCycles] = useState(1)
  const [maxCyclesInput, setMaxCyclesInput] = useState('1')
  const intervalRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const [progress, setProgress] = useState(0)
  const cycleStartRef = useRef(Date.now())
  // STATE FOR CYCLE DURATION INPUT (robust text input for numeric value)
  const [cycleDurationInput, setCycleDurationInput] = useState(cycleDuration.toString())
  // STATE FOR PULSE DURATION INPUT (robust text input for numeric value)
  const [pulseDurationInput, setPulseDurationInput] = useState(pulseDuration.toString())

  // Boolean input handle logic
  const connections = useNodeConnections({ handleType: 'target' })
  const boolInputConnections = connections.filter(c => c.targetHandle === 'b')
  const boolInputSourceIds = boolInputConnections.map((c) => c.source)
  const boolInputNodesData = useNodesData(boolInputSourceIds)
  const hasExternalTrigger = boolInputSourceIds.length > 0
  const externalTrigger = boolInputNodesData.some((n) => n.data.triggered)

  // EXTERNAL TRIGGER CONTROL
  useEffect(() => {
    if (hasExternalTrigger) {
      if (externalTrigger) {
        setIsOn(initialState) // Always start with initialState
      } else {
        setIsOn(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Sync input with maxCycles when it changes from outside
  useEffect(() => {
    setMaxCyclesInput(maxCycles.toString())
  }, [maxCycles])

  // Keep local input in sync with state
  useEffect(() => { setCycleDurationInput(cycleDuration.toString()) }, [cycleDuration])
  useEffect(() => { setPulseDurationInput(pulseDuration.toString()) }, [pulseDuration])

  // Sync local state with data changes from NodeInspector
  useEffect(() => {
    if (data.infinite !== undefined && data.infinite !== infinite) {
      setInfinite(data.infinite)
    }
  }, [data.infinite, infinite])

  useEffect(() => {
    if (data.initialState !== undefined && data.initialState !== initialState) {
      setInitialState(data.initialState)
    }
  }, [data.initialState, initialState])

  useEffect(() => {
    if (data.cycleDuration !== undefined && data.cycleDuration !== cycleDuration) {
      setCycleDuration(data.cycleDuration)
    }
  }, [data.cycleDuration, cycleDuration])

  useEffect(() => {
    if (data.pulseDuration !== undefined && data.pulseDuration !== pulseDuration) {
      setPulseDuration(data.pulseDuration)
    }
  }, [data.pulseDuration, pulseDuration])

  // Handlers
  const handleToggle = () => {
    if (!hasExternalTrigger) {
      setIsOn((prev) => !prev)
    }
  }
  // HANDLER: Cycle Duration Input Change
  const handleCycleDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits
    const digits = e.target.value.replace(/\D/g, '')
    setCycleDurationInput(digits)
  }
  // HANDLER: Commit Cycle Duration Input
  const commitCycleDurationInput = () => {
    let value = Number(cycleDurationInput)
    if (isNaN(value) || value < 100) value = 100
    setCycleDuration(value)
    setCycleDurationInput(value.toString())
    updateNodeData(id, { cycleDuration: value })
  }
  const handleCycleDurationInputBlur = () => { commitCycleDurationInput() }
  const handleCycleDurationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitCycleDurationInput()
  }
  // HANDLER: Pulse Duration Input Change
  const handlePulseDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits
    const digits = e.target.value.replace(/\D/g, '')
    setPulseDurationInput(digits)
  }
  // HANDLER: Commit Pulse Duration Input
  const commitPulseDurationInput = () => {
    let value = Number(pulseDurationInput)
    if (isNaN(value) || value < 10) value = 10
    setPulseDuration(value)
    setPulseDurationInput(value.toString())
    updateNodeData(id, { pulseDuration: value })
  }
  const handlePulseDurationInputBlur = () => { commitPulseDurationInput() }
  const handlePulseDurationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitPulseDurationInput()
  }
  const handleInfiniteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfinite(e.target.checked)
    updateNodeData(id, { infinite: e.target.checked })
  }
  const handleInitialStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInitialState(e.target.checked)
    updateNodeData(id, { initialState: e.target.checked })
  }
  const handleMaxCyclesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits
    const digits = e.target.value.replace(/\D/g, '')
    setMaxCyclesInput(digits)
  }
  const commitMaxCyclesInput = () => {
    let value = Number(maxCyclesInput)
    if (isNaN(value) || value < 1) value = 1
    setMaxCycles(value)
    setMaxCyclesInput(value.toString())
  }
  const handleMaxCyclesInputBlur = () => {
    commitMaxCyclesInput()
  }
  const handleMaxCyclesInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitMaxCyclesInput()
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
        <>
          <div className="font-semibold text-cyan-900 dark:text-cyan-100 mb-2">Pulse Cycle</div>
          {/* CYCLE DURATION INPUT (robust text input) */}
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-cyan-700 dark:text-cyan-200">Cycle:</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={cycleDurationInput}
              onChange={handleCycleDurationInputChange}
              onBlur={handleCycleDurationInputBlur}
              onKeyDown={handleCycleDurationInputKeyDown}
              className="w-16 rounded border px-1 text-xs bg-white dark:bg-black"
            />
            <span className="text-xs text-cyan-700 dark:text-cyan-200">ms</span>
          </div>
          {/* PULSE DURATION INPUT (robust text input) */}
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-cyan-700 dark:text-cyan-200">Pulse:</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pulseDurationInput}
              onChange={handlePulseDurationInputChange}
              onBlur={handlePulseDurationInputBlur}
              onKeyDown={handlePulseDurationInputKeyDown}
              className="w-16 rounded border px-1 text-xs bg-white dark:bg-black"
            />
            <span className="text-xs text-cyan-700 dark:text-cyan-200">ms</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-cyan-700 dark:text-cyan-200">Infinite:</label>
            <input type="checkbox" checked={infinite} onChange={handleInfiniteChange} />
          </div>
          {!infinite && (
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-cyan-700 dark:text-cyan-200">Cycles:</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={maxCyclesInput}
                onChange={handleMaxCyclesInputChange}
                onBlur={handleMaxCyclesInputBlur}
                onKeyDown={handleMaxCyclesInputKeyDown}
                className="w-16 rounded border px-1 text-xs bg-white dark:bg-black"
              />
              {/* CYCLE COUNTER DISPLAY */}
              {isOn && (
                <span className="text-xs text-cyan-700 dark:text-cyan-200">
                  ({maxCycles - cycleCount} left)
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-cyan-700 dark:text-cyan-200">Initial On:</label>
            <input type="checkbox" checked={initialState} onChange={handleInitialStateChange} />
          </div>
          <button
            className={`px-3 py-1 rounded text-white font-bold shadow transition-colors ${
              pulsing 
                ? 'bg-red-500 hover:bg-red-600' 
                : isOn 
                  ? 'bg-emerald-700' 
                  : 'bg-emerald-500 hover:bg-emerald-600'
            } ${hasExternalTrigger ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleToggle}
            disabled={hasExternalTrigger}
          >
            {isOn ? (infinite ? 'Cycling...' : 'Cycle Once') : 'Start Cycle'}
          </button>
        </>
      )}
    </div>
  )
}

export default TriggerOnPulseCycle 