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

import { Button } from "@/components/ui/button";
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
import { 
  useComponentButtonClasses, 
  useDesignSystemToken 
} from "@/features/business-logic-modern/infrastructure/theming/components/componentThemeStore";


// -----------------------------------------------------------------------------
// 1️⃣  TOP-LEVEL CONSTANTS & STYLING
// -----------------------------------------------------------------------------

// Design system constants for better maintainability
const MODE_CONFIG = {
  STORE: {
    label: "Store",
    variant: "primary" as const,
    shadcnVariant: "default" as const,
  },
  DELETE: {
    label: "Delete", 
    variant: "secondary" as const, // Design system doesn't support destructive
    shadcnVariant: "destructive" as const,
  },
  GET: {
    label: "Get",
    variant: "secondary" as const, 
    shadcnVariant: "secondary" as const,
  },
} as const;

const STATUS_CONFIG = {
  PROCESSING: {
    icon: "⏳",
    color: "text-yellow-600",
    text: "Processing...",
  },
  NONE: {
    icon: "⚪",
    color: "text-gray-500", 
    text: "Ready",
  },
  SUCCESS: {
    icon: "✅",
    color: "text-green-600",
  },
  ERROR: {
    icon: "❌", 
    color: "text-red-600",
  },
} as const;

const UI_CONSTANTS = {
  MAX_PREVIEW_ITEMS: 5,
  PROCESSING_ANIMATION: "animate-pulse",
  DISABLED_OPACITY: "opacity-50",
  DISABLED_CURSOR: "cursor-not-allowed",
} as const;

