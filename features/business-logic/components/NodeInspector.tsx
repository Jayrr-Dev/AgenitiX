'use client';
/* -------------------------------------------------------------------------- */
/*  NodeInspector – shows data + input controls for the selected node         */
/* -------------------------------------------------------------------------- */
import React from 'react';
import type { AgenNode } from '../FlowEditor';

/* ---------------------------------- Types --------------------------------- */

interface NodeInspectorProps {
  /** The currently selected node (or null if none) */
  node: AgenNode | null;
  /** Helper that mutates node.data; same fn you already have in FlowEditor */
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  /** Computed output string (optional) */
  output: string | null;
  /** Array of errors for the current node */
  errors: Array<{
    timestamp: number;
    message: string;
    type: 'error' | 'warning' | 'info';
    source?: string;
  }>;
  /** Function to clear errors for the current node */
  onClearErrors?: () => void;
  /** Function to log new errors */
  onLogError: (nodeId: string, message: string, type?: 'error' | 'warning' | 'info', source?: string) => void;
}

/* ----------------------- JSON SYNTAX HIGHLIGHTER ------------------------- */

interface JsonHighlighterProps {
  data: unknown;
  className?: string;
}

const JsonHighlighter: React.FC<JsonHighlighterProps> = ({ data, className = '' }) => {
  const highlightJson = (obj: unknown, depth = 0): React.ReactNode => {
    const indent = '  '.repeat(depth);
    
    if (obj === null) {
      return <span className="text-gray-500 dark:text-gray-400">null</span>;
    }
    
    if (obj === undefined) {
      return <span className="text-gray-500 dark:text-gray-400">undefined</span>;
    }
    
    if (typeof obj === 'string') {
      return <span className="text-green-600 dark:text-green-400 break-all">"{obj}"</span>;
    }
    
    if (typeof obj === 'number') {
      if (isNaN(obj)) {
        return <span className="text-orange-600 dark:text-orange-400">NaN</span>;
      }
      if (!isFinite(obj)) {
        return <span className="text-orange-600 dark:text-orange-400">{obj > 0 ? 'Infinity' : '-Infinity'}</span>;
      }
      return <span className="text-blue-600 dark:text-blue-400">{obj}</span>;
    }
    
    if (typeof obj === 'boolean') {
      return <span className="text-purple-600 dark:text-purple-400">{obj.toString()}</span>;
    }
    
    if (typeof obj === 'bigint') {
      return <span className="text-blue-600 dark:text-blue-400">{obj.toString()}n</span>;
    }
    
    if (obj instanceof Date) {
      return <span className="text-orange-600 dark:text-orange-400">"{obj.toISOString()}"</span>;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return <span className="text-gray-700 dark:text-gray-300">[]</span>;
      }
      
      return (
        <span className="text-gray-700 dark:text-gray-300">
          [<br />
          {obj.map((item, index) => (
            <span key={index}>
              {indent}  {highlightJson(item, depth + 1)}
              {index < obj.length - 1 && <span className="text-gray-500">,</span>}
              <br />
            </span>
          ))}
          {indent}]
        </span>
      );
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const entries = Object.entries(obj);
      if (entries.length === 0) {
        return <span className="text-gray-700 dark:text-gray-300">{'{}'}</span>;
      }
      
      return (
        <span className="text-gray-700 dark:text-gray-300">
          {'{'}<br />
          {entries.map(([key, value], index) => (
            <span key={key}>
              {indent}  <span className="text-red-600 dark:text-red-400">"{key}"</span>
              <span className="text-gray-500">: </span>
              {highlightJson(value, depth + 1)}
              {index < entries.length - 1 && <span className="text-gray-500">,</span>}
              <br />
            </span>
          ))}
          {indent}{'}'}
        </span>
      );
    }
    
    return <span className="text-gray-500 dark:text-gray-400">{String(obj)}</span>;
  };

  return (
    <pre className={`font-mono text-xs leading-relaxed whitespace-pre-wrap break-words ${className}`}>
      {highlightJson(data)}
    </pre>
  );
};

/* -------------------------------- Component ------------------------------- */

