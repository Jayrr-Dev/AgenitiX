/**
 * AiManager NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
 * • Zod schema auto‑generates type‑checked Inspector controls.
 * • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
 * • Output propagation is gated by `isActive` *and* `isEnabled` to prevent runaway loops.
 * • Uses findEdgeByHandle utility for robust React Flow edge handling.
 * • Auto-disables when all input connections are removed (handled by flow store).
 * • Code is fully commented and follows current React + TypeScript best practices.
 *
 * Keywords: ai-manager, schema-driven, type‑safe, clean‑architecture
 */

import type { NodeProps } from "@xyflow/react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  ChangeEvent,
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
import { useReactFlow, useStore } from "@xyflow/react";
import { findEdgeByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const AiManagerDataSchema = z
  .object({
    store: SafeSchemas.text("Default text"),
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    inputs: SafeSchemas.optionalText().nullable().default(null),
    outputs: SafeSchemas.optionalText(),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C1"),
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type AiManagerData = z.infer<typeof AiManagerDataSchema>;

const validateNodeData = createNodeValidator(
  AiManagerDataSchema,
  "AiManager",
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  AI: {
    primary: "text-[--node--a-i-text]",
  },
} as const;

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex items-center justify-center",
  disabled: "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: AiManagerData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C1;

  return {
    kind: "aiManager",
    displayName: "AiManager",
    label: "AiManager",
    category: CATEGORIES.AI,
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
    inspector: { key: "AiManagerInspector" },
    version: 1,
    runtime: { execute: "aiManager_execute_v1" },
    initialData: createSafeInitialData(AiManagerDataSchema, {
      store: "Default text",
      inputs: null,
      outputs: "",
    }),
    dataSchema: AiManagerDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputs",
        "outputs",
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
    icon: "LuBot",
    author: "Agenitix Team",
    description: "AiManager node for Ai and machine learning",
    feature: "agents",
    tags: ["ai", "aiManager"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This aiManager node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C1",
} as AiManagerData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const AiManagerNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const { isExpanded, isEnabled, isActive, store } =
      nodeData as AiManagerData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<string | null>(null);

    const categoryStyles = CATEGORY_TEXT.AI;

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

    /** Propagate output ONLY when node is active AND enabled */
    const propagate = useCallback(
      (value: string) => {
        const shouldSend = isActive && isEnabled;
        const out = shouldSend ? value : null;
        if (out !== lastOutputRef.current) {
          lastOutputRef.current = out;
          updateNodeData({ outputs: out });
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

      // priority: outputs ➜ store ➜ whole data
      const inputValue = src.data?.outputs ?? src.data?.store ?? src.data;
      return typeof inputValue === 'string' ? inputValue : String(inputValue || '');
    }, [edges, nodes, id]);

    /** Handle textarea change (memoised for perf) */
    const handleStoreChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData({ store: e.target.value });
      },
      [updateNodeData],
    );

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Whenever nodes/edges change, recompute inputs. */
    useEffect(() => {
      const inputVal = computeInput();
      if (inputVal !== (nodeData as AiManagerData).inputs) {
        updateNodeData({ inputs: inputVal });
      }
    }, [computeInput, nodeData, updateNodeData]);

    /* 🔄 Make isEnabled dependent on input value only when there are connections. */
    useEffect(() => {
      const hasInput = (nodeData as AiManagerData).inputs;
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
      if (!isEnabled) {
        if (isActive) updateNodeData({ isActive: false });
      } else {
        if (isActive !== hasValidStore) {
          updateNodeData({ isActive: hasValidStore });
        }
      }
    }, [store, isEnabled, isActive, updateNodeData]);

    // Sync outputs with active and enabled state
    useEffect(() => {
      const currentStore = store ?? "";
      const actualContent = currentStore === "Default text" ? "" : currentStore;
      propagate(actualContent);
      blockJsonWhenInactive();
    }, [isActive, isEnabled, store, propagate, blockJsonWhenInactive]);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("AiManager", id, validation.errors, {
        originalData: validation.originalData,
        component: "AiManagerNode",
      });
    }

    useNodeDataValidation(
      AiManagerDataSchema,
      "AiManager",
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
          Loading aiManager feature...
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
          <LabelNode nodeId={id} label={(nodeData as AiManagerData).label || spec.displayName} />
        )}

        {!isExpanded ? (
          <div className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <textarea
              value={
                validation.data.store === "Default text"
                  ? ""
                  : validation.data.store ?? ""
              }
              onChange={handleStoreChange}
              placeholder="..."
              className={` resize-none text-center nowheel rounded-md h-8 m-4 translate-y-2 text-xs p-1 overflow-y-auto focus:outline-none focus:ring-1 focus:ring-white-500 ${categoryStyles.primary}`}
              disabled={!isEnabled}
            />
          </div>
        ) : (
          <div className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <textarea
              value={
                validation.data.store === "Default text"
                  ? ""
                  : validation.data.store ?? ""
              }
              onChange={handleStoreChange}
              placeholder="Enter your content here…"
              className={` resize-none nowheel bg-background rounded-md p-2 text-xs h-32 overflow-y-auto focus:outline-none focus:ring-1 focus:ring-white-500 ${categoryStyles.primary}`}
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
  },
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
const AiManagerNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as AiManagerData),
    [
      (nodeData as AiManagerData).expandedSize,
      (nodeData as AiManagerData).collapsedSize,
    ],
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <AiManagerNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec],
  );

  return <ScaffoldedNode {...props} />;
};

export default AiManagerNodeWithDynamicSpec;
