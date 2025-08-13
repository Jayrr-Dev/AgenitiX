/**
 * ViewObject NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
 * • Zod schema auto‑generates type‑checked Inspector controls.
 * • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
 * • Output propagation is gated by `isActive` *and* `isEnabled` to prevent runaway loops.
 * • Uses findEdgeByHandle utility for robust React Flow edge handling.
 * • Auto-enables when inputs connect; never auto-disables automatically.
 * • Code is fully commented and follows current React + TypeScript best practices.
 *
 * Keywords: view-object, schema-driven, type‑safe, clean‑architecture
 */

import type { NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { findEdgesByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
import { normalizeHandleId } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";
import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/iconUtils";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
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
import { JsonHighlighter } from "@/features/business-logic-modern/infrastructure/node-inspector/utils/JsonHighlighter";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { toObjectValue } from "@/features/business-logic-modern/node-domain/convert/utils";
import { useNodeData } from "@/hooks/useNodeData";
import { useStore } from "@xyflow/react";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const ViewObjectDataSchema = z
  .object({
    // [Explanation], basically store is unused for view but kept for compatibility
    store: SafeSchemas.text("Default text"),
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    // Accept any JSON value for inputs/output
    // [Explanation], basically pass-through arbitrary JSON safely
    inputs: z.unknown().nullable().default(null),
    output: z.unknown().optional(),
    expandedSize: SafeSchemas.text("VE3"),
    collapsedSize: SafeSchemas.text("C2W"),
    label: z.string().optional(), // User-editable node label
    // [Explanation], basically path stack for collapsed-view drill navigation
    viewPath: z.array(z.union([z.string(), z.number()])).default([]),
    // [Explanation], basically how many keys to show in collapsed mode
    summaryLimit: z.number().int().min(1).max(2000).default(6),
  })
  .passthrough();

export type ViewObjectData = z.infer<typeof ViewObjectDataSchema>;

const validateNodeData = createNodeValidator(
  ViewObjectDataSchema,
  "ViewObject"
);

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

// Display limits
const SUMMARY_MAX_KEYS = 6; // [Explanation], basically limit lines in collapsed view

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: ViewObjectData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.FE1H;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "viewObject",
    displayName: "ViewObject",
    label: "ViewObject",
    category: CATEGORIES.VIEW,
    size: { expanded, collapsed },
    handles: [
      {
        id: "json-input",
        code: "json",
        position: "left",
        type: "target",
        dataType: "JSON",
      },
      {
        id: "output",
        code: "json",
        position: "right",
        type: "source",
        dataType: "JSON",
      },
    ],
    inspector: { key: "ViewObjectInspector" },
    version: 1,
    runtime: { execute: "viewObject_execute_v1" },
    initialData: createSafeInitialData(ViewObjectDataSchema, {
      store: "Default text",
      inputs: null,
      output: "",
      viewPath: [],
      summaryLimit: 6,
    }),
    dataSchema: ViewObjectDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isEnabled",
        "isActive",
        "inputs",
        "output",
        "expandedSize",
        "collapsedSize",
        "summaryLimit",
      ],
      customFields: [
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
    icon: "LuSearch",
    author: "Agenitix Team",
    description: "ViewObject node for display",
    feature: "base",
    tags: ["view", "viewObject"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This viewObject node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "FE1H",
  collapsedSize: "C2",
} as ViewObjectData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const ViewObjectNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const { isExpanded, isEnabled, isActive, viewPath } =
      nodeData as ViewObjectData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<unknown>(null);
    // keep last handle-map to avoid redundant writes to output object (handle-based)
    const lastHandleMapRef = useRef<Record<string, unknown> | null>(null);

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

    /** Propagate output ONLY when node is active AND enabled */
    const propagate = useCallback(
      (value: unknown) => {
        const shouldSend = isActive && isEnabled;
        const out = shouldSend ? value : null;
        if (out !== lastOutputRef.current) {
          lastOutputRef.current = out;
          updateNodeData({ output: out });
        }
      },
      [isActive, isEnabled, updateNodeData]
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

    // -------------------------------------------------------------------------
    // 4.4.1  Collapsed-view navigation helpers
    // -------------------------------------------------------------------------
    /**
     * Resolve nested value at a given path of keys.
     * [Explanation], basically walk the object by keys to get nested value
     */
    const resolveAtPath = useCallback(
      (root: unknown, path: Array<string | number>): unknown => {
        let current: unknown = root;
        for (const segment of path) {
          if (current && typeof current === "object") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const asRecord = current as
              | Record<string, unknown>
              | Array<unknown>;
            // Support arrays and objects
            if (Array.isArray(asRecord)) {
              const index =
                typeof segment === "number" ? segment : Number(segment);
              current = Number.isFinite(index) ? asRecord[index] : undefined;
            } else {
              current = (asRecord as Record<string, unknown>)[String(segment)];
            }
          } else {
            return undefined;
          }
        }
        return current;
      },
      []
    );

    /** Drill into a nested key if it is an object/array */
    const drillIntoKey = useCallback(
      (key: string | number, currentRoot: unknown) => {
        const target = resolveAtPath(currentRoot, [...(viewPath ?? []), key]);
        if (target && typeof target === "object") {
          updateNodeData({ viewPath: [...(viewPath ?? []), key] });
        }
      },
      [updateNodeData, viewPath, resolveAtPath]
    );

    /** Go back one level */
    const goBack = useCallback(() => {
      const next = [...(viewPath ?? [])];
      next.pop();
      updateNodeData({ viewPath: next });
    }, [updateNodeData, viewPath]);

    /** Jump to a specific depth via breadcrumb */
    const jumpToDepth = useCallback(
      (depth: number) => {
        const next = (viewPath ?? []).slice(0, depth);
        updateNodeData({ viewPath: next });
      },
      [updateNodeData, viewPath]
    );

    /**
     * Compute the latest value coming from connected input handles.
     *
     * Uses findEdgeByHandle utility to properly handle React Flow's handle naming
     * conventions (handles get type suffixes like "json-input__j", "input__b").
     *
     * Priority: json-input > input (modify based on your node's specific handles)
     */
    const computeInput = useCallback((): unknown => {
      // Collect ALL edges connected to this node's object-capable inputs
      const jsonEdges = findEdgesByHandle(edges, id, "json-input");
      const genericEdges = findEdgesByHandle(edges, id, "input");
      const allIncoming = [...jsonEdges, ...genericEdges];
      if (allIncoming.length === 0) return null;

      const items: Array<{ edge: any; value: unknown; label?: string }> = [];
      for (const e of allIncoming) {
        const src = nodes.find((n) => n.id === e.source);
        if (!src) continue;

        const dataRec = src.data as Record<string, unknown> | undefined;
        let value: unknown = undefined;

        // Prefer handle-specific value from the source output map to avoid extra wrapping
        if (dataRec && typeof dataRec.output === "object" && dataRec.output) {
          const outMap = dataRec.output as Record<string, unknown>;
          const cleanId = e.sourceHandle
            ? normalizeHandleId(e.sourceHandle)
            : "output";
          if (outMap[cleanId] !== undefined) {
            value = outMap[cleanId];
          } else if (outMap.output !== undefined) {
            value = outMap.output;
          } else {
            const first = Object.values(outMap)[0];
            if (first !== undefined) value = first;
          }
        }

        // Legacy priority: output ➜ inputData ➜ store ➜ whole data
        if (value === undefined) {
          value =
            (src.data as any)?.output ??
            (src.data as any)?.inputData ??
            (src.data as any)?.store ??
            src.data;
        }

        // Parse JSON-like strings for convenience
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (trimmed.length > 0) {
            const looksJson =
              (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
              (trimmed.startsWith("[") && trimmed.endsWith("]"));
            if (looksJson) {
              try {
                value = JSON.parse(trimmed);
              } catch {
                // keep original string
              }
            }
          }
        }

        const customLabel =
          typeof (dataRec as any)?.label === "string"
            ? ((dataRec as any)?.label as string)
            : undefined;
        items.push({ edge: e, value, label: customLabel });
      }

      if (items.length === 0) return null;

      // If single input, ensure an object for consistent viewing
      if (items.length === 1) {
        const only = items[0].value;
        if (only && typeof only === "object" && !Array.isArray(only))
          return only;
        return toObjectValue(only);
      }

      // Merge multiple inputs into one object. Later inputs override earlier keys.
      const merged: Record<string, unknown> = {};
      const labelCounts: Record<string, number> = {};
      for (const { value: v, label } of items) {
        if (v && typeof v === "object" && !Array.isArray(v)) {
          Object.assign(merged, v as Record<string, unknown>);
          continue;
        }

        if (label && label.trim().length > 0) {
          const base = label.trim();
          const nextCount = (labelCounts[base] ?? 0) + 1;
          labelCounts[base] = nextCount;
          // First occurrence uses the base label; duplicates append 1,2,...
          let key = nextCount === 1 ? base : `${base}${nextCount - 1}`;
          // Ensure uniqueness if some other object contributed same key
          while (Object.prototype.hasOwnProperty.call(merged, key)) {
            key = `${key}_`;
          }
          merged[key] = v as unknown;
        } else {
          // Fallback to default object conversion when no label is provided
          Object.assign(merged, toObjectValue(v));
        }
      }
      return merged;
    }, [edges, nodes, id]);

    // isEnabled is forced true; connection presence is no longer used to toggle

    // No local editing for view-only node

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Whenever nodes/edges change, recompute inputs. */
    useEffect(() => {
      const inputVal = computeInput();
      if (inputVal !== (nodeData as ViewObjectData).inputs) {
        updateNodeData({ inputs: inputVal });
      }
    }, [computeInput, nodeData, updateNodeData]);

    /* 🔁 Reset collapsed summary count when navigating levels */
    useEffect(() => {
      updateNodeData({ summaryLimit: 6 });
    }, [viewPath?.length, updateNodeData]);

    /* 🔒 Force always-enabled state */
    useEffect(() => {
      if (!isEnabled) updateNodeData({ isEnabled: true });
    }, [isEnabled, updateNodeData]);

    /* 🧭 Keep viewPath valid when inputs change (e.g., on disconnect) */
    useEffect(() => {
      const root = (nodeData as ViewObjectData).inputs;
      const path = (nodeData as ViewObjectData).viewPath ?? [];
      const current = resolveAtPath(root, path);
      const invalid =
        path.length > 0 &&
        (current === undefined ||
          current === null ||
          typeof current !== "object");
      if (invalid) updateNodeData({ viewPath: [] });
    }, [nodeData, resolveAtPath, updateNodeData]);

    // Monitor inputs and update active state
    useEffect(() => {
      const inputVal = (nodeData as ViewObjectData).inputs;
      const hasValue =
        inputVal !== null &&
        (typeof inputVal !== "string" || inputVal.trim().length > 0);
      const nextActive = isEnabled && hasValue;
      if (isActive !== nextActive) updateNodeData({ isActive: nextActive });
    }, [nodeData, isEnabled, isActive, updateNodeData]);

    // Sync output with active and enabled state (legacy output used by some nodes)
    useEffect(() => {
      const inputVal = (nodeData as ViewObjectData).inputs;
      propagate(inputVal);
      blockJsonWhenInactive();
    }, [isActive, isEnabled, nodeData, propagate, blockJsonWhenInactive]);

    // Generate handle-based output map { output: value } so downstream nodes (e.g., storeLocal)
    // read the entire displayed object instead of only the first key.
    useEffect(() => {
      const value = (nodeData as ViewObjectData).inputs;
      const mapped = isActive && isEnabled ? { output: value } : null;

      // Only update when changed to prevent render churn
      const prev = lastHandleMapRef.current;
      const changed = JSON.stringify(prev) !== JSON.stringify(mapped);
      if (changed) {
        lastHandleMapRef.current = mapped as any;
        updateNodeData({ output: mapped as any });
      }
    }, [
      isActive,
      isEnabled,
      (nodeData as ViewObjectData).inputs,
      updateNodeData,
    ]);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("ViewObject", id, validation.errors, {
        originalData: validation.originalData,
        component: "ViewObjectNode",
      });
    }

    useNodeDataValidation(
      ViewObjectDataSchema,
      "ViewObject",
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
          Loading viewObject feature...
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
            label={(nodeData as ViewObjectData).label || spec.displayName}
          />
        )}

        {/* Collapsed: show a compact type summary of top-level properties */}
        {!isExpanded ? (
          <div
            className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ""}`}
          >
            <div className="w-[92%] max-h-16 overflow-y-auto rounded-md border border-border/30 bg-muted/20 p-1 font-mono text-[10px] leading-tight text-foreground/90">
              {(() => {
                const root = (validation.data as ViewObjectData).inputs;
                const path = (validation.data as ViewObjectData).viewPath ?? [];

                if (
                  !root ||
                  (typeof root !== "object" && !Array.isArray(root))
                ) {
                  return (
                    <div className="text-muted-foreground">(no object)</div>
                  );
                }

                const isAtRoot = path.length === 0;
                const currentView: unknown = isAtRoot
                  ? root
                  : resolveAtPath(root, path);

                // Header: Back + breadcrumb (compact)
                const breadcrumb = (
                  <div className="mb-1 flex items-center gap-1 text-[9px] text-foreground/70">
                    {!isAtRoot && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          goBack();
                        }}
                        className="px-1 py-[1px] rounded border border-border/40 hover:bg-muted/40"
                        aria-label="Back"
                        title="Back"
                      >
                        ←
                      </button>
                    )}
                    <div className="truncate">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          jumpToDepth(0);
                        }}
                        className="hover:underline"
                        title="root"
                      >
                        root
                      </button>
                      {path.map((seg, i) => (
                        <span key={`crumb-${i}`}>
                          <span className="mx-1 text-foreground/40">/</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              jumpToDepth(i + 1);
                            }}
                            className="hover:underline"
                            title={String(seg)}
                          >
                            {typeof seg === "string" ? seg : `[${seg}]`}
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                );

                // Body: list keys at current level with types, double-click to drill
                const renderLevel = (value: unknown) => {
                  if (!value || typeof value !== "object") {
                    return (
                      <div className="text-muted-foreground">
                        (not an object)
                      </div>
                    );
                  }
                  const isArray = Array.isArray(value);
                  const entries = isArray
                    ? (value as Array<unknown>).map(
                        (v, i) => [i, v] as [number, unknown]
                      )
                    : Object.entries(value as Record<string, unknown>);
                  const limit =
                    (validation.data as ViewObjectData).summaryLimit ??
                    SUMMARY_MAX_KEYS;
                  const shown = entries.slice(0, limit);
                  return (
                    <div>
                      {shown.map(([k, v], idx) => {
                        const isDrillable = v !== null && typeof v === "object";
                        const typeText = Array.isArray(v)
                          ? "array"
                          : v === null
                            ? "null"
                            : typeof v;
                        return (
                          <div
                            key={`summary-${String(k)}-${idx}`}
                            className={`truncate select-text cursor-text nodrag nowheel ${isDrillable ? "cursor-zoom-in" : ""}`}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              if (isDrillable)
                                drillIntoKey(k as string | number, root);
                            }}
                            title={
                              isDrillable ? "Double-click to open" : undefined
                            }
                          >
                            <span className="text-red-400">
                              {typeof k === "string" ? `"${k}"` : String(k)}
                            </span>
                            <span className="text-foreground/70">: </span>
                            <span
                              className={
                                isDrillable ? "text-blue-400" : "text-blue-300"
                              }
                            >
                              {typeText}
                            </span>
                            {idx < shown.length - 1 && (
                              <span className="text-foreground/50">,</span>
                            )}
                          </div>
                        );
                      })}
                      {entries.length > shown.length && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentLimit =
                              (validation.data as ViewObjectData)
                                .summaryLimit ?? SUMMARY_MAX_KEYS;
                            const nextLimit = Math.min(
                              entries.length,
                              currentLimit + 10
                            );
                            updateNodeData({ summaryLimit: nextLimit });
                          }}
                          className="text-foreground/50 hover:underline"
                          title="Load more"
                        >
                          … +{entries.length - shown.length} more
                        </button>
                      )}
                    </div>
                  );
                };

                return (
                  <div>
                    {breadcrumb}
                    {renderLevel(currentView)}
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          // Expanded: show the same nested view as collapsed using viewPath
          <div
            className={`nowheel ${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ""}`}
          >
            <div className="flex items-center gap-2  text-[10px] text-foreground/70 mb-2">
              <span className="text-foreground/50">Path:</span>
              <code className="px-1 py-0.5 rounded bg-muted/40">
                {((validation.data as ViewObjectData).viewPath ?? []).length ===
                0
                  ? "root"
                  : (validation.data as ViewObjectData).viewPath
                      .map((seg) =>
                        typeof seg === "string" ? seg : `[${seg}]`
                      )
                      .join(".")}
              </code>
            </div>
            <div className="flex-1  overflow-auto rounded-md bg-muted/10">
              <JsonHighlighter
                data={(() => {
                  const root = (validation.data as ViewObjectData).inputs;
                  const path =
                    (validation.data as ViewObjectData).viewPath ?? [];
                  return path.length === 0 ? root : resolveAtPath(root, path);
                })()}
                maxDepth={3}
                className="text-[10px] select-text cursor-text nodrag nowheel "
              />
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
const ViewObjectNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as ViewObjectData),
    [
      (nodeData as ViewObjectData).expandedSize,
      (nodeData as ViewObjectData).collapsedSize,
    ]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <ViewObjectNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default ViewObjectNodeWithDynamicSpec;
