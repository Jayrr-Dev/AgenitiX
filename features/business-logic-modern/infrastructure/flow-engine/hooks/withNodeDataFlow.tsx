/**
 * WITH NODE DATA FLOW HOC - Higher-order component for automatic data flow
 *
 * • Automatically provides data flow capabilities to node components
 * • Handles input/output data processing and validation
 * • Manages connection state and error handling
 * • Provides reactive data updates when connections change
 * • Integrates with node processing logic seamlessly
 * • Supports custom data processing and validation functions
 *
 * Keywords: HOC, data-flow, automatic-processing, reactive, validation
 */

import React from "react";
import type { AgenNode } from "../types/nodeData";
import { type DataFlowConfig, useNodeDataFlow } from "./useNodeDataFlow";

// ============================================================================
// TYPES
// ============================================================================

export interface WithNodeDataFlowProps {
	/** Node ID for data flow management */
	nodeId: string;
	/** Data flow configuration */
	dataFlowConfig?: DataFlowConfig;
	/** Node data from React Flow */
	data: any;
	/** Node ID from React Flow */
	id: string;
	/** Whether node is selected */
	selected?: boolean;
	/** Additional props passed to wrapped component */
	[key: string]: any;
}

export interface NodeDataFlowContext {
	/** Current input data from connected nodes */
	inputs: Record<string, any>;
	/** Current output data to downstream nodes */
	outputs: Record<string, any>;
	/** Whether node has valid inputs */
	hasValidInputs: boolean;
	/** Whether node has outputs */
	hasOutputs: boolean;
	/** Whether node is ready to process */
	isReady: boolean;
	/** Whether node is currently processing */
	isProcessing: boolean;
	/** Current error state */
	error: string | null;
	/** Trigger input processing manually */
	triggerInputProcessing: () => any;
	/** Trigger output propagation manually */
	triggerOutputPropagation: (outputs: Record<string, any>) => any;
	/** Get connected nodes information */
	getConnectedNodes: () => { inputs: any[]; outputs: any[] };
	/** Get input data for specific handle */
	getInputData: (handleId?: string) => any[];
	/** Get output data for specific handle */
	getOutputData: (handleId?: string) => any[];
	/** Validate all connections */
	validateConnections: () => { isValid: boolean; errors: string[] };
}

// ============================================================================
// HOC FACTORY
// ============================================================================

export function withNodeDataFlow<P extends WithNodeDataFlowProps>(
	WrappedComponent: React.ComponentType<P & NodeDataFlowContext>,
	defaultConfig?: DataFlowConfig
) {
	return function WithNodeDataFlowComponent(props: P) {
		const { nodeId, dataFlowConfig, ...restProps } = props;

		// Merge default config with provided config
		const config = {
			autoProcess: true,
			autoPropagate: true,
			...defaultConfig,
			...dataFlowConfig,
		};

		// Use the data flow hook
		const dataFlow = useNodeDataFlow(nodeId, config);

		// Create context object for the wrapped component
		const context: NodeDataFlowContext = {
			inputs: dataFlow.inputs,
			outputs: dataFlow.outputs,
			hasValidInputs: dataFlow.hasValidInputs,
			hasOutputs: dataFlow.hasOutputs,
			isReady: dataFlow.isReady,
			isProcessing: dataFlow.isProcessing,
			error: dataFlow.error,
			triggerInputProcessing: dataFlow.triggerInputProcessing,
			triggerOutputPropagation: dataFlow.triggerOutputPropagation,
			getConnectedNodes: dataFlow.getConnectedNodes,
			getInputData: dataFlow.getInputData,
			getOutputData: dataFlow.getOutputData,
			validateConnections: dataFlow.validateConnections,
		};

		// Render wrapped component with data flow context
		return React.createElement(WrappedComponent, {
			...restProps,
			...context,
		} as P & NodeDataFlowContext);
	};
}

// ============================================================================
// HOOK FOR DIRECT USAGE
// ============================================================================

/**
 * Hook for using data flow capabilities directly in components
 * Use this when you need more control over the data flow integration
 */
export function useWithNodeDataFlow(nodeId: string, config?: DataFlowConfig): NodeDataFlowContext {
	const dataFlow = useNodeDataFlow(nodeId, config);

	return {
		inputs: dataFlow.inputs,
		outputs: dataFlow.outputs,
		hasValidInputs: dataFlow.hasValidInputs,
		hasOutputs: dataFlow.hasOutputs,
		isReady: dataFlow.isReady,
		isProcessing: dataFlow.isProcessing,
		error: dataFlow.error,
		triggerInputProcessing: dataFlow.triggerInputProcessing,
		triggerOutputPropagation: dataFlow.triggerOutputPropagation,
		getConnectedNodes: dataFlow.getConnectedNodes,
		getInputData: dataFlow.getInputData,
		getOutputData: dataFlow.getOutputData,
		validateConnections: dataFlow.validateConnections,
	};
}
