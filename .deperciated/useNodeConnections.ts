/**
 * USE NODE CONNECTIONS HOOK - Reliable data access between connected nodes
 *
 * • Provides access to input and output data from connected nodes
 * • Handles data type validation and conversion
 * • Manages data flow direction and propagation
 * • Supports multiple input/output connections per node
 * • Provides real-time data updates when connected nodes change
 * • Includes error handling for invalid connections
 *
 * Keywords: node-connections, data-flow, input-output, validation, real-time
 */

import { useCallback, useMemo } from "react";
import { useFlowStore } from "../features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import type { AgenEdge, AgenNode } from "../features/business-logic-modern/infrastructure/flow-engine/types/nodeData";

// ============================================================================
// TYPES
// ============================================================================

export interface NodeConnection {
	/** Source node that provides data */
	sourceNode: AgenNode;
	/** Target node that receives data */
	targetNode: AgenNode;
	/** The edge connecting the nodes */
	edge: AgenEdge;
	/** Data type of the connection */
	dataType: string;
	/** Whether the connection is valid */
	isValid: boolean;
	/** Error message if connection is invalid */
	error?: string;
}

export interface NodeInputData {
	/** Handle ID that received the data */
	handleId: string;
	/** Data type of the input */
	dataType: string;
	/** Actual data value */
	value: any;
	/** Source node ID */
	sourceNodeId: string;
	/** Source handle ID */
	sourceHandleId: string;
	/** Whether this input is connected */
	isConnected: boolean;
	/** Error message if data is invalid */
	error?: string;
}

