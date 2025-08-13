/**
 * TimeTimeout NODE – Professional timeout detection with inactivity monitoring
 *
 * • INACTIVITY DETECTION: Triggers after X time without input signals
 * • TIMEOUT MONITORING: Configurable timeout periods with reset capability
 * • INLINE CONTROLS: Configure timeout duration directly in the node
 * • PROFESSIONAL UI: Real-time countdown and activity status
 * • ADAPTIVE HANDLES: Preserves input signal type, outputs timeout events
 * • ACTIVITY TRACKING: Monitors and displays last activity time
 * • STARTUP-LEVEL QUALITY: Enterprise-grade timeout functionality
 *
 * Keywords: time-timeout, inactivity-detection, monitoring, professional-ui
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

export const TimeTimeoutDataSchema = z
  .object({
    // Timeout Configuration
    timeoutAmount: z.number().min(1).max(3600).default(30), // 1s-1hour
    timeoutUnit: z.enum(["s", "min"]).default("s"),
    
    // Timeout State
    lastActivityTime: z.number().nullable().default(null),
    timeoutTime: z.number().nullable().default(null),
    isTimedOut: z.boolean().default(false),
    isMonitoring: z.boolean().default(false),
    timeoutCount: z.number().default(0),
    
    // Signal State
    inputValue: z.any().nullable().default(null),
    inputType: z.string().default("any"),
    lastInputValue: z.any().nullable().default(null),
    
    // Auto-start Configuration
    autoStart: z.boolean().default(true),
    
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

export type TimeTimeoutData = z.infer<typeof TimeTimeoutDataSchema>;

const validateNodeData = createNodeValidator(
  TimeTimeoutDataSchema,
  "TimeTimeout",
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

  // Monitoring indicator with TIME theming
  monitoringIndicator: "absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse",
  timedOutIndicator: "absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full animate-pulse",
  
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
  statusMonitoring: "text-blue-600 dark:text-blue-400",
  statusTimedOut: "text-red-500 dark:text-red-400",
  statusActive: "text-emerald-600 dark:text-emerald-400",

  // Control buttons
  buttonPrimary:
    "px-2 py-1 text-[8px] font-medium text-white bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed rounded-md transition-all duration-200 shadow-sm hover:shadow-md",
  buttonSecondary:
    "px-2 py-1 text-[8px] font-medium text-cyan-600 dark:text-cyan-400 bg-white dark:bg-slate-700 border border-cyan-300 dark:border-cyan-600 hover:bg-cyan-50 dark:hover:bg-slate-600 rounded-md transition-all duration-200",

  // Professional collapsed view with TIME theming
  collapsedIcon: "text-lg mb-1 text-cyan-600 dark:text-cyan-400",
  collapsedTitle:
    "text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1",
  collapsedSubtitle: "text-[8px] text-slate-500 dark:text-slate-400",
  collapsedStatus: "mt-1 px-1 py-0.5 rounded-full text-[8px] font-medium",
  collapsedMonitoring:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  collapsedTimedOut:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
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

// Convert timeout amount to milliseconds
const convertToMs = (amount: number, unit: string): number => {
  switch (unit) {
    case "s": return amount * 1000;
    case "min": return amount * 60 * 1000;
    default: return amount * 1000;
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

// Format timeout for display
const formatTimeout = (amount: number, unit: string): string => {
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
function createDynamicSpec(data: TimeTimeoutData): NodeSpec {
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
    kind: "timeTimeout",
    displayName: "Time Timeout",
    label: "Time Timeout",
    category: CATEGORIES.TIME,
    size: { expanded, collapsed },
    handles: [
      // Input handle - accepts any type, monitors for activity
      {
        id: "input",
        code: "x", // Any type
        position: "left",
        type: "target",
        dataType: "Any",
      },
      // Passthrough output - same as input
      {
        id: "passthrough",
        code: handleConfig.code,
        position: "right",
        type: "source",
        dataType: handleConfig.dataType,
      },
      // Timeout event output
      {
        id: "timeout",
        code: "b",
        position: "bottom",
        type: "source",
        dataType: "Boolean",
      },
    ],
    inspector: { key: "TimeTimeoutInspector" },
    version: 1,
    runtime: { execute: "timeTimeout_execute_v1" },
    initialData: createSafeInitialData(TimeTimeoutDataSchema, {
      timeoutAmount: 30,
      timeoutUnit: "s",
      lastActivityTime: null,
      timeoutTime: null,
      isTimedOut: false,
      isMonitoring: false,
      timeoutCount: 0,
      autoStart: true,
    }),
    dataSchema: TimeTimeoutDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputValue",
        "inputType",
        "lastInputValue",
        "lastActivityTime",
        "timeoutTime",
        "isTimedOut",
        "isMonitoring",
        "timeoutCount",
        "expandedSize",
        "collapsedSize",
        "store",
        "inputs",
        "output",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable Timeout" },
        { 
          key: "timeoutAmount", 
          type: "number", 
          label: "Timeout Amount",
          ui: { step: 1 },
        },
        {
          key: "timeoutUnit",
          type: "select",
          label: "Time Unit",
        },
        { key: "autoStart", type: "boolean", label: "Auto Start" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuAlarmClock",
    author: "Agenitix Team",
    description: "Detects inactivity timeouts with configurable monitoring and adaptive handles",
    feature: "base",
    tags: ["time", "timeout", "inactivity", "monitoring", "adaptive"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This timeTimeout node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C2",
  timeoutAmount: 30,
  timeoutUnit: "s",
  inputType: "any",
} as TimeTimeoutData);
// -----------------------------------------------------------------------------
// 4️⃣  React component – timeout logic & rendering
// -----------------------------------------------------------------------------

const TimeTimeoutNode = memo(
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
      timeoutAmount,
      timeoutUnit,
      inputValue,
      inputType,
      lastInputValue,
      lastActivityTime,
      timeoutTime,
      isTimedOut,
      isMonitoring,
      timeoutCount,
      autoStart,
    } = nodeData as TimeTimeoutData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // Refs for timeout management
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastInputRef = useRef<any>(null);

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

    /** Clear timeout */
    const clearTimeoutTimer = useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }, []);

    /** Start monitoring for timeout */
    const startMonitoring = useCallback(() => {
      if (!isEnabled) return;

      const now = Date.now();
      const timeoutMs = convertToMs(timeoutAmount, timeoutUnit);
      
      clearTimeoutTimer();
      
      updateNodeData({
        isMonitoring: true,
        lastActivityTime: now,
        timeoutTime: now + timeoutMs,
        isTimedOut: false,
      });

      // Set timeout
      timeoutRef.current = setTimeout(() => {
        updateNodeData({
          isTimedOut: true,
          isMonitoring: false,
          timeoutCount: timeoutCount + 1,
          output: true, // Emit timeout event
          isActive: true,
        });
        timeoutRef.current = null;
      }, timeoutMs);

    }, [isEnabled, timeoutAmount, timeoutUnit, timeoutCount, clearTimeoutTimer, updateNodeData]);

    /** Stop monitoring */
    const stopMonitoring = useCallback(() => {
      clearTimeoutTimer();
      updateNodeData({
        isMonitoring: false,
        isTimedOut: false,
        timeoutTime: null,
        output: null,
        isActive: false,
      });
    }, [clearTimeoutTimer, updateNodeData]);

    /** Reset timeout monitoring */
    const resetTimeout = useCallback(() => {
      clearTimeoutTimer();
      updateNodeData({
        isMonitoring: false,
        isTimedOut: false,
        lastActivityTime: null,
        timeoutTime: null,
        timeoutCount: 0,
        output: null,
        isActive: false,
      });
    }, [clearTimeoutTimer, updateNodeData]);

    /** Record activity and reset timeout */
    const recordActivity = useCallback((value: any) => {
      if (!isEnabled) return;

      const detectedType = detectInputType(value);
      const now = Date.now();
      
      // Update input tracking
      updateNodeData({
        inputValue: value,
        lastInputValue: value,
        inputType: detectedType,
        lastActivityTime: now,
        isTimedOut: false,
      });

      // Restart monitoring if we were monitoring
      if (isMonitoring || autoStart) {
        startMonitoring();
      }

      // Pass through the input value
      updateNodeData({
        passthrough: value, // Output to passthrough handle
      });

    }, [isEnabled, isMonitoring, autoStart, startMonitoring, updateNodeData]);

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

    /* 🔄 Monitor input changes and record activity */
    useEffect(() => {
      if (!isEnabled) return;

      const currentInput = computeInput();
      
      // Only process if input actually changed
      if (currentInput !== lastInputRef.current) {
        lastInputRef.current = currentInput;
        
        if (currentInput !== null && currentInput !== undefined) {
          recordActivity(currentInput);
        } else {
          // No input - stop monitoring if not auto-start
          if (!autoStart) {
            stopMonitoring();
          }
        }
      }
    }, [computeInput, isEnabled, recordActivity, autoStart, stopMonitoring]);

    /* 🔄 Auto-start monitoring when enabled */
    useEffect(() => {
      if (isEnabled && autoStart && !isMonitoring && !isTimedOut) {
        startMonitoring();
      }
    }, [isEnabled, autoStart, isMonitoring, isTimedOut, startMonitoring]);

    /* 🔄 Stop monitoring when disabled */
    useEffect(() => {
      if (!isEnabled) {
        stopMonitoring();
      }
    }, [isEnabled, stopMonitoring]);

    /* 🔄 Cleanup timeout on unmount only */
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }, []); // Empty dependency array - only runs on mount/unmount

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("TimeTimeout", id, validation.errors, {
        originalData: validation.originalData,
        component: "TimeTimeoutNode",
      });
    }

    useNodeDataValidation(
      TimeTimeoutDataSchema,
      "TimeTimeout",
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
    const timeoutMs = convertToMs(timeoutAmount, timeoutUnit);
    const displayValue = inputValue !== null ? String(inputValue) : "";
    const typeDisplay = inputType.charAt(0).toUpperCase() + inputType.slice(1);
    const timeUntilTimeout = timeoutTime ? Math.max(0, timeoutTime - Date.now()) : 0;
    const timeSinceActivity = lastActivityTime ? Date.now() - lastActivityTime : 0;

    // -------------------------------------------------------------------------
    // 4.9  Professional Render - Startup Quality
    // -------------------------------------------------------------------------
    return (
      <>
        {/* Status indicators */}
        {isMonitoring && <div className={CONTENT.monitoringIndicator} />}
        {isTimedOut && <div className={CONTENT.timedOutIndicator} />}

        {/* Editable label or icon */}
        {!isExpanded &&
        spec.size.collapsed.width === 60 &&
        spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-0 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode nodeId={id} label={(nodeData as TimeTimeoutData).label || spec.displayName} />
        )}

        {!isExpanded ? (
          // ===== COLLAPSED VIEW - Professional & Compact =====
          <div className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className="flex flex-col items-center justify-center w-full h-full p-2">
              {/* Icon */}
              <div className={CONTENT.collapsedIcon}>
                {spec.icon && renderLucideIcon(spec.icon, "", 18)}
              </div>

              {/* Timeout Display */}
              <div className={CONTENT.collapsedTitle}>
                {formatTimeout(timeoutAmount, timeoutUnit)}
              </div>

              {/* Type Display */}
              <div className={CONTENT.collapsedSubtitle}>
                {typeDisplay}
              </div>

              {/* Status Badge */}
              <div
                className={`${CONTENT.collapsedStatus} ${
                  isTimedOut 
                    ? CONTENT.collapsedTimedOut 
                    : isMonitoring 
                      ? CONTENT.collapsedMonitoring 
                      : CONTENT.collapsedInactive
                }`}
              >
                {isTimedOut ? "Timed Out" : isMonitoring ? "Monitoring" : "Inactive"}
              </div>
            </div>
          </div>
        ) : (
          // ===== EXPANDED VIEW - Professional Interface =====
          <div className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className={CONTENT.body}>
              {/* Timeout Configuration Section */}
              <div className={CONTENT.configSection}>
                <div className={CONTENT.configHeader}>
                  {renderLucideIcon("LuAlarmClock", "text-cyan-500", 10)}
                  Timeout Configuration
                </div>
                <div className={CONTENT.configGrid}>
                  {/* Timeout Amount */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Timeout:</label>
                      <input
                        type="number"
                        className={CONTENT.input}
                        value={timeoutAmount}
                        min={1}
                        max={3600}
                        step={1}
                        onChange={(e) =>
                          updateNodeData({
                            timeoutAmount: Number.parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Timeout Unit */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Unit:</label>
                      <select
                        className={CONTENT.select}
                        value={timeoutUnit}
                        onChange={(e) =>
                          updateNodeData({
                            timeoutUnit: e.target.value as any,
                          })
                        }
                      >
                        <option value="s">Seconds</option>
                        <option value="min">Minutes</option>
                      </select>
                    </div>
                  </div>

                  {/* Total Timeout Display */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Total:</label>
                      <div className="text-[8px] font-mono text-cyan-600 dark:text-cyan-400">
                        {timeoutMs}ms
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-1">
                <button
                  className={CONTENT.buttonPrimary}
                  onClick={isMonitoring ? stopMonitoring : startMonitoring}
                  disabled={!isEnabled}
                >
                  {isMonitoring ? "Stop" : "Start"}
                </button>
                <button
                  className={CONTENT.buttonSecondary}
                  onClick={resetTimeout}
                  disabled={!isEnabled}
                >
                  Reset
                </button>
              </div>

              {/* Activity Status Section */}
              <div className={CONTENT.statusSection}>
                <div className={CONTENT.statusGrid}>
                  <div className={CONTENT.statusRow}>
                    <span className={CONTENT.statusLabel}>Status:</span>
                    <span
                      className={`${CONTENT.statusValue} ${
                        isTimedOut 
                          ? CONTENT.statusTimedOut 
                          : isMonitoring 
                            ? CONTENT.statusMonitoring 
                            : CONTENT.statusActive
                      }`}
                    >
                      {isTimedOut ? "Timed Out" : isMonitoring ? "Monitoring" : "Inactive"}
                    </span>
                  </div>
                  
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
                    <span className={CONTENT.statusLabel}>Timeouts:</span>
                    <span className={`${CONTENT.statusValue} ${CONTENT.statusTimedOut}`}>
                      {timeoutCount}
                    </span>
                  </div>

                  {isMonitoring && timeUntilTimeout > 0 && (
                    <div className={CONTENT.statusRow}>
                      <span className={CONTENT.statusLabel}>Timeout in:</span>
                      <span className={`${CONTENT.statusValue} font-mono ${CONTENT.statusMonitoring}`}>
                        {Math.ceil(timeUntilTimeout / 1000)}s
                      </span>
                    </div>
                  )}

                  {lastActivityTime && (
                    <div className={CONTENT.statusRow}>
                      <span className={CONTENT.statusLabel}>Last activity:</span>
                      <span className={`${CONTENT.statusValue} font-mono text-slate-600 dark:text-slate-400`}>
                        {Math.floor(timeSinceActivity / 1000)}s ago
                      </span>
                    </div>
                  )}
                </div>
              </div>
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

TimeTimeoutNode.displayName = "TimeTimeoutNode";

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

/**
 * Memoized scaffolded component to prevent focus loss.
 */
const TimeTimeoutNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec when size keys OR input type changes (for adaptive handles)
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as TimeTimeoutData),
    [
      (nodeData as TimeTimeoutData).expandedSize,
      (nodeData as TimeTimeoutData).collapsedSize,
      (nodeData as TimeTimeoutData).inputType, // Adaptive handles dependency
    ],
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <TimeTimeoutNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec],
  );

  return <ScaffoldedNode {...props} />;
};

export default TimeTimeoutNodeWithDynamicSpec;