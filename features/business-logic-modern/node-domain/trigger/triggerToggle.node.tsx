/**
 * TriggerToggle NODE – Boolean toggle with circular design
 *
 * ✔ Cycles between ON / OFF and propagates the value to connected nodes.
 * ✔ Subscribes to global React‑Flow store so updates ripple automatically.
 * ✔ Fully type‑safe (Zod) + focus‑preserving scaffold memoisation.
 *
 * Keywords: toggle‑button, boolean‑state, circular‑design, trigger‑control
 */

import type { NodeProps } from "@xyflow/react";
import { useStore } from "@xyflow/react";
import type React from "react";
import { memo, useCallback, useEffect, useRef } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { findEdgeByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
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

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const TriggerToggleDataSchema = z
  .object({
    store: z.boolean().default(false), // current toggle value
    isEnabled: SafeSchemas.boolean(true), // is toggle interactive?
    isActive: SafeSchemas.boolean(false), // reflects store when enabled
    isExpanded: SafeSchemas.boolean(false), // inspector open?
    inputs: z.boolean().nullable().default(null), // last received input
    output: z.boolean().default(false), // last emitted output
    expandedSize: SafeSchemas.text("FE1"),
    collapsedSize: SafeSchemas.text("C1"),
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type TriggerToggleData = z.infer<typeof TriggerToggleDataSchema>;

const validateNodeData = createNodeValidator(
  TriggerToggleDataSchema,
  "TriggerToggle"
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  TRIGGER: {
    primary: "text-[--node-trigger-text]",
    on: "text-green-500",
    off: "text-red-500",
  },
} as const;

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex items-center justify-center",
  toggle:
    "relative w-12 h-12 rounded-full border-2 cursor-pointer transition-all duration-200",
  toggleOn: "bg-green-500 border-green-600  shadow-green-500/50",
  toggleOff: "bg-red-500 border-red-600  shadow-red-500/50",
  toggleDisabled: "bg-gray-400 border-gray-500 cursor-not-allowed opacity-50",
  toggleText:
    "absolute inset-0 flex items-center justify-center text-white font-bold text-xs",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Spec helpers
// -----------------------------------------------------------------------------

/** Builds a NodeSpec whose size keys can change at runtime. */
function createDynamicSpec(data: TriggerToggleData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.FE1;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C1;

  return {
    kind: "triggerToggle",
    displayName: "Toggle",
    label: "Toggle",
    category: CATEGORIES.TRIGGER,
    size: { expanded, collapsed },
    handles: [
      {
        id: "input",
        code: "b",
        position: "left",
        type: "target",
        dataType: "Boolean",
      },
      {
        id: "output",
        code: "b",
        position: "right",
        type: "source",
        dataType: "Boolean",
      },
    ],
    inspector: { key: "TriggerToggleInspector" },
    version: 1,
    runtime: { execute: "triggerToggle_execute_v1" },
    initialData: createSafeInitialData(TriggerToggleDataSchema, {
      store: false,
      inputs: null,
      output: false,
    }),
    dataSchema: TriggerToggleDataSchema,
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
        { key: "store", type: "boolean", label: "Toggle State" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuZap",
    author: "Agenitix Team",
    description: "Boolean toggle button that cycles between ON/OFF states",
    feature: "base",
    tags: ["toggle", "boolean", "trigger"],
    theming: {},
  };
}

/** Static spec (registry) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "FE1",
  collapsedSize: "C1",
} as TriggerToggleData);

// -----------------------------------------------------------------------------
// 4️⃣  React implementation
// -----------------------------------------------------------------------------

/** Utility: coerce any incoming value to a strict boolean. */
const toBool = (v: unknown): boolean => v === true || v === "true" || v === "1";

/** Main node UI & behaviour. */
const TriggerToggleNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // 4.1  Local node‑data helpers
    const { nodeData, updateNodeData } = useNodeData(id, data);
    const { isExpanded, isEnabled, isActive, store } =
      nodeData as TriggerToggleData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const edges = useStore((s) => s.edges);
    const connectedNodes = useStore(
      useCallback(
        (s) => {
          // Only get nodes connected to this toggle, basically upstream inputs only
          const inputEdge = edges.find(
            (e) => e.target === id && e.targetHandle === "input"
          );
          if (!inputEdge) return [];
          return s.nodes.filter((n) => n.id === inputEdge.source);
        },
        [edges, id]
      )
    );

    // keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<boolean | null>(null);

    // -----------------------------------------------------------------------
    // 4.3  Helpers
    // -----------------------------------------------------------------------

    /** Propagate current boolean to our `output` field. */
    const propagate = useCallback(
      (value: boolean) => {
        if (value !== lastOutputRef.current) {
          lastOutputRef.current = value;
          updateNodeData({ output: value });
        }
      },
      [updateNodeData]
    );

    /** Compute the latest boolean coming from connected input handle. */
    const computeInput = useCallback((): boolean | null => {
      const incoming = findEdgeByHandle(edges, id, "input");
      if (!incoming) {
        return null;
      }

      const src = connectedNodes.find((n) => n.id === incoming.source);
      if (!src) {
        return null;
      }

      return toBool(
        // priority: output ➜ store ➜ whole data
        src.data?.output ?? src.data?.store ?? src.data
      );
    }, [edges, connectedNodes, id]);

    // -----------------------------------------------------------------------
    // 4.4  Effects
    // -----------------------------------------------------------------------

    /* 🔄 Whenever nodes/edges change, recompute inputs. */
    useEffect(() => {
      const inputVal = computeInput();
      if (inputVal !== (nodeData as TriggerToggleData).inputs) {
        updateNodeData({ inputs: inputVal });
      }
    }, [computeInput, nodeData, updateNodeData]);

    /* 🔄 Keep isActive in sync with store / isEnabled. */
    useEffect(() => {
      const nextActive = isEnabled && toBool(store);
      if (nextActive !== isActive) {
        updateNodeData({ isActive: nextActive });
      }
    }, [store, isEnabled, isActive, updateNodeData]);

    /* 🔄 Make isEnabled dependent on input value only when there are connections. */
    useEffect(() => {
      const hasInput = (nodeData as TriggerToggleData).inputs;
      // Only auto-control isEnabled when there are connections (inputs !== null)
      // When inputs is null (no connections), let user manually control isEnabled
      if (hasInput !== null) {
        const nextEnabled = toBool(hasInput);
        if (nextEnabled !== isEnabled) {
          updateNodeData({ isEnabled: nextEnabled });
        }
      }
    }, [nodeData, isEnabled, updateNodeData]);

    /* 🔄 On every relevant change, propagate value. */
    useEffect(() => {
      // When disabled, always output false regardless of store value
      // When enabled, output the actual store value
      const outputValue = isEnabled ? toBool(store) : false;
      propagate(outputValue);
    }, [store, isEnabled, propagate]);

    // -----------------------------------------------------------------------
    // 4.5  Event handlers
    // -----------------------------------------------------------------------

    /** Toggle expand / collapse UI. */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    /** Flip boolean state (only when enabled). */
    const toggleState = useCallback(() => {
      if (isEnabled) {
        updateNodeData({ store: !toBool(store) });
      }
    }, [isEnabled, store, updateNodeData]);

    // -----------------------------------------------------------------------
    // 4.6  Validation
    // -----------------------------------------------------------------------

    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("TriggerToggle", id, validation.errors, {
        originalData: validation.originalData,
        component: "TriggerToggleNode",
      });
    }
    useNodeDataValidation(
      TriggerToggleDataSchema,
      "TriggerToggle",
      validation.data,
      id
    );

    // -----------------------------------------------------------------------
    // 4.7  Render
    // -----------------------------------------------------------------------

    const _categoryStyles = CATEGORY_TEXT.TRIGGER;
    const isToggled = toBool(store);

    return (
      <>
        {/* Label (hidden for 60×60 icons) */}
        {!isExpanded &&
        spec.size.collapsed.width === 60 &&
        spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center p-1 text-foreground/80 text-lg">
            {/* {spec.icon && renderLucideIcon(spec.icon)} */}
          </div>
        ) : (
          <LabelNode
            nodeId={id}
            label={(nodeData as TriggerToggleData).label || spec.displayName}
          />
        )}
        {/* ───────────────────────────────────────── UI ───────────────────────────────────────── */}
        {isExpanded ? (
          /* Expanded view */
          <div className={CONTENT.expanded}>
            <div className={CONTENT.body}>
              <div className="flex flex-col items-center gap-0">
                <button
                  className={`${CONTENT.toggle} ${
                    isEnabled
                      ? isToggled
                        ? CONTENT.toggleOn
                        : CONTENT.toggleOff
                      : CONTENT.toggleDisabled
                  }`}
                  onClick={toggleState}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleState();
                    }
                  }}
                  disabled={!isEnabled}
                  type="button"
                  title={isEnabled ? "Click to toggle" : "Disabled"}
                >
                  <div className={CONTENT.toggleText}>
                    {isToggled ? "ON" : "OFF"}
                  </div>
                </button>
                <div className="text-center">
                  <div className="mt-1 text-muted-foreground text-xs">
                    {isEnabled ? "Click to toggle" : "Toggle disabled"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Collapsed view */
          <div className={CONTENT.collapsed}>
            <button
              className={`${CONTENT.toggle} ${
                isEnabled
                  ? isToggled
                    ? CONTENT.toggleOn
                    : CONTENT.toggleOff
                  : CONTENT.toggleDisabled
              }`}
              onClick={toggleState}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleState();
                }
              }}
              disabled={!isEnabled}
              type="button"
              title={isEnabled ? "Click to toggle" : "Disabled"}
            >
              <div className={CONTENT.toggleText}>
                {isToggled ? "ON" : "OFF"}
              </div>
            </button>
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
// 5️⃣  Focus‑preserving scaffold wrapper
// -----------------------------------------------------------------------------

// Cache scaffolded components by size configuration to avoid recreation
const scaffoldCache = new Map<string, React.ComponentType<NodeProps>>();

const TriggerToggleNodeWithDynamicSpec = memo((props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);
  const typedData = nodeData as TriggerToggleData;

  // Create cache key from size configuration
  const cacheKey = `${typedData.expandedSize}-${typedData.collapsedSize}`;

  // Get or create scaffolded component from cache
  let ScaffoldedNode = scaffoldCache.get(cacheKey);
  if (!ScaffoldedNode) {
    const dynamicSpec = createDynamicSpec(typedData);
    ScaffoldedNode = withNodeScaffold(dynamicSpec, (p) => (
      <TriggerToggleNode {...p} spec={dynamicSpec} />
    ));
    scaffoldCache.set(cacheKey, ScaffoldedNode);
  }

  return <ScaffoldedNode {...props} />;
});

export default TriggerToggleNodeWithDynamicSpec;
