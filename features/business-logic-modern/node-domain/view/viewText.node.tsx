/**
 * viewText NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Presents incoming text with ZERO structural styling – the surrounding scaffold handles
 *   borders, sizing, themes, drag/selection states, etc.
 * • Zod‑based schema gives auto‑generated, type‑checked Inspector controls.
 * • Dynamic sizing is driven directly by node data (expandedSize / collapsedSize).
 * • All data handling is funnelled through one formatter (formatValue) to avoid duplication.
 * • Strict separation of responsibilities:
 *     – createDynamicSpec: returns a NodeSpec based only on data               (pure)
 *     – ViewTextNode:      deals with React‑Flow store & data propagation       (impure)
 * • Memoised helpers & refs prevent unnecessary renders / infinite loops.
 * • Updated to use new unified handle-based input reading system
 */

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { generateoutputField } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";
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
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const ViewTextDataSchema = z
  .object({
    store: SafeSchemas.text(""),
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    inputs: SafeSchemas.optionalText(),
    output: z.record(z.string(), z.string()).optional(), // handle-based output object for Convex compatibility
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C2"),
    label: z.string().nullable().optional().default(""), // User-editable node label, can be null
  })
  .passthrough();

export type ViewTextData = z.infer<typeof ViewTextDataSchema>;

const validateNodeData = createNodeValidator(ViewTextDataSchema, "ViewText");

// -----------------------------------------------------------------------------
// 2️⃣  Helper – format any value into a display‑ready string (re‑used everywhere)
// -----------------------------------------------------------------------------

const COMMON_OBJECT_PROPS = [
  "response", // Prioritize response field for AI output
  "text",
  "output",
  "value",
  "content",
  "message",
  "result",
  "data",
  "body",
  "payload",
  "input",
] as const;

function formatValue(value: unknown): string {
  // ── Primitives ──────────────────────────────────────────────────────────────
  if (
    value === null ||
    value === undefined ||
    value === false ||
    value === "" ||
    value === 0
  ) {
    return "";
  }

  if (typeof value !== "object") {
    return String(value);
  }

  // ── Objects / Arrays ────────────────────────────────────────────────────────
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "";
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "[Array]";
    }
  }

  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof RegExp) {
    return value.toString();
  }
  if (value instanceof Error) {
    return `Error: ${value.message}`;
  }
  if (value instanceof Map) {
    return value.size
      ? JSON.stringify(Array.from(value.entries()), null, 2)
      : "";
  }
  if (value instanceof Set) {
    return value.size ? JSON.stringify(Array.from(value), null, 2) : "";
  }
  if (value instanceof Promise) {
    return "[Promise]";
  }

  // Plain object – try common prop names first
  for (const prop of COMMON_OBJECT_PROPS) {
    const inner = (value as Record<string, unknown>)[prop];
    if (inner !== undefined && inner !== null) {
      return formatValue(inner);
    }
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[Object]";
  }
}

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

function createDynamicSpec(data: ViewTextData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ||
    EXPANDED_SIZES.VE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ||
    COLLAPSED_SIZES.C2;

  return {
    kind: "viewText",
    displayName: "View Text",
    label: "View Text",
    category: CATEGORIES.VIEW,
    size: { expanded, collapsed },
    handles: [
      {
        id: "output",
        code: "s",
        position: "right",
        type: "source",
        dataType: "String",
      },
      {
        id: "input",
        code: "s",
        position: "left",
        type: "target",
        dataType: "String",
      },
    ],
    inspector: { key: "ViewTextInspector" },
    version: 1,
    runtime: { execute: "viewText_execute_v1" },
    initialData: createSafeInitialData(ViewTextDataSchema, {
      isEnabled: true, // Enable node by default
      isActive: false, // Will become active when enabled
      isExpanded: false, // Default to collapsed
    }),
    dataSchema: ViewTextDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputs",
        "output",
        "expandedSize",
        "collapsedSize",
      ],
      customFields: [{ key: "isExpanded", type: "boolean", label: "Expand" }],
    },
    icon: "LuFileText",
    author: "Agenitix Team",
    description: "Displays & formats text content from connected nodes",
    feature: "base",
    tags: ["display", "formatting"],
    receivedData: {
      enabled: true,
      displayMode: "formatted",
      showInCollapsed: true,
      formatData: formatValue,
    },
  };
}

