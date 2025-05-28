import { useState, useRef, useEffect } from 'react';
import type { AgenNode } from '../../../FlowEditor';
import { DEFAULT_VALUES } from '../constants';

export function useInspectorState(node: AgenNode | null) {
  const [locked, setLocked] = useState(false);
  const [durationInput, setDurationInput] = useState<string>(DEFAULT_VALUES.DURATION);
  const [countInput, setCountInput] = useState<string>(DEFAULT_VALUES.COUNT);
  const [multiplierInput, setMultiplierInput] = useState<string>(DEFAULT_VALUES.MULTIPLIER);
  const [delayInput, setDelayInput] = useState<string>(DEFAULT_VALUES.DELAY);

  const isEditingCount = useRef(false);
  const isEditingMultiplier = useRef(false);

  // Reset locked state when node changes
  useEffect(() => {
    if (node) {
      setLocked(false); // Ensure inspector is unlocked when a node is selected
    }
  }, [node?.id]);

  // Sync states when node changes
  useEffect(() => {
    if (!node) return;

    // Sync trigger pulse duration
    if (node.type === 'triggerOnPulse') {
      const newDurationValue = typeof node.data.duration === 'number' 
        ? node.data.duration.toString() 
        : DEFAULT_VALUES.DURATION;
      setDurationInput(newDurationValue);
    }

    // Sync counter inputs (only when not actively editing)
    if (node.type === 'counterNode') {
      if (!isEditingCount.current) {
        const newCountValue = typeof node.data.count === 'number' 
          ? node.data.count.toString() 
          : DEFAULT_VALUES.COUNT;
        setCountInput(newCountValue);
      }
      if (!isEditingMultiplier.current) {
        const newMultiplierValue = typeof node.data.multiplier === 'number' 
          ? node.data.multiplier.toString() 
          : DEFAULT_VALUES.MULTIPLIER;
        setMultiplierInput(newMultiplierValue);
      }
    }

    // Sync delay input
    if (node.type === 'delayNode') {
      const newDelayValue = typeof node.data.delay === 'number' 
        ? node.data.delay.toString() 
        : DEFAULT_VALUES.DELAY;
      setDelayInput(newDelayValue);
    }

    // Reset editing flags when switching nodes
    if (node.type !== 'counterNode') {
      isEditingCount.current = false;
      isEditingMultiplier.current = false;
    }
  }, [node?.data, node?.type, node?.id]);

  return {
    locked,
    setLocked,
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