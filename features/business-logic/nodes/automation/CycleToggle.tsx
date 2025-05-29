'use client'

import React from 'react';
import { Position } from '@xyflow/react';
import { createNodeComponent, type BaseNodeData } from '../factory/NodeFactory';
import IconForToggleCycles from '../node-icons/IconForToggleCycles';

// ============================================================================
// NODE DATA INTERFACE  
// ============================================================================

interface CycleToggleData extends BaseNodeData {
  onDuration: number;
  offDuration: number;
  infinite: boolean;
  initialState: boolean;
  maxCycles: number;
  isRunning: boolean;
  triggered: boolean;
  // Runtime state
  isOn: boolean;
  phase: boolean; // true = ON phase, false = OFF phase
  cycleCount: number;
  progress: number;
  // Timer tracking
  phaseStartTime?: number;
}

// ============================================================================
// GLOBAL TIMER MANAGEMENT
// ============================================================================

// Helper function to ensure progress is always rounded to 5 decimal places
const roundProgress = (progress: number): number => {
  return Math.round(Math.max(0, Math.min(1, progress)) * 100000) / 100000;
};

// Global timer management for CycleToggle instances
const activeCycles = new Map<string, { 
  phaseTimeoutId: number | null;
  progressIntervalId: number | null;
  isRunning: boolean;
  currentCycleCount: number;
  currentPhase: boolean; // true = ON, false = OFF
}>();

// ============================================================================
// CYCLE TOGGLE FUNCTIONS
// ============================================================================

// Start the toggle cycle
function startToggleCycle(
  id: string,
  updateNodeData: (id: string, updates: Partial<CycleToggleData>) => void,
  onDuration: number,
  offDuration: number,
  initialState: boolean
) {
  console.log(`CycleToggle ${id}: Starting toggle cycle, ON: ${onDuration}ms, OFF: ${offDuration}ms, initial: ${initialState ? 'ON' : 'OFF'}`);
  
  // Stop any existing cycle first
  stopToggleCycle(id);
  
  // Initialize cycle state
  const cycleState = {
    phaseTimeoutId: null as number | null,
    progressIntervalId: null as number | null,
    isRunning: true,
    currentCycleCount: 0,
    currentPhase: initialState // Start with initial state
  };
  activeCycles.set(id, cycleState);
  
  // Start the first phase immediately
  startNextPhase();
  
  function startNextPhase() {
    const currentState = activeCycles.get(id);
    if (!currentState || !currentState.isRunning) {
      console.log(`CycleToggle ${id}: Cycle stopped, exiting`);
      return;
    }
    
    const phase = currentState.currentPhase;
    const phaseDuration = phase ? onDuration : offDuration;
    
    console.log(`CycleToggle ${id}: Starting ${phase ? 'ON' : 'OFF'} phase for ${phaseDuration}ms`);
    
    // Update phase state
    updateNodeData(id, { 
      phase: phase,
      triggered: phase, // Output is active during ON phase
      progress: 0
    });
    
    const phaseStartTime = Date.now();
    
    // Progress animation during current phase
    const progressInterval = window.setInterval(() => {
      const currentState = activeCycles.get(id);
      if (!currentState || !currentState.isRunning) {
        window.clearInterval(progressInterval);
        return;
      }
      
      const elapsed = Date.now() - phaseStartTime;
      const rawProgress = Math.min(1, elapsed / phaseDuration);
      const progress = roundProgress(rawProgress);
      
      updateNodeData(id, { progress });
      
      if (progress >= 1) {
        window.clearInterval(progressInterval);
      }
    }, 50);
    
    // Store progress interval
    if (currentState) {
      currentState.progressIntervalId = progressInterval;
    }
    
    // After phase duration, switch to next phase
    const phaseTimeoutId = window.setTimeout(() => {
      switchToNextPhase();
    }, phaseDuration);
    
    // Store phase timeout
    if (currentState) {
      currentState.phaseTimeoutId = phaseTimeoutId;
    }
  }
  
  function switchToNextPhase() {
    const currentState = activeCycles.get(id);
    if (!currentState || !currentState.isRunning) {
      return;
    }
    
    // Clear progress interval from previous phase
    if (currentState.progressIntervalId) {
      window.clearInterval(currentState.progressIntervalId);
      currentState.progressIntervalId = null;
    }
    
    // Switch phase
    const wasOnPhase = currentState.currentPhase;
    currentState.currentPhase = !currentState.currentPhase;
    
    // If we just finished an OFF phase (switching to ON), increment cycle count
    if (!wasOnPhase) {
      currentState.currentCycleCount++;
      console.log(`CycleToggle ${id}: Completed cycle ${currentState.currentCycleCount}`);
      
      // Update cycle count in node data
      updateNodeData(id, { 
        cycleCount: currentState.currentCycleCount,
        progress: 1.0 // Complete the progress for the finished phase
      });
    }
    
    // Continue with next phase
    console.log(`CycleToggle ${id}: Switching to ${currentState.currentPhase ? 'ON' : 'OFF'} phase`);
    setTimeout(() => startNextPhase(), 0);
  }
}