// Static spec for registry (default sizes)
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C2",
} as ViewTextData);

// -----------------------------------------------------------------------------
// 4️⃣  Styles (internal content only – theme comes from scaffold)
// -----------------------------------------------------------------------------

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex items-center justify-center",
} as const;

const CATEGORY_TEXT = {
  VIEW: {
    primary: "text-[--node-view-text]",
  },
  CREATE: {
    primary: "text-[--node-create-text]",
  },
  // …add others as needed
} as const;

// -----------------------------------------------------------------------------
// 5️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const ViewTextNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // Sync with React‑Flow store
    const { nodeData, updateNodeData } = useNodeData(id, data);
    const { getNodes, getEdges } = useReactFlow();

    // Derived state -------------------------------------------------------------
    const isExpanded = (nodeData as ViewTextData).isExpanded;
    const categoryStyles = CATEGORY_TEXT.VIEW;

    // Helpers -------------------------------------------------------------------
    const lastInputRef = useRef<string | null>(null);
    const lastGeneralOutputRef = useRef<any>(null);
    const lastInputDataRef = useRef<{
      inputs: string;
      isActive: boolean;
    } | null>(null);

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    /** Clear JSON‑ish fields when inactive */
    const blockJsonWhenInactive = useCallback(() => {
      if (!(nodeData as ViewTextData).isActive) {
        updateNodeData({
          json: null,
          data: null,
          payload: null,
          result: null,
          response: null,
        });
      }
    }, [nodeData, updateNodeData]);

    // Handle-based output field generation for multi-handle compatibility -------
    useEffect(() => {
      try {
        // Validate inputs before processing
        if (!spec || !nodeData || typeof nodeData !== 'object') {
          console.warn(`ViewText ${id}: Invalid spec or nodeData`, { spec: !!spec, nodeData: typeof nodeData });
          return;
        }

        // Safe type casting with validation
        const validatedNodeData = ViewTextDataSchema.safeParse(nodeData);
        if (!validatedNodeData.success) {
          console.warn(`ViewText ${id}: NodeData validation failed`, validatedNodeData.error);
          return;
        }

        // Generate Map-based output with enhanced error handling
        const outputValue = generateoutputField(spec, validatedNodeData.data);

        // Validate the result with enhanced checks
        if (!outputValue || !(outputValue instanceof Map)) {
          console.error(
            `ViewText ${id}: generateoutputField did not return a valid Map`,
            { outputValue, type: typeof outputValue }
          );
          return;
        }

        // Convert Map to plain object for Convex compatibility with safety checks
        let outputObject: Record<string, any> = {};
        try {
          outputObject = Object.fromEntries(outputValue.entries());
        } catch (conversionError) {
          console.error(`ViewText ${id}: Error converting Map to object`, conversionError);
          outputObject = {};
        }

        // Only update if changed - compare with ref to avoid circular dependencies
        const currentOutput = lastGeneralOutputRef.current;
        let hasChanged = true;

        if (currentOutput instanceof Map && outputValue instanceof Map) {
          try {
            // Compare Map contents with error handling
            hasChanged =
              currentOutput.size !== outputValue.size ||
              !Array.from(outputValue.entries()).every(
                ([key, value]) => {
                  try {
                    return currentOutput.get(key) === value;
                  } catch {
                    return false;
                  }
                }
              );
          } catch (comparisonError) {
            console.warn(`ViewText ${id}: Error comparing Maps, forcing update`, comparisonError);
            hasChanged = true;
          }
        } else if (currentOutput === null && outputValue.size === 0) {
          hasChanged = false;
        }

        if (hasChanged) {
          lastGeneralOutputRef.current = outputValue;
          try {
            updateNodeData({ output: outputObject });
          } catch (updateError) {
            console.error(`ViewText ${id}: Error updating node data`, updateError);
          }
        }
      } catch (error) {
        console.error(`ViewText ${id}: Critical error in output generation`, error, {
          spec: spec?.kind,
          nodeDataKeys: nodeData ? Object.keys(nodeData) : [],
          errorType: error instanceof Error ? error.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error)
        });

        // Enhanced fallback: set empty object to prevent crashes
        try {
          if (lastGeneralOutputRef.current !== null) {
            lastGeneralOutputRef.current = new Map();
            updateNodeData({ output: {} });
          }
        } catch (fallbackError) {
          console.error(`ViewText ${id}: Even fallback failed`, fallbackError);
        }
      }
    }, [spec.handles, nodeData.inputs, nodeData.isActive, updateNodeData, id]);

    // Main effect – watch upstream nodes & compute text -------------------------
    useEffect(() => {
      try {
        const nodes = getNodes();
        const edges = getEdges().filter((e) => e.target === id);

        const connected = edges
          .map((e) => {
            try {
              return nodes.find((n) => n && n.id === e.source);
            } catch (findError) {
              console.warn(`ViewText ${id}: Error finding source node ${e.source}`, findError);
              return null;
            }
          })
          .filter((node): node is NonNullable<typeof node> => {
            return node !== null && node !== undefined && typeof node === 'object' && 'id' in node;
          });



        // Enhanced input processing with new unified handle-based system
        const texts = connected
          .filter((n) => {
            try {
              // Validate node structure
              if (!n || typeof n !== 'object' || !n.data) {
                return false;
              }

              // Only accept content from active source nodes
              const sourceIsActive = n.data?.isActive === true;
              if (!sourceIsActive) {
                return false;
              }

              // New unified handle-based input reading system with safety checks
              const sourceData = n.data;
              let inputValue: any;

              // 1. Handle-based output (primary system)
              if (sourceData?.output && typeof sourceData.output === "object") {
                try {
                  // For viewText, we accept any output from connected handles
                  const output = sourceData.output as Record<string, any>;
                  // Get first available output value safely
                  const outputValues = Object.values(output);
                  if (outputValues.length > 0) {
                    const firstOutputValue = outputValues[0];
                    if (firstOutputValue !== undefined) {
                      inputValue = firstOutputValue;
                    }
                  }
                } catch (outputError) {
                  console.warn(`ViewText ${id}: Error processing output from node ${n.id}`, outputError);
                }
              }

              // 2. Legacy fallbacks for compatibility
              if (inputValue === undefined) {
                if (sourceData?.output !== undefined) {
                  inputValue = sourceData.output;
                }
              }

              // 3. Final fallback to whole data object
              if (inputValue === undefined) {
                inputValue = sourceData;
              }

              const nodeText = formatValue(inputValue);

              // Check if content is meaningful (not default values)
              const isDefaultText =
                nodeText === "Default text" ||
                nodeText === "No connected inputs" ||
                nodeText === "Empty input";
              const hasMeaningfulContent =
                nodeText && nodeText.trim().length > 0 && !isDefaultText;

              return hasMeaningfulContent;
            } catch (filterError) {
              console.warn(`ViewText ${id}: Error filtering node ${n?.id}`, filterError);
              return false;
            }
          })
          .map((n) => {
            try {
              // New unified handle-based input reading system with safety
              const sourceData = n.data;
              let inputValue: any;

              // 1. Handle-based output (primary system)
              if (sourceData?.output && typeof sourceData.output === "object") {
                try {
                  // For viewText, we accept any output from connected handles
                  const output = sourceData.output as Record<string, any>;
                  // Get first available output value safely
                  const outputValues = Object.values(output);
                  if (outputValues.length > 0) {
                    const firstOutputValue = outputValues[0];
                    if (firstOutputValue !== undefined) {
                      inputValue = firstOutputValue;
                    }
                  }
                } catch (outputError) {
                  console.warn(`ViewText ${id}: Error processing output in map from node ${n.id}`, outputError);
                }
              }

              // 2. Legacy fallbacks for compatibility
              if (inputValue === undefined) {
                if (sourceData?.output !== undefined) {
                  inputValue = sourceData.output;
                }
              }

              // 3. Final fallback to whole data object
              if (inputValue === undefined) {
                inputValue = sourceData;
              }

              return formatValue(inputValue) || "";
            } catch (mapError) {
              console.warn(`ViewText ${id}: Error mapping node ${n?.id}`, mapError);
              return "";
            }
          })
          .filter((t) => {
            try {
              return typeof t === 'string' && t.trim().length > 0;
            } catch (filterError) {
              console.warn(`ViewText ${id}: Error filtering text`, filterError);
              return false;
            }
          });

        const joined = texts.join("");

        if (joined !== lastInputRef.current) {
          lastInputRef.current = joined;

          const hasContent = joined.trim().length > 0;
          const hasConnectedInputs = connected.length > 0;
          const active = hasConnectedInputs && hasContent;

          const newInputData = {
            inputs: hasConnectedInputs ? joined || "No inputs" : "No inputs",
            isActive: active,
          };

          // Only update if the input data actually changed, basically avoid unnecessary updates
          const lastInputData = lastInputDataRef.current;
          const hasInputDataChanged =
            !lastInputData ||
            lastInputData.inputs !== newInputData.inputs ||
            lastInputData.isActive !== newInputData.isActive;

          if (hasInputDataChanged) {
            try {
              lastInputDataRef.current = newInputData;
              updateNodeData(newInputData);
              blockJsonWhenInactive();
            } catch (updateError) {
              console.error(`ViewText ${id}: Error updating input data`, updateError);
            }
          }
        }
      } catch (mainEffectError) {
        console.error(`ViewText ${id}: Critical error in main effect`, mainEffectError);
      }
    }, [getEdges, getNodes, id, blockJsonWhenInactive, updateNodeData]);

    // Validate ------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("ViewText", id, validation.errors, {
        originalData: validation.originalData,
        component: "ViewTextNode",
      });
    }

    useNodeDataValidation(ViewTextDataSchema, "ViewText", validation.data, id);

    // Render --------------------------------------------------------------------
    return (
      <>
        {/* Editable label or icon */}
        {!isExpanded &&
        spec.size.collapsed.width === 60 &&
        spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center p-1 text-foreground/80 text-lg">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode
            nodeId={id}
            label={(nodeData as ViewTextData).label || spec.displayName}
          />
        )}

        {isExpanded ? (
          <div className={CONTENT.expanded}>
            <div className={CONTENT.body}>
              <div className="whitespace-pre-line break-words text-center font-normal text-xs mt-2">
                {typeof validation.data.inputs === "string"
                  ? validation.data.inputs
                  : validation.data.inputs
                    ? JSON.stringify(validation.data.inputs, null, 2)
                    : "No inputs"}
              </div>
            </div>
          </div>
        ) : (
          <div className={CONTENT.collapsed}>
            {(typeof validation.data.inputs === "string"
              ? validation.data.inputs !== "No inputs"
              : validation.data.inputs !== undefined) ? (
              <div
                className={` nowheel overflow-y-auto text-center text-xs mt-6 ${categoryStyles.primary}`}
                style={{
                  width: `${spec.size.collapsed.width - 20}px`,
                  height: `${spec.size.collapsed.height - 20}px`,
                }}
              >
                {typeof validation.data.inputs === "string"
                  ? validation.data.inputs
                  : validation.data.inputs
                    ? JSON.stringify(validation.data.inputs, null, 2)
                    : "..."}
              </div>
            ) : (
              <div
                className={`font-medium text-xs tracking-wide ${categoryStyles.primary}`}
              >
                ...
              </div>
            )}
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
// 6️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

const ViewTextNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as ViewTextData),
    [nodeData.expandedSize, nodeData.collapsedSize]
  );

  return withNodeScaffold(dynamicSpec, (p) => (
    <ViewTextNode {...p} spec={dynamicSpec} />
  ))(props);
};

export default ViewTextNodeWithDynamicSpec;
