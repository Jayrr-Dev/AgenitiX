/**
 * TimeDelay NODE – Professional delay system with adaptive handles
 *
 * • ADAPTIVE HANDLES: Output handle type automatically matches input handle type
 * • INLINE EDITING: Direct delay configuration within the node interface
 * • PROFESSIONAL UI: Modern gradients, shadows, and responsive design
 * • SIGNAL BUFFERING: Maintains the last value during delay period
 * • TYPE PRESERVATION: Output preserves the exact type of the input
 * • VISUAL FEEDBACK: Real-time delay status and progress indicators
 * • TIMEOUT MANAGEMENT: Proper cleanup of delay timers
 * • STARTUP-LEVEL QUALITY: Enterprise-grade UI/UX and functionality
 *
 * Keywords: time-delay, adaptive-handles, professional-ui, startup-quality
 */

import type { NodeProps } from "@xyflow/react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import { useStore } from "@xyflow/react";
import { findEdgeByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
import { 
    detectDataType, 
    formatValueForDisplay, 
    getHandleCodeForType, 
    getDataTypeForValue,
    deepClone,
    formatInterval
} from "./utils";
import { ValueDisplay, StatusValueDisplay } from "./components/ValueDisplay";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const TimeDelayDataSchema = z
  .object({
    // Delay Configuration
    delayAmount: z.number().min(0).max(300000).default(1000), // 0-300 seconds in ms
    delayUnit: z.enum(["ms", "s", "min"]).default("s"),

    // Signal State
    inputValue: z.any().nullable().default(null), // Current input value
    inputType: z.string().default("any"), // Type of the input (for adaptive handles)
    outputValue: z.any().nullable().default(null), // Delayed output value
    isDelaying: z.boolean().default(false), // Currently in delay state

    // Node State
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C2"),
    label: z.string().optional(), // User-editable node label

    // Legacy fields for compatibility
    store: SafeSchemas.text(""),
    inputs: SafeSchemas.optionalText().nullable().default(null),
    output: SafeSchemas.optionalText(),
  })
  .passthrough();

export type TimeDelayData = z.infer<typeof TimeDelayDataSchema>;

const validateNodeData = createNodeValidator(
  TimeDelayDataSchema,
  "TimeDelay",
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants & Utilities - Professional TIME theming
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  TIME: {
    primary: "text-[--node-time-text]",
    secondary: "text-[--node-time-text-secondary]",
  },
} as const;

const CONTENT = {
  // Professional expanded layout with TIME theming
  expanded:
    "p-3 w-full h-full flex flex-col bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 rounded-lg border border-cyan-200 dark:border-cyan-700 shadow-sm",

  // Professional collapsed layout with TIME theming  
  collapsed:
    "flex items-center justify-center w-full h-full bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 rounded-lg border border-cyan-200 dark:border-cyan-700 shadow-sm",

  header: "flex items-center justify-between mb-2",
  body: "flex-1 flex flex-col gap-2",
  disabled: "opacity-60 grayscale transition-all duration-300",

  // Delay indicator with TIME theming
  delayIndicator: "absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse",

  // Professional configuration sections
  configSection:
    "bg-white dark:bg-slate-800 rounded-lg p-2 border border-cyan-200 dark:border-cyan-700 shadow-sm",
  configHeader:
    "text-[8px] font-semibold text-cyan-700 dark:text-cyan-300 mb-1 flex items-center gap-1",
  configGrid: "grid grid-cols-1 gap-1",

  // Professional form controls with TIME theming
  formGroup: "flex flex-col gap-1",
  formRow: "flex items-center justify-between gap-1",
  label:
    "text-[8px] font-medium text-cyan-600 dark:text-cyan-400 min-w-0 flex-shrink-0",
  input:
    "flex-1 min-w-0 px-1.5 py-0.5 text-[8px] border border-cyan-300 dark:border-cyan-600 rounded-md bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent transition-colors",
  select:
    "flex-1 min-w-0 px-1.5 py-0.5 text-[8px] border border-cyan-300 dark:border-cyan-600 rounded-md bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent transition-colors",

  // Professional status section with TIME theming
  statusSection:
    "bg-gradient-to-r from-cyan-50 to-teal-100 dark:from-cyan-800 dark:to-teal-700 rounded-lg p-2 border border-cyan-200 dark:border-cyan-700",
  statusGrid: "grid grid-cols-1 gap-1",
  statusRow: "flex items-center justify-between",
  statusLabel: "text-[8px] font-medium text-cyan-500 dark:text-cyan-400",
  statusValue: "text-[8px] font-semibold",
  statusActive: "text-emerald-600 dark:text-emerald-400",
  statusInactive: "text-red-500 dark:text-red-400",
  statusDelaying: "text-cyan-600 dark:text-cyan-400",

  // Professional collapsed view with TIME theming
  collapsedIcon: "text-lg mb-1 text-cyan-600 dark:text-cyan-400",
  collapsedTitle:
    "text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1",
  collapsedSubtitle: "text-[8px] text-slate-500 dark:text-slate-400",
  collapsedStatus: "mt-1 px-1 py-0.5 rounded-full text-[8px] font-medium",
  collapsedActive:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  collapsedInactive:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  collapsedDelaying:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
} as const;

// Type mapping for adaptive handles
const TYPE_MAPPING = {
  string: { code: "s", dataType: "String" },
  number: { code: "n", dataType: "Number" },
  boolean: { code: "b", dataType: "Boolean" },
  object: { code: "j", dataType: "JSON" },
  array: { code: "a", dataType: "Array" },
  any: { code: "x", dataType: "Any" },
} as const;

// Convert delay amount to milliseconds
const convertToMs = (amount: number, unit: string): number => {
  switch (unit) {
    case "ms": return amount;
    case "s": return amount * 1000;
    case "min": return amount * 60 * 1000;
    default: return amount;
  }
};

// Detect type of input value for adaptive handles
const detectInputType = (value: any): string => {
  if (value === null || value === undefined) return "any";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return "any";
};

// Format delay for display
const formatDelay = (amount: number, unit: string): string => {
  if (unit === "ms") return `${amount}ms`;
  if (unit === "s") return `${amount}s`;
  if (unit === "min") return `${amount}min`;
  return `${amount}${unit}`;
};

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec with adaptive handles that change based on input type.
 */
function createDynamicSpec(data: TimeDelayData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  // Get adaptive handle configuration based on input type
  const inputType = data.inputType || "any";
  const handleConfig = TYPE_MAPPING[inputType as keyof typeof TYPE_MAPPING] || TYPE_MAPPING.any;

  return {
    kind: "timeDelay",
    displayName: "Time Delay",
    label: "Time Delay",
    category: CATEGORIES.TIME,
    size: { expanded, collapsed },
    handles: [
      // Input handle - accepts any type
      {
        id: "input",
        code: "x", // Any type
        position: "left",
        type: "target",
        dataType: "Any",
      },
      // Output handle - adapts to input type
      {
        id: "output",
        code: handleConfig.code,
        position: "right",
        type: "source",
        dataType: handleConfig.dataType,
      },
    ],
    inspector: { key: "TimeDelayInspector" },
    version: 1,
    runtime: { execute: "timeDelay_execute_v1" },
    initialData: createSafeInitialData(TimeDelayDataSchema, {
      delayAmount: 2,
      delayUnit: "s",
      inputValue: null,
      inputType: "any",
      outputValue: null,
      isDelaying: false,
    }),
    dataSchema: TimeDelayDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputValue",
        "outputValue",
        "inputType",
        "isDelaying",
        "expandedSize",
        "collapsedSize",
        "store",
        "inputs",
        "output",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable Delay" },
        {
          key: "delayAmount",
          type: "number",
          label: "Delay Amount",
          ui: { step: 1 },
        },
        {
          key: "delayUnit",
          type: "select",
          label: "Time Unit",
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuRefreshCw",
    author: "Agenitix Team",
    description: "Delays signal propagation with configurable timing and adaptive handle types",
    feature: "base",
    tags: ["time", "delay", "signal", "adaptive", "primitives"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This timeDelay node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C2",
  delayAmount: 2,
  delayUnit: "s",
  inputType: "any",
} as TimeDelayData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const TimeDelayNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const {
      isExpanded,
      isEnabled,
      isActive,
      delayAmount,
      delayUnit,
      inputValue,
      inputType,
      outputValue,
      isDelaying,
    } = nodeData as TimeDelayData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // Refs for timeout management
    const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastInputRef = useRef<any>(null);

    const categoryStyles = CATEGORY_TEXT.TIME;

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

    /** Clear any existing delay timeout */
    const clearDelayTimeout = useCallback(() => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }
    }, []);

    /** Start delay timer and propagate value after delay */
    const startDelay = useCallback((value: any) => {
      // Clear any existing timeout
      clearDelayTimeout();

      // Set delaying state
      updateNodeData({
        isDelaying: true,
        inputValue: value,
      });

      // Calculate delay in milliseconds
      const delayMs = convertToMs(delayAmount, delayUnit);

      // Start new timeout
      delayTimeoutRef.current = setTimeout(() => {
        updateNodeData({
          outputValue: value,
          output: value, // ✅ This propagates to connected nodes
          isDelaying: false,
          isActive: true,
        });
        delayTimeoutRef.current = null;
      }, delayMs);
    }, [delayAmount, delayUnit, clearDelayTimeout, updateNodeData]);

    /**
     * Compute the latest value coming from connected input handle.
     */
    const computeInput = useCallback((): any => {
      const inputEdge = findEdgeByHandle(edges, id, "input");
      if (!inputEdge) return null;

      const src = nodes.find((n) => n.id === inputEdge.source);
      if (!src) return null;

      // Get the actual value from source node
      const value = src.data?.outputValue ?? src.data?.output ?? src.data?.store ?? src.data;
      return value;
    }, [edges, nodes, id]);

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Monitor input changes and trigger delay */
    useEffect(() => {
      if (!isEnabled) return;

      const currentInput = computeInput();

      // Only trigger delay if input actually changed
      if (currentInput !== lastInputRef.current) {
        lastInputRef.current = currentInput;

        if (currentInput !== null && currentInput !== undefined) {
          // Detect input type for adaptive handles
          const detectedType = detectInputType(currentInput);

          // Update input type if it changed
          if (detectedType !== inputType) {
            updateNodeData({ inputType: detectedType });
          }

          // Start delay process
          startDelay(currentInput);
        } else {
          // No input - clear everything
          clearDelayTimeout();
          updateNodeData({
            inputValue: null,
            outputValue: null,
            output: null, // ✅ Clear propagation too
            isDelaying: false,
            isActive: false,
            inputType: "any",
          });
        }
      }
    }, [computeInput, isEnabled, inputType, startDelay, clearDelayTimeout, updateNodeData]);

    /* 🔄 Update active state based on output */
    useEffect(() => {
      const hasOutput = outputValue !== null && outputValue !== undefined;
      if (isActive !== hasOutput) {
        updateNodeData({ isActive: hasOutput });
      }
    }, [outputValue, isActive, updateNodeData]);

    /* 🔄 Cleanup timeout on unmount or disable */
    useEffect(() => {
      if (!isEnabled) {
        clearDelayTimeout();
        updateNodeData({
          isDelaying: false,
          outputValue: null,
          output: null, // ✅ Clear propagation too
          isActive: false,
        });
      }

      return () => {
        clearDelayTimeout();
      };
    }, [isEnabled, clearDelayTimeout, updateNodeData]);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("TimeDelay", id, validation.errors, {
        originalData: validation.originalData,
        component: "TimeDelayNode",
      });
    }

    useNodeDataValidation(
      TimeDelayDataSchema,
      "TimeDelay",
      validation.data,
      id,
    );

    // -------------------------------------------------------------------------
    // 4.7  Feature flag conditional rendering
    // -------------------------------------------------------------------------

    // If flag is loading, show loading state
    if (flagState.isLoading) {
      return (
        <div className={`${CONTENT.collapsed} animate-pulse`}>
          <div className="flex flex-col items-center justify-center w-full h-full p-2">
            <div className={`${CONTENT.collapsedIcon} opacity-50`}>
              {spec.icon && renderLucideIcon(spec.icon, "", 18)}
            </div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Loading...
            </div>
          </div>
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
    // 4.8  Computed display values
    // -------------------------------------------------------------------------
    const delayMs = convertToMs(delayAmount, delayUnit);
    const displayValue = inputValue !== null ? String(inputValue) : "";
    const typeDisplay = inputType.charAt(0).toUpperCase() + inputType.slice(1);

    // -------------------------------------------------------------------------
    // 4.9  Professional Render - Startup Quality
    // -------------------------------------------------------------------------
    return (
      <>
        {/* Delay indicator when actively delaying */}
        {isDelaying && <div className={CONTENT.delayIndicator} />}

        {/* Editable label or icon */}
        {!isExpanded &&
          spec.size.collapsed.width === 60 &&
          spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-0 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode nodeId={id} label={(nodeData as TimeDelayData).label || spec.displayName} />
        )}

        {!isExpanded ? (
          // ===== COLLAPSED VIEW - Professional & Compact =====
          <div className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className="flex flex-col items-center justify-center w-full h-full p-2">
              {/* Icon */}
              <div className={CONTENT.collapsedIcon}>
                {spec.icon && renderLucideIcon(spec.icon, "", 18)}
              </div>

              {/* Delay Display */}
              <div className={CONTENT.collapsedTitle}>
                {formatDelay(delayAmount, delayUnit)}
              </div>

              {/* Type Display */}
              <div className={CONTENT.collapsedSubtitle}>
                {typeDisplay}
              </div>

              {/* Status Badge */}
              <div
                className={`${CONTENT.collapsedStatus} ${isDelaying
                  ? CONTENT.collapsedDelaying
                  : isEnabled
                    ? CONTENT.collapsedActive
                    : CONTENT.collapsedInactive
                  }`}
              >
                {isDelaying ? "Delaying" : isEnabled ? "Ready" : "Disabled"}
              </div>
            </div>
          </div>
        ) : (
          // ===== EXPANDED VIEW - Professional Interface =====
          <div className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className={CONTENT.body}>
              {/* Delay Configuration Section */}
              <div className={CONTENT.configSection}>
                <div className={CONTENT.configHeader}>
                  {renderLucideIcon("LuClock", "text-cyan-500", 10)}
                  Delay Configuration
                </div>
                <div className={CONTENT.configGrid}>
                  {/* Delay Amount */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Amount:</label>
                      <input
                        type="number"
                        className={CONTENT.input}
                        value={delayAmount}
                        min={1}
                        max={300}
                        step={1}
                        onChange={(e) =>
                          updateNodeData({
                            delayAmount: Number.parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Delay Unit */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Unit:</label>
                      <select
                        className={CONTENT.select}
                        value={delayUnit}
                        onChange={(e) =>
                          updateNodeData({
                            delayUnit: e.target.value as any,
                          })
                        }
                      >
                        <option value="ms">Milliseconds</option>
                        <option value="s">Seconds</option>
                        <option value="min">Minutes</option>
                      </select>
                    </div>
                  </div>

                  {/* Total Delay Display */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Total:</label>
                      <div className="text-[8px] font-mono text-cyan-600 dark:text-cyan-400">
                        {delayMs}ms
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signal Status Section */}
              <div className={CONTENT.statusSection}>
                <div className={CONTENT.statusGrid}>
                  <div className={CONTENT.statusRow}>
                    <span className={CONTENT.statusLabel}>Type:</span>
                    <span className={`${CONTENT.statusValue} font-mono`}>
                      {typeDisplay}
                    </span>
                  </div>

                  <div className={CONTENT.statusRow}>
                    <span className={CONTENT.statusLabel}>Input:</span>
                    <span className={`${CONTENT.statusValue} font-mono text-blue-600 dark:text-blue-400`}>
                      {displayValue || "None"}
                    </span>
                  </div>

                  <div className={CONTENT.statusRow}>
                    <span className={CONTENT.statusLabel}>Status:</span>
                    <span
                      className={`${CONTENT.statusValue} ${isDelaying
                        ? CONTENT.statusDelaying
                        : isActive
                          ? CONTENT.statusActive
                          : CONTENT.statusInactive
                        }`}
                    >
                      {isDelaying ? "Delaying" : isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Output Preview */}
              {outputValue !== null && (
                <div className={CONTENT.configSection}>
                  <div className={CONTENT.configHeader}>
                    {renderLucideIcon("LuArrowRight", "text-emerald-500", 10)}
                    Output
                  </div>
                  <div className="text-[8px] font-mono text-emerald-600 dark:text-emerald-400 p-1 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                    {String(outputValue)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expand/Collapse Button - Always visible */}
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
const TimeDelayNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec when size keys OR input type changes (for adaptive handles)
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as TimeDelayData),
    [
      (nodeData as TimeDelayData).expandedSize,
      (nodeData as TimeDelayData).collapsedSize,
      (nodeData as TimeDelayData).inputType, // Adaptive handles dependency
    ],
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <TimeDelayNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec],
  );

  return <ScaffoldedNode {...props} />;
};

export default TimeDelayNodeWithDynamicSpec;