// Stop the toggle cycle
function stopToggleCycle(id: string) {
  const cycle = activeCycles.get(id);
  if (cycle) {
    console.log(`CycleToggle ${id}: Stopping toggle cycle`);
    
    // Mark as stopped
    cycle.isRunning = false;
    
    // Clear any active timers
    if (cycle.phaseTimeoutId) {
      window.clearTimeout(cycle.phaseTimeoutId);
    }
    if (cycle.progressIntervalId) {
      window.clearInterval(cycle.progressIntervalId);
    }
    
    // Remove from active cycles
    activeCycles.delete(id);
  }
}

// ============================================================================
// NODE CONFIGURATION
// ============================================================================

const CycleToggle = createNodeComponent<CycleToggleData>({
  nodeType: 'cycleToggle',
  category: 'trigger', // Yellow theme for trigger nodes
  displayName: 'Cycle Toggle',
  defaultData: { 
    onDuration: 4000,
    offDuration: 4000,
    infinite: true,
    initialState: false,
    maxCycles: 1,
    isRunning: false,
    triggered: false,
    // Runtime state
    isOn: false,
    phase: false,
    cycleCount: 0,
    progress: 0,
    phaseStartTime: undefined
  },
  
  // Custom sizing: 120x120 collapsed, 180x180 expanded
  size: {
    collapsed: {
      width: 'w-[120px]',
      height: 'h-[120px]'
    },
    expanded: {
      width: 'w-[180px]'
    }
  },
  
  // Define handles (boolean input -> boolean output)
  handles: [
    { id: 'b', dataType: 'b', position: Position.Left, type: 'target' },
    { id: 'b', dataType: 'b', position: Position.Right, type: 'source' }
  ],
  
  // Processing logic - handle external triggers and timer management
  processLogic: ({ data, connections, nodesData, updateNodeData, id, setError }) => {
    console.log(`CycleToggle ${id}: processLogic called, isOn: ${data.isOn}, isRunning: ${data.isRunning}, cycleCount: ${data.cycleCount}`);
    
    try {
      // Check if max cycles reached and stop if needed
      if (data.isOn && !data.infinite && (data.cycleCount || 0) >= (data.maxCycles || 1)) {
        console.log(`CycleToggle ${id}: Max cycles (${data.maxCycles}) reached, stopping`);
        updateNodeData(id, { 
          isOn: false,
          isRunning: false,
          progress: 0,
          phase: false,
          triggered: false
        });
        stopToggleCycle(id);
        return;
      }
      
      // Handle inspector control changes (isRunning property)
      if (data.isRunning !== data.isOn) {
        console.log(`CycleToggle ${id}: Inspector control changed, syncing isOn with isRunning`);
        
        if (data.isRunning && !data.isOn) {
          // Inspector started the cycle
          updateNodeData(id, { 
            isOn: true,
            cycleCount: 0,
            progress: 0,
            phase: data.initialState || false,
            triggered: data.initialState || false
          });
          startToggleCycle(id, updateNodeData, data.onDuration || 4000, data.offDuration || 4000, data.initialState || false);
        } else if (!data.isRunning && data.isOn) {
          // Inspector stopped the cycle
          updateNodeData(id, { 
            isOn: false,
            progress: 0,
            phase: false,
            triggered: false
          });
          stopToggleCycle(id);
        }
      }
      
      // Check for external trigger
      const boolInputConnections = connections.filter(c => c.targetHandle === 'b');
      const hasExternalTrigger = boolInputConnections.length > 0;
      
      if (hasExternalTrigger) {
        const externalTrigger = nodesData.some((node) => {
          const nodeData = node.data;
          return !!(nodeData?.triggered || nodeData?.value || nodeData?.text || nodeData?.output);
        });
        
        // Only handle external triggers if they change state
        if (externalTrigger && !data.isOn) {
          console.log(`CycleToggle ${id}: External trigger ON`);
          updateNodeData(id, { isOn: true, isRunning: true });
          startToggleCycle(id, updateNodeData, data.onDuration || 4000, data.offDuration || 4000, data.initialState || false);
        } else if (!externalTrigger && data.isOn) {
          console.log(`CycleToggle ${id}: External trigger OFF`);
          updateNodeData(id, { isOn: false, isRunning: false, phase: false, triggered: false });
          stopToggleCycle(id);
        }
      }
      
    } catch (updateError) {
      console.error(`CycleToggle ${id} - Update error:`, updateError);
      const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error';
      setError(errorMessage);
      
      // Clean up timers on error
      stopToggleCycle(id);
    }
  },

  // Collapsed state rendering - icon with progress
  renderCollapsed: ({ data, error, updateNodeData, id }) => {
    const handleToggle = () => {
      console.log(`CycleToggle ${id}: Manual toggle, current isOn:`, data.isOn);
      const newIsOn = !data.isOn;
      
      console.log(`CycleToggle ${id}: Setting isOn to:`, newIsOn);
      
      if (newIsOn) {
        // Starting
        updateNodeData(id, { 
          isOn: true, 
          isRunning: true,
          cycleCount: 0,
          progress: 0,
          phase: data.initialState || false,
          triggered: data.initialState || false
        });
        startToggleCycle(id, updateNodeData, data.onDuration || 4000, data.offDuration || 4000, data.initialState || false);
      } else {
        // Stopping
        updateNodeData(id, { 
          isOn: false, 
          isRunning: false,
          progress: 0,
          phase: false,
          triggered: false
        });
        stopToggleCycle(id);
      }
    };

    return (
      <div className="absolute inset-0 flex items-center justify-center">
        {error ? (
          <div className="text-xs text-center text-red-600 break-words p-2">
            {error}
          </div>
        ) : (
          <IconForToggleCycles
            progress={data.progress || 0}
            onToggle={handleToggle}
            isRunning={data.isOn || false}
            label="Toggle"
            size={100}
            color={data.phase ? '#3b82f6' : '#ef4444'} // Blue for ON, Red for OFF
          />
        )}
      </div>
    );
  },

  // Expanded state rendering - full controls
  renderExpanded: ({ data, error, categoryTextTheme, updateNodeData, id }) => (
    <div className="flex flex-col w-full h-full text-xs p-1"> {/* Reduce padding from p-2 to p-1 */}
      <div className={`font-semibold mb-1 text-center ${categoryTextTheme.primary}`}> {/* Keep mb-1 */}
        {error ? (
          <span className="text-red-600 dark:text-red-400">Error</span>
        ) : (
          'Toggle Cycle'
        )}
      </div>
      
      {error && (
        <div className="mb-1 p-1 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      
      <div className="flex-1 space-y-1 min-h-0"> {/* Reduce spacing from space-y-2 to space-y-1 */}
        {/* ON Duration */}
        <div className="flex items-center gap-1"> {/* Reduce gap from gap-2 to gap-1 */}
          <label className="text-xs w-10 shrink-0">ON:</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={data.onDuration || 4000}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Only allow digits
              const numValue = parseInt(value) || 100; // Minimum 100ms
              updateNodeData(id, { onDuration: Math.max(100, numValue) });
            }}
            className="w-16 rounded border border-gray-300 dark:border-gray-600 px-1 text-xs h-5 bg-white dark:bg-gray-800" // Reduce height and padding
            disabled={!!error}
          />
          <span className="text-xs w-6 shrink-0">ms</span>
        </div>
        
        {/* OFF Duration */}
        <div className="flex items-center gap-1"> {/* Reduce gap from gap-2 to gap-1 */}
          <label className="text-xs w-10 shrink-0">OFF:</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={data.offDuration || 4000}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Only allow digits
              const numValue = parseInt(value) || 100; // Minimum 100ms
              updateNodeData(id, { offDuration: Math.max(100, numValue) });
            }}
            className="w-16 rounded border border-gray-300 dark:border-gray-600 px-1 text-xs h-5 bg-white dark:bg-gray-800" // Reduce height and padding
            disabled={!!error}
          />
          <span className="text-xs w-6 shrink-0">ms</span>
        </div>
        
        {/* Infinite checkbox */}
        <div className="flex items-center gap-1"> {/* Reduce gap from gap-2 to gap-1 */}
          <input 
            type="checkbox" 
            checked={data.infinite ?? true}
            onChange={(e) => updateNodeData(id, { infinite: e.target.checked })}
            disabled={!!error}
            className="shrink-0"
          />
          <label className="text-xs">Infinite cycles</label>
        </div>
        
        {/* Max Cycles (when not infinite) */}
        {!data.infinite && (
          <div className="flex items-center gap-1"> {/* Reduce gap from gap-2 to gap-1 */}
            <label className="text-xs w-10 shrink-0">Max:</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={data.maxCycles || 1}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                const numValue = parseInt(value) || 1; // Minimum 1 cycle
                updateNodeData(id, { maxCycles: Math.max(1, numValue) });
              }}
              className="w-12 rounded border border-gray-300 dark:border-gray-600 px-1 text-xs h-5 bg-white dark:bg-gray-800" // Reduce height and padding
              disabled={!!error}
            />
            <span className="text-xs w-14 shrink-0">cycles</span>
          </div>
        )}
        
        {/* Initial State */}
        <div className="flex items-center gap-1"> {/* Reduce gap from gap-2 to gap-1 */}
          <input 
            type="checkbox" 
            checked={data.initialState ?? false}
            onChange={(e) => updateNodeData(id, { initialState: e.target.checked })}
            disabled={!!error}
            className="shrink-0"
          />
          <label className="text-xs">Start ON</label>
        </div>
        
        {/* Status */}
        <div className={`text-xs ${categoryTextTheme.secondary} text-center py-1`}> {/* Reduce padding from py-2 to py-1 */}
          {data.isOn ? (
            <span className="text-yellow-600 dark:text-yellow-400">
              {data.phase ? 'ON' : 'OFF'} ({data.cycleCount || 0})
            </span>
          ) : (
            <span className="text-gray-500">Stopped</span>
          )}
        </div>
        
        {/* Control button */}
        <div 
          className="nodrag nowheel flex justify-center pt-1" // Reduce padding from pt-2 to pt-1
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <button
            className={`px-3 py-1 rounded text-white font-bold shadow transition-colors text-xs ${
              data.phase 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : data.isOn 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-yellow-500 hover:bg-yellow-600'
            }`} // Reduce button padding from px-4 py-2 to px-3 py-1
            onClick={() => {
              console.log(`CycleToggle ${id}: Button clicked, current isOn:`, data.isOn);
              const newIsOn = !data.isOn;
              updateNodeData(id, { 
                isOn: newIsOn, 
                isRunning: newIsOn,
                cycleCount: newIsOn ? 0 : (data.cycleCount || 0),
                progress: 0
              });
            }}
            disabled={!!error}
          >
            {data.isOn ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  ),

  // Error recovery data
  errorRecoveryData: {
    onDuration: 4000,
    offDuration: 4000,
    infinite: true,
    initialState: false,
    maxCycles: 1,
    isRunning: false,
    triggered: false,
    isOn: false,
    phase: false,
    cycleCount: 0,
    progress: 0,
    phaseStartTime: undefined
  }
});

// ============================================================================
// CLEANUP FUNCTION
// ============================================================================

// Cleanup function for when nodes are removed
export const cleanupCycleToggleTimers = (id: string) => {
  stopToggleCycle(id);
};

export default CycleToggle; 