const NodeInspector = React.memo(function NodeInspector({
  node,
  updateNodeData,
  output,
  errors,
  onClearErrors,
  onLogError,
}: NodeInspectorProps) {
  // ALL HOOKS MUST BE AT THE TOP LEVEL - Rules of Hooks compliance
  
  // Trigger Pulse Duration State
  const [durationInput, setDurationInput] = React.useState('500')
  
  // Counter Node State
  const isEditingCount = React.useRef(false)
  const isEditingMultiplier = React.useRef(false)
  const [countInput, setCountInput] = React.useState('0')
  const [multiplierInput, setMultiplierInput] = React.useState('1')
  
  // Delay Node State
  const [delayInput, setDelayInput] = React.useState('1000')

  // Sync states when node changes
  React.useEffect(() => {
    if (!node) return
    
    // Sync trigger pulse duration
    if (node.type === 'triggerOnPulse') {
      const newDurationValue = typeof node.data.duration === 'number' ? node.data.duration.toString() : '500'
      setDurationInput(newDurationValue)
    }
    
    // Sync counter inputs (only when not actively editing)
    if (node.type === 'counterNode') {
      if (!isEditingCount.current) {
        const newCountValue = typeof node.data.count === 'number' ? node.data.count.toString() : '0'
        setCountInput(newCountValue)
      }
      if (!isEditingMultiplier.current) {
        const newMultiplierValue = typeof node.data.multiplier === 'number' ? node.data.multiplier.toString() : '1'
        setMultiplierInput(newMultiplierValue)
      }
    }
    
    // Sync delay input
    if (node.type === 'delayNode') {
      const newDelayValue = typeof node.data.delay === 'number' ? node.data.delay.toString() : '1000'
      setDelayInput(newDelayValue)
    }
    
    // Reset editing flags when switching nodes
    if (node.type !== 'counterNode') {
      isEditingCount.current = false
      isEditingMultiplier.current = false
    }
  }, [node?.data, node?.type, node?.id])

  if (!node) {
    return (
    
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Node Inspector
          </p>
   
    );
  }

  /* ---------- convenience render helpers -------------------------------- */

  const renderTextNodeControls = () => (
    <div className="flex flex-col gap-2">
      <label className="block text-xs">
        <div className="flex flex-row gap-2">
          <span className="py-1">Text:</span>
          <input
            type="text"
            className="w-full rounded border px-1 py-1 text-xs"
            value={typeof node.data.heldText === 'string' ? node.data.heldText : ''}
            onChange={(e) => updateNodeData(node.id, { heldText: e.target.value })}
          />
        </div>
      </label>
   
      <label className="block text-xs">
        <div className="flex flex-row gap-2">
          <span className="py-1">Default:</span>
          <input
            type="text"
            className="w-full rounded border px-1 py-1 text-xs"
            value={typeof node.data.defaultText === 'string' ? node.data.defaultText : ''}
            onChange={(e) => {
              updateNodeData(node.id, { defaultText: e.target.value })
              if (!node.data.heldText) updateNodeData(node.id, { heldText: e.target.value })
            }}
          />
        </div>
      </label>
    </div>
  );

  const renderTriggerOnPulseControls = () => {
    // Handler: input change (digits only)
    const handleDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '')
      setDurationInput(digits)
    }
    // Handler: commit input on blur/Enter
    const commitDurationInput = () => {
      let value = Number(durationInput)
      if (isNaN(value) || value < 50) value = 50
      updateNodeData(node.id, { duration: value })
      setDurationInput(value.toString())
    }
    const handleDurationInputBlur = () => { commitDurationInput() }
    const handleDurationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') commitDurationInput()
    }
    return (
      <label className="block text-xs">
        <div className="flex flex-row gap-2 items-center">
          <span className="py-1">Pulse Duration:</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-16 rounded border px-1 py-1 text-xs"
            value={durationInput}
            onChange={handleDurationInputChange}
            onBlur={handleDurationInputBlur}
            onKeyDown={handleDurationInputKeyDown}
          />
          <span className="text-xs">ms</span>
        </div>
      </label>
    )
  };

  // OUTPUT NODE CONTROLS
  const renderOutputNodeControls = () => (
    <div className="flex flex-col gap-2">
      <label className="block text-xs">
        <div className="flex flex-row gap-2">
          <span className="py-1">Label:</span>
          <input
            type="text"
            className="w-full rounded border px-1 py-1 text-xs"
            value={typeof node.data.label === 'string' ? node.data.label : ''}
            onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
          />
        </div>
      </label>
    </div>
  );

  // TRIGGER ON CLICK CONTROLS
  const renderTriggerOnClickControls = () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs">Status:</span>
        <span className={`text-xs px-2 py-1 rounded ${
          node.data.triggered 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {node.data.triggered ? 'Triggered' : 'Ready'}
        </span>
      </div>
      <button
        onClick={() => updateNodeData(node.id, { triggered: !node.data.triggered })}
        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
      >
        {node.data.triggered ? 'Reset' : 'Trigger'}
      </button>
    </div>
  );

    // TRIGGER ON PULSE CYCLE CONTROLS
  const renderTriggerOnPulseCycleControls = () => {
    const isInfinite = Boolean((node.data as any).infinite);
    
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs">Status:</span>
          <span className={`text-xs px-2 py-1 rounded ${
            node.data.triggered 
              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
          }`}>
            {node.data.triggered ? 'Pulsed' : 'Cycling'}
          </span>
        </div>
        
        {/* Duration Controls */}
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs">
            <span className="block mb-1">Cycle (ms):</span>
            <input
              type="number"
              min="100"
              className="w-full rounded border px-1 py-1 text-xs"
              value={(node.data as any).cycleDuration || 2000}
              onChange={(e) => updateNodeData(node.id, { cycleDuration: Number(e.target.value) })}
            />
          </label>
          <label className="block text-xs">
            <span className="block mb-1">Pulse (ms):</span>
            <input
              type="number"
              min="50"
              className="w-full rounded border px-1 py-1 text-xs"
              value={(node.data as any).pulseDuration || 500}
              onChange={(e) => updateNodeData(node.id, { pulseDuration: Number(e.target.value) })}
            />
          </label>
        </div>

        {/* Checkboxes */}
        <label className="block text-xs">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean((node.data as any).initialState)}
              onChange={(e) => updateNodeData(node.id, { initialState: e.target.checked })}
              className="rounded"
            />
            <span>Initial State</span>
          </div>
        </label>
        
        <label className="block text-xs">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isInfinite}
              onChange={(e) => updateNodeData(node.id, { infinite: e.target.checked })}
              className="rounded"
            />
            <span>Infinite Cycle</span>
          </div>
        </label>

        {/* Total Cycles (only when not infinite) */}
        {!isInfinite && (
          <label className="block text-xs">
            <span className="block mb-1">Total Cycles:</span>
            <input
              type="number"
              min="1"
              max="1000"
              className="w-full rounded border px-1 py-1 text-xs"
              value={(node.data as any).totalCycles || 1}
              onChange={(e) => updateNodeData(node.id, { totalCycles: Number(e.target.value) })}
              placeholder="Number of cycles"
            />
          </label>
        )}
      </div>
    );
  };

  // TRIGGER ON TOGGLE CONTROLS
  const renderTriggerOnToggleControls = () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs">Status:</span>
        <span className={`text-xs px-2 py-1 rounded ${
          node.data.triggered 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {node.data.triggered ? 'ON' : 'OFF'}
        </span>
      </div>
      <button
        onClick={() => updateNodeData(node.id, { triggered: !node.data.triggered })}
        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
      >
        Toggle
      </button>
    </div>
  );

  // TRIGGER ON TOGGLE CYCLE CONTROLS
  const renderTriggerOnToggleCycleControls = () => {
    const isInfinite = Boolean((node.data as any).infinite);
    
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs">Status:</span>
          <span className={`text-xs px-2 py-1 rounded ${
            node.data.triggered 
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {node.data.triggered ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        {/* Duration Controls */}
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs">
            <span className="block mb-1">On (ms):</span>
            <input
              type="number"
              min="100"
              className="w-full rounded border px-1 py-1 text-xs"
              value={(node.data as any).onDuration || 4000}
              onChange={(e) => updateNodeData(node.id, { onDuration: Number(e.target.value) })}
            />
          </label>
          <label className="block text-xs">
            <span className="block mb-1">Off (ms):</span>
            <input
              type="number"
              min="100"
              className="w-full rounded border px-1 py-1 text-xs"
              value={(node.data as any).offDuration || 4000}
              onChange={(e) => updateNodeData(node.id, { offDuration: Number(e.target.value) })}
            />
          </label>
        </div>

        {/* Checkboxes */}
        <label className="block text-xs">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean((node.data as any).initialState)}
              onChange={(e) => updateNodeData(node.id, { initialState: e.target.checked })}
              className="rounded"
            />
            <span>Initial State</span>
          </div>
        </label>
        
        <label className="block text-xs">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isInfinite}
              onChange={(e) => updateNodeData(node.id, { infinite: e.target.checked })}
              className="rounded"
            />
            <span>Infinite Cycle</span>
          </div>
        </label>

        {/* Total Cycles (only when not infinite) */}
        {!isInfinite && (
          <label className="block text-xs">
            <span className="block mb-1">Total Cycles:</span>
            <input
              type="number"
              min="1"
              max="1000"
              className="w-full rounded border px-1 py-1 text-xs"
              value={(node.data as any).totalCycles || 1}
              onChange={(e) => updateNodeData(node.id, { totalCycles: Number(e.target.value) })}
              placeholder="Number of cycles"
            />
          </label>
        )}
      </div>
    );
  };

  // LOGIC AND CONTROLS
  const renderLogicAndControls = () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs">Value:</span>
        <span className={`text-xs px-2 py-1 rounded ${
          node.data.value 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        }`}>
          {node.data.value ? 'TRUE' : 'FALSE'}
        </span>
      </div>
      {/* <label className="block text-xs">
        <div className="flex flex-row gap-2 items-center">
          <span className="py-1">Inputs:</span>
          <input
            type="number"
            min="2"
            max="10"
            className="w-16 rounded border px-1 py-1 text-xs"
                       value={(node.data as any).inputCount || 2}
           onChange={(e) => updateNodeData(node.id, { inputCount: Number(e.target.value) })}
         />
       </div>
     </label> */}
   </div>
 );

 // LOGIC OR CONTROLS
 const renderLogicOrControls = () => (
   <div className="flex flex-col gap-2">
     <div className="flex items-center gap-2">
       <span className="text-xs">Value:</span>
       <span className={`text-xs px-2 py-1 rounded ${
         node.data.value 
           ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
           : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
       }`}>
         {node.data.value ? 'TRUE' : 'FALSE'}
       </span>
     </div>
     {/* <label className="block text-xs">
       <div className="flex flex-row gap-2 items-center">
         <span className="py-1">Inputs:</span>
         <input
           type="number"
           min="2"
           max="10"
           className="w-16 rounded border px-1 py-1 text-xs"
           value={(node.data as any).inputCount || 2}
            onChange={(e) => updateNodeData(node.id, { inputCount: Number(e.target.value) })}
          />
        </div>
      </label> */}
    </div>
  );

  // LOGIC NOT CONTROLS
  const renderLogicNotControls = () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs">Value:</span>
        <span className={`text-xs px-2 py-1 rounded ${
          node.data.value 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        }`}>
          {node.data.value ? 'TRUE' : 'FALSE'}
        </span>
      </div>
      <button
        onClick={() => updateNodeData(node.id, { value: !node.data.value })}
        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
      >
        Toggle Value
      </button>
    </div>
  );

  // LOGIC XOR CONTROLS
  const renderLogicXorControls = () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs">Value:</span>
        <span className={`text-xs px-2 py-1 rounded ${
          node.data.value 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        }`}>
          {node.data.value ? 'TRUE' : 'FALSE'}
        </span>
      </div>
    </div>
  );

  // LOGIC XNOR CONTROLS
  const renderLogicXnorControls = () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs">Value:</span>
        <span className={`text-xs px-2 py-1 rounded ${
          node.data.value 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        }`}>
          {node.data.value ? 'TRUE' : 'FALSE'}
        </span>
      </div>
    </div>
  );

  // COUNTER NODE CONTROLS
  const renderCounterNodeControls = () => {

    // Handlers for count input
    const handleCountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      isEditingCount.current = true
      setCountInput(e.target.value)
    }

    const handleCountInputFocus = () => {
      isEditingCount.current = true
    }

    const commitCountInput = () => {
      isEditingCount.current = false
      const value = parseFloat(countInput)
      if (!isNaN(value)) {
        updateNodeData(node.id, { count: value })
        setCountInput(value.toString())
      } else {
        setCountInput(typeof node.data.count === 'number' ? node.data.count.toString() : '0')
      }
    }

    const handleCountInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        commitCountInput()
        e.currentTarget.blur()
      }
    }

    // Handlers for multiplier input
    const handleMultiplierInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      isEditingMultiplier.current = true
      setMultiplierInput(e.target.value)
    }

    const handleMultiplierInputFocus = () => {
      isEditingMultiplier.current = true
    }

    const commitMultiplierInput = () => {
      isEditingMultiplier.current = false
      const value = parseFloat(multiplierInput)
      if (!isNaN(value) && value !== 0) {
        updateNodeData(node.id, { multiplier: value })
        setMultiplierInput(value.toString())
      } else {
        setMultiplierInput(typeof node.data.multiplier === 'number' ? node.data.multiplier.toString() : '1')
      }
    }

    const handleMultiplierInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        commitMultiplierInput()
        e.currentTarget.blur()
      }
    }

    // Reset counter to 0
    const handleReset = () => {
      updateNodeData(node.id, { count: 0 })
      setCountInput('0') // Also update local input state immediately
    }

    return (
      <div className="flex flex-col gap-3">
        {/* Count Input */}
        <label className="block text-xs">
          <div className="flex flex-row gap-2">
            <span className="py-1">Count:</span>
            <input
              type="number"
              step="any"
              className="w-full rounded border px-1 py-1 text-xs"
              value={countInput}
              onChange={handleCountInputChange}
              onFocus={handleCountInputFocus}
              onBlur={commitCountInput}
              onKeyDown={handleCountInputKeyDown}
            />
          </div>
        </label>

        {/* Multiplier Input */}
        <label className="block text-xs">
          <div className="flex flex-row gap-2">
            <span className="py-1">Step:</span>
            <input
              type="number"
              step="any"
              className="w-full rounded border px-1 py-1 text-xs"
              value={multiplierInput}
              onChange={handleMultiplierInputChange}
              onFocus={handleMultiplierInputFocus}
              onBlur={commitMultiplierInput}
              onKeyDown={handleMultiplierInputKeyDown}
            />
          </div>
        </label>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="px-3 py-1 rounded text-xs font-bold transition-colors bg-orange-500 text-white hover:bg-orange-600"
        >
          Reset to 0
        </button>

        {/* Status Display */}
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span>Current Count:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {typeof node.data.count === 'number' ? node.data.count : 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Step Size:</span>
            <span className="font-mono font-bold text-green-600 dark:text-green-400">
              {typeof node.data.multiplier === 'number' ? node.data.multiplier : 1}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // DELAY NODE CONTROLS
  const renderDelayNodeControls = () => {
    const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value)
      if (!isNaN(value) && value >= 0) {
        updateNodeData(node.id, { delay: value })
      }
    }

    const queueLength = typeof node.data.queueLength === 'number' ? node.data.queueLength : 0
    const queueItems = Array.isArray(node.data.queueItems) ? node.data.queueItems : []

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs">Status:</span>
          <span className={`text-xs px-2 py-1 rounded ${
            node.data.isProcessing 
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' 
              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
          }`}>
            {node.data.isProcessing ? 'Processing...' : 'Ready'}
          </span>
        </div>
        
        <label className="block text-xs">
          <div className="flex flex-row gap-2 items-center">
            <span className="py-1">Delay:</span>
            <input
              type="number"
              min="0"
              step="100"
              className="w-20 rounded border px-1 py-1 text-xs"
              value={typeof node.data.delay === 'number' ? node.data.delay : 1000}
              onChange={handleDelayChange}
            />
            <span className="text-xs">ms</span>
          </div>
        </label>

        {/* Queue Information */}
        <div className="flex items-center gap-2">
          <span className="text-xs">Queue:</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded ${
              queueLength > 0 
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {queueLength} item{queueLength !== 1 ? 's' : ''}
            </span>
            {queueLength > 0 && (
              <div className="min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                {queueLength}
              </div>
            )}
          </div>
        </div>

        {/* Queue Preview */}
        {queueLength > 0 && (
          <div className="text-xs">
            <div className="font-medium text-orange-700 dark:text-orange-300 mb-1">
              Queue Preview:
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-700 p-2 max-h-20 overflow-y-auto">
              {queueItems.map((item, index) => (
                <div key={index} className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-1">
                  {index + 1}. {typeof item === 'string' 
                    ? `"${item}"` 
                    : JSON.stringify(item)}
                </div>
              ))}
              {queueLength > queueItems.length && (
                <div className="text-xs text-orange-600 dark:text-orange-400 italic">
                  ... and {queueLength - queueItems.length} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Output Preview */}
        {node.data.outputValue !== undefined && (
          <div className="text-xs">
            <span className="text-orange-700 dark:text-orange-300 font-medium">Output: </span>
            <span className="text-gray-600 dark:text-gray-400 font-mono">
              {typeof node.data.outputValue === 'string' 
                ? `"${node.data.outputValue}"` 
                : JSON.stringify(node.data.outputValue)}
            </span>
          </div>
        )}
      </div>
    )
  }

  const renderConverterNodeControls = () => (
          <div className="flex flex-col gap-2 h-full">
        <label className="block text-xs flex-1 flex flex-col">
          <div className="flex flex-col gap-1 flex-1">
            <span>Input Value:</span>
            <textarea
              className="w-full rounded border px-2 py-1 text-xs resize-none flex-1 min-h-[80px]"
              rows={8}
            value={(() => {
              const val = node.data.value;
              if (typeof val === 'string') return val;
              if (typeof val === 'number' && isNaN(val)) return 'NaN';
              if (typeof val === 'number' && !isFinite(val)) return val > 0 ? 'Infinity' : '-Infinity';
              try {
                return JSON.stringify(val, null, 2);
              } catch {
                return String(val);
              }
            })()}
            onChange={(e) => {
              const input = e.target.value.trim();
              try {
                // Handle special number values
                if (input === 'NaN') {
                  updateNodeData(node.id, { value: NaN });
                  return;
                }
                if (input === 'Infinity') {
                  updateNodeData(node.id, { value: Infinity });
                  return;
                }
                if (input === '-Infinity') {
                  updateNodeData(node.id, { value: -Infinity });
                  return;
                }
                
                // Try to parse as JSON
                const parsed = JSON.parse(input);
                updateNodeData(node.id, { value: parsed });
              } catch {
                // If JSON parsing fails, store as string
                updateNodeData(node.id, { value: input });
              }
            }}
            placeholder="Enter value, JSON, NaN, Infinity, etc..."
          />
        </div>
      </label>
      {node.type === 'booleanConverterNode' && (
        <div className="flex items-center gap-2">
          <span className="text-xs">Triggered:</span>
          <span className={`text-xs px-2 py-1 rounded ${
            node.data.triggered 
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {node.data.triggered ? 'Yes' : 'No'}
          </span>
        </div>
      )}
    </div>
  );

  const renderNodeOutput = () => (
    <div className="text-xs space-y-1">
      <div className="font-semibold text-gray-700 dark:text-gray-300">Output:</div>
      <div className={`font-mono break-all bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 border ${
        node.type === 'uppercaseNode' ? 'text-sky-600 dark:text-sky-400' : 'text-gray-700 dark:text-gray-300'
      }`}>
        {output || <span className="text-gray-400 italic">—</span>}
      </div>
    </div>
  );

  const renderErrorLog = () => (
    <div className="text-xs space-y-1">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-700 dark:text-gray-300">Errors:</div>
        {errors.length > 0 && onClearErrors && (
          <button
            onClick={onClearErrors}
            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Clear
          </button>
        )}
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 border max-h-20 overflow-y-auto scrollbar *:scrollbar-thumb-gray-400 *:scrollbar-track-transparent *:scrollbar-arrow-hidden">
        {errors.length === 0 ? (
          <span className="text-gray-400 italic">No errors</span>
        ) : (
          <div className="space-y-1">
            {errors.slice(-5).map((error, index) => (
              <div key={`${error.timestamp}-${index}`} className="text-xs">
                <div className="flex items-center gap-1">
                  <span className={`w-1 h-1 rounded-full ${
                    error.type === 'error' ? 'bg-red-500' : 
                    error.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-gray-500 text-[10px]">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </span>
                  {error.source && (
                    <span className="text-gray-400 text-[10px]">({error.source})</span>
                  )}
                </div>
                <div className={`font-mono break-all ${
                  error.type === 'error' ? 'text-red-600 dark:text-red-400' : 
                  error.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 
                  'text-blue-600 dark:text-blue-400'
                }`}>
                  {error.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  /* ---------- main UI --------------------------------------------------- */
  
  // Check what sections we need to show
  const hasOutput = (
    node.type === 'uppercaseNode' || 
    node.type === 'textNode' || 
    node.type === 'output' ||
    node.type === 'counterNode' ||
    node.type === 'delayNode'
  );
  const hasControls = (
    node.type === 'textNode' || 
    node.type === 'output' ||
    node.type === 'triggerOnClick' ||
    node.type === 'triggerOnPulse' ||
    node.type === 'triggerOnPulseCycle' ||
    node.type === 'triggerOnToggle' ||
    node.type === 'triggerOnToggleCycle' ||
    node.type === 'logicAnd' ||
    node.type === 'logicOr' ||
    node.type === 'logicNot' ||
    node.type === 'logicXor' ||
    node.type === 'logicXnor' ||
    node.type === 'textConverterNode' ||
    node.type === 'booleanConverterNode' ||
    node.type === 'inputTesterNode' ||
    node.type === 'objectEditorNode' ||
    node.type === 'arrayEditorNode' ||
    node.type === 'counterNode' ||
    node.type === 'delayNode'
  );
  const hasRightColumn = hasOutput || hasControls;

  return (
    <div id="node-info-container" className="flex gap-3">
      {/* COLUMN 1: NODE LABEL + NODE DATA */}
      <div className="flex-1 flex flex-col gap-3 min-w-[200px]">
        {/* Node Label */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
               {node.type.replace(/([A-Z])/g, ' $1').trim()}
          </h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">
               Node {node.id} 
          </p>
        </div>

        {/* Node Data */}
        <div>
          <h4 className="text-xs  font-medium text-gray-700 dark:text-gray-300 mb-2">Node Data:</h4>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md border p-3 max-h-20 overflow-y-auto overflow-x-hidden max-w-full scrollbar *:scrollbar-thumb-gray-400 *:scrollbar-track-transparent *:scrollbar-arrow-hidden">
            <JsonHighlighter data={node.data} className="w-full" />
          </div>
        </div>
      </div>

      {/* COLUMN 2: OUTPUT + CONTROLS */}
      {hasRightColumn && (
        <div className="flex-1 flex flex-col gap-3 min-w-[100px]">
          {/* Output Section */}
          {hasOutput && renderNodeOutput()}

          {/* Controls Section */}
          {hasControls && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Controls:</h4>
              <div className="space-y-2 overflow-y-auto flex-1">
                {node.type === 'textNode' && renderTextNodeControls()}
                {node.type === 'output' && renderOutputNodeControls()}
                {node.type === 'triggerOnClick' && renderTriggerOnClickControls()}
                {node.type === 'triggerOnPulse' && renderTriggerOnPulseControls()}
                {node.type === 'triggerOnPulseCycle' && renderTriggerOnPulseCycleControls()}
                {node.type === 'triggerOnToggle' && renderTriggerOnToggleControls()}
                {node.type === 'triggerOnToggleCycle' && renderTriggerOnToggleCycleControls()}
                {node.type === 'logicAnd' && renderLogicAndControls()}
                {node.type === 'logicOr' && renderLogicOrControls()}
                {node.type === 'logicNot' && renderLogicNotControls()}
                {node.type === 'logicXor' && renderLogicXorControls()}
                {node.type === 'logicXnor' && renderLogicXnorControls()}
                {node.type === 'counterNode' && renderCounterNodeControls()}
                {node.type === 'delayNode' && renderDelayNodeControls()}
                {(node.type === 'textConverterNode' || 
                  node.type === 'booleanConverterNode' || 
                  node.type === 'inputTesterNode' || 
                  node.type === 'objectEditorNode' || 
                  node.type === 'arrayEditorNode') && renderConverterNodeControls()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* COLUMN 3: ERROR LOG (only show when there are errors) */}
      {errors.length > 0 && (
        <div className="flex-1 flex flex-col gap-3">
          {renderErrorLog()}
        </div>
      )}

      {/* Test Error Buttons (always show for demonstration) */}
      {/* <div className="flex flex-col gap-3 min-w-[120px]">
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Test Errors:</h4>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onLogError(node.id, 'Test error message', 'error', 'manual')}
              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
            >
              Error
            </button>
            <button
              onClick={() => onLogError(node.id, 'Test warning message', 'warning', 'manual')}
              className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800"
            >
              Warn
            </button>
            <button
              onClick={() => console.error('Test console error for node', node.id)}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Console
            </button>
          </div>
        </div>
      </div> */}
    </div>
  );
});

NodeInspector.displayName = 'NodeInspector';

export default NodeInspector;
