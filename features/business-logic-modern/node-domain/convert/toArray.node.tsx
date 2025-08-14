/**
 * ToArray NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Converts multiple inputs to array format
 * • Supports single, multiple, and flatten conversion modes
 * • Configurable max items and order preservation
 * • Shows input and output with conversion details
 *
 * Keywords: to-array, array-conversion, schema-driven, type‑safe
 */

import type { NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { findEdgesByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import {
  generateoutputField,
  normalizeHandleId,
} from "@/features/business-logic-modern/infrastructure/node-core/utils/handleOutputUtils";
import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/utils/iconUtils";
import {
  SafeSchemas,
  createSafeInitialData,
} from "@/features/business-logic-modern/infrastructure/node-core/utils/schema-helpers";
import { useNodeFeatureFlag } from "@/features/business-logic-modern/infrastructure/node-core/features/useNodeFeatureFlag";
import {
  createNodeValidator,
  reportValidationError,
  useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/utils/validation";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";
import { useStore } from "@xyflow/react";

// Import conversion utilities
import { CompactDataViewer } from "./components/CompactDataViewer";
import { VirtualizedArrayViewer } from "./components/VirtualizedArrayViewer";
import { toArrayValue } from "./utils";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const ToArrayDataSchema = z
  .object({
    // Input/Output
    inputValue: z.any().optional(),
    arrayOutput: z.array(z.any()).default([]),

    // Array-specific options
    mode: z.enum(["single", "multiple", "flatten"]).default("multiple"),
    maxItems: z.number().optional(),
    preserveOrder: z.boolean().default(true),

    // UI State
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("FE3"),
    collapsedSize: SafeSchemas.text("C1"),

    // Error handling
    hasError: z.boolean().default(false),
    errorMessage: z.string().optional(),

    // Legacy compatibility
    output: SafeSchemas.optionalText(),
    label: z.string().optional(),
  })
  .passthrough();

export type ToArrayData = z.infer<typeof ToArrayDataSchema>;

const validateNodeData = createNodeValidator(ToArrayDataSchema, "ToArray");

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CONTENT = {
  expanded: "p-3 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full pt-1",
  disabled:
    "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

function createDynamicSpec(data: ToArrayData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE3;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C1;

  return {
    kind: "toArray",
    displayName: "To Array",
    label: "To Array",
    category: CATEGORIES.CONVERT,
    size: { expanded, collapsed },
    handles: [
      {
        id: "any-input",
        code: "any",
        position: "left",
        type: "target",
        dataType: "any",
      },
      {
        id: "array-output",
        code: "array",
        position: "right",
        type: "source",
        dataType: "array",
      },
    ],
    inspector: { key: "ToArrayInspector" },
    version: 1,
    runtime: { execute: "toArray_execute_v1" },
    initialData: createSafeInitialData(ToArrayDataSchema, {
      inputValue: null,
      arrayOutput: [],
      mode: "multiple",
      preserveOrder: true,
      hasError: false,
      errorMessage: undefined,
    }),
    dataSchema: ToArrayDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputValue",
        "arrayOutput",
        "hasError",
        "errorMessage",
        "expandedSize",
        "collapsedSize",
        "output",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        {
          key: "mode",
          type: "select",
          label: "Mode",
        },
        {
          key: "maxItems",
          type: "number",
          label: "Max Items",
          description: "Maximum array length (optional)",
        },
        {
          key: "preserveOrder",
          type: "boolean",
          label: "Preserve Order",
          description: "Keep input order",
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuBrackets",
    author: "Agenitix Team",
    description: "Converts multiple inputs to array format",
    feature: "base",
    tags: ["convert", "array", "list", "type-conversion"],
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE3",
  collapsedSize: "C1",
} as ToArrayData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const ToArrayNode = memo(
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
      inputValue,
      arrayOutput = [],
      mode,
      maxItems,
      preserveOrder,
      hasError,
      errorMessage,
    } = nodeData as ToArrayData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<any[] | null>(null);
    const lastHandleMapRef = useRef<Map<string, any> | null>(null);

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

    /** Propagate array output - legacy field + handle field */
    const propagate = useCallback(
      (value: any[]) => {
        const out = value || []; // [Explanation], basically ensure we always have an array
        if (JSON.stringify(out) !== JSON.stringify(lastOutputRef.current)) {
          lastOutputRef.current = out;
          updateNodeData({ arrayOutput: out, ["array-output"]: out });
        }
      },
      [updateNodeData]
    );

    /** Clear JSON‑ish fields when inactive or disabled */
    const blockJsonWhenInactive = useCallback(() => {
      if (!isActive || !isEnabled) {
        updateNodeData({
          json: null,
          data: null,
          payload: null,
          result: null,
          response: null,
        });
      }
    }, [isActive, isEnabled, updateNodeData]);

    /**
     * Compute the latest values coming from connected input handles.
     * Collects from multiple input handles.
     */
    const computeInput = useCallback((): unknown => {
      // Collect ALL edges connected to the single target handle "any-input"
      const incomingEdges = findEdgesByHandle(edges, id, "any-input");
      if (!incomingEdges || incomingEdges.length === 0) return null;

      const values: unknown[] = [];

      for (const e of incomingEdges) {
        const src = nodes.find((n) => n.id === e.source);
        if (!src) continue;

        const sourceData = src.data as Record<string, unknown> | undefined;
        let value: unknown = undefined;

        // Prefer the new handle-based output object so we can target the exact source handle
        if (
          sourceData &&
          typeof sourceData.output === "object" &&
          sourceData.output !== null
        ) {
          const outputObj = sourceData.output as Record<string, unknown>;
          const cleanId = e.sourceHandle
            ? normalizeHandleId(e.sourceHandle)
            : "output";
          if (outputObj[cleanId] !== undefined) {
            value = outputObj[cleanId];
          } else if (outputObj.output !== undefined) {
            value = outputObj.output;
          } else {
            const first = Object.values(outputObj)[0];
            if (first !== undefined) value = first;
          }
        }

        // Legacy fallbacks
        if (value === undefined) {
          const raw = (sourceData as any)?.output;
          value = raw ?? (sourceData as any)?.store ?? sourceData;
        }

        values.push(value);
      }

      // Return an ordered array of all values; conversion options are applied later
      return values;
    }, [edges, nodes, id]);

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Whenever nodes/edges change, recompute inputs. */
    useEffect(() => {
      const inputVal = computeInput();
      if (inputVal !== inputValue) {
        updateNodeData({ inputValue: inputVal });
      }
    }, [computeInput, inputValue, updateNodeData]);

    /* 🔄 Convert input to array when input changes */
    useEffect(() => {
      if (inputValue !== undefined && inputValue !== null) {
        try {
          const converted = toArrayValue(
            inputValue,
            mode,
            maxItems,
            preserveOrder
          );
          updateNodeData({
            arrayOutput: converted,
            hasError: false,
            errorMessage: undefined,
            isActive: true,
          });
        } catch (error) {
          updateNodeData({
            hasError: true,
            errorMessage:
              error instanceof Error ? error.message : "Conversion error",
            isActive: false,
          });
        }
      } else {
        updateNodeData({
          arrayOutput: [],
          isActive: false,
          hasError: false,
          errorMessage: undefined,
        });
      }
    }, [inputValue, mode, maxItems, preserveOrder, updateNodeData]);

    // Propagate array output and block JSON when inactive
    useEffect(() => {
      const out = hasError ? [] : arrayOutput || []; // [Explanation], basically ensure we always have an array
      propagate(out);
      blockJsonWhenInactive();
    }, [hasError, arrayOutput, propagate, blockJsonWhenInactive]);

    /* 🔄 Generate handle-based output map */
    useEffect(() => {
      try {
        const map = generateoutputField(spec, nodeData as any);
        if (!(map instanceof Map)) return;
        const prev = lastHandleMapRef.current;
        let changed = true;
        if (prev && prev instanceof Map) {
          changed =
            prev.size !== map.size ||
            !Array.from(map.entries()).every(([k, v]) => prev.get(k) === v);
        }
        if (changed) {
          lastHandleMapRef.current = map;
          updateNodeData({ output: Object.fromEntries(map.entries()) });
        }
      } catch {}
    }, [
      spec.handles,
      (nodeData as any)["array-output"],
      nodeData.isActive,
      nodeData.isEnabled,
      updateNodeData,
    ]);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("ToArray", id, validation.errors, {
        originalData: validation.originalData,
        component: "ToArrayNode",
      });
    }

    useNodeDataValidation(ToArrayDataSchema, "ToArray", validation.data, id);

    // -------------------------------------------------------------------------
    // 4.7  Feature flag conditional rendering
    // -------------------------------------------------------------------------

    // If flag is loading, show loading state
    if (flagState.isLoading) {
      return (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
          Loading toArray feature...
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
          <div className="absolute inset-0 flex justify-center text-lg p-0 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode
            nodeId={id}
            label={(nodeData as ToArrayData).label || spec.displayName}
          />
        )}

        {!isExpanded ? (
          <div
            className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ""}`}
          >
            <div className="flex flex-col items-center justify-center text-xs">
              {hasError ? (
                <div className="text-red-500 text-center">
                  <div>Error</div>
                  <div className="text-[10px] opacity-75">{errorMessage}</div>
                </div>
              ) : (
                <div className="font-mono text-xs text-center max-w-full">
                  <div className="truncate">
                    [{arrayOutput?.length ?? 0} items]
                  </div>
                </div>
              )}
              {inputValue !== null && inputValue !== undefined && (
                <div className="text-[10px] opacity-50 mt-1 text-center max-w-full truncate">
                  {/* {String(inputValue).substring(0, 15)}
                  {String(inputValue).length > 15 ? "..." : ""} */}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ""}`}
          >
            {/* Scrollable content area, basically prevent long sections from overlapping the node */}
            <div className="min-h-0 flex-1 overflow-auto space-y-2">
              {/* Array Data Display */}
              {hasError ? (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Array Data:
                  </label>
                  <div className="mt-1 p-2 rounded text-[11px] font-mono bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                    Error: {errorMessage}
                  </div>
                </div>
              ) : (arrayOutput?.length ?? 0) > 50 ? (
                // Use virtualized viewer for very large arrays
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Array Data:
                  </label>
                  <div className="mt-1">
                    <VirtualizedArrayViewer
                      data={arrayOutput}
                      containerHeight={200}
                      itemHeight={100}
                      overscan={3}
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                // Use compact viewer for smaller arrays with expandability
                <CompactDataViewer
                  data={arrayOutput}
                  label="Array Data"
                  initialLimit={20}
                  maxHeight="max-h-32"
                  expandable={true}
                  drillable={true}
                  emptyMessage="(empty array)"
                />
              )}

              {/* Conversion Info */}
              {!hasError && inputValue !== null && inputValue !== undefined && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Conversion:
                  </label>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Mode: <span className="font-mono">{mode}</span>
                    {maxItems && (
                      <>
                        {" • "}
                        Max items: <span className="font-mono">{maxItems}</span>
                      </>
                    )}
                    <br />
                    Length:{" "}
                    <span className="font-mono">
                      {arrayOutput?.length ?? 0}
                    </span>
                    {" • "}
                    Order:{" "}
                    <span className="font-mono">
                      {preserveOrder ? "preserved" : "reversed"}
                    </span>
                  </div>
                </div>
              )}
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
  }
);

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

const ToArrayNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as ToArrayData),
    [
      (nodeData as ToArrayData).expandedSize,
      (nodeData as ToArrayData).collapsedSize,
    ]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <ToArrayNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default ToArrayNodeWithDynamicSpec;
