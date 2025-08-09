/**
 * ViewArray NODE – Array‑focused, schema‑driven, type‑safe
 *
 * • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
 * • Zod schema auto‑generates type‑checked Inspector controls.
 * • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
 * • Output propagation is gated by `isActive` *and* `isEnabled` to prevent runaway loops.
 * • Uses findEdgeByHandle utility for robust React Flow edge handling.
 * • Auto-disables when all input connections are removed (handled by flow store).
 * • Code is fully commented and follows current React + TypeScript best practices.
 *
 * Keywords: view-array, schema-driven, type‑safe, clean‑architecture
 */

import type { NodeProps } from "@xyflow/react";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
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
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { JsonHighlighter } from "@/features/business-logic-modern/infrastructure/node-inspector/utils/JsonHighlighter";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";
import { trackNodeUpdate } from "@/lib/debug-node-updates";
import {
  timeOperation,
  trackRender,
  trackStateUpdate,
} from "@/lib/performance-profiler";
import { useReactFlow, useStore } from "@xyflow/react";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const ViewArrayDataSchema = z
  .object({
    // [Explanation], basically store is unused for view but kept for compatibility
    store: SafeSchemas.text("Default text"),
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    // Accept any JSON value for inputs/output
    // [Explanation], basically pass-through arbitrary JSON safely (expect array)
    inputs: z.unknown().nullable().default(null),
    output: z.unknown().optional(),
    expandedSize: SafeSchemas.text("FE3H"),
    collapsedSize: SafeSchemas.text("C2W"),
    label: z.string().optional(), // User-editable node label
    // [Explanation], basically path stack for collapsed-view drill navigation (indexes/keys)
    viewPath: z.array(z.union([z.string(), z.number()])).default([]),
    // [Explanation], basically how many items to show in collapsed mode
    summaryLimit: z.number().int().min(1).max(2000).default(6),
  })
  .passthrough();

export type ViewArrayData = z.infer<typeof ViewArrayDataSchema>;

const validateNodeData = createNodeValidator(ViewArrayDataSchema, "ViewArray");

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
const SUMMARY_MAX_ITEMS = 6; // [Explanation], basically limit lines in collapsed view

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: ViewArrayData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "viewArray",
    displayName: "ViewArray",
    label: "ViewArray",
    category: CATEGORIES.VIEW,
    size: { expanded, collapsed },
    handles: [
      {
        id: "json-input",
        code: "a",
        position: "left",
        type: "target",
        dataType: "Array",
      },
      {
        id: "output",
        code: "a",
        position: "right",
        type: "source",
        dataType: "Array",
      },
    ],
    inspector: { key: "ViewArrayInspector" },
    version: 1,
    runtime: { execute: "viewArray_execute_v1" },
    initialData: createSafeInitialData(ViewArrayDataSchema, {
      store: "Default text",
      inputs: null,
      output: [],
      viewPath: [],
      summaryLimit: 6,
    }),
    dataSchema: ViewArrayDataSchema,
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
    icon: "LuFileText",
    author: "Agenitix Team",
    description: "ViewArray node for display",
    feature: "base",
    tags: ["view", "viewArray"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This viewArray node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "FE1H",
  collapsedSize: "C2W",
} as ViewArrayData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const ViewArrayNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // Track render performance
    const endRenderTracking = trackRender("ViewArrayNode", {
      id,
      dataSize: JSON.stringify(data || {}).length,
    });

    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const { isExpanded, isEnabled, isActive, viewPath } =
      nodeData as ViewArrayData;

    // 4.2  Global React‑Flow store – memoized edge filtering to avoid expensive recalculation
    const edges = useStore(
      useCallback(
        (s) => s.edges.filter((e) => e.source === id || e.target === id),
        [id]
      ),
      useCallback((a: any[], b: any[]) => {
        if (a === b) return true;
        if (a.length !== b.length) return false;
        // Quick length check first, then detailed comparison
        for (let i = 0; i < a.length; i++) {
          if (a[i].id !== b[i].id) return false;
        }
        return true;
      }, [])
    );
    const { getNodes } = useReactFlow();

    // keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<unknown>(null);

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

    /**
     * Compute the latest value coming from connected input handles.
     *
     * Uses findEdgeByHandle utility to properly handle React Flow's handle naming
     * conventions (handles get type suffixes like "json-input__j", "input__b").
     *
     * Priority: json-input > input (modify based on your node's specific handles)
     */
    const computeInput = useCallback((): unknown => {
      // Check json-input handle first, then input handle as fallback
      const jsonInputEdge = findEdgeByHandle(edges, id, "json-input");
      const inputEdge = findEdgeByHandle(edges, id, "input");

      const incoming = jsonInputEdge || inputEdge;
      if (!incoming) return null;

      const src = (getNodes() as any[]).find((n) => n.id === incoming.source);
      if (!src) return null;

      // priority: output ➜ inputData ➜ store ➜ whole data
      const inputValue =
        src.data?.output ?? src.data?.inputData ?? src.data?.store ?? src.data;
      if (typeof inputValue === "string") {
        // Try to parse JSON-like strings (arrays or objects); otherwise return string
        try {
          const trimmed = inputValue.trim();
          if (trimmed.length === 0) return null;
          const looksArray = trimmed.startsWith("[") && trimmed.endsWith("]");
          const looksObject = trimmed.startsWith("{") && trimmed.endsWith("}");
          if (looksArray || looksObject) {
            return JSON.parse(trimmed);
          }
          return inputValue; // plain string allowed
        } catch {
          return inputValue; // invalid JSON, treat as string
        }
      }
      return inputValue as unknown;
    }, [edges, id, getNodes]);

    // -------------------------------------------------------------------------
    // 4.4.1  Collapsed-view navigation helpers
    // -------------------------------------------------------------------------
    /**
     * Resolve nested value at a given path of keys.
     * [Explanation], basically walk the structure by keys/indexes to get nested value
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

    /** Drill into a nested index if it is an object/array */
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

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Whenever nodes/edges change, recompute inputs. */
    useEffect(() => {
      const inputVal = computeInput();
      if (inputVal !== (nodeData as ViewArrayData).inputs) {
        trackNodeUpdate(id, "inputs-changed");
        updateNodeData({ inputs: inputVal });
      }
    }, [computeInput, nodeData, updateNodeData, id]);

    /* 🔄 Batch multiple state updates to reduce render cascades */
    useEffect(() => {
      const updates: Partial<ViewArrayData> = {};
      let hasUpdates = false;

      // Force always-enabled state
      if (!isEnabled) {
        updates.isEnabled = true;
        hasUpdates = true;
      }

      // Keep viewPath valid when inputs change
      const root = (nodeData as ViewArrayData).inputs;
      const path = (nodeData as ViewArrayData).viewPath ?? [];
      const current = resolveAtPath(root, path);
      const invalid =
        path.length > 0 &&
        (current === undefined ||
          current === null ||
          typeof current !== "object");
      if (invalid) {
        updates.viewPath = [];
        hasUpdates = true;
      }

      // Update active state based on inputs
      const inputVal = (nodeData as ViewArrayData).inputs;
      const hasValue = inputVal !== null && inputVal !== undefined;
      const nextActive = isEnabled && hasValue;
      if (isActive !== nextActive) {
        updates.isActive = nextActive;
        hasUpdates = true;
      }

      if (hasUpdates) {
        trackNodeUpdate(id, "batched-updates");
        trackStateUpdate(`ViewArray-${id}-batch`);
        timeOperation(`updateNodeData-${id}`, () => updateNodeData(updates));
      }

      // Handle output propagation (no state update needed)
      propagate(inputVal);
      blockJsonWhenInactive();
    }, [
      nodeData,
      isEnabled,
      isActive,
      resolveAtPath,
      updateNodeData,
      id,
      propagate,
      blockJsonWhenInactive,
    ]);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("ViewArray", id, validation.errors, {
        originalData: validation.originalData,
        component: "ViewArrayNode",
      });
    }

    useNodeDataValidation(
      ViewArrayDataSchema,
      "ViewArray",
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
          Loading viewArray feature...
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

    // End render tracking
    useLayoutEffect(() => {
      endRenderTracking?.();
    });

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
            label={(nodeData as ViewArrayData).label || spec.displayName}
          />
        )}

        {/* Collapsed: show a compact summary of top-level array items */}
        {!isExpanded ? (
          <div
            className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ""}`}
          >
            <div className="w-[92%] max-h-16 overflow-y-auto rounded-md border border-border/30 bg-muted/20 p-1 font-mono text-[10px] leading-tight text-foreground/90">
              {(() => {
                const root = (validation.data as ViewArrayData).inputs;
                const path = (validation.data as ViewArrayData).viewPath ?? [];

                if (root === null || root === undefined) {
                  return <div className="text-muted-foreground">(empty)</div>;
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

                // Body: list entries at current level with types, double-click to drill
                const renderLevel = (value: unknown) => {
                  // Support arrays and plain objects; otherwise show a brief notice
                  if (
                    value === null ||
                    (typeof value !== "object" && !Array.isArray(value))
                  ) {
                    const typeText = value === null ? "null" : typeof value;
                    return (
                      <div className="text-muted-foreground">
                        (not a collection){" "}
                        <span className="text-foreground/60">{typeText}</span>
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
                    (validation.data as ViewArrayData).summaryLimit ??
                    SUMMARY_MAX_ITEMS;
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
                              {isArray ? `[${String(k)}]` : `"${String(k)}"`}
                            </span>
                            <span className="text-foreground/70">: </span>
                            <span
                              className={
                                isDrillable ? "text-blue-400" : "text-blue-300"
                              }
                            >
                              {Array.isArray(v)
                                ? "array"
                                : typeof v === "object"
                                  ? "object"
                                  : typeText}
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
                              (validation.data as ViewArrayData).summaryLimit ??
                              SUMMARY_MAX_ITEMS;
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
                {((validation.data as ViewArrayData).viewPath ?? []).length ===
                0
                  ? "root"
                  : (validation.data as ViewArrayData).viewPath
                      .map((seg) =>
                        typeof seg === "string" ? seg : `[${seg}]`
                      )
                      .join(".")}
              </code>
            </div>
            <div className="flex-1  overflow-auto rounded-md bg-muted/10">
              <JsonHighlighter
                data={(() => {
                  const root = (validation.data as ViewArrayData).inputs;
                  const path =
                    (validation.data as ViewArrayData).viewPath ?? [];
                  const value =
                    path.length === 0 ? root : resolveAtPath(root, path);
                  return Array.isArray(value) ? value : value; // [Explanation], basically show current view even if not array after drill
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
const ViewArrayNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const { expandedSize, collapsedSize } = nodeData as ViewArrayData;
  const dynamicSpec = useMemo(
    () => createDynamicSpec({ expandedSize, collapsedSize } as ViewArrayData),
    [expandedSize, collapsedSize]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <ViewArrayNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default ViewArrayNodeWithDynamicSpec;
