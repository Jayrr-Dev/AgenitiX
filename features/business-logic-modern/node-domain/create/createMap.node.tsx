/**
 * CreateMap NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
 * • Zod schema auto‑generates type‑checked Inspector controls.
 * • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
 * • Output propagation is gated by `isActive` *and* `isEnabled` to prevent runaway loops.
 * • Uses findEdgeByHandle utility for robust React Flow edge handling.
 * • Auto-disables when all input connections are removed (handled by flow store).
 * • Code is fully commented and follows current React + TypeScript best practices.
 *
 * Keywords: create-map, schema-driven, type‑safe, clean‑architecture
 */

import type { NodeProps } from "@xyflow/react";
import {
  ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { useNodeFeatureFlag } from "@/features/business-logic-modern/infrastructure/node-core/useNodeFeatureFlag";
import {
  createNodeValidator,
  reportValidationError,
  useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/validation";
import { normalizeHandleId } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";
import { useStore } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CounterBoxContainer } from "@/components/ui/counter-box";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const CreateMapDataSchema = z
  .object({
    store: SafeSchemas.text("Default text"),
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    inputs: SafeSchemas.optionalText().nullable().default(null),
    outputs: SafeSchemas.optionalText(),
    /**
     * Key/Value entries used to build the map output
     */
    entries: z
      .array(
        z.object({
          key: z.string().default(""),
          value: z.string().default(""),
        })
      )
      .default([{ key: "", value: "" }]),
    /** Handle-based output object for compatibility with other nodes */
    output: z.record(z.string(), z.unknown()).optional(),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C1W"),
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type CreateMapData = z.infer<typeof CreateMapDataSchema>;

const validateNodeData = createNodeValidator(CreateMapDataSchema, "CreateMap");

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------


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
function createDynamicSpec(data: CreateMapData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE2;
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
        id: "output",
        code: "j",
        position: "right",
        type: "source",
        dataType: "JSON",
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
      store: "Default text",
      inputs: null,
      outputs: "",
      entries: [{ key: "", value: "" }],
    }),
    dataSchema: CreateMapDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputs",
        "outputs",
        "entries",
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
  expandedSize: "VE2",
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

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const { isExpanded, isEnabled, isActive, store } =
      nodeData as CreateMapData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted outputs string and handle-output Map to avoid redundant writes
    const lastOutputRef = useRef<string | null>(null);
    // Removed general output Map ref - we write handle map directly



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

    /** Build plain object from entries and update legacy `outputs` and handle field */
    const computeAndPropagateMap = useCallback(() => {
      if (!isEnabled) {
        // When disabled, clear outputs but keep entries for later
        if (lastOutputRef.current !== null) {
          lastOutputRef.current = null;
          updateNodeData({ outputs: "", output: {} });
        }
        return;
      }

      const entries = (nodeData as CreateMapData).entries || [];
      const obj: Record<string, unknown> = {};
      for (const { key, value } of entries) {
        const k = (key || "").trim();
        if (!k) continue;
        obj[k] = value;
      }
      const jsonStr = JSON.stringify(obj);
      if (jsonStr !== lastOutputRef.current) {
        lastOutputRef.current = jsonStr;
        // Set legacy string and handle-based map { output: <object> }
        updateNodeData({ outputs: jsonStr, output: { output: obj } });
      }
    }, [isEnabled, nodeData, updateNodeData]);

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

      // priority: handle-based map ➜ legacy outputs string ➜ store ➜ whole data
      const handleId = incoming.sourceHandle
        ? normalizeHandleId(incoming.sourceHandle)
        : "output";
      let inputValue: unknown = undefined;
      if (src.data?.output && typeof src.data.output === "object") {
        const srcOutput = (src.data.output ?? {}) as Record<string, unknown>;
        inputValue = srcOutput[handleId];
      }
      if (inputValue === undefined) {
        inputValue = src.data?.outputs ?? src.data?.store ?? src.data;
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

    // Entries management -------------------------------------------------------
    const [focusedRow, setFocusedRow] = useState<number | null>(null);
    const addEntry = useCallback(() => {
      const current = ((nodeData as CreateMapData).entries || []).slice();
      current.push({ key: "", value: "" });
      updateNodeData({ entries: current });
    }, [nodeData, updateNodeData]);

    const updateEntry = useCallback(
      (index: number, field: "key" | "value", newValue: string) => {
        const current = ((nodeData as CreateMapData).entries || []).slice();
        if (!current[index]) return;
        current[index] = { ...current[index], [field]: newValue } as any;
        updateNodeData({ entries: current });
      },
      [nodeData, updateNodeData]
    );

    const removeEntry = useCallback(
      (index: number) => {
        const current = ((nodeData as CreateMapData).entries || []).slice();
        if (current.length === 0) return;
        current.splice(index, 1);
        updateNodeData({ entries: current.length ? current : [{ key: "", value: "" }] });
      },
      [nodeData, updateNodeData]
    );

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

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

    // Monitor entries to compute active state (has at least one key/value)
    useEffect(() => {
      const entries = (nodeData as CreateMapData).entries || [];
      const hasValid = entries.some(
        (e) => e.key.trim().length > 0 && e.value.trim().length > 0
      );

      if (!isEnabled) {
        if (isActive) updateNodeData({ isActive: false });
      } else if (isActive !== hasValid) {
        updateNodeData({ isActive: hasValid });
      }
    }, [nodeData, isEnabled, isActive, updateNodeData]);

    // Compute object map and propagate to legacy/string output and handle field
    useEffect(() => {
      computeAndPropagateMap();
      blockJsonWhenInactive();
    }, [computeAndPropagateMap, blockJsonWhenInactive]);

    // Removed: generateoutputField loop. We already write a proper handle map.

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
          <div className="absolute inset-0 flex justify-center text-lg p-1 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode
            nodeId={id}
            label={(nodeData as CreateMapData).label || spec.displayName}
          />
        )}

        {!isExpanded ? (
          <div
            className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ""}`}
          >
            {/* Collapsed summary: two stacked rows showing counts */}
            <CounterBoxContainer
              className="mt-2"
              counters={[
                {
                  label: "Key",
                  count: ((nodeData as CreateMapData).entries || []).filter(
                    (e) => e.key.trim().length > 0
                  ).length,
          
                },
                {
                  label: "Value",
                  count: ((nodeData as CreateMapData).entries || []).filter(
                    (e) => e.value.trim().length > 0
                  ).length,
            
                }
              ]}
            />
          </div>
        ) : (
          <div className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ""}`}>
            {/* Minimal excel-like two-column table */}
            <div className="w-full">
              <table className="w-full table-fixed border-collapse text-xs mt-2">
             
                <tbody>
                  {((nodeData as CreateMapData).entries || []).map((row, idx) => (
                    <tr key={idx}>
                      <td className="border p-0 relative">
                        {focusedRow === idx && (
                          <Button
                            type="button"
                            variant="barebones"
                            size="sm"
                            aria-label="Remove row"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeEntry(idx);
                              setFocusedRow(null);
                            }}
                            className="absolute hover:text-red-500 left-1 top-1/2 -translate-x-6.5 -translate-y-1/2 h-6 w-6 p-0 text-xs z-10 pointer-events-auto"
                          >
                            ×
                          </Button>
                        )}
                        <Input
                          className={`h-5 w-full rounded-none text-[10px] border-0 shadow-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-offset-0 px-2 `}
                          placeholder="key"
                          value={row.key}
                          onChange={(e) => updateEntry(idx, "key", e.target.value)}
                          onFocus={() => setFocusedRow(idx)}
                          autoComplete="off"
                          data-lpignore="true"
                          data-1p-ignore
                          data-bwignore="true"
                          data-bitwarden-watching="false"
                          name={`map-key-${idx}`}
                          disabled={!isEnabled}
                        />
                      </td>
                      <td className="border p-0">
                        <Input
                          className={`h-5 w-full rounded-none text-[10px] border-0 shadow-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-offset-0 px-2 `}
                          placeholder="value"
                          value={row.value}
                          onChange={(e) => updateEntry(idx, "value", e.target.value)}
                          onFocus={() => setFocusedRow(idx)}
                          autoComplete="off"
                          data-lpignore="true"
                          data-1p-ignore
                          data-bwignore="true"
                          data-bitwarden-watching="false"
                          name={`map-value-${idx}`}
                          disabled={!isEnabled}
                        />
                      </td>
                    </tr>
                  ))}
                  {/* Add row button as final full-width row */}
                  <tr>
                    <td className="border p-0" colSpan={2}>
                      <Button
                        type="button"
                        onClick={addEntry}
                        disabled={!isEnabled}
                        variant="barebones"
                        size="sm"
                        className="w-full h-5 text-[16px] font-extralight text-foreground hover:text-green-500 bg-background hover:bg-background rounded-none"
                      >
                        +
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
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
