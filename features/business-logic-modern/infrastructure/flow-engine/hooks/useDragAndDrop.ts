/**
 * USE DRAG AND DROP HOOK - Node creation through drag and drop
 *
 * • Handles drag and drop functionality for creating nodes from sidebar
 * • Manages drop target validation and position calculation
 * • Integrates with ReactFlow's coordinate system for precise placement
 * • Uses modern node registry for validation and node creation
 * • Provides event handlers for drag over and drop interactions
 *
 * Keywords: drag-drop, node-creation, sidebar, ReactFlow, positioning, registry
 */

import type { AgenNode } from "@infrastructure/flow-engine/types/nodeData";
import type { ReactFlowInstance } from "@xyflow/react";
import { useCallback } from "react";
import { getNodeMetadata } from "../../node-registry/nodespec-registry";

interface DragAndDropProps {
	flowInstance: React.RefObject<ReactFlowInstance<AgenNode, any> | null>;
	wrapperRef: React.RefObject<HTMLDivElement | null>;
	onNodeAdd: (node: AgenNode) => void;
}

export function useDragAndDrop({ flowInstance, wrapperRef, onNodeAdd }: DragAndDropProps) {
	const onDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	}, []);

	const onDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();

			if (!wrapperRef.current || !flowInstance.current) {
				return;
			}

			const nodeType = e.dataTransfer.getData("application/reactflow");
			if (!nodeType) {
				return;
			}

			const metadata = getNodeMetadata(nodeType);
			if (!metadata) {
				console.error(`[DragDrop] Invalid node type dropped: ${nodeType}`);
				return;
			}

			const bounds = wrapperRef.current.getBoundingClientRect();
			const position = flowInstance.current.screenToFlowPosition({
				x: e.clientX - bounds.left,
				y: e.clientY - bounds.top,
			});

			try {
				const defaultData = metadata.data
					? Object.fromEntries(
							Object.entries(metadata.data).map(([key, { default: defaultValue }]) => [
								key,
								defaultValue,
							])
						)
					: {};

				const id = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
				const newNode = {
					id,
					type: nodeType,
					position,
					deletable: true,
					data: {
						...defaultData,
						isActive: false, // Default state
					},
				} as AgenNode;
				onNodeAdd(newNode);
			} catch (error) {
				console.error("❌ [DragDrop] Failed to create node:", error);
			}
		},
		[flowInstance, wrapperRef, onNodeAdd]
	);

	return {
		onDragOver,
		onDrop,
	};
}
