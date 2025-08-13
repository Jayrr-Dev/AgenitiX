/**
 * MergeNode NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Merges different types of data: text strings, objects, and arrays
 * • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
 * • Zod schema auto‑generates type‑checked Inspector controls.
 * • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
 * • Output propagation is gated by `isActive` *and* `isEnabled` to prevent runaway loops.
 * • Uses findEdgeByHandle utility for robust React Flow edge handling.
 * • Auto-disables when all input connections are removed (handled by flow store).
 * • Code is fully commented and follows current React + TypeScript best practices.
 *
 * Keywords: merge-node, schema-driven, type‑safe, clean‑architecture, data-merging
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

export const MergeNodeDataSchema = z
  .object({
    input: z.string().optional(),
    output: SafeSchemas.optionalText(),
    
    // Node state
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    
    // UI configuration
    expandedSize: SafeSchemas.text("FE3"),
    collapsedSize: SafeSchemas.text("C2"),
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type MergeNodeData = z.infer<typeof MergeNodeDataSchema>;

const validateNodeData = createNodeValidator(
  MergeNodeDataSchema,
  "MergeNode",
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  STORE: {
    primary: "text-[--node--s-t-o-r-e-text]",
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
function createDynamicSpec(data: MergeNodeData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.FE1;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C1;

  return {
    kind: "mergeNode",
    displayName: "MergeNode",
    label: "MergeNode",
    category: CATEGORIES.STORE,
    size: { expanded, collapsed },
    handles: [
      {
        id: "input",
        code: "s",
        position: "left",
        type: "target",
        dataType: "String",
      },
      {
        id: "output",
        code: "s",
        position: "right",
        type: "source",
        dataType: "String",
      },
    ],
    inspector: { key: "MergeNodeInspector" },
    version: 1,
    runtime: { execute: "mergeNode_execute_v1" },
    initialData: createSafeInitialData(MergeNodeDataSchema, {
      isEnabled: true,
    }),
    dataSchema: MergeNodeDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "output",
        "expandedSize",
        "collapsedSize",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuLink",
    author: "Agenitix Team",
    description: "merging input values",
    feature: "base",
    tags: ["store", "mergeNode"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This mergeNode node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "FE3",
  collapsedSize: "C2",
} as MergeNodeData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const MergeNodeNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const {
      isEnabled = true,
      isActive = false,
      isExpanded = false,
    } = nodeData as MergeNodeData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<string | null>(null);

    const categoryStyles = CATEGORY_TEXT.STORE;

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
          updateNodeData({ output: out });
        }
      },
      [isActive, isEnabled, updateNodeData],
    );

    /** Clear JSON‑ish fields when inactive or disabled */
    const blockJsonWhenInactive = useCallback(() => {
      if (!isActive || !isEnabled) {
        updateNodeData({
          output: ""
        });
      }
    }, [isActive, isEnabled, updateNodeData]);

    // Get the edges and nodes from React Flow store
    const rfEdges = useStore((state) => state.edges);
    const rfNodes = useStore((state) => state.nodes);
    
    // Get all input values from connected nodes
    const inputValues = useMemo(() => {
      // Find all edges that connect to this node's input handle
      const inputEdges = rfEdges.filter(edge => edge.target === id && edge.targetHandle?.startsWith('input'));
      if (inputEdges.length === 0) return [];
      
      // Get values from all source nodes
      const values = inputEdges.map(edge => {
        const sourceNode = rfNodes.find(n => n.id === edge.source);
        if (!sourceNode) return '';
        
        // Try to get output from source node
        const sourceOutput = sourceNode.data?.output;
        
        // Log the raw source output to debug
        console.log(`Source node [${sourceNode.id}] raw output:`, sourceOutput, typeof sourceOutput);
        
        // Handle different types of output
        if (typeof sourceOutput === "string") {
          try {
            if (sourceOutput.trim().startsWith('{') && sourceOutput.includes('"output"')) {
              const parsed = JSON.parse(sourceOutput);
              if (parsed && typeof parsed === 'object' && 'output' in parsed) {
                console.log(`Extracted output from JSON string:`, parsed.output);
                return String(parsed.output);
              }
            }
            return sourceOutput;
          } catch (e) {
            console.log("Not valid JSON, using as plain string", sourceOutput);
            return sourceOutput;
          }
        } else if (typeof sourceOutput === "object") {
          try {
            // If it's an object with an output property, use that
            if (sourceOutput && 'output' in sourceOutput) {
              return String(sourceOutput.output);
            }
            // If it's an object with a text or value property, use that
            else if (sourceOutput && 'text' in sourceOutput) {
              return String(sourceOutput.text);
            } else if (sourceOutput && 'value' in sourceOutput) {
              return String(sourceOutput.value);
            } else {
              // Try to extract meaningful text from the object
              const jsonStr = JSON.stringify(sourceOutput);
              return jsonStr !== '{}' && jsonStr !== 'null' ? jsonStr : '';
            }
          } catch (e) {
            console.error("Error extracting text from object:", e);
            return '';
          }
        } else if (sourceOutput === undefined || sourceOutput === null) {
          return '';
        }
        
        // Convert any other types to string
        return String(sourceOutput);
      }).filter(Boolean); // Remove any empty strings
      
      // Log input values
      console.log(`MergeNode [${id}] Input Values:`, values);
      
      return values;
    }, [rfEdges, rfNodes, id]);
    
    // Process the inputs by concatenating them
    const processedOutput = useMemo(() => {
      if (inputValues.length === 0) {
        return undefined;
      }

      try {
        // Concatenate all input strings
        const result = inputValues.join('');
        
        // Log processed output
        console.log(`MergeNode [${id}] Processed Output:`, result);
        
        return result;
      } catch (error) {
        console.error("Error processing values:", error);
        return undefined;
      }
    }, [inputValues, id]);

    // Propagate processed output to node data
    useEffect(() => {
      // Only update if output actually changed
      if (data.output !== processedOutput) {
        console.log(`MergeNode [${id}] Updating Output:`, { 
          previous: data.output, 
          new: processedOutput 
        });
        
        // Output as a simple string without any JSON formatting
        console.log(`MergeNode [${id}] Plain Output:`, processedOutput);
        
        updateNodeData({ output: processedOutput });
      }
    }, [processedOutput, data.output, updateNodeData, id]);

    // Monitor inputs and update active state
    useEffect(() => {
      const hasValidInput = inputValues.length > 0;

      // If disabled, always set isActive to false
      if (!isEnabled) {
        updateNodeData({ isActive: false });
      } else {
        if (isActive !== hasValidInput) {
          updateNodeData({ isActive: Boolean(hasValidInput) });
        }
      }
    }, [inputValues, isEnabled, isActive, updateNodeData]);

    // Sync output with active and enabled state
    useEffect(() => {
      const output = (nodeData as MergeNodeData).output;
      if (isActive && isEnabled && output !== undefined) {
        propagate(output);
      } else {
        blockJsonWhenInactive();
      }
    }, [isActive, isEnabled, nodeData, propagate, blockJsonWhenInactive]);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("MergeNode", id, validation.errors, {
        originalData: validation.originalData,
        component: "MergeNodeNode",
      });
    }

    useNodeDataValidation(
      MergeNodeDataSchema,
      "MergeNode",
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
          Loading mergeNode feature...
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
        {!data.isExpanded &&
        spec.size.collapsed.width === 60 &&
        spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-1 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode nodeId={id} label={(nodeData as MergeNodeData).label || spec.displayName} />
        )}

        {!data.isExpanded ? (
          <div className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className="flex justify-center items-center h-full">
              🔗
            </div>
          </div>
        ) : (
          <div className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className={`${CONTENT.body} flex flex-col gap-2`}>
              <div className="flex flex-col gap-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Input:
                </div>
                <div className="h-6 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-muted/30 px-2 py-1 text-xs">
                  {inputValues.length > 0
                    ? inputValues.join(', ')
                    : "(no input)"}
                </div>
              </div>
              
              <div className="flex flex-col gap-1 mt-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Output (Processed):
                </div>
                <div className="h-6 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-muted/30 px-2 py-1 text-xs">
                  {(nodeData as MergeNodeData).output || "<no output>"}
                </div>
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
const MergeNodeNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as MergeNodeData),
    [
      (nodeData as MergeNodeData).expandedSize,
      (nodeData as MergeNodeData).collapsedSize,
    ],
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <MergeNodeNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec],
  );

  return <ScaffoldedNode {...props} />;
};

export default MergeNodeNodeWithDynamicSpec;
