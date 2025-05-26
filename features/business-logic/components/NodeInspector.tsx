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
}

/* -------------------------------- Component ------------------------------- */

const NodeInspector = React.memo(function NodeInspector({
  node,
  updateNodeData,
  output,
}: NodeInspectorProps) {
  if (!node) {
    return (
      <p className="text-xs italic text-neutral-500">
        Select a node to see its data
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
    // Robust duration input state for NodeInspector
    const [durationInput, setDurationInput] = React.useState(
      typeof node.data.duration === 'number' ? node.data.duration.toString() : '500'
    )
    // Keep local input in sync with node.data.duration
    React.useEffect(() => {
      setDurationInput(typeof node.data.duration === 'number' ? node.data.duration.toString() : '500')
    }, [node.data.duration])
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

  const renderNodeOutput = () => (
    <div className="text-xs space-y-1">
      <div className="font-semibold">Output:</div>
      <div className={`font-mono break-all bg-white/50 dark:bg-black/20 rounded px-2 py-1 ${
        node.type === 'uppercaseNode' ? 'text-sky-600 dark:text-sky-400' : ''
      }`}>
        {output || '—'}
      </div>
    </div>
  );

  /* ---------- main UI --------------------------------------------------- */
  return (
    <div id="node-info-container" className="flex flex-row gap-4">
      {/* left column – data preview */}
      <div className="flex w-full max-w-[10rem] flex-col gap-2">
        <h3 className="mb-1 text-sm font-semibold">
          Node {node.id}{' '}
          <span className="text-xs opacity-70">({node.type})</span>
        </h3>

        <pre className="whitespace-pre-wrap break-words text-xs">
          {JSON.stringify(node.data, (key, value) =>
            typeof value === 'bigint' ? value.toString() + 'n' : value,
            2
          )}
        </pre>

        {/* Show output for nodes that have output */}
        {(
            node.type === 'uppercaseNode' || 
            node.type === 'textNode' || 
            node.type === 'output') && 
            renderNodeOutput()
        }
      </div>

      {/* right column – type-specific inputs */}
      <div id="node-inputs" className="flex flex-col gap-2">
        {node.type === 'textNode' && renderTextNodeControls()}
        {node.type === 'triggerOnPulse' && renderTriggerOnPulseControls()}
        {/* Add more cases here as new node types become editable */}
      </div>
    </div>
  );
});

NodeInspector.displayName = 'NodeInspector';

export default NodeInspector;
