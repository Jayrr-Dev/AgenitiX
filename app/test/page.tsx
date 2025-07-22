"use client";

import {
	type Connection,
	type Edge,
	Handle,
	type Node,
	Position,
	ReactFlow,
	ReactFlowProvider,
	addEdge,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useCallback, useState } from "react";
import "@xyflow/react/dist/style.css";

// Simple Button Node Component - This is a simple button node that toggles a boolean value

function ButtonNode({ id, data }: { id: string; data: any }) {
	const [value, setValue] = useState(false);

	const handleToggle = () => {
		const newValue = !value;
		setValue(newValue);

		// This is how we pass data to connected nodes
		// We'll update the node's data which gets propagated through edges
		if (data.onDataChange) {
			data.onDataChange(id, { value: newValue });
		}
	};

	return (
		<div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-blue-500">
			<div className="text-sm font-bold text-gray-700 mb-2">Button Node</div>
			<button
				onClick={handleToggle}
				className={`px-3 py-1 rounded text-white font-semibold ${
					value ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
				}`}
			>
				{value ? "TRUE" : "FALSE"}
			</button>
			<div className="text-xs text-gray-500 mt-1">Current: {value.toString()}</div>

			{/* Output handle */}
			<Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
		</div>
	);
}

// Simple Display Node Component
function DisplayNode({ id, data }: { id: string; data: any }) {
	const receivedValue = data.receivedValue;

	return (
		<div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-green-500">
			<div className="text-sm font-bold text-gray-700 mb-2">Display Node</div>
			<div className="text-center p-2 rounded border">
				<div className="text-lg text-amber-300 font-bold">
					{receivedValue !== undefined ? receivedValue.toString() : "No Data"}
				</div>
				<div
					className={`text-sm ${
						receivedValue === true
							? "text-green-600"
							: receivedValue === false
								? "text-red-600"
								: "text-gray-500"
					}`}
				>
					{receivedValue !== undefined
						? `Received: ${typeof receivedValue}`
						: "Waiting for input..."}
				</div>
			</div>

			{/* Input handle */}
			<Handle type="target" position={Position.Left} className="w-3 h-3 bg-green-500" />
		</div>
	);
}

// Node types configuration
const nodeTypes = {
	buttonNode: ButtonNode,
	displayNode: DisplayNode,
};

// Initial nodes setup
const initialNodes: Node[] = [
	{
		id: "button-1",
		type: "buttonNode",
		position: { x: 100, y: 100 },
		data: {
			label: "Button Node",
			onDataChange: null, // Will be set in component
		},
	},
	{
		id: "display-1",
		type: "displayNode",
		position: { x: 400, y: 100 },
		data: {
			label: "Display Node",
			receivedValue: undefined,
		},
	},
];

// Initial edges setup
const initialEdges: Edge[] = [
	{
		id: "edge-1",
		source: "button-1",
		target: "display-1",
		type: "default",
		style: { stroke: "#3b82f6", strokeWidth: 2 },
	},
];

function SimpleFlowExample() {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	// This function handles data transfer between nodes
	const handleDataChange = useCallback(
		(sourceNodeId: string, newData: any) => {
			console.log(`📡 Data from ${sourceNodeId}:`, newData);

			// Find all edges connected to this source node
			const connectedEdges = edges.filter((edge) => edge.source === sourceNodeId);

			// Update all target nodes with the new data
			setNodes((currentNodes) =>
				currentNodes.map((node) => {
					// Check if this node is a target of any connected edge
					const isTarget = connectedEdges.some((edge) => edge.target === node.id);

					if (isTarget) {
						console.log(`🎯 Updating target node ${node.id} with:`, newData);
						return {
							...node,
							data: {
								...node.data,
								receivedValue: newData.value,
							},
						};
					}

					return node;
				})
			);
		},
		[edges, setNodes]
	);

	// Set up the data change handler for button nodes
	const nodesWithHandlers = nodes.map((node) => {
		if (node.type === "buttonNode") {
			return {
				...node,
				data: {
					...node.data,
					onDataChange: handleDataChange,
				},
			};
		}
		return node;
	});

	const onConnect = useCallback(
		(params: Connection) => {
			console.log("🔗 New connection:", params);
			setEdges((eds) => addEdge(params, eds));
		},
		[setEdges]
	);

	return (
		<div className="w-full h-screen">
			<div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg border">
				<h2 className="text-lg font-bold text-gray-800 mb-2">Simple Data Flow Example</h2>
				<div className="text-sm text-gray-600 space-y-1">
					<p>• Click the button in the Button Node to toggle true/false</p>
					<p>• Watch the Display Node update automatically</p>
					<p>• The edge connects them and transfers the data</p>
				</div>
			</div>

			<ReactFlow
				nodes={nodesWithHandlers}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				nodeTypes={nodeTypes}
				fitView
				className="bg-gray-100"
			></ReactFlow>
		</div>
	);
}

export default function TestPage() {
	return (
		<ReactFlowProvider>
			<SimpleFlowExample />
		</ReactFlowProvider>
	);
}
