import { Node, useReactFlow } from "@xyflow/react";
import { useCallback, useMemo } from "react";

/**
 * A hook to manage the data of a specific node.
 * @param nodeId The ID of the node to manage.
 * @param initialData The initial data of the node.
 * @returns An object with the current node data and a function to update it.
 */
export const useNodeData = <T extends Record<string, any>>(nodeId: string, initialData: T) => {
	const { setNodes, getNode } = useReactFlow();

	const updateNodeData = useCallback(
		(newData: Partial<T>) => {
			setNodes((nodes) =>
				nodes.map((node) => {
					if (node.id === nodeId) {
						return {
							...node,
							data: {
								...node.data,
								...newData,
							},
						};
					}
					return node;
				})
			);
		},
		[nodeId, setNodes]
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
