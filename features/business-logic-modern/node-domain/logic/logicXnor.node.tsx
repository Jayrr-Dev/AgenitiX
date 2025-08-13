/**
 * logicXnor NODE – Primitive boolean XNOR gate (60x60px)
 * 
 * Follows the same pattern as viewBoolean for proper state management:
 * - isActive: false initially, becomes true when has valid connections
 * - output: null initially, calculated from actual inputs
 * - Proper connection state tracking
 */

import type { NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/iconUtils";
import {
	SafeSchemas,
	createSafeInitialData,
} from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import { COLLAPSED_SIZES } from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";
import { useStore } from "@xyflow/react";
import { LogicOperations, extractBooleanValue, getOutputDisplay } from "./utils";

// Data schema - following viewBoolean pattern
export const LogicXnorDataSchema = z
	.object({
		// Core logic state
		output: z.boolean().nullable().default(null),
		
		// UI State - following viewBoolean pattern
		isEnabled: SafeSchemas.boolean(true),
		isActive: SafeSchemas.boolean(false), // Start false, activate when has connections
		isExpanded: SafeSchemas.boolean(false),
		
		// Sizing
		expandedSize: SafeSchemas.text("PRIMITIVE"),
		collapsedSize: SafeSchemas.text("PRIMITIVE"),
		
		// Connection tracking - like viewBoolean
		inputs: z
			.record(z.string(), z.boolean().nullable())
			.nullable()
			.default(null),
		connectionStates: z
			.record(
				z.string(),
				z.object({
					nodeId: z.string(),
					value: z.boolean().nullable(),
					handleId: z.string(),
				})
			)
			.nullable()
			.default(null),
	})
	.passthrough();

export type LogicXnorData = z.infer<typeof LogicXnorDataSchema>;

// Dynamic spec
function createDynamicSpec(data: LogicXnorData): NodeSpec {
	return {
		kind: "logicXnor",
		displayName: "Logic XNOR",
		label: "XNOR",
		category: CATEGORIES.LOGIC,
		size: {
			expanded: COLLAPSED_SIZES.PRIMITIVE,
			collapsed: COLLAPSED_SIZES.PRIMITIVE,
		},
		handles: [
			{
				id: "input",
				code: "boolean",
				position: "left",
				type: "target",
				dataType: "boolean",
			},
			{
				id: "output",
				code: "boolean",
				position: "right",
				type: "source",
				dataType: "boolean",
			},
		],
		inspector: { key: "LogicXnorInspector" },
		version: 1,
		runtime: { execute: "logicXnor_execute_v1" },
		initialData: createSafeInitialData(LogicXnorDataSchema, {
			output: null,
			expandedSize: "PRIMITIVE",
			collapsedSize: "PRIMITIVE",
			isEnabled: true,
			isActive: false, // Start inactive, activate when has connections
			isExpanded: false,
			inputs: null,
			connectionStates: null,
		}),
		dataSchema: LogicXnorDataSchema,
		controls: {
			autoGenerate: true,
			excludeFields: [
				"output", 
				"expandedSize", 
				"collapsedSize",
				"isActive", // Don't show isActive in inspector - it's auto-managed
				"inputs",
				"connectionStates"
			],
			customFields: [
				{ key: "isEnabled", type: "boolean", label: "Enable" },
			],
		},
		icon: "LuZap",
		author: "Agenitix Team",
		description: "Boolean XNOR gate - outputs true when an EVEN number of inputs are true",
		feature: "base",
		tags: ["logic", "boolean", "xnor", "gate", "primitive"],
		theming: {},
	};
}

export const spec: NodeSpec = createDynamicSpec({
	expandedSize: "PRIMITIVE",
	collapsedSize: "PRIMITIVE",
} as LogicXnorData);

// React component - following viewBoolean pattern
const LogicXnorNode = memo(({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
	// -------------------------------------------------------------------------
	// State management - following viewBoolean pattern
	// -------------------------------------------------------------------------
	const { nodeData, updateNodeData } = useNodeData(id, data);
	
	const {
		isEnabled,
		isActive,
		inputs,
		output,
		connectionStates,
	} = nodeData as LogicXnorData;

	// Global React‑Flow store (nodes & edges) – triggers re‑render on change
	const nodes = useStore((s) => s.nodes);
	const edges = useStore((s) => s.edges);

	// Keep last emitted output to avoid redundant writes
	const lastOutputRef = useRef<boolean | null>(null);

	// -------------------------------------------------------------------------
	// Callbacks - following viewBoolean pattern
	// -------------------------------------------------------------------------

	/** Propagate boolean output when node is enabled (false should still propagate) */
	const propagate = useCallback(
		(value: boolean | null) => {
			const shouldSend = isEnabled;
			const out = shouldSend ? value : null;
			if (out !== lastOutputRef.current) {
				lastOutputRef.current = out;
				updateNodeData({ 
					output: out,
					booleanValue: out // Fallback for viewBoolean compatibility
				});
			}
		},
		[isEnabled, updateNodeData]
	);

	/**
	 * Compute all boolean values from connected input handles and track connection states.
	 * Following viewBoolean pattern exactly
	 */
	const computeConnectionStates = useCallback(() => {
		// Find all edges connected to this node (target)
		const connectedEdges = edges.filter((edge) => edge.target === id);

		if (connectedEdges.length === 0) {
			return { connectionStates: null, logicResult: null };
		}

		const connectionStates: Record<
			string,
			{ nodeId: string; value: boolean | null; handleId: string }
		> = {};
		const values: boolean[] = [];

		for (const edge of connectedEdges) {
			// Get the source node data
			const sourceNode = nodes.find((n) => n.id === edge.source);
			if (!sourceNode?.data) continue;

			const sourceData = sourceNode.data as any;
			const booleanValue = extractBooleanValue(sourceData);

			connectionStates[edge.id] = {
				nodeId: edge.source,
				value: booleanValue,
				handleId: edge.sourceHandle || "output",
			};

			if (booleanValue !== null) {
				values.push(booleanValue);
			}
		}

		// Apply XNOR logic: even number of inputs must be true
		const logicResult = LogicOperations.xnor(values);

		return { connectionStates, logicResult };
	}, [id, edges, nodes]);

	// -------------------------------------------------------------------------
	// Effects - following viewBoolean pattern exactly
	// -------------------------------------------------------------------------

	/* 🔄 Whenever nodes/edges change, recompute connections. */
	useEffect(() => {
		const { connectionStates: newConnectionStates, logicResult } =
			computeConnectionStates();
		updateNodeData({
			inputs: newConnectionStates
				? Object.fromEntries(
						Object.entries(newConnectionStates).map(([key, state]) => [
							key,
							state.value,
						])
					)
				: null,
			output: logicResult,
			connectionStates: newConnectionStates,
		});
	}, [nodes, edges, computeConnectionStates, updateNodeData]);

	/* 🔄 Auto-manage isEnabled based on input connections */
	useEffect(() => {
		const hasConnection =
			connectionStates !== null &&
			Object.keys(connectionStates || {}).length > 0;
		if (hasConnection !== isEnabled) {
			updateNodeData({ isEnabled: hasConnection });
		}
	}, [connectionStates, isEnabled, updateNodeData]);

	/* 🔄 Update active state: active only when enabled and output is strictly true */
	useEffect(() => {
		const isTrue = output === true; // null treated as false
		if (isEnabled) {
			if (isActive !== isTrue) {
				updateNodeData({ isActive: isTrue });
			}
		} else if (isActive) {
			updateNodeData({ isActive: false });
		}
	}, [output, isEnabled, isActive, updateNodeData]);

	/* 🔄 Propagate output when state changes */
	useEffect(() => {
		propagate(output as boolean | null);
	}, [isEnabled, output, propagate]);

	// -------------------------------------------------------------------------
	// Render - simplified
	// -------------------------------------------------------------------------
	const hasConnection =
		connectionStates !== null &&
		Object.keys(connectionStates || {}).length > 0;
	const display = getOutputDisplay(output as boolean | null);

	return (
		<div className={`flex flex-col items-center justify-center w-full h-full p-1 ${isEnabled ? "" : "opacity-50"}`}>
			<div className="text-xs font-bold text-muted-foreground mb-1">XNOR</div>
			<div className={`${display.color} flex items-center justify-center`}>
				{renderLucideIcon(display.icon)}
			</div>
		</div>
	);
});

// Wrapper component
const LogicXnorNodeWithDynamicSpec = (props: NodeProps) => {
	const { nodeData } = useNodeData(props.id, props.data);
	const dynamicSpec = useMemo(() => createDynamicSpec(nodeData as LogicXnorData), [nodeData]);
	const ScaffoldedNode = useMemo(
		() => withNodeScaffold(dynamicSpec, (p) => <LogicXnorNode {...p} spec={dynamicSpec} />),
		[dynamicSpec]
	);
	return <ScaffoldedNode {...props} />;
};

export default LogicXnorNodeWithDynamicSpec;