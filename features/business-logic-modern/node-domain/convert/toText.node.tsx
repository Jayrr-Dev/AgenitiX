/**
 * ToText NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Converts any input to string representation
 * • Supports multiple text conversion formats (default, json, pretty, debug)
 * • Configurable max length with truncation
 * • Shows input and output with conversion details
 *
 * Keywords: to-text, string-conversion, schema-driven, type‑safe
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
  toTextValue,
  getTextDisplay
} from "./utils";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const ToTextDataSchema = z
  .object({
    // Input/Output
    inputValue: z.any().optional(),
    textOutput: z.string().default(""),

    // Text-specific options
    format: z.enum(["default", "json", "pretty", "debug"]).default("default"),
    maxLength: z.number().optional(),
    truncateIndicator: z.string().default("..."),

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

export type ToTextData = z.infer<typeof ToTextDataSchema>;

const validateNodeData = createNodeValidator(
  ToTextDataSchema,
  "ToText",
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

function createDynamicSpec(data: ToTextData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE3;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "toText",
    displayName: "To Text",
    label: "To Text",
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
        id: "text-output",
        code: "s",
        position: "right",
        type: "source",
        dataType: "String",
      },
    ],
    inspector: { key: "ToTextInspector" },
    version: 1,
    runtime: { execute: "toText_execute_v1" },
    initialData: createSafeInitialData(ToTextDataSchema, {
      inputValue: null,
      textOutput: "",
      format: "default",
      hasError: false,
      errorMessage: undefined,
    }),
    dataSchema: ToTextDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputValue",
        "textOutput",
        "hasError",
        "errorMessage",
        "expandedSize",
        "collapsedSize",
        "output",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { 
          key: "format", 
          type: "select", 
          label: "Format"
        },
        { key: "maxLength", type: "number", label: "Max Length", description: "Maximum output length (optional)" },
        { key: "truncateIndicator", type: "text", label: "Truncate Indicator", description: "Text to show when truncated" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuType",
    author: "Agenitix Team",
    description: "Converts any input to string representation",
    feature: "base",
    tags: ["convert", "text", "string", "type-conversion"],
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE3",
  collapsedSize: "C2",
} as ToTextData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const ToTextNode = memo(
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
      textOutput,
      format,
      maxLength,
      truncateIndicator,
      hasError,
      errorMessage
    } = nodeData as ToTextData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<string | null>(null);

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

    /** Propagate text output ONLY when node is active AND enabled */
    const propagate = useCallback(
      (value: string) => {
        const shouldSend = isActive && isEnabled;
        const out = shouldSend ? value : "";
        if (out !== lastOutputRef.current) {
          lastOutputRef.current = out;
          updateNodeData({ textOutput: out, output: out });
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
     * Accepts any type of input for text conversion.
     */
    const computeInput = useCallback((): any => {
      const anyInputEdge = findEdgeByHandle(edges, id, "any-input");

      if (!anyInputEdge) return null;

      const src = nodes.find((n) => n.id === anyInputEdge.source);
      if (!src) return null;

      // Get the raw input value for text conversion
      return src.data?.output ?? src.data?.store ?? src.data;
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

    /* 🔄 Convert input to text when input changes */
    useEffect(() => {
      if (inputValue !== undefined && inputValue !== null) {
        try {
          const converted = toTextValue(inputValue, format, maxLength);
          updateNodeData({
            textOutput: converted,
            hasError: false,
            errorMessage: undefined,
            isActive: true
          });
        } catch (error) {
          updateNodeData({
            hasError: true,
            errorMessage: error instanceof Error ? error.message : 'Conversion error',
            isActive: false
          });
        }
      } else {
        updateNodeData({
          textOutput: "",
          isActive: false,
          hasError: false,
          errorMessage: undefined
        });
      }
    }, [inputValue, format, maxLength, updateNodeData]);

    // Propagate text output when active and enabled
    useEffect(() => {
      if (isActive && isEnabled && !hasError) {
        propagate(textOutput);
      } else {
        propagate("");
      }
      blockJsonWhenInactive();
    }, [isActive, isEnabled, hasError, textOutput, propagate, blockJsonWhenInactive]);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("ToText", id, validation.errors, {
        originalData: validation.originalData,
        component: "ToTextNode",
      });
    }

    useNodeDataValidation(
      ToTextDataSchema,
      "ToText",
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
          Loading toText feature...
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
          <LabelNode nodeId={id} label={(nodeData as ToTextData).label || spec.displayName} />
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
                    {getTextDisplay(textOutput)}
                  </div>
                </div>
              )}
              {inputValue !== null && inputValue !== undefined && (
                <div className="text-[10px] opacity-50 mt-1 text-center max-w-full truncate">
                  {String(inputValue).substring(0, 15)}
                  {String(inputValue).length > 15 ? '...' : ''}
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
                    : JSON.stringify(inputValue, null, 2)
                  }
                </div>
              </div>

              {/* Output Display */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Text Output:</label>
                <div className={`mt-1 p-2 rounded text-xs font-mono ${hasError
                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  }`}>
                  {hasError ? `Error: ${errorMessage}` : getTextDisplay(textOutput)}
                </div>
              </div>

              {/* Conversion Info */}
              {!hasError && inputValue !== null && inputValue !== undefined && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Conversion:</label>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Format: <span className="font-mono">{format}</span>
                    {maxLength && (
                      <>
                        {' • '}
                        Max length: <span className="font-mono">{maxLength}</span>
                      </>
                    )}
                    <br />
                    Length: <span className="font-mono">{textOutput.length}</span> characters
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

const ToTextNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as ToTextData),
    [
      (nodeData as ToTextData).expandedSize,
      (nodeData as ToTextData).collapsedSize,
    ],
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <ToTextNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec],
  );

  return <ScaffoldedNode {...props} />;
};

export default ToTextNodeWithDynamicSpec;