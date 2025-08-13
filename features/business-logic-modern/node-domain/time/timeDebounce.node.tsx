/**
 * TimeDebounce NODE – Professional debouncing with silence detection
 *
 * • DEBOUNCE LOGIC: Only executes after X time of silence (no new signals)
 * • ANTI-SPAM: Prevents multiple rapid triggers, waits for quiet period
 * • INLINE CONTROLS: Configure debounce time directly in the node
 * • PROFESSIONAL UI: Real-time debounce status and countdown
 * • ADAPTIVE HANDLES: Preserves input signal type in output
 * • SILENCE DETECTION: Visual feedback during waiting period
 * • STARTUP-LEVEL QUALITY: Enterprise-grade debouncing functionality
 *
 * Keywords: time-debounce, anti-spam, silence-detection, professional-ui
 */

import type { NodeProps } from "@xyflow/react";
import React, {
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

export const TimeDebounceDataSchema = z
  .object({
    // Debounce Configuration
    debounceAmount: z.number().min(1).max(30000).default(500), // 1ms-30s
    debounceUnit: z.enum(["ms", "string"]).default("ms"),

    // Debounce State
    lastInputTime: z.number().nullable().default(null),
    executeTime: z.number().nullable().default(null),
    triggerCount: z.number().default(0),
    executedCount: z.number().default(0),

    // Signal State
    inputValue: z.any().nullable().default(null),
    inputType: z.string().default("any"),
    outputValue: z.any().nullable().default(null),
    isWaiting: z.boolean().default(false),

    // Node State
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C2"),
    label: z.string().optional(),

    // Legacy fields for compatibility
    store: SafeSchemas.text(""),
    inputs: SafeSchemas.optionalText().nullable().default(null),
    output: SafeSchemas.optionalText(),
  })
  .passthrough();

export type TimeDebounceData = z.infer<typeof TimeDebounceDataSchema>;

const validateNodeData = createNodeValidator(
  TimeDebounceDataSchema,
  "TimeDebounce",
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

  // Waiting indicator with TIME theming
  waitingIndicator: "absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse",

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
  statusExecuted: "text-emerald-600 dark:text-emerald-400",
  statusTriggered: "text-blue-500 dark:text-blue-400",
  statusWaiting: "text-yellow-600 dark:text-yellow-400",

  // Professional collapsed view with TIME theming
  collapsedIcon: "text-lg mb-1 text-cyan-600 dark:text-cyan-400",
  collapsedTitle:
    "text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1",
  collapsedSubtitle: "text-[8px] text-slate-500 dark:text-slate-400",
  collapsedStatus: "mt-1 px-1 py-0.5 rounded-full text-[8px] font-medium",
  collapsedActive:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  collapsedWaiting:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  collapsedInactive:
    "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
} as const;

// Type mapping for adaptive handles
const TYPE_MAPPING = {
  string: { code: "string", dataType: "string" },
  number: { code: "number", dataType: "number" },
  boolean: { code: "boolean", dataType: "boolean" },
  object: { code: "json", dataType: "JSON" },
  array: { code: "array", dataType: "array" },
  any: { code: "any", dataType: "any" },
} as const;

// Convert debounce amount to milliseconds
const convertToMs = (amount: number, unit: string): number => {
  switch (unit) {
    case "ms": return amount;
    case "string": return amount * 1000;
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

// Format debounce for display
const formatDebounce = (amount: number, unit: string): string => {
  if (unit === "ms") return `${amount}ms`;
  if (unit === "string") return `${amount}s`;
  return `${amount}${unit}`;
};

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec with adaptive handles that change based on input type.
 */
function createDynamicSpec(data: TimeDebounceData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  // Determine output handle type based on current input value
  let outputCode = "any"; // Default to any
  let outputDataType = "any";

  if (data.inputValue !== null && data.inputValue !== undefined) {
    const detectedType = detectDataType(data.inputValue);
    outputCode = getHandleCodeForType(detectedType);
    outputDataType = getDataTypeForValue(data.inputValue);
  }

  return {
    kind: "timeDebounce",
    displayName: "Time Debounce",
    label: "Time Debounce",
    category: CATEGORIES.TIME,
    size: { expanded, collapsed },
    handles: [
      // Input handle - accepts any type
      {
        id: "input",
        code: "any", // Any type
        position: "left",
        type: "target",
        dataType: "any",
      },
      // Output handle - adapts to input type
      {
        id: "output",
        code: outputCode,
        position: "right",
        type: "source",
        dataType: outputDataType,
      },
    ],
    inspector: { key: "TimeDebounceInspector" },
    version: 1,
    runtime: { execute: "timeDebounce_execute_v1" },
    initialData: createSafeInitialData(TimeDebounceDataSchema, {
      debounceAmount: 500,
      debounceUnit: "ms",
      inputValue: null,
      inputType: "any",
      outputValue: null,
      isWaiting: false,
    }),
    dataSchema: TimeDebounceDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputValue",
        "outputValue",
        "inputType",
        "isWaiting",
        "lastInputTime",
        "executeTime",
        "triggerCount",
        "executedCount",
        "expandedSize",
        "collapsedSize",
        "store",
        "inputs",
        "output",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable Debounce" },
        {
          key: "debounceAmount",
          type: "number",
          label: "Debounce Amount",
          ui: { step: 1 },
        },
        {
          key: "debounceUnit",
          type: "select",
          label: "Time Unit",
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuPause",
    author: "Agenitix Team",
    description: "Debounces signals by waiting for silence period with adaptive handle types",
    feature: "base",
    tags: ["time", "debounce", "anti-spam", "silence", "adaptive"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This timeDebounce node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C2",
  debounceAmount: 500,
  debounceUnit: "ms",
  inputType: "any",
} as TimeDebounceData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – debounce logic & rendering
// -----------------------------------------------------------------------------

const TimeDebounceNode = memo(
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
      debounceAmount,
      debounceUnit,
      inputValue,
      inputType,
      outputValue,
      isWaiting,
      lastInputTime,
      executeTime,
      triggerCount,
      executedCount,
    } = nodeData as TimeDebounceData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // Refs for debounce management
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastInputRef = useRef<any>(null);

    // Local state for input to prevent focus loss (if needed for custom values)
    const [localInputValue, setLocalInputValue] = useState("");
    
    // Ref to track if we're currently editing
    const isEditingRef = useRef(false);

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

    /** Clear debounce timeout */
    const clearDebounceTimeout = useCallback(() => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    }, []);

    /** Execute debounced signal */
    const executeDebounce = useCallback((value: any) => {
      const detectedType = detectInputType(value);
      const now = Date.now();

      updateNodeData({
        outputValue: value,
        output: value, // Propagate to connected nodes
        inputType: detectedType,
        executeTime: now,
        executedCount: executedCount + 1,
        isActive: true,
        isWaiting: false,
      });
    }, [executedCount, updateNodeData]);

    /** Start debounce timer */
    const startDebounce = useCallback((value: any) => {
      if (!isEnabled) return;

      const now = Date.now();
      const debounceMs = convertToMs(debounceAmount, debounceUnit);

      // Clear any existing timeout
      clearDebounceTimeout();

      // Update state to show we're waiting
      updateNodeData({
        inputValue: value,
        lastInputTime: now,
        triggerCount: triggerCount + 1,
        isWaiting: true,
      });

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        executeDebounce(value);
        debounceTimeoutRef.current = null;
      }, debounceMs);

    }, [isEnabled, debounceAmount, debounceUnit, triggerCount, clearDebounceTimeout, updateNodeData, executeDebounce]);

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

    /* 🔄 Monitor input changes and apply debounce */
    useEffect(() => {
      if (!isEnabled) return;

      const currentInput = computeInput();

      // Only process if input actually changed
      if (currentInput !== lastInputRef.current) {
        lastInputRef.current = currentInput;

        if (currentInput !== null && currentInput !== undefined) {
          startDebounce(currentInput);
        } else {
          // No input - clear everything
          clearDebounceTimeout();
          updateNodeData({
            inputValue: null,
            outputValue: null,
            output: null,
            isWaiting: false,
            isActive: false,
            inputType: "any",
          });
        }
      }
    }, [computeInput, isEnabled, startDebounce, clearDebounceTimeout, updateNodeData]);

    /* 🔄 Stop debounce when disabled */
    useEffect(() => {
      if (!isEnabled) {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = null;
        }
        updateNodeData({
          isWaiting: false,
          outputValue: null,
          output: null,
          isActive: false,
        });
      }
    }, [isEnabled, updateNodeData]);

    /* 🔄 Cleanup timeout on unmount only */
    useEffect(() => {
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = null;
        }
      };
    }, []); // Empty dependency array - only runs on mount/unmount

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("TimeDebounce", id, validation.errors, {
        originalData: validation.originalData,
        component: "TimeDebounceNode",
      });
    }

    useNodeDataValidation(
      TimeDebounceDataSchema,
      "TimeDebounce",
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
    const debounceMs = convertToMs(debounceAmount, debounceUnit);
    const displayValue = inputValue !== null ? String(inputValue) : "";
    const typeDisplay = inputType.charAt(0).toUpperCase() + inputType.slice(1);
    const timeUntilExecute = executeTime ? Math.max(0, executeTime + debounceMs - Date.now()) : 0;

    // -------------------------------------------------------------------------
    // 4.9  Professional Render - Startup Quality
    // -------------------------------------------------------------------------
    return (
      <>
        {/* Waiting indicator when actively waiting */}
        {isWaiting && <div className={CONTENT.waitingIndicator} />}

        {/* Editable label or icon */}
        {!isExpanded &&
          spec.size.collapsed.width === 60 &&
          spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-0 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode nodeId={id} label={(nodeData as TimeDebounceData).label || spec.displayName} />
        )}

        {!isExpanded ? (
          // ===== COLLAPSED VIEW - Professional & Compact =====
          <div className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className="flex flex-col items-center justify-center w-full h-full p-2">
              {/* Icon */}
              <div className={CONTENT.collapsedIcon}>
                {spec.icon && renderLucideIcon(spec.icon, "", 18)}
              </div>

              {/* Debounce Display */}
              <div className={CONTENT.collapsedTitle}>
                {formatDebounce(debounceAmount, debounceUnit)}
              </div>

              {/* Type Display */}
              <div className={CONTENT.collapsedSubtitle}>
                {typeDisplay}
              </div>

              {/* Status Badge */}
              <div
                className={`${CONTENT.collapsedStatus} ${isWaiting
                  ? CONTENT.collapsedWaiting
                  : isActive
                    ? CONTENT.collapsedActive
                    : CONTENT.collapsedInactive
                  }`}
              >
                {isWaiting ? "Waiting" : isActive ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        ) : (
          // ===== EXPANDED VIEW - Professional Interface =====
          <div className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className={CONTENT.body}>
              {/* Debounce Configuration Section */}
              <div className={CONTENT.configSection}>
                <div className={CONTENT.configHeader}>
                  {renderLucideIcon("LuPause", "text-cyan-500", 10)}
                  Debounce Configuration
                </div>
                <div className={CONTENT.configGrid}>
                  {/* Debounce Amount */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Wait:</label>
                      <input
                        type="number"
                        className={CONTENT.input}
                        value={debounceAmount}
                        min={1}
                        max={30000}
                        step={1}
                        onChange={(e) =>
                          updateNodeData({
                            debounceAmount: Number.parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Debounce Unit */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Unit:</label>
                      <select
                        className={CONTENT.select}
                        value={debounceUnit}
                        onChange={(e) =>
                          updateNodeData({
                            debounceUnit: e.target.value as any,
                          })
                        }
                      >
                        <option value="ms">Milliseconds</option>
                        <option value="string">Seconds</option>
                      </select>
                    </div>
                  </div>

                  {/* Total Debounce Display */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Total:</label>
                      <div className="text-[8px] font-mono text-cyan-600 dark:text-cyan-400">
                        {debounceMs}ms
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
                    <span className={CONTENT.statusLabel}>Triggered:</span>
                    <span className={`${CONTENT.statusValue} ${CONTENT.statusTriggered}`}>
                      {triggerCount}
                    </span>
                  </div>

                  <div className={CONTENT.statusRow}>
                    <span className={CONTENT.statusLabel}>Executed:</span>
                    <span className={`${CONTENT.statusValue} ${CONTENT.statusExecuted}`}>
                      {executedCount}
                    </span>
                  </div>

                  {isWaiting && (
                    <div className={CONTENT.statusRow}>
                      <span className={CONTENT.statusLabel}>Status:</span>
                      <span className={`${CONTENT.statusValue} ${CONTENT.statusWaiting}`}>
                        Waiting for silence...
                      </span>
                    </div>
                  )}
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

TimeDebounceNode.displayName = "TimeDebounceNode";

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

/**
 * Memoized scaffolded component to prevent focus loss.
 */
const TimeDebounceNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec when size keys OR input type changes (for adaptive handles)
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as TimeDebounceData),
    [
      (nodeData as TimeDebounceData).expandedSize,
      (nodeData as TimeDebounceData).collapsedSize,
      (nodeData as TimeDebounceData).inputType, // Adaptive handles dependency
    ],
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <TimeDebounceNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec],
  );

  return <ScaffoldedNode {...props} />;
};

export default TimeDebounceNodeWithDynamicSpec;