/**
 * viewText NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Presents incoming text with ZERO structural styling – the surrounding scaffold handles
 *   borders, sizing, themes, drag/selection states, etc.
 * • Zod‑based schema gives auto‑generated, type‑checked Inspector controls.
 * • Dynamic sizing is driven directly by node data (expandedSize / collapsedSize).
 * • All data handling is funnelled through one formatter (formatValue) to avoid duplication.
 * • Strict separation of responsibilities:
 *     – createDynamicSpec: returns a NodeSpec based only on data               (pure)
 *     – ViewTextNode:      deals with React‑Flow store & data propagation       (impure)
 * • Memoised helpers & refs prevent unnecessary renders / infinite loops.
 */

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
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
import { type NodeProps, useReactFlow } from "@xyflow/react";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const ViewTextDataSchema = z
	.object({
		store: SafeSchemas.text(""),
		isEnabled: SafeSchemas.boolean(true),
		isActive: SafeSchemas.boolean(false),
		isExpanded: SafeSchemas.boolean(false),
		inputs: SafeSchemas.optionalText(),
		outputs: SafeSchemas.optionalText(),
		expandedSize: SafeSchemas.text("VE2"),
		collapsedSize: SafeSchemas.text("C2"),
	})
	.passthrough();

export type ViewTextData = z.infer<typeof ViewTextDataSchema>;

const validateNodeData = createNodeValidator(ViewTextDataSchema, "ViewText");

// -----------------------------------------------------------------------------
// 2️⃣  Helper – format any value into a display‑ready string (re‑used everywhere)
// -----------------------------------------------------------------------------

const COMMON_OBJECT_PROPS = [
	"text",
	"output",
	"value",
	"data",
	"content",
	"message",
	"result",
	"response",
	"body",
	"payload",
	"input",
] as const;

type Primitive = string | number | boolean | bigint | symbol | null | undefined;

function formatValue(value: unknown): string {
	// ── Primitives ──────────────────────────────────────────────────────────────
	if (value === null || value === undefined || value === false || value === "" || value === 0)
		return "";

	if (typeof value !== "object") return String(value);

	// ── Objects / Arrays ────────────────────────────────────────────────────────
	if (Array.isArray(value)) {
		if (value.length === 0) return "";
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return "[Array]";
		}
	}

	if (value instanceof Date) return value.toISOString();
	if (value instanceof RegExp) return value.toString();
	if (value instanceof Error) return `Error: ${value.message}`;
	if (value instanceof Map)
		return value.size ? JSON.stringify(Array.from(value.entries()), null, 2) : "";
	if (value instanceof Set) return value.size ? JSON.stringify(Array.from(value), null, 2) : "";
	if (value instanceof Promise) return "[Promise]";

	// Plain object – try common prop names first
	for (const prop of COMMON_OBJECT_PROPS) {
		const inner = (value as Record<string, unknown>)[prop];
		if (inner !== undefined && inner !== null) return formatValue(inner);
	}

	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return "[Object]";
	}
}

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

function createDynamicSpec(data: ViewTextData): NodeSpec {
	const expanded =
		EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] || EXPANDED_SIZES.VE2;
	const collapsed =
		COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] || COLLAPSED_SIZES.C2;

	return {
		kind: "viewText",
		displayName: "View Text",
		label: "View Text",
		category: CATEGORIES.VIEW,
		size: { expanded, collapsed },
		handles: [
			{ id: "json-input", code: "j", position: "top", type: "target", dataType: "JSON" },
			{ id: "output", code: "s", position: "right", type: "source", dataType: "String" },
			{ id: "input", code: "s", position: "left", type: "target", dataType: "String" },
		],
		inspector: { key: "ViewTextInspector" },
		version: 1,
		runtime: { execute: "viewText_execute_v1" },
		initialData: createSafeInitialData(ViewTextDataSchema),
		dataSchema: ViewTextDataSchema,
		controls: {
			autoGenerate: true,
			excludeFields: ["isActive", "inputs", "outputs", "expandedSize", "collapsedSize"],
			customFields: [{ key: "isExpanded", type: "boolean", label: "Expand" }],
		},
		icon: "LuFileText",
		author: "Agenitix Team",
		description: "Displays & formats text content from connected nodes",
		feature: "base",
		tags: ["display", "formatting"],
		receivedData: {
			enabled: true,
			displayMode: "formatted",
			showInCollapsed: true,
			formatData: formatValue,
		},
	};
}

// Static spec for registry (default sizes)
export const spec: NodeSpec = createDynamicSpec({
	expandedSize: "VE2",
	collapsedSize: "C2",
} as ViewTextData);

// -----------------------------------------------------------------------------
// 4️⃣  Styles (internal content only – theme comes from scaffold)
// -----------------------------------------------------------------------------

const CONTENT = {
	expanded: "p-4 w-full h-full flex flex-col",
	collapsed: "flex items-center justify-center w-full h-full",
	header: "flex items-center justify-between mb-3",
	body: "flex-1 flex items-center justify-center",
} as const;

const CATEGORY_TEXT = {
	VIEW: {
		primary: "text-[--node-view-text]",
	},
	CREATE: {
		primary: "text-[--node-create-text]",
	},
	// …add others as needed
} as const;

