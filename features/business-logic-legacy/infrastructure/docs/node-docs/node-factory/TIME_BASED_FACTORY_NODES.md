# Time-Based Factory Nodes Documentation

## Overview

Time-based nodes in the factory system require special patterns and considerations that differ significantly from input-driven nodes. This document captures the essential patterns, common pitfalls, and best practices learned from implementing timer-based nodes like CyclePulse and CycleToggle.

## Table of Contents

1. [Key Differences from Input-Driven Nodes](#key-differences)
2. [Architecture Patterns](#architecture-patterns)
3. [Global State Management](#global-state-management)
4. [Timer Management](#timer-management)
5. [Progress Tracking](#progress-tracking)
6. [Business Logic Separation](#business-logic-separation)
7. [Common Pitfalls](#common-pitfalls)
8. [Best Practices](#best-practices)
9. [Complete Example](#complete-example)
10. [Real-World Examples](#real-world-examples)

## Key Differences from Input-Driven Nodes {#key-differences}

### Input-Driven Nodes
- Triggered by connection changes
- processLogic runs when inputs change
- Stateless - derive everything from inputs

### Time-Based Nodes
- Self-triggering via timers
- processLogic runs continuously as state changes
- Stateful - maintain timer state and progress
- Need global state management for timers

## Architecture Patterns

### 1. Global Timer Registry

Time-based nodes require global state management since factory render functions cannot use React hooks.

```typescript
// Global timer management
const activeCycles = new Map<string, {
  pulseTimeoutId: number | null;
  cycleTimeoutId: number | null;
  progressIntervalId: number | null;
  isRunning: boolean;
  currentCycleCount: number; // Local state tracking
}>();
```

### 2. Three-Function Pattern

Time-based nodes typically follow this pattern:

```typescript
function startTimers(id: string, updateNodeData: Function, ...params) {
  // Initialize timers and state
}

function stopTimers(id: string) {
  // Clean up all timers and state
}

function cleanupTimers(id: string) {
  // Export for external cleanup
  stopTimers(id);
}
```

## Global State Management

### ❌ Wrong: Using React Hooks in Factory

```typescript
// This will NOT work - factory render functions cannot use hooks
const MyTimeNode = createNodeComponent({
  processLogic: ({ updateNodeData }) => {
    const [timer, setTimer] = useState(null); // ❌ Error!
    useEffect(() => { ... }, []); // ❌ Error!
  }
});
```

### ✅ Correct: Global State Management

```typescript
// Global registry for timer state
const nodeTimers = new Map<string, {
  timerId: number | null;
  isRunning: boolean;
  startTime: number;
}>();

function startTimer(id: string, updateNodeData: Function, duration: number) {
  stopTimer(id); // Always clean up first
  
  const timerState = {
    timerId: null,
    isRunning: true,
    startTime: Date.now()
  };
  nodeTimers.set(id, timerState);
  
  // Start timer
  const timerId = window.setTimeout(() => {
    updateNodeData(id, { completed: true });
    nodeTimers.delete(id);
  }, duration);
  
  timerState.timerId = timerId;
}
```

## Timer Management

### Critical Timer Patterns

#### 1. Always Clean Up First
```typescript
function startTimer(id: string, ...params) {
  stopTimer(id); // ✅ Always stop existing timers first
  
  // Initialize new timer state
  const timerState = { /* ... */ };
  timers.set(id, timerState);
}
```

#### 2. State Checking in Callbacks
```typescript
const timerId = window.setTimeout(() => {
  const currentState = timers.get(id);
  if (!currentState || !currentState.isRunning) {
    return; // ✅ Exit if timer was stopped
  }
  
  // Continue with timer logic
}, duration);
```

#### 3. Complete Cleanup
```typescript
function stopTimer(id: string) {
  const timer = timers.get(id);
  if (timer) {
    // Mark as stopped
    timer.isRunning = false;
    
    // Clear all timer IDs
    if (timer.mainTimerId) window.clearTimeout(timer.mainTimerId);
    if (timer.progressIntervalId) window.clearInterval(timer.progressIntervalId);
    
    // Remove from registry
    timers.delete(id);
  }
}
```

## Progress Tracking

### Progress Animation Pattern

```typescript
function startProgressTracking(id: string, totalDuration: number, updateNodeData: Function) {
  const startTime = Date.now();
  
  const progressInterval = window.setInterval(() => {
    const timerState = timers.get(id);
    if (!timerState || !timerState.isRunning) {
      window.clearInterval(progressInterval);
      return;
    }
    
    const elapsed = Date.now() - startTime;
    const rawProgress = Math.min(1, elapsed / totalDuration);
    const progress = roundProgress(rawProgress); // Round for clean JSON
    
    updateNodeData(id, { progress });
    
    if (progress >= 1) {
      window.clearInterval(progressInterval);
    }
  }, 50); // 50ms for smooth animation
  
  // Store interval ID for cleanup
  if (timerState) {
    timerState.progressIntervalId = progressInterval;
  }
}

// Helper for consistent rounding
const roundProgress = (progress: number): number => {
  return Math.round(Math.max(0, Math.min(1, progress)) * 100000) / 100000;
};
```

## Business Logic Separation

### ❌ Wrong: Business Logic in Timer Functions

```typescript
// Don't mix timer mechanics with business decisions
function onTimerComplete(id: string) {
  const currentData = getCurrentData(id); // ❌ Can't access current data
  if (currentData.infinite) { // ❌ Business logic in timer
    startNextCycle();
  } else if (currentData.cycleCount >= currentData.maxCycles) {
    stopTimer();
  }
}
```

### ✅ Correct: Business Logic in processLogic

```typescript
const MyTimeNode = createNodeComponent({
  processLogic: ({ data, updateNodeData, id }) => {
    // ✅ Business logic belongs here - has access to current data
    
    // Check stopping conditions
    if (data.isRunning && !data.infinite && data.cycleCount >= data.maxCycles) {
      console.log(`Max cycles reached, stopping`);
      updateNodeData(id, { 
        isRunning: false,
        isOn: false 
      });
      stopTimer(id);
      return;
    }
    
    // Handle start/stop changes
    if (data.isRunning !== data.isOn) {
      if (data.isRunning) {
        startTimer(id, updateNodeData, data.duration);
      } else {
        stopTimer(id);
      }
    }
  }
});
```

## Common Pitfalls

### 1. Race Conditions with updateNodeData

❌ **Problem**: Multiple `updateNodeData` calls can create race conditions

```typescript
// This creates a race condition
updateNodeData(id, { cycleCount: newCount }); // Update 1
updateNodeData(id, { progress: 0 });          // Update 2 - might see old cycleCount
```

✅ **Solution**: Combine related updates

```typescript
// Single atomic update
updateNodeData(id, {
  cycleCount: newCount,
  progress: 0,
  pulsing: true
});
```

### 2. Using Callback Pattern with updateNodeData

❌ **Problem**: Factory `updateNodeData` doesn't support callbacks

```typescript
// This will NOT work in factory nodes
updateNodeData(id, (currentData) => ({
  ...currentData,
  count: currentData.count + 1
}));
```

✅ **Solution**: Track state globally, update with partial objects

```typescript
// Track locally, update with partial
const timerState = timers.get(id);
const newCount = (timerState?.currentCount || 0) + 1;
timerState.currentCount = newCount;

updateNodeData(id, { count: newCount });
```

### 3. Missing Timer Cleanup

❌ **Problem**: Memory leaks from uncleaned timers

```typescript
// Missing cleanup can cause memory leaks
function stopNode(id: string) {
  timers.delete(id); // ❌ Didn't clear actual timers
}
```

✅ **Solution**: Complete cleanup pattern

```typescript
function stopNode(id: string) {
  const timer = timers.get(id);
  if (timer) {
    timer.isRunning = false;
    
    // Clear ALL timer IDs
    if (timer.mainTimer) window.clearTimeout(timer.mainTimer);
    if (timer.progressTimer) window.clearInterval(timer.progressTimer);
    if (timer.additionalTimer) window.clearTimeout(timer.additionalTimer);
    
    timers.delete(id);
  }
}
```

## Best Practices

### 1. State Structure Design

```typescript
interface TimerState {
  // Timer IDs for cleanup
  mainTimerId: number | null;
  progressIntervalId: number | null;
  
  // Control flags
  isRunning: boolean;
  
  // Local state tracking (for calculations)
  currentCycleCount: number;
  startTime: number;
  
  // Any other timer-specific state
}
```

### 2. Consistent Logging

```typescript
function startTimer(id: string, duration: number) {
  console.log(`Timer ${id}: Starting with duration ${duration}ms`);
  
  const timerId = window.setTimeout(() => {
    console.log(`Timer ${id}: Completed`);
    // ... completion logic
  }, duration);
}
```

### 3. Error Handling

```typescript
function timerCallback(id: string) {
  try {
    const state = timers.get(id);
    if (!state || !state.isRunning) return;
    
    // Timer logic here
    updateNodeData(id, { completed: true });
    
  } catch (error) {
    console.error(`Timer ${id} error:`, error);
    stopTimer(id); // Clean up on error
    updateNodeData(id, { error: error.message });
  }
}
```

### 4. Defensive Programming

```typescript
// Always check state before acting
const checkStateAndExecute = (id: string, action: () => void) => {
  const state = timers.get(id);
  if (state && state.isRunning) {
    action();
  }
};

// Use it in timer callbacks
window.setTimeout(() => {
  checkStateAndExecute(id, () => {
    // Safe timer logic
  });
}, duration);
```

### 5. Input Field Best Practices

**❌ Avoid `type="number"` inputs** - They have inconsistent behavior across browsers and can cause UX issues.

**✅ Use `type="text"` with number restrictions instead:**

```typescript
// Recommended pattern for numeric inputs
<input
  type="text"           // Use text input
  inputMode="numeric"   // Show numeric keyboard on mobile
  pattern="[0-9]*"      // HTML validation pattern
  value={data.duration || 2000}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, ''); // Strip non-digits
    const numValue = parseInt(value) || 100;         // Parse with fallback
    updateNodeData(id, { duration: Math.max(100, numValue) }); // Enforce minimum
  }}
  className="w-16 rounded border border-gray-300 dark:border-gray-600 px-1 text-xs h-5 bg-white dark:bg-gray-800"
/>
```

**Benefits of this approach:**
- **Consistent behavior** across all browsers and platforms
- **Mobile-friendly** with `inputMode="numeric"` showing number pad
- **Robust validation** with manual digit filtering and minimum enforcement  
- **Better UX** - no spinner controls that can be accidentally triggered
- **Predictable** - always gets a valid number or falls back to default

**Sizing for compact forms:**
- Use `h-5` instead of `h-6` for tighter spacing
- Use `px-1` instead of `px-2` for minimal padding
- Use `w-16` for 4-digit numbers, `w-12` for smaller values

## Complete Example

Here's a complete minimal time-based node following all best practices:

```typescript
// Global timer registry
const nodeTimers = new Map<string, {
  timerId: number | null;
  progressIntervalId: number | null;
  isRunning: boolean;
  startTime: number;
}>();

// Helper functions
function roundProgress(progress: number): number {
  return Math.round(Math.max(0, Math.min(1, progress)) * 100000) / 100000;
}

function startTimer(
  id: string,
  updateNodeData: (id: string, updates: Partial<TimerNodeData>) => void,
  duration: number
) {
  console.log(`Timer ${id}: Starting ${duration}ms timer`);
  
  // Always clean up first
  stopTimer(id);
  
  // Initialize state
  const timerState = {
    timerId: null as number | null,
    progressIntervalId: null as number | null,
    isRunning: true,
    startTime: Date.now()
  };
  nodeTimers.set(id, timerState);
  
  // Start progress tracking
  const progressInterval = window.setInterval(() => {
    const state = nodeTimers.get(id);
    if (!state || !state.isRunning) {
      window.clearInterval(progressInterval);
      return;
    }
    
    const elapsed = Date.now() - state.startTime;
    const progress = roundProgress(Math.min(1, elapsed / duration));
    
    updateNodeData(id, { progress });
    
    if (progress >= 1) {
      window.clearInterval(progressInterval);
    }
  }, 50);
  
  timerState.progressIntervalId = progressInterval;
  
  // Main timer
  const mainTimer = window.setTimeout(() => {
    const state = nodeTimers.get(id);
    if (!state || !state.isRunning) return;
    
    console.log(`Timer ${id}: Completed`);
    updateNodeData(id, { 
      completed: true,
      progress: 1,
      isRunning: false 
    });
    
    nodeTimers.delete(id);
  }, duration);
  
  timerState.timerId = mainTimer;
}

function stopTimer(id: string) {
  const timer = nodeTimers.get(id);
  if (timer) {
    console.log(`Timer ${id}: Stopping`);
    
    timer.isRunning = false;
    
    if (timer.timerId) window.clearTimeout(timer.timerId);
    if (timer.progressIntervalId) window.clearInterval(timer.progressIntervalId);
    
    nodeTimers.delete(id);
  }
}

// Factory node definition
const TimerNode = createNodeComponent<TimerNodeData>({
  nodeType: 'timerNode',
  category: 'trigger',
  displayName: 'Timer',
  
  defaultData: {
    duration: 5000,
    isRunning: false,
    completed: false,
    progress: 0
  },
  
  handles: [
    { id: 'trigger', dataType: 'b', position: Position.Right, type: 'source' }
  ],
  
  processLogic: ({ data, updateNodeData, id, setError }) => {
    try {
      // Business logic: handle start/stop
      if (data.isRunning && !nodeTimers.has(id)) {
        // Start timer if not already running
        updateNodeData(id, { 
          completed: false, 
          progress: 0 
        });
        startTimer(id, updateNodeData, data.duration || 5000);
        
      } else if (!data.isRunning && nodeTimers.has(id)) {
        // Stop timer if running
        stopTimer(id);
        updateNodeData(id, { 
          progress: 0,
          completed: false 
        });
      }
      
    } catch (error) {
      console.error(`Timer ${id} error:`, error);
      stopTimer(id);
      setError(error instanceof Error ? error.message : 'Timer error');
    }
  },
  
  renderCollapsed: ({ data, updateNodeData, id }) => (
    <button
      onClick={() => updateNodeData(id, { isRunning: !data.isRunning })}
      className="w-full h-full flex items-center justify-center"
    >
      {data.isRunning ? '⏸️' : '▶️'}
    </button>
  ),
  
  renderExpanded: ({ data, updateNodeData, id }) => (
    <div className="p-2 space-y-2">
      <div>Timer: {data.duration}ms</div>
      <div>Progress: {Math.round((data.progress || 0) * 100)}%</div>
      <button
        onClick={() => updateNodeData(id, { isRunning: !data.isRunning })}
        className="px-2 py-1 bg-blue-500 text-white rounded"
      >
        {data.isRunning ? 'Stop' : 'Start'}
      </button>
    </div>
  ),
  
  errorRecoveryData: {
    isRunning: false,
    completed: false,
    progress: 0
  }
});

// Export cleanup function
export const cleanupTimerNode = (id: string) => {
  stopTimer(id);
};

export default TimerNode;
```

## Real-World Examples

### CyclePulse vs CycleToggle

Two different time-based nodes demonstrate the flexibility of these patterns:

#### CyclePulse
- **Behavior**: Cycle duration (blue radial) → Pulse duration (solid red)
- **Timer states**: `cycleProgressInterval` + `pulseTimeout` + `cycleTimeout`
- **Output**: Triggers during pulse phase only
- **Progress**: Visual radial during cycle, solid during pulse

#### CycleToggle  
- **Behavior**: ON phase → OFF phase → repeat
- **Timer states**: `phaseTimeout` + `progressInterval` per phase
- **Output**: Triggers during ON phase only
- **Progress**: Continuous radial through both phases

### Key Architectural Differences

```typescript
// CyclePulse: Two-stage timer (waiting + pulsing)
const activeCycles = new Map<string, {
  pulseTimeoutId: number | null;
  cycleTimeoutId: number | null;
  progressIntervalId: number | null;
  currentCycleCount: number;
}>();

// CycleToggle: Single-stage timer (alternating phases)
const activeCycles = new Map<string, {
  phaseTimeoutId: number | null;
  progressIntervalId: number | null;
  currentCycleCount: number;
  currentPhase: boolean; // ON vs OFF
}>();
```

### Cycle Counting Logic

Both nodes handle cycle counting differently but follow the same reactive pattern:

```typescript
// CyclePulse: Increments on pulse start
function startPulseStage() {
  updateNodeData(id, { 
    cycleCount: currentState.currentCycleCount + 1,
    pulsing: true 
  });
}

// CycleToggle: Increments when OFF→ON transition
function switchToNextPhase() {
  if (!wasOnPhase) { // Finished OFF phase, starting ON
    currentState.currentCycleCount++;
    updateNodeData(id, { cycleCount: currentState.currentCycleCount });
  }
}
```

### Visual Feedback Patterns

Both nodes use the same progress tracking but with different visual interpretations:

```typescript
// CyclePulse: Blue during cycle, red during pulse
color={data.pulsing ? '#ef4444' : '#3b82f6'}

// CycleToggle: Blue during ON, red during OFF  
color={data.phase ? '#3b82f6' : '#ef4444'}
```

### Business Logic Convergence

Despite different timer mechanics, both nodes follow identical business logic patterns:

```typescript
// Both nodes: Identical max cycles enforcement
if (data.isOn && !data.infinite && (data.cycleCount || 0) >= (data.maxCycles || 1)) {
  updateNodeData(id, { isOn: false, isRunning: false, ... });
  stopTimerFunction(id);
  return;
}

// Both nodes: Identical external trigger handling
if (hasExternalTrigger) {
  if (externalTrigger && !data.isOn) {
    startTimerFunction(id, updateNodeData, ...params);
  } else if (!externalTrigger && data.isOn) {
    stopTimerFunction(id);
  }
}
```

## Pattern Scalability

This architecture scales to any time-based node:

- **Delay nodes**: Single timeout with progress tracking
- **Interval nodes**: Single interval with counter
- **Schedule nodes**: Multiple timeouts with different triggers
- **Animation nodes**: High-frequency intervals with frame tracking

The key insight is that **timer mechanics stay in timer functions, business logic stays in processLogic**, regardless of complexity.

Following these patterns ensures reliable, performant time-based nodes that integrate cleanly with the factory system. 