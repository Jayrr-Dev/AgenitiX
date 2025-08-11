/**
 * TimeThrottle NODE – Professional rate limiting with signal throttling
 *
 * • RATE LIMITING: Limits signal frequency to prevent spam/overload
 * • INLINE CONTROLS: Configure throttle rate directly in the node
 * • SIGNAL BLOCKING: Shows blocked vs passed signals count
 * • PROFESSIONAL UI: Real-time throttle status and next allowed time
 * • ADAPTIVE HANDLES: Preserves input signal type in output
 * • QUEUE MANAGEMENT: Optional queuing of throttled signals
 * • STARTUP-LEVEL QUALITY: Enterprise-grade rate limiting functionality
 *
 * Keywords: time-throttle, rate-limiting, signal-control, professional-ui
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

export const TimeThrottleDataSchema = z
  .object({
    // Throttle Configuration
    throttleAmount: z.number().min(1).max(60000).default(1000), // 1ms-60s
    throttleUnit: z.enum(["ms", "s"]).default("ms"),

    // Throttle State
    lastPassedTime: z.number().nullable().default(null),
    nextAllowedTime: z.number().nullable().default(null),
    passedCount: z.number().default(0),
    blockedCount: z.number().default(0),

    // Signal State
    inputValue: z.any().nullable().default(null),
    inputType: z.string().default("any"),
    outputValue: z.any().nullable().default(null),
    isThrottling: z.boolean().default(false),

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

export type TimeThrottleData = z.infer<typeof TimeThrottleDataSchema>;

const validateNodeData = createNodeValidator(
  TimeThrottleDataSchema,
  "TimeThrottle",
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

  // Throttling indicator with TIME theming
  throttlingIndicator: "absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse",

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
  statusPassed: "text-emerald-600 dark:text-emerald-400",
  statusBlocked: "text-red-500 dark:text-red-400",
  statusThrottling: "text-orange-600 dark:text-orange-400",

  // Professional collapsed view with TIME theming
  collapsedIcon: "text-lg mb-1 text-cyan-600 dark:text-cyan-400",
  collapsedTitle:
    "text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1",
  collapsedSubtitle: "text-[8px] text-slate-500 dark:text-slate-400",
  collapsedStatus: "mt-1 px-1 py-0.5 rounded-full text-[8px] font-medium",
  collapsedActive:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  collapsedThrottling:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  collapsedInactive:
    "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
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

// Convert throttle amount to milliseconds
const convertToMs = (amount: number, unit: string): number => {
  switch (unit) {
    case "ms": return amount;
    case "s": return amount * 1000;
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

// Format throttle for display
const formatThrottle = (amount: number, unit: string): string => {
  if (unit === "ms") return `${amount}ms`;
  if (unit === "s") return `${amount}s`;
  return `${amount}${unit}`;
};

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec with adaptive handles that change based on input type.
 */
function createDynamicSpec(data: TimeThrottleData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  // Determine output handle type based on current input value
  let outputCode = "x"; // Default to any
  let outputDataType = "Any";

  if (data.inputValue !== null && data.inputValue !== undefined) {
    const detectedType = detectDataType(data.inputValue);
    outputCode = getHandleCodeForType(detectedType);
    outputDataType = getDataTypeForValue(data.inputValue);
  }

  return {
    kind: "timeThrottle",
    displayName: "Time Throttle",
    label: "Time Throttle",
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
        code: outputCode,
        position: "right",
        type: "source",
        dataType: outputDataType,
      },
    ],
    inspector: { key: "TimeThrottleInspector" },
    version: 1,
    runtime: { execute: "timeThrottle_execute_v1" },
    initialData: createSafeInitialData(TimeThrottleDataSchema, {
      throttleAmount: 1000,
      throttleUnit: "ms",
      inputValue: null,
      inputType: "any",
      outputValue: null,
      isThrottling: false,
    }),
    dataSchema: TimeThrottleDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputValue",
        "outputValue",
        "inputType",
        "isThrottling",
        "lastPassedTime",
        "nextAllowedTime",
        "passedCount",
        "blockedCount",
        "expandedSize",
        "collapsedSize",
        "store",
        "inputs",
        "output",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable Throttle" },
        {
          key: "throttleAmount",
          type: "number",
          label: "Throttle Amount",
          ui: { step: 1 },
        },
        {
          key: "throttleUnit",
          type: "select",
          label: "Time Unit",
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuShield",
    author: "Agenitix Team",
    description: "Rate limits signal frequency with configurable throttling and adaptive handle types",
    feature: "base",
    tags: ["time", "throttle", "rate-limit", "control", "adaptive"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This timeThrottle node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C2",
  throttleAmount: 1000,
  throttleUnit: "ms",
  inputType: "any",
} as TimeThrottleData);
// -----------------------------------------------------------------------------
// 4️⃣  React component – throttle logic & rendering
// -----------------------------------------------------------------------------

