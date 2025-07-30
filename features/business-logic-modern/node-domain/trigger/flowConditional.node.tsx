/**
 * FlowConditional NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
 * • Zod schema auto‑generates type‑checked Inspector controls.
 * • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
 * • Output propagation is gated by `isActive` *and* `isEnabled` to prevent runaway loops.
 * • Uses findEdgeByHandle utility for robust React Flow edge handling.
 * • Auto-disables when all input connections are removed (handled by flow store).
 * • Code is fully commented and follows current React + TypeScript best practices.
 *
 * Keywords: flow-conditional, schema-driven, type‑safe, clean‑architecture
 */

import type { NodeProps } from "@xyflow/react";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useNodeFeatureFlag } from "@/features/business-logic-modern/infrastructure/node-core/useNodeFeatureFlag";
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

export const FlowConditionalDataSchema = z
	.object({
		condition: z.boolean().default(false), // current condition value
		isEnabled: SafeSchemas.boolean(true), // is node active?
		isActive: SafeSchemas.boolean(false), // reflects if node is processing
		isExpanded: SafeSchemas.boolean(false), // inspector open?
		dataInput: z.any().nullable().default(null), // incoming data to route
		conditionInput: z.boolean().nullable().default(null), // condition input
		trueOutput: z.any().nullable().default(null), // data sent to true path
		falseOutput: z.any().nullable().default(null), // data sent to false path
		lastRoute: z.enum(["true", "false", "none"]).default("none"), // last active route
		expandedSize: SafeSchemas.text("FE1"),
		collapsedSize: SafeSchemas.text("C1"),
		label: z.string().optional(), // User-editable node label
	})
	.passthrough();

export type FlowConditionalData = z.infer<typeof FlowConditionalDataSchema>;

const validateNodeData = createNodeValidator(FlowConditionalDataSchema, "FlowConditional");

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
	CYCLE: {
		primary: "text-[--node--c-y-c-l-e-text]",
	},
} as const;

const CONTENT = {
	expanded: "p-4 w-full h-full flex flex-col cursor-pointer",
	collapsed: "flex items-center justify-center w-full h-full cursor-pointer",
	header: "flex items-center justify-between mb-3",
	body: "flex-1 flex items-center justify-center",
	disabled: "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
	route: "flex items-center justify-center w-full h-full relative",
	trueRoute: "text-green-500 font-bold",
	falseRoute: "text-red-500 font-bold",
	noRoute: "text-gray-400 font-bold",
	arrow: "absolute text-2xl",
	arrowRight: "right-0 top-1/2 transform -translate-y-1/2",
	arrowBottom: "bottom-0 left-1/2 transform -translate-x-1/2 rotate-90",
	arrowActive: "text-blue-500 animate-pulse",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: FlowConditionalData): NodeSpec {
	const expanded =
		EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ?? EXPANDED_SIZES.FE1;
	const collapsed =
		COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ?? COLLAPSED_SIZES.C1;

	return {
		kind: "flowConditional",
		displayName: "FlowConditional",
		label: "FlowConditional",
		category: CATEGORIES.CYCLE,
		size: { expanded, collapsed },
		handles: [
			{
				id: "dataInput",
				code: "b",
				position: "left",
				type: "target",
				dataType: "any",
			},
			{
				id: "conditionInput",
				code: "b",
				position: "top",
				type: "target",
				dataType: "boolean",
			},
			{
				id: "trueOutput",
				code: "b",
				position: "right",
				type: "source",
				dataType: "any",
			},
			{
				id: "falseOutput",
				code: "b",
				position: "bottom",
				type: "source",
				dataType: "any",
			},
		],
		inspector: { key: "FlowConditionalInspector" },
		version: 1,
		runtime: { execute: "flowConditional_execute_v1" },
		initialData: createSafeInitialData(FlowConditionalDataSchema, {
			condition: false,
			dataInput: null,
			conditionInput: null,
			trueOutput: null,
			falseOutput: null,
			lastRoute: "none",
		}),
		dataSchema: FlowConditionalDataSchema,
		controls: {
			autoGenerate: true,
			excludeFields: [
				"isActive",
				"dataInput",
				"conditionInput",
				"trueOutput",
				"falseOutput",
				"lastRoute",
				"expandedSize",
				"collapsedSize",
			],
			customFields: [
				{ key: "isEnabled", type: "boolean", label: "Enable" },
				{ key: "condition", type: "boolean", label: "Default Condition" },
				{ key: "isExpanded", type: "boolean", label: "Expand" },
			],
		},
		icon: "LuRefreshCw",
		author: "Hoang Nguyen",
		description: "Decision-based routing node that directs data flow based on a boolean condition",
		feature: "base",
		tags: ["trigger", "flowConditional"],
		featureFlag: {
			flag: "test",
			fallback: true,
			disabledMessage: "This flowConditional node is currently disabled",
			hideWhenDisabled: false,
		},
		theming: {},
	};
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
	expandedSize: "FE1",
	collapsedSize: "C1",
} as FlowConditionalData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

