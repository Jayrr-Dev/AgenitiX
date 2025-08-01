/**
 * CreateObject Node - JSON object creation with schema validation
 * 
 * Creates and validates JSON objects with real-time editing and type safety.
 * Supports dynamic sizing, input connections, and automatic validation.
 * 
 * @example
 * <CreateObjectNode 
 *   id="node-123"
 *   data={{ store: '{"key": "value"}' }}
 * />
 */

import type { NodeProps } from "@xyflow/react";
import { type ChangeEvent, memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { Textarea } from "@/components/ui/textarea";
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
import { useNodeToast } from "@/hooks/useNodeToast";
import { useStore } from "@xyflow/react";

// Schema & Types
export const CreateObjectDataSchema = z
  .object({
    store: z.string().default("{}"),
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    inputs: SafeSchemas.optionalText().nullable().default(null),
    outputs: SafeSchemas.optionalText(),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C1W"),
    label: z.string().optional(),
  })
  .passthrough();

export type CreateObjectData = z.infer<typeof CreateObjectDataSchema>;

const validateNodeData = createNodeValidator(CreateObjectDataSchema, "CreateObject");

// Constants
const CATEGORY_TEXT = {
  CREATE: {
    primary: "text-[--node-create-text]",
  },
} as const;

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  disabled: "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// Performance constants
const JSON_PARSE_TIMEOUT = 100; // ms
const DEBOUNCE_DELAY = 150; // ms

// Dynamic spec factory (memoized for performance)
const createDynamicSpec = (() => {
  const specCache = new Map<string, NodeSpec>();

  return (data: CreateObjectData): NodeSpec => {
    const cacheKey = `${data.expandedSize}-${data.collapsedSize}`;

    if (specCache.has(cacheKey)) {
      return specCache.get(cacheKey)!;
    }

    const expanded = EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ?? EXPANDED_SIZES.VE2;
    const collapsed = COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ?? COLLAPSED_SIZES.C1W;

    const spec: NodeSpec = {
      kind: "createObject",
      displayName: "Create Object",
      label: "Create Object",
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
      inspector: { key: "CreateObjectInspector" },
      version: 1,
      runtime: { execute: "createObject_execute_v1" },
      initialData: createSafeInitialData(CreateObjectDataSchema, {
        store: "{}",
        inputs: null,
        outputs: "",
      }),
      dataSchema: CreateObjectDataSchema,
      controls: {
        autoGenerate: true,
        excludeFields: ["isActive", "inputs", "outputs", "expandedSize", "collapsedSize"],
        customFields: [
          { key: "isEnabled", type: "boolean", label: "Enable" },
          {
            key: "store",
            type: "textarea",
            label: "Store",
            placeholder: "Enter JSON Object",
            ui: { rows: 4 },
          },
          { key: "isExpanded", type: "boolean", label: "Expand" },
        ],
      },
      icon: "Braces",
      author: "Agenitix Team",
      description: "Creates JSON objects with customizable structure and validation",
      feature: "base",
      tags: ["content", "json", "object"],
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
} as CreateObjectData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const CreateObjectNode = memo(({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
  // State management
  const { nodeData, updateNodeData } = useNodeData(id, data);
  const { showSuccess, showError, showWarning, showInfo } = useNodeToast(id);

  // Optimized state extraction - only re-compute when nodeData changes
  const { isExpanded, isEnabled, isActive, store } = useMemo(() => {
    const typedData = nodeData as CreateObjectData;
    return {
      isExpanded: typedData.isExpanded,
      isEnabled: typedData.isEnabled,
      isActive: typedData.isActive,
      store: typedData.store,
    };
  }, [nodeData]);

  // Optimized store selectors - only subscribe to what we need
  const nodes = useStore(useCallback((s) => s.nodes, []));
  const edges = useStore(useCallback((s) => s.edges, []));

  // Refs for performance
  const lastOutputRef = useRef<string | null>(null);
  const collapsedTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const expandedTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Optimized callbacks
  const toggleExpand = useCallback(() => {
    updateNodeData({ isExpanded: !isExpanded });
  }, [isExpanded, updateNodeData]);

  // Debounced JSON parsing for better performance
  const parseJsonSafely = useCallback((value: string) => {
    try {
      const parsed = JSON.parse(value);
      showSuccess("Valid JSON", "Object parsed successfully");
      return parsed;
    } catch (error) {
      showError("Invalid JSON", error instanceof Error ? error.message : "Failed to parse JSON");
      return value;
    }
  }, [showSuccess, showError]);

  const propagate = useCallback(
    (value: string) => {
      if (!(isActive && isEnabled)) return;

      const parsed = parseJsonSafely(value);
      const serialized = JSON.stringify(parsed);

      if (serialized !== JSON.stringify(lastOutputRef.current)) {
        lastOutputRef.current = parsed;
        updateNodeData({ outputs: parsed });
      }
    },
    [isActive, isEnabled, updateNodeData, parseJsonSafely]
  );

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

  // Optimized input computation with memoization
  const computeInput = useCallback((): string | null => {
    const jsonInputEdge = findEdgeByHandle(edges, id, "json-input");
    const inputEdge = findEdgeByHandle(edges, id, "input");
    const incoming = jsonInputEdge || inputEdge;

    if (!incoming) return null;

    const src = nodes.find((n) => n.id === incoming.source);
    if (!src) return null;

    const inputValue = src.data?.outputs ?? src.data?.store ?? src.data;
    return typeof inputValue === "string" ? inputValue : JSON.stringify(inputValue || {});
  }, [edges, nodes, id]);

  // Debounced store change handler
  const handleStoreChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Immediate UI update
      updateNodeData({ store: value });

      // Debounced validation and propagation
      debounceTimeoutRef.current = setTimeout(() => {
        propagate(value === "{}" ? "{}" : value);
      }, DEBOUNCE_DELAY);
    },
    [updateNodeData, propagate]
  );

  // Optimized effects with proper dependencies
  useEffect(() => {
    const inputVal = computeInput();
    const currentInputs = (nodeData as CreateObjectData).inputs;

    if (inputVal !== currentInputs) {
      updateNodeData({ inputs: inputVal });
    }
  }, [computeInput, nodeData, updateNodeData]);

  useEffect(() => {
    const currentInputs = (nodeData as CreateObjectData).inputs;

    if (currentInputs !== null) {
      const nextEnabled = Boolean(currentInputs?.trim());
      if (nextEnabled !== isEnabled) {
        updateNodeData({ isEnabled: nextEnabled });
        if (nextEnabled) {
          showInfo("Node enabled", "Input connection detected");
        } else {
          showWarning("Node disabled", "No input connection");
        }
      }
    }
  }, [nodeData, isEnabled, updateNodeData, showInfo, showWarning]);

  useEffect(() => {
    const currentStore = store ?? "";
    const hasValidStore = currentStore.trim().length > 0 && currentStore !== "{}";
    const shouldBeActive = isEnabled && hasValidStore;

    if (isActive !== shouldBeActive) {
      updateNodeData({ isActive: shouldBeActive });
    }
  }, [store, isEnabled, isActive, updateNodeData]);

  useEffect(() => {
    const currentStore = store ?? "";
    const actualContent = currentStore === "{}" ? "{}" : currentStore;

    if (isActive && isEnabled) {
      propagate(actualContent);
    } else {
      blockJsonWhenInactive();
    }
  }, [isActive, isEnabled, store, propagate, blockJsonWhenInactive]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Validation (memoized for performance)
  const validation = useMemo(() => validateNodeData(nodeData), [nodeData]);

  if (!validation.success) {
    reportValidationError("CreateObject", id, validation.errors, {
      originalData: validation.originalData,
      component: "CreateObjectNode",
    });
  }

  useNodeDataValidation(CreateObjectDataSchema, "CreateObject", validation.data, id);

  // Memoized styles and values
  const categoryStyles = useMemo(() => CATEGORY_TEXT.CREATE, []);
  const displayValue = useMemo(() => store === "{}" ? "" : (store ?? ""), [store]);

  // Highly optimized textarea components
  const CollapsedTextarea = useMemo(() => (
    <Textarea
      ref={collapsedTextareaRef}
      value={displayValue}
      onChange={handleStoreChange}
      variant="barebones"
      placeholder="..."
      className={`nowheel m-4 h-6 min-h-8 resize-none overflow-y-auto mt-8 text-center text-xs align-top font-mono ${categoryStyles.primary}`}
      disabled={!isEnabled}
      style={{ verticalAlign: 'top' }}
    />
  ), [displayValue, handleStoreChange, isEnabled, categoryStyles.primary]);

  const ExpandedTextarea = useMemo(() => (
    <Textarea
      ref={expandedTextareaRef}
      value={displayValue}
      onChange={handleStoreChange}
      variant="barebones"
      placeholder="Enter your JSON object here…"
      className={`nowheel h-32 min-h-32 resize-none overflow-y-auto mt-2 p-2 text-xs align-top font-mono ${categoryStyles.primary}`}
      disabled={!isEnabled}
      style={{ verticalAlign: 'top' }}
    />
  ), [displayValue, handleStoreChange, isEnabled, categoryStyles.primary]);

  // Memoized render components
  const IconOrLabel = useMemo(() => {
    const shouldShowIcon = !isExpanded && spec.size.collapsed.width === 60 && spec.size.collapsed.height === 60;

    return shouldShowIcon ? (
      <div className="absolute inset-0 flex justify-center p-1 text-foreground/80 text-lg">
        {spec.icon && renderLucideIcon(spec.icon, "", 16)}
      </div>
    ) : (
      <LabelNode nodeId={id} label={(nodeData as CreateObjectData).label || spec.displayName} />
    );
  }, [isExpanded, spec.size.collapsed.width, spec.size.collapsed.height, spec.icon, spec.displayName, id, nodeData]);

  const contentClassName = useMemo(() => {
    const baseClass = isExpanded ? CONTENT.expanded : CONTENT.collapsed;
    return `${baseClass} ${isEnabled ? "" : CONTENT.disabled}`;
  }, [isExpanded, isEnabled]);

  return (
    <>
      {IconOrLabel}

      <div className={contentClassName}>
        {isExpanded ? ExpandedTextarea : CollapsedTextarea}
      </div>

      <ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} size="sm" />
    </>
  );
});

// Optimized wrapper with performance improvements
const CreateObjectNodeWithDynamicSpec = memo((props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);
  const typedData = nodeData as CreateObjectData;

  // Highly optimized size key extraction
  const sizeKeys = useMemo(
    () => ({
      expandedSize: typedData.expandedSize,
      collapsedSize: typedData.collapsedSize,
    }),
    [typedData.expandedSize, typedData.collapsedSize]
  );

  // Cached spec generation
  const dynamicSpec = useMemo(
    () => createDynamicSpec({ ...sizeKeys, store: "{}" } as CreateObjectData),
    [sizeKeys]
  );

  // Stable scaffolded component reference
  const ScaffoldedNode = useMemo(
    () => withNodeScaffold(dynamicSpec, (p) => <CreateObjectNode {...p} spec={dynamicSpec} />),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
});

CreateObjectNode.displayName = "CreateObjectNode";
CreateObjectNodeWithDynamicSpec.displayName = "CreateObjectNodeWithDynamicSpec";

export default CreateObjectNodeWithDynamicSpec;