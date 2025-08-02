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
import { Loading } from "@/components/Loading";
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
		firstOutput: z.boolean().nullable().default(null), // true value sent to first output
		secondOutput: z.boolean().nullable().default(null), // false value sent to second output
		lastRoute: z.enum(["true", "false", "none"]).default("none"), // last active route
		expandedSize: SafeSchemas.text("FE3"),
		collapsedSize: SafeSchemas.text("C3"),
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
	expanded: "p-6 w-full h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer",
	collapsed: "flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm cursor-pointer",
	header: "flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700",
	body: "flex-1 flex items-center justify-center",
	disabled: "opacity-60 grayscale transition-all duration-300",
	
	// Conditional display
	conditionSection: "bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm",
	conditionHeader: "text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2",
	conditionDisplay: "flex flex-col items-center gap-3",
	conditionLabel: "text-sm text-slate-600 dark:text-slate-400",
	
	// Toggle button
	toggleButton: "px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 shadow-md",
	toggleTrue: "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700",
	toggleFalse: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700",
	
	// Status section
	statusSection: "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-700",
	statusGrid: "grid grid-cols-1 gap-2",
	statusRow: "flex items-center justify-between",
	statusLabel: "text-xs font-medium text-slate-500 dark:text-slate-400",
	statusValue: "text-xs font-semibold",
	statusActive: "text-emerald-600 dark:text-emerald-400",
	statusInactive: "text-red-500 dark:text-red-400",
	
	// Route indicators
	route: "flex items-center justify-center w-full h-full relative p-4",
	routeIndicator: "text-center relative z-10",
	trueRoute: "text-emerald-500 font-bold text-lg",
	falseRoute: "text-red-500 font-bold text-lg", 
	noRoute: "text-slate-400 font-bold text-lg",
	
	// Arrows
	arrow: "absolute text-2xl font-bold transition-all duration-300",
	arrowRight: "right-2 top-1/2 transform -translate-y-1/2",
	arrowBottom: "bottom-2 left-1/2 transform -translate-x-1/2",
	arrowActive: "text-blue-500 animate-pulse",
	arrowInactive: "text-slate-400 dark:text-slate-600",
	
	// Collapsed view
	collapsedIcon: "text-2xl mb-2 text-purple-600 dark:text-purple-400",
	collapsedTitle: "text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1",
	collapsedStatus: "mt-2 px-2 py-1 rounded-full text-xs font-medium",
	collapsedActive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
	collapsedInactive: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
	
	// External condition indicator
	externalIndicator: "text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800",
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
				dataType: "Boolean",
			},
			{
				id: "conditionInput",
				code: "b",
				position: "top",
				type: "target",
				dataType: "Boolean",
			},
			{
				id: "firstOutput",
				code: "b", 
				position: "right",
				type: "source",
				dataType: "Boolean",
			},
			{
				id: "secondOutput",
				code: "b", 
				position: "bottom",
				type: "source",
				dataType: "Boolean",
			},
		],
		inspector: { key: "FlowConditionalInspector" },
		version: 1,
		runtime: { execute: "flowConditional_execute_v1" },
		initialData: createSafeInitialData(FlowConditionalDataSchema, {
			condition: false,
			dataInput: null,
			conditionInput: null,
			firstOutput: null,
			secondOutput: null,
			lastRoute: "none",
			expandedSize: "FE3",
			collapsedSize: "C3",
		}),
		dataSchema: FlowConditionalDataSchema,
		controls: {
			autoGenerate: true,
			excludeFields: [
				"isActive",
				"dataInput",
				"conditionInput",
				"firstOutput",
				"secondOutput",
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
		author: "Agenitix Team",
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
	expandedSize: "FE3",
	collapsedSize: "C3",
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

	// Initialize missing fields if needed
	useEffect(() => {
		const updates: Partial<FlowConditionalData> = {};
		let needsUpdate = false;

		// Check if required fields are missing
		if (nodeData.condition === undefined) {
			updates.condition = false;
			needsUpdate = true;
		}
		if (nodeData.firstOutput === undefined) {
			updates.firstOutput = null;
			needsUpdate = true;
		}
		if (nodeData.secondOutput === undefined) {
			updates.secondOutput = null;
			needsUpdate = true;
		}
		if (nodeData.lastRoute === undefined) {
			updates.lastRoute = "none";
			needsUpdate = true;
		}

		// Only update if needed
		if (needsUpdate) {
			console.log('Initializing missing FlowConditional fields:', updates);
			updateNodeData(updates);
		}
	}, [nodeData, updateNodeData]);

	// -------------------------------------------------------------------------
	// 4.2  Derived state
	// -------------------------------------------------------------------------
	const { isExpanded, isEnabled, isActive, condition, lastRoute, collapsedSize } = nodeData as FlowConditionalData;

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

	/** Main routing logic - routes data based on condition */
	const routeData = useCallback(
		(dataInput: any, effectiveCondition: boolean) => {
			if (!isActive || !isEnabled) {
				// Clear outputs when inactive/disabled
				if (lastTrueOutputRef.current !== null || lastFalseOutputRef.current !== null) {
					lastTrueOutputRef.current = null;
					lastFalseOutputRef.current = null;
					updateNodeData({
						firstOutput: null,
						secondOutput: null,
						lastRoute: "none",
					});
				}
				return;
			}

			// Route data based on condition - complementary outputs
			if (effectiveCondition) {
				// TRUE path: firstOutput gets the data, secondOutput gets false
				const trueOutput = dataInput;
				const falseOutput = false;
				
				if (trueOutput !== lastTrueOutputRef.current || falseOutput !== lastFalseOutputRef.current) {
					lastTrueOutputRef.current = trueOutput;
					lastFalseOutputRef.current = falseOutput;
					updateNodeData({
						firstOutput: trueOutput,
						secondOutput: falseOutput,
						lastRoute: "true",
					});
				}
			} else {
				// FALSE path: firstOutput gets false, secondOutput gets the data
				const trueOutput = false;
				const falseOutput = dataInput;
				
				if (trueOutput !== lastTrueOutputRef.current || falseOutput !== lastFalseOutputRef.current) {
					lastTrueOutputRef.current = trueOutput;
					lastFalseOutputRef.current = falseOutput;
					updateNodeData({
						firstOutput: trueOutput,
						secondOutput: falseOutput,
						lastRoute: "false",
					});
				}
			}
		},
		[isActive, isEnabled, updateNodeData]
	);

	/** Get effective condition (external input takes precedence) */
	const getEffectiveCondition = useCallback((): boolean => {
		const conditionInput = (nodeData as FlowConditionalData).conditionInput;
		return conditionInput !== null ? conditionInput : condition;
	}, [nodeData, condition]);

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
		const newCondition = !condition;
		const currentData = (nodeData as FlowConditionalData).dataInput;
		const hasExternalCondition = (nodeData as FlowConditionalData).conditionInput !== null;
		
		// Always update internal condition
		updateNodeData({ condition: newCondition });
		
		// Only route data if we're not externally controlled and have data
		if (!hasExternalCondition && isActive && isEnabled) {
			routeData(currentData, newCondition);
		}

		// Visual feedback
		setWasClicked(true);
		setTimeout(() => setWasClicked(false), 300);
	}, [condition, nodeData, updateNodeData, isActive, isEnabled, routeData]);

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
	// 4.5  Effects - Simplified and consolidated
	// -------------------------------------------------------------------------

	/* 🔄 Update data input when edges change */
	useEffect(() => {
		const dataInputVal = computeDataInput();
		if (dataInputVal !== (nodeData as FlowConditionalData).dataInput) {
			updateNodeData({ dataInput: dataInputVal });
		}
	}, [computeDataInput, nodeData, updateNodeData]);

	/* 🔄 Update condition input when edges change */
	useEffect(() => {
		const conditionInputVal = computeConditionInput();
		if (conditionInputVal !== (nodeData as FlowConditionalData).conditionInput) {
			updateNodeData({ conditionInput: conditionInputVal });
		}
	}, [computeConditionInput, nodeData, updateNodeData]);

	/* 🔄 Update isActive based on data input presence */
	useEffect(() => {
		const hasDataInput = (nodeData as FlowConditionalData).dataInput !== null;
		const shouldBeActive = isEnabled && hasDataInput;
		
		if (isActive !== shouldBeActive) {
			updateNodeData({ isActive: shouldBeActive });
		}
	}, [(nodeData as FlowConditionalData).dataInput, isEnabled, isActive, updateNodeData]);

	/* 🔄 Auto-enable when data input is present */
	useEffect(() => {
		const hasDataInput = (nodeData as FlowConditionalData).dataInput !== null;
		if (hasDataInput && !isEnabled) {
			updateNodeData({ isEnabled: true });
		}
	}, [(nodeData as FlowConditionalData).dataInput, isEnabled, updateNodeData]);

	/* 🔄 Main routing effect - handles all data routing */
	useEffect(() => {
		const dataInput = (nodeData as FlowConditionalData).dataInput;
		const effectiveCondition = getEffectiveCondition();
		
		routeData(dataInput, effectiveCondition);
	}, [
		nodeData,
		isActive,
		isEnabled,
		condition,
		routeData,
		getEffectiveCondition
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
		// For small collapsed sizes (C1, C1W), hide text and center better
		const isSmallNode = !isExpanded && (collapsedSize === "C1" || collapsedSize === "C1W");
		
		return (
			<div className={`${CONTENT.collapsed} animate-pulse`}>
				<div className="flex flex-col items-center justify-center w-full h-full p-4">
					<div className={`${CONTENT.collapsedIcon} opacity-50`}>
						{spec.icon && renderLucideIcon(spec.icon, "", 32)}
					</div>
					<div className="text-sm font-medium text-slate-500 dark:text-slate-400">
						Loading...
					</div>
				</div>
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
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							handleNodeClick(e as any);
						}
					}}
					tabIndex={0}
					role="button"
					aria-label="Toggle flow conditional"
					ref={nodeRef}
				>
					{/* Header with title */}
					<div className={CONTENT.header}>
						<div className="flex items-center gap-2">
							{spec.icon && renderLucideIcon(spec.icon, "text-purple-600 dark:text-purple-400", 18)}
							<h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
								Flow Conditional
							</h3>
						</div>
						<ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} size="sm" />
					</div>

					<div className={CONTENT.body}>
						{/* Condition Control Section */}
						<div className={CONTENT.conditionSection}>
							<div className={CONTENT.conditionHeader}>
								{renderLucideIcon("LuGitBranch", "text-slate-500", 16)}
								Condition Control
							</div>
							<div className={CONTENT.conditionDisplay}>
								<div className={CONTENT.conditionLabel}>Current State:</div>
								<button
									type="button"
									onClick={handleConditionToggle}
									className={`${CONTENT.toggleButton} ${condition ? CONTENT.toggleTrue : CONTENT.toggleFalse}`}
									title={`Click to ${condition ? "disable" : "enable"} condition`}
								>
									{condition ? "TRUE" : "FALSE"}
								</button>
								
								{/* External condition indicator */}
								{(nodeData as FlowConditionalData).conditionInput !== null && (
									<div className={CONTENT.externalIndicator}>
										⚡ External Control
									</div>
								)}
							</div>
						</div>

						{/* Route Information */}
						<div className={CONTENT.statusSection}>
							<div className={CONTENT.statusGrid}>
								<div className={CONTENT.statusRow}>
									<span className={CONTENT.statusLabel}>Active Route:</span>
									<span className={`${CONTENT.statusValue} ${lastRoute === "true" ? CONTENT.statusActive : lastRoute === "false" ? CONTENT.statusInactive : "text-slate-500"}`}>
										{lastRoute === "true" ? "→ TRUE PATH" : lastRoute === "false" ? "↓ FALSE PATH" : "No Route"}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div
					className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled} ${wasClicked ? "scale-95 transition-transform" : ""}`}
					onClick={handleNodeClick}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							handleNodeClick(e as any);
						}
					}}
					tabIndex={0}
					role="button"
					aria-label="Toggle flow conditional"
					ref={nodeRef}
				>
					<div className={CONTENT.route}>
						{/* Central icon and condition indicator */}
						<div className={CONTENT.routeIndicator}>
							<div className={CONTENT.collapsedIcon}>
								{spec.icon && renderLucideIcon(spec.icon, "", 32)}
							</div>
							<div className={CONTENT.collapsedTitle}>
								{condition ? "TRUE" : "FALSE"}
							</div>
						</div>

						{/* Right arrow (true path) */}
						<div
							className={`${CONTENT.arrow} ${CONTENT.arrowRight} ${lastRoute === "true" ? CONTENT.arrowActive : CONTENT.arrowInactive}`}
						>
							→
						</div>

						{/* Bottom arrow (false path) */}
						<div
							className={`${CONTENT.arrow} ${CONTENT.arrowBottom} ${lastRoute === "false" ? CONTENT.arrowActive : CONTENT.arrowInactive}`}
						>
							↓
						</div>
					</div>
				</div>
			)}
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
