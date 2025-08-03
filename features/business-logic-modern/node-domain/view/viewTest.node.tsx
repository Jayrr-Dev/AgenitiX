/**
 * ViewTest NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
 * • Zod schema auto‑generates type‑checked Inspector controls.
 * • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
 * • Output propagation is gated by `isActive` *and* `isEnabled` to prevent runaway loops.
 * • Uses findEdgeByHandle utility for robust React Flow edge handling.
 * • Auto-disables when all input connections are removed (handled by flow store).
 * • Code is fully commented and follows current React + TypeScript best practices.
 * • Uses unified handle-based output system for consistent data propagation.
 *
 * Keywords: view-test, schema-driven, type‑safe, clean‑architecture, unified-handles
 */

import type { NodeProps } from "@xyflow/react";
import {
  type ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
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

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const ViewTestDataSchema = z
  .object({
    store: SafeSchemas.text("Default text"),
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    inputs: SafeSchemas.optionalText().nullable().default(null),
    output: z.record(z.string(), z.any()).optional(), // handle-based output object for Convex compatibility
    expandedSize: SafeSchemas.text("FE0"),
    collapsedSize: SafeSchemas.text("C1"),
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type ViewTestData = z.infer<typeof ViewTestDataSchema>;

const validateNodeData = createNodeValidator(ViewTestDataSchema, "ViewTest");

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  VIEW: {
    primary: "text-[--node--v-i-e-w-text]",
  },
} as const;

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  header: "flex items-center justify-between mb-3",
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
function createDynamicSpec(data: ViewTestData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.FE0;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C1;

  return {
    kind: "viewTest",
    displayName: "ViewTest",
    label: "ViewTest",
    category: CATEGORIES.VIEW,
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
    inspector: { key: "ViewTestInspector" },
    version: 1,
    runtime: { execute: "viewTest_execute_v1" },
    initialData: createSafeInitialData(ViewTestDataSchema, {
      store: "Default text",
      inputs: null,
      output: {}, // handle-based output object
    }),
    dataSchema: ViewTestDataSchema,
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
    icon: "LuFileText",
    author: "Agenitix Team",
    description: "ViewTest node for display",
    feature: "base",
    tags: ["view", "viewTest"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This viewTest node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "FE0",
  collapsedSize: "C1",
} as ViewTestData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const ViewTestNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const { isExpanded, isEnabled, isActive, store } = nodeData as ViewTestData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted output to avoid redundant writes
    const lastGeneralOutputRef = useRef<any>(null);

    const categoryStyles = CATEGORY_TEXT.VIEW;

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

    /** Handle textarea change (memoised for perf) */
    const handleStoreChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData({ store: e.target.value });
      },
      [updateNodeData]
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
            `ViewTest ${id}: generateoutputField did not return a Map`,
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
        console.error(`ViewTest ${id}: Error generating output`, error, {
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
      if (inputVal !== (nodeData as ViewTestData).inputs) {
        updateNodeData({ inputs: inputVal });
      }
    }, [computeInput, nodeData, updateNodeData]);

    /* 🔄 Make isEnabled dependent on input value only when there are connections. */
    useEffect(() => {
      const hasInput = (nodeData as ViewTestData).inputs;
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
        currentStore.trim().length > 0 && currentStore !== "Default text";

      // If disabled, always set isActive to false
      if (isEnabled) {
        if (isActive !== hasValidStore) {
          updateNodeData({ isActive: hasValidStore });
        }
      } else if (isActive) updateNodeData({ isActive: false });
    }, [store, isEnabled, isActive, updateNodeData]);

    // Sync JSON fields with active and enabled state
    useEffect(() => {
      blockJsonWhenInactive();
    }, [isActive, isEnabled, blockJsonWhenInactive]);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("ViewTest", id, validation.errors, {
        originalData: validation.originalData,
        component: "ViewTestNode",
      });
    }

    useNodeDataValidation(ViewTestDataSchema, "ViewTest", validation.data, id);

    // -------------------------------------------------------------------------
    // 4.7  Feature flag conditional rendering
    // -------------------------------------------------------------------------

    // If flag is loading, show loading state
    if (flagState.isLoading) {
      return (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
          Loading viewTest feature...
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
          <LabelNode
            nodeId={id}
            label={(nodeData as ViewTestData).label || spec.displayName}
          />
        )}

        {isExpanded ? (
          <div
            className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}
          >
            <textarea
              value={(() => {
                const store = validation.data.store;
                if (store === "Default text") return "";
                if (typeof store === "string") return store;
                if (store && typeof store === "object")
                  return JSON.stringify(store, null, 2);
                return "";
              })()}
              onChange={handleStoreChange}
              placeholder="Enter your content here…"
              className={` resize-none nowheel bg-background rounded-md p-2 text-xs h-32 overflow-y-auto focus:outline-none focus:ring-1 focus:ring-white-500 ${categoryStyles.primary}`}
              disabled={!isEnabled}
            />
          </div>
        ) : (
          <div
            className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled}`}
          >
            <textarea
              value={(() => {
                const store = validation.data.store;
                if (store === "Default text") return "";
                if (typeof store === "string") return store;
                if (store && typeof store === "object")
                  return JSON.stringify(store, null, 2);
                return "";
              })()}
              onChange={handleStoreChange}
              placeholder="..."
              className={` resize-none text-center nowheel rounded-md h-8 m-4 translate-y-2 text-xs p-1 overflow-y-auto focus:outline-none focus:ring-1 focus:ring-white-500 ${categoryStyles.primary}`}
              disabled={!isEnabled}
            />
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
const ViewTestNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as ViewTestData),
    [
      (nodeData as ViewTestData).expandedSize,
      (nodeData as ViewTestData).collapsedSize,
    ]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <ViewTestNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default ViewTestNodeWithDynamicSpec;
