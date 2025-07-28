/**
 * storeInMemory NODE – Runtime memory storage for workflow data
 *
 * • Stores data in memory during workflow execution
 * • Provides get/set operations for temporary data storage
 * • Auto-clears on workflow restart or page refresh
 * • Type-safe with Zod schema validation
 * • Supports multiple data types (string, number, boolean, JSON)
 *
 * Keywords: storage, memory, runtime, temporary, workflow-data
 */

import type { NodeProps } from "@xyflow/react";
import { type ChangeEvent, memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
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
// 1️⃣  In-Memory Storage System
// -----------------------------------------------------------------------------

/**
 * Global in-memory storage for the current session
 * This will be cleared on page refresh or workflow restart
 */
class InMemoryStorage {
	private static instance: InMemoryStorage;
	private storage: Map<string, any> = new Map();

	static getInstance(): InMemoryStorage {
		if (!InMemoryStorage.instance) {
			InMemoryStorage.instance = new InMemoryStorage();
		}
		return InMemoryStorage.instance;
	}

	set(key: string, value: any): void {
		this.storage.set(key, value);
	}

	get(key: string): any {
		return this.storage.get(key);
	}

	has(key: string): boolean {
		return this.storage.has(key);
	}

	delete(key: string): boolean {
		return this.storage.delete(key);
	}

	clear(): void {
		this.storage.clear();
	}

	keys(): string[] {
		return Array.from(this.storage.keys());
	}

	size(): number {
		return this.storage.size;
	}
}

// -----------------------------------------------------------------------------
// 2️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const StoreInMemoryDataSchema = z
	.object({
		key: z.string().default("myKey"),
		value: z.string().default(""),
		operation: z.enum(["set", "get", "delete", "clear"]).default("set"),
		dataType: z.enum(["string", "number", "boolean", "json"]).default("string"),
		isEnabled: SafeSchemas.boolean(true),
		isActive: SafeSchemas.boolean(false),
		isExpanded: SafeSchemas.boolean(false),
		inputs: SafeSchemas.optionalText().nullable().default(null),
		outputs: SafeSchemas.optionalText(),
		output: SafeSchemas.optionalText(), // For compatibility with viewText
		expandedSize: SafeSchemas.text("VE1"),
		collapsedSize: SafeSchemas.text("C1W"),
		// Storage status
		storageStatus: SafeSchemas.text("ready"), // ready, stored, retrieved, deleted, cleared
		lastOperation: SafeSchemas.text(""),
	})
	.passthrough();

export type StoreInMemoryData = z.infer<typeof StoreInMemoryDataSchema>;

const validateNodeData = createNodeValidator(StoreInMemoryDataSchema, "StoreInMemory");

// -----------------------------------------------------------------------------
// 3️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
	CREATE: {
		primary: "text-[--node-create-text]",
	},
} as const;

