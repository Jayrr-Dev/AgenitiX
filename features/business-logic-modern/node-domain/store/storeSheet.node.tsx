/**
 * StoreSheet NODE – Google Sheets integration with professional UI
 *
 * • Stores JSON data to Google Sheets with key-column mapping
 * • Professional collapsed/expanded views following emailMessage design principles
 * • Real-time connection status and data sync indicators
 * • Schema-driven with type-safe validation
 * • 10px text consistency and proper spacing throughout
 *
 * Keywords: store-sheet, google-sheets, json-storage, professional-ui
 */

import type { NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
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
import { findEdgesByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
import { normalizeHandleId } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";
import { toObjectValue } from "@/features/business-logic-modern/node-domain/convert/utils";

// Import components (we'll create these next)
import { StoreSheetCollapsed } from "./components/StoreSheetCollapsed";
import { StoreSheetExpanded } from "./components/StoreSheetExpanded";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const StoreSheetDataSchema = z
  .object({
    // Google Sheets Configuration
    spreadsheetId: z.string().default(""),
    sheetName: z.string().default("Sheet1"),
    
    // Authentication
    serviceAccountKey: z.string().default(""), // JSON key for service account
    isAuthenticated: z.boolean().default(false),
    
    // Data Mapping Configuration
    keyColumnMapping: z.record(z.string(), z.string()).default({}), // JSON key -> Column letter
    appendMode: z.boolean().default(true), // true = append rows, false = update existing
    headerRow: z.number().default(1), // Row number for headers
    
    // Connection Status
    connectionStatus: z.enum([
      "disconnected",
      "connecting", 
      "connected",
      "syncing",
      "synced",
      "error"
    ]).default("disconnected"),
    
    // Statistics
    rowsStored: z.number().default(0),
    lastSyncTime: z.number().nullable().default(null),
    lastError: z.string().nullable().default(null),
    
    // Input Data
    inputData: z.unknown().nullable().default(null),
    
    // Node State
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE3"),
    collapsedSize: SafeSchemas.text("C2"),
    label: z.string().optional(),
    
    // Legacy compatibility
    store: SafeSchemas.text(""),
    inputs: SafeSchemas.optionalText().nullable().default(null),
    output: SafeSchemas.optionalText(),
  })
  .passthrough();

export type StoreSheetData = z.infer<typeof StoreSheetDataSchema>;

const validateNodeData = createNodeValidator(
  StoreSheetDataSchema,
  "StoreSheet"
);

// -----------------------------------------------------------------------------
// 2️⃣  Dynamic spec factory
// -----------------------------------------------------------------------------

function createDynamicSpec(data: StoreSheetData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE3;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "storeSheet",
    displayName: "Store Sheet",
    label: "Store Sheet",
    category: CATEGORIES.STORE,
    size: { expanded, collapsed },
    handles: [
      {
        id: "json-input",
        code: "json",
        position: "left",
        type: "target",
        dataType: "JSON",
      },
      {
        id: "output",
        code: "json",
        position: "right", 
        type: "source",
        dataType: "JSON",
      },
    ],
    inspector: { key: "StoreSheetInspector" },
    version: 1,
    runtime: { execute: "storeSheet_execute_v1" },
    initialData: createSafeInitialData(StoreSheetDataSchema, {
      spreadsheetId: "",
      sheetName: "Sheet1",
      connectionStatus: "disconnected",
      rowsStored: 0,
    }),
    dataSchema: StoreSheetDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputData",
        "connectionStatus",
        "rowsStored",
        "lastSyncTime",
        "lastError",
        "expandedSize",
        "collapsedSize",
        "store",
        "inputs",
        "output",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "spreadsheetId", type: "text", label: "Spreadsheet ID", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" },
        { key: "sheetName", type: "text", label: "Sheet Name", placeholder: "Sheet1" },
        { key: "appendMode", type: "boolean", label: "Append Mode" },
        { key: "headerRow", type: "number", label: "Header Row" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuSheet",
    author: "Agenitix Team",
    description: "Store JSON data to Google Sheets with key-column mapping",
    feature: "store",
    tags: ["store", "google-sheets", "json", "data-sync", "spreadsheet"],
    theming: {},
  };
}

/** Static spec for registry */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE3",
  collapsedSize: "C2",
} as StoreSheetData);

