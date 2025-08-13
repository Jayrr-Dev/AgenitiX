/**
 * viewBoolean NODE – Boolean‑focused, schema‑driven, type‑safe
 *
 * • Presents incoming boolean values with ZERO structural styling – the surrounding scaffold handles
 *   borders, sizing, themes, drag/selection states, etc.
 * • Zod‑based schema gives auto‑generated, type‑checked Inspector controls.
 * • Dynamic sizing is driven directly by node data (expandedSize / collapsedSize).
 * • All data handling is funnelled through one converter (convertToBoolean) to avoid duplication.
 * • Strict separation of responsibilities:
 *     – createDynamicSpec: returns a NodeSpec based only on data               (pure)
 *     – ViewBooleanNode:   deals with React‑Flow store & data propagation       (impure)
 * • Memoised helpers & refs prevent unnecessary renders / infinite loops.
 * • Updated to use new unified handle-based input reading system
 */

import type { NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { normalizeHandleId } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";
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
import { trackNodeUpdate } from "@/lib/debug-node-updates";
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
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C1"),

    // Data flow - support multiple connections
    inputs: z
      .record(z.string(), z.boolean().nullable())
      .nullable()
      .default(null),
    output: z.boolean().nullable().default(null), // single output value for pass-through

    // Connection tracking
    connectionStates: z
      .record(
        z.string(),
        z.object({
          nodeId: z.string(),
          value: z.boolean().nullable(),
          handleId: z.string(),
        })
      )
      .nullable()
      .default(null),

    // Customization
    label: z.string().optional(),
  })
  .passthrough();

export type ViewBooleanData = z.infer<typeof ViewBooleanDataSchema>;

