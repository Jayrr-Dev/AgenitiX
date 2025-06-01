// nodes/CyclePulse.tsx
'use client'

import React from 'react';
import { Position } from '@xyflow/react';
import { createNodeComponent, type BaseNodeData } from '../factory/NodeFactory';
import IconForPulseCycles from '../node-icons/IconForPulseCycles';

// ============================================================================
// NODE DATA INTERFACE  
// ============================================================================

interface CyclePulseData extends BaseNodeData {
  cycleDuration: number;
  pulseDuration: number;
  infinite: boolean;
  initialState: boolean;
  maxCycles: number;
  isRunning: boolean;
  triggered: boolean;
  // Runtime state
  isOn: boolean;
  pulsing: boolean;
  cycleCount: number;
  progress: number;
  // Timer tracking
  cycleStartTime?: number;
  output?: string;
}

// ============================================================================
// GLOBAL TIMER MANAGEMENT
// ============================================================================

// Helper function to ensure progress is always rounded to 5 decimal places
const roundProgress = (progress: number): number => {
  return Math.round(Math.max(0, Math.min(1, progress)) * 100000) / 100000;
};

// Global timer management for CyclePulse instances
const cycleTimers = new Map<string, {
  intervalRef: number | null;
  timeoutRef: number | null;
  progressIntervalRef: number | null;
}>();

// ============================================================================
// SIMPLE CYCLE FUNCTIONS (Using working setTimeout pattern)
// ============================================================================

// Store active cycles with separate timers
const activeCycles = new Map<string, { 
  pulseTimeoutId: number | null;
  cycleTimeoutId: number | null;
  progressIntervalId: number | null;
  isRunning: boolean;
  currentCycleCount: number;
}>();

// Start a simple repeating cycle
function startSimpleCycle(
  id: string,
  updateNodeData: (id: string, updates: Partial<CyclePulseData>) => void,
  cycleDuration: number,
  pulseDuration: number
) {
  console.log(`CyclePulse ${id}: Starting simple cycle, cycle: ${cycleDuration}ms, pulse: ${pulseDuration}ms`);
  
  // Stop any existing cycle first
  stopSimpleCycle(id);
  
  // Initialize cycle state
  const cycleState = {
    pulseTimeoutId: null as number | null,
    cycleTimeoutId: null as number | null,
    progressIntervalId: null as number | null,
    isRunning: true,
    currentCycleCount: 0
  };
  activeCycles.set(id, cycleState);
  
  // Start the cycle immediately
  startNextCycle();
  
  function startNextCycle() {
    const currentState = activeCycles.get(id);
    if (!currentState || !currentState.isRunning) {
      console.log(`CyclePulse ${id}: Cycle stopped, exiting`);
      return;
    }
    
    console.log(`CyclePulse ${id}: Starting next cycle`);
    
    // Start cycle stage (waiting phase with blue animation)
    updateNodeData(id, { 
      pulsing: false, 
      triggered: false,
      progress: 0
    });
    
    const cycleStartTime = Date.now();
    
    // Progress animation during cycle stage
    const cycleProgressInterval = window.setInterval(() => {
      const currentState = activeCycles.get(id);
      if (!currentState || !currentState.isRunning) {
        window.clearInterval(cycleProgressInterval);
        return;
      }
      
      const elapsed = Date.now() - cycleStartTime;
      const rawProgress = Math.min(1, elapsed / cycleDuration);
      const progress = roundProgress(rawProgress);
      
      updateNodeData(id, { progress });
      
      if (progress >= 1) {
        window.clearInterval(cycleProgressInterval);
      }
    }, 50);
    
    // Store progress interval
    if (currentState) {
      currentState.progressIntervalId = cycleProgressInterval;
    }
    
    // After cycle duration, start pulse stage
    const cycleTimeoutId = window.setTimeout(() => {
      startPulseStage();
    }, cycleDuration);
    
    // Store cycle timeout
    if (currentState) {
      currentState.cycleTimeoutId = cycleTimeoutId;
    }
  }
  
  function startPulseStage() {
    const currentState = activeCycles.get(id);
    if (!currentState || !currentState.isRunning) {
      return;
    }
    
    console.log(`CyclePulse ${id}: Starting pulse stage`);
    
    // Clear cycle progress interval
    if (currentState.progressIntervalId) {
      window.clearInterval(currentState.progressIntervalId);
      currentState.progressIntervalId = null;
    }
    
    // Start pulse stage and increment cycle count
    updateNodeData(id, { 
      pulsing: true, 
      triggered: true,
      progress: 1.0, // Full circle for solid red
      cycleCount: (currentState as any).currentCycleCount + 1
    });
    
    // Store the new cycle count in our local state
    const currentCycleCount = (currentState as any).currentCycleCount + 1;
    if (currentState) {
      (currentState as any).currentCycleCount = currentCycleCount;
    }
    
    console.log(`CyclePulse ${id}: Cycle ${currentCycleCount} - pulse stage started`);
    
    // End pulse after pulse duration
    const pulseTimeoutId = window.setTimeout(() => {
      endPulseStageAndDecide(currentCycleCount);
    }, pulseDuration);
    
    // Store pulse timeout
    if (currentState) {
      currentState.pulseTimeoutId = pulseTimeoutId;
    }
  }
  
  function endPulseStageAndDecide(cycleCount: number) {
    const currentState = activeCycles.get(id);
    if (!currentState || !currentState.isRunning) {
      return;
    }
    
    console.log(`CyclePulse ${id}: Ending pulse stage, cycle ${cycleCount} complete`);
    
    // End the pulse stage
    updateNodeData(id, { 
      pulsing: false, 
      triggered: false
    });
    
    // Always schedule next cycle - processLogic will handle stopping if max cycles reached
    console.log(`CyclePulse ${id}: Scheduling next cycle`);
    setTimeout(() => startNextCycle(), 0);
  }
}