export const FlowConditionalNode = memo(({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
	// Add ref for the node container
	const nodeRef = useRef<HTMLDivElement>(null);

	// Track if the node was recently clicked for visual feedback
	const [wasClicked, setWasClicked] = useState(false);
	// -------------------------------------------------------------------------
	// 4.1  Sync with React‑Flow store
	// -------------------------------------------------------------------------
	const { nodeData, updateNodeData } = useNodeData(id, data);

	// -------------------------------------------------------------------------
	// 4.2  Derived state
	// -------------------------------------------------------------------------
	const { isExpanded, isEnabled, isActive, condition, lastRoute } = nodeData as FlowConditionalData;

	// 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
	const nodes = useStore((s) => s.nodes);
	const edges = useStore((s) => s.edges);

	// keep last emitted outputs to avoid redundant writes
	const lastTrueOutputRef = useRef<any>(null);
	const lastFalseOutputRef = useRef<any>(null);

	const _categoryStyles = CATEGORY_TEXT.CYCLE;

	// -------------------------------------------------------------------------
	// 4.3  Feature flag evaluation (after all hooks)
	// -------------------------------------------------------------------------
	const flagState = useNodeFeatureFlag(spec.featureFlag);

	// -------------------------------------------------------------------------
	// 4.4  Callbacks
	// -------------------------------------------------------------------------

	/** Toggle between collapsed / expanded */
	const toggleExpand = useCallback(() => {
		updateNodeData({ isExpanded: !isExpanded });
	}, [isExpanded, updateNodeData]);

	/** Propagate outputs based on condition ONLY when node is active AND enabled */
	const propagate = useCallback(
		(value: any, currentCondition: boolean) => {
			const shouldSend = isActive && isEnabled;

			if (shouldSend) {
				if (currentCondition) {
					// Route to true output
					if (value !== lastTrueOutputRef.current) {
						lastTrueOutputRef.current = value;
						updateNodeData({
							trueOutput: value,
							falseOutput: null,
							lastRoute: "true",
						});
					}
				} else {
					// Route to false output
					if (value !== lastFalseOutputRef.current) {
						lastFalseOutputRef.current = value;
						updateNodeData({
							trueOutput: null,
							falseOutput: value,
							lastRoute: "false",
						});
					}
				}
			} else {
				// When inactive or disabled, clear both outputs
				if (lastTrueOutputRef.current !== null || lastFalseOutputRef.current !== null) {
					lastTrueOutputRef.current = null;
					lastFalseOutputRef.current = null;
					updateNodeData({
						trueOutput: null,
						falseOutput: null,
						lastRoute: "none",
					});
				}
			}
		},
		[isActive, isEnabled, updateNodeData]
	);

	/** Clear outputs when inactive or disabled */
	const clearOutputsWhenInactive = useCallback(() => {
		if (!(isActive && isEnabled)) {
			updateNodeData({
				trueOutput: null,
				falseOutput: null,
				lastRoute: "none",
			});
		}
	}, [isActive, isEnabled, updateNodeData]);

	/**
	 * Compute the latest data coming from connected data input handle.
	 */
	const computeDataInput = useCallback((): any => {
		const dataInputEdge = findEdgeByHandle(edges, id, "dataInput");
		if (!dataInputEdge) {
			return null;
		}

		const src = nodes.find((n) => n.id === dataInputEdge.source);
		if (!src) {
			return null;
		}

		// priority: outputs ➜ store ➜ whole data
		return src.data?.outputs ?? src.data?.store ?? src.data;
	}, [edges, nodes, id]);

	/**
	 * Compute the latest boolean coming from connected condition input handle.
	 */
	const computeConditionInput = useCallback((): boolean | null => {
		const conditionInputEdge = findEdgeByHandle(edges, id, "conditionInput");
		if (!conditionInputEdge) {
			return null;
		}

		const src = nodes.find((n) => n.id === conditionInputEdge.source);
		if (!src) {
			return null;
		}

		// priority: outputs ➜ store ➜ whole data
		const conditionValue = src.data?.outputs ?? src.data?.store ?? src.data;
		return (
			conditionValue === true ||
			conditionValue === "true" ||
			conditionValue === 1 ||
			conditionValue === "1"
		);
	}, [edges, nodes, id]);

	/** Handle condition toggle */
	const handleConditionToggle = useCallback(() => {
		updateNodeData({ condition: !condition });

		// Visual feedback for click
		setWasClicked(true);
		setTimeout(() => setWasClicked(false), 300);
	}, [condition, updateNodeData]);

	/** Handle node click to toggle condition */
	const handleNodeClick = useCallback(
		(e: React.MouseEvent) => {
			// Only toggle if clicking directly on the node container, not on buttons or other interactive elements
			if (
				e.target === e.currentTarget ||
				(e.currentTarget as HTMLElement).contains(e.target as HTMLElement)
			) {
				// Check if the click is on a button or interactive element
				const target = e.target as HTMLElement;
				if (
					target.tagName === "BUTTON" ||
					target.closest("button") ||
					target.getAttribute("role") === "button" ||
					target.classList.contains("no-toggle")
				) {
					return; // Don't toggle if clicking on interactive elements
				}

				handleConditionToggle();
			}
		},
		[handleConditionToggle]
	);

	// -------------------------------------------------------------------------
	// 4.5  Effects
	// -------------------------------------------------------------------------

	/* 🔄 Whenever nodes/edges change, recompute data input. */
	useEffect(() => {
		const dataInputVal = computeDataInput();
		if (dataInputVal !== (nodeData as FlowConditionalData).dataInput) {
			updateNodeData({ dataInput: dataInputVal });
		}
	}, [computeDataInput, nodeData, updateNodeData]);

	/* 🔄 Whenever nodes/edges change, recompute condition input. */
	useEffect(() => {
		const conditionInputVal = computeConditionInput();
		if (conditionInputVal !== (nodeData as FlowConditionalData).conditionInput) {
			updateNodeData({ conditionInput: conditionInputVal });
		}
	}, [computeConditionInput, nodeData, updateNodeData]);

	/* 🔄 Make isEnabled dependent on data input value only when there are connections. */
	useEffect(() => {
		const hasDataInput = (nodeData as FlowConditionalData).dataInput !== null;
		// Only auto-control isEnabled when there are connections (dataInput !== null)
		// When dataInput is null (no connections), let user manually control isEnabled
		if (hasDataInput) {
			if (!isEnabled) {
				updateNodeData({ isEnabled: true });
			}
		}
	}, [nodeData, isEnabled, updateNodeData]);

	// Monitor data input and update active state
	useEffect(() => {
		const hasDataInput = (nodeData as FlowConditionalData).dataInput !== null;

		// If disabled, always set isActive to false
		if (isEnabled) {
			if (isActive !== hasDataInput) {
				updateNodeData({ isActive: hasDataInput });
			}
		} else if (isActive) {
			updateNodeData({ isActive: false });
		}
	}, [(nodeData as FlowConditionalData).dataInput, isEnabled, isActive, updateNodeData]);

	// Determine current condition and route data accordingly
	useEffect(() => {
		// Get the current condition value - prioritize input over stored value
		const conditionInputVal = (nodeData as FlowConditionalData).conditionInput;
		const currentCondition = conditionInputVal !== null ? conditionInputVal : condition;

		// Get the data to route
		const dataToRoute = (nodeData as FlowConditionalData).dataInput;

		// Route the data based on condition
		propagate(dataToRoute, currentCondition);
		clearOutputsWhenInactive();
	}, [
		isActive,
		isEnabled,
		condition,
		(nodeData as FlowConditionalData).dataInput,
		(nodeData as FlowConditionalData).conditionInput,
		propagate,
		clearOutputsWhenInactive,
	]);

	// -------------------------------------------------------------------------
	// 4.6  Validation
	// -------------------------------------------------------------------------
	const validation = validateNodeData(nodeData);
	if (!validation.success) {
		reportValidationError("FlowConditional", id, validation.errors, {
			originalData: validation.originalData,
			component: "FlowConditionalNode",
		});
	}

	useNodeDataValidation(FlowConditionalDataSchema, "FlowConditional", validation.data, id);

	// -------------------------------------------------------------------------
	// 4.7  Feature flag conditional rendering
	// -------------------------------------------------------------------------

	// If flag is loading, show loading state
	if (flagState.isLoading) {
		return (
			<div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
				Loading flowConditional feature...
			</div>
		);
	}

	// If flag is disabled and should hide, return null
	if (!flagState.isEnabled && flagState.hideWhenDisabled) {
		return null;
	}

	// If flag is disabled, show disabled message
	if (!flagState.isEnabled) {
		return (
			<div className="flex items-center justify-center p-4 text-sm text-muted-foreground border border-dashed border-muted-foreground/20 rounded-lg">
				{flagState.disabledMessage}
			</div>
		);
	}

	// -------------------------------------------------------------------------
	// 4.8  Render
	// -------------------------------------------------------------------------
	return (
		<>
			{/* Editable label or icon */}
			{!isExpanded && spec.size.collapsed.width === 60 && spec.size.collapsed.height === 60 ? (
				<div className="absolute inset-0 flex justify-center text-lg p-1 text-foreground/80">
					{spec.icon && renderLucideIcon(spec.icon, "", 16)}
				</div>
			) : (
				<LabelNode
					nodeId={id}
					label={(nodeData as FlowConditionalData).label || spec.displayName}
				/>
			)}

			{isExpanded ? (
				<div
					className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled} ${wasClicked ? "scale-95 transition-transform" : ""}`}
					onClick={handleNodeClick}
					ref={nodeRef}
				>
					<div className={CONTENT.header}>
						<div className="text-sm font-medium">Flow Conditional</div>
						<div className="flex items-center space-x-1">
							<div
								className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-300"}`}
								title={isActive ? "Active" : "Inactive"}
							/>
						</div>
					</div>
					<div className={CONTENT.body}>
						<div className="flex flex-col items-center justify-center w-full h-full">
							<div className="text-sm mb-2">Current Condition:</div>
							<button
								onClick={handleConditionToggle}
								className={`px-4 py-2 rounded-md ${condition ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
							>
								{condition ? "TRUE" : "FALSE"}
							</button>

							<div className="mt-4 text-sm">Active Route:</div>
							<div
								className={`mt-1 font-bold ${lastRoute === "true" ? CONTENT.trueRoute : lastRoute === "false" ? CONTENT.falseRoute : CONTENT.noRoute}`}
							>
								{lastRoute === "true"
									? "TRUE PATH"
									: lastRoute === "false"
										? "FALSE PATH"
										: "NO ROUTE"}
							</div>

							<div className="mt-4 text-xs text-gray-500">
								{(nodeData as FlowConditionalData).conditionInput !== null
									? "Using external condition input"
									: "Using internal condition value"}
							</div>
						</div>
					</div>
				</div>
			) : (
				<div
					className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled} ${wasClicked ? "scale-95 transition-transform" : ""}`}
					onClick={handleNodeClick}
					ref={nodeRef}
				>
					<div className={CONTENT.route}>
						{/* Condition indicator */}
						<div
							className={`text-center ${lastRoute === "true" ? CONTENT.trueRoute : lastRoute === "false" ? CONTENT.falseRoute : CONTENT.noRoute}`}
							onClick={handleConditionToggle}
						>
							{lastRoute === "true" ? "T" : lastRoute === "false" ? "F" : "?"}
						</div>

						{/* Right arrow (true path) */}
						<div
							className={`${CONTENT.arrow} ${CONTENT.arrowRight} ${lastRoute === "true" ? CONTENT.arrowActive : ""}`}
						>
							→
						</div>

						{/* Bottom arrow (false path) */}
						<div
							className={`${CONTENT.arrow} ${CONTENT.arrowBottom} ${lastRoute === "false" ? CONTENT.arrowActive : ""}`}
						>
							→
						</div>
					</div>
				</div>
			)}
			<ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} size="sm" />
		</>
	);
});

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

/**
 * ⚠️ THIS is the piece that fixes the focus‑loss issue.
 *
 * `withNodeScaffold` returns a *component function*.  Re‑creating that function
 * on every keystroke causes React to unmount / remount the subtree (and your
 * textarea loses focus).  We memoise the scaffolded component so its identity
 * stays stable across renders unless the *spec itself* really changes.
 */
const FlowConditionalNodeWithDynamicSpec = (props: NodeProps) => {
	const { nodeData } = useNodeData(props.id, props.data);

	// Recompute spec only when the size keys change
	const dynamicSpec = useMemo(
		() => createDynamicSpec(nodeData as FlowConditionalData),
		[
			(nodeData as FlowConditionalData).expandedSize,
			(nodeData as FlowConditionalData).collapsedSize,
		]
	);

	// Memoise the scaffolded component to keep focus
	const ScaffoldedNode = useMemo(
		() => withNodeScaffold(dynamicSpec, (p) => <FlowConditionalNode {...p} spec={dynamicSpec} />),
		[dynamicSpec]
	);

	return <ScaffoldedNode {...props} />;
};

export default FlowConditionalNodeWithDynamicSpec;