export interface NodeOutputData {
	/** Handle ID that provides the data */
	handleId: string;
	/** Data type of the output */
	dataType: string;
	/** Actual data value */
	value: any;
	/** Target node IDs that receive this output */
	targetNodeIds: string[];
	/** Whether this output is connected */
	isConnected: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract data type from handle ID
 * Handle IDs are in format: "handle-id__dataType"
 */
function extractDataTypeFromHandle(handleId: string): string {
	const parts = handleId.split("__");
	return parts.length > 1 ? parts[1] : "any";
}

/**
 * Validate data type compatibility
 */
function isDataTypeCompatible(sourceType: string, targetType: string): boolean {
	// "any" type is compatible with everything
	if (sourceType === "any" || targetType === "any") return true;

	// Direct type match
	if (sourceType === targetType) return true;

	// Handle union types (e.g., "string|number")
	const sourceTypes = sourceType.split("|");
	const targetTypes = targetType.split("|");

	return sourceTypes.some((s) => targetTypes.includes(s));
}

/**
 * Convert data to target type if possible
 */
function convertDataType(value: any, targetType: string): any {
	if (targetType === "any") return value;

	switch (targetType) {
		case "string":
			return String(value);
		case "number":
			return Number(value);
		case "boolean":
			return Boolean(value);
		case "json":
			return typeof value === "object" ? value : JSON.parse(String(value));
		case "array":
			return Array.isArray(value) ? value : [value];
		default:
			return value;
	}
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useNodeConnections(nodeId: string) {
	const { nodes, edges } = useFlowStore();

	// ============================================================================
	// GET CONNECTED NODES
	// ============================================================================

	const getConnectedNodes = useCallback(() => {
		const node = nodes.find((n) => n.id === nodeId);
		if (!node) return { inputs: [], outputs: [] };

		const nodeEdges = edges.filter((e) => e.source === nodeId || e.target === nodeId);

		const inputs: NodeConnection[] = [];
		const outputs: NodeConnection[] = [];

		nodeEdges.forEach((edge) => {
			if (edge.target === nodeId) {
				// This is an input connection
				const sourceNode = nodes.find((n) => n.id === edge.source);
				if (sourceNode) {
					const dataType = extractDataTypeFromHandle(edge.sourceHandle || "");
					inputs.push({
						sourceNode,
						targetNode: node,
						edge,
						dataType,
						isValid: true,
					});
				}
			} else if (edge.source === nodeId) {
				// This is an output connection
				const targetNode = nodes.find((n) => n.id === edge.target);
				if (targetNode) {
					const dataType = extractDataTypeFromHandle(edge.sourceHandle || "");
					outputs.push({
						sourceNode: node,
						targetNode,
						edge,
						dataType,
						isValid: true,
					});
				}
			}
		});

		return { inputs, outputs };
	}, [nodeId, nodes, edges]);

	// ============================================================================
	// GET INPUT DATA
	// ============================================================================

	const getInputData = useCallback(
		(handleId?: string): NodeInputData[] => {
			const { inputs } = getConnectedNodes();
			const node = nodes.find((n) => n.id === nodeId);
			if (!node) return [];

			const inputData: NodeInputData[] = [];

			// Get all input handles for this node
			const nodeSpec = (node as any).type ? getNodeSpecMetadata((node as any).type) : null;
			const inputHandles = nodeSpec?.handles?.filter((h: any) => h.type === "target") || [];

			inputHandles.forEach((handle: any) => {
				const handleId = handle.id;
				const dataType = handle.dataType || "any";

				// Find connection for this handle
				const connection = inputs.find((input) => input.edge.targetHandle === handleId);

				if (connection) {
					// Get data from source node
					const sourceData = connection.sourceNode.data;
					const sourceValue = sourceData?.output || sourceData?.value || null;

					// Validate and convert data type
					const isValid = isDataTypeCompatible(
						extractDataTypeFromHandle(connection.edge.sourceHandle || ""),
						dataType
					);

					const convertedValue = isValid ? convertDataType(sourceValue, dataType) : null;

					inputData.push({
						handleId,
						dataType,
						value: convertedValue,
						sourceNodeId: connection.sourceNode.id,
						sourceHandleId: connection.edge.sourceHandle || "",
						isConnected: true,
						error: isValid ? undefined : `Type mismatch: cannot convert to ${dataType}`,
					});
				} else {
					// No connection for this handle
					inputData.push({
						handleId,
						dataType,
						value: null,
						sourceNodeId: "",
						sourceHandleId: "",
						isConnected: false,
					});
				}
			});

			// Filter by specific handle if requested
			return handleId ? inputData.filter((input) => input.handleId === handleId) : inputData;
		},
		[nodeId, nodes, edges, getConnectedNodes]
	);

	// ============================================================================
	// GET OUTPUT DATA
	// ============================================================================

	const getOutputData = useCallback(
		(handleId?: string): NodeOutputData[] => {
			const { outputs } = getConnectedNodes();
			const node = nodes.find((n) => n.id === nodeId);
			if (!node) return [];

			const outputData: NodeOutputData[] = [];

			// Get all output handles for this node
			const nodeSpec = (node as any).type ? getNodeSpecMetadata((node as any).type) : null;
			const outputHandles = nodeSpec?.handles?.filter((h: any) => h.type === "source") || [];

			outputHandles.forEach((handle: any) => {
				const handleId = handle.id;
				const dataType = handle.dataType || "any";

				// Find connections for this handle
				const connections = outputs.filter((output) => output.edge.sourceHandle === handleId);

				const targetNodeIds = connections.map((c) => c.targetNode.id);

				// Get current output value from node data
				const currentValue = node.data?.output || node.data?.value || null;

				outputData.push({
					handleId,
					dataType,
					value: currentValue,
					targetNodeIds,
					isConnected: connections.length > 0,
				});
			});

			// Filter by specific handle if requested
			return handleId ? outputData.filter((output) => output.handleId === handleId) : outputData;
		},
		[nodeId, nodes, edges, getConnectedNodes]
	);

	// ============================================================================
	// GET SPECIFIC INPUT DATA
	// ============================================================================

	const getInputDataByHandle = useCallback(
		(handleId: string): NodeInputData | null => {
			const inputs = getInputData(handleId);
			return inputs.length > 0 ? inputs[0] : null;
		},
		[getInputData]
	);

	// ============================================================================
	// GET SPECIFIC OUTPUT DATA
	// ============================================================================

	const getOutputDataByHandle = useCallback(
		(handleId: string): NodeOutputData | null => {
			const outputs = getOutputData(handleId);
			return outputs.length > 0 ? outputs[0] : null;
		},
		[getOutputData]
	);

	// ============================================================================
	// VALIDATE CONNECTIONS
	// ============================================================================

	const validateConnections = useCallback(() => {
		const { inputs, outputs } = getConnectedNodes();
		const errors: string[] = [];

		inputs.forEach((input) => {
			const sourceDataType = extractDataTypeFromHandle(input.edge.sourceHandle || "");
			const targetDataType = extractDataTypeFromHandle(input.edge.targetHandle || "");

			if (!isDataTypeCompatible(sourceDataType, targetDataType)) {
				errors.push(`Invalid connection: ${sourceDataType} -> ${targetDataType}`);
			}
		});

		return {
			isValid: errors.length === 0,
			errors,
		};
	}, [getConnectedNodes]);

	// ============================================================================
	// COMPUTED VALUES
	// ============================================================================

	const hasInputs = useMemo(() => {
		const { inputs } = getConnectedNodes();
		return inputs.length > 0;
	}, [getConnectedNodes]);

	const hasOutputs = useMemo(() => {
		const { outputs } = getConnectedNodes();
		return outputs.length > 0;
	}, [getConnectedNodes]);

	const isConnected = useMemo(() => {
		return hasInputs || hasOutputs;
	}, [hasInputs, hasOutputs]);

	// ============================================================================
	// RETURN INTERFACE
	// ============================================================================

	return {
		// Connection data
		getConnectedNodes,
		getInputData,
		getOutputData,
		getInputDataByHandle,
		getOutputDataByHandle,

		// Validation
		validateConnections,

		// Computed values
		hasInputs,
		hasOutputs,
		isConnected,

		// Utility functions
		isDataTypeCompatible,
		convertDataType,
		extractDataTypeFromHandle,
	};
}

// Import the NodeSpec registry function
import { getNodeSpecMetadata } from "../features/business-logic-modern/infrastructure/node-registry/nodespec-registry";
