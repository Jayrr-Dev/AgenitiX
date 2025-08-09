/**
 * ToObject NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Converts any input to object with configurable key strategy
 * • Supports hash, index, custom, and auto key generation strategies
 * • Handles arrays and single values appropriately
 * • Shows input and output with conversion details
 *
 * Keywords: to-object, object-conversion, schema-driven, type‑safe
 */

import type { NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { findEdgeByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import {
  generateoutputField,
  normalizeHandleId,
} from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";
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

// Import conversion utilities
import { getObjectDisplay, toObjectValue } from "./utils";

// Local utility function for generating simple hash
function generateSimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 4);
}

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const ToObjectDataSchema = z
  .object({
    // Input/Output
    inputValue: z.any().optional(),
    objectOutput: z.record(z.any()).default({}),

    // Object-specific options
    keyStrategy: z.enum(["hash", "index", "custom", "auto"]).default("auto"),
    customKeys: z.union([z.array(z.string()), z.string()]).default([]),
    preserveType: z.boolean().default(false),

    // UI State
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE3"),
    collapsedSize: SafeSchemas.text("C1"),

    // Error handling
    hasError: z.boolean().default(false),
    errorMessage: z.string().optional(),

    // Legacy compatibility
    output: SafeSchemas.optionalText(),
    label: z.string().optional(),
  })
  .passthrough();

export type ToObjectData = z.infer<typeof ToObjectDataSchema>;

const validateNodeData = createNodeValidator(ToObjectDataSchema, "ToObject");

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