// -----------------------------------------------------------------------------
// 3️⃣  React component
// -----------------------------------------------------------------------------

const StoreSheetNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    const { nodeData, updateNodeData } = useNodeData(id, data);
    const typedNodeData = nodeData as StoreSheetData;
    
    // Global React‑Flow store for edge detection
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);
    
    const {
      isExpanded,
      isEnabled,
      isActive,
      connectionStatus,
      spreadsheetId,
      sheetName,
      rowsStored,
      lastSyncTime,
      lastError,
      inputData,
    } = typedNodeData;

    // Keep last output to avoid redundant writes
    const lastOutputRef = useRef<unknown>(null);

    // -------------------------------------------------------------------------
    // Callbacks
    // -------------------------------------------------------------------------

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    /** Connect to Google Sheets */
    const handleConnect = useCallback(async () => {
      if (!spreadsheetId || !isEnabled) return;
      
      updateNodeData({ connectionStatus: "connecting" });
      
      try {
        // TODO: Implement Google Sheets API connection
        // For now, simulate connection
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        updateNodeData({ 
          connectionStatus: "connected",
          isActive: true,
        });
      } catch (error) {
        updateNodeData({ 
          connectionStatus: "error",
          lastError: error instanceof Error ? error.message : "Connection failed",
        });
      }
    }, [spreadsheetId, isEnabled, updateNodeData]);

    /** Sync data to Google Sheets */
    const handleSync = useCallback(async () => {
      if (!inputData || connectionStatus !== "connected") return;
      
      updateNodeData({ connectionStatus: "syncing" });
      
      try {
        // TODO: Implement actual Google Sheets sync
        // For now, simulate sync
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        updateNodeData({
          connectionStatus: "synced",
          rowsStored: rowsStored + 1,
          lastSyncTime: Date.now(),
          lastError: null,
        });
        
        // Propagate success output
        const output = {
          success: true,
          rowsStored: rowsStored + 1,
          spreadsheetId,
          sheetName,
        };
        
        if (output !== lastOutputRef.current) {
          lastOutputRef.current = output;
          updateNodeData({ output });
        }
      } catch (error) {
        updateNodeData({
          connectionStatus: "error", 
          lastError: error instanceof Error ? error.message : "Sync failed",
        });
      }
    }, [inputData, connectionStatus, rowsStored, spreadsheetId, sheetName, updateNodeData]);

    // -------------------------------------------------------------------------
    // Effects
    // -------------------------------------------------------------------------

    /** Compute input from connected edges */
    const computeInput = useCallback((): unknown => {
      const jsonEdges = findEdgesByHandle(edges, id, "json-input");
      if (jsonEdges.length === 0) return null;

      const items: Array<{ value: unknown; label?: string }> = [];
      for (const edge of jsonEdges) {
        const src = nodes.find((n) => n.id === edge.source);
        if (!src) continue;

        const dataRec = src.data as Record<string, unknown> | undefined;
        let value: unknown = undefined;

        // Handle-specific value from source output map
        if (dataRec && typeof dataRec.output === "object" && dataRec.output) {
          const outMap = dataRec.output as Record<string, unknown>;
          const cleanId = edge.sourceHandle
            ? normalizeHandleId(edge.sourceHandle)
            : "output";
          if (outMap[cleanId] !== undefined) {
            value = outMap[cleanId];
          } else if (outMap.output !== undefined) {
            value = outMap.output;
          } else {
            const first = Object.values(outMap)[0];
            if (first !== undefined) value = first;
          }
        }

        // Legacy fallback
        if (value === undefined) {
          value =
            (src.data as any)?.output ??
            (src.data as any)?.inputData ??
            (src.data as any)?.store ??
            src.data;
        }

        // Parse JSON strings
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (trimmed.length > 0) {
            const looksJson =
              (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
              (trimmed.startsWith("[") && trimmed.endsWith("]"));
            if (looksJson) {
              try {
                value = JSON.parse(trimmed);
              } catch {
                // keep original string
              }
            }
          }
        }

        const customLabel =
          typeof (dataRec as any)?.label === "string"
            ? ((dataRec as any)?.label as string)
            : undefined;
        items.push({ value, label: customLabel });
      }

      if (items.length === 0) return null;

      // Single input
      if (items.length === 1) {
        const only = items[0].value;
        if (only && typeof only === "object" && !Array.isArray(only))
          return only;
        return toObjectValue(only);
      }

      // Multiple inputs - merge
      const merged: Record<string, unknown> = {};
      const labelCounts: Record<string, number> = {};
      for (const { value: v, label } of items) {
        if (v && typeof v === "object" && !Array.isArray(v)) {
          Object.assign(merged, v as Record<string, unknown>);
          continue;
        }

        if (label && label.trim().length > 0) {
          const base = label.trim();
          const nextCount = (labelCounts[base] ?? 0) + 1;
          labelCounts[base] = nextCount;
          let key = nextCount === 1 ? base : `${base}${nextCount - 1}`;
          while (Object.prototype.hasOwnProperty.call(merged, key)) {
            key = `${key}_`;
          }
          merged[key] = v as unknown;
        } else {
          Object.assign(merged, toObjectValue(v));
        }
      }
      return merged;
    }, [edges, nodes, id]);

    /* Update inputs when edges change */
    useEffect(() => {
      const inputVal = computeInput();
      if (inputVal !== inputData) {
        updateNodeData({ inputData: inputVal });
      }
    }, [computeInput, inputData, updateNodeData]);

    /* Auto-enable when inputs connect */
    useEffect(() => {
      const inputVal = inputData;
      const hasValue =
        inputVal !== null &&
        (typeof inputVal !== "string" || inputVal.trim().length > 0);
      const nextActive = isEnabled && hasValue;
      if (isActive !== nextActive) {
        updateNodeData({ isActive: nextActive });
      }
    }, [inputData, isEnabled, isActive, updateNodeData]);

    /* Auto-sync when data changes and connected */
    useEffect(() => {
      if (inputData && connectionStatus === "connected" && isActive) {
        handleSync();
      }
    }, [inputData, connectionStatus, isActive, handleSync]);

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("StoreSheet", id, validation.errors, {
        originalData: validation.originalData,
        component: "StoreSheetNode",
      });
    }

    useNodeDataValidation(
      StoreSheetDataSchema,
      "StoreSheet",
      validation.data,
      id
    );

    // -------------------------------------------------------------------------
    // Category styles for consistent theming
    // -------------------------------------------------------------------------
    const categoryStyles = {
      primary: "text-[--node-store-text]",
      secondary: "text-[--node-store-text-secondary]",
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    return (
      <>
        {/* Editable label or icon */}
        {!isExpanded &&
        spec.size.collapsed.width === 60 &&
        spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-0 text-foreground/80">
            {spec.icon && <span>📊</span>}
          </div>
        ) : (
          <LabelNode
            nodeId={id}
            label={typedNodeData.label || spec.displayName}
          />
        )}

        {!isExpanded ? (
          <StoreSheetCollapsed
            nodeData={typedNodeData}
            categoryStyles={categoryStyles}
            onToggleExpand={toggleExpand}
            onConnect={handleConnect}
          />
        ) : (
          <StoreSheetExpanded
            nodeId={id}
            nodeData={typedNodeData}
            isEnabled={isEnabled}
            connectionStatus={connectionStatus}
            onConnect={handleConnect}
            onSync={handleSync}
          />
        )}

        <ExpandCollapseButton
          showUI={isExpanded}
          onToggle={toggleExpand}
          size="sm"
        />
      </>
    );
  }
);

StoreSheetNode.displayName = "StoreSheetNode";

// -----------------------------------------------------------------------------
// 4️⃣  Export with scaffold
// -----------------------------------------------------------------------------

const StoreSheetNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as StoreSheetData),
    [nodeData]
  );

  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <StoreSheetNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default StoreSheetNodeWithDynamicSpec;