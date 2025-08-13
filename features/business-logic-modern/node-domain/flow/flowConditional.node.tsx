/**
 * FlowConditional NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
 * • Zod schema auto‑generates type‑checked Inspector controls.
 * • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
 * • Output propagation is gated by `isActive` *and* `isEnabled` to prevent runaway loops.
 * • Uses findEdgeByHandle utility for robust React Flow edge handling.
 * • Auto-enables when inputs connect; never auto-disables automatically.
 * • Code is fully commented and follows current React + TypeScript best practices.
 *
 * Keywords: flow-conditional, schema-driven, type‑safe, clean‑architecture
 */

import type { NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export const FlowConditionalDataSchema = z
  .object({
    isEnabled: SafeSchemas.boolean(true), // is node active?
    isActive: SafeSchemas.boolean(false), // reflects if node is processing
    isExpanded: SafeSchemas.boolean(false), // inspector open?
    booleanInput: z.boolean().nullable().default(null), // incoming boolean signal
    topOutput: z.boolean().nullable().default(null), // top output (true path)
    bottomOutput: z.boolean().nullable().default(null), // bottom output (false path)
    output: z.record(z.string(), z.boolean()).optional(), // handle-based output object for Convex compatibility
    lastRoute: z.enum(["true", "false", "none"]).default("none"), // last active route
    invertLogic: SafeSchemas.boolean(false), // invert the routing logic
    expandedSize: SafeSchemas.text("FE1"),
    collapsedSize: SafeSchemas.text("C1"),
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type FlowConditionalData = z.infer<typeof FlowConditionalDataSchema>;

const validateNodeData = createNodeValidator(
  FlowConditionalDataSchema,
  "FlowConditional"
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  CYCLE: {
    primary: "text-[--node--c-y-c-l-e-text]",
  },
} as const;

const CONTENT = {
  expanded:
    "p-6 w-full h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer",
  collapsed:
    "flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm cursor-pointer",
  header:
    "flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700",
  body: "flex-1 flex items-center justify-center",
  disabled: "opacity-60 grayscale transition-all duration-300",

  // Input display
  inputSection:
    "bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm",
  inputHeader:
    "text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2",
  inputDisplay: "flex flex-col items-center gap-3",
  inputLabel: "text-sm text-slate-600 dark:text-slate-400",

  // Status section
  statusSection:
    "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-700",
  statusGrid: "grid grid-cols-1 gap-2",
  statusRow: "flex items-center justify-between",
  statusLabel: "text-xs font-medium text-slate-500 dark:text-slate-400",
  statusValue: "text-xs font-semibold",
  statusActive: "text-emerald-600 dark:text-emerald-400",
  statusInactive: "text-red-500 dark:text-red-400",

  // Route indicators
  route: "flex items-center justify-center w-full h-full relative p-4",
  routeIndicator: "text-center relative z-10",
  trueRoute: "text-emerald-500 font-bold text-lg",
  falseRoute: "text-red-500 font-bold text-lg",
  noRoute: "text-slate-400 font-bold text-lg",

  // Arrows
  arrow: "absolute text-2xl font-bold transition-all duration-300",
  arrowRight: "right-2 top-1/2 transform -translate-y-1/2",
  arrowBottom: "bottom-2 left-1/2 transform -translate-x-1/2",
  arrowActive: "text-blue-500 animate-pulse",
  arrowInactive: "text-slate-400 dark:text-slate-600",

  // Collapsed view
  collapsedIcon: "text-2xl mb-2 text-purple-600 dark:text-purple-400",
  collapsedTitle:
    "text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1",
  collapsedStatus: "mt-2 px-2 py-1 rounded-full text-xs font-medium",
  collapsedActive:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  collapsedInactive:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",

  // Input indicator
  inputIndicator:
    "text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full border border-blue-200 dark:border-blue-800",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: FlowConditionalData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.FE1;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C1;

  return {
    kind: "flowConditional",
    displayName: "FlowConditional",
    label: "FlowConditional",
    category: CATEGORIES.CYCLE,
    size: { expanded, collapsed },
    handles: [
      {
        id: "booleanInput",
        code: "boolean",
        position: "left",
        type: "target",
        dataType: "boolean",
      },
      {
        id: "topOutput",
        code: "boolean",
        position: "right",
        type: "source",
        dataType: "boolean",
      },
      {
        id: "bottomOutput",
        code: "boolean",
        position: "bottom",
        type: "source",
        dataType: "boolean",
      },
    ],
    inspector: { key: "FlowConditionalInspector" },
    version: 1,
    runtime: { execute: "flowConditional_execute_v1" },
    initialData: createSafeInitialData(FlowConditionalDataSchema, {
      booleanInput: null,
      topOutput: null,
      bottomOutput: null,
      output: {}, // Handle-based output object
      lastRoute: "none",
      expandedSize: "FE1",
      collapsedSize: "C1",
    }),
    dataSchema: FlowConditionalDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "booleanInput",
        "topOutput",
        "bottomOutput",
        "output",
        "lastRoute",
        "expandedSize",
        "collapsedSize",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
        { key: "invertLogic", type: "boolean", label: "Invert Logic" },
      ],
    },
    icon: "LuRefreshCw",
    author: "Agenitix Team",
    description:
      "Routes boolean signals to complementary output - true goes to top, false goes to bottom",
    feature: "base",
    tags: ["trigger", "flowConditional"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This flowConditional node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "FE1",
  collapsedSize: "C1",
} as FlowConditionalData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

export const FlowConditionalNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // Add ref for the node container
    const nodeRef = useRef<HTMLDivElement>(null);

    // Track if the node was recently clicked for visual feedback
    const [wasClicked, setWasClicked] = useState(false);
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);

    // Initialize missing fields if needed
    useEffect(() => {
      const updates: Partial<FlowConditionalData> = {};
      let needsUpdate = false;

      // Check if required fields are missing
      if (nodeData.topOutput === undefined) {
        updates.topOutput = null;
        needsUpdate = true;
      }
      if (nodeData.bottomOutput === undefined) {
        updates.bottomOutput = null;
        needsUpdate = true;
      }
      if (nodeData.lastRoute === undefined) {
        updates.lastRoute = "none";
        needsUpdate = true;
      }

      // Only update if needed
      if (needsUpdate) {
        console.log("Initializing missing FlowConditional fields:", updates);
        updateNodeData(updates);
      }
    }, [nodeData, updateNodeData]);

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const {
      isExpanded,
      isEnabled,
      isActive,
      booleanInput,
      lastRoute,
      invertLogic,
      collapsedSize,
    } = nodeData as FlowConditionalData;

    // -------------------------------------------------------------------------
    // 4.2.1  Advanced arrow positioning logic
    // -------------------------------------------------------------------------

    /**
     * Calculate dynamic arrow positioning based on active handle and node size
     * This provides pixel-perfect positioning for the arrow to point to the active handle
     * Supports dynamic handle positioning via handleOverrides
     */
    const getArrowPositioning = useCallback(() => {
      if (lastRoute === "none") {
        return { display: "none" };
      }

      // Get current node size (C1 = 60x60 when collapsed)
      const nodeSize = isExpanded
        ? { width: 120, height: 120 } // FE1 size
        : { width: 60, height: 60 }; // C1 size

      // Handle positioning constants from TypeSafeHandle
      const HANDLE_POSITION_OFFSET = 15; // pixels handles extend beyond node edge
      const HANDLE_SIZE = 10; // handle size in pixels

      // Calculate center points for handles
      const nodeCenter = isExpanded
        ? { x: nodeSize.width / 2.8, y: nodeSize.height / 3 } // True center for expanded
        : { x: nodeSize.width / 3, y: nodeSize.height / 4 }; // Adjusted for collapsed

      // Get handle overrides for dynamic positioning
      const handleOverrides = (nodeData as any)?.handleOverrides as
        | Array<{
            handleId: string;
            position: "top" | "bottom" | "left" | "right";
          }>
        | undefined;

      // Create override map for quick lookup
      const overrideMap = new Map<string, string>();
      if (handleOverrides) {
        handleOverrides.forEach((override) => {
          overrideMap.set(override.handleId, override.position);
        });
      }

      // Get actual positions (with overrides applied)
      const topOutputPosition = overrideMap.get("topOutput") || "right";
      const bottomOutputPosition = overrideMap.get("bottomOutput") || "bottom";

      // Check if both handles are on the same side
      const bothHandlesOnSameSide = topOutputPosition === bottomOutputPosition;

      // Calculate handle positions based on actual position (accounting for overrides and spacing)
      const getHandlePosition = (position: string, handleId: string) => {
        // Handle spacing constants from TypeSafeHandle system
        const HANDLE_SPACING = 16; // pixels between multiple handles on the same side

        let basePosition = {};
        let offset = 0;

        // If both handles are on the same side, calculate spacing
        if (bothHandlesOnSameSide) {
          // Determine handle order and spacing
          const handles = [
            { id: "topOutput", position: topOutputPosition },
            { id: "bottomOutput", position: bottomOutputPosition },
          ];

          // Calculate total spacing and start offset for centering
          const totalSpacing = (handles.length - 1) * HANDLE_SPACING;
          const startOffset = -totalSpacing / 2;

          // Find current handle index
          const handleIndex = handles.findIndex((h) => h.id === handleId);
          offset = startOffset + handleIndex * HANDLE_SPACING;
        }

        switch (position) {
          case "top":
            basePosition = {
              x: nodeCenter.x + offset,
              y: -HANDLE_POSITION_OFFSET - HANDLE_SIZE / 2,
            };
            break;
          case "bottom":
            basePosition = {
              x: nodeCenter.x + offset,
              y: nodeSize.height + HANDLE_POSITION_OFFSET + HANDLE_SIZE / 2,
            };
            break;
          case "left":
            basePosition = {
              x: -HANDLE_POSITION_OFFSET - HANDLE_SIZE / 2,
              y: nodeCenter.y + offset,
            };
            break;
          case "right":
            basePosition = {
              x: nodeSize.width + HANDLE_POSITION_OFFSET + HANDLE_SIZE / 2,
              y: nodeCenter.y + offset,
            };
            break;
          default:
            basePosition = { x: nodeCenter.x, y: nodeCenter.y };
        }

        return basePosition;
      };

      // Get target handle and its actual position
      const targetHandle = lastRoute === "true" ? "topOutput" : "bottomOutput";
      const targetPosition =
        targetHandle === "topOutput" ? topOutputPosition : bottomOutputPosition;
      const targetPos = getHandlePosition(targetPosition, targetHandle);

      // Calculate arrow position and rotation based on target direction
      const arrowSize = 16; // approximate arrow character size
      const arrowOffset = 6; // distance from node center

      let arrowStyle: Record<string, string | number> = {
        position: "absolute",
        fontSize: "24px",
        fontWeight: "900",
        transition: "all 0.3s ease-out",
        color: "#10b981", // green-500 for thick green arrow
        textShadow: "2px 2px 0px rgba(0, 0, 0, 0.3)", // skeuomorphic shadow
      };

      // Calculate arrow position and rotation based on target position
      // When handles are on the same side, move arrow vertically to align with specific handle
      if (bothHandlesOnSameSide) {
        // Move arrow to align with the specific handle position
        const targetHandleY = (targetPos as any).y;
        const targetHandleX = (targetPos as any).x;

        // Keep the same rotation as the side, but adjust position to match handle
        switch (targetPosition) {
          case "right":
            arrowStyle = {
              ...arrowStyle,
              left: `${nodeCenter.x + arrowOffset}px`,
              top: `${targetHandleY - arrowSize / 4}px`, // Move to handle's Y position
              transform: "rotate(0deg)", // →
            };
            break;
          case "bottom":
            arrowStyle = {
              ...arrowStyle,
              left: `${targetHandleX - arrowSize / 4}px`, // Move to handle's X position
              top: `${nodeCenter.y + arrowOffset}px`,
              transform: "rotate(90deg)", // ↓
            };
            break;
          case "left":
            arrowStyle = {
              ...arrowStyle,
              left: `${nodeCenter.x - arrowOffset - arrowSize}px`,
              top: `${targetHandleY - arrowSize / 4}px`, // Move to handle's Y position
              transform: "rotate(180deg)", // ←
            };
            break;
          case "top":
            arrowStyle = {
              ...arrowStyle,
              left: `${targetHandleX - arrowSize / 2}px`, // Move to handle's X position
              top: `${nodeCenter.y - arrowOffset - arrowSize}px`,
              transform: "rotate(270deg)", // ↑
            };
            break;
        }
      } else {
        // Standard positioning when handles are on different sides
        switch (targetPosition) {
          case "right":
            arrowStyle = {
              ...arrowStyle,
              left: `${nodeCenter.x + arrowOffset}px`,
              top: `${nodeCenter.y - arrowSize / 2}px`,
              transform: "rotate(0deg)", // →
            };
            break;
          case "bottom":
            arrowStyle = {
              ...arrowStyle,
              left: `${nodeCenter.x - arrowSize / 4}px`,
              top: `${nodeCenter.y + arrowOffset}px`,
              transform: "rotate(90deg)", // ↓
            };
            break;
          case "left":
            arrowStyle = {
              ...arrowStyle,
              left: `${nodeCenter.x - arrowOffset - arrowSize}px`,
              top: `${nodeCenter.y - arrowSize / 2}px`,
              transform: "rotate(180deg)", // ←
            };
            break;
          case "top":
            arrowStyle = {
              ...arrowStyle,
              left: `${nodeCenter.x - arrowSize / 2}px`,
              top: `${nodeCenter.y - arrowOffset - arrowSize}px`,
              transform: "rotate(270deg)", // ↑
            };
            break;
        }
      }

      return arrowStyle;
    }, [lastRoute, isExpanded, nodeData, (nodeData as any)?.handleOverrides]);

    // Memoize arrow positioning to prevent recalculation
    // Include handleOverrides in dependencies to update when handles are moved
    const handleOverrides = (nodeData as any)?.handleOverrides;

    // Debug effect to track handle override changes
    useEffect(() => {
      if (process.env.NODE_ENV === "development") {
        console.log(`🎯 FlowConditional arrow update for node ${id}:`, {
          lastRoute,
          isExpanded,
          handleOverrides,
          hasOverrides: !!handleOverrides?.length,
        });
      }
    }, [id, lastRoute, isExpanded, handleOverrides]);

    const arrowPositioning = useMemo(
      () => getArrowPositioning(),
      [
        lastRoute,
        isExpanded,
        handleOverrides,
        JSON.stringify(handleOverrides), // Force update on override changes
      ]
    );

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted output to avoid redundant writes
    const lastTopOutputRef = useRef<any>(null);
    const lastBottomOutputRef = useRef<any>(null);
    const lastGeneralOutputRef = useRef<any>(null);

    const _categoryStyles = CATEGORY_TEXT.CYCLE;

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

    /** Main routing logic - routes boolean input to complementary output */
    const routeData = useCallback(
      (inputSignal: boolean | null) => {
        if (!isActive || !isEnabled || inputSignal === null) {
          // Clear output when inactive/disabled or no input
          if (
            lastTopOutputRef.current !== null ||
            lastBottomOutputRef.current !== null
          ) {
            lastTopOutputRef.current = null;
            lastBottomOutputRef.current = null;
            updateNodeData({
              topOutput: null,
              bottomOutput: null,
              lastRoute: "none",
            });
          }
          return;
        }

        // Apply invert logic if enabled
        const processedSignal = invertLogic ? !inputSignal : inputSignal;

        // Flow switcher: both output are always active with complementary values
        if (processedSignal === true) {
          // TRUE signal: top=true, bottom=false
          const topOutput = true;
          const bottomOutput = false;

          if (
            topOutput !== lastTopOutputRef.current ||
            bottomOutput !== lastBottomOutputRef.current
          ) {
            lastTopOutputRef.current = topOutput;
            lastBottomOutputRef.current = bottomOutput;
            updateNodeData({
              topOutput: topOutput,
              bottomOutput: bottomOutput,
              lastRoute: "true",
            });
            console.log(
              `FlowConditional ${id}: TRUE route - top=${topOutput}, bottom=${bottomOutput}`
            );
          }
        } else {
          // FALSE signal: top=false, bottom=true
          const topOutput = false;
          const bottomOutput = true;

          if (
            topOutput !== lastTopOutputRef.current ||
            bottomOutput !== lastBottomOutputRef.current
          ) {
            lastTopOutputRef.current = topOutput;
            lastBottomOutputRef.current = bottomOutput;
            updateNodeData({
              topOutput: topOutput,
              bottomOutput: bottomOutput,
              lastRoute: "false",
            });
            console.log(
              `FlowConditional ${id}: FALSE route - top=${topOutput}, bottom=${bottomOutput}`
            );
          }
        }
      },
      [isActive, isEnabled, invertLogic, updateNodeData]
    );

    /**
     * Compute the latest boolean coming from connected input handle.
     */
    const computeBooleanInput = useCallback((): boolean | null => {
      const booleanInputEdge = findEdgeByHandle(edges, id, "booleanInput");
      if (!booleanInputEdge) {
        return null;
      }

      const src = nodes.find((n) => n.id === booleanInputEdge.source);
      if (!src?.data) {
        return null;
      }

      // -- Extract the most relevant value from the source node -----------------
      const sourceData = src.data as any;
      let inputValue: unknown;

      // Check if source is a FlowConditional with specific handle-based output
      if (
        booleanInputEdge.sourceHandle &&
        sourceData.topOutput !== undefined &&
        sourceData.bottomOutput !== undefined
      ) {
        // Handle FlowConditional output based on source handle
        if (booleanInputEdge.sourceHandle === "topOutput") {
          inputValue = sourceData.topOutput;
        } else if (booleanInputEdge.sourceHandle === "bottomOutput") {
          inputValue = sourceData.bottomOutput;
        } else {
          // Fallback to general output
          inputValue = sourceData.output;
        }
      } else {
        // Unified input reading system - prioritize handle-based output, basically single source for input data

        // 1. Handle-based output (unified system)
        if (sourceData?.output && typeof sourceData.output === "object") {
          // Try to get value from handle-based output
          const handleId = booleanInputEdge.sourceHandle
            ? normalizeHandleId(booleanInputEdge.sourceHandle)
            : "output";
          if (sourceData.output[handleId] !== undefined) {
            inputValue = sourceData.output[handleId];
          } else {
            // Fallback: get first available output value
            const firstOutput = Object.values(sourceData.output)[0];
            if (firstOutput !== undefined) {
              inputValue = firstOutput;
            }
          }
        }

        // 2. Legacy value fallbacks for compatibility
        if (inputValue === undefined) {
          if (
            sourceData?.booleanValue !== undefined &&
            sourceData.booleanValue !== null
          ) {
            inputValue = sourceData.booleanValue;
          } else if (
            sourceData?.store !== undefined &&
            sourceData.store !== null
          ) {
            inputValue = sourceData.store;
          } else if (
            sourceData?.value !== undefined &&
            sourceData.value !== null
          ) {
            inputValue = sourceData.value;
          } else if (sourceData?.isActive !== undefined) {
            inputValue = sourceData.isActive;
          } else if (sourceData?.isEnabled !== undefined) {
            inputValue = sourceData.isEnabled;
          } else {
            // Final fallback: treat the whole data object as the value
            inputValue = sourceData;
          }
        }
      }

      // -- Robust boolean conversion (mirrors ViewBoolean logic) ---------------
      if (inputValue === null || inputValue === undefined) return null;
      if (typeof inputValue === "boolean") return inputValue;

      if (typeof inputValue === "string") {
        const lower = inputValue.toLowerCase().trim();
        if (lower === "true" || lower === "1") return true;
        if (lower === "false" || lower === "0") return false;
        if (lower === "") return null;
      }

      if (typeof inputValue === "number") {
        return inputValue !== 0;
      }

      // For non-primitive values we can't reliably coerce – treat as null
      return null;
    }, [edges, nodes, id]);

    // -------------------------------------------------------------------------
    // 4.5  Effects - Simplified and consolidated
    // -------------------------------------------------------------------------

    /* 🔄 Update boolean input when edges change */
    useEffect(() => {
      const booleanInputVal = computeBooleanInput();
      if (booleanInputVal !== (nodeData as FlowConditionalData).booleanInput) {
        updateNodeData({ booleanInput: booleanInputVal });
      }
    }, [computeBooleanInput, nodeData, updateNodeData]);

    /* 🔄 Update isActive based on input presence */
    useEffect(() => {
      const hasInput = (nodeData as FlowConditionalData).booleanInput !== null;
      const shouldBeActive = isEnabled && hasInput;

      if (isActive !== shouldBeActive) {
        updateNodeData({ isActive: shouldBeActive });
      }
    }, [
      (nodeData as FlowConditionalData).booleanInput,
      isEnabled,
      isActive,
      updateNodeData,
    ]);

    /* 🔄 Auto-enable when input is present; never auto-disable when input is removed */
    useEffect(() => {
      const hasInput = (nodeData as FlowConditionalData).booleanInput !== null;
      if (hasInput && !isEnabled) {
        updateNodeData({ isEnabled: true });
      }
      // Do not auto-disable when input is removed; keep manual control
    }, [
      (nodeData as FlowConditionalData).booleanInput,
      isEnabled,
      updateNodeData,
    ]);

    /* 🔄 Main routing effect - handles all data routing */
    useEffect(() => {
      const inputSignal = (nodeData as FlowConditionalData).booleanInput;
      routeData(inputSignal);
    }, [nodeData, isActive, isEnabled, routeData]);

    /* 🔄 Smart output field with robust error handling */
    useEffect(() => {
      try {
        // Generate Map-based output with error handling
        const outputValue = generateoutputField(spec, nodeData as any);

        // Validate the result
        if (!(outputValue instanceof Map)) {
          console.error(
            `FlowConditional ${id}: generateoutputField did not return a Map`,
            outputValue
          );
          return;
        }

        // Convert Map to plain object for Convex compatibility, basically serialize for storage
        const outputObject = Object.fromEntries(outputValue.entries());

        // Only update if changed (deep comparison for Maps)
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
        console.error(`FlowConditional ${id}: Error generating output`, error, {
          spec: spec?.kind,
          nodeDataKeys: Object.keys(nodeData || {}),
        });

        // Fallback: set empty object to prevent crashes, basically empty state for storage
        if (lastGeneralOutputRef.current !== null) {
          lastGeneralOutputRef.current = new Map();
          updateNodeData({ output: {} });
        }
      }
    }, [
      spec.handles,
      nodeData.isActive,
      nodeData.isEnabled,
      nodeData.booleanInput,
      nodeData.topOutput,
      nodeData.bottomOutput,
      nodeData.lastRoute,
      updateNodeData,
      id,
    ]);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("FlowConditional", id, validation.errors, {
        originalData: validation.originalData,
        component: "FlowConditionalNode",
      });
    }

    useNodeDataValidation(
      FlowConditionalDataSchema,
      "FlowConditional",
      validation.data,
      id
    );

    // -------------------------------------------------------------------------
    // 4.7  Feature flag conditional rendering
    // -------------------------------------------------------------------------

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
        spec.size.collapsed.height === 60 ? null : (
          <LabelNode
            nodeId={id}
            label={(nodeData as FlowConditionalData).label || spec.displayName}
          />
        )}

        {isExpanded ? (
          <div
            className={`w-full h-full flex flex-col justify-between p-2 ${isEnabled ? "" : "opacity-50"}`}
            ref={nodeRef}
          >
            {/* Minimal header with collapse button */}
            <div className="flex items-center justify-end">
              <ExpandCollapseButton
                showUI={isExpanded}
                onToggle={toggleExpand}
                size="sm"
              />
            </div>

            {/* Minimal controls */}
            <div className="flex flex-col items-center justify-center flex-1 gap-2 relative">
              {/* Invert toggle */}
              <button
                onClick={() => updateNodeData({ invertLogic: !invertLogic })}
                className={`w-8 h-4 rounded-full transition-colors ${
                  invertLogic ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
                title={`Invert Logic: ${invertLogic ? "ON" : "OFF"}`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full transition-transform ${
                    invertLogic ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>

              {/* Dynamic arrow that points to active handle */}
              {lastRoute !== "none" && <div style={arrowPositioning}>→</div>}
            </div>
          </div>
        ) : (
          <div
            className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled} ${wasClicked ? "scale-95 transition-transform" : ""}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                // No toggle functionality needed
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Flow conditional node"
            ref={nodeRef}
          >
            <div className={CONTENT.route}>
              {/* Show placeholder when no connection */}
              {lastRoute === "none" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {spec.icon &&
                    renderLucideIcon(spec.icon, "text-muted-foreground", 20)}
                </div>
              )}

              {/* Advanced positioned arrow that points exactly to the active handle */}
              {lastRoute !== "none" && <div style={arrowPositioning}>→</div>}
            </div>

            {/* Expand button */}
            <ExpandCollapseButton
              showUI={!isExpanded}
              onToggle={toggleExpand}
              size="sm"
            />
          </div>
        )}
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
const FlowConditionalNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as FlowConditionalData),
    [
      (nodeData as FlowConditionalData).expandedSize,
      (nodeData as FlowConditionalData).collapsedSize,
    ]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <FlowConditionalNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default FlowConditionalNodeWithDynamicSpec;
