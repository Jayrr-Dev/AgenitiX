import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

// Pre-defined sensor configuration for better performance, basically prevent object recreation
const SENSOR_CONFIG = {
	activationConstraint: { distance: 5 },
} as const;

export function useDragSensors() {
	// Use sensors at top level - DnD Kit handles memoization internally, basically stable sensor references
	return useSensors(
		useSensor(PointerSensor, SENSOR_CONFIG)
	);
}