// Stop the simple cycle
function stopSimpleCycle(id: string) {
  const cycle = activeCycles.get(id);
  if (cycle) {
    console.log(`CyclePulse ${id}: Stopping simple cycle`);
    
    // Mark as stopped
    cycle.isRunning = false;
    
    // Clear any active timers
    if (cycle.pulseTimeoutId) {
      window.clearTimeout(cycle.pulseTimeoutId);
    }
    if (cycle.cycleTimeoutId) {
      window.clearTimeout(cycle.cycleTimeoutId);
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

const CyclePulse = createNodeComponent<CyclePulseData>({
  nodeType: 'cyclePulse',
  category: 'trigger', // Yellow theme for trigger nodes
  displayName: 'Cycle Pulse',
  defaultData: { 
    cycleDuration: 2000,
    pulseDuration: 500,
    infinite: true,
    initialState: false,
    maxCycles: 1,
    isRunning: false,
    triggered: false,
    // Runtime state
    isOn: false,
    pulsing: false,
    cycleCount: 0,
    progress: 0,
    cycleStartTime: undefined,
    output: undefined
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
    console.log(`CyclePulse ${id}: processLogic called, isOn: ${data.isOn}, isRunning: ${data.isRunning}, cycleCount: ${data.cycleCount}`);
    
    try {
      // Check if max cycles reached and stop if needed
      if (data.isOn && !data.infinite && (data.cycleCount || 0) >= (data.maxCycles || 1)) {
        console.log(`CyclePulse ${id}: Max cycles (${data.maxCycles}) reached in processLogic, stopping`);
        updateNodeData(id, { 
          isOn: false,
          isRunning: false,
          progress: 0,
          pulsing: false,
          triggered: false,
          output: undefined
        });
        stopSimpleCycle(id);
        return;
      }
      
      // Handle inspector control changes (isRunning property)
      if (data.isRunning !== data.isOn) {
        console.log(`CyclePulse ${id}: Inspector control changed, syncing isOn with isRunning`);
        
        if (data.isRunning && !data.isOn) {
          // Inspector started the cycle
          updateNodeData(id, { 
            isOn: true,
            cycleCount: 0,
            progress: 0,
            pulsing: false,
            triggered: false,
            output: 'CYCLING' // Set output for active state detection
          });
          startSimpleCycle(id, updateNodeData, data.cycleDuration || 2000, data.pulseDuration || 500);
        } else if (!data.isRunning && data.isOn) {
          // Inspector stopped the cycle
          updateNodeData(id, { 
            isOn: false,
            progress: 0,
            pulsing: false,
            triggered: false,
            output: undefined // Clear output to deactivate glow
          });
          stopSimpleCycle(id);
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
          console.log(`CyclePulse ${id}: External trigger ON`);
          updateNodeData(id, { isOn: true, isRunning: true, output: 'CYCLING' });
          startSimpleCycle(id, updateNodeData, data.cycleDuration || 2000, data.pulseDuration || 500);
        } else if (!externalTrigger && data.isOn) {
          console.log(`CyclePulse ${id}: External trigger OFF`);
          updateNodeData(id, { isOn: false, isRunning: false, pulsing: false, triggered: false, output: undefined });
          stopSimpleCycle(id);
        }
      }
      
    } catch (updateError) {
      console.error(`CyclePulse ${id} - Update error:`, updateError);
      const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error';
      setError(errorMessage);
      
      // Clean up timers on error
      stopSimpleCycle(id);
    }
  },

  // Collapsed state rendering - icon with progress
  renderCollapsed: ({ data, error, updateNodeData, id }) => {
    const handleToggle = () => {
      console.log(`CyclePulse ${id}: Manual toggle, current isOn:`, data.isOn);
      const newIsOn = !data.isOn;
      
      console.log(`CyclePulse ${id}: Setting isOn to:`, newIsOn);
      
      if (newIsOn) {
        // Starting
        updateNodeData(id, { 
          isOn: true, 
          isRunning: true,
          cycleCount: 0,
          progress: 0,
          pulsing: false,
          triggered: false,
          output: 'CYCLING'
        });
        startSimpleCycle(id, updateNodeData, data.cycleDuration || 2000, data.pulseDuration || 500);
      } else {
        // Stopping
        updateNodeData(id, { 
          isOn: false, 
          isRunning: false,
          progress: 0,
          pulsing: false,
          triggered: false,
          output: undefined
        });
        stopSimpleCycle(id);
      }
    };

    return (
      <div className="absolute inset-0 flex items-center justify-center">
        {error ? (
          <div className="text-xs text-center text-red-600 break-words p-2">
            {error}
          </div>
        ) : (
          <IconForPulseCycles
            progress={data.progress || 0}
            onToggle={handleToggle}
            isRunning={data.isOn || false}
            label="Pulse"
            size={100}
            color={data.pulsing ? '#ef4444' : '#3b82f6'}
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
          'Pulse Cycle'
        )}
      </div>
      
      {error && (
        <div className="mb-1 p-1 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      
      <div className="flex-1 space-y-1 min-h-0"> {/* Reduce spacing from space-y-2 to space-y-1 */}
        {/* Cycle Duration */}
        <div className="flex items-center gap-1"> {/* Reduce gap from gap-2 to gap-1 */}
          <label className="text-xs w-12 shrink-0">Cycle:</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
            value={data.cycleDuration || 2000}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Only allow digits
              const numValue = parseInt(value) || 100; // Minimum 100ms
              updateNodeData(id, { cycleDuration: Math.max(100, numValue) });
            }}
            className="w-16 rounded border border-gray-300 dark:border-gray-600 px-1 text-xs h-5 bg-white dark:bg-gray-800" // Reduce height and padding
            disabled={!!error}
          />
          <span className="text-xs w-6 shrink-0">ms</span>
      </div>
      
        {/* Pulse Duration */}
        <div className="flex items-center gap-1"> {/* Reduce gap from gap-2 to gap-1 */}
          <label className="text-xs w-12 shrink-0">Pulse:</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
            value={data.pulseDuration || 500}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Only allow digits
              const numValue = parseInt(value) || 10; // Minimum 10ms
              updateNodeData(id, { pulseDuration: Math.max(10, numValue) });
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
            <label className="text-xs w-12 shrink-0">Max:</label>
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
        
        {/* Status */}
        <div className={`text-xs ${categoryTextTheme.secondary} text-center py-1`}> {/* Reduce padding from py-2 to py-1 */}
          {data.isOn ? (
            <span className="text-yellow-600 dark:text-yellow-400">
              {data.pulsing ? 'PULSING' : 'CYCLING'} ({data.cycleCount || 0})
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
              data.pulsing 
                ? 'bg-red-500 hover:bg-red-600' 
                : data.isOn 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-yellow-500 hover:bg-yellow-600'
            }`} // Reduce button padding from px-4 py-2 to px-3 py-1
            onClick={() => {
              console.log(`CyclePulse ${id}: Button clicked, current isOn:`, data.isOn);
              const newIsOn = !data.isOn;
              updateNodeData(id, { 
                isOn: newIsOn, 
                isRunning: newIsOn,
                cycleCount: newIsOn ? 0 : (data.cycleCount || 0),
                progress: 0,
                output: newIsOn ? 'CYCLING' : undefined
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
    cycleDuration: 2000,
    pulseDuration: 500,
    infinite: true,
    initialState: false,
    maxCycles: 1,
    isRunning: false,
    triggered: false,
    isOn: false,
    pulsing: false,
    cycleCount: 0,
    progress: 0,
    cycleStartTime: undefined
  }
});

// ============================================================================
// TIMER HELPER FUNCTIONS
// ============================================================================

// Start timers for a node (simplified version)
function startTimersForNode(
  id: string, 
  updateNodeData: (id: string, updates: Partial<CyclePulseData>) => void,
  cycleDuration: number,
  pulseDuration: number
) {
  // Clear any existing timers
  stopTimersForNode(id);
  
  console.log(`CyclePulse ${id}: Starting timers, cycle: ${cycleDuration}ms, pulse: ${pulseDuration}ms`);
  
  const timerState = {
    intervalRef: null as number | null,
    timeoutRef: null as number | null,
    progressIntervalRef: null as number | null,
  };
  
  cycleTimers.set(id, timerState);
  
  let currentCycleCount = 0;
  
  const startCycle = () => {
    console.log(`CyclePulse ${id}: Starting new cycle`);
    const cycleStartTime = Date.now();
    
    // Start pulse
    updateNodeData(id, { 
      pulsing: true, 
      triggered: true,
      progress: 0,
      cycleStartTime
    });
    
    // End pulse after pulseDuration
    timerState.timeoutRef = window.setTimeout(() => {
      console.log(`CyclePulse ${id}: Ending pulse`);
      currentCycleCount++;
      updateNodeData(id, { 
        pulsing: false, 
        triggered: false,
        cycleCount: currentCycleCount
      });
    }, pulseDuration);
  };
  
  // Start first cycle immediately
  startCycle();
  
  // Set up cycle interval
  timerState.intervalRef = window.setInterval(startCycle, cycleDuration + pulseDuration);
  
  // Start progress tracking
  timerState.progressIntervalRef = window.setInterval(() => {
    // Simple progress tracking - this is approximate since we don't have access to current data
    const now = Date.now();
    // We'll update progress to 50% as a placeholder - the actual progress would need 
    // to be calculated based on the current cycle start time from the node data
    updateNodeData(id, { progress: roundProgress(Math.random() * 0.5 + 0.25) }); // Temporary visual feedback
  }, 100);
}

// Stop timers for a node
function stopTimersForNode(id: string) {
  const timerState = cycleTimers.get(id);
  if (timerState) {
    console.log(`CyclePulse ${id}: Stopping timers`);
    if (timerState.intervalRef) {
      window.clearInterval(timerState.intervalRef);
    }
    if (timerState.timeoutRef) {
      window.clearTimeout(timerState.timeoutRef);
    }
    if (timerState.progressIntervalRef) {
      window.clearInterval(timerState.progressIntervalRef);
    }
    cycleTimers.delete(id);
  }
}

// Cleanup function for when nodes are removed
export const cleanupCyclePulseTimers = (id: string) => {
  stopTimersForNode(id);
};

export default CyclePulse; 