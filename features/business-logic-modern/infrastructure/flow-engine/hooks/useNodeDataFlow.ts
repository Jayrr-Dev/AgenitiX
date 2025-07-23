/**
 * USE NODE DATA FLOW HOOK - Automatic data flow management for nodes
 *
 * • Automatically processes input data from connected nodes
 * • Manages output data propagation to downstream nodes
 * • Handles data type validation and conversion
 * • Provides real-time data updates and error handling
 * • Integrates with node processing logic and state management
 * • Supports reactive data flow with automatic re-computation
 *
 * Keywords: data-flow, input-processing, output-propagation, reactive, validation
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFlowStore } from "../stores/flowStore";
import { useNodeConnections } from "./useNodeConnections";
import type { AgenNode } from "../types/nodeData";

// ============================================================================
// TYPES
// ============================================================================

export interface DataFlowState {
	/** Current input data from connected nodes */
	inputs: Record<string, any>;
	/** Current output data to be sent to downstream nodes */
	outputs: Record<string, any>;
	/** Whether the node is actively processing data */
	isProcessing: boolean;
	/** Error state if data processing failed */
	error: string | null;
	/** Timestamp of last data update */
	lastUpdate: number;
}

export interface DataFlowConfig {
	/** Whether to automatically process inputs when they change */
	autoProcess: boolean;
	/** Whether to automatically propagate outputs when they change */
	autoPropagate: boolean;
	/** Custom input processing function */
	processInputs?: (inputs: Record<string, any>) => Record<string, any>;
	/** Custom output processing function */
	processOutputs?: (outputs: Record<string, any>) => Record<string, any>;
	/** Validation function for input data */
	validateInputs?: (inputs: Record<string, any>) => string | null;
	/** Validation function for output data */
	validateOutputs?: (outputs: Record<string, any>) => string | null;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useNodeDataFlow(
	nodeId: string,
	config: DataFlowConfig = { autoProcess: true, autoPropagate: true }
) {
	const { updateNodeData } = useFlowStore();
	const connections = useNodeConnections(nodeId);
	
	// ============================================================================
	// STATE
	// ============================================================================
	
	const [flowState, setFlowState] = useState<DataFlowState>({
		inputs: {},
		outputs: {},
		isProcessing: false,
		error: null,
		lastUpdate: Date.now()
	});
	
	// ============================================================================
	// INPUT DATA PROCESSING
	// ============================================================================
	
	const processInputData = useCallback(() => {
		const inputData = connections.getInputData();
		const inputs: Record<string, any> = {};
		let hasErrors = false;
		const errors: string[] = [];
		
		// Process each input
		inputData.forEach(input => {
			inputs[input.handleId] = input.value;
			
			if (input.error) {
				hasErrors = true;
				errors.push(`${input.handleId}: ${input.error}`);
			}
		});
		
		// Custom input processing if provided
		let processedInputs = inputs;
		if (config.processInputs) {
			try {
				processedInputs = config.processInputs(inputs);
			} catch (error) {
				hasErrors = true;
				errors.push(`Input processing error: ${error}`);
			}
		}
		
		// Custom validation if provided
		if (config.validateInputs) {
			const validationError = config.validateInputs(processedInputs);
			if (validationError) {
				hasErrors = true;
				errors.push(`Input validation error: ${validationError}`);
			}
		}
		
		// Update flow state
		setFlowState(prev => ({
			...prev,
			inputs: processedInputs,
			error: hasErrors ? errors.join("; ") : null,
			lastUpdate: Date.now()
		}));
		
		return { inputs: processedInputs, hasErrors, errors };
	}, [connections.getInputData, config.processInputs, config.validateInputs]);
	
	// ============================================================================
	// OUTPUT DATA PROCESSING
	// ============================================================================
	
	const processOutputData = useCallback((newOutputs: Record<string, any>) => {
		let processedOutputs = newOutputs;
		
		// Custom output processing if provided
		if (config.processOutputs) {
			try {
				processedOutputs = config.processOutputs(newOutputs);
			} catch (error) {
				setFlowState(prev => ({
					...prev,
					error: `Output processing error: ${error}`
				}));
				return;
			}
		}
		
		// Custom validation if provided
		if (config.validateOutputs) {
			const validationError = config.validateOutputs(processedOutputs);
			if (validationError) {
				setFlowState(prev => ({
					...prev,
					error: `Output validation error: ${validationError}`
				}));
				return;
			}
		}
		
		// Update flow state
		setFlowState(prev => ({
			...prev,
			outputs: processedOutputs,
			error: null,
			lastUpdate: Date.now()
		}));
		
		// Update node data with outputs
		updateNodeData(nodeId, { output: processedOutputs });
		
		return processedOutputs;
	}, [nodeId, updateNodeData, config.processOutputs, config.validateOutputs]);
	
	// ============================================================================
	// AUTOMATIC DATA FLOW
	// ============================================================================
	
	// Auto-process inputs when connections change
	useEffect(() => {
		if (config.autoProcess) {
			processInputData();
		}
	}, [config.autoProcess, processInputData]);
	
	// ============================================================================
	// MANUAL DATA FLOW CONTROLS
	// ============================================================================
	
	const triggerInputProcessing = useCallback(() => {
		setFlowState(prev => ({ ...prev, isProcessing: true }));
		
		try {
			const result = processInputData();
			return result;
		} finally {
			setFlowState(prev => ({ ...prev, isProcessing: false }));
		}
	}, [processInputData]);
	
	const triggerOutputPropagation = useCallback((outputs: Record<string, any>) => {
		setFlowState(prev => ({ ...prev, isProcessing: true }));
		
		try {
			return processOutputData(outputs);
		} finally {
			setFlowState(prev => ({ ...prev, isProcessing: false }));
		}
	}, [processOutputData]);
	
	// ============================================================================
	// COMPUTED VALUES
	// ============================================================================
	
	const hasValidInputs = useMemo(() => {
		return Object.keys(flowState.inputs).length > 0 && !flowState.error;
	}, [flowState.inputs, flowState.error]);
	
	const hasOutputs = useMemo(() => {
		return Object.keys(flowState.outputs).length > 0;
	}, [flowState.outputs]);
	
	const isReady = useMemo(() => {
		return hasValidInputs && !flowState.isProcessing && !flowState.error;
	}, [hasValidInputs, flowState.isProcessing, flowState.error]);
	
	// ============================================================================
	// RETURN INTERFACE
	// ============================================================================
	
	return {
		// Current state
		flowState,
		
		// Input data
		inputs: flowState.inputs,
		hasValidInputs,
		
		// Output data
		outputs: flowState.outputs,
		hasOutputs,
		
		// Processing state
		isProcessing: flowState.isProcessing,
		isReady,
		error: flowState.error,
		
		// Manual controls
		triggerInputProcessing,
		triggerOutputPropagation,
		
		// Connection utilities (excluding hasOutputs to avoid conflict)
		getConnectedNodes: connections.getConnectedNodes,
		getInputData: connections.getInputData,
		getOutputData: connections.getOutputData,
		getInputDataByHandle: connections.getInputDataByHandle,
		getOutputDataByHandle: connections.getOutputDataByHandle,
		validateConnections: connections.validateConnections,
		hasInputs: connections.hasInputs,
		isConnected: connections.isConnected,
		isDataTypeCompatible: connections.isDataTypeCompatible,
		convertDataType: connections.convertDataType,
		extractDataTypeFromHandle: connections.extractDataTypeFromHandle
	};
} 