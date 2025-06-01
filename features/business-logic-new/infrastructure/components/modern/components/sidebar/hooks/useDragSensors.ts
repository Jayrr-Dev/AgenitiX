import { useSensors, useSensor, PointerSensor } from '@dnd-kit/core';

export function useDragSensors() {
  return useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { distance: 5 } 
    }),
  );
} 