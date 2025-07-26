/**
 * storeLocal NODE – Browser Local Storage Management
 *
 * • Provides comprehensive local storage operations: get, set, remove, clear, list keys
 * • Schema-driven with type-safe validation and auto-generated Inspector controls
 * • Supports JSON serialization/deserialization for complex data types
 * • Real-time storage monitoring and error handling
 * • Dynamic sizing and expandable UI for better UX
 *
 * Keywords: local-storage, browser-storage, data-persistence, storage-management
 */

import type { NodeProps } from "@xyflow/react";
import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { z } from "zod";

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
import { useStore } from "@xyflow/react";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

const StorageOperationSchema = z.enum([
    "get",
    "set",
    "remove",
    "clear",
    "keys",
    "length"
]);

export const StoreLocalDataSchema = z
    .object({
        operation: StorageOperationSchema.default("get"),
        key: SafeSchemas.text(""),
        value: SafeSchemas.text(""),
        parseJson: SafeSchemas.boolean(false),
        stringifyJson: SafeSchemas.boolean(false),
        isEnabled: SafeSchemas.boolean(true),
        isActive: SafeSchemas.boolean(false),
        isExpanded: SafeSchemas.boolean(false),
        inputs: SafeSchemas.optionalText().nullable().default(null),
        outputs: SafeSchemas.optionalText(""),
        error: SafeSchemas.optionalText().nullable().default(null),
        expandedSize: SafeSchemas.text("VE3"),
        collapsedSize: SafeSchemas.text("C2"),
    })
    .passthrough();

export type StoreLocalData = z.infer<typeof StoreLocalDataSchema>;

const validateNodeData = createNodeValidator(
    StoreLocalDataSchema,
    "StoreLocal",
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
    CREATE: {
        primary: "text-[--node-create-text]",
        success: "text-green-500",
        error: "text-red-500",
        warning: "text-yellow-500",
    },
    STORE: {
        primary: "text-[--node-store-text]",
        success: "text-green-500",
        error: "text-red-500",
        warning: "text-yellow-500",
    },
} as const;

const CONTENT = {
    expanded: "p-4 w-full h-full flex flex-col",
    collapsed: "flex items-center justify-center w-full h-full",
    header: "flex items-center justify-between mb-3",
    body: "flex-1 flex flex-col gap-2",
    disabled: "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
    input: "resize-none nowheel bg-background rounded-md p-2 text-xs border focus:outline-none focus:ring-1 focus:ring-white-500",
    select: "nowheel bg-background rounded-md p-2 text-xs border focus:outline-none focus:ring-1 focus:ring-white-500",
    button: "px-3 py-1 text-xs rounded-md border transition-colors hover:bg-accent",
    status: "text-xs p-2 rounded-md border",
} as const;