// -----------------------------------------------------------------------------
// 5️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const ViewTextNode = memo(({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
	// Sync with React‑Flow store
	const { nodeData, updateNodeData } = useNodeData(id, data);
	const { getNodes, getEdges } = useReactFlow();

	// Derived state -------------------------------------------------------------
	const isExpanded = (nodeData as ViewTextData).isExpanded || false;
	const categoryStyles = CATEGORY_TEXT.VIEW;

	// Helpers -------------------------------------------------------------------
	const lastInputRef = useRef<string | null>(null);
	const lastOutputRef = useRef<string | null>(null);

	/** Toggle between collapsed / expanded */
	const toggleExpand = useCallback(() => {
		updateNodeData({ isExpanded: !isExpanded });
	}, [isExpanded, updateNodeData]);

	/** Propagate output ONLY when node is active */
	const propagate = useCallback(
		(value: string | null) => {
			const shouldSend = (nodeData as ViewTextData).isActive;
			const out = shouldSend ? value : null;
			if (out !== lastOutputRef.current) {
				lastOutputRef.current = out;
				updateNodeData({ outputs: out });
			}
		},
		[nodeData, updateNodeData]
	);

	/** Clear JSON‑ish fields when inactive */
	const blockJsonWhenInactive = useCallback(() => {
		if (!(nodeData as ViewTextData).isActive) {
			updateNodeData({ json: null, data: null, payload: null, result: null, response: null });
		}
	}, [nodeData, updateNodeData]);

	// Main effect – watch upstream nodes & compute text -------------------------
	useEffect(() => {
		const nodes = getNodes();
		const edges = getEdges().filter((e) => e.target === id);

		const connected = edges
			.map((e) => nodes.find((n) => n.id === e.source))
			.filter(Boolean) as typeof nodes;

		// Enhanced input processing with meaningful content validation
		const texts = connected
			.filter((n) => {
				// Only accept content from active source nodes
				const sourceIsActive = n.data?.isActive === true;
				if (!sourceIsActive) return false;

				// Get text from source node
				let nodeText = "";
				if (n.data?.output !== undefined) {
					nodeText = formatValue(n.data.output);
				} else if (n.data?.store !== undefined) {
					nodeText = formatValue(n.data.store);
				} else {
					nodeText = formatValue(n.data);
				}

				// Check if content is meaningful (not default values)
				const isDefaultText =
					nodeText === "Default text" ||
					nodeText === "No connected inputs" ||
					nodeText === "Empty input";
				const hasMeaningfulContent = nodeText && nodeText.trim().length > 0 && !isDefaultText;

				return hasMeaningfulContent;
			})
			.map((n) => {
				// Get the meaningful text
				if (n.data?.output !== undefined) {
					return formatValue(n.data.output);
				} else if (n.data?.store !== undefined) {
					return formatValue(n.data.store);
				} else {
					return formatValue(n.data);
				}
			})
			.filter((t) => t.trim().length > 0);

		const joined = texts.join("");

		if (joined !== lastInputRef.current) {
			lastInputRef.current = joined;

			const hasContent = joined.trim().length > 0;
			const hasConnectedInputs = connected.length > 0;
			const active = hasConnectedInputs && hasContent;

			updateNodeData({
				inputs: hasConnectedInputs ? joined || "No inputs" : "No inputs",
				store: hasContent ? joined : "No inputs",
				isActive: active,
			});

			propagate(active ? joined : null);
			blockJsonWhenInactive();
		}
	}, [getEdges, getNodes, id, propagate, blockJsonWhenInactive, updateNodeData]);

	// Validate ------------------------------------------------------------------
	const validation = validateNodeData(nodeData);
	if (!validation.success) {
		reportValidationError("ViewText", id, validation.errors, {
			originalData: validation.originalData,
			component: "ViewTextNode",
		});
	}

	useNodeDataValidation(ViewTextDataSchema, "ViewText", validation.data, id);

	// Render --------------------------------------------------------------------
	return (
		<>
			{/* Editable label or icon */}
			{!isExpanded && spec.size.collapsed.width === 60 && spec.size.collapsed.height === 60 ? (
				<div className="absolute inset-0 flex justify-center text-lg p-1 text-foreground/80">
					{spec.icon && renderLucideIcon(spec.icon, "", 16)}
				</div>
			) : (
				<LabelNode nodeId={id} label={spec.displayName} />
			)}

			{!isExpanded ? (
				<div className={CONTENT.collapsed}>
					{spec.receivedData?.showInCollapsed && validation.data.store !== "No inputs" ? (
						<div
							className={`  text-xs text-center w-[100px] h-[80px] overflow-y-auto nowheel  ${categoryStyles.primary}`}
						>
							{validation.data.store || "..."}
						</div>
					) : (
						<div className={`text-xs font-medium tracking-wide ${categoryStyles.primary}`}>...</div>
					)}
				</div>
			) : (
				<div className={CONTENT.expanded}>
					<div className={CONTENT.body}>
						<div className="text-xs font-normal text-center break-words whitespace-pre-line">
							{validation.data.store || "No inputs"}
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

const ViewTextNodeWithDynamicSpec = (props: NodeProps) => {
	const { nodeData } = useNodeData(props.id, props.data);

	const dynamicSpec = useMemo(
		() => createDynamicSpec(nodeData as ViewTextData),
		[nodeData.expandedSize, nodeData.collapsedSize]
	);

	return withNodeScaffold(dynamicSpec, (p) => <ViewTextNode {...p} spec={dynamicSpec} />)(props);
};

export default ViewTextNodeWithDynamicSpec;
