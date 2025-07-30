/**
 * TriggerPulse NODE – Boolean pulse button with configurable duration
 *
 * ✔ Sends a TRUE signal for a configurable duration when clicked, then reverts to FALSE.
 * ✔ Configurable pulse duration in milliseconds (expanded view).
 * ✔ Circular button design similar to TriggerToggle but with pulse behavior.
 * ✔ Fully type‑safe (Zod) + focus‑preserving scaffold memoisation.
 *
 * Keywords: pulse‑button, boolean‑pulse, timed‑signal, trigger‑control
 */

import type { NodeProps } from "@xyflow/react";
import { useStore } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef, ChangeEvent } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { findEdgeByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
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

import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const TriggerPulseDataSchema = z
  .object({
    store: z.boolean().default(false), // current pulse state (true during pulse)
    pulseDuration: z.number().min(1).max(60000).default(1000), // pulse duration in ms (1ms to 60s)
    isEnabled: SafeSchemas.boolean(true), // is pulse button interactive?
    isActive: SafeSchemas.boolean(false), // reflects store when enabled
    isExpanded: SafeSchemas.boolean(false), // inspector open?
    inputs: z.boolean().nullable().default(null), // last received input
    outputs: z.boolean().default(false), // last emitted output
    expandedSize: SafeSchemas.text("FE1"),
    collapsedSize: SafeSchemas.text("C1"),
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type TriggerPulseData = z.infer<typeof TriggerPulseDataSchema>;

const validateNodeData = createNodeValidator(
  TriggerPulseDataSchema,
  "TriggerPulse",
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------



const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex items-center justify-center",
  pulse:
    "relative w-12 h-12 rounded-full border-2 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95",
  pulsePulsing: "bg-blue-500 border-blue-600 shadow-lg shadow-blue-500/50 animate-pulse",
  pulseIdle: "bg-gray-500 border-gray-600 shadow-gray-500/50",
  pulseDisabled: "bg-gray-400 border-gray-500 cursor-not-allowed opacity-50",
  pulseText: "absolute inset-0 flex items-center justify-center text-white font-bold text-xs",
  durationInput: "w-16 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500",
  durationContainer: "flex items-center gap-1",
  durationLabel: "text-xs text-muted-foreground",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Spec helpers
// -----------------------------------------------------------------------------

/** Builds a NodeSpec whose size keys can change at runtime. */
function createDynamicSpec(data: TriggerPulseData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ?? EXPANDED_SIZES.FE1;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ?? COLLAPSED_SIZES.C1;

  return {
    kind: "triggerPulse",
    displayName: "Pulse",
    label: "Pulse",
    category: CATEGORIES.TRIGGER,
    size: { expanded, collapsed },
    handles: [
      { id: "input", code: "b", position: "left", type: "target", dataType: "Boolean" },
      { id: "output", code: "b", position: "right", type: "source", dataType: "Boolean" },
    ],
    inspector: { key: "TriggerPulseInspector" },
    version: 1,
    runtime: { execute: "triggerPulse_execute_v1" },
    initialData: createSafeInitialData(TriggerPulseDataSchema, {
      store: false,
      pulseDuration: 1000,
      inputs: null,
      outputs: false,
    }),
    dataSchema: TriggerPulseDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: ["isActive", "inputs", "outputs", "expandedSize", "collapsedSize"],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "pulseDuration", type: "number", label: "Pulse Duration (ms)" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuZap",
    author: "Agenitix Team",
    description: "Boolean pulse button that sends TRUE for a configurable duration",
    feature: "base",
    tags: ["pulse", "boolean", "trigger", "timer"],
    theming: {},
  };
}

/** Static spec (registry) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "FE1",
  collapsedSize: "C1",
} as TriggerPulseData);

// -----------------------------------------------------------------------------
// 4️⃣  React implementation
// -----------------------------------------------------------------------------

/** Utility: coerce any incoming value to a strict boolean. */
const toBool = (v: unknown): boolean => v === true || v === "true" || v === "1";

/** Main node UI & behaviour. */
const TriggerPulseNode = memo(({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
  // 4.1  Local node‑data helpers
  const { nodeData, updateNodeData } = useNodeData(id, data);
  const { isExpanded, isEnabled, isActive, store, pulseDuration } = nodeData as TriggerPulseData;

  // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);

  // keep last emitted output to avoid redundant writes
  const lastOutputRef = useRef<boolean | null>(null);
  // timer ref for pulse timeout
  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // -----------------------------------------------------------------------
  // 4.3  Helpers
  // -----------------------------------------------------------------------

  /** Propagate current boolean to our `outputs` field. */
  const propagate = useCallback(
    (value: boolean) => {
      if (value !== lastOutputRef.current) {
        lastOutputRef.current = value;
        updateNodeData({ outputs: value });
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

    const src = nodes.find((n) => n.id === incoming.source);
    if (!src) {
      return null;
    }

    return toBool(
      // priority: outputs ➜ store ➜ whole data
      src.data?.outputs ?? src.data?.store ?? src.data
    );
  }, [edges, nodes, id]);

  // -----------------------------------------------------------------------
  // 4.4  Effects
  // -----------------------------------------------------------------------

  /* 🔄 Whenever nodes/edges change, recompute inputs. */
  useEffect(() => {
    const inputVal = computeInput();
    if (inputVal !== (nodeData as TriggerPulseData).inputs) {
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
    const hasInput = (nodeData as TriggerPulseData).inputs;
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

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, []);

  // -----------------------------------------------------------------------
  // 4.5  Event handlers
  // -----------------------------------------------------------------------

  /** Toggle expand / collapse UI. */
  const toggleExpand = useCallback(() => {
    updateNodeData({ isExpanded: !isExpanded });
  }, [isExpanded, updateNodeData]);

  /** Trigger pulse (only when enabled). */
  const triggerPulse = useCallback(() => {
    if (!isEnabled) return;

    // Clear any existing timeout
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
    }

    // Set pulse to true
    updateNodeData({ store: true });

    // Set timeout to revert to false
    pulseTimeoutRef.current = setTimeout(() => {
      updateNodeData({ store: false });
      pulseTimeoutRef.current = null;
    }, pulseDuration);
  }, [isEnabled, pulseDuration, updateNodeData]);

  /** Handle pulse duration input change (numbers only). */
  const handleDurationChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 1 && numValue <= 60000) {
        updateNodeData({ pulseDuration: numValue });
      }
    },
    [updateNodeData]
  );

  // -----------------------------------------------------------------------
  // 4.6  Validation
  // -----------------------------------------------------------------------

  const validation = validateNodeData(nodeData);
  if (!validation.success) {
    reportValidationError("TriggerPulse", id, validation.errors, {
      originalData: validation.originalData,
      component: "TriggerPulseNode",
    });
  }
  useNodeDataValidation(TriggerPulseDataSchema, "TriggerPulse", validation.data, id);

  // -----------------------------------------------------------------------
  // 4.7  Render
  // -----------------------------------------------------------------------

  const isPulsing = toBool(store);

  return (
    <>
      {/* No label or icon on top */}
      {/* ───────────────────────────────────────── UI ───────────────────────────────────────── */}
      {isExpanded ? (
        /* Expanded view */
        <div className={CONTENT.expanded}>
          <div className={CONTENT.body}>
            <div className="flex flex-col items-center gap-3">
              <button
                className={`${CONTENT.pulse} ${isEnabled
                  ? isPulsing
                    ? CONTENT.pulsePulsing
                    : CONTENT.pulseIdle
                  : CONTENT.pulseDisabled
                  }`}
                onClick={triggerPulse}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    triggerPulse();
                  }
                }}
                disabled={!isEnabled}
                type="button"
                title={isEnabled ? "Click to pulse" : "Disabled"}
              >
                <div className={CONTENT.pulseText}>PULSE</div>
              </button>
              <div className={CONTENT.durationContainer}>
                <input
                  type="text"
                  value={pulseDuration}
                  onChange={handleDurationChange}
                  className={CONTENT.durationInput}
                  placeholder="1000"
                  disabled={!isEnabled}
                />
                <span className={CONTENT.durationLabel}>ms</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed view */
        <div className={CONTENT.collapsed}>
          <button
            className={`${CONTENT.pulse} ${isEnabled
              ? isPulsing
                ? CONTENT.pulsePulsing
                : CONTENT.pulseIdle
              : CONTENT.pulseDisabled
              }`}
            onClick={triggerPulse}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                triggerPulse();
              }
            }}
            disabled={!isEnabled}
            type="button"
            title={isEnabled ? "Click to pulse" : "Disabled"}
          >
            <div className={CONTENT.pulseText}>PULSE</div>
          </button>
        </div>
      )}
      <ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} size="sm" />
    </>
  );
});

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
const TriggerPulseNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as TriggerPulseData),
    [
      (nodeData as TriggerPulseData).expandedSize,
      (nodeData as TriggerPulseData).collapsedSize,
    ],
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <TriggerPulseNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec],
  );

  return <ScaffoldedNode {...props} />;
};

export default TriggerPulseNodeWithDynamicSpec;
