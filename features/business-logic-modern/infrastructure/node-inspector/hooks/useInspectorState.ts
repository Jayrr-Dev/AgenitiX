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
import type { AgenNode } from "../../../flow-editor/types";
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

    // Sync trigger pulse duration
    if (node.type === "triggerOnPulse") {
      const newDurationValue =
        typeof node.data.duration === "number"
          ? node.data.duration.toString()
          : DEFAULT_VALUES.DURATION;
      setDurationInput(newDurationValue);
    }

    // Sync counter inputs (only when not actively editing)
    if (node.type === "countInput") {
      if (!isEditingCount.current) {
        const newCountValue =
          typeof node.data.count === "number"
            ? node.data.count.toString()
            : DEFAULT_VALUES.COUNT;
        setCountInput(newCountValue);
      }
      if (!isEditingMultiplier.current) {
        const newMultiplierValue =
          typeof node.data.multiplier === "number"
            ? node.data.multiplier.toString()
            : DEFAULT_VALUES.MULTIPLIER;
        setMultiplierInput(newMultiplierValue);
      }
    }

    // Sync delay input
    if (node.type === "delayInput") {
      const newDelayValue =
        typeof node.data.delay === "number"
          ? node.data.delay.toString()
          : DEFAULT_VALUES.DELAY;
      setDelayInput(newDelayValue);
    }

    // Reset editing flags when switching nodes
    if (node.type !== "countInput") {
      isEditingCount.current = false;
      isEditingMultiplier.current = false;
    }
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
