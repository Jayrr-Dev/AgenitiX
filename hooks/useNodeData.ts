import { Node, useReactFlow } from "@xyflow/react";
import { useCallback, useMemo } from "react";
import { useFlowStore } from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";

/**
 * A hook to manage the data of a specific node.
 * @param nodeId The ID of the node to manage.
 * @param initialData The initial data of the node.
 * @returns An object with the current node data and a function to update it.
 */
export const useNodeData = <T extends Record<string, any>>(nodeId: string, initialData: T) => {
	const { getNode } = useReactFlow();
	const { updateNodeData: storeUpdateNodeData } = useFlowStore();

	const updateNodeData = useCallback(
		(newData: Partial<T>) => {
			// Use the flow store's updateNodeData to prevent infinite loops
			storeUpdateNodeData(nodeId, newData);
		},
		[nodeId, storeUpdateNodeData]
	);

	const node = getNode(nodeId);

	// Memoize the node data to prevent unnecessary re-renders
	const nodeData = useMemo(() => {
		return node?.data || initialData;
	}, [node?.data, initialData]);

	// Memoize the return object to prevent creating new objects on every render
	return useMemo(
		() => ({
			nodeData,
			updateNodeData,
		}),
		[nodeData, updateNodeData]
	);
};