const TimeThrottleNode = memo(
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
      throttleAmount,
      throttleUnit,
      inputValue,
      inputType,
      outputValue,
      isThrottling,
      lastPassedTime,
      nextAllowedTime,
      passedCount,
      blockedCount,
    } = nodeData as TimeThrottleData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // Refs for throttle management
    const lastInputRef = useRef<any>(null);
    const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Local state for custom values to prevent focus loss
    const [localCustomValue, setLocalCustomValue] = useState("");
    
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

    /** Clear throttle timeout */
    const clearThrottleTimeout = useCallback(() => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
      }
    }, []);

    /** Process signal through throttle */
    const processSignal = useCallback((value: any) => {
      if (!isEnabled) return;

      const now = Date.now();
      const throttleMs = convertToMs(throttleAmount, throttleUnit);

      // Check if we can pass the signal
      if (!lastPassedTime || (now - lastPassedTime) >= throttleMs) {
        // Pass the signal - deep clone to prevent mutation
        const clonedValue = deepClone(value);
        const detectedType = detectDataType(value);

        updateNodeData({
          inputValue: clonedValue,
          outputValue: clonedValue,
          output: clonedValue, // Propagate to connected nodes
          store: String(clonedValue), // For compatibility
          inputType: getDataTypeForValue(value),
          lastPassedTime: now,
          nextAllowedTime: now + throttleMs,
          passedCount: passedCount + 1,
          isActive: true,
          isThrottling: false,
        });

        // Set up next allowed time indicator
        clearThrottleTimeout();
        throttleTimeoutRef.current = setTimeout(() => {
          updateNodeData({ isThrottling: false });
        }, throttleMs);

      } else {
        // Block the signal
        updateNodeData({
          inputValue: deepClone(value),
          blockedCount: blockedCount + 1,
          isThrottling: true,
        });
      }
    }, [isEnabled, throttleAmount, throttleUnit, lastPassedTime, passedCount, blockedCount, updateNodeData, clearThrottleTimeout]);

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

    /* 🔄 Monitor input changes and apply throttle */
    useEffect(() => {
      if (!isEnabled) return;

      const currentInput = computeInput();

      // Only process if input actually changed
      if (currentInput !== lastInputRef.current) {
        lastInputRef.current = currentInput;

        if (currentInput !== null && currentInput !== undefined) {
          processSignal(currentInput);
        } else {
          // No input - clear everything
          clearThrottleTimeout();
          updateNodeData({
            inputValue: null,
            outputValue: null,
            output: null,
            isThrottling: false,
            isActive: false,
            inputType: "any",
          });
        }
      }
    }, [computeInput, isEnabled, processSignal, clearThrottleTimeout, updateNodeData]);

    /* 🔄 Stop throttle when disabled */
    useEffect(() => {
      if (!isEnabled) {
        if (throttleTimeoutRef.current) {
          clearTimeout(throttleTimeoutRef.current);
          throttleTimeoutRef.current = null;
        }
        updateNodeData({
          isThrottling: false,
          outputValue: null,
          output: null,
          isActive: false,
        });
      }
    }, [isEnabled, updateNodeData]);

    /* 🔄 Cleanup timeout on unmount only */
    useEffect(() => {
      return () => {
        if (throttleTimeoutRef.current) {
          clearTimeout(throttleTimeoutRef.current);
          throttleTimeoutRef.current = null;
        }
      };
    }, []); // Empty dependency array - only runs on mount/unmount

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("TimeThrottle", id, validation.errors, {
        originalData: validation.originalData,
        component: "TimeThrottleNode",
      });
    }

    useNodeDataValidation(
      TimeThrottleDataSchema,
      "TimeThrottle",
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
    const throttleMs = convertToMs(throttleAmount, throttleUnit);
    const displayValue = inputValue !== null ? String(inputValue) : "";
    const typeDisplay = inputType.charAt(0).toUpperCase() + inputType.slice(1);
    const timeUntilNext = nextAllowedTime ? Math.max(0, nextAllowedTime - Date.now()) : 0;

    // -------------------------------------------------------------------------
    // 4.9  Professional Render - Startup Quality
    // -------------------------------------------------------------------------
    return (
      <>
        {/* Throttling indicator when actively throttling */}
        {isThrottling && <div className={CONTENT.throttlingIndicator} />}

        {/* Editable label or icon */}
        {!isExpanded &&
          spec.size.collapsed.width === 60 &&
          spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-0 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode nodeId={id} label={(nodeData as TimeThrottleData).label || spec.displayName} />
        )}

        {!isExpanded ? (
          // ===== COLLAPSED VIEW - Professional & Compact =====
          <div className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className="flex flex-col items-center justify-center w-full h-full p-2">
              {/* Icon */}
              <div className={CONTENT.collapsedIcon}>
                {spec.icon && renderLucideIcon(spec.icon, "", 18)}
              </div>

              {/* Throttle Display */}
              <div className={CONTENT.collapsedTitle}>
                {formatThrottle(throttleAmount, throttleUnit)}
              </div>

              {/* Current Value Display */}
              {outputValue !== null && outputValue !== undefined && (
                <div className="text-[7px] font-mono text-cyan-600 dark:text-cyan-400 mt-1 max-w-full truncate">
                  {formatValueForDisplay(outputValue, 15)}
                </div>
              )}

              {/* Stats Display */}
              <div className={CONTENT.collapsedSubtitle}>
                {passedCount}↗ {blockedCount}↘
              </div>

              {/* Status Badge */}
              <div
                className={`${CONTENT.collapsedStatus} ${isThrottling
                  ? CONTENT.collapsedThrottling
                  : isActive
                    ? CONTENT.collapsedActive
                    : CONTENT.collapsedInactive
                  }`}
              >
                {isThrottling ? "Throttling" : isActive ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        ) : (
          // ===== EXPANDED VIEW - Professional Interface =====
          <div className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className={CONTENT.body}>
              {/* Throttle Configuration Section */}
              <div className={CONTENT.configSection}>
                <div className={CONTENT.configHeader}>
                  {renderLucideIcon("LuShield", "text-cyan-500", 10)}
                  Throttle Configuration
                </div>
                <div className={CONTENT.configGrid}>
                  {/* Throttle Amount */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Limit:</label>
                      <input
                        type="number"
                        className={CONTENT.input}
                        value={throttleAmount}
                        min={1}
                        max={60000}
                        step={1}
                        onChange={(e) =>
                          updateNodeData({
                            throttleAmount: Number.parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Throttle Unit */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Unit:</label>
                      <select
                        className={CONTENT.select}
                        value={throttleUnit}
                        onChange={(e) =>
                          updateNodeData({
                            throttleUnit: e.target.value as any,
                          })
                        }
                      >
                        <option value="ms">Milliseconds</option>
                        <option value="s">Seconds</option>
                      </select>
                    </div>
                  </div>

                  {/* Total Throttle Display */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Total:</label>
                      <div className="text-[8px] font-mono text-cyan-600 dark:text-cyan-400">
                        {throttleMs}ms
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signal Status Section */}
              <div className={CONTENT.statusSection}>
                <div className="flex flex-col gap-1">
                  <StatusValueDisplay
                    label="Status"
                    value={isThrottling ? "Throttling" : isActive ? "Active" : "Inactive"}
                    status={isThrottling ? "warning" : isActive ? "success" : "info"}
                  />

                  <StatusValueDisplay
                    label="Passed"
                    value={passedCount}
                    status="success"
                  />

                  <StatusValueDisplay
                    label="Blocked"
                    value={blockedCount}
                    status="error"
                  />

                  {isThrottling && timeUntilNext > 0 && (
                    <StatusValueDisplay
                      label="Next in"
                      value={`${Math.ceil(timeUntilNext / 1000)}s`}
                      status="warning"
                    />
                  )}
                </div>
              </div>

              {/* Current Input Display */}
              {inputValue !== null && inputValue !== undefined && (
                <div className={CONTENT.configSection}>
                  <div className={CONTENT.configHeader}>
                    {renderLucideIcon("LuArrowDown", "text-blue-500", 10)}
                    Current Input
                  </div>
                  <ValueDisplay
                    value={inputValue}
                    showType={true}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Current Output Display */}
              {outputValue !== null && outputValue !== undefined && (
                <div className={CONTENT.configSection}>
                  <div className={CONTENT.configHeader}>
                    {renderLucideIcon("LuArrowRight", "text-emerald-500", 10)}
                    Current Output
                  </div>
                  <ValueDisplay
                    value={outputValue}
                    showType={true}
                    className="mt-1"
                  />
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

TimeThrottleNode.displayName = "TimeThrottleNode";

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

/**
 * Memoized scaffolded component to prevent focus loss.
 */
const TimeThrottleNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec when size keys OR input type changes (for adaptive handles)
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as TimeThrottleData),
    [
      (nodeData as TimeThrottleData).expandedSize,
      (nodeData as TimeThrottleData).collapsedSize,
      (nodeData as TimeThrottleData).inputType, // Adaptive handles dependency
    ],
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <TimeThrottleNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec],
  );

  return <ScaffoldedNode {...props} />;
};

export default TimeThrottleNodeWithDynamicSpec;