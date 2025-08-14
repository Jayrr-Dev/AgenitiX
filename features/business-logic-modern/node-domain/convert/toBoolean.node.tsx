/**
 * ToBoolean NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
 * • Zod schema auto‑generates type‑checked Inspector controls.
 * • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
 * • Output propagation is gated by `isActive` *and* `isEnabled` to prevent runaway loops.
 * • Uses findEdgeByHandle utility for robust React Flow edge handling.
 * • Auto-enables when inputs connect; never auto-disables automatically.
 * • Code is fully commented and follows current React + TypeScript best practices.
 *
 * Keywords: to-boolean, schema-driven, type‑safe, clean‑architecture
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
import { getBooleanDisplay, toBooleanValue } from "./utils";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const ToBooleanDataSchema = z
  .object({
    // Input/Output
    inputValue: z.any().optional(),
    booleanOutput: z.boolean().default(false),
    booleanValue: z.boolean().default(false), // For viewBoolean compatibility

    // Boolean-specific options
    strictMode: z.boolean().default(false),
    customFalsyValues: z.array(z.string()).default([]),

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
    store: SafeSchemas.text(""),
    inputs: SafeSchemas.optionalText().nullable().default(null),
    output: SafeSchemas.optionalText(),
    label: z.string().optional(),
  })
  .passthrough();

export type ToBooleanData = z.infer<typeof ToBooleanDataSchema>;

const validateNodeData = createNodeValidator(ToBooleanDataSchema, "ToBoolean");

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  CONVERT: {
    primary: "text-node-convert",
  },
} as const;

const CONTENT = {
  expanded: "p-3 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full pt-1",
  header: "flex items-center justify-between mb-2",
  body: "flex-1 flex items-center justify-center",
  disabled:
    "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: ToBooleanData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE3;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C1;

  return {
    kind: "toBoolean",
    displayName: "ToBoolean",
    label: "ToBoolean",
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
        id: "boolean-output",
        code: "boolean",
        position: "right",
        type: "source",
        dataType: "boolean",
      },
    ],
    inspector: { key: "ToBooleanInspector" },
    version: 1,
    runtime: { execute: "toBoolean_execute_v1" },
    initialData: createSafeInitialData(ToBooleanDataSchema, {
      inputValue: null,
      booleanOutput: false,
      booleanValue: false,
      strictMode: false,
      customFalsyValues: [],
      hasError: false,
      errorMessage: undefined,
    }),
    dataSchema: ToBooleanDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputs",
        "output",
        "inputValue",
        "booleanOutput",
        "hasError",
        "errorMessage",
        "expandedSize",
        "collapsedSize",
        "store",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        {
          key: "strictMode",
          type: "boolean",
          label: "Strict Mode",
          description: "Use strict JavaScript falsy rules",
        },
        {
          key: "customFalsyValues",
          type: "text",
          label: "Custom Falsy Values",
          description: "Additional values to treat as false (comma-separated)",
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuToggleLeft",
    author: "Agenitix Team",
    description:
      "Converts any input to boolean value following JavaScript falsy rules",
    feature: "base",
    tags: ["convert", "boolean", "falsy", "type-conversion"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This toBoolean node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE3",
  collapsedSize: "C2",
} as ToBooleanData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const ToBooleanNode = memo(
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
      booleanOutput,
      strictMode,
      customFalsyValues,
      hasError,
      errorMessage,
    } = nodeData as ToBooleanData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<boolean | null>(null);
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

    /** Propagate boolean output - write legacy fields and handle field */
    const propagate = useCallback(
      (value: boolean) => {
        if (value !== lastOutputRef.current) {
          lastOutputRef.current = value;

          // [Explainantion] , basically keep legacy fields and add the source-handle field for the new system
          updateNodeData({
            booleanOutput: value,
            booleanValue: value,
            ["boolean-output"]: value,
          });
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
     * Accepts any type of input for boolean conversion.
     */
    const computeInput = useCallback((): any => {
      const anyInputEdge = findEdgeByHandle(edges, id, "any-input");

      if (!anyInputEdge) return null;

      const src = nodes.find((n) => n.id === anyInputEdge.source);
      if (!src) return null;

      const sourceData = src.data as Record<string, unknown> | undefined;
      let inputValue: unknown = undefined;

      // 1) New propagation system: handle-based output object
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

      // 2) Legacy fallbacks for compatibility
      if (inputValue === undefined) {
        const legacyBoolean =
          (sourceData as any)?.booleanOutput ??
          (sourceData as any)?.booleanValue;
        if (legacyBoolean !== undefined) {
          inputValue = legacyBoolean;
        } else {
          inputValue =
            (sourceData as any)?.output ??
            (sourceData as any)?.store ??
            (sourceData as any)?.data ??
            sourceData;
        }
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

    /* 🔄 Convert input to boolean when input changes - supports object propagation */
    useEffect(() => {
      if (inputValue !== undefined && inputValue !== null) {
        try {
          const converted = toBooleanValue(
            inputValue,
            strictMode,
            customFalsyValues
          );
          updateNodeData({
            booleanOutput: converted,
            booleanValue: converted,
            ["boolean-output"]: converted,
            hasError: false,
            errorMessage: undefined,
            isActive: true,
          });
        } catch (error) {
          updateNodeData({
            booleanOutput: false,
            booleanValue: false,
            ["boolean-output"]: false,
            hasError: true,
            errorMessage:
              error instanceof Error ? error.message : "Conversion error",
            isActive: false,
          });
        }
      } else {
        // No input - set to false but keep active for consistency
        updateNodeData({
          booleanOutput: false,
          booleanValue: false,
          ["boolean-output"]: false,
          isActive: true,
          hasError: false,
          errorMessage: undefined,
        });
      }
    }, [inputValue, strictMode, customFalsyValues, updateNodeData]);

    // Propagate boolean output - simplified like triggerToggle
    useEffect(() => {
      // Always propagate the current boolean value, let receiving nodes decide what to do
      const outputValue = hasError ? false : booleanOutput;
      propagate(outputValue);
      blockJsonWhenInactive();
    }, [hasError, booleanOutput, propagate, blockJsonWhenInactive]);

    /* 🔄 Generate handle-based output object for new propagation */
    useEffect(() => {
      try {
        const outputMap = generateoutputField(spec, nodeData as any);
        if (!(outputMap instanceof Map)) return;

        let changed = true;
        const prev = lastHandleMapRef.current;
        if (prev && prev instanceof Map) {
          changed =
            prev.size !== outputMap.size ||
            !Array.from(outputMap.entries()).every(
              ([k, v]) => prev.get(k) === v
            );
        }

        if (changed) {
          lastHandleMapRef.current = outputMap;
          updateNodeData({ output: Object.fromEntries(outputMap.entries()) });
        }
      } catch {
        // Ignore errors; legacy fields still work
      }
    }, [
      spec.handles,
      (nodeData as any)["boolean-output"],
      nodeData.isActive,
      nodeData.isEnabled,
      updateNodeData,
    ]);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("ToBoolean", id, validation.errors, {
        originalData: validation.originalData,
        component: "ToBooleanNode",
      });
    }

    useNodeDataValidation(
      ToBooleanDataSchema,
      "ToBoolean",
      validation.data,
      id
    );

    // -------------------------------------------------------------------------
    // 4.7  Feature flag conditional rendering
    // -------------------------------------------------------------------------

    // If flag is loading, show loading state
    if (flagState.isLoading) {
      return (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
          Loading toBoolean feature...
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
            label={(nodeData as ToBooleanData).label || spec.displayName}
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
                <div
                  className={`font-mono text-sm font-medium ${booleanOutput ? "text-green-500" : "text-red-500"}`}
                >
                  {getBooleanDisplay(booleanOutput)}
                </div>
              )}
              {inputValue !== null && inputValue !== undefined && (
                <div className="text-[10px] opacity-60 mt-1 text-center max-w-full truncate">
                  {/* {String(inputValue).substring(0, 20)}
                  {String(inputValue).length > 20 ? "..." : ""} */}
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
                  Boolean Output:
                </label>
                <div
                  className={`mt-1 p-2 rounded text-[11px] font-mono text-center ${
                    hasError
                      ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      : booleanOutput
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  }`}
                >
                  {hasError
                    ? `Error: ${errorMessage}`
                    : getBooleanDisplay(booleanOutput)}
                </div>
              </div>

              {/* Conversion Info */}
              {!hasError && inputValue !== null && inputValue !== undefined && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Conversion:
                  </label>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {strictMode ? "Strict mode: " : "Standard mode: "}
                    <span className="font-mono">{String(inputValue)}</span>
                    {" → "}
                    <span
                      className={`font-mono ${booleanOutput ? "text-green-600" : "text-red-600"}`}
                    >
                      {String(booleanOutput)}
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

/**
 * ⚠️ THIS is the piece that fixes the focus‑loss issue.
 *
 * `withNodeScaffold` returns a *component function*.  Re‑creating that function
 * on every keystroke causes React to unmount / remount the subtree (and your
 * textarea loses focus).  We memoise the scaffolded component so its identity
 * stays stable across renders unless the *spec itself* really changes.
 */
const ToBooleanNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as ToBooleanData),
    [
      (nodeData as ToBooleanData).expandedSize,
      (nodeData as ToBooleanData).collapsedSize,
    ]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <ToBooleanNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default ToBooleanNodeWithDynamicSpec;