function createDynamicSpec(data: ToObjectData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE3;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C1;

  return {
    kind: "toObject",
    displayName: "To Object",
    label: "To Object",
    category: CATEGORIES.CONVERT,
    size: { expanded, collapsed },
    handles: [
      {
        id: "any-input",
        code: "x",
        position: "left",
        type: "target",
        dataType: "Any",
      },
      {
        id: "object-output",
        code: "j",
        position: "right",
        type: "source",
        dataType: "JSON",
      },
    ],
    inspector: { key: "ToObjectInspector" },
    version: 1,
    runtime: { execute: "toObject_execute_v1" },
    initialData: createSafeInitialData(ToObjectDataSchema, {
      inputValue: null,
      objectOutput: {},
      keyStrategy: "auto",
      customKeys: [],
      preserveType: false,
      hasError: false,
      errorMessage: undefined,
    }),
    dataSchema: ToObjectDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputValue",
        "objectOutput",
        "hasError",
        "errorMessage",
        "expandedSize",
        "collapsedSize",
        "output",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        {
          key: "keyStrategy",
          type: "select",
          label: "Key Strategy",
        },
        {
          key: "customKeys",
          type: "text",
          label: "Custom Keys",
          description: "Comma-separated keys for custom strategy",
        },
        {
          key: "preserveType",
          type: "boolean",
          label: "Preserve Type",
          description: "Keep objects as-is when possible",
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuBraces",
    author: "Agenitix Team",
    description: "Converts any input to object with configurable key strategy",
    feature: "base",
    tags: ["convert", "object", "json", "type-conversion"],
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE3",
  collapsedSize: "C1",
} as ToObjectData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const ToObjectNode = memo(
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
      objectOutput,
      keyStrategy,
      customKeys,
      preserveType,
      hasError,
      errorMessage,
    } = nodeData as ToObjectData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<Record<string, any> | null>(null);
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

    /** Propagate object output - legacy fields + handle field */
    const propagate = useCallback(
      (value: Record<string, any>) => {
        const out = value;
        if (JSON.stringify(out) !== JSON.stringify(lastOutputRef.current)) {
          lastOutputRef.current = out;
          updateNodeData({ objectOutput: out, ["object-output"]: out });
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
     * Compute the latest value coming from connected input handles.
     * Accepts any type of input for object conversion.
     */
    const computeInput = useCallback((): any => {
      const anyInputEdge = findEdgeByHandle(edges, id, "any-input");
      if (!anyInputEdge) return null;

      const src = nodes.find((n) => n.id === anyInputEdge.source);
      if (!src) return null;

      const sourceData = src.data as Record<string, unknown> | undefined;
      let inputValue: unknown = undefined;

      if (
        sourceData &&
        typeof sourceData.output === "object" &&
        sourceData.output !== null
      ) {
        const outputObj = sourceData.output as Record<string, unknown>;
        const cleanId = anyInputEdge.sourceHandle
          ? normalizeHandleId(anyInputEdge.sourceHandle)
          : "output";
        if (outputObj[cleanId] !== undefined) {
          inputValue = outputObj[cleanId];
        } else if (outputObj.output !== undefined) {
          inputValue = outputObj.output;
        } else {
          const first = Object.values(outputObj)[0];
          if (first !== undefined) inputValue = first;
        }
      }

      if (inputValue === undefined) {
        const raw = (sourceData as any)?.output;
        inputValue = raw ?? (sourceData as any)?.store ?? sourceData;
      }

      return inputValue;
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

    /* 🔄 Convert input to object when input changes */
    useEffect(() => {
      if (inputValue !== undefined && inputValue !== null) {
        try {
          // Parse custom keys from comma-separated string
          const parsedCustomKeys =
            typeof customKeys === "string"
              ? customKeys
                  .split(",")
                  .map((k: string) => k.trim())
                  .filter((k: string) => k.length > 0)
              : Array.isArray(customKeys)
                ? customKeys
                : [];

          const converted = toObjectValue(
            inputValue,
            keyStrategy,
            parsedCustomKeys,
            preserveType
          );
          updateNodeData({
            objectOutput: converted,
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
          objectOutput: {},
          isActive: false,
          hasError: false,
          errorMessage: undefined,
        });
      }
    }, [inputValue, keyStrategy, customKeys, preserveType, updateNodeData]);

    // Propagate object output and block JSON when inactive
    useEffect(() => {
      const out = hasError ? {} : objectOutput;
      propagate(out);
      blockJsonWhenInactive();
    }, [hasError, objectOutput, propagate, blockJsonWhenInactive]);

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
      (nodeData as any)["object-output"],
      nodeData.isActive,
      nodeData.isEnabled,
      updateNodeData,
    ]);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("ToObject", id, validation.errors, {
        originalData: validation.originalData,
        component: "ToObjectNode",
      });
    }

    useNodeDataValidation(ToObjectDataSchema, "ToObject", validation.data, id);

    // -------------------------------------------------------------------------
    // 4.7  Feature flag conditional rendering
    // -------------------------------------------------------------------------

    // If flag is loading, show loading state
    if (flagState.isLoading) {
      return (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
          Loading toObject feature...
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
            label={(nodeData as ToObjectData).label || spec.displayName}
          />
        )}
        {/* Collapsed: show a compact summary of top-level array items */}
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
                    {Object.keys(objectOutput).length} keys
                  </div>
                </div>
              )}
              {inputValue !== null && inputValue !== undefined && (
                <div className="text-[8px] opacity-50 mt-1 text-center max-w-full truncate">
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
            <div className="space-y-2">
              {/* Input Display */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Input:
                </label>
                <div className="mt-1 p-2 bg-muted rounded text-xs font-mono">
                  {inputValue === null || inputValue === undefined
                    ? "No input connected"
                    : JSON.stringify(inputValue, null, 2)}
                </div>
              </div>

              {/* Output Display */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Object Output:
                </label>
                <div
                  className={`mt-1 p-2 rounded text-[11px] font-mono ${
                    hasError
                      ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  }`}
                >
                  {hasError
                    ? `Error: ${errorMessage}`
                    : getObjectDisplay(objectOutput)}
                </div>
              </div>

              {/* Conversion Info */}
              {!hasError && inputValue !== null && inputValue !== undefined && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Conversion:
                  </label>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Strategy: <span className="font-mono">{keyStrategy}</span>
                    {keyStrategy === "custom" && (
                      <>
                        {" • "}
                        Keys:{" "}
                        <span className="font-mono">
                          {Array.isArray(customKeys)
                            ? customKeys.join(", ")
                            : customKeys}
                        </span>
                      </>
                    )}
                    <br />
                    Keys:{" "}
                    <span className="font-mono">
                      {Object.keys(objectOutput).length}
                    </span>
                    {" • "}
                    Preserve type:{" "}
                    <span className="font-mono">
                      {preserveType ? "yes" : "no"}
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

const ToObjectNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as ToObjectData),
    [
      (nodeData as ToObjectData).expandedSize,
      (nodeData as ToObjectData).collapsedSize,
    ]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <ToObjectNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default ToObjectNodeWithDynamicSpec;
