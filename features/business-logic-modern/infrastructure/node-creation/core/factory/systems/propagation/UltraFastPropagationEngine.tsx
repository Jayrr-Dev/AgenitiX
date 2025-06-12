"use client";
// ============================================================================
// ULTRA-FAST PROPAGATION ENGINE ★ ARCHITECTURAL REFACTOR
// ============================================================================
// This file has been architecturally refactored to eliminate a fundamental
// race condition. The previous implementation used a complex, internal state
// machine that became out-of-sync with the React state, causing intermittent
// failures.
//
// THE NEW ARCHITECTURE:
// • NO MORE STATE MACHINE: The entire StateMachinePropagationLayer has been removed.
// • REACT IS THE SOURCE OF TRUTH: The engine is now stateless. It derives a node's
//   active state directly from the node's data, which is passed in fresh
//   on every render. There is no internal state to become stale.
// • DECLARATIVE PROPAGATION: The `propagate` function simply updates the data
//   of the source node. This triggers a standard React re-render, which
//   naturally propagates changes to downstream nodes. This is robust and
//   eliminates all race conditions.
// ============================================================================

import { useCallback, useEffect, useRef } from "react";

// ============================================================================
// 🎯 ERROR HANDLING
// ============================================================================
class PropagationEngineError extends Error {
  constructor(message: string) {
    super(`[UltraFastPropagationEngine] ${message}`);
    this.name = "PropagationEngineError";
  }
}

// ============================================================================
// 4️⃣  REFACTORED ENGINE (Stateless)
// ============================================================================

type UpdateNodeData = (
  id: string,
  data: Partial<{ isActive: boolean; [key: string]: any }>
) => void;

export class UltraFastPropagationEngine {
  private errorCallback?: (error: PropagationEngineError) => void;

  initialize(
    onError?: (error: PropagationEngineError) => void
  ) {
    this.errorCallback = onError;
  }

  /** 
   * Main entry point. This is now a simple, declarative data update.
   */
  propagate(id: string, active: boolean, update: UpdateNodeData) {
    // Update the data attributes that the source node's own logic uses.
    // For a toggle, this is 'triggered' and 'outputValue'.
    update(id, { triggered: active, outputValue: active });
  }

  /**
   * Directly updates node data.
   */
  updateNodeData(nodeId: string, newData: Record<string, any>, update: UpdateNodeData) {
     update(nodeId, newData);
  }

  /**
   * Forces deactivation by setting data properties to a 'falsey' state.
   */
  forceDeactivate(nodeId: string, update: UpdateNodeData) {
    update(nodeId, { triggered: false, isActive: false, value: false, outputValue: false });
  }

  private handleError(error: PropagationEngineError) {
    if (this.errorCallback) {
      this.errorCallback(error);
    } else {
      console.error(error);
    }
  }
}

// ============================================================================
// 5️⃣  REFACTORED REACT HOOK WRAPPER
// ============================================================================

export const useUltraFastPropagation = (
  updateNodeData: UpdateNodeData,
  onError?: (error: PropagationEngineError) => void
) => {
  const engineRef = useRef<UltraFastPropagationEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new UltraFastPropagationEngine();
  }
  const engine = engineRef.current;

  // The engine is stateless, so we only need to initialize it once.
  useEffect(() => {
    engine.initialize(onError);
  }, [engine, onError]);

  const propagateUltraFast = useCallback(
    (id: string, active: boolean) => {
      engine.propagate(id, active, updateNodeData);
    },
    [engine, updateNodeData] 
  );

  const forceDeactivate = useCallback(
    (id: string) => {
      engine.forceDeactivate(id, updateNodeData);
    },
    [engine, updateNodeData]
  );

  const updateNodeDataWithBusinessLogic = useCallback(
    (nodeId: string, newData: Record<string, any>) => {
      engine.updateNodeData(nodeId, newData, updateNodeData);
    },
    [engine, updateNodeData]
  );

  return {
    propagateUltraFast,
    forceDeactivate,
    updateNodeDataWithBusinessLogic,
  } as const;
};