const CONTENT_CLASSES = {
  expanded: "w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full", 
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex items-center justify-center",
  disabled: "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// -----------------------------------------------------------------------------
// 2️⃣  Enhanced data schema & validation
// -----------------------------------------------------------------------------

export const StoreLocalDataSchema = z
  .object({
    // Core functionality
    mode: z.enum(["store", "delete", "get"]).default("store"),
    inputData: z.record(z.unknown()).nullable().default(null),
    triggerInput: z.boolean().default(false),
    lastTriggerState: z.boolean().default(false),
    
    // Internal store for retrieved data (formatted JSON string for inspector)
    store: z.string().default(""),
    
    // Status and feedback
    isProcessing: z.boolean().default(false),
    lastOperation: z.enum(["none", "store", "delete", "get"]).default("none"),
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
    outputs: z.record(z.unknown()).nullable().default(null),
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

interface LocalStorageGetResult {
  success: boolean;
  message: string;
  data: Record<string, unknown>;
  keysFound: string[];
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

  const getKeys = (keys: string[]): LocalStorageGetResult => {
    const result: LocalStorageGetResult = {
      success: true,
      message: "",
      data: {},
      keysFound: [],
      keysNotFound: [],
    };

    if (!isAvailable()) {
      result.success = false;
      result.message = "localStorage is not available";
      return result;
    }

    if (!keys || keys.length === 0) {
      result.success = false;
      result.message = "No keys provided to get";
      return result;
    }

    for (const key of keys) {
      try {
        const value = localStorage.getItem(key);
        if (value !== null) {
          // Try to parse the stored value
          try {
            // First try to parse as JSON
            const parsedValue = JSON.parse(value);
            result.data[key] = parsedValue;
          } catch {
            // If JSON parsing fails, store as string
            result.data[key] = value;
          }
          result.keysFound.push(key);
        } else {
          result.keysNotFound.push(key);
        }
      } catch (error) {
        result.success = false;
        result.message = `Error getting key "${key}": ${error}`;
        break;
      }
    }

    if (result.success) {
      result.message = `Retrieved ${result.keysFound.length} items`;
      if (result.keysNotFound.length > 0) {
        result.message += `, ${result.keysNotFound.length} keys not found`;
      }
    }

    return result;
  };

  return {
    store,
    delete: deleteKeys,
    get: getKeys,
    isAvailable,
  };
};

// -----------------------------------------------------------------------------
// 2️⃣  UI Components
// -----------------------------------------------------------------------------

interface ModeToggleButtonProps {
  mode: "store" | "delete" | "get";
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
  const getModeConfig = () => {
    switch (mode) {
      case "store": return MODE_CONFIG.STORE;
      case "delete": return MODE_CONFIG.DELETE;
      case "get": return MODE_CONFIG.GET;
      default: return MODE_CONFIG.STORE;
    }
  };

  const config = getModeConfig();
  const isProcessingText = isProcessing ? "..." : config.label;

  // Use store-specific button styling
  const buttonClasses = useComponentButtonClasses('nodeInspector', config.variant, 'sm');
  
  return (
    <Button
      onClick={onToggle}
      disabled={disabled || isProcessing}
      variant={config.shadcnVariant}
      size="sm"
      className={`
        ${buttonClasses}
        ${isProcessing ? UI_CONSTANTS.PROCESSING_ANIMATION : ""}
        ${disabled ? `${UI_CONSTANTS.DISABLED_OPACITY} ${UI_CONSTANTS.DISABLED_CURSOR}` : ""}
      `}
    >
      {isProcessingText}
    </Button>
  );
};

interface StatusDisplayProps {
  lastOperation: "none" | "store" | "delete" | "get";
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
      return STATUS_CONFIG.PROCESSING.color;
    }
    if (lastOperation === "none") {
      return STATUS_CONFIG.NONE.color;
    }
    return lastOperationSuccess ? STATUS_CONFIG.SUCCESS.color : STATUS_CONFIG.ERROR.color;
  };

  const getStatusIcon = () => {
    if (isProcessing) {
      return STATUS_CONFIG.PROCESSING.icon;
    }
    if (lastOperation === "none") {
      return STATUS_CONFIG.NONE.icon;
    }
    return lastOperationSuccess ? STATUS_CONFIG.SUCCESS.icon : STATUS_CONFIG.ERROR.icon;
  };

  return (
    <div className={`text-xs ${getStatusColor()} text-node-store-secondary`}>
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
        <div className="mt-1 text-xs opacity-75 text-node-store-secondary">
          {operationMessage}
        </div>
      )}
      {lastOperationTime && (
        <div className="mt-1 text-xs opacity-50 text-node-store-secondary">
          {new Date(lastOperationTime).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

interface DataPreviewProps {
  data: Record<string, unknown> | null;
  mode: "store" | "delete" | "get";
  maxItems?: number;
}

const DataPreview: React.FC<DataPreviewProps> = ({ 
  data, 
  mode, 
  maxItems = UI_CONSTANTS.MAX_PREVIEW_ITEMS 
}) => {
  // Helper function to get current localStorage value
  const getCurrentLocalStorageValue = (key: string): string => {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return "null";
      
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(value);
        return typeof parsed === "object" 
          ? JSON.stringify(parsed).slice(0, 30) + "..."
          : String(parsed);
      } catch {
        // If not JSON, return as string
        return value.length > 30 ? value.slice(0, 30) + "..." : value;
      }
    } catch {
      return "error";
    }
  };

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-xs text-gray-500 italic">
        No data to {mode}
      </div>
    );
  }

  const entries = Object.entries(data).slice(0, maxItems);
  const hasMore = Object.keys(data).length > maxItems;

  const getPreviewTitle = () => {
    switch (mode) {
      case "store": return "Will store:";
      case "delete": return "Will delete keys:";
      case "get": return "Current values:";
      default: return "Data:";
    }
  };

  return (
    <div className="text-xs space-y-1">
      <div className="font-medium text-gray-700">
        {getPreviewTitle()}
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
          {mode === "get" && (
            <span className="text-gray-600 truncate">
              {getCurrentLocalStorageValue(key)}
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

interface RetrievedDataDisplayProps {
  data: Record<string, unknown> | null;
  maxItems?: number;
}

const RetrievedDataDisplay: React.FC<RetrievedDataDisplayProps> = ({ 
  data, 
  maxItems = UI_CONSTANTS.MAX_PREVIEW_ITEMS 
}) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-xs text-gray-500 italic">
        No data retrieved
      </div>
    );
  }

  const entries = Object.entries(data).slice(0, maxItems);
  const hasMore = Object.keys(data).length > maxItems;

  return (
    <div className="text-xs space-y-1">
      <div className="font-medium text-green-700">
        Retrieved values:
      </div>
      <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-2 space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-start gap-2">
            <span className="font-mono text-green-600 font-semibold">{key}:</span>
            <span className="text-gray-700 dark:text-gray-300 break-all">
              {typeof value === "object" 
                ? JSON.stringify(value, null, 2)
                : String(value)
              }
            </span>
          </div>
        ))}
        {hasMore && (
          <div className="text-gray-500 italic">
            ...and {Object.keys(data).length - maxItems} more
          </div>
        )}
      </div>
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
        id: "output",
        code: "j",
        position: "right",
        type: "source",
        dataType: "JSON",
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
      store: "",
      isProcessing: false,
      lastOperation: "none",
      lastOperationSuccess: false,
      operationMessage: "",
      outputs: null,
    }),
    dataSchema: StoreLocalDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputData",
        "triggerInput",
        "lastTriggerState",
        "store",
        "isProcessing",
        "lastOperation",
        "lastOperationSuccess",
        "lastOperationTime",
        "operationMessage",
        "outputs",
        "expandedSize",
        "collapsedSize",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "mode", type: "select", label: "Mode" },
        { 
          key: "store", 
          type: "textarea", 
          label: "Retrieved Data", 
          placeholder: "Retrieved localStorage data will appear here...",
          ui: { rows: 6 },
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuDatabase",
    author: "Agenitix Team",
    description: "Enhanced localStorage management with store/delete/get modes and pulse triggering",
    feature: "storage",
    tags: ["store", "localStorage", "delete", "get", "pulse", "trigger"],
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
    
    // Use design system tokens for spacing and other values
    const containerPadding = useDesignSystemToken("spacing.md", "p-3");
    const borderRadius = useDesignSystemToken("effects.rounded.md", "rounded-md");
    const textSize = useDesignSystemToken("typography.sizes.sm", "text-sm");
    


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
      store,
      isProcessing,
      lastOperation,
      lastOperationSuccess,
      lastOperationTime,
      operationMessage,
      outputs,
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

    /** Toggle between store, delete, and get modes */
    const toggleMode = useCallback(() => {
      let newMode: "store" | "delete" | "get";
      switch (mode) {
        case "store":
          newMode = "delete";
          break;
        case "delete":
          newMode = "get";
          break;
        case "get":
          newMode = "store";
          break;
        default:
          newMode = "store";
      }
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
            store: "", // Clear store for store operations
            outputs: null, // Clear outputs for store operations
          });
        } else if (mode === "delete") {
          const keys = Object.keys(inputData);
          const result = localStorageOps.delete(keys);
          updateNodeData({
            isProcessing: false,
            lastOperation: "delete",
            lastOperationSuccess: result.success,
            lastOperationTime: Date.now(),
            operationMessage: result.message,
            store: "", // Clear store for delete operations
            outputs: null, // Clear outputs for delete operations
          });
        } else if (mode === "get") {
          const keys = Object.keys(inputData);
          const result = localStorageOps.get(keys);
          const retrievedData = result.success ? result.data : null;
          // Format store data as JSON string for inspector display
          const storeDisplay = retrievedData ? JSON.stringify(retrievedData, null, 2) : "";
          updateNodeData({
            isProcessing: false,
            lastOperation: "get",
            lastOperationSuccess: result.success,
            lastOperationTime: Date.now(),
            operationMessage: result.message,
            store: storeDisplay, // Store formatted JSON string for inspector
            outputs: retrievedData, // Output raw data for connections
          });
        }
      } catch (error) {
        updateNodeData({
          isProcessing: false,
          lastOperation: mode,
          lastOperationSuccess: false,
          lastOperationTime: Date.now(),
          operationMessage: error instanceof Error ? error.message : "Unknown error",
          store: "",
          outputs: null,
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
          <div 
            className={`
              ${CONTENT_CLASSES.collapsed} 
              bg-node-store
              border-node-store
              text-node-store
              ${!isEnabled ? CONTENT_CLASSES.disabled : ''}
            `}
          >
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
          <div 
            className={`
              ${CONTENT_CLASSES.expanded} 
              ${containerPadding} 
              bg-node-store
              border-node-store
              text-node-store
              ${!isEnabled ? CONTENT_CLASSES.disabled : ''}
            `}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className={`${textSize} font-medium text-node-store`}>
                  LocalStorage Manager
                </h3>
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
                maxItems={UI_CONSTANTS.MAX_PREVIEW_ITEMS}
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
