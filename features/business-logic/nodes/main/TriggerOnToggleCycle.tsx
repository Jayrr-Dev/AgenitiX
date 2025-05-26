'use client'

/* -------------------------------------------------------------------------- */
/*  TriggerOnToggleCycle                                                      */
/*  – Cycles between on/off states with customizable durations                 */
/* -------------------------------------------------------------------------- */

import React, { useState, useEffect, useRef } from 'react'
import {
  Handle,
  Position,
  useReactFlow,
  useNodeConnections,
  useNodesData,
  type NodeProps,
  type Node,
} from '@xyflow/react'

import CustomHandle from '../../handles/CustomHandle'
// import IconPlaceholder from '../node-icons/IconPlaceholder' 
import IconForToggleCycles from '../node-icons/IconForToggleCycles'

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */
interface TriggerOnToggleCycleData {
  triggered: boolean;
  initialState?: boolean;
  onDuration?: number;    // Duration in ms for ON state, default 4000
  offDuration?: number;   // Duration in ms for OFF state, default 4000
  infinite?: boolean;     // Whether to cycle infinitely
}

/* -------------------------------------------------------------------------- */
/*  COMPONENT                                                                 */
/* -------------------------------------------------------------------------- */
const TriggerOnToggleCycle: React.FC<NodeProps<Node<TriggerOnToggleCycleData & Record<string, unknown>>>> = ({ id, data }) => {
  const { updateNodeData } = useReactFlow()
  // STATE
  const [showUI, setShowUI] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [phase, setPhase] = useState(data.initialState ?? false) // true = ON, false = OFF
  const [onDuration, setOnDuration] = useState(data.onDuration ?? 4000)
  const [offDuration, setOffDuration] = useState(data.offDuration ?? 4000)
  const [infinite, setInfinite] = useState(data.infinite ?? true)
  const [cycleCount, setCycleCount] = useState(0)
  const [initialState, setInitialState] = useState(data.initialState ?? false)
  const timeoutRef = useRef<number | null>(null)
  const [progress, setProgress] = useState(0)
  const phaseStartRef = useRef(Date.now())
  // STATE FOR ON DURATION INPUT (robust text input for numeric value)
  const [onDurationInput, setOnDurationInput] = useState(onDuration.toString())
  // STATE FOR OFF DURATION INPUT (robust text input for numeric value)
  const [offDurationInput, setOffDurationInput] = useState(offDuration.toString())
  // STATE FOR MAX CYCLES INPUT (robust text input for numeric value)
  const [maxCycles, setMaxCycles] = useState(1)
  const [maxCyclesInput, setMaxCyclesInput] = useState('1')

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
        setPhase(initialState) // Always start with initialState
        setIsRunning(true)
      } else {
        setIsRunning(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalTrigger, hasExternalTrigger, initialState])

  // Main cycle effect
  useEffect(() => {
    if (!isRunning) {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      updateNodeData(id, { triggered: false })
      setCycleCount(0)
      return
    }
    // Set output for current phase
    updateNodeData(id, { triggered: phase })
    // Set up timer for next phase
    const duration = phase ? onDuration : offDuration
    timeoutRef.current = window.setTimeout(() => {
      setPhase((prev) => !prev)
      setCycleCount((c) => c + 1)
    }, duration)
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [isRunning, phase, onDuration, offDuration, id, updateNodeData])

  // Stop after maxCycles if not infinite
  useEffect(() => {
    if (!infinite && cycleCount >= maxCycles) {
      setIsRunning(false)
    }
  }, [cycleCount, infinite, maxCycles])

  // Sync input with maxCycles when it changes from outside
  useEffect(() => {
    setMaxCyclesInput(maxCycles.toString())
  }, [maxCycles])

  // Update progress for radial indicator
  useEffect(() => {
    if (!isRunning) {
      setProgress(0)
      return
    }

    const updateProgress = () => {
      const now = Date.now()
      const elapsed = now - phaseStartRef.current
      const duration = phase ? onDuration : offDuration
      
      // Calculate progress based on remaining time
      const remainingTime = Math.max(0, duration - elapsed)
      const newProgress = 1 - (remainingTime / duration)
      setProgress(Math.min(1, Math.max(0, newProgress)))
    }

    // Reset progress and start time when phase changes
    phaseStartRef.current = Date.now()
    setProgress(0)

    // Update immediately and then every 30ms
    updateProgress()
    const interval = setInterval(updateProgress, 30)
    return () => clearInterval(interval)
  }, [isRunning, phase, onDuration, offDuration])

  // Keep local input in sync with state
  useEffect(() => { setOnDurationInput(onDuration.toString()) }, [onDuration])
  useEffect(() => { setOffDurationInput(offDuration.toString()) }, [offDuration])

  // Handlers
  const handleStartStop = () => {
    if (!hasExternalTrigger) {
      setPhase(initialState) // Always start with initialState
      setIsRunning((v) => !v)
    }
  }
  // HANDLER: On Duration Input Change
  const handleOnDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits
    const digits = e.target.value.replace(/\D/g, '')
    setOnDurationInput(digits)
  }
  // HANDLER: Commit On Duration Input
  const commitOnDurationInput = () => {
    let value = Number(onDurationInput)
    if (isNaN(value) || value < 100) value = 100
    setOnDuration(value)
    setOnDurationInput(value.toString())
    updateNodeData(id, { onDuration: value })
  }
  const handleOnDurationInputBlur = () => { commitOnDurationInput() }
  const handleOnDurationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitOnDurationInput()
  }
  // HANDLER: Off Duration Input Change
  const handleOffDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits
    const digits = e.target.value.replace(/\D/g, '')
    setOffDurationInput(digits)
  }
  // HANDLER: Commit Off Duration Input
  const commitOffDurationInput = () => {
    let value = Number(offDurationInput)
    if (isNaN(value) || value < 100) value = 100
    setOffDuration(value)
    setOffDurationInput(value.toString())
    updateNodeData(id, { offDuration: value })
  }
  const handleOffDurationInputBlur = () => { commitOffDurationInput() }
  const handleOffDurationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitOffDurationInput()
  }
  const handleInfiniteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfinite(e.target.checked)
    updateNodeData(id, { infinite: e.target.checked })
  }
  // HANDLER: Max Cycles Input Change
  const handleMaxCyclesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits
    const digits = e.target.value.replace(/\D/g, '')
    setMaxCyclesInput(digits)
  }
  // HANDLER: Commit Max Cycles Input
  const commitMaxCyclesInput = () => {
    let value = Number(maxCyclesInput)
    if (isNaN(value) || value < 1) value = 1
    setMaxCycles(value)
    setMaxCyclesInput(value.toString())
  }
  const handleMaxCyclesInputBlur = () => { commitMaxCyclesInput() }
  const handleMaxCyclesInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitMaxCyclesInput()
  }
  const handleInitialStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInitialState(e.target.checked)
    updateNodeData(id, { initialState: e.target.checked })
  }

  /* -------------------------------------------------------------- */
  /*  RENDER                                                        */
  /* -------------------------------------------------------------- */
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
        className="absolute top-1 left-1 cursor-pointer z-10 w-2 h-2 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/40 border border-emerald-300 dark:border-emerald-800 text-xs hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors shadow"
        type="button"
      >
        {showUI ? '⦿' : '⦾'}
      </button>
      {/* COLLAPSED: Centered Icon */}
      {!showUI && (
        <div className="flex items-center justify-center w-full h-full">
          <IconForToggleCycles
            progress={progress}
            onToggle={() => setIsRunning((v) => !v)}
            isRunning={isRunning}
            label="Toggle Cycle"
            size={100}
            color={phase ? '#3b82f6' : '#ef4444'}
          />
        </div>
      )}
      {/* EXPANDED: Full UI */}
      {showUI && (
        <>
          <div className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Toggle Cycle</div>
          {/* ON DURATION INPUT (robust text input) */}
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-emerald-700 dark:text-emerald-200">ON:</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={onDurationInput}
              onChange={handleOnDurationInputChange}
              onBlur={handleOnDurationInputBlur}
              onKeyDown={handleOnDurationInputKeyDown}
              className="w-16 rounded border px-1 text-xs bg-white dark:bg-black"
            />
            <span className="text-xs text-emerald-700 dark:text-emerald-200">ms</span>
          </div>
          {/* OFF DURATION INPUT (robust text input) */}
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-emerald-700 dark:text-emerald-200">OFF:</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={offDurationInput}
              onChange={handleOffDurationInputChange}
              onBlur={handleOffDurationInputBlur}
              onKeyDown={handleOffDurationInputKeyDown}
              className="w-16 rounded border px-1 text-xs bg-white dark:bg-black"
            />
            <span className="text-xs text-emerald-700 dark:text-emerald-200">ms</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-emerald-700 dark:text-emerald-200">Infinite:</label>
            <input type="checkbox" checked={infinite} onChange={handleInfiniteChange} />
          </div>
          {!infinite && (
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-emerald-700 dark:text-emerald-200">Cycles:</label>
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
              {isRunning && (
                <span className="text-xs text-emerald-700 dark:text-emerald-200">
                  ({maxCycles - cycleCount} left)
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-emerald-700 dark:text-emerald-200">Initial On:</label>
            <input type="checkbox" checked={initialState} onChange={handleInitialStateChange} />
          </div>
          <button
            className={`px-3 py-1 rounded bg-emerald-500 text-white font-bold shadow transition-colors ${isRunning ? 'bg-emerald-700' : 'hover:bg-emerald-600'} ${hasExternalTrigger ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleStartStop}
            disabled={hasExternalTrigger}
          >
            {isRunning ? (infinite ? 'Cycling...' : 'Cycle Once') : 'Start Cycle'}
          </button>
        </>
      )}
    </div>
  )
}

export default TriggerOnToggleCycle 