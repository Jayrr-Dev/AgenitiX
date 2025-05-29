'use client'

/* -------------------------------------------------------------------------- */
/*  CycleToggle                                                               */
/*  – Cycles between on/off states with customizable durations                 */
/* -------------------------------------------------------------------------- */

import React, { useState, useEffect, useRef } from 'react'
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  type NodeProps,
  type Node,
} from '@xyflow/react'

import CustomHandle from '../../handles/CustomHandle'
// import IconPlaceholder from '../node-icons/IconPlaceholder' 
import IconForToggleCycles from '../node-icons/IconForToggleCycles'
import { CycleToggleData } from '../../flow-editor/types'
import { useFlowStore } from '../../stores/flowStore'

/* -------------------------------------------------------------------------- */
/*  COMPONENT                                                                 */
/* -------------------------------------------------------------------------- */
const CycleToggle: React.FC<NodeProps<Node<CycleToggleData & Record<string, unknown>>>> = ({ id, data }) => {
  // Zustand store actions
  const updateNodeData = useFlowStore(state => state.updateNodeData)
  
  // STATE
  const [showUI, setShowUI] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [phase, setPhase] = useState(data.initialState ?? false) // true = ON, false = OFF
  const [cycleCount, setCycleCount] = useState(0)
  const intervalRef = useRef<number | null>(null)
  const [progress, setProgress] = useState(0)
  const cycleStartRef = useRef(Date.now())
  // STATE FOR ON DURATION INPUT (robust text input for numeric value)
  const [onDurationInput, setOnDurationInput] = useState(data.onDuration?.toString() ?? '4000')
  // STATE FOR OFF DURATION INPUT (robust text input for numeric value)
  const [offDurationInput, setOffDurationInput] = useState(data.offDuration?.toString() ?? '4000')
  // STATE FOR MAX CYCLES INPUT (robust text input for numeric value)
  const [maxCyclesInput, setMaxCyclesInput] = useState(data.maxCycles?.toString() ?? '1')

  // Get values from data with defaults
  const onDuration = data.onDuration ?? 4000
  const offDuration = data.offDuration ?? 4000
  const infinite = data.infinite ?? true
  const initialState = data.initialState ?? false
  const maxCycles = data.maxCycles ?? 1

  // Boolean input handle logic
  const connections = useNodeConnections({ handleType: 'target' })
  const boolInputConnections = connections.filter(c => c.targetHandle === 'b')
  const boolInputSourceIds = boolInputConnections.map((c) => c.source)
  const boolInputNodesData = useNodesData(boolInputSourceIds)
  const hasExternalTrigger = boolInputSourceIds.length > 0
  
  // Check for any truthy value from connected input nodes
  const externalTrigger = boolInputNodesData.some((n) => {
    const data = n.data
    return !!(data.triggered || data.value || data.text || data.output)
  })

  // INSPECTOR CONTROLS - Use separate control property to avoid feedback loop
  const prevIsRunningRef = useRef(data.isRunning)
  useEffect(() => {
    if (!hasExternalTrigger) {
      // Only respond to changes in isRunning control property from inspector
      if (data.isRunning !== prevIsRunningRef.current) {
        setIsRunning(!!data.isRunning)
        if (!!data.isRunning) {
          setPhase(initialState) // Start with initial state when triggered
        }
        prevIsRunningRef.current = data.isRunning
      }
    }
  }, [data.isRunning, hasExternalTrigger, initialState])

  // EXTERNAL TRIGGER CONTROL
  useEffect(() => {
    if (hasExternalTrigger) {
      if (externalTrigger) {
        // Only start if not already running, otherwise keep going
        if (!isRunning) {
          setPhase(initialState) // Start with initial state
          setIsRunning(true)
        }
      } else {
        // Stop when trigger is false
        setIsRunning(false)
      }
    }
  }, [externalTrigger, hasExternalTrigger, isRunning, initialState])

  // Start/stop cycle
  useEffect(() => {
    if (isRunning) {
      setCycleCount(0) // Reset on start
      setProgress(0)
      cycleStartRef.current = Date.now()
      
      const runCycle = () => {
        const currentDuration = phase ? onDuration : offDuration
        
        // Update triggered for boolean output to other nodes
        updateNodeData(id, { triggered: phase })
        
        // Set timeout for next phase
        intervalRef.current = window.setTimeout(() => {
          setPhase(prev => !prev)
          
          // If we just completed an OFF phase (going from OFF to ON), increment cycle count
          if (!phase) {
            setCycleCount(c => c + 1)
          }
          
          // Reset progress and cycle start time for next phase
          setProgress(0)
          cycleStartRef.current = Date.now()
          
          runCycle() // Continue the cycle
        }, currentDuration)
      }
      
      runCycle()
      
      return () => {
        if (intervalRef.current) {
          window.clearTimeout(intervalRef.current)
          intervalRef.current = null
        }
      }
    } else {
      // Stop cycle
      if (intervalRef.current) {
        window.clearTimeout(intervalRef.current)
        intervalRef.current = null
      }
      updateNodeData(id, { triggered: false })
      setCycleCount(0)
      setProgress(0)
    }
  }, [isRunning, phase, onDuration, offDuration, id, updateNodeData])

  // Update progress for radial indicator
  useEffect(() => {
    if (!isRunning) {
      setProgress(0)
      return
    }

    const updateProgress = () => {
      const now = Date.now()
      const elapsed = now - cycleStartRef.current
      const currentDuration = phase ? onDuration : offDuration
      const newProgress = Math.min(1, elapsed / currentDuration)
      setProgress(newProgress)
    }

    // Update immediately and then every 30ms
    updateProgress()
    const interval = setInterval(updateProgress, 30)
    return () => clearInterval(interval)
  }, [isRunning, phase, onDuration, offDuration])

  // Stop after maxCycles if not infinite
  useEffect(() => {
    if (!infinite && cycleCount >= maxCycles) {
      setIsRunning(false)
    }
  }, [cycleCount, infinite, maxCycles])

  // Handlers
  const handleStartStop = () => {
    // Allow manual control when not connected OR when connected and input is true
    if (!hasExternalTrigger || externalTrigger) {
      const newIsRunning = !isRunning
      setPhase(initialState) // Always start with initialState
      setIsRunning(newIsRunning)
      updateNodeData(id, { isRunning: newIsRunning })
    }
  }

  const handleOnDurationChange = (value: number) => {
    updateNodeData(id, { onDuration: value })
  }

  const handleOffDurationChange = (value: number) => {
    updateNodeData(id, { offDuration: value })
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
    updateNodeData(id, { onDuration: value })
    setOnDurationInput(value.toString())
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
    updateNodeData(id, { offDuration: value })
    setOffDurationInput(value.toString())
  }
  const handleOffDurationInputBlur = () => { commitOffDurationInput() }
  const handleOffDurationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitOffDurationInput()
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
    updateNodeData(id, { maxCycles: value })
    setMaxCyclesInput(value.toString())
  }
  const handleMaxCyclesInputBlur = () => { commitMaxCyclesInput() }
  const handleMaxCyclesInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitMaxCyclesInput()
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
            onToggle={handleStartStop}
            isRunning={isRunning}
            label="Toggle Cycle"
            size={100}
            color={phase ? '#3b82f6' : '#ef4444'}
          />
        </div>
      )}
      {/* EXPANDED: Full UI */}
      {showUI && (
        <CycleToggleExpandedUI
          onDuration={onDuration}
          offDuration={offDuration}
          infinite={infinite}
          maxCycles={maxCycles}
          initialState={initialState}
          isRunning={isRunning}
          cycleCount={cycleCount}
          phase={phase}
          hasExternalTrigger={hasExternalTrigger}
          externalTrigger={externalTrigger}
          onOnDurationChange={handleOnDurationChange}
          onOffDurationChange={handleOffDurationChange}
          onInfiniteChange={handleInfiniteChange}
          onMaxCyclesChange={handleMaxCyclesChange}
          onInitialStateChange={handleInitialStateChange}
          onStartStop={handleStartStop}
        />
      )}
    </div>
  )
}

// Separate component for expanded UI to keep main component clean
interface CycleToggleExpandedUIProps {
  onDuration: number
  offDuration: number
  infinite: boolean
  maxCycles: number
  initialState: boolean
  isRunning: boolean
  cycleCount: number
  phase: boolean
  hasExternalTrigger: boolean
  externalTrigger: boolean
  onOnDurationChange: (value: number) => void
  onOffDurationChange: (value: number) => void
  onInfiniteChange: (value: boolean) => void
  onMaxCyclesChange: (value: number) => void
  onInitialStateChange: (value: boolean) => void
  onStartStop: () => void
}

const CycleToggleExpandedUI: React.FC<CycleToggleExpandedUIProps> = ({
  onDuration,
  offDuration,
  infinite,
  maxCycles,
  initialState,
  isRunning,
  cycleCount,
  phase,
  hasExternalTrigger,
  externalTrigger,
  onOnDurationChange,
  onOffDurationChange,
  onInfiniteChange,
  onMaxCyclesChange,
  onInitialStateChange,
  onStartStop,
}) => {
  const [onDurationInput, setOnDurationInput] = useState(onDuration.toString())
  const [offDurationInput, setOffDurationInput] = useState(offDuration.toString())
  const [maxCyclesInput, setMaxCyclesInput] = useState(maxCycles.toString())

  // Sync inputs with props
  useEffect(() => { setOnDurationInput(onDuration.toString()) }, [onDuration])
  useEffect(() => { setOffDurationInput(offDuration.toString()) }, [offDuration])
  useEffect(() => { setMaxCyclesInput(maxCycles.toString()) }, [maxCycles])

  const handleOnDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '')
    setOnDurationInput(digits)
  }

  const commitOnDuration = () => {
    let value = Number(onDurationInput)
    if (isNaN(value) || value < 100) value = 100
    onOnDurationChange(value)
    setOnDurationInput(value.toString())
  }

  const handleOnDurationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitOnDuration()
  }

  const handleOffDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '')
    setOffDurationInput(digits)
  }

  const commitOffDuration = () => {
    let value = Number(offDurationInput)
    if (isNaN(value) || value < 100) value = 100
    onOffDurationChange(value)
    setOffDurationInput(value.toString())
  }

  const handleOffDurationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitOffDuration()
  }

  const handleMaxCyclesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '')
    setMaxCyclesInput(digits)
  }

  const commitMaxCycles = () => {
    let value = Number(maxCyclesInput)
    if (isNaN(value) || value < 1) value = 1
    onMaxCyclesChange(value)
    setMaxCyclesInput(value.toString())
  }

  const handleMaxCyclesInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitMaxCycles()
  }

  return (
    <>
      <div className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Toggle Cycle</div>
      
      {/* ON DURATION INPUT */}
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-purple-700 dark:text-purple-200">ON:</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={onDurationInput}
          onChange={handleOnDurationInputChange}
          onBlur={commitOnDuration}
          onKeyDown={handleOnDurationInputKeyDown}
          className="w-16 rounded border px-1 text-xs bg-white dark:bg-black"
        />
        <span className="text-xs text-purple-700 dark:text-purple-200">ms</span>
      </div>
      
      {/* OFF DURATION INPUT */}
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-purple-700 dark:text-purple-200">OFF:</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={offDurationInput}
          onChange={handleOffDurationInputChange}
          onBlur={commitOffDuration}
          onKeyDown={handleOffDurationInputKeyDown}
          className="w-16 rounded border px-1 text-xs bg-white dark:bg-black"
        />
        <span className="text-xs text-purple-700 dark:text-purple-200">ms</span>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-purple-700 dark:text-purple-200">Infinite:</label>
        <input 
          type="checkbox" 
          checked={infinite} 
          onChange={(e) => onInfiniteChange(e.target.checked)} 
        />
      </div>
      
      {!infinite && (
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs text-purple-700 dark:text-purple-200">Cycles:</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={maxCyclesInput}
            onChange={handleMaxCyclesInputChange}
            onBlur={commitMaxCycles}
            onKeyDown={handleMaxCyclesInputKeyDown}
            className="w-16 rounded border px-1 text-xs bg-white dark:bg-black"
          />
          {isRunning && (
            <span className="text-xs text-purple-700 dark:text-purple-200">
              ({maxCycles - cycleCount} left)
            </span>
          )}
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-purple-700 dark:text-purple-200">Initial On:</label>
        <input 
          type="checkbox" 
          checked={initialState} 
          onChange={(e) => onInitialStateChange(e.target.checked)} 
        />
      </div>
      
      <button
        className={`px-3 py-1 rounded text-white font-bold shadow transition-colors ${
          isRunning 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-purple-500 hover:bg-purple-600'
        } ${(hasExternalTrigger && !externalTrigger) ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={onStartStop}
        disabled={hasExternalTrigger && !externalTrigger}
      >
        {isRunning ? 'Stop Cycle' : 'Start Cycle'}
      </button>
      
      {isRunning && (
        <div className="mt-2 text-xs text-purple-700 dark:text-purple-200">
          Phase: {phase ? 'ON' : 'OFF'}
        </div>
      )}
    </>
  )
}

export default CycleToggle 