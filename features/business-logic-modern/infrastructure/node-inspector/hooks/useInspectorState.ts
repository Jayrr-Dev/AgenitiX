/**
 * USE INSPECTOR STATE HOOK - Node inspector state management and input handling
 *
 * • Manages local state for node property input fields and editing modes
 * • Provides debounced input handlers for real-time node data updates
 * • Tracks editing states for inline text editing and validation
 * • Synchronizes inspector UI state with selected node properties
 * • Handles input formatting and validation for different data types
 *
 * Keywords: inspector-state, input-handling, debouncing, validation, editing-modes, sync
 */

import { useEffect, useRef, useState } from "react";
import type { AgenNode } from "../../flow-engine/types/nodeData";
import { DEFAULT_VALUES } from "../constants";

export function useInspectorState(node: AgenNode | null) {
  const [durationInput, setDurationInput] = useState<string>(
    DEFAULT_VALUES.DURATION
  );
  const [countInput, setCountInput] = useState<string>(DEFAULT_VALUES.COUNT);
  const [multiplierInput, setMultiplierInput] = useState<string>(
    DEFAULT_VALUES.MULTIPLIER
  );
  const [delayInput, setDelayInput] = useState<string>(DEFAULT_VALUES.DELAY);

  const isEditingCount = useRef(false);
  const isEditingMultiplier = useRef(false);

  // Note: Removed automatic unlock when node changes to allow persistent locking
  // The inspector will now stay locked when switching between nodes until manually unlocked

  // Sync states when node changes
  useEffect(() => {
    if (!node) return;

    // Note: Only valid node types are: createText, viewOutput, triggerOnToggle, testError
    // Legacy node types (countInput, delayInput, triggerOnPulse) have been removed

    // Reset editing flags when switching between any nodes
    isEditingCount.current = false;
    isEditingMultiplier.current = false;
  }, [node?.data, node?.type, node?.id]);

  return {
    durationInput,
    setDurationInput,
    countInput,
    setCountInput,
    multiplierInput,
    setMultiplierInput,
    delayInput,
    setDelayInput,
    isEditingCount,
    isEditingMultiplier,
  };
}