const OPERATION_LABELS = {
    get: "Get Value",
    set: "Set Value",
    remove: "Remove Key",
    clear: "Clear All",
    keys: "List Keys",
    length: "Storage Length"
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Storage utilities
// -----------------------------------------------------------------------------

const StorageUtils = {
    isAvailable(): boolean {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    },

    get(key: string, parseJson: boolean = false): string | null {
        try {
            const value = localStorage.getItem(key);
            if (value === null) return null;

            if (parseJson) {
                try {
                    return JSON.stringify(JSON.parse(value), null, 2);
                } catch {
                    return value; // Return as-is if JSON parsing fails
                }
            }
            return value;
        } catch (error) {
            throw new Error(`Failed to get item: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    set(key: string, value: string, stringifyJson: boolean = false): void {
        try {
            let finalValue = value;

            if (stringifyJson) {
                try {
                    // Try to parse and re-stringify to validate JSON
                    JSON.parse(value);
                    finalValue = value;
                } catch {
                    // If not valid JSON, stringify as string
                    finalValue = JSON.stringify(value);
                }
            }

            localStorage.setItem(key, finalValue);
        } catch (error) {
            throw new Error(`Failed to set item: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    remove(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            throw new Error(`Failed to remove item: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    clear(): void {
        try {
            localStorage.clear();
        } catch (error) {
            throw new Error(`Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    keys(): string[] {
        try {
            return Object.keys(localStorage);
        } catch (error) {
            throw new Error(`Failed to get keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    length(): number {
        try {
            return localStorage.length;
        } catch (error) {
            throw new Error(`Failed to get length: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};

// -----------------------------------------------------------------------------
// 4️⃣  Dynamic spec factory
// -----------------------------------------------------------------------------

function createDynamicSpec(data: StoreLocalData): NodeSpec {
    const expanded =
        EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
        EXPANDED_SIZES.VE2;
    const collapsed =
        COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
        COLLAPSED_SIZES.C1W;

    return {
        kind: "storeLocal",
        displayName: "Local Storage",
        label: "Local Storage",
        category: CATEGORIES.STORE,
        size: { expanded, collapsed },
        handles: [
            {
                id: "input",
                code: "s",
                position: "left",
                type: "target",
                dataType: "String",
            },
            {
                id: "output",
                code: "s",
                position: "right",
                type: "source",
                dataType: "String",
            },
        ],
        inspector: { key: "StoreLocalInspector" },
        version: 1,
        runtime: { execute: "storeLocal_execute_v1" },
        initialData: createSafeInitialData(StoreLocalDataSchema, {
            operation: "get",
            key: "",
            value: "",
            parseJson: false,
            stringifyJson: false,
            inputs: null,
            outputs: "",
            error: null,
        }),
        dataSchema: StoreLocalDataSchema,
        controls: {
            autoGenerate: true,
            excludeFields: [
                "isActive",
                "inputs",
                "outputs",
                "error",
                "expandedSize",
                "collapsedSize",
            ],
            customFields: [
                { key: "isEnabled", type: "boolean", label: "Enable" },
                {
                    key: "operation",
                    type: "select",
                    label: "Operation",
                    validation: {
                        options: [
                            { value: "get", label: "Get Value" },
                            { value: "set", label: "Set Value" },
                            { value: "remove", label: "Remove Key" },
                            { value: "clear", label: "Clear All" },
                            { value: "keys", label: "List Keys" },
                            { value: "length", label: "Storage Length" },
                        ]
                    }
                },
                { key: "key", type: "text", label: "Storage Key" },
                { key: "value", type: "textarea", label: "Value", ui: { rows: 3 } },
                { key: "parseJson", type: "boolean", label: "Parse JSON Output" },
                { key: "stringifyJson", type: "boolean", label: "Stringify JSON Input" },
                { key: "isExpanded", type: "boolean", label: "Expand" },
            ],
        },
        icon: "LuDatabase",
        author: "Agenitix Team",
        description: "Manage browser local storage with get, set, remove, clear, and list operations",
        feature: "database",
        tags: ["storage", "persistence", "browser", "local-storage"],
        theming: {},
    };
}

/** Static spec for registry */
export const spec: NodeSpec = createDynamicSpec({
    expandedSize: "VE3",
    collapsedSize: "C2",
} as StoreLocalData);

// -----------------------------------------------------------------------------
// 5️⃣  React component
// -----------------------------------------------------------------------------

const StoreLocalNode = memo(
    ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
        // -------------------------------------------------------------------------
        // 5.1  State and data management
        // -------------------------------------------------------------------------
        const { nodeData, updateNodeData } = useNodeData(id, data);
        const {
            operation,
            key,
            value,
            parseJson,
            stringifyJson,
            isExpanded,
            isEnabled,
            isActive,
            error,
        } = nodeData as StoreLocalData;

        const categoryStyles = CATEGORY_TEXT.STORE;
        const nodes = useStore((s) => s.nodes);
        const edges = useStore((s) => s.edges);
        const lastOutputRef = useRef<string | null>(null);

        // Local state for real-time storage info
        const [storageInfo, setStorageInfo] = useState<{
            available: boolean;
            keyCount: number;
        }>({ available: false, keyCount: 0 });

        // -------------------------------------------------------------------------
        // 5.2  Storage operations
        // -------------------------------------------------------------------------

        const executeOperation = useCallback(async () => {
            if (!isEnabled || !StorageUtils.isAvailable()) {
                updateNodeData({ error: "Local storage not available" });
                return;
            }

            try {
                let result: string | null = null;

                switch (operation) {
                    case "get":
                        if (!key.trim()) {
                            throw new Error("Key is required for get operation");
                        }
                        const retrievedValue = StorageUtils.get(key, parseJson);
                        result = retrievedValue !== null
                            ? `✅ Retrieved "${key}": ${retrievedValue}`
                            : `❌ Key "${key}" not found in storage`;
                        break;

                    case "set":
                        if (!key.trim()) {
                            throw new Error("Key is required for set operation");
                        }
                        StorageUtils.set(key, value, stringifyJson);
                        result = `✅ Successfully stored "${key}": ${value}`;
                        break;

                    case "remove":
                        if (!key.trim()) {
                            throw new Error("Key is required for remove operation");
                        }
                        StorageUtils.remove(key);
                        result = `✅ Successfully removed key "${key}" from storage`;
                        break;

                    case "clear":
                        const clearedCount = StorageUtils.keys().length;
                        StorageUtils.clear();
                        result = `✅ Successfully cleared storage (removed ${clearedCount} keys)`;
                        break;

                    case "keys":
                        const allKeys = StorageUtils.keys();
                        result = `📋 Storage contains ${allKeys.length} keys:\n${JSON.stringify(allKeys, null, 2)}`;
                        break;

                    case "length":
                        const count = StorageUtils.length();
                        result = `📊 Storage contains ${count} key${count !== 1 ? 's' : ''}`;
                        break;
                }

                updateNodeData({
                    error: null,
                    isActive: true
                });
                propagate(result);

                // Update storage info
                setStorageInfo({
                    available: true,
                    keyCount: StorageUtils.keys().length
                });

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error";
                updateNodeData({
                    error: errorMessage,
                    isActive: false
                });
                propagate(null);
            }
        }, [operation, key, value, parseJson, stringifyJson, isEnabled, updateNodeData]);

        // -------------------------------------------------------------------------
        // 5.3  Input handling
        // -------------------------------------------------------------------------

        /** Compute the latest input from connected node */
        const computeInput = useCallback((): string | null => {
            const incoming = edges.find((e) => e.target === id);
            if (!incoming) return null;

            const src = nodes.find((n) => n.id === incoming.source);
            if (!src) return null;

            // priority: outputs ➜ store ➜ whole data
            const inputValue = src.data?.outputs ?? src.data?.store ?? src.data;
            return typeof inputValue === 'string' ? inputValue : String(inputValue || '');
        }, [edges, nodes, id]);

        // -------------------------------------------------------------------------
        // 5.4  Event handlers
        // -------------------------------------------------------------------------

        const toggleExpand = useCallback(() => {
            updateNodeData({ isExpanded: !isExpanded });
        }, [isExpanded, updateNodeData]);

        const handleKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            updateNodeData({ key: e.target.value });
        }, [updateNodeData]);

        const handleValueChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
            updateNodeData({ value: e.target.value });
        }, [updateNodeData]);

        const handleOperationChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
            updateNodeData({ operation: e.target.value as any });
        }, [updateNodeData]);

        /** Propagate output ONLY when node is active AND enabled */
        const propagate = useCallback(
            (value: string | null) => {
                const shouldSend = isActive && isEnabled;
                const out = shouldSend ? value : null;
                if (out !== lastOutputRef.current) {
                    lastOutputRef.current = out;
                    updateNodeData({ outputs: out });
                }
            },
            [isActive, isEnabled, updateNodeData],
        );

        // -------------------------------------------------------------------------
        // 5.5  Effects
        // -------------------------------------------------------------------------

        /* 🔄 Whenever nodes/edges change, recompute inputs. */
        useEffect(() => {
            const inputVal = computeInput();
            if (inputVal !== (nodeData as StoreLocalData).inputs) {
                updateNodeData({ inputs: inputVal });
            }
        }, [computeInput, nodeData, updateNodeData]);

        /* 🔄 Make isEnabled dependent on input value only when there are connections. */
        useEffect(() => {
            const hasInput = (nodeData as StoreLocalData).inputs;
            // Only auto-control isEnabled when there are connections (inputs !== null)
            // When inputs is null (no connections), let user manually control isEnabled
            if (hasInput !== null) {
                const nextEnabled = hasInput && hasInput.trim().length > 0;
                if (nextEnabled !== isEnabled) {
                    updateNodeData({ isEnabled: nextEnabled });
                }
            }
        }, [nodeData, isEnabled, updateNodeData]);

        // Check storage availability on mount (client-side only)
        useEffect(() => {
            // Only run on client side to avoid hydration mismatch
            if (typeof window !== 'undefined') {
                const available = StorageUtils.isAvailable();
                setStorageInfo({
                    available,
                    keyCount: available ? StorageUtils.keys().length : 0
                });
            }
        }, []);

        // Auto-execute operations when enabled and active
        useEffect(() => {
            if (isEnabled && isActive) {
                executeOperation();
            }
        }, [isEnabled, isActive, executeOperation]);

        // Monitor inputs and update active state
        useEffect(() => {
            const inputValue = (nodeData as StoreLocalData).inputs;
            const hasValidInput = inputValue && inputValue.trim().length > 0;
            const hasValidKey = key.trim().length > 0;

            // Use input as key if available, otherwise use manual key
            const effectiveKey = hasValidInput ? inputValue : key;

            // For operations that need a key, check if we have one
            const needsKey = ["get", "set", "remove"].includes(operation);
            const hasValidValue = value.trim().length > 0;

            let canExecute = true;
            if (needsKey && !effectiveKey.trim()) {
                canExecute = false;
            }
            // For set operation, also need a value
            if (operation === "set" && !hasValidValue) {
                canExecute = false;
            }

            // Update the key field if we have input
            if (hasValidInput && effectiveKey !== key) {
                updateNodeData({ key: effectiveKey });
            }

            if (isEnabled && canExecute) {
                if (isActive !== true) {
                    updateNodeData({ isActive: true });
                }
            } else {
                if (isActive !== false) {
                    updateNodeData({ isActive: false });
                }
            }
        }, [nodeData, key, operation, isEnabled, isActive, updateNodeData]);

        // Sync outputs with active and enabled state
        useEffect(() => {
            const currentOutputs = (nodeData as StoreLocalData).outputs;
            propagate(currentOutputs || null);
        }, [isActive, isEnabled, nodeData, propagate]);

        // -------------------------------------------------------------------------
        // 5.6  Validation
        // -------------------------------------------------------------------------

        const validation = validateNodeData(nodeData);
        if (!validation.success) {
            reportValidationError("StoreLocal", id, validation.errors, {
                originalData: validation.originalData,
                component: "StoreLocalNode",
            });
        }

        useNodeDataValidation(
            StoreLocalDataSchema,
            "StoreLocal",
            validation.data,
            id,
        );

        // -------------------------------------------------------------------------
        // 5.7  Render helpers
        // -------------------------------------------------------------------------

        const renderStatus = () => {
            if (error) {
                return (
                    <div className={`${CONTENT.status} border-red-200 bg-red-50 dark:bg-red-900/20 ${categoryStyles.error}`}>
                        Error: {error}
                    </div>
                );
            }

            if (!storageInfo.available) {
                return (
                    <div className={`${CONTENT.status} border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 ${categoryStyles.warning}`}>
                        Local storage not available
                    </div>
                );
            }

            return (
                <div className={`${CONTENT.status} border-green-200 bg-green-50 dark:bg-green-900/20 ${categoryStyles.success}`}>
                    Storage: {storageInfo.keyCount} keys
                </div>
            );
        };

        // -------------------------------------------------------------------------
        // 5.8  Render
        // -------------------------------------------------------------------------

        return (
            <>
                {/* Label */}
                {!isExpanded &&
                    spec.size.collapsed.width === 60 &&
                    spec.size.collapsed.height === 60 ? (
                    <div className="absolute inset-0 flex justify-center text-lg p-1 text-foreground/80">
                        {spec.icon && renderLucideIcon(spec.icon, "", 16)}
                    </div>
                ) : (
                    <LabelNode nodeId={id} label={spec.displayName} />
                )}

                {!isExpanded ? (
                    /* Collapsed view */
                    <div className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ''}`}>
                        <div className="flex flex-col items-center gap-1 p-2">
                            <div className="text-xs font-medium">{OPERATION_LABELS[operation]}</div>
                            {key && <div className="text-xs text-muted-foreground truncate max-w-full">{key}</div>}
                            <div className="text-xs text-muted-foreground">{storageInfo.keyCount} keys</div>
                        </div>
                    </div>
                ) : (
                    /* Expanded view */
                    <div className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ''}`}>
                        <div className={CONTENT.body}>
                            {/* Operation selector */}
                            <div>
                                <label className="text-xs font-medium mb-1 block">Operation</label>
                                <select
                                    value={operation}
                                    onChange={handleOperationChange}
                                    className={CONTENT.select}
                                    disabled={!isEnabled}
                                >
                                    {Object.entries(OPERATION_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Key input (for operations that need it) */}
                            {["get", "set", "remove"].includes(operation) && (
                                <div>
                                    <label className="text-xs font-medium mb-1 block">Storage Key</label>
                                    <input
                                        type="text"
                                        value={key}
                                        onChange={handleKeyChange}
                                        placeholder="Enter storage key..."
                                        className={CONTENT.input}
                                        disabled={!isEnabled}
                                    />
                                </div>
                            )}

                            {/* Value input (for set operation) */}
                            {operation === "set" && (
                                <div>
                                    <label className="text-xs font-medium mb-1 block">Value</label>
                                    <textarea
                                        value={value}
                                        onChange={handleValueChange}
                                        placeholder="Enter value to store..."
                                        className={`${CONTENT.input} h-16`}
                                        disabled={!isEnabled}
                                    />
                                </div>
                            )}

                            {/* JSON options */}
                            {(operation === "get" || operation === "set") && (
                                <div className="flex gap-4 text-xs">
                                    {operation === "get" && (
                                        <label className="flex items-center gap-1">
                                            <input
                                                type="checkbox"
                                                checked={parseJson}
                                                onChange={(e) => updateNodeData({ parseJson: e.target.checked })}
                                                disabled={!isEnabled}
                                            />
                                            Parse JSON
                                        </label>
                                    )}
                                    {operation === "set" && (
                                        <label className="flex items-center gap-1">
                                            <input
                                                type="checkbox"
                                                checked={stringifyJson}
                                                onChange={(e) => updateNodeData({ stringifyJson: e.target.checked })}
                                                disabled={!isEnabled}
                                            />
                                            Stringify JSON
                                        </label>
                                    )}
                                </div>
                            )}

                            {/* Execute button for write operations */}
                            {["set", "remove", "clear"].includes(operation) && (
                                <button
                                    onClick={executeOperation}
                                    className={`${CONTENT.button} bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed`}
                                    disabled={!isEnabled || (operation !== "clear" && !key.trim())}
                                >
                                    Execute {OPERATION_LABELS[operation]}
                                </button>
                            )}

                            {/* Status */}
                            {renderStatus()}
                        </div>
                    </div>
                )}

                <ExpandCollapseButton
                    showUI={isExpanded}
                    onToggle={toggleExpand}
                    size="sm"
                />
            </>
        );
    },
);

// -----------------------------------------------------------------------------
// 6️⃣  Dynamic spec wrapper
// -----------------------------------------------------------------------------

const StoreLocalNodeWithDynamicSpec = (props: NodeProps) => {
    const { nodeData } = useNodeData(props.id, props.data);

    const dynamicSpec = useMemo(
        () => createDynamicSpec(nodeData as StoreLocalData),
        [
            (nodeData as StoreLocalData).expandedSize,
            (nodeData as StoreLocalData).collapsedSize,
        ],
    );

    const ScaffoldedNode = useMemo(
        () =>
            withNodeScaffold(dynamicSpec, (p) => (
                <StoreLocalNode {...p} spec={dynamicSpec} />
            )),
        [dynamicSpec],
    );

    return <ScaffoldedNode {...props} />;
};

export default StoreLocalNodeWithDynamicSpec;