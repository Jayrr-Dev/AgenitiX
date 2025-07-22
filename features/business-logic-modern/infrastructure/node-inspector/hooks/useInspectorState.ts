/**
 * INSPECTOR STATE HOOK - Clean state management for node inspector
 *
 * • Core inspector state management without deprecated dependencies
 * • Input synchronization with node data
 * • Editing state tracking and validation
 * • Performance optimized state management
 * • Clean, maintainable architecture
 *
 * Keywords: inspector-state, clean, maintainable, performance
 */

import { useEffect, useState } from "react";
import type { AgenNode } from "../../flow-engine/types/nodeData";
import { DEFAULT_VALUES } from "../constants";

// ============================================================================
// INSPECTOR STATE HOOK
// ============================================================================

/**
 * Clean Inspector State Hook
 * Provides core functionality without deprecated dependencies
 */
export function useInspectorState(node: AgenNode | null) {
	// Core Inspector State
	const [inspectorState, setInspectorState] = useState({
		durationInput: "",
		countInput: "",
		multiplierInput: "",
		delayInput: "",
	});

	// Editing References
	const [editingRefs, setEditingRefs] = useState({
		isEditingCount: false,
		isEditingMultiplier: false,
		isEditingDuration: false,
		isEditingDelay: false,
	});

	// ============================================================================
	// INPUT SYNCHRONIZATION
	// ============================================================================

	/**
	 * Sync inputs with node data
	 */
	useEffect(() => {
		if (!node) return;

		const nodeData = node.data as any;

		setInspectorState((prev) => ({
			...prev,
			durationInput: String(nodeData.duration || DEFAULT_VALUES.DURATION),
			countInput: String(nodeData.count || DEFAULT_VALUES.COUNT),
			multiplierInput: String(nodeData.multiplier || DEFAULT_VALUES.MULTIPLIER),
			delayInput: String(nodeData.delay || DEFAULT_VALUES.DELAY),
		}));
	}, [
		node?.id,
		node?.data?.duration,
		node?.data?.count,
		node?.data?.multiplier,
		node?.data?.delay,
	]);

	// ============================================================================
	// HELPER FUNCTIONS
	// ============================================================================

	/**
	 * Update inspector state
	 */
	const updateInspectorState = (updates: Partial<typeof inspectorState>) => {
		setInspectorState((prev) => ({ ...prev, ...updates }));
	};

	/**
	 * Update editing references
	 */
	const updateEditingRefs = (updates: Partial<typeof editingRefs>) => {
		setEditingRefs((prev) => ({ ...prev, ...updates }));
	};

	/**
	 * Check if any inputs are being edited
	 */
	const isEditing =
		editingRefs.isEditingCount ||
		editingRefs.isEditingMultiplier ||
		editingRefs.isEditingDuration ||
		editingRefs.isEditingDelay;

	/**
	 * Get input validation status
	 */
	const getInputValidation = () => {
		return {
			duration: {
				isValid:
					!isNaN(Number(inspectorState.durationInput)) && Number(inspectorState.durationInput) >= 0,
				value: Number(inspectorState.durationInput),
			},
			count: {
				isValid:
					!isNaN(Number(inspectorState.countInput)) && Number(inspectorState.countInput) >= 0,
				value: Number(inspectorState.countInput),
			},
			multiplier: {
				isValid:
					!isNaN(Number(inspectorState.multiplierInput)) &&
					Number(inspectorState.multiplierInput) > 0,
				value: Number(inspectorState.multiplierInput),
			},
			delay: {
				isValid:
					!isNaN(Number(inspectorState.delayInput)) && Number(inspectorState.delayInput) >= 0,
				value: Number(inspectorState.delayInput),
			},
		};
	};

	// ============================================================================
	// RETURN CLEAN INTERFACE
	// ============================================================================

	return {
		// Core interface
		inspectorState,
		editingRefs,
		setInspectorState: updateInspectorState,
		setEditingRefs: updateEditingRefs,
		isEditing,
		getInputValidation,

		// Basic node info
		nodeInfo: {
			nodeId: node?.id,
			nodeType: node?.type,
			hasData: Boolean(node?.data),
		},
	};
}