const validateNodeData = createNodeValidator(
  ViewBooleanDataSchema,
  "ViewBoolean"
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants & Styles
// -----------------------------------------------------------------------------

const BOOLEAN_ICONS = {
  TRUE: "LuCheck",
  FALSE: "LuX",
  NULL: "LuMinus",
  DISCONNECTED: "LuUnplug",
} as const;

const BOOLEAN_COLORS = {
  TRUE: "text-green-600 dark:text-green-400",
  FALSE: "text-red-600 dark:text-red-400",
  NULL: "text-muted-foreground",
  DISCONNECTED: "text-muted-foreground/50",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: ViewBooleanData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C1;

  return {
    kind: "viewBoolean",
    displayName: "View Boolean",
    label: "View Boolean",
    category: CATEGORIES.VIEW,
    size: { expanded, collapsed },
    handles: [
      {
        id: "boolean-input",
        code: "boolean",
        position: "left",
        type: "target",
        dataType: "boolean",
      },
      {
        id: "boolean-output",
        code: "boolean",
        position: "right",
        type: "source",
        dataType: "boolean",
      },
    ],
    inspector: { key: "ViewBooleanInspector" },
    version: 1,
    runtime: { execute: "viewBoolean_execute_v1" },
    initialData: createSafeInitialData(ViewBooleanDataSchema, {
      booleanValue: null,
      inputs: null,
      output: null,
      connectionStates: null,
      isEnabled: true, // Enable node by default
      isActive: false, // Will become active when enabled
      isExpanded: false, // Default to collapsed
    }),
    dataSchema: ViewBooleanDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputs",
        "output",
        "booleanValue",
        "connectionStates",
        "expandedSize",
        "collapsedSize",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuCheckSquare",
    author: "Agenitix Team",
    description:
      "Displays multiple boolean connections in a table view when expanded",
    feature: "base",
    tags: ["view", "boolean", "display", "multiple", "table"],
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
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
  if (typeof value === "boolean") return value;

  // String conversion
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (lower === "true" || lower === "1") return true;
    if (lower === "false" || lower === "0") return false;
    if (lower === "") return null;
  }

  // Number conversion
  if (typeof value === "number") {
    return value !== 0;
  }

  // Default truthy/falsy conversion
  return Boolean(value);
}

/**
 * Get icon and color for boolean value
 */
function getBooleanDisplay(value: boolean | null, hasConnection: boolean) {
  if (!hasConnection) {
    return {
      icon: BOOLEAN_ICONS.DISCONNECTED,
      color: BOOLEAN_COLORS.DISCONNECTED,
    };
  }
  if (value === null) {
    return { icon: BOOLEAN_ICONS.NULL, color: BOOLEAN_COLORS.NULL };
  }
  return value
    ? { icon: BOOLEAN_ICONS.TRUE, color: BOOLEAN_COLORS.TRUE }
    : { icon: BOOLEAN_ICONS.FALSE, color: BOOLEAN_COLORS.FALSE };
}

// -----------------------------------------------------------------------------
// 5️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const ViewBooleanNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 5.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);

    // -------------------------------------------------------------------------
    // 5.2  Derived state
    // -------------------------------------------------------------------------
    const {
      isExpanded,
      isEnabled,
      isActive,
      inputs,
      booleanValue,
      connectionStates,
    } = nodeData as ViewBooleanData;

    // Global store – subscribe only to edges touching this node
    const edges = useStore(
      (s) => s.edges.filter((e) => e.source === id || e.target === id),
      (a, b) => {
        if (a === b) return true;
        if (a.length !== b.length) return false;
        const aIds = a.map((e) => e.id).join("|");
        const bIds = b.map((e) => e.id).join("|");
        return aIds === bIds;
      }
    );

    // Subscribe to connected nodes data changes
    const connectedNodes = useStore(
      useCallback(
        (s) => {
          const inputEdges = edges.filter((e) => e.target === id);
          return s.nodes.filter((n) => 
            inputEdges.some((e) => e.source === n.id)
          );
        },
        [edges, id]
      )
    );

    // Keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<boolean | null>(null);

    // -------------------------------------------------------------------------
    // 5.3  Callbacks
    // -------------------------------------------------------------------------

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    /** Propagate boolean output when node is enabled (false should still propagate) */
    const propagate = useCallback(
      (value: boolean | null) => {
        const shouldSend = isEnabled;
        const out = shouldSend ? value : null;
        if (out !== lastOutputRef.current) {
          lastOutputRef.current = out;
          updateNodeData({ output: out });
        }
      },
      [isEnabled, updateNodeData]
    );

    /**
     * Compute all boolean values from connected input handles and track connection states.
     */
    const computeConnectionStates = useCallback(() => {
      // Find all edges connected to this node (target)
      const connectedEdges = edges.filter((edge) => edge.target === id);

      if (connectedEdges.length === 0) {
        return { connectionStates: null, primaryValue: null };
      }

      const connectionStates: Record<
        string,
        { nodeId: string; value: boolean | null; handleId: string }
      > = {};
      const values: boolean[] = [];

      for (const edge of connectedEdges) {
        // Get the source node data from connected nodes
        const sourceNode = connectedNodes.find(
          (n) => n.id === edge.source
        );
        if (!sourceNode?.data) continue;

        // New unified handle-based input reading system
        const sourceData = sourceNode.data as any;
        let inputValue: unknown;

        // 1. Handle-based output (primary system)
        if (sourceData?.output && typeof sourceData.output === "object") {
          // Try to get value from specific handle first
          if (edge.sourceHandle) {
            const handleId = normalizeHandleId(edge.sourceHandle);
            const output = sourceData.output as Record<string, any>;
            if (output[handleId] !== undefined) {
              inputValue = output[handleId];
            } else {
              // Fallback: get first available output value
              const firstOutputValue = Object.values(output)[0];
              if (firstOutputValue !== undefined) {
                inputValue = firstOutputValue;
              }
            }
          } else {
            // No specific handle, get first available output value
            const output = sourceData.output as Record<string, any>;
            const firstOutputValue = Object.values(output)[0];
            if (firstOutputValue !== undefined) {
              inputValue = firstOutputValue;
            }
          }
        }

        // 2. Legacy fallbacks for compatibility
        if (inputValue === undefined) {
          if (
            sourceData?.booleanValue !== undefined &&
            sourceData.booleanValue !== null
          ) {
            inputValue = sourceData.booleanValue;
          } else if (
            sourceData?.store !== undefined &&
            sourceData.store !== null
          ) {
            inputValue = sourceData.store;
          } else if (
            sourceData?.value !== undefined &&
            sourceData.value !== null
          ) {
            inputValue = sourceData.value;
          } else if (sourceData?.isActive !== undefined) {
            inputValue = sourceData.isActive;
          } else if (sourceData?.isEnabled !== undefined) {
            inputValue = sourceData.isEnabled;
          }
        }

        // 3. Final fallback to whole data object
        if (inputValue === undefined) {
          inputValue = sourceData;
        }

        const booleanValue = convertToBoolean(inputValue);

        connectionStates[edge.id] = {
          nodeId: edge.source,
          value: booleanValue,
          handleId: edge.sourceHandle || "output",
        };

        if (booleanValue !== null) {
          values.push(booleanValue);
        }
      }

      // For primary value, use logical OR of all connected boolean values
      const primaryValue =
        values.length > 0 ? values.some((v) => v === true) : null;

      return { connectionStates, primaryValue };
    }, [id, edges, connectedNodes]);

    // -------------------------------------------------------------------------
    // 5.4  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Whenever nodes/edges change, recompute connections. */
    useEffect(() => {
      const { connectionStates: newConnectionStates, primaryValue } =
        computeConnectionStates();
      updateNodeData({
        inputs: newConnectionStates
          ? Object.fromEntries(
              Object.entries(newConnectionStates).map(([key, state]) => [
                key,
                state.value,
              ])
            )
          : null,
        booleanValue: primaryValue,
        connectionStates: newConnectionStates,
      });
    }, [computeConnectionStates, updateNodeData]);

    /* 🔄 Batch state updates to reduce render cascades */
    useEffect(() => {
      const updates: Partial<ViewBooleanData> = {};
      let hasUpdates = false;

      // Auto-manage isEnabled based on input connections
      const hasConnection =
        connectionStates !== null &&
        Object.keys(connectionStates || {}).length > 0;
      if (hasConnection !== isEnabled) {
        updates.isEnabled = hasConnection;
        hasUpdates = true;
      }

      // Update active state: active only when enabled and booleanValue is strictly true
      const isTrue = booleanValue === true; // null treated as false
      if (isEnabled) {
        if (isActive !== isTrue) {
          updates.isActive = isTrue;
          hasUpdates = true;
        }
      } else if (isActive) {
        updates.isActive = false;
        hasUpdates = true;
      }

      if (hasUpdates) {
        trackNodeUpdate(id, "boolean-state-batch");
        updateNodeData(updates);
      }
    }, [
      connectionStates,
      isEnabled,
      booleanValue,
      isActive,
      updateNodeData,
      id,
    ]);

    /* 🔄 Propagate output when state changes */
    useEffect(() => {
      propagate(booleanValue as boolean | null);
    }, [booleanValue, propagate]);

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

    useNodeDataValidation(
      ViewBooleanDataSchema,
      "ViewBoolean",
      validation.data,
      id
    );

    // -------------------------------------------------------------------------
    // 5.6  Visual state computation
    // -------------------------------------------------------------------------
    const hasConnection =
      connectionStates !== null &&
      Object.keys(connectionStates || {}).length > 0;
    const connectionCount = connectionStates
      ? Object.keys(connectionStates || {}).length
      : 0;
    const display = getBooleanDisplay(
      booleanValue as boolean | null,
      hasConnection
    );

    // For multiple connections, show different icon logic
    const multiConnectionDisplay = useMemo(() => {
      if (connectionCount <= 1) return null;

      // Count true/false values
      const values = Object.values(connectionStates || {}).map(
        (state) => state.value
      );
      const trueCount = values.filter((v) => v === true).length;
      const falseCount = values.filter((v) => v === false).length;

      return { trueCount, falseCount, total: connectionCount };
    }, [connectionStates, connectionCount]);

    // -------------------------------------------------------------------------
    // 5.7  Render
    // -------------------------------------------------------------------------
    return (
      <>
        {/* Simple label - only show when expanded */}
        {isExpanded && (
          <LabelNode
            nodeId={id}
            label={(nodeData as ViewBooleanData).label || spec.displayName}
          />
        )}

        {/* Content area with minimal styling */}
        <div
          className={`flex items-center justify-center w-full h-full ${isEnabled ? "" : "opacity-50"}`}
        >
          {isExpanded ? (
            <div className="flex flex-col items-center justify-center gap-2 p-2 w-full">
              {/* Connection table */}
              {hasConnection ? (
                <div className="w-full max-w-sm mt-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Connections
                  </div>
                  <div className="border rounded-md">
                    <div className="grid grid-cols-2 gap-1 p-2 text-xs font-medium bg-muted/50">
                      <div>Node ID</div>
                      <div>State</div>
                    </div>
                    {Object.entries(connectionStates || {}).map(
                      ([edgeId, state]) => {
                        const stateDisplay = getBooleanDisplay(
                          state.value,
                          true
                        );
                        return (
                          <div
                            key={edgeId}
                            className="grid grid-cols-2 gap-1 p-2 text-xs border-t"
                          >
                            <div className="truncate font-mono">
                              {state.nodeId.slice(-8)}
                            </div>
                            <div
                              className={`flex items-center gap-1 ${stateDisplay.color}`}
                            >
                              {renderLucideIcon(stateDisplay.icon, "", 12)}
                              <span>
                                {state.value === null
                                  ? "null"
                                  : String(state.value)}
                              </span>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  No connections
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full">
              {connectionCount <= 1 ? (
                // Single connection: show normal icon
                <div className={`${display.color}`}>
                  {renderLucideIcon(display.icon, "", 16)}
                </div>
              ) : (
                // Multiple connections: show count + icons aligned
                <div className="flex flex-col items-center gap-0.5">
                  {multiConnectionDisplay &&
                    multiConnectionDisplay.trueCount > 0 && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <span className="text-xs font-mono w-3 text-right">
                          {multiConnectionDisplay.trueCount}
                        </span>
                        {renderLucideIcon("LuCheck", "", 12)}
                      </div>
                    )}
                  {multiConnectionDisplay &&
                    multiConnectionDisplay.falseCount > 0 && (
                      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <span className="text-xs font-mono w-3 text-right">
                          {multiConnectionDisplay.falseCount}
                        </span>
                        {renderLucideIcon("LuX", "", 12)}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>

        <ExpandCollapseButton
          showUI={isExpanded}
          onToggle={toggleExpand}
          size="sm"
        />
      </>
    );
  }
);

// -----------------------------------------------------------------------------
// 6️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

const ViewBooleanNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const { expandedSize, collapsedSize } = nodeData as ViewBooleanData;
  const dynamicSpec = useMemo(
    () => createDynamicSpec({ expandedSize, collapsedSize } as ViewBooleanData),
    [expandedSize, collapsedSize]
  );

  // Memoize the scaffolded component for stable identity
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <ViewBooleanNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default ViewBooleanNodeWithDynamicSpec;
