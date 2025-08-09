/**
 * ToAny NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Passes through any input as universal any type
 * • Simple identity function with optional metadata preservation
 * • Useful for type compatibility and universal connections
 * • Shows input and output with passthrough details
 *
 * Keywords: to-any, passthrough, schema-driven, type‑safe
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

// Import conversion utilities
import {
  toAnyValue,
  getAnyDisplay
} from "./utils";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const ToAnyDataSchema = z
  .object({
    // Input/Output
    inputValue: z.any().optional(),
    anyOutput: z.any().optional(),

    // Any-specific options
    preserveMetadata: z.boolean().default(false),

    // UI State
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE3"),
    collapsedSize: SafeSchemas.text("C2"),

    // Error handling
    hasError: z.boolean().default(false),
    errorMessage: z.string().optional(),

    // Legacy compatibility
    output: SafeSchemas.optionalText(),
    label: z.string().optional(),
  })
  .passthrough();

export type ToAnyData = z.infer<typeof ToAnyDataSchema>;

const validateNodeData = createNodeValidator(
  ToAnyDataSchema,
  "ToAny",
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  disabled: "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

function createDynamicSpec(data: ToAnyData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE3;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "toAny",
    displayName: "To Any",
    label: "To Any",
    category: CATEGORIES.CONVERT,
    size: { expanded, collapsed },
    handles: [
      {
        id: "any-input",
        code: "x",
        position: "top",
        type: "target",
        dataType: "Any",
      },
      {
        id: "any-output",
        code: "x",
        position: "right",
        type: "source",
        dataType: "Any",
      },
    ],
    inspector: { key: "ToAnyInspector" },
    version: 1,
    runtime: { execute: "toAny_execute_v1" },
    initialData: createSafeInitialData(ToAnyDataSchema, {
      inputValue: null,
      anyOutput: null,
      preserveMetadata: false,
      hasError: false,
      errorMessage: undefined,
    }),
    dataSchema: ToAnyDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputValue",
        "anyOutput",
        "hasError",
        "errorMessage",
        "expandedSize",
        "collapsedSize",
        "output",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "preserveMetadata", type: "boolean", label: "Preserve Metadata", description: "Create shallow copy for objects" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuCircle",
    author: "Agenitix Team",
    description: "Passes through any input as universal any type",
    feature: "base",
    tags: ["convert", "any", "passthrough", "type-conversion"],
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE3",
  collapsedSize: "C2",
} as ToAnyData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const ToAnyNode = memo(
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
      anyOutput,
      preserveMetadata,
      hasError,
      errorMessage
    } = nodeData as ToAnyData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<any>(null);

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

    /** Propagate any output ONLY when node is active AND enabled */
    const propagate = useCallback(
      (value: any) => {
        const shouldSend = isActive && isEnabled;
        const out = shouldSend ? value : null;
        if (JSON.stringify(out) !== JSON.stringify(lastOutputRef.current)) {
          lastOutputRef.current = out;
          updateNodeData({ 
            anyOutput: out, 
            output: out 
          });
        }
      },
      [isActive, isEnabled, updateNodeData],
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
     * Accepts any type of input for passthrough.
     */
    const computeInput = useCallback((): any => {
      const anyInputEdge = findEdgeByHandle(edges, id, "any-input");

      if (!anyInputEdge) return null;

      const src = nodes.find((n) => n.id === anyInputEdge.source);
      if (!src) return null;

      // Get the raw input value for passthrough
      return src.data?.output ?? src.data?.store ?? src.data;
    }, [edges, nodes, id]);

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Whenever nodes/edges change, recompute inputs. */
    useEffect(() => {
      const inputVal = computeInput();
      if (JSON.stringify(inputVal) !== JSON.stringify(inputValue)) {
        updateNodeData({ inputValue: inputVal });
      }
    }, [computeInput, inputValue, updateNodeData]);

    /* 🔄 Pass through input when input changes */
    useEffect(() => {
      if (inputValue !== undefined && inputValue !== null) {
        try {
          const converted = toAnyValue(inputValue, preserveMetadata);
          updateNodeData({
            anyOutput: converted,
            hasError: false,
            errorMessage: undefined,
            isActive: true
          });
        } catch (error) {
          updateNodeData({
            hasError: true,
            errorMessage: error instanceof Error ? error.message : 'Passthrough error',
            isActive: false
          });
        }
      } else {
        updateNodeData({
          anyOutput: null,
          isActive: false,
          hasError: false,
          errorMessage: undefined
        });
      }
    }, [inputValue, preserveMetadata, updateNodeData]);

    // Propagate any output when active and enabled
    useEffect(() => {
      if (isActive && isEnabled && !hasError) {
        propagate(anyOutput);
      } else {
        propagate(null);
      }
      blockJsonWhenInactive();
    }, [isActive, isEnabled, hasError, anyOutput, propagate, blockJsonWhenInactive]);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("ToAny", id, validation.errors, {
        originalData: validation.originalData,
        component: "ToAnyNode",
      });
    }

    useNodeDataValidation(
      ToAnyDataSchema,
      "ToAny",
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
          Loading toAny feature...
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
          <LabelNode nodeId={id} label={(nodeData as ToAnyData).label || spec.displayName} />
        )}

        {!isExpanded ? (
          <div className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className="flex flex-col items-center justify-center text-xs">
              {hasError ? (
                <div className="text-red-500 text-center">
                  <div>Error</div>
                  <div className="text-[10px] opacity-75">{errorMessage}</div>
                </div>
              ) : (
                <div className="font-mono text-xs text-center max-w-full">
                  <div className="truncate">
                    {inputValue !== null && inputValue !== undefined ? 'Pass' : 'Any'}
                  </div>
                </div>
              )}
              {inputValue !== null && inputValue !== undefined && (
                <div className="text-[10px] opacity-50 mt-1 text-center max-w-full truncate">
                  {typeof inputValue} → any
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className="space-y-3">
              {/* Input Display */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Input:</label>
                <div className="mt-1 p-2 bg-muted rounded text-xs font-mono">
                  {inputValue === null || inputValue === undefined
                    ? 'No input connected'
                    : getAnyDisplay(inputValue)
                  }
                </div>
              </div>

              {/* Output Display */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Any Output:</label>
                <div className={`mt-1 p-2 rounded text-xs font-mono ${hasError
                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  }`}>
                  {hasError ? `Error: ${errorMessage}` : getAnyDisplay(anyOutput)}
                </div>
              </div>

              {/* Conversion Info */}
              {!hasError && inputValue !== null && inputValue !== undefined && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Passthrough:</label>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Type: <span className="font-mono">{typeof inputValue}</span>
                    {' → '}
                    <span className="font-mono">any</span>
                    <br />
                    Metadata: <span className="font-mono">{preserveMetadata ? 'preserved' : 'direct'}</span>
                    {' • '}
                    Same reference: <span className="font-mono">{anyOutput === inputValue ? 'yes' : 'no'}</span>
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
  },
);

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

const ToAnyNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as ToAnyData),
    [
      (nodeData as ToAnyData).expandedSize,
      (nodeData as ToAnyData).collapsedSize,
    ],
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <ToAnyNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec],
  );

  return <ScaffoldedNode {...props} />;
};

export default ToAnyNodeWithDynamicSpec;