const CONTENT = {
	expanded: "p-4 w-full h-full flex flex-col",
	collapsed: "flex items-center justify-center w-full h-full",
	header: "flex items-center justify-between mb-3",
	body: "flex-1 flex flex-col gap-2",
	disabled: "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// -----------------------------------------------------------------------------
// 4️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

function createDynamicSpec(data: StoreInMemoryData): NodeSpec {
	const expanded =
		EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ?? EXPANDED_SIZES.VE1;
	const collapsed =
		COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ?? COLLAPSED_SIZES.C1W;

	return {
		kind: "storeInMemory",
		displayName: "Store In Memory",
		label: "Memory Store",
		category: CATEGORIES.CREATE,
		size: { expanded, collapsed },
		handles: [
			{
				id: "trigger-input",
				code: "t",
				position: "top",
				type: "target",
				dataType: "Boolean",
			},
			{
				id: "value-input",
				code: "v",
				position: "left",
				type: "target",
				dataType: "String",
			},
			{
				id: "output",
				code: "o",
				position: "right",
				type: "source",
				dataType: "String",
			},
			{
				id: "status-output",
				code: "s",
				position: "bottom",
				type: "source",
				dataType: "String",
			},
		],
		inspector: { key: "StoreInMemoryInspector" },
		version: 1,
		runtime: { execute: "storeInMemory_execute_v1" },
		initialData: createSafeInitialData(StoreInMemoryDataSchema, {
			key: "myKey",
			value: "",
			operation: "set",
			dataType: "string",
			inputs: null,
			outputs: "",
			output: "",
			storageStatus: "ready",
			lastOperation: "",
		}),
		dataSchema: StoreInMemoryDataSchema,
		controls: {
			autoGenerate: true,
			excludeFields: [
				"isActive",
				"inputs",
				"outputs",
				"output",
				"expandedSize",
				"collapsedSize",
				"storageStatus",
				"lastOperation",
			],
			customFields: [
				{ key: "isEnabled", type: "boolean", label: "Enable" },
				{
					key: "key",
					type: "text",
					label: "Storage Key",
					placeholder: "Enter storage key...",
				},
				{
					key: "value",
					type: "textarea",
					label: "Value",
					placeholder: "Enter value to store...",
					ui: { rows: 3 },
				},
				{
					key: "operation",
					type: "select",
					label: "Operation",
				},
				{
					key: "dataType",
					type: "select",
					label: "Data Type",
				},
				{ key: "isExpanded", type: "boolean", label: "Expand" },
			],
		},
		icon: "LuDatabase",
		author: "Agenitix Team",
		description: "Stores data in memory during workflow execution with get/set operations",
		feature: "storage",
		tags: ["storage", "memory", "runtime", "temporary"],
		theming: {},
	};
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
	expandedSize: "VE1",
	collapsedSize: "C1W",
} as StoreInMemoryData);

