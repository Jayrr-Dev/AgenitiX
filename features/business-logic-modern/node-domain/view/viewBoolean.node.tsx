/**
 * ViewBoolean NODE – Simple boolean visualization with pass-through
 *
 * • Takes a boolean input and displays it visually (true/false/null states)
 * • Passes the boolean value through as output unchanged
 * • Clean visual indicators for different boolean states
 * • Compact design with clear state representation
 *
 * Keywords: view-boolean, boolean-display, pass-through, simple
 */

import type { NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { findEdgeByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/iconUtils";
import {
	SafeSchemas,
	createSafeInitialData,
} from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";
import {
	createNodeValidator,
	reportValidationError,
	useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/validation";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
	COLLAPSED_SIZES,
	EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";
import { useStore } from "@xyflow/react";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const ViewBooleanDataSchema = z
	.object({
		// Core boolean state
		booleanValue: z.boolean().nullable().default(null),

		// UI State
		isEnabled: SafeSchemas.boolean(true),
		isActive: SafeSchemas.boolean(false),
		isExpanded: SafeSchemas.boolean(false),

		// Sizing
		expandedSize: SafeSchemas.text("FE1"),
		collapsedSize: SafeSchemas.text("C1"),

		// Data flow
		inputs: z.boolean().nullable().default(null),
		outputs: z.boolean().nullable().default(null),

		// Customization
		label: z.string().optional(),
	})
	.passthrough();

export type ViewBooleanData = z.infer<typeof ViewBooleanDataSchema>;

const validateNodeData = createNodeValidator(ViewBooleanDataSchema, "ViewBoolean");

// -----------------------------------------------------------------------------
// 2️⃣  Constants & Styles
// -----------------------------------------------------------------------------

const BOOLEAN_STATES = {
	TRUE: {
		icon: "LuCheck",
		text: "TRUE",
		color: "text-green-600 dark:text-green-400",
		bgColor: "bg-green-50 dark:bg-green-900/20",
		borderColor: "border-green-200 dark:border-green-800",
	},
	FALSE: {
		icon: "LuX",
		text: "FALSE",
		color: "text-red-600 dark:text-red-400",
		bgColor: "bg-red-50 dark:bg-red-900/20",
		borderColor: "border-red-200 dark:border-red-800",
	},
	NULL: {
		icon: "LuMinus",
		text: "NULL",
		color: "text-gray-500 dark:text-gray-400",
		bgColor: "bg-gray-50 dark:bg-gray-900/20",
		borderColor: "border-gray-200 dark:border-gray-700",
	},
	DISCONNECTED: {
		icon: "LuUnplug",
		text: "NO INPUT",
		color: "text-gray-400 dark:text-gray-500",
		bgColor: "bg-gray-25 dark:bg-gray-950/20",
		borderColor: "border-dashed border-gray-300 dark:border-gray-600",
	},
} as const;

const CONTENT = {
	expanded: "p-3 w-full h-full flex flex-col items-center justify-center",
	collapsed: "flex items-center justify-center w-full h-full",
	disabled: "opacity-50 transition-opacity duration-200",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: ViewBooleanData): NodeSpec {
	const expanded =
		EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ?? EXPANDED_SIZES.FE1;
	const collapsed =
		COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ?? COLLAPSED_SIZES.C1;

	return {
		kind: "viewBoolean",
		displayName: "View Boolean",
		label: "View Boolean",
		category: CATEGORIES.VIEW,
		size: { expanded, collapsed },
		handles: [
			{
				id: "boolean-input",
				code: "b",
				position: "left",
				type: "target",
				dataType: "Boolean",
			},
			{
				id: "boolean-output",
				code: "b",
				position: "right",
				type: "source",
				dataType: "Boolean",
			},
		],
		inspector: { key: "ViewBooleanInspector" },
		version: 1,
		runtime: { execute: "viewBoolean_execute_v1" },
		initialData: createSafeInitialData(ViewBooleanDataSchema, {
			booleanValue: null,
			inputs: null,
			outputs: null,
		}),
		dataSchema: ViewBooleanDataSchema,
		controls: {
			autoGenerate: true,
			excludeFields: [
				"isActive",
				"inputs",
				"outputs",
				"booleanValue",
				"expandedSize",
				"collapsedSize",
			],
			customFields: [
				{ key: "isEnabled", type: "boolean", label: "Enable" },
				{ key: "isExpanded", type: "boolean", label: "Expand" },
			],
		},
		icon: "LuToggleLeft",
		author: "Agenitix Team",
		description:
			"Displays boolean values with clear true/false indicators and passes the value through",
		feature: "base",
		tags: ["view", "boolean", "display", "indicator"],
		theming: {},
	};
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
	expandedSize: "FE1",
	collapsedSize: "C1",
} as ViewBooleanData);

// -----------------------------------------------------------------------------
// 4️⃣  Helper functions
// -----------------------------------------------------------------------------

/**
 * Convert any value to boolean with proper type coercion
 */
function convertToBoolean(value: unknown): boolean | null {
	if (value === null || value === undefined) return null;
	if (typeof value === 'boolean') return value;

	// String conversion
	if (typeof value === 'string') {
		const lower = value.toLowerCase().trim();
		if (lower === 'true' || lower === '1') return true;
		if (lower === 'false' || lower === '0') return false;
		if (lower === '') return null;
	}

	// Number conversion
	if (typeof value === 'number') {
		return value !== 0;
	}

	// Default truthy/falsy conversion
	return Boolean(value);
}

/**
 * Get the appropriate visual state for a boolean value
 */
function getBooleanState(value: boolean | null, hasConnection: boolean) {
	if (!hasConnection) return BOOLEAN_STATES.DISCONNECTED;
	if (value === null) return BOOLEAN_STATES.NULL;
	return value ? BOOLEAN_STATES.TRUE : BOOLEAN_STATES.FALSE;
}

// -----------------------------------------------------------------------------
// 5️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const ViewBooleanNode = memo(({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
	// -------------------------------------------------------------------------
	// 5.1  Sync with React‑Flow store
	// -------------------------------------------------------------------------
	const { nodeData, updateNodeData } = useNodeData(id, data);

	// -------------------------------------------------------------------------
	// 5.2  Derived state
	// -------------------------------------------------------------------------
	const { isExpanded, isEnabled, isActive, inputs, booleanValue } = nodeData as ViewBooleanData;

	// Global React‑Flow store (nodes & edges) – triggers re‑render on change
	const nodes = useStore((s) => s.nodes);
	const edges = useStore((s) => s.edges);

	// Keep last emitted output to avoid redundant writes
	const lastOutputRef = useRef<boolean | null>(null);

	// -------------------------------------------------------------------------
	// 5.3  Callbacks
	// -------------------------------------------------------------------------

	/** Toggle between collapsed / expanded */
	const toggleExpand = useCallback(() => {
		updateNodeData({ isExpanded: !isExpanded });
	}, [isExpanded, updateNodeData]);

	/** Propagate boolean output ONLY when node is active AND enabled */
	const propagate = useCallback(
		(value: boolean | null) => {
			const shouldSend = isActive && isEnabled;
			const out = shouldSend ? value : null;
			if (out !== lastOutputRef.current) {
				lastOutputRef.current = out;
				updateNodeData({ outputs: out });
			}
		},
		[isActive, isEnabled, updateNodeData]
	);

	/**
	 * Compute the latest boolean value from connected input handles.
	 */
	const computeInput = useCallback((): boolean | null => {
		const inputEdge = findEdgeByHandle(edges, id, "boolean-input");
		if (!inputEdge) {
			return null;
		}

		const src = nodes.find((n) => n.id === inputEdge.source);
		if (!src) {
			return null;
		}

		// Priority: outputs > booleanValue > store > whole data
		const inputValue = src.data?.outputs ?? src.data?.booleanValue ?? src.data?.store ?? src.data;
		return convertToBoolean(inputValue);
	}, [edges, nodes, id]);

	// -------------------------------------------------------------------------
	// 5.4  Effects
	// -------------------------------------------------------------------------

	/* 🔄 Whenever nodes/edges change, recompute inputs. */
	useEffect(() => {
		const inputVal = computeInput();
		if (inputVal !== inputs) {
			updateNodeData({
				inputs: inputVal,
				booleanValue: inputVal
			});
		}
	}, [computeInput, inputs, updateNodeData]);

	/* 🔄 Auto-manage isEnabled based on input connections */
	useEffect(() => {
		const hasConnection = inputs !== null;
		// Only auto-control isEnabled when there are connections
		if (hasConnection) {
			// For boolean inputs, enabled if we have a valid boolean (including false)
			const shouldEnable = inputs !== null;
			if (shouldEnable !== isEnabled) {
				updateNodeData({ isEnabled: shouldEnable });
			}
		}
	}, [inputs, isEnabled, updateNodeData]);

	/* 🔄 Update active state based on having valid input and being enabled */
	useEffect(() => {
		const hasValidInput = inputs !== null;

		if (!isEnabled) {
			// If disabled, always set isActive to false
			if (isActive) {
				updateNodeData({ isActive: false });
			}
		} else {
			// If enabled, active when we have valid input
			if (isActive !== hasValidInput) {
				updateNodeData({ isActive: hasValidInput });
			}
		}
	}, [inputs, isEnabled, isActive, updateNodeData]);

	/* 🔄 Propagate output when state changes */
	useEffect(() => {
		propagate(booleanValue as boolean | null);
	}, [isActive, isEnabled, booleanValue, propagate]);

	// -------------------------------------------------------------------------
	// 5.5  Validation
	// -------------------------------------------------------------------------
	const validation = validateNodeData(nodeData);
	if (!validation.success) {
		reportValidationError("ViewBoolean", id, validation.errors, {
			originalData: validation.originalData,
			component: "ViewBooleanNode",
		});
	}

	useNodeDataValidation(ViewBooleanDataSchema, "ViewBoolean", validation.data, id);

	// -------------------------------------------------------------------------
	// 5.6  Visual state computation
	// -------------------------------------------------------------------------
	const hasConnection = inputs !== null;
	const currentState = getBooleanState(booleanValue as boolean | null, hasConnection);

	// -------------------------------------------------------------------------
	// 5.7  Render
	// -------------------------------------------------------------------------
	return (
		<>
			{/* Editable label or icon */}
			{!isExpanded && spec.size.collapsed.width === 60 && spec.size.collapsed.height === 60 ? (
				<div className="absolute inset-0 flex justify-center text-lg p-1 text-foreground/80">
					{renderLucideIcon(currentState.icon, currentState.color, 16)}
				</div>
			) : (
				<LabelNode nodeId={id} label={(nodeData as ViewBooleanData).label || spec.displayName} />
			)}

			{isExpanded ? (
				<div className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}>
					<div className={`
						flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-200
						${currentState.bgColor} ${currentState.borderColor}
					`}>
						<div className={`text-2xl ${currentState.color}`}>
							{renderLucideIcon(currentState.icon, "", 24)}
						</div>
						<div className={`text-sm font-medium ${currentState.color}`}>
							{currentState.text}
						</div>
						{booleanValue !== null && (
							<div className="text-xs text-gray-500 dark:text-gray-400">
								Value: {String(booleanValue)}
							</div>
						)}
					</div>
				</div>
			) : (
				<div className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled}`}>
					<div className={`
						flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
						${currentState.bgColor} ${currentState.borderColor}
					`}>
						<div className={`${currentState.color}`}>
							{renderLucideIcon(currentState.icon, "", 16)}
						</div>
					</div>
				</div>
			)}

			<ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} size="sm" />
		</>
	);
});

// -----------------------------------------------------------------------------
// 6️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

const ViewBooleanNodeWithDynamicSpec = (props: NodeProps) => {
	const { nodeData } = useNodeData(props.id, props.data);

	// Recompute spec only when the size keys change
	const dynamicSpec = useMemo(
		() => createDynamicSpec(nodeData as ViewBooleanData),
		[(nodeData as ViewBooleanData).expandedSize, (nodeData as ViewBooleanData).collapsedSize]
	);

	// Memoize the scaffolded component for stable identity
	const ScaffoldedNode = useMemo(
		() => withNodeScaffold(dynamicSpec, (p) => <ViewBooleanNode {...p} spec={dynamicSpec} />),
		[dynamicSpec]
	);

	return <ScaffoldedNode {...props} />;
};

export default ViewBooleanNodeWithDynamicSpec;
