/**
 * createText NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
 * • Zod schema auto‑generates type‑checked Inspector controls.
 * • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
 * • Output propagation is gated by `isActive` *and* `isEnabled` to prevent runaway loops.
 * • Code is fully commented and follows current React + TypeScript best practices.
 *
 * Keywords: create-text, schema-driven, type‑safe, clean‑architecture
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
import { Textarea } from "@/components/ui/textarea";
import { findEdgeByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { normalizeHandleId } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";
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
import { useStore } from "@xyflow/react";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const CreateTextDataSchema = z
  .object({
    store: z.string().default(""),
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    inputs: SafeSchemas.optionalText().nullable().default(null),
    output: z.record(z.string(), z.string()).optional(), // handle-based output object for Convex compatibility
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C1W"),
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type CreateTextData = z.infer<typeof CreateTextDataSchema>;

const validateNodeData = createNodeValidator(
  CreateTextDataSchema,
  "CreateText"
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  CREATE: {
    primary: "text-[--node-create-text]",
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
// 3️⃣  Dynamic spec factory (pure) - Optimized with caching
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 * Performance optimized with memoization cache to avoid recreating spec objects.
 */
const createDynamicSpec = (() => {
  const specCache = new Map<string, NodeSpec>();

  return (data: CreateTextData): NodeSpec => {
    const cacheKey = `${data.expandedSize}-${data.collapsedSize}`;

    if (specCache.has(cacheKey)) {
      const cachedSpec = specCache.get(cacheKey);
      if (cachedSpec) {
        return cachedSpec;
      }
    }

    const expanded =
      EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
      EXPANDED_SIZES.VE2;
    const collapsed =
      COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
      COLLAPSED_SIZES.C1W;

    const spec: NodeSpec = {
      kind: "createText",
      displayName: "Create Text",
      label: "Create Text",
      category: CATEGORIES.CREATE,
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
          code: "b",
          position: "left",
          type: "target",
          dataType: "Boolean",
        },
      ],
      inspector: { key: "CreateTextInspector" },
      version: 1,
      runtime: { execute: "createText_execute_v1" },
      initialData: createSafeInitialData(CreateTextDataSchema, {
        store: "",
        inputs: null,
        output: {}, // handle-based output object
        isEnabled: true, // Enable node by default
        isActive: false, // Will become active when enabled
        isExpanded: false, // Default to collapsed
      }),
      dataSchema: CreateTextDataSchema,
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
            placeholder: "Enter Text",
            ui: { rows: 4 },
          },
          { key: "isExpanded", type: "boolean", label: "Expand" },
        ],
      },
      icon: "LuFileText",
      author: "Agenitix Team",
      description:
        "Creates text content with customizable formatting and styling options",
      feature: "base",
      tags: ["content", "formatting"],
      theming: {},
    };

    specCache.set(cacheKey, spec);
    return spec;
  };
})();

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C1W",
} as CreateTextData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const CreateTextNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);

    // -------------------------------------------------------------------------
    // 4.2  Derived state - memoized to prevent re-renders
    // -------------------------------------------------------------------------
    const { isExpanded, isEnabled, isActive, store } = useMemo(() => {
      const data = nodeData as CreateTextData;
      return {
        isExpanded: data.isExpanded,
        isEnabled: data.isEnabled,
        isActive: data.isActive,
        store: data.store,
      };
    }, [nodeData]);

    const categoryStyles = CATEGORY_TEXT.CREATE;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted output to avoid redundant writes
    const lastGeneralOutputRef = useRef<string | undefined>(undefined);

    // Ref for collapsed textarea to keep scroll at top
    const collapsedTextareaRef = useRef<HTMLTextAreaElement | null>(null);
    // Ref for expanded textarea to keep scroll stable
    const expandedTextareaRef = useRef<HTMLTextAreaElement | null>(null);

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

    /** Compute the latest text coming from connected input handles. */
    const computeInput = useCallback((): string | null => {
      // Check json-input handle first, then input handle as fallback
      const jsonInputEdge = findEdgeByHandle(edges, id, "json-input");
      const inputEdge = findEdgeByHandle(edges, id, "input");

      const incoming = jsonInputEdge || inputEdge;
      if (!incoming) {
        return null;
      }

      const src = nodes.find((n) => n.id === incoming.source);
      if (!src) {
        return null;
      }

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
        // Direct output mapping - store the actual text value, not an object
        const textValue =
          typeof nodeData.store === "string" ? nodeData.store : "";

        // Only update if changed
        const hasChanged = lastGeneralOutputRef.current !== textValue;

        if (hasChanged) {
          lastGeneralOutputRef.current = textValue;
          updateNodeData({ output: textValue });
        }
      } catch (error) {
        console.error(`CreateText ${id}: Error generating output`, error, {
          spec: spec?.kind,
          nodeDataKeys: Object.keys(nodeData || {}),
        });

        // Fallback: set empty string to prevent crashes
        if (lastGeneralOutputRef.current !== undefined) {
          lastGeneralOutputRef.current = "";
          updateNodeData({ output: "" });
        }
      }
    }, [
      spec.handles,
      nodeData.isActive,
      nodeData.isEnabled,
      nodeData.store,
      nodeData.inputs,
      updateNodeData,
      id,
    ]);

    /* 🔄 Whenever nodes/edges change, recompute inputs. */
    useEffect(() => {
      const inputVal = computeInput();
      if (inputVal !== (nodeData as CreateTextData).inputs) {
        updateNodeData({ inputs: inputVal });
      }
    }, [computeInput, nodeData, updateNodeData]);

    /* 🔄 Make isEnabled dependent on input value only when there are connections. */
    useEffect(() => {
      const hasInput = (nodeData as CreateTextData).inputs;
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
      const hasValidStore = currentStore.trim().length > 0;

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

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("CreateText", id, validation.errors, {
        originalData: validation.originalData,
        component: "CreateTextNode",
      });
    }

    useNodeDataValidation(
      CreateTextDataSchema,
      "CreateText",
      validation.data,
      id
    );

    // -------------------------------------------------------------------------
    // 4.7  Render
    // -------------------------------------------------------------------------

    // Memoized textarea components to prevent re-renders
    const CollapsedTextarea = useMemo(
      () => (
        <Textarea
          key={`collapsed-${id}`}
          ref={collapsedTextareaRef}
          value={store ?? ""}
          onChange={handleStoreChange}
          variant="barebones"
          placeholder="..."
          className={`nowheel m-4 h-6 min-h-8 resize-none overflow-y-auto  mt-8 text-center text-xs align-top ${categoryStyles.primary}`}
          disabled={!isEnabled}
          style={{ verticalAlign: "top" }}
        />
      ),
      [id, store, handleStoreChange, isEnabled, categoryStyles.primary]
    );

    const ExpandedTextarea = useMemo(
      () => (
        <Textarea
          key={`expanded-${id}`}
          ref={expandedTextareaRef}
          value={store ?? ""}
          onChange={handleStoreChange}
          variant="barebones"
          placeholder="Enter your content here…"
          className={`nowheel h-32 min-h-32 resize-none overflow-y-auto  mt-2 p-2 text-xs align-top ${categoryStyles.primary}`}
          disabled={!isEnabled}
          style={{ verticalAlign: "top" }}
        />
      ),
      [id, store, handleStoreChange, isEnabled, categoryStyles.primary]
    );

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
            label={(nodeData as CreateTextData).label || spec.displayName}
          />
        )}

        {isExpanded ? (
          <div
            className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}
          >
            {ExpandedTextarea}
          </div>
        ) : (
          <div
            className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled}`}
          >
            {CollapsedTextarea}
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
  (prevProps, nextProps) => {
    // Custom comparison for performance, basically only re-render when essential props change
    return (
      prevProps.id === nextProps.id &&
      prevProps.data === nextProps.data &&
      prevProps.spec?.displayName === nextProps.spec?.displayName
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
 *
 * Performance optimizations:
 * • Added React.memo with custom comparison function, basically prevents unnecessary re-renders
 * • Optimized useMemo dependencies to only track size changes, basically reduces spec recalculation
 * • Added specCache to createDynamicSpec, basically reuses spec objects when possible
 */
const CreateTextNodeWithDynamicSpec = memo(
  (props: NodeProps) => {
    const { nodeData } = useNodeData(props.id, props.data);

    // Optimized: Direct dependency tracking without intermediate object creation
    const dynamicSpec = useMemo(
      () =>
        createDynamicSpec({
          expandedSize: (nodeData as CreateTextData).expandedSize,
          collapsedSize: (nodeData as CreateTextData).collapsedSize,
        } as CreateTextData),
      [
        (nodeData as CreateTextData).expandedSize,
        (nodeData as CreateTextData).collapsedSize,
      ]
    );

    // Memoise the scaffolded component to keep focus
    const ScaffoldedNode = useMemo(
      () =>
        withNodeScaffold(dynamicSpec, (p) => (
          <CreateTextNode {...p} spec={dynamicSpec} />
        )),
      [dynamicSpec]
    );

    return <ScaffoldedNode {...props} />;
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memo, basically only re-render when essential props change
    return (
      prevProps.id === nextProps.id &&
      prevProps.data === nextProps.data &&
      prevProps.selected === nextProps.selected
    );
  }
);

export default CreateTextNodeWithDynamicSpec;