// -----------------------------------------------------------------------------
// 5️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const StoreInMemoryNode = memo(({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
	// -------------------------------------------------------------------------
	// 5.1  Sync with React‑Flow store
	// -------------------------------------------------------------------------
	const { nodeData, updateNodeData } = useNodeData(id, data);

	// -------------------------------------------------------------------------
	// 5.2  Derived state
	// -------------------------------------------------------------------------
	const { isExpanded, isEnabled, key, value, operation, dataType, storageStatus } =
		nodeData as StoreInMemoryData;

	const categoryStyles = CATEGORY_TEXT.CREATE;
	const storage = InMemoryStorage.getInstance();

	// Global React‑Flow store (nodes & edges) – triggers re‑render on change
	const nodes = useStore((s) => s.nodes);
	const edges = useStore((s) => s.edges);

	// Keep last emitted output to avoid redundant writes
	const lastOutputRef = useRef<string | null>(null);

	// -------------------------------------------------------------------------
	// 5.3  Helper functions
	// -------------------------------------------------------------------------

	/** Convert value based on data type */
	const convertValue = useCallback((val: string, type: string): any => {
		if (!val) {
			return val;
		}

		switch (type) {
			case "number": {
				const num = Number(val);
				return Number.isNaN(num) ? val : num;
			}
			case "boolean":
				return val.toLowerCase() === "true" || val === "1";
			case "json":
				try {
					return JSON.parse(val);
				} catch {
					return val; // Return as string if JSON parsing fails
				}
			default:
				return val;
		}
	}, []);

	/** Format value for display */
	const formatValue = useCallback((val: any): string => {
		if (val === null || val === undefined) {
			return "";
		}
		if (typeof val === "object") {
			return JSON.stringify(val, null, 2);
		}
		return String(val);
	}, []);

	// -------------------------------------------------------------------------
	// 5.4  Storage operations
	// -------------------------------------------------------------------------

	/** Execute storage operation */
	const executeOperation = useCallback(() => {
		if (!(isEnabled && key.trim())) {
			return;
		}

		try {
			let result: any = "";
			let status = "ready";

			switch (operation) {
				case "set": {
					const convertedValue = convertValue(value, dataType);
					storage.set(key, convertedValue);
					result = formatValue(convertedValue);
					status = "stored";
					break;
				}

				case "get": {
					const retrievedValue = storage.get(key);
					result = formatValue(retrievedValue);
					status = retrievedValue !== undefined ? "retrieved" : "not_found";
					break;
				}

				case "delete": {
					const deleted = storage.delete(key);
					result = deleted ? "deleted" : "not_found";
					status = deleted ? "deleted" : "not_found";
					break;
				}

				case "clear":
					storage.clear();
					result = "cleared";
					status = "cleared";
					break;
			}

			updateNodeData({
				outputs: result,
				output: result, // For compatibility with viewText
				storageStatus: status,
				lastOperation: `${operation}:${key}`,
				isActive: true,
			});

			lastOutputRef.current = result;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : "Unknown error";
			updateNodeData({
				outputs: `Error: ${errorMsg}`,
				output: `Error: ${errorMsg}`, // For compatibility with viewText
				storageStatus: "error",
				lastOperation: `${operation}:${key} (failed)`,
				isActive: false,
			});
		}
	}, [
		isEnabled,
		key,
		value,
		operation,
		dataType,
		storage,
		convertValue,
		formatValue,
		updateNodeData,
	]);

	// -------------------------------------------------------------------------
	// 5.5  Callbacks
	// -------------------------------------------------------------------------

	/** Toggle between collapsed / expanded */
	const toggleExpand = useCallback(() => {
		updateNodeData({ isExpanded: !isExpanded });
	}, [isExpanded, updateNodeData]);

	/** Handle key change */
	const handleKeyChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			updateNodeData({ key: e.target.value });
		},
		[updateNodeData]
	);

	/** Handle value change */
	const handleValueChange = useCallback(
		(e: ChangeEvent<HTMLTextAreaElement>) => {
			updateNodeData({ value: e.target.value });
		},
		[updateNodeData]
	);

	/** Handle operation change */
	const handleOperationChange = useCallback(
		(e: ChangeEvent<HTMLSelectElement>) => {
			updateNodeData({ operation: e.target.value as any });
		},
		[updateNodeData]
	);

	/** Handle data type change */
	const handleDataTypeChange = useCallback(
		(e: ChangeEvent<HTMLSelectElement>) => {
			updateNodeData({ dataType: e.target.value as any });
		},
		[updateNodeData]
	);

	// -------------------------------------------------------------------------
	// 5.6  Effects
	// -------------------------------------------------------------------------

	/** Monitor inputs from connected nodes */
	useEffect(() => {
		const valueEdge = edges.find((e) => e.target === id && e.targetHandle === "value-input");

		// Check value input
		if (valueEdge) {
			const valueNode = nodes.find((n) => n.id === valueEdge.source);
			if (valueNode) {
				const inputValue =
					valueNode.data?.outputs ?? valueNode.data?.text ?? valueNode.data?.store ?? "";
				const newValue = String(inputValue || "");
				if (newValue !== value && newValue) {
					updateNodeData({ value: newValue });
				}
			}
		}
	}, [edges, nodes, id, value, updateNodeData]);

	/** Auto-execute on manual changes when enabled */
	useEffect(() => {
		if (isEnabled && key.trim()) {
			executeOperation();
		}
	}, [key, isEnabled, executeOperation]);

	// -------------------------------------------------------------------------
	// 5.7  Validation
	// -------------------------------------------------------------------------
	const validation = validateNodeData(nodeData);
	if (!validation.success) {
		reportValidationError("StoreInMemory", id, validation.errors, {
			originalData: validation.originalData,
			component: "StoreInMemoryNode",
		});
	}

	useNodeDataValidation(StoreInMemoryDataSchema, "StoreInMemory", validation.data, id);

	// -------------------------------------------------------------------------
	// 5.8  Status display helpers
	// -------------------------------------------------------------------------
	const getStatusColor = (status: string) => {
		switch (status) {
			case "stored":
				return "text-green-600";
			case "retrieved":
				return "text-blue-600";
			case "deleted":
				return "text-orange-600";
			case "cleared":
				return "text-purple-600";
			case "error":
				return "text-red-600";
			case "not_found":
				return "text-yellow-600";
			default:
				return "text-gray-600";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "stored":
				return "✓";
			case "retrieved":
				return "↓";
			case "deleted":
				return "✗";
			case "cleared":
				return "∅";
			case "error":
				return "!";
			case "not_found":
				return "?";
			default:
				return "○";
		}
	};

	// -------------------------------------------------------------------------
	// 5.9  Render
	// -------------------------------------------------------------------------
	return (
		<>
			{/* Editable label or icon */}
			<LabelNode nodeId={id} label={spec.displayName} />

			{isExpanded ? (
				<div className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}>
					<div className={CONTENT.header}>
						<span className="font-medium text-sm">Memory Storage</span>
						<div className={`text-xs ${getStatusColor(storageStatus)}`}>
							{getStatusIcon(storageStatus)} {storageStatus}
						</div>
					</div>

					<div className={CONTENT.body}>
						{/* Storage Key */}
						<div>
							<label htmlFor="storage-key" className="mb-1 block text-gray-600 text-xs">
								Key:
							</label>
							<input
								id="storage-key"
								type="text"
								value={key}
								onChange={handleKeyChange}
								placeholder="Storage key..."
								className={`w-full rounded border p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${categoryStyles.primary}`}
								disabled={!isEnabled}
							/>
						</div>

						{/* Operation */}
						<div>
							<label htmlFor="storage-operation" className="mb-1 block text-gray-600 text-xs">
								Operation:
							</label>
							<select
								id="storage-operation"
								value={operation}
								onChange={handleOperationChange}
								className="w-full rounded border p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
								disabled={!isEnabled}
							>
								<option value="set">Set Value</option>
								<option value="get">Get Value</option>
								<option value="delete">Delete Key</option>
								<option value="clear">Clear All</option>
							</select>
						</div>

						{/* Value (only show for set operation) */}
						{operation === "set" && (
							<>
								<div>
									<label htmlFor="storage-data-type" className="mb-1 block text-gray-600 text-xs">
										Data Type:
									</label>
									<select
										id="storage-data-type"
										value={dataType}
										onChange={handleDataTypeChange}
										className="w-full rounded border p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
										disabled={!isEnabled}
									>
										<option value="string">String</option>
										<option value="number">Number</option>
										<option value="boolean">Boolean</option>
										<option value="json">JSON</option>
									</select>
								</div>

								<div>
									<label htmlFor="storage-value" className="mb-1 block text-gray-600 text-xs">
										Value:
									</label>
									<textarea
										id="storage-value"
										value={value}
										onChange={handleValueChange}
										placeholder="Enter value to store..."
										className={`w-full resize-none rounded border p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${categoryStyles.primary}`}
										rows={3}
										disabled={!isEnabled}
									/>
								</div>
							</>
						)}

						{/* Storage Info */}
						<div className="mt-2 rounded bg-gray-50 p-2 text-gray-500 text-xs">
							<div>Keys in memory: {storage.size()}</div>
							{storage.size() > 0 && (
								<div className="mt-1">
									Keys: {storage.keys().slice(0, 3).join(", ")}
									{storage.size() > 3 && "..."}
								</div>
							)}
						</div>
					</div>
				</div>
			) : (
				<div className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled}`}>
					<div className="p-2 text-center">
						<div className={`font-mono text-xs ${categoryStyles.primary}`}>{key || "memory"}</div>
						<div className={`text-xs ${getStatusColor(storageStatus)}`}>
							{getStatusIcon(storageStatus)} {operation}
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

const StoreInMemoryNodeWithDynamicSpec = (props: NodeProps) => {
	const { nodeData } = useNodeData(props.id, props.data);

	// Recompute spec only when the size keys change
	const dynamicSpec = useMemo(() => createDynamicSpec(nodeData as StoreInMemoryData), [nodeData]);

	// Memoise the scaffolded component to keep focus
	const ScaffoldedNode = useMemo(
		() => withNodeScaffold(dynamicSpec, (p) => <StoreInMemoryNode {...p} spec={dynamicSpec} />),
		[dynamicSpec]
	);

	return <ScaffoldedNode {...props} />;
};

export default StoreInMemoryNodeWithDynamicSpec;
