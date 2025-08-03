/**
 * CreateMap NODE – Key‑value table interface for dictionary creation
 *
 * • Shows a simple key-value table interface for creating dictionaries/objects
 * • Outputs a plain object (not Map) for Convex compatibility
 * • Dynamic sizing (expandedSize / collapsedSize) drives the spec
 * • Output propagation is gated by `isActive` *and* `isEnabled` to prevent runaway loops
 * • Uses findEdgeByHandle utility for robust React Flow edge handling
 * • Auto-disables when all input connections are removed (handled by flow store)
 * • Code is fully commented and follows current React + TypeScript best practices
 *
 * Keywords: create-map, key-value-table, dictionary, type‑safe, clean‑architecture
 */

import { Button } from "@/components/ui/button";
import type { NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
// import { useNodeToast } from "@/hooks/useNodeToast";
import { useStore } from "@xyflow/react";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const CreateMapDataSchema = z
  .object({
    store: SafeSchemas.text(""), // Will store JSON string of key-value pairs
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    inputs: SafeSchemas.optionalText().nullable().default(null),
    output: z.record(z.string(), z.any()).optional(), // handle-based output object for Convex compatibility
    expandedSize: SafeSchemas.text("FE2"),
    collapsedSize: SafeSchemas.text("C1W"),
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type CreateMapData = z.infer<typeof CreateMapDataSchema>;

const validateNodeData = createNodeValidator(CreateMapDataSchema, "CreateMap");

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

// Category text styles (unused but kept for consistency)
// const CATEGORY_TEXT = {
//   CREATE: {
//     primary: "text-[--node--c-r-e-a-t-e-text]",
//   },
// } as const;

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex items-center justify-center",
  disabled:
    "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// Key-value pair interface
interface KeyValuePair {
  key: string;
  value: string;
}

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: CreateMapData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.FE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C1W;

  return {
    kind: "createMap",
    displayName: "CreateMap",
    label: "CreateMap",
    category: CATEGORIES.CREATE,
    size: { expanded, collapsed },
    handles: [
      {
        id: "json-input",
        code: "j",
        position: "top",
        type: "target",
        dataType: "JSON",
      },
      {
        id: "output",
        code: "s",
        position: "right",
        type: "source",
        dataType: "String",
      },
      {
        id: "input",
        code: "b",
        position: "left",
        type: "target",
        dataType: "Boolean",
      },
    ],
    inspector: { key: "CreateMapInspector" },
    version: 1,
    runtime: { execute: "createMap_execute_v1" },
    initialData: createSafeInitialData(CreateMapDataSchema, {
      store: "{}",
      inputs: null,
      output: {}, // handle-based output object
    }),
    dataSchema: CreateMapDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputs",
        "output",
        "expandedSize",
        "collapsedSize",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        {
          key: "store",
          type: "textarea",
          label: "Store",
          placeholder: "Enter your content here…",
          ui: { rows: 4 },
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuDatabase",
    author: "Agenitix Team",
    description: "CreateMap node for creation",
    feature: "base",
    tags: ["create", "createMap"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This createMap node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "FE2",
  collapsedSize: "C1W",
} as CreateMapData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const CreateMapNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);
    // Toast notifications available if needed
    // const { showInfo } = useNodeToast(id);

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const { isExpanded, isEnabled, isActive, store } =
      nodeData as CreateMapData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted output to avoid redundant writes
    const lastGeneralOutputRef = useRef<any>(null);

    // Category styles for future use
    // const categoryStyles = CATEGORY_TEXT.CREATE;

    // Local state for key-value pairs
    const [keyValuePairs, setKeyValuePairs] = useState<KeyValuePair[]>([
      { key: "", value: "" },
    ]);

    // Ref to track debounce timeout for store updates
    const storeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    /** Clear JSON‑ish fields when inactive or disabled */
    const blockJsonWhenInactive = useCallback(() => {
      if (!(isActive && isEnabled)) {
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
     * Compute the latest text coming from connected input handles.
     *
     * Uses findEdgeByHandle utility to properly handle React Flow's handle naming
     * conventions (handles get type suffixes like "json-input__j", "input__b").
     *
     * Priority: json-input > input (modify based on your node's specific handles)
     */
    const computeInput = useCallback((): string | null => {
      // Check json-input handle first, then input handle as fallback
      const jsonInputEdge = findEdgeByHandle(edges, id, "json-input");
      const inputEdge = findEdgeByHandle(edges, id, "input");

      const incoming = jsonInputEdge || inputEdge;
      if (!incoming) return null;

      const src = nodes.find((n) => n.id === incoming.source);
      if (!src) return null;

      // Unified input reading system - prioritize handle-based output, basically single source for input data
      const sourceData = src.data;
      let inputValue: any;

      // 1. Handle-based output (unified system)
      if (sourceData?.output && typeof sourceData.output === "object") {
        // Try to get value from handle-based output
        const handleId = incoming.sourceHandle
          ? normalizeHandleId(incoming.sourceHandle)
          : "output";
        const output = sourceData.output as Record<string, any>;
        if (output[handleId] !== undefined) {
          inputValue = output[handleId];
        } else {
          // Fallback: get first available output value
          const firstOutput = Object.values(output)[0];
          if (firstOutput !== undefined) {
            inputValue = firstOutput;
          }
        }
      }

      // 2. Legacy value fallbacks for compatibility
      if (inputValue === undefined) {
        inputValue = sourceData?.store ?? sourceData;
      }

      return typeof inputValue === "string"
        ? inputValue
        : String(inputValue || "");
    }, [edges, nodes, id]);

    // Convert key-value pairs to object
    const convertPairsToObject = useCallback((pairs: KeyValuePair[]) => {
      const obj: Record<string, string> = {};
      pairs.forEach(({ key, value }) => {
        if (key.trim()) {
          obj[key.trim()] = value;
        }
      });
      return obj;
    }, []);

    // Convert object to key-value pairs
    const convertObjectToPairs = useCallback((obj: Record<string, any>) => {
      const pairs: KeyValuePair[] = [];
      Object.entries(obj).forEach(([key, value]) => {
        pairs.push({ key, value: String(value) });
      });
      if (pairs.length === 0) {
        pairs.push({ key: "", value: "" });
      }
      return pairs;
    }, []);

    // Handle key-value pair changes with debounced store updates
    const handlePairChange = useCallback(
      (index: number, field: "key" | "value", value: string) => {
        const newPairs = [...keyValuePairs];
        newPairs[index][field] = value;
        setKeyValuePairs(newPairs);

        // Clear existing timeout to prevent multiple updates
        if (storeUpdateTimeoutRef.current) {
          clearTimeout(storeUpdateTimeoutRef.current);
        }

        // Debounce the store update to prevent focus loss, basically delay the update
        storeUpdateTimeoutRef.current = setTimeout(() => {
          const obj = convertPairsToObject(newPairs);
          updateNodeData({ store: JSON.stringify(obj) });
          storeUpdateTimeoutRef.current = null;
        }, 300); // 300ms delay
      },
      [keyValuePairs, convertPairsToObject, updateNodeData]
    );

    // Add new key-value pair
    const addPair = useCallback(() => {
      const newPairs = [...keyValuePairs, { key: "", value: "" }];
      setKeyValuePairs(newPairs);

      // Clear existing timeout to prevent multiple updates
      if (storeUpdateTimeoutRef.current) {
        clearTimeout(storeUpdateTimeoutRef.current);
      }

      // Debounce the store update
      storeUpdateTimeoutRef.current = setTimeout(() => {
        const obj = convertPairsToObject(newPairs);
        updateNodeData({ store: JSON.stringify(obj) });
        storeUpdateTimeoutRef.current = null;
      }, 300);
    }, [keyValuePairs, convertPairsToObject, updateNodeData]);

    // Remove key-value pair
    const removePair = useCallback(
      (index: number) => {
        if (keyValuePairs.length > 1) {
          const newPairs = keyValuePairs.filter((_, i) => i !== index);
          setKeyValuePairs(newPairs);

          // Clear existing timeout to prevent multiple updates
          if (storeUpdateTimeoutRef.current) {
            clearTimeout(storeUpdateTimeoutRef.current);
          }

          // Debounce the store update
          storeUpdateTimeoutRef.current = setTimeout(() => {
            const obj = convertPairsToObject(newPairs);
            updateNodeData({ store: JSON.stringify(obj) });
            storeUpdateTimeoutRef.current = null;
          }, 300);
        }
      },
      [keyValuePairs, convertPairsToObject, updateNodeData]
    );

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Handle-based output field generation for multi-handle compatibility */
    useEffect(() => {
      try {
        // Create a data object with proper handle field mapping, basically map store to output handle
        const mappedData = {
          ...nodeData,
          output: nodeData.store, // Map store field to output handle
        };

        // Generate Map-based output with error handling
        const outputValue = generateoutputField(spec, mappedData as any);

        // Validate the result
        if (!(outputValue instanceof Map)) {
          console.error(
            `CreateMap ${id}: generateoutputField did not return a Map`,
            outputValue
          );
          return;
        }

        // Convert Map to plain object for Convex compatibility, basically serialize for storage
        const outputObject = Object.fromEntries(outputValue.entries());

        // Only update if changed
        const currentoutput = lastGeneralOutputRef.current;
        let hasChanged = true;

        if (currentoutput instanceof Map && outputValue instanceof Map) {
          // Compare Map contents
          hasChanged =
            currentoutput.size !== outputValue.size ||
            !Array.from(outputValue.entries()).every(
              ([key, value]) => currentoutput.get(key) === value
            );
        }

        if (hasChanged) {
          lastGeneralOutputRef.current = outputValue;
          updateNodeData({ output: outputObject });
        }
      } catch (error) {
        console.error(`CreateMap ${id}: Error generating output`, error, {
          spec: spec?.kind,
          nodeDataKeys: Object.keys(nodeData || {}),
        });

        // Fallback: set empty object to prevent crashes, basically empty state for storage
        if (lastGeneralOutputRef.current !== null) {
          lastGeneralOutputRef.current = new Map();
          updateNodeData({ output: {} });
        }
      }
    }, [spec.handles, nodeData, updateNodeData, id]);

    /* 🔄 Whenever nodes/edges change, recompute inputs. */
    useEffect(() => {
      const inputVal = computeInput();
      if (inputVal !== (nodeData as CreateMapData).inputs) {
        updateNodeData({ inputs: inputVal });
      }
    }, [computeInput, nodeData, updateNodeData]);

    /* 🔄 Make isEnabled dependent on input value only when there are connections. */
    useEffect(() => {
      const hasInput = (nodeData as CreateMapData).inputs;
      // Only auto-control isEnabled when there are connections (inputs !== null)
      // When inputs is null (no connections), let user manually control isEnabled
      if (hasInput !== null) {
        const nextEnabled = hasInput && hasInput.trim().length > 0;
        if (nextEnabled !== isEnabled) {
          updateNodeData({ isEnabled: nextEnabled });
        }
      }
    }, [nodeData, isEnabled, updateNodeData]);

    // Monitor store content and update active state
    useEffect(() => {
      const currentStore = store ?? "";
      const hasValidStore =
        currentStore.trim().length > 0 &&
        currentStore !== "{}" &&
        currentStore !== "Default text";

      // If disabled, always set isActive to false
      if (isEnabled) {
        if (isActive !== hasValidStore) {
          updateNodeData({ isActive: hasValidStore });
        }
      } else if (isActive) {
        updateNodeData({ isActive: false });
      }
    }, [store, isEnabled, isActive, updateNodeData]);

    // Sync JSON fields with active and enabled state
    useEffect(() => {
      blockJsonWhenInactive();
    }, [isActive, isEnabled, blockJsonWhenInactive]);

    // Initialize key-value pairs from store
    useEffect(() => {
      try {
        if (
          store &&
          store !== "{}" &&
          store !== "" &&
          store !== "Default text"
        ) {
          // Try to parse as JSON first
          try {
            const obj = JSON.parse(store);
            if (typeof obj === "object" && obj !== null) {
              const pairs = convertObjectToPairs(obj);
              setKeyValuePairs(pairs);
              return;
            }
          } catch {
            // If JSON parsing fails, treat as legacy text data
            console.warn(
              "Store contains non-JSON data, treating as legacy:",
              store
            );

            // Convert legacy text to a simple key-value pair
            if (typeof store === "string" && store.trim()) {
              setKeyValuePairs([{ key: "text", value: store }]);
              // Also update the store to proper JSON format
              updateNodeData({ store: JSON.stringify({ text: store }) });
              return;
            }
          }
        }

        // Default fallback
        setKeyValuePairs([{ key: "", value: "" }]);
      } catch (error) {
        console.error("Error processing store data:", error);
        setKeyValuePairs([{ key: "", value: "" }]);
        // Reset store to empty object on error
        updateNodeData({ store: "{}" });
      }
    }, [store, convertObjectToPairs, updateNodeData]);

    // Auto-expand when user has meaningful content or multiple pairs
    useEffect(() => {
      const hasContent = keyValuePairs.some(
        (pair) => pair.key.trim() || pair.value.trim()
      );
      const hasMultiplePairs = keyValuePairs.length > 1;

      // Auto-expand if there's content or multiple pairs and currently collapsed
      if ((hasContent || hasMultiplePairs) && !isExpanded) {
        updateNodeData({ isExpanded: true });
      }
    }, [keyValuePairs, isExpanded, updateNodeData]);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (storeUpdateTimeoutRef.current) {
          clearTimeout(storeUpdateTimeoutRef.current);
        }
      };
    }, []);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("CreateMap", id, validation.errors, {
        originalData: validation.originalData,
        component: "CreateMapNode",
      });
    }

    useNodeDataValidation(
      CreateMapDataSchema,
      "CreateMap",
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
          Loading createMap feature...
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
          <div className="absolute inset-0 flex justify-center text-lg text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode
            nodeId={id}
            label={(nodeData as CreateMapData).label || spec.displayName}
          />
        )}

        {isExpanded ? (
          <div
            className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}
          >
            {/* Key-Value Table */}
            <div className="space-y-1 nowheel">
              {/* Table Header */}
              <div className="grid  grid-cols-[1fr_1fr_16px] gap-1 text-[10px] font-medium text-muted-foreground border-b border-border pb-1">
                <div className="truncate text-foreground">Key</div>
                <div className="truncate text-foreground">Value</div>
                <div />
              </div>

              {/* Table Body with scrollable area */}
              <div className="max-h-24 overflow-y-auto space-y-0.5">
                {keyValuePairs.map((pair, pairIndex) => (
                  <div
                    key={`pair-${pairIndex}-${pair.key || "empty"}`}
                    className="grid grid-cols-[1fr_1fr_16px] gap-1 items-center"
                  >
                    <input
                      type="text"
                      value={pair.key}
                      onChange={(e) =>
                        handlePairChange(pairIndex, "key", e.target.value)
                      }
                      placeholder="key"
                      className="text-[10px] px-1 py-0.5 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full min-w-0 nodrag"
                      disabled={!isEnabled}
                    />
                    <input
                      type="text"
                      value={pair.value}
                      onChange={(e) =>
                        handlePairChange(pairIndex, "value", e.target.value)
                      }
                      placeholder="value"
                      className="text-[10px] px-1 py-0.5 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full min-w-0 nodrag"
                      disabled={!isEnabled}
                    />
                    {keyValuePairs.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removePair(pairIndex)}
                        className="text-[10px] w-4 h-4 text-red-500 hover:text-red-700 disabled:opacity-50 flex items-center justify-center"
                        disabled={!isEnabled}
                        title="Remove row"
                      >
                        ×
                      </button>
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                  </div>
                ))}
              </div>

              {/* Add Button */}
              <Button
                type="button"
                size="sm"
                onClick={addPair}
                className="text-[10px]  w-full text-left p-0 m-0"
                disabled={!isEnabled}
              >
                + Add Row
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled}`}
          >
            {/* Show key count in collapsed mode */}
            <div className="text-center text-[10px] text-muted-foreground">
              <div>
                Keys:{" "}
                {(() => {
                  try {
                    const obj = convertPairsToObject(keyValuePairs);
                    return Object.keys(obj).length;
                  } catch {
                    return 0;
                  }
                })()}
              </div>
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
const CreateMapNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as CreateMapData),
    [
      (nodeData as CreateMapData).expandedSize,
      (nodeData as CreateMapData).collapsedSize,
    ]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <CreateMapNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default CreateMapNodeWithDynamicSpec;
