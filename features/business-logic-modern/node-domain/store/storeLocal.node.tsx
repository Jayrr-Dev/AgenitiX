/**
 * StoreLocal NODE – Enhanced localStorage management with store/delete/get modes
 *
 * • Provides visual interface for storing and deleting data in browser localStorage
 * • Supports complex objects with proper serialization and type safety
 * • ONLY executes when triggered by boolean input (no auto-execution)
 * • Features pulse-triggered operations and mode switching (Store/Delete/Get)
 * • Includes comprehensive error handling and visual feedback
 * • Uses findEdgeByHandle utility for robust React Flow edge handling
 * • Code follows current React + TypeScript best practices with full Zod validation
 *
 * Keywords: localStorage, store-delete-get-modes, boolean-trigger-only, type-safe
 */

import type { NodeProps } from "@xyflow/react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { Loading } from "@/components/Loading";
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
import { useNodeToast } from "@/hooks/useNodeToast";
import { useStore } from "@xyflow/react";
import { findEdgeByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
import { 
  useComponentButtonClasses, 
  useDesignSystemToken 
} from "@/features/business-logic-modern/infrastructure/theming/components/componentThemeStore";


// -----------------------------------------------------------------------------
// 1️⃣  TOP-LEVEL CONSTANTS & STYLING
// -----------------------------------------------------------------------------

// Design system constants for better maintainability - Unified styling for all modes
const MODE_CONFIG = {
  STORE: {
    label: "Store",
    variant: "primary" as const,
    shadcnVariant: "default" as const,
    colors: {
      // Button styling
      button: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700",
      modeLabel: "text-blue-100",
      // Grid styling
      container: "bg-blue-50 dark:bg-blue-900/10",
      title: "text-blue-700 dark:text-blue-300",
      tableBorder: "border-blue-200 dark:border-blue-700",
      tableHeader: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
      headerText: "text-blue-700 dark:text-blue-300",
      keyText: "text-blue-700 dark:text-blue-300",
      valueText: "text-blue-700 dark:text-blue-300",
      rowBorder: "border-blue-200 dark:border-blue-700",
      // Counter styling
      counterContainer: "text-blue-700 dark:text-blue-300 font-semibold",
      counterBg: "bg-blue-200 dark:bg-blue-900/30",
      counterLabel: "text-blue-600 dark:text-blue-200 font-medium"
    }
  },
  DELETE: {
    label: "Delete", 
    variant: "secondary" as const,
    shadcnVariant: "destructive" as const,
    colors: {
      // Button styling
      button: "bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700",
      modeLabel: "text-red-100",
      // Grid styling
      container: "bg-red-50 dark:bg-red-900/10",
      title: "text-red-700 dark:text-red-300",
      tableBorder: "border-red-200 dark:border-red-700",
      tableHeader: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700",
      headerText: "text-red-700 dark:text-red-300",
      keyText: "text-red-700 dark:text-red-300",
      valueText: "text-red-700 dark:text-red-300",
      rowBorder: "border-red-200 dark:border-red-700",
      // Counter styling
      counterContainer: "text-red-700 dark:text-red-300 font-semibold",
      counterBg: "bg-red-200 dark:bg-red-900/30",
      counterLabel: "text-red-600 dark:text-red-200 font-medium"
    }
  },
  GET: {
    label: "Get",
    variant: "secondary" as const, 
    shadcnVariant: "secondary" as const,
    colors: {
      // Button styling
      button: "bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700",
      modeLabel: "text-green-100",
      // Grid styling
      container: "bg-green-50 dark:bg-green-900/10",
      title: "text-green-700 dark:text-green-300",
      tableBorder: "border-green-200 dark:border-green-700",
      tableHeader: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700",
      headerText: "text-green-700 dark:text-green-300",
      keyText: "text-green-700 dark:text-green-300",
      valueText: "text-green-700 dark:text-green-300",
      rowBorder: "border-green-200 dark:border-green-700",
      // Counter styling
      counterContainer: "text-green-700 dark:text-green-300 font-semibold",
      counterBg: "bg-green-200 dark:bg-green-900/30",
      counterLabel: "text-green-600 dark:text-green-200 font-medium"
    }
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
  DISABLED_OPACITY: "opacity-50",
  DISABLED_CURSOR: "cursor-not-allowed",
} as const;

const CONTENT_CLASSES = {
  expanded: "w-full h-full flex flex-col overflow-hidden",
  collapsed: "flex items-center justify-center w-full h-full", 
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex items-center justify-center overflow-y-auto",
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
    expandedSize: SafeSchemas.text("FV2"),
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
  className?: string
}

interface CollapsedCounterProps {
  mode: "store" | "delete" | "get";
  inputData: Record<string, unknown> | null;
}

const CollapsedCounter: React.FC<CollapsedCounterProps> = ({ mode, inputData }) => {
  const getCountInfo = () => {
    if (!inputData || Object.keys(inputData).length === 0) {
      return { keyCount: 0, valueCount: 0, showValue: false };
    }

    const keyCount = Object.keys(inputData).length;

    switch (mode) {
      case "store":
        return { 
          keyCount,
          valueCount: keyCount,
          showValue: true
        };
      case "delete":
        // For delete mode, count existing keys in localStorage
        let existingKeyCount = 0;
        try {
          for (const key of Object.keys(inputData)) {
            if (localStorage.getItem(key) !== null) {
              existingKeyCount++;
            }
          }
        } catch {
          existingKeyCount = 0;
        }
        return { 
          keyCount: existingKeyCount,
          valueCount: existingKeyCount,
          showValue: true
        };
      case "get":
        // For get mode, count both keys and values that exist in localStorage
        let existingCount = 0;
        try {
          for (const key of Object.keys(inputData)) {
            const value = localStorage.getItem(key);
            if (value !== null) {
              existingCount++;
            }
          }
        } catch {
          existingCount = 0;
        }
        return { 
          keyCount: existingCount,
          valueCount: existingCount,
          showValue: true
        };
      default:
        return { keyCount: 0, valueCount: 0, showValue: false };
    }
  };

  const { keyCount, valueCount, showValue } = getCountInfo();

  if (keyCount === 0 && valueCount === 0) {
    return null;
  }

  const getModeConfig = () => {
    switch (mode) {
      case "store": return MODE_CONFIG.STORE;
      case "delete": return MODE_CONFIG.DELETE;
      case "get": return MODE_CONFIG.GET;
      default: return MODE_CONFIG.STORE;
    }
  };

  const config = getModeConfig();

  return (
    <div className={`text-xs font-mono ${config.colors.counterContainer}`}>
      <div className="grid grid-cols-2 gap-1 text-center">
        <div className={`${config.colors.counterBg} rounded px-1 py-0.5`}>
          <div className={`text-[10px] ${config.colors.counterLabel}`}>Key</div>
          <div className="font-semibold">{keyCount}</div>
        </div>
        {showValue && (
          <div className={`${config.colors.counterBg} rounded px-1 py-0.5`}>
            <div className={`text-[10px] ${config.colors.counterLabel}`}>Value</div>
            <div className="font-semibold">{valueCount}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const ModeToggleButton: React.FC<ModeToggleButtonProps> = ({
  mode,
  onToggle,
  disabled = false,
  isProcessing = false,
  className
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
  
  // Show loading spinner when processing, otherwise show mode label
  const buttonContent = isProcessing ? (
    <Loading showText={false} size="w-5 h-5" className="p-0" />
  ) : (
    config.label
  );
  
  return (
    <Button
      onClick={onToggle}
      disabled={disabled || isProcessing}
      variant={config.shadcnVariant}
      size="sm"
      className={`
        relative
        w-full h-full justify-center my-1 rounded-sm py-1
        ${config.colors.button}
        ${disabled ? `${UI_CONSTANTS.DISABLED_OPACITY} ${UI_CONSTANTS.DISABLED_CURSOR}` : ""}
      `}
    >
      <span className={`absolute text-[6px] top-0 left-1 font-mono ${config.colors.modeLabel}`}>
        MODE
      </span>
      {buttonContent}
    </Button>
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

  const entries = maxItems === Infinity ? Object.entries(data) : Object.entries(data).slice(0, maxItems);
  const hasMore = maxItems !== Infinity && Object.keys(data).length > maxItems;

  const getPreviewTitle = () => {
    switch (mode) {
      case "store": return "Will store";
      case "delete": return "Will delete";
      case "get": return "Output values";
      default: return "Data";
    }
  };

  const getModeConfig = () => {
    switch (mode) {
      case "store": return MODE_CONFIG.STORE;
      case "delete": return MODE_CONFIG.DELETE;
      case "get": return MODE_CONFIG.GET;
      default: return MODE_CONFIG.STORE;
    }
  };

  const config = getModeConfig();

  return (
    <div className={`text-xs space-y-2 w-full ${config.colors.container}`}>
   
      
      {/* Table-like grid layout - full width */}
      <div className={`border rounded-md overflow-hidden w-full ${config.colors.tableBorder}`}>
        {/* Header row */}
        <div className={`grid grid-cols-2 border-b w-full ${config.colors.tableHeader}`}>
          <div className={`px-2 py-1 font-semibold border-r ${config.colors.headerText} ${config.colors.rowBorder} min-w-0`}>
            Key
          </div>
          <div className={`px-2 py-1 font-semibold ${config.colors.headerText} min-w-0`}>
            Value
          </div>
        </div>
        
        {/* Data rows */}
        {entries.map(([key, value], index) => (
          <div 
            key={key} 
            className={`grid grid-cols-2 w-full ${
              index !== entries.length - 1 ? `border-b ${config.colors.rowBorder}` : ''
            }`}
          >
            <div className={`px-2 py-1 font-mono border-r text-[8px] truncate font-semibold ${config.colors.keyText} ${config.colors.rowBorder} min-w-0`}>
              {key}
            </div>
            <div className={`px-2 py-1 text-[8px] truncate font-medium ${config.colors.valueText} min-w-0`}>
              {mode === "store" && (
                typeof value === "object" 
                  ? `${JSON.stringify(value).slice(0, 30)}...`
                  : String(value).slice(0, 30)
              )}
              {(mode === "get" || mode === "delete") && (
                getCurrentLocalStorageValue(key)
              )}
            </div>
          </div>
        ))}
      </div>
      
      {hasMore && (
        <div className="text-gray-500 italic text-center">
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

  const entries = maxItems === Infinity ? Object.entries(data) : Object.entries(data).slice(0, maxItems);
  const hasMore = maxItems !== Infinity && Object.keys(data).length > maxItems;

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
    EXPANDED_SIZES.FV2;
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
    description: "Enhanced localStorage management with store/delete/get modes. Only executes when triggered by boolean input.",
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
  expandedSize: "FV2",
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
    const { showSuccess, showError, showWarning, showInfo } = useNodeToast(id);
    
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

    // Track connection initialization to prevent auto-triggering
    const connectionInitTimeRef = useRef<number | null>(null);
    const hasEverHadTriggerConnectionRef = useRef<boolean>(false);
    const CONNECTION_DEBOUNCE_MS = 500; // 500ms debounce to prevent auto-trigger on connection

    // Check localStorage availability on mount
    useEffect(() => {
      if (!localStorageOps.isAvailable()) {
        showError("localStorage unavailable");
      }
    }, [localStorageOps, showError]);

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

          if (result.success) {
            showSuccess("Store success", `Stored ${result.keysProcessed.length} items`);
          } else {
            showError("Store failed", result.message);
          }
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

          if (result.success) {
            showSuccess("Delete success", `Deleted ${result.keysDeleted.length} items`);
          } else {
            showError("Delete failed", result.message);
          }
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

          if (result.success) {
            showSuccess("Get success", `Retrieved ${result.keysFound.length} items`);
          } else {
            showError("Get failed", result.message);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        updateNodeData({
          isProcessing: false,
          lastOperation: mode,
          lastOperationSuccess: false,
          lastOperationTime: Date.now(),
          operationMessage: errorMessage,
          store: "",
          outputs: null,
        });
        showError(`${mode} failed`, errorMessage);
      }
    }, [inputData, isProcessing, mode, localStorageOps, updateNodeData, showSuccess, showError]);

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Whenever nodes/edges change, recompute inputs. */
    useEffect(() => {
      const { dataInput, triggerValue } = computeInputs();
      
      // Check if trigger connection exists
      const triggerInputEdge = findEdgeByHandle(edges, id, "trigger-input");
      const hasTriggerConnection = Boolean(triggerInputEdge);
      const hadTriggerConnection = hasEverHadTriggerConnectionRef.current;
      
      // Detect NEW trigger connection (didn't have one before, now we do)
      if (hasTriggerConnection && !hadTriggerConnection) {
        hasEverHadTriggerConnectionRef.current = true;
        connectionInitTimeRef.current = Date.now();
        console.log(`StoreLocal ${id}: NEW trigger connection detected, debounce timer set`);
      }
      
      // Detect trigger disconnection
      if (!hasTriggerConnection && hadTriggerConnection) {
        console.log(`StoreLocal ${id}: Trigger disconnected`);
      }
      
      const updates: Partial<StoreLocalData> = {};
      
      // Only update inputData if it actually changed - no operations should trigger from this
      if (JSON.stringify(dataInput) !== JSON.stringify(inputData)) {
        updates.inputData = dataInput;
      }
      
      // Only update triggerInput if it actually changed
      if (triggerValue !== triggerInput) {
        updates.triggerInput = triggerValue;
        console.log(`StoreLocal ${id}: Trigger change detected: ${triggerInput} -> ${triggerValue}`);
        
        // Handle trigger state changes, but connection detection is handled above
        if (triggerInput && !triggerValue) {
          // Reset connection timer when trigger goes false, allowing future true->false->true cycles
          connectionInitTimeRef.current = null;
          console.log(`StoreLocal ${id}: Trigger went false, debounce timer reset`);
          // Don't update lastTriggerState here - let the normal pulse effect handle it
        }
      }

      // Only update if there are actual changes
      if (Object.keys(updates).length > 0) {
        updateNodeData(updates);
      }
    }, [computeInputs, inputData, triggerInput, edges, id, updateNodeData]);

    /* 🔄 Detect pulse (rising edge) and trigger operations - BOOLEAN TRIGGER ONLY */
    useEffect(() => {
      // Check if we have a trigger connection - only execute if we do
      const triggerInputEdge = findEdgeByHandle(edges, id, "trigger-input");
      const hasTriggerConnection = Boolean(triggerInputEdge);
      
      // Only trigger on rising edge (false -> true transition) AND only if trigger is connected
      const isPulse = triggerInput && !lastTriggerState && hasTriggerConnection;
      console.log(`StoreLocal ${id}: Pulse check - triggerInput: ${triggerInput}, lastTriggerState: ${lastTriggerState}, hasTriggerConnection: ${hasTriggerConnection}, isPulse: ${isPulse}`);
      
      if (isPulse && isEnabled && inputData) {
        // Check if this is too soon after a connection was made
        const now = Date.now();
        const timeSinceConnection = connectionInitTimeRef.current ? now - connectionInitTimeRef.current : Infinity;
        
        // Only execute if enough time has passed since connection (debounce)
        if (timeSinceConnection > CONNECTION_DEBOUNCE_MS) {
          console.log(`StoreLocal ${id}: Pulse EXECUTING operation. Time since connection: ${timeSinceConnection}ms`);
          executeOperation();
        } else {
          // Log for debugging
          console.log(`StoreLocal ${id}: Pulse BLOCKED by debounce. Time since connection: ${timeSinceConnection}ms, required: ${CONNECTION_DEBOUNCE_MS}ms`);
        }
      }
      
      // Always update last trigger state to track changes (this was missing proper sync)
      if (triggerInput !== lastTriggerState) {
        updateNodeData({ lastTriggerState: triggerInput });
      }
    }, [triggerInput, lastTriggerState, isEnabled, inputData, executeOperation, updateNodeData, id, edges]);

    /* 🔄 Update active state based on input data - VISUAL ONLY, no operations */
    useEffect(() => {
      const hasValidData = inputData && Object.keys(inputData).length > 0;
      
      // This effect only updates visual state, it should NOT trigger operations
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
    // 4.5b  REMOVED Auto-execute functionality
    // -------------------------------------------------------------------------
    // Auto-execute has been removed to prevent unwanted activations.
    // StoreLocal should ONLY execute when explicitly triggered by boolean input.

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
      // For small collapsed sizes (C1, C1W), hide text and center better
      const isSmallNode = !isExpanded && (nodeData.collapsedSize === "C1" || nodeData.collapsedSize === "C1W");
      
      return (
        <Loading 
          className={isSmallNode ? "flex items-center justify-center w-full h-full" : "p-4"} 
          size={isSmallNode ? "w-6 h-6" : "w-8 h-8"} 
          text={isSmallNode ? undefined : "Loading..."}
          showText={!isSmallNode}
        />
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
            <div className="flex flex-col items-center justify-center gap-1 p-2">
            <div className="flex content-center w-full">
              <ModeToggleButton
                className="w-full"
                mode={mode}
                onToggle={toggleMode}
                disabled={!isEnabled}
                isProcessing={isProcessing}
              />
              </div>
              <CollapsedCounter
                mode={mode}
                inputData={inputData}
              />
            </div>
          </div>
        ) : (
          <div 
            className={`
              ${CONTENT_CLASSES.expanded} 
              bg-node-store
              border-node-store
              text-node-store
              ${!isEnabled ? CONTENT_CLASSES.disabled : ''}
            `}
          >
            {/* Fixed header section */}
            <div className={`${containerPadding} flex-shrink-0 mt-1`}>
              <div className="flex content-center">
                <ModeToggleButton
                  className="w-full"
                  mode={mode}
                  onToggle={toggleMode}
                  disabled={!isEnabled}
                  isProcessing={isProcessing}
                />
              </div>
              <div className={`font-medium text-xs pt-0`}>
                {mode === "store" ? "Will store" : mode === "delete" ? "Will delete" : "Output values"}
              </div>
            </div>
            
           
            
            {/* Scrollable content section */}
            <div className={`flex-1 flex flex-col items-stretch justify-start overflow-y-auto ${containerPadding} pt-0 nowheel w-full`}>
              <DataPreview
                data={inputData}
                mode={mode}
                maxItems={Infinity}
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
