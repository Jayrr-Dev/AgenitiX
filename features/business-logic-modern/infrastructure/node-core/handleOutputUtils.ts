/**
 * SCALABLE HANDLE OUTPUT UTILITIES
 * 
 * Utilities for automatically generating handle-specific outputs for nodes
 * with multiple output handles. This enables ViewBoolean and other input nodes
 * to read from specific handles without manual mapping.
 * 
 * Keywords: handle-outputs, scalable, multi-handle, dynamic-mapping
 */

import type { NodeSpec } from "./NodeSpec";

/**
 * Auto-generate handleOutputs Map from node spec and data
 * 
 * This function dynamically creates a Map of handle IDs to their values
 * by inspecting the node's spec and reading corresponding data fields.
 * Uses Map for O(1) lookups and better performance with many handles.
 * 
 * @param spec - Node specification containing handle definitions
 * @param nodeData - Current node data containing output values
 * @returns Map of handle IDs to their current values
 * 
 * @example
 * // For a node with handles: topOutput, bottomOutput, leftOutput
 * const handleOutputs = generateHandleOutputs(spec, nodeData);
 * // Result: Map { "topOutput" => true, "bottomOutput" => false, "leftOutput" => null }
 */
export function generateHandleOutputs(
	spec: NodeSpec, 
	nodeData: Record<string, any>
): Map<string, any> {
	const handleOutputs = new Map<string, any>();
	
	// Get all source (output) handles from the spec
	const sourceHandles = spec.handles?.filter(handle => handle.type === 'source') || [];
	
	// Auto-map each source handle to its corresponding data field
	sourceHandles.forEach(handle => {
		const handleId = handle.id;
		const dataValue = nodeData[handleId];
		if (dataValue !== undefined) {
			handleOutputs.set(handleId, dataValue);
		}
	});
	
	return handleOutputs;
}



/**
 * Generate outputs field as Map for ALL nodes
 * 
 * Always returns Map<handleId, value> for consistency
 * Single-handle nodes get a Map with one entry
 * Multi-handle nodes get a Map with multiple entries
 * 
 * @param spec - Node specification containing handle definitions  
 * @param nodeData - Current node data containing output values
 * @returns Map<handleId, value> for all nodes
 */
export function generateOutputsField(
	spec: NodeSpec, 
	nodeData: Record<string, any>
): Map<string, any> {
	// Always return Map - consistent system for all nodes
	return generateHandleOutputs(spec, nodeData);
}

/**
 * Custom hook for auto-managing handle outputs in any node
 * 
 * This hook automatically generates and updates handleOutputs based on the
 * node's spec and current data. Use this in any node with multiple outputs.
 * 
 * @param spec - Node specification
 * @param nodeData - Current node data
 * @param updateNodeData - Function to update node data
 * @param lastOutputRef - Ref to track last output to prevent redundant updates
 */
export function useAutoHandleOutputs(
	spec: NodeSpec,
	nodeData: Record<string, any>,
	updateNodeData: (updates: Record<string, any>) => void,
	lastOutputRef: React.MutableRefObject<any>
) {
	const handleOutputs = generateHandleOutputs(spec, nodeData);
	const primaryOutput = getPrimaryOutput(spec, nodeData);
	
	// Only update if primary output changed to avoid infinite loops
	if (primaryOutput !== lastOutputRef.current) {
		lastOutputRef.current = primaryOutput;
		updateNodeData({
			outputs: primaryOutput,
			handleOutputs: handleOutputs
		});
	}
}