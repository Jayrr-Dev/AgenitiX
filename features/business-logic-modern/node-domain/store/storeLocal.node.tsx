/**
 * StoreLocal NODE – Enhanced localStorage management with store/delete modes
 *
 * • Provides visual interface for storing and deleting data in browser localStorage
 * • Supports complex objects with proper serialization and type safety
 * • Features pulse-triggered operations and mode switching (Store/Delete)
 * • Includes comprehensive error handling and visual feedback
 * • Uses findEdgeByHandle utility for robust React Flow edge handling
 * • Code follows current React + TypeScript best practices with full Zod validation
 *
 * Keywords: localStorage, store-delete-modes, pulse-triggered, type-safe
 */

import type { NodeProps } from "@xyflow/react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
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
import { useNodeFeatureFlag } from "@/features/business-logic-modern/infrastructure/node-core/useNodeFeatureFlag";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";
import { useStore } from "@xyflow/react";
import { findEdgeByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";

// -----------------------------------------------------------------------------
// 1️⃣  Enhanced data schema & validation
// -----------------------------------------------------------------------------

export const StoreLocalDataSchema = z
  .object({
    // Core functionality
    mode: z.enum(["store", "delete"]).default("store"),
    inputData: z.record(z.unknown()).nullable().default(null),
    triggerInput: z.boolean().default(false),
    lastTriggerState: z.boolean().default(false),
    
    // Status and feedback
    isProcessing: z.boolean().default(false),
    lastOperation: z.enum(["none", "store", "delete"]).default("none"),
    lastOperationSuccess: z.boolean().default(false),
    lastOperationTime: z.number().optional(),
    operationMessage: z.string().default(""),
    
    // UI state (existing)
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C2"),
    label: z.string().optional(),
    
    // Outputs
    statusOutput: z.boolean().default(false),
  })
  .passthrough();

export type StoreLocalData = z.infer<typeof StoreLocalDataSchema>;

const validateNodeData = createNodeValidator(
  StoreLocalDataSchema,
  "StoreLocal",
);

// -----------------------------------------------------------------------------
// 2️⃣  LocalStorage Operations Utility
// -----------------------------------------------------------------------------

interface LocalStorageOperationResult {
  success: boolean;
  message: string;
  keysProcessed: string[];
  errors: Array<{ key: string; error: string }>;
}

interface LocalStorageDeleteResult {
  success: boolean;
  message: string;
  keysDeleted: string[];
  keysNotFound: string[];
}

const createLocalStorageOperations = () => {
  const isAvailable = (): boolean => {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  };

  const store = (data: Record<string, unknown>): LocalStorageOperationResult => {
    const result: LocalStorageOperationResult = {
      success: true,
      message: "",
      keysProcessed: [],
      errors: [],
    };

    if (!isAvailable()) {
      result.success = false;
      result.message = "localStorage is not available";
      return result;
    }

    if (!data || Object.keys(data).length === 0) {
      result.success = false;
      result.message = "No data provided to store";
      return result;
    }

    for (const [key, value] of Object.entries(data)) {
      try {
        let serializedValue: string;
        
        if (typeof value === "string") {
          serializedValue = JSON.stringify(value);
        } else if (typeof value === "number" || typeof value === "boolean") {
          serializedValue = String(value);
        } else if (value === null || value === undefined) {
          serializedValue = String(value);
        } else {
          serializedValue = JSON.stringify(value);
        }

        localStorage.setItem(key, serializedValue);
        result.keysProcessed.push(key);
      } catch (error) {
        result.errors.push({
          key,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        result.success = false;
      }
    }

    result.message = result.success 
      ? `Successfully stored ${result.keysProcessed.length} items`
      : `Stored ${result.keysProcessed.length} items with ${result.errors.length} errors`;

    return result;
  };

  const deleteKeys = (keys: string[]): LocalStorageDeleteResult => {
    const result: LocalStorageDeleteResult = {
      success: true,
      message: "",
      keysDeleted: [],
      keysNotFound: [],
    };

    if (!isAvailable()) {
      result.success = false;
      result.message = "localStorage is not available";
      return result;
    }

    if (!keys || keys.length === 0) {
      result.success = false;
      result.message = "No keys provided to delete";
      return result;
    }

    for (const key of keys) {
      try {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          result.keysDeleted.push(key);
        } else {
          result.keysNotFound.push(key);
        }
      } catch (error) {
        result.success = false;
        result.message = `Error deleting key "${key}": ${error}`;
        break;
      }
    }

    if (result.success) {
      result.message = `Deleted ${result.keysDeleted.length} items`;
      if (result.keysNotFound.length > 0) {
        result.message += `, ${result.keysNotFound.length} keys not found`;
      }
    }

    return result;
  };

  return {
    store,
    delete: deleteKeys,
    isAvailable,
  };
};

// -----------------------------------------------------------------------------
// 2️⃣  UI Components
// -----------------------------------------------------------------------------

interface ModeToggleButtonProps {
  mode: "store" | "delete";
  onToggle: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

const ModeToggleButton: React.FC<ModeToggleButtonProps> = ({
  mode,
  onToggle,
  disabled = false,
  isProcessing = false,
}) => {
  const baseClasses = "px-3 py-2 rounded-md font-medium text-sm transition-all duration-200 border-2 min-w-[80px] h-[36px] flex items-center justify-center";
  const storeClasses = "bg-blue-500 text-white border-blue-600 hover:bg-blue-600";
  const deleteClasses = "bg-red-500 text-white border-red-600 hover:bg-red-600";
  const disabledClasses = "opacity-50 cursor-not-allowed";
  const processingClasses = "animate-pulse";

  const classes = [
    baseClasses,
    mode === "store" ? storeClasses : deleteClasses,
    disabled && disabledClasses,
    isProcessing && processingClasses,
  ].filter(Boolean).join(" ");

  return (
    <button
      onClick={onToggle}
      disabled={disabled || isProcessing}
      className={classes}
    >
      {isProcessing ? "..." : mode === "store" ? "Store" : "Delete"}
    </button>
  );
};

interface StatusDisplayProps {
  lastOperation: "none" | "store" | "delete";
  lastOperationSuccess: boolean;
  operationMessage: string;
  lastOperationTime?: number;
  isProcessing: boolean;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({
  lastOperation,
  lastOperationSuccess,
  operationMessage,
  lastOperationTime,
  isProcessing,
}) => {
  const getStatusColor = () => {
    if (isProcessing) {
      return "text-yellow-600";
    }
    if (lastOperation === "none") {
      return "text-gray-500";
    }
    return lastOperationSuccess ? "text-green-600" : "text-red-600";
  };

  const getStatusIcon = () => {
    if (isProcessing) {
      return "⏳";
    }
    if (lastOperation === "none") {
      return "⚪";
    }
    return lastOperationSuccess ? "✅" : "❌";
  };

  return (
    <div className={`text-xs ${getStatusColor()}`}>
      <div className="flex items-center gap-1">
        <span>{getStatusIcon()}</span>
        <span>
          {isProcessing 
            ? "Processing..." 
            : lastOperation === "none" 
              ? "Ready" 
              : `${lastOperation} ${lastOperationSuccess ? "success" : "failed"}`
          }
        </span>
      </div>
      {operationMessage && (
        <div className="mt-1 text-xs opacity-75">
          {operationMessage}
        </div>
      )}
      {lastOperationTime && (
        <div className="mt-1 text-xs opacity-50">
          {new Date(lastOperationTime).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

interface DataPreviewProps {
  data: Record<string, unknown> | null;
  mode: "store" | "delete";
  maxItems?: number;
}

const DataPreview: React.FC<DataPreviewProps> = ({ 
  data, 
  mode, 
  maxItems = 5 
}) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-xs text-gray-500 italic">
        No data to {mode}
      </div>
    );
  }

  const entries = Object.entries(data).slice(0, maxItems);
  const hasMore = Object.keys(data).length > maxItems;

  return (
    <div className="text-xs space-y-1">
      <div className="font-medium text-gray-700">
        {mode === "store" ? "Will store:" : "Will delete keys:"}
      </div>
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-start gap-2">
          <span className="font-mono text-blue-600">{key}:</span>
          {mode === "store" && (
            <span className="text-gray-600 truncate">
              {typeof value === "object" 
                ? `${JSON.stringify(value).slice(0, 30)}...`
                : String(value).slice(0, 30)
              }
            </span>
          )}
        </div>
      ))}
      {hasMore && (
        <div className="text-gray-500 italic">
          ...and {Object.keys(data).length - maxItems} more
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// 3️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  STORE: {
    primary: "text-[--node--s-t-o-r-e-text]",
  },
} as const;

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex items-center justify-center",
  disabled: "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: StoreLocalData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "storeLocal",
    displayName: "StoreLocal",
    label: "StoreLocal",
    category: CATEGORIES.STORE,
    size: { expanded, collapsed },
    handles: [
      {
        id: "data-input",
        code: "j",
        position: "top",
        type: "target",
        dataType: "JSON",
      },
      {
        id: "trigger-input",
        code: "b",
        position: "left",
        type: "target",
        dataType: "Boolean",
      },
      {
        id: "status-output",
        code: "b",
        position: "right",
        type: "source",
        dataType: "Boolean",
      },
    ],
    inspector: { key: "StoreLocalInspector" },
    version: 1,
    runtime: { execute: "storeLocal_execute_v1" },
    initialData: createSafeInitialData(StoreLocalDataSchema, {
      mode: "store",
      inputData: null,
      triggerInput: false,
      lastTriggerState: false,
      isProcessing: false,
      lastOperation: "none",
      lastOperationSuccess: false,
      operationMessage: "",
      statusOutput: false,
    }),
    dataSchema: StoreLocalDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputData",
        "triggerInput",
        "lastTriggerState",
        "isProcessing",
        "lastOperation",
        "lastOperationSuccess",
        "lastOperationTime",
        "operationMessage",
        "statusOutput",
        "expandedSize",
        "collapsedSize",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "mode", type: "select", label: "Mode" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuDatabase",
    author: "Agenitix Team",
    description: "Enhanced localStorage management with store/delete modes and pulse triggering",
    feature: "storage",
    tags: ["store", "localStorage", "delete", "pulse", "trigger"],
    featureFlag: {
      flag: "store_local_enhanced",
      fallback: true,
      disabledMessage: "Enhanced StoreLocal node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C2",
} as StoreLocalData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const StoreLocalNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const {
      isExpanded,
      isEnabled,
      isActive,
      mode,
      inputData,
      triggerInput,
      lastTriggerState,
      isProcessing,
      lastOperation,
      lastOperationSuccess,
      lastOperationTime,
      operationMessage,
      statusOutput,
    } = nodeData as StoreLocalData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // localStorage operations utility
    const localStorageOps = useMemo(() => createLocalStorageOperations(), []);

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

    /** Toggle between store and delete modes */
    const toggleMode = useCallback(() => {
      const newMode = mode === "store" ? "delete" : "store";
      updateNodeData({ mode: newMode });
    }, [mode, updateNodeData]);

    /** 
     * Compute the latest data coming from connected input handles.
     */
    const computeInputs = useCallback(() => {
      // Get data input
      const dataInputEdge = findEdgeByHandle(edges, id, "data-input");
      let dataInput = null;
      
      if (dataInputEdge) {
        const src = nodes.find((n) => n.id === dataInputEdge.source);
        if (src) {
          const rawData = src.data?.outputs ?? src.data?.data ?? src.data;
          try {
            // Try to parse as JSON if it's a string
            if (typeof rawData === 'string') {
              dataInput = JSON.parse(rawData);
            } else if (typeof rawData === 'object' && rawData !== null) {
              dataInput = rawData;
            }
          } catch {
            // If parsing fails, treat as null
            dataInput = null;
          }
        }
      }

      // Get trigger input
      const triggerInputEdge = findEdgeByHandle(edges, id, "trigger-input");
      let triggerValue = false;
      
      if (triggerInputEdge) {
        const src = nodes.find((n) => n.id === triggerInputEdge.source);
        if (src) {
          const rawTrigger = src.data?.outputs ?? src.data?.data ?? src.data;
          triggerValue = Boolean(rawTrigger);
        }
      }

      return { dataInput, triggerValue };
    }, [edges, nodes, id]);

    /** Execute localStorage operation based on mode */
    const executeOperation = useCallback(() => {
      if (!inputData || isProcessing) {
        return;
      }

      updateNodeData({ isProcessing: true });

      try {
        if (mode === "store") {
          const result = localStorageOps.store(inputData);
          updateNodeData({
            isProcessing: false,
            lastOperation: "store",
            lastOperationSuccess: result.success,
            lastOperationTime: Date.now(),
            operationMessage: result.message,
            statusOutput: result.success,
          });
        } else {
          const keys = Object.keys(inputData);
          const result = localStorageOps.delete(keys);
          updateNodeData({
            isProcessing: false,
            lastOperation: "delete",
            lastOperationSuccess: result.success,
            lastOperationTime: Date.now(),
            operationMessage: result.message,
            statusOutput: result.success,
          });
        }
      } catch (error) {
        updateNodeData({
          isProcessing: false,
          lastOperation: mode,
          lastOperationSuccess: false,
          lastOperationTime: Date.now(),
          operationMessage: error instanceof Error ? error.message : "Unknown error",
          statusOutput: false,
        });
      }
    }, [inputData, isProcessing, mode, localStorageOps, updateNodeData]);

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Whenever nodes/edges change, recompute inputs. */
    useEffect(() => {
      const { dataInput, triggerValue } = computeInputs();
      
      const updates: Partial<StoreLocalData> = {};
      
      if (JSON.stringify(dataInput) !== JSON.stringify(inputData)) {
        updates.inputData = dataInput;
      }
      
      if (triggerValue !== triggerInput) {
        updates.triggerInput = triggerValue;
      }

      if (Object.keys(updates).length > 0) {
        updateNodeData(updates);
      }
    }, [computeInputs, inputData, triggerInput, updateNodeData]);

    /* 🔄 Detect pulse (rising edge) and trigger operations */
    useEffect(() => {
      const isPulse = triggerInput && !lastTriggerState;
      
      if (isPulse && isEnabled && inputData) {
        executeOperation();
      }
      
      // Update last trigger state
      if (triggerInput !== lastTriggerState) {
        updateNodeData({ lastTriggerState: triggerInput });
      }
    }, [triggerInput, lastTriggerState, isEnabled, inputData, executeOperation, updateNodeData]);

    /* 🔄 Update active state based on input data */
    useEffect(() => {
      const hasValidData = inputData && Object.keys(inputData).length > 0;
      
      if (isEnabled) {
        if (isActive !== hasValidData) {
          updateNodeData({ isActive: Boolean(hasValidData) });
        }
      } else {
        if (isActive) {
          updateNodeData({ isActive: false });
        }
      }
    }, [inputData, isEnabled, isActive, updateNodeData]);

    // -------------------------------------------------------------------------
    // 4.6  Validation
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
    // 4.7  Feature flag conditional rendering
    // -------------------------------------------------------------------------
    
    // If flag is loading, show loading state
    if (flagState.isLoading) {
      return (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
          Loading storeLocal feature...
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
        {!isExpanded &&
        spec.size.collapsed.width === 60 &&
        spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-1 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode nodeId={id} label={(nodeData as StoreLocalData).label || spec.displayName} />
        )}

        {!isExpanded ? (
          <div className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className="flex flex-col items-center justify-center gap-2 p-2">
              <ModeToggleButton
                mode={mode}
                onToggle={toggleMode}
                disabled={!isEnabled}
                isProcessing={isProcessing}
              />
              <StatusDisplay
                lastOperation={lastOperation}
                lastOperationSuccess={lastOperationSuccess}
                operationMessage={operationMessage}
                lastOperationTime={lastOperationTime}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        ) : (
          <div className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">LocalStorage Manager</h3>
                <ModeToggleButton
                  mode={mode}
                  onToggle={toggleMode}
                  disabled={!isEnabled}
                  isProcessing={isProcessing}
                />
              </div>
              
              <DataPreview
                data={inputData}
                mode={mode}
                maxItems={5}
              />
              
              <StatusDisplay
                lastOperation={lastOperation}
                lastOperationSuccess={lastOperationSuccess}
                operationMessage={operationMessage}
                lastOperationTime={lastOperationTime}
                isProcessing={isProcessing}
              />
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
const StoreLocalNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as StoreLocalData),
    [
      (nodeData as StoreLocalData).expandedSize,
      (nodeData as StoreLocalData).collapsedSize,
    ],
  );

  // Memoise the scaffolded component to keep focus
